/**
 * AI Cost Control GraphQL Resolvers
 * Task 10.3 - Production-Ready Implementation
 * 
 * @module api/aiCostResolvers
 */

import { PubSub } from 'graphql-subscriptions';
import aiCostService from '../services/aiCostService';

const pubsub = new PubSub();

// PubSub event names
const BUDGET_ALERT_CREATED = 'BUDGET_ALERT_CREATED';
const COST_OVERVIEW_UPDATED = 'COST_OVERVIEW_UPDATED';
const BUDGET_THRESHOLD_EXCEEDED = 'BUDGET_THRESHOLD_EXCEEDED';

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Parse JSON field safely
 */
function parseJSON(jsonString: string | null): any {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

// ===================================
// QUERY RESOLVERS
// ===================================

const Query = {
  /**
   * Get cost overview
   */
  costOverview: async (_: any, __: any, context: any) => {
    const overview = await aiCostService.getCostOverview();
    return overview;
  },
  
  /**
   * Get cost breakdown
   */
  costBreakdown: async (_: any, args: any, context: any) => {
    const { startDate, endDate, groupBy = 'agentType' } = args;
    
    const breakdown = await aiCostService.getCostBreakdown(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      groupBy
    );
    
    // Map to include key field
    return breakdown.map((item: any) => ({
      key: item[groupBy],
      ...item,
    }));
  },
  
  /**
   * Get cost forecast
   */
  costForecast: async (_: any, args: any, context: any) => {
    const { period = 'monthly' } = args;
    const forecast = await aiCostService.getCostForecast(period);
    return forecast;
  },
  
  /**
   * Get budget limit
   */
  budgetLimit: async (_: any, args: any, context: any) => {
    const { scope, scopeId } = args;
    const budget = await aiCostService.getBudgetLimit(scope, scopeId);
    return budget;
  },
  
  /**
   * Check if operation is allowed
   */
  isOperationAllowed: async (_: any, args: any, context: any) => {
    const { agentType, userId, organizationId } = args;
    
    const allowed = await aiCostService.isOperationAllowed(agentType, userId, organizationId);
    
    return {
      allowed,
      message: allowed ? 'Operation allowed' : 'Operation blocked: budget limit exceeded',
    };
  },
  
  /**
   * Get budget alerts
   */
  budgetAlerts: async (_: any, args: any, context: any) => {
    const { acknowledged = false, limit = 50 } = args;
    const alerts = await aiCostService.getBudgetAlerts(acknowledged, limit);
    return alerts;
  },
  
  /**
   * Get cost report by ID
   */
  costReport: async (_: any, args: any, context: any) => {
    const { id } = args;
    const report = await aiCostService.getCostReport(id);
    return report;
  },
  
  /**
   * List cost reports
   */
  costReports: async (_: any, args: any, context: any) => {
    const { limit = 20 } = args;
    const reports = await aiCostService.listCostReports(limit);
    return reports;
  },
  
  /**
   * Get cache statistics
   */
  cacheStats: async (_: any, __: any, context: any) => {
    const stats = await aiCostService.getCacheStats();
    return stats;
  },
  
  /**
   * Health check
   */
  healthCheck: async (_: any, __: any, context: any) => {
    const health = await aiCostService.healthCheck();
    return health;
  },
};

// ===================================
// MUTATION RESOLVERS
// ===================================

const Mutation = {
  /**
   * Track cost
   */
  trackCost: async (_: any, args: any, context: any) => {
    const { input } = args;
    const costId = await aiCostService.trackCost(input);
    
    // Publish cost overview update
    const overview = await aiCostService.getCostOverview();
    pubsub.publish(COST_OVERVIEW_UPDATED, { costOverviewUpdated: overview });
    
    return {
      id: costId,
      tracked: true,
    };
  },
  
  /**
   * Set budget limit
   */
  setBudgetLimit: async (_: any, args: any, context: any) => {
    const { input } = args;
    
    // Add user ID from context
    input.createdBy = context.userId;
    
    const budgetId = await aiCostService.setBudgetLimit(input);
    
    return {
      id: budgetId,
      created: true,
    };
  },
  
  /**
   * Acknowledge budget alert
   */
  acknowledgeBudgetAlert: async (_: any, args: any, context: any) => {
    const { id } = args;
    const userId = context.userId;
    
    await aiCostService.acknowledgeBudgetAlert(id, userId);
    
    return {
      id,
      acknowledged: true,
    };
  },
  
  /**
   * Generate cost report
   */
  generateCostReport: async (_: any, args: any, context: any) => {
    const { input } = args;
    const { reportType, startDate, endDate, scope = 'global', scopeId } = input;
    
    const reportId = await aiCostService.generateCostReport(
      reportType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      scope,
      scopeId,
      context.userId
    );
    
    return {
      id: reportId,
      generated: true,
    };
  },
  
  /**
   * Invalidate all caches
   */
  invalidateAllCaches: async (_: any, __: any, context: any) => {
    await aiCostService.invalidateAllCaches();
    
    return {
      invalidated: true,
      message: 'All cost caches invalidated',
    };
  },
};

// ===================================
// SUBSCRIPTION RESOLVERS
// ===================================

const Subscription = {
  /**
   * Subscribe to budget alert creation
   */
  budgetAlertCreated: {
    subscribe: () => pubsub.asyncIterator([BUDGET_ALERT_CREATED]),
  },
  
  /**
   * Subscribe to cost overview updates
   */
  costOverviewUpdated: {
    subscribe: () => pubsub.asyncIterator([COST_OVERVIEW_UPDATED]),
  },
  
  /**
   * Subscribe to budget threshold exceeded events
   */
  budgetThresholdExceeded: {
    subscribe: (_: any, args: any) => {
      const { scope, scopeId } = args;
      return pubsub.asyncIterator([`${BUDGET_THRESHOLD_EXCEEDED}_${scope}_${scopeId || 'global'}`]);
    },
  },
};

// ===================================
// FIELD RESOLVERS
// ===================================

const BudgetLimit = {
  alertThresholds: (parent: any) => parseJSON(parent.alertThresholds) || [80, 90, 100],
};

const BudgetAlert = {
  recipients: (parent: any) => parseJSON(parent.recipients) || [],
  metadata: (parent: any) => parseJSON(parent.metadata) || {},
};

const CostReport = {
  recommendations: (parent: any) => parseJSON(parent.recommendations) || [],
  highCostOperations: (parent: any) => parseJSON(parent.highCostOperations) || [],
  detailedData: (parent: any) => parseJSON(parent.detailedData) || {},
  chartData: (parent: any) => parseJSON(parent.chartData) || {},
};

// ===================================
// EXPORT RESOLVERS
// ===================================

export const aiCostResolvers = {
  Query,
  Mutation,
  Subscription,
  BudgetLimit,
  BudgetAlert,
  CostReport,
};

// ===================================
// EXPORT PUBSUB FOR EXTERNAL USE
// ===================================

export { pubsub, BUDGET_ALERT_CREATED, COST_OVERVIEW_UPDATED, BUDGET_THRESHOLD_EXCEEDED };

export default aiCostResolvers;
