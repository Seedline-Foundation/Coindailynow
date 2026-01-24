/**
 * AI Workflow GraphQL Resolvers
 * Handles workflow queries, mutations, and subscriptions
 */

import { PubSub } from 'graphql-subscriptions';
import { aiWorkflowService, workflowEvents, WorkflowState, WorkflowPriority, WorkflowType } from '../services/aiWorkflowService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const pubsub = new PubSub();

// Subscribe to workflow events and publish to GraphQL subscriptions
workflowEvents.on('workflow_created', (workflow) => {
  pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: workflow });
});

workflowEvents.on('workflow_advanced', (data) => {
  pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: data });
});

workflowEvents.on('workflow_rollback', (data) => {
  pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: data });
});

workflowEvents.on('workflow_paused', (data) => {
  pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: data });
});

workflowEvents.on('workflow_resumed', (data) => {
  pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: data });
});

workflowEvents.on('human_review_completed', async (data) => {
  const queue = await aiWorkflowService.getHumanApprovalQueue();
  pubsub.publish('HUMAN_APPROVAL_QUEUE_UPDATED', { humanApprovalQueueUpdated: queue });
});

workflowEvents.on('review_notification', (notification) => {
  pubsub.publish(`WORKFLOW_NOTIFICATION_${notification.reviewerId}`, {
    workflowNotification: notification
  });
});

// ==================== QUERY RESOLVERS ====================

export const workflowQueryResolvers = {
  Query: {
    /**
     * Get workflow by ID
     */
    contentWorkflow: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const workflow = await aiWorkflowService.getWorkflow(id);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Get workflow error:', error);
        throw new Error(`Failed to get workflow: ${error.message}`);
      }
    },

    /**
     * List workflows with filters
     */
    contentWorkflows: async (_: any, { filter }: { filter?: any }, context: any) => {
      try {
        const workflows = await aiWorkflowService.listWorkflows(filter);
        return workflows;
      } catch (error: any) {
        logger.error('[GraphQL] List workflows error:', error);
        throw new Error(`Failed to list workflows: ${error.message}`);
      }
    },

    /**
     * Get human approval queue
     */
    humanApprovalQueue: async (_: any, { priority }: { priority?: WorkflowPriority }, context: any) => {
      try {
        const queue = await aiWorkflowService.getHumanApprovalQueue(priority);
        return queue;
      } catch (error: any) {
        logger.error('[GraphQL] Get human approval queue error:', error);
        throw new Error(`Failed to get human approval queue: ${error.message}`);
      }
    },

    /**
     * Get workflow statistics
     */
    workflowStats: async (_: any, { startDate, endDate }: { startDate?: string; endDate?: string }, context: any) => {
      try {
        const where: any = {};
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate);
          if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [
          totalWorkflows,
          activeWorkflows,
          completedWorkflows,
          failedWorkflows,
          humanApprovalQueue,
          allWorkflows
        ] = await Promise.all([
          prisma.contentWorkflow.count({ where }),
          prisma.contentWorkflow.count({
            where: {
              ...where,
              currentState: {
                in: [
                  WorkflowState.RESEARCH,
                  WorkflowState.RESEARCH_REVIEW,
                  WorkflowState.CONTENT_GENERATION,
                  WorkflowState.CONTENT_REVIEW,
                  WorkflowState.TRANSLATION,
                  WorkflowState.TRANSLATION_REVIEW,
                  WorkflowState.HUMAN_APPROVAL
                ]
              }
            }
          }),
          prisma.contentWorkflow.count({
            where: { ...where, currentState: WorkflowState.PUBLISHED }
          }),
          prisma.contentWorkflow.count({
            where: { ...where, currentState: WorkflowState.FAILED }
          }),
          prisma.contentWorkflow.count({
            where: { ...where, currentState: WorkflowState.HUMAN_APPROVAL }
          }),
          prisma.contentWorkflow.findMany({
            where: {
              ...where,
              actualCompletionAt: { not: null }
            },
            select: {
              createdAt: true,
              actualCompletionAt: true
            }
          })
        ]);

        // Calculate average completion time
        const completionTimes = allWorkflows
          .filter(w => w.actualCompletionAt)
          .map(w => new Date(w.actualCompletionAt!).getTime() - new Date(w.createdAt).getTime());

        const averageCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;

        const successRate = totalWorkflows > 0
          ? (completedWorkflows / totalWorkflows) * 100
          : 0;

        // Get counts by state
        const byStatePromises = Object.values(WorkflowState).map(async (state) => ({
          state,
          count: await prisma.contentWorkflow.count({
            where: { ...where, currentState: state }
          })
        }));

        const byState = await Promise.all(byStatePromises);

        // Get counts by priority
        const byPriorityPromises = Object.values(WorkflowPriority).map(async (priority) => ({
          priority,
          count: await prisma.contentWorkflow.count({
            where: { ...where, priority }
          })
        }));

        const byPriority = await Promise.all(byPriorityPromises);

        return {
          totalWorkflows,
          activeWorkflows,
          completedWorkflows,
          failedWorkflows,
          averageCompletionTime,
          successRate,
          humanApprovalQueueLength: humanApprovalQueue,
          byState: byState.filter(s => s.count > 0),
          byPriority: byPriority.filter(p => p.count > 0)
        };
      } catch (error: any) {
        logger.error('[GraphQL] Get workflow stats error:', error);
        throw new Error(`Failed to get workflow stats: ${error.message}`);
      }
    },

    /**
     * Get workflow by article ID
     */
    workflowByArticleId: async (_: any, { articleId }: { articleId: string }, context: any) => {
      try {
        const workflow = await prisma.contentWorkflow.findUnique({
          where: { articleId },
          include: {
            Article: true,
            User: true,
            WorkflowStep: {
              orderBy: { stepOrder: 'asc' },
              include: {
                AITask: true,
                User: true
              }
            },
            WorkflowTransition: {
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            WorkflowNotification: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        });

        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Get workflow by article ID error:', error);
        throw new Error(`Failed to get workflow: ${error.message}`);
      }
    }
  }
};

