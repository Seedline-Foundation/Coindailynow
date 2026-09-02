import { aiMarketInsightsResolvers } from '../../src/api/aiMarketInsightsResolvers';
import { getAIMarketInsightsService } from '../../src/services/aiMarketInsightsService';

jest.mock('../../src/services/aiMarketInsightsService', () => ({
  getAIMarketInsightsService: jest.fn(),
}));

describe('aiMarketInsightsResolvers - Mutation.invalidateMarketCache', () => {
  let mockService: { invalidateCache: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      invalidateCache: jest.fn().mockResolvedValue(true),
    };
    (getAIMarketInsightsService as jest.Mock).mockReturnValue(mockService);
  });

  it('should return FORBIDDEN error if context user is missing', async () => {
    const context = {};
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input: { symbol: 'BTC' } },
      context
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized: Admin access required');
    expect(result.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Admin authentication required',
      details: null,
    });
    expect(mockService.invalidateCache).not.toHaveBeenCalled();
  });

  it('should return FORBIDDEN error if context user is not an admin', async () => {
    const context = { user: { id: 'user-1', role: 'USER', isAdmin: false } };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input: { symbol: 'BTC' } },
      context
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized: Admin access required');
    expect(result.error?.code).toBe('FORBIDDEN');
    expect(mockService.invalidateCache).not.toHaveBeenCalled();
  });

  it('should invalidate cache successfully when context user has ADMIN role', async () => {
    const context = { user: { id: 'admin-1', role: 'ADMIN' } };
    const result = await aiMarketInsightsResolvers.Mutation.invalidateMarketCache(
      null,
      { input: { symbol: 'BTC' } },
      context
    );

    expect(result.success).toBe(true);
    expect(result.message).toBe('Cache invalidated for BTC');
    expect(result.error).toBeNull();
    expect(mockService.invalidateCache).toHaveBeenCalledWith('BTC');
  });

  it('should invalidate cache successfully when context user has SUPER_ADMIN role', async () => {
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

  it('should invalidate cache successfully when context user has isAdmin: true', async () => {
    const context = { user: { id: 'admin-2', isAdmin: true } };
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
});
