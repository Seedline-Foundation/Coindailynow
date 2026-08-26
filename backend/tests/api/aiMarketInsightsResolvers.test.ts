import { aiMarketInsightsResolvers } from '../../src/api/aiMarketInsightsResolvers';

const mockService = {
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  getSentimentAnalysis: jest.fn(),
  getBatchSentimentAnalysis: jest.fn(),
  getTrendingMemecoins: jest.fn(),
  getWhaleActivity: jest.fn(),
  getMarketInsights: jest.fn(),
  getCacheStats: jest.fn(),
};

jest.mock('../../src/services/aiMarketInsightsService', () => ({
  getAIMarketInsightsService: () => mockService,
}));

describe('aiMarketInsightsResolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation.invalidateMarketCache', () => {
    it('returns FORBIDDEN error when context user is missing', async () => {
      const context = {};
      const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
        null,
        { input: { symbol: 'BTC' } },
        context
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized access');
      expect(result.error).toEqual({
        code: 'FORBIDDEN',
        message: 'Admin authentication required to invalidate cache',
      });
      expect(mockService.invalidateCache).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN error when user is not an admin', async () => {
      const context = { user: { id: 'user-1', role: 'USER' } };
      const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
        null,
        { input: { symbol: 'BTC' } },
        context
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized access');
      expect(result.error).toEqual({
        code: 'FORBIDDEN',
        message: 'Admin authentication required to invalidate cache',
      });
      expect(mockService.invalidateCache).not.toHaveBeenCalled();
    });

    it('invalidates cache for a specific symbol when user is ADMIN', async () => {
      const context = { user: { id: 'admin-1', role: 'ADMIN' } };
      const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
        null,
        { input: { symbol: 'ETH' } },
        context
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cache invalidated for ETH');
      expect(result.error).toBeNull();
      expect(mockService.invalidateCache).toHaveBeenCalledWith('ETH');
    });

    it('invalidates all market caches when symbol is not provided and user is SUPER_ADMIN', async () => {
      const context = { user: { id: 'superadmin-1', role: 'SUPER_ADMIN' } };
      const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
        null,
        { input: {} },
        context
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('All market caches invalidated');
      expect(result.error).toBeNull();
      expect(mockService.invalidateCache).toHaveBeenCalledWith(undefined);
    });

    it('handles service errors gracefully', async () => {
      mockService.invalidateCache.mockRejectedValueOnce(new Error('Redis connection failure'));
      const context = { user: { id: 'admin-1', role: 'ADMIN' } };

      const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
        null,
        { input: { symbol: 'SOL' } },
        context
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to invalidate cache');
      expect(result.error.code).toBe('CACHE_INVALIDATION_ERROR');
      expect(result.error.message).toBe('Redis connection failure');
    });
  });
});
