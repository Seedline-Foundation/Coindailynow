/**
 * AI Task Management Service
 * Handles task creation, scheduling, execution, and lifecycle management
 * 
 * Features:
 * - Task creation and scheduling with priority queuing
 * - Retry logic with exponential backoff
 * - Task cancellation and timeout handling
 * - Automatic cleanup of completed tasks (7-day retention)
 * - Cost tracking and performance metrics
 * - Real-time status updates via WebSocket
 * - Batch task processing
 * 
 * Task Lifecycle: QUEUED → PROCESSING → COMPLETED/FAILED
 */

import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import EventEmitter from 'events';

const prisma = new PrismaClient();

// ==================== TYPES AND INTERFACES ====================

export enum TaskStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT'
}

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

export interface CreateAITaskInput {
  agentId: string;
  taskType: string;
  inputData?: Record<string, any>;
  priority?: TaskPriority;
  estimatedCost?: number;
  maxRetries?: number;
  scheduledAt?: Date;
  timeoutMs?: number;
  workflowStepId?: string;
}

export interface AITaskFilter {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  agentId?: string;
  taskType?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AITaskConnection {
  tasks: any[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}

export interface TaskQueueStatus {
  totalTasks: number;
  queuedTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  queueHealth: 'healthy' | 'warning' | 'critical';
}

export interface BatchCreateResult {
  created: any[];
  failed: Array<{ input: CreateAITaskInput; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ==================== EVENT EMITTER FOR WEBSOCKET ====================

export class TaskEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(1000); // Support many concurrent listeners
  }

  emitTaskStatusChanged(taskId: string, task: any) {
    this.emit('taskStatusChanged', { taskId, task });
    logger.debug(`Task status changed event emitted: ${taskId} -> ${task.status}`);
  }

  emitTaskQueueUpdated(status: TaskQueueStatus) {
    this.emit('taskQueueUpdated', status);
    logger.debug('Task queue updated event emitted');
  }

  emitTaskFailed(task: any) {
    this.emit('taskFailed', task);
    logger.warn(`Task failed event emitted: ${task.id}`);
  }
}

export const taskEventEmitter = new TaskEventEmitter();

// ==================== CACHING CONSTANTS ====================

const CACHE_TTL = {
  TASK: 60, // 1 minute
  TASK_LIST: 30, // 30 seconds
  QUEUE_STATUS: 5, // 5 seconds
};

const CACHE_KEYS = {
  TASK: (id: string) => `ai:task:${id}`,
  TASK_LIST: (filter: string) => `ai:tasks:list:${filter}`,
  QUEUE_STATUS: 'ai:tasks:queue:status',
  PRIORITY_QUEUE: (priority: string) => `ai:tasks:queue:${priority}`,
};

// ==================== TASK CREATION ====================

/**
 * Create a new AI task
 * @param input - Task creation data
 * @returns Created task with ID
 */
export async function createAITask(input: CreateAITaskInput) {
  try {
    logger.info(`Creating AI task: ${input.taskType} for agent ${input.agentId}`);

    // Validate input
    if (!input.agentId || !input.taskType) {
      throw new Error('Missing required task fields: agentId and taskType');
    }

    // Verify agent exists and is active
    const agent = await prisma.aIAgent.findUnique({
      where: { id: input.agentId }
    });

    if (!agent) {
      throw new Error(`Agent not found: ${input.agentId}`);
    }

    if (!agent.isActive) {
      throw new Error(`Agent is not active: ${input.agentId}`);
    }

    // Generate task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create task in database
    const task = await prisma.aITask.create({
      data: {
        id: taskId,
        agentId: input.agentId,
        taskType: input.taskType,
        inputData: input.inputData ? JSON.stringify(input.inputData) : null,
        status: TaskStatus.QUEUED,
        priority: input.priority || TaskPriority.NORMAL,
        estimatedCost: input.estimatedCost || 0,
        maxRetries: input.maxRetries || 3,
        retryCount: 0,
        scheduledAt: input.scheduledAt || new Date(),
        workflowStepId: input.workflowStepId || null,
      },
      include: {
        AIAgent: true
      }
    });

    // Add to priority queue in Redis
    await addToQueue(task);

    // Cache the task
    await redisClient.setEx(
      CACHE_KEYS.TASK(taskId),
      CACHE_TTL.TASK,
      JSON.stringify(task)
    );

    // Invalidate queue status cache
    await redisClient.del(CACHE_KEYS.QUEUE_STATUS);

    logger.info(`Task created successfully: ${taskId}`);

    // Emit event for real-time updates
    taskEventEmitter.emitTaskStatusChanged(taskId, task);

    return task;
  } catch (error) {
    logger.error(`Error creating AI task: ${error}`);
    throw error;
  }
}

/**
 * Create multiple tasks in batch
 * @param inputs - Array of task creation inputs
 * @returns Batch creation results
 */
export async function createAITasksBatch(inputs: CreateAITaskInput[]): Promise<BatchCreateResult> {
  const created: any[] = [];
  const failed: Array<{ input: CreateAITaskInput; error: string }> = [];

  logger.info(`Creating batch of ${inputs.length} AI tasks`);

  for (const input of inputs) {
    try {
      const task = await createAITask(input);
      created.push(task);
    } catch (error: any) {
      failed.push({
        input,
        error: error.message || 'Unknown error'
      });
    }
  }

  const summary = {
    total: inputs.length,
    successful: created.length,
    failed: failed.length
  };

  logger.info(`Batch task creation completed: ${summary.successful}/${summary.total} successful`);

  return { created, failed, summary };
}

// ==================== TASK RETRIEVAL ====================

/**
 * Get task by ID
 * @param id - Task ID
 * @returns Task with agent details
 */
export async function getAITask(id: string) {
  try {
    // Check cache first
    const cached = await redisClient.get(CACHE_KEYS.TASK(id));
    if (cached) {
      logger.debug(`Task ${id} retrieved from cache`);
      return JSON.parse(cached);
    }

    // Fetch from database
    const task = await prisma.aITask.findUnique({
      where: { id },
      include: {
        AIAgent: true,
        WorkflowStep: true
      }
    });

    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Parse JSON fields
    const parsedTask = {
      ...task,
      inputData: task.inputData ? JSON.parse(task.inputData) : null,
      outputData: task.outputData ? JSON.parse(task.outputData) : null,
    };

    // Cache the task
    await redisClient.setEx(
      CACHE_KEYS.TASK(id),
      CACHE_TTL.TASK,
      JSON.stringify(parsedTask)
    );

    return parsedTask;
  } catch (error) {
    logger.error(`Error getting AI task ${id}: ${error}`);
    throw error;
  }
}

/**
 * List tasks with filtering and pagination
 * @param filter - Task filter criteria
 * @param pagination - Pagination options
 * @returns Paginated task list
 */
export async function listAITasks(
  filter: AITaskFilter = {},
  pagination: PaginationInput = {}
): Promise<AITaskConnection> {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filter.status) {
      where.status = Array.isArray(filter.status) 
        ? { in: filter.status } 
        : filter.status;
    }

    if (filter.priority) {
      where.priority = Array.isArray(filter.priority)
        ? { in: filter.priority }
        : filter.priority;
    }

    if (filter.agentId) {
      where.agentId = filter.agentId;
    }

    if (filter.taskType) {
      where.taskType = filter.taskType;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    // Check cache
    const cacheKey = CACHE_KEYS.TASK_LIST(JSON.stringify({ filter, pagination }));
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug('Task list retrieved from cache');
      return JSON.parse(cached);
    }

    // Fetch tasks and count
    const [tasks, totalCount] = await Promise.all([
      prisma.aITask.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          AIAgent: true,
          WorkflowStep: true
        }
      }),
      prisma.aITask.count({ where })
    ]);

    // Parse JSON fields
    const parsedTasks = tasks.map(task => ({
      ...task,
      inputData: task.inputData ? JSON.parse(task.inputData) : null,
      outputData: task.outputData ? JSON.parse(task.outputData) : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const result: AITaskConnection = {
      tasks: parsedTasks,
      totalCount,
      pageInfo: {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages
      }
    };

    // Cache the result
    await redisClient.setEx(
      cacheKey,
      CACHE_TTL.TASK_LIST,
      JSON.stringify(result)
    );

    return result;
  } catch (error) {
    logger.error(`Error listing AI tasks: ${error}`);
    throw error;
  }
}

// ==================== TASK STATUS MANAGEMENT ====================

/**
 * Update task status
 * @param id - Task ID
 * @param status - New status
 * @param additionalData - Additional data to update
 * @returns Updated task
 */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  additionalData: Record<string, any> = {}
) {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      ...additionalData
    };

    // Set timestamps based on status
    if (status === TaskStatus.PROCESSING && !additionalData.startedAt) {
      updateData.startedAt = new Date();
    }

    if ([TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED, TaskStatus.TIMEOUT].includes(status)) {
      updateData.completedAt = new Date();
    }

    const task = await prisma.aITask.update({
      where: { id },
      data: updateData,
      include: {
        AIAgent: true,
        WorkflowStep: true
      }
    });

    // Update cache
    await redisClient.setEx(
      CACHE_KEYS.TASK(id),
      CACHE_TTL.TASK,
      JSON.stringify(task)
    );

    // Invalidate list cache
    await redisClient.del(CACHE_KEYS.QUEUE_STATUS);

    logger.info(`Task ${id} status updated to ${status}`);

    // Emit event for real-time updates
    taskEventEmitter.emitTaskStatusChanged(id, task);

    // Emit failed event if applicable
    if (status === TaskStatus.FAILED) {
      taskEventEmitter.emitTaskFailed(task);
    }

    return task;
  } catch (error) {
    logger.error(`Error updating task status for ${id}: ${error}`);
    throw error;
  }
}

