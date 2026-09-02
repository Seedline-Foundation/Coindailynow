process.env.VAPID_SUBJECT = 'mailto:admin@sygn.live';
process.env.VAPID_PUBLIC_KEY = 'BPfa0kobE7j8uADvQ0gVz3G7Fyomh3w2paKlnZhy9oI7O4fa03T1Gzki0a1ZUGEpjhwKoJPL5OEPAqGL5JJgpzc';
process.env.VAPID_PRIVATE_KEY = 'DwO0XxO_tAbgJxmA8ng0r-_2vHkU6NfNEQWy5Sinocs';

import engagementService from '../../src/services/engagementService';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
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
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('EngagementService.getEngagementAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockPrisma.userBehavior.count as jest.Mock).mockImplementation((args?: any) => {
      if (args?.where?.lastEngagement) {
        return Promise.resolve(5);
      }
      return Promise.resolve(10);
    });

    (mockPrisma.userBehavior.aggregate as jest.Mock).mockResolvedValue({
      _avg: { engagementScore: 75.5 },
    });

    (mockPrisma.readingReward.aggregate as jest.Mock).mockResolvedValue({
      _sum: { pointsEarned: 1200 },
      _count: 15,
    });

    (mockPrisma.pWAInstall.count as jest.Mock).mockResolvedValue(8);
    (mockPrisma.pushSubscription.count as jest.Mock).mockResolvedValue(12);
    (mockPrisma.voiceArticle.count as jest.Mock).mockResolvedValue(3);

    (mockPrisma.userBehavior.findMany as jest.Mock).mockResolvedValue([
      { id: 'b1', userId: 'user-1', engagementScore: 90 },
      { id: 'b2', userId: 'user-2', engagementScore: 80 },
    ]);

    (mockPrisma.engagementMilestone.findMany as jest.Mock).mockResolvedValue([
      { id: 'm1', userId: 'user-1', type: 'ARTICLES_READ', threshold: 10, achieved: true },
      { id: 'm2', userId: 'user-2', type: 'DAYS_ACTIVE', threshold: 7, achieved: true },
      { id: 'm3', userId: 'user-3', type: 'COMMENTS', threshold: 5, achieved: true },
    ]);

    (mockPrisma.user.findUnique as jest.Mock).mockImplementation(({ where, select }: any) => {
      const users: Record<string, any> = {
        'user-1': { id: 'user-1', username: 'alice', email: 'alice@example.com', avatarUrl: 'a.png' },
        'user-2': { id: 'user-2', username: 'bob', email: 'bob@example.com', avatarUrl: 'b.png' },
        'user-3': { id: 'user-3', username: 'charlie', email: 'charlie@example.com', avatarUrl: 'c.png' },
      };
      const user = users[where.id];
      if (!user) return Promise.resolve(null);
      if (select) {
        const filtered: any = {};
        for (const key of Object.keys(select)) {
          if (select[key]) filtered[key] = user[key];
        }
        return Promise.resolve(filtered);
      }
      return Promise.resolve(user);
    });

    (mockPrisma.user.findMany as jest.Mock).mockImplementation(({ where, select }: any) => {
      const ids: string[] = where?.id?.in || [];
      const users: Record<string, any> = {
        'user-1': { id: 'user-1', username: 'alice', email: 'alice@example.com', avatarUrl: 'a.png' },
        'user-2': { id: 'user-2', username: 'bob', email: 'bob@example.com', avatarUrl: 'b.png' },
        'user-3': { id: 'user-3', username: 'charlie', email: 'charlie@example.com', avatarUrl: 'c.png' },
      };
      const result = ids
        .map((id) => users[id])
        .filter(Boolean)
        .map((user) => {
          if (select) {
            const filtered: any = {};
            for (const key of Object.keys(select)) {
              if (select[key]) filtered[key] = user[key];
            }
            return filtered;
          }
          return user;
        });
      return Promise.resolve(result);
    });
  });

  it('should return complete engagement analytics with mapped user details', async () => {
    const result = await engagementService.getEngagementAnalytics();

    expect(result.overview.totalUsers).toBe(10);
    expect(result.overview.activeUsers).toBe(5);
    expect(result.overview.avgEngagementScore).toBe(75.5);
    expect(result.rewards.total).toBe(1200);

    expect(result.topUsers).toHaveLength(2);
    expect(result.topUsers[0].User).toEqual({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      avatarUrl: 'a.png',
    });

    expect(result.recentMilestones).toHaveLength(3);
    expect(result.recentMilestones[0].User).toEqual({
      username: 'alice',
      avatarUrl: 'a.png',
    });
    expect(result.recentMilestones[1].User).toEqual({
      username: 'bob',
      avatarUrl: 'b.png',
    });
    expect(result.recentMilestones[2].User).toEqual({
      username: 'charlie',
      avatarUrl: 'c.png',
    });
  });
});
