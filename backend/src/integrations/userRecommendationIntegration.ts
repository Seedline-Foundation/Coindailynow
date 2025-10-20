/**
 * User Recommendations Integration Module
 * 
 * Provides unified integration for:
 * - REST API routes
 * - GraphQL schema and resolvers
 * - Service exports
 */

import { Express } from 'express';
import userRecommendationsRouter from '../api/user-recommendations';
import userRecommendationSchema from '../api/userRecommendationSchema';
import userRecommendationResolvers from '../api/userRecommendationResolvers';
import aiRecommendationService from '../services/aiRecommendationService';

/**
 * Mount REST API routes
 */
export function mountUserRecommendationRoutes(app: Express): void {
  app.use('/api/user', userRecommendationsRouter);
  console.log('[Integration] User recommendation routes mounted at /api/user');
}

/**
 * Export GraphQL schema
 */
export const getUserRecommendationSchema = () => userRecommendationSchema;

/**
 * Export GraphQL resolvers
 */
export const getUserRecommendationResolvers = () => userRecommendationResolvers;

/**
 * Export service for direct access
 */
// Service instance kept internal - use API endpoints instead
// export const getRecommendationService = () => aiRecommendationService;

/**
 * Initialize user recommendation system
 */
export async function initializeUserRecommendations(): Promise<void> {
  try {
    // Health check
    const health = await aiRecommendationService.healthCheck();
    
    if (health.status !== 'healthy') {
      console.warn('[Integration] User recommendation service health check failed:', health);
    } else {
      console.log('[Integration] User recommendation service initialized successfully');
    }
  } catch (error) {
    console.error('[Integration] Failed to initialize user recommendation service:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownUserRecommendations(): Promise<void> {
  console.log('[Integration] Shutting down user recommendation service...');
  // Add any cleanup logic here if needed
  console.log('[Integration] User recommendation service shutdown complete');
}

export default {
  mountUserRecommendationRoutes,
  getUserRecommendationSchema,
  getUserRecommendationResolvers,
  initializeUserRecommendations,
  shutdownUserRecommendations,
};

