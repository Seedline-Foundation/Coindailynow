// RAG (Retrieval-Augmented Generation) Service for Imo
// Handles web search, content retrieval, and context building for enhanced prompts

/// <reference types="node" />
// Audit logging (stubbed for standalone usage)
const createAuditLog = async (action: string, data: any) => { /* stub */ };
const AuditActions = { RAG_SEARCH: 'rag_search' };

/**
 * Search result from web scraping
 */
export interface RAGSearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  publishedAt?: Date;
  source?: string;
  relevanceScore?: number;
}

/**
 * RAG context for prompt enhancement
 */
export interface RAGContext {
  query: string;
  results: RAGSearchResult[];
  synthesizedContext: string;
  metadata: {
    totalResults: number;
    sourcesUsed: number;
    avgRelevance: number;
    processingTime: number;
    freshness: 'realtime' | 'recent' | 'cached';
  };
}

/**
 * Search configuration
 */
export interface RAGSearchConfig {
  maxResults?: number;
  minRelevance?: number;
  includeContent?: boolean;
  sources?: ('google' | 'bing' | 'news' | 'crypto')[];
  dateRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  region?: string;
}

/**
 * RAG Service - Retrieval-Augmented Generation for real-time context
 */
export class RAGService {
  private cache: Map<string, { context: RAGContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutes for news freshness
  
  // API configurations (in production, these come from environment)
  private googleApiKey: string;
  private googleCseId: string;
  private bingApiKey: string;
  
  private isInitialized: boolean = false;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_API_KEY || '';
    this.googleCseId = process.env.GOOGLE_CSE_ID || '';
    this.bingApiKey = process.env.BING_API_KEY || '';
  }

