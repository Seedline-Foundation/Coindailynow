/**
 * AI Cost Control Integration Module
 * Task 10.3 - Production-Ready Implementation
 * 
 * Easy-to-use integration module for mounting AI cost control system
 * 
 * Usage:
 * ```typescript
 * import aiCostIntegration from './integrations/aiCostIntegration';
 * 
 * // Mount REST API
 * app.use('/api/ai/costs', aiCostIntegration.router);
 * 
 * // Add GraphQL types and resolvers
 * const server = new ApolloServer({
 *   typeDefs: [aiCostIntegration.typeDefs, ...otherTypeDefs],
 *   resolvers: [aiCostIntegration.resolvers, ...otherResolvers],
 * });
 * 
 * // Start background worker
 * aiCostIntegration.startWorker();
 * ```
 * 
 * @module integrations/aiCostIntegration
 */

import aiCostRouter from '../api/ai-costs';
import aiCostTypeDefs from '../api/aiCostSchema';
import aiCostResolvers from '../api/aiCostResolvers';
import aiCostWorker from '../workers/aiCostWorker';
import aiCostService from '../services/aiCostService';

// ===================================
// INTEGRATION INTERFACE
// ===================================

export interface AICostIntegration {
  // REST API router
  router: typeof aiCostRouter;
  
  // GraphQL schema and resolvers
  typeDefs: typeof aiCostTypeDefs;
  resolvers: typeof aiCostResolvers;
  
  // Background worker control
  startWorker: () => void;
  stopWorker: () => void;
  getWorkerStatus: () => { running: boolean; jobCount: number };
  
  // Service methods (direct access)
  service: typeof aiCostService;
  
  // Helper methods
  healthCheck: () => Promise<{ status: string; timestamp: Date }>;
  invalidateCaches: () => Promise<void>;
}

// ===================================
// INTEGRATION OBJECT
// ===================================

const aiCostIntegration: AICostIntegration = {
  // REST API
  router: aiCostRouter,
  
  // GraphQL
  typeDefs: aiCostTypeDefs,
  resolvers: aiCostResolvers,
  
  // Worker
  startWorker: aiCostWorker.start,
  stopWorker: aiCostWorker.stop,
  getWorkerStatus: aiCostWorker.getStatus,
  
  // Service
  service: aiCostService,
  
  // Helpers
  healthCheck: async () => {
    return await aiCostService.healthCheck();
  },
  
  invalidateCaches: async () => {
    await aiCostService.invalidateAllCaches();
  },
};

// ===================================
// QUICK SETUP FUNCTION
// ===================================

/**
 * Quick setup for AI cost control system
 * 
 * @param app Express app
 * @param options Setup options
 */
export function setupAICostControl(
  app: any,
  options: {
    enableWorker?: boolean;
    apiPrefix?: string;
  } = {}
): void {
  const { enableWorker = true, apiPrefix = '/api/ai/costs' } = options;
  
  console.log('[AI Cost Integration] Setting up AI cost control system...');
  
  // Mount REST API
  app.use(apiPrefix, aiCostIntegration.router);
  console.log(`[AI Cost Integration] REST API mounted at ${apiPrefix}`);
  
  // Start background worker
  if (enableWorker) {
    aiCostIntegration.startWorker();
    console.log('[AI Cost Integration] Background worker started');
  }
  
  console.log('[AI Cost Integration] AI cost control system ready');
}

// ===================================
// MIDDLEWARE FOR AUTOMATIC COST TRACKING
// ===================================

/**
 * Express middleware to automatically track AI operation costs
 * 
 * Usage:
 * ```typescript
 * app.use(aiCostTrackingMiddleware({
 *   agentType: 'content_generation',
 *   provider: 'openai',
 *   model: 'gpt-4-turbo',
 * }));
 * ```
 */
export function aiCostTrackingMiddleware(defaultConfig: {
  agentType?: string;
  provider?: string;
  model?: string;
}) {
  return async (req: any, res: any, next: any) => {
    // Store start time
    const startTime = Date.now();
    
    // Store original send function
    const originalSend = res.send;
    
    // Override send to track cost
    res.send = function(data: any) {
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Extract token usage from response if available
      const tokens = extractTokenUsage(data);
      
      // Track cost asynchronously (don't wait)
      if (tokens) {
        aiCostService.trackCost({
          operationType: 'api_call',
          agentType: req.headers['x-agent-type'] || defaultConfig.agentType,
          provider: (req.headers['x-provider'] || defaultConfig.provider) as any,
          model: req.headers['x-model'] || defaultConfig.model || 'unknown',
          inputTokens: tokens.input,
          outputTokens: tokens.output,
          totalTokens: tokens.total,
          responseTimeMs: responseTime,
          userId: req.userId,
          requestMetadata: {
            path: req.path,
            method: req.method,
          },
        }).catch(console.error);
      }
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Extract token usage from response data
 */
function extractTokenUsage(data: any): { input: number; output: number; total: number } | null {
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    if (data.usage) {
      return {
        input: data.usage.prompt_tokens || 0,
        output: data.usage.completion_tokens || 0,
        total: data.usage.total_tokens || 0,
      };
    }
    
    if (data.data?.usage) {
      return {
        input: data.data.usage.prompt_tokens || 0,
        output: data.data.usage.completion_tokens || 0,
        total: data.data.usage.total_tokens || 0,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ===================================
// BUDGET CHECK MIDDLEWARE
// ===================================

/**
 * Express middleware to check budget before processing request
 * 
 * Usage:
 * ```typescript
 * app.use('/api/ai/generate', budgetCheckMiddleware({
 *   agentType: 'content_generation',
 * }));
 * ```
 */
export function budgetCheckMiddleware(config: {
  agentType?: string;
  userId?: string;
  organizationId?: string;
}) {
  return async (req: any, res: any, next: any) => {
    const agentType = req.headers['x-agent-type'] || config.agentType;
    const userId = req.userId || config.userId;
    const organizationId = req.headers['x-organization-id'] || config.organizationId;
    
    const allowed = await aiCostService.isOperationAllowed(agentType, userId, organizationId);
    
    if (!allowed) {
      return res.status(429).json({
        error: {
          code: 'BUDGET_EXCEEDED',
          message: 'Operation blocked: budget limit exceeded',
          details: 'Your AI operation budget has been reached. Please wait for the budget to reset or contact support.',
        },
      });
    }
    
    next();
  };
}

// ===================================
// EXPORTS
// ===================================

export default aiCostIntegration;

export {
  setupAICostControl,
  aiCostTrackingMiddleware,
  budgetCheckMiddleware,
};
