/**
 * IORedis wrapper with graceful fallback
 * Use this instead of importing ioredis directly
 */
import Redis from 'ioredis';

// Check if Redis is enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

// In-memory fallback for when Redis is disabled
const memoryCache = new Map<string, { value: string; expiry?: number }>();
const subscribers = new Map<string, Set<(channel: string, message: string) => void>>();

// Create a mock Redis client that mimics ioredis API
class MockIORedis {
  private handlers: Map<string, Function[]> = new Map();
  
  constructor(_options?: any) {
    console.log('IORedis disabled - using in-memory fallback');
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
    return this;
  }

  async get(key: string): Promise<string | null> {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, _ex?: string, _ttl?: number): Promise<string> {
    const expiry = _ex === 'EX' && _ttl ? Date.now() + _ttl * 1000 : undefined;
    memoryCache.set(key, { value, expiry });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    memoryCache.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    keys.forEach(k => memoryCache.delete(k));
    return keys.length;
  }

  async incr(key: string): Promise<number> {
    const current = memoryCache.get(key);
    const newVal = current ? parseInt(current.value) + 1 : 1;
    memoryCache.set(key, { value: String(newVal) });
    return newVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = memoryCache.get(key);
    if (item) {
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async exists(key: string): Promise<number> {
    return memoryCache.has(key) ? 1 : 0;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const current = memoryCache.get(key);
    const list = current ? JSON.parse(current.value) : [];
    list.unshift(...values);
    memoryCache.set(key, { value: JSON.stringify(list) });
    return list.length;
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const current = memoryCache.get(key);
    const list = current ? JSON.parse(current.value) : [];
    list.push(...values);
    memoryCache.set(key, { value: JSON.stringify(list) });
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const current = memoryCache.get(key);
    if (!current) return [];
    const list = JSON.parse(current.value);
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }

  async publish(channel: string, message: string): Promise<number> {
    const subs = subscribers.get(channel);
    if (subs) {
      subs.forEach(handler => handler(channel, message));
      return subs.size;
    }
    return 0;
  }

  async subscribe(channel: string, callback?: (err: Error | null, count: number) => void): Promise<void> {
    if (!subscribers.has(channel)) {
      subscribers.set(channel, new Set());
    }
    callback?.(null, 1);
  }

  async unsubscribe(channel?: string): Promise<void> {
    if (channel) {
      subscribers.delete(channel);
    } else {
      subscribers.clear();
    }
  }

  async quit(): Promise<string> {
    return 'OK';
  }

  async disconnect(): Promise<void> {}
}

// Export the appropriate Redis class
const IORedis = isRedisEnabled ? Redis : MockIORedis;

// Create a singleton instance for general use
const createRedisClient = (options?: any) => {
  if (!isRedisEnabled) {
    return new MockIORedis(options);
  }
  
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.warn('Redis connection failed, operations will use fallback');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 1000);
    },
    ...options,
  });
  
  client.on('error', (err: Error) => {
    // Suppress connection refused errors after initial warning
    if (!err.message.includes('ECONNREFUSED') || times <= 1) {
      console.error('IORedis error:', err.message);
    }
  });
  
  return client;
};

let times = 0;

export { IORedis as default, createRedisClient, MockIORedis };
