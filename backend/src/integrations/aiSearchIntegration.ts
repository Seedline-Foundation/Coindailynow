/**
 * AI Search Integration Module
 * 
 * Unified mounting point for AI search system including:
 * - REST API routes
 * - GraphQL schema and resolvers
 * - Service initialization
 * - Health monitoring
 * 
 * @module integrations/aiSearchIntegration
 */

import { Express } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { OpenAI } from 'openai';

// Import AI Search components
import aiSearchRouter from '../api/ai-search';
import aiSearchTypeDefs from '../api/aiSearchSchema';
import aiSearchResolvers from '../api/aiSearchResolvers';
import AISearchService from '../services/aiSearchService';

// ============================================================================
// Integration Configuration
// ============================================================================

export interface AISearchIntegrationConfig {
  app: Express;
  apolloServer?: ApolloServer;
  prisma: PrismaClient;
  redis: Redis;
  openai: OpenAI;
  basePath?: string;
}

// ============================================================================
// Integration Module
// ============================================================================

export class AISearchIntegration {
  private app: Express;
  private apolloServer?: ApolloServer;
  private prisma: PrismaClient;
  private redis: Redis;
  private openai: OpenAI;
  private aiSearchService: AISearchService;
  private basePath: string;

  constructor(config: AISearchIntegrationConfig) {
    this.app = config.app;
    this.apolloServer = config.apolloServer!;
    this.prisma = config.prisma;
    this.redis = config.redis;
    this.openai = config.openai;
    this.basePath = config.basePath || '/api/search';
    this.aiSearchService = new AISearchService(this.prisma, this.redis, this.openai);
  }

  /**
   * Initialize AI Search integration
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing AI Search Integration...');

      // Mount REST API routes
      this.mountRestAPI();

      // Extend GraphQL schema if Apollo Server is provided
      if (this.apolloServer) {
        this.extendGraphQLSchema();
      }

      // Setup health monitoring
      this.setupHealthMonitoring();

      // Warmup cache
      await this.warmupCache();

      console.log('✅ AI Search Integration initialized successfully');
    } catch (error) {
      console.error('❌ AI Search Integration initialization failed:', error);
      throw error;
    }
  }

  /**
   * Mount REST API routes
   */
  private mountRestAPI(): void {
    console.log(`  📡 Mounting REST API at ${this.basePath}`);
    this.app.use(this.basePath, aiSearchRouter);
  }

  /**
   * Extend GraphQL schema
   */
  private extendGraphQLSchema(): void {
    console.log('  🔗 Extending GraphQL schema with AI Search types');
    // Note: Schema extension is handled by Apollo Server's schema stitching
    // This is just a placeholder for documentation
  }

  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    console.log('  💓 Setting up health monitoring');

    // Health check every 5 minutes
    setInterval(async () => {
      try {
        const health = await this.aiSearchService.healthCheck();
        
        if (health.status !== 'healthy') {
          console.warn('⚠️ AI Search health check degraded:', health);
        }
      } catch (error) {
        console.error('❌ AI Search health check failed:', error);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Warmup cache with common queries
   */
  private async warmupCache(): Promise<void> {
    console.log('  🔥 Warming up cache with common queries...');

    const commonQueries = [
      'Bitcoin',
      'Ethereum',
      'cryptocurrency news',
      'memecoin',
      'DeFi',
    ];

    try {
      await Promise.all(
        commonQueries.map(async (query) => {
          try {
            await this.aiSearchService.aiEnhancedSearch({
              query,
              limit: 10,
            });
          } catch (error) {
            console.error(`  ❌ Failed to warmup query "${query}":`, error);
          }
        })
      );

      console.log('  ✅ Cache warmup completed');
    } catch (error) {
      console.error('  ⚠️ Cache warmup partially failed:', error);
    }
  }

  /**
   * Shutdown integration gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔍 Shutting down AI Search Integration...');

    try {
      // Close Redis connection
      await this.redis.quit();
      console.log('  ✅ Redis connection closed');

      // Close Prisma connection
      await this.prisma.$disconnect();
      console.log('  ✅ Prisma connection closed');

      console.log('✅ AI Search Integration shutdown complete');
    } catch (error) {
      console.error('❌ AI Search Integration shutdown error:', error);
      throw error;
    }
  }

  /**
   * Get service instance
   */
  getService(): AISearchService {
    return this.aiSearchService;
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Initialize AI Search integration with Express app
 */
export async function initializeAISearch(config: AISearchIntegrationConfig): Promise<AISearchIntegration> {
  const integration = new AISearchIntegration(config);
  await integration.initialize();
  return integration;
}

// ============================================================================
// Export
// ============================================================================

export {
  aiSearchTypeDefs,
  aiSearchResolvers,
  aiSearchRouter,
  AISearchService,
};

export default AISearchIntegration;
