/**
 * AI Content Pipeline GraphQL Resolvers
 * 
 * Resolvers for automated content pipeline queries, mutations, and subscriptions.
 */

import { PubSub } from 'graphql-subscriptions';
import { aiContentPipelineService } from '../services/aiContentPipelineService';
import type {
  ArticleGenerationRequest,
  PipelineConfig,
  PipelineStatus
} from '../services/aiContentPipelineService';

const pubsub = new PubSub();

// Event names
const EVENTS = {
  PIPELINE_STATUS_UPDATED: 'PIPELINE_STATUS_UPDATED',
  PIPELINES_UPDATED: 'PIPELINES_UPDATED',
  TRENDING_TOPICS_UPDATED: 'TRENDING_TOPICS_UPDATED',
  PIPELINE_METRICS_UPDATED: 'PIPELINE_METRICS_UPDATED'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Publish pipeline status update
 */
export function publishPipelineUpdate(status: PipelineStatus): void {
  pubsub.publish(EVENTS.PIPELINE_STATUS_UPDATED, {
    pipelineStatusUpdated: status,
    pipelineId: status.pipelineId
  });
  
  pubsub.publish(EVENTS.PIPELINES_UPDATED, {
    pipelinesUpdated: status
  });
}

/**
 * Publish metrics update
 */
export async function publishMetricsUpdate(): Promise<void> {
  try {
    const metrics = await aiContentPipelineService.getPipelineMetrics();
    pubsub.publish(EVENTS.PIPELINE_METRICS_UPDATED, {
      pipelineMetricsUpdated: metrics
    });
  } catch (error) {
    console.error('Error publishing metrics update:', error);
  }
}

/**
 * Publish trending topics update
 */
export async function publishTrendingUpdate(): Promise<void> {
  try {
    const topics = await aiContentPipelineService.monitorTrendingTopics();
    pubsub.publish(EVENTS.TRENDING_TOPICS_UPDATED, {
      trendingTopicsUpdated: topics
    });
  } catch (error) {
    console.error('Error publishing trending update:', error);
  }
}

// Start periodic updates
setInterval(publishMetricsUpdate, 60000); // Every 1 minute
setInterval(publishTrendingUpdate, 120000); // Every 2 minutes

// ============================================================================
// RESOLVERS
// ============================================================================

export const aiContentPipelineResolvers = {
  // ==========================================================================
  // QUERIES
  // ==========================================================================
  
  Query: {
    /**
     * Get pipeline configuration
     */
    pipelineConfig: async (_: any, __: any, context: any) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return await aiContentPipelineService.getConfiguration();
      } catch (error) {
        console.error('Error in pipelineConfig query:', error);
        throw error;
      }
    },

    /**
     * Get trending topics
     */
    trendingTopics: async (_: any, __: any, context: any) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return await aiContentPipelineService.monitorTrendingTopics();
      } catch (error) {
        console.error('Error in trendingTopics query:', error);
        throw error;
      }
    },

    /**
     * Get pipeline status
     */
    pipelineStatus: async (_: any, args: { pipelineId: string }, context: any) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return await aiContentPipelineService.getPipelineStatus(args.pipelineId);
      } catch (error) {
        console.error('Error in pipelineStatus query:', error);
        
        if (error instanceof Error && error.message.includes('not found')) {
          return null;
        }
        
        throw error;
      }
    },

    /**
     * Get active pipelines
     */
    activePipelines: async (_: any, __: any, context: any) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return await aiContentPipelineService.getActivePipelines();
      } catch (error) {
        console.error('Error in activePipelines query:', error);
        throw error;
      }
    },

    /**
     * Get pipeline metrics
     */
    pipelineMetrics: async (_: any, __: any, context: any) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        return await aiContentPipelineService.getPipelineMetrics();
      } catch (error) {
        console.error('Error in pipelineMetrics query:', error);
        throw error;
      }
    },

    /**
     * Health check
     */
    pipelineHealth: async () => {
      try {
        return await aiContentPipelineService.healthCheck();
      } catch (error) {
        console.error('Error in pipelineHealth query:', error);
        return {
          status: 'unhealthy',
          details: { error: error instanceof Error ? error.message : String(error) }
        };
      }
    }
  },

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================
  
  Mutation: {
    /**
     * Update pipeline configuration
     */
    updatePipelineConfig: async (
      _: any,
      args: { input: Partial<PipelineConfig> },
      context: any
    ) => {
      try {
        // Check authentication and admin role
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (!context.user.role || !['admin', 'super_admin'].includes(context.user.role)) {
          throw new Error('Admin access required');
        }

        // Validate input
        const { input } = args;

        if (input.autoPublishThreshold !== undefined) {
          if (input.autoPublishThreshold < 0 || input.autoPublishThreshold > 1) {
            throw new Error('autoPublishThreshold must be between 0 and 1');
          }
        }

        if (input.maxConcurrentPipelines !== undefined) {
          if (input.maxConcurrentPipelines < 1 || input.maxConcurrentPipelines > 50) {
            throw new Error('maxConcurrentPipelines must be between 1 and 50');
          }
        }

        return await aiContentPipelineService.updateConfiguration(input);
      } catch (error) {
        console.error('Error in updatePipelineConfig mutation:', error);
        throw error;
      }
    },

    /**
     * Initiate article pipeline
     */
    initiateArticlePipeline: async (
      _: any,
      args: { input: ArticleGenerationRequest },
      context: any
    ) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        // Validate input
        const { input } = args;

        if (!input.topic || typeof input.topic !== 'string') {
          throw new Error('Topic is required and must be a string');
        }

        if (!['breaking', 'high', 'medium', 'low'].includes(input.urgency)) {
          throw new Error('Urgency must be one of: breaking, high, medium, low');
        }

        if (input.qualityThreshold !== undefined) {
          if (input.qualityThreshold < 0 || input.qualityThreshold > 1) {
            throw new Error('qualityThreshold must be between 0 and 1');
          }
        }

        const status = await aiContentPipelineService.initiateArticlePipeline(input);
        
        // Publish update
        publishPipelineUpdate(status);
        publishMetricsUpdate();

        return status;
      } catch (error) {
        console.error('Error in initiateArticlePipeline mutation:', error);
        throw error;
      }
    },

    /**
     * Cancel pipeline
     */
    cancelPipeline: async (
      _: any,
      args: { pipelineId: string },
      context: any
    ) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        await aiContentPipelineService.cancelPipeline(args.pipelineId);
        
        // Publish updates
        const status = await aiContentPipelineService.getPipelineStatus(args.pipelineId);
        publishPipelineUpdate(status);
        publishMetricsUpdate();

        return {
          success: true,
          message: 'Pipeline cancelled successfully'
        };
      } catch (error) {
        console.error('Error in cancelPipeline mutation:', error);
        throw error;
      }
    },

    /**
     * Retry pipeline
     */
    retryPipeline: async (
      _: any,
      args: { pipelineId: string },
      context: any
    ) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Authentication required');
        }

        const status = await aiContentPipelineService.retryPipeline(args.pipelineId);
        
        // Publish update
        publishPipelineUpdate(status);
        publishMetricsUpdate();

        return status;
      } catch (error) {
        console.error('Error in retryPipeline mutation:', error);
        throw error;
      }
    },

    /**
     * Batch initiate pipelines
     */
    batchInitiatePipelines: async (
      _: any,
      args: { input: { topics: string[]; urgency: string; autoPublish?: boolean } },
      context: any
    ) => {
      try {
        // Check authentication and admin role
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (!context.user.role || !['admin', 'super_admin'].includes(context.user.role)) {
          throw new Error('Admin access required');
        }

        const { topics, urgency, autoPublish = false } = args.input;

        if (!Array.isArray(topics) || topics.length === 0) {
          throw new Error('Topics must be a non-empty array');
        }

        if (topics.length > 10) {
          throw new Error('Maximum 10 topics per batch');
        }

        // Initiate pipelines
        const results = await Promise.allSettled(
          topics.map((topic: string) =>
            aiContentPipelineService.initiateArticlePipeline({
              topic,
              urgency: urgency as any,
              autoPublish
            })
          )
        );

        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        const pipelines = successful.map(r => 
          r.status === 'fulfilled' ? r.value : null
        ).filter(Boolean) as PipelineStatus[];

        // Publish updates
        pipelines.forEach(publishPipelineUpdate);
        publishMetricsUpdate();

        return {
          total: topics.length,
          successful: successful.length,
          failed: failed.length,
          pipelines
        };
      } catch (error) {
        console.error('Error in batchInitiatePipelines mutation:', error);
        throw error;
      }
    },

    /**
     * Batch cancel pipelines
     */
    batchCancelPipelines: async (
      _: any,
      args: { pipelineIds: string[] },
      context: any
    ) => {
      try {
        // Check authentication and admin role
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (!context.user.role || !['admin', 'super_admin'].includes(context.user.role)) {
          throw new Error('Admin access required');
        }

        const { pipelineIds } = args;

        if (!Array.isArray(pipelineIds) || pipelineIds.length === 0) {
          throw new Error('pipelineIds must be a non-empty array');
        }

        const results = await Promise.allSettled(
          pipelineIds.map((id: string) =>
            aiContentPipelineService.cancelPipeline(id)
          )
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        // Publish updates
        publishMetricsUpdate();

        return {
          success: true,
          message: `Cancelled ${successful} pipelines successfully, ${failed} failed`
        };
      } catch (error) {
        console.error('Error in batchCancelPipelines mutation:', error);
        throw error;
      }
    },

    /**
     * Auto-discover and initiate pipelines
     */
    autoDiscoverAndInitiate: async (
      _: any,
      args: {
        input: {
          maxTopics?: number;
          urgencyFilter?: string[];
          autoPublish?: boolean;
        }
      },
      context: any
    ) => {
      try {
        // Check authentication and admin role
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (!context.user.role || !['admin', 'super_admin'].includes(context.user.role)) {
          throw new Error('Admin access required');
        }

        const {
          maxTopics = 5,
          urgencyFilter = ['breaking', 'high'],
          autoPublish = false
        } = args.input;

        // Get trending topics
        const topics = await aiContentPipelineService.monitorTrendingTopics();

        // Filter by urgency
        const filteredTopics = topics
          .filter(t => urgencyFilter.includes(t.urgency))
          .slice(0, maxTopics);

        if (filteredTopics.length === 0) {
          return {
            total: 0,
            successful: 0,
            failed: 0,
            pipelines: []
          };
        }

        // Initiate pipelines
        const results = await Promise.allSettled(
          filteredTopics.map(topic =>
            aiContentPipelineService.initiateArticlePipeline({
              topic: topic.keyword,
              urgency: topic.urgency,
              autoPublish
            })
          )
        );

        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        const pipelines = successful.map(r =>
          r.status === 'fulfilled' ? r.value : null
        ).filter(Boolean) as PipelineStatus[];

        // Publish updates
        pipelines.forEach(publishPipelineUpdate);
        publishMetricsUpdate();

        return {
          total: filteredTopics.length,
          successful: successful.length,
          failed: failed.length,
          pipelines
        };
      } catch (error) {
        console.error('Error in autoDiscoverAndInitiate mutation:', error);
        throw error;
      }
    }
  },

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================
  
  Subscription: {
    /**
     * Subscribe to specific pipeline updates
     */
    pipelineStatusUpdated: {
      subscribe: (_: any, args: { pipelineId: string }) => {
        return pubsub.asyncIterator([EVENTS.PIPELINE_STATUS_UPDATED]);
      },
      resolve: (payload: any, args: { pipelineId: string }) => {
        // Filter by pipeline ID
        if (payload.pipelineId === args.pipelineId) {
          return payload.pipelineStatusUpdated;
        }
        return null;
      }
    },

    /**
     * Subscribe to all pipeline updates
     */
    pipelinesUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.PIPELINES_UPDATED])
    },

    /**
     * Subscribe to trending topics updates
     */
    trendingTopicsUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.TRENDING_TOPICS_UPDATED])
    },

    /**
     * Subscribe to metrics updates
     */
    pipelineMetricsUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.PIPELINE_METRICS_UPDATED])
    }
  }
};

export default aiContentPipelineResolvers;
