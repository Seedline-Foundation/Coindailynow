/**
 * AI Agent Registry REST API Routes
 * Provides RESTful endpoints for the centralized AI agent registry
 * 
 * Endpoints:
 * - GET    /api/ai/registry/agents                     - List all registry agents (with optional filters)
 * - GET    /api/ai/registry/agents/by-category          - Get agents grouped by category
 * - GET    /api/ai/registry/stats                       - Get registry summary stats
 * - GET    /api/ai/registry/tasks/running               - Get all currently running tasks
 * - GET    /api/ai/registry/tasks/completed             - Get completed tasks (paginated)
 * - GET    /api/ai/registry/tasks/history               - Get full task history (paginated, filterable)
 * - GET    /api/ai/registry/agents/:id                  - Get single agent info
 * - GET    /api/ai/registry/agents/:id/tasks/running    - Get running tasks for specific agent
 * - GET    /api/ai/registry/agents/:id/tasks/completed  - Get completed tasks for specific agent
 * - GET    /api/ai/registry/agents/:id/tasks/history    - Get task history for specific agent
 * - POST   /api/ai/registry/agents/:id/tasks            - Submit a task to specific agent
 * - POST   /api/ai/registry/agents/:id/toggle           - Enable/disable agent
 * - POST   /api/ai/registry/agents/:id/reset            - Reset agent state
 * - GET    /api/ai/registry/health                      - Health check all agents
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

// Import the agent registry singleton
// Using dynamic import path - the ai-system is at the project root level
let agentRegistry: any = null;

async function getRegistry() {
  if (!agentRegistry) {
    try {
      // Try to import the registry from ai-system
      const registryModule = await import('../../../ai-system/agents/index');
      agentRegistry = registryModule.agentRegistry || registryModule.default;
      
      // Initialize if not already done
      if (agentRegistry && typeof agentRegistry.initialize === 'function') {
        agentRegistry.initialize();
      }
      
      logger.info(`[AI Registry API] Registry loaded with ${agentRegistry?.size || 0} agents`);
    } catch (err) {
      logger.error('[AI Registry API] Failed to load agent registry:', err);
      throw new Error('Agent registry not available');
    }
  }
  return agentRegistry;
}

const router = Router();

// ==================== HELPER FUNCTIONS ====================

function successResponse(res: Response, data: any, message?: string) {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function errorResponse(res: Response, error: any, statusCode = 500) {
  logger.error('[AI Registry API] Error:', error?.message || error);
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error?.message || 'Internal server error',
      code: error?.code || 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
  });
}

// ==================== AGENTS ====================

/**
 * GET /agents
 * List all agents with optional category/status filter
 * Query: ?category=analysis&status=active&search=sentiment
 */
router.get('/agents', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const { category, status, search } = req.query;

    let agents = registry.getAllAgentInfo();

    // Filter by category
    if (category && typeof category === 'string') {
      agents = agents.filter((a: any) => a.category === category);
    }

    // Filter by status
    if (status && typeof status === 'string') {
      if (status === 'active') {
        agents = agents.filter((a: any) => a.isActive);
      } else if (status === 'inactive') {
        agents = agents.filter((a: any) => !a.isActive);
      } else {
        agents = agents.filter((a: any) => a.status === status);
      }
    }

    // Search by name/description
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      agents = agents.filter((a: any) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower) ||
        a.id.toLowerCase().includes(searchLower)
      );
    }

    // Add current task and queue info for each agent
    const enrichedAgents = agents.map((info: any) => {
      const agent = registry.getAgent(info.id);
      return {
        ...info,
        currentTask: agent?.getCurrentTask() || null,
        queuedTasks: agent?.getQueuedTasks()?.length || 0,
        completedTasks: agent?.getCompletedTasks()?.length || 0,
      };
    });

    successResponse(res, enrichedAgents, `Found ${enrichedAgents.length} agents`);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /agents/by-category
 * Get agents grouped by category
 */
router.get('/agents/by-category', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const categories = registry.getCategories();

    // Enrich each agent with task info
    const enriched: Record<string, any[]> = {};
    for (const [cat, agentInfos] of Object.entries(categories)) {
      enriched[cat] = (agentInfos as any[]).map((info: any) => {
        const agent = registry.getAgent(info.id);
        return {
          ...info,
          currentTask: agent?.getCurrentTask() || null,
          queuedTasks: agent?.getQueuedTasks()?.length || 0,
          completedTasks: agent?.getCompletedTasks()?.length || 0,
        };
      });
    }

    successResponse(res, enriched);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /stats
 * Get registry summary statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const stats = registry.getStats();
    successResponse(res, stats);
  } catch (error) {
    errorResponse(res, error);
  }
});

// ==================== TASKS ====================

/**
 * GET /tasks/running
 * Get all currently running tasks across all agents
 */
