/**
 * User Recommendations GraphQL Resolvers
 */

import { PubSub } from 'graphql-subscriptions';
import aiRecommendationService from '../services/aiRecommendationService';

const pubsub = new PubSub();

// Subscription events
const RECOMMENDATIONS_UPDATED = 'RECOMMENDATIONS_UPDATED';
const NEW_MEMECOIN_ALERT = 'NEW_MEMECOIN_ALERT';
const NEW_MARKET_INSIGHT = 'NEW_MARKET_INSIGHT';

export const userRecommendationResolvers = {
  Query: {
    /**
     * Get personalized content recommendations
     */
    userRecommendations: async (_: any, { limit = 10 }: { limit?: number }, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const result = await aiRecommendationService.getRecommendations(userId, limit);
        
        console.log(`[GraphQL] userRecommendations - User: ${userId}, Limit: ${limit}`);
        
        return result;
      } catch (error) {
        console.error('[GraphQL] Error in userRecommendations:', error);
        throw new Error('Failed to fetch recommendations');
      }
    },

    /**
     * Get AI-powered market insights
     */
    userAIInsights: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const result = await aiRecommendationService.getRecommendations(userId, 1);
        
        console.log(`[GraphQL] userAIInsights - User: ${userId}`);
        
        return result.marketInsights;
      } catch (error) {
        console.error('[GraphQL] Error in userAIInsights:', error);
        throw new Error('Failed to fetch AI insights');
      }
    },

    /**
     * Get memecoin alerts
     */
    userMemecoinAlerts: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const result = await aiRecommendationService.getRecommendations(userId, 1);
        
        console.log(`[GraphQL] userMemecoinAlerts - User: ${userId}`);
        
        return result.memecoinAlerts;
      } catch (error) {
        console.error('[GraphQL] Error in userMemecoinAlerts:', error);
        throw new Error('Failed to fetch memecoin alerts');
      }
    },

    /**
     * Get user preferences
     */
    userPreferences: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const preferences = await aiRecommendationService.getUserPreferences(userId);
        
        console.log(`[GraphQL] userPreferences - User: ${userId}`);
        
        return preferences;
      } catch (error) {
        console.error('[GraphQL] Error in userPreferences:', error);
        throw new Error('Failed to fetch preferences');
      }
    },

    /**
     * Get user behavior analysis
     */
    userBehaviorAnalysis: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const analysis = await aiRecommendationService.analyzeBehavior(userId);
        
        // Convert Map to array for GraphQL
        const topicAffinities = Array.from(analysis.topicAffinities.entries()).map(
          ([topic, score]) => ({ topic, score })
        );

        console.log(`[GraphQL] userBehaviorAnalysis - User: ${userId}`);
        
        return {
          ...analysis,
          topicAffinities,
        };
      } catch (error) {
        console.error('[GraphQL] Error in userBehaviorAnalysis:', error);
        throw new Error('Failed to fetch behavior analysis');
      }
    },

    /**
     * Health check
     */
    recommendationHealthCheck: async () => {
      try {
        const health = await aiRecommendationService.healthCheck();
        
        return {
          ...health,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error('[GraphQL] Error in recommendationHealthCheck:', error);
        return {
          status: 'unhealthy',
          redis: false,
          database: false,
          timestamp: new Date(),
        };
      }
    },
  },

  Mutation: {
    /**
     * Update user preferences
     */
    updateUserPreferences: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;

      try {
        const preferences = await aiRecommendationService.updatePreferences(
          userId,
          input
        );

        // Publish update event
        pubsub.publish(RECOMMENDATIONS_UPDATED, {
          recommendationsUpdated: await aiRecommendationService.getRecommendations(userId, 10),
        });

        console.log(`[GraphQL] updateUserPreferences - User: ${userId}`);
        
        return preferences;
      } catch (error) {
        console.error('[GraphQL] Error in updateUserPreferences:', error);
        throw new Error('Failed to update preferences');
      }
    },

    /**
     * Track article read event
     */
    trackArticleRead: async (
      _: any,
      { input }: { input: { articleId: string; readDuration: number; completed: boolean } },
      context: any
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }

      const userId = context.user.id;
      const { articleId, readDuration, completed } = input;

      try {
        // Track asynchronously
        aiRecommendationService
          .trackArticleRead(userId, articleId, readDuration, completed)
          .catch(error => console.error('[GraphQL] Background tracking error:', error));

        console.log(`[GraphQL] trackArticleRead - User: ${userId}, Article: ${articleId}`);
        
        return true;
      } catch (error) {
        console.error('[GraphQL] Error in trackArticleRead:', error);
        throw new Error('Failed to track read event');
      }
    },
  },

  Subscription: {
    /**
     * Subscribe to recommendations updates
     */
    recommendationsUpdated: {
      subscribe: (_: any, { userId }: { userId: string }, context: any) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        // Only allow users to subscribe to their own updates
        if (context.user.id !== userId) {
          throw new Error('Cannot subscribe to other users recommendations');
        }

        console.log(`[GraphQL] Subscription: recommendationsUpdated - User: ${userId}`);

        return pubsub.asyncIterator([RECOMMENDATIONS_UPDATED]);
      },
    },

    /**
     * Subscribe to new memecoin alerts
     */
    newMemecoinAlert: {
      subscribe: (_: any, { userId }: { userId: string }, context: any) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (context.user.id !== userId) {
          throw new Error('Cannot subscribe to other users alerts');
        }

        console.log(`[GraphQL] Subscription: newMemecoinAlert - User: ${userId}`);

        return pubsub.asyncIterator([NEW_MEMECOIN_ALERT]);
      },
    },

    /**
     * Subscribe to new market insights
     */
    newMarketInsight: {
      subscribe: (_: any, { userId }: { userId: string }, context: any) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        if (context.user.id !== userId) {
          throw new Error('Cannot subscribe to other users insights');
        }

        console.log(`[GraphQL] Subscription: newMarketInsight - User: ${userId}`);

        return pubsub.asyncIterator([NEW_MARKET_INSIGHT]);
      },
    },
  },
};

/**
 * Utility function to publish memecoin alert
 */
export const publishMemecoinAlert = (userId: string, alert: any) => {
  pubsub.publish(NEW_MEMECOIN_ALERT, {
    newMemecoinAlert: alert,
  });
  console.log(`[GraphQL] Published memecoin alert for user ${userId}`);
};

/**
 * Utility function to publish market insight
 */
export const publishMarketInsight = (userId: string, insight: any) => {
  pubsub.publish(NEW_MARKET_INSIGHT, {
    newMarketInsight: insight,
  });
  console.log(`[GraphQL] Published market insight for user ${userId}`);
};

/**
 * Utility function to publish recommendations update
 */
export const publishRecommendationsUpdate = async (userId: string) => {
  try {
    const recommendations = await aiRecommendationService.getRecommendations(userId, 10);
    pubsub.publish(RECOMMENDATIONS_UPDATED, {
      recommendationsUpdated: recommendations,
    });
    console.log(`[GraphQL] Published recommendations update for user ${userId}`);
  } catch (error) {
    console.error('[GraphQL] Error publishing recommendations update:', error);
  }
};

export default userRecommendationResolvers;
