/**
 * Semantic Embedding & Vector Index Service
 * Task 72: AI Retrieval Infrastructure
 * 
 * Handles vector embeddings generation, entity recognition, hybrid search,
 * auto-refresh mechanisms, and vector index management for optima    for (const entityData of entities) {
      // Upsert entity
      const entity = await (prisma as any).recognizedEntity.upsert({I retrieval.
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CACHE_TTL = 600; // 10 minutes
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions, cost-effective
const EMBEDDING_DIMENSION = 1536;
const BATCH_SIZE = 100;

// Types
interface EmbeddingResult {
  id: string;
  vector: number[];
  dimension: number;
  tokens: number;
}

interface EntityRecognitionResult {
  entities: RecognizedEntityData[];
  confidence: number;
}

interface RecognizedEntityData {
  type: string;
  name: string;
  normalizedName: string;
  confidence: number;
  category?: string;
  metadata?: any;
}

interface HybridSearchParams {
  query: string;
  contentTypes?: string[];
  limit?: number;
  keywordWeight?: number;
  vectorWeight?: number;
  filters?: any;
}

interface HybridSearchResult {
  id: string;
  contentId: string;
  contentType: string;
  score: number;
  keywordScore?: number;
  vectorScore?: number;
  metadata?: any;
}

/**
 * Generate embedding vector for text content
 */
