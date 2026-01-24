/**
 * AI Search GraphQL Resolvers
 * 
 * Implements GraphQL resolvers for AI search operations
 * 
 * @module api/aiSearchResolvers
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { OpenAI } from 'openai';
import { PubSub } from 'graphql-subscriptions';
import AISearchService, {
  SearchQuery,
  SemanticSearchParams,
  SearchFilters,
} from '../services/aiSearchService';

// ============================================================================
// Initialize Services
// ============================================================================

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pubsub = new PubSub();
const aiSearchService = new AISearchService(prisma, redis, openai);

// ============================================================================
// Subscription Events
// ============================================================================

const SEARCH_ANALYTICS_UPDATED = 'SEARCH_ANALYTICS_UPDATED';
const POPULAR_QUERIES_UPDATED = 'POPULAR_QUERIES_UPDATED';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Publish search analytics updates periodically
 */
setInterval(async () => {
  try {
    const analytics = await aiSearchService.getSearchAnalytics(30);
    pubsub.publish(SEARCH_ANALYTICS_UPDATED, { searchAnalyticsUpdated: analytics });
    pubsub.publish(POPULAR_QUERIES_UPDATED, { popularQueriesUpdated: analytics.popularQueries });
  } catch (error) {
    console.error('Error publishing search analytics:', error);
  }
}, 300000); // Every 5 minutes

// ============================================================================
// Resolvers
// ============================================================================

