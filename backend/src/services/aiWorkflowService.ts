/**
 * AI Workflow Service
 * Multi-stage workflow orchestration for content creation
 * 
 * Workflow Stages:
 * RESEARCH → RESEARCH_REVIEW → CONTENT_GENERATION → CONTENT_REVIEW → 
 * TRANSLATION → TRANSLATION_REVIEW → HUMAN_APPROVAL → PUBLISHED
 * 
 * Features:
 * - Automatic stage progression based on quality scores
 * - Quality threshold enforcement (reject if score < 0.7)
 * - Human intervention queue management
 * - Task passing between agents with data persistence
 * - Workflow pause/resume capability
 * - Priority-based processing
 * - Automatic translation to 15 African languages
 * - Comprehensive audit trail
 */

import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import EventEmitter from 'events';
import aiTaskService, { TaskPriority } from './aiTaskService';

const prisma = new PrismaClient();

// ==================== TYPES AND ENUMS ====================

export enum WorkflowState {
  RESEARCH = 'RESEARCH',
  RESEARCH_REVIEW = 'RESEARCH_REVIEW',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  CONTENT_REVIEW = 'CONTENT_REVIEW',
  TRANSLATION = 'TRANSLATION',
  TRANSLATION_REVIEW = 'TRANSLATION_REVIEW',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export enum WorkflowPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW'
}

export enum WorkflowType {
  ARTICLE_PUBLISHING = 'ARTICLE_PUBLISHING',
  BREAKING_NEWS = 'BREAKING_NEWS',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  TUTORIAL = 'TUTORIAL'
}

export interface WorkflowQualityScore {
  stage: WorkflowState;
  score: number;
  passed: boolean;
  metrics?: {
    accuracy?: number;
    readability?: number;
    seoScore?: number;
    factualityScore?: number;
    translationQuality?: number;
    [key: string]: any;
  };
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface CreateWorkflowInput {
  articleId: string;
  workflowType?: WorkflowType;
  priority?: WorkflowPriority;
  assignedReviewerId?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStepConfig {
  stepName: string;
  agentType: string;
  qualityThreshold: number;
  estimatedDurationMs: number;
  requiresHumanReview: boolean;
  autoAdvanceOnPass: boolean;
}

export interface HumanReviewInput {
  workflowId: string;
  reviewerId: string;
  approved: boolean;
  feedback?: string;
  requestedChanges?: string[];
}

// ==================== CONSTANTS ====================

const QUALITY_THRESHOLD = 0.7;
const MIN_AUTO_APPROVE_SCORE = 0.85;
const CACHE_TTL = 300; // 5 minutes
const NOTIFICATION_DELAY_MS = 300000; // 5 minutes

// Workflow step configurations
const WORKFLOW_STEPS: Record<WorkflowState, WorkflowStepConfig> = {
  [WorkflowState.RESEARCH]: {
    stepName: 'Research Phase',
    agentType: 'RESEARCH_AGENT',
    qualityThreshold: 0.7,
    estimatedDurationMs: 120000, // 2 minutes
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.RESEARCH_REVIEW]: {
    stepName: 'Research Review',
    agentType: 'REVIEW_AGENT',
    qualityThreshold: 0.7,
    estimatedDurationMs: 60000, // 1 minute
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.CONTENT_GENERATION]: {
    stepName: 'Content Generation',
    agentType: 'CONTENT_GENERATION_AGENT',
    qualityThreshold: 0.75,
    estimatedDurationMs: 180000, // 3 minutes
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.CONTENT_REVIEW]: {
    stepName: 'Content Review',
    agentType: 'REVIEW_AGENT',
    qualityThreshold: 0.75,
    estimatedDurationMs: 90000, // 1.5 minutes
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.TRANSLATION]: {
    stepName: 'Translation',
    agentType: 'TRANSLATION_AGENT',
    qualityThreshold: 0.7,
    estimatedDurationMs: 300000, // 5 minutes (15 languages)
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.TRANSLATION_REVIEW]: {
    stepName: 'Translation Review',
    agentType: 'REVIEW_AGENT',
    qualityThreshold: 0.7,
    estimatedDurationMs: 120000, // 2 minutes
    requiresHumanReview: false,
    autoAdvanceOnPass: true
  },
  [WorkflowState.HUMAN_APPROVAL]: {
    stepName: 'Human Approval',
    agentType: 'HUMAN',
    qualityThreshold: 0.8,
    estimatedDurationMs: 600000, // 10 minutes
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
  },
  [WorkflowState.FAILED]: {
    stepName: 'Failed',
    agentType: 'NONE',
    qualityThreshold: 0,
    estimatedDurationMs: 0,
    requiresHumanReview: false,
    autoAdvanceOnPass: false
  },
  [WorkflowState.PAUSED]: {
    stepName: 'Paused',
    agentType: 'NONE',
    qualityThreshold: 0,
    estimatedDurationMs: 0,
    requiresHumanReview: false,
    autoAdvanceOnPass: false
  },
  [WorkflowState.CANCELLED]: {
    stepName: 'Cancelled',
    agentType: 'NONE',
    qualityThreshold: 0,
    estimatedDurationMs: 0,
    requiresHumanReview: false,
    autoAdvanceOnPass: false
  }
};

// State transition map
const STATE_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.RESEARCH]: [WorkflowState.RESEARCH_REVIEW, WorkflowState.FAILED, WorkflowState.PAUSED],
  [WorkflowState.RESEARCH_REVIEW]: [WorkflowState.CONTENT_GENERATION, WorkflowState.RESEARCH, WorkflowState.FAILED],
  [WorkflowState.CONTENT_GENERATION]: [WorkflowState.CONTENT_REVIEW, WorkflowState.FAILED, WorkflowState.PAUSED],
  [WorkflowState.CONTENT_REVIEW]: [WorkflowState.TRANSLATION, WorkflowState.CONTENT_GENERATION, WorkflowState.FAILED],
  [WorkflowState.TRANSLATION]: [WorkflowState.TRANSLATION_REVIEW, WorkflowState.FAILED, WorkflowState.PAUSED],
  [WorkflowState.TRANSLATION_REVIEW]: [WorkflowState.HUMAN_APPROVAL, WorkflowState.TRANSLATION, WorkflowState.FAILED],
  [WorkflowState.HUMAN_APPROVAL]: [WorkflowState.PUBLISHED, WorkflowState.CONTENT_GENERATION, WorkflowState.FAILED],
  [WorkflowState.PUBLISHED]: [],
  [WorkflowState.FAILED]: [WorkflowState.RESEARCH], // Can restart from beginning
  [WorkflowState.PAUSED]: [], // Can resume to any previous state
  [WorkflowState.CANCELLED]: []
};

