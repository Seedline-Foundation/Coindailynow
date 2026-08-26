import { aiAnalyticsResolvers, stopPeriodicUpdates } from '../../src/api/aiAnalyticsResolvers';
import * as aiAnalyticsService from '../../src/services/aiAnalyticsService';

jest.mock('../../src/services/aiAnalyticsService', () => ({
  getSystemOverview: jest.fn(),
  getAgentAnalytics: jest.fn(),
  getCostBreakdown: jest.fn(),
  getPerformanceTrends: jest.fn(),
  getOptimizationRecommendations: jest.fn(),
  setBudgetConfig: jest.fn(),
  getBudgetConfig: jest.fn(),
  cleanupOldAnalytics: jest.fn(),
  analyticsEvents: {
    on: jest.fn(),
  },
}));

describe('aiAnalyticsResolvers', () => {
  afterAll(() => {
    stopPeriodicUpdates();
  });

  describe('Mutation - cleanupOldAnalytics', () => {
    it('should throw an error if context.user is not provided (unauthenticated)', async () => {
      const context = {};

      await expect(
        aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context)
      ).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should throw an error if context.user is not an admin (unauthorized role)', async () => {
      const context = {
        user: {
          id: 'user-1',
          role: 'USER',
        },
      };

      await expect(
        aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context)
      ).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should successfully cleanup old analytics if user has role ADMIN', async () => {
      (aiAnalyticsService.cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 42 });

      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(aiAnalyticsService.cleanupOldAnalytics).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 42,
        message: 'Successfully deleted 42 old analytics events',
      });
    });

    it('should successfully cleanup old analytics if user has role SUPER_ADMIN', async () => {
      (aiAnalyticsService.cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 100 });

      const context = {
        user: {
          id: 'super-admin-1',
          role: 'SUPER_ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(aiAnalyticsService.cleanupOldAnalytics).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: 100,
        message: 'Successfully deleted 100 old analytics events',
      });
    });

    it('should successfully cleanup old analytics if user has isAdmin: true flag', async () => {
      (aiAnalyticsService.cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 10 });

      const context = {
        user: {
          id: 'admin-flag-1',
          isAdmin: true,
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(aiAnalyticsService.cleanupOldAnalytics).toHaveBeenCalled();
      expect(result).toEqual({
        deleted: 10,
        message: 'Successfully deleted 10 old analytics events',
      });
    });
  });
});
