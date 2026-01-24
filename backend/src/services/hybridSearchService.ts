/**
 * Hybrid Search Service
 * Task 16: Combines Elasticsearch with AI-powered semantic search for African cryptocurrency content
 */

import OpenAI from 'openai';
import { ElasticsearchService, SearchResult, SearchOptions } from './elasticsearchService';
import { logger } from '../utils/logger';

export enum SearchResultType {
  ARTICLES = 'articles',
  MARKET_DATA = 'market_data',
  MIXED = 'mixed'
}

export interface SemanticSearchOptions {
  includeAfricanContext?: boolean;
  languages?: string[];
  optimizeForMobile?: boolean;
  maxResults?: number;
  similarityThreshold?: number;
}

export interface UserPreferences {
  userId: string;
  preferredLanguages: string[];
  interestedTopics: string[];
  location: string;
  readingHistory: string[];
}

export interface HybridSearchOptions {
  type: SearchResultType;
  includeSemanticRanking?: boolean;
  africanLanguages?: string[];
  language?: string;
  optimizeForAfrica?: boolean;
  userLocation?: string;
  maxResponseTime?: number;
  fallbackToElastic?: boolean;
  boostAfricanExchanges?: boolean;
  optimizeForMobile?: boolean;
  limitBandwidth?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
  trackAnalytics?: boolean;
  userId?: string;
  timeout?: number;
  prioritizeLocalContent?: boolean;
}

export interface HybridSearchResult {
  total: number;
  hits: Array<{
    id: string;
    title: string;
    content?: string;
    summary?: string;
    language: string;
    category?: string;
    tags?: string[];
    publishedAt?: Date;
    author?: string;
    score: number;
    hybridScore?: number;
    semanticScore?: number;
    personalizationScore?: number;
    highlight?: {
      title?: string[];
      content?: string[];
    };
  }>;
  searchMethod: 'elasticsearch' | 'semantic' | 'hybrid' | 'elasticsearch_fallback' | 'failed';
  performance: {
    total: number;
    elasticsearch?: number;
    semantic?: number;
    personalization?: number;
  };
  cached?: boolean;
  compressed?: boolean;
  mobileOptimized?: boolean;
  personalizedRanking?: boolean;
  languageProcessing?: {
    detectedLanguage: string;
    africanContext: boolean;
    translationSuggestions?: string[];
  };
  africanContextWeight?: number;
  warnings?: string[];
  error?: string;
  analytics?: {
    queryId: string;
    responseTime: number;
    resultCount: number;
    userId?: string;
  };
}

export interface SearchSuggestion {
  text: string;
  score: number;
  category?: string;
  africanContext?: boolean;
}

