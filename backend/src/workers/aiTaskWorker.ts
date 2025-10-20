/**
 * AI Task Worker
 * Background worker that processes queued AI tasks
 * 
 * Features:
 * - Polls queue for tasks based on priority
 * - Executes tasks via appropriate AI agents
 * - Handles retries with exponential backoff
 * - Manages task timeouts
 * - Updates task status in real-time
 * - Performs periodic maintenance (cleanup, timeout checks)
 */

import * as aiTaskService from '../services/aiTaskService';
import { logger } from '../utils/logger';
import { TaskStatus } from '../services/aiTaskService';

let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;
let maintenanceInterval: NodeJS.Timeout | null = null;

// Worker configuration
const WORKER_CONFIG = {
  pollIntervalMs: 1000, // Poll every 1 second
  concurrentTasks: 10, // Max concurrent tasks
  maintenanceIntervalMs: 3600000, // Run maintenance every hour
  taskTimeoutMs: 3600000, // 1 hour default timeout
};

// Track currently processing tasks
const processingTasks = new Set<string>();

// ==================== WORKER LIFECYCLE ====================

/**
 * Start the AI task worker
 */
export async function startTaskWorker() {
  if (isRunning) {
    logger.warn('Task worker is already running');
    return;
  }

  isRunning = true;
  logger.info('Starting AI task worker...');

  // Start polling for tasks
  workerInterval = setInterval(async () => {
    await processNextTasks();
  }, WORKER_CONFIG.pollIntervalMs);

  // Start maintenance tasks
  maintenanceInterval = setInterval(async () => {
    await runMaintenance();
  }, WORKER_CONFIG.maintenanceIntervalMs);

  // Run initial maintenance
  await runMaintenance();

  logger.info('AI task worker started successfully');
}

/**
 * Stop the AI task worker
 */
