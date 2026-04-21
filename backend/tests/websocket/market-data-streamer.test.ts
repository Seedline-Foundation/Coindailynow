/**
 * Market Data Streamer Tests
 * Task 14: WebSocket Real-Time System
 * 
 * Test suite for real-time market data streaming with rate limiting
 */

import { MarketDataStreamer, MarketDataUpdate } from '../../src/services/websocket/MarketDataStreamer';

class InMemoryRedis {
  private kv = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();
  private sets = new Map<string, Set<string>>();
  private streams = new Map<string, Array<{ id: string; fields: string[] }>>();

  async quit(): Promise<void> {}

  async flushdb(): Promise<void> {
    this.kv.clear();
    this.hashes.clear();
    this.sets.clear();
    this.streams.clear();
  }

  async incr(key: string): Promise<number> {
    const next = (parseInt(this.kv.get(key) || '0', 10) || 0) + 1;
    this.kv.set(key, String(next));
    return next;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  async xadd(key: string, ...args: string[]): Promise<string> {
    const stream = this.streams.get(key) || [];

    let fieldsStart = 0;
    if (args[0] === 'MAXLEN') {
      // Redis XADD with MAXLEN format: MAXLEN ~ <len> <id> <field> <value> ...
      fieldsStart = 3;
    }

    const id = args[fieldsStart] === '*' ? `${Date.now()}-${stream.length}` : args[fieldsStart] || `${Date.now()}-${stream.length}`;
    const fields = args.slice(fieldsStart + 1);
    stream.push({ id, fields });

    if (args[0] === 'MAXLEN') {
      const maxLen = parseInt(args[2] || '1000', 10) || 1000;
      while (stream.length > maxLen) stream.shift();
    }

    this.streams.set(key, stream);
    return id;
  }

  async xrevrange(key: string, _end: string, _start: string, _countLabel?: string, count?: number): Promise<Array<[string, string[]]>> {
    const stream = this.streams.get(key) || [];
    const reversed = [...stream].reverse();
    const limit = Math.max(0, Number(count || reversed.length));
    return reversed.slice(0, limit).map(item => [item.id, item.fields]);
  }

  async xtrim(key: string, _mode: string, minId: string): Promise<number> {
    const stream = this.streams.get(key) || [];
    const minTs = parseInt((minId || '0').split('-')[0] || '0', 10) || 0;
    const filtered = stream.filter((entry) => {
      const ts = parseInt((entry.id || '0').split('-')[0] || '0', 10) || 0;
      return ts >= minTs;
    });
    this.streams.set(key, filtered);
    return filtered.length;
  }

  async hmget(key: string, ...fields: string[]): Promise<string[]> {
    const hash = this.hashes.get(key) || new Map<string, string>();
    return fields.map((f) => hash.get(f) || '0');
  }

  async hincrby(key: string, field: string, inc: number): Promise<number> {
    const hash = this.hashes.get(key) || new Map<string, string>();
    const next = (parseInt(hash.get(field) || '0', 10) || 0) + inc;
    hash.set(field, String(next));
    this.hashes.set(key, hash);
    return next;
  }

  async hincrbyfloat(key: string, field: string, inc: number): Promise<number> {
    const hash = this.hashes.get(key) || new Map<string, string>();
    const next = (parseFloat(hash.get(field) || '0') || 0) + inc;
    hash.set(field, String(next));
    this.hashes.set(key, hash);
    return next;
  }

  async hset(key: string, field: string, value: string | number): Promise<number> {
    const hash = this.hashes.get(key) || new Map<string, string>();
    hash.set(field, String(value));
    this.hashes.set(key, hash);
    return 1;
  }

  async sadd(key: string, value: string): Promise<number> {
    const set = this.sets.get(key) || new Set<string>();
    set.add(value);
    this.sets.set(key, set);
    return set.size;
  }

  async scard(key: string): Promise<number> {
    return (this.sets.get(key) || new Set<string>()).size;
  }

  async keys(pattern: string): Promise<string[]> {
    const all = [
      ...Array.from(this.kv.keys()),
      ...Array.from(this.hashes.keys()),
      ...Array.from(this.sets.keys()),
      ...Array.from(this.streams.keys()),
    ];
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return all.filter((k) => k.startsWith(prefix));
    }
    return all.filter((k) => k === pattern);
  }

  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  pipeline() {
    const ops: Array<() => Promise<any>> = [];
    return {
      hincrby: (key: string, field: string, inc: number) => { ops.push(() => this.hincrby(key, field, inc)); return this.pipelineRef(ops); },
      hincrbyfloat: (key: string, field: string, inc: number) => { ops.push(() => this.hincrbyfloat(key, field, inc)); return this.pipelineRef(ops); },
      sadd: (key: string, value: string) => { ops.push(() => this.sadd(key, value)); return this.pipelineRef(ops); },
      expire: (key: string, seconds: number) => { ops.push(() => this.expire(key, seconds)); return this.pipelineRef(ops); },
      hset: (key: string, field: string, value: string | number) => { ops.push(() => this.hset(key, field, value)); return this.pipelineRef(ops); },
      exec: async () => {
        const out: any[] = [];
        for (const op of ops) out.push(await op());
        return out;
      },
    };
  }

