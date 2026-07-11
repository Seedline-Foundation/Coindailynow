import { drainPromoted } from '../../src/services/govAlertConsumer';
import { performance } from 'perf_hooks';

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Inline copy of the original unoptimized implementation for benchmark comparison
async function originalDrainPromoted(redis: any): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const raw = await redis.rpop('gov_alerts:promoted');
    if (!raw) return;
    try {
      const { url } = JSON.parse(raw) as { url: string };
      const recent = await redis.lrange('gov_alerts:recent', 0, -1);
      const alertRaw = recent.find(r => {
        try {
          return JSON.parse(r).url === url;
        } catch {
          return false;
        }
      });
      if (!alertRaw) {
        continue;
      }
      const alert = JSON.parse(alertRaw);
      // Mock enqueue seed
      await redis.lpush('pipeline_runs:queue', JSON.stringify(alert));
      await redis.ltrim('pipeline_runs:queue', 0, 499);
    } catch (err: any) {
      // ignore
    }
  }
}

describe('govAlertConsumer - drainPromoted', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      rpop: jest.fn(),
      lrange: jest.fn(),
      lpush: jest.fn(),
      ltrim: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully drain promoted alerts and enqueue seeds', async () => {
    // Mock the promoted list to return a promotion, and then null (to end the loop)
    const promotion = { url: 'https://gov.example.com/alert1', at: '2026-07-11T12:00:00Z' };
    mockRedis.rpop.mockResolvedValueOnce(JSON.stringify(promotion))
                 .mockResolvedValue(null);

    // Mock the recent alerts
    const recentAlert = {
      url: 'https://gov.example.com/alert1',
      title: 'Alert 1 Title',
      summary: 'Alert 1 Summary',
      source: 'gov.example.com',
      sourceName: 'Example Gov',
      region: 'East Africa',
      credibility_score: 95,
      detectedAt: '2026-07-11T11:00:00Z',
    };
    mockRedis.lrange.mockResolvedValue([JSON.stringify(recentAlert)]);

    await drainPromoted(mockRedis as any);

    expect(mockRedis.rpop).toHaveBeenCalledTimes(2); // First gets promotion, second gets null
    expect(mockRedis.lrange).toHaveBeenCalledWith('gov_alerts:recent', 0, -1);
    expect(mockRedis.lpush).toHaveBeenCalledTimes(1);
    expect(mockRedis.ltrim).toHaveBeenCalledWith('pipeline_runs:queue', 0, 499);
  });

  test('should skip promotions that are not in the recent list', async () => {
    const promotion = { url: 'https://gov.example.com/alert-unknown', at: '2026-07-11T12:00:00Z' };
    mockRedis.rpop.mockResolvedValueOnce(JSON.stringify(promotion))
                 .mockResolvedValue(null);

    mockRedis.lrange.mockResolvedValue([]);

    await drainPromoted(mockRedis as any);

    expect(mockRedis.lpush).not.toHaveBeenCalled();
  });

  test('comprehensive benchmark: original vs optimized', async () => {
    // Set up 1000 mock recent alerts
    const recentAlerts: string[] = [];
    for (let i = 0; i < 1000; i++) {
      recentAlerts.push(
        JSON.stringify({
          url: `https://gov.example.com/alert-${i}`,
          title: `Alert ${i} Title`,
          source: 'gov.example.com',
          sourceName: 'Example Gov',
          region: 'East Africa',
          credibility_score: 95,
          detectedAt: '2026-07-11T11:00:00Z',
        })
      );
    }

    // Set up 20 promotions targeting elements near the END of the 1000-element list
    const promotions: string[] = [];
    for (let i = 0; i < 20; i++) {
      promotions.push(
        JSON.stringify({
          url: `https://gov.example.com/alert-${999 - i}`,
          at: '2026-07-11T12:00:00Z',
        })
      );
    }

    // Benchmark setup helper
    const setupMockRedis = () => {
      const redis = {
        rpop: jest.fn(),
        lrange: jest.fn().mockResolvedValue(recentAlerts),
        lpush: jest.fn(),
        ltrim: jest.fn(),
      };
      let popCount = 0;
      redis.rpop.mockImplementation(() => {
        if (popCount < promotions.length) {
          return Promise.resolve(promotions[popCount++]);
        }
        return Promise.resolve(null);
      });
      return redis;
    };

    // Warm-up phase
    for (let i = 0; i < 5; i++) {
      await originalDrainPromoted(setupMockRedis());
      await drainPromoted(setupMockRedis() as any);
    }

    // 1) Benchmark original (unoptimized)
    let totalOriginalTime = 0;
    const runs = 100;
    let originalRedisCalls = 0;

    for (let run = 0; run < runs; run++) {
      const redis = setupMockRedis();
      const start = performance.now();
      await originalDrainPromoted(redis);
      const end = performance.now();
      totalOriginalTime += (end - start);
      originalRedisCalls += redis.lrange.mock.calls.length;
    }

    // 2) Benchmark optimized
    let totalOptimizedTime = 0;
    let optimizedRedisCalls = 0;

    for (let run = 0; run < runs; run++) {
      const redis = setupMockRedis();
      const start = performance.now();
      await drainPromoted(redis as any);
      const end = performance.now();
      totalOptimizedTime += (end - start);
      optimizedRedisCalls += redis.lrange.mock.calls.length;
    }

    const avgOriginal = totalOriginalTime / runs;
    const avgOptimized = totalOptimizedTime / runs;
    const speedup = (avgOriginal / avgOptimized).toFixed(2);
    const redisReduction = (originalRedisCalls / runs) - (optimizedRedisCalls / runs);

    console.log('\n=================== BENCHMARK RESULTS ===================');
    console.log(`Original (Unoptimized) Avg Time: ${avgOriginal.toFixed(4)} ms`);
    console.log(`Optimized Avg Time:             ${avgOptimized.toFixed(4)} ms`);
    console.log(`Speedup Factor:                 ${speedup}x faster`);
    console.log(`Average Redis calls (original): ${(originalRedisCalls / runs).toFixed(1)}`);
    console.log(`Average Redis calls (optimized): ${(optimizedRedisCalls / runs).toFixed(1)}`);
    console.log(`Redis Call Reduction:           ${redisReduction} per cycle`);
    console.log('=========================================================\n');

    expect(avgOptimized).toBeLessThan(avgOriginal);
    expect(optimizedRedisCalls / runs).toBe(1); // Should always make exactly 1 redis call
  });
});
