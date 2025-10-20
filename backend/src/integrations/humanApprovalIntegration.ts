/**
 * Human Approval Integration Module
 * Exports all components for easy integration
 */

import approvalRouter from '../api/ai-approval';
import { humanApprovalSchema } from '../api/humanApprovalSchema';
import { humanApprovalResolvers } from '../api/humanApprovalResolvers';
import humanApprovalService from '../services/humanApprovalService';

/**
 * Integration module for Human Approval Workflow
 */
export const humanApprovalIntegration = {
  /**
   * Express router for REST API
   */
  router: approvalRouter,

  /**
   * GraphQL schema
   */
  schema: humanApprovalSchema,

  /**
   * GraphQL resolvers
   */
  resolvers: humanApprovalResolvers,

  /**
   * Service methods - only expose public API
   */
  service: {
    getApprovalQueue: humanApprovalService.getApprovalQueue.bind(humanApprovalService),
    getContentReviewDetails: humanApprovalService.getContentReviewDetails.bind(humanApprovalService),
    processApprovalDecision: humanApprovalService.processApprovalDecision.bind(humanApprovalService),
    processBatchOperation: humanApprovalService.processBatchOperation.bind(humanApprovalService),
    assignEditor: humanApprovalService.assignEditor.bind(humanApprovalService),
    getAvailableEditors: humanApprovalService.getAvailableEditors.bind(humanApprovalService),
    getEditorPerformanceMetrics: humanApprovalService.getEditorPerformanceMetrics.bind(humanApprovalService),
    getQueueStats: humanApprovalService.getQueueStats.bind(humanApprovalService),
  },

  /**
   * Mount REST routes
   */
  mountRoutes: (app: any) => {
    app.use('/api/ai/approval', approvalRouter);
  },

  /**
   * Get GraphQL schema and resolvers
   */
  getGraphQLConfig: () => ({
    typeDefs: humanApprovalSchema,
    resolvers: humanApprovalResolvers,
  }),
};

export default humanApprovalIntegration;
