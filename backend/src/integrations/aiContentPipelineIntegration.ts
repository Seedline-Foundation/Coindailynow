/**
 * AI Content Pipeline Integration Module
 * 
 * Unified integration interface for mounting pipeline routes and services.
 */

import { Express } from 'express';
import aiContentPipelineRoutes from '../api/ai-content-pipeline';
import aiContentPipelineTypeDefs from '../api/aiContentPipelineSchema';
import aiContentPipelineResolvers from '../api/aiContentPipelineResolvers';
import { startWorker, stopWorker, getWorkerStatus } from '../workers/aiContentPipelineWorker';

// ============================================================================
// INTEGRATION INTERFACE
// ============================================================================

export interface ContentPipelineIntegration {
  /**
   * Mount REST API routes
   */
  mountRoutes: (app: Express, basePath?: string) => void;

  /**
   * Get GraphQL type definitions
   */
  getTypeDefs: () => any;

  /**
   * Get GraphQL resolvers
   */
  getResolvers: () => any;

  /**
   * Start background worker
   */
  startBackgroundWorker: () => Promise<void>;

  /**
   * Stop background worker
   */
  stopBackgroundWorker: () => Promise<void>;

  /**
   * Get worker status
   */
  getBackgroundWorkerStatus: () => any;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

class ContentPipelineIntegrationImpl implements ContentPipelineIntegration {
  /**
   * Mount REST API routes to Express app
   */
  mountRoutes(app: Express, basePath: string = '/api/ai/pipeline'): void {
    console.log(`[Content Pipeline Integration] Mounting routes at ${basePath}`);
    app.use(basePath, aiContentPipelineRoutes);
  }

  /**
   * Get GraphQL type definitions
   */
  getTypeDefs(): any {
    return aiContentPipelineTypeDefs;
  }

  /**
   * Get GraphQL resolvers
   */
  getResolvers(): any {
    return aiContentPipelineResolvers;
  }

  /**
   * Start background worker
   */
  async startBackgroundWorker(): Promise<void> {
    console.log('[Content Pipeline Integration] Starting background worker...');
    await startWorker();
  }

  /**
   * Stop background worker
   */
  async stopBackgroundWorker(): Promise<void> {
    console.log('[Content Pipeline Integration] Stopping background worker...');
    await stopWorker();
  }

  /**
   * Get worker status
   */
  getBackgroundWorkerStatus(): any {
    return getWorkerStatus();
  }
}

// Export singleton instance
export const contentPipelineIntegration = new ContentPipelineIntegrationImpl();

// Export default
export default contentPipelineIntegration;
