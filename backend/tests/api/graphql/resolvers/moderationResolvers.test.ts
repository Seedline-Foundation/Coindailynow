// Mock AI Moderation Service
const mockService = {
  getModerationMetrics: jest.fn().mockResolvedValue({
    totalViolations: 10,
    pendingReviews: 2,
    confirmedViolations: 7,
    falsePositives: 1,
    violationsByType: { religious: 3, spam: 4 },
    violationsBySeverity: { critical: 3, low: 4 },
    activePenalties: 2,
    falsePositiveRate: 0.1,
  }),
  getModerationSettings: jest.fn().mockResolvedValue({
    id: 'settings-1',
    toxicityThreshold: 0.7,
    religiousContentThreshold: 0.5,
  }),
  updateModerationSettings: jest.fn().mockResolvedValue({}),
  moderateContent: jest.fn().mockResolvedValue({
    isViolation: true,
    violations: [
      { type: 'religious', severity: 'critical', confidence: 0.95 },
    ],
    shouldBlock: true,
    recommendedAction: 'BLOCK',
    confidence: 0.95,
    priority: 90,
  }),
  confirmViolation: jest.fn().mockResolvedValue(undefined),
  applyPenalty: jest.fn().mockResolvedValue({ penaltyId: 'penalty-123' }),
  recordFalsePositive: jest.fn().mockResolvedValue(undefined),
  initializeUserReputation: jest.fn().mockResolvedValue({
    userId: 'user-1',
    overallScore: 80,
    trustLevel: 'NORMAL',
  }),
  recalculateUserReputation: jest.fn().mockResolvedValue({}),
};

jest.mock('../../../../src/services/aiModerationService', () => {
  return function () {
    return mockService;
  };
});

// Mocks
jest.mock('../../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    moderationQueue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    violationReport: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userPenalty: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    userReputation: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    moderationAlert: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    falsePositive: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../../../src/lib/redis', () => ({
  getRedis: () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

import { moderationResolvers } from '../../../../src/graphql/resolvers/moderation';
import prismaClient from '../../../../src/lib/prisma';

describe('Moderation GraphQL Resolvers', () => {
  const mockContext = {
    prisma: prismaClient,
    user: { id: 'admin-1', role: 'SUPER_ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockService.getModerationMetrics.mockResolvedValue({
      totalViolations: 10,
      pendingReviews: 2,
      confirmedViolations: 7,
      falsePositives: 1,
      violationsByType: { religious: 3, spam: 4 },
      violationsBySeverity: { critical: 3, low: 4 },
      activePenalties: 2,
      falsePositiveRate: 0.1,
    });
    mockService.getModerationSettings.mockResolvedValue({
      id: 'settings-1',
      toxicityThreshold: 0.7,
      religiousContentThreshold: 0.5,
    });
    mockService.updateModerationSettings.mockResolvedValue({});
    mockService.moderateContent.mockResolvedValue({
      isViolation: true,
      violations: [
        { type: 'religious', severity: 'critical', confidence: 0.95 },
      ],
      shouldBlock: true,
      recommendedAction: 'BLOCK',
      confidence: 0.95,
      priority: 90,
    });
    mockService.confirmViolation.mockResolvedValue(undefined);
    mockService.applyPenalty.mockResolvedValue({ penaltyId: 'penalty-123' });
    mockService.recordFalsePositive.mockResolvedValue(undefined);
    mockService.initializeUserReputation.mockResolvedValue({
      userId: 'user-1',
      overallScore: 80,
      trustLevel: 'NORMAL',
    });
    mockService.recalculateUserReputation.mockResolvedValue({});
  });

  describe('Query Resolvers', () => {
    it('getModerationQueue returns list of items from prisma', async () => {
      const mockItems = [
        { id: 'q1', contentType: 'article', contentId: 'a1', authorId: 'u1', priority: 5, createdAt: new Date() },
      ];
      (prismaClient.moderationQueue.findMany as jest.Mock).mockResolvedValue(mockItems);

      const res = await moderationResolvers.Query.getModerationQueue(
        null,
        { filters: { status: 'PENDING', page: 1, limit: 10 } },
        mockContext
      );

      expect(res).toEqual(mockItems);
      expect(prismaClient.moderationQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('getViolation returns a violation report', async () => {
      const mockViolation = { id: 'v1', userId: 'u1', violationType: 'religious', severity: 'critical' };
      (prismaClient.violationReport.findUnique as jest.Mock).mockResolvedValue(mockViolation);

      const res = await moderationResolvers.Query.getViolation(null, { id: 'v1' }, mockContext);
      expect(res).toEqual(mockViolation);
      expect(prismaClient.violationReport.findUnique).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });

    it('getModerationMetrics returns aggregated metrics', async () => {
      (prismaClient.user.count as jest.Mock).mockImplementation(({ where }) => {
        if (where?.status === 'ACTIVE') return Promise.resolve(100);
        if (where?.status === 'BANNED') return Promise.resolve(5);
        return Promise.resolve(0);
      });

      const res = await moderationResolvers.Query.getModerationMetrics(null, { timeframe: '7d' }, mockContext);

      expect(res.totalViolations).toBe(10);
      expect(res.activeUsers).toBe(100);
      expect(res.bannedUsers).toBe(5);
      expect(res.violationsByType).toEqual([
        { type: 'RELIGIOUS_CONTENT', count: 3 },
        { type: 'SPAM', count: 4 },
      ]);
    });

    it('getUserReputation fetches or initializes user reputation', async () => {
      const mockRep = { userId: 'u1', overallScore: 90, trustLevel: 'NORMAL' };
      (prismaClient.userReputation.findUnique as jest.Mock).mockResolvedValue(mockRep);

      const res = await moderationResolvers.Query.getUserReputation(null, { userId: 'u1' }, mockContext);
      expect(res).toEqual(mockRep);
    });

    it('moderateContent analyzes content correctly', async () => {
      const input = {
        content: 'test content',
        contentType: 'ARTICLE',
        contentId: 'a1',
        userId: 'u1',
      };

      const res = await moderationResolvers.Query.moderateContent(null, { input }, mockContext);
      expect(res.isViolation).toBe(true);
      expect(res.shouldBlock).toBe(true);
      expect(res.violations[0].type).toBe('RELIGIOUS_CONTENT');
    });

    it('getSystemHealth returns system health details', async () => {
      (prismaClient.violationReport.count as jest.Mock).mockResolvedValue(2);
      (prismaClient.userPenalty.count as jest.Mock).mockResolvedValue(1);

      const res = await moderationResolvers.Query.getSystemHealth(null, {}, mockContext);
      expect(res.status).toBe('HEALTHY');
      expect(res.queueSize).toBe(2);
      expect(res.activePenalties).toBe(1);
    });
  });

  describe('Mutation Resolvers', () => {
    it('confirmViolation confirms report and applies penalty if requested', async () => {
      const mockViolation = { id: 'v1', userId: 'u1' };
      (prismaClient.violationReport.findUnique as jest.Mock).mockResolvedValue(mockViolation);
      (prismaClient.violationReport.update as jest.Mock).mockResolvedValue({
        ...mockViolation,
        status: 'CONFIRMED',
      });

      const res = await moderationResolvers.Mutation.confirmViolation(
        null,
        { input: { violationId: 'v1', action: 'CONFIRM', notes: 'Confirmed' } },
        mockContext
      );

      expect(res.status).toBe('CONFIRMED');
      expect(prismaClient.violationReport.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'v1' } })
      );
    });

    it('markFalsePositive records false positive', async () => {
      const mockFP = { id: 'fp1', violationReportId: 'v1', correctionReason: 'False alarm' };
      (prismaClient.falsePositive.findFirst as jest.Mock).mockResolvedValue(mockFP);

      const res = await moderationResolvers.Mutation.markFalsePositive(
        null,
        { input: { violationId: 'v1', reason: 'False alarm' } },
        mockContext
      );

      expect(res).toEqual(mockFP);
    });

    it('appealViolation submits appeal for violation', async () => {
      (prismaClient.violationReport.update as jest.Mock).mockResolvedValue({
        id: 'v1',
        status: 'APPEALED',
      });
      (prismaClient.userPenalty.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const res = await moderationResolvers.Mutation.appealViolation(
        null,
        { violationId: 'v1', reason: 'Unfair' },
        mockContext
      );

      expect(res.status).toBe('APPEALED');
      expect(prismaClient.userPenalty.updateMany).toHaveBeenCalled();
    });

    it('applyPenalty applies penalty via service and returns record', async () => {
      const mockPenalty = { id: 'penalty-123', userId: 'u1', penaltyType: 'shadow_ban', isActive: true };
      (prismaClient.userPenalty.findUnique as jest.Mock).mockResolvedValue(mockPenalty);

      const res = await moderationResolvers.Mutation.applyPenalty(
        null,
        { userId: 'u1', penalty: { type: 'SHADOW_BAN', duration: 24, reason: 'Test' } },
        mockContext
      );

      expect(res).toEqual(mockPenalty);
    });

    it('revokePenalty revokes an active penalty', async () => {
      const mockPenalty = { id: 'p1', userId: 'u1', isActive: false };
      (prismaClient.userPenalty.update as jest.Mock).mockResolvedValue(mockPenalty);

      const res = await moderationResolvers.Mutation.revokePenalty(
        null,
        { penaltyId: 'p1', reason: 'Mistake' },
        mockContext
      );

      expect(res.isActive).toBe(false);
      expect(prismaClient.userPenalty.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'p1' } })
      );
    });

    it('unbanUser clears active penalties and reactivates user', async () => {
      (prismaClient.userPenalty.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaClient.user.update as jest.Mock).mockResolvedValue({ id: 'u1', status: 'ACTIVE' });
      (prismaClient.userPenalty.findFirst as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1', isActive: false });

      const res = await moderationResolvers.Mutation.unbanUser(
        null,
        { userId: 'u1', reason: 'Ban expired' },
        mockContext
      );

      expect(res.id).toBe('p1');
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { status: 'ACTIVE' },
      });
    });

    it('clearModerationCache clears settings in redis', async () => {
      const res = await moderationResolvers.Mutation.clearModerationCache();
      expect(res).toBe(true);
    });
  });

  describe('Field Resolvers', () => {
    it('ViolationReport maps enum values and resolves relations', async () => {
      const parent = {
        id: 'v1',
        userId: 'u1',
        violationType: 'religious',
        severity: 'critical',
        status: 'pending',
        reviewedBy: 'admin-1',
      };

      expect(moderationResolvers.ViolationReport.violationType(parent)).toBe('RELIGIOUS_CONTENT');
      expect(moderationResolvers.ViolationReport.severity(parent)).toBe('CRITICAL');
      expect(moderationResolvers.ViolationReport.status(parent)).toBe('PENDING');
      expect(moderationResolvers.ViolationReport.humanReview(parent)).toBe(true);

      const mockUser = { id: 'u1', username: 'john' };
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const userRes = await moderationResolvers.ViolationReport.user(parent, {}, mockContext);
      expect(userRes).toEqual(mockUser);
    });

    it('UserPenalty calculates status and maps penaltyType', async () => {
      const activePenalty = {
        id: 'p1',
        userId: 'u1',
        penaltyType: 'shadow_ban',
        isActive: true,
        endDate: new Date(Date.now() + 100000),
      };

      expect(moderationResolvers.UserPenalty.penaltyType(activePenalty)).toBe('SHADOW_BAN');
      expect(moderationResolvers.UserPenalty.status(activePenalty)).toBe('ACTIVE');

      const expiredPenalty = {
        id: 'p2',
        userId: 'u1',
        penaltyType: 'outright_ban',
        isActive: false,
        endDate: new Date(Date.now() - 100000),
      };

      expect(moderationResolvers.UserPenalty.status(expiredPenalty)).toBe('EXPIRED');
    });

    it('ModerationQueueItem resolves userContext and violation', async () => {
      const queueParent = {
        id: 'q1',
        contentId: 'a1',
        contentType: 'article',
        content: 'Bad text',
        authorId: 'u1',
        createdAt: new Date(Date.now() - 5000),
      };

      const timeInQueue = moderationResolvers.ModerationQueueItem.timeInQueue(queueParent);
      expect(timeInQueue).toBeGreaterThanOrEqual(4);

      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', username: 'author' });
      (prismaClient.userReputation.findUnique as jest.Mock).mockResolvedValue({ userId: 'u1', violationScore: 10, trustLevel: 'NORMAL' });
      (prismaClient.violationReport.findMany as jest.Mock).mockResolvedValue([]);
      (prismaClient.userPenalty.findMany as jest.Mock).mockResolvedValue([]);

      const userContext = await moderationResolvers.ModerationQueueItem.userContext(queueParent, {}, mockContext);
      expect(userContext.riskLevel).toBe('LOW');
      expect(userContext.trustLevel).toBe('NORMAL');
    });
  });
});