export const aiSearchResolvers = {
  // ==========================================================================
  // Queries
  // ==========================================================================

  Query: {
    /**
     * AI-enhanced search
     */
    aiEnhancedSearch: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const startTime = Date.now();

        // Build search query
        const searchQuery: SearchQuery = {
          query: input.query,
          userId: input.userId || context.userId,
          language: input.language,
          filters: input.filters as SearchFilters,
          page: input.page || 1,
          limit: input.limit || 10,
        };

        // Execute search
        const results = await aiSearchService.aiEnhancedSearch(searchQuery);

        return {
          ...results,
          processingTime: Date.now() - startTime,
        };
      } catch (error) {
        console.error('AI Enhanced Search Resolver Error:', error);
        throw new Error(`AI enhanced search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Semantic search
     */
    semanticSearch: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const params: SemanticSearchParams = {
          query: input.query,
          userId: input.userId || context.userId,
          language: input.language,
          limit: input.limit || 10,
          minSimilarity: input.minSimilarity || 0.7,
        };

        const results = await aiSearchService.semanticSearch(params);
        return results;
      } catch (error) {
        console.error('Semantic Search Resolver Error:', error);
        throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Multi-language search
     */
    multiLanguageSearch: async (_: any, { input }: { input: any }) => {
      try {
        const results = await aiSearchService.multiLanguageSearch(
          input.query,
          input.languages,
          input.limit || 10
        );
        return results;
      } catch (error) {
        console.error('Multi-Language Search Resolver Error:', error);
        throw new Error(`Multi-language search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Query suggestions
     */
    querySuggestions: async (_: any, { query, limit }: { query: string; limit?: number }) => {
      try {
        const suggestions = await aiSearchService.getQuerySuggestions(query);
        return limit ? suggestions.slice(0, limit) : suggestions;
      } catch (error) {
        console.error('Query Suggestions Resolver Error:', error);
        throw new Error(`Query suggestions failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * User search preferences
     */
    userSearchPreferences: async (_: any, { userId }: { userId: string }, context: any) => {
      try {
        // In production, verify user has permission to view these preferences
        if (context.userId !== userId && !context.isAdmin) {
          throw new Error('Unauthorized to view user preferences');
        }

        const preferences = await aiSearchService.getUserSearchPreferences(userId);
        return preferences;
      } catch (error) {
        console.error('User Preferences Resolver Error:', error);
        throw new Error(`Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Search analytics
     */
    searchAnalytics: async (_: any, { days = 30 }: { days?: number }) => {
      try {
        if (days > 365) {
          throw new Error('Days cannot exceed 365');
        }

        const analytics = await aiSearchService.getSearchAnalytics(days);
        return analytics;
      } catch (error) {
        console.error('Search Analytics Resolver Error:', error);
        throw new Error(`Failed to get search analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Cache statistics
     */
    searchCacheStats: async () => {
      try {
        // Get all search-related keys
        const keys = await redis.keys('ai_search:*');
        
        // Count by type
        const keysByType: Record<string, number> = {};
        keys.forEach(key => {
          const type = key.split(':')[1];
          if (type) {
            keysByType[type] = (keysByType[type] || 0) + 1;
          }
        });

        // Get memory info
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        const memoryUsed = memoryMatch?.[1]?.trim() ?? 'Unknown';

        return {
          totalKeys: keys.length,
          memoryUsed,
          keysByType,
        };
      } catch (error) {
        console.error('Cache Stats Resolver Error:', error);
        throw new Error(`Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Health check
     */
    aiSearchHealth: async () => {
      try {
        const health = await aiSearchService.healthCheck();
        return health;
      } catch (error) {
        console.error('Health Check Resolver Error:', error);
        throw new Error('Health check failed');
      }
    },
  },

  // ==========================================================================
  // Mutations
  // ==========================================================================

  Mutation: {
    /**
     * Invalidate search cache
     */
    invalidateSearchCache: async (_: any, { input }: { input?: any }, context: any) => {
      try {
        // Verify admin permission
        if (!context.isAdmin && !context.isSuperAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }

        const pattern = input?.pattern || 'ai_search:*';

        // Get all matching keys
        const keys = await redis.keys(pattern);
        
        // Delete keys
        if (keys.length > 0) {
          await redis.del(...keys);
        }

        return {
          keysDeleted: keys.length,
          pattern,
        };
      } catch (error) {
        console.error('Cache Invalidation Resolver Error:', error);
        throw new Error(`Cache invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  // ==========================================================================
  // Subscriptions
  // ==========================================================================

  Subscription: {
    /**
     * Subscribe to search analytics updates
     */
    searchAnalyticsUpdated: {
      subscribe: () => pubsub.asyncIterator([SEARCH_ANALYTICS_UPDATED]),
    },

    /**
     * Subscribe to popular queries updates
     */
    popularQueriesUpdated: {
      subscribe: () => pubsub.asyncIterator([POPULAR_QUERIES_UPDATED]),
    },
  },

  // ==========================================================================
  // Field Resolvers
  // ==========================================================================

  SearchResult: {
    /**
     * Resolve author field
     */
    author: (parent: any) => {
      return {
        id: parent.author.id,
        name: parent.author.name,
        avatar: parent.author.avatar,
      };
    },
  },

  HealthCheckResponse: {
    /**
     * Map status enum
     */
    status: (parent: any) => {
      const statusMap: Record<string, string> = {
        healthy: 'HEALTHY',
        degraded: 'DEGRADED',
        unhealthy: 'UNHEALTHY',
      };
      return statusMap[parent.status] || 'UNHEALTHY';
    },
  },

  QuerySuggestion: {
    /**
     * Map suggestion type enum
     */
    type: (parent: any) => {
      const typeMap: Record<string, string> = {
        correction: 'CORRECTION',
        expansion: 'EXPANSION',
        related: 'RELATED',
      };
      return typeMap[parent.type] || 'RELATED';
    },
  },

  UserSearchPreferences: {
    /**
     * Map content difficulty enum
     */
    contentDifficulty: (parent: any) => {
      if (!parent.contentDifficulty) return null;
      
      const difficultyMap: Record<string, string> = {
        beginner: 'BEGINNER',
        intermediate: 'INTERMEDIATE',
        advanced: 'ADVANCED',
      };
      return difficultyMap[parent.contentDifficulty] || 'INTERMEDIATE';
    },
  },
};

// ============================================================================
// Export
// ============================================================================

export default aiSearchResolvers;