// 15 African Languages for translation
const AFRICAN_LANGUAGES = [
  'sw', // Swahili
  'ha', // Hausa
  'yo', // Yoruba
  'ig', // Igbo
  'am', // Amharic
  'zu', // Zulu
  'xh', // Xhosa
  'sn', // Shona
  'rw', // Kinyarwanda
  'lg', // Luganda
  'wo', // Wolof
  'ff', // Fulah
  'ts', // Tsonga
  'st', // Sotho
  'tn'  // Tswana
];

// ==================== EVENT EMITTER ====================

export const workflowEvents = new EventEmitter();

// ==================== MAIN SERVICE CLASS ====================

class AIWorkflowService {
  
  /**
   * Create a new content workflow
   */
  async createWorkflow(input: CreateWorkflowInput): Promise<any> {
    try {
      // Validate article exists
      const article = await prisma.article.findUnique({
        where: { id: input.articleId }
      });

      if (!article) {
        throw new Error(`Article not found: ${input.articleId}`);
      }

      // Check if workflow already exists
      const existingWorkflow = await prisma.contentWorkflow.findUnique({
        where: { articleId: input.articleId }
      });

      if (existingWorkflow) {
        throw new Error(`Workflow already exists for article: ${input.articleId}`);
      }

      const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const workflow = await prisma.contentWorkflow.create({
        data: {
          id: workflowId,
          articleId: input.articleId,
          workflowType: input.workflowType || WorkflowType.ARTICLE_PUBLISHING,
          currentState: WorkflowState.RESEARCH,
          priority: input.priority || WorkflowPriority.NORMAL,
          assignedReviewerId: input.assignedReviewerId || null,
          completionPercentage: 0,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          estimatedCompletionAt: this.calculateEstimatedCompletion(),
          updatedAt: new Date()
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Create initial workflow step
      await this.createWorkflowStep(workflowId, WorkflowState.RESEARCH, 0);

      // Log transition
      await this.logTransition(workflowId, null, WorkflowState.RESEARCH, 'WORKFLOW_CREATED', 'SYSTEM');

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('workflow_created', workflow);

      // Start the first task (research)
      await this.startStageTask(workflow);

      logger.info(`[Workflow] Created workflow ${workflowId} for article ${input.articleId}`);

      return workflow;
    } catch (error: any) {
      logger.error('[Workflow] Create workflow error:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<any> {
    try {
      // Try cache first
      const cached = await this.getCached(workflowId);
      if (cached) return cached;

      const workflow = await prisma.contentWorkflow.findUnique({
        where: { id: workflowId },
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

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Parse quality scores from steps
      const qualityScores = await this.extractQualityScores(workflow.WorkflowStep);

      const result = {
        ...workflow,
        qualityScores,
        metadata: workflow.metadata ? JSON.parse(workflow.metadata) : null
      };

      // Cache result
      await this.cacheWorkflow(workflowId, result);

      return result;
    } catch (error: any) {
      logger.error('[Workflow] Get workflow error:', error);
      throw new Error(`Failed to get workflow: ${error.message}`);
    }
  }

  /**
   * Advance workflow to next stage
   */
  async advanceWorkflow(workflowId: string, qualityScore?: WorkflowQualityScore): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const currentState = workflow.currentState as WorkflowState;

      // Check if advancement is allowed
      if ([WorkflowState.PUBLISHED, WorkflowState.CANCELLED, WorkflowState.FAILED].includes(currentState)) {
        throw new Error(`Cannot advance workflow in ${currentState} state`);
      }

      if (currentState === WorkflowState.PAUSED) {
        throw new Error('Workflow is paused. Resume first before advancing.');
      }

      // Validate quality score if provided
      if (qualityScore) {
        const threshold = WORKFLOW_STEPS[currentState].qualityThreshold;
        if (qualityScore.score < threshold) {
          logger.warn(`[Workflow] Quality score ${qualityScore.score} below threshold ${threshold}`);
          
          // Rollback to previous stage for revision
          return await this.rollbackWorkflow(workflowId, 
            `Quality score ${qualityScore.score} below threshold ${threshold}`);
        }
      }

      // Determine next state
      const nextState = this.getNextState(currentState);
      if (!nextState) {
        throw new Error(`No valid next state from ${currentState}`);
      }

      // Update current step with quality score
      if (qualityScore) {
        await this.updateStepQualityScore(workflowId, currentState, qualityScore);
      }

      // Update workflow
      const updatedWorkflow = await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          currentState: nextState,
          previousState: currentState,
          completionPercentage: this.calculateCompletionPercentage(nextState),
          updatedAt: new Date(),
          ...(nextState === WorkflowState.PUBLISHED && {
            actualCompletionAt: new Date()
          })
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Create new workflow step
      const stepOrder = workflow.WorkflowStep.length;
      await this.createWorkflowStep(workflowId, nextState, stepOrder);

      // Log transition
      await this.logTransition(
        workflowId,
        currentState,
        nextState,
        'ADVANCE',
        'SYSTEM',
        qualityScore ? `Quality score: ${qualityScore.score}` : undefined
      );

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('workflow_advanced', {
        workflowId,
        fromState: currentState,
        toState: nextState
      });

      // Handle next stage actions
      if (nextState === WorkflowState.HUMAN_APPROVAL) {
        await this.queueForHumanReview(updatedWorkflow);
      } else if (nextState === WorkflowState.PUBLISHED) {
        await this.handlePublication(updatedWorkflow);
      } else {
        // Start next stage task
        await this.startStageTask(updatedWorkflow);
      }

      logger.info(`[Workflow] Advanced ${workflowId} from ${currentState} to ${nextState}`);

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      logger.error('[Workflow] Advance workflow error:', error);
      throw new Error(`Failed to advance workflow: ${error.message}`);
    }
  }

  /**
   * Rollback workflow to previous stage
   */
  async rollbackWorkflow(workflowId: string, reason?: string): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const currentState = workflow.currentState as WorkflowState;
      const previousState = workflow.previousState as WorkflowState | null;

      if (!previousState) {
        throw new Error('No previous state to rollback to');
      }

      // Determine rollback target
      const rollbackState = this.getRollbackState(currentState);
      if (!rollbackState) {
        throw new Error(`Cannot rollback from ${currentState}`);
      }

      // Update workflow
      const updatedWorkflow = await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          currentState: rollbackState,
          previousState: currentState,
          errorMessage: reason || 'Quality threshold not met',
          retryCount: workflow.retryCount + 1,
          updatedAt: new Date()
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Check retry limit
      if (updatedWorkflow.retryCount >= updatedWorkflow.maxRetries) {
        logger.warn(`[Workflow] Max retries reached for ${workflowId}`);
        return await this.failWorkflow(workflowId, 'Maximum retry attempts exceeded');
      }

      // Create new workflow step for retry
      const stepOrder = workflow.WorkflowStep.length;
      await this.createWorkflowStep(workflowId, rollbackState, stepOrder);

      // Log transition
      await this.logTransition(
        workflowId,
        currentState,
        rollbackState,
        'ROLLBACK',
        'SYSTEM',
        reason
      );

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('workflow_rollback', {
        workflowId,
        fromState: currentState,
        toState: rollbackState,
        reason
      });

      // Restart the stage
      await this.startStageTask(updatedWorkflow);

      logger.info(`[Workflow] Rolled back ${workflowId} from ${currentState} to ${rollbackState}`);

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      logger.error('[Workflow] Rollback workflow error:', error);
      throw new Error(`Failed to rollback workflow: ${error.message}`);
    }
  }

  /**
   * Pause workflow
   */
  async pauseWorkflow(workflowId: string, reason?: string): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (workflow.currentState === WorkflowState.PAUSED) {
        throw new Error('Workflow is already paused');
      }

      if ([WorkflowState.PUBLISHED, WorkflowState.CANCELLED, WorkflowState.FAILED].includes(workflow.currentState)) {
        throw new Error(`Cannot pause workflow in ${workflow.currentState} state`);
      }

      const previousState = workflow.currentState;

      const updatedWorkflow = await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          currentState: WorkflowState.PAUSED,
          previousState: previousState,
          errorMessage: reason || 'Workflow paused',
          updatedAt: new Date()
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Log transition
      await this.logTransition(
        workflowId,
        previousState,
        WorkflowState.PAUSED,
        'PAUSE',
        'SYSTEM',
        reason
      );

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('workflow_paused', { workflowId, previousState, reason });

      logger.info(`[Workflow] Paused ${workflowId}`);

      return updatedWorkflow;
    } catch (error: any) {
      logger.error('[Workflow] Pause workflow error:', error);
      throw new Error(`Failed to pause workflow: ${error.message}`);
    }
  }

  /**
   * Resume paused workflow
   */
  async resumeWorkflow(workflowId: string): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (workflow.currentState !== WorkflowState.PAUSED) {
        throw new Error('Workflow is not paused');
      }

      const resumeState = workflow.previousState || WorkflowState.RESEARCH;

      const updatedWorkflow = await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          currentState: resumeState,
          previousState: WorkflowState.PAUSED,
          errorMessage: null,
          updatedAt: new Date()
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Log transition
      await this.logTransition(
        workflowId,
        WorkflowState.PAUSED,
        resumeState,
        'RESUME',
        'SYSTEM'
      );

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('workflow_resumed', { workflowId, resumeState });

      // Restart the stage task
      await this.startStageTask(updatedWorkflow);

      logger.info(`[Workflow] Resumed ${workflowId} to ${resumeState}`);

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      logger.error('[Workflow] Resume workflow error:', error);
      throw new Error(`Failed to resume workflow: ${error.message}`);
    }
  }

  /**
   * Submit workflow for human review
   */
  async submitForHumanReview(workflowId: string, reviewerId?: string): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Move to human approval stage if not already there
      if (workflow.currentState !== WorkflowState.HUMAN_APPROVAL) {
        // Validate we're at a stage that can go to human approval
        const validStates = [
          WorkflowState.CONTENT_REVIEW,
          WorkflowState.TRANSLATION_REVIEW
        ];

        if (!validStates.includes(workflow.currentState)) {
          throw new Error(`Cannot submit for human review from ${workflow.currentState} stage`);
        }

        // Advance to human approval
        await this.advanceToHumanApproval(workflowId);
      }

      // Assign reviewer if provided
      if (reviewerId) {
        await prisma.contentWorkflow.update({
          where: { id: workflowId },
          data: {
            assignedReviewerId: reviewerId,
            updatedAt: new Date()
          }
        });
      }

      // Queue for human review
      await this.queueForHumanReview(workflow);

      // Invalidate cache
      await this.invalidateCache(workflowId);

      logger.info(`[Workflow] Submitted ${workflowId} for human review`);

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      logger.error('[Workflow] Submit for human review error:', error);
      throw new Error(`Failed to submit for human review: ${error.message}`);
    }
  }

  /**
   * Process human review decision
   */
  async processHumanReview(input: HumanReviewInput): Promise<any> {
    try {
      const { workflowId, reviewerId, approved, feedback, requestedChanges } = input;

      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (workflow.currentState !== WorkflowState.HUMAN_APPROVAL) {
        throw new Error(`Workflow is not in human approval stage`);
      }

      // Update current step with human feedback
      const currentStep = workflow.WorkflowStep.find(
        (step: any) => step.stepName === WORKFLOW_STEPS[WorkflowState.HUMAN_APPROVAL].stepName
      );

      if (currentStep) {
        await prisma.workflowStep.update({
          where: { id: currentStep.id },
          data: {
            status: approved ? 'COMPLETED' : 'FAILED',
            humanFeedback: feedback || null,
            qualityScore: approved ? 1.0 : 0.0,
            completedAt: new Date(),
            assigneeId: reviewerId,
            updatedAt: new Date()
          }
        });
      }

      if (approved) {
        // Advance to published
        const qualityScoreData: Partial<WorkflowQualityScore> = {
          stage: WorkflowState.HUMAN_APPROVAL,
          score: 1.0,
          passed: true,
          reviewedBy: reviewerId,
          reviewedAt: new Date()
        };
        
        if (feedback) {
          qualityScoreData.feedback = feedback;
        }
        
        const qualityScore = qualityScoreData as WorkflowQualityScore;

        await this.advanceWorkflow(workflowId, qualityScore);
      } else {
        // Rollback for revisions
        const reason = `Human review rejected: ${feedback || 'No feedback provided'}`;
        if (requestedChanges && requestedChanges.length > 0) {
          // Store requested changes in metadata
          await prisma.contentWorkflow.update({
            where: { id: workflowId },
            data: {
              metadata: JSON.stringify({
                ...(workflow.metadata ? JSON.parse(workflow.metadata) : {}),
                requestedChanges,
                rejectedBy: reviewerId,
                rejectedAt: new Date()
              })
            }
          });
        }

        await this.rollbackWorkflow(workflowId, reason);
      }

      // Create notification
      await this.createNotification(workflowId, reviewerId, 'REVIEW_COMPLETED', 
        approved ? 'Content approved' : 'Content rejected');

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Emit event
      workflowEvents.emit('human_review_completed', {
        workflowId,
        reviewerId,
        approved,
        feedback
      });

      logger.info(`[Workflow] Human review processed for ${workflowId}: ${approved ? 'APPROVED' : 'REJECTED'}`);

      return await this.getWorkflow(workflowId);
    } catch (error: any) {
      logger.error('[Workflow] Process human review error:', error);
      throw new Error(`Failed to process human review: ${error.message}`);
    }
  }

  /**
   * Get human approval queue
   */
  async getHumanApprovalQueue(priority?: WorkflowPriority): Promise<any[]> {
    try {
      const where: any = {
        currentState: WorkflowState.HUMAN_APPROVAL
      };

      if (priority) {
        where.priority = priority;
      }

      const workflows = await prisma.contentWorkflow.findMany({
        where,
        include: {
          Article: true,
          User: true,
          WorkflowStep: {
            where: {
              stepName: WORKFLOW_STEPS[WorkflowState.HUMAN_APPROVAL].stepName
            },
            take: 1
          }
        },
        orderBy: [
          { priority: 'asc' }, // CRITICAL first
          { createdAt: 'asc' } // Oldest first
        ]
      });

      return workflows.map(workflow => ({
        ...workflow,
        waitTime: workflow.WorkflowStep[0] 
          ? Date.now() - new Date(workflow.WorkflowStep[0].createdAt).getTime()
          : 0
      }));
    } catch (error: any) {
      logger.error('[Workflow] Get human approval queue error:', error);
      throw new Error(`Failed to get human approval queue: ${error.message}`);
    }
  }

  /**
   * List workflows with filters
   */
  async listWorkflows(filters?: {
    currentState?: WorkflowState;
    priority?: WorkflowPriority;
    workflowType?: WorkflowType;
    assignedReviewerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters?.currentState) where.currentState = filters.currentState;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.workflowType) where.workflowType = filters.workflowType;
      if (filters?.assignedReviewerId) where.assignedReviewerId = filters.assignedReviewerId;
      
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const workflows = await prisma.contentWorkflow.findMany({
        where,
        include: {
          Article: true,
          User: true
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return workflows;
    } catch (error: any) {
      logger.error('[Workflow] List workflows error:', error);
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  /**
   * Fail workflow with reason
   */
  async failWorkflow(workflowId: string, reason: string): Promise<any> {
    try {
      const workflow = await this.getWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const previousState = workflow.currentState;

      const updatedWorkflow = await prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          currentState: WorkflowState.FAILED,
          previousState: previousState,
          errorMessage: reason,
          updatedAt: new Date()
        },
        include: {
          Article: true,
          User: true
        }
      });

      // Log transition
      await this.logTransition(
        workflowId,
        previousState,
        WorkflowState.FAILED,
        'FAILED',
        'SYSTEM',
        reason
      );

      // Invalidate cache
      await this.invalidateCache(workflowId);

      // Create notification for assigned reviewer
      if (workflow.assignedReviewerId) {
        await this.createNotification(
          workflowId,
          workflow.assignedReviewerId,
          'WORKFLOW_FAILED',
          reason
        );
      }

      // Emit event
      workflowEvents.emit('workflow_failed', { workflowId, reason });

      logger.error(`[Workflow] Failed ${workflowId}: ${reason}`);

      return updatedWorkflow;
    } catch (error: any) {
      logger.error('[Workflow] Fail workflow error:', error);
      throw new Error(`Failed to fail workflow: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async startStageTask(workflow: any): Promise<void> {
    const currentState = workflow.currentState as WorkflowState;
    const config = WORKFLOW_STEPS[currentState];

    if (config.agentType === 'NONE' || config.agentType === 'HUMAN') {
      return; // No automatic task for these stages
    }

    try {
      // Find appropriate agent
      const agent = await prisma.aIAgent.findFirst({
        where: {
          type: config.agentType,
          isActive: true
        }
      });

      if (!agent) {
        logger.warn(`[Workflow] No active agent found for type ${config.agentType}`);
        return;
      }

      // Determine task priority based on workflow priority
      let taskPriority = TaskPriority.NORMAL;
      if (workflow.priority === WorkflowPriority.CRITICAL) taskPriority = TaskPriority.URGENT;
      else if (workflow.priority === WorkflowPriority.HIGH) taskPriority = TaskPriority.HIGH;
      else if (workflow.priority === WorkflowPriority.LOW) taskPriority = TaskPriority.LOW;

      // Get current workflow step
      const currentStep = await prisma.workflowStep.findFirst({
        where: {
          workflowId: workflow.id,
          stepName: config.stepName,
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
      });

      // Create AI task
      const taskInput: any = {
        agentId: agent.id,
        taskType: `WORKFLOW_${currentState}`,
        inputData: {
          workflowId: workflow.id,
          articleId: workflow.articleId,
          stage: currentState,
          metadata: workflow.metadata ? JSON.parse(workflow.metadata) : {}
        },
        priority: taskPriority,
        estimatedCost: this.estimateTaskCost(config.agentType),
        maxRetries: 3
      };

      if (currentStep?.id) {
        taskInput.workflowStepId = currentStep.id;
      }

      const task = await aiTaskService.createAITask(taskInput);

      // Update workflow step with task ID
      if (currentStep) {
        await prisma.workflowStep.update({
          where: { id: currentStep.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      logger.info(`[Workflow] Started task ${task.id} for workflow ${workflow.id} stage ${currentState}`);
    } catch (error: any) {
      logger.error(`[Workflow] Failed to start stage task:`, error);
      await this.failWorkflow(workflow.id, `Failed to start ${currentState} task: ${error.message}`);
    }
  }

  private async createWorkflowStep(
    workflowId: string,
    state: WorkflowState,
    stepOrder: number
  ): Promise<any> {
    const config = WORKFLOW_STEPS[state];
    
    return await prisma.workflowStep.create({
      data: {
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        stepName: config.stepName,
        stepOrder,
        status: 'PENDING',
        estimatedDurationMs: config.estimatedDurationMs,
        updatedAt: new Date()
      }
    });
  }

  private async updateStepQualityScore(
    workflowId: string,
    state: WorkflowState,
    qualityScore: WorkflowQualityScore
  ): Promise<void> {
    const config = WORKFLOW_STEPS[state];
    
    const step = await prisma.workflowStep.findFirst({
      where: {
        workflowId,
        stepName: config.stepName
      },
      orderBy: { createdAt: 'desc' }
    });

    if (step) {
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: {
          qualityScore: qualityScore.score,
          status: qualityScore.passed ? 'COMPLETED' : 'FAILED',
          output: qualityScore.feedback ? JSON.stringify(qualityScore) : null,
          completedAt: new Date(),
          actualDurationMs: step.startedAt 
            ? Date.now() - new Date(step.startedAt).getTime()
            : null,
          updatedAt: new Date()
        }
      });
    }
  }

  private async logTransition(
    workflowId: string,
    fromState: string | null,
    toState: string,
    transitionType: string,
    triggeredBy: string,
    reason?: string
  ): Promise<void> {
    await prisma.workflowTransition.create({
      data: {
        id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        fromState: fromState || 'NONE',
        toState,
        transitionType,
        triggeredBy,
        transitionReason: reason || null,
        metadata: null
      }
    });
  }

  private async queueForHumanReview(workflow: any): Promise<void> {
    if (!workflow.assignedReviewerId) {
      // Auto-assign to available reviewer (implement your logic here)
      // For now, just create notification without specific reviewer
      logger.info(`[Workflow] Workflow ${workflow.id} queued for human review (no assigned reviewer)`);
    }

    // Create notification
    await this.createNotification(
      workflow.id,
      workflow.assignedReviewerId || 'SYSTEM',
      'HUMAN_REVIEW_REQUIRED',
      `Content workflow ready for review`
    );

    // Send notification after delay
    setTimeout(async () => {
      await this.sendReviewNotification(workflow);
    }, NOTIFICATION_DELAY_MS);
  }

  private async sendReviewNotification(workflow: any): Promise<void> {
    // Implementation depends on your notification system
    // Could be email, push notification, etc.
    logger.info(`[Workflow] Sending review notification for workflow ${workflow.id}`);
    
    // Emit event for real-time notification
    workflowEvents.emit('review_notification', {
      workflowId: workflow.id,
      articleId: workflow.articleId,
      priority: workflow.priority,
      reviewerId: workflow.assignedReviewerId
    });
  }

  private async createNotification(
    workflowId: string,
    recipientId: string,
    notificationType: string,
    message: string
  ): Promise<void> {
    try {
      await prisma.workflowNotification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workflowId,
          recipientId,
          notificationType,
          title: `Workflow Notification: ${notificationType}`,
          message,
          status: 'PENDING'
        }
      });
    } catch (error: any) {
      logger.error('[Workflow] Failed to create notification:', error);
    }
  }

  private async handlePublication(workflow: any): Promise<void> {
    try {
      // Update article status to published
      await prisma.article.update({
        where: { id: workflow.articleId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      logger.info(`[Workflow] Published article ${workflow.articleId}`);

      // Emit publication event
      workflowEvents.emit('article_published', {
        workflowId: workflow.id,
        articleId: workflow.articleId
      });
    } catch (error: any) {
      logger.error('[Workflow] Failed to handle publication:', error);
      await this.failWorkflow(workflow.id, `Publication failed: ${error.message}`);
    }
  }

  private async advanceToHumanApproval(workflowId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    const currentState = workflow.currentState as WorkflowState;

    // Fast-track to human approval
    const updatedWorkflow = await prisma.contentWorkflow.update({
      where: { id: workflowId },
      data: {
        currentState: WorkflowState.HUMAN_APPROVAL,
        previousState: currentState,
        updatedAt: new Date()
      }
    });

    // Create workflow step
    const stepOrder = workflow.WorkflowStep.length;
    await this.createWorkflowStep(workflowId, WorkflowState.HUMAN_APPROVAL, stepOrder);

    // Log transition
    await this.logTransition(
      workflowId,
      currentState,
      WorkflowState.HUMAN_APPROVAL,
      'FAST_TRACK',
      'SYSTEM',
      'Manually submitted for human review'
    );
  }

  private getNextState(currentState: WorkflowState): WorkflowState | null {
    const validTransitions = STATE_TRANSITIONS[currentState];
    if (!validTransitions || validTransitions.length === 0) return null;
    
    // Return the first valid transition (normal flow)
    return validTransitions[0] || null;
  }

  private getRollbackState(currentState: WorkflowState): WorkflowState | null {
    // Rollback logic: go back to the generation stage of current phase
    const rollbackMap: Record<WorkflowState, WorkflowState | null> = {
      [WorkflowState.RESEARCH_REVIEW]: WorkflowState.RESEARCH,
      [WorkflowState.CONTENT_REVIEW]: WorkflowState.CONTENT_GENERATION,
      [WorkflowState.TRANSLATION_REVIEW]: WorkflowState.TRANSLATION,
      [WorkflowState.HUMAN_APPROVAL]: WorkflowState.CONTENT_GENERATION,
      [WorkflowState.RESEARCH]: null,
      [WorkflowState.CONTENT_GENERATION]: null,
      [WorkflowState.TRANSLATION]: null,
      [WorkflowState.PUBLISHED]: null,
      [WorkflowState.FAILED]: null,
      [WorkflowState.PAUSED]: null,
      [WorkflowState.CANCELLED]: null
    };

    return rollbackMap[currentState] || null;
  }

  private calculateCompletionPercentage(state: WorkflowState): number {
    const stateProgress: Record<WorkflowState, number> = {
      [WorkflowState.RESEARCH]: 10,
      [WorkflowState.RESEARCH_REVIEW]: 20,
      [WorkflowState.CONTENT_GENERATION]: 40,
      [WorkflowState.CONTENT_REVIEW]: 50,
      [WorkflowState.TRANSLATION]: 70,
      [WorkflowState.TRANSLATION_REVIEW]: 80,
      [WorkflowState.HUMAN_APPROVAL]: 90,
      [WorkflowState.PUBLISHED]: 100,
      [WorkflowState.FAILED]: 0,
      [WorkflowState.PAUSED]: 0,
      [WorkflowState.CANCELLED]: 0
    };

    return stateProgress[state] || 0;
  }

  private calculateEstimatedCompletion(): Date {
    // Sum of all estimated durations
    const totalMs = Object.values(WORKFLOW_STEPS)
      .reduce((sum, step) => sum + step.estimatedDurationMs, 0);
    
    return new Date(Date.now() + totalMs);
  }

  private estimateTaskCost(agentType: string): number {
    const costMap: Record<string, number> = {
      RESEARCH_AGENT: 0.02,
      REVIEW_AGENT: 0.01,
      CONTENT_GENERATION_AGENT: 0.05,
      TRANSLATION_AGENT: 0.15, // 15 languages
      HUMAN: 0.00
    };

    return costMap[agentType] || 0.01;
  }

  private async extractQualityScores(steps: any[]): Promise<WorkflowQualityScore[]> {
    return steps
      .filter(step => step.qualityScore !== null)
      .map(step => {
        const output = step.output ? JSON.parse(step.output) : {};
        return {
          stage: this.getStateFromStepName(step.stepName),
          score: step.qualityScore,
          passed: step.status === 'COMPLETED',
          metrics: output.metrics,
          feedback: step.humanFeedback || output.feedback,
          reviewedBy: step.assigneeId,
          reviewedAt: step.completedAt
        };
      });
  }

  private getStateFromStepName(stepName: string): WorkflowState {
    const entry = Object.entries(WORKFLOW_STEPS).find(
      ([_, config]) => config.stepName === stepName
    );
    return entry ? (entry[0] as WorkflowState) : WorkflowState.RESEARCH;
  }

  // Cache methods
  private async getCached(workflowId: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(`workflow:${workflowId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  private async cacheWorkflow(workflowId: string, workflow: any): Promise<void> {
    try {
      if (redisClient && typeof redisClient.setex === 'function') {
        await redisClient.setex(
          `workflow:${workflowId}`,
          CACHE_TTL,
          JSON.stringify(workflow)
        );
      }
    } catch (error) {
      logger.error('[Workflow] Cache error:', error);
    }
  }

  private async invalidateCache(workflowId: string): Promise<void> {
    try {
      await redisClient.del(`workflow:${workflowId}`);
    } catch (error) {
      logger.error('[Workflow] Cache invalidation error:', error);
    }
  }
}

// ==================== EXPORT ====================

export const aiWorkflowService = new AIWorkflowService();
export default aiWorkflowService;
