/**
 * Market Analysis Agent Tests - Task 11
 * TDD tests for custom Grok integration with memecoin surge detection,
 * whale tracking, and African exchange monitoring
 */

import { MarketAnalysisAgent, MarketAnalysisConfig } from '../../src/agents/marketAnalysisAgent';
import { 
  MarketAnalysisTask, 
  AfricanMarketContext,
  TaskStatus,
  AgentType 
} from '../../src/types/ai-system';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Mock dependencies
jest.mock('../../src/ai/dependencies', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG')
  }))
}));

// Mock axios
jest.mock('axios');

// Mock Prisma
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();

const mockPrisma = {
  marketData: {
    findMany: mockFindMany,
    create: mockCreate,
    findFirst: mockFindFirst
  },
  token: {
    findMany: mockFindMany,
    findUnique: mockFindUnique
  },
  exchangeIntegration: {
    findMany: mockFindMany
  }
} as unknown as PrismaClient;

describe('MarketAnalysisAgent - Task 11', () => {
  let agent: MarketAnalysisAgent;
  let mockLogger: jest.Mocked<Logger>;
  let mockRedis: jest.Mocked<Redis>;
  let config: MarketAnalysisConfig;

  const africanContext: AfricanMarketContext = {
    region: 'west',
    countries: ['Nigeria', 'Ghana', 'Senegal'],
    languages: ['en', 'ha', 'yo'],
    exchanges: ['Binance_Africa', 'Quidax', 'BuyCoins', 'NairaEx'],
    mobileMoneyProviders: ['MTN_Money', 'Orange_Money', 'Airtel_Money'],
    timezone: 'Africa/Lagos',
    culturalContext: {
      tradingHours: '08:00-17:00',
      preferredCurrencies: ['NGN', 'GHS', 'XOF'],
      socialPlatforms: ['Twitter', 'WhatsApp', 'Telegram'],
      economicFactors: {
        inflationRate: 15.2,
        youthUnemployment: 42.5,
        smartphonePenetration: 83.2
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG')
    } as any;

    config = {
      grokApiKey: 'test-grok-key',
      grokApiUrl: 'https://api.grok.com/v1',
      exchangeApis: {
        'binance-africa': {
          baseUrl: 'https://api.binance.africa/v1',
          apiKey: 'test-key',
          rateLimitPerMinute: 100
        },
        'luno': {
          baseUrl: 'https://api.luno.com/v1',
          apiKey: 'test-key',
          rateLimitPerMinute: 60
        },
        'quidax': {
          baseUrl: 'https://api.quidax.com/v1',
          apiKey: 'test-key',
          rateLimitPerMinute: 120
        }
      },
      whaleThresholds: {
        btc: 100,
        eth: 1000,
        default: 10000
      },
      memecoinSurgeThreshold: 25.0,
      sentimentSources: ['twitter', 'telegram', 'discord'],
      cacheTimeoutMs: 300000, // 5 minutes
      maxRetries: 3,
      timeoutMs: 30000,
      enableRealTimeAlerts: true,
      africanExchangeFocus: true
    };

    agent = new MarketAnalysisAgent(config, mockLogger, mockPrisma, mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with proper configuration', () => {
      expect(agent).toBeDefined();
      expect(agent.getAgentType()).toBe(AgentType.MARKET_ANALYSIS);
      expect(agent.getCapabilities()).toContain('memecoin_surge_detection');
      expect(agent.getCapabilities()).toContain('whale_tracking');
      expect(agent.getCapabilities()).toContain('african_exchange_monitoring');
    });

    it('should validate configuration on initialization', () => {
      const invalidConfig = { ...config, grokApiKey: '' };
      expect(() => new MarketAnalysisAgent(invalidConfig, mockLogger, mockPrisma, mockRedis))
        .toThrow('Invalid Grok API key provided');
    });

    it('should support all required African exchanges', () => {
      const capabilities = agent.getCapabilities();
      expect(capabilities).toContain('binance_africa_integration');
      expect(capabilities).toContain('luno_integration');
      expect(capabilities).toContain('quidax_integration');
    });
  });

  describe('Memecoin Surge Detection - TDD Requirement', () => {
    const memecoinSurgeTask: MarketAnalysisTask = {
      id: 'memecoin-surge-001',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'high' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['DOGE', 'SHIB', 'PEPE'],
        exchanges: ['binance-africa', 'quidax'],
        analysisType: 'memecoin_surge',
        timeRange: {
          start: new Date(Date.now() - 3600000), // 1 hour ago
          end: new Date()
        },
        africanContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    it('should detect memecoin surge with >25% threshold', async () => {
      // Mock market data showing surge
      mockFindMany.mockResolvedValue([
        {
          id: 'doge-surge',
          symbol: 'DOGE',
          exchange: 'binance-africa',
          priceUsd: 0.085,
          priceChange24h: 32.5, // Above threshold
          volume24h: 125000000,
          timestamp: new Date()
        }
      ]);

      // Mock Grok analysis
      const mockGrokResponse = {
        analysis: {
          surgeDetected: true,
          confidence: 87.5,
          patterns: ['social_media_hype', 'whale_accumulation'],
          africanImpact: {
            tradingVolumeIncrease: 45.2,
            mobileMoneyCorrelation: 0.73
          }
        }
      };

      jest.spyOn(agent as any, 'callGrokApi').mockResolvedValue(mockGrokResponse);

      const result = await agent.executeTask(memecoinSurgeTask);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result?.data.surgeDetected).toBe(true);
      expect(result.result?.data.confidence).toBeGreaterThan(80);
      expect(result.result?.data.africanMarketImpact).toBeDefined();
    });

    it('should handle no surge scenario correctly', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'doge-normal',
          symbol: 'DOGE',
          exchange: 'quidax',
          priceUsd: 0.075,
          priceChange24h: 2.1, // Below threshold
          volume24h: 8500000,
          timestamp: new Date()
        }
      ]);

      const mockGrokResponse = {
        analysis: {
          surgeDetected: false,
          confidence: 92.3,
          patterns: ['normal_trading'],
          africanImpact: {
            tradingVolumeIncrease: -1.2,
            mobileMoneyCorrelation: 0.12
          }
        }
      };

      jest.spyOn(agent as any, 'callGrokApi').mockResolvedValue(mockGrokResponse);

      const result = await agent.executeTask(memecoinSurgeTask);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result?.data.surgeDetected).toBe(false);
      expect(result.result?.data.patterns).toContain('normal_trading');
    });
  });

  describe('Whale Transaction Monitoring - TDD Requirement', () => {
    const whaleTrackingTask: MarketAnalysisTask = {
      id: 'whale-tracking-001',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'urgent' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['BTC', 'ETH'],
        exchanges: ['binance-africa', 'luno'],
        analysisType: 'whale_tracking',
        timeRange: {
          start: new Date(Date.now() - 1800000), // 30 minutes ago
          end: new Date()
        },
        africanContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    it('should detect large BTC transactions above threshold', async () => {
      const mockWhaleData = [
        {
          transactionHash: '0x1234...abcd',
          symbol: 'BTC',
          amount: 150, // Above 100 BTC threshold
          amountUsd: 6750000,
          exchange: 'binance-africa',
          timestamp: new Date(),
          direction: 'inflow'
        }
      ];

      jest.spyOn(agent as any, 'fetchWhaleTransactions').mockResolvedValue(mockWhaleData);

      const mockGrokAnalysis = {
        whaleActivity: {
          totalTransactions: 1,
          totalVolumeUsd: 6750000,
          marketImpact: 'moderate',
          africanExchangeImpact: {
            priceInfluence: 0.85,
            liquidityImpact: 'positive',
            regionFocus: 'West Africa'
          }
        }
      };

      jest.spyOn(agent as any, 'callGrokApi').mockResolvedValue(mockGrokAnalysis);

      const result = await agent.executeTask(whaleTrackingTask);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result?.data.whaleActivity.totalVolumeUsd).toBeGreaterThan(5000000);
      expect(result.result?.data.africanExchangeImpact).toBeDefined();
    });

    it('should track multiple whale transactions across exchanges', async () => {
      const mockWhaleData = [
        {
          transactionHash: '0x1111...aaaa',
          symbol: 'ETH',
          amount: 1200,
          amountUsd: 3816000,
          exchange: 'luno',
          timestamp: new Date(),
          direction: 'outflow'
        },
        {
          transactionHash: '0x2222...bbbb',
          symbol: 'BTC',
          amount: 85,
          amountUsd: 3825000,
          exchange: 'binance-africa',
          timestamp: new Date(),
          direction: 'inflow'
        }
      ];

      jest.spyOn(agent as any, 'fetchWhaleTransactions').mockResolvedValue(mockWhaleData);

      const result = await agent.executeTask(whaleTrackingTask);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result?.data.whaleActivity.totalTransactions).toBe(2);
      expect(result.result?.data.whaleActivity.totalVolumeUsd).toBeGreaterThan(7000000);
    });
  });

  describe('African Exchange Integration - TDD Requirement', () => {
    it('should integrate with Binance Africa successfully', async () => {
      const integrationTest = await agent.testExchangeConnection('binance-africa');
      expect(integrationTest.success).toBe(true);
      expect(integrationTest.exchange).toBe('binance-africa');
    });

    it('should integrate with Luno successfully', async () => {
      const integrationTest = await agent.testExchangeConnection('luno');
      expect(integrationTest.success).toBe(true);
      expect(integrationTest.exchange).toBe('luno');
    });

    it('should integrate with Quidax successfully', async () => {
      const integrationTest = await agent.testExchangeConnection('quidax');
      expect(integrationTest.success).toBe(true);
      expect(integrationTest.exchange).toBe('quidax');
    });

    it('should handle exchange API failures gracefully', async () => {
      jest.spyOn(agent as any, 'callExchangeApi').mockRejectedValue(new Error('API timeout'));

      const result = await agent.testExchangeConnection('binance-africa');
      expect(result.success).toBe(false);
      expect(result.error).toContain('API timeout');
    });

    it('should aggregate data from multiple African exchanges', async () => {
      const mockExchangeData = {
        'binance-africa': [
          { symbol: 'BTC', price: 45250, volume: 1250000, exchange: 'binance-africa' }
        ],
        'luno': [
          { symbol: 'BTC', price: 45300, volume: 850000, exchange: 'luno' }
        ],
        'quidax': [
          { symbol: 'BTC', price: 45200, volume: 320000, exchange: 'quidax' }
        ]
      };

      jest.spyOn(agent as any, 'fetchMultiExchangeData').mockResolvedValue(mockExchangeData);

      const aggregatedData = await (agent as any).aggregateAfricanExchangeData(['BTC']);

      expect(aggregatedData.BTC.exchanges).toHaveLength(3);
      expect(aggregatedData.BTC.averagePrice).toBeCloseTo(45250, 0);
      expect(aggregatedData.BTC.totalVolume).toBe(2420000);
    });
  });

  describe('Market Sentiment Analysis - TDD Requirement', () => {
    const sentimentTask: MarketAnalysisTask = {
      id: 'sentiment-001',
      type: AgentType.MARKET_ANALYSIS,
      priority: 'normal' as any,
      status: TaskStatus.QUEUED,
      payload: {
        symbols: ['BTC', 'ETH'],
        exchanges: ['binance-africa'],
        analysisType: 'sentiment',
        timeRange: {
          start: new Date(Date.now() - 86400000), // 24 hours
          end: new Date()
        },
        africanContext
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    };

    it('should analyze sentiment from African social platforms', async () => {
      const mockSentimentData = {
        overall: 'bullish',
        confidence: 78.5,
        sources: {
          twitter: { sentiment: 0.65, mentions: 1250 },
          telegram: { sentiment: 0.72, mentions: 890 },
          whatsapp: { sentiment: 0.58, mentions: 340 }
        },
        africanRegions: {
          'West Africa': { sentiment: 0.68, dominantCurrency: 'NGN' },
          'East Africa': { sentiment: 0.61, dominantCurrency: 'KES' },
          'Southern Africa': { sentiment: 0.74, dominantCurrency: 'ZAR' }
        }
      };

      jest.spyOn(agent as any, 'analyzeSentiment').mockResolvedValue(mockSentimentData);

      const result = await agent.executeTask(sentimentTask);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.result?.data.sentiment.overall).toBe('bullish');
      expect(result.result?.data.sentiment.africanRegions).toBeDefined();
      expect(result.result?.data.sentiment.confidence).toBeGreaterThan(70);
    });

    it('should correlate sentiment with mobile money adoption', async () => {
      const mockCorrelationData = {
        correlationScore: 0.73,
        mobileMoneyImpact: {
          'MTN_Money': { adoptionRate: 0.68, cryptoCorrelation: 0.71 },
          'Orange_Money': { adoptionRate: 0.45, cryptoCorrelation: 0.59 },
          'Airtel_Money': { adoptionRate: 0.52, cryptoCorrelation: 0.63 }
        },
        regionalInsights: [
          'Higher mobile money adoption correlates with crypto interest',
          'MTN Money users show strongest crypto engagement',
          'Peak correlation during mobile money promotional periods'
        ]
      };

      jest.spyOn(agent as any, 'analyzeMobileMoneyCorrelation').mockResolvedValue(mockCorrelationData);

      const result = await agent.executeTask(sentimentTask);

      expect(result.result?.data.mobileMoneyCorrelation.correlationScore).toBeGreaterThan(0.7);
      expect(result.result?.data.mobileMoneyCorrelation.regionalInsights).toHaveLength(3);
    });
  });

  describe('Automated Alert Generation - TDD Requirement', () => {
    it('should generate alerts for memecoin surges', async () => {
      const surgeData = {
        symbol: 'DOGE',
        priceChange: 45.2,
        volume: 250000000,
        africanExchanges: ['binance-africa', 'quidax']
      };

      const alert = await agent.generateAlert('memecoin_surge', surgeData);

      expect(alert.type).toBe('memecoin_surge');
      expect(alert.priority).toBe('high');
      expect(alert.message).toContain('DOGE');
      expect(alert.message).toContain('45.2%');
      expect(alert.africanContext).toBeDefined();
    });

    it('should generate alerts for whale activities', async () => {
      const whaleData = {
        symbol: 'BTC',
        amount: 150,
        amountUsd: 6750000,
        exchange: 'luno',
        direction: 'inflow'
      };

      const alert = await agent.generateAlert('whale_activity', whaleData);

      expect(alert.type).toBe('whale_activity');
      expect(alert.priority).toBe('urgent');
      expect(alert.message).toContain('150 BTC');
      expect(alert.message).toContain('luno');
      expect(alert.data.amountUsd).toBe(6750000);
    });

    it('should generate alerts for African market anomalies', async () => {
      const anomalyData = {
        exchange: 'quidax',
        symbol: 'ETH',
        anomalyType: 'unusual_volume',
        severity: 'moderate',
        description: 'Trading volume 300% above 30-day average'
      };

      const alert = await agent.generateAlert('market_anomaly', anomalyData);

      expect(alert.type).toBe('market_anomaly');
      expect(alert.priority).toBe('normal');
      expect(alert.africanExchange).toBe('quidax');
      expect(alert.message).toContain('300%');
    });
  });

  describe('Analysis Accuracy - TDD Requirement', () => {
    it('should maintain >85% accuracy for surge predictions', async () => {
      const historicalData = [
        { predicted: true, actual: true },   // TP
        { predicted: true, actual: true },   // TP
        { predicted: false, actual: false }, // TN
        { predicted: true, actual: false },  // FP
        { predicted: false, actual: false }, // TN
        { predicted: true, actual: true },   // TP
        { predicted: false, actual: true },  // FN
        { predicted: true, actual: true },   // TP
        { predicted: false, actual: false }, // TN
        { predicted: true, actual: true }    // TP
      ];

      const accuracy = agent.calculateAccuracy(historicalData);
      expect(accuracy).toBeGreaterThan(0.85); // >85% accuracy requirement
    });

    it('should validate African exchange data accuracy', async () => {
      const validation = await agent.validateAfricanExchangeData('BTC', ['binance-africa', 'luno']);
      
      expect(validation.isValid).toBe(true);
      expect(validation.dataQuality).toBeGreaterThan(0.9);
      expect(validation.exchangeCoverage).toContain('binance-africa');
      expect(validation.exchangeCoverage).toContain('luno');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache analysis results for 5 minutes', async () => {
      const cacheKey = 'market_analysis:BTC:sentiment:1h';
      const mockResult = { sentiment: 'bullish', confidence: 82.3 };

      mockRedis.get.mockResolvedValue(JSON.stringify(mockResult));

      const result = await (agent as any).getCachedAnalysis(cacheKey);
      
      expect(result).toEqual(mockResult);
      expect(mockRedis.get).toHaveBeenCalledWith(cacheKey);
    });

    it('should complete analysis within 30 seconds timeout', async () => {
      const startTime = Date.now();
      
      const quickTask: MarketAnalysisTask = {
        id: 'quick-analysis',
        type: AgentType.MARKET_ANALYSIS,
        priority: 'normal' as any,
        status: TaskStatus.QUEUED,
        payload: {
          symbols: ['BTC'],
          exchanges: ['binance-africa'],
          analysisType: 'sentiment',
          timeRange: {
            start: new Date(Date.now() - 3600000),
            end: new Date()
          },
          africanContext
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      await agent.executeTask(quickTask);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(30000);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Grok API failures gracefully', async () => {
      jest.spyOn(agent as any, 'callGrokApi').mockRejectedValue(new Error('Grok API unavailable'));

      const task: MarketAnalysisTask = {
        id: 'error-test',
        type: AgentType.MARKET_ANALYSIS,
        priority: 'normal' as any,
        status: TaskStatus.QUEUED,
        payload: {
          symbols: ['BTC'],
          exchanges: ['binance-africa'],
          analysisType: 'sentiment',
          timeRange: {
            start: new Date(Date.now() - 3600000),
            end: new Date()
          },
          africanContext
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await agent.executeTask(task);

      expect(result.status).toBe(TaskStatus.FAILED);
      expect(result.result?.error).toContain('Grok API unavailable');
    });

    it('should retry failed tasks up to maxRetries', async () => {
      let callCount = 0;
      jest.spyOn(agent as any, 'callGrokApi').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({ analysis: { success: true } });
      });

      const task: MarketAnalysisTask = {
        id: 'retry-test',
        type: AgentType.MARKET_ANALYSIS,
        priority: 'normal' as any,
        status: TaskStatus.QUEUED,
        payload: {
          symbols: ['ETH'],
          exchanges: ['luno'],
          analysisType: 'whale_tracking',
          timeRange: {
            start: new Date(Date.now() - 1800000),
            end: new Date()
          },
          africanContext
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await agent.executeTask(task);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(callCount).toBe(3);
    });
  });
});