  private pipelineRef(ops: Array<() => Promise<any>>) {
    return {
      hincrby: (key: string, field: string, inc: number) => { ops.push(() => this.hincrby(key, field, inc)); return this.pipelineRef(ops); },
      hincrbyfloat: (key: string, field: string, inc: number) => { ops.push(() => this.hincrbyfloat(key, field, inc)); return this.pipelineRef(ops); },
      sadd: (key: string, value: string) => { ops.push(() => this.sadd(key, value)); return this.pipelineRef(ops); },
      expire: (key: string, seconds: number) => { ops.push(() => this.expire(key, seconds)); return this.pipelineRef(ops); },
      hset: (key: string, field: string, value: string | number) => { ops.push(() => this.hset(key, field, value)); return this.pipelineRef(ops); },
      exec: async () => {
        const out: any[] = [];
        for (const op of ops) out.push(await op());
        return out;
      },
    };
  }
}

const describeWithDb = process.env.DATABASE_URL?.startsWith('postgres') ? describe : describe.skip;

describeWithDb('MarketDataStreamer', () => {
  let redis: InMemoryRedis;
  let streamer: MarketDataStreamer;

  const createValidMarketData = (overrides: Partial<MarketDataUpdate> = {}): MarketDataUpdate => ({
    symbol: 'BTC/USD',
    exchange: 'binance-africa',
    price: 50000,
    priceChange24h: 1000,
    priceChangePercent24h: 2.5,
    volume24h: 1000000,
    high24h: 51000,
    low24h: 49000,
    timestamp: new Date(),
    source: 'websocket',
    quality: 'HIGH',
    ...overrides
  });

  beforeAll(async () => {
    redis = new InMemoryRedis();
    streamer = new MarketDataStreamer(redis);
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear Redis test data
    await redis.flushdb();
  });

  describe('Market Data Streaming', () => {

    test('should stream valid market data updates', async () => {
      const marketData = createValidMarketData();
      
      const result = await streamer.streamMarketData(marketData);
      
      expect(result).toBe(true);
      
      // Verify data was stored in Redis stream
      const latest = await streamer.getLatestMarketData('BTC/USD');
      expect(latest).toBeTruthy();
      expect(latest!.symbol).toBe(marketData.symbol);
      expect(latest!.price).toBe(marketData.price);
      expect(latest!.exchange).toBe(marketData.exchange);
    });

    test('should reject invalid market data', async () => {
      const invalidData = [
        createValidMarketData({ symbol: '' }), // Empty symbol
        createValidMarketData({ exchange: '' }), // Empty exchange  
        createValidMarketData({ price: -100 }), // Negative price
        createValidMarketData({ price: NaN }), // Invalid price
        createValidMarketData({ volume24h: -1000 }), // Negative volume
        createValidMarketData({ quality: 'INVALID' as any }) // Invalid quality
      ];

      for (const data of invalidData) {
        const result = await streamer.streamMarketData(data);
        expect(result).toBe(false);
      }
    });

    test('should enforce rate limiting per symbol', async () => {
      const symbol = 'BTC/USD';
      const marketData = createValidMarketData({ symbol });
      
      // Send many updates rapidly
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(streamer.streamMarketData({
          ...marketData,
          price: 50000 + i,
          timestamp: new Date()
        }));
      }
      
      const results = await Promise.all(promises);
      
      // Some requests should be rate limited (false)
      const successCount = results.filter(r => r === true).length;
      const failureCount = results.filter(r => r === false).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(100); // MAX_UPDATES_PER_SECOND
    });

    test('should handle different symbols independently for rate limiting', async () => {
      const symbols = ['BTC/USD', 'ETH/USD', 'ADA/USD'];
      const updateCounts = new Map();
      
      // Send updates for different symbols
      const promises = [];
      for (const symbol of symbols) {
        for (let i = 0; i < 50; i++) {
          promises.push(
            streamer.streamMarketData(createValidMarketData({ 
              symbol, 
              price: 1000 + i 
            })).then(result => ({ symbol, result }))
          );
        }
      }
      
      const results = await Promise.all(promises);
      
      // Count successful updates per symbol
      results.forEach(({ symbol, result }) => {
        if (result) {
          updateCounts.set(symbol, (updateCounts.get(symbol) || 0) + 1);
        }
      });
      
      // Each symbol should have successful updates
      symbols.forEach(symbol => {
        expect(updateCounts.get(symbol)).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Retrieval', () => {
    test('should retrieve latest market data for a symbol', async () => {
      const symbol = 'BTC/USD';
      const updates = [
        createValidMarketData({ symbol, price: 50000, timestamp: new Date(Date.now() - 2000) }),
        createValidMarketData({ symbol, price: 50500, timestamp: new Date(Date.now() - 1000) }),
        createValidMarketData({ symbol, price: 51000, timestamp: new Date() })
      ];
      
      // Stream updates
      for (const update of updates) {
        await streamer.streamMarketData(update);
      }
      
      const latest = await streamer.getLatestMarketData(symbol);
      expect(latest).toBeTruthy();
      expect(latest!.price).toBe(51000); // Latest price
    });

    test('should return null for non-existent symbols', async () => {
      const latest = await streamer.getLatestMarketData('NONEXISTENT/USD');
      expect(latest).toBeNull();
    });

    test('should retrieve historical market data', async () => {
      const symbol = 'ETH/USD';
      const baseTime = Date.now();
      const updates = [];
      
      // Create historical updates
      for (let i = 0; i < 5; i++) {
        updates.push(createValidMarketData({
          symbol,
          price: 3000 + (i * 100),
          timestamp: new Date(baseTime + (i * 1000))
        }));
      }
      
      // Stream updates
      for (const update of updates) {
        await streamer.streamMarketData(update);
      }
      
      const historical = await streamer.getHistoricalMarketData(symbol, undefined, undefined, 10);
      expect(historical).toHaveLength(5);
      
      // Should be in reverse chronological order (newest first)
      expect(historical[0]?.price).toBe(3400);
      expect(historical[4]?.price).toBe(3000);
    });

    test('should limit historical data results', async () => {
      const symbol = 'ADA/USD';
      
      // Create many updates
      for (let i = 0; i < 10; i++) {
        await streamer.streamMarketData(createValidMarketData({
          symbol,
          price: 1 + (i * 0.1),
          timestamp: new Date(Date.now() + (i * 1000))
        }));
      }
      
      const limited = await streamer.getHistoricalMarketData(symbol, undefined, undefined, 3);
      expect(limited).toHaveLength(3);
    });
  });

  describe('Streaming Statistics', () => {
    test('should track streaming statistics', async () => {
      const updates = [
        createValidMarketData({ symbol: 'BTC/USD', exchange: 'binance' }),
        createValidMarketData({ symbol: 'ETH/USD', exchange: 'luno' }),
        createValidMarketData({ symbol: 'BTC/USD', exchange: 'binance' }),
        createValidMarketData({ symbol: 'ADA/USD', exchange: 'quidax' })
      ];
      
      // Stream updates with small delays to avoid rate limiting
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if (update) {
          await streamer.streamMarketData(update);
          if (i < updates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
      
      const stats = await streamer.getStreamingStats();
      
      expect(stats.totalUpdates).toBeGreaterThan(0);
      expect(stats.symbolsStreaming).toBe(3); // BTC, ETH, ADA
      expect(stats.exchangesActive).toBe(3); // binance, luno, quidax
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    });

    test('should get active symbols', async () => {
      const symbols = ['BTC/USD', 'ETH/USD', 'ADA/USD'];
      
      for (const symbol of symbols) {
        await streamer.streamMarketData(createValidMarketData({ symbol }));
      }
      
      const activeSymbols = await streamer.getActiveSymbols();
      expect(activeSymbols).toEqual(expect.arrayContaining(symbols));
      expect(activeSymbols).toHaveLength(symbols.length);
    });

    test('should calculate updates per second', async () => {
      const symbol = 'BTC/USD';
      
      // Stream several updates
      for (let i = 0; i < 10; i++) {
        await streamer.streamMarketData(createValidMarketData({ 
          symbol, 
          price: 50000 + i 
        }));
      }
      
      const stats = await streamer.getStreamingStats();
      expect(stats.updatesPerSecond).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Management', () => {
    test('should clean up old streaming data', async () => {
      const symbol = 'BTC/USD';
      
      // Create old data (simulate by directly manipulating Redis)
      const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      await redis.xadd(
        `ws:stream:${symbol}`,
        `${oldTimestamp}-0`,
        'symbol', symbol,
        'price', '50000',
        'timestamp', oldTimestamp.toString()
      );
      
      // Add recent data
      await streamer.streamMarketData(createValidMarketData({ symbol }));
      
      // Clean up old data
      await streamer.cleanupOldData();
      
      // Verify old data is cleaned up but recent data remains
      const historical = await streamer.getHistoricalMarketData(symbol);
      expect(historical.length).toBeGreaterThan(0);
      historical.forEach(update => {
        expect(update.timestamp.getTime()).toBeGreaterThan(oldTimestamp + (5 * 60 * 1000));
      });
    });

    test('should handle Redis stream limits', async () => {
      const symbol = 'BTC/USD';
      
      // Create many updates to test MAXLEN
      for (let i = 0; i < 1200; i++) {
        await streamer.streamMarketData(createValidMarketData({
          symbol,
          price: 50000 + i,
          timestamp: new Date(Date.now() + i)
        }));
        
        // Small delay to avoid rate limiting
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      const historical = await streamer.getHistoricalMarketData(symbol, undefined, undefined, 2000);
      
      // Should respect the MAXLEN limit (~1000)
      expect(historical.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      const faultyRedis = {
        incr: async () => { throw new Error('redis_down'); },
      } as any;
      
      const faultyStreamer = new MarketDataStreamer(faultyRedis);
      
      const result = await faultyStreamer.streamMarketData(createValidMarketData());
      expect(result).toBe(false);
    });

    test('should handle malformed data gracefully', async () => {
      const symbol = 'TEST/USD';
      
      // Manually add malformed data to Redis
      await redis.xadd(
        `ws:stream:${symbol}`,
        '*',
        'malformed', 'data',
        'invalid', 'fields'
      );
      
      // Should handle gracefully when retrieving
      const latest = await streamer.getLatestMarketData(symbol);
      // Should return null or handle gracefully without crashing
      expect(latest).toBeDefined(); // At minimum, shouldn't crash
    });

    test('should increment error counts on failures', async () => {
      const symbol = 'ERROR/TEST';
      
      // Try to stream invalid data
      await streamer.streamMarketData(createValidMarketData({ 
        symbol, 
        price: -1 // Invalid price
      }));
      
      const stats = await streamer.getStreamingStats();
      // Error rate calculation should handle division by zero and invalid data
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Tests', () => {
    test('should handle high-frequency updates efficiently', async () => {
      const symbol = 'PERF/USD';
      const updateCount = 500;
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < updateCount; i++) {
        promises.push(streamer.streamMarketData(createValidMarketData({
          symbol,
          price: 1000 + i,
          timestamp: new Date(Date.now() + i)
        })));
        
        // Small stagger to avoid overwhelming rate limiter
        if (i % 50 === 0) {
          await Promise.all(promises.splice(0, 50));
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust based on your performance requirements)
      expect(duration).toBeLessThan(10000); // 10 seconds
      
      // Verify some data was stored
      const latest = await streamer.getLatestMarketData(symbol);
      expect(latest).toBeTruthy();
    });

    test('should efficiently query large amounts of historical data', async () => {
      const symbol = 'HISTORY/USD';
      
      // Add substantial historical data
      for (let i = 0; i < 200; i++) {
        await streamer.streamMarketData(createValidMarketData({
          symbol,
          price: 100 + i,
          timestamp: new Date(Date.now() + (i * 1000))
        }));
        
        if (i % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const startQuery = Date.now();
      const historical = await streamer.getHistoricalMarketData(symbol, undefined, undefined, 100);
      const queryDuration = Date.now() - startQuery;
      
      expect(historical).toHaveLength(100);
      expect(queryDuration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});