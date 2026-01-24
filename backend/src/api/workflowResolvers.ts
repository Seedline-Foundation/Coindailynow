/**
 * Workflow GraphQL Resolvers - Task 8 (Fixed)
 * GraphQL resolvers for Content Workflow Engine
 */

import { WorkflowService } from '../services/workflowService';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { GraphQLContext } from './context';

// Input types for GraphQL operations
interface CreateWorkflowInput {
  articleId: string;
  workflowType?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedReviewerId?: string;
  metadata?: Record<string, any>;
}

interface TransitionWorkflowInput {
  workflowId: string;
  toState: string;
  triggerReason?: string;
  metadata?: Record<string, any>;
}

interface WorkflowNotificationInput {
  workflowId: string;
  recipientId: string;
  notificationType: 'EMAIL' | 'IN_APP' | 'SMS' | 'SLACK';
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// Helper function to check if user has admin-like privileges
const isPrivilegedUser = (user: any): boolean => {
  return user.subscriptionTier === 'ENTERPRISE' || user.subscriptionTier === 'PREMIUM';
};

export const workflowResolvers = {
  Query: {
    // Get single workflow by ID
    workflow: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new AuthenticationError('Authentication required');
      }

      try {
        const workflow = await context.prisma.contentWorkflow.findUnique({
          where: { id },
          include: {
            Article: {
              select: {
                id: true,
                title: true,
                status: true,
                authorId: true,
                User: {
                  select: { id: true, username: true, firstName: true, lastName: true }
                }
              }
            },
            User: {
              select: { id: true, username: true, firstName: true, lastName: true }
            },
            WorkflowStep: {
              include: {
                User: {
                  select: { id: true, username: true, firstName: true, lastName: true }
                }
              },
              orderBy: { stepOrder: 'asc' }
            },
            WorkflowTransition: {
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        // Check permissions
        const hasAccess = (workflow as any).Article.authorId === context.user.id || 
                         workflow.assignedReviewerId === context.user.id ||
                         isPrivilegedUser(context.user);

        if (!hasAccess) {
          throw new ForbiddenError('Access denied');
        }

        return workflow;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.error('Failed to fetch workflow', { error: errorMessage, id });
        throw error;
      }
    },

    // Get workflows with filtering and pagination
    workflows: async (_: any, args: {
      status?: string;
      workflowType?: string;
      articleId?: string;
      assignedReviewerId?: string;
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

        if (args.status) {
          where.currentState = args.status;
        }

        if (args.workflowType) {
          where.workflowType = args.workflowType;
        }

        if (args.articleId) {
          where.articleId = args.articleId;
        }

        if (args.assignedReviewerId) {
          where.assignedReviewerId = args.assignedReviewerId;
        }

        // Filter to only workflows user has access to (unless privileged user)
        if (!isPrivilegedUser(context.user)) {
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
                authorId: true,
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
      if (!context.user || !isPrivilegedUser(context.user)) {
        throw new ForbiddenError('Premium or Enterprise access required for analytics');
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
          where: { id: input.articleId },
          select: { id: true, authorId: true }
        });

        if (!article) {
          throw new UserInputError('Article not found');
        }

        const canCreate = article.authorId === context.user.id || 
                         isPrivilegedUser(context.user);

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
          include: { 
            Article: { select: { id: true, authorId: true } }
          }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        const canTransition = workflow.Article.authorId === context.user.id || 
                             workflow.assignedReviewerId === context.user.id ||
                             isPrivilegedUser(context.user);

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
          include: { 
            Article: { select: { id: true, authorId: true } }
          }
        });

        if (!workflow) {
          throw new UserInputError('Workflow not found');
        }

        const canApprove = workflow.assignedReviewerId === context.user.id ||
                          isPrivilegedUser(context.user);

        if (!canApprove) {
          throw new ForbiddenError('Access denied');
        }

        // Update step with approval
        const updateData: any = {
          status: approved ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          assigneeId: context.user.id
        };
        
        if (feedback !== undefined) {
          updateData.humanFeedback = feedback;
        }

        await context.prisma.workflowStep.updateMany({
          where: {
            workflowId: workflowId,
            stepName: stepName
          },
          data: updateData
        });

        // Transition workflow based on approval
        const workflowService = new WorkflowService(context.prisma, context.logger);
        const nextState = approved ? 'PUBLISHED' : 'REJECTED';
        
        const updatedWorkflow = await workflowService.transitionWorkflow({
          workflowId,
          toState: nextState,
          triggeredBy: context.user.id,
          triggerReason: approved ? `Approved by ${context.user.username || 'user'}` : `Rejected by ${context.user.username || 'user'}`,
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
      if (!context.user || !isPrivilegedUser(context.user)) {
        throw new ForbiddenError('Premium or Enterprise access required');
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
          where: { id: notificationId },
          select: { id: true, recipientId: true }
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

  // Field resolvers for computed fields
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