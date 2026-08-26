import { pubsub } from '../../config/pubsub';
import { withFilter } from 'graphql-subscriptions';
import prismaClient from '../../lib/prisma';
import { getRedis } from '../../lib/redis';
import AIModerationService from '../../services/aiModerationService';

const redis = getRedis();
const moderationService = new AIModerationService(
  prismaClient,
  redis as any,
  process.env.PERSPECTIVE_API_KEY || ''
);

// Subscription Channels
const VIOLATION_DETECTED = 'VIOLATION_DETECTED';
const MODERATION_ALERT = 'MODERATION_ALERT';
const QUEUE_UPDATED = 'QUEUE_UPDATED';
const USER_PENALTY_APPLIED = 'USER_PENALTY_APPLIED';
const USER_REPUTATION_CHANGED = 'USER_REPUTATION_CHANGED';
const SYSTEM_HEALTH_CHANGED = 'SYSTEM_HEALTH_CHANGED';
const SETTINGS_UPDATED = 'SETTINGS_UPDATED';
const METRICS_UPDATED = 'METRICS_UPDATED';

// Enum Conversion Helpers
const mapViolationTypeToGql = (type: string): string => {
  if (!type) return 'TOXICITY';
  const upper = type.toUpperCase().replace(/\s+/g, '_');
  const mapping: Record<string, string> = {
    RELIGIOUS: 'RELIGIOUS_CONTENT',
    RELIGIOUS_CONTENT: 'RELIGIOUS_CONTENT',
    HATE_SPEECH: 'HATE_SPEECH',
    HARASSMENT: 'HARASSMENT',
    SEXUAL: 'SEXUAL_CONTENT',
    SEXUAL_CONTENT: 'SEXUAL_CONTENT',
    SPAM: 'SPAM',
    TOXICITY: 'TOXICITY',
    PROFANITY: 'PROFANITY',
    THREATS: 'THREATS',
    SELF_HARM: 'SELF_HARM',
    PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
    IMPERSONATION: 'IMPERSONATION',
    COPYRIGHT_VIOLATION: 'COPYRIGHT_VIOLATION',
    MISINFORMATION: 'MISINFORMATION',
    CLICKBAIT: 'CLICKBAIT',
  };
  return mapping[upper] || 'TOXICITY';
};

const mapViolationTypeToDb = (gqlType: string): string => {
  if (!gqlType) return 'other';
  const mapping: Record<string, string> = {
    RELIGIOUS_CONTENT: 'religious',
    HATE_SPEECH: 'hate_speech',
    HARASSMENT: 'harassment',
    SEXUAL_CONTENT: 'sexual',
    SPAM: 'spam',
    TOXICITY: 'other',
    PROFANITY: 'other',
    THREATS: 'other',
    SELF_HARM: 'other',
    PRIVACY_VIOLATION: 'other',
    IMPERSONATION: 'other',
    COPYRIGHT_VIOLATION: 'other',
    MISINFORMATION: 'other',
    CLICKBAIT: 'other',
  };
  return mapping[gqlType] || gqlType.toLowerCase();
};

const mapSeverityToGql = (severity: string): string => {
  if (!severity) return 'LOW';
  const upper = severity.toUpperCase();
  if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upper)) {
    return upper;
  }
  return 'MEDIUM';
};

const mapSeverityToDb = (gqlSeverity: string): string => {
  return (gqlSeverity || 'LOW').toLowerCase();
};

const mapStatusToGql = (status: string): string => {
  if (!status) return 'PENDING';
  const upper = status.toUpperCase();
  if (upper === 'DISMISSED' || upper === 'FALSE_POSITIVE') return 'FALSE_POSITIVE';
  if (upper === 'APPEALED') return 'APPEALED';
  if (upper === 'CONFIRMED' || upper === 'RESOLVED') return 'CONFIRMED';
  return 'PENDING';
};

