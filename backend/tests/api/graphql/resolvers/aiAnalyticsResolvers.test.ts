import { aiAnalyticsResolvers } from '../../../../src/api/aiAnalyticsResolvers';
import { cleanupOldAnalytics } from '../../../../src/services/aiAnalyticsService';

jest.mock('../../../../src/services/aiAnalyticsService', () => ({
  cleanupOldAnalytics: jest.fn(),
  getSystemOverview: jest.fn(),
  getAgentAnalytics: jest.fn(),
  getCostBreakdown: jest.fn(),
  getPerformanceTrends: jest.fn(),
  getOptimizationRecommendations: jest.fn(),
  setBudgetConfig: jest.fn(),
  getBudgetConfig: jest.fn(),
  analyticsEvents: {
    on: jest.fn(),
  },
}));

describe('aiAnalyticsResolvers - cleanupOldAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const resolver = aiAnalyticsResolvers.Mutation.cleanupOldAnalytics;

  it('should throw an error if no user is authenticated', async () => {
    const context = {};

    await expect(resolver({}, {}, context)).rejects.toThrow('Unauthorized: Admin access required');
    expect(cleanupOldAnalytics).not.toHaveBeenCalled();
  });

  it('should throw an error if user does not have an admin or super admin role', async () => {
    const context = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'regular_user',
        role: 'USER',
      },
    };

    await expect(resolver({}, {}, context)).rejects.toThrow('Unauthorized: Admin access required');
    expect(cleanupOldAnalytics).not.toHaveBeenCalled();
  });

  it('should successfully call cleanupOldAnalytics and return deleted count for ADMIN role', async () => {
    const context = {
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        username: 'admin_user',
        role: 'ADMIN',
      },
    };

    (cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 15 });

    const result = await resolver({}, {}, context);

    expect(cleanupOldAnalytics).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      deleted: 15,
      message: 'Successfully deleted 15 old analytics events',
    });
  });

  it('should successfully call cleanupOldAnalytics and return deleted count for SUPER_ADMIN role', async () => {
    const context = {
      user: {
        id: 'super-admin-1',
        email: 'superadmin@example.com',
        username: 'superadmin_user',
        role: 'SUPER_ADMIN',
      },
    };

    (cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 42 });

    const result = await resolver({}, {}, context);

    expect(cleanupOldAnalytics).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      deleted: 42,
      message: 'Successfully deleted 42 old analytics events',
    });
  });
});
