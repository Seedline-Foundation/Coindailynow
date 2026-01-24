/**
 * Quality Review Agent GraphQL Resolvers - Task 12
 * GraphQL resolvers for quality review operations with Google Gemini integration
 */

import { QualityReviewAgent, QualityReviewConfig } from '../agents/qualityReviewAgent';
import {
  QualityReviewTask,
  AfricanMarketContext,
  AgentType,
  TaskPriority,
  TaskStatus
} from '../types/ai-system';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export interface QualityReviewInput {
  contentId: string;
  content: string;
  contentType: string;
  reviewCriteria: string[];
  africanContext: AfricanMarketContextInput;
  requiresFactCheck?: boolean;
  priority?: TaskPriority;
}

export interface AfricanMarketContextInput {
  region: 'west' | 'east' | 'north' | 'south' | 'central';
  countries: string[];
  languages: string[];
  exchanges: string[];
  mobileMoneyProviders: string[];
  timezone: string;
  culturalContext?: any;
}

export interface QualityReviewResponse {
  success: boolean;
  taskId: string;
  review?: QualityReviewDetails;
  error?: string;
  processingTime: number;
}

export interface QualityReviewDetails {
  overallQuality: number;
  dimensions: QualityDimensionsInfo;
  biasAnalysis: BiasAnalysisInfo;
  culturalAnalysis?: CulturalAnalysisInfo;
  factCheck?: FactCheckInfo;
  improvementSuggestions?: ImprovementSuggestionInfo[];
  recommendations: string[];
  requiresHumanReview: boolean;
}

export interface QualityDimensionsInfo {
  accuracy: number;
  clarity: number;
  engagement: number;
  structure: number;
  grammar: number;
  factualConsistency: number;
  africanRelevance: number;
  culturalSensitivity: number;
}

export interface BiasAnalysisInfo {
  overallBias: number;
  types: string[];
  concerns: string[];
  details?: BiasDetailsInfo;
}

export interface BiasDetailsInfo {
  culturalBias: number;
  geographicBias: number;
  economicBias: number;
  genderBias: number;
  ageBias: number;
  religiousBias?: number;
}

export interface CulturalAnalysisInfo {
  religiousContext: ReligiousContextInfo;
  languageUsage: LanguageUsageInfo;
  socialContext: SocialContextInfo;
}

export interface ReligiousContextInfo {
  score: number;
  considerations: string[];
}

export interface LanguageUsageInfo {
  score: number;
  localTerms: string[];
  appropriateness: string;
  issues?: string[];
}

export interface SocialContextInfo {
  score: number;
  communityAspects: string[];
  economicRealities: string;
}

export interface FactCheckInfo {
  score: number;
  verifiedClaims: string[];
  questionableClaims: string[];
  falseClaims: string[];
  sources: string[];
}

export interface ImprovementSuggestionInfo {
  category: string;
  priority: string;
  suggestion: string;
  specificChanges: string[];
}

export interface QualityReviewTaskInfo {
  id: string;
  contentId: string;
  contentType: string;
  status: string;
  overallQuality?: number;
  biasScore?: number;
  createdAt: string;
  completedAt?: string;
}

