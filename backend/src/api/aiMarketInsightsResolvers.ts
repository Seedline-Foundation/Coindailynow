/**
 * AI Market Insights GraphQL Resolvers
 * 
 * Resolvers for queries, mutations, and subscriptions related to market insights
 * 
 * @module aiMarketInsightsResolvers
 */

import { getAIMarketInsightsService } from '../services/aiMarketInsightsService';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Subscription event names
const SENTIMENT_UPDATED = 'SENTIMENT_UPDATED';
const TRENDING_UPDATED = 'TRENDING_UPDATED';
const WHALE_ACTIVITY_ALERT = 'WHALE_ACTIVITY_ALERT';
const MARKET_INSIGHTS_UPDATED = 'MARKET_INSIGHTS_UPDATED';

// ============================================================================
// QUERY RESOLVERS
// ============================================================================

const queryResolvers = {
  /**
   * Get sentiment analysis for a token
   */
  marketSentiment: async (_: any, { input }: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getSentimentAnalysis(input);

      return {
        data,
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 30000),
        },
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in marketSentiment:', error);
      return {
        data: null,
        cache: null,
        error: {
          code: 'SENTIMENT_ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze sentiment',
          details: error.stack,
        },
      };
    }
  },

  /**
   * Get batch sentiment analysis
   */
  batchMarketSentiment: async (_: any, { input }: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getBatchSentimentAnalysis(input.symbols);

      return {
        data,
        metadata: {
          total: input.symbols.length,
          successful: data.length,
          failed: input.symbols.length - data.length,
        },
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in batchMarketSentiment:', error);
      return {
        data: null,
        metadata: null,
        error: {
          code: 'BATCH_SENTIMENT_ERROR',
          message: error.message || 'Failed to analyze sentiments',
          details: error.stack,
        },
      };
    }
  },

  /**
   * Get trending memecoins
   */
  trendingMemecoins: async (_: any, { input }: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getTrendingMemecoins(input || {});

      return {
        data,
        metadata: {
          count: data.length,
          region: input?.region || 'global',
          generated_at: new Date(),
        },
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 300000),
        },
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in trendingMemecoins:', error);
      return {
        data: null,
        metadata: null,
        cache: null,
        error: {
          code: 'TRENDING_ERROR',
          message: error.message || 'Failed to fetch trending memecoins',
          details: error.stack,
        },
      };
    }
  },

  /**
   * Get whale activity
   */
  whaleActivity: async (_: any, { input }: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getWhaleActivity(input || {});

      return {
        data,
        metadata: {
          count: data.length,
          symbol: input?.symbol || 'all',
          critical_alerts: data.filter((a: any) => a.alert_level === 'critical').length,
          high_alerts: data.filter((a: any) => a.alert_level === 'high').length,
        },
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 60000),
        },
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in whaleActivity:', error);
      return {
        data: null,
        metadata: null,
        cache: null,
        error: {
          code: 'WHALE_ACTIVITY_ERROR',
          message: error.message || 'Failed to fetch whale activity',
          details: error.stack,
        },
      };
    }
  },

  /**
   * Get market insights
   */
  marketInsights: async (_: any, __: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getMarketInsights();

      return {
        data,
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 180000),
        },
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in marketInsights:', error);
      return {
        data: null,
        cache: null,
        error: {
          code: 'MARKET_INSIGHTS_ERROR',
          message: error.message || 'Failed to generate market insights',
          details: error.stack,
        },
      };
    }
  },

  /**
   * Get cache statistics
   */
  marketCacheStats: async (_: any, __: any, context: any) => {
    try {
      const service = getAIMarketInsightsService();
      const data = await service.getCacheStats();

      return {
        data,
        timestamp: new Date(),
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in marketCacheStats:', error);
      return {
        data: null,
        timestamp: new Date(),
        error: {
          code: 'CACHE_STATS_ERROR',
          message: error.message || 'Failed to get cache statistics',
          details: error.stack,
        },
      };
    }
  },
};

// ============================================================================
// MUTATION RESOLVERS
// ============================================================================

const mutationResolvers = {
  /**
   * Invalidate cache
   */
  invalidateMarketCache: async (_: any, { input }: any, context: any) => {
    try {
      // TODO: Add authentication check for admin
      const service = getAIMarketInsightsService();
      await service.invalidateCache(input?.symbol);

      return {
        success: true,
        message: input?.symbol
          ? `Cache invalidated for ${input.symbol}`
          : 'All market caches invalidated',
        timestamp: new Date(),
        error: null,
      };
    } catch (error: any) {
      console.error('[GraphQL] Error in invalidateMarketCache:', error);
      return {
        success: false,
        message: 'Failed to invalidate cache',
        timestamp: new Date(),
        error: {
          code: 'CACHE_INVALIDATION_ERROR',
          message: error.message || 'Failed to invalidate cache',
          details: error.stack,
        },
      };
    }
  },
};

