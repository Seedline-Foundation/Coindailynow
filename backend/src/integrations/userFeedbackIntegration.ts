/**
 * User Feedback Integration Module
 * 
 * Integrates user feedback system with Express and GraphQL
 * 
 * @module UserFeedbackIntegration
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import createUserFeedbackRouter from '../api/user-feedback';
import { userFeedbackTypeDefs } from '../api/userFeedbackSchema';
import { createUserFeedbackResolvers } from '../api/userFeedbackResolvers';

// ============================================================================
// Integration Functions
// ============================================================================

/**
 * Mount user feedback routes to Express app
 */
export function mountUserFeedbackRoutes(
  app: Express,
  prisma: PrismaClient,
  redis: RedisClientType
): void {
  const feedbackRouter = createUserFeedbackRouter(prisma, redis);
  app.use('/api/user/feedback', feedbackRouter);
  
  console.log('✓ User feedback routes mounted at /api/user/feedback');
}

/**
 * Export GraphQL schema and resolvers
 */
export function getUserFeedbackGraphQL(
  prisma: PrismaClient,
  redis: RedisClientType
) {
  return {
    typeDefs: userFeedbackTypeDefs,
    resolvers: createUserFeedbackResolvers(prisma, redis),
  };
}

/**
 * Initialize user feedback system
 */
export async function initializeUserFeedbackSystem(
  app: Express,
  prisma: PrismaClient,
  redis: RedisClientType
): Promise<void> {
  try {
    // Mount REST API routes
    mountUserFeedbackRoutes(app, prisma, redis);

    console.log('✓ User feedback system initialized successfully');
  } catch (error: any) {
    console.error('✗ Failed to initialize user feedback system:', error);
    throw error;
  }
}

export default {
  mountUserFeedbackRoutes,
  getUserFeedbackGraphQL,
  initializeUserFeedbackSystem,
};
