import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { XMLBuilder } from 'fast-xml-parser';

const prisma = new PrismaClient();

// Type-safe interfaces for Knowledge API operations
interface KnowledgeBaseWithArticle {
  id: string;
  articleId: string;
  summary: string;
  structuredData: string;
  keyPoints: string;
  entities: string;
  facts: string;
  sources: string;
  qualityScore: number;
  llmReadability: number;
  citationCount: number;
  lastUpdatedBy: string | null;
  Article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    publishedAt: Date | null;
  };
}

interface KnowledgeBaseData {
  articleId: string;
  summary: string;
  keyPoints: string[];
  entities: Record<string, any>[];
  facts: string[];
  sources: string[];
}

interface RAGFeedConfig {
  name: string;
  description: string;
  feedType: 'rss' | 'json' | 'xml';
  category?: string;
  region?: string;
  language?: string;
  updateFrequency?: string;
}

interface APIKeyConfig {
  userId?: string;
  name: string;
  description?: string;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  rateLimit?: number;
  allowedEndpoints?: string[];
  expiresAt?: Date;
}

interface CitationData {
  knowledgeBaseId: string;
  sourceType: string;
  sourceName: string;
  citedContent: string;
  citationContext?: string;
  userQuery?: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  metadata?: Record<string, any>;
}

