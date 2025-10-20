import { PrismaClient } from '@prisma/client';
import AIModerationService from '../services/aiModerationService';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../config/pubsub';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const moderationService = new AIModerationService(
  prisma,
  redis,
  process.env.PERSPECTIVE_API_KEY || ''
);

// Helper functions
const requireAuth = (user: any) => {
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }
  return user;
};

const requireSuperAdmin = (user: any) => {
  requireAuth(user);
  if (user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Super admin access required');
  }
  return user;
};

const requireAdminOrSuperAdmin = (user: any) => {
  requireAuth(user);
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new ForbiddenError('Admin access required');
  }
  return user;
};

export const moderationResolvers = {
  Query: {
    // Moderation Queue
    getModerationQueue: async (_: any, { filters }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const violations = await prisma.violationReport.findMany({
        where: {
          ...(filters?.status && { status: filters.status }),
          ...(filters?.violationType && { violationType: filters.violationType }),
          ...(filters?.severity && { severity: filters.severity }),
          ...(filters?.userId && { userId: filters.userId }),
          ...(filters?.humanReview !== undefined && { humanReview: filters.humanReview }),
          ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
          ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              subscriptionTier: true,
              createdAt: true,
            },
          },
          UserPenalty: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: ((filters?.page || 1) - 1) * (filters?.limit || 20),
      });

      return Promise.all(
        violations.map(async (violation) => {
          const reputation = await moderationService.getUserReputation(violation.userId);
          const recentViolations = await prisma.violationReport.findMany({
            where: {
              userId: violation.userId,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          });

          return {
            id: violation.id,
            violation,
            priority: moderationService.calculatePriority(violation.userId, violation.severity),
            timeInQueue: Date.now() - violation.createdAt.getTime(),
            userContext: {
              user: violation.User,
              reputation,
              recentViolations,
              activePenalties: violation.UserPenalty,
              riskLevel: reputation?.riskLevel || 'UNKNOWN',
              trustLevel: reputation?.trustLevel || 'UNKNOWN',
            },
          };
        })
      );
    },

    getViolation: async (_: any, { id }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await prisma.violationReport.findUnique({
        where: { id },
        include: {
          User: true,
          UserPenalty: true,
          falsePositives: {
            include: {
              reportedByUser: true,
            },
          },
          reviewer: true,
        },
      });
    },

    getModerationMetrics: async (_: any, { timeframe }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const metrics = await moderationService.getModerationMetrics();
      
      // Calculate additional metrics based on timeframe
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 1;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [
        violationsByType,
        violationsBySeverity,
        dailyTrends,
      ] = await Promise.all([
        prisma.violationReport.groupBy({
          by: ['violationType'],
          _count: { violationType: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.violationReport.groupBy({
          by: ['severity'],
          _count: { severity: true },
          where: { createdAt: { gte: startDate } },
        }),
        moderationService.getDailyTrends(days),
      ]);

      return {
        ...metrics,
        violationsByType: violationsByType.map(item => ({
          type: item.violationType,
          count: item._count.violationType,
        })),
        violationsBySeverity: violationsBySeverity.map(item => ({
          severity: item.severity,
          count: item._count.severity,
        })),
        recentTrends: {
          daily: dailyTrends,
          weekly: await moderationService.getWeeklyTrends(4),
          monthly: await moderationService.getMonthlyTrends(12),
        },
      };
    },

    getModerationAlerts: async (_: any, { page, limit }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await prisma.moderationAlert.findMany({
        include: {
          user: true,
          violation: true,
        },
        orderBy: [
          { isRead: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: (page - 1) * limit,
      });
    },

    // User Management
    getUserViolations: async (_: any, { userId, page, limit }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await moderationService.getUserViolations(userId, limit);
    },

    getUserPenalties: async (_: any, { userId, status }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await prisma.userPenalty.findMany({
        where: {
          userId,
          ...(status && { status }),
        },
        include: {
          appliedByUser: true,
          violation: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    },

    getUserReputation: async (_: any, { userId }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await moderationService.getUserReputation(userId);
    },

    // Settings & Configuration
    getModerationSettings: async (_: any, __: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await prisma.moderationSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    },

    getSystemHealth: async (_: any, __: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      try {
        // Check database connectivity
        await prisma.$queryRaw`SELECT 1`;
        
        // Check Redis connectivity
        await redis.ping();

        const [
          pendingViolations,
          activePenalties,
          recentViolations,
        ] = await Promise.all([
          prisma.violationReport.count({ where: { status: 'PENDING' } }),
          prisma.userPenalty.count({ where: { status: 'ACTIVE' } }),
          prisma.violationReport.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
              },
            },
          }),
        ]);

        return {
          status: 'healthy',
          database: 'connected',
          redis: 'connected',
          pendingViolations,
          activePenalties,
          recentActivity: recentViolations,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        };
      }
    },

    // Content Moderation
    moderateContent: async (_: any, { input }: any, { user }: any) => {
      requireAuth(user);

      const result = await moderationService.moderateContent(input);
      return result;
    },

    // Analytics
    getModerationTrends: async (_: any, { timeframe }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30;

      return {
        daily: await moderationService.getDailyTrends(days),
        weekly: await moderationService.getWeeklyTrends(Math.ceil(days / 7)),
        monthly: await moderationService.getMonthlyTrends(Math.ceil(days / 30)),
      };
    },

    getViolationAnalytics: async (_: any, { type, severity }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const where: any = {};
      if (type) where.violationType = type;
      if (severity) where.severity = severity;

      const [total, confirmed, falsePositives] = await Promise.all([
        prisma.violationReport.count({ where }),
        prisma.violationReport.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.violationReport.count({ where: { ...where, status: 'FALSE_POSITIVE' } }),
      ]);

      return {
        total,
        confirmed,
        falsePositives,
        accuracy: total > 0 ? (confirmed / total) * 100 : 0,
        falsePositiveRate: total > 0 ? (falsePositives / total) * 100 : 0,
      };
    },
  },

  Mutation: {
    // Violation Review
    confirmViolation: async (_: any, { input }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const result = await moderationService.confirmViolation(input.violationId, user.id, input.notes);

      // Publish subscription update
      pubsub.publish('QUEUE_UPDATED', { queueUpdated: result });
      
      return result;
    },

    markFalsePositive: async (_: any, { input }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      const result = await moderationService.markFalsePositive(
        input.violationId,
        user.id,
        input.reason,
        input.notes
      );

      return result;
    },

    appealViolation: async (_: any, { violationId, reason }: any, { user }: any) => {
      requireAuth(user);

      return await moderationService.appealViolation(violationId, user.id, reason);
    },

    // Penalty Management
    applyPenalty: async (_: any, { userId, penalty }: any, { user }: any) => {
      requireSuperAdmin(user);

      const result = await moderationService.applyPenalty(userId, penalty, user.id);

      // Publish subscription update
      pubsub.publish('USER_PENALTY_APPLIED', { 
        userPenaltyApplied: result,
        userId 
      });

      return result;
    },

    revokePenalty: async (_: any, { penaltyId, reason }: any, { user }: any) => {
      requireSuperAdmin(user);

      return await moderationService.revokePenalty(penaltyId, user.id, reason);
    },

    adjustPenalty: async (_: any, { penaltyId, penalty }: any, { user }: any) => {
      requireSuperAdmin(user);

      return await moderationService.adjustPenalty(penaltyId, penalty, user.id);
    },

    // User Management
    banUser: async (_: any, { userId, penalty }: any, { user }: any) => {
      requireSuperAdmin(user);

      const result = await moderationService.banUser(userId, penalty, user.id);

      // Publish subscription update
      pubsub.publish('USER_PENALTY_APPLIED', { 
        userPenaltyApplied: result,
        userId 
      });

      return result;
    },

    unbanUser: async (_: any, { userId, reason }: any, { user }: any) => {
      requireSuperAdmin(user);

      return await moderationService.unbanUser(userId, user.id, reason);
    },

    updateUserReputation: async (_: any, { userId, score }: any, { user }: any) => {
      requireSuperAdmin(user);

      const result = await moderationService.updateUserReputation(userId, score);

      // Publish subscription update
      pubsub.publish('USER_REPUTATION_CHANGED', { 
        userReputationChanged: result,
        userId 
      });

      return result;
    },

    // Settings
    updateModerationSettings: async (_: any, { input }: any, { user }: any) => {
      requireSuperAdmin(user);

      const result = await moderationService.updateModerationSettings(input);

      // Publish subscription update
      pubsub.publish('SETTINGS_UPDATED', { settingsUpdated: result });

      return result;
    },

    // Bulk Actions
    performBulkAction: async (_: any, { action }: any, { user }: any) => {
      requireSuperAdmin(user);

      const results = [];
      
      for (const violationId of action.violationIds) {
        try {
          let result;
          switch (action.action) {
            case 'CONFIRM':
              result = await moderationService.confirmViolation(violationId, user.id, action.notes);
              break;
            case 'FALSE_POSITIVE':
              result = await moderationService.markFalsePositive(violationId, user.id, action.reason, action.notes);
              break;
            default:
              throw new UserInputError(`Unknown action: ${action.action}`);
          }
          results.push(result);
        } catch (error) {
          console.error(`Bulk action failed for violation ${violationId}:`, error);
        }
      }

      return results;
    },

    // Alerts
    markAlertRead: async (_: any, { alertId }: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      return await prisma.moderationAlert.update({
        where: { id: alertId },
        data: { 
          isRead: true,
          readAt: new Date(),
        },
        include: {
          user: true,
          violation: true,
        },
      });
    },

    markAllAlertsRead: async (_: any, __: any, { user }: any) => {
      requireAdminOrSuperAdmin(user);

      await prisma.moderationAlert.updateMany({
        where: { isRead: false },
        data: { 
          isRead: true,
          readAt: new Date(),
        },
      });

      return true;
    },

    // System
    clearModerationCache: async (_: any, __: any, { user }: any) => {
      requireSuperAdmin(user);

      const keys = await redis.keys('moderation:*');
      const settingsKeys = await redis.keys('user_priority:*');
      const allKeys = [...keys, ...settingsKeys, 'moderation_settings'];

      if (allKeys.length > 0) {
        await redis.del(...allKeys);
      }

      return true;
    },

    triggerSystemHealthCheck: async (_: any, __: any, { user }: any) => {
      requireSuperAdmin(user);

      // Perform comprehensive health check
      const health = await moderationResolvers.Query.getSystemHealth(null, null, { user });

      // Publish system health update
      pubsub.publish('SYSTEM_HEALTH_CHANGED', { systemHealthChanged: health });

      return health;
    },
  },

  Subscription: {
    // Real-time Moderation Updates
    violationDetected: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('VIOLATION_DETECTED'),
        (payload, variables, context) => {
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },

    moderationAlert: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('MODERATION_ALERT'),
        (payload, variables, context) => {
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },

    queueUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('QUEUE_UPDATED'),
        (payload, variables, context) => {
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },

    // User Activity
    userPenaltyApplied: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('USER_PENALTY_APPLIED'),
        (payload, variables, context) => {
          // Filter by userId if specified
          if (variables.userId) {
            return payload.userId === variables.userId;
          }
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },

    userReputationChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('USER_REPUTATION_CHANGED'),
        (payload, variables, context) => {
          // Filter by userId if specified
          if (variables.userId) {
            return payload.userId === variables.userId;
          }
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },

    // System Events
    systemHealthChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('SYSTEM_HEALTH_CHANGED'),
        (payload, variables, context) => {
          // Only send to super admins
          return context.user && context.user.role === 'SUPER_ADMIN';
        }
      ),
    },

    settingsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('SETTINGS_UPDATED'),
        (payload, variables, context) => {
          // Only send to super admins
          return context.user && context.user.role === 'SUPER_ADMIN';
        }
      ),
    },

    // Analytics Updates
    metricsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('METRICS_UPDATED'),
        (payload, variables, context) => {
          // Only send to admins and super admins
          return context.user && ['ADMIN', 'SUPER_ADMIN'].includes(context.user.role);
        }
      ),
    },
  },

  // Field Resolvers
  ViolationReport: {
    user: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    penalties: async (parent: any) => {
      return await prisma.userPenalty.findMany({
        where: { violationId: parent.id },
        include: { appliedByUser: true },
      });
    },
    falsePositives: async (parent: any) => {
      return await prisma.falsePositive.findMany({
        where: { violationId: parent.id },
        include: { reportedByUser: true },
      });
    },
    reviewer: async (parent: any) => {
      if (!parent.reviewedBy) return null;
      return await prisma.user.findUnique({
        where: { id: parent.reviewedBy },
      });
    },
  },

  UserPenalty: {
    user: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    appliedByUser: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.appliedBy },
      });
    },
    violation: async (parent: any) => {
      if (!parent.violationId) return null;
      return await prisma.violationReport.findUnique({
        where: { id: parent.violationId },
      });
    },
  },

  UserReputation: {
    user: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },

  FalsePositive: {
    violation: async (parent: any) => {
      return await prisma.violationReport.findUnique({
        where: { id: parent.violationId },
      });
    },
    reportedByUser: async (parent: any) => {
      return await prisma.user.findUnique({
        where: { id: parent.reportedBy },
      });
    },
  },

  ModerationAlert: {
    user: async (parent: any) => {
      if (!parent.userId) return null;
      return await prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
    violation: async (parent: any) => {
      if (!parent.violationId) return null;
      return await prisma.violationReport.findUnique({
        where: { id: parent.violationId },
      });
    },
  },
};

export default moderationResolvers;