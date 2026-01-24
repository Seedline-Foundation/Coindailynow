import { performance } from 'perf_hooks';
import { CacheService } from '../../src/middleware/cache';
import { logger } from '../../src/utils/logger';

describe('Cache Middleware Performance Tests', () => {
  let mockRedis: any;
  let cacheService: CacheService;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
    };
    
    cacheService = new CacheService(mockRedis);
  });

  describe('Cache Performance Requirements', () => {
    it('should achieve sub-500ms response times', async () => {
      // Mock fast cache hit
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'cached data' }));
      
      const startTime = performance.now();
      const result = await cacheService.get('test-key');
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(result).toEqual({ data: 'cached data' });
    });

    it('should maintain 75%+ cache hit rate target', async () => {
      // Simulate cache hits and misses
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit1' }))
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit2' }))
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit3' }))
        .mockResolvedValueOnce(null); // miss
      
      // Execute cache operations
      await cacheService.get('key1');
      await cacheService.get('key2');
      await cacheService.get('key3');
      await cacheService.get('key4');
      
      const metrics = cacheService.getMetrics();
      
      expect(metrics.hitRate).toBeGreaterThanOrEqual(75);
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(4);
    });

    it('should enforce one I/O operation per request', async () => {
      const mockResolver = jest.fn().mockResolvedValue({ data: 'test' });
      const cachedResolver = cacheService.cacheResolver('test', mockResolver);
      
      // First call should execute resolver (I/O operation)
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.setex.mockResolvedValueOnce('OK');
      
      await cachedResolver({ id: 'test' }, { user: null }, {});
      
      // Second call should use cache (no additional I/O)
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));
      
      await cachedResolver({ id: 'test' }, { user: null }, {});
      
      // Resolver should only be called once
      expect(mockResolver).toHaveBeenCalledTimes(1);
      expect(mockRedis.get).toHaveBeenCalledTimes(2);
    });

    it('should implement appropriate TTL values for content types', () => {
      const testCases = [
        { operation: 'article', expectedTTL: 3600 },
        { operation: 'marketData', expectedTTL: 30 },
        { operation: 'user', expectedTTL: 300 },
        { operation: 'categories', expectedTTL: 7200 },
        { operation: 'search', expectedTTL: 600 },
      ];

      testCases.forEach(({ operation, expectedTTL }) => {
        const ttl = (cacheService as any).getTTLByOperation(operation);
        expect(ttl).toBe(expectedTTL);
      });
    });

    it('should handle cache invalidation correctly', async () => {
      mockRedis.keys.mockResolvedValue(['article:1', 'article:2', 'featuredArticles:all']);
      mockRedis.del.mockResolvedValue(3);

      await cacheService.invalidateContent('article');

      expect(mockRedis.keys).toHaveBeenCalledWith('coindaily:article*');
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('African Market-Specific Caching', () => {
    it('should cache African exchange data with short TTL', () => {
      const marketDataTTL = (cacheService as any).getTTLByOperation('marketData');
      expect(marketDataTTL).toBe(30); // 30 seconds for real-time market data
    });

    it('should cache African content with appropriate regional context', async () => {
      const mockAfricanArticle = {
        id: 'article-1',
        title: 'Bitcoin in Nigeria',
        content: 'Cryptocurrency adoption in Nigeria',
        tags: ['nigeria', 'bitcoin', 'africa'],
      };

      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      const resolver = jest.fn().mockResolvedValue(mockAfricanArticle);
      const cachedResolver = cacheService.cacheResolver('article', resolver, { ttl: 3600 });

      const result = await cachedResolver({ id: 'article-1' }, { user: null }, {});

      expect(result).toEqual(mockAfricanArticle);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('article'),
        3600,
        JSON.stringify(mockAfricanArticle)
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times accurately', async () => {
      mockRedis.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      const startTime = performance.now();
      await cacheService.get('slow-key');
      const endTime = performance.now();

      const metrics = cacheService.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(90); // Account for timing variance
      expect(metrics.averageResponseTime).toBeLessThan(200);
    });

    it('should provide comprehensive metrics', () => {
      const metrics = cacheService.getMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('lastReset');
      
      expect(typeof metrics.hits).toBe('number');
      expect(typeof metrics.misses).toBe('number');
      expect(typeof metrics.hitRate).toBe('number');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(metrics.lastReset).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle Redis connection failures', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw, should return null gracefully
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should continue operation when cache set fails', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockRejectedValue(new Error('Redis set failed'));

      const resolver = jest.fn().mockResolvedValue({ data: 'test' });
      const cachedResolver = cacheService.cacheResolver('test', resolver);

      // Should not throw, should return resolver result
      const result = await cachedResolver({}, { user: null }, {});
      expect(result).toEqual({ data: 'test' });
      expect(resolver).toHaveBeenCalledTimes(1);
    });

    it('should handle cache key generation for complex arguments', () => {
      const complexArgs = {
        filters: { categories: ['news', 'analysis'], isPremium: true },
        pagination: { limit: 20, offset: 40 },
        sort: { field: 'publishedAt', order: 'desc' },
      };

      const key1 = (cacheService as any).generateKey('articles', complexArgs, 'user-123');
      const key2 = (cacheService as any).generateKey('articles', complexArgs, 'user-123');
      const key3 = (cacheService as any).generateKey('articles', complexArgs, 'user-456');

      // Same args and user should generate same key
      expect(key1).toBe(key2);
      
      // Different user should generate different key
      expect(key1).not.toBe(key3);
      
      // Keys should be deterministic and hashed
      expect(key1).toMatch(/^coindaily:articles:/);
      expect(key1.length).toBeGreaterThan(20); // Should be hashed/shortened
      expect(key3.length).toBeGreaterThan(20); // Should be hashed/shortened
      
      // Both keys should have same prefix but different suffixes
      expect(key1.startsWith('coindaily:articles:')).toBeTruthy();
      expect(key3.startsWith('coindaily:articles:')).toBeTruthy();
      expect(key1.split(':')[2]).not.toBe(key3.split(':')[2]); // Different hash parts
    });
  });
});