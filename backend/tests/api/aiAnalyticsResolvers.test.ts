import { aiAnalyticsResolvers } from '../../src/api/aiAnalyticsResolvers';
import { cleanupOldAnalytics } from '../../src/services/aiAnalyticsService';

jest.mock('../../src/services/aiAnalyticsService', () => ({
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

describe('aiAnalyticsResolvers', () => {
  describe('Mutation - cleanupOldAnalytics', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error if user is not authenticated', async () => {
      const context = {}; // No user
      await expect(
        aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context)
      ).rejects.toThrow('Unauthorized: Admin access required');
    });

    it('should throw an error if user does not have admin or super_admin role', async () => {
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

    it('should succeed and return cleanup result if user has ADMIN role', async () => {
      (cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 42 });
      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(cleanupOldAnalytics).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 42,
        message: 'Successfully deleted 42 old analytics events',
      });
    });

    it('should succeed and return cleanup result if user has SUPER_ADMIN role', async () => {
      (cleanupOldAnalytics as jest.Mock).mockResolvedValue({ deleted: 100 });
      const context = {
        user: {
          id: 'superadmin-1',
          role: 'SUPER_ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(cleanupOldAnalytics).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 100,
        message: 'Successfully deleted 100 old analytics events',
      });
    });
  });
});
