/**
 * AI Image Integration Module
 * TASK 8.2: AI-Generated Visuals
 * 
 * This module provides a unified interface for integrating the AI image generation
 * system into the Express application and GraphQL server.
 */

import { Express } from 'express';
import aiImageRoutes from '../api/ai-images';
import { aiImageSchema } from '../api/aiImageSchema';
import { aiImageResolvers } from '../api/aiImageResolvers';
import { aiImageService } from '../services/aiImageService';

export interface AIImageIntegrationOptions {
  enableRestAPI?: boolean;
  enableGraphQL?: boolean;
  basePath?: string;
}

export class AIImageIntegration {
  private isInitialized: boolean = false;

  /**
   * Initialize the AI Image system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AIImageIntegration] Already initialized');
      return;
    }

    try {
      // Initialize the AI image service
      await aiImageService.initialize();

      this.isInitialized = true;
      console.log('[AIImageIntegration] Initialized successfully');
    } catch (error) {
      console.error('[AIImageIntegration] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Mount REST API routes to Express app
   */
  mountRestAPI(app: Express, options: AIImageIntegrationOptions = {}): void {
    const basePath = options.basePath || '/api';

    if (options.enableRestAPI !== false) {
      app.use(basePath, aiImageRoutes);
      console.log(`[AIImageIntegration] REST API mounted at ${basePath}`);
    }
  }

  /**
   * Get GraphQL schema for merging with main schema
   */
  getGraphQLSchema() {
    return aiImageSchema;
  }

  /**
   * Get GraphQL resolvers for merging with main resolvers
   */
  getGraphQLResolvers() {
    return aiImageResolvers;
  }

  /**
   * Get service instance for direct usage
   */
  getService() {
    return aiImageService;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return await aiImageService.getHealthStatus();
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[AIImageIntegration] Shutting down...');
    this.isInitialized = false;
  }
}

// Export singleton instance
export const aiImageIntegration = new AIImageIntegration();

// Export for easy imports
export { aiImageService } from '../services/aiImageService';
export { aiImageSchema } from '../api/aiImageSchema';
export { aiImageResolvers } from '../api/aiImageResolvers';

/**
 * Quick setup function for easy integration
 * 
 * Usage:
 * ```typescript
 * import { setupAIImages } from './integrations/aiImageIntegration';
 * 
 * // In your app setup
 * await setupAIImages(app, {
 *   enableRestAPI: true,
 *   enableGraphQL: true,
 *   basePath: '/api',
 * });
 * ```
 */
export async function setupAIImages(
  app: Express,
  options: AIImageIntegrationOptions = {}
): Promise<void> {
  await aiImageIntegration.initialize();
  aiImageIntegration.mountRestAPI(app, options);
  
  console.log('[AIImageIntegration] Setup complete');
}

export default aiImageIntegration;
