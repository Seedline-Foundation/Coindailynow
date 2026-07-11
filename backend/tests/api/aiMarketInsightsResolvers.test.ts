import { aiMarketInsightsResolvers } from '../../src/api/aiMarketInsightsResolvers';
import { getAIMarketInsightsService } from '../../src/services/aiMarketInsightsService';

// Mock dependencies
jest.mock('../../src/services/aiMarketInsightsService', () => ({
  getAIMarketInsightsService: jest.fn(),
}));

const mockInvalidateCache = jest.fn();
const mockGetAIMarketInsightsService = getAIMarketInsightsService as jest.Mock;

describe('AI Market Insights Resolvers - invalidateMarketCache', () => {
  let context: any;

  beforeEach(() => {
    mockInvalidateCache.mockReset();
    mockGetAIMarketInsightsService.mockReset();

    // Mock the service instance returned by getAIMarketInsightsService
    mockGetAIMarketInsightsService.mockReturnValue({
      invalidateCache: mockInvalidateCache,
    });

    context = {
      user: {
        id: 'user-admin',
        username: 'adminuser',
        role: 'ADMIN',
      },
    };
  });

  it('should successfully invalidate cache for admin role', async () => {
    mockInvalidateCache.mockResolvedValue(undefined);

    const input = { symbol: 'BTC' };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input },
      context
    );

    expect(mockGetAIMarketInsightsService).toHaveBeenCalled();
    expect(mockInvalidateCache).toHaveBeenCalledWith('BTC');
    expect(result).toEqual({
      success: true,
      message: 'Cache invalidated for BTC',
      timestamp: expect.any(Date),
      error: null,
    });
  });

  it('should successfully invalidate all caches if no symbol is provided', async () => {
    mockInvalidateCache.mockResolvedValue(undefined);

    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input: null },
      context
    );

    expect(mockGetAIMarketInsightsService).toHaveBeenCalled();
    expect(mockInvalidateCache).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({
      success: true,
      message: 'All market caches invalidated',
      timestamp: expect.any(Date),
      error: null,
    });
  });

  it('should successfully invalidate cache for super admin role', async () => {
    context.user.role = 'SUPER_ADMIN';
    mockInvalidateCache.mockResolvedValue(undefined);

    const input = { symbol: 'ETH' };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input },
      context
    );

    expect(mockGetAIMarketInsightsService).toHaveBeenCalled();
    expect(mockInvalidateCache).toHaveBeenCalledWith('ETH');
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should return FORBIDDEN error when user is not authenticated', async () => {
    context.user = null;

    const input = { symbol: 'BTC' };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input },
      context
    );

    expect(mockGetAIMarketInsightsService).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      message: 'Unauthorized: Admin access required',
      timestamp: expect.any(Date),
      error: {
        code: 'FORBIDDEN',
        message: 'You must be an admin or super admin to perform this action',
        details: null,
      },
    });
  });

  it('should return FORBIDDEN error when authenticated user is not an admin', async () => {
    context.user.role = 'USER';

    const input = { symbol: 'BTC' };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input },
      context
    );

    expect(mockGetAIMarketInsightsService).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      message: 'Unauthorized: Admin access required',
      timestamp: expect.any(Date),
      error: {
        code: 'FORBIDDEN',
        message: 'You must be an admin or super admin to perform this action',
        details: null,
      },
    });
  });

  it('should return FORBIDDEN error when user object is completely missing from context', async () => {
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input: { symbol: 'BTC' } },
      {} // No user field at all
    );

    expect(mockGetAIMarketInsightsService).not.toHaveBeenCalled();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('should handle service errors gracefully during cache invalidation', async () => {
    mockInvalidateCache.mockRejectedValue(new Error('Redis connection failure'));

    const input = { symbol: 'BTC' };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input },
      context
    );

    expect(mockGetAIMarketInsightsService).toHaveBeenCalled();
    expect(mockInvalidateCache).toHaveBeenCalledWith('BTC');
    expect(result).toEqual({
      success: false,
      message: 'Failed to invalidate cache',
      timestamp: expect.any(Date),
      error: {
        code: 'CACHE_INVALIDATION_ERROR',
        message: 'Redis connection failure',
        details: expect.any(String),
      },
    });
  });
});
