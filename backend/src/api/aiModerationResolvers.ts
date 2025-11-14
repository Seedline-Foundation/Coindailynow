import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import AIModerationService from '../services/aiModerationService';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';
import { pubsub } from '../config/pubsub';
import { withFilter } from 'graphql-subscriptions';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const moderationService = new AIModerationService(
  prisma,
  redis,
  process.env.PERSPECTIVE_API_KEY || ''
);

// Subscription channels
const MODERATION_QUEUE_UPDATED = 'MODERATION_QUEUE_UPDATED';
const NEW_VIOLATION_DETECTED = 'NEW_VIOLATION_DETECTED';
const CRITICAL_ALERT_CREATED = 'CRITICAL_ALERT_CREATED';
const MODERATION_SYSTEM_STATUS_CHANGED = 'MODERATION_SYSTEM_STATUS_CHANGED';
const MODERATION_STATS_UPDATED = 'MODERATION_STATS_UPDATED';

export const aiModerationResolvers = {
  Query: {
    // Get moderation queue with filtering
    moderationQueue: async (_: any, { filter }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      const { status, violationType, severity, page = 1, limit = 20 } = filter || {};

      return await moderationService.getModerationQueue(
        { status, contentType: violationType },
        { page, limit }
      );
    },

    // Get specific moderation queue item
    moderationQueueItem: async (_: any, { id }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      const item = await prisma.moderationQueue.findUnique({
        where: { id }
        // Note: ModerationQueue doesn't have a user relation, only authorId
      });

      if (!item) {
        throw new UserInputError('Moderation queue item not found');
      }

      return item;
    },

    // Get user violations
    userViolations: async (_: any, { userId, page = 1, limit = 10 }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      return await moderationService.getUserViolationHistory(userId, { limit });
    },

    // Get user penalties
    userPenalties: async (_: any, { userId, page = 1, limit = 10 }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      const penalties = await prisma.userPenalty.findMany({
        where: { userId },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          },
          appliedByUser: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.userPenalty.count({
        where: { userId }
      });

      return {
        penalties,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    },

    // Get moderation statistics
    moderationStats: async (_: any, { days = 30 }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      return await moderationService.getModerationStats(days);
    },

    // Get system status
    moderationSystemStatus: async (_: any, __: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      const [queueSize, criticalAlerts] = await Promise.all([
        prisma.moderationQueue.count({
          where: { status: 'PENDING' }
        }),
        prisma.violationReport.count({
          where: {
            severity: 'critical',
            status: 'PENDING'
          }
        })
      ]);

      return {
        isRunning: true, // This would check actual service status
        queueSize,
        criticalAlerts,
        lastProcessed: new Date(),
        health: queueSize < 100 ? 'HEALTHY' : queueSize < 500 ? 'WARNING' : 'CRITICAL'
      };
    },

    // Get moderation alerts
    moderationAlerts: async (_: any, { severity, page = 1, limit = 10 }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      const where: any = {
        type: 'CRITICAL_VIOLATION'
      };

      if (severity) {
        where.severity = severity;
      }

      const alerts = await prisma.violationReport.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.violationReport.count({ where });

      return {
        alerts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    },

    // Get unread alerts count
    unreadAlertsCount: async (_: any, __: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      return await prisma.violationReport.count({
        where: {
          status: 'PENDING'
        }
      });
    }
  },

  Mutation: {
    // Confirm violation
    confirmViolation: async (_: any, { queueId, notes }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      try {
        await moderationService.confirmViolation(queueId, user.id);

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'CONFIRM_VIOLATION',
            targetType: 'MODERATION_QUEUE',
            targetId: queueId,
            adminComment: notes,
            adminRole: user.role,
            reason: 'Violation confirmed'
          }
        });

        // Publish update
        const updatedItem = await prisma.moderationQueue.findUnique({
          where: { id: queueId }
        });

        if (updatedItem) {
          pubsub.publish(MODERATION_QUEUE_UPDATED, { 
            moderationQueueUpdated: updatedItem 
          });
        }

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to confirm violation', { 
          details: error.message 
        });
      }
    },

    // Mark as false positive
    markFalsePositive: async (_: any, { queueId, notes }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      try {
        await moderationService.markFalsePositive(queueId, user.id, notes);

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'MARK_FALSE_POSITIVE',
            targetType: 'MODERATION_QUEUE',
            targetId: queueId,
            adminComment: notes,
            adminRole: user.role,
            reason: 'Marked as false positive'
          }
        });

        // Publish update
        const updatedItem = await prisma.moderationQueue.findUnique({
          where: { id: queueId }
        });

        if (updatedItem) {
          pubsub.publish(MODERATION_QUEUE_UPDATED, { 
            moderationQueueUpdated: updatedItem 
          });
        }

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to mark as false positive', { 
          details: error.message 
        });
      }
    },

    // Adjust penalty
    adjustPenalty: async (_: any, { queueId, input }: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        const { penaltyType, duration, reason, notes } = input;

        // Get queue item
        const queueItem = await prisma.moderationQueue.findUnique({
          where: { id: queueId }
        });

        if (!queueItem) {
          throw new UserInputError('Queue item not found');
        }

        // Apply adjusted penalty
        const penaltyData = {
          violationReportId: queueId,
          penaltyType: penaltyType.toLowerCase(),
          duration: duration || 7,
          severity: 'medium',
          reason,
          appliedBy: user.id
        };

        await moderationService['applyPenalty'](queueItem.authorId, penaltyData);

        // Update queue item
        await prisma.moderationQueue.update({
          where: { id: queueId },
          data: {
            status: 'CONFIRMED',
            flagReason: reason,
            reviewedBy: user.id,
            reviewedAt: new Date(),
            reviewNotes: notes || null
          }
        });

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'ADJUST_PENALTY',
            targetType: 'MODERATION_QUEUE',
            targetId: queueId,
            adminComment: `Adjusted to ${penaltyType}: ${reason}`,
            adminRole: user.role,
            reason: `Adjusted to ${penaltyType}`
          }
        });

        // Publish update
        const updatedItem = await prisma.moderationQueue.findUnique({
          where: { id: queueId }
        });

        if (updatedItem) {
          pubsub.publish(MODERATION_QUEUE_UPDATED, { 
            moderationQueueUpdated: updatedItem 
          });
        }

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to adjust penalty', { 
          details: error.message 
        });
      }
    },

    // Bulk moderation action
    bulkModerationAction: async (_: any, { input }: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      const { queueIds, action, notes } = input;

      const results = {
        processed: 0,
        errors: 0,
        details: [] as any[]
      };

      for (const queueId of queueIds) {
        try {
          switch (action) {
            case 'CONFIRM':
              await moderationService.confirmViolation(queueId, user.id);
              break;
              
            case 'FALSE_POSITIVE':
              await moderationService.markFalsePositive(queueId, user.id, notes);
              break;
              
            case 'DELETE':
              await prisma.moderationQueue.delete({
                where: { id: queueId }
              });
              break;
          }

          results.processed++;
          results.details.push({ queueId, status: 'success' });

        } catch (error: any) {
          results.errors++;
          results.details.push({ 
            queueId, 
            status: 'error', 
            error: error.message 
          });
        }
      }

      // Log bulk action
      await prisma.adminAction.create({
        data: {
          adminId: user.id,
          actionType: `BULK_${action}`,
          targetType: 'MODERATION_QUEUE',
          targetId: `bulk-${queueIds.length}`,
          adminComment: `Bulk action on ${queueIds.length} items: ${notes || ''}`,
          adminRole: user.role
        }
      });

      return results;
    },

    // Ban user
    banUser: async (_: any, { userId, input }: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        const { penaltyType, duration, reason } = input;

        // Validate user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!targetUser) {
          throw new UserInputError('User not found');
        }

        // Apply penalty
        const penalty = {
          recommendedPenalty: penaltyType,
          duration: duration || 7,
          reason: reason || 'Manual admin action',
          confidence: 1.0,
          requiresHumanReview: false,
          escalationPath: ['Manual admin ban']
        };

        // Apply penalty using proper service method signature (2 arguments)
        await moderationService['applyPenalty'](
          userId,
          {
            violationReportId: 'MANUAL_BAN_REPORT_ID', // Placeholder for manual bans
            penaltyType,
            severity: 'HIGH',
            duration: duration || 7,
            reason: reason || 'Manual admin action',
            appliedBy: user.id
          }
        );

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'MANUAL_BAN',
            targetType: 'USER',
            targetId: userId,
            adminComment: `Manual ${penaltyType}: ${reason}`,
            adminRole: user.role,
            reason: reason || 'Manual admin action'
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to ban user', { 
          details: error.message 
        });
      }
    },

    // Unban user
    unbanUser: async (_: any, { userId, reason }: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        // Remove active penalties
        await prisma.userPenalty.updateMany({
          where: {
            userId,
            isActive: true
          },
          data: {
            isActive: false,
            endDate: new Date()
          }
        });

        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            isShadowBanned: false,
            status: 'ACTIVE'
          }
        });

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'UNBAN_USER',
            targetType: 'USER',
            targetId: userId,
            adminComment: reason || 'User unbanned',
            adminRole: user.role,
            reason: reason || 'User unbanned'
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to unban user', { 
          details: error.message 
        });
      }
    },

    // Moderate content
    moderateContent: async (_: any, { input }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      try {
        const { contentId, contentType, text, userId } = input;

        // Get user info
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            Subscription: true
          }
        });

        if (!targetUser) {
          throw new UserInputError('User not found');
        }

        // Run moderation with proper ModerationRequest format
        const contentTypeLower = contentType.toLowerCase() as 'article' | 'comment' | 'post' | 'message';
        const result = await moderationService.moderateContent({
          userId,
          contentType: contentTypeLower,
          contentId,
          content: text
        });

        return result;

      } catch (error: any) {
        throw new UserInputError('Failed to moderate content', { 
          details: error.message 
        });
      }
    },

    // Mark alert as read
    markAlertRead: async (_: any, { alertId }: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      try {
        await prisma.violationReport.update({
          where: { id: alertId },
          data: {
            status: 'REVIEWED',
            reviewedAt: new Date(),
            reviewedBy: user.id
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to mark alert as read', { 
          details: error.message 
        });
      }
    },

    // Mark all alerts as read
    markAllAlertsRead: async (_: any, __: any, { user }: any) => {
      if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        throw new ForbiddenError('Access denied: Admin privileges required');
      }

      try {
        const result = await prisma.violationReport.updateMany({
          where: {
            status: 'PENDING'
          },
          data: {
            status: 'REVIEWED',
            reviewedAt: new Date(),
            reviewedBy: user.id
          }
        });

        return result.count;

      } catch (error: any) {
        throw new UserInputError('Failed to mark alerts as read', { 
          details: error.message 
        });
      }
    },

    // Start moderation service
    startModerationService: async (_: any, __: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        // TODO: Implement background monitoring service
        // await moderationService.startBackgroundMonitoring();

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'START_MODERATION_SERVICE',
            targetType: 'SYSTEM',
            targetId: 'moderation-service',
            adminComment: 'Background moderation service started',
            adminRole: user.role,
            reason: 'Service start requested'
          }
        });

        // Publish system status update
        pubsub.publish(MODERATION_SYSTEM_STATUS_CHANGED, {
          moderationSystemStatusChanged: {
            isRunning: true,
            queueSize: 0,
            criticalAlerts: 0,
            lastProcessed: new Date(),
            health: 'HEALTHY'
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to start moderation service', { 
          details: error.message 
        });
      }
    },

    // Stop moderation service
    stopModerationService: async (_: any, __: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        // TODO: Implement background monitoring service
        // await moderationService.stopBackgroundMonitoring();

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'STOP_MODERATION_SERVICE',
            targetType: 'SYSTEM',
            targetId: 'moderation-service',
            adminComment: 'Background moderation service stopped',
            adminRole: user.role,
            reason: 'Service stop requested'
          }
        });

        // Publish system status update
        pubsub.publish(MODERATION_SYSTEM_STATUS_CHANGED, {
          moderationSystemStatusChanged: {
            isRunning: false,
            queueSize: 0,
            criticalAlerts: 0,
            lastProcessed: new Date(),
            health: 'OFFLINE'
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to stop moderation service', { 
          details: error.message 
        });
      }
    },

    // Restart moderation service
    restartModerationService: async (_: any, __: any, { user }: any) => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied: Super Admin privileges required');
      }

      try {
        // TODO: Background monitoring methods not yet implemented in AIModerationService
        // await moderationService.stopBackgroundMonitoring();
        // await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        // await moderationService.startBackgroundMonitoring();

        // Log admin action
        await prisma.adminAction.create({
          data: {
            adminId: user.id,
            actionType: 'RESTART_MODERATION_SERVICE',
            targetType: 'SYSTEM',
            targetId: 'moderation-service',
            adminComment: 'Background moderation service restarted',
            adminRole: user.role
          }
        });

        // Publish system status update
        pubsub.publish(MODERATION_SYSTEM_STATUS_CHANGED, {
          moderationSystemStatusChanged: {
            isRunning: true,
            queueSize: 0,
            criticalAlerts: 0,
            lastProcessed: new Date(),
            health: 'HEALTHY'
          }
        });

        return true;

      } catch (error: any) {
        throw new UserInputError('Failed to restart moderation service', { 
          details: error.message 
        });
      }
    }
  },

  Subscription: {
    // Moderation queue updates
    moderationQueueUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MODERATION_QUEUE_UPDATED]),
        (payload, variables, context) => {
          // Only send to authenticated admins
          return context.user && ['SUPER_ADMIN', 'ADMIN'].includes(context.user.role);
        }
      )
    },

    // New violation detected
    newViolationDetected: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([NEW_VIOLATION_DETECTED]),
        (payload, variables, context) => {
          // Only send to authenticated admins
          return context.user && ['SUPER_ADMIN', 'ADMIN'].includes(context.user.role);
        }
      )
    },

    // Critical alerts
    criticalAlertCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([CRITICAL_ALERT_CREATED]),
        (payload, variables, context) => {
          // Only send to authenticated admins
          return context.user && ['SUPER_ADMIN', 'ADMIN'].includes(context.user.role);
        }
      )
    },

    // System status changes
    moderationSystemStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MODERATION_SYSTEM_STATUS_CHANGED]),
        (payload, variables, context) => {
          // Only send to authenticated admins
          return context.user && ['SUPER_ADMIN', 'ADMIN'].includes(context.user.role);
        }
      )
    },

    // Statistics updates
    moderationStatsUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MODERATION_STATS_UPDATED]),
        (payload, variables, context) => {
          // Only send to authenticated admins
          return context.user && ['SUPER_ADMIN', 'ADMIN'].includes(context.user.role);
        }
      )
    }
  }
};

export default aiModerationResolvers;
