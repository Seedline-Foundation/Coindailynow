/**
 * AI Social Media Automation - Integration Module
 * Task 9.2 Implementation
 * 
 * This module provides a unified interface for integrating AI social media
 * automation into the backend application.
 */

import express from 'express';
import aiSocialMediaRoutes from '../api/ai-social-media';
import aiSocialMediaSchema from '../api/aiSocialMediaSchema';
import aiSocialMediaResolvers from '../api/aiSocialMediaResolvers';

// ============================================================================
// INTEGRATION INTERFACE
// ============================================================================

export interface AISocialMediaIntegration {
  /**
   * Mount REST API routes
   */
  mountRoutes: (app: express.Application, basePath?: string) => void;

  /**
   * Get GraphQL schema
   */
  getGraphQLSchema: () => any;

  /**
   * Get GraphQL resolvers
   */
  getGraphQLResolvers: () => any;

  /**
   * Health check
   */
  healthCheck: () => Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }>;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

class AISocialMediaIntegrationImpl implements AISocialMediaIntegration {
  /**
   * Mount REST API routes to Express app
   */
  mountRoutes(app: express.Application, basePath: string = '/api/ai/social-media'): void {
    console.log(`📡 Mounting AI Social Media routes at ${basePath}`);
    app.use(basePath, aiSocialMediaRoutes);
  }

  /**
   * Get GraphQL schema for merging
   */
  getGraphQLSchema(): any {
    return aiSocialMediaSchema;
  }

  /**
   * Get GraphQL resolvers for merging
   */
  getGraphQLResolvers(): any {
    return aiSocialMediaResolvers;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Import dependencies
      const { PrismaClient } = await import('@prisma/client');
      const Redis = (await import('ioredis')).default;

      const prisma = new PrismaClient();
      
      const redisConfig: any = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        db: 0,
      };
      
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }
      
      const redis = new Redis(redisConfig);

      // Check database
      let dbHealthy = false;
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbHealthy = true;
      } catch (error) {
        console.error('Database health check failed:', error);
      }

      // Check Redis
      let redisHealthy = false;
      try {
        await redis.ping();
        redisHealthy = true;
      } catch (error) {
        console.error('Redis health check failed:', error);
      }

      // Check social media accounts
      let activeAccounts = 0;
      try {
        activeAccounts = await prisma.socialMediaAccount.count({
          where: { isActive: true },
        });
      } catch (error) {
        console.error('Failed to count active accounts:', error);
      }

      // Cleanup
      await prisma.$disconnect();
      redis.disconnect();

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!dbHealthy || !redisHealthy) {
        status = 'unhealthy';
      } else if (activeAccounts === 0) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          database: dbHealthy ? 'connected' : 'disconnected',
          redis: redisHealthy ? 'connected' : 'disconnected',
          activeAccounts,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiSocialMediaIntegration = new AISocialMediaIntegrationImpl();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { aiSocialMediaService } from '../services/aiSocialMediaService';
export { default as aiSocialMediaRoutes } from '../api/ai-social-media';
export { default as aiSocialMediaSchema } from '../api/aiSocialMediaSchema';
export { default as aiSocialMediaResolvers } from '../api/aiSocialMediaResolvers';

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your main Express app:

import { aiSocialMediaIntegration } from './integrations/aiSocialMediaIntegration';

// Mount REST API routes
aiSocialMediaIntegration.mountRoutes(app);

// In your GraphQL setup:
const schema = makeExecutableSchema({
  typeDefs: [
    baseSchema,
    aiSocialMediaIntegration.getGraphQLSchema(),
  ],
  resolvers: merge(
    baseResolvers,
    aiSocialMediaIntegration.getGraphQLResolvers(),
  ),
});

// Health check
const health = await aiSocialMediaIntegration.healthCheck();
console.log('AI Social Media Health:', health);
*/
