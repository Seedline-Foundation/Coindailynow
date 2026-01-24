/**
 * AI Tasks REST API Endpoints
 * Provides HTTP endpoints for AI task management
 * 
 * Endpoints:
 * - POST   /api/ai/tasks                     - Create new task
 * - GET    /api/ai/tasks                     - List tasks (paginated)
 * - GET    /api/ai/tasks/:id                 - Get task details
 * - PUT    /api/ai/tasks/:id/cancel          - Cancel task
 * - GET    /api/ai/tasks/:id/retry           - Retry failed task
 * - GET    /api/ai/tasks/queue               - Get queue status
 * - POST   /api/ai/tasks/batch               - Batch task creation
 * - GET    /api/ai/tasks/statistics          - Get task statistics
 */

import { Router, Request, Response } from 'express';
import * as aiTaskService from '../services/aiTaskService';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

// ==================== MIDDLEWARE ====================

// All AI task endpoints require authentication
router.use(authMiddleware);

// ==================== CREATE TASK ====================

/**
 * POST /api/ai/tasks
 * Create a new AI task
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, taskType, inputData, priority, estimatedCost, maxRetries, scheduledAt, timeoutMs, workflowStepId } = req.body;

    // Validate required fields
    if (!agentId || !taskType) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields: agentId and taskType'
        }
      });
      return;
    }

    const input = {
      agentId,
      taskType,
      inputData,
      priority,
      estimatedCost,
      maxRetries,
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      timeoutMs,
      workflowStepId
    };

    const task = await aiTaskService.createAITask(input);

    res.status(201).json({
      data: task,
      message: 'Task created successfully'
    });
  } catch (error: any) {
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'TASK_CREATION_FAILED',
        message: error.message || 'Failed to create task'
      }
    });
  }
});

// ==================== BATCH CREATE TASKS ====================

/**
 * POST /api/ai/tasks/batch
 * Create multiple tasks in batch
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Tasks must be a non-empty array'
        }
      });
      return;
    }

    if (tasks.length > 100) {
      res.status(400).json({
        error: {
          code: 'BATCH_TOO_LARGE',
          message: 'Maximum 100 tasks per batch'
        }
      });
      return;
    }

    const result = await aiTaskService.createAITasksBatch(tasks);

    res.status(201).json({
      data: result,
      message: `Batch task creation completed: ${result.summary.successful}/${result.summary.total} successful`
    });
  } catch (error: any) {
    logger.error(`Error creating batch tasks: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'BATCH_CREATION_FAILED',
        message: error.message || 'Failed to create batch tasks'
      }
    });
  }
});

// ==================== LIST TASKS ====================

/**
 * GET /api/ai/tasks
 * List tasks with filtering and pagination
 * Query params: status, priority, agentId, taskType, page, limit, sortBy, sortOrder
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      agentId,
      taskType,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filter: any = {};
    if (status) {
      filter.status = typeof status === 'string' ? status : status;
    }
    if (priority) {
      filter.priority = typeof priority === 'string' ? priority : priority;
    }
    if (agentId) filter.agentId = agentId as string;
    if (taskType) filter.taskType = taskType as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const pagination = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: (sortBy as string) || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await aiTaskService.listAITasks(filter, pagination);

    res.json({
      data: result.tasks,
      pagination: result.pageInfo,
      totalCount: result.totalCount
    });
  } catch (error: any) {
    logger.error(`Error listing tasks: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'LIST_TASKS_FAILED',
        message: error.message || 'Failed to list tasks'
      }
    });
  }
});

// ==================== GET TASK ====================

/**
 * GET /api/ai/tasks/:id
 * Get task details by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Task ID is required'
        }
      });
      return;
    }

    const task = await aiTaskService.getAITask(id);

    if (!task) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task not found: ${id}`
        }
      });
      return;
    }

    res.json({
      data: task
    });
  } catch (error: any) {
    logger.error(`Error getting task ${req.params.id}: ${error.message}`);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'GET_TASK_FAILED',
        message: error.message || 'Failed to get task'
      }
    });
  }
});

// ==================== CANCEL TASK ====================

/**
 * PUT /api/ai/tasks/:id/cancel
 * Cancel a task
 */
