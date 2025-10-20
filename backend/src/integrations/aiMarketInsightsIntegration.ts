/**
 * AI Market Insights Integration Module
 * 
 * Unified integration module for market insights functionality.
 * Handles initialization and exports for REST API, GraphQL, and WebSocket.
 * 
 * @module aiMarketInsightsIntegration
 */

import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { RedisClientType } from 'redis';
import aiMarketInsightsRoutes from '../api/ai-market-insights';
import aiMarketInsightsTypeDefs from '../api/aiMarketInsightsSchema';
import { aiMarketInsightsResolvers } from '../api/aiMarketInsightsResolvers';
import {
  initializeAIMarketInsightsService,
  getAIMarketInsightsService,
} from '../services/aiMarketInsightsService';
import {
  initializeAIMarketInsightsWebSocket,
  getAIMarketInsightsWebSocket,
} from '../services/websocket/aiMarketInsightsWebSocket';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize AI Market Insights integration
 * 
 * @param app - Express application
 * @param io - Socket.IO server instance
 * @param redis - Redis client instance
 */
export const initializeAIMarketInsights = (
  app: Express,
  io?: SocketIOServer,
  redis?: RedisClientType
) => {
  console.log('[AI Market Insights] Initializing integration...');

  // Initialize service
  initializeAIMarketInsightsService(redis);
  console.log('[AI Market Insights] Service initialized');

  // Mount REST API routes
  app.use('/api/ai/market', aiMarketInsightsRoutes);
  console.log('[AI Market Insights] REST API mounted at /api/ai/market');

  // Initialize WebSocket if provided
  if (io) {
    initializeAIMarketInsightsWebSocket(io);
    console.log('[AI Market Insights] WebSocket initialized at /ai/market');
  }

  console.log('[AI Market Insights] Integration complete');
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export GraphQL schema and resolvers for integration
 */
export const marketInsightsGraphQL = {
  typeDefs: aiMarketInsightsTypeDefs,
  resolvers: aiMarketInsightsResolvers,
};

/**
 * Export service instance getter
 */
export { getAIMarketInsightsService };

/**
 * Export WebSocket service getter
 */
export { getAIMarketInsightsWebSocket };

/**
 * Health check function
 */
export const checkMarketInsightsHealth = async () => {
  try {
    const service = getAIMarketInsightsService();
    const cacheStats = await service.getCacheStats();

    return {
      status: 'healthy',
      service: 'AI Market Insights',
      cache: cacheStats
        ? {
            enabled: true,
            total_keys: cacheStats.total_keys,
          }
        : {
            enabled: false,
          },
      timestamp: new Date(),
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      service: 'AI Market Insights',
      error: error.message,
      timestamp: new Date(),
    };
  }
};

/**
 * Graceful shutdown function
 */
export const shutdownMarketInsights = () => {
  console.log('[AI Market Insights] Shutting down...');

  try {
    const wsService = getAIMarketInsightsWebSocket();
    wsService.shutdown();
    console.log('[AI Market Insights] WebSocket service shut down');
  } catch (error) {
    console.log('[AI Market Insights] WebSocket service not initialized or already shut down');
  }

  console.log('[AI Market Insights] Shutdown complete');
};

export default {
  initialize: initializeAIMarketInsights,
  graphql: marketInsightsGraphQL,
  healthCheck: checkMarketInsightsHealth,
  shutdown: shutdownMarketInsights,
};
