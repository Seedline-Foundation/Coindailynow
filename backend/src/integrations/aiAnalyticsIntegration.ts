/**
 * AI Analytics Integration Module
 * 
 * Provides unified integration interface for AI analytics REST API and GraphQL
 */

import { Express } from 'express';
import aiAnalyticsRouter from '../api/ai-analytics';
import { aiAnalyticsSchema } from '../api/aiAnalyticsSchema';
import { aiAnalyticsResolvers, stopPeriodicUpdates } from '../api/aiAnalyticsResolvers';
import { logger } from '../utils/logger';

/**
 * Mount AI Analytics REST API routes
 * @param app - Express application
 * @param basePath - Base path for routes (default: '/api/ai/analytics')
 */
export function mountAnalyticsRoutes(app: Express, basePath: string = '/api/ai/analytics'): void {
  try {
    app.use(basePath, aiAnalyticsRouter);
    logger.info(`AI Analytics REST API mounted at ${basePath}`);
  } catch (error) {
    logger.error('Error mounting AI Analytics REST API:', error);
    throw error;
  }
}

/**
 * Get GraphQL schema and resolvers for AI Analytics
 * @returns Schema and resolvers object
 */
export function getAnalyticsGraphQL() {
  return {
    schema: aiAnalyticsSchema,
    resolvers: aiAnalyticsResolvers,
  };
}

/**
 * Graceful shutdown handler
 */
export function shutdownAnalytics(): void {
  logger.info('Shutting down AI Analytics module');
  stopPeriodicUpdates();
}

// ==================== EXPORTS ====================

export default {
  mountAnalyticsRoutes,
  getAnalyticsGraphQL,
  shutdownAnalytics,
  router: aiAnalyticsRouter,
  schema: aiAnalyticsSchema,
  resolvers: aiAnalyticsResolvers,
};
