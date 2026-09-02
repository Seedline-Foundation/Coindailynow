import * as predictiveSeoService from '../../src/services/predictiveSeoService';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    sEOKeyword: {
      findMany: jest.fn(),
    },
    sEORanking: {
      findMany: jest.fn(),
    },
    searchForecast: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('../../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

describe('predictiveSeoService - generateAllForecasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process all active keywords in parallel batches', async () => {
    const mockKeywords = Array.from({ length: 25 }, (_, i) => ({
      id: `kw-${i + 1}`,
      keyword: `keyword-${i + 1}`,
      isActive: true,
    }));

    (prisma.sEOKeyword.findMany as jest.Mock).mockResolvedValue(mockKeywords);
    (prisma.sEORanking.findMany as jest.Mock).mockResolvedValue([
      { searchVolume: 1000, position: 10, clicks: 50 },
    ]);
    (prisma.searchForecast.upsert as jest.Mock).mockImplementation((args: any) =>
      Promise.resolve(args.create)
    );

    await predictiveSeoService.generateAllForecasts();

    expect(prisma.sEOKeyword.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      take: 100,
    });
    expect(prisma.searchForecast.upsert).toHaveBeenCalledTimes(25);
  });

  it('should handle errors for individual keywords without halting processing of remaining keywords', async () => {
    const mockKeywords = [
      { id: 'kw-1', keyword: 'keyword-1', isActive: true },
      { id: 'kw-2', keyword: 'keyword-2', isActive: true },
      { id: 'kw-3', keyword: 'keyword-3', isActive: true },
    ];

    (prisma.sEOKeyword.findMany as jest.Mock).mockResolvedValue(mockKeywords);
    (prisma.sEORanking.findMany as jest.Mock).mockResolvedValue([
      { searchVolume: 1000, position: 10, clicks: 50 },
    ]);
    (prisma.searchForecast.upsert as jest.Mock).mockImplementation((args: any) => {
      if (args.where.id === 'kw-2') {
        return Promise.reject(new Error('Database error on kw-2'));
      }
      return Promise.resolve(args.create);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await predictiveSeoService.generateAllForecasts();

    expect(prisma.searchForecast.upsert).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error generating forecast for keyword-2:'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
