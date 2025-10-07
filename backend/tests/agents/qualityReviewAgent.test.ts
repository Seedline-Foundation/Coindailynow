/**
 * Quality Review Agent Tests - Task 12
 * TDD Requirements: Review criteria tests, accuracy validation tests, bias detection tests
 * Testing Google Gemini integration for content quality review and bias detection
 */

import { QualityReviewAgent } from '../../src/agents/qualityReviewAgent';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { createMockLogger } from '../utils/mockLogger';
import { 
  QualityReviewTask, 
  AfricanMarketContext, 
  AgentType, 
  TaskStatus, 
  TaskPriority 
} from '../../src/types/ai-system';

// Mock Google Generative AI
jest.mock('@google-cloud/vertexai');

// Mock Prisma
const mockPrisma = {
  article: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  aITask: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('QualityReviewAgent', () => {
  let qualityAgent: QualityReviewAgent;
  let mockLogger: Logger;
  let mockVertexAI: any;

  const mockAfricanContext: AfricanMarketContext = {
    region: 'west',
    countries: ['Nigeria', 'Ghana'],
    languages: ['en', 'ha', 'yo'],
    exchanges: ['Quidax', 'Luno'],
    mobileMoneyProviders: ['MTN Money', 'Airtel Money'],
    timezone: 'Africa/Lagos',
    culturalContext: {
      religiousConsiderations: ['Islamic', 'Christian'],
      localCurrencies: ['NGN', 'GHS']
    }
  };

  beforeEach(() => {
    mockLogger = createMockLogger();
    
    // Mock Vertex AI
    mockVertexAI = {
      init: jest.fn(),
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      })
    };
    
    // Mock the module
    const { VertexAI } = require('@google-cloud/vertexai');
    VertexAI.mockImplementation(() => mockVertexAI);

    qualityAgent = new QualityReviewAgent(
      mockPrisma,
      mockLogger,
      {
        projectId: 'test-project',
        location: 'us-central1',
        modelName: 'gemini-1.5-pro',
        qualityThreshold: 85,
        biasThreshold: 10,
        culturalSensitivityThreshold: 80,
        maxTokens: 4000,
        temperature: 0.3
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Review Criteria Tests', () => {
    it('should evaluate content quality with comprehensive criteria', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 88,
            dimensions: {
              accuracy: 90,
              clarity: 85,
              engagement: 87,
              structure: 89,
              grammar: 92,
              factualConsistency: 88,
              africanRelevance: 85,
              culturalSensitivity: 90
            },
            biasAnalysis: {
              overallBias: 5,
              types: [],
              concerns: []
            },
            recommendations: [
              'Consider adding more local price examples',
              'Include references to mobile money integration'
            ],
            requiresHumanReview: false
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'quality-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-123',
          content: 'Bitcoin adoption in Nigeria has surged despite regulatory challenges...',
          contentType: 'article',
          reviewCriteria: [
            'accuracy',
            'clarity', 
            'cultural_sensitivity',
            'bias_detection',
            'african_relevance'
          ],
          africanContext: mockAfricanContext,
          requiresFactCheck: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review!.overallQuality).toBeGreaterThan(85);
      expect(result.review!.dimensions).toHaveProperty('accuracy');
      expect(result.review!.dimensions).toHaveProperty('culturalSensitivity');
      expect(result.review!.biasAnalysis).toBeDefined();
      expect(result.review!.recommendations).toBeInstanceOf(Array);
    });

    it('should reject content below quality threshold', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 70, // Below 85 threshold
            dimensions: {
              accuracy: 65,
              clarity: 72,
              engagement: 68,
              structure: 75,
              grammar: 80,
              factualConsistency: 60,
              africanRelevance: 45,
              culturalSensitivity: 85
            },
            biasAnalysis: {
              overallBias: 8,
              types: ['geographic'],
              concerns: ['Western-centric perspective']
            },
            recommendations: [
              'Add more African market context',
              'Include local exchange data',
              'Improve factual accuracy'
            ],
            requiresHumanReview: true
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'quality-test-2',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-124',
          content: 'Crypto prices are volatile today.',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'african_relevance'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.review!.overallQuality).toBeLessThan(85);
      expect(result.review!.requiresHumanReview).toBe(true);
      expect(result.review!.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Bias Detection Tests', () => {
    it('should detect various types of bias in content', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 75,
            dimensions: {
              accuracy: 85,
              clarity: 80,
              engagement: 75,
              structure: 80,
              grammar: 85,
              factualConsistency: 80,
              africanRelevance: 60,
              culturalSensitivity: 50
            },
            biasAnalysis: {
              overallBias: 25, // High bias
              types: [
                'cultural', 
                'geographic', 
                'economic'
              ],
              concerns: [
                'Western-centric cryptocurrency assumptions',
                'Ignores African mobile money context',
                'Uses US-focused regulatory examples'
              ],
              details: {
                culturalBias: 30,
                geographicBias: 25,
                economicBias: 20,
                genderBias: 5,
                ageBias: 8
              }
            },
            recommendations: [
              'Incorporate African regulatory landscape',
              'Reference local mobile money solutions',
              'Include perspectives from African crypto users'
            ],
            requiresHumanReview: true
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'bias-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-125',
          content: 'Americans are leading the crypto revolution with advanced regulations...',
          contentType: 'article',
          reviewCriteria: ['bias_detection', 'cultural_sensitivity'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.review!.biasAnalysis.overallBias).toBeGreaterThan(10);
      expect(result.review!.biasAnalysis.types).toContain('cultural');
      expect(result.review!.biasAnalysis.types).toContain('geographic');
      expect(result.review!.biasAnalysis.concerns.length).toBeGreaterThan(0);
    });

    it('should pass content with minimal bias', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 90,
            dimensions: {
              accuracy: 92,
              clarity: 88,
              engagement: 89,
              structure: 90,
              grammar: 93,
              factualConsistency: 91,
              africanRelevance: 88,
              culturalSensitivity: 92
            },
            biasAnalysis: {
              overallBias: 5, // Low bias
              types: [],
              concerns: [],
              details: {
                culturalBias: 3,
                geographicBias: 5,
                economicBias: 4,
                genderBias: 2,
                ageBias: 3
              }
            },
            recommendations: [
              'Excellent African context integration',
              'Well-balanced perspective maintained'
            ],
            requiresHumanReview: false
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'bias-test-2',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-126',
          content: 'African cryptocurrency exchanges like Quidax and Luno are expanding access to Bitcoin across Nigeria and Ghana, integrating with local mobile money providers...',
          contentType: 'article',
          reviewCriteria: ['bias_detection', 'african_relevance'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.review!.biasAnalysis.overallBias).toBeLessThan(10);
      expect(result.review!.biasAnalysis.types).toHaveLength(0);
      expect(result.review!.requiresHumanReview).toBe(false);
    });
  });

  describe('African Cultural Sensitivity Tests', () => {
    it('should evaluate cultural sensitivity for African markets', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 87,
            dimensions: {
              accuracy: 88,
              clarity: 85,
              engagement: 87,
              structure: 89,
              grammar: 90,
              factualConsistency: 86,
              africanRelevance: 92,
              culturalSensitivity: 95
            },
            culturalAnalysis: {
              religiousContext: {
                score: 90,
                considerations: [
                  'Respectful of Islamic finance principles',
                  'No conflicts with Christian values'
                ]
              },
              languageUsage: {
                score: 88,
                localTerms: ['naira', 'cedi', 'mobile money'],
                appropriateness: 'high'
              },
              socialContext: {
                score: 92,
                communityAspects: ['family remittances', 'informal economy'],
                economicRealities: 'well-addressed'
              }
            },
            biasAnalysis: {
              overallBias: 6,
              types: [],
              concerns: []
            },
            recommendations: [
              'Excellent cultural sensitivity',
              'Strong African market context'
            ],
            requiresHumanReview: false
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'culture-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-127',
          content: 'Bitcoin remittances are helping Nigerian families send money home more efficiently, complementing traditional mobile money services like MTN Money while respecting Islamic finance principles...',
          contentType: 'article',
          reviewCriteria: ['cultural_sensitivity', 'african_relevance', 'religious_context'],
          africanContext: mockAfricanContext,
          requiresFactCheck: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.review!.dimensions.culturalSensitivity).toBeGreaterThan(80);
      expect(result.review!.dimensions.africanRelevance).toBeGreaterThan(80);
      expect(result.review!.culturalAnalysis).toBeDefined();
      expect(result.review!.culturalAnalysis!.religiousContext.score).toBeGreaterThan(80);
    });

    it('should flag culturally insensitive content', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 65,
            dimensions: {
              accuracy: 80,
              clarity: 75,
              engagement: 70,
              structure: 75,
              grammar: 85,
              factualConsistency: 80,
              africanRelevance: 40,
              culturalSensitivity: 30
            },
            culturalAnalysis: {
              religiousContext: {
                score: 25,
                considerations: [
                  'Conflicts with Islamic finance principles',
                  'Dismissive of religious considerations'
                ]
              },
              languageUsage: {
                score: 40,
                localTerms: [],
                appropriateness: 'low',
                issues: ['Western-centric terminology', 'No local context']
              },
              socialContext: {
                score: 35,
                communityAspects: [],
                economicRealities: 'ignored'
              }
            },
            biasAnalysis: {
              overallBias: 30,
              types: ['cultural', 'religious', 'economic'],
              concerns: [
                'Ignores Islamic finance restrictions',
                'No consideration for African economic conditions'
              ]
            },
            recommendations: [
              'Add religious sensitivity considerations',
              'Include African economic context',
              'Use appropriate local terminology'
            ],
            requiresHumanReview: true
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'culture-test-2',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-128',
          content: 'Interest-based crypto lending is the future for everyone...',
          contentType: 'article',
          reviewCriteria: ['cultural_sensitivity', 'religious_context'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.review!.dimensions.culturalSensitivity).toBeLessThan(80);
      expect(result.review!.culturalAnalysis!.religiousContext.score).toBeLessThan(50);
      expect(result.review!.biasAnalysis.types).toContain('cultural');
      expect(result.review!.biasAnalysis.types).toContain('religious');
    });
  });

  describe('Fact-checking Integration Tests', () => {
    it('should perform fact-checking when required', async () => {
      (mockPrisma.article.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          title: 'Bitcoin reaches $50,000',
          content: 'Bitcoin price data...',
          publishedAt: new Date()
        }
      ]);

      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 88,
            dimensions: {
              accuracy: 92,
              clarity: 85,
              engagement: 87,
              structure: 89,
              grammar: 90,
              factualConsistency: 95,
              africanRelevance: 85,
              culturalSensitivity: 88
            },
            factCheck: {
              score: 92,
              verifiedClaims: [
                'Bitcoin price movements are accurate',
                'Market data is current'
              ],
              questionableClaims: [],
              falseClaims: [],
              sources: [
                'CoinGecko API data',
                'Binance price feeds'
              ]
            },
            biasAnalysis: {
              overallBias: 8,
              types: [],
              concerns: []
            },
            recommendations: [
              'Strong factual accuracy',
              'Well-sourced information'
            ],
            requiresHumanReview: false
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'fact-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-129',
          content: 'Bitcoin reached $50,000 today according to major exchanges...',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'fact_checking'],
          africanContext: mockAfricanContext,
          requiresFactCheck: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(true);
      expect(result.review!.factCheck).toBeDefined();
      expect(result.review!.factCheck!.score).toBeGreaterThan(80);
      expect(result.review!.factCheck!.verifiedClaims).toBeInstanceOf(Array);
      expect(mockPrisma.article.findMany).toHaveBeenCalled();
    });

    it('should flag content with factual inconsistencies', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 55,
            dimensions: {
              accuracy: 40,
              clarity: 80,
              engagement: 75,
              structure: 70,
              grammar: 85,
              factualConsistency: 25,
              africanRelevance: 70,
              culturalSensitivity: 80
            },
            factCheck: {
              score: 25,
              verifiedClaims: [],
              questionableClaims: [
                'Unverified price claims',
                'Outdated regulatory information'
              ],
              falseClaims: [
                'Bitcoin is banned in Nigeria (incorrect)',
                'MTN Money blocks all crypto transactions (false)'
              ],
              sources: []
            },
            biasAnalysis: {
              overallBias: 15,
              types: ['confirmation'],
              concerns: ['Selective fact presentation']
            },
            recommendations: [
              'Verify all price claims with current data',
              'Update regulatory information',
              'Correct false statements about African policies'
            ],
            requiresHumanReview: true
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'fact-test-2',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-130',
          content: 'Bitcoin is completely banned in Nigeria and MTN Money blocks all crypto transactions...',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'fact_checking'],
          africanContext: mockAfricanContext,
          requiresFactCheck: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.review!.factCheck!.score).toBeLessThan(50);
      expect(result.review!.factCheck!.falseClaims.length).toBeGreaterThan(0);
      expect(result.review!.requiresHumanReview).toBe(true);
    });
  });

  describe('Content Improvement Tests', () => {
    it('should provide specific improvement suggestions', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 75,
            dimensions: {
              accuracy: 85,
              clarity: 65,
              engagement: 70,
              structure: 60,
              grammar: 90,
              factualConsistency: 85,
              africanRelevance: 50,
              culturalSensitivity: 80
            },
            improvementSuggestions: [
              {
                category: 'structure',
                priority: 'high',
                suggestion: 'Add clear section headers for better readability',
                specificChanges: [
                  'Add introduction paragraph',
                  'Use bullet points for key benefits',
                  'Include conclusion section'
                ]
              },
              {
                category: 'african_context',
                priority: 'high',
                suggestion: 'Incorporate more African market context',
                specificChanges: [
                  'Mention local exchanges like Quidax, Luno',
                  'Reference mobile money integration',
                  'Include local currency examples'
                ]
              },
              {
                category: 'engagement',
                priority: 'medium',
                suggestion: 'Improve reader engagement',
                specificChanges: [
                  'Add compelling statistics',
                  'Include real user examples',
                  'Use more active voice'
                ]
              }
            ],
            biasAnalysis: {
              overallBias: 12,
              types: ['geographic'],
              concerns: ['Limited African perspective']
            },
            recommendations: [
              'Focus on African market integration',
              'Improve content structure and flow'
            ],
            requiresHumanReview: true
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'improve-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-131',
          content: 'Cryptocurrency trading is popular. Many people trade Bitcoin and other coins.',
          contentType: 'article',
          reviewCriteria: ['structure', 'engagement', 'african_relevance'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.review!.improvementSuggestions).toBeInstanceOf(Array);
      expect(result.review!.improvementSuggestions!.length).toBeGreaterThan(0);
      expect(result.review!.improvementSuggestions![0]).toHaveProperty('category');
      expect(result.review!.improvementSuggestions![0]).toHaveProperty('priority');
      expect(result.review!.improvementSuggestions![0]).toHaveProperty('suggestion');
      expect(result.review!.improvementSuggestions![0]).toHaveProperty('specificChanges');
    });
  });

  describe('Performance Tests', () => {
    it('should complete reviews within 500ms response time requirement', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 90,
            dimensions: {
              accuracy: 92,
              clarity: 88,
              engagement: 89,
              structure: 90,
              grammar: 93,
              factualConsistency: 91,
              africanRelevance: 88,
              culturalSensitivity: 92
            },
            biasAnalysis: {
              overallBias: 5,
              types: [],
              concerns: []
            },
            recommendations: ['High quality content'],
            requiresHumanReview: false
          })
        }
      };

      // Mock fast response
      mockVertexAI.getGenerativeModel().generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockGeminiResponse), 200))
      );

      const task: QualityReviewTask = {
        id: 'perf-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.URGENT,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-132',
          content: 'Sample content for performance test',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'clarity'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
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
      const result = await qualityAgent.processTask(task);
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(500);
      expect(result.processingTime).toBeLessThan(500);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock slow response that exceeds timeout
      mockVertexAI.getGenerativeModel().generateContent.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({
            response: {
              text: () => JSON.stringify({ overallQuality: 80 })
            }
          }), 1000); // 1000ms response (should timeout)
        })
      );

      const task: QualityReviewTask = {
        id: 'timeout-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-133',
          content: 'Content for timeout test',
          contentType: 'article',
          reviewCriteria: ['accuracy'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 500
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Agent Metrics Tests', () => {
    it('should track comprehensive agent metrics', () => {
      const metrics = qualityAgent.getMetrics();

      expect(metrics).toHaveProperty('totalTasksProcessed');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageQualityScore');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(metrics).toHaveProperty('biasDetectionRate');
      expect(metrics).toHaveProperty('culturalSensitivityScore');
      expect(metrics).toHaveProperty('factCheckAccuracy');
      expect(typeof metrics.totalTasksProcessed).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.averageQualityScore).toBe('number');
    });

    it('should update metrics after processing tasks', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => JSON.stringify({
            overallQuality: 88,
            dimensions: { accuracy: 90, clarity: 85 },
            biasAnalysis: { overallBias: 5, types: [], concerns: [] },
            recommendations: [],
            requiresHumanReview: false
          })
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const initialMetrics = qualityAgent.getMetrics();

      const task: QualityReviewTask = {
        id: 'metrics-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-134',
          content: 'Test content',
          contentType: 'article',
          reviewCriteria: ['accuracy'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      await qualityAgent.processTask(task);

      const updatedMetrics = qualityAgent.getMetrics();

      expect(updatedMetrics.totalTasksProcessed).toBe(initialMetrics.totalTasksProcessed + 1);
      expect(updatedMetrics.averageQualityScore).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle Gemini API errors gracefully', async () => {
      mockVertexAI.getGenerativeModel().generateContent.mockRejectedValue(
        new Error('Gemini API rate limit exceeded')
      );

      const task: QualityReviewTask = {
        id: 'error-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-135',
          content: 'Test content',
          contentType: 'article',
          reviewCriteria: ['accuracy'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Gemini API');
    });

    it('should handle invalid JSON responses', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => 'Invalid JSON response from Gemini'
        }
      };

      mockVertexAI.getGenerativeModel().generateContent.mockResolvedValue(mockGeminiResponse);

      const task: QualityReviewTask = {
        id: 'json-error-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-136',
          content: 'Test content',
          contentType: 'article',
          reviewCriteria: ['accuracy'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      };

      const result = await qualityAgent.processTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });
  });
});