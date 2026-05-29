/**
 * BE-0-7: Centralized Redis connection (ioredis singleton).
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import { logger } from '../utils/logger';

const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

function createMockRedis(): RedisClient {
  return {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    keys: async () => [],
    expire: async () => 1,
    ttl: async () => -1,
    exists: async () => 0,
    incr: async () => 1,
    decr: async () => 1,
    hget: async () => null,
    hset: async () => 1,
    hdel: async () => 1,
    hgetall: async () => ({}),
    sadd: async () => 1,
    srem: async () => 1,
    smembers: async () => [],
    sismember: async () => 0,
    scard: async () => 0,
    zadd: async () => 1,
    zrem: async () => 1,
    zrange: async () => [],
    zrevrange: async () => [],
    zscore: async () => null,
    zrank: async () => null,
    lrange: async () => [],
    lpush: async () => 1,
    lrem: async () => 1,
    ltrim: async () => 'OK',
    llen: async () => 0,
    publish: async () => 1,
    subscribe: () => {},
    on: () => {},
    quit: async () => {},
    connect: async () => {},
    disconnect: async () => {},
  } as unknown as RedisClient;
}

let client: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (client) return client;

  if (!isRedisEnabled) {
    client = createMockRedis();
    return client;
  }

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
  });

  client.on('connect', () => logger.info('[Redis] Connected'));
  client.on('error', (err) => {
    if (!err.message?.includes('ECONNREFUSED')) {
      logger.error('[Redis] Error', { message: err.message });
    }
  });

  return client;
}

/** @deprecated Use getRedis() — kept for context.ts compatibility */
export const redis = getRedis();
