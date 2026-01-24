/**
 * Hybrid Search Performance Tests
 * Task 16: Performance validation for sub-500ms response times
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HybridSearchService, SearchResultType } from '../../src/services/hybridSearchService';

// Mock dependencies
const mockElasticsearchService = {
  searchArticles: jest.fn()
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

describe('HybridSearchService - Performance Tests', () => {
  let hybridSearchService: HybridSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    hybridSearchService = new HybridSearchService(
      mockElasticsearchService as any,
      mockOpenAI as any,
      mockLogger
    );
  });

  afterEach(() => {
    hybridSearchService.clearCache();
  });

  describe('Sub-500ms Response Time Requirements', () => {
    test('should achieve sub-500ms for simple article search', async () => {
      const query = 'Bitcoin Nigeria';
      const startTime = performance.now();
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [
          { id: '1', title: 'Bitcoin News Nigeria', score: 0.8, language: 'en' }
        ],
        took: 45
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        maxResponseTime: 500
      });

      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(result.performance.total).toBeLessThan(500);
      expect(result.error).toBeUndefined();
    });

    test('should achieve sub-500ms for African language queries', async () => {
      const africanQueries = [
        'Habari za Bitcoin',    // Swahili
        'Nouvelles Bitcoin',   // French
        'Bitcoin nuus',        // Afrikaans
        'أخبار البيتكوين'      // Arabic
      ];

      for (const query of africanQueries) {
        const startTime = performance.now();
        
        mockElasticsearchService.searchArticles.mockResolvedValue({
          total: 1,
          hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
          took: 35
        });

        const result = await hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES,
          optimizeForAfrica: true,
          maxResponseTime: 500
        });

        const responseTime = performance.now() - startTime;
        
        expect(responseTime).toBeLessThan(500);
        expect(result.performance.total).toBeLessThan(500);
        expect(result.languageProcessing?.africanContext).toBe(true);
      }
    });

    test('should achieve sub-500ms with semantic search enabled', async () => {
      const query = 'cryptocurrency mobile money Africa';
      const startTime = performance.now();
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 2,
        hits: [
          { id: '1', title: 'Crypto Mobile Money', score: 0.9, language: 'en' },
          { id: '2', title: 'Africa Blockchain', score: 0.8, language: 'en' }
        ],
        took: 120
      });

      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      });

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        includeSemanticRanking: true,
        optimizeForAfrica: true,
        maxResponseTime: 500
      });

      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(result.performance.total).toBeLessThan(500);
      expect(result.performance.elasticsearch).toBeDefined();
      expect(result.performance.semantic).toBeDefined();
    });

    test('should handle timeout gracefully when response exceeds limit', async () => {
      const query = 'slow query test';
      
      // Simulate slow Elasticsearch response
      mockElasticsearchService.searchArticles.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 600))
      );

      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        maxResponseTime: 500,
        fallbackToElastic: true
      });

      // Should still return results or graceful degradation
      expect(result.performance.total).toBeGreaterThan(500);
      expect(result.warnings || result.error).toBeDefined();
    });
  });

  describe('Caching Performance', () => {
    test('should achieve sub-50ms for cached queries', async () => {
      const query = 'popular cached query';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
        took: 100
      });

      // First request (cache miss)
      const result1 = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES
      });
      
      expect(result1.cached).toBeFalsy();

      // Second request (cache hit)
      const startTime = performance.now();
      const result2 = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES
      });
      const cacheResponseTime = performance.now() - startTime;

      expect(result2.cached).toBe(true);
      expect(cacheResponseTime).toBeLessThan(50);
      expect(result2.performance.total).toBeLessThan(50);
    });

    test('should maintain cache efficiency across multiple queries', async () => {
      const queries = [
        'Bitcoin price Nigeria',
        'Ethereum Kenya',
        'DeFi South Africa',
        'Mobile money crypto',
        'Binance Africa'
      ];

      // Warm up cache
      for (const query of queries) {
        mockElasticsearchService.searchArticles.mockResolvedValue({
          total: 1,
          hits: [{ id: query.replace(' ', '-'), title: query, score: 0.8, language: 'en' }],
          took: 80
        });

        await hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES
        });
      }

      // Test cached performance
      const cachedResults = [];
      for (const query of queries) {
        const startTime = performance.now();
        const result = await hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES
        });
        const responseTime = performance.now() - startTime;
        
        cachedResults.push({ query, responseTime, cached: result.cached });
        
        expect(result.cached).toBe(true);
        expect(responseTime).toBeLessThan(50);
      }

      // Verify all queries were served from cache efficiently
      const averageCachedTime = cachedResults.reduce((sum, r) => sum + r.responseTime, 0) / cachedResults.length;
      expect(averageCachedTime).toBeLessThan(25);
    });
  });

  describe('Load Performance', () => {
    test('should handle concurrent searches efficiently', async () => {
      const concurrentQueries = [
        'Bitcoin news Africa',
        'Ethereum price Kenya',
        'DeFi Nigeria trends',
        'Crypto South Africa',
        'Blockchain Ghana news'
      ];

      mockElasticsearchService.searchArticles.mockImplementation((query: string) => 
        Promise.resolve({
          total: 1,
          hits: [{ id: query.replace(' ', '-'), title: query, score: 0.8, language: 'en' }],
          took: Math.random() * 100 + 50 // 50-150ms random
        })
      );

      const startTime = performance.now();
      
      const promises = concurrentQueries.map(query =>
        hybridSearchService.hybridSearch(query, {
          type: SearchResultType.ARTICLES,
          maxResponseTime: 500
        })
      );

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      // All requests should complete within reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second for 5 concurrent requests
      
      // Each individual result should meet performance requirements
      results.forEach((result, index) => {
        expect(result.performance.total).toBeLessThan(500);
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.error).toBeUndefined();
      });
    });

    test('should maintain performance under simulated high load', async () => {
      const highLoadQueries = Array.from({ length: 20 }, (_, i) => 
        `Bitcoin query ${i} Africa`
      );

      mockElasticsearchService.searchArticles.mockImplementation(() => 
        Promise.resolve({
          total: 1,
          hits: [{ id: '1', title: 'Test', score: 0.8, language: 'en' }],
          took: 75
        })
      );

      const startTime = performance.now();
      
      // Execute queries in batches to simulate realistic load
      const batchSize = 5;
      const results = [];
      
      for (let i = 0; i < highLoadQueries.length; i += batchSize) {
        const batch = highLoadQueries.slice(i, i + batchSize);
        const batchPromises = batch.map(query =>
          hybridSearchService.hybridSearch(query, {
            type: SearchResultType.ARTICLES,
            maxResponseTime: 500
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const totalTime = performance.now() - startTime;
      
      // Should handle high load efficiently
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 20 queries in batches
      
      // Performance should remain consistent
      const averageResponseTime = results.reduce((sum, r) => sum + r.performance.total, 0) / results.length;
      expect(averageResponseTime).toBeLessThan(500);
      
      // Should have minimal failures
      const failedQueries = results.filter(r => r.error || r.total === 0);
      expect(failedQueries.length).toBeLessThan(results.length * 0.1); // Less than 10% failure rate
    });
  });

  describe('Mobile Optimization Performance', () => {
    test('should achieve faster response times with mobile optimization', async () => {
      const query = 'Bitcoin mobile money Kenya';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{
          id: '1',
          title: 'Bitcoin Mobile Money Kenya',
          content: 'Very long content that should be optimized for mobile delivery and reduced bandwidth usage in African mobile networks with limited data plans',
          score: 0.8,
          language: 'en'
        }],
        took: 90
      });

      const startTime = performance.now();
      
      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        optimizeForMobile: true,
        limitBandwidth: true,
        compressionLevel: 'high'
      });

      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(400); // Even faster than normal
      expect(result.mobileOptimized).toBe(true);
      expect(result.compressed).toBe(true);
      
      // Should have reduced content size for bandwidth optimization
      result.hits.forEach((hit: any) => {
        if (hit.content) {
          expect(hit.content.length).toBeLessThanOrEqual(200);
        }
      });
    });
  });

  describe('Error Recovery Performance', () => {
    test('should fail fast when services are unavailable', async () => {
      const query = 'Bitcoin news';
      
      mockElasticsearchService.searchArticles.mockRejectedValue(
        new Error('Service unavailable')
      );

      const startTime = performance.now();
      
      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        timeout: 1000
      });

      const responseTime = performance.now() - startTime;
      
      // Should fail quickly rather than hanging
      expect(responseTime).toBeLessThan(200);
      expect(result.error).toBeDefined();
      expect(result.searchMethod).toBe('failed');
    });

    test('should fallback gracefully with acceptable performance', async () => {
      const query = 'Bitcoin Africa news';
      
      mockElasticsearchService.searchArticles.mockResolvedValue({
        total: 1,
        hits: [{ id: '1', title: 'Bitcoin Africa', score: 0.8, language: 'en' }],
        took: 100
      });

      // Simulate semantic search failure
      mockOpenAI.embeddings.create.mockRejectedValue(
        new Error('OpenAI API timeout')
      );

      const startTime = performance.now();
      
      const result = await hybridSearchService.hybridSearch(query, {
        type: SearchResultType.ARTICLES,
        includeSemanticRanking: true,
        fallbackToElastic: true
      });

      const responseTime = performance.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(result.searchMethod).toBe('elasticsearch_fallback');
      expect(result.warnings).toContain('semantic_search_failed');
      expect(result.total).toBeGreaterThan(0); // Should still return results
    });
  });
});