// ==================== MUTATION RESOLVERS ====================

export const workflowMutationResolvers = {
  Mutation: {
    /**
     * Create a new content workflow
     */
    createContentWorkflow: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const workflow = await aiWorkflowService.createWorkflow(input);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Create workflow error:', error);
        throw new Error(`Failed to create workflow: ${error.message}`);
      }
    },

    /**
     * Advance workflow to next stage
     */
    advanceWorkflow: async (_: any, { id, qualityScore }: { id: string; qualityScore?: any }, context: any) => {
      try {
        const workflow = await aiWorkflowService.advanceWorkflow(id, qualityScore);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Advance workflow error:', error);
        throw new Error(`Failed to advance workflow: ${error.message}`);
      }
    },

    /**
     * Rollback workflow to previous stage
     */
    rollbackWorkflow: async (_: any, { id, reason }: { id: string; reason?: string }, context: any) => {
      try {
        const workflow = await aiWorkflowService.rollbackWorkflow(id, reason);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Rollback workflow error:', error);
        throw new Error(`Failed to rollback workflow: ${error.message}`);
      }
    },

    /**
     * Pause workflow execution
     */
    pauseWorkflow: async (_: any, { id, reason }: { id: string; reason?: string }, context: any) => {
      try {
        const workflow = await aiWorkflowService.pauseWorkflow(id, reason);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Pause workflow error:', error);
        throw new Error(`Failed to pause workflow: ${error.message}`);
      }
    },

    /**
     * Resume paused workflow
     */
    resumeWorkflow: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const workflow = await aiWorkflowService.resumeWorkflow(id);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Resume workflow error:', error);
        throw new Error(`Failed to resume workflow: ${error.message}`);
      }
    },

    /**
     * Submit workflow for human review
     */
    submitForHumanReview: async (_: any, { id, reviewerId }: { id: string; reviewerId?: string }, context: any) => {
      try {
        const workflow = await aiWorkflowService.submitForHumanReview(id, reviewerId);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Submit for human review error:', error);
        throw new Error(`Failed to submit for human review: ${error.message}`);
      }
    },

    /**
     * Process human review decision
     */
    processHumanReview: async (_: any, { input }: { input: any }, context: any) => {
      try {
        const workflow = await aiWorkflowService.processHumanReview(input);
        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Process human review error:', error);
        throw new Error(`Failed to process human review: ${error.message}`);
      }
    },

    /**
     * Cancel workflow
     */
    cancelWorkflow: async (_: any, { id, reason }: { id: string; reason?: string }, context: any) => {
      try {
        const workflow = await prisma.contentWorkflow.update({
          where: { id },
          data: {
            currentState: WorkflowState.CANCELLED,
            errorMessage: reason || 'Workflow cancelled',
            updatedAt: new Date()
          },
          include: {
            Article: true,
            User: true
          }
        });

        pubsub.publish('WORKFLOW_STATE_CHANGED', { workflowStateChanged: workflow });

        return workflow;
      } catch (error: any) {
        logger.error('[GraphQL] Cancel workflow error:', error);
        throw new Error(`Failed to cancel workflow: ${error.message}`);
      }
    }
  }
};

// ==================== SUBSCRIPTION RESOLVERS ====================

