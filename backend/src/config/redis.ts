import { createClient, RedisClientType } from 'redis';

// Check if Redis is enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';

// In-memory fallback for when Redis is disabled
const memoryCache = new Map<string, { value: string; expiry?: number }>();

// Create a mock Redis client for development without Redis
const createMockRedisClient = () => ({
  isOpen: false,
  isReady: false,
  connect: async () => { console.log('Redis disabled - using in-memory cache'); },
  quit: async () => {},
  get: async (key: string) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key: string, value: string) => {
    memoryCache.set(key, { value });
    return 'OK';
  },
  setEx: async (key: string, seconds: number, value: string) => {
    memoryCache.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  },
  del: async (key: string) => {
    memoryCache.delete(key);
    return 1;
  },
  on: () => {},
  publish: async () => 0,
  subscribe: async () => {},
  unsubscribe: async () => {},
});

// Create Redis client only if enabled
let redisClient: any;

if (isRedisEnabled) {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 3) {
          console.warn('Redis connection failed - falling back to in-memory cache');
          return false; // Stop retrying
        }
        return retries * 100;
      }
    }
  });

  redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  // Connect to Redis
  redisClient.connect().catch((err: Error) => {
    console.error('Failed to connect to Redis, using in-memory fallback:', err.message);
  });
} else {
  console.log('Redis disabled via REDIS_ENABLED=false - using in-memory cache');
  redisClient = createMockRedisClient();
}

export { redisClient };
