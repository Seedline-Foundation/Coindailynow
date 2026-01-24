/**
 * Task 8: Content Workflow Engine Service Tests
 * TDD Requirements: Workflow state tests, transition validation tests, notification tests
 */

import { WorkflowService, WorkflowState, CreateWorkflowInput, TransitionWorkflowInput } from '../../src/services/workflowService';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

// Mock implementations
const mockPrisma = {
  contentWorkflow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn()
  },
  workflowStep: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn()
  },
  workflowTransition: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  workflowNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  aITask: {
    create: jest.fn()
  },
  $transaction: jest.fn()
} as unknown as PrismaClient;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

describe('WorkflowService', () => {
  let workflowService: WorkflowService;

  beforeEach(() => {
    workflowService = new WorkflowService(mockPrisma, mockLogger);
    jest.clearAllMocks();

    // Setup transaction mock to execute callback immediately
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
  });

  describe('Workflow Creation Tests', () => {
    const mockCreateInput: CreateWorkflowInput = {
      articleId: 'article-123',
      workflowType: 'ARTICLE_PUBLISHING',
      priority: 'NORMAL',
      assignedReviewerId: 'reviewer-456'
    };

    const mockCreatedWorkflow = {
      id: 'workflow-123',
      articleId: 'article-123',
      workflowType: 'ARTICLE_PUBLISHING',
      currentState: WorkflowState.RESEARCH,
      priority: 'NORMAL',
      assignedReviewerId: 'reviewer-456',
      completionPercentage: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new workflow successfully', async () => {
      // Arrange
      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.contentWorkflow.create as jest.Mock).mockResolvedValue(mockCreatedWorkflow);
      (mockPrisma.workflowStep.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});

      // Act
      const result = await workflowService.createWorkflow(mockCreateInput);

      // Assert
      expect(result).toEqual(mockCreatedWorkflow);
      expect(mockPrisma.contentWorkflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          articleId: mockCreateInput.articleId,
          workflowType: mockCreateInput.workflowType,
          currentState: WorkflowState.RESEARCH,
          priority: mockCreateInput.priority,
          assignedReviewerId: mockCreateInput.assignedReviewerId
        })
      });
      expect(mockPrisma.workflowStep.create).toHaveBeenCalledTimes(7); // Updated workflow steps with additional AI_REVIEW stages
      expect(mockPrisma.workflowTransition.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error if workflow already exists for article', async () => {
      // Arrange
      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockCreatedWorkflow);

      // Act & Assert
      await expect(workflowService.createWorkflow(mockCreateInput)).rejects.toThrow('Workflow already exists for article article-123');
    });

    it('should create workflow steps in correct order', async () => {
      // Arrange
      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.contentWorkflow.create as jest.Mock).mockResolvedValue(mockCreatedWorkflow);
      (mockPrisma.workflowStep.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});

      // Act
      await workflowService.createWorkflow(mockCreateInput);

      // Assert
      const stepCalls = (mockPrisma.workflowStep.create as jest.Mock).mock.calls;
      expect(stepCalls).toHaveLength(7); // All workflow steps
      expect(stepCalls[0][0].data.stepName).toBe('RESEARCH');
      expect(stepCalls[0][0].data.stepOrder).toBe(1);
      expect(stepCalls[0][0].data.status).toBe('IN_PROGRESS');
      expect(stepCalls[1][0].data.stepName).toBe('AI_REVIEW');
      expect(stepCalls[1][0].data.stepOrder).toBe(2);
      expect(stepCalls[1][0].data.status).toBe('PENDING');
      expect(stepCalls[2][0].data.stepName).toBe('CONTENT_GENERATION');
      expect(stepCalls[2][0].data.stepOrder).toBe(3);
      expect(stepCalls[2][0].data.status).toBe('PENDING');
      expect(stepCalls[3][0].data.stepName).toBe('AI_REVIEW_CONTENT');
      expect(stepCalls[3][0].data.stepOrder).toBe(4);
      expect(stepCalls[3][0].data.status).toBe('PENDING');
      expect(stepCalls[4][0].data.stepName).toBe('TRANSLATION');
      expect(stepCalls[4][0].data.stepOrder).toBe(5);
      expect(stepCalls[4][0].data.status).toBe('PENDING');
      expect(stepCalls[5][0].data.stepName).toBe('AI_REVIEW_TRANSLATION');
      expect(stepCalls[5][0].data.stepOrder).toBe(6);
      expect(stepCalls[5][0].data.status).toBe('PENDING');
      expect(stepCalls[6][0].data.stepName).toBe('HUMAN_APPROVAL');
      expect(stepCalls[6][0].data.stepOrder).toBe(7);
      expect(stepCalls[6][0].data.status).toBe('PENDING');
    });
  });

  describe('Workflow Transition Tests', () => {
    const mockExistingWorkflow = {
      id: 'workflow-123',
      articleId: 'article-123',
      currentState: WorkflowState.RESEARCH,
      previousState: null,
      priority: 'NORMAL',
      assignedReviewerId: 'reviewer-456',
      completionPercentage: 20,
      retryCount: 0,
      maxRetries: 3,
      steps: [
        {
          id: 'step-1',
          stepName: WorkflowState.RESEARCH,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      ]
    };

    it('should transition workflow to valid next state', async () => {
      // Arrange
      const transitionInput: TransitionWorkflowInput = {
        workflowId: 'workflow-123',
        toState: WorkflowState.AI_REVIEW,
        triggeredBy: 'user-123',
        triggerReason: 'Research completed'
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockExistingWorkflow);
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({
        ...mockExistingWorkflow,
        currentState: WorkflowState.AI_REVIEW,
        previousState: WorkflowState.RESEARCH,
        completionPercentage: 40
      });
      (mockPrisma.workflowStep.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowNotification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        workflowId: 'workflow-123',
        recipientId: 'user-123',
        notificationType: 'WORKFLOW_STATE_CHANGED'
      });

      // Act
      const result = await workflowService.transitionWorkflow(transitionInput);

      // Assert
      expect(result.currentState).toBe(WorkflowState.AI_REVIEW);
      expect(result.previousState).toBe(WorkflowState.RESEARCH);
      expect(mockPrisma.workflowTransition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: transitionInput.workflowId,
          fromState: WorkflowState.RESEARCH,
          toState: WorkflowState.AI_REVIEW,
          transitionType: 'MANUAL',
          triggeredBy: transitionInput.triggeredBy,
          transitionReason: transitionInput.triggerReason
        })
      });
    });

    it('should reject invalid state transitions', async () => {
      // Arrange
      const invalidTransitionInput: TransitionWorkflowInput = {
        workflowId: 'workflow-123',
        toState: WorkflowState.PUBLISHED, // Invalid: can't go directly from RESEARCH to PUBLISHED
        triggeredBy: 'user-123'
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockExistingWorkflow);

      // Act & Assert
      await expect(workflowService.transitionWorkflow(invalidTransitionInput)).rejects.toThrow('Invalid transition from RESEARCH to PUBLISHED');
    });

    it('should update completion percentage correctly', async () => {
      // Arrange
      const transitionInput: TransitionWorkflowInput = {
        workflowId: 'workflow-123',
        toState: WorkflowState.AI_REVIEW_TRANSLATION
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingWorkflow,
        currentState: WorkflowState.TRANSLATION
      });
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowStep.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});

      // Act
      await workflowService.transitionWorkflow(transitionInput);

      // Assert
      expect(mockPrisma.contentWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-123' },
        data: expect.objectContaining({
          completionPercentage: 85 // AI_REVIEW_TRANSLATION is 85%
        })
      });
    });

    it('should mark workflow as completed when transitioning to PUBLISHED', async () => {
      // Arrange
      const transitionInput: TransitionWorkflowInput = {
        workflowId: 'workflow-123',
        toState: WorkflowState.PUBLISHED
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue({
        ...mockExistingWorkflow,
        currentState: WorkflowState.HUMAN_APPROVAL
      });
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowStep.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});

      // Act
      await workflowService.transitionWorkflow(transitionInput);

      // Assert
      expect(mockPrisma.contentWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-123' },
        data: expect.objectContaining({
          completionPercentage: 100,
          actualCompletionAt: expect.any(Date)
        })
      });
    });
  });

  describe('AI Step Processing Tests', () => {
    const mockWorkflowWithArticle = {
      id: 'workflow-123',
      currentState: WorkflowState.AI_REVIEW,
      steps: [
        {
          id: 'step-2',
          stepName: WorkflowState.AI_REVIEW,
          status: 'IN_PROGRESS'
        }
      ],
      article: {
        id: 'article-123',
        title: 'Test Article',
        content: 'Test content'
      }
    };

    it('should complete AI step with high quality score and transition to next state', async () => {
      // Arrange
      (mockPrisma.workflowStep.updateMany as jest.Mock).mockResolvedValue({});

      // Act
      await workflowService.completeAIStep('workflow-123', WorkflowState.AI_REVIEW, {
        qualityScore: 90,
        output: { processed: true }
      });

      // Assert
      expect(mockPrisma.workflowStep.updateMany).toHaveBeenCalledWith({
        where: {
          workflowId: 'workflow-123',
          stepName: WorkflowState.AI_REVIEW
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          qualityScore: 90
        })
      });
    });

    it('should reject workflow if AI quality score is below threshold', async () => {
      // Arrange
      (mockPrisma.workflowStep.updateMany as jest.Mock).mockResolvedValue({});
      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflowWithArticle);
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowStep.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.workflowTransition.create as jest.Mock).mockResolvedValue({});

      // Act
      await workflowService.completeAIStep('workflow-123', WorkflowState.AI_REVIEW, {
        qualityScore: 70, // Below threshold of 85
        output: { processed: true }
      });

      // Assert - Should transition to REJECTED state
      expect(mockPrisma.workflowTransition.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          toState: WorkflowState.REJECTED
        })
      });
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should increment retry count on step failure', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'workflow-123',
        retryCount: 1,
        maxRetries: 3
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({
        ...mockWorkflow,
        retryCount: 2
      });

      // Act
      await workflowService['handleStepError']('workflow-123', 'Test error');

      // Assert
      expect(mockPrisma.contentWorkflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-123' },
        data: {
          retryCount: 2,
          errorMessage: 'Test error'
        }
      });
    });

    it('should mark workflow as FAILED when max retries exceeded', async () => {
      // Arrange
      const mockWorkflow = {
        id: 'workflow-123',
        retryCount: 2,
        maxRetries: 3
      };

      (mockPrisma.contentWorkflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (mockPrisma.contentWorkflow.update as jest.Mock).mockResolvedValue({
        ...mockWorkflow,
        retryCount: 3
      });

      // Mock the transitionWorkflow method
      const transitionWorkflowSpy = jest.spyOn(workflowService, 'transitionWorkflow').mockResolvedValue({} as any);

      // Act
      await workflowService['handleStepError']('workflow-123', 'Max retries error');

      // Assert
      expect(transitionWorkflowSpy).toHaveBeenCalledWith({
        workflowId: 'workflow-123',
        toState: WorkflowState.FAILED,
        triggerReason: 'Max retries exceeded: Max retries error'
      });
    });
  });

  describe('Workflow Analytics Tests', () => {
    it('should calculate workflow analytics correctly', async () => {
      // Arrange
      (mockPrisma.contentWorkflow.count as jest.Mock)
        .mockResolvedValueOnce(100) // total workflows
        .mockResolvedValueOnce(80); // completed workflows

      (mockPrisma.contentWorkflow.groupBy as jest.Mock).mockResolvedValue([
        { currentState: WorkflowState.PUBLISHED, _count: 80 },
        { currentState: WorkflowState.RESEARCH, _count: 10 },
        { currentState: WorkflowState.FAILED, _count: 10 }
      ]);

      (mockPrisma.contentWorkflow.findMany as jest.Mock).mockResolvedValue([
        {
          createdAt: new Date('2024-01-01'),
          actualCompletionAt: new Date('2024-01-02')
        }
      ]);

      (mockPrisma.workflowStep.groupBy as jest.Mock).mockResolvedValue([
        {
          stepName: WorkflowState.AI_REVIEW,
          _avg: { actualDurationMs: 120000, qualityScore: 85 },
          _count: { status: 50 }
        }
      ]);

      // Act
      const analytics = await workflowService.getWorkflowAnalytics();

      // Assert
      expect(analytics.totalWorkflows).toBe(100);
      expect(analytics.completedWorkflows).toBe(80);
      expect(analytics.successRate).toBe(80);
      expect(analytics.stateDistribution[WorkflowState.PUBLISHED]).toBe(80);
      expect(analytics.bottleneckSteps).toHaveLength(1);
      expect(analytics.bottleneckSteps[0]?.stepName).toBe(WorkflowState.AI_REVIEW);
      expect(analytics.bottleneckSteps[0]?.averageDurationMs).toBe(120000);
    });
  });

  describe('Notification Tests', () => {
    it('should create workflow notification successfully', async () => {
      // Arrange
      const notificationInput = {
        workflowId: 'workflow-123',
        recipientId: 'user-456',
        notificationType: 'EMAIL' as const,
        title: 'Workflow Update',
        message: 'Your workflow has been updated',
        priority: 'NORMAL' as const
      };

      const mockNotification = {
        id: 'notification-123',
        ...notificationInput,
        createdAt: new Date()
      };

      (mockPrisma.workflowNotification.create as jest.Mock).mockResolvedValue(mockNotification);

      // Act
      const result = await workflowService.sendNotification(notificationInput);

      // Assert
      expect(result).toEqual(mockNotification);
      expect(mockPrisma.workflowNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: notificationInput.workflowId,
          recipientId: notificationInput.recipientId,
          notificationType: notificationInput.notificationType,
          title: notificationInput.title,
          message: notificationInput.message
        })
      });
    });

    it('should emit notification event after creating notification', async () => {
      // Arrange
      const notificationInput = {
        workflowId: 'workflow-123',
        recipientId: 'user-456',
        notificationType: 'IN_APP' as const,
        title: 'Test Notification',
        message: 'Test message'
      };

      const mockNotification = {
        id: 'notification-123',
        ...notificationInput
      };

      (mockPrisma.workflowNotification.create as jest.Mock).mockResolvedValue(mockNotification);

      const emitSpy = jest.spyOn(workflowService, 'emit');

      // Act
      await workflowService.sendNotification(notificationInput);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith('notificationCreated', {
        notificationId: 'notification-123',
        type: 'IN_APP',
        recipientId: 'user-456'
      });
    });
  });

  describe('Workflow State Validation Tests', () => {
    it('should identify valid state transitions correctly', async () => {
      // Test valid transitions
      expect(workflowService['isValidTransition'](WorkflowState.RESEARCH, WorkflowState.AI_REVIEW)).toBe(true);
      expect(workflowService['isValidTransition'](WorkflowState.AI_REVIEW, WorkflowState.CONTENT_GENERATION)).toBe(true);
      expect(workflowService['isValidTransition'](WorkflowState.HUMAN_APPROVAL, WorkflowState.PUBLISHED)).toBe(true);
      expect(workflowService['isValidTransition'](WorkflowState.HUMAN_APPROVAL, WorkflowState.REJECTED)).toBe(true);
    });

    it('should identify invalid state transitions correctly', async () => {
      // Test invalid transitions - these should still be false
      expect(workflowService['isValidTransition'](WorkflowState.RESEARCH, WorkflowState.PUBLISHED)).toBe(false);
      expect(workflowService['isValidTransition'](WorkflowState.PUBLISHED, WorkflowState.AI_REVIEW)).toBe(false);
      expect(workflowService['isValidTransition'](WorkflowState.FAILED, WorkflowState.RESEARCH)).toBe(false); // FAILED is still terminal
      
      // Test that our new loop-back transitions are now VALID (quality control feature)
      expect(workflowService['isValidTransition'](WorkflowState.REJECTED, WorkflowState.RESEARCH)).toBe(true); // Allow restart
      expect(workflowService['isValidTransition'](WorkflowState.AI_REVIEW_CONTENT, WorkflowState.CONTENT_GENERATION)).toBe(true); // Loop back for fixes
      expect(workflowService['isValidTransition'](WorkflowState.AI_REVIEW_TRANSLATION, WorkflowState.TRANSLATION)).toBe(true); // Loop back for fixes
    });

    it('should identify terminal states correctly', async () => {
      expect(workflowService['isTerminalState'](WorkflowState.PUBLISHED)).toBe(true);
      expect(workflowService['isTerminalState'](WorkflowState.FAILED)).toBe(true); // FAILED is still terminal
      expect(workflowService['isTerminalState'](WorkflowState.REJECTED)).toBe(false); // REJECTED can now restart (quality control)
      expect(workflowService['isTerminalState'](WorkflowState.RESEARCH)).toBe(false);
      expect(workflowService['isTerminalState'](WorkflowState.AI_REVIEW)).toBe(false);
    });
  });
});