/**
 * Content Generation Agent Integration Tests - Task 10
 * Integration tests for AI Agent Orchestrator with Content Generation Agent
 */

import { ContentGenerationAgent } from '../../src/agents/contentGenerationAgent';
import { AIAgentOrchestrator } from '../../../ai-system/orchestrator';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { createMockLogger } from '../utils/mockLogger';
import { 
  ContentGenerationTask, 
  AfricanMarketContext, 
  AgentType, 
  TaskStatus, 
  TaskPriority,
  OrchestratorConfig
} from '../../src/types/ai-system';

// Mock dependencies
jest.mock('openai');
jest.mock('ioredis');

describe('ContentGenerationAgent Integration Tests', () => {
  let contentAgent: ContentGenerationAgent;
  let orchestrator: AIAgentOrchestrator;
  let mockLogger: Logger;
  let mockPrisma: PrismaClient;
  let mockOpenAI: any;

  const mockAfricanContext: AfricanMarketContext = {
    region: 'west',
    countries: ['Nigeria', 'Ghana'],
    languages: ['en', 'ha', 'yo'],
    exchanges: ['Binance_Africa', 'Quidax', 'Luno'],
    mobileMoneyProviders: ['MTN_Money', 'Orange_Money'],
    timezone: 'Africa/Lagos',
    culturalContext: {
      tradingHours: '08:00-17:00',
      preferredCurrencies: ['NGN', 'GHS']
    }
  };

  const orchestratorConfig: OrchestratorConfig = {
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    agents: {
      [AgentType.CONTENT_GENERATION]: {
        minInstances: 1,
        maxInstances: 3,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 5,
          timeoutMs: 30000,
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'exponential' as const,
            baseDelayMs: 1000,
            maxDelayMs: 10000
          },
          healthCheckInterval: 5000
        }
      },
      [AgentType.MARKET_ANALYSIS]: {
        minInstances: 1,
        maxInstances: 2,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 3,
          timeoutMs: 15000,
          retryPolicy: {
            maxRetries: 2,
            backoffStrategy: 'linear' as const,
            baseDelayMs: 500,
            maxDelayMs: 5000
          },
          healthCheckInterval: 10000
        }
      },
      [AgentType.QUALITY_REVIEW]: {
        minInstances: 1,
        maxInstances: 2,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 3,
          timeoutMs: 10000,
          retryPolicy: {
            maxRetries: 2,
            backoffStrategy: 'fixed' as const,
            baseDelayMs: 1000,
            maxDelayMs: 1000
          },
          healthCheckInterval: 15000
        }
      },
      [AgentType.TRANSLATION]: {
        minInstances: 1,
        maxInstances: 2,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 4,
          timeoutMs: 20000,
          retryPolicy: {
            maxRetries: 2,
            backoffStrategy: 'exponential' as const,
            baseDelayMs: 1000,
            maxDelayMs: 8000
          },
          healthCheckInterval: 12000
        }
      },
      [AgentType.SENTIMENT_ANALYSIS]: {
        minInstances: 1,
        maxInstances: 2,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 5,
          timeoutMs: 8000,
          retryPolicy: {
            maxRetries: 1,
            backoffStrategy: 'linear' as const,
            baseDelayMs: 500,
            maxDelayMs: 2000
          },
          healthCheckInterval: 20000
        }
      },
      [AgentType.MODERATION]: {
        minInstances: 1,
        maxInstances: 1,
        autoScaling: false,
        config: {
          maxConcurrentTasks: 2,
          timeoutMs: 5000,
          retryPolicy: {
            maxRetries: 1,
            backoffStrategy: 'fixed' as const,
            baseDelayMs: 1000,
            maxDelayMs: 1000
          },
          healthCheckInterval: 30000
        }
      }
    },
    queues: {
      [AgentType.CONTENT_GENERATION]: {
        name: 'content_generation_queue',
        maxSize: 1000,
        processTimeout: 30000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: 'exponential' as const,
          baseDelayMs: 1000,
          maxDelayMs: 10000
        },
        priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
        deadLetterQueue: true
      },
      [AgentType.MARKET_ANALYSIS]: {
        name: 'market_analysis_queue',
        maxSize: 500,
        processTimeout: 15000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'linear' as const,
          baseDelayMs: 500,
          maxDelayMs: 5000
        },
        priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH, TaskPriority.URGENT],
        deadLetterQueue: true
      },
      [AgentType.QUALITY_REVIEW]: {
        name: 'quality_review_queue',
        maxSize: 200,
        processTimeout: 10000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'fixed' as const,
          baseDelayMs: 1000,
          maxDelayMs: 1000
        },
        priorityLevels: [TaskPriority.HIGH, TaskPriority.URGENT],
        deadLetterQueue: true
      },
      [AgentType.TRANSLATION]: {
        name: 'translation_queue',
        maxSize: 300,
        processTimeout: 20000,
        retryPolicy: {
          maxRetries: 2,
          backoffStrategy: 'exponential' as const,
          baseDelayMs: 1000,
          maxDelayMs: 8000
        },
        priorityLevels: [TaskPriority.LOW, TaskPriority.NORMAL, TaskPriority.HIGH],
        deadLetterQueue: true
      },
      [AgentType.SENTIMENT_ANALYSIS]: {
        name: 'sentiment_analysis_queue',
        maxSize: 400,
        processTimeout: 8000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'linear' as const,
          baseDelayMs: 500,
          maxDelayMs: 2000
        },
        priorityLevels: [TaskPriority.NORMAL, TaskPriority.HIGH],
        deadLetterQueue: false
      },
      [AgentType.MODERATION]: {
        name: 'moderation_queue',
        maxSize: 100,
        processTimeout: 5000,
        retryPolicy: {
          maxRetries: 1,
          backoffStrategy: 'fixed' as const,
          baseDelayMs: 1000,
          maxDelayMs: 1000
        },
        priorityLevels: [TaskPriority.HIGH, TaskPriority.URGENT],
        deadLetterQueue: false
      }
    },
    monitoring: {
      metricsInterval: 10000,
      alertThresholds: {
        queueSize: 100,
        errorRate: 0.1,
        responseTime: 5000
      }
    },
    performance: {
      maxResponseTimeMs: 500,
      maxConcurrentTasks: 20,
      enableCircuitBreaker: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    
    // Mock Prisma
    const mockFindMany = jest.fn().mockResolvedValue([]);
    mockPrisma = {
      article: {
        findMany: mockFindMany,
        create: jest.fn(),
        update: jest.fn()
      },
      marketData: {
        findMany: mockFindMany
      }
    } as unknown as PrismaClient;

    // Mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    const { OpenAI } = require('openai');
    OpenAI.mockImplementation(() => mockOpenAI);

    // Initialize agents
    contentAgent = new ContentGenerationAgent(
      mockPrisma,
      mockLogger,
      {
        apiKey: 'test-key',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4000,
        temperature: 0.7,
        enablePlagiarismCheck: true,
        qualityThreshold: 75,
        africanContextWeight: 0.8
      }
    );

    // Initialize orchestrator
    orchestrator = new AIAgentOrchestrator(orchestratorConfig, mockLogger);
  });

  describe('Agent Registration and Task Processing', () => {
    it('should register content generation agent with orchestrator', async () => {
      // Mock Redis connection
      const mockRedis = {
        set: jest.fn(),
        get: jest.fn(),
        publish: jest.fn(),
        subscribe: jest.fn()
      };

      // Start orchestrator
      await orchestrator.start();

      // Register agent
      const agentConfig = {
        id: 'content-agent-1',
        type: AgentType.CONTENT_GENERATION,
        status: 'idle' as any,
        capabilities: ['article_generation', 'summary_generation', 'social_post_generation'],
        config: {
          ...orchestratorConfig.agents[AgentType.CONTENT_GENERATION].config,
          maxConcurrentTasks: 3,
          retryAttempts: 3,
          timeoutMs: 30000,
          retryPolicy: 'exponential' as any,
          healthCheckInterval: 5000
        },
        metrics: {
          tasksProcessed: 0,
          tasksSuccessful: 0,
          tasksFailed: 0,
          averageProcessingTime: 0,
          uptime: 0
        },
        lastHeartbeat: new Date()
      };

      await orchestrator.registerAgent(agentConfig);

      // Verify agent registration
      const registeredAgent = await orchestrator.getAgent('content-agent-1');
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent?.id).toBe('content-agent-1');
    });

    it('should queue and process content generation task through orchestrator', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Nigerian Crypto Market Shows Strong Growth',
              content: 'The Nigerian cryptocurrency market continues to demonstrate...',
              excerpt: 'Strong growth indicators in Nigerian crypto market',
              keywords: ['Nigeria', 'crypto', 'growth'],
              qualityScore: 88,
              wordCount: 1200,
              readingTime: 5,
              format: 'article',
              africanRelevance: {
                score: 92,
                mentionedCountries: ['Nigeria'],
                mentionedExchanges: ['Binance_Africa'],
                mobileMoneyIntegration: true,
                localCurrencyMention: true
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'integration-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Nigerian crypto market growth analysis',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Nigeria', 'crypto', 'growth'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      // Queue task through orchestrator
      await orchestrator.queueTask(task);

      // Verify task was queued
      const queueMetrics = await orchestrator.getQueueMetrics(AgentType.CONTENT_GENERATION);
      expect(queueMetrics.queueSize).toBe(1);
    });
  });

  describe('Performance and Sub-500ms Response Time', () => {
    it('should complete content generation within performance requirements', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Quick Market Update: Bitcoin Price in Africa',
              content: 'Brief market update content...',
              excerpt: 'Quick Bitcoin update',
              keywords: ['Bitcoin', 'Africa', 'price'],
              qualityScore: 82,
              wordCount: 500,
              readingTime: 2,
              format: 'summary'
            })
          }
        }]
      };

      // Mock fast OpenAI response
      mockOpenAI.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve(mockResponse), 100); // 100ms response
        })
      );

      const task: ContentGenerationTask = {
        id: 'performance-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.URGENT,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin price update',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'summary',
          keywords: ['Bitcoin', 'price'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 500
        }
      };

      const startTime = Date.now();
      const result = await contentAgent.processTask(task);
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(500);
      expect(result.processingTime).toBeLessThan(500);
    });

    it('should handle timeout for long-running tasks', async () => {
      // Mock slow OpenAI response
      mockOpenAI.chat.completions.create.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'Slow response',
                  content: 'Content generated after timeout...',
                  excerpt: 'Slow response test',
                  qualityScore: 80,
                  wordCount: 1000
                })
              }
            }]
          }), 1000); // 1000ms response (should timeout)
        })
      );

      const task: ContentGenerationTask = {
        id: 'timeout-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Timeout test',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['timeout'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 1,
          timeoutMs: 500
        }
      };

      const startTime = Date.now();
      
      try {
        await contentAgent.processTask(task);
      } catch (error) {
        const processingTime = Date.now() - startTime;
        expect(processingTime).toBeGreaterThan(400);
        expect(processingTime).toBeLessThan(1200);
      }
    });
  });

  describe('African Context Integration', () => {
    it('should integrate with real African market data sources', async () => {
      // Mock market data from African exchanges
      const mockMarketData = [
        {
          symbol: 'BTC',
          exchange: 'Binance_Africa',
          price: 45000,
          volume24h: 1200000,
          change24h: 2.5,
          timestamp: new Date()
        },
        {
          symbol: 'ETH',
          exchange: 'Luno',
          price: 3200,
          volume24h: 800000,
          change24h: 1.8,
          timestamp: new Date()
        }
      ];

      const mockFindMany = jest.fn().mockResolvedValue(mockMarketData);
      mockPrisma.marketData.findMany = mockFindMany;

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'African Crypto Exchanges Report Strong Trading Volumes',
              content: 'Binance Africa and Luno show increased activity...',
              excerpt: 'Strong trading volumes on African exchanges',
              keywords: ['African exchanges', 'trading volume', 'Binance Africa', 'Luno'],
              qualityScore: 89,
              wordCount: 1100,
              readingTime: 4,
              format: 'article',
              marketDataIntegration: {
                realTimeData: true,
                exchanges: ['Binance_Africa', 'Luno'],
                pricePoints: [45000, 3200],
                volumeData: true
              },
              africanRelevance: {
                score: 95,
                mentionedCountries: ['Nigeria', 'South Africa'],
                mentionedExchanges: ['Binance_Africa', 'Luno'],
                mobileMoneyIntegration: false,
                localCurrencyMention: true
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'african-context-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'African exchange trading volume analysis',
          targetLanguages: ['en'],
          africanContext: {
            ...mockAfricanContext,
            exchanges: ['Binance_Africa', 'Luno']
          },
          contentType: 'article',
          keywords: ['trading volume', 'African exchanges'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await contentAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      if (result.content && result.content.africanRelevance) {
        expect(result.content.africanRelevance.score).toBeGreaterThan(85);
      }
      if (result.content && result.content.marketDataIntegration) {
        expect(result.content.marketDataIntegration).toBeDefined();
        expect(result.content.marketDataIntegration.exchanges).toContain('Binance_Africa');
      }
      expect(mockFindMany).toHaveBeenCalled();
    });

    it('should handle multiple African languages in task payload', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bitcoin Adoption in West Africa',
              content: 'Bitcoin adoption continues to grow across West African nations...',
              excerpt: 'Growing Bitcoin adoption in West Africa',
              keywords: ['Bitcoin', 'West Africa', 'adoption'],
              qualityScore: 86,
              wordCount: 950,
              readingTime: 4,
              format: 'article'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'multilang-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin adoption in West Africa',
          targetLanguages: ['en', 'fr', 'ha'], // English, French, Hausa
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Bitcoin', 'adoption', 'West Africa'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await contentAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      if (result.content) {
        expect(result.content.title).toContain('Africa');
        expect(result.content.qualityScore).toBeGreaterThan(75);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle orchestrator communication failures', async () => {
      // Mock Redis connection failure
      const mockRedisError = new Error('Redis connection failed');
      
      try {
        await orchestrator.start();
      } catch (error) {
        expect(error instanceof Error ? error.message : 'Unknown error').toContain('Redis');
      }

      // Agent should continue working independently
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Independent Operation Test',
              content: 'Agent operating without orchestrator...',
              excerpt: 'Independent operation test',
              qualityScore: 82,
              wordCount: 800
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'independent-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Independent operation test',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['test'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await contentAgent.processTask(task);
      expect(result.success).toBe(true);
    });

    it('should recover from partial failures and retry successfully', async () => {
      let callCount = 0;

      // Mock successive failures then success
      mockOpenAI.chat.completions.create.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error(`Temporary failure ${callCount}`));
        }
        return Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Recovery Success After Retries',
                content: 'Successfully recovered after retries...',
                excerpt: 'Recovery test success',
                qualityScore: 85,
                wordCount: 900,
                readingTime: 4
              })
            }
          }]
        });
      });

      const task: ContentGenerationTask = {
        id: 'recovery-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Recovery test after failures',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['recovery', 'test'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await contentAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3); // Should have retried twice then succeeded
      expect(result.content).toBeDefined();
      if (result.content) {
        expect(result.content.title).toContain('Recovery');
      }
    });
  });
});