export const generateEmbedding = async (
  text: string,
  model: string = EMBEDDING_MODEL
): Promise<EmbeddingResult> => {
  try {
    const response = await openai.embeddings.create({
      model,
      input: text,
    });

    const embedding = response.data[0];
    if (!embedding) {
      throw new Error('No embedding data returned from OpenAI');
    }
    
    return {
      id: `emb_${Date.now()}`,
      vector: embedding.embedding,
      dimension: embedding.embedding.length,
      tokens: response.usage.total_tokens,
    };
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};

/**
 * Create or update embedding for content
 */
export const createContentEmbedding = async (
  contentId: string,
  contentType: string,
  text: string,
  metadata?: any
): Promise<any> => {
  try {
    // Generate embedding
    const embeddingResult = await generateEmbedding(text);
    
    // Calculate quality score based on text characteristics
    const qualityScore = calculateEmbeddingQuality(text, metadata);

    // Store in database
    const embedding = await prisma.vectorEmbedding.upsert({
      where: {
        contentId_contentType_embeddingModel: {
          contentId,
          contentType,
          embeddingModel: EMBEDDING_MODEL,
        },
      },
      create: {
        contentId,
        contentType,
        embeddingModel: EMBEDDING_MODEL,
        embeddingVector: JSON.stringify(embeddingResult.vector),
        dimension: embeddingResult.dimension,
        tokens: embeddingResult.tokens,
        metadata: metadata ? JSON.stringify(metadata) : null,
        qualityScore,
        isActive: true,
      },
      update: {
        embeddingVector: JSON.stringify(embeddingResult.vector),
        tokens: embeddingResult.tokens,
        metadata: metadata ? JSON.stringify(metadata) : null,
        qualityScore,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Update index statistics
    await updateIndexStatistics();

    // Invalidate cache
    await redis.del(`embedding:${contentId}:${contentType}`);

    return embedding;
  } catch (error: any) {
    console.error('Error creating content embedding:', error);
    throw error;
  }
};

/**
 * Calculate embedding quality score based on text characteristics
 */
const calculateEmbeddingQuality = (text: string, metadata?: any): number => {
  let score = 50; // Base score

  // Text length scoring (optimal: 100-500 words)
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 100 && wordCount <= 500) {
    score += 20;
  } else if (wordCount > 500 && wordCount <= 1000) {
    score += 10;
  } else if (wordCount < 50) {
    score -= 10;
  }

  // Metadata richness
  if (metadata) {
    if (metadata.keywords && metadata.keywords.length > 0) score += 10;
    if (metadata.entities && metadata.entities.length > 0) score += 10;
    if (metadata.category) score += 5;
    if (metadata.excerpt) score += 5;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * Recognize entities in text (coins, protocols, projects)
 */
export const recognizeEntities = async (text: string): Promise<EntityRecognitionResult> => {
  try {
    // Use OpenAI for entity recognition
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert cryptocurrency and blockchain entity recognizer. Extract all mentions of:
- Cryptocurrencies/tokens (Bitcoin, Ethereum, etc.)
- Protocols (Uniswap, Aave, etc.)
- Projects/platforms (Coinbase, Binance, etc.)
- Exchanges
- People (founders, developers)
- Organizations

Return a JSON array of entities with: type, name, category, confidence (0-1).`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      return {
        entities: [],
        confidence: 0
      };
    }

    const result = JSON.parse(messageContent);
    const entities: RecognizedEntityData[] = [];

    for (const entity of result.entities || []) {
      const normalized = entity.name.toLowerCase().trim();
      
      entities.push({
        type: entity.type || 'unknown',
        name: entity.name,
        normalizedName: normalized,
        confidence: entity.confidence || 0.8,
        category: entity.category,
        metadata: entity.metadata || {},
      });
    }

    return {
      entities,
      confidence: entities.length > 0 ? 
        entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length : 0,
    };
  } catch (error: any) {
    console.error('Error recognizing entities:', error);
    return { entities: [], confidence: 0 };
  }
};

/**
 * Store recognized entities and their mentions
 */
export const storeRecognizedEntities = async (
  contentId: string,
  contentType: string,
  entities: RecognizedEntityData[]
): Promise<void> => {
  try {
    for (const entityData of entities) {
      // Upsert entity
      const entity = await prisma.recognizedEntity.upsert({
        where: {
          normalizedName_entityType: {
            normalizedName: entityData.normalizedName,
            entityType: entityData.type,
          },
        },
        create: {
          entityType: entityData.type,
          name: entityData.name,
          normalizedName: entityData.normalizedName,
          category: entityData.category || null,
          metadata: entityData.metadata ? JSON.stringify(entityData.metadata) : null,
          confidence: entityData.confidence,
          mentionCount: 1,
          lastMentionedAt: new Date(),
          isActive: true,
        },
        update: {
          mentionCount: { increment: 1 },
          lastMentionedAt: new Date(),
          confidence: entityData.confidence, // Update with latest confidence
        },
      });

      // Create mention record
      await prisma.entityMention.create({
        data: {
          entityId: entity.id,
          contentId,
          contentType,
          position: 0, // Could be enhanced with actual position
          relevanceScore: entityData.confidence,
        },
      });
    }
  } catch (error: any) {
    console.error('Error storing entities:', error);
    throw error;
  }
};

/**
 * Process article for embeddings and entity recognition
 */
export const processArticleForEmbedding = async (articleId: string): Promise<any> => {
  try {
    const startTime = Date.now();

    // Fetch article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        User: true,
        Category: true,
      },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Prepare text for embedding
    const embeddingText = `${article.title}\n\n${article.excerpt}\n\n${article.content}`;
    
    // Extract keywords from tags
    const keywords = article.tags ? article.tags.split(',').map(t => t.trim()) : [];

    // Recognize entities
    const entityResult = await recognizeEntities(embeddingText);
    
    // Store entities
    await storeRecognizedEntities(articleId, 'article', entityResult.entities);

    // Create metadata
    const metadata = {
      title: article.title,
      excerpt: article.excerpt,
      keywords,
      entities: entityResult.entities.map(e => e.name),
      category: article.Category.name,
      author: article.User.username || article.User.email,
      publishedAt: article.publishedAt,
    };

    // Create embedding
    const embedding = await createContentEmbedding(
      articleId,
      'article',
      embeddingText,
      metadata
    );

    // Queue chunk embeddings if structured content exists
    const structuredContent = await prisma.structuredContent.findUnique({
      where: { articleId },
    });

    if (structuredContent) {
      await queueChunkEmbeddings(articleId);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      articleId,
      embeddingId: embedding.id,
      entitiesFound: entityResult.entities.length,
      processingTimeMs: processingTime,
      qualityScore: embedding.qualityScore,
    };
  } catch (error: any) {
    console.error('Error processing article for embedding:', error);
    throw error;
  }
};

/**
 * Queue chunk embeddings for processing
 */
const queueChunkEmbeddings = async (articleId: string): Promise<void> => {
  try {
    const chunks = await prisma.contentChunk.findMany({
      where: { articleId },
    });

    for (const chunk of chunks) {
      await prisma.embeddingUpdateQueue.create({
        data: {
          contentId: chunk.id,
          contentType: 'chunk',
          updateType: 'create',
          priority: 'normal',
        },
      });
    }
  } catch (error: any) {
    console.error('Error queuing chunk embeddings:', error);
  }
};

/**
 * Process embedding update queue
 */
export const processEmbeddingQueue = async (limit: number = 10): Promise<any> => {
  try {
    const queueItems = await prisma.embeddingUpdateQueue.findMany({
      where: {
        status: 'pending',
        retryCount: { lt: 3 },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    const results = [];

    for (const item of queueItems) {
      try {
        // Mark as processing
        await prisma.embeddingUpdateQueue.update({
          where: { id: item.id },
          data: { 
            status: 'processing',
            processingStarted: new Date(),
          },
        });

        let result;

        if (item.contentType === 'article') {
          result = await processArticleForEmbedding(item.contentId);
        } else if (item.contentType === 'chunk') {
          result = await processChunkEmbedding(item.contentId);
        } else if (item.contentType === 'canonical_answer') {
          result = await processCanonicalAnswerEmbedding(item.contentId);
        }

        // Mark as completed
        await (prisma as any).embeddingUpdateQueue.update({
          where: { id: item.id },
          data: { 
            status: 'completed',
            processingEnded: new Date(),
          },
        });

        results.push({ queueItemId: item.id, success: true, result });
      } catch (error: any) {
        // Mark as failed and increment retry
        await prisma.embeddingUpdateQueue.update({
          where: { id: item.id },
          data: { 
            status: 'failed',
            retryCount: { increment: 1 },
            errorMessage: error.message,
            processingEnded: new Date(),
          },
        });

        results.push({ queueItemId: item.id, success: false, error: error.message });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error: any) {
    console.error('Error processing embedding queue:', error);
    throw error;
  }
};

/**
 * Process chunk embedding
 */
const processChunkEmbedding = async (chunkId: string): Promise<any> => {
  const chunk = await prisma.contentChunk.findUnique({
    where: { id: chunkId },
  });

  if (!chunk) throw new Error('Chunk not found');

  const metadata = {
    chunkType: chunk.chunkType,
    chunkIndex: chunk.chunkIndex,
    wordCount: chunk.wordCount,
    keywords: chunk.keywords ? JSON.parse(chunk.keywords) : [],
  };

  return await createContentEmbedding(chunkId, 'chunk', chunk.content, metadata);
};

/**
 * Process canonical answer embedding
 */
const processCanonicalAnswerEmbedding = async (answerId: string): Promise<any> => {
  const answer = await prisma.canonicalAnswer.findUnique({
    where: { id: answerId },
  });

  if (!answer) throw new Error('Canonical answer not found');

  const text = `${answer.question}\n\n${answer.answer}`;
  const metadata = {
    question: answer.question,
    answerType: answer.answerType,
    confidence: answer.confidence,
    keywords: answer.keywords ? JSON.parse(answer.keywords) : [],
  };

  return await createContentEmbedding(answerId, 'canonical_answer', text, metadata);
};

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
};

/**
 * Vector similarity search
 */
export const vectorSearch = async (
  queryVector: number[],
  contentTypes: string[] = ['article', 'chunk'],
  limit: number = 10
): Promise<HybridSearchResult[]> => {
  try {
    // Fetch all active embeddings of specified types
    const embeddings = await prisma.vectorEmbedding.findMany({
      where: {
        contentType: { in: contentTypes },
        isActive: true,
      },
    });

    // Calculate similarities
    const results = embeddings.map(emb => {
      const vector = JSON.parse(emb.embeddingVector);
      const similarity = cosineSimilarity(queryVector, vector);
      
      return {
        id: emb.id,
        contentId: emb.contentId,
        contentType: emb.contentType,
        score: similarity,
        vectorScore: similarity,
        metadata: emb.metadata ? JSON.parse(emb.metadata) : null,
      };
    });

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error: any) {
    console.error('Error in vector search:', error);
    throw error;
  }
};

/**
 * Keyword search (BM25-style)
 */
const keywordSearch = async (
  query: string,
  contentTypes: string[] = ['article'],
  limit: number = 10
): Promise<HybridSearchResult[]> => {
  try {
    const keywords = query.toLowerCase().split(/\s+/);
    
    // Simple keyword matching on articles (SQLite compatible)
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { excerpt: { contains: query } },
        ],
        status: 'PUBLISHED',
      },
      take: limit * 2,
    });

    return articles.map((article, index) => ({
      id: article.id,
      contentId: article.id,
      contentType: 'article',
      score: 1 - (index * 0.05), // Simple ranking
      keywordScore: 1 - (index * 0.05),
      metadata: {
        title: article.title,
        excerpt: article.excerpt,
      },
    })).slice(0, limit);
  } catch (error: any) {
    console.error('Error in keyword search:', error);
    return [];
  }
};

/**
 * Hybrid search combining keyword and vector search
 */
export const hybridSearch = async (params: HybridSearchParams): Promise<any> => {
  try {
    const startTime = Date.now();
    const {
      query,
      contentTypes = ['article', 'chunk'],
      limit = 10,
      keywordWeight = 0.5,
      vectorWeight = 0.5,
    } = params;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Perform parallel searches
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(queryEmbedding.vector, contentTypes, limit * 2),
      keywordSearch(query, contentTypes, limit * 2),
    ]);

    // Combine results using Reciprocal Rank Fusion (RRF)
    const combinedScores = new Map<string, any>();

    // Process vector results
    vectorResults.forEach((result, index) => {
      const rrf = 1 / (60 + index + 1); // RRF with k=60
      combinedScores.set(result.contentId, {
        ...result,
        vectorRank: index + 1,
        vectorRRF: rrf,
        vectorScore: result.score,
      });
    });

    // Process keyword results
    keywordResults.forEach((result, index) => {
      const rrf = 1 / (60 + index + 1);
      const existing = combinedScores.get(result.contentId);
      
      if (existing) {
        existing.keywordRank = index + 1;
        existing.keywordRRF = rrf;
        existing.keywordScore = result.score;
        existing.hybridScore = (existing.vectorRRF * vectorWeight) + (rrf * keywordWeight);
      } else {
        combinedScores.set(result.contentId, {
          ...result,
          keywordRank: index + 1,
          keywordRRF: rrf,
          keywordScore: result.score,
          vectorRRF: 0,
          hybridScore: rrf * keywordWeight,
        });
      }
    });

    // Sort by hybrid score
    const hybridResults = Array.from(combinedScores.values())
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);

    const queryTime = Date.now() - startTime;

    // Log search
    await prisma.hybridSearchLog.create({
      data: {
        query,
        queryEmbedding: JSON.stringify(queryEmbedding.vector),
        searchType: 'hybrid',
        keywordResults: JSON.stringify(keywordResults.slice(0, 5)),
        vectorResults: JSON.stringify(vectorResults.slice(0, 5)),
        hybridResults: JSON.stringify(hybridResults),
        fusionAlgorithm: 'rrf',
        keywordWeight,
        vectorWeight,
        totalResults: hybridResults.length,
        queryTimeMs: queryTime,
      },
    });

    return {
      query,
      results: hybridResults,
      total: hybridResults.length,
      queryTimeMs: queryTime,
      searchType: 'hybrid',
      weights: { keyword: keywordWeight, vector: vectorWeight },
    };
  } catch (error: any) {
    console.error('Error in hybrid search:', error);
    throw error;
  }
};

/**
 * Get embedding statistics
 */
export const getEmbeddingStats = async (): Promise<any> => {
  try {
    const cacheKey = 'embedding:stats';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [
      totalEmbeddings,
      activeEmbeddings,
      articleEmbeddings,
      chunkEmbeddings,
      totalEntities,
      verifiedEntities,
      queuePending,
      queueFailed,
      avgQualityScore,
    ] = await Promise.all([
      prisma.vectorEmbedding.count(),
      prisma.vectorEmbedding.count({ where: { isActive: true } }),
      prisma.vectorEmbedding.count({ where: { contentType: 'article' } }),
      prisma.vectorEmbedding.count({ where: { contentType: 'chunk' } }),
      prisma.recognizedEntity.count(),
      prisma.recognizedEntity.count({ where: { isVerified: true } }),
      prisma.embeddingUpdateQueue.count({ where: { status: 'pending' } }),
      prisma.embeddingUpdateQueue.count({ where: { status: 'failed' } }),
      prisma.vectorEmbedding.aggregate({
        _avg: { qualityScore: true },
        where: { isActive: true },
      }),
    ]);

    const stats = {
      embeddings: {
        total: totalEmbeddings,
        active: activeEmbeddings,
        byType: {
          article: articleEmbeddings,
          chunk: chunkEmbeddings,
          other: totalEmbeddings - articleEmbeddings - chunkEmbeddings,
        },
        avgQualityScore: Math.round(avgQualityScore._avg.qualityScore || 0),
      },
      entities: {
        total: totalEntities,
        verified: verifiedEntities,
        verificationRate: totalEntities > 0 ? 
          Math.round((verifiedEntities / totalEntities) * 100) : 0,
      },
      queue: {
        pending: queuePending,
        failed: queueFailed,
        healthStatus: queueFailed < 10 ? 'healthy' : 'needs_attention',
      },
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));
    return stats;
  } catch (error: any) {
    console.error('Error getting embedding stats:', error);
    throw error;
  }
};

/**
 * Get entity by ID
 */
export const getEntity = async (entityId: string): Promise<any> => {
  const entity = await prisma.recognizedEntity.findUnique({
    where: { id: entityId },
    include: {
      EntityMention: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return entity;
};

/**
 * Search entities
 */
export const searchEntities = async (
  query: string,
  entityType?: string,
  limit: number = 20
): Promise<any> => {
  const where: any = {
    isActive: true,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { normalizedName: { contains: query.toLowerCase() } },
    ];
  }

  if (entityType) {
    where.entityType = entityType;
  }

  const entities = await prisma.recognizedEntity.findMany({
    where,
    orderBy: { mentionCount: 'desc' },
    take: limit,
    include: {
      _count: {
        select: { EntityMention: true },
      },
    },
  });

  return entities;
};

/**
 * Update index statistics
 */
const updateIndexStatistics = async (): Promise<void> => {
  try {
    const totalVectors = await prisma.vectorEmbedding.count({ where: { isActive: true } });
    
    await prisma.vectorSearchIndex.upsert({
      where: { indexName: 'articles_primary' },
      create: {
        indexName: 'articles_primary',
        indexType: 'hnsw',
        dimension: EMBEDDING_DIMENSION,
        contentTypes: JSON.stringify(['article', 'chunk', 'canonical_answer']),
        totalVectors,
        status: 'active',
      },
      update: {
        totalVectors,
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error updating index statistics:', error);
  }
};

/**
 * Rebuild index (for maintenance)
 */
export const rebuildIndex = async (): Promise<any> => {
  try {
    const startTime = Date.now();

    // Update index status
    await prisma.vectorSearchIndex.update({
      where: { indexName: 'articles_primary' },
      data: { status: 'building' },
    });

    // Get all articles without embeddings
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        id: {
          notIn: await prisma.vectorEmbedding
            .findMany({
              where: { contentType: 'article', isActive: true },
              select: { contentId: true },
            })
            .then(results => results.map(r => r.contentId)),
        },
      },
      take: 100,
    });

    // Queue articles for embedding
    for (const article of articles) {
      await prisma.embeddingUpdateQueue.create({
        data: {
          contentId: article.id,
          contentType: 'article',
          updateType: 'create',
          priority: 'normal',
        },
      });
    }

    // Update statistics
    await updateIndexStatistics();

    const buildTime = Date.now() - startTime;

    // Update index status
    await prisma.vectorSearchIndex.update({
      where: { indexName: 'articles_primary' },
      data: {
        status: 'active',
        lastBuildAt: new Date(),
        buildDurationMs: buildTime,
      },
    });

    return {
      success: true,
      articlesQueued: articles.length,
      buildTimeMs: buildTime,
    };
  } catch (error: any) {
    console.error('Error rebuilding index:', error);
    
    await prisma.vectorSearchIndex.update({
      where: { indexName: 'articles_primary' },
      data: { status: 'error' },
    });

    throw error;
  }
};

/**
 * Get search analytics
 */
export const getSearchAnalytics = async (days: number = 7): Promise<any> => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalSearches,
      avgQueryTime,
      searchesByType,
      topQueries,
    ] = await Promise.all([
      prisma.hybridSearchLog.count({
        where: { createdAt: { gte: since } },
      }),
      prisma.hybridSearchLog.aggregate({
        _avg: { queryTimeMs: true },
        where: { createdAt: { gte: since } },
      }),
      prisma.hybridSearchLog.groupBy({
        by: ['searchType'],
        _count: true,
        where: { createdAt: { gte: since } },
      }),
      prisma.hybridSearchLog.groupBy({
        by: ['query'],
        _count: true,
        where: { createdAt: { gte: since } },
        orderBy: { _count: { query: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalSearches,
      avgQueryTimeMs: Math.round(avgQueryTime._avg.queryTimeMs || 0),
      searchesByType: searchesByType.map(s => ({
        type: s.searchType,
        count: s._count,
      })),
      topQueries: topQueries.map(q => ({
        query: q.query,
        count: q._count,
      })),
    };
  } catch (error: any) {
    console.error('Error getting search analytics:', error);
    throw error;
  }
};