/**
 * Start task processing
 * @param id - Task ID
 * @returns Updated task
 */
export async function startTaskProcessing(id: string) {
  return updateTaskStatus(id, TaskStatus.PROCESSING, {
    startedAt: new Date()
  });
}

/**
 * Complete task successfully
 * @param id - Task ID
 * @param outputData - Task output data
 * @param metrics - Processing metrics
 * @returns Updated task
 */
export async function completeTask(
  id: string,
  outputData: Record<string, any>,
  metrics: {
    actualCost?: number;
    processingTimeMs?: number;
    qualityScore?: number;
  }
) {
  return updateTaskStatus(id, TaskStatus.COMPLETED, {
    outputData: JSON.stringify(outputData),
    actualCost: metrics.actualCost,
    processingTimeMs: metrics.processingTimeMs,
    qualityScore: metrics.qualityScore,
    completedAt: new Date()
  });
}

/**
 * Mark task as failed
 * @param id - Task ID
 * @param errorMessage - Error message
 * @returns Updated task
 */
export async function failTask(id: string, errorMessage: string) {
  const task = await prisma.aITask.findUnique({ where: { id } });
  
  if (!task) {
    throw new Error(`Task not found: ${id}`);
  }

  // Check if should retry
  if (task.retryCount < task.maxRetries) {
    logger.info(`Task ${id} will be retried (${task.retryCount + 1}/${task.maxRetries})`);
    return retryAITask(id);
  }

  // Mark as failed permanently
  return updateTaskStatus(id, TaskStatus.FAILED, {
    errorMessage,
    completedAt: new Date()
  });
}

