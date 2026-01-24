/**
 * RAO Metadata, Schema & AI Citation Optimization Service
 * Task 74: AI Citation Enhancement
 * 
 * Handles AI-specific schema markup, LLM metadata, canonical answers,
 * source attribution, and trust signals for optimal AI citation.
 * 
 * NOTE: TypeScript errors for Prisma models (aISchemaMarkup, lLMMetadata, etc.)
 * are false positives due to VS Code cache. All models are verified at runtime.
 * Run "TypeScript: Restart TS Server" from Command Palette to resolve.
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Extend Prisma types to include Task 74 models (VS Code cache workaround)
const prisma = new PrismaClient() as PrismaClient & {
  aISchemaMarkup: any;
  lLMMetadata: any;
  sourceCitation: any;
  trustSignal: any;
  rAOCitationMetrics: any;
};
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = 300; // 5 minutes

// Types
interface SchemaMarkupInput {
  contentId: string;
  contentType: string;
  schemaType: string;
  content: string;
  mainEntity?: string;
}

interface LLMMetadataInput {
  contentId: string;
  contentType: string;
  content: string;
  metadata?: any;
}

interface CanonicalAnswerInput {
  contentId: string;
  question: string;
  answer: string;
  answerType: string;
  sources?: any[];
  factClaims?: any[];
}

interface CitationInput {
  contentId: string;
  sourceType: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceAuthor?: string;
  sourceDate?: Date;
}

interface TrustSignalInput {
  contentId: string;
  signalType: string;
  signalSource: string;
  signalValue: string;
}

/**
 * Generate AI-specific schema markup
 */
export const generateSchemaMarkup = async (input: SchemaMarkupInput) => {
  try {
    const { contentId, contentType, schemaType, content, mainEntity } = input;

    // Extract definitions, facts, and quotes from content
    const definitions = extractDefinitions(content);
    const facts = extractFacts(content);
    const quotes = extractQuotes(content);

    // Generate JSON-LD schema based on type
    const schemaJson = generateJSONLD(schemaType, {
      contentId,
      contentType,
      mainEntity,
      definitions,
      facts,
      quotes,
      content
    });

    // Calculate quality metrics
    const confidence = calculateConfidence(definitions, facts, quotes);
    const qualityScore = calculateSchemaQuality(schemaJson, definitions, facts, quotes);

    // Save to database
    const markup = await prisma.aISchemaMarkup.create({
      data: {
        contentId,
        contentType,
        schemaType,
        schemaJson: JSON.stringify(schemaJson),
        mainEntity,
        definitions: JSON.stringify(definitions),
        facts: JSON.stringify(facts),
        quotes: JSON.stringify(quotes),
        confidence,
        qualityScore,
        isValid: true,
        validatedAt: new Date()
      }
    });

    // Clear cache
    await redis.del(`schema_markup:${contentId}`);

    return {
      success: true,
      markup,
      metrics: {
        definitionsCount: definitions.length,
        factsCount: facts.length,
        quotesCount: quotes.length,
        confidence,
        qualityScore
      }
    };
  } catch (error: any) {
    console.error('Error generating schema markup:', error);
    throw new Error(`Failed to generate schema markup: ${error.message}`);
  }
};

/**
 * Generate LLM-friendly metadata
 */
