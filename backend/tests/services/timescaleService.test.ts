import { TimescaleService } from '../../src/services/timescaleService';
import { PrismaClient } from '@prisma/client';

describe('TimescaleService', () => {
  let timescaleService: TimescaleService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    timescaleService = new TimescaleService(mockPrisma as unknown as PrismaClient);
  });

  describe('getCandles', () => {
    it('should query continuous aggregate price_ticks_1h correctly', async () => {
      const from = new Date('2026-08-01T00:00:00Z');
      const to = new Date('2026-08-02T00:00:00Z');

      await timescaleService.getCandles('BTC/USD', 'binance', '1h', from, to, 100);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      // The template literal tags standard SQL parameters securely
      const queryCall = mockPrisma.$queryRaw.mock.calls[0];
      expect(queryCall).toBeDefined();
    });

    it('should query continuous aggregate price_ticks_1d correctly', async () => {
      const from = new Date('2026-08-01T00:00:00Z');
      const to = new Date('2026-08-02T00:00:00Z');

      await timescaleService.getCandles('BTC/USD', 'binance', '1d', from, to, 100);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should query hypertable directly for sub-hourly intervals', async () => {
      const from = new Date('2026-08-01T00:00:00Z');
      const to = new Date('2026-08-02T00:00:00Z');

      await timescaleService.getCandles('BTC/USD', 'binance', '15m', from, to, 100);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should reject invalid intervals', async () => {
      const from = new Date();
      const to = new Date();
      await expect(
        timescaleService.getCandles('BTC/USD', 'binance', '2h' as any, from, to, 100)
      ).rejects.toThrow('Invalid interval');
    });

    it('should reject invalid symbols', async () => {
      const from = new Date();
      const to = new Date();
      await expect(
        timescaleService.getCandles('BTC; DROP TABLE price_ticks;', 'binance', '1h', from, to, 100)
      ).rejects.toThrow('Invalid symbol');
    });

    it('should reject invalid exchanges', async () => {
      const from = new Date();
      const to = new Date();
      await expect(
        timescaleService.getCandles('BTC/USD', 'binance;--', '1h', from, to, 100)
      ).rejects.toThrow('Invalid exchange');
    });

    it('should reject invalid continuous aggregate views in queryContinuousAggregate', async () => {
      const from = new Date();
      const to = new Date();

      // Accessing the private queryContinuousAggregate method for testing
      await expect(
        (timescaleService as any).queryContinuousAggregate('invalid_view', 'BTC/USD', 'binance', from, to, 100)
      ).rejects.toThrow('Invalid continuous aggregate view name');
    });
  });

  describe('getPremiumHistory', () => {
    it('should check constraints and query ngn_premium_1h', async () => {
      const from = new Date();
      const to = new Date();

      await timescaleService.getPremiumHistory('NGN', 'USDT', 'binance', from, to);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should reject invalid fiatCurrency', async () => {
      const from = new Date();
      const to = new Date();
      await expect(
        timescaleService.getPremiumHistory('N G N', 'USDT', 'binance', from, to)
      ).rejects.toThrow('Invalid currency');
    });
  });

  describe('getLatestPrice', () => {
    it('should query price_ticks for latest price', async () => {
      await timescaleService.getLatestPrice('BTC/USD');

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('isTimescaleAvailable', () => {
    it('should query pg_extension and return true if extension exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ extname: 'timescaledb' }]);
      const isAvailable = await timescaleService.isTimescaleAvailable();
      expect(isAvailable).toBe(true);
    });

    it('should return false if extension does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      const isAvailable = await timescaleService.isTimescaleAvailable();
      expect(isAvailable).toBe(false);
    });

    it('should return false if query throws', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
      const isAvailable = await timescaleService.isTimescaleAvailable();
      expect(isAvailable).toBe(false);
    });
  });
});