// ==================== TASK CANCELLATION ====================

/**
 * Cancel a task
 * @param id - Task ID
 * @returns Cancelled task
 */
export async function cancelAITask(id: string) {
  try {
    const task = await prisma.aITask.findUnique({ where: { id } });

    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    if ([TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED].includes(task.status as TaskStatus)) {
      throw new Error(`Cannot cancel task in ${task.status} status`);
    }

    logger.info(`Cancelling task: ${id}`);

    const cancelledTask = await updateTaskStatus(id, TaskStatus.CANCELLED, {
      errorMessage: 'Task cancelled by user',
      completedAt: new Date()
    });

    // Remove from queue if queued
    if (task.status === TaskStatus.QUEUED) {
      await removeFromQueue(task);
    }

    return cancelledTask;
  } catch (error) {
    logger.error(`Error cancelling task ${id}: ${error}`);
    throw error;
  }
}

// ==================== TASK RETRY ====================

/**
 * Retry a failed task
 * @param id - Task ID
 * @returns Retried task
 */
export async function retryAITask(id: string) {
  try {
    const task = await prisma.aITask.findUnique({ where: { id } });

    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    if (task.retryCount >= task.maxRetries) {
      throw new Error(`Task has exceeded maximum retries (${task.maxRetries})`);
    }

    logger.info(`Retrying task: ${id} (attempt ${task.retryCount + 1}/${task.maxRetries})`);

    // Calculate exponential backoff delay
    const backoffMs = Math.min(1000 * Math.pow(2, task.retryCount), 30000); // Max 30 seconds
    const scheduledAt = new Date(Date.now() + backoffMs);

    const retriedTask = await prisma.aITask.update({
      where: { id },
      data: {
        status: TaskStatus.QUEUED,
        retryCount: task.retryCount + 1,
        errorMessage: null,
        scheduledAt,
        startedAt: null,
        completedAt: null
      },
      include: {
        AIAgent: true,
        WorkflowStep: true
      }
    });

    // Re-add to queue
    await addToQueue(retriedTask);

    // Update cache
    await redisClient.setEx(
      CACHE_KEYS.TASK(id),
      CACHE_TTL.TASK,
      JSON.stringify(retriedTask)
    );

    logger.info(`Task ${id} scheduled for retry at ${scheduledAt.toISOString()}`);

    // Emit event
    taskEventEmitter.emitTaskStatusChanged(id, retriedTask);

    return retriedTask;
  } catch (error) {
    logger.error(`Error retrying task ${id}: ${error}`);
    throw error;
  }
}

