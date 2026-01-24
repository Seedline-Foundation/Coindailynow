import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export interface CacheStrategy {
  name: string;
  ttl: number;
  prefix: string;
  tags: string[];
  invalidationRules: string[];
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageResponseTime: number;
  memoryUsage: number;
  evictionCount: number;
}

export class AdvancedCacheStrategy {
  private redis: Redis;
  private metrics: Map<string, CachePerformanceMetrics> = new Map();
  
  // Cache strategies for different content types
  private strategies: Map<string, CacheStrategy> = new Map([
    ['articles', {
      name: 'articles',
      ttl: 900, // 15 minutes
      prefix: 'articles:',
      tags: ['content', 'articles'],
      invalidationRules: ['article_update', 'category_update'],
    }],
    ['article_detail', {
      name: 'article_detail',
      ttl: 1800, // 30 minutes
      prefix: 'article:detail:',
      tags: ['content', 'article'],
      invalidationRules: ['article_update', 'translation_update'],
    }],
    ['tokens', {
      name: 'tokens',
      ttl: 300, // 5 minutes
      prefix: 'tokens:',
      tags: ['market', 'tokens'],
      invalidationRules: ['market_update', 'token_listing'],
    }],
    ['market_data', {
      name: 'market_data',
      ttl: 60, // 1 minute
      prefix: 'market:',
      tags: ['market', 'realtime'],
      invalidationRules: ['price_update'],
    }],
    ['search_results', {
      name: 'search_results',
      ttl: 600, // 10 minutes
      prefix: 'search:',
      tags: ['search', 'content'],
      invalidationRules: ['content_update', 'index_update'],
    }],
    ['user_profile', {
      name: 'user_profile',
      ttl: 1800, // 30 minutes
      prefix: 'user:profile:',
      tags: ['user', 'profile'],
      invalidationRules: ['profile_update', 'preferences_update'],
    }],
    ['categories', {
      name: 'categories',
      ttl: 3600, // 1 hour
      prefix: 'categories:',
      tags: ['content', 'navigation'],
      invalidationRules: ['category_update'],
    }],
    ['translations', {
      name: 'translations',
      ttl: 7200, // 2 hours
      prefix: 'translations:',
      tags: ['content', 'i18n'],
      invalidationRules: ['translation_update'],
    }],
  ]);

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializeMetrics();
  }

  /**
   * Initialize metrics for all strategies
   */
  private initializeMetrics(): void {
    for (const strategy of this.strategies.values()) {
      this.metrics.set(strategy.name, {
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        evictionCount: 0,
      });
    }
  }

  /**
   * Get cached data with strategy-based TTL and tags
   */
  async get<T>(strategyName: string, key: string, userId?: string): Promise<T | null> {
    const startTime = Date.now();
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      logger.warn(`Unknown cache strategy: ${strategyName}`);
      return null;
    }

    const fullKey = this.buildKey(strategy, key, userId);
    const metrics = this.metrics.get(strategyName)!;

    try {
      const cached = await this.redis.get(fullKey);
      const responseTime = Date.now() - startTime;

      if (cached) {
        metrics.totalHits++;
        metrics.hitRate = metrics.totalHits / (metrics.totalHits + metrics.totalMisses);
        this.updateAverageResponseTime(metrics, responseTime);
        
        logger.debug(`Cache HIT for ${strategyName}:${key} (${responseTime}ms)`);
        return JSON.parse(cached);
      } else {
        metrics.totalMisses++;
        metrics.missRate = metrics.totalMisses / (metrics.totalHits + metrics.totalMisses);
        
        logger.debug(`Cache MISS for ${strategyName}:${key} (${responseTime}ms)`);
        return null;
      }
    } catch (error) {
      logger.error(`Cache error for ${strategyName}:${key}`, error);
      return null;
    }
  }

  /**
   * Set cached data with strategy-based configuration
   */
  async set<T>(strategyName: string, key: string, data: T, userId?: string, customTTL?: number): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      logger.warn(`Unknown cache strategy: ${strategyName}`);
      return;
    }

    const fullKey = this.buildKey(strategy, key, userId);
    const ttl = customTTL || strategy.ttl;

    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(fullKey, ttl, serialized);

      // Add to tag sets for invalidation
      for (const tag of strategy.tags) {
        await this.redis.sadd(`tags:${tag}`, fullKey);
        await this.redis.expire(`tags:${tag}`, ttl + 3600); // Extend tag TTL
      }

      logger.debug(`Cache SET for ${strategyName}:${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for ${strategyName}:${key}`, error);
    }
  }

  /**
   * Invalidate cache by strategy and pattern
   */
  async invalidate(strategyName: string, pattern?: string): Promise<number> {
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      logger.warn(`Unknown cache strategy: ${strategyName}`);
      return 0;
    }

    try {
      let keys: string[] = [];

      if (pattern) {
        // Find keys matching pattern
        const searchPattern = `${strategy.prefix}${pattern}*`;
        keys = await this.redis.keys(searchPattern);
      } else {
        // Invalidate all keys for this strategy
        const searchPattern = `${strategy.prefix}*`;
        keys = await this.redis.keys(searchPattern);
      }

      if (keys.length > 0) {
        await this.redis.del(...keys);
        
        // Update eviction metrics
        const metrics = this.metrics.get(strategyName)!;
        metrics.evictionCount += keys.length;
      }

      logger.info(`Cache invalidated ${keys.length} keys for ${strategyName}${pattern ? `:${pattern}` : ''}`);
      return keys.length;
    } catch (error) {
      logger.error(`Cache invalidation error for ${strategyName}`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tags:${tag}`);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tags:${tag}`);
      }

      logger.info(`Cache invalidated ${keys.length} keys for tag: ${tag}`);
      return keys.length;
    } catch (error) {
      logger.error(`Cache tag invalidation error for tag: ${tag}`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache based on rules
   */
  async invalidateByRule(ruleName: string): Promise<number> {
    let totalInvalidated = 0;

    for (const [strategyName, strategy] of this.strategies.entries()) {
      if (strategy.invalidationRules.includes(ruleName)) {
        const count = await this.invalidate(strategyName);
        totalInvalidated += count;
      }
    }

    logger.info(`Rule '${ruleName}' invalidated ${totalInvalidated} cache entries`);
    return totalInvalidated;
  }

  /**
   * Warm up cache with pre-computed data
   */
  async warmup(strategyName: string, data: Array<{ key: string; value: any; userId?: string }>): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    
    if (!strategy) {
      logger.warn(`Unknown cache strategy: ${strategyName}`);
      return;
    }

    try {
      const pipeline = this.redis.pipeline();

      for (const item of data) {
        const fullKey = this.buildKey(strategy, item.key, item.userId);
        const serialized = JSON.stringify(item.value);
        
        pipeline.setex(fullKey, strategy.ttl, serialized);

        // Add to tag sets
        for (const tag of strategy.tags) {
          pipeline.sadd(`tags:${tag}`, fullKey);
          pipeline.expire(`tags:${tag}`, strategy.ttl + 3600);
        }
      }

      await pipeline.exec();
      logger.info(`Cache warmed up with ${data.length} entries for ${strategyName}`);
    } catch (error) {
      logger.error(`Cache warmup error for ${strategyName}`, error);
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(strategyName?: string): Map<string, CachePerformanceMetrics> | CachePerformanceMetrics | null {
    if (strategyName) {
      return this.metrics.get(strategyName) || null;
    }
    return this.metrics;
  }

  /**
   * Get overall cache health
   */
  async getCacheHealth(): Promise<{
    totalMemoryUsage: string;
    totalKeys: number;
    averageHitRate: number;
    strategiesHealth: Array<{ strategy: string; hitRate: number; keys: number }>;
  }> {
    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const totalMemoryUsage = memoryMatch?.[1]?.trim() || 'Unknown';

      const totalKeys = await this.redis.dbsize();
      
      let totalHits = 0;
      let totalRequests = 0;
      const strategiesHealth = [];

      for (const [strategyName, metrics] of this.metrics.entries()) {
        const strategy = this.strategies.get(strategyName)!;
        const keys = await this.redis.keys(`${strategy.prefix}*`);
        
        totalHits += metrics.totalHits;
        totalRequests += metrics.totalHits + metrics.totalMisses;
        
        strategiesHealth.push({
          strategy: strategyName,
          hitRate: metrics.hitRate,
          keys: keys.length,
        });
      }

      const averageHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

      return {
        totalMemoryUsage,
        totalKeys,
        averageHitRate,
        strategiesHealth,
      };
    } catch (error) {
      logger.error('Error getting cache health', error);
      return {
        totalMemoryUsage: 'Error',
        totalKeys: 0,
        averageHitRate: 0,
        strategiesHealth: [],
      };
    }
  }

  /**
   * Build cache key with strategy prefix and user context
   */
  private buildKey(strategy: CacheStrategy, key: string, userId?: string): string {
    const userPart = userId ? `:user:${userId}` : '';
    return `${strategy.prefix}${key}${userPart}`;
  }

  /**
   * Update average response time for metrics
   */
  private updateAverageResponseTime(metrics: CachePerformanceMetrics, responseTime: number): void {
    const totalRequests = metrics.totalHits + metrics.totalMisses;
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.initializeMetrics();
  }
}

export default AdvancedCacheStrategy;