/**
 * AI Agents REST API Routes
 * Provides RESTful endpoints for AI agent management
 * 
 * Endpoints:
 * - POST   /api/ai/agents                    - Register new agent
 * - GET    /api/ai/agents                    - List all agents
 * - GET    /api/ai/agents/:id                - Get agent details
 * - PUT    /api/ai/agents/:id                - Update agent config
 * - DELETE /api/ai/agents/:id                - Deactivate agent
 * - GET    /api/ai/agents/:id/metrics        - Get performance metrics
 * - POST   /api/ai/agents/:id/reset          - Reset agent state
 */

import { Router, Request, Response } from 'express';
import {
  registerAIAgent,
  getAIAgentById,
  getAllAIAgents,
  updateAIAgentConfig,
  deactivateAIAgent,
  getAIAgentMetrics,
  resetAgentState,
  toggleAIAgent,
  logAIOperation,
} from '../../services/aiAgentService';
import { logger } from '../../utils/logger';

const router = Router();

// ==================== HELPER FUNCTIONS ====================

/**
 * Standard success response
 */
function successResponse(res: Response, data: any, message?: string) {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard error response
 */
function errorResponse(res: Response, error: any, statusCode = 500) {
  logger.error('API Error:', error);
  
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      details: error.details || null,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Validate required fields
 */
function validateRequiredFields(body: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// ==================== ROUTES ====================

/**
 * POST /api/ai/agents
 * Register a new AI agent
 * 
 * Body:
 * {
 *   "id": "agent-123",
 *   "name": "Content Generator",
 *   "type": "content_generation",
 *   "modelProvider": "openai",
 *   "modelName": "gpt-4-turbo",
 *   "configuration": { ... },
 *   "isActive": true
 * }
 */
router.post('/agents', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Validate required fields
    const validationError = validateRequiredFields(req.body, [
      'id',
      'name',
      'type',
      'modelProvider',
      'modelName',
    ]);

    if (validationError) {
      return errorResponse(res, { message: validationError }, 400);
    }

    // Register agent
    const agent = await registerAIAgent(req.body);

    // Log operation
    await logAIOperation('register', agent.id, {
      type: agent.type,
      modelProvider: agent.modelProvider,
      duration: Date.now() - startTime,
    });

    return successResponse(res, agent, 'AI agent registered successfully');
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * GET /api/ai/agents
 * List all AI agents with optional filtering
 * 
 * Query params:
 * - type: Filter by agent type
 * - isActive: Filter by active status (true/false)
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Build filter
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type as string;
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Get agents
    const agents = await getAllAIAgents(Object.keys(filter).length > 0 ? filter : undefined);

    const responseTime = Date.now() - startTime;
    
    logger.info(`Listed ${agents.length} AI agents in ${responseTime}ms`);

    return successResponse(res, {
      agents,
      count: agents.length,
      responseTime,
    }, 'AI agents retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error);
  }
});

/**
 * GET /api/ai/agents/:id
 * Get detailed information about a specific agent
 */
router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Get agent
    const agent = await getAIAgentById(id);

    if (!agent) {
      return errorResponse(res, { message: `Agent not found: ${id}` }, 404);
    }

    const responseTime = Date.now() - startTime;
    
    logger.info(`Retrieved agent ${id} in ${responseTime}ms`);

    return successResponse(res, {
      agent,
      responseTime,
    }, 'Agent retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error);
  }
});

/**
 * PUT /api/ai/agents/:id
 * Update agent configuration
 * 
 * Body:
 * {
 *   "configuration": {
 *     "temperature": 0.7,
 *     "maxTokens": 2000,
 *     ...
 *   }
 * }
 */