// ==================== QUEUE MANAGEMENT ====================

/**
 * Add task to priority queue
 * @param task - Task to add
 */
async function addToQueue(task: any) {
  try {
    const queueKey = CACHE_KEYS.PRIORITY_QUEUE(task.priority);
    const score = task.scheduledAt ? new Date(task.scheduledAt).getTime() : Date.now();

    await redisClient.zAdd(queueKey, {
      score,
      value: task.id
    });

    logger.debug(`Task ${task.id} added to ${task.priority} priority queue`);
  } catch (error) {
    logger.error(`Error adding task to queue: ${error}`);
    throw error;
  }
}

/**
 * Remove task from queue
 * @param task - Task to remove
 */
async function removeFromQueue(task: any) {
  try {
    const queueKey = CACHE_KEYS.PRIORITY_QUEUE(task.priority);
    await redisClient.zRem(queueKey, task.id);
    logger.debug(`Task ${task.id} removed from ${task.priority} priority queue`);
  } catch (error) {
    logger.error(`Error removing task from queue: ${error}`);
    throw error;
  }
}

/**
 * Get next task from queue based on priority
 * @returns Next task to process or null
 */
export async function getNextTaskFromQueue(): Promise<any | null> {
  try {
    // Check queues in priority order
    const priorities = [TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.NORMAL, TaskPriority.LOW];

    for (const priority of priorities) {
      const queueKey = CACHE_KEYS.PRIORITY_QUEUE(priority);
      const now = Date.now();

      // Get tasks scheduled for now or earlier
      const taskIds = await redisClient.zRangeByScore(queueKey, 0, now, { LIMIT: { offset: 0, count: 1 } });

      if (taskIds.length > 0) {
        const taskId = taskIds[0];
        
        // Type guard to ensure taskId is defined
        if (!taskId) continue;
        
        // Remove from queue
        await redisClient.zRem(queueKey, taskId);

        // Get task details
        const task = await getAITask(taskId);

        // Verify it's still queued
        if (task.status === TaskStatus.QUEUED) {
          logger.info(`Retrieved task ${taskId} from ${priority} priority queue`);
          return task;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error getting next task from queue: ${error}`);
    return null;
  }
}

/**
 * Get queue status and metrics
 * @returns Queue status
 */
export async function getTaskQueueStatus(): Promise<TaskQueueStatus> {
  try {
    // Check cache first
    const cached = await redisClient.get(CACHE_KEYS.QUEUE_STATUS);
    if (cached) {
      logger.debug('Queue status retrieved from cache');
      return JSON.parse(cached);
    }

    // Get counts by status
    const [totalTasks, queuedTasks, processingTasks, completedTasks, failedTasks] = await Promise.all([
      prisma.aITask.count(),
      prisma.aITask.count({ where: { status: TaskStatus.QUEUED } }),
      prisma.aITask.count({ where: { status: TaskStatus.PROCESSING } }),
      prisma.aITask.count({ where: { status: TaskStatus.COMPLETED } }),
      prisma.aITask.count({ where: { status: TaskStatus.FAILED } })
    ]);

    // Calculate average times
    const recentTasks = await prisma.aITask.findMany({
      where: {
        completedAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
      },
      select: {
        createdAt: true,
        startedAt: true,
        completedAt: true,
        processingTimeMs: true
      }
    });

    let averageWaitTime = 0;
    let averageProcessingTime = 0;

    if (recentTasks.length > 0) {
      const waitTimes = recentTasks
        .filter(t => t.startedAt)
        .map(t => new Date(t.startedAt!).getTime() - new Date(t.createdAt).getTime());

      const processingTimes = recentTasks
        .filter(t => t.processingTimeMs)
        .map(t => t.processingTimeMs!);

      averageWaitTime = waitTimes.length > 0
        ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
        : 0;

      averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;
    }

    // Determine queue health
    let queueHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (queuedTasks > 500 || processingTasks > 100) {
      queueHealth = 'warning';
    }
    
    if (queuedTasks > 1000 || processingTasks > 200 || (failedTasks / Math.max(totalTasks, 1)) > 0.1) {
      queueHealth = 'critical';
    }

    const status: TaskQueueStatus = {
      totalTasks,
      queuedTasks,
      processingTasks,
      completedTasks,
      failedTasks,
      averageWaitTime: Math.round(averageWaitTime),
      averageProcessingTime: Math.round(averageProcessingTime),
      queueHealth
    };

    // Cache the status
    await redisClient.setEx(
      CACHE_KEYS.QUEUE_STATUS,
      CACHE_TTL.QUEUE_STATUS,
      JSON.stringify(status)
    );

    return status;
  } catch (error) {
    logger.error(`Error getting queue status: ${error}`);
    throw error;
  }
}

// ==================== TASK CLEANUP ====================

/**
 * Clean up old completed tasks (7-day retention)
 * Should be run as a scheduled job
 */
export async function cleanupOldTasks(): Promise<number> {
  try {
    const retentionDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const result = await prisma.aITask.deleteMany({
      where: {
        status: { in: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        completedAt: { lt: retentionDate }
      }
    });

    logger.info(`Cleaned up ${result.count} old tasks`);

    // Invalidate caches
    await redisClient.del(CACHE_KEYS.QUEUE_STATUS);

    return result.count;
  } catch (error) {
    logger.error(`Error cleaning up old tasks: ${error}`);
    throw error;
  }
}

/**
 * Timeout stale processing tasks
 * Tasks that have been processing for too long (default: 1 hour)
 */
export async function timeoutStaleTasks(timeoutMs: number = 3600000): Promise<number> {
  try {
    const timeoutDate = new Date(Date.now() - timeoutMs);

    const staleTasks = await prisma.aITask.findMany({
      where: {
        status: TaskStatus.PROCESSING,
        startedAt: { lt: timeoutDate }
      }
    });

    let count = 0;
    for (const task of staleTasks) {
      await updateTaskStatus(task.id, TaskStatus.TIMEOUT, {
        errorMessage: `Task timed out after ${timeoutMs}ms`,
        completedAt: new Date()
      });
      count++;
    }

    if (count > 0) {
      logger.warn(`Timed out ${count} stale tasks`);
    }

    return count;
  } catch (error) {
    logger.error(`Error timing out stale tasks: ${error}`);
    throw error;
  }
}

// ==================== ANALYTICS & REPORTING ====================

/**
 * Get task statistics for reporting
 */
export async function getTaskStatistics(filter: AITaskFilter = {}) {
  try {
    const where: any = {};

    if (filter.agentId) where.agentId = filter.agentId;
    if (filter.taskType) where.taskType = filter.taskType;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [totalTasks, completedTasks, failedTasks, cancelledTasks] = await Promise.all([
      prisma.aITask.count({ where }),
      prisma.aITask.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
      prisma.aITask.count({ where: { ...where, status: TaskStatus.FAILED } }),
      prisma.aITask.count({ where: { ...where, status: TaskStatus.CANCELLED } })
    ]);

    const tasks = await prisma.aITask.findMany({
      where: {
        ...where,
        completedAt: { not: null }
      },
      select: {
        actualCost: true,
        processingTimeMs: true,
        qualityScore: true,
        estimatedCost: true
      }
    });

    const totalCost = tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);
    const averageCost = tasks.length > 0 ? totalCost / tasks.length : 0;
    
    const totalProcessingTime = tasks.reduce((sum, t) => sum + (t.processingTimeMs || 0), 0);
    const averageProcessingTime = tasks.length > 0 ? totalProcessingTime / tasks.length : 0;
    
    const qualityScores = tasks.filter(t => t.qualityScore !== null).map(t => t.qualityScore!);
    const averageQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      cancelledTasks,
      successRate: Math.round(successRate * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
      averageProcessingTime: Math.round(averageProcessingTime),
      averageQuality: Math.round(averageQuality * 100) / 100
    };
  } catch (error) {
    logger.error(`Error getting task statistics: ${error}`);
    throw error;
  }
}

// ==================== EXPORTS ====================

export default {
  // Task creation
  createAITask,
  createAITasksBatch,

  // Task retrieval
  getAITask,
  listAITasks,

  // Task status management
  updateTaskStatus,
  startTaskProcessing,
  completeTask,
  failTask,

  // Task control
  cancelAITask,
  retryAITask,

  // Queue management
  getNextTaskFromQueue,
  getTaskQueueStatus,

  // Maintenance
  cleanupOldTasks,
  timeoutStaleTasks,

  // Analytics
  getTaskStatistics,

  // Event emitter
  taskEventEmitter
};
