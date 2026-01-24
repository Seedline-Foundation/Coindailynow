/**
 * Human Approval GraphQL Resolvers
 * Implements queries, mutations, and subscriptions for approval workflow
 */

import { PubSub } from 'graphql-subscriptions';
import humanApprovalService, {
  ApprovalQueueFilters,
  ApprovalDecision,
  BatchOperation,
} from '../services/humanApprovalService';
import { logger } from '../utils/logger';

const pubsub = new PubSub();

// Subscribe to service events
const approvalEvents = humanApprovalService.getEventEmitter();

approvalEvents.on('content:approved', (data) => {
  pubsub.publish('APPROVAL_QUEUE_UPDATED', { approvalQueueUpdated: data });
  pubsub.publish('CONTENT_REVIEW_UPDATED', { contentReviewUpdated: data });
});

approvalEvents.on('content:rejected', (data) => {
  pubsub.publish('APPROVAL_QUEUE_UPDATED', { approvalQueueUpdated: data });
  pubsub.publish('CONTENT_REVIEW_UPDATED', { contentReviewUpdated: data });
});

approvalEvents.on('content:revision_requested', (data) => {
  pubsub.publish('APPROVAL_QUEUE_UPDATED', { approvalQueueUpdated: data });
  pubsub.publish('CONTENT_REVIEW_UPDATED', { contentReviewUpdated: data });
});

approvalEvents.on('editor:assigned', (data) => {
  pubsub.publish('EDITOR_ASSIGNED', { editorAssigned: data });
});

approvalEvents.on('notification:sent', (data) => {
  pubsub.publish(`APPROVAL_NOTIFICATION_${data.editorId}`, {
    approvalNotification: {
      workflowId: data.workflowId,
      type: data.type,
      message: `New notification: ${data.type}`,
      timestamp: new Date(),
    },
  });
});

// ==================== RESOLVERS ====================