// ============================================================================
// SUBSCRIPTION RESOLVERS
// ============================================================================

const subscriptionResolvers = {
  /**
   * Subscribe to sentiment updates
   */
  sentimentUpdated: {
    subscribe: (_: any, { symbol }: any) => {
      // Start polling for sentiment updates
      const interval = setInterval(async () => {
        try {
          const service = getAIMarketInsightsService();
          const sentiment = await service.getSentimentAnalysis({ symbol });
          pubsub.publish(`${SENTIMENT_UPDATED}_${symbol}`, {
            sentimentUpdated: sentiment,
          });
        } catch (error) {
          console.error(`[Subscription] Error updating sentiment for ${symbol}:`, error);
        }
      }, 30000); // 30 seconds

      // Return async iterator
      const asyncIterator = pubsub.asyncIterator(`${SENTIMENT_UPDATED}_${symbol}`);

      // Clean up interval when subscription is closed
      const originalReturn = asyncIterator.return;
      asyncIterator.return = () => {
        clearInterval(interval);
        return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
      };

      return asyncIterator;
    },
  },

  /**
   * Subscribe to trending updates
   */
  trendingUpdated: {
    subscribe: (_: any, { region }: any) => {
      const regionKey = region || 'global';

      // Start polling for trending updates
      const interval = setInterval(async () => {
        try {
          const service = getAIMarketInsightsService();
          const trending = await service.getTrendingMemecoins({ region: regionKey });
          pubsub.publish(`${TRENDING_UPDATED}_${regionKey}`, {
            trendingUpdated: trending,
          });
        } catch (error) {
          console.error(`[Subscription] Error updating trending for ${regionKey}:`, error);
        }
      }, 300000); // 5 minutes

      const asyncIterator = pubsub.asyncIterator(`${TRENDING_UPDATED}_${regionKey}`);

      const originalReturn = asyncIterator.return;
      asyncIterator.return = () => {
        clearInterval(interval);
        return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
      };

      return asyncIterator;
    },
  },

  /**
   * Subscribe to whale activity alerts
   */
  whaleActivityAlert: {
    subscribe: (_: any, { symbol, minImpactScore }: any) => {
      const key = symbol || 'all';
      const minScore = minImpactScore || 5;

      // Start polling for whale activity
      const interval = setInterval(async () => {
        try {
          const service = getAIMarketInsightsService();
          const activities = await service.getWhaleActivity({
            symbol,
            minImpactScore: minScore,
          });

          // Publish each activity individually
          activities.forEach(activity => {
            if (activity.alert_level === 'critical' || activity.alert_level === 'high') {
              pubsub.publish(`${WHALE_ACTIVITY_ALERT}_${key}`, {
                whaleActivityAlert: activity,
              });
            }
          });
        } catch (error) {
          console.error(`[Subscription] Error updating whale activity for ${key}:`, error);
        }
      }, 60000); // 1 minute

      const asyncIterator = pubsub.asyncIterator(`${WHALE_ACTIVITY_ALERT}_${key}`);

      const originalReturn = asyncIterator.return;
      asyncIterator.return = () => {
        clearInterval(interval);
        return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
      };

      return asyncIterator;
    },
  },

  /**
   * Subscribe to market insights updates
   */
  marketInsightsUpdated: {
    subscribe: () => {
      // Start polling for market insights
      const interval = setInterval(async () => {
        try {
          const service = getAIMarketInsightsService();
          const insights = await service.getMarketInsights();
          pubsub.publish(MARKET_INSIGHTS_UPDATED, {
            marketInsightsUpdated: insights,
          });
        } catch (error) {
          console.error('[Subscription] Error updating market insights:', error);
        }
      }, 180000); // 3 minutes

      const asyncIterator = pubsub.asyncIterator(MARKET_INSIGHTS_UPDATED);

      const originalReturn = asyncIterator.return;
      asyncIterator.return = () => {
        clearInterval(interval);
        return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
      };

      return asyncIterator;
    },
  },
};

// ============================================================================
// COMBINED RESOLVERS
// ============================================================================

export const aiMarketInsightsResolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers,
};

export default aiMarketInsightsResolvers;
