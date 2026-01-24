/**
 * AI Workflow Integration Module
 * Exports all workflow components for easy integration
 */

import workflowRoutes from '../api/ai-workflows';
import { workflowTypeDefs } from '../api/aiWorkflowSchema';
import { workflowResolvers } from '../api/aiWorkflowResolvers';
import { aiWorkflowService, workflowEvents } from '../services/aiWorkflowService';
import type { Router } from 'express';
import type { EventEmitter } from 'events';

// Export routes
export { workflowRoutes };

// Export GraphQL schema and resolvers
export { workflowTypeDefs, workflowResolvers };

// Export service and events
export { aiWorkflowService, workflowEvents };

// Export types
export {
  WorkflowState,
  WorkflowPriority,
  WorkflowType,
  WorkflowQualityScore,
  CreateWorkflowInput,
  HumanReviewInput
} from '../services/aiWorkflowService';

/**
 * Initialize workflow integration
 * Call this in your main server file
 */
export function initializeWorkflowIntegration(app: any) {
  // Mount REST API routes
  app.use('/api/ai/workflows', workflowRoutes);
  
  console.log('[Workflow Integration] REST API routes mounted at /api/ai/workflows');
  console.log('[Workflow Integration] GraphQL schema and resolvers exported');
}

// Define public interface type to avoid private method export warnings
export interface WorkflowIntegration {
  routes: Router;
  typeDefs: any; // GraphQL DocumentNode
  resolvers: any;
  service: typeof aiWorkflowService;
  events: EventEmitter;
  initialize: typeof initializeWorkflowIntegration;
}

const integration: WorkflowIntegration = {
  routes: workflowRoutes,
  typeDefs: workflowTypeDefs,
  resolvers: workflowResolvers,
  service: aiWorkflowService,
  events: workflowEvents,
  initialize: initializeWorkflowIntegration
};

export default integration;
