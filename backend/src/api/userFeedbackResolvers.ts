/**
 * User Feedback GraphQL Resolvers
 * 
 * GraphQL resolvers for user feedback operations
 * 
 * @module UserFeedbackResolvers
 */

import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import { PubSub } from 'graphql-subscriptions';
import UserFeedbackService from '../services/userFeedbackService';

const pubsub = new PubSub();

// ============================================================================
// Event Names
// ============================================================================

const FEEDBACK_SUBMITTED = 'FEEDBACK_SUBMITTED';
const AI_MODEL_UPDATED = 'AI_MODEL_UPDATED';
const TRANSLATION_ISSUE_UPDATED = 'TRANSLATION_ISSUE_UPDATED';

// ============================================================================
// Resolver Functions
// ============================================================================

export const createUserFeedbackResolvers = (
  prisma: PrismaClient,
  redis: RedisClientType
) => {
  const feedbackService = new UserFeedbackService(prisma, redis);

  return {
    Query: {
      /**
       * Get content feedback for an article
       */
      contentFeedback: async (
        _: any,
        { articleId }: { articleId: string },
        context: any
      ) => {
        try {
          const userId = context.user?.id;
          const feedback = await feedbackService.getContentFeedback(articleId, userId);

          return {
            ...feedback,
            ratingDistribution: {
              one: feedback.ratingDistribution[1],
              two: feedback.ratingDistribution[2],
              three: feedback.ratingDistribution[3],
              four: feedback.ratingDistribution[4],
              five: feedback.ratingDistribution[5],
            },
          };
        } catch (error: any) {
          throw new Error(`Failed to get content feedback: ${error.message}`);
        }
      },

      /**
       * Get translation feedback statistics
       */
      translationFeedbackStats: async (
        _: any,
        { language }: { language?: string }
      ) => {
        try {
          return await feedbackService.getTranslationFeedbackStats(language);
        } catch (error: any) {
          throw new Error(`Failed to get translation feedback stats: ${error.message}`);
        }
      },

      /**
       * Get recommendation feedback analytics
       */
      recommendationFeedbackAnalytics: async (_: any, __: any, context: any) => {
        try {
          const userId = context.user?.id;
          return await feedbackService.getRecommendationFeedbackAnalytics(userId);
        } catch (error: any) {
          throw new Error(`Failed to get recommendation feedback analytics: ${error.message}`);
        }
      },

      /**
       * Get comprehensive feedback analytics
       */
      feedbackAnalytics: async (
        _: any,
        { input }: { input?: any },
        context: any
      ) => {
        try {
          // Check permissions
          let targetUserId: string | undefined;
          if (input?.userId) {
            if (context.user?.role !== 'SUPER_ADMIN' && context.user?.role !== 'ADMIN') {
              throw new Error('Admin access required to view other users analytics');
            }
            targetUserId = input.userId;
          } else {
            targetUserId = context.user?.id;
          }

          const analytics = await feedbackService.getFeedbackAnalytics(
            input?.startDate ? new Date(input.startDate) : undefined,
            input?.endDate ? new Date(input.endDate) : undefined,
            targetUserId
          );

          return {
            ...analytics,
            ratingDistribution: {
              one: analytics.ratingDistribution[1],
              two: analytics.ratingDistribution[2],
              three: analytics.ratingDistribution[3],
              four: analytics.ratingDistribution[4],
              five: analytics.ratingDistribution[5],
            },
          };
        } catch (error: any) {
          throw new Error(`Failed to get feedback analytics: ${error.message}`);
        }
      },

      /**
       * Get AI learning data (Admin only)
       */
      aiLearningData: async (_: any, __: any, context: any) => {
        try {
          // Check admin permission
          if (context.user?.role !== 'SUPER_ADMIN' && context.user?.role !== 'ADMIN') {
            throw new Error('Admin access required');
          }

          return await feedbackService.getAILearningData();
        } catch (error: any) {
          throw new Error(`Failed to get AI learning data: ${error.message}`);
        }
      },

      /**
       * Get user's own feedback history
       */
      myFeedback: async (
        _: any,
        { page = 1, limit = 20, feedbackType }: any,
        context: any
      ) => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new Error('Authentication required');
          }

          const skip = (page - 1) * limit;

          const whereClause: any = { userId };
          if (feedbackType) {
            whereClause.feedbackType = feedbackType;
          }

          const [feedback, total] = await Promise.all([
            prisma.userFeedback.findMany({
              where: whereClause,
              include: {
                article: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              skip,
              take: limit,
            }),
            prisma.userFeedback.count({ where: whereClause }),
          ]);

          return {
            feedback,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          };
        } catch (error: any) {
          throw new Error(`Failed to get user feedback: ${error.message}`);
        }
      },

      /**
       * Get feedback by ID
       */
      userFeedback: async (_: any, { id }: { id: string }, context: any) => {
        try {
          const feedback = await prisma.userFeedback.findUnique({
            where: { id },
            include: {
              article: true,
            },
          });

          if (!feedback) {
            throw new Error('Feedback not found');
          }

          // Check permissions: user can only view their own feedback, admins can view all
          if (
            feedback.userId !== context.user?.id &&
            context.user?.role !== 'SUPER_ADMIN' &&
            context.user?.role !== 'ADMIN'
          ) {
            throw new Error('Unauthorized');
          }

          return feedback;
        } catch (error: any) {
          throw new Error(`Failed to get feedback: ${error.message}`);
        }
      },
    },

    Mutation: {
      /**
       * Submit content rating feedback
       */
      submitContentFeedback: async (
        _: any,
        { input }: { input: any },
        context: any
      ) => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new Error('Authentication required');
          }

          const result = await feedbackService.submitContentFeedback({
            userId,
            articleId: input.articleId,
            rating: input.rating,
            feedbackType: input.feedbackType,
            comment: input.comment,
            aiGenerated: input.aiGenerated ?? true,
            timestamp: new Date(),
          });

          // Publish event
          const feedback = await prisma.userFeedback.findUnique({
            where: { id: result.id },
            include: { article: true },
          });
          pubsub.publish(FEEDBACK_SUBMITTED, { feedbackSubmitted: feedback });

          return result;
        } catch (error: any) {
          throw new Error(`Failed to submit content feedback: ${error.message}`);
        }
      },

      /**
       * Submit translation error report
       */
      submitTranslationFeedback: async (
        _: any,
        { input }: { input: any },
        context: any
      ) => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new Error('Authentication required');
          }

          const result = await feedbackService.submitTranslationFeedback({
            userId,
            articleId: input.articleId,
            translationId: input.translationId,
            language: input.language,
            issueType: input.issueType,
            originalText: input.originalText,
            suggestedText: input.suggestedText,
            comment: input.comment,
            severity: input.severity || 'medium',
            timestamp: new Date(),
          });

          // Publish event
          const feedback = await prisma.userFeedback.findUnique({
            where: { id: result.id },
            include: { article: true },
          });
          pubsub.publish(FEEDBACK_SUBMITTED, { feedbackSubmitted: feedback });

          // Update translation stats subscription
          const stats = await feedbackService.getTranslationFeedbackStats(input.language);
          pubsub.publish(TRANSLATION_ISSUE_UPDATED, {
            translationIssueUpdated: stats,
          });

          return result;
        } catch (error: any) {
          throw new Error(`Failed to submit translation feedback: ${error.message}`);
        }
      },

      /**
       * Submit recommendation quality feedback
       */
      submitRecommendationFeedback: async (
        _: any,
        { input }: { input: any },
        context: any
      ) => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new Error('Authentication required');
          }

          const result = await feedbackService.submitRecommendationFeedback({
            userId,
            recommendationId: input.recommendationId,
            articleId: input.articleId,
            rating: input.rating,
            feedbackType: input.feedbackType,
            comment: input.comment,
            timestamp: new Date(),
          });

          // Publish event
          const feedback = await prisma.userFeedback.findUnique({
            where: { id: result.id },
            include: { article: true },
          });
          pubsub.publish(FEEDBACK_SUBMITTED, { feedbackSubmitted: feedback });

          return result;
        } catch (error: any) {
          throw new Error(`Failed to submit recommendation feedback: ${error.message}`);
        }
      },

      /**
       * Apply feedback to AI models (Super Admin only)
       */
      applyFeedbackToAI: async (
        _: any,
        { feedbackType }: { feedbackType: string },
        context: any
      ) => {
        try {
          // Check super admin permission
          if (context.user?.role !== 'SUPER_ADMIN') {
            throw new Error('Super admin access required');
          }

          if (!['content', 'translation', 'recommendation'].includes(feedbackType)) {
            throw new Error('Invalid feedback type');
          }

          const result = await feedbackService.applyFeedbackToAI(
            feedbackType as 'content' | 'translation' | 'recommendation'
          );

          // Publish event
          pubsub.publish(AI_MODEL_UPDATED, { aiModelUpdated: result });

          return result;
        } catch (error: any) {
          throw new Error(`Failed to apply feedback to AI: ${error.message}`);
        }
      },

      /**
       * Resolve a feedback issue (Admin only)
       */
      resolveFeedback: async (
        _: any,
        { feedbackId, resolution }: { feedbackId: string; resolution?: string },
        context: any
      ) => {
        try {
          // Check admin permission
          if (context.user?.role !== 'SUPER_ADMIN' && context.user?.role !== 'ADMIN') {
            throw new Error('Admin access required');
          }

          const feedback = await prisma.userFeedback.update({
            where: { id: feedbackId },
            data: {
              resolvedAt: new Date(),
              metadata: {
                resolution,
                resolvedBy: context.user?.id,
              },
            },
            include: {
              article: true,
            },
          });

          return feedback;
        } catch (error: any) {
          throw new Error(`Failed to resolve feedback: ${error.message}`);
        }
      },
    },

    Subscription: {
      /**
       * Subscribe to new feedback submissions
       */
      feedbackSubmitted: {
        subscribe: (_: any, { userId }: { userId?: string }) => {
          if (userId) {
            return pubsub.asyncIterator([`${FEEDBACK_SUBMITTED}_${userId}`]);
          }
          return pubsub.asyncIterator([FEEDBACK_SUBMITTED]);
        },
      },

      /**
       * Subscribe to AI model updates
       */
      aiModelUpdated: {
        subscribe: () => pubsub.asyncIterator([AI_MODEL_UPDATED]),
      },

      /**
       * Subscribe to translation issue updates
       */
      translationIssueUpdated: {
        subscribe: (_: any, { language }: { language?: string }) => {
          if (language) {
            return pubsub.asyncIterator([`${TRANSLATION_ISSUE_UPDATED}_${language}`]);
          }
          return pubsub.asyncIterator([TRANSLATION_ISSUE_UPDATED]);
        },
      },
    },
  };
};

export default createUserFeedbackResolvers;