router.get('/tasks/running', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const { agent } = req.query;
    
    let running = registry.getRunningTasks();
    
    if (agent && typeof agent === 'string') {
      running = running.filter((t: any) => t.agentId === agent);
    }

    successResponse(res, running);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /tasks/completed
 * Get completed tasks with pagination
 * Query: ?limit=50&page=1&agent=sentiment-analysis
 */
router.get('/tasks/completed', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const agentFilter = req.query.agent as string;

    let tasks = registry.getCompletedTasks(limit * page);

    if (agentFilter) {
      tasks = tasks.filter((t: any) => t.agentId === agentFilter);
    }

    // Client-side pagination
    const start = (page - 1) * limit;
    const paginatedTasks = tasks.slice(start, start + limit);

    successResponse(res, {
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total: tasks.length,
        totalPages: Math.ceil(tasks.length / limit),
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /tasks/history
 * Get full task history with filters
 * Query: ?limit=100&page=1&status=completed&priority=high&agent=forecast&from=2025-01-01&to=2025-12-31
 */
router.get('/tasks/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const limit = parseInt(req.query.limit as string) || 100;
    const page = parseInt(req.query.page as string) || 1;
    const { status, priority, agent, from, to } = req.query;

    let tasks = registry.getTaskHistory(10000); // Get all, then filter

    // Filter by status
    if (status && typeof status === 'string') {
      tasks = tasks.filter((t: any) => t.task.status === status);
    }

    // Filter by priority
    if (priority && typeof priority === 'string') {
      tasks = tasks.filter((t: any) => t.task.priority === priority);
    }

    // Filter by agent
    if (agent && typeof agent === 'string') {
      tasks = tasks.filter((t: any) => t.agentId === agent);
    }

    // Filter by date range
    if (from && typeof from === 'string') {
      const fromDate = new Date(from);
      tasks = tasks.filter((t: any) => new Date(t.task.createdAt) >= fromDate);
    }
    if (to && typeof to === 'string') {
      const toDate = new Date(to);
      tasks = tasks.filter((t: any) => new Date(t.task.createdAt) <= toDate);
    }

    const total = tasks.length;
    const start = (page - 1) * limit;
    const paginatedTasks = tasks.slice(start, start + limit);

    successResponse(res, {
      tasks: paginatedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

// ==================== SINGLE AGENT OPERATIONS ====================

/**
 * GET /agents/:id
 * Get a single agent's full info
 */
router.get('/agents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const agent = registry.getAgent(req.params.id);
    
    if (!agent) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    const info = agent.getInfo();
    const enriched = {
      ...info,
      currentTask: agent.getCurrentTask() || null,
      queuedTasks: agent.getQueuedTasks() || [],
      completedTasks: agent.getCompletedTasks() || [],
      taskHistory: agent.getTaskHistory() || [],
    };

    successResponse(res, enriched);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /agents/:id/tasks/running
 * Get running tasks for a specific agent
 */
router.get('/agents/:id/tasks/running', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const agent = registry.getAgent(req.params.id);
    
    if (!agent) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    const currentTask = agent.getCurrentTask();
    const running = currentTask ? [currentTask] : [];

    successResponse(res, running);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /agents/:id/tasks/completed
 * Get completed tasks for a specific agent
 * Query: ?limit=50
 */
router.get('/agents/:id/tasks/completed', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const agent = registry.getAgent(req.params.id);
    
    if (!agent) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const tasks = agent.getCompletedTasks().slice(0, limit);

    successResponse(res, tasks);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * GET /agents/:id/tasks/history
 * Get full task history for a specific agent
 * Query: ?limit=100&status=completed&from=2025-01-01&to=2025-12-31
 */
router.get('/agents/:id/tasks/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const agent = registry.getAgent(req.params.id);
    
    if (!agent) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const { status, from, to } = req.query;

    let tasks = agent.getTaskHistory();

    if (status && typeof status === 'string') {
      tasks = tasks.filter((t: any) => t.status === status);
    }
    if (from && typeof from === 'string') {
      const fromDate = new Date(from);
      tasks = tasks.filter((t: any) => new Date(t.createdAt) >= fromDate);
    }
    if (to && typeof to === 'string') {
      const toDate = new Date(to);
      tasks = tasks.filter((t: any) => new Date(t.createdAt) <= toDate);
    }

    successResponse(res, tasks.slice(0, limit));
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * POST /agents/:id/tasks
 * Submit a task to a specific agent
 * Body: { input: { ... }, priority?: 'low' | 'normal' | 'high' | 'urgent' }
 */
router.post('/agents/:id/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const { input, priority = 'normal' } = req.body;

    if (!input) {
      errorResponse(res, { message: 'Missing required field: input', code: 'INVALID_INPUT' }, 400);
      return;
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      errorResponse(res, { message: `Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`, code: 'INVALID_PRIORITY' }, 400);
      return;
    }

    const taskId = await registry.submitTask(req.params.id, input, priority);

    res.status(201).json({
      success: true,
      message: 'Task submitted successfully',
      data: {
        taskId,
        agentId: req.params.id,
        priority,
        status: 'queued',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      errorResponse(res, error, 404);
    } else {
      errorResponse(res, error);
    }
  }
});

/**
 * POST /agents/:id/toggle
 * Enable/disable an agent
 * Body: { active: boolean }
 */
router.post('/agents/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      errorResponse(res, { message: 'Missing required field: active (boolean)', code: 'INVALID_INPUT' }, 400);
      return;
    }

    const success = registry.setAgentActive(req.params.id, active);
    if (!success) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    successResponse(res, { agentId: req.params.id, active }, `Agent ${active ? 'enabled' : 'disabled'}`);
  } catch (error) {
    errorResponse(res, error);
  }
});

/**
 * POST /agents/:id/reset
 * Reset agent state
 */
router.post('/agents/:id/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const success = registry.resetAgent(req.params.id);
    
    if (!success) {
      errorResponse(res, { message: `Agent not found: ${req.params.id}`, code: 'AGENT_NOT_FOUND' }, 404);
      return;
    }

    successResponse(res, { agentId: req.params.id, reset: true }, 'Agent reset successfully');
  } catch (error) {
    errorResponse(res, error);
  }
});

// ==================== HEALTH ====================

/**
 * GET /health
 * Health check all agents
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const registry = await getRegistry();
    const healthResults = await registry.healthCheckAll();
    const stats = registry.getStats();

    successResponse(res, {
      overallHealth: stats.overallHealth,
      totalAgents: stats.totalAgents,
      activeAgents: stats.activeAgents,
      agents: healthResults,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

export default router;