  async initialize(): Promise<void> {
    // Validate at least one search provider is configured
    const hasProvider = this.googleApiKey || this.bingApiKey;
    
    if (!hasProvider) {
      console.warn('⚠️ RAG Service: No search API keys configured. Using fallback mode.');
    }
    
    this.isInitialized = true;
    
    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE,
      resource: 'rag_service',
      resourceId: 'rag-v1',
      details: {
        initialized: true,
        providers: {
          google: !!this.googleApiKey,
          bing: !!this.bingApiKey
        }
      }
    });
  }

  /**
   * Main entry point - Fetch RAG context for a query
   */
  async fetchContext(
    query: string, 
    config: RAGSearchConfig = {}
  ): Promise<RAGContext> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    
    // Check cache
    const cacheKey = this.generateCacheKey(query, config);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        ...cached.context,
        metadata: {
          ...cached.context.metadata,
          freshness: 'cached'
        }
      };
    }

    try {
      // Fetch from multiple sources
      const results = await this.searchMultipleSources(query, config);
      
      // Filter and rank results
      const rankedResults = this.rankResults(results, query, config.minRelevance);
      
      // Optionally fetch full content
      const enrichedResults = config.includeContent 
        ? await this.enrichWithContent(rankedResults.slice(0, config.maxResults || 10))
        : rankedResults;

      // Synthesize context for prompt injection
      const synthesizedContext = this.synthesizeContext(enrichedResults, query);

      const context: RAGContext = {
        query,
        results: enrichedResults.slice(0, config.maxResults || 10),
        synthesizedContext,
        metadata: {
          totalResults: results.length,
          sourcesUsed: enrichedResults.length,
          avgRelevance: this.calculateAvgRelevance(enrichedResults),
          processingTime: Date.now() - startTime,
          freshness: 'realtime'
        }
      };

      // Cache results
      this.cache.set(cacheKey, { context, timestamp: Date.now() });

      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'rag_context',
        resourceId: `rag-${Date.now()}`,
        details: {
          query: query.substring(0, 100),
          resultsFound: results.length,
          sourcesUsed: enrichedResults.length,
          processingTime: Date.now() - startTime
        }
      });

      return context;

    } catch (error) {
      console.error('RAG fetch error:', error);
      
      // Return empty context on error
      return {
        query,
        results: [],
        synthesizedContext: '',
        metadata: {
          totalResults: 0,
          sourcesUsed: 0,
          avgRelevance: 0,
          processingTime: Date.now() - startTime,
          freshness: 'realtime'
        }
      };
    }
  }

  /**
   * Search multiple sources in parallel
   */
  private async searchMultipleSources(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    const sources = config.sources || ['google', 'news', 'crypto'];
    const promises: Promise<RAGSearchResult[]>[] = [];

    if (sources.includes('google') && this.googleApiKey) {
      promises.push(this.searchGoogle(query, config));
    }

    if (sources.includes('bing') && this.bingApiKey) {
      promises.push(this.searchBing(query, config));
    }

    if (sources.includes('crypto')) {
      promises.push(this.searchCryptoSources(query, config));
    }

    if (sources.includes('news')) {
      promises.push(this.searchNewsSources(query, config));
    }

    // Fallback to internal sources if no API configured
    if (promises.length === 0) {
      promises.push(this.searchInternalSources(query, config));
    }

    const results = await Promise.allSettled(promises);
    
    // Flatten and deduplicate results
    const allResults: RAGSearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const item of result.value) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allResults.push(item);
          }
        }
      }
    }

    return allResults;
  }

  /**
   * Google Custom Search
   */
  private async searchGoogle(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.googleApiKey,
        cx: this.googleCseId,
        q: `${query} cryptocurrency Africa`,
        num: String(config.maxResults || 10),
        dateRestrict: this.getDateRestrict(config.dateRange)
      });

      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?${params}`
      );

      if (!response.ok) {
        throw new Error(`Google search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'google',
        publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] 
          ? new Date(item.pagemap.metatags[0]['article:published_time'])
          : undefined
      }));

    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  /**
   * Bing Search
   */
  private async searchBing(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    try {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query + ' cryptocurrency')}&count=${config.maxResults || 10}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.bingApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Bing search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.webPages?.value || []).map((item: any) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        source: 'bing',
        publishedAt: item.dateLastCrawled 
          ? new Date(item.dateLastCrawled) 
          : undefined
      }));

    } catch (error) {
      console.error('Bing search error:', error);
      return [];
    }
  }

  /**
   * Search crypto-specific sources
   */
  private async searchCryptoSources(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    // Crypto news aggregators and APIs
    const cryptoSources = [
      { name: 'CoinDesk', baseUrl: 'https://www.coindesk.com' },
      { name: 'CoinTelegraph', baseUrl: 'https://cointelegraph.com' },
      { name: 'CryptoNews', baseUrl: 'https://cryptonews.com' }
    ];

    // In production, this would make actual API calls to crypto news sources
    // For now, return empty as these would require specific API integrations
    return [];
  }

  /**
   * Search news sources
   */
  private async searchNewsSources(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    // News API integration would go here
    // In production: https://newsapi.org/v2/everything?q=query
    return [];
  }

  /**
   * Search internal database (fallback)
   */
  private async searchInternalSources(
    query: string, 
    config: RAGSearchConfig
  ): Promise<RAGSearchResult[]> {
    // Search our own database of articles
    // This would integrate with Elasticsearch or PostgreSQL full-text search
    return [];
  }

  /**
   * Rank results by relevance
   */
  private rankResults(
    results: RAGSearchResult[], 
    query: string,
    minRelevance: number = 0.3
  ): RAGSearchResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    const scored = results.map(result => {
      let score = 0;
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // Term frequency
      for (const term of queryTerms) {
        if (text.includes(term)) {
          score += 0.2;
        }
      }
      
      // Exact phrase match
      if (text.includes(query.toLowerCase())) {
        score += 0.3;
      }
      
      // Recency bonus (if we have date)
      if (result.publishedAt) {
        const daysSince = (Date.now() - result.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) score += 0.3;
        else if (daysSince < 7) score += 0.2;
        else if (daysSince < 30) score += 0.1;
      }
      
      // African content bonus
      const africanTerms = ['africa', 'african', 'nigeria', 'kenya', 'south africa', 'ghana'];
      for (const term of africanTerms) {
        if (text.includes(term)) {
          score += 0.1;
          break;
        }
      }
      
      // Normalize score
      result.relevanceScore = Math.min(score, 1);
      return result;
    });

    // Filter by minimum relevance and sort
    return scored
      .filter(r => (r.relevanceScore || 0) >= minRelevance)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Fetch full content for top results
   */
  private async enrichWithContent(
    results: RAGSearchResult[]
  ): Promise<RAGSearchResult[]> {
    const enriched = await Promise.all(
      results.map(async (result) => {
        try {
          // In production, use a web scraping service
          // For now, just return snippet as content
          return {
            ...result,
            content: result.snippet
          };
        } catch {
          return result;
        }
      })
    );

    return enriched;
  }

  /**
   * Synthesize context for prompt injection
   */
  private synthesizeContext(
    results: RAGSearchResult[], 
    query: string
  ): string {
    if (results.length === 0) {
      return '';
    }

    const contextParts: string[] = [
      `CONTEXT FROM RECENT SOURCES (Query: "${query}"):\n`
    ];

    results.slice(0, 5).forEach((result, idx) => {
      contextParts.push(
        `[Source ${idx + 1}] ${result.title}`,
        `URL: ${result.url}`,
        `Content: ${result.content || result.snippet}`,
        `Relevance: ${((result.relevanceScore || 0) * 100).toFixed(0)}%`,
        ''
      );
    });

    contextParts.push(
      '\nINSTRUCTIONS:',
      '- Prioritize information from these sources',
      '- Cite source numbers when referencing specific facts',
      '- Indicate if information conflicts between sources',
      '- Note when falling back to general knowledge'
    );

    return contextParts.join('\n');
  }

  /**
   * Helper methods
   */
  private generateCacheKey(query: string, config: RAGSearchConfig): string {
    return `${query}-${JSON.stringify(config)}`;
  }

  private getDateRestrict(dateRange?: string): string {
    const ranges: Record<string, string> = {
      day: 'd1',
      week: 'w1',
      month: 'm1',
      year: 'y1',
      all: ''
    };
    return ranges[dateRange || 'week'] || 'w1';
  }

  private calculateAvgRelevance(results: RAGSearchResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + (r.relevanceScore || 0), 0);
    return sum / results.length;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; providers: Record<string, boolean> }> {
    return {
      healthy: this.isInitialized,
      providers: {
        google: !!this.googleApiKey,
        bing: !!this.bingApiKey
      }
    };
  }
}

// Export singleton
export const ragService = new RAGService();
