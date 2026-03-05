/**
 * AI Agent Registry Integration
 * Integration point for the centralized AI agent registry system
 * 
 * This file provides a unified interface to integrate the AI agent registry
 * with the Express application, exposing all 26 agents through REST endpoints.
 */

import { Express } from 'express';
import aiRegistryRoutes from '../api/ai-registry';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

// ==================== EXPRESS INTEGRATION ====================

/**
 * Integrate AI agent registry REST API routes with Express app
 * @param app - Express application instance
 * @param options - Configuration options
 */
export function integrateAIRegistryRoutes(
  app: Express,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    basePath?: string;
  } = {}
) {
  const {
    requireAuth = true,
    requireAdmin = true,
    basePath = '/api/ai/registry',
  } = options;

  logger.info('Integrating AI agent registry REST API routes...');

  // Apply middleware based on options
  if (requireAuth && requireAdmin) {
    app.use(basePath, authMiddleware, adminMiddleware, aiRegistryRoutes);
  } else if (requireAuth) {
    app.use(basePath, authMiddleware, aiRegistryRoutes);
  } else {
    app.use(basePath, aiRegistryRoutes);
  }

  logger.info(`AI agent registry REST API routes integrated at ${basePath}`);
  logger.info('Available endpoints:');
  logger.info(`  GET    ${basePath}/agents                    - List all agents`);
  logger.info(`  GET    ${basePath}/agents/by-category         - Agents by category`);
  logger.info(`  GET    ${basePath}/stats                      - Registry statistics`);
  logger.info(`  GET    ${basePath}/tasks/running              - Running tasks`);
  logger.info(`  GET    ${basePath}/tasks/completed            - Completed tasks`);
  logger.info(`  GET    ${basePath}/tasks/history              - Task history`);
  logger.info(`  GET    ${basePath}/agents/:id                 - Single agent info`);
  logger.info(`  GET    ${basePath}/agents/:id/tasks/running   - Agent running tasks`);
  logger.info(`  GET    ${basePath}/agents/:id/tasks/completed - Agent completed tasks`);
  logger.info(`  GET    ${basePath}/agents/:id/tasks/history   - Agent task history`);
  logger.info(`  POST   ${basePath}/agents/:id/tasks           - Submit task`);
  logger.info(`  POST   ${basePath}/agents/:id/toggle          - Toggle agent`);
  logger.info(`  POST   ${basePath}/agents/:id/reset           - Reset agent`);
  logger.info(`  GET    ${basePath}/health                     - Health check all`);
}

// ==================== COMPLETE INTEGRATION ====================

/**
 * Complete AI agent registry integration
 * Call this function to integrate all registry features
 * 
 * @param app - Express application instance
 * @param options - Integration options
 */
export async function integrateAIRegistrySystem(
  app: Express,
  options: {
    enableRESTAPI?: boolean;
    requireAuth?: boolean;
    requireAdmin?: boolean;
    basePath?: string;
  } = {}
) {
  const {
    enableRESTAPI = true,
    requireAuth = true,
    requireAdmin = true,
    basePath = '/api/ai/registry',
  } = options;

  logger.info('Starting AI agent registry system integration...');

  try {
    if (enableRESTAPI) {
      integrateAIRegistryRoutes(app, { requireAuth, requireAdmin, basePath });
    }

    // Pre-initialize the registry so it's ready when first request comes
    try {
      const registryModule = await import('../../../ai-system/agents/index');
      const registry = registryModule.agentRegistry || registryModule.default;
      if (registry && typeof registry.initialize === 'function') {
        registry.initialize();
        logger.info(`✅ AI agent registry pre-initialized with ${registry.size} agents`);
      }
    } catch (initError) {
      logger.warn('⚠️ Could not pre-initialize agent registry. Will initialize on first request.');
    }

    logger.info('✅ AI agent registry system integration completed successfully');

    return {
      success: true,
      message: 'AI agent registry system integrated successfully',
      features: {
        restAPI: enableRESTAPI,
        basePath,
      },
    };
  } catch (error) {
    logger.error(`❌ AI agent registry system integration failed: ${error}`);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  integrateAIRegistryRoutes,
  integrateAIRegistrySystem,
};
