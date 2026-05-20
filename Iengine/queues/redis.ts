/**
 * Redis Connection Manager for Iengine
 * Shared Redis connection used by BullMQ queues and caching.
 */

import Redis from 'ioredis';

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.IENGINE_REDIS_DB || '2'),
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => Math.min(times * 100, 5000),
      lazyConnect: true,
    });

    connection.on('error', (err) => {
      console.error('[Iengine:Redis] Connection error:', err.message);
    });

    connection.on('connect', () => {
      console.log('[Iengine:Redis] Connected');
    });
  }

  return connection;
}

export function createRedisConnection(): Redis {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.IENGINE_REDIS_DB || '2'),
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 100, 5000),
  });
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}

export default getRedisConnection;