router.put('/agents/:id', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Validate configuration
    if (!req.body.configuration) {
      return errorResponse(res, { message: 'Missing configuration field' }, 400);
    }

    // Update agent
    const agent = await updateAIAgentConfig(id, {
      configuration: req.body.configuration,
    });

    // Log operation
    await logAIOperation('update_config', id, {
      configKeys: Object.keys(req.body.configuration),
      duration: Date.now() - startTime,
    });

    return successResponse(res, agent, 'Agent configuration updated successfully');
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * PATCH /api/ai/agents/:id/toggle
 * Toggle agent active status
 * 
 * Body:
 * {
 *   "isActive": true
 * }
 */
router.patch('/agents/:id/toggle', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Validate isActive
    if (req.body.isActive === undefined) {
      return errorResponse(res, { message: 'Missing isActive field' }, 400);
    }

    // Toggle agent
    const agent = await toggleAIAgent(id, req.body.isActive);

    // Log operation
    await logAIOperation('toggle', id, {
      isActive: req.body.isActive,
      duration: Date.now() - startTime,
    });

    return successResponse(res, agent, `Agent ${req.body.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * DELETE /api/ai/agents/:id
 * Deactivate an agent (soft delete)
 */
router.delete('/agents/:id', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Deactivate agent
    const agent = await deactivateAIAgent(id);

    // Log operation
    await logAIOperation('deactivate', id, {
      duration: Date.now() - startTime,
    });

    return successResponse(res, agent, 'Agent deactivated successfully');
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * GET /api/ai/agents/:id/metrics
 * Get performance metrics for an agent
 * 
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
router.get('/agents/:id/metrics', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Build date filter
    const filter: any = {};
    if (req.query.startDate) {
      filter.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.endDate = new Date(req.query.endDate as string);
    }

    // Get metrics
    const metrics = await getAIAgentMetrics(id, Object.keys(filter).length > 0 ? filter : undefined);

    const responseTime = Date.now() - startTime;
    
    logger.info(`Retrieved metrics for agent ${id} in ${responseTime}ms`);

    return successResponse(res, {
      agentId: id,
      metrics,
      dateRange: {
        startDate: filter.startDate || null,
        endDate: filter.endDate || null,
      },
      responseTime,
    }, 'Agent metrics retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * POST /api/ai/agents/:id/reset
 * Reset agent state (clear metrics and restart)
 */
router.post('/agents/:id/reset', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Reset agent
    const agent = await resetAgentState(id);

    // Log operation
    await logAIOperation('reset', id, {
      duration: Date.now() - startTime,
    });

    return successResponse(res, agent, 'Agent state reset successfully');
  } catch (error: any) {
    return errorResponse(res, error, error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * GET /api/ai/agents/:id/health
 * Get agent health status
 */
router.get('/agents/:id/health', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, { message: 'Agent ID is required' }, 400);
    }

    // Check if agent exists
    const agent = await getAIAgentById(id);
    if (!agent) {
      return errorResponse(res, { message: `Agent not found: ${id}` }, 404);
    }

    // Get health from service (will be in a future implementation)
    const health = {
      agentId: id,
      isHealthy: agent.isActive,
      lastCheck: new Date(),
      metrics: agent.performanceMetrics,
    };

    return successResponse(res, health, 'Agent health retrieved successfully');
  } catch (error: any) {
    return errorResponse(res, error);
  }
});

// ==================== BATCH OPERATIONS ====================

/**
 * POST /api/ai/agents/batch/register
 * Register multiple agents at once
 * 
 * Body:
 * {
 *   "agents": [
 *     { "id": "...", "name": "...", ... },
 *     { "id": "...", "name": "...", ... }
 *   ]
 * }
 */
router.post('/agents/batch/register', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    if (!req.body.agents || !Array.isArray(req.body.agents)) {
      return errorResponse(res, { message: 'Missing or invalid agents array' }, 400);
    }

    const results = [];
    const errors = [];

    for (const agentData of req.body.agents) {
      try {
        const agent = await registerAIAgent(agentData);
        results.push(agent);
      } catch (error: any) {
        errors.push({
          agentId: agentData.id,
          error: error.message,
        });
      }
    }

    // Log batch operation
    await logAIOperation('batch_register', 'system', {
      total: req.body.agents.length,
      successful: results.length,
      failed: errors.length,
      duration: Date.now() - startTime,
    });

    return successResponse(res, {
      registered: results,
      errors,
      summary: {
        total: req.body.agents.length,
        successful: results.length,
        failed: errors.length,
      },
    }, `Batch registration complete: ${results.length} successful, ${errors.length} failed`);
  } catch (error: any) {
    return errorResponse(res, error);
  }
});

// ==================== EXPORT ====================

export default router;
