import { CacheService } from '../../src/middleware/cache';
import { logger } from '../../src/utils/logger';

describe('Redis Caching Layer - Task 4 Implementation', () => {
  let mockRedis: any;
  let cacheService: CacheService;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        setex: jest.fn(),
        exec: jest.fn().mockResolvedValue([])
      }),
      multi: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      exists: jest.fn(),
      ping: jest.fn(),
      flushdb: jest.fn(),
      info: jest.fn(),
      memory: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    };
    
    cacheService = new CacheService(mockRedis);
    cacheService.resetMetrics();
  });

  describe('Cache Hit/Miss Tests - Task 4 Requirements', () => {
    it('should track cache hits accurately', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'cached article' }));

      const result = await cacheService.get('article:123');
      const metrics = cacheService.getMetrics();

      expect(result).toEqual({ data: 'cached article' });
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.hitRate).toBe(100);
    });

    it('should achieve 75%+ cache hit rate target', async () => {
      // Simulate 8 hits and 2 misses (80% hit rate)
      const responses = [
        JSON.stringify({ data: 'hit1' }), // hit
        JSON.stringify({ data: 'hit2' }), // hit
        JSON.stringify({ data: 'hit3' }), // hit
        null, // miss
        JSON.stringify({ data: 'hit4' }), // hit
        JSON.stringify({ data: 'hit5' }), // hit
        JSON.stringify({ data: 'hit6' }), // hit
        null, // miss
        JSON.stringify({ data: 'hit7' }), // hit
        JSON.stringify({ data: 'hit8' }), // hit
      ];

      mockRedis.get.mockImplementation(() => {
        return Promise.resolve(responses.shift());
      });

      // Execute cache operations
      for (let i = 0; i < 10; i++) {
        await cacheService.get(`key${i}`);
      }

      const metrics = cacheService.getMetrics();
      expect(metrics.hitRate).toBeGreaterThanOrEqual(75);
      expect(metrics.hits).toBe(8);
      expect(metrics.misses).toBe(2);
      expect(metrics.totalRequests).toBe(10);
    });
  });

  describe('TTL Validation Tests - Task 4 Requirements', () => {
    it('should implement article caching with 1 hour TTL', async () => {
      const articleData = { id: 1, title: 'Test Article', content: 'Content' };
      
      await cacheService.set('article:1', articleData, 3600);

      expect(mockRedis.setex).toHaveBeenCalledWith('coindaily:article:1', 3600, JSON.stringify(articleData));
    });

    it('should implement market data caching with 30 seconds TTL', async () => {
      const marketData = { btc: 50000, eth: 3000, timestamp: Date.now() };
      
      await cacheService.set('market:prices', marketData, 30);

      expect(mockRedis.setex).toHaveBeenCalledWith('coindaily:market:prices', 30, JSON.stringify(marketData));
    });

    it('should implement user data caching with 5 minutes TTL', async () => {
      const userData = { id: 1, username: 'testuser', email: 'test@example.com' };
      
      await cacheService.set('user:1', userData, 300);

      expect(mockRedis.setex).toHaveBeenCalledWith('coindaily:user:1', 300, JSON.stringify(userData));
    });

    it('should implement AI content caching with 2 hours TTL', async () => {
      const aiContent = { 
        content: 'AI generated article',
        confidence: 0.95,
        model: 'gpt-4-turbo'
      };
      
      await cacheService.set('ai:content:1', aiContent, 7200);

      expect(mockRedis.setex).toHaveBeenCalledWith('coindaily:ai:content:1', 7200, JSON.stringify(aiContent));
    });

    it('should automatically select correct TTL based on operation type', () => {
      const testCases = [
        { operation: 'article', expectedTTL: 3600 },
        { operation: 'articles', expectedTTL: 3600 },
        { operation: 'featuredArticles', expectedTTL: 3600 },
        { operation: 'marketData', expectedTTL: 30 },
        { operation: 'market', expectedTTL: 30 },
        { operation: 'token', expectedTTL: 300 },
        { operation: 'user', expectedTTL: 300 },
        { operation: 'me', expectedTTL: 300 },
        { operation: 'ai', expectedTTL: 7200 },
        { operation: 'aiContent', expectedTTL: 7200 },
        { operation: 'categories', expectedTTL: 7200 },
        { operation: 'search', expectedTTL: 600 },
      ];

      testCases.forEach(({ operation, expectedTTL }) => {
        const ttl = (cacheService as any).getTTLByOperation(operation);
        expect(ttl).toBe(expectedTTL);
      });
    });
  });

  describe('Performance Benchmarks - Task 4 Requirements', () => {
    it('should achieve sub-500ms cache operations', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'fast response' }));

      const startTime = process.hrtime.bigint();
      await cacheService.get('performance:test');
      const endTime = process.hrtime.bigint();

      const responseTimeMs = Number(endTime - startTime) / 1000000;
      expect(responseTimeMs).toBeLessThan(500);
    });

    it('should support batch operations for improved performance', async () => {
      const batchItems = [
        { key: 'batch:1', data: { id: 1 }, ttl: 3600 },
        { key: 'batch:2', data: { id: 2 }, ttl: 1800 },
        { key: 'batch:3', data: { id: 3 }, ttl: 900 }
      ];

      await cacheService.setBatch(batchItems);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      const pipeline = mockRedis.pipeline();
      expect(pipeline.exec).toHaveBeenCalled();
    });

    it('should support cache warming for popular content', async () => {
      const warmupData = [
        { key: 'popular:article:1', data: { views: 1000 } },
        { key: 'trending:tag:crypto', data: { count: 500 } }
      ];

      mockRedis.setex.mockResolvedValue('OK');
      await cacheService.warmCache(warmupData);

      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multi-layer Caching Features - Task 4 Requirements', () => {
    it('should handle cache invalidation by pattern', async () => {
      mockRedis.keys.mockResolvedValue([
        'coindaily:article:1',
        'coindaily:article:2',
        'coindaily:featuredArticles:all'
      ]);
      mockRedis.del.mockResolvedValue(3);

      await cacheService.invalidateContent('article');

      expect(mockRedis.keys).toHaveBeenCalledWith('coindaily:article*');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'coindaily:article:1',
        'coindaily:article:2',
        'coindaily:featuredArticles:all'
      );
    });

    it('should support memory usage monitoring', async () => {
      mockRedis.info.mockResolvedValue('used_memory_human:2.50M\r\nused_memory:2621440');

      const memoryInfo = await cacheService.getMemoryUsage();

      expect(mockRedis.info).toHaveBeenCalledWith('memory');
      expect(memoryInfo.usedMemoryHuman).toBe('2.50M');
      expect(memoryInfo.usedMemory).toBe(2621440);
    });

    it('should provide comprehensive metrics and monitoring', async () => {
      // Simulate mixed operations
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify({ hit: 1 }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({ hit: 2 }));

      await cacheService.get('metrics:1');
      await cacheService.get('metrics:2');
      await cacheService.get('metrics:3');

      const metrics = cacheService.getMetrics();

      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBeCloseTo(66.67, 1);
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('lastReset');
    });
  });

  describe('African Market Specific Caching - Task 4 Requirements', () => {
    it('should cache African exchange data with appropriate TTL', async () => {
      const africanExchangeData = {
        luno: { btc: 850000, eth: 50000 }, // ZAR prices
        quidax: { btc: 25000000, eth: 1500000 }, // NGN prices
        binanceAfrica: { btc: 50000, eth: 3000 } // USD prices
      };

      await cacheService.cacheAfricanExchangeData('luno', africanExchangeData.luno);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'coindaily:african:luno',
        30, // 30 seconds for African exchange data
        JSON.stringify(africanExchangeData.luno)
      );
    });

    it('should cache mobile money correlation data', async () => {
      const mobileMoneyData = {
        rate: 150,
        available: true,
        provider: 'mpesa'
      };

      await cacheService.cacheMobileMoneyRates('mpesa', mobileMoneyData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'coindaily:mobile:mpesa',
        300, // 5 minutes for mobile money rates
        JSON.stringify(mobileMoneyData)
      );
    });

    it('should handle multi-language content caching', async () => {
      const multiLangContent = {
        en: 'Bitcoin reaches new high',
        sw: 'Bitcoin inafikia kiwango kipya cha juu',
        fr: 'Bitcoin atteint un nouveau sommet',
        ha: 'Bitcoin ya kai sabon matsayi'
      };

      await cacheService.cacheMultiLanguageContent('1', 'sw', multiLangContent.sw);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'coindaily:multilang:article:1:sw',
        3600, // 1 hour for multi-language content
        JSON.stringify(multiLangContent.sw)
      );
    });

    it('should support African market performance monitoring', async () => {
      // Simulate good performance for African networks
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'test' }));
      
      for (let i = 0; i < 10; i++) {
        await cacheService.get(`african:test:${i}`);
      }

      const performanceMetrics = await cacheService.monitorPerformance();

      expect(performanceMetrics.cacheHitRate).toBe(100);
      expect(performanceMetrics.africanOptimized).toBe(true); // Above 75% threshold
    });
  });

  describe('Error Handling and Resilience - Task 4 Requirements', () => {
    it('should handle Redis connection failures gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheService.get('error:key');
      const metrics = cacheService.getMetrics();

      expect(result).toBeNull();
      expect(metrics.misses).toBe(1);
      expect(metrics.errors).toBe(1);
    });

    it('should handle cache set failures gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis write failed'));

      await expect(cacheService.set('error:key', { data: 'test' })).resolves.not.toThrow();
      
      const metrics = cacheService.getMetrics();
      expect(metrics.errors).toBe(1);
    });

    it('should provide health check capabilities', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const health = await cacheService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.latency).toBeLessThan(1000);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Redis unavailable'));

      const health = await cacheService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.latency).toBe(-1);
      expect(health.error).toBe('Redis unavailable');
    });
  });
});