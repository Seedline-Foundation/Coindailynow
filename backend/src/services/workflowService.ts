/**
 * Content Workflow Engine Service - Task 8
 * Implements automated content workflow: Research → AI Review → Content → AI Review → Translation → AI Review → Human Approval
 * Provides workflow state management, AI integration, human approval checkpoints, analytics and error recovery
 */

import { PrismaClient, ContentWorkflow, WorkflowStep, WorkflowTransition, WorkflowNotification, Article, User } from '@prisma/client';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface WorkflowConfig {
  enableAutoTransitions: boolean;
  defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  maxRetries: number;
  timeoutMs: number;
  enableNotifications: boolean;
  aiQualityThreshold: number;
}

export interface WorkflowStepConfig {
  stepName: string;
  estimatedDurationMs: number;
  requiresHumanApproval: boolean;
  aiAgentType?: string;
  qualityThreshold?: number;
  autoRetryOnFailure: boolean;
  nextSteps: string[];
}

export interface CreateWorkflowInput {
  articleId: string;
  workflowType?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedReviewerId?: string;
  metadata?: Record<string, any>;
}

export interface TransitionWorkflowInput {
  workflowId: string;
  toState: string;
  triggeredBy?: string;
  triggerReason?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowAnalytics {
  totalWorkflows: number;
  completedWorkflows: number;
  averageCompletionTimeMs: number;
  successRate: number;
  stateDistribution: Record<string, number>;
  bottleneckSteps: Array<{
    stepName: string;
    averageDurationMs: number;
    failureRate: number;
  }>;
  performanceMetrics: {
    aiReviewAccuracy: number;
    humanApprovalRate: number;
    translationQuality: number;
    contentQuality: number;
  };
}

export interface WorkflowNotificationInput {
  workflowId: string;
  recipientId: string;
  notificationType: 'EMAIL' | 'IN_APP' | 'SMS' | 'SLACK';
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  metadata?: Record<string, any>;
}

// Workflow states enum
export enum WorkflowState {
  RESEARCH = 'RESEARCH',
  AI_REVIEW = 'AI_REVIEW',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  AI_REVIEW_CONTENT = 'AI_REVIEW_CONTENT',
  TRANSLATION = 'TRANSLATION',
  AI_REVIEW_TRANSLATION = 'AI_REVIEW_TRANSLATION',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED'
}

// Workflow steps configuration
export const DEFAULT_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    stepName: 'RESEARCH',
    estimatedDurationMs: 300000, // 5 minutes
    requiresHumanApproval: false,
    aiAgentType: 'RESEARCH_AGENT',
    qualityThreshold: 80,
    autoRetryOnFailure: true,
    nextSteps: ['AI_REVIEW']
  },
  {
    stepName: 'AI_REVIEW',
    estimatedDurationMs: 120000, // 2 minutes
    requiresHumanApproval: false,
    aiAgentType: 'QUALITY_REVIEW_AGENT',
    qualityThreshold: 85,
    autoRetryOnFailure: true,
    nextSteps: ['CONTENT_GENERATION', 'REJECTED']
  },
  {
    stepName: 'CONTENT_GENERATION',
    estimatedDurationMs: 600000, // 10 minutes
    requiresHumanApproval: false,
    aiAgentType: 'CONTENT_GENERATION_AGENT',
    qualityThreshold: 80,
    autoRetryOnFailure: true,
    nextSteps: ['AI_REVIEW_CONTENT']
  },
  {
    stepName: 'AI_REVIEW_CONTENT',
    estimatedDurationMs: 120000, // 2 minutes
    requiresHumanApproval: false,
    aiAgentType: 'QUALITY_REVIEW_AGENT',
    qualityThreshold: 85,
    autoRetryOnFailure: true,
    nextSteps: ['TRANSLATION', 'REJECTED']
  },
  {
    stepName: 'TRANSLATION',
    estimatedDurationMs: 900000, // 15 minutes
    requiresHumanApproval: false,
    aiAgentType: 'TRANSLATION_AGENT',
    qualityThreshold: 75,
    autoRetryOnFailure: true,
    nextSteps: ['AI_REVIEW_TRANSLATION']
  },
  {
    stepName: 'AI_REVIEW_TRANSLATION',
    estimatedDurationMs: 120000, // 2 minutes
    requiresHumanApproval: false,
    aiAgentType: 'QUALITY_REVIEW_AGENT',
    qualityThreshold: 85,
    autoRetryOnFailure: true,
    nextSteps: ['HUMAN_APPROVAL', 'REJECTED']
  },
  {
    stepName: 'HUMAN_APPROVAL',
    estimatedDurationMs: 1800000, // 30 minutes
    requiresHumanApproval: true,
    qualityThreshold: 90,
    autoRetryOnFailure: false,
    nextSteps: ['PUBLISHED', 'REJECTED']
  }
];

