/**
 * AI Quality Validation GraphQL Resolvers
 */

import { PubSub } from 'graphql-subscriptions';
import * as qualityService from '../services/aiQualityValidationService';

const pubsub = new PubSub();

// Subscription event names
const QUALITY_UPDATE = 'QUALITY_UPDATE';
const AGENT_PERFORMANCE_UPDATE = 'AGENT_PERFORMANCE_UPDATE';
const HUMAN_REVIEW_UPDATE = 'HUMAN_REVIEW_UPDATE';

// ============================================================================
// RESOLVERS
// ============================================================================

export const aiQualityValidationResolvers = {
  // ==========================================================================
  // QUERIES
  // ==========================================================================

  Query: {
    /**
     * Get content quality metrics for an article
     */
    contentQuality: async (_: any, { articleId, skipCache }: any) => {
      const metrics = await qualityService.validateContentQuality(articleId, { skipCache });

      // Publish update for subscriptions
      pubsub.publish(QUALITY_UPDATE, {
        qualityUpdate: metrics,
        articleId,
      });

      return metrics;
    },

    /**
     * Get content quality metrics for multiple articles
     */
    contentQualityBatch: async (_: any, { articleIds, skipCache }: any) => {
      const results = await Promise.all(
        articleIds.map((id: string) =>
          qualityService.validateContentQuality(id, { skipCache })
        )
      );

      return results;
    },

    /**
     * Get agent performance metrics
     */
    agentPerformance: async (_: any, { agentType, period, skipCache }: any) => {
      const parsedPeriod = period
        ? {
            start: new Date(period.start),
            end: new Date(period.end),
          }
        : undefined;

      const metrics = await qualityService.validateAgentPerformance(
        agentType,
        parsedPeriod,
        { skipCache }
      );

      // Publish updates for subscriptions
      for (const metric of metrics) {
        pubsub.publish(AGENT_PERFORMANCE_UPDATE, {
          agentPerformanceUpdate: metric,
          agentType: metric.agentType,
        });
      }

      return metrics;
    },

    /**
     * Get human review accuracy metrics
     */
    humanReviewAccuracy: async (_: any, { period, skipCache }: any) => {
      const parsedPeriod = period
        ? {
            start: new Date(period.start),
            end: new Date(period.end),
          }
        : undefined;

      const metrics = await qualityService.validateHumanReviewAccuracy(
        parsedPeriod,
        { skipCache }
      );

      // Publish update for subscriptions
      pubsub.publish(HUMAN_REVIEW_UPDATE, {
        humanReviewUpdate: metrics,
      });

      return metrics;
    },

    /**
     * Get a specific quality validation report
     */
    qualityReport: async (_: any, { reportId }: any) => {
      // Try to get from cache
      const Redis = (await import('ioredis')).default;
      const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}
const redis = new Redis(redisConfig);

      const cacheKey = `quality:report:${reportId}`;
      const cached = await redis.get(cacheKey);
      await redis.quit();

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    },

    /**
     * Get quality trends over time
     */
    qualityTrends: async (_: any, { days = 30, skipCache }: any) => {
      if (days < 1 || days > 365) {
        throw new Error('days must be between 1 and 365');
      }

      const trends = await qualityService.getQualityTrends(days, { skipCache });
      return trends;
    },

    /**
     * Get cache statistics
     */
    qualityCacheStats: async () => {
      const stats = await qualityService.getQualityCacheStats();
      return stats;
    },

    /**
     * Health check
     */
    qualityHealth: async () => {
      const health = await qualityService.healthCheck();
      return health;
    },
  },

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  Mutation: {
    /**
     * Generate a quality validation report
     */
    generateQualityReport: async (_: any, { input }: any) => {
      const { reportType, period, articleIds, agentTypes, thresholds } = input;

      // Convert reportType enum to lowercase
      const type = reportType.toLowerCase().replace('_', '_');

      const parsedPeriod = period
        ? {
            start: new Date(period.start),
            end: new Date(period.end),
          }
        : undefined;

      const report = await qualityService.generateQualityValidationReport(
        type,
        parsedPeriod,
        { articleIds, agentTypes, thresholds }
      );

      return report;
    },

    /**
     * Invalidate quality validation cache
     */
    invalidateQualityCache: async (_: any, { type }: any) => {
      const cacheType = type ? type.toLowerCase() : undefined;
      await qualityService.invalidateQualityCache(cacheType);
      return true;
    },
  },

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  Subscription: {
    /**
     * Subscribe to quality validation updates
     */
    qualityUpdate: {
      subscribe: (_: any, { articleId }: any) => {
        if (articleId) {
          return pubsub.asyncIterator([QUALITY_UPDATE]);
        }
        return pubsub.asyncIterator([QUALITY_UPDATE]);
      },
      resolve: (payload: any, { articleId }: any) => {
        // Filter by articleId if provided
        if (articleId && payload.articleId !== articleId) {
          return null;
        }
        return payload.qualityUpdate;
      },
    },

    /**
     * Subscribe to agent performance updates
     */
    agentPerformanceUpdate: {
      subscribe: (_: any, { agentType }: any) => {
        return pubsub.asyncIterator([AGENT_PERFORMANCE_UPDATE]);
      },
      resolve: (payload: any, { agentType }: any) => {
        // Filter by agentType if provided
        if (agentType && payload.agentType !== agentType) {
          return null;
        }
        return payload.agentPerformanceUpdate;
      },
    },

    /**
     * Subscribe to human review updates
     */
    humanReviewUpdate: {
      subscribe: () => {
        return pubsub.asyncIterator([HUMAN_REVIEW_UPDATE]);
      },
      resolve: (payload: any) => {
        return payload.humanReviewUpdate;
      },
    },
  },

  // ==========================================================================
  // TYPE RESOLVERS
  // ==========================================================================

  ReportType: {
    CONTENT: 'content',
    AGENT: 'agent',
    HUMAN_REVIEW: 'human_review',
    COMPREHENSIVE: 'comprehensive',
  },

  HealthStatus: {
    OK: 'ok',
    DEGRADED: 'degraded',
    ERROR: 'error',
  },

  CacheType: {
    CONTENT: 'content',
    AGENT: 'agent',
    HUMAN: 'human',
    ALL: 'all',
  },
};

export default aiQualityValidationResolvers;

// Export pubsub for external use
export { pubsub };
