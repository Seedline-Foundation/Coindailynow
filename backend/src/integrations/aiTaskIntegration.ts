/**
 * AI Task System Integration
 * Main integration point for AI task management system
 * 
 * This file provides a unified interface to integrate the AI task system
 * with your Express application and GraphQL server.
 */

import { Express } from 'express';
import { Server as HTTPServer } from 'http';
import aiTaskRoutes from '../api/ai-tasks';
import { initializeAITaskWebSocket } from '../services/websocket/aiTaskWebSocket';
import { startTaskWorker, setupGracefulShutdown } from '../workers/aiTaskWorker';
import { logger } from '../utils/logger';
import { aiTaskTypeDefs } from '../api/aiTaskSchema';
import aiTaskResolvers from '../api/aiTaskResolvers';

// ==================== EXPRESS INTEGRATION ====================

/**
 * Integrate AI task REST API routes with Express app
 * @param app - Express application instance
 */
export function integrateAITaskRoutes(app: Express) {
  logger.info('Integrating AI task REST API routes...');
  
  // Mount AI task routes
  app.use('/api/ai/tasks', aiTaskRoutes);
  
  logger.info('AI task REST API routes integrated at /api/ai/tasks');
}

// ==================== GRAPHQL INTEGRATION ====================

/**
 * Get GraphQL schema and resolvers for AI tasks
 * Add these to your GraphQL server configuration
 */
export { default as aiTaskTypeDefs } from '../api/aiTaskSchema';
export { default as aiTaskResolvers } from '../api/aiTaskResolvers';

// ==================== WEBSOCKET INTEGRATION ====================

/**
 * Initialize WebSocket server for real-time AI task updates
 * @param httpServer - HTTP server instance
 */
export function integrateAITaskWebSocket(httpServer: HTTPServer) {
  logger.info('Initializing AI task WebSocket server...');
  
  initializeAITaskWebSocket(httpServer);
  
  logger.info('AI task WebSocket server initialized at /ws/ai-tasks');
}

// ==================== WORKER INTEGRATION ====================

/**
 * Start the AI task worker
 * This should be called after all other integrations are complete
 */
export async function startAITaskWorker() {
  logger.info('Starting AI task worker...');
  
  // Setup graceful shutdown handlers
  setupGracefulShutdown();
  
  // Start the worker
  await startTaskWorker();
  
  logger.info('AI task worker started successfully');
}

// ==================== COMPLETE INTEGRATION ====================

/**
 * Complete AI task system integration
 * Call this function to integrate all AI task features
 * 
 * @param app - Express application instance
 * @param httpServer - HTTP server instance
 * @param options - Integration options
 */
export async function integrateAITaskSystem(
  app: Express,
  httpServer: HTTPServer,
  options: {
    enableRESTAPI?: boolean;
    enableWebSocket?: boolean;
    enableWorker?: boolean;
  } = {}
) {
  const {
    enableRESTAPI = true,
    enableWebSocket = true,
    enableWorker = true
  } = options;

  logger.info('Starting AI task system integration...');

  try {
    // Integrate REST API
    if (enableRESTAPI) {
      integrateAITaskRoutes(app);
    }

    // Integrate WebSocket
    if (enableWebSocket) {
      integrateAITaskWebSocket(httpServer);
    }

    // Start worker
    if (enableWorker) {
      await startAITaskWorker();
    }

    logger.info('✅ AI task system integration completed successfully');
    
    return {
      success: true,
      message: 'AI task system integrated successfully',
      features: {
        restAPI: enableRESTAPI,
        webSocket: enableWebSocket,
        worker: enableWorker
      }
    };
  } catch (error) {
    logger.error(`❌ AI task system integration failed: ${error}`);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  integrateAITaskRoutes,
  integrateAITaskWebSocket,
  startAITaskWorker,
  integrateAITaskSystem,
  aiTaskTypeDefs,
  aiTaskResolvers
};
