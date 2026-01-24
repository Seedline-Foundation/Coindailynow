/**
 * Workflow GraphQL Resolvers - Task 8
 * GraphQL resolvers for Content Workflow Engine
 */

import { WorkflowService, CreateWorkflowInput, TransitionWorkflowInput, WorkflowNotificationInput } from '../services/workflowService';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { GraphQLContext } from './context';

export const workflowResolvers = {
  Query: {
    // Get workflow by ID
    workflow: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        const workflow = await context.prisma.contentWorkflow.findUnique({
          where: { id },
          include: {
            Article: true,
            User: true,
            WorkflowStep: {
              include: {
                User: true
              },
              orderBy: { stepOrder: 'asc' }
            },
            WorkflowTransition: {
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            WorkflowNotification: {
              where: { recipientId: context.user.id },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        // Check permissions - allow if user is author or assigned reviewer
        const canView = workflow.Article.authorId === context.user.id || 
                       workflow.assignedReviewerId === context.user.id;

        if (!canView) {
          throw new ForbiddenError('Access denied');
        }

        return workflow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to fetch workflow', { error: errorMessage, workflowId: id });
        throw error;
      }
    },

    // Get workflows with filtering and pagination
    workflows: async (_: any, args: {
      filter?: {
        currentState?: string;
        priority?: string;
        assignedReviewerId?: string;
        workflowType?: string;
      };
      pagination?: {
        skip?: number;
        take?: number;
      };
    }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        const where: any = {};

        // Add filters
        if (args.filter) {
          if (args.filter.currentState) {
            where.currentState = args.filter.currentState;
          }
          if (args.filter.priority) {
            where.priority = args.filter.priority;
          }
          if (args.filter.assignedReviewerId) {
            where.assignedReviewerId = args.filter.assignedReviewerId;
          }
          if (args.filter.workflowType) {
            where.workflowType = args.filter.workflowType;
          }
        }

        // Add permissions filter
        if (context.user.role !== 'ADMIN' && context.user.role !== 'EDITOR') {
          where.OR = [
            { article: { authorId: context.user.id } },
            { assignedReviewerId: context.user.id }
          ];
        }

        const workflows = await context.prisma.contentWorkflow.findMany({
          where,
          include: {
            Article: {
              select: {
                id: true,
                title: true,
                status: true,
                User: {
                  select: { id: true, username: true, firstName: true, lastName: true }
                }
              }
            },
            User: {
              select: { id: true, username: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: args.pagination?.skip || 0,
          take: Math.min(args.pagination?.take || 20, 100)
        });

        return workflows;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to fetch workflows', { error: errorMessage, args });
        throw error;
      }
    },

    // Get workflow analytics
    workflowAnalytics: async (_: any, args: {
      dateFrom?: string;
      dateTo?: string;
    }, context: GraphQLContext) => {
      if (!context.user || !['ADMIN', 'EDITOR'].includes(context.user.role || '')) {
        throw new ForbiddenError('Admin or Editor access required');
      }

      try {
        const workflowService = new WorkflowService(context.prisma, context.logger);
        
        const dateFrom = args.dateFrom ? new Date(args.dateFrom) : undefined;
        const dateTo = args.dateTo ? new Date(args.dateTo) : undefined;

        const analytics = await workflowService.getWorkflowAnalytics(dateFrom, dateTo);
        return analytics;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to get workflow analytics', { error: errorMessage, args });
        throw error;
      }
    },

    // Get workflow notifications for current user
    workflowNotifications: async (_: any, args: {
      status?: string;
      pagination?: {
        skip?: number;
        take?: number;
      };
    }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        const where: any = {
          recipientId: context.user.id
        };

        if (args.status) {
          where.status = args.status;
        }

        const notifications = await context.prisma.workflowNotification.findMany({
          where,
          include: {
            ContentWorkflow: {
              include: {
                Article: {
                  select: { id: true, title: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: args.pagination?.skip || 0,
          take: Math.min(args.pagination?.take || 20, 100)
        });

        return notifications;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to fetch workflow notifications', { error: errorMessage, args });
        throw error;
      }
    }
  },

  Mutation: {
    // Create new workflow for article
    createWorkflow: async (_: any, { input }: { input: CreateWorkflowInput }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        // Check if user can create workflow for this article
        const article = await context.prisma.article.findUnique({
          where: { id: input.articleId }
        });

        if (!article) {
          throw new UserInputError('Article not found');
        }

        const canCreate = article.authorId === context.user.id || 
                         ['ADMIN', 'EDITOR'].includes(context.user.role || '');

        if (!canCreate) {
          throw new ForbiddenError('Access denied');
        }

        const workflowService = new WorkflowService(context.prisma, context.logger);
        const workflow = await workflowService.createWorkflow(input);

        return workflow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to create workflow', { error: errorMessage, input });
        throw error;
      }
    },

    // Transition workflow to new state
    transitionWorkflow: async (_: any, { input }: { input: TransitionWorkflowInput }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        // Check permissions
        const workflow = await context.prisma.contentWorkflow.findUnique({
          where: { id: input.workflowId },
          include: { Article: true }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        const canTransition = (workflow as any).Article.authorId === context.user.id || 
                             workflow.assignedReviewerId === context.user.id ||
                             ['ADMIN', 'EDITOR'].includes(context.user.role || '');

        if (!canTransition) {
          throw new ForbiddenError('Access denied');
        }

        const workflowService = new WorkflowService(context.prisma, context.logger);
        const updatedWorkflow = await workflowService.transitionWorkflow({
          ...input,
          triggeredBy: context.user.id
        });

        return updatedWorkflow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to transition workflow', { error: errorMessage, input });
        throw error;
      }
    },

    // Approve workflow step (human approval)
    approveWorkflowStep: async (_: any, { 
      workflowId, 
      stepName, 
      feedback, 
      approved 
    }: {
      workflowId: string;
      stepName: string;
      feedback?: string;
      approved: boolean;
    }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        // Check permissions
        const workflow = await context.prisma.contentWorkflow.findUnique({
          where: { id: workflowId },
          include: { Article: true }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        const canApprove = workflow.assignedReviewerId === context.user.id ||
                          ['ADMIN', 'EDITOR'].includes(context.user.role || '');

        if (!canApprove) {
          throw new ForbiddenError('Access denied');
        }

        // Update step with approval
        await context.prisma.workflowStep.updateMany({
          where: {
            workflowId: workflowId,
            stepName: stepName
          },
          data: {
            status: approved ? 'COMPLETED' : 'FAILED',
            completedAt: new Date(),
            humanFeedback: feedback || null,
            assigneeId: context.user.id
          }
        });

        // Transition workflow based on approval
        const workflowService = new WorkflowService(context.prisma, context.logger);
        const nextState = approved ? 'PUBLISHED' : 'REJECTED';
        
        const updatedWorkflow = await workflowService.transitionWorkflow({
          workflowId,
          toState: nextState,
          triggeredBy: context.user.id,
          triggerReason: approved ? `Approved by ${context.user.username}` : `Rejected by ${context.user.username}`,
          metadata: { feedback, approved }
        });

        return updatedWorkflow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to approve workflow step', { 
          error: errorMessage, 
          workflowId, 
          stepName, 
          approved 
        });
        throw error;
      }
    },

    // Send workflow notification
    sendWorkflowNotification: async (_: any, { input }: { input: WorkflowNotificationInput }, context: GraphQLContext) => {
      if (!context.user || !['ADMIN', 'EDITOR'].includes(context.user.role || '')) {
        throw new ForbiddenError('Admin or Editor access required');
      }

      try {
        const workflowService = new WorkflowService(context.prisma, context.logger);
        const notification = await workflowService.sendNotification(input);

        return notification;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to send workflow notification', { error: errorMessage, input });
        throw error;
      }
    },

    // Mark notification as read
    markNotificationRead: async (_: any, { notificationId }: { notificationId: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        const notification = await context.prisma.workflowNotification.findUnique({
          where: { id: notificationId }
        });

        if (!notification) {
          throw new UserInputError('Notification not found');
        }

        if (notification.recipientId !== context.user.id) {
          throw new ForbiddenError('Access denied');
        }

        const updatedNotification = await context.prisma.workflowNotification.update({
          where: { id: notificationId },
          data: {
            status: 'READ',
            readAt: new Date()
          }
        });

        return updatedNotification;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to mark notification as read', { error: errorMessage, notificationId });
        throw error;
      }
    }
  },

  // Field resolvers
  ContentWorkflow: {
    completionPercentageCalculated: (workflow: any) => {
      const stateProgress: Record<string, number> = {
        'RESEARCH': 20,
        'AI_REVIEW': 40,
        'CONTENT_GENERATION': 60,
        'TRANSLATION': 80,
        'HUMAN_APPROVAL': 90,
        'PUBLISHED': 100,
        'REJECTED': 100,
        'FAILED': 0
      };
      return stateProgress[workflow.currentState] || 0;
    },

    isOverdue: (workflow: any) => {
      if (!workflow.estimatedCompletionAt || workflow.actualCompletionAt) {
        return false;
      }
      return new Date() > workflow.estimatedCompletionAt;
    },

    totalSteps: (workflow: any) => {
      return workflow.steps?.length || 0;
    },

    completedSteps: (workflow: any) => {
      return workflow.steps?.filter((step: any) => step.status === 'COMPLETED').length || 0;
    }
  },

  WorkflowStep: {
    isOverdue: (step: any) => {
      if (!step.startedAt || step.completedAt || !step.estimatedDurationMs) {
        return false;
      }
      const expectedCompletionTime = new Date(step.startedAt.getTime() + step.estimatedDurationMs);
      return new Date() > expectedCompletionTime;
    },

    actualDurationFormatted: (step: any) => {
      if (!step.actualDurationMs) return null;
      
      const minutes = Math.floor(step.actualDurationMs / 60000);
      const seconds = Math.floor((step.actualDurationMs % 60000) / 1000);
      
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    }
  },

  WorkflowNotification: {
    isUnread: (notification: any) => {
      return notification.status === 'PENDING' || notification.status === 'SENT' || notification.status === 'DELIVERED';
    }
  }
};