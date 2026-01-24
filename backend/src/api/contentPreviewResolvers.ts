/**
 * Content Preview GraphQL Resolvers - Task 7.2
 * Implements resolvers for AI-powered content preview operations
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import Redis from 'ioredis';
import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import AIContentPreviewService from '../services/aiContentPreviewService';

const pubsub = new PubSub();

export const contentPreviewResolvers = {
  // ==================== QUERIES ====================

  Query: {
    /**
     * Get article summary
     */
    getArticleSummary: async (
      _: any,
      { articleId }: { articleId: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger; user?: any }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.generateSummary(articleId);
      } catch (error) {
        context.logger.error('Error in getArticleSummary:', error);
        throw new GraphQLError('Failed to generate article summary', {
          extensions: { code: 'SUMMARY_GENERATION_FAILED', error },
        });
      }
    },

    /**
     * Get translation preview
     */
    getTranslationPreview: async (
      _: any,
      { articleId, languageCode }: { articleId: string; languageCode: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.getTranslationPreview(articleId, languageCode);
      } catch (error) {
        context.logger.error('Error in getTranslationPreview:', error);
        throw new GraphQLError('Failed to get translation preview', {
          extensions: { code: 'TRANSLATION_FETCH_FAILED', error },
        });
      }
    },

    /**
     * Get available languages
     */
    getAvailableLanguages: async (
      _: any,
      { articleId }: { articleId: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.getAvailableLanguages(articleId);
      } catch (error) {
        context.logger.error('Error in getAvailableLanguages:', error);
        throw new GraphQLError('Failed to fetch available languages', {
          extensions: { code: 'LANGUAGE_FETCH_FAILED', error },
        });
      }
    },

    /**
     * Get quality indicators
     */
    getQualityIndicators: async (
      _: any,
      { articleId }: { articleId: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.getQualityIndicators(articleId);
      } catch (error) {
        context.logger.error('Error in getQualityIndicators:', error);
        throw new GraphQLError('Failed to get quality indicators', {
          extensions: { code: 'QUALITY_FETCH_FAILED', error },
        });
      }
    },

    /**
     * Get complete article preview
     */
    getArticlePreview: async (
      _: any,
      { articleId, languageCode }: { articleId: string; languageCode?: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.getArticlePreview(articleId, languageCode);
      } catch (error) {
        context.logger.error('Error in getArticlePreview:', error);
        throw new GraphQLError('Failed to get article preview', {
          extensions: { code: 'PREVIEW_FETCH_FAILED', error },
        });
      }
    },

    /**
     * Get batch article previews
     */
    getBatchArticlePreviews: async (
      _: any,
      { articleIds, languageCode }: { articleIds: string[]; languageCode?: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );

        // Limit batch size to 20 articles
        if (articleIds.length > 20) {
          throw new GraphQLError('Batch size exceeds maximum limit of 20 articles', {
            extensions: { code: 'BATCH_SIZE_EXCEEDED' },
          });
        }

        const previews = await Promise.all(
          articleIds.map((articleId) =>
            service.getArticlePreview(articleId, languageCode)
          )
        );

        return previews;
      } catch (error) {
        context.logger.error('Error in getBatchArticlePreviews:', error);
        throw new GraphQLError('Failed to get batch article previews', {
          extensions: { code: 'BATCH_PREVIEW_FAILED', error },
        });
      }
    },
  },

  // ==================== MUTATIONS ====================

  Mutation: {
    /**
     * Switch article language
     */
    switchArticleLanguage: async (
      _: any,
      {
        articleId,
        fromLanguage,
        toLanguage,
      }: { articleId: string; fromLanguage: string; toLanguage: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger }
    ) => {
      try {
        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );
        return await service.switchLanguage(articleId, fromLanguage, toLanguage);
      } catch (error) {
        context.logger.error('Error in switchArticleLanguage:', error);
        throw new GraphQLError('Failed to switch language', {
          extensions: { code: 'LANGUAGE_SWITCH_FAILED', error },
        });
      }
    },

    /**
     * Report translation issue
     */
    reportTranslationIssue: async (
      _: any,
      { input }: { input: any },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger; user?: any }
    ) => {
      try {
        // Validate user is authenticated
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );

        const report = await service.reportTranslationIssue({
          ...input,
          reportedBy: context.user.id,
        });

        return report;
      } catch (error) {
        context.logger.error('Error in reportTranslationIssue:', error);
        throw new GraphQLError('Failed to report translation issue', {
          extensions: { code: 'REPORT_FAILED', error },
        });
      }
    },

    /**
     * Invalidate article cache (admin only)
     */
    invalidateArticleCache: async (
      _: any,
      { articleId }: { articleId: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger; user?: any }
    ) => {
      try {
        // Validate user is admin
        if (!context.user || context.user.role !== 'ADMIN') {
          throw new GraphQLError('Admin privileges required', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );

        await service.invalidateArticleCache(articleId);
        return true;
      } catch (error) {
        context.logger.error('Error in invalidateArticleCache:', error);
        throw new GraphQLError('Failed to invalidate cache', {
          extensions: { code: 'CACHE_INVALIDATION_FAILED', error },
        });
      }
    },

    /**
     * Warm up cache for popular articles (admin only)
     */
    warmupArticleCache: async (
      _: any,
      { input }: { input: { articleIds: string[]; includeTranslations?: boolean } },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger; user?: any }
    ) => {
      try {
        // Validate user is admin
        if (!context.user || context.user.role !== 'ADMIN') {
          throw new GraphQLError('Admin privileges required', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );

        await service.warmupCache(input.articleIds);

        return {
          success: true,
          articlesWarmed: input.articleIds.length,
          failedArticles: [],
          message: `Successfully warmed cache for ${input.articleIds.length} articles`,
        };
      } catch (error) {
        context.logger.error('Error in warmupArticleCache:', error);
        throw new GraphQLError('Failed to warm up cache', {
          extensions: { code: 'CACHE_WARMUP_FAILED', error },
        });
      }
    },

    /**
     * Regenerate summary (bypasses cache)
     */
    regenerateSummary: async (
      _: any,
      { articleId }: { articleId: string },
      context: { prisma: PrismaClient; redis: Redis; logger: Logger; user?: any }
    ) => {
      try {
        // Validate user is authenticated
        if (!context.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const service = new AIContentPreviewService(
          context.prisma,
          context.redis,
          context.logger
        );

        // Invalidate existing cache first
        await service.invalidateArticleCache(articleId);

        // Generate fresh summary
        return await service.generateSummary(articleId);
      } catch (error) {
        context.logger.error('Error in regenerateSummary:', error);
        throw new GraphQLError('Failed to regenerate summary', {
          extensions: { code: 'SUMMARY_REGENERATION_FAILED', error },
        });
      }
    },
  },

  // ==================== SUBSCRIPTIONS ====================

  Subscription: {
    /**
     * Subscribe to quality indicator updates
     */
    qualityIndicatorsUpdated: {
      subscribe: (_: any, { articleId }: { articleId: string }) => {
        return pubsub.asyncIterator([`QUALITY_UPDATED_${articleId}`]);
      },
    },

    /**
     * Subscribe to translation completions
     */
    translationCompleted: {
      subscribe: (_: any, { articleId }: { articleId: string }) => {
        return pubsub.asyncIterator([`TRANSLATION_COMPLETED_${articleId}`]);
      },
    },
  },

  // ==================== FIELD RESOLVERS ====================

  ArticlePreviewData: {
    /**
     * Resolve article field
     */
    article: async (parent: any, _: any, context: { prisma: PrismaClient }) => {
      if (parent.article) return parent.article;
      return await context.prisma.article.findUnique({
        where: { id: parent.articleId },
      });
    },
  },

  ContentQualityIndicators: {
    /**
     * Format quality factors as percentages
     */
    qualityFactors: (parent: any) => {
      return {
        accuracy: Math.round(parent.qualityFactors.accuracy),
        relevance: Math.round(parent.qualityFactors.relevance),
        readability: Math.round(parent.qualityFactors.readability),
        sources: Math.round(parent.qualityFactors.sources),
      };
    },
  },
};

// Export helper function to publish updates
export const publishQualityUpdate = (articleId: string, indicators: any) => {
  pubsub.publish(`QUALITY_UPDATED_${articleId}`, {
    qualityIndicatorsUpdated: indicators,
  });
};

export const publishTranslationCompletion = (articleId: string, translation: any) => {
  pubsub.publish(`TRANSLATION_COMPLETED_${articleId}`, {
    translationCompleted: translation,
  });
};

export default contentPreviewResolvers;