const mapPenaltyTypeToGql = (type: string): string => {
  if (!type) return 'WARNING';
  const upper = type.toUpperCase().replace(/\s+/g, '_');
  if (upper === 'SHADOW_BAN' || upper === 'OUTRIGHT_BAN' || upper === 'OFFICIAL_BAN' || upper === 'WARNING') {
    return upper;
  }
  return 'WARNING';
};

const mapPenaltyTypeToDb = (gqlType: string): string => {
  return (gqlType || 'WARNING').toLowerCase();
};

export const moderationResolvers = {
  Query: {
    getModerationQueue: async (_: any, { filters }: { filters?: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const { status, violationType, severity, userId, page = 1, limit = 20 } = filters || {};
      const where: any = {};
      if (status) {
        where.status = status.toLowerCase();
      }
      if (userId) {
        where.authorId = userId;
      }

      const queueItems = await db.moderationQueue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      return queueItems;
    },

    getViolation: async (_: any, { id }: { id: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      return await db.violationReport.findUnique({ where: { id } });
    },

    getModerationMetrics: async (_: any, { timeframe = '7d' }: { timeframe?: string }, context: any) => {
      let days = 7;
      if (timeframe === '24h' || timeframe === '1d') days = 1;
      else if (timeframe === '30d') days = 30;
      else if (timeframe === '90d') days = 90;

      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const metrics = await moderationService.getModerationMetrics({ start: startDate, end: new Date() });

      const db = context?.prisma || prismaClient;
      const [activeUsers, bannedUsers] = await Promise.all([
        db.user.count({ where: { status: 'ACTIVE' } }),
        db.user.count({ where: { status: 'BANNED' } }),
      ]);

      const violationsByType = Object.entries(metrics?.violationsByType || {}).map(([type, count]) => ({
        type: mapViolationTypeToGql(type),
        count,
      }));

      const violationsBySeverity = Object.entries(metrics?.violationsBySeverity || {}).map(([sev, count]) => ({
        severity: mapSeverityToGql(sev),
        count,
      }));

      return {
        totalViolations: metrics?.totalViolations || 0,
        pendingReviews: metrics?.pendingReviews || 0,
        confirmedViolations: metrics?.confirmedViolations || 0,
        falsePositives: metrics?.falsePositives || 0,
        activeUsers,
        bannedUsers,
        violationsByType,
        violationsBySeverity,
        penaltiesApplied: metrics?.activePenalties || 0,
        averageResponseTime: 12.5,
        falsePositiveRate: metrics?.falsePositiveRate || 0,
        automationAccuracy: 0.95,
        recentTrends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
      };
    },

    getModerationAlerts: async (_: any, { page = 1, limit = 20 }: { page?: number; limit?: number }, context: any) => {
      const db = context?.prisma || prismaClient;
      return await db.moderationAlert.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },

    getUserViolations: async (_: any, { userId, page = 1, limit = 20 }: { userId: string; page?: number; limit?: number }, context: any) => {
      const db = context?.prisma || prismaClient;
      return await db.violationReport.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    },

    getUserPenalties: async (_: any, { userId, status }: { userId: string; status?: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const where: any = { userId };
      if (status === 'ACTIVE') {
        where.isActive = true;
      } else if (status === 'EXPIRED') {
        where.isActive = false;
        where.endDate = { lte: new Date() };
      } else if (status === 'REVOKED') {
        where.isActive = false;
        where.resolvedAt = { not: null };
      }
      return await db.userPenalty.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },

    getUserReputation: async (_: any, { userId }: { userId: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      let rep = await db.userReputation.findUnique({ where: { userId } });
      if (!rep) {
        rep = await moderationService.initializeUserReputation(userId);
      }
      return rep;
    },

    getModerationSettings: async (_: any, __: any, context: any) => {
      return await moderationService.getModerationSettings();
    },

    getSystemHealth: async (_: any, __: any, context: any) => {
      const db = context?.prisma || prismaClient;
      const [pendingCount, activePenalties] = await Promise.all([
        db.violationReport.count({ where: { status: 'PENDING' } }),
        db.userPenalty.count({ where: { isActive: true } }),
      ]);
      return {
        status: 'HEALTHY',
        queueSize: pendingCount,
        activePenalties,
        timestamp: new Date().toISOString(),
      };
    },

    moderateContent: async (_: any, { input }: { input: any }, context: any) => {
      const { content, contentType, contentId, userId, context: reqContext } = input;
      const result = await moderationService.moderateContent({
        content,
        contentType: contentType.toLowerCase() as any,
        contentId,
        userId,
        context: reqContext,
      });

      const violations = (result?.violations || []).map(v => ({
        type: mapViolationTypeToGql(v.type),
        severity: mapSeverityToGql(v.severity),
        confidence: v.confidence,
        reason: `${v.type} violation detected with confidence ${v.confidence}`,
        context: reqContext || null,
      }));

      return {
        isViolation: result.isViolation,
        violations,
        shouldBlock: result.shouldBlock,
        recommendedAction: result.recommendedAction,
        confidence: result.confidence,
        priority: result.priority,
      };
    },

    getModerationTrends: async (_: any, { timeframe = '30d' }: { timeframe?: string }, context: any) => {
      return {
        daily: [],
        weekly: [],
        monthly: [],
      };
    },

    getViolationAnalytics: async (_: any, { type, severity }: { type?: string; severity?: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const where: any = {};
      if (type) where.violationType = mapViolationTypeToDb(type);
      if (severity) where.severity = mapSeverityToDb(severity);

      const total = await db.violationReport.count({ where });
      return {
        total,
        type: type || 'ALL',
        severity: severity || 'ALL',
        timestamp: new Date().toISOString(),
      };
    },
  },

  Mutation: {
    confirmViolation: async (_: any, { input }: { input: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { violationId, action, notes, customPenalty } = input;

      const violation = await db.violationReport.findUnique({ where: { id: violationId } });
      if (!violation) {
        throw new Error(`Violation report with ID ${violationId} not found`);
      }

      await moderationService.confirmViolation(violationId, adminId);

      if (customPenalty) {
        await moderationService.applyPenalty(violation.userId, {
          violationReportId: violationId,
          penaltyType: mapPenaltyTypeToDb(customPenalty.type),
          duration: customPenalty.duration || 24,
          severity: 'HIGH',
          reason: customPenalty.reason || 'Custom penalty applied',
          appliedBy: adminId,
        });
      }

      const updated = await db.violationReport.update({
        where: { id: violationId },
        data: {
          status: 'CONFIRMED',
          reviewedAt: new Date(),
          reviewedBy: adminId,
          resolution: action || 'CONFIRMED',
          resolutionNotes: notes || null,
        },
      });

      pubsub.publish(VIOLATION_DETECTED, { violationDetected: updated });
      return updated;
    },

    markFalsePositive: async (_: any, { input }: { input: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { violationId, reason, notes, impact } = input;

      await moderationService.recordFalsePositive(violationId, adminId, reason);

      const fpRecord = await db.falsePositive.findFirst({
        where: { violationReportId: violationId },
        orderBy: { createdAt: 'desc' },
      });

      if (!fpRecord) {
        throw new Error(`Failed to record false positive for violation ${violationId}`);
      }

      if (notes || impact) {
        return await db.falsePositive.update({
          where: { id: fpRecord.id },
          data: {
            userImpact: impact || null,
            systemImpact: notes || null,
          },
        });
      }

      return fpRecord;
    },

    appealViolation: async (_: any, { violationId, reason }: { violationId: string; reason: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const updated = await db.violationReport.update({
        where: { id: violationId },
        data: {
          status: 'APPEALED',
          resolutionNotes: `Appealed: ${reason}`,
        },
      });

      await db.userPenalty.updateMany({
        where: { violationReportId: violationId },
        data: {
          appealStatus: 'submitted',
          appealReason: reason,
          appealSubmittedAt: new Date(),
        },
      });

      return updated;
    },

    applyPenalty: async (_: any, { userId, penalty }: { userId: string; penalty: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { type, duration = 24, reason, appealable = true } = penalty;

      const penaltyResult = await moderationService.applyPenalty(userId, {
        violationReportId: '',
        penaltyType: mapPenaltyTypeToDb(type),
        duration,
        severity: 'LEVEL_1',
        reason,
        appliedBy: adminId,
      });

      const userPenaltyRecord = await db.userPenalty.findUnique({
        where: { id: penaltyResult?.penaltyId || '' },
      });

      if (!userPenaltyRecord) {
        throw new Error('Failed to retrieve applied user penalty');
      }

      pubsub.publish(USER_PENALTY_APPLIED, { userPenaltyApplied: userPenaltyRecord });
      return userPenaltyRecord;
    },

    revokePenalty: async (_: any, { penaltyId, reason }: { penaltyId: string; reason: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';

      const penalty = await db.userPenalty.update({
        where: { id: penaltyId },
        data: {
          isActive: false,
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolutionReason: reason,
        },
      });

      await moderationService.recalculateUserReputation(penalty.userId);
      return penalty;
    },

    adjustPenalty: async (_: any, { penaltyId, penalty }: { penaltyId: string; penalty: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { type, duration, reason } = penalty;

      const updated = await db.userPenalty.update({
        where: { id: penaltyId },
        data: {
          penaltyType: mapPenaltyTypeToDb(type),
          ...(duration && {
            duration,
            endDate: new Date(Date.now() + duration * 60 * 60 * 1000),
          }),
          ...(reason && { notes: reason }),
          appliedBy: adminId,
        },
      });

      return updated;
    },

    banUser: async (_: any, { userId, penalty }: { userId: string; penalty: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { type = 'OUTRIGHT_BAN', duration = 720, reason } = penalty;

      const penaltyResult = await moderationService.applyPenalty(userId, {
        violationReportId: '',
        penaltyType: mapPenaltyTypeToDb(type),
        duration,
        severity: 'CRITICAL',
        reason: reason || 'User banned by admin',
        appliedBy: adminId,
      });

      const userPenalty = await db.userPenalty.findUnique({ where: { id: penaltyResult.penaltyId } });
      return userPenalty;
    },

    unbanUser: async (_: any, { userId, reason }: { userId: string; reason: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';

      await db.userPenalty.updateMany({
        where: { userId, isActive: true },
        data: {
          isActive: false,
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolutionReason: reason,
        },
      });

      await db.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      });

      await moderationService.recalculateUserReputation(userId);

      const latestPenalty = await db.userPenalty.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return latestPenalty;
    },

    updateUserReputation: async (_: any, { userId, score }: { userId: string; score: number }, context: any) => {
      const db = context?.prisma || prismaClient;
      const updated = await db.userReputation.upsert({
        where: { userId },
        update: { overallScore: score },
        create: {
          userId,
          overallScore: score,
          contentQualityScore: score,
          communityScore: score,
          violationScore: 0,
          trustLevel: 'NORMAL',
          priorityTier: 'FREE',
        },
      });

      pubsub.publish(USER_REPUTATION_CHANGED, { userReputationChanged: updated });
      return updated;
    },

    updateModerationSettings: async (_: any, { input }: { input: any }, context: any) => {
      await moderationService.updateModerationSettings(input);
      const settings = await moderationService.getModerationSettings();
      pubsub.publish(SETTINGS_UPDATED, { settingsUpdated: settings });
      return settings;
    },

    performBulkAction: async (_: any, { action }: { action: any }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';
      const { violationIds, action: actType, reason, notes } = action;

      const updatedReports = [];
      for (const id of violationIds) {
        if (actType === 'CONFIRM') {
          await moderationService.confirmViolation(id, adminId);
        } else if (actType === 'FALSE_POSITIVE') {
          await moderationService.recordFalsePositive(id, adminId, reason || 'Bulk false positive action');
        }

        const report = await db.violationReport.update({
          where: { id },
          data: {
            reviewedAt: new Date(),
            reviewedBy: adminId,
            resolution: actType,
            resolutionNotes: notes || reason || null,
          },
        });
        updatedReports.push(report);
      }

      return updatedReports;
    },

    markAlertRead: async (_: any, { alertId }: { alertId: string }, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';

      return await db.moderationAlert.update({
        where: { id: alertId },
        data: {
          status: 'READ',
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
        },
      });
    },

    markAllAlertsRead: async (_: any, __: any, context: any) => {
      const db = context?.prisma || prismaClient;
      const adminId = context?.user?.id || 'admin-system';

      await db.moderationAlert.updateMany({
        where: { status: 'UNREAD' },
        data: {
          status: 'READ',
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
        },
      });

      return true;
    },

    clearModerationCache: async () => {
      await redis.del('moderation:settings');
      return true;
    },

    triggerSystemHealthCheck: async (_: any, __: any, context: any) => {
      const db = context?.prisma || prismaClient;
      const queueCount = await db.moderationQueue.count();
      const healthStatus = {
        status: 'HEALTHY',
        queueSize: queueCount,
        checkedAt: new Date().toISOString(),
      };
      pubsub.publish(SYSTEM_HEALTH_CHANGED, { systemHealthChanged: healthStatus });
      return healthStatus;
    },
  },

  Subscription: {
    violationDetected: {
      subscribe: () => pubsub.asyncIterator([VIOLATION_DETECTED]),
    },
    moderationAlert: {
      subscribe: () => pubsub.asyncIterator([MODERATION_ALERT]),
    },
    queueUpdated: {
      subscribe: () => pubsub.asyncIterator([QUEUE_UPDATED]),
    },
    userPenaltyApplied: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_PENALTY_APPLIED]),
        (payload, variables) => {
          if (variables?.userId) {
            return payload.userPenaltyApplied?.userId === variables.userId;
          }
          return true;
        }
      ),
    },
    userReputationChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_REPUTATION_CHANGED]),
        (payload, variables) => {
          if (variables?.userId) {
            return payload.userReputationChanged?.userId === variables.userId;
          }
          return true;
        }
      ),
    },
    systemHealthChanged: {
      subscribe: () => pubsub.asyncIterator([SYSTEM_HEALTH_CHANGED]),
    },
    settingsUpdated: {
      subscribe: () => pubsub.asyncIterator([SETTINGS_UPDATED]),
    },
    metricsUpdated: {
      subscribe: () => pubsub.asyncIterator([METRICS_UPDATED]),
    },
  },

  // Type Resolvers
  ViolationReport: {
    violationType: (parent: any) => mapViolationTypeToGql(parent.violationType),
    severity: (parent: any) => mapSeverityToGql(parent.severity),
    status: (parent: any) => mapStatusToGql(parent.status),
    humanReview: (parent: any) => Boolean(parent.reviewedBy),
    adminNotes: (parent: any) => parent.resolutionNotes || parent.penaltyReason || null,
    user: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.User || await db.user.findUnique({ where: { id: parent.userId } });
    },
    reviewer: async (parent: any, _: any, context: any) => {
      if (!parent.reviewedBy) return null;
      const db = context?.prisma || prismaClient;
      return await db.user.findUnique({ where: { id: parent.reviewedBy } });
    },
    penalties: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.UserPenalty || await db.userPenalty.findMany({ where: { violationReportId: parent.id } });
    },
    falsePositives: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.FalsePositive || await db.falsePositive.findMany({ where: { violationReportId: parent.id } });
    },
  },

  UserPenalty: {
    penaltyType: (parent: any) => mapPenaltyTypeToGql(parent.penaltyType),
    status: (parent: any) => {
      if (!parent.isActive) {
        if (parent.resolvedAt) return 'REVOKED';
        return 'EXPIRED';
      }
      if (parent.endDate && new Date(parent.endDate) < new Date()) {
        return 'EXPIRED';
      }
      return 'ACTIVE';
    },
    reason: (parent: any) => parent.notes || parent.resolutionReason || 'Penalty applied',
    expiresAt: (parent: any) => parent.endDate || null,
    appealable: (parent: any) => parent.appealStatus !== 'denied',
    appliedByUser: async (parent: any, _: any, context: any) => {
      if (!parent.appliedBy) return null;
      const db = context?.prisma || prismaClient;
      return parent.appliedByUser || await db.user.findUnique({ where: { id: parent.appliedBy } });
    },
    user: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.User || await db.user.findUnique({ where: { id: parent.userId } });
    },
    violation: async (parent: any, _: any, context: any) => {
      if (!parent.violationReportId) return null;
      const db = context?.prisma || prismaClient;
      return parent.ViolationReport || await db.violationReport.findUnique({ where: { id: parent.violationReportId } });
    },
  },

  UserReputation: {
    score: (parent: any) => Math.round(parent.overallScore ?? 100),
    lastViolation: (parent: any) => parent.lastViolationAt || null,
    trustLevel: (parent: any) => (parent.trustLevel || 'NORMAL').toUpperCase(),
    riskLevel: (parent: any) => (parent.violationScore > 50 ? 'HIGH' : parent.violationScore > 20 ? 'MEDIUM' : 'LOW'),
    user: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.User || await db.user.findUnique({ where: { id: parent.userId } });
    },
  },

  FalsePositive: {
    reportedBy: (parent: any) => parent.correctedBy,
    reportedByUser: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return await db.user.findUnique({ where: { id: parent.correctedBy } });
    },
    reason: (parent: any) => parent.correctionReason,
    notes: (parent: any) => parent.userImpact || parent.systemImpact || null,
    impact: (parent: any) => parent.userImpact || null,
    violation: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      return parent.ViolationReport || await db.violationReport.findUnique({ where: { id: parent.violationReportId } });
    },
  },

  ModerationAlert: {
    type: (parent: any) => parent.alertType || 'HIGH_SEVERITY_VIOLATION',
    severity: (parent: any) => mapSeverityToGql(parent.severity),
    isRead: (parent: any) => parent.status === 'READ' || parent.status === 'RESOLVED',
    readAt: (parent: any) => parent.acknowledgedAt || parent.resolvedAt || null,
    user: async (parent: any, _: any, context: any) => {
      if (!parent.userId) return null;
      const db = context?.prisma || prismaClient;
      return await db.user.findUnique({ where: { id: parent.userId } });
    },
    violation: async (parent: any, _: any, context: any) => {
      if (!parent.violationReportId) return null;
      const db = context?.prisma || prismaClient;
      return await db.violationReport.findUnique({ where: { id: parent.violationReportId } });
    },
  },

  ModerationQueueItem: {
    timeInQueue: (parent: any) => {
      if (!parent.createdAt) return 0;
      const created = new Date(parent.createdAt).getTime();
      return Math.floor((Date.now() - created) / 1000);
    },
    violation: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      const violation = await db.violationReport.findFirst({
        where: {
          contentId: parent.contentId,
          contentType: parent.contentType,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (violation) return violation;

      // Synthetic violation placeholder if no explicit report exists
      return {
        id: `queue-violation-${parent.id}`,
        contentId: parent.contentId,
        contentType: parent.contentType,
        content: parent.content,
        violationType: 'other',
        severity: 'medium',
        status: parent.status || 'PENDING',
        confidence: 0.8,
        humanReview: false,
        userId: parent.authorId,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
      };
    },
    userContext: async (parent: any, _: any, context: any) => {
      const db = context?.prisma || prismaClient;
      const authorId = parent.authorId;
      const user = await db.user.findUnique({ where: { id: authorId } });
      const reputation = await db.userReputation.findUnique({ where: { userId: authorId } });
      const recentViolations = await db.violationReport.findMany({
        where: { userId: authorId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      const activePenalties = await db.userPenalty.findMany({
        where: { userId: authorId, isActive: true },
      });

      return {
        user,
        reputation,
        recentViolations,
        activePenalties,
        riskLevel: (reputation?.violationScore || 0) > 50 ? 'HIGH' : 'LOW',
        trustLevel: reputation?.trustLevel?.toUpperCase() || 'NORMAL',
      };
    },
  },
};

export default moderationResolvers;
