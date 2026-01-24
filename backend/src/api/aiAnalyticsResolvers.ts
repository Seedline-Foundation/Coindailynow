/**
 * AI Analytics GraphQL Resolvers
 * 
 * GraphQL resolvers for AI performance analytics and monitoring
 */

import {
  getSystemOverview,
  getAgentAnalytics,
  getCostBreakdown,
  getPerformanceTrends,
  getOptimizationRecommendations,
  setBudgetConfig,
  getBudgetConfig,
  cleanupOldAnalytics,
  analyticsEvents,
  DateRangeFilter,
  BudgetConfig,
} from '../services/aiAnalyticsService';
import { logger } from '../utils/logger';
import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();

// ==================== EVENT HANDLERS ====================

// Subscribe to analytics events
analyticsEvents.on('alert', (alert) => {
  pubsub.publish('NEW_ALERT', { newAlert: alert });
  logger.info('New alert published to GraphQL subscription:', alert.id);
});

// Periodic updates (every 30 seconds)
let updateInterval: NodeJS.Timeout;

function startPeriodicUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  updateInterval = setInterval(async () => {
    try {
      const overview = await getSystemOverview();
      pubsub.publish('SYSTEM_OVERVIEW_UPDATED', { systemOverviewUpdated: overview });
    } catch (error) {
      logger.error('Error in periodic system overview update:', error);
    }
  }, 30000); // 30 seconds
}

// Start periodic updates
startPeriodicUpdates();

// ==================== QUERY RESOLVERS ====================

const queryResolvers = {
  /**
   * Get comprehensive system-wide analytics overview
   */
  systemOverview: async (_parent: any, _args: any, _context: any) => {
    try {
      logger.debug('GraphQL: Fetching system overview');
      return await getSystemOverview();
    } catch (error) {
      logger.error('GraphQL error in systemOverview:', error);
      throw new Error('Failed to retrieve system overview');
    }
  },

  /**
   * Get detailed analytics for a specific agent
   */
  agentAnalytics: async (_parent: any, args: { agentId: string; dateRange?: any }, _context: any) => {
    try {
      logger.debug(`GraphQL: Fetching analytics for agent ${args.agentId}`);
      
      const dateRange: DateRangeFilter | undefined = args.dateRange && (args.dateRange.startDate || args.dateRange.endDate || args.dateRange.period) ? {
        ...(args.dateRange.startDate && { startDate: new Date(args.dateRange.startDate) }),
        ...(args.dateRange.endDate && { endDate: new Date(args.dateRange.endDate) }),
        ...(args.dateRange.period && { period: args.dateRange.period }),
      } : undefined;

      return await getAgentAnalytics(args.agentId, dateRange);
    } catch (error) {
      logger.error(`GraphQL error in agentAnalytics for ${args.agentId}:`, error);
      throw new Error(`Failed to retrieve analytics for agent ${args.agentId}`);
    }
  },

  /**
   * Get comprehensive cost breakdown and analysis
   */
  costBreakdown: async (_parent: any, args: { dateRange?: any }, _context: any) => {
    try {
      logger.debug('GraphQL: Fetching cost breakdown');
      
      const dateRange: DateRangeFilter | undefined = args.dateRange && (args.dateRange.startDate || args.dateRange.endDate) ? {
        ...(args.dateRange.startDate && { startDate: new Date(args.dateRange.startDate) }),
        ...(args.dateRange.endDate && { endDate: new Date(args.dateRange.endDate) }),
      } : undefined;

      return await getCostBreakdown(dateRange);
    } catch (error) {
      logger.error('GraphQL error in costBreakdown:', error);
      throw new Error('Failed to retrieve cost breakdown');
    }
  },

  /**
   * Get performance trends over time
   */
  performanceTrends: async (
    _parent: any,
    args: { period?: 'hourly' | 'daily' | 'weekly' | 'monthly'; dateRange?: any },
    _context: any
  ) => {
    try {
      logger.debug(`GraphQL: Fetching performance trends for period ${args.period || 'daily'}`);
      
      const dateRange: DateRangeFilter | undefined = args.dateRange && (args.dateRange.startDate || args.dateRange.endDate) ? {
        ...(args.dateRange.startDate && { startDate: new Date(args.dateRange.startDate) }),
        ...(args.dateRange.endDate && { endDate: new Date(args.dateRange.endDate) }),
      } : undefined;

      return await getPerformanceTrends(args.period || 'daily', dateRange);
    } catch (error) {
      logger.error('GraphQL error in performanceTrends:', error);
      throw new Error('Failed to retrieve performance trends');
    }
  },

  /**
   * Get AI system optimization recommendations
   */
  optimizationRecommendations: async (_parent: any, _args: any, _context: any) => {
    try {
      logger.debug('GraphQL: Fetching optimization recommendations');
      return await getOptimizationRecommendations();
    } catch (error) {
      logger.error('GraphQL error in optimizationRecommendations:', error);
      throw new Error('Failed to retrieve optimization recommendations');
    }
  },

  /**
   * Get current budget configuration
   */
  budgetConfig: async (_parent: any, _args: any, _context: any) => {
    try {
      logger.debug('GraphQL: Fetching budget configuration');
      return await getBudgetConfig();
    } catch (error) {
      logger.error('GraphQL error in budgetConfig:', error);
      throw new Error('Failed to retrieve budget configuration');
    }
  },

  /**
   * Get all active alerts
   */
  activeAlerts: async (_parent: any, _args: any, _context: any) => {
    try {
      logger.debug('GraphQL: Fetching active alerts');
      const overview = await getSystemOverview();
      return overview.alerts.filter(alert => !alert.acknowledged);
    } catch (error) {
      logger.error('GraphQL error in activeAlerts:', error);
      throw new Error('Failed to retrieve active alerts');
    }
  },
};

