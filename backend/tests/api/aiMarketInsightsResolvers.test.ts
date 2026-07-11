import { aiMarketInsightsResolvers } from '../../src/api/aiMarketInsightsResolvers';
import { getAIMarketInsightsService } from '../../src/services/aiMarketInsightsService';

jest.mock('../../src/services/aiMarketInsightsService', () => {
  const mockService = {
    invalidateCache: jest.fn(),
  };
  return {
    getAIMarketInsightsService: () => mockService,
  };
});

describe('aiMarketInsightsResolvers', () => {
  const mockServiceInstance = getAIMarketInsightsService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation - invalidateMarketCache', () => {
    const resolver = aiMarketInsightsResolvers.Mutation.invalidateMarketCache;

    it('should fail if no user is authenticated', async () => {
      const context = {}; // No user in context
      const result = await resolver(null, { input: { symbol: 'BTC' } }, context);

      expect(result).toEqual({
        success: false,
        message: 'Access denied: Admin role required',
        timestamp: expect.any(Date),
        error: {
          code: 'FORBIDDEN',
          message: 'You must be an admin to invalidate the market cache',
        },
      });
      expect(mockServiceInstance.invalidateCache).not.toHaveBeenCalled();
    });

    it('should fail if authenticated user is not an admin', async () => {
      const context = {
        user: {
          id: 'user-1',
          role: 'USER',
        },
      };
      const result = await resolver(null, { input: { symbol: 'BTC' } }, context);

      expect(result).toEqual({
        success: false,
        message: 'Access denied: Admin role required',
        timestamp: expect.any(Date),
        error: {
          code: 'FORBIDDEN',
          message: 'You must be an admin to invalidate the market cache',
        },
      });
      expect(mockServiceInstance.invalidateCache).not.toHaveBeenCalled();
    });

    it('should succeed if authenticated user is an ADMIN', async () => {
      (mockServiceInstance.invalidateCache as jest.Mock).mockResolvedValue(undefined);
      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };
      const result = await resolver(null, { input: { symbol: 'BTC' } }, context);

      expect(result).toEqual({
        success: true,
        message: 'Cache invalidated for BTC',
        timestamp: expect.any(Date),
        error: null,
      });
      expect(mockServiceInstance.invalidateCache).toHaveBeenCalledWith('BTC');
    });

    it('should succeed if authenticated user is a SUPER_ADMIN', async () => {
      (mockServiceInstance.invalidateCache as jest.Mock).mockResolvedValue(undefined);
      const context = {
        user: {
          id: 'superadmin-1',
          role: 'SUPER_ADMIN',
        },
      };
      const result = await resolver(null, { input: {} }, context); // clear all caches

      expect(result).toEqual({
        success: true,
        message: 'All market caches invalidated',
        timestamp: expect.any(Date),
        error: null,
      });
      expect(mockServiceInstance.invalidateCache).toHaveBeenCalledWith(undefined);
    });

    it('should handle service errors gracefully', async () => {
      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };
      (mockServiceInstance.invalidateCache as jest.Mock).mockRejectedValue(new Error('Redis connection lost'));

      const result = await resolver(null, { input: { symbol: 'BTC' } }, context);

      expect(result).toEqual({
        success: false,
        message: 'Failed to invalidate cache',
        timestamp: expect.any(Date),
        error: {
          code: 'CACHE_INVALIDATION_ERROR',
          message: 'Redis connection lost',
          details: expect.any(String),
        },
      });
    });
  });
});
