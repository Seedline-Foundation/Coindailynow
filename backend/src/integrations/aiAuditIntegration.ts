/**
 * AI Audit & Compliance Logging Integration Module
 * 
 * Easy-to-use integration module for mounting the AI audit system.
 * 
 * @module integrations/aiAuditIntegration
 */

import { Express } from 'express';
import { ApolloServer } from 'apollo-server-express';
import aiAuditRoutes from '../api/ai-audit';
import aiAuditTypeDefs from '../api/aiAuditSchema';
import aiAuditResolvers from '../api/aiAuditResolvers';

export interface AuditIntegrationOptions {
  /**
   * Enable REST API endpoints
   * @default true
   */
  enableRestAPI?: boolean;
  
  /**
   * Enable GraphQL API
   * @default true
   */
  enableGraphQL?: boolean;
  
  /**
   * REST API base path
   * @default '/api/ai/audit'
   */
  restBasePath?: string;
  
  /**
   * Enable automatic log archival
   * @default true
   */
  enableAutoArchival?: boolean;
  
  /**
   * Archive logs older than this many days
   * @default 365
   */
  archivalThresholdDays?: number;
  
  /**
   * Enable automatic log deletion (2-year retention)
   * @default true
   */
  enableAutoDeletion?: boolean;
}

/**
 * Mount the AI Audit & Compliance Logging system
 * 
 * @example
 * ```typescript
 * import { mountAuditSystem } from './integrations/aiAuditIntegration';
 * 
 * mountAuditSystem(app, apolloServer, {
 *   enableRestAPI: true,
 *   enableGraphQL: true,
 *   restBasePath: '/api/ai/audit',
 *   enableAutoArchival: true,
 *   archivalThresholdDays: 365,
 *   enableAutoDeletion: true,
 * });
 * ```
 */
export function mountAuditSystem(
  app: Express,
  apolloServer?: ApolloServer,
  options: AuditIntegrationOptions = {}
) {
  const {
    enableRestAPI = true,
    enableGraphQL = true,
    restBasePath = '/api/ai/audit',
    enableAutoArchival = true,
    archivalThresholdDays = 365,
    enableAutoDeletion = true,
  } = options;
  
  console.log('[AI Audit Integration] Mounting AI Audit & Compliance Logging system...');
  
  // Mount REST API
  if (enableRestAPI) {
    app.use(restBasePath, aiAuditRoutes);
    console.log(`[AI Audit Integration] ✓ REST API mounted at ${restBasePath}`);
  }
  
  // Mount GraphQL API
  if (enableGraphQL && apolloServer) {
    // GraphQL schema and resolvers are exported separately
    // and should be merged with your main Apollo Server configuration
    console.log('[AI Audit Integration] ✓ GraphQL schema available for merging');
    console.log('[AI Audit Integration]   Import: aiAuditTypeDefs, aiAuditResolvers');
  }
  
  // Start background workers
  if (enableAutoArchival || enableAutoDeletion) {
    const { startAuditWorker } = require('../workers/aiAuditWorker');
    startAuditWorker({
      enableArchival: enableAutoArchival,
      archivalThresholdDays,
      enableDeletion: enableAutoDeletion,
    });
    console.log('[AI Audit Integration] ✓ Background worker started');
  }
  
  console.log('[AI Audit Integration] AI Audit system successfully mounted');
}

/**
 * Export GraphQL schema and resolvers for manual integration
 */
export const graphQLSchema = {
  typeDefs: aiAuditTypeDefs,
  resolvers: aiAuditResolvers,
};

/**
 * Quick setup function for common use case
 */
export function setupAuditSystem(app: Express, apolloServer?: ApolloServer) {
  mountAuditSystem(app, apolloServer, {
    enableRestAPI: true,
    enableGraphQL: true,
    restBasePath: '/api/ai/audit',
    enableAutoArchival: true,
    archivalThresholdDays: 365,
    enableAutoDeletion: true,
  });
}

export default {
  mountAuditSystem,
  setupAuditSystem,
  graphQLSchema,
};