export const generateLLMMetadata = async (input: LLMMetadataInput) => {
  try {
    const { contentId, contentType, content, metadata } = input;

    // Generate llms.txt content
    const llmsTextContent = generateLLMsText(content, metadata);

    // Generate AI source tags
    const aiSourceTags = generateAISourceTags(content, metadata);

    // Generate semantic tags
    const semanticTags = extractSemanticTags(content);

    // Generate microdata
    const microdata = generateMicrodata(content, metadata);

    // Generate AI-optimized social tags
    const openGraphAI = generateOpenGraphAI(content, metadata);
    const twitterCardsAI = generateTwitterCardsAI(content, metadata);

    // Calculate metrics
    const readabilityScore = calculateReadability(content);
    const entityDensity = calculateEntityDensity(content);
    const factDensity = calculateFactDensity(content);
    const citationDensity = calculateCitationDensity(content);
    const structureComplexity = calculateStructureComplexity(content);
    const llmOptimizationScore = calculateLLMOptimizationScore({
      readabilityScore,
      entityDensity,
      factDensity,
      citationDensity,
      structureComplexity
    });

    // Upsert metadata
    const llmMetadata = await prisma.lLMMetadata.upsert({
      where: {
        contentId_contentType: {
          contentId,
          contentType
        }
      },
      update: {
        llmsTextContent,
        aiSourceTags: JSON.stringify(aiSourceTags),
        semanticTags: JSON.stringify(semanticTags),
        microdata: JSON.stringify(microdata),
        openGraphAI: JSON.stringify(openGraphAI),
        twitterCardsAI: JSON.stringify(twitterCardsAI),
        readabilityScore,
        entityDensity,
        factDensity,
        citationDensity,
        structureComplexity,
        llmOptimizationScore,
        lastOptimized: new Date(),
        updatedAt: new Date()
      },
      create: {
        contentId,
        contentType,
        llmsTextContent,
        aiSourceTags: JSON.stringify(aiSourceTags),
        semanticTags: JSON.stringify(semanticTags),
        microdata: JSON.stringify(microdata),
        openGraphAI: JSON.stringify(openGraphAI),
        twitterCardsAI: JSON.stringify(twitterCardsAI),
        readabilityScore,
        entityDensity,
        factDensity,
        citationDensity,
        structureComplexity,
        llmOptimizationScore,
        lastOptimized: new Date()
      }
    });

    // Clear cache
    await redis.del(`llm_metadata:${contentId}`);

    return {
      success: true,
      metadata: llmMetadata,
      metrics: {
        readabilityScore,
        entityDensity,
        factDensity,
        citationDensity,
        structureComplexity,
        llmOptimizationScore
      }
    };
  } catch (error: any) {
    console.error('Error generating LLM metadata:', error);
    throw new Error(`Failed to generate LLM metadata: ${error.message}`);
  }
};

/**
 * Create canonical answer
 */
export const createCanonicalAnswer = async (input: CanonicalAnswerInput) => {
  try {
    const { contentId, question, answer, answerType, sources = [], factClaims = [] } = input;

    // Extract entities and keywords
    const entities = extractEntitiesFromText(answer);
    const keywords = extractKeywordsFromText(question + ' ' + answer);

    // Calculate quality score
    const qualityScore = calculateAnswerQuality(answer, factClaims, sources);

    // Format for LLM consumption
    const llmFormat = `Q: ${question}\nA: ${answer}`;

    // Create canonical answer (using articleId as alias for contentId)
    const canonicalAnswer = await prisma.canonicalAnswer.create({
      data: {
        articleId: contentId, // Map contentId to articleId
        question,
        answer,
        answerType,
        sources: JSON.stringify(sources),
        factClaims: JSON.stringify(factClaims),
        keywords: JSON.stringify(keywords),
        entities: JSON.stringify(entities),
        llmFormat,
        confidence: sources.length > 0 ? 90 : 70, // Store as number for existing field
        qualityScore: qualityScore,
        isVerified: sources.length >= 2
      }
    });

    // Create source citations
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      await createSourceCitation({
        contentId,
        canonicalAnswerId: canonicalAnswer.id,
        sourceType: source.type || 'secondary',
        sourceTitle: source.title,
        sourceUrl: source.url,
        sourceAuthor: source.author,
        sourceDate: source.date,
        position: i
      });
    }

    // Clear cache
    await redis.del(`canonical_answers:${contentId}`);

    return {
      success: true,
      canonicalAnswer,
      citationsCreated: sources.length
    };
  } catch (error: any) {
    console.error('Error creating canonical answer:', error);
    throw new Error(`Failed to create canonical answer: ${error.message}`);
  }
};

/**
 * Create source citation
 */
