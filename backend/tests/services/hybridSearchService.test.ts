/**
 * Hybrid Search Service Tests
 * Task 16: Test suite for hybrid search combining Elasticsearch and AI
 */

import { HybridSearchService, SearchResultType, HybridSearchOptions } from '../../src/services/hybridSearchService';
import { ElasticsearchService, SearchResult } from '../../src/services/elasticsearchService';
import OpenAI from 'openai';

// Mock implementations
const mockElasticsearchService = {
  searchArticles: jest.fn(),
  indexExists: jest.fn().mockResolvedValue(true),
  health: jest.fn().mockResolvedValue({ status: 'green' })
} as any;

const mockOpenAI = {
  embeddings: {
    create: jest.fn()
  }
} as any;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

describe('HybridSearchService', () => {
  let hybridSearchService: HybridSearchService;
  let mockEmbedding: number[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock embedding vector (1536 dimensions for OpenAI)
    mockEmbedding = new Array(1536).fill(0.1);
    
    hybridSearchService = new HybridSearchService(
      mockElasticsearchService,
      mockOpenAI,
      mockLogger
    );

    // Default mock for OpenAI embeddings
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: mockEmbedding }]
    });
  });

  describe('Semantic Search', () => {
    test('should generate embeddings for search query', async () => {
      const query = 'Bitcoin price in Nigeria';
      const mockEmbedding = new Array(1536).fill(0.1);
      
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      });

      const result = await hybridSearchService.generateEmbedding(query);
      
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      });
      expect(result).toEqual(mockEmbedding);
    });

    test('should handle African language queries', async () => {
      const queries = [
        'Prix du Bitcoin au Sénégal', // French
        'Precio de Bitcoin en Ghana', // Spanish
        'سعر البيتكوين في مصر', // Arabic
        'Bitcoin prys in Suid-Afrika' // Afrikaans
      ];

      for (const query of queries) {
        mockOpenAI.embeddings.create.mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        });

        const result = await hybridSearchService.generateEmbedding(query);
        expect(result).toHaveLength(1536);
      }
    });

    test('should optimize embeddings for African context', async () => {
      const africanContextQuery = 'mobile money cryptocurrency integration M-Pesa';
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.2) }]
      });

      const result = await hybridSearchService.semanticSearch(africanContextQuery, {
        includeAfricanContext: true,
        languages: ['en', 'sw', 'fr'],
        optimizeForMobile: true
      });
      
      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
      expect(result.africanContextWeight).toBeGreaterThan(1);
    });
  });

  describe('Hybrid Search Integration', () => {
    test('should combine Elasticsearch and semantic search results', async () => {
      const query = 'Binance Africa trading volume';
      
      // Mock Elasticsearch results
      const elasticResults = {
        total: 2,
        hits: [
          {
            id: '1',
            title: 'Binance Africa Expansion',
            content: 'Binance launches new services in Africa',
            score: 0.95,
            language: 'en'
          }
        ],
        took: 15
      };

      mockElasticsearchService.searchArticles.mockResolvedValue(elasticResults);
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        includeSemanticRanking: true,
        africanLanguages: ['en', 'fr', 'sw']
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.hits.length).toBeGreaterThan(0);
      expect(result.searchMethod).toBe('hybrid');
      expect(result.performance.total).toBeLessThan(500); // Sub-500ms requirement
    });

    test('should handle African language query processing', async () => {
      const africanQueries = [
        { query: 'Habari za Bitcoin', language: 'sw', country: 'KE' },
        { query: 'Nouvelles Bitcoin', language: 'fr', country: 'SN' },
        { query: 'Bitcoin nuus', language: 'af', country: 'ZA' },
        { query: 'Bitcoin news', language: 'en', country: 'NG' }
      ];

      for (const { query, language, country } of africanQueries) {
        mockElasticsearchService.searchArticles.mockResolvedValue({
          total: 1,
          hits: [{ id: '1', title: 'Test', score: 0.8, language }],
          took: 10
        });

        const result = await hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES,
          language,
          optimizeForAfrica: true,
          userLocation: country
        });

        expect(result.languageProcessing?.detectedLanguage).toBeDefined();
        expect(result.languageProcessing?.africanContext).toBe(true);
      }
    });
  });

  describe('Performance Optimization', () => {
    test('should achieve sub-500ms response times', async () => {
      const query = 'Bitcoin price Nigeria';
      const startTime = Date.now();

      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
        took: 15
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        maxResponseTime: 500
      });

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(result.performance.total).toBeLessThan(500);
      expect(result.performance.elasticsearch).toBeDefined();
    });

    test('should implement intelligent caching for repeated queries', async () => {
      const query = 'popular Bitcoin query';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
        took: 20
      });

      // First request
      const result1 = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES
      });

      // Second request should use cache
      const result2 = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES
      });

      expect(result2.cached).toBe(true);
      expect(result2.performance.total).toBeLessThanOrEqual(result1.performance.total);
    });

    test('should gracefully degrade when semantic search fails', async () => {
      const query = 'Bitcoin news';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
        took: 15
      });

      // Simulate semantic search failure
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API timeout'));

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        includeSemanticRanking: true,
        fallbackToElastic: true
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.searchMethod).toBe('elasticsearch_fallback');
      expect(result.warnings).toContain('semantic_search_failed');
    });
  });

  describe('African Market Features', () => {
    test('should boost African exchange and mobile money content', async () => {
      const query = 'cryptocurrency trading';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 3,
        hits: [
          { 
            id: '1', 
            title: 'Binance Africa Trading', 
            content: 'Binance Africa M-Pesa integration',
            score: 0.7, 
            language: 'en',
            tags: ['binance-africa', 'm-pesa']
          },
          { 
            id: '2', 
            title: 'Global Crypto Trading', 
            content: 'International crypto markets',
            score: 0.9, 
            language: 'en' 
          }
        ],
        took: 20
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        optimizeForAfrica: true,
        boostAfricanExchanges: true
      });

      // African content should be boosted despite lower original score
      const africanResult = result.hits.find((hit: any) => hit.tags?.includes('binance-africa'));
      const globalResult = result.hits.find((hit: any) => hit.title.includes('Global'));
      
      expect(africanResult?.hybridScore).toBeGreaterThan(globalResult?.hybridScore || 0);
    });

    test('should handle low-bandwidth optimization', async () => {
      const query = 'Bitcoin news';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ 
          id: '1', 
          title: 'Test', 
          content: 'Very long content that should be truncated for mobile optimization and bandwidth limiting to ensure fast loading on African mobile networks',
          score: 0.8, 
          language: 'en' 
        }],
        took: 10
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        optimizeForMobile: true,
        limitBandwidth: true,
        compressionLevel: 'high'
      });

      expect(result.compressed).toBe(true);
      expect(result.mobileOptimized).toBe(true);
      // Should return smaller response payloads
      result.hits.forEach((hit: any) => {
        if (hit.content) {
          expect(hit.content.length).toBeLessThanOrEqual(200);
        }
      });
    });
  });

  describe('Search Analytics', () => {
    test('should track search performance metrics', async () => {
      const query = 'Bitcoin Africa';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
        took: 25
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        trackAnalytics: true,
        userId: 'user-123'
      });

      expect(result.analytics).toBeDefined();
      expect(result.analytics?.queryId).toBeDefined();
      expect(result.analytics?.responseTime).toBeLessThan(500);
      expect(result.analytics?.resultCount).toBe(1);
    });

    test('should provide search suggestions and autocomplete', async () => {
      const partialQuery = 'Bit';
      
      const suggestions = await hybridSearchService.getSearchSuggestions(partialQuery, {
        limit: 5,
        includeAfricanTerms: true,
        languages: ['en', 'fr', 'sw']
      });

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s: string) => s.includes('Bitcoin'))).toBe(true);
      // Should include African context suggestions
      expect(suggestions.some((s: string) => s.toLowerCase().includes('africa'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const query = 'Bitcoin news';
      
      mockElasticsearchService.searchArticles.mockRejectedValue(new Error('Network timeout'));

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        timeout: 1000
      });

      expect(result.error).toBeDefined();
      expect(result.total).toBe(0);
      expect(result.searchMethod).toBe('failed');
    });

    test('should validate search parameters', async () => {
      const invalidQueries = ['', ' ', undefined as any, null as any];
      
      for (const query of invalidQueries) {
        const result = await hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES
        });
        
        expect(result.error).toContain('Invalid query');
        expect(result.total).toBe(0);
      }
    });
  });
});
