import { aiMarketInsightsResolvers } from '../../src/api/aiMarketInsightsResolvers';
import { getAIMarketInsightsService } from '../../src/services/aiMarketInsightsService';

// Mock dependencies
jest.mock('../../src/services/aiMarketInsightsService');

describe('AI Market Insights Resolvers - Authorization', () => {
  const mockService = {
    invalidateCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAIMarketInsightsService as jest.Mock).mockReturnValue(mockService);
  });

  describe('Mutation: invalidateMarketCache', () => {
    const resolver = aiMarketInsightsResolvers.Mutation.invalidateMarketCache;

    it('should allow an ADMIN user to invalidate cache', async () => {
      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };
      const input = { symbol: 'BTC' };

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cache invalidated for BTC');
      expect(mockService.invalidateCache).toHaveBeenCalledWith('BTC');
    });

    it('should allow a SUPER_ADMIN user to invalidate cache', async () => {
      const context = {
        user: {
          id: 'superadmin-1',
          role: 'SUPER_ADMIN',
        },
      };
      const input = { symbol: 'ETH' };

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cache invalidated for ETH');
      expect(mockService.invalidateCache).toHaveBeenCalledWith('ETH');
    });

    it('should block a regular USER from invalidating cache', async () => {
      const context = {
        user: {
          id: 'user-1',
          role: 'USER',
        },
      };
      const input = { symbol: 'BTC' };

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Admin privileges required');
      expect(result.error.code).toBe('FORBIDDEN');
      expect(mockService.invalidateCache).not.toHaveBeenCalled();
    });

    it('should block an unauthenticated user from invalidating cache', async () => {
      const context = {}; // No user
      const input = { symbol: 'BTC' };

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Admin privileges required');
      expect(result.error.code).toBe('FORBIDDEN');
      expect(mockService.invalidateCache).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive roles (e.g., lowercase "admin")', async () => {
      const context = {
        user: {
          id: 'admin-1',
          role: 'admin',
        },
      };
      const input = { symbol: 'SOL' };

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cache invalidated for SOL');
      expect(mockService.invalidateCache).toHaveBeenCalledWith('SOL');
    });

    it('should return a success message for all market caches when no symbol is provided', async () => {
      const context = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };
      const input = {}; // No symbol

      const result = await resolver(null, { input }, context);

      expect(result.success).toBe(true);
      expect(result.message).toBe('All market caches invalidated');
      expect(mockService.invalidateCache).toHaveBeenCalledWith(undefined);
    });
  });
});
