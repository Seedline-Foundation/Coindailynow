import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        return new Error('Redis connection failed after 10 retries');
      }
      return retries * 100; // Exponential backoff
    }
  }
});

// Error handling
redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Connect to Redis
redisClient.connect().catch((err: Error) => {
  console.error('Failed to connect to Redis:', err);
});

export { redisClient };