export class KnowledgeAPIService {
  /**
   * Process article into knowledge base format
   */
  async processArticleToKnowledgeBase(data: KnowledgeBaseData): Promise<any> {
    try {
      // Check if knowledge base entry exists
      const existing = await prisma.knowledgeBase.findUnique({
        where: { articleId: data.articleId },
      });

      // Calculate quality metrics
      const qualityScore = this.calculateQualityScore(data);
      const llmReadability = this.calculateLLMReadability(data);

      const knowledgeData = {
        articleId: data.articleId,
        structuredData: JSON.stringify({
          summary: data.summary,
          keyPoints: data.keyPoints,
          entities: data.entities,
          facts: data.facts,
          sources: data.sources,
        }),
        summary: data.summary,
        keyPoints: JSON.stringify(data.keyPoints),
        entities: JSON.stringify(data.entities),
        facts: JSON.stringify(data.facts),
        sources: JSON.stringify(data.sources),
        lastProcessed: new Date(),
        qualityScore,
        llmReadability,
      };

      if (existing) {
        return await prisma.knowledgeBase.update({
          where: { id: existing.id },
          data: knowledgeData,
        });
      }

      return await prisma.knowledgeBase.create({
        data: knowledgeData,
      });
    } catch (error) {
      console.error('Error processing article to knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base entry by article ID
   */
  async getKnowledgeBase(articleId: string): Promise<any> {
    try {
      const kb = await prisma.knowledgeBase.findUnique({
        where: { articleId },
        include: {
          Article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              publishedAt: true,
              authorId: true,
              categoryId: true,
            },
          },
        },
      });

      if (!kb) {
        return null;
      }

      // Increment access count
      await prisma.knowledgeBase.update({
        where: { id: kb.id },
        data: { accessCount: { increment: 1 } },
      });

      return {
        ...kb,
        structuredData: JSON.parse(kb.structuredData),
        keyPoints: JSON.parse(kb.keyPoints),
        entities: JSON.parse(kb.entities),
        facts: JSON.parse(kb.facts),
        sources: JSON.parse(kb.sources),
      };
    } catch (error) {
      console.error('Error getting knowledge base:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query: string, limit: number = 10): Promise<any[]> {
    try {
      const results = await prisma.knowledgeBase.findMany({
        where: {
          OR: [
            { summary: { contains: query } },
            { structuredData: { contains: query } },
          ],
        },
        include: {
          Article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              publishedAt: true,
            },
          },
        },
        orderBy: [
          { qualityScore: 'desc' },
          { citationCount: 'desc' },
        ],
        take: limit,
      });

      return results.map((kb: any) => ({
        ...kb,
        structuredData: JSON.parse(kb.structuredData),
        keyPoints: JSON.parse(kb.keyPoints),
        entities: JSON.parse(kb.entities),
        facts: JSON.parse(kb.facts),
        sources: JSON.parse(kb.sources),
      }));
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get latest crypto data for developers
   */
  async getLatestCryptoData(limit: number = 50): Promise<any[]> {
    try {
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { not: null },
        },
        include: {
          Category: true,
          User: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          KnowledgeBase: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      });

      return articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        publishedAt: article.publishedAt,
        category: article.Category.name,
        author: article.User.username,
        knowledgeBase: article.KnowledgeBase
          ? {
              summary: article.KnowledgeBase.summary,
              keyPoints: JSON.parse(article.KnowledgeBase.keyPoints),
              entities: JSON.parse(article.KnowledgeBase.entities),
              facts: JSON.parse(article.KnowledgeBase.facts),
              sources: JSON.parse(article.KnowledgeBase.sources),
            }
          : null,
      }));
    } catch (error) {
      console.error('Error getting latest crypto data:', error);
      throw error;
    }
  }

  /**
   * Generate RAG-friendly RSS feed
   */
  async generateRSSFeed(feedId: string): Promise<string> {
    try {
      const feed = await prisma.rAGFeed.findUnique({
        where: { id: feedId },
      });

      if (!feed) {
        throw new Error('Feed not found');
      }

      // Build query based on feed configuration
      const where: any = {
        status: 'PUBLISHED',
        publishedAt: { not: null },
      };

      if (feed.category) {
        where.Category = { slug: feed.category };
      }

      const articles = await prisma.article.findMany({
        where,
        include: {
          Category: true,
          User: {
            select: {
              id: true,
              username: true,
            },
          },
          KnowledgeBase: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      });

      // Update feed stats
      await prisma.rAGFeed.update({
        where: { id: feedId },
        data: {
          lastGenerated: new Date(),
          accessCount: { increment: 1 },
        },
      });

      // Build RSS XML
      const rssData = {
        rss: {
          '@_version': '2.0',
          '@_xmlns:atom': 'http://www.w3.org/2005/Atom',
          '@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
          '@_xmlns:ai': 'https://coindaily.ai/ai-namespace',
          channel: {
            title: feed.name,
            description: feed.description,
            link: `https://coindaily.ai/api/feeds/${feed.endpoint}`,
            language: feed.language,
            lastBuildDate: new Date().toUTCString(),
            item: articles.map((article: any) => ({
              title: article.title,
              link: `https://coindaily.ai/articles/${article.slug}`,
              description: article.excerpt,
              pubDate: article.publishedAt?.toUTCString(),
              author: article.User.username,
              category: article.Category.name,
              guid: {
                '@_isPermaLink': 'true',
                '#text': `https://coindaily.ai/articles/${article.slug}`,
              },
              'content:encoded': article.content,
              'ai:summary': article.KnowledgeBase?.summary || '',
              'ai:keyPoints': article.KnowledgeBase
                ? JSON.parse(article.KnowledgeBase.keyPoints)
                : [],
              'ai:entities': article.KnowledgeBase
                ? JSON.parse(article.KnowledgeBase.entities)
                : [],
              'ai:facts': article.KnowledgeBase
                ? JSON.parse(article.KnowledgeBase.facts)
                : [],
              'ai:qualityScore': article.KnowledgeBase?.qualityScore || 0,
            })),
          },
        },
      };

      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
      });

      return builder.build(rssData);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      throw error;
    }
  }

  /**
   * Generate RAG-friendly JSON feed
   */
  async generateJSONFeed(feedId: string): Promise<any> {
    try {
      const feed = await prisma.rAGFeed.findUnique({
        where: { id: feedId },
      });

      if (!feed) {
        throw new Error('Feed not found');
      }

      const where: any = {
        status: 'PUBLISHED',
        publishedAt: { not: null },
      };

      if (feed.category) {
        where.Category = { slug: feed.category };
      }

      const articles = await prisma.article.findMany({
        where,
        include: {
          Category: true,
          User: {
            select: {
              id: true,
              username: true,
            },
          },
          KnowledgeBase: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      });

      // Update feed stats
      await prisma.rAGFeed.update({
        where: { id: feedId },
        data: {
          lastGenerated: new Date(),
          accessCount: { increment: 1 },
        },
      });

      return {
        version: 'https://jsonfeed.org/version/1.1',
        title: feed.name,
        description: feed.description,
        home_page_url: 'https://coindaily.ai',
        feed_url: `https://coindaily.ai/api/feeds/${feed.endpoint}`,
        language: feed.language,
        items: articles.map((article: any) => ({
          id: article.id,
          url: `https://coindaily.ai/articles/${article.slug}`,
          title: article.title,
          summary: article.excerpt,
          content_html: article.content,
          date_published: article.publishedAt?.toISOString(),
          author: {
            name: article.User.username,
          },
          tags: article.tags ? JSON.parse(article.tags) : [],
          _ai: article.KnowledgeBase
            ? {
                summary: article.KnowledgeBase.summary,
                keyPoints: JSON.parse(article.KnowledgeBase.keyPoints),
                entities: JSON.parse(article.KnowledgeBase.entities),
                facts: JSON.parse(article.KnowledgeBase.facts),
                sources: JSON.parse(article.KnowledgeBase.sources),
                qualityScore: article.KnowledgeBase.qualityScore,
                llmReadability: article.KnowledgeBase.llmReadability,
              }
            : null,
        })),
      };
    } catch (error) {
      console.error('Error generating JSON feed:', error);
      throw error;
    }
  }

  /**
   * Generate AI manifest file
   */
  async generateAIManifest(): Promise<any> {
    try {
      let manifest = await prisma.aIManifest.findFirst({
        where: { isActive: true },
      });

      if (!manifest) {
        // Create default manifest
        manifest = await prisma.aIManifest.create({
          data: {
            version: '1.0',
            name: 'CoinDaily Knowledge API',
            description:
              'AI-optimized API for cryptocurrency and blockchain news, analysis, and data',
            apiEndpoints: JSON.stringify([
              {
                path: '/api/knowledge/search',
                method: 'GET',
                description: 'Search knowledge base',
                parameters: ['query', 'limit'],
              },
              {
                path: '/api/knowledge/:articleId',
                method: 'GET',
                description: 'Get structured knowledge for article',
              },
              {
                path: '/api/crypto-data/latest',
                method: 'GET',
                description: 'Get latest crypto news and data',
                parameters: ['limit'],
              },
              {
                path: '/api/feeds/rss/:feedId',
                method: 'GET',
                description: 'RAG-friendly RSS feed',
              },
              {
                path: '/api/feeds/json/:feedId',
                method: 'GET',
                description: 'RAG-friendly JSON feed',
              },
            ]),
            capabilities: JSON.stringify([
              'Structured crypto news summaries',
              'Entity extraction (coins, protocols, exchanges)',
              'Fact verification and citations',
              'Multi-language support (15 African languages)',
              'Real-time market data integration',
              'LLM-optimized content structure',
            ]),
            dataTypes: JSON.stringify([
              'articles',
              'market_data',
              'crypto_analysis',
              'blockchain_news',
              'defi_updates',
              'memecoin_trends',
            ]),
            rateLimit: JSON.stringify({
              free: '100 requests/hour',
              basic: '1000 requests/hour',
              pro: '10000 requests/hour',
              enterprise: 'unlimited',
            }),
            authMethods: JSON.stringify(['api_key', 'oauth2']),
            examples: JSON.stringify([
              {
                endpoint: '/api/knowledge/search',
                request: 'GET /api/knowledge/search?query=bitcoin&limit=5',
                description: 'Search for Bitcoin-related content',
              },
              {
                endpoint: '/api/crypto-data/latest',
                request: 'GET /api/crypto-data/latest?limit=20',
                description: 'Get 20 latest crypto articles',
              },
            ]),
          },
        });
      }

      return {
        version: manifest.version,
        name: manifest.name,
        description: manifest.description,
        api_endpoints: JSON.parse(manifest.apiEndpoints),
        capabilities: JSON.parse(manifest.capabilities),
        data_types: JSON.parse(manifest.dataTypes),
        rate_limit: JSON.parse(manifest.rateLimit),
        authentication_methods: JSON.parse(manifest.authMethods),
        examples: JSON.parse(manifest.examples),
        last_updated: manifest.lastUpdated.toISOString(),
      };
    } catch (error) {
      console.error('Error generating AI manifest:', error);
      throw error;
    }
  }

  /**
   * Create API key
   */
  async createAPIKey(config: APIKeyConfig): Promise<{ key: string; apiKey: any }> {
    try {
      // Generate API key
      const key = `cd_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      const data: any = {
        keyHash,
        name: config.name,
        tier: config.tier || 'free',
        rateLimit: config.rateLimit || 100,
        allowedEndpoints: JSON.stringify(config.allowedEndpoints || ['*']),
      };

      if (config.userId) data.userId = config.userId;
      if (config.description) data.description = config.description;
      if (config.expiresAt) data.expiresAt = config.expiresAt;

      const apiKey = await prisma.aPIKey.create({ data });

      return { key, apiKey };
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey(key: string): Promise<any> {
    try {
      const keyHash = crypto.createHash('sha256').update(key).digest('hex');

      const apiKey = await prisma.aPIKey.findUnique({
        where: { keyHash },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      });

      if (!apiKey) {
        return null;
      }

      // Check if expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }

      // Check if active
      if (!apiKey.isActive) {
        return null;
      }

      // Update last used
      await prisma.aPIKey.update({
        where: { id: apiKey.id },
        data: {
          lastUsedAt: new Date(),
          totalRequests: { increment: 1 },
        },
      });

      return apiKey;
    } catch (error) {
      console.error('Error validating API key:', error);
      throw error;
    }
  }

  /**
   * Log API usage
   */
  async logAPIUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.aPIUsage.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          statusCode,
          responseTimeMs,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          referer: metadata?.referer,
          errorMessage: metadata?.errorMessage,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      console.error('Error logging API usage:', error);
      // Don't throw - logging failures shouldn't break API
    }
  }

  /**
   * Track citation
   */
  async trackCitation(data: CitationData): Promise<void> {
    try {
      await prisma.citationLog.create({
        data: {
          knowledgeBaseId: data.knowledgeBaseId,
          apiKeyId: data.metadata?.apiKeyId,
          sourceType: data.sourceType,
          sourceName: data.sourceName,
          citedContent: data.citedContent,
          citationContext: data.citationContext ?? null,
          userQuery: data.userQuery ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          referer: data.referer ?? null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      // Increment citation count
      await prisma.knowledgeBase.update({
        where: { id: data.knowledgeBaseId },
        data: { citationCount: { increment: 1 } },
      });
    } catch (error) {
      console.error('Error tracking citation:', error);
      // Don't throw - citation tracking failures shouldn't break API
    }
  }

  /**
   * Get API statistics
   */
  async getAPIStatistics(): Promise<any> {
    try {
      const [
        totalKeys,
        activeKeys,
        totalUsage,
        totalCitations,
        knowledgeBaseCount,
        feedCount,
      ] = await Promise.all([
        prisma.aPIKey.count(),
        prisma.aPIKey.count({ where: { isActive: true } }),
        prisma.aPIUsage.count(),
        prisma.citationLog.count(),
        prisma.knowledgeBase.count(),
        prisma.rAGFeed.count({ where: { isActive: true } }),
      ]);

      // Get usage by tier
      const usageByTier = await prisma.aPIKey.groupBy({
        by: ['tier'],
        _count: true,
        where: { isActive: true },
      });

      // Get top cited content
      const topCited = await prisma.knowledgeBase.findMany({
        take: 10,
        orderBy: { citationCount: 'desc' },
        include: {
          Article: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      });

      // Get recent citations
      const recentCitations = await prisma.citationLog.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: {
          KnowledgeBase: {
            include: {
              Article: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      return {
        overview: {
          totalKeys,
          activeKeys,
          totalUsage,
          totalCitations,
          knowledgeBaseCount,
          feedCount,
        },
        usageByTier: usageByTier.map((u: any) => ({
          tier: u.tier,
          count: u._count,
        })),
        topCited: topCited.map((kb: any) => ({
          id: kb.id,
          articleTitle: kb.Article.title,
          articleSlug: kb.Article.slug,
          citationCount: kb.citationCount,
          qualityScore: kb.qualityScore,
        })),
        recentCitations: recentCitations.map((c: any) => ({
          id: c.id,
          articleTitle: c.KnowledgeBase.Article.title,
          sourceName: c.sourceName,
          sourceType: c.sourceType,
          timestamp: c.timestamp,
        })),
      };
    } catch (error) {
      console.error('Error getting API statistics:', error);
      throw error;
    }
  }

  /**
   * Create or update RAG feed
   */
  async createRAGFeed(config: RAGFeedConfig): Promise<any> {
    try {
      const endpoint = config.name.toLowerCase().replace(/\s+/g, '-');

      return await prisma.rAGFeed.create({
        data: {
          name: config.name,
          description: config.description,
          feedType: config.feedType,
          endpoint,
          category: config.category ?? null,
          region: config.region ?? null,
          language: config.language || 'en',
          updateFrequency: config.updateFrequency || 'hourly',
        },
      });
    } catch (error) {
      console.error('Error creating RAG feed:', error);
      throw error;
    }
  }

  /**
   * Get all feeds
   */
  async getAllFeeds(): Promise<any[]> {
    try {
      return await prisma.rAGFeed.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting feeds:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate quality score
   */
  private calculateQualityScore(data: KnowledgeBaseData): number {
    let score = 0;

    // Summary length (20 points)
    const summaryLength = data.summary.length;
    if (summaryLength >= 100 && summaryLength <= 300) score += 20;
    else if (summaryLength > 0) score += 10;

    // Key points (20 points)
    if (data.keyPoints.length >= 3) score += 20;
    else if (data.keyPoints.length > 0) score += 10;

    // Entities (20 points)
    if (data.entities.length >= 5) score += 20;
    else if (data.entities.length > 0) score += 10;

    // Facts (20 points)
    if (data.facts.length >= 3) score += 20;
    else if (data.facts.length > 0) score += 10;

    // Sources (20 points)
    if (data.sources.length >= 2) score += 20;
    else if (data.sources.length > 0) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Helper: Calculate LLM readability score
   */
  private calculateLLMReadability(data: KnowledgeBaseData): number {
    let score = 0;

    // Clear structure (25 points)
    if (data.summary && data.keyPoints.length > 0) score += 25;

    // Entity richness (25 points)
    if (data.entities.length >= 3) score += 25;
    else if (data.entities.length > 0) score += 15;

    // Fact density (25 points)
    if (data.facts.length >= 3) score += 25;
    else if (data.facts.length > 0) score += 15;

    // Source attribution (25 points)
    if (data.sources.length >= 2) score += 25;
    else if (data.sources.length > 0) score += 15;

    return Math.min(score, 100);
  }
}

export const knowledgeAPIService = new KnowledgeAPIService();