export class HybridSearchService {
  private cache = new Map<string, { result: HybridSearchResult; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly EMBEDDING_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();

  // African language detection patterns
  private readonly AFRICAN_LANGUAGE_PATTERNS = {
    'sw': /\b(habari|bitcoin|pesa|shilling|kenya|tanzania)\b/i, // Swahili
    'fr': /\b(nouvelles|prix|franc|senegal|cote|ivoire)\b/i,   // French
    'af': /\b(nuus|rand|suid-afrika|bitcoin)\b/i,              // Afrikaans
    'ar': /[\u0600-\u06FF]/,                                   // Arabic
    'am': /[\u1200-\u137F]/,                                   // Amharic
    'yo': /\b(iroyin|naira|nigeria|bitcoin)\b/i,               // Yoruba
    'zu': /\b(izindaba|rand|ningizimu|afrika)\b/i              // Zulu
  };

  // African cryptocurrency terms and exchanges
  private readonly AFRICAN_CRYPTO_TERMS = [
    'binance africa', 'luno', 'quidax', 'buycoins', 'valr', 'ice3x',
    'm-pesa', 'orange money', 'mtn money', 'ecocash', 'airtel money',
    'naira', 'rand', 'shilling', 'franc cfa', 'birr', 'cedi',
    'lagos', 'johannesburg', 'nairobi', 'cairo', 'casablanca', 'accra'
  ];

  constructor(
    private elasticsearchService: ElasticsearchService,
    private openai: OpenAI,
    private logger: any
  ) {}

  /**
   * Generate embeddings for semantic search
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${Buffer.from(text).toString('base64')}`;
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.EMBEDDING_CACHE_TTL) {
      return cached.embedding;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 1536
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }
      this.embeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now()
      });

      return embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', { error, text: text.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Perform semantic search with African context optimization
   */
  async semanticSearch(query: string, options: SemanticSearchOptions = {}): Promise<{
    results: any[];
    took: number;
    africanContextWeight: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Enhance query with African context if requested
      let enhancedQuery = query;
      if (options.includeAfricanContext) {
        const africanTerms = this.AFRICAN_CRYPTO_TERMS.filter(term => {
          const firstWord = term.split(' ')[0];
          return firstWord && query.toLowerCase().includes(firstWord);
        });
        if (africanTerms.length > 0) {
          enhancedQuery = `${query} ${africanTerms.join(' ')}`;
        }
      }

      const embedding = await this.generateEmbedding(enhancedQuery);
      
      // Calculate African context weight
      const africanContextWeight = options.includeAfricanContext && 
        this.AFRICAN_CRYPTO_TERMS.some(term => 
          query.toLowerCase().includes(term.toLowerCase())
        ) ? 1.2 : 1.0;

      // For now, return mock results - in production, this would query a vector database
      const results = [
        {
          id: 'semantic-1',
          title: 'AI Generated Semantic Result',
          content: 'Semantic search result based on embedding similarity',
          semanticScore: 0.87,
          language: options.languages?.[0] || 'en'
        }
      ];

      return {
        results,
        took: Date.now() - startTime,
        africanContextWeight
      };
    } catch (error) {
      this.logger.error('Semantic search failed', { error, query });
      // Re-throw the error so the hybrid search can handle fallback
      throw error;
    }
  }

  /**
   * Detect African languages in query
   */
  private detectAfricanLanguage(query: string): { language: string; confidence: number } {
    for (const [lang, pattern] of Object.entries(this.AFRICAN_LANGUAGE_PATTERNS)) {
      if (pattern.test(query)) {
        return { language: lang, confidence: 0.8 };
      }
    }
    return { language: 'en', confidence: 0.5 };
  }

