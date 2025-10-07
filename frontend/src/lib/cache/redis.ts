/**
 * Redis Cache Utility
 * Provides caching functionality for dashboard data and API responses
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

// Initialize Redis with error handling
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  redis.on('error', (error) => {
    console.warn('Redis connection error:', error.message);
    redis = null; // Disable Redis on connection failure
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });
} catch (error) {
  console.warn('Failed to initialize Redis:', error);
  redis = null;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
}

export class CacheManager {
  private static instance: CacheManager;
  private redis: Redis | null;

  private constructor() {
    this.redis = redis;
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl: number = 300): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cached data with pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  }

  /**
   * Get or set cached data
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Cache the result
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    hitRate?: number;
    totalKeys?: number;
  }> {
    if (!this.redis) {
      return { connected: false };
    }
    
    try {
      const info = await this.redis.info();
      const connected = this.redis.status === 'ready';

      // Parse Redis info for basic stats
      const lines = info.split('\n');
      const stats: any = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        connected,
        totalKeys: parseInt(stats.db0_keys || '0'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
      };
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache key generators
export const cacheKeys = {
  dashboard: {
    stats: 'dashboard:stats',
    userStats: 'dashboard:user_stats',
    contentStats: 'dashboard:content_stats',
    aiStats: 'dashboard:ai_stats',
    revenueStats: 'dashboard:revenue_stats',
    systemStats: 'dashboard:system_stats',
    communityStats: 'dashboard:community_stats',
  },
  users: {
    list: (page: number, limit: number) => `users:list:${page}:${limit}`,
    detail: (id: string) => `users:detail:${id}`,
    count: 'users:count',
  },
  articles: {
    list: (page: number, limit: number, status?: string) =>
      `articles:list:${page}:${limit}:${status || 'all'}`,
    detail: (id: string) => `articles:detail:${id}`,
    count: 'articles:count',
  },
  analytics: {
    events: (date: string) => `analytics:events:${date}`,
    summary: (period: string) => `analytics:summary:${period}`,
  },
};

// Cache TTL configurations
export const cacheConfig = {
  dashboard: {
    stats: 300, // 5 minutes
    userStats: 600, // 10 minutes
    contentStats: 300, // 5 minutes
    aiStats: 180, // 3 minutes
    revenueStats: 600, // 10 minutes
    systemStats: 60, // 1 minute
    communityStats: 300, // 5 minutes
  },
  users: {
    list: 300, // 5 minutes
    detail: 600, // 10 minutes
    count: 60, // 1 minute
  },
  articles: {
    list: 180, // 3 minutes
    detail: 600, // 10 minutes
    count: 60, // 1 minute
  },
  analytics: {
    events: 3600, // 1 hour
    summary: 1800, // 30 minutes
  },
};