export async function stopTaskWorker() {
  if (!isRunning) {
    logger.warn('Task worker is not running');
    return;
  }

  isRunning = false;
  logger.info('Stopping AI task worker...');

  // Stop intervals
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }

  if (maintenanceInterval) {
    clearInterval(maintenanceInterval);
    maintenanceInterval = null;
  }

  // Wait for currently processing tasks to complete
  const maxWaitTime = 30000; // 30 seconds
  const startTime = Date.now();

  while (processingTasks.size > 0 && Date.now() - startTime < maxWaitTime) {
    logger.info(`Waiting for ${processingTasks.size} tasks to complete...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (processingTasks.size > 0) {
    logger.warn(`${processingTasks.size} tasks still processing after timeout`);
  }

  logger.info('AI task worker stopped');
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
  return isRunning;
}

/**
 * Get worker statistics
 */
export function getWorkerStats() {
  return {
    isRunning,
    processingTasksCount: processingTasks.size,
    maxConcurrentTasks: WORKER_CONFIG.concurrentTasks,
    pollIntervalMs: WORKER_CONFIG.pollIntervalMs,
    maintenanceIntervalMs: WORKER_CONFIG.maintenanceIntervalMs
  };
}

// ==================== TASK PROCESSING ====================

/**
 * Process next available tasks from queue
 */
async function processNextTasks() {
  if (!isRunning) return;

  try {
    // Check if we can process more tasks
    const availableSlots = WORKER_CONFIG.concurrentTasks - processingTasks.size;
    
    if (availableSlots <= 0) {
      return; // All slots occupied
    }

    // Get next tasks from queue
    for (let i = 0; i < availableSlots; i++) {
      const task = await aiTaskService.getNextTaskFromQueue();
      
      if (!task) {
        break; // No more tasks available
      }

      // Process task asynchronously
      processTask(task).catch(error => {
        logger.error(`Error processing task ${task.id}: ${error}`);
      });
    }
  } catch (error) {
    logger.error(`Error in processNextTasks: ${error}`);
  }
}

/**
 * Process a single task
 */
async function processTask(task: any) {
  const taskId = task.id;
  
  try {
    // Add to processing set
    processingTasks.add(taskId);
    logger.info(`Processing task ${taskId} (type: ${task.taskType}, priority: ${task.priority})`);

    // Start processing
    await aiTaskService.startTaskProcessing(taskId);

    const startTime = Date.now();

    // Execute task based on type
    // In a real implementation, this would dispatch to the appropriate AI agent
    const result = await executeTask(task);

    const processingTimeMs = Date.now() - startTime;

    // Complete task
    await aiTaskService.completeTask(taskId, result.outputData, {
      actualCost: result.cost || task.estimatedCost,
      processingTimeMs,
      ...(result.qualityScore !== undefined && { qualityScore: result.qualityScore })
    });

    logger.info(`Task ${taskId} completed successfully in ${processingTimeMs}ms`);
  } catch (error: any) {
    logger.error(`Task ${taskId} failed: ${error.message}`);
    
    // Fail task (will trigger retry if retries available)
    await aiTaskService.failTask(taskId, error.message);
  } finally {
    // Remove from processing set
    processingTasks.delete(taskId);
  }
}

/**
 * Execute task based on type
 * This is a placeholder - in production, this would route to actual AI agents
 */
async function executeTask(task: any): Promise<{
  outputData: Record<string, any>;
  cost?: number;
  qualityScore?: number;
}> {
  // Parse input data
  const inputData = typeof task.inputData === 'string' 
    ? JSON.parse(task.inputData) 
    : task.inputData;

  // Simulate task execution
  // In production, this would call the appropriate AI agent
  switch (task.taskType) {
    case 'content_generation':
      return executeContentGeneration(inputData);
    
    case 'translation':
      return executeTranslation(inputData);
    
    case 'market_analysis':
      return executeMarketAnalysis(inputData);
    
    case 'image_generation':
      return executeImageGeneration(inputData);
    
    case 'quality_review':
      return executeQualityReview(inputData);
    
    default:
      throw new Error(`Unknown task type: ${task.taskType}`);
  }
}

// ==================== TASK TYPE HANDLERS ====================
// These are placeholders - in production, these would integrate with actual AI agents

async function executeContentGeneration(inputData: any) {
  // Placeholder for content generation
  logger.debug('Executing content generation task');
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    outputData: {
      title: 'Generated Title',
      content: 'Generated content...',
      keywords: ['crypto', 'bitcoin']
    },
    cost: 0.05,
    qualityScore: 0.85
  };
}

async function executeTranslation(inputData: any) {
  logger.debug('Executing translation task');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    outputData: {
      translatedText: 'Translated text...',
      targetLanguage: inputData.targetLanguage
    },
    cost: 0.02,
    qualityScore: 0.90
  };
}

async function executeMarketAnalysis(inputData: any) {
  logger.debug('Executing market analysis task');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    outputData: {
      sentiment: 'bullish',
      confidence: 0.78,
      insights: ['Market trend positive', 'Volume increasing']
    },
    cost: 0.10,
    qualityScore: 0.82
  };
}

async function executeImageGeneration(inputData: any) {
  logger.debug('Executing image generation task');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return {
    outputData: {
      imageUrl: 'https://example.com/generated-image.png',
      prompt: inputData.prompt
    },
    cost: 0.15,
    qualityScore: 0.88
  };
}

async function executeQualityReview(inputData: any) {
  logger.debug('Executing quality review task');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    outputData: {
      approved: true,
      score: 0.87,
      feedback: 'Content meets quality standards'
    },
    cost: 0.03,
    qualityScore: 0.92
  };
}

// ==================== MAINTENANCE TASKS ====================

/**
 * Run periodic maintenance tasks
 */
async function runMaintenance() {
  logger.info('Running task maintenance...');

  try {
    // Timeout stale tasks
    const timedOutCount = await aiTaskService.timeoutStaleTasks(WORKER_CONFIG.taskTimeoutMs);
    if (timedOutCount > 0) {
      logger.warn(`Timed out ${timedOutCount} stale tasks`);
    }

    // Clean up old tasks
    const deletedCount = await aiTaskService.cleanupOldTasks();
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old tasks`);
    }

    logger.info('Task maintenance completed');
  } catch (error) {
    logger.error(`Error in maintenance: ${error}`);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await stopTaskWorker();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ==================== EXPORTS ====================

export default {
  startTaskWorker,
  stopTaskWorker,
  isWorkerRunning,
  getWorkerStats,
  setupGracefulShutdown
};
