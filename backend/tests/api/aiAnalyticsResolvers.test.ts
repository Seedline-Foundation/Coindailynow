import { aiAnalyticsResolvers, stopPeriodicUpdates } from '../../src/api/aiAnalyticsResolvers';
import * as aiAnalyticsService from '../../src/services/aiAnalyticsService';

jest.mock('../../src/services/aiAnalyticsService', () => ({
  ...jest.requireActual('../../src/services/aiAnalyticsService'),
  cleanupOldAnalytics: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('aiAnalyticsResolvers', () => {
  afterAll(() => {
    stopPeriodicUpdates();
  });

  describe('Mutation - cleanupOldAnalytics', () => {
    const mockedCleanup = aiAnalyticsService.cleanupOldAnalytics as jest.MockedFunction<
      typeof aiAnalyticsService.cleanupOldAnalytics
    >;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error when context.user is not present', async () => {
      const context = {};

      await expect(
        aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context)
      ).rejects.toThrow('Unauthorized: Admin access required');

      expect(mockedCleanup).not.toHaveBeenCalled();
    });

    it('should throw an error when context.user is not an admin', async () => {
      const context = {
        user: {
          id: 'user-1',
          role: 'USER',
          isAdmin: false,
        },
      };

      await expect(
        aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context)
      ).rejects.toThrow('Unauthorized: Admin access required');

      expect(mockedCleanup).not.toHaveBeenCalled();
    });

    it('should perform cleanup when context.user has isAdmin: true', async () => {
      mockedCleanup.mockResolvedValueOnce({ deleted: 42 });

      const context = {
        user: {
          id: 'admin-1',
          isAdmin: true,
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(mockedCleanup).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 42,
        message: 'Successfully deleted 42 old analytics events',
      });
    });

    it('should perform cleanup when context.user has role: "ADMIN"', async () => {
      mockedCleanup.mockResolvedValueOnce({ deleted: 15 });

      const context = {
        user: {
          id: 'admin-2',
          role: 'ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(mockedCleanup).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 15,
        message: 'Successfully deleted 15 old analytics events',
      });
    });

    it('should perform cleanup when context.user has role: "SUPER_ADMIN"', async () => {
      mockedCleanup.mockResolvedValueOnce({ deleted: 100 });

      const context = {
        user: {
          id: 'super-admin-1',
          role: 'SUPER_ADMIN',
        },
      };

      const result = await aiAnalyticsResolvers.Mutation.cleanupOldAnalytics(null, {}, context);

      expect(mockedCleanup).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        deleted: 100,
        message: 'Successfully deleted 100 old analytics events',
      });
    });
  });
});