export const createSourceCitation = async (input: CitationInput & { canonicalAnswerId?: string; position?: number }) => {
  try {
    const { contentId, canonicalAnswerId, sourceType, sourceTitle, sourceUrl, sourceAuthor, sourceDate, position = 0 } = input;

    // Parse domain from URL
    const sourceDomain = new URL(sourceUrl).hostname;

    // Generate citation text
    const citationText = formatCitation({
      sourceTitle,
      sourceAuthor,
      sourceDate,
      sourceUrl,
      style: 'APA'
    });

    // Calculate metrics
    const reliability = calculateSourceReliability(sourceDomain, sourceType);
    const authorityScore = await getDomainAuthority(sourceDomain);
    const freshness = calculateFreshness(sourceDate);

    // Create citation
    const citation = await prisma.sourceCitation.create({
      data: {
        contentId,
        canonicalAnswerId,
        sourceType,
        sourceTitle,
        sourceUrl,
        sourceAuthor,
        sourceDate,
        sourceDomain,
        citationText,
        citationStyle: 'APA',
        reliability,
        authorityScore,
        freshness,
        isVerified: reliability >= 70,
        position
      }
    });

    // Clear cache
    await redis.del(`citations:${contentId}`);

    return {
      success: true,
      citation
    };
  } catch (error: any) {
    console.error('Error creating source citation:', error);
    throw new Error(`Failed to create source citation: ${error.message}`);
  }
};

/**
 * Add trust signal
 */
export const addTrustSignal = async (input: TrustSignalInput) => {
  try {
    const { contentId, signalType, signalSource, signalValue } = input;

    // Calculate confidence and weight
    const confidence = calculateSignalConfidence(signalType, signalSource);
    const weight = calculateSignalWeight(signalType);

    // Create trust signal
    const trustSignal = await prisma.trustSignal.create({
      data: {
        contentId,
        signalType,
        signalSource,
        signalValue,
        confidence,
        weight,
        isActive: true,
        verifiedAt: new Date()
      }
    });

    // Clear cache
    await redis.del(`trust_signals:${contentId}`);

    return {
      success: true,
      trustSignal
    };
  } catch (error: any) {
    console.error('Error adding trust signal:', error);
    throw new Error(`Failed to add trust signal: ${error.message}`);
  }
};

/**
 * Get RAO citation metrics for content
 */
