/**
 * AI Configuration Integration Module
 * Central integration point for AI configuration management
 * 
 * Task 6.2: AI Configuration Management
 */

import { Express } from 'express';
import aiConfigRoutes from '../api/ai-config';
import aiConfigSchema from '../api/aiConfigSchema';
import aiConfigResolvers from '../api/aiConfigResolvers';
import { logger } from '../utils/logger';

/**
 * Initialize AI Configuration Management
 */
export function initializeAIConfiguration(app: Express): void {
  try {
    // Mount REST API routes
    app.use('/api/ai/config', aiConfigRoutes);
    
    logger.info('AI Configuration Management initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize AI Configuration Management:', error);
    throw error;
  }
}

/**
 * Get GraphQL schema
 */
export function getAIConfigGraphQLSchema() {
  return aiConfigSchema;
}

/**
 * Get GraphQL resolvers
 */
export function getAIConfigGraphQLResolvers() {
  return aiConfigResolvers;
}

/**
 * Graceful shutdown
 */
export async function shutdownAIConfiguration(): Promise<void> {
  try {
    logger.info('AI Configuration Management shutdown complete');
  } catch (error) {
    logger.error('Error during AI Configuration shutdown:', error);
    throw error;
  }
}

export default {
  initializeAIConfiguration,
  getAIConfigGraphQLSchema,
  getAIConfigGraphQLResolvers,
  shutdownAIConfiguration,
};