export const qualityReviewResolvers = (
  prisma: PrismaClient, 
  logger: Logger,
  qualityAgent: QualityReviewAgent
) => ({
  Query: {
    /**
     * Get quality review agent status and metrics
     */
    qualityReviewStatus: async () => {
      try {
        const metrics = qualityAgent.getMetrics();
        
        return {
          status: 'active',
          metrics: {
            totalTasksProcessed: metrics.totalTasksProcessed,
            successRate: metrics.successRate,
            averageQualityScore: metrics.averageQualityScore,
            averageProcessingTime: metrics.averageProcessingTime,
            biasDetectionRate: metrics.biasDetectionRate,
            culturalSensitivityScore: metrics.culturalSensitivityScore,
            factCheckAccuracy: metrics.factCheckAccuracy
          },
          capabilities: [
            'content_quality_assessment',
            'bias_detection',
            'cultural_sensitivity_review',
            'fact_checking',
            'improvement_suggestions',
            'african_context_evaluation',
            'religious_sensitivity_analysis',
            'misinformation_detection'
          ],
          reviewCriteria: [
            'accuracy',
            'clarity', 
            'engagement',
            'structure',
            'grammar',
            'factual_consistency',
            'african_relevance',
            'cultural_sensitivity',
            'bias_detection',
            'fact_checking',
            'religious_context'
          ],
          supportedContentTypes: [
            'article',
            'summary',
            'social_post',
            'newsletter',
            'research_report'
          ],
          biasDetectionTypes: [
            'cultural',
            'geographic',
            'economic',
            'gender',
            'age',
            'religious',
            'confirmation',
            'selection'
          ]
        };
      } catch (error) {
        logger.error('Failed to get quality review agent status', { 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
        throw new Error('Failed to retrieve agent status');
      }
    },

    /**
     * Get recent quality review tasks
     */
    recentQualityReviews: async (_: any, args: { limit?: number }) => {
      try {
        const limit = Math.min(args.limit || 10, 50);

        // In production, this would fetch from an AI tasks table
        // For now, we'll return mock data based on recent articles
        const recentArticles = await prisma.article.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        return recentArticles.map(article => ({
          id: `review-${article.id}`,
          contentId: article.id,
          contentType: 'article',
          status: 'completed',
          overallQuality: Math.floor(Math.random() * 20) + 80, // Mock quality score 80-100
          biasScore: Math.floor(Math.random() * 15), // Mock bias score 0-15
          createdAt: article.createdAt.toISOString(),
          completedAt: new Date().toISOString()
        }));
      } catch (error) {
        logger.error('Failed to get recent quality review tasks', { 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
        throw new Error('Failed to retrieve recent tasks');
      }
    }
  },

  Mutation: {
    /**
     * Review content quality using the quality review agent
     */
    reviewContentQuality: async (_: any, args: { input: QualityReviewInput }) => {
      const startTime = Date.now();
      
      try {
        logger.info('Quality review requested via GraphQL', {
          contentId: args.input.contentId,
          contentType: args.input.contentType,
          reviewCriteria: args.input.reviewCriteria,
          requiresFactCheck: args.input.requiresFactCheck || false
        });

        // Generate unique task ID
        const taskId = `quality-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create quality review task
        const task: QualityReviewTask = {
          id: taskId,
          type: AgentType.QUALITY_REVIEW,
          priority: args.input.priority || TaskPriority.NORMAL,
          status: TaskStatus.QUEUED,
          payload: {
            contentId: args.input.contentId,
            content: args.input.content,
            contentType: args.input.contentType,
            reviewCriteria: args.input.reviewCriteria,
            africanContext: args.input.africanContext as AfricanMarketContext,
            requiresFactCheck: args.input.requiresFactCheck || false
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            retryCount: 0,
            maxRetries: 3,
            timeoutMs: 30000
          }
        };

        // Process the task
        const result = await qualityAgent.processTask(task);

        const processingTime = Date.now() - startTime;

        if (result.success && result.review) {
          // Log successful review
          logger.info('Quality review completed successfully via GraphQL', {
            taskId,
            processingTime,
            qualityScore: result.review.overallQuality,
            biasScore: result.review.biasAnalysis.overallBias,
            requiresHumanReview: result.review.requiresHumanReview
          });

          const response: QualityReviewResponse = {
            success: true,
            taskId,
            review: {
              overallQuality: result.review.overallQuality,
              dimensions: {
                accuracy: result.review.dimensions.accuracy,
                clarity: result.review.dimensions.clarity,
                engagement: result.review.dimensions.engagement,
                structure: result.review.dimensions.structure,
                grammar: result.review.dimensions.grammar,
                factualConsistency: result.review.dimensions.factualConsistency,
                africanRelevance: result.review.dimensions.africanRelevance,
                culturalSensitivity: result.review.dimensions.culturalSensitivity
              },
              biasAnalysis: {
                overallBias: result.review.biasAnalysis.overallBias,
                types: result.review.biasAnalysis.types,
                concerns: result.review.biasAnalysis.concerns,
                details: result.review.biasAnalysis.details ? {
                  culturalBias: result.review.biasAnalysis.details.culturalBias,
                  geographicBias: result.review.biasAnalysis.details.geographicBias,
                  economicBias: result.review.biasAnalysis.details.economicBias,
                  genderBias: result.review.biasAnalysis.details.genderBias,
                  ageBias: result.review.biasAnalysis.details.ageBias,
                  religiousBias: result.review.biasAnalysis.details.religiousBias
                } : undefined
              } as any,
              culturalAnalysis: result.review.culturalAnalysis ? {
                religiousContext: {
                  score: result.review.culturalAnalysis.religiousContext.score,
                  considerations: result.review.culturalAnalysis.religiousContext.considerations
                },
                languageUsage: {
                  score: result.review.culturalAnalysis.languageUsage.score,
                  localTerms: result.review.culturalAnalysis.languageUsage.localTerms,
                  appropriateness: result.review.culturalAnalysis.languageUsage.appropriateness,
                  ...(result.review.culturalAnalysis.languageUsage.issues && {
                    issues: result.review.culturalAnalysis.languageUsage.issues
                  })
                },
                socialContext: {
                  score: result.review.culturalAnalysis.socialContext.score,
                  communityAspects: result.review.culturalAnalysis.socialContext.communityAspects,
                  economicRealities: result.review.culturalAnalysis.socialContext.economicRealities
                }
              } : undefined,
              factCheck: result.review.factCheck ? {
                score: result.review.factCheck.score,
                verifiedClaims: result.review.factCheck.verifiedClaims,
                questionableClaims: result.review.factCheck.questionableClaims,
                falseClaims: result.review.factCheck.falseClaims,
                sources: result.review.factCheck.sources
              } : undefined,
              improvementSuggestions: result.review.improvementSuggestions?.map(suggestion => ({
                category: suggestion.category,
                priority: suggestion.priority,
                suggestion: suggestion.suggestion,
                specificChanges: suggestion.specificChanges
              })),
              recommendations: result.review.recommendations,
              requiresHumanReview: result.review.requiresHumanReview
            } as any,
            processingTime
          };

          return response;
        } else {
          // Log failed review
          logger.error('Quality review failed via GraphQL', {
            taskId,
            processingTime,
            error: result.error
          });

          return {
            success: false,
            taskId,
            error: result.error || 'Quality review failed for unknown reason',
            processingTime
          };
        }

      } catch (error) {
        const processingTime = Date.now() - startTime;
        
        logger.error('Quality review request failed', {
          contentId: args.input.contentId,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime
        });

        return {
          success: false,
          taskId: `error-${Date.now()}`,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          processingTime: 0
        };
      }
    },

    /**
     * Batch review multiple content items
     */
    batchReviewQuality: async (_: any, args: { inputs: QualityReviewInput[] }) => {
      try {
        logger.info('Batch quality review requested', { count: args.inputs.length });

        const results = await Promise.allSettled(
          args.inputs.map(async (input) => {
            const taskId = `batch-review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const task: QualityReviewTask = {
              id: taskId,
              type: AgentType.QUALITY_REVIEW,
              priority: input.priority || TaskPriority.NORMAL,
              status: TaskStatus.QUEUED,
              payload: {
                contentId: input.contentId,
                content: input.content,
                contentType: input.contentType,
                reviewCriteria: input.reviewCriteria,
                africanContext: input.africanContext as AfricanMarketContext,
                requiresFactCheck: input.requiresFactCheck || false
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
            
            return {
              contentId: input.contentId,
              taskId,
              success: result.success,
              overallQuality: result.review?.overallQuality || 0,
              biasScore: result.review?.biasAnalysis.overallBias || 0,
              requiresHumanReview: result.review?.requiresHumanReview || true,
              error: result.error
            };
          })
        );

        const processedResults = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              contentId: args.inputs[index]?.contentId || `unknown-${index}`,
              taskId: `error-${index}-${Date.now()}`,
              success: false,
              overallQuality: 0,
              biasScore: 0,
              requiresHumanReview: true,
              error: result.reason instanceof Error ? result.reason.message : 'Batch processing failed'
            };
          }
        });

        const successCount = processedResults.filter(r => r.success).length;
        const averageQuality = processedResults.reduce((sum, r) => sum + r.overallQuality, 0) / processedResults.length;

        logger.info('Batch quality review completed', {
          total: args.inputs.length,
          successful: successCount,
          averageQuality
        });

        return {
          success: successCount > 0,
          totalProcessed: args.inputs.length,
          successfulReviews: successCount,
          failedReviews: args.inputs.length - successCount,
          averageQuality,
          results: processedResults
        };

      } catch (error) {
        logger.error('Batch quality review failed', {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });

        return {
          success: false,
          totalProcessed: args.inputs.length,
          successfulReviews: 0,
          failedReviews: args.inputs.length,
          averageQuality: 0,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }
  }
});