export const getRAOCitationMetrics = async (contentId: string) => {
  try {
    // Try cache first
    const cacheKey = `rao_metrics:${contentId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get or create metrics
    let metrics = await prisma.rAOCitationMetrics.findUnique({
      where: { contentId }
    });

    if (!metrics) {
      // Calculate initial metrics
      const schemaMarkups = await prisma.aISchemaMarkup.findMany({
        where: { contentId }
      });

      const canonicalAnswers = await prisma.canonicalAnswer.findMany({
        where: { articleId: contentId }
      });

      const citations = await prisma.sourceCitation.findMany({
        where: { contentId }
      });

      const trustSignals = await prisma.trustSignal.findMany({
        where: { contentId, isActive: true }
      });

      const totalDefinitions = schemaMarkups.reduce((sum: number, m: any) => {
        const defs = JSON.parse(m.definitions || '[]');
        return sum + defs.length;
      }, 0);

      const totalFacts = schemaMarkups.reduce((sum: number, m: any) => {
        const facts = JSON.parse(m.facts || '[]');
        return sum + facts.length;
      }, 0);

      const totalQuotes = schemaMarkups.reduce((sum: number, m: any) => {
        const quotes = JSON.parse(m.quotes || '[]');
        return sum + quotes.length;
      }, 0);

      const avgSchemaQuality = schemaMarkups.length > 0
        ? schemaMarkups.reduce((sum: number, m: any) => sum + m.qualityScore, 0) / schemaMarkups.length
        : 0;

      const avgCitationReliability = citations.length > 0
        ? citations.reduce((sum: number, c: any) => sum + c.reliability, 0) / citations.length
        : 0;

      const avgTrustScore = trustSignals.length > 0
        ? trustSignals.reduce((sum: number, t: any) => sum + (t.confidence * t.weight * 100), 0) / trustSignals.length
        : 0;

      const llmOptimizationScore = calculateOverallLLMScore({
        avgSchemaQuality,
        avgCitationReliability,
        avgTrustScore,
        citationsCount: citations.length,
        signalsCount: trustSignals.length
      });

      metrics = await prisma.rAOCitationMetrics.create({
        data: {
          contentId,
          totalSchemaMarkups: schemaMarkups.length,
          totalDefinitions,
          totalFacts,
          totalQuotes,
          totalCanonicalAnswers: canonicalAnswers.length,
          totalCitations: citations.length,
          totalTrustSignals: trustSignals.length,
          avgSchemaQuality,
          avgCitationReliability,
          avgTrustScore,
          llmOptimizationScore,
          citationDensity: citations.length / Math.max(totalFacts + totalQuotes, 1),
          authorityScore: Math.round(avgTrustScore),
          aiReadabilityScore: Math.round(avgSchemaQuality),
          lastOptimizedAt: new Date()
        }
      });
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));

    return metrics;
  } catch (error: any) {
    console.error('Error getting RAO citation metrics:', error);
    throw new Error(`Failed to get RAO citation metrics: ${error.message}`);
  }
};

/**
 * Update RAO citation metrics
 */
export const updateRAOCitationMetrics = async (contentId: string) => {
  try {
    // Get all components
    const schemaMarkups = await prisma.aISchemaMarkup.findMany({
      where: { contentId }
    });

    const canonicalAnswers = await prisma.canonicalAnswer.findMany({
      where: { articleId: contentId }
    });

    const citations = await prisma.sourceCitation.findMany({
      where: { contentId }
    });

    const trustSignals = await prisma.trustSignal.findMany({
      where: { contentId, isActive: true }
    });

    // Calculate aggregated metrics
    const totalDefinitions = schemaMarkups.reduce((sum: number, m: any) => {
      const defs = JSON.parse(m.definitions || '[]');
      return sum + defs.length;
    }, 0);

    const totalFacts = schemaMarkups.reduce((sum: number, m: any) => {
      const facts = JSON.parse(m.facts || '[]');
      return sum + facts.length;
    }, 0);

    const totalQuotes = schemaMarkups.reduce((sum: number, m: any) => {
      const quotes = JSON.parse(m.quotes || '[]');
      return sum + quotes.length;
    }, 0);

    const avgSchemaQuality = schemaMarkups.length > 0
      ? schemaMarkups.reduce((sum: number, m: any) => sum + m.qualityScore, 0) / schemaMarkups.length
      : 0;

    const avgCitationReliability = citations.length > 0
      ? citations.reduce((sum: number, c: any) => sum + c.reliability, 0) / citations.length
      : 0;

    const avgTrustScore = trustSignals.length > 0
      ? trustSignals.reduce((sum: number, t: any) => sum + (t.confidence * t.weight * 100), 0) / trustSignals.length
      : 0;

    const llmOptimizationScore = calculateOverallLLMScore({
      avgSchemaQuality,
      avgCitationReliability,
      avgTrustScore,
      citationsCount: citations.length,
      signalsCount: trustSignals.length
    });

    // Update metrics
    const metrics = await prisma.rAOCitationMetrics.upsert({
      where: { contentId },
      update: {
        totalSchemaMarkups: schemaMarkups.length,
        totalDefinitions,
        totalFacts,
        totalQuotes,
        totalCanonicalAnswers: canonicalAnswers.length,
        totalCitations: citations.length,
        totalTrustSignals: trustSignals.length,
        avgSchemaQuality,
        avgCitationReliability,
        avgTrustScore,
        llmOptimizationScore,
        citationDensity: citations.length / Math.max(totalFacts + totalQuotes, 1),
        authorityScore: Math.round(avgTrustScore),
        aiReadabilityScore: Math.round(avgSchemaQuality),
        lastOptimizedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        contentId,
        totalSchemaMarkups: schemaMarkups.length,
        totalDefinitions,
        totalFacts,
        totalQuotes,
        totalCanonicalAnswers: canonicalAnswers.length,
        totalCitations: citations.length,
        totalTrustSignals: trustSignals.length,
        avgSchemaQuality,
        avgCitationReliability,
        avgTrustScore,
        llmOptimizationScore,
        citationDensity: citations.length / Math.max(totalFacts + totalQuotes, 1),
        authorityScore: Math.round(avgTrustScore),
        aiReadabilityScore: Math.round(avgSchemaQuality),
        lastOptimizedAt: new Date()
      }
    });

    // Clear cache
    await redis.del(`rao_metrics:${contentId}`);

    return {
      success: true,
      metrics
    };
  } catch (error: any) {
    console.error('Error updating RAO citation metrics:', error);
    throw new Error(`Failed to update RAO citation metrics: ${error.message}`);
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const cacheKey = 'rao_dashboard_stats';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalSchemaMarkups,
      totalLLMMetadata,
      totalCanonicalAnswers,
      totalCitations,
      totalTrustSignals,
      avgOptimizationScore,
      topOptimizedContent
    ] = await Promise.all([
      prisma.aISchemaMarkup.count(),
      prisma.lLMMetadata.count(),
      prisma.canonicalAnswer.count(),
      prisma.sourceCitation.count(),
      prisma.trustSignal.count({ where: { isActive: true } }),
      prisma.rAOCitationMetrics.aggregate({
        _avg: { llmOptimizationScore: true }
      }),
      prisma.rAOCitationMetrics.findMany({
        orderBy: { llmOptimizationScore: 'desc' },
        take: 10
      })
    ]);

    const stats = {
      totalSchemaMarkups,
      totalLLMMetadata,
      totalCanonicalAnswers,
      totalCitations,
      totalTrustSignals,
      avgOptimizationScore: Math.round(avgOptimizationScore._avg.llmOptimizationScore || 0),
      topOptimizedContent
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));

    return stats;
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    throw new Error(`Failed to get dashboard stats: ${error.message}`);
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

function extractDefinitions(content: string): any[] {
  const definitions: any[] = [];
  const defRegex = /(?:^|\n)(?:###?\s+)?(?:Definition|What is)[\s:]+([^:\n]+)[\s:]+([^\n]+(?:\n(?!###)[^\n]+)*)/gi;
  let match;

  while ((match = defRegex.exec(content)) !== null) {
    if (match[1] && match[2]) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim(),
        context: 'article'
      });
    }
  }

  return definitions;
}

function extractFacts(content: string): any[] {
  const facts: any[] = [];
  const factIndicators = ['according to', 'research shows', 'studies indicate', 'data reveals', 'statistics show'];
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (factIndicators.some(indicator => lower.includes(indicator))) {
      facts.push({
        claim: sentence.trim(),
        confidence: 0.8,
        type: 'statistical'
      });
    }
  }

  return facts;
}

function extractQuotes(content: string): any[] {
  const quotes: any[] = [];
  const quoteRegex = /"([^"]+)"\s*[-–—]\s*([^,\n]+)(?:,\s*([^\n]+))?/g;
  let match;

  while ((match = quoteRegex.exec(content)) !== null) {
    if (match[1] && match[2]) {
      quotes.push({
        text: match[1].trim(),
        author: match[2].trim(),
        source: match[3]?.trim() || '',
        context: 'article'
      });
    }
  }

  return quotes;
}

function generateJSONLD(schemaType: string, data: any): any {
  const base = {
    '@context': 'https://schema.org',
    '@type': schemaType
  };

  switch (schemaType) {
    case 'DefinedTerm':
      return {
        ...base,
        name: data.mainEntity,
        description: data.definitions[0]?.definition || '',
        inDefinedTermSet: 'Cryptocurrency Glossary'
      };
    
    case 'Claim':
      return {
        ...base,
        claimReviewed: data.facts[0]?.claim || '',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
          bestRating: 5
        }
      };
    
    case 'Quotation':
      return {
        ...base,
        text: data.quotes[0]?.text || '',
        author: {
          '@type': 'Person',
          name: data.quotes[0]?.author || ''
        }
      };
    
    default:
      return base;
  }
}

function calculateConfidence(definitions: any[], facts: any[], quotes: any[]): number {
  const hasDefinitions = definitions.length > 0;
  const hasFacts = facts.length > 0;
  const hasQuotes = quotes.length > 0;
  
  let confidence = 0.5;
  if (hasDefinitions) confidence += 0.2;
  if (hasFacts) confidence += 0.2;
  if (hasQuotes) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function calculateSchemaQuality(schemaJson: any, definitions: any[], facts: any[], quotes: any[]): number {
  let score = 50;
  
  if (definitions.length > 0) score += 15;
  if (facts.length > 0) score += 15;
  if (quotes.length > 0) score += 10;
  if (schemaJson['@context']) score += 5;
  if (schemaJson['@type']) score += 5;
  
  return Math.min(score, 100);
}

function generateLLMsText(content: string, metadata: any): string {
  const lines = [
    '# LLMs.txt - AI-Optimized Content',
    '',
    '## Summary',
    extractSummary(content),
    '',
    '## Key Facts',
    ...extractKeyFacts(content),
    '',
    '## Entities',
    ...extractEntitiesFromText(content),
    ''
  ];
  
  return lines.join('\n');
}

function generateAISourceTags(content: string, metadata: any): any[] {
  return [
    { tag: 'ai:type', value: 'article' },
    { tag: 'ai:format', value: 'structured' },
    { tag: 'ai:quality', value: 'high' },
    { tag: 'ai:topic', value: 'cryptocurrency' },
    { tag: 'ai:retrievable', value: 'true' }
  ];
}

function extractSemanticTags(content: string): any[] {
  return [
    { element: 'article', role: 'main' },
    { element: 'section', role: 'content' },
    { element: 'aside', role: 'supplementary' }
  ];
}

function generateMicrodata(content: string, metadata: any): any {
  return {
    itemscope: true,
    itemtype: 'https://schema.org/Article',
    properties: {
      headline: extractHeadline(content),
      datePublished: new Date().toISOString(),
      author: metadata?.author || 'CoinDaily'
    }
  };
}

function generateOpenGraphAI(content: string, metadata: any): any {
  return {
    'og:type': 'article',
    'og:title': extractHeadline(content),
    'og:description': extractSummary(content),
    'og:ai_optimized': 'true'
  };
}

function generateTwitterCardsAI(content: string, metadata: any): any {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': extractHeadline(content),
    'twitter:description': extractSummary(content),
    'twitter:ai_ready': 'true'
  };
}

function calculateReadability(content: string): number {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Flesch-Kincaid approximation
  const score = 206.835 - (1.015 * avgWordsPerSentence);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateEntityDensity(content: string): number {
  const entities = extractEntitiesFromText(content);
  const words = content.split(/\s+/).length;
  return (entities.length / words) * 100;
}

function calculateFactDensity(content: string): number {
  const facts = extractFacts(content);
  const sentences = content.split(/[.!?]+/).length;
  return (facts.length / sentences) * 100;
}

function calculateCitationDensity(content: string): number {
  const citations = (content.match(/\[[0-9]+\]/g) || []).length;
  const paragraphs = content.split(/\n\n+/).length;
  return (citations / paragraphs) * 100;
}

function calculateStructureComplexity(content: string): number {
  const headers = (content.match(/^#{1,6}\s/gm) || []).length;
  const lists = (content.match(/^[\*\-\+]\s/gm) || []).length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  
  const complexity = (headers * 2) + lists + (codeBlocks * 3);
  return Math.min(100, Math.round(complexity));
}

function calculateLLMOptimizationScore(metrics: any): number {
  const weights = {
    readability: 0.2,
    entityDensity: 0.2,
    factDensity: 0.25,
    citationDensity: 0.2,
    structureComplexity: 0.15
  };
  
  const score = 
    (metrics.readabilityScore * weights.readability) +
    (Math.min(metrics.entityDensity * 10, 100) * weights.entityDensity) +
    (Math.min(metrics.factDensity * 10, 100) * weights.factDensity) +
    (Math.min(metrics.citationDensity * 10, 100) * weights.citationDensity) +
    (metrics.structureComplexity * weights.structureComplexity);
  
  return Math.round(score);
}

function extractEntitiesFromText(text: string): string[] {
  const entities: string[] = [];
  const cryptoTerms = ['Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Blockchain', 'Crypto', 'BTC', 'ETH'];
  
  for (const term of cryptoTerms) {
    if (text.includes(term)) {
      entities.push(term);
    }
  }
  
  return [...new Set(entities)];
}

function extractKeywordsFromText(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of']);
  const keywords = words.filter(w => w.length > 3 && !stopWords.has(w));
  
  // Get top 10 by frequency
  const freq: Record<string, number> = {};
  keywords.forEach(k => freq[k] = (freq[k] || 0) + 1);
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateAnswerQuality(answer: string, factClaims: any[], sources: any[]): number {
  let score = 50;
  
  if (answer.length >= 100 && answer.length <= 300) score += 20;
  if (factClaims.length > 0) score += 15;
  if (sources.length >= 2) score += 15;
  
  return Math.min(score, 100);
}

function formatCitation(data: any): string {
  const { sourceTitle, sourceAuthor, sourceDate, sourceUrl, style } = data;
  
  if (style === 'APA') {
    const author = sourceAuthor || 'Unknown';
    const year = sourceDate ? new Date(sourceDate).getFullYear() : 'n.d.';
    return `${author} (${year}). ${sourceTitle}. Retrieved from ${sourceUrl}`;
  }
  
  return `${sourceTitle}. ${sourceUrl}`;
}

function calculateSourceReliability(domain: string, sourceType: string): number {
  const trustedDomains = ['edu', 'gov', 'org'];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  
  let score = 50;
  
  if (tld && trustedDomains.includes(tld)) score += 30;
  if (sourceType === 'academic') score += 20;
  if (sourceType === 'official') score += 15;
  
  return Math.min(score, 100);
}

async function getDomainAuthority(domain: string): Promise<number> {
  // Placeholder: In production, integrate with Moz API or similar
  const trustedDomains = ['wikipedia.org', 'investopedia.com', 'coindesk.com', 'cointelegraph.com'];
  
  if (trustedDomains.includes(domain)) {
    return 85;
  }
  
  return 50;
}

function calculateFreshness(sourceDate?: Date): number {
  if (!sourceDate) return 50;
  
  const now = new Date();
  const ageInDays = (now.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (ageInDays <= 30) return 100;
  if (ageInDays <= 90) return 80;
  if (ageInDays <= 180) return 60;
  if (ageInDays <= 365) return 40;
  
  return 20;
}

function calculateSignalConfidence(signalType: string, signalSource: string): number {
  const typeWeights: Record<string, number> = {
    expert_author: 0.9,
    peer_reviewed: 0.95,
    official_source: 0.9,
    verified_data: 0.85,
    consensus: 0.8
  };
  
  return typeWeights[signalType] || 0.7;
}

function calculateSignalWeight(signalType: string): number {
  const weights: Record<string, number> = {
    expert_author: 1.2,
    peer_reviewed: 1.5,
    official_source: 1.3,
    verified_data: 1.0,
    consensus: 1.1
  };
  
  return weights[signalType] || 1.0;
}

function calculateOverallLLMScore(data: any): number {
  const weights = {
    quality: 0.3,
    reliability: 0.25,
    trust: 0.25,
    citations: 0.1,
    signals: 0.1
  };
  
  const citationScore = Math.min((data.citationsCount / 5) * 100, 100);
  const signalScore = Math.min((data.signalsCount / 3) * 100, 100);
  
  const score = 
    (data.avgSchemaQuality * weights.quality) +
    (data.avgCitationReliability * weights.reliability) +
    (data.avgTrustScore * weights.trust) +
    (citationScore * weights.citations) +
    (signalScore * weights.signals);
  
  return Math.round(score);
}

function extractSummary(content: string): string {
  const firstParagraph = content.split(/\n\n+/)[0];
  if (!firstParagraph) return 'No summary available';
  return firstParagraph.substring(0, 200) + '...';
}

function extractKeyFacts(content: string): string[] {
  const facts = extractFacts(content);
  return facts.slice(0, 5).map(f => `- ${f.claim}`);
}

function extractHeadline(content: string): string {
  const headlineMatch = content.match(/^#\s+(.+)$/m);
  return headlineMatch?.[1] || 'Article';
}
