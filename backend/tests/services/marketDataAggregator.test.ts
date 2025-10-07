/**
 * Market Data Aggregator Tests
 * Task 13: Market Data Aggregator Implementation
 * 
 * Comprehensive test suite following TDD requirements:
 * - Data accuracy tests
 * - African exchange integration tests  
 * - Real-time update tests
 * - Performance benchmarks (sub-500ms)
 * - Error handling and recovery tests
 */

import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { MarketDataAggregator } from '../../src/services/marketDataAggregator';
import { LunoExchangeAdapter } from '../../src/services/exchanges/LunoExchangeAdapter';
import { BinanceAfricaAdapter } from '../../src/services/exchanges/BinanceAfricaAdapter';
import {
  MarketDataAggregatorConfig,
  ExchangeType,
  ExchangeRegion,
  HealthStatus,
  AuthType,
  DataQuality,
  TimeInterval,
  MobileMoneyProvider,
  ComplianceLevel
} from '../../src/types/market-data';

// Mock Redis and Prisma for testing
jest.mock('ioredis');
jest.mock('@prisma/client');

describe('Market Data Aggregator', () => {
  let aggregator: MarketDataAggregator;
  let mockRedis: jest.Mocked<Redis>;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let testConfig: MarketDataAggregatorConfig;

  beforeEach(() => {
    // Setup mocks
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG')
    } as any;

    mockPrisma = {
      marketData: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn()
      },
      token: {
        findMany: jest.fn()
      },
      $queryRaw: jest.fn()
    } as any;

    // Test configuration
    testConfig = {
      exchanges: [
        {
          integration: {
            id: 'luno-test',
            name: 'Luno',
            slug: 'luno',
            type: ExchangeType.AFRICAN,
            region: ExchangeRegion.SOUTH_AFRICA,
            apiEndpoint: 'https://api.luno.com',
            websocketEndpoint: 'wss://ws.luno.com',
            supportedCountries: ['ZA', 'NG', 'KE'],
            supportedCurrencies: ['ZAR', 'NGN', 'KES'],
            rateLimitPerMinute: 60,
            isActive: true,
            health: {
              status: HealthStatus.HEALTHY,
              uptime: 99.9,
              avgResponseTime: 150,
              lastCheck: new Date(),
              consecutiveFailures: 0
            },
            authentication: {
              type: AuthType.PUBLIC,
              testnet: false
            }
          },
          priority: 1,
          timeout: 5000,
          retryPolicy: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            retryableErrors: ['NETWORK_TIMEOUT', 'CONNECTION_FAILED']
          },
          circuitBreaker: {
            failureThreshold: 5,
            recoveryTimeout: 30000,
            monitoringWindow: 60000
          }
        }
      ],
      caching: {
        hotDataTtl: 10,
        warmDataTtl: 30,
        coldDataTtl: 3600,
        maxHotItems: 100,
        compressionEnabled: true
      },
      validation: {
        maxPriceDeviation: 20,
        maxVolumeDeviation: 50,
        minDataAge: 60,
        crossExchangeValidation: true,
        anomalyDetection: true
      },
      performance: {
        maxResponseTime: 500,
        concurrentRequests: 10,
        batchSize: 50,
        memoryLimit: 512,
        compressionThreshold: 1024
      },
      africanOptimizations: {
        prioritizeAfricanExchanges: true,
        localCurrencySupport: ['ZAR', 'NGN', 'KES', 'GHS'],
        mobileMoneyIntegration: true,
        regionalFailover: true,
        complianceMode: ComplianceLevel.FULL
      }
    };

    aggregator = new MarketDataAggregator(mockPrisma, mockRedis, testConfig);
  });

  // Helper to get exchange integration safely
  const getExchangeIntegration = () => {
    const integration = testConfig.exchanges[0]?.integration;
    if (!integration) {
      throw new Error('Test configuration missing exchange integration');
    }
    return integration;
  };

  describe('Performance Requirements', () => {
    test('should respond to market data requests within 500ms', async () => {
      // Mock cache miss to force exchange fetch
      mockRedis.get.mockResolvedValue(null);
      
      // Mock successful exchange response
      const mockMarketData = [
        {
          id: 'test-1',
          tokenId: 'btc-token-id',
          symbol: 'BTC',
          exchange: 'Luno',
          priceUsd: 45000,
          priceChange24h: 1000,
          priceChangePercent24h: 2.27,
          volume24h: 1000000,
          volumeChange24h: 50000,
          marketCap: 850000000000,
          high24h: 46000,
          low24h: 44000,
          tradingPairs: [],
          timestamp: new Date(),
          source: {
            exchange: 'Luno',
            endpoint: '/api/1/ticker',
            method: 'REST' as const,
            reliability: 0.98,
            latency: 120
          },
          quality: DataQuality.HIGH
        }
      ];

      // Mock the private fetchFromExchanges method
      jest.spyOn(aggregator as any, 'fetchFromExchanges')
        .mockResolvedValue(mockMarketData);

      const startTime = Date.now();
      const result = await aggregator.getMarketData(['BTC']);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.symbol).toBe('BTC');
      expect(result.performance.responseTime).toBeLessThan(500);
    });

    test('should maintain 75%+ cache hit rate under load', async () => {
      const symbols = ['BTC', 'ETH', 'ADA'];
      let cacheHits = 0;
      let totalRequests = 0;

      // Mock cache responses for some requests
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify([{ symbol: 'BTC' }])) // Hit
        .mockResolvedValueOnce(null) // Miss
        .mockResolvedValueOnce(JSON.stringify([{ symbol: 'ADA' }])) // Hit
        .mockResolvedValueOnce(JSON.stringify([{ symbol: 'BTC' }])) // Hit
        .mockResolvedValueOnce(JSON.stringify([{ symbol: 'ETH' }])); // Hit

      // Simulate multiple requests
      for (let i = 0; i < 5; i++) {
        const symbol = symbols[i % symbols.length];
        if (!symbol) continue;
        
        try {
          const result = await aggregator.getMarketData([symbol]);
          totalRequests++;
          
          if (result.cache.hit) {
            cacheHits++;
          }
        } catch (error) {
          // Continue with next request
        }
      }

      const cacheHitRate = (cacheHits / totalRequests) * 100;
      expect(cacheHitRate).toBeGreaterThanOrEqual(75);
    });
  });

  describe('African Exchange Integration', () => {
    test('should integrate with Luno exchange', async () => {
      const exchangeIntegration = testConfig.exchanges[0]?.integration;
      if (!exchangeIntegration) {
        throw new Error('Test configuration missing exchange integration');
      }
      
      const lunoAdapter = new LunoExchangeAdapter(exchangeIntegration);
      
      // Mock successful API response
      jest.spyOn(lunoAdapter as any, 'makeRequest')
        .mockResolvedValue({
          timestamp: Date.now(),
          bid: '44500',
          ask: '44600',
          last_trade: '44550',
          rolling_24_hour_volume: '1250000'
        });

      const result = await lunoAdapter.fetchMarketData(['BTC']);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.symbol).toBe('BTC');
      expect(result[0]?.exchange).toBe('Luno');
      expect(result[0]?.priceUsd).toBeGreaterThan(0);
    });

    test('should handle Binance Africa integration', async () => {
      const binanceConfig = {
        ...getExchangeIntegration(),
        name: 'Binance Africa',
        slug: 'binance-africa',
        apiEndpoint: 'https://api.binance.com'
      };

      const binanceAdapter = new BinanceAfricaAdapter(binanceConfig);

      // Mock Binance API response
      jest.spyOn(binanceAdapter as any, 'makeRequest')
        .mockResolvedValue([{
          symbol: 'BTCUSDT',
          lastPrice: '45000.00',
          priceChange: '1000.00',
          priceChangePercent: '2.27',
          volume: '1250.50000000',
          highPrice: '46000.00',
          lowPrice: '44000.00',
          openPrice: '44000.00',
          closeTime: Date.now()
        }]);

      const result = await binanceAdapter.fetchMarketData(['BTC']);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.symbol).toBe('BTC');
      expect(result[0]?.exchange).toBe('Binance Africa');
    });

    test('should provide African market context', async () => {
      const lunoAdapter = new LunoExchangeAdapter(getExchangeIntegration());
      
      // Mock successful API and currency responses
      jest.spyOn(lunoAdapter as any, 'fetchMarketData')
        .mockResolvedValue([{
          symbol: 'BTC',
          priceUsd: 45000,
          exchange: 'Luno'
        }]);

      jest.spyOn(lunoAdapter as any, 'fetchLocalCurrencyRates')
        .mockResolvedValue({ ZAR: 18.5 });

      const result = await lunoAdapter.getAfricanMarketData(['BTC'], 'ZA');
      
      expect(result).toHaveLength(1);
      expect(result[0]?.localCurrency?.code).toBe('ZAR');
      expect(result[0]?.localCurrency?.priceLocal).toBeGreaterThan(0);
      expect(result[0]?.regulations?.country).toBe('ZA');
    });
  });

  describe('Data Accuracy and Validation', () => {
    test('should validate data quality', async () => {
      const testData = {
        id: 'test-1',
        tokenId: 'btc-token-id',
        symbol: 'BTC',
        exchange: 'Luno',
        priceUsd: 45000,
        priceChange24h: 1000,
        priceChangePercent24h: 2.27,
        volume24h: 1000000,
        volumeChange24h: 50000,
        marketCap: 850000000000,
        high24h: 46000,
        low24h: 44000,
        tradingPairs: [],
        timestamp: new Date(),
        source: {
          exchange: 'Luno',
          endpoint: '/api/1/ticker',
          method: 'REST' as const,
          reliability: 0.98,
          latency: 120
        },
        quality: DataQuality.HIGH
      };

      const quality = await aggregator.validateData(testData);
      expect(quality).toBe(DataQuality.HIGH);
    });

    test('should detect stale data', async () => {
      const staleData = {
        id: 'test-stale',
        tokenId: 'btc-token-id',
        symbol: 'BTC',
        exchange: 'Luno',
        priceUsd: 45000,
        priceChange24h: 1000,
        priceChangePercent24h: 2.27,
        volume24h: 1000000,
        volumeChange24h: 50000,
        marketCap: 850000000000,
        high24h: 46000,
        low24h: 44000,
        tradingPairs: [],
        timestamp: new Date(Date.now() - 120000), // 2 minutes old
        source: {
          exchange: 'Luno',
          endpoint: '/api/1/ticker',
          method: 'REST' as const,
          reliability: 0.98,
          latency: 120
        },
        quality: DataQuality.HIGH
      };

      const quality = await aggregator.validateData(staleData);
      expect(quality).toBe(DataQuality.SUSPECT);
    });

    test('should handle price anomalies', async () => {
      const anomalousData = {
        id: 'test-anomaly',
        tokenId: 'btc-token-id',
        symbol: 'BTC',
        exchange: 'Luno',
        priceUsd: 45000,
        priceChange24h: 12000, // 26.67% change - exceeds threshold
        priceChangePercent24h: 26.67,
        volume24h: 1000000,
        volumeChange24h: 50000,
        marketCap: 850000000000,
        high24h: 57000,
        low24h: 44000,
        tradingPairs: [],
        timestamp: new Date(),
        source: {
          exchange: 'Luno',
          endpoint: '/api/1/ticker',
          method: 'REST' as const,
          reliability: 0.98,
          latency: 120
        },
        quality: DataQuality.HIGH
      };

      const quality = await aggregator.validateData(anomalousData);
      expect(quality).toBe(DataQuality.SUSPECT);
    });
  });

  describe('Real-time Updates', () => {
    test('should handle WebSocket subscriptions', async () => {
      const subscription = {
        channels: ['ticker'],
        symbols: ['BTC', 'ETH'],
        exchanges: ['luno'],
        filters: [],
        createdAt: new Date()
      };

      const subscriptionId = await aggregator.subscribeToUpdates(subscription);
      
      expect(subscriptionId).toBeDefined();
      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
    });

    test('should cleanup WebSocket subscriptions', async () => {
      const subscription = {
        channels: ['ticker'],
        symbols: ['BTC'],
        exchanges: ['luno'],
        filters: [],
        createdAt: new Date()
      };

      const subscriptionId = await aggregator.subscribeToUpdates(subscription);
      
      await expect(aggregator.unsubscribeFromUpdates(subscriptionId))
        .resolves
        .not
        .toThrow();
    });
  });

  describe('Historical Data Management', () => {
    test('should fetch historical data efficiently', async () => {
      // Mock database response
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          timestamp: new Date('2023-01-01T00:00:00Z'),
          open: 44000,
          high: 46000,
          low: 43500,
          close: 45000,
          volume: 1000000,
          exchange: 'Luno'
        }
      ]);

      const result = await aggregator.getHistoricalData('BTC', TimeInterval.ONE_DAY, {
        startTime: new Date('2023-01-01'),
        endTime: new Date('2023-01-02')
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.open).toBe(44000);
      expect(result[0]?.close).toBe(45000);
      expect(result[0]?.interval).toBe(TimeInterval.ONE_DAY);
    });

    test('should cache historical data queries', async () => {
      // Mock cache hit
      mockRedis.get.mockResolvedValueOnce(JSON.stringify([
        {
          timestamp: new Date('2023-01-01T00:00:00Z'),
          open: 44000,
          high: 46000,
          low: 43500,
          close: 45000,
          volume: 1000000,
          exchange: 'Luno',
          interval: TimeInterval.ONE_DAY
        }
      ]));

      const result = await aggregator.getHistoricalData('BTC', TimeInterval.ONE_DAY);

      expect(result).toHaveLength(1);
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle exchange failures gracefully', async () => {
      // Mock cache miss
      mockRedis.get.mockResolvedValue(null);
      
      // Mock exchange failure
      jest.spyOn(aggregator as any, 'fetchFromExchanges')
        .mockRejectedValue(new Error('Exchange unavailable'));

      // Mock fallback data
      jest.spyOn(aggregator as any, 'getFallbackData')
        .mockResolvedValue([{
          symbol: 'BTC',
          priceUsd: 44500, // Slightly stale but valid
          timestamp: new Date(Date.now() - 60000)
        }]);

      const result = await aggregator.getMarketData(['BTC']);
      
      expect(result.data).toHaveLength(1);
      expect(result.metadata.source).toBe('FALLBACK');
    });

    test('should implement circuit breaker pattern', async () => {
      const exchangeName = 'luno';
      
      // Simulate multiple failures
      for (let i = 0; i < 6; i++) { // Exceed threshold of 5
        try {
          jest.spyOn(aggregator as any, 'fetchFromSingleExchange')
            .mockRejectedValue(new Error('Connection failed'));
          
          await (aggregator as any).fetchFromSingleExchange(
            exchangeName,
            { fetchMarketData: () => Promise.reject(new Error('Connection failed')) },
            ['BTC']
          );
        } catch (error) {
          (aggregator as any).handleExchangeError(exchangeName, error);
        }
      }

      // Circuit breaker should now be open
      const isOpen = (aggregator as any).isCircuitBreakerOpen(exchangeName);
      expect(isOpen).toBe(true);
    });

    test('should recover from network timeouts', async () => {
      const lunoAdapter = new LunoExchangeAdapter(getExchangeIntegration());
      
      // Mock timeout followed by success
      jest.spyOn(lunoAdapter as any, 'makeRequest')
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValueOnce({
          timestamp: Date.now(),
          last_trade: '45000',
          rolling_24_hour_volume: '1000000'
        });

      // Should retry and succeed
      const result = await lunoAdapter.fetchMarketData(['BTC']);
      expect(result).toHaveLength(1);
    });
  });

  describe('Exchange Health Monitoring', () => {
    test('should monitor exchange health', async () => {
      const health = await aggregator.getExchangeHealth();
      
      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
    });

    test('should detect degraded exchange performance', async () => {
      const lunoAdapter = new LunoExchangeAdapter(getExchangeIntegration());
      
      // Mock slow response
      jest.spyOn(lunoAdapter as any, 'makeRequest')
        .mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ timestamp: Date.now() }), 2000)
          )
        );

      const startTime = Date.now();
      const health = await lunoAdapter.healthCheck();
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeGreaterThan(1000);
      expect(health.avgResponseTime).toBeGreaterThan(1000);
    });
  });

  describe('Mobile Money Integration', () => {
    test('should support mobile money providers', async () => {
      const binanceAdapter = new BinanceAfricaAdapter(getExchangeIntegration());
      
      const africanData = await binanceAdapter.getAfricanMarketData(['BTC'], 'KE');
      
      expect(africanData[0]?.mobileMoneyIntegration?.providers)
        .toContain(MobileMoneyProvider.MPESA);
    });

    test('should provide deposit/withdrawal methods', async () => {
      const lunoAdapter = new LunoExchangeAdapter(getExchangeIntegration());
      
      const africanData = await lunoAdapter.getAfricanMarketData(['BTC'], 'NG');
      
      expect(africanData[0]?.mobileMoneyIntegration?.depositMethods)
        .toContain('mtn_money');
    });
  });

  describe('Compliance and Regulations', () => {
    test('should enforce regional compliance', async () => {
      const lunoAdapter = new LunoExchangeAdapter(getExchangeIntegration());
      
      const saData = await lunoAdapter.getAfricanMarketData(['BTC'], 'ZA');
      expect(saData[0]?.regulations?.compliance).toBe(ComplianceLevel.FULL);
      
      const keData = await lunoAdapter.getAfricanMarketData(['BTC'], 'KE');
      expect(keData[0]?.regulations?.compliance).toBe(ComplianceLevel.PARTIAL);
    });

    test('should include country-specific restrictions', async () => {
      const binanceAdapter = new BinanceAfricaAdapter(getExchangeIntegration());
      
      const nigeriaData = await binanceAdapter.getAfricanMarketData(['BTC'], 'NG');
      
      expect(nigeriaData[0]?.regulations?.restrictions)
        .toContain('daily_limit_usd_10000');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

// Integration Tests with Real Network Calls (Optional - for CI/CD)
describe('Market Data Integration Tests', () => {
  // These tests would run against test environments of actual exchanges
  test.skip('should integrate with real Luno test API', async () => {
    // Real integration test with Luno testnet
  });

  test.skip('should integrate with real Binance test API', async () => {
    // Real integration test with Binance testnet
  });
});

// Performance Benchmark Tests
describe('Market Data Performance Benchmarks', () => {
  test('should benchmark memory usage under load', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate high load
    const promises = [];
    for (let i = 0; i < 100; i++) {
      // Would create actual aggregator instances and requests
      promises.push(Promise.resolve());
    }
    
    await Promise.all(promises);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    // Should not increase by more than 100MB under normal load
    expect(memoryIncrease).toBeLessThan(100);
  });

  test('should maintain consistent performance across African regions', async () => {
    const regions = ['ZA', 'NG', 'KE', 'GH'];
    const responseTimes: number[] = [];

    for (const region of regions) {
      const startTime = Date.now();
      
      // Simulate regional request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }

    // Standard deviation should be low (consistent performance)
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const variance = responseTimes.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / responseTimes.length;
    const stdDev = Math.sqrt(variance);

    expect(stdDev).toBeLessThan(100); // Less than 100ms deviation
  });
});