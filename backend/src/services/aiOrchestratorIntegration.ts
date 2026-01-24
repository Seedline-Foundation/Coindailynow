/**
 * AI Orchestrator Database Integration
 * Connects the existing AI Orchestrator (check/ai-system) with Prisma database
 * 
 * Purpose:
 * - Register all agents in database on startup
 * - Persist task execution data
 * - Track workflow progress in database
 * - Enable database queries for AI operations
 */

import { PrismaClient } from '@prisma/client';
import { registerAgentOnStartup, updateAgentMetrics, logAIOperation } from './aiAgentService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// ==================== AGENT REGISTRATION ====================

/**
 * Register all AI agents from orchestrator on startup
 * Call this when the application starts to sync agents with database
 */
export async function registerAllAgentsOnStartup() {
  try {
    logger.info('Registering AI agents in database...');

    // Define all agents from the AI system
    const agents = [
      {
        id: 'content-generation-agent',
        name: 'Content Generation Agent',
        type: 'content_generation',
        modelProvider: 'openai',
        modelName: 'gpt-4-turbo',
        configuration: {
          temperature: 0.7,
          maxTokens: 4000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
        isActive: true,
      },
      {
        id: 'market-analysis-agent',
        name: 'Market Analysis Agent',
        type: 'market_analysis',
        modelProvider: 'grok',
        modelName: 'grok-beta',
        configuration: {
          temperature: 0.5,
          maxTokens: 2000,
          includeAfricanMarkets: true,
        },
        isActive: true,
      },
      {
        id: 'translation-agent',
        name: 'Translation Agent',
        type: 'translation',
        modelProvider: 'meta',
        modelName: 'nllb-200-3.3B',
        configuration: {
          supportedLanguages: [
            'en', 'sw', 'am', 'ha', 'ig', 'yo', 'zu', 'xh',
            'sn', 'st', 'ts', 'tn', 'ss', 've', 'nr',
          ],
          defaultSourceLanguage: 'en',
        },
        isActive: true,
      },
      {
        id: 'image-generation-agent',
        name: 'Image Generation Agent',
        type: 'image_generation',
        modelProvider: 'openai',
        modelName: 'dall-e-3',
        configuration: {
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid',
        },
        isActive: true,
      },
      {
        id: 'quality-review-agent',
        name: 'Quality Review Agent',
        type: 'quality_review',
        modelProvider: 'google',
        modelName: 'gemini-pro',
        configuration: {
          temperature: 0.3,
          topP: 0.95,
          qualityThreshold: 0.7,
        },
        isActive: true,
      },
      {
        id: 'sentiment-analysis-agent',
        name: 'Sentiment Analysis Agent',
        type: 'sentiment_analysis',
        modelProvider: 'openai',
        modelName: 'gpt-4-turbo',
        configuration: {
          temperature: 0.2,
          maxTokens: 500,
        },
        isActive: true,
      },
    ];

    const registeredAgents = [];
    
    for (const agentData of agents) {
      try {
        const agent = await registerAgentOnStartup(agentData);
        registeredAgents.push(agent);
        logger.info(`✓ Registered: ${agent.name}`);
      } catch (error) {
        logger.error(`✗ Failed to register ${agentData.name}:`, error);
      }
    }

    logger.info(`Successfully registered ${registeredAgents.length}/${agents.length} agents`);
    
    return registeredAgents;
  } catch (error) {
    logger.error('Error in bulk agent registration:', error);
    throw error;
  }
}

// ==================== TASK PERSISTENCE ====================

/**
 * Create AI task in database
 */
export async function createAITask(taskData: {
  id: string;
  agentId: string;
  taskType: string;
  inputData: any;
  priority?: string;
  estimatedCost: number;
  workflowStepId?: string;
}) {
  try {
    const task = await prisma.aITask.create({
      data: {
        id: taskData.id,
        agentId: taskData.agentId,
        taskType: taskData.taskType,
        inputData: JSON.stringify(taskData.inputData),
        status: 'QUEUED',
        priority: taskData.priority || 'NORMAL',
        estimatedCost: taskData.estimatedCost,
        workflowStepId: taskData.workflowStepId || null,
        createdAt: new Date(),
      },
    });

    logger.debug(`Task created: ${task.id}`);
    return task;
  } catch (error) {
    logger.error('Error creating AI task:', error);
    throw error;
  }
}

/**
 * Update AI task status and results
 */
export async function updateAITaskStatus(
  taskId: string,
  status: string,
  data?: {
    outputData?: any;
    actualCost?: number;
    processingTimeMs?: number;
    qualityScore?: number;
    errorMessage?: string;
  }
) {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'PROCESSING') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    if (data?.outputData) {
      updateData.outputData = JSON.stringify(data.outputData);
    }
    if (data?.actualCost !== undefined) {
      updateData.actualCost = data.actualCost;
    }
    if (data?.processingTimeMs !== undefined) {
      updateData.processingTimeMs = data.processingTimeMs;
    }
    if (data?.qualityScore !== undefined) {
      updateData.qualityScore = data.qualityScore;
    }
    if (data?.errorMessage) {
      updateData.errorMessage = data.errorMessage;
    }

    const task = await prisma.aITask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update agent metrics
    if (status === 'COMPLETED' || status === 'FAILED') {
      await updateAgentMetricsFromTask(task);
    }

    logger.debug(`Task updated: ${taskId} -> ${status}`);
    return task;
  } catch (error) {
    logger.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Update agent metrics based on task completion
 */
async function updateAgentMetricsFromTask(task: any) {
  try {
    // Get current agent metrics
    const agent = await prisma.aIAgent.findUnique({
      where: { id: task.agentId },
    });

    if (!agent) return;

    const metrics = agent.performanceMetrics
      ? JSON.parse(agent.performanceMetrics)
      : {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          averageResponseTime: 0,
          successRate: 0,
          totalCost: 0,
          averageCost: 0,
        };

    // Update metrics
    metrics.totalTasks += 1;
    
    if (task.status === 'COMPLETED') {
      metrics.successfulTasks += 1;
    } else if (task.status === 'FAILED') {
      metrics.failedTasks += 1;
    }

    metrics.successRate = (metrics.successfulTasks / metrics.totalTasks) * 100;

    if (task.processingTimeMs) {
      metrics.averageResponseTime =
        (metrics.averageResponseTime * (metrics.totalTasks - 1) + task.processingTimeMs) /
        metrics.totalTasks;
      metrics.lastExecutionTime = task.processingTimeMs;
    }

    if (task.actualCost) {
      metrics.totalCost += task.actualCost;
      metrics.averageCost = metrics.totalCost / metrics.totalTasks;
    }

    // Save updated metrics
    await updateAgentMetrics(task.agentId, metrics);
  } catch (error) {
    logger.error('Error updating agent metrics from task:', error);
  }
}

// ==================== WORKFLOW INTEGRATION ====================

/**
 * Create content workflow in database
 */
export async function createContentWorkflow(workflowData: {
  id: string;
  articleId: string;
  initialStage: string;
}) {
  try {
    const workflow = await prisma.contentWorkflow.create({
      data: {
        id: workflowData.id,
        articleId: workflowData.articleId,
        workflowType: 'ARTICLE_PUBLISHING',
        currentState: workflowData.initialStage,
        priority: 'NORMAL',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.debug(`Workflow created: ${workflow.id}`);
    return workflow;
  } catch (error) {
    logger.error('Error creating content workflow:', error);
    throw error;
  }
}

/**
 * Update workflow stage
 */
export async function updateWorkflowStage(
  workflowId: string,
  stage: string,
  data?: {
    status?: string;
    taskId?: string;
    qualityScore?: number;
    humanReviewNotes?: string;
  }
) {
  try {
    // First, get the current workflow to access metadata
    const currentWorkflow = data?.qualityScore !== undefined ? await prisma.contentWorkflow.findUnique({
      where: { id: workflowId },
      select: { metadata: true, currentState: true }
    }) : null;

    const updateData: any = {
      previousState: currentWorkflow?.currentState || null,
      currentState: stage,
      updatedAt: new Date(),
    };

    if (data?.status) {
      updateData.workflowType = data.status;
    }

    // Store task IDs based on stage
    if (data?.taskId) {
      if (stage.includes('research')) {
        updateData.researchTaskId = data.taskId;
      } else if (stage.includes('content')) {
        updateData.contentTaskId = data.taskId;
      } else if (stage.includes('translation')) {
        updateData.translationTaskId = data.taskId;
      }
    }

    // Store quality scores in metadata field
    if (data?.qualityScore !== undefined && currentWorkflow) {
      const metadata = currentWorkflow.metadata 
        ? JSON.parse(currentWorkflow.metadata)
        : {};
      
      metadata.qualityScores = metadata.qualityScores || {};
      metadata.qualityScores[stage] = data.qualityScore;
      updateData.metadata = JSON.stringify(metadata);
    }

    if (data?.humanReviewNotes) {
      updateData.humanReviewNotes = data.humanReviewNotes;
    }

    if (data?.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const workflow = await prisma.contentWorkflow.update({
      where: { id: workflowId },
      data: updateData,
    });

    logger.debug(`Workflow updated: ${workflowId} -> ${stage}`);
    return workflow;
  } catch (error) {
    logger.error(`Error updating workflow ${workflowId}:`, error);
    throw error;
  }
}

// ==================== TRANSACTION SUPPORT ====================

/**
 * Execute multiple operations in a transaction
 */
export async function executeInTransaction(operations: ((tx: any) => Promise<any>)[]) {
  try {
    const results = await prisma.$transaction(async (tx) => {
      const operationResults = [];
      
      for (const operation of operations) {
        const result = await operation(tx);
        operationResults.push(result);
      }
      
      return operationResults;
    });

    logger.debug('Transaction completed successfully');
    return results;
  } catch (error) {
    logger.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Create workflow with initial task in a transaction
 */
export async function createWorkflowWithTask(
  workflowData: {
    id: string;
    articleId: string;
    initialStage: string;
  },
  taskData: {
    id: string;
    agentId: string;
    taskType: string;
    inputData: any;
    estimatedCost: number;
  }
) {
  return executeInTransaction([
    async (tx: any) => {
      return tx.contentWorkflow.create({
        data: {
          id: workflowData.id,
          articleId: workflowData.articleId,
          currentStage: workflowData.initialStage,
          status: 'in_progress',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },
    async (tx: any) => {
      return tx.aITask.create({
        data: {
          id: taskData.id,
          agentId: taskData.agentId,
          taskType: taskData.taskType,
          inputData: JSON.stringify(taskData.inputData),
          status: 'QUEUED',
          priority: 'NORMAL',
          estimatedCost: taskData.estimatedCost,
          createdAt: new Date(),
        },
      });
    },
  ]);
}

// ==================== CLEANUP & MAINTENANCE ====================

/**
 * Clean up old completed tasks (older than 7 days)
 */
export async function cleanupOldTasks() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.aITask.deleteMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old tasks`);
    return result;
  } catch (error) {
    logger.error('Error cleaning up old tasks:', error);
    throw error;
  }
}

/**
 * Start cleanup task (runs daily)
 */
export function startCleanupTask() {
  // Run cleanup daily at 2 AM
  const runCleanup = async () => {
    const now = new Date();
    if (now.getHours() === 2) {
      await cleanupOldTasks();
    }
  };

  setInterval(runCleanup, 3600000); // Check every hour
  logger.info('Cleanup task scheduled');
}

// ==================== EXPORT ====================

export default {
  registerAllAgentsOnStartup,
  createAITask,
  updateAITaskStatus,
  createContentWorkflow,
  updateWorkflowStage,
  executeInTransaction,
  createWorkflowWithTask,
  cleanupOldTasks,
  startCleanupTask,
};