  /**
   * Main hybrid search function combining Elasticsearch and semantic search
   */
  async hybridSearch(query: string, options: HybridSearchOptions): Promise<HybridSearchResult> {
    const startTime = Date.now();
    
    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        total: 0,
        hits: [],
        searchMethod: 'failed',
        performance: { total: Date.now() - startTime },
        error: 'Invalid query: Query cannot be empty'
      };
    }

    // Check cache
    const cacheKey = `hybrid:${JSON.stringify({ query, options })}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        ...cached.result,
        cached: true,
        performance: { ...cached.result.performance, total: Date.now() - startTime }
      };
    }

    let elasticsearchResults: SearchResult | null = null;
    let semanticResults: any = null;
    let searchMethod: HybridSearchResult['searchMethod'] = 'hybrid';
    const warnings: string[] = [];

    try {
      // Language detection
      const languageDetection = this.detectAfricanLanguage(query);
      
      // Elasticsearch search
      const elasticStartTime = Date.now();
      try {
        const elasticOptions: SearchOptions = {
          limit: 20,
          language: options.language || languageDetection.language,
          ...(options.optimizeForAfrica !== undefined && { optimizeForAfrica: options.optimizeForAfrica })
        };

        if (options.type === SearchResultType.ARTICLES) {
          elasticsearchResults = await this.elasticsearchService.searchArticles(query, elasticOptions);
        }
      } catch (error) {
        this.logger.error('Elasticsearch search failed', { error, query });
        if (!options.fallbackToElastic) {
          warnings.push('elasticsearch_search_failed');
        }
      }
      const elasticTime = Date.now() - elasticStartTime;

      // Semantic search (if enabled and not timed out)
      let semanticTime = 0;
      if (options.includeSemanticRanking && Date.now() - startTime < (options.maxResponseTime || 500) - 100) {
        const semanticStartTime = Date.now();
        try {
          const semanticOptions: SemanticSearchOptions = {};
          if (options.optimizeForAfrica !== undefined) {
            semanticOptions.includeAfricanContext = options.optimizeForAfrica;
          }
          if (options.africanLanguages !== undefined) {
            semanticOptions.languages = options.africanLanguages;
          }
          if (options.optimizeForMobile !== undefined) {
            semanticOptions.optimizeForMobile = options.optimizeForMobile;
          }
          
          semanticResults = await this.semanticSearch(query, semanticOptions);
        } catch (error) {
          this.logger.error('Semantic search failed', { error, query });
          warnings.push('semantic_search_failed');
          if (elasticsearchResults) {
            searchMethod = 'elasticsearch_fallback';
          }
        }
        semanticTime = Date.now() - semanticStartTime;
      }

      // Check if we have any results at all
      const hasElasticsearchResults = elasticsearchResults && elasticsearchResults.hits.length > 0;
      const hasSemanticResults = semanticResults && semanticResults.results.length > 0;
      
      if (!hasElasticsearchResults && !hasSemanticResults && !options.includeSemanticRanking) {
        // No results and no semantic search attempted - this is a failure
        return {
          total: 0,
          hits: [],
          searchMethod: 'failed',
          performance: { total: Date.now() - startTime, elasticsearch: elasticTime },
          error: 'All search methods failed to return results'
        };
      }

      // Combine and rank results
      const combinedHits = this.combineSearchResults(
        elasticsearchResults?.hits || [],
        semanticResults?.results || [],
        options
      );

      const result: HybridSearchResult = {
        total: combinedHits.length,
        hits: combinedHits,
        searchMethod,
        performance: {
          total: Date.now() - startTime,
          elasticsearch: elasticTime,
          semantic: semanticTime
        },
        languageProcessing: {
          detectedLanguage: languageDetection.language,
          africanContext: options.optimizeForAfrica || false
        },
        africanContextWeight: semanticResults?.africanContextWeight || 1.0,
        ...(warnings.length > 0 && { warnings }),
        ...(options.compressionLevel === 'high' && { compressed: true }),
        ...(options.optimizeForMobile && { mobileOptimized: true })
      };

      // Apply mobile optimizations
      if (options.limitBandwidth) {
        result.hits = result.hits.map(hit => {
          const optimizedHit = { ...hit };
          if (optimizedHit.content) {
            optimizedHit.content = optimizedHit.content.substring(0, 200);
          }
          return optimizedHit;
        });
      }

      // Add analytics if requested
      if (options.trackAnalytics) {
        const analytics = {
          queryId: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          responseTime: result.performance.total,
          resultCount: result.total
        };
        if (options.userId) {
          (analytics as any).userId = options.userId;
        }
        result.analytics = analytics;
      }

      // Cache result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      this.logger.error('Hybrid search failed', { error, query, options });
      return {
        total: 0,
        hits: [],
        searchMethod: 'failed',
        performance: { total: Date.now() - startTime },
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Personalized search with user preferences
   */
  async personalizedSearch(
    query: string, 
    userPreferences: UserPreferences, 
    options: HybridSearchOptions
  ): Promise<HybridSearchResult> {
    const searchOptions: HybridSearchOptions = {
      ...options,
      africanLanguages: userPreferences.preferredLanguages,
      userLocation: userPreferences.location,
      userId: userPreferences.userId
    };
    
    if (userPreferences.preferredLanguages.length > 0 && userPreferences.preferredLanguages[0]) {
      searchOptions.language = userPreferences.preferredLanguages[0];
    }
    
    const result = await this.hybridSearch(query, searchOptions);

    // Apply personalization scoring
    result.hits = result.hits.map(hit => {
      let personalizationScore = hit.score;
      
      // Boost content in user's preferred languages
      if (userPreferences.preferredLanguages.includes(hit.language)) {
        personalizationScore *= 1.2;
      }

      // Boost content matching user interests
      const matchingTopics = userPreferences.interestedTopics.filter(topic =>
        hit.title.toLowerCase().includes(topic.toLowerCase()) ||
        hit.content?.toLowerCase().includes(topic.toLowerCase())
      );
      if (matchingTopics.length > 0) {
        personalizationScore *= (1 + matchingTopics.length * 0.1);
      }

      // Boost local content for user's location
      if (options.prioritizeLocalContent && hit.tags?.some(tag => 
        tag.toLowerCase().includes(userPreferences.location.toLowerCase())
      )) {
        personalizationScore *= 1.15;
      }

      return {
        ...hit,
        personalizationScore,
        hybridScore: personalizationScore
      };
    });

    // Re-sort by hybrid score
    result.hits.sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0));
    result.personalizedRanking = true;

    return result;
  }

  /**
   * Get search suggestions and autocomplete
   */
  async getSearchSuggestions(
    partialQuery: string, 
    options: { limit?: number; includeAfricanTerms?: boolean; languages?: string[] } = {}
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Basic suggestions based on partial query
    const basicSuggestions = [
      'Bitcoin', 'Ethereum', 'Cryptocurrency', 'Blockchain', 'DeFi', 
      'NFT', 'Trading', 'Price', 'Market', 'Analysis'
    ].filter(term => 
      term.toLowerCase().startsWith(partialQuery.toLowerCase())
    );

    suggestions.push(...basicSuggestions);

    // Add African context suggestions
    if (options.includeAfricanTerms) {
      const africanSuggestions = [
        'Bitcoin Africa', 'Cryptocurrency Nigeria', 'Binance Africa',
        'Bitcoin South Africa', 'Crypto Kenya', 'M-Pesa Bitcoin',
        'African Exchanges', 'Mobile Money Crypto'
      ].filter(term =>
        term.toLowerCase().includes(partialQuery.toLowerCase())
      );
      
      suggestions.push(...africanSuggestions);
    }

    return suggestions.slice(0, options.limit || 10);
  }

  /**
   * Combine Elasticsearch and semantic search results
   */
  private combineSearchResults(
    elasticHits: any[], 
    semanticHits: any[], 
    options: HybridSearchOptions
  ): any[] {
    const combined = new Map<string, any>();

    // Add Elasticsearch results
    elasticHits.forEach(hit => {
      let hybridScore = hit.score;
      
      // Boost African exchanges and mobile money content
      if (options.boostAfricanExchanges) {
        const hasAfricanTerms = this.AFRICAN_CRYPTO_TERMS.some(term =>
          hit.title?.toLowerCase().includes(term) ||
          hit.content?.toLowerCase().includes(term) ||
          hit.tags?.some((tag: string) => tag.toLowerCase().includes(term))
        );
        
        if (hasAfricanTerms) {
          hybridScore *= 1.3;
        }
      }

      combined.set(hit.id, {
        ...hit,
        hybridScore,
        searchSource: 'elasticsearch'
      });
    });

    // Add semantic results (merge or add new)
    semanticHits.forEach(hit => {
      const existing = combined.get(hit.id);
      if (existing) {
        // Merge scores
        existing.hybridScore = (existing.hybridScore + hit.semanticScore * 0.3);
        existing.semanticScore = hit.semanticScore;
        existing.searchSource = 'hybrid';
      } else {
        combined.set(hit.id, {
          ...hit,
          hybridScore: hit.semanticScore,
          searchSource: 'semantic'
        });
      }
    });

    // Convert to array and sort by hybrid score
    return Array.from(combined.values())
      .sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0));
  }

  /**
   * Clear caches (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.embeddingCache.clear();
  }
}