export const workflowSubscriptionResolvers = {
  Subscription: {
    /**
     * Subscribe to workflow state changes
     */
    workflowStateChanged: {
      subscribe: (_: any, { workflowId }: { workflowId?: string }) => {
        if (workflowId) {
          return pubsub.asyncIterator([`WORKFLOW_STATE_CHANGED_${workflowId}`]);
        }
        return pubsub.asyncIterator(['WORKFLOW_STATE_CHANGED']);
      }
    },

    /**
     * Subscribe to human approval queue updates
     */
    humanApprovalQueueUpdated: {
      subscribe: () => pubsub.asyncIterator(['HUMAN_APPROVAL_QUEUE_UPDATED'])
    },

    /**
     * Subscribe to workflow notifications
     */
    workflowNotification: {
      subscribe: (_: any, { userId }: { userId: string }) => {
        return pubsub.asyncIterator([`WORKFLOW_NOTIFICATION_${userId}`]);
      }
    }
  }
};

// ==================== FIELD RESOLVERS ====================

export const workflowFieldResolvers = {
  ContentWorkflow: {
    currentStepConfig: (parent: any) => {
      const WORKFLOW_STEPS: any = {
        [WorkflowState.RESEARCH]: {
          stepName: 'Research Phase',
          agentType: 'RESEARCH_AGENT',
          qualityThreshold: 0.7,
          estimatedDurationMs: 120000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.RESEARCH_REVIEW]: {
          stepName: 'Research Review',
          agentType: 'REVIEW_AGENT',
          qualityThreshold: 0.7,
          estimatedDurationMs: 60000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.CONTENT_GENERATION]: {
          stepName: 'Content Generation',
          agentType: 'CONTENT_GENERATION_AGENT',
          qualityThreshold: 0.75,
          estimatedDurationMs: 180000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.CONTENT_REVIEW]: {
          stepName: 'Content Review',
          agentType: 'REVIEW_AGENT',
          qualityThreshold: 0.75,
          estimatedDurationMs: 90000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.TRANSLATION]: {
          stepName: 'Translation',
          agentType: 'TRANSLATION_AGENT',
          qualityThreshold: 0.7,
          estimatedDurationMs: 300000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.TRANSLATION_REVIEW]: {
          stepName: 'Translation Review',
          agentType: 'REVIEW_AGENT',
          qualityThreshold: 0.7,
          estimatedDurationMs: 120000,
          requiresHumanReview: false,
          autoAdvanceOnPass: true
        },
        [WorkflowState.HUMAN_APPROVAL]: {
          stepName: 'Human Approval',
          agentType: 'HUMAN',
          qualityThreshold: 0.8,
          estimatedDurationMs: 600000,
          requiresHumanReview: true,
          autoAdvanceOnPass: false
        },
        [WorkflowState.PUBLISHED]: {
          stepName: 'Published',
          agentType: 'NONE',
          qualityThreshold: 0,
          estimatedDurationMs: 0,
          requiresHumanReview: false,
          autoAdvanceOnPass: false
        }
      };

      return WORKFLOW_STEPS[parent.currentState] || WORKFLOW_STEPS[WorkflowState.RESEARCH];
    },

    canAdvance: (parent: any) => {
      const terminalStates = [WorkflowState.PUBLISHED, WorkflowState.CANCELLED, WorkflowState.FAILED];
      return !terminalStates.includes(parent.currentState) && parent.currentState !== WorkflowState.PAUSED;
    },

    canRollback: (parent: any) => {
      return parent.previousState && parent.currentState !== WorkflowState.PUBLISHED;
    },

    canPause: (parent: any) => {
      const terminalStates = [WorkflowState.PUBLISHED, WorkflowState.CANCELLED, WorkflowState.FAILED, WorkflowState.PAUSED];
      return !terminalStates.includes(parent.currentState);
    },

    metadata: (parent: any) => {
      return parent.metadata ? JSON.parse(parent.metadata) : null;
    }
  },

  WorkflowStep: {
    output: (parent: any) => {
      return parent.output ? JSON.parse(parent.output) : null;
    }
  },

  WorkflowTransition: {
    metadata: (parent: any) => {
      return parent.metadata ? JSON.parse(parent.metadata) : null;
    }
  },

  WorkflowNotification: {
    metadata: (parent: any) => {
      return parent.metadata ? JSON.parse(parent.metadata) : null;
    }
  }
};

// ==================== COMBINED RESOLVERS ====================

export const workflowResolvers = {
  ...workflowQueryResolvers,
  ...workflowMutationResolvers,
  ...workflowSubscriptionResolvers,
  ...workflowFieldResolvers
};

export default workflowResolvers;
