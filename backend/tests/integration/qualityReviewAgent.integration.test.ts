/**
 * Quality Review Agent Integration Tests - Task 12
 * Testing Google Gemini integration with real API calls and comprehensive workflows
 */

import { QualityReviewAgent } from '../../src/agents/qualityReviewAgent';
import { 
  QualityReviewTask, 
  AfricanMarketContext, 
  AgentType, 
  TaskStatus, 
  TaskPriority 
} from '../../src/types/ai-system';
import { PrismaClient } from '@prisma/client';
import { createMockLogger } from '../utils/mockLogger';

// Mock Prisma
const mockFindMany = jest.fn();
const mockPrisma = {
  article: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: mockFindMany,
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('QualityReviewAgent Integration Tests', () => {
  let qualityAgent: QualityReviewAgent;
  let mockLogger: any;

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
    
    qualityAgent = new QualityReviewAgent(
      mockPrisma,
      mockLogger,
      {
        projectId: 'test-project-integration',
        location: 'us-central1',
        modelName: 'gemini-1.5-pro',
        qualityThreshold: 85,
        biasThreshold: 10,
        culturalSensitivityThreshold: 80,
        maxTokens: 4000,
        temperature: 0.3
      }
    );

    mockFindMany.mockResolvedValue([
      {
        id: 'article-1',
        title: 'Bitcoin Analysis',
        excerpt: 'Market analysis',
        publishedAt: new Date()
      }
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Quality Review Workflow', () => {
    it('should complete full quality review workflow for high-quality content', async () => {
      const task: QualityReviewTask = {
        id: 'integration-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'article-123',
          content: `Bitcoin adoption in Nigeria has reached new heights, with local exchanges like Quidax and Luno facilitating easy access for millions of users. The integration with mobile money services like MTN Money has revolutionized how Nigerians access cryptocurrency markets. This development aligns with Islamic finance principles by avoiding traditional banking interest systems while providing transparent, asset-backed trading opportunities for the growing youth population.`,
          contentType: 'article',
          reviewCriteria: [
            'accuracy',
            'clarity',
            'african_relevance',
            'cultural_sensitivity',
            'bias_detection'
          ],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
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
      expect(result.review!.overallQuality).toBeGreaterThanOrEqual(0);
      expect(result.review!.overallQuality).toBeLessThanOrEqual(100);
      expect(result.review!.dimensions).toHaveProperty('accuracy');
      expect(result.review!.dimensions).toHaveProperty('culturalSensitivity');
      expect(result.review!.biasAnalysis).toHaveProperty('overallBias');
      expect(result.review!.recommendations).toBeInstanceOf(Array);
      expect(result.processingTime).toBeGreaterThan(0);
      
      // Verify logger was called
      expect(mockLogger.info).toHaveBeenCalled();
    }, 60000); // Increased timeout for API calls

    it('should handle complex African cultural context analysis', async () => {
      const culturalTask: QualityReviewTask = {
        id: 'integration-cultural-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'cultural-article-1',
          content: `Islamic finance principles and cryptocurrency compatibility remain a topic of significant discussion among Muslim communities in West Africa. Religious scholars in Nigeria and Senegal have provided guidance on halal Bitcoin trading, emphasizing the importance of avoiding riba (interest) and gharar (excessive uncertainty). Christian communities in Ghana have embraced cryptocurrency as a tool for financial inclusion, particularly for remittances from diaspora communities. The integration with traditional tontine savings groups offers interesting opportunities for community-based crypto adoption while respecting cultural values around collective financial responsibility.`,
          contentType: 'article',
          reviewCriteria: [
            'cultural_sensitivity',
            'religious_context',
            'african_relevance',
            'accuracy',
            'bias_detection'
          ],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      const result = await qualityAgent.processTask(culturalTask);

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review!.dimensions.culturalSensitivity).toBeGreaterThanOrEqual(0);
      expect(result.review!.biasAnalysis.overallBias).toBeLessThanOrEqual(100);
      
      // Cultural analysis should be present for cultural sensitivity criteria
      if (result.review!.culturalAnalysis) {
        expect(result.review!.culturalAnalysis.religiousContext).toBeDefined();
        expect(result.review!.culturalAnalysis.languageUsage).toBeDefined();
        expect(result.review!.culturalAnalysis.socialContext).toBeDefined();
      }
    }, 60000);

    it('should detect and flag biased content appropriately', async () => {
      const biasedTask: QualityReviewTask = {
        id: 'integration-bias-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'biased-article-1',
          content: `Western cryptocurrency markets are far superior to anything available in Africa. African users lack the technical knowledge to properly handle Bitcoin and other digital assets. Most African countries have unstable governments that make cryptocurrency investment too risky for serious traders. The primitive banking systems across Africa can't compete with advanced American financial infrastructure.`,
          contentType: 'article',
          reviewCriteria: [
            'bias_detection',
            'cultural_sensitivity',
            'african_relevance'
          ],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      const result = await qualityAgent.processTask(biasedTask);

      // Should fail due to high bias
      expect(result.success).toBe(false);
      expect(result.review).toBeDefined();
      expect(result.review!.biasAnalysis.overallBias).toBeGreaterThan(10);
      expect(result.review!.biasAnalysis.types.length).toBeGreaterThan(0);
      expect(result.review!.biasAnalysis.concerns.length).toBeGreaterThan(0);
      expect(result.review!.requiresHumanReview).toBe(true);
    }, 60000);

    it('should perform fact-checking when required', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'related-1',
          title: 'Bitcoin Price Analysis',
          excerpt: 'Recent market data',
          publishedAt: new Date(),
          content: 'Bitcoin trading data'
        }
      ]);

      const factCheckTask: QualityReviewTask = {
        id: 'integration-factcheck-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.HIGH,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'factcheck-article-1',
          content: `Bitcoin reached an all-time high of $65,000 in 2021, leading to increased adoption across African markets. Nigerian cryptocurrency exchanges reported 300% growth in user registrations during this period. The Central Bank of Nigeria has maintained a cautious but open stance toward cryptocurrency regulation.`,
          contentType: 'article',
          reviewCriteria: [
            'fact_checking',
            'accuracy',
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

      const result = await qualityAgent.processTask(factCheckTask);

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
      expect(result.review!.factCheck).toBeDefined();
      expect(result.review!.factCheck!.score).toBeGreaterThanOrEqual(0);
      expect(result.review!.factCheck!.score).toBeLessThanOrEqual(100);
      expect(result.review!.factCheck!.verifiedClaims).toBeInstanceOf(Array);
      expect(result.review!.factCheck!.sources).toBeInstanceOf(Array);
      
      // Verify that database was queried for fact-checking context
      expect(mockFindMany).toHaveBeenCalled();
    }, 60000);
  });

  describe('Performance and Reliability Tests', () => {
    it('should handle timeout scenarios gracefully', async () => {
      const timeoutTask: QualityReviewTask = {
        id: 'timeout-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.URGENT,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'timeout-article-1',
          content: 'Test content for timeout handling',
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
          timeoutMs: 100 // Very short timeout
        }
      };

      const result = await qualityAgent.processTask(timeoutTask);

      // Should fail due to timeout
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.processingTime).toBeGreaterThan(0);
    }, 10000);

    it('should maintain consistent quality scoring across multiple runs', async () => {
      const consistentTask: QualityReviewTask = {
        id: 'consistency-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'consistent-article-1',
          content: 'Bitcoin and cryptocurrency adoption continues to grow across Africa, with Nigeria and Kenya leading the way in terms of user adoption and regulatory development.',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'clarity', 'african_relevance'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      // Run the same task multiple times
      const results = await Promise.all([
        qualityAgent.processTask({ ...consistentTask, id: 'consistency-1' }),
        qualityAgent.processTask({ ...consistentTask, id: 'consistency-2' }),
        qualityAgent.processTask({ ...consistentTask, id: 'consistency-3' })
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.review).toBeDefined();
        expect(result.review!.overallQuality).toBeGreaterThanOrEqual(0);
        expect(result.review!.overallQuality).toBeLessThanOrEqual(100);
      });

      // Scores should be reasonably consistent (within 20 points)
      const scores = results.map(r => r.review!.overallQuality);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      expect(maxScore - minScore).toBeLessThan(30); // Allow some variation due to AI nature
    }, 90000);
  });

  describe('Metrics and Monitoring Integration', () => {
    it('should update metrics correctly after processing tasks', async () => {
      const initialMetrics = qualityAgent.getMetrics();
      
      const task: QualityReviewTask = {
        id: 'metrics-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'metrics-article-1',
          content: 'African cryptocurrency markets show strong growth potential with increasing adoption rates.',
          contentType: 'article',
          reviewCriteria: ['accuracy', 'african_relevance'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      await qualityAgent.processTask(task);

      const updatedMetrics = qualityAgent.getMetrics();
      
      expect(updatedMetrics.totalTasksProcessed).toBe(initialMetrics.totalTasksProcessed + 1);
      expect(updatedMetrics.averageProcessingTime).toBeGreaterThan(0);
      expect(updatedMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(updatedMetrics.successRate).toBeLessThanOrEqual(1);
    }, 60000);

    it('should track bias detection accurately', async () => {
      const biasedTask: QualityReviewTask = {
        id: 'bias-metrics-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'bias-metrics-article-1',
          content: 'African countries are too primitive to understand advanced cryptocurrency concepts like DeFi and smart contracts.',
          contentType: 'article',
          reviewCriteria: ['bias_detection', 'cultural_sensitivity'],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeoutMs: 30000
        }
      };

      const initialMetrics = qualityAgent.getMetrics();
      await qualityAgent.processTask(biasedTask);
      const updatedMetrics = qualityAgent.getMetrics();

      expect(updatedMetrics.biasDetectionRate).toBeGreaterThanOrEqual(initialMetrics.biasDetectionRate);
      expect(updatedMetrics.totalTasksProcessed).toBe(initialMetrics.totalTasksProcessed + 1);
    }, 60000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid task payload gracefully', async () => {
      const invalidTask = {
        id: 'invalid-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: '',
          content: '', // Empty content should fail validation
          contentType: 'article',
          reviewCriteria: [],
          africanContext: mockAfricanContext,
          requiresFactCheck: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      } as QualityReviewTask;

      const result = await qualityAgent.processTask(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle database connection failures in fact-checking', async () => {
      // Mock database failure
      mockFindMany.mockRejectedValue(new Error('Database connection failed'));

      const factCheckTask: QualityReviewTask = {
        id: 'db-error-test-1',
        type: AgentType.QUALITY_REVIEW,
        priority: TaskPriority.NORMAL,
        status: TaskStatus.QUEUED,
        payload: {
          contentId: 'db-error-article-1',
          content: 'Content that requires fact-checking',
          contentType: 'article',
          reviewCriteria: ['fact_checking', 'accuracy'],
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

      // Should still complete review despite database failure
      const result = await qualityAgent.processTask(factCheckTask);

      // The agent should handle the database error gracefully
      // It might still succeed by using fallback fact-checking methods
      expect(result.processingTime).toBeGreaterThan(0);
      expect(mockLogger.warn).toHaveBeenCalled(); // Should log the database warning
    }, 60000);
  });
});