export class WorkflowService extends EventEmitter {
  private readonly config: WorkflowConfig;
  private readonly stepConfigs: Map<string, WorkflowStepConfig>;
  
  constructor(
    private prisma: PrismaClient,
    private logger: Logger,
    config?: Partial<WorkflowConfig>
  ) {
    super();
    
    this.config = {
      enableAutoTransitions: true,
      defaultPriority: 'NORMAL',
      maxRetries: 3,
      timeoutMs: 3600000, // 1 hour
      enableNotifications: true,
      aiQualityThreshold: 80,
      ...config
    };
    
    this.stepConfigs = new Map();
    DEFAULT_WORKFLOW_STEPS.forEach(step => {
      this.stepConfigs.set(step.stepName, step);
    });
  }

  /**
   * Create a new content workflow for an article
   */
  async createWorkflow(input: CreateWorkflowInput): Promise<ContentWorkflow> {
    this.logger.info('Creating new content workflow', { articleId: input.articleId });

    try {
      const workflow = await this.prisma.$transaction(async (tx) => {
        // Check if workflow already exists for this article
        const existingWorkflow = await tx.contentWorkflow.findUnique({
          where: { articleId: input.articleId }
        });

        if (existingWorkflow) {
          throw new Error(`Workflow already exists for article ${input.articleId}`);
        }

        // Create the workflow
        const newWorkflow = await tx.contentWorkflow.create({
          data: {
            articleId: input.articleId,
            workflowType: input.workflowType || 'ARTICLE_PUBLISHING',
            currentState: WorkflowState.RESEARCH,
            priority: input.priority || this.config.defaultPriority,
            assignedReviewerId: input.assignedReviewerId || null,
            maxRetries: this.config.maxRetries,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            estimatedCompletionAt: this.calculateEstimatedCompletion()
          }
        });

        // Create workflow steps
        for (let i = 0; i < DEFAULT_WORKFLOW_STEPS.length; i++) {
          const stepConfig = DEFAULT_WORKFLOW_STEPS[i];
          if (!stepConfig) continue;
          
          await tx.workflowStep.create({
            data: {
              workflowId: newWorkflow.id,
              stepName: stepConfig.stepName,
              stepOrder: i + 1,
              status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
              estimatedDurationMs: stepConfig.estimatedDurationMs,
              startedAt: i === 0 ? new Date() : null
            }
          });
        }

        // Create initial transition
        await tx.workflowTransition.create({
          data: {
            workflowId: newWorkflow.id,
            fromState: '',
            toState: WorkflowState.RESEARCH,
            transitionType: 'AUTOMATIC',
            transitionReason: 'Workflow initiated'
          }
        });

        return newWorkflow;
      });

      this.emit('workflowCreated', { workflowId: workflow.id, articleId: input.articleId });
      
      // Start the first step if auto-transitions are enabled
      if (this.config.enableAutoTransitions) {
        await this.processNextStep(workflow.id);
      }

      return workflow;
    } catch (error) {
      this.logger.error('Failed to create workflow', { 
        error: error instanceof Error ? error.message : String(error), 
        articleId: input.articleId 
      });
      throw error;
    }
  }

  /**
   * Transition workflow to a new state
   */
  async transitionWorkflow(input: TransitionWorkflowInput): Promise<ContentWorkflow> {
    this.logger.info('Transitioning workflow', { workflowId: input.workflowId, toState: input.toState });

    try {
      const workflow = await this.prisma.$transaction(async (tx) => {
        // Get current workflow
        const currentWorkflow = await tx.contentWorkflow.findUnique({
          where: { id: input.workflowId },
          include: { steps: true }
        });

        if (!currentWorkflow) {
          throw new Error(`Workflow not found: ${input.workflowId}`);
        }

        // Validate transition
        if (!this.isValidTransition(currentWorkflow.currentState, input.toState)) {
          throw new Error(`Invalid transition from ${currentWorkflow.currentState} to ${input.toState}`);
        }

        // Update workflow state
        const updatedWorkflow = await tx.contentWorkflow.update({
          where: { id: input.workflowId },
          data: {
            previousState: currentWorkflow.currentState,
            currentState: input.toState,
            completionPercentage: this.calculateCompletionPercentage(input.toState),
            actualCompletionAt: input.toState === WorkflowState.PUBLISHED ? new Date() : null,
            updatedAt: new Date()
          }
        });

        // Update current step status
        const currentStep = currentWorkflow.steps.find(s => s.stepName === currentWorkflow.currentState);
        if (currentStep && currentStep.status === 'IN_PROGRESS') {
          await tx.workflowStep.update({
            where: { id: currentStep.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              actualDurationMs: currentStep.startedAt 
                ? Date.now() - currentStep.startedAt.getTime() 
                : null
            }
          });
        }

        // Start next step if not terminal state
        if (!this.isTerminalState(input.toState)) {
          const nextStep = currentWorkflow.steps.find(s => s.stepName === input.toState);
          if (nextStep) {
            await tx.workflowStep.update({
              where: { id: nextStep.id },
              data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
              }
            });
          }
        }

        // Record transition
        await tx.workflowTransition.create({
          data: {
            workflowId: input.workflowId,
            fromState: currentWorkflow.currentState,
            toState: input.toState,
            transitionType: input.triggeredBy ? 'MANUAL' : 'AUTOMATIC',
            triggeredBy: input.triggeredBy || null,
            transitionReason: input.triggerReason || null,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null
          }
        });

        return updatedWorkflow;
      });

      this.emit('workflowTransitioned', { 
        workflowId: input.workflowId, 
        fromState: workflow.previousState, 
        toState: workflow.currentState 
      });

      // Send notifications
      if (this.config.enableNotifications) {
        await this.sendStateChangeNotifications(workflow);
      }

      // Process next step if auto-transitions enabled
      if (this.config.enableAutoTransitions && !this.isTerminalState(input.toState)) {
        setTimeout(() => this.processNextStep(input.workflowId), 1000);
      }

      return workflow;
    } catch (error) {
      this.logger.error('Failed to transition workflow', { 
        error: error instanceof Error ? error.message : String(error), 
        workflowId: input.workflowId 
      });
      throw error;
    }
  }

  /**
   * Process the next step in the workflow
   */
  async processNextStep(workflowId: string): Promise<void> {
    this.logger.info('Processing next workflow step', { workflowId });

    try {
      const workflow = await this.prisma.contentWorkflow.findUnique({
        where: { id: workflowId },
        include: { 
          steps: true,
          article: true
        }
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      const currentStepConfig = this.stepConfigs.get(workflow.currentState);
      if (!currentStepConfig) {
        this.logger.warn('No step configuration found', { state: workflow.currentState });
        return;
      }

      // If step requires human approval, wait for manual intervention
      if (currentStepConfig.requiresHumanApproval) {
        this.logger.info('Step requires human approval, waiting for manual intervention', { 
          workflowId, 
          state: workflow.currentState 
        });
        return;
      }

      // Process AI step
      if (currentStepConfig.aiAgentType) {
        await this.processAIStep(workflow, currentStepConfig);
      }

    } catch (error) {
      this.logger.error('Failed to process next step', { 
        error: error instanceof Error ? error.message : String(error), 
        workflowId 
      });
      await this.handleStepError(workflowId, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process AI-powered workflow step
   */
  private async processAIStep(workflow: ContentWorkflow & { article: Article, steps: WorkflowStep[] }, stepConfig: WorkflowStepConfig): Promise<void> {
    this.logger.info('Processing AI step', { 
      workflowId: workflow.id, 
      stepName: stepConfig.stepName,
      agentType: stepConfig.aiAgentType 
    });

    try {
      // Create AI task
      const aiTask = await this.prisma.aITask.create({
        data: {
          agentId: 'default-agent', // This would be replaced with actual agent selection
          taskType: stepConfig.aiAgentType!,
          inputData: JSON.stringify({
            articleId: workflow.articleId,
            workflowId: workflow.id,
            stepName: stepConfig.stepName,
            content: workflow.article.content,
            title: workflow.article.title
          }),
          status: 'QUEUED',
          priority: workflow.priority,
          estimatedCost: 0.1, // Placeholder cost
          workflowStepId: workflow.steps?.find((s: any) => s.stepName === stepConfig.stepName)?.id || null
        }
      });

      this.emit('aiTaskCreated', { 
        taskId: aiTask.id, 
        workflowId: workflow.id, 
        stepName: stepConfig.stepName 
      });

      // Simulate AI processing (in real implementation, this would trigger AI agents)
      setTimeout(async () => {
        await this.completeAIStep(workflow.id, stepConfig.stepName, {
          qualityScore: 85,
          output: { processed: true, timestamp: new Date().toISOString() }
        });
      }, 2000);

    } catch (error) {
      this.logger.error('Failed to process AI step', { 
        error: error instanceof Error ? error.message : String(error), 
        workflowId: workflow.id,
        stepName: stepConfig.stepName 
      });
      throw error;
    }
  }

  /**
   * Complete AI step and transition to next state
   */
  async completeAIStep(workflowId: string, stepName: string, result: { qualityScore: number; output: any }): Promise<void> {
    this.logger.info('Completing AI step', { workflowId, stepName, qualityScore: result.qualityScore });

    try {
      const stepConfig = this.stepConfigs.get(stepName);
      if (!stepConfig) {
        throw new Error(`Step configuration not found: ${stepName}`);
      }

      // Update step with results
      await this.prisma.workflowStep.updateMany({
        where: {
          workflowId: workflowId,
          stepName: stepName
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          qualityScore: result.qualityScore,
          output: JSON.stringify(result.output)
        }
      });

      // Determine next step based on quality score
      const nextState = this.determineNextState(stepName, result.qualityScore, stepConfig.qualityThreshold);
      
      // Transition to next state
      await this.transitionWorkflow({
        workflowId,
        toState: nextState,
        triggerReason: `AI step completed with quality score: ${result.qualityScore}`,
        metadata: { qualityScore: result.qualityScore, aiOutput: result.output }
      });

    } catch (error) {
      this.logger.error('Failed to complete AI step', { 
        error: error instanceof Error ? error.message : String(error), 
        workflowId, 
        stepName 
      });
      await this.handleStepError(workflowId, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle workflow step errors and implement recovery
   */
  private async handleStepError(workflowId: string, errorMessage: string): Promise<void> {
    this.logger.error('Handling workflow step error', { workflowId, errorMessage });

    try {
      const workflow = await this.prisma.contentWorkflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) return;

      // Increment retry count
      const updatedWorkflow = await this.prisma.contentWorkflow.update({
        where: { id: workflowId },
        data: {
          retryCount: workflow.retryCount + 1,
          errorMessage: errorMessage
        }
      });

      // If max retries exceeded, mark as failed
      if (updatedWorkflow.retryCount >= updatedWorkflow.maxRetries) {
        await this.transitionWorkflow({
          workflowId,
          toState: WorkflowState.FAILED,
          triggerReason: `Max retries exceeded: ${errorMessage}`
        });
      } else {
        // Retry the current step
        this.logger.info('Retrying workflow step', { 
          workflowId, 
          retryCount: updatedWorkflow.retryCount 
        });
        setTimeout(() => this.processNextStep(workflowId), 5000); // Retry after 5 seconds
      }

    } catch (error) {
      this.logger.error('Failed to handle step error', { 
        error: error instanceof Error ? error.message : String(error), 
        workflowId, 
        originalError: errorMessage 
      });
    }
  }

  /**
   * Get workflow analytics
   */
  async getWorkflowAnalytics(dateFrom?: Date, dateTo?: Date): Promise<WorkflowAnalytics> {
    this.logger.info('Generating workflow analytics', { dateFrom, dateTo });

    try {
      const whereClause = {
        ...(dateFrom && { createdAt: { gte: dateFrom } }),
        ...(dateTo && { createdAt: { lte: dateTo } })
      };

      // Get basic workflow counts
      const totalWorkflows = await this.prisma.contentWorkflow.count({ where: whereClause });
      const completedWorkflows = await this.prisma.contentWorkflow.count({
        where: { ...whereClause, currentState: WorkflowState.PUBLISHED }
      });

      // Get state distribution
      const stateDistribution = await this.prisma.contentWorkflow.groupBy({
        by: ['currentState'],
        where: whereClause,
        _count: true
      });

      // Get completion times for completed workflows
      const completedWorkflowsData = await this.prisma.contentWorkflow.findMany({
        where: { 
          ...whereClause, 
          currentState: WorkflowState.PUBLISHED,
          actualCompletionAt: { not: null }
        },
        select: { createdAt: true, actualCompletionAt: true }
      });

      const averageCompletionTimeMs = completedWorkflowsData.length > 0
        ? completedWorkflowsData.reduce((sum, w) => {
            const duration = w.actualCompletionAt!.getTime() - w.createdAt.getTime();
            return sum + duration;
          }, 0) / completedWorkflowsData.length
        : 0;

      // Get step performance
      const stepPerformance = await this.prisma.workflowStep.groupBy({
        by: ['stepName'],
        where: { 
          workflow: whereClause,
          status: { in: ['COMPLETED', 'FAILED'] }
        },
        _avg: { actualDurationMs: true, qualityScore: true },
        _count: { status: true }
      });

      const bottleneckSteps = stepPerformance.map(step => ({
        stepName: step.stepName,
        averageDurationMs: step._avg.actualDurationMs || 0,
        failureRate: 0 // Calculate from status counts
      })).sort((a, b) => b.averageDurationMs - a.averageDurationMs);

      return {
        totalWorkflows,
        completedWorkflows,
        averageCompletionTimeMs,
        successRate: totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0,
        stateDistribution: Object.fromEntries(
          stateDistribution.map(s => [s.currentState, s._count])
        ),
        bottleneckSteps,
        performanceMetrics: {
          aiReviewAccuracy: 85, // Placeholder - would be calculated from AI task results
          humanApprovalRate: 95, // Placeholder
          translationQuality: 80, // Placeholder
          contentQuality: 88 // Placeholder
        }
      };

    } catch (error) {
      this.logger.error('Failed to generate workflow analytics', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Send workflow notifications
   */
  async sendNotification(input: WorkflowNotificationInput): Promise<WorkflowNotification> {
    this.logger.info('Sending workflow notification', { 
      workflowId: input.workflowId,
      recipientId: input.recipientId,
      type: input.notificationType 
    });

    try {
      const notification = await this.prisma.workflowNotification.create({
        data: {
          workflowId: input.workflowId,
          recipientId: input.recipientId,
          notificationType: input.notificationType,
          title: input.title,
          message: input.message,
          priority: input.priority || 'NORMAL',
          metadata: input.metadata ? JSON.stringify(input.metadata) : null
        }
      });

      // Emit notification event for external handlers (email, slack, etc.)
      this.emit('notificationCreated', { 
        notificationId: notification.id, 
        type: input.notificationType,
        recipientId: input.recipientId
      });

      return notification;
    } catch (error) {
      this.logger.error('Failed to send notification', { 
        error: error instanceof Error ? error.message : String(error), 
        input 
      });
      throw error;
    }
  }

  // Helper methods
  private isValidTransition(fromState: string, toState: string): boolean {
    const validTransitions: Record<string, string[]> = {
      [WorkflowState.RESEARCH]: [WorkflowState.AI_REVIEW, WorkflowState.FAILED],
      [WorkflowState.AI_REVIEW]: [WorkflowState.CONTENT_GENERATION, WorkflowState.REJECTED, WorkflowState.FAILED],
      [WorkflowState.CONTENT_GENERATION]: [WorkflowState.AI_REVIEW_CONTENT, WorkflowState.FAILED],
      [WorkflowState.AI_REVIEW_CONTENT]: [WorkflowState.TRANSLATION, WorkflowState.CONTENT_GENERATION, WorkflowState.REJECTED, WorkflowState.FAILED], // Allow loop back to CONTENT_GENERATION
      [WorkflowState.TRANSLATION]: [WorkflowState.AI_REVIEW_TRANSLATION, WorkflowState.FAILED],
      [WorkflowState.AI_REVIEW_TRANSLATION]: [WorkflowState.HUMAN_APPROVAL, WorkflowState.TRANSLATION, WorkflowState.REJECTED, WorkflowState.FAILED], // Allow loop back to TRANSLATION
      [WorkflowState.HUMAN_APPROVAL]: [WorkflowState.PUBLISHED, WorkflowState.REJECTED],
      [WorkflowState.REJECTED]: [WorkflowState.RESEARCH], // Allow restart from REJECTED
      [WorkflowState.PUBLISHED]: [], // Terminal state
      [WorkflowState.FAILED]: [] // Terminal state
    };

    return validTransitions[fromState]?.includes(toState) || false;
  }

  private isTerminalState(state: string): boolean {
    return [WorkflowState.PUBLISHED, WorkflowState.FAILED].includes(state as WorkflowState); // REJECTED is no longer terminal - can restart
  }

  private calculateCompletionPercentage(currentState: string): number {
    const stateProgress: Record<string, number> = {
      [WorkflowState.RESEARCH]: 15,
      [WorkflowState.AI_REVIEW]: 25,
      [WorkflowState.CONTENT_GENERATION]: 40,
      [WorkflowState.AI_REVIEW_CONTENT]: 55,
      [WorkflowState.TRANSLATION]: 70,
      [WorkflowState.AI_REVIEW_TRANSLATION]: 85,
      [WorkflowState.HUMAN_APPROVAL]: 95,
      [WorkflowState.PUBLISHED]: 100,
      [WorkflowState.REJECTED]: 100,
      [WorkflowState.FAILED]: 0
    };

    return stateProgress[currentState] || 0;
  }

  private calculateEstimatedCompletion(): Date {
    const totalEstimatedMs = DEFAULT_WORKFLOW_STEPS.reduce((sum, step) => sum + step.estimatedDurationMs, 0);
    return new Date(Date.now() + totalEstimatedMs);
  }

  private determineNextState(currentStep: string, qualityScore: number, threshold?: number): string {
    const stepConfig = this.stepConfigs.get(currentStep);
    if (!stepConfig) return WorkflowState.FAILED;

    // AI Review Quality Control Logic
    if (threshold && qualityScore < threshold) {
      this.logger.warn('Quality threshold not met - sending back for correction', {
        currentStep,
        qualityScore,
        threshold,
        action: 'QUALITY_REJECTION'
      });

      // Different rejection strategies based on step type
      switch (currentStep) {
        case WorkflowState.AI_REVIEW:
          // Initial AI review failed - send back to research
          this.logger.info('AI Review failed: Content needs more research', { qualityScore, threshold });
          return WorkflowState.REJECTED; // This will trigger back to RESEARCH
          
        case WorkflowState.AI_REVIEW_CONTENT:
          // Content generation review failed - send back to content generation
          this.logger.info('Content Review failed: Content needs regeneration', { qualityScore, threshold });
          return WorkflowState.CONTENT_GENERATION; // Loop back to fix content
          
        case WorkflowState.AI_REVIEW_TRANSLATION:
          // Translation review failed - send back to translation
          this.logger.info('Translation Review failed: Translation needs improvement', { qualityScore, threshold });
          return WorkflowState.TRANSLATION; // Loop back to fix translation
          
        default:
          // Other steps that fail go to FAILED state
          return WorkflowState.FAILED;
      }
    }

    // Quality passed - proceed to next step
    this.logger.info('Quality threshold met - proceeding to next step', {
      currentStep,
      qualityScore,
      threshold,
      nextStep: stepConfig.nextSteps[0],
      action: 'QUALITY_APPROVED'
    });

    // Return first valid next step (successful path)
    return stepConfig.nextSteps[0] || WorkflowState.FAILED;
  }

  private async sendStateChangeNotifications(workflow: ContentWorkflow): Promise<void> {
    if (workflow.assignedReviewerId) {
      await this.sendNotification({
        workflowId: workflow.id,
        recipientId: workflow.assignedReviewerId,
        notificationType: 'IN_APP',
        title: 'Workflow State Changed',
        message: `Workflow ${workflow.id} transitioned to ${workflow.currentState}`,
        priority: workflow.priority as any
      });
    }
  }
}