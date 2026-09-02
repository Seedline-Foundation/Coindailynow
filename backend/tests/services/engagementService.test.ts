import engagementService from '../../src/services/engagementService';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  userBehavior: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  readingReward: {
    aggregate: jest.fn(),
  },
  pWAInstall: {
    count: jest.fn(),
  },
  pushSubscription: {
    count: jest.fn(),
  },
  voiceArticle: {
    count: jest.fn(),
  },
  engagementMilestone: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
}));

describe('EngagementService - getEngagementAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch engagement analytics and batch user queries with findMany', async () => {
    (prisma.userBehavior.count as jest.Mock)
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(50); // activeUsers

    (prisma.userBehavior.aggregate as jest.Mock).mockResolvedValue({
      _avg: { engagementScore: 75.5 },
    });

    (prisma.readingReward.aggregate as jest.Mock).mockResolvedValue({
      _sum: { pointsEarned: 1000 },
      _count: 20,
    });

    (prisma.pWAInstall.count as jest.Mock).mockResolvedValue(10);
    (prisma.pushSubscription.count as jest.Mock).mockResolvedValue(15);
    (prisma.voiceArticle.count as jest.Mock).mockResolvedValue(5);

    const topUserBehaviors = [
      { id: 'ub1', userId: 'user1', engagementScore: 99 },
      { id: 'ub2', userId: 'user2', engagementScore: 95 },
    ];
    (prisma.userBehavior.findMany as jest.Mock).mockResolvedValue(topUserBehaviors);

    const milestoneData = [
      { id: 'm1', userId: 'user1', type: 'ARTICLES_READ', threshold: 10, achieved: true, achievedAt: new Date() },
      { id: 'm2', userId: 'user3', type: 'SHARES', threshold: 5, achieved: true, achievedAt: new Date() },
    ];
    (prisma.engagementMilestone.findMany as jest.Mock).mockResolvedValue(milestoneData);

    const users = [
      { id: 'user1', username: 'user_one', email: 'one@test.com', avatarUrl: 'avatar1.png' },
      { id: 'user2', username: 'user_two', email: 'two@test.com', avatarUrl: 'avatar2.png' },
      { id: 'user3', username: 'user_three', email: 'three@test.com', avatarUrl: 'avatar3.png' },
    ];
    (prisma.user.findMany as jest.Mock).mockImplementation(({ where }) => {
      const ids: string[] = where?.id?.in || [];
      return Promise.resolve(users.filter((u) => ids.includes(u.id)));
    });

    const analytics = await engagementService.getEngagementAnalytics();

    expect(analytics.overview.totalUsers).toBe(100);
    expect(analytics.overview.activeUsers).toBe(50);
    expect(analytics.overview.avgEngagementScore).toBe(75.5);
    expect(analytics.topUsers).toHaveLength(2);
    expect(analytics.topUsers[0].User?.username).toBe('user_one');
    expect(analytics.topUsers[1].User?.username).toBe('user_two');

    expect(analytics.recentMilestones).toHaveLength(2);
    expect(analytics.recentMilestones[0].User?.username).toBe('user_one');
    expect(analytics.recentMilestones[1].User?.username).toBe('user_three');

    // Ensure findMany was used for batch querying users instead of individual findUnique calls
    expect(prisma.user.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