// ==================== MUTATION RESOLVERS ====================

const mutationResolvers = {
  /**
   * Set budget configuration
   */
  setBudgetConfig: async (_parent: any, args: { input: BudgetConfig }, _context: any) => {
    try {
      logger.debug('GraphQL: Setting budget configuration');
      
      // Validate input
      if (args.input.dailyLimit !== undefined && args.input.dailyLimit < 0) {
        throw new Error('Daily limit must be a positive number');
      }
      if (args.input.weeklyLimit !== undefined && args.input.weeklyLimit < 0) {
        throw new Error('Weekly limit must be a positive number');
      }
      if (args.input.monthlyLimit !== undefined && args.input.monthlyLimit < 0) {
        throw new Error('Monthly limit must be a positive number');
      }
      if (args.input.alertThreshold !== undefined && (args.input.alertThreshold < 0 || args.input.alertThreshold > 100)) {
        throw new Error('Alert threshold must be between 0 and 100');
      }

      await setBudgetConfig(args.input);
      logger.info('Budget configuration updated via GraphQL:', args.input);
      
      return args.input;
    } catch (error) {
      logger.error('GraphQL error in setBudgetConfig:', error);
      throw error instanceof Error ? error : new Error('Failed to set budget configuration');
    }
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (_parent: any, args: { alertId: string }, _context: any) => {
    try {
      logger.debug(`GraphQL: Acknowledging alert ${args.alertId}`);
      
      // Get current overview to find the alert
      const overview = await getSystemOverview();
      const alert = overview.alerts.find(a => a.id === args.alertId);
      
      if (!alert) {
        throw new Error(`Alert not found: ${args.alertId}`);
      }

      // Mark as acknowledged
      alert.acknowledged = true;
      
      // In a real implementation, this would persist to database
      // For now, we'll just return the updated alert
      
      logger.info(`Alert acknowledged: ${args.alertId}`);
      return alert;
    } catch (error) {
      logger.error('GraphQL error in acknowledgeAlert:', error);
      throw error instanceof Error ? error : new Error('Failed to acknowledge alert');
    }
  },

  /**
   * Cleanup old analytics data (admin only)
   */
  cleanupOldAnalytics: async (_parent: any, _args: any, context: any) => {
    try {
      // TODO: Add authentication check for admin role
      // if (!context.user || !context.user.isAdmin) {
      //   throw new Error('Unauthorized: Admin access required');
      // }

      logger.debug('GraphQL: Starting analytics cleanup');
      const result = await cleanupOldAnalytics();
      
      logger.info(`Analytics cleanup completed via GraphQL: ${result.deleted} events deleted`);
      
      return {
        deleted: result.deleted,
        message: `Successfully deleted ${result.deleted} old analytics events`,
      };
    } catch (error) {
      logger.error('GraphQL error in cleanupOldAnalytics:', error);
      throw error instanceof Error ? error : new Error('Failed to cleanup old analytics data');
    }
  },
};

// ==================== SUBSCRIPTION RESOLVERS ====================

const subscriptionResolvers = {
  /**
   * Subscribe to system overview updates (every 30 seconds)
   */
  systemOverviewUpdated: {
    subscribe: () => {
      logger.debug('GraphQL: New subscription to systemOverviewUpdated');
      return pubsub.asyncIterator(['SYSTEM_OVERVIEW_UPDATED']);
    },
  },

  /**
   * Subscribe to new alerts
   */
  newAlert: {
    subscribe: () => {
      logger.debug('GraphQL: New subscription to newAlert');
      return pubsub.asyncIterator(['NEW_ALERT']);
    },
  },

  /**
   * Subscribe to agent analytics updates
   */
  agentAnalyticsUpdated: {
    subscribe: withFilter(
      () => pubsub.asyncIterator(['AGENT_ANALYTICS_UPDATED']),
      (payload, variables) => {
        // Filter by agentId if specified
        return !variables.agentId || payload.agentAnalyticsUpdated.agentId === variables.agentId;
      }
    ),
  },
};

// ==================== RESOLVER MAP ====================

export const aiAnalyticsResolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers,

  // Custom scalar resolvers (if needed)
  DateTime: {
    __parseValue(value: any) {
      return new Date(value); // value from the client
    },
    __serialize(value: any) {
      return value instanceof Date ? value.toISOString() : value; // value sent to the client
    },
    __parseLiteral(ast: any) {
      return new Date(ast.value); // ast value is always in string format
    },
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Publish agent analytics update
 * Call this after agent analytics are updated
 */
export async function publishAgentAnalyticsUpdate(agentId: string): Promise<void> {
  try {
    const analytics = await getAgentAnalytics(agentId);
    pubsub.publish('AGENT_ANALYTICS_UPDATED', { agentAnalyticsUpdated: analytics });
    logger.debug(`Published analytics update for agent ${agentId}`);
  } catch (error) {
    logger.error(`Error publishing analytics update for agent ${agentId}:`, error);
  }
}

/**
 * Stop periodic updates (for graceful shutdown)
 */
export function stopPeriodicUpdates(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
    logger.info('Stopped periodic analytics updates');
  }
}

// ==================== EXPORTS ====================

export default aiAnalyticsResolvers;