export const humanApprovalResolvers = {
  Query: {
    /**
     * Get approval queue with filtering and pagination
     */
    approvalQueue: async (_: any, args: any) => {
      try {
        const { filters, pagination } = args;
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;

        const queueFilters: ApprovalQueueFilters = {};

        if (filters) {
          if (filters.status) queueFilters.status = filters.status;
          if (filters.priority) queueFilters.priority = filters.priority;
          if (filters.contentType) queueFilters.contentType = filters.contentType;
          if (filters.assignedEditorId) queueFilters.assignedEditorId = filters.assignedEditorId;
          if (filters.languageCode) queueFilters.languageCode = filters.languageCode;
          if (filters.dateFrom) queueFilters.dateFrom = new Date(filters.dateFrom);
          if (filters.dateTo) queueFilters.dateTo = new Date(filters.dateTo);
          if (filters.minConfidenceScore !== undefined) queueFilters.minConfidenceScore = filters.minConfidenceScore;
          if (filters.maxConfidenceScore !== undefined) queueFilters.maxConfidenceScore = filters.maxConfidenceScore;
        }

        const result = await humanApprovalService.getApprovalQueue(queueFilters, page, limit);

        logger.info(`[HumanApprovalResolver] Approval queue retrieved: ${result.items.length} items`);
        return result;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error getting approval queue:', error);
        throw error;
      }
    },

    /**
     * Get detailed content review information
     */
    contentReviewDetails: async (_: any, args: any) => {
      try {
        const { workflowId } = args;

        const details = await humanApprovalService.getContentReviewDetails(workflowId);

        logger.info(`[HumanApprovalResolver] Content review details retrieved for ${workflowId}`);
        return details;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error getting content review details:', error);
        throw error;
      }
    },

    /**
     * Get available editors with workload information
     */
    availableEditors: async () => {
      try {
        const editors = await humanApprovalService.getAvailableEditors();

        logger.info(`[HumanApprovalResolver] Available editors retrieved: ${editors.length}`);
        return editors;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error getting available editors:', error);
        throw error;
      }
    },

    /**
     * Get editor performance metrics
     */
    editorPerformanceMetrics: async (_: any, args: any) => {
      try {
        const { editorId } = args;

        const metrics = await humanApprovalService.getEditorPerformanceMetrics(editorId);

        logger.info(`[HumanApprovalResolver] Editor metrics retrieved for ${editorId}`);
        return metrics;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error getting editor metrics:', error);
        throw error;
      }
    },

    /**
     * Get approval queue statistics
     */
    approvalQueueStats: async () => {
      try {
        const stats = await humanApprovalService.getQueueStats();

        logger.info('[HumanApprovalResolver] Queue stats retrieved');
        return stats;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error getting queue stats:', error);
        throw error;
      }
    },
  },

  Mutation: {
    /**
     * Approve content
     */
    approveContent: async (_: any, args: any) => {
      try {
        const { input } = args;

        const decision: ApprovalDecision = {
          workflowId: input.workflowId,
          editorId: input.editorId,
          decision: 'approve',
          feedback: input.feedback,
          qualityOverride: input.qualityOverride,
        };

        await humanApprovalService.processApprovalDecision(decision);

        logger.info(`[HumanApprovalResolver] Content approved: ${input.workflowId}`);
        return {
          success: true,
          message: 'Content approved successfully',
          timestamp: new Date(),
        };
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error approving content:', error);
        throw error;
      }
    },

    /**
     * Reject content
     */
    rejectContent: async (_: any, args: any) => {
      try {
        const { input } = args;

        const decision: ApprovalDecision = {
          workflowId: input.workflowId,
          editorId: input.editorId,
          decision: 'reject',
          feedback: input.feedback,
        };

        await humanApprovalService.processApprovalDecision(decision);

        logger.info(`[HumanApprovalResolver] Content rejected: ${input.workflowId}`);
        return {
          success: true,
          message: 'Content rejected successfully',
          timestamp: new Date(),
        };
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error rejecting content:', error);
        throw error;
      }
    },

    /**
     * Request revision for content
     */
    requestRevision: async (_: any, args: any) => {
      try {
        const { input } = args;

        const decision: ApprovalDecision = {
          workflowId: input.workflowId,
          editorId: input.editorId,
          decision: 'request_revision',
          feedback: input.feedback,
          requestedChanges: input.requestedChanges,
        };

        await humanApprovalService.processApprovalDecision(decision);

        logger.info(`[HumanApprovalResolver] Revision requested: ${input.workflowId}`);
        return {
          success: true,
          message: 'Revision requested successfully',
          timestamp: new Date(),
        };
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error requesting revision:', error);
        throw error;
      }
    },

    /**
     * Assign editor to workflow
     */
    assignEditor: async (_: any, args: any) => {
      try {
        const { workflowId, editorId } = args;

        await humanApprovalService.assignEditor(workflowId, editorId);

        logger.info(`[HumanApprovalResolver] Editor assigned: ${editorId} to ${workflowId}`);
        return {
          success: true,
          message: 'Editor assigned successfully',
          timestamp: new Date(),
        };
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error assigning editor:', error);
        throw error;
      }
    },

    /**
     * Process batch operation
     */
    processBatchOperation: async (_: any, args: any) => {
      try {
        const { input } = args;

        const batchOp: BatchOperation = {
          workflowIds: input.workflowIds,
          operation: input.operation,
          editorId: input.editorId,
          assignToEditorId: input.assignToEditorId,
          feedback: input.feedback,
        };

        const result = await humanApprovalService.processBatchOperation(batchOp);

        logger.info(`[HumanApprovalResolver] Batch operation completed: ${result.success} success, ${result.failed} failed`);
        return result;
      } catch (error) {
        logger.error('[HumanApprovalResolver] Error processing batch operation:', error);
        throw error;
      }
    },
  },

  Subscription: {
    /**
     * Subscribe to approval queue updates
     */
    approvalQueueUpdated: {
      subscribe: () => pubsub.asyncIterator(['APPROVAL_QUEUE_UPDATED']),
    },

    /**
     * Subscribe to content review updates
     */
    contentReviewUpdated: {
      subscribe: (_: any, args: any) => {
        const { workflowId } = args;
        return pubsub.asyncIterator([`CONTENT_REVIEW_UPDATED_${workflowId}`]);
      },
    },

    /**
     * Subscribe to editor assignments
     */
    editorAssigned: {
      subscribe: () => pubsub.asyncIterator(['EDITOR_ASSIGNED']),
    },

    /**
     * Subscribe to notifications for specific editor
     */
    approvalNotification: {
      subscribe: (_: any, args: any) => {
        const { editorId } = args;
        return pubsub.asyncIterator([`APPROVAL_NOTIFICATION_${editorId}`]);
      },
    },
  },

  // ==================== FIELD RESOLVERS ====================

  ApprovalQueueItem: {
    // All fields are resolved from the service layer
  },

  ContentReviewDetails: {
    // All fields are resolved from the service layer
  },

  EditorAssignment: {
    // All fields are resolved from the service layer
  },

  QualityMetrics: {
    // All fields are resolved from the service layer
  },
};

export default humanApprovalResolvers;