router.put('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Task ID is required'
        }
      });
      return;
    }

    const task = await aiTaskService.cancelAITask(id);

    res.json({
      data: task,
      message: 'Task cancelled successfully'
    });
  } catch (error: any) {
    logger.error(`Error cancelling task ${req.params.id}: ${error.message}`);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: error.message
        }
      });
      return;
    }

    if (error.message.includes('Cannot cancel')) {
      res.status(400).json({
        error: {
          code: 'INVALID_OPERATION',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'CANCEL_TASK_FAILED',
        message: error.message || 'Failed to cancel task'
      }
    });
  }
});

// ==================== RETRY TASK ====================

/**
 * GET /api/ai/tasks/:id/retry
 * Retry a failed task
 */
router.get('/:id/retry', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Task ID is required'
        }
      });
      return;
    }

    const task = await aiTaskService.retryAITask(id);

    res.json({
      data: task,
      message: `Task scheduled for retry (attempt ${task.retryCount}/${task.maxRetries})`
    });
  } catch (error: any) {
    logger.error(`Error retrying task ${req.params.id}: ${error.message}`);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: error.message
        }
      });
      return;
    }

    if (error.message.includes('exceeded maximum retries')) {
      res.status(400).json({
        error: {
          code: 'MAX_RETRIES_EXCEEDED',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        code: 'RETRY_TASK_FAILED',
        message: error.message || 'Failed to retry task'
      }
    });
  }
});

// ==================== QUEUE STATUS ====================

/**
 * GET /api/ai/tasks/queue
 * Get current queue status and metrics
 */
router.get('/queue/status', async (req: Request, res: Response) => {
  try {
    const status = await aiTaskService.getTaskQueueStatus();

    res.json({
      data: status
    });
  } catch (error: any) {
    logger.error(`Error getting queue status: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'QUEUE_STATUS_FAILED',
        message: error.message || 'Failed to get queue status'
      }
    });
  }
});

// ==================== TASK STATISTICS ====================

/**
 * GET /api/ai/tasks/statistics
 * Get task statistics and analytics
 * Query params: agentId, taskType, startDate, endDate
 */
router.get('/statistics/summary', async (req: Request, res: Response) => {
  try {
    const { agentId, taskType, startDate, endDate } = req.query;

    const filter: any = {};
    if (agentId) filter.agentId = agentId as string;
    if (taskType) filter.taskType = taskType as string;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);

    const statistics = await aiTaskService.getTaskStatistics(filter);

    res.json({
      data: statistics
    });
  } catch (error: any) {
    logger.error(`Error getting task statistics: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'STATISTICS_FAILED',
        message: error.message || 'Failed to get task statistics'
      }
    });
  }
});

// ==================== ADMIN-ONLY ENDPOINTS ====================

/**
 * POST /api/ai/tasks/cleanup
 * Clean up old completed tasks (Admin only)
 */
router.post('/cleanup/old', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const count = await aiTaskService.cleanupOldTasks();

    res.json({
      data: { deletedCount: count },
      message: `Cleaned up ${count} old tasks`
    });
  } catch (error: any) {
    logger.error(`Error cleaning up tasks: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'CLEANUP_FAILED',
        message: error.message || 'Failed to clean up tasks'
      }
    });
  }
});

/**
 * POST /api/ai/tasks/timeout-stale
 * Timeout stale processing tasks (Admin only)
 */
router.post('/cleanup/timeout-stale', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { timeoutMs } = req.body;
    const count = await aiTaskService.timeoutStaleTasks(timeoutMs);

    res.json({
      data: { timedOutCount: count },
      message: `Timed out ${count} stale tasks`
    });
  } catch (error: any) {
    logger.error(`Error timing out stale tasks: ${error.message}`);
    res.status(500).json({
      error: {
        code: 'TIMEOUT_FAILED',
        message: error.message || 'Failed to timeout stale tasks'
      }
    });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/ai/tasks/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = await aiTaskService.getTaskQueueStatus();
    
    const isHealthy = status.queueHealth === 'healthy';
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      queueHealth: status.queueHealth,
      metrics: {
        queuedTasks: status.queuedTasks,
        processingTasks: status.processingTasks,
        averageWaitTime: status.averageWaitTime
      }
    });
  } catch (error: any) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
