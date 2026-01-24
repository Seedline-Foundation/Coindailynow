/**
 * AI Task GraphQL Resolvers
 * Provides GraphQL queries, mutations, and subscriptions for AI task management
 */

import * as aiTaskService from '../services/aiTaskService';
import { logger } from '../utils/logger';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Subscribe to task events
aiTaskService.taskEventEmitter.on('taskStatusChanged', ({ taskId, task }) => {
  pubsub.publish('TASK_STATUS_CHANGED', {
    aiTaskStatusChanged: task
  });
});

aiTaskService.taskEventEmitter.on('taskQueueUpdated', (status) => {
  pubsub.publish('TASK_QUEUE_UPDATED', {
    taskQueueUpdated: status
  });
});

// ==================== QUERIES ====================

export const aiTaskQueries = {
  /**
   * Get a single AI task by ID
   */
  aiTask: async (_: any, { id }: { id: string }, context: any) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.getAITask(id);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL aiTask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * List AI tasks with filtering and pagination
   */
  aiTasks: async (
    _: any,
    {
      filter,
      pagination
    }: {
      filter?: aiTaskService.AITaskFilter;
      pagination?: aiTaskService.PaginationInput;
    },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const result = await aiTaskService.listAITasks(filter || {}, pagination || {});
      return result;
    } catch (error: any) {
      logger.error(`GraphQL aiTasks error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get task queue status
   */
  taskQueueStatus: async (_: any, __: any, context: any) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const status = await aiTaskService.getTaskQueueStatus();
      return status;
    } catch (error: any) {
      logger.error(`GraphQL taskQueueStatus error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get task statistics
   */
  taskStatistics: async (
    _: any,
    { filter }: { filter?: aiTaskService.AITaskFilter },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const statistics = await aiTaskService.getTaskStatistics(filter || {});
      return statistics;
    } catch (error: any) {
      logger.error(`GraphQL taskStatistics error: ${error.message}`);
      throw error;
    }
  }
};

// ==================== MUTATIONS ====================

export const aiTaskMutations = {
  /**
   * Create a new AI task
   */
  createAITask: async (
    _: any,
    { input }: { input: aiTaskService.CreateAITaskInput },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.createAITask(input);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL createAITask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Create multiple tasks in batch
   */
  createAITasksBatch: async (
    _: any,
    { inputs }: { inputs: aiTaskService.CreateAITaskInput[] },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      if (inputs.length > 100) {
        throw new Error('Maximum 100 tasks per batch');
      }

      const result = await aiTaskService.createAITasksBatch(inputs);
      return result;
    } catch (error: any) {
      logger.error(`GraphQL createAITasksBatch error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Cancel an AI task
   */
  cancelAITask: async (_: any, { id }: { id: string }, context: any) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.cancelAITask(id);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL cancelAITask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Retry a failed AI task
   */
  retryAITask: async (_: any, { id }: { id: string }, context: any) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.retryAITask(id);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL retryAITask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Start processing a task (for internal use by agents)
   */
  startTaskProcessing: async (_: any, { id }: { id: string }, context: any) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.startTaskProcessing(id);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL startTaskProcessing error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Complete a task (for internal use by agents)
   */
  completeTask: async (
    _: any,
    {
      id,
      outputData,
      metrics
    }: {
      id: string;
      outputData: Record<string, any>;
      metrics: {
        actualCost?: number;
        processingTimeMs?: number;
        qualityScore?: number;
      };
    },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.completeTask(id, outputData, metrics);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL completeTask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Mark task as failed (for internal use by agents)
   */
  failTask: async (
    _: any,
    { id, errorMessage }: { id: string; errorMessage: string },
    context: any
  ) => {
    try {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const task = await aiTaskService.failTask(id, errorMessage);
      return task;
    } catch (error: any) {
      logger.error(`GraphQL failTask error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Clean up old tasks (admin only)
   */
  cleanupOldTasks: async (_: any, __: any, context: any) => {
    try {
      if (!context.user || !context.user.isSuperAdmin) {
        throw new Error('Admin access required');
      }

      const count = await aiTaskService.cleanupOldTasks();
      return {
        success: true,
        deletedCount: count,
        message: `Cleaned up ${count} old tasks`
      };
    } catch (error: any) {
      logger.error(`GraphQL cleanupOldTasks error: ${error.message}`);
      throw error;
    }
  },

  /**
   * Timeout stale tasks (admin only)
   */
  timeoutStaleTasks: async (
    _: any,
    { timeoutMs }: { timeoutMs?: number },
    context: any
  ) => {
    try {
      if (!context.user || !context.user.isSuperAdmin) {
        throw new Error('Admin access required');
      }

      const count = await aiTaskService.timeoutStaleTasks(timeoutMs);
      return {
        success: true,
        timedOutCount: count,
        message: `Timed out ${count} stale tasks`
      };
    } catch (error: any) {
      logger.error(`GraphQL timeoutStaleTasks error: ${error.message}`);
      throw error;
    }
  }
};

// ==================== SUBSCRIPTIONS ====================

export const aiTaskSubscriptions = {
  /**
   * Subscribe to task status changes
   */
  aiTaskStatusChanged: {
    subscribe: (_: any, { taskId }: { taskId?: string }) => {
      // If taskId provided, filter for that specific task
      // Otherwise, subscribe to all task status changes
      return pubsub.asyncIterator(['TASK_STATUS_CHANGED']);
    },
    resolve: (payload: any, { taskId }: { taskId?: string }) => {
      // Filter by taskId if provided
      if (taskId && payload.aiTaskStatusChanged.id !== taskId) {
        return null;
      }
      return payload.aiTaskStatusChanged;
    }
  },

  /**
   * Subscribe to task queue updates
   */
  taskQueueUpdated: {
    subscribe: () => pubsub.asyncIterator(['TASK_QUEUE_UPDATED'])
  }
};

// ==================== FIELD RESOLVERS ====================

export const aiTaskFieldResolvers = {
  AITask: {
    agent: async (parent: any) => {
      // Agent is already included in the query, just return it
      return parent.AIAgent;
    },

    workflowStep: async (parent: any) => {
      // WorkflowStep is already included if present
      return parent.WorkflowStep || null;
    },

    // Parse JSON fields
    inputData: (parent: any) => {
      if (typeof parent.inputData === 'string') {
        try {
          return JSON.parse(parent.inputData);
        } catch {
          return null;
        }
      }
      return parent.inputData;
    },

    outputData: (parent: any) => {
      if (typeof parent.outputData === 'string') {
        try {
          return JSON.parse(parent.outputData);
        } catch {
          return null;
        }
      }
      return parent.outputData;
    },

    // Calculate derived fields
    waitTimeMs: (parent: any) => {
      if (!parent.startedAt) return null;
      const created = new Date(parent.createdAt).getTime();
      const started = new Date(parent.startedAt).getTime();
      return started - created;
    },

    isRetryable: (parent: any) => {
      return (
        parent.status === 'FAILED' &&
        parent.retryCount < parent.maxRetries
      );
    },

    canBeCancelled: (parent: any) => {
      return ['QUEUED', 'PROCESSING'].includes(parent.status);
    }
  }
};

// ==================== COMBINED RESOLVERS ====================

export const aiTaskResolvers = {
  Query: aiTaskQueries,
  Mutation: aiTaskMutations,
  Subscription: aiTaskSubscriptions,
  ...aiTaskFieldResolvers
};

export default aiTaskResolvers;
