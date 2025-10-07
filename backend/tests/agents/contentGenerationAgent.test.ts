/**
 * Content Generation Agent Tests - Task 10
 * TDD Requirements: Content quality tests, plagiarism detection tests, African context tests
 * Testing OpenAI GPT-4 Turbo integration for African-focused cryptocurrency content generation
 */

import { ContentGenerationAgent } from '../../src/agents/contentGenerationAgent';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { createMockLogger } from '../utils/mockLogger';
import { ContentGenerationTask, AfricanMarketContext, AgentType, TaskStatus, TaskPriority } from '../../src/types/ai-system';

// Mock OpenAI
jest.mock('openai');

// Mock Prisma
const mockFindMany = jest.fn();
const mockPrisma = {
  article: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: mockFindMany,
    findUnique: jest.fn(),
  },
  marketData: {
    findMany: mockFindMany,
  },
} as unknown as PrismaClient;

describe('ContentGenerationAgent', () => {
  let contentAgent: ContentGenerationAgent;
  let mockLogger: Logger;
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
      preferredCurrencies: ['NGN', 'GHS'],
      socialPlatforms: ['Twitter', 'WhatsApp', 'Telegram']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = createMockLogger();
    
    // Mock OpenAI client
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Mock OpenAI constructor
    const { OpenAI } = require('openai');
    OpenAI.mockImplementation(() => mockOpenAI);

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
  });

  describe('Content Quality Tests', () => {
    it('should generate high-quality article content with proper structure', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bitcoin Adoption Surges in Nigeria Despite Regulatory Challenges',
              content: 'Nigeria continues to lead African Bitcoin adoption...',
              excerpt: 'Despite regulatory uncertainty, Nigerian crypto users...',
              keywords: ['Bitcoin', 'Nigeria', 'adoption', 'regulation'],
              qualityScore: 85,
              wordCount: 1200,
              readingTime: 5,
              sources: ['CBN reports', 'Binance Africa data']
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-1',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin adoption in Nigeria',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Bitcoin', 'Nigeria', 'adoption'],
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
        expect(result.content.title).toContain('Nigeria');
        expect(result.content.qualityScore).toBeGreaterThan(75);
        expect(result.content.wordCount).toBeGreaterThan(800);
      }
    });

    it('should reject low-quality content below quality threshold', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Crypto News',
              content: 'Short content here.',
              excerpt: 'Brief excerpt',
              keywords: ['crypto'],
              qualityScore: 45, // Below threshold
              wordCount: 100,
              readingTime: 1
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-2',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Generic crypto topic',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['crypto'],
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('quality threshold');
    });

    it('should validate content structure and required fields', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              // Missing title field
              content: 'Some content here...',
              excerpt: 'Some excerpt',
              qualityScore: 85
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-3',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Test topic',
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid content structure');
    });
  });

  describe('Plagiarism Detection Tests', () => {
    it('should detect potential plagiarism in generated content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bitcoin Price Analysis',
              content: 'This is clearly copied content from another source...',
              excerpt: 'Analysis excerpt',
              keywords: ['Bitcoin', 'price'],
              qualityScore: 80,
              wordCount: 1000,
              plagiarismRisk: 95 // High plagiarism risk
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-4',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin price analysis',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Bitcoin', 'price'],
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('plagiarism risk');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('High plagiarism risk detected')
      );
    });

    it('should perform similarity check against existing articles', async () => {
      // Mock existing articles in database
      mockFindMany.mockResolvedValue([
        {
          id: 'existing-1',
          title: 'Bitcoin in Nigeria',
          content: 'Nigeria Bitcoin adoption content...',
          excerpt: 'Bitcoin excerpt'
        }
      ]);

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bitcoin in Nigeria - Analysis',
              content: 'Nigeria Bitcoin adoption content with slight variations...',
              excerpt: 'Bitcoin analysis excerpt',
              keywords: ['Bitcoin', 'Nigeria'],
              qualityScore: 80,
              wordCount: 1000,
              plagiarismRisk: 25
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-5',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin in Nigeria analysis',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Bitcoin', 'Nigeria'],
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

      expect(mockFindMany).toHaveBeenCalled();
      // Should call similarity check function
      expect(result.similarityCheck).toBeDefined();
    });
  });

  describe('African Context Tests', () => {
    it('should integrate African market context into content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'MTN Money Partners with Crypto Exchange in Ghana',
              content: 'Ghana crypto users can now use MTN Money for deposits...',
              excerpt: 'MTN Money integration brings convenience...',
              keywords: ['MTN Money', 'Ghana', 'crypto', 'mobile money'],
              qualityScore: 88,
              wordCount: 1200,
              readingTime: 5,
              africanRelevance: {
                score: 95,
                mentionedCountries: ['Ghana'],
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
        id: 'test-task-6',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Mobile money crypto integration in Ghana',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['MTN Money', 'Ghana', 'crypto'],
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
        expect(result.content.africanRelevance).toBeDefined();
        expect(result.content.africanRelevance.score).toBeGreaterThan(85);
        expect(result.content.africanRelevance.mentionedCountries).toContain('Ghana');
        expect(result.content.africanRelevance.mobileMoneyIntegration).toBe(true);
      }
    });

    it('should incorporate real-time African exchange data', async () => {
      // Mock market data
      mockFindMany.mockResolvedValue([
        {
          symbol: 'BTC',
          exchange: 'Binance_Africa',
          price: 45000,
          volume24h: 1500000,
          change24h: 3.5,
          timestamp: new Date()
        }
      ]);

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Bitcoin Hits $45,000 on Binance Africa',
              content: 'Bitcoin trading at $45,000 on Binance Africa with 3.5% daily gain...',
              excerpt: 'Strong Bitcoin performance on African exchanges...',
              keywords: ['Bitcoin', 'Binance Africa', 'price'],
              qualityScore: 82,
              wordCount: 1000,
              marketDataIntegration: {
                realTimeData: true,
                exchanges: ['Binance_Africa'],
                pricePoints: [45000],
                volumeData: true
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-7',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin price movement on African exchanges',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['Bitcoin', 'price', 'Africa'],
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

      expect(mockFindMany).toHaveBeenCalled();
      expect(result.content).toBeDefined();
      if (result.content && result.content.marketDataIntegration) {
        expect(result.content.marketDataIntegration).toBeDefined();
        expect(result.content.marketDataIntegration.realTimeData).toBe(true);
      }
    });

    it('should validate African cultural sensitivity', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Ramadan Trading Patterns in African Crypto Markets',
              content: 'During Ramadan, crypto trading patterns shift in Muslim-majority regions...',
              excerpt: 'Religious observances impact trading...',
              keywords: ['Ramadan', 'Africa', 'crypto', 'trading'],
              qualityScore: 85,
              wordCount: 1100,
              culturalSensitivity: {
                score: 92,
                religiousContext: true,
                culturalReferences: ['Ramadan', 'Islamic finance'],
                sensitiveTopics: [],
                appropriateLanguage: true
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-8',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Religious considerations in African crypto trading',
          targetLanguages: ['en'],
          africanContext: {
            ...mockAfricanContext,
            culturalContext: {
              ...mockAfricanContext.culturalContext,
              religiousConsiderations: ['Islamic', 'Christian'],
              culturalEvents: ['Ramadan', 'Christmas']
            }
          },
          contentType: 'article',
          keywords: ['Ramadan', 'crypto', 'Africa'],
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
      if (result.content && result.content.culturalSensitivity) {
        expect(result.content.culturalSensitivity).toBeDefined();
        expect(result.content.culturalSensitivity.score).toBeGreaterThan(85);
        expect(result.content.culturalSensitivity.appropriateLanguage).toBe(true);
      }
    });
  });

  describe('Multi-format Content Generation', () => {
    it('should generate article format content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Long-form Article Title',
              content: 'Detailed article content with multiple paragraphs...',
              excerpt: 'Comprehensive article excerpt',
              keywords: ['article', 'crypto', 'africa'],
              qualityScore: 85,
              wordCount: 1500,
              readingTime: 6,
              format: 'article'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-9',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Test article topic',
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

      expect(result.content).toBeDefined();
      if (result.content) {
        expect(result.content.format).toBe('article');
        expect(result.content.wordCount).toBeGreaterThan(1000);
        expect(result.content.readingTime).toBeGreaterThan(4);
      }
    });

    it('should generate summary format content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Market Summary: African Crypto Activity',
              content: 'Brief summary of key market movements...',
              excerpt: 'Quick market overview',
              keywords: ['summary', 'market', 'africa'],
              qualityScore: 88,
              wordCount: 300,
              readingTime: 1,
              format: 'summary'
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-10',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Daily market summary',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'summary',
          keywords: ['summary', 'daily'],
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

      expect(result.content).toBeDefined();
      if (result.content) {
        expect(result.content.format).toBe('summary');
        expect(result.content.wordCount).toBeLessThan(500);
        expect(result.content.readingTime).toBeLessThan(3);
      }
    });

    it('should generate social post format content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: '🚀 Bitcoin Surges in Nigeria!',
              content: 'Bitcoin hits new highs on Nigerian exchanges! 📈 #Bitcoin #Nigeria #Crypto',
              excerpt: 'Social media post about Bitcoin surge',
              keywords: ['bitcoin', 'nigeria', 'social'],
              qualityScore: 82,
              wordCount: 25,
              format: 'social_post',
              socialOptimization: {
                hashtags: ['#Bitcoin', '#Nigeria', '#Crypto'],
                emojis: true,
                characterCount: 85,
                platform: 'twitter'
              }
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-11',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Bitcoin surge social media post',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'social_post',
          keywords: ['bitcoin', 'surge'],
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

      expect(result.content).toBeDefined();
      if (result.content && result.content.socialOptimization) {
        expect(result.content.format).toBe('social_post');
        expect(result.content.socialOptimization).toBeDefined();
        expect(result.content.socialOptimization.hashtags).toEqual(
          expect.arrayContaining(['#Bitcoin', '#Nigeria', '#Crypto'])
        );
        expect(result.content.wordCount).toBeLessThan(100);
      }
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      const task: ContentGenerationTask = {
        id: 'test-task-12',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Test topic',
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

      expect(result.success).toBe(false);
      expect(result.error).toContain('OpenAI API');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should retry failed tasks up to maxRetries', async () => {
      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockRejectedValueOnce(new Error('Another error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Success after retries',
                content: 'Content generated after retries...',
                excerpt: 'Retry test excerpt',
                qualityScore: 85,
                wordCount: 1000
              })
            }
          }]
        });

      const task: ContentGenerationTask = {
        id: 'test-task-13',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Retry test topic',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['retry'],
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
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it('should complete processing within performance requirements', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Performance Test Article',
              content: 'Fast generated content...',
              excerpt: 'Performance test',
              qualityScore: 85,
              wordCount: 1000
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const task: ContentGenerationTask = {
        id: 'test-task-14',
        type: AgentType.CONTENT_GENERATION,
        priority: TaskPriority.URGENT,
        status: TaskStatus.QUEUED,
        payload: {
          topic: 'Performance test',
          targetLanguages: ['en'],
          africanContext: mockAfricanContext,
          contentType: 'article',
          keywords: ['performance'],
          sources: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 500 // Sub-500ms requirement
        }
      };

      const startTime = Date.now();
      const result = await contentAgent.processTask(task);
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(500); // Sub-500ms requirement
    });
  });
});