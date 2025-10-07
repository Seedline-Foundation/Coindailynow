import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  skipCache?: boolean;
  tags?: string[]; // For cache invalidation
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  lastReset: Date;
  errors: number;
  memoryUsage?: string;
}

export interface CacheBatchItem {
  key: string;
  data: any;
  ttl?: number;
}

export interface CacheWarmupItem {
  key: string;
  data: any;
  ttl?: number;
}

export interface MemoryInfo {
  usedMemory: number;
  usedMemoryHuman: string;
  maxMemory?: number | undefined;
  maxMemoryHuman?: string | undefined;
}

class CacheService {
  private redis: Redis;
  private metrics: CacheMetrics;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly KEY_PREFIX = 'coindaily:';

  constructor(redis: Redis) {
    this.redis = redis;
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastReset: new Date(),
      errors: 0,
    };
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(operation: string, args: any, userId?: string): string {
    const keyData = {
      operation,
      args: JSON.stringify(args),
      userId: userId || 'anonymous',
    };
    
    const keyString = JSON.stringify(keyData);
    // Use MD5 hash for consistent, collision-resistant keys
    const hash = createHash('md5').update(keyString).digest('hex');
    
    return `${this.KEY_PREFIX}${operation}:${hash}`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const cached = await this.redis.get(key);
      const responseTime = Date.now() - startTime;
      
      this.updateResponseTime(responseTime);

      if (cached) {
        this.metrics.hits++;
        this.updateHitRate();
        
        logger.debug(`Cache HIT for key: ${key} (${responseTime}ms)`);
        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        this.updateHitRate();
        
        logger.debug(`Cache MISS for key: ${key} (${responseTime}ms)`);
        return null;
      }
    } catch (error) {
      logger.error('Cache GET error:', error);
      this.metrics.misses++;
      this.metrics.errors++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, ttl, serialized);
      
      logger.debug(`Cache SET for key: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Cache SET error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Batch set operations for improved performance
   */
  async setBatch(items: CacheBatchItem[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      items.forEach(item => {
        const key = item.key.startsWith(this.KEY_PREFIX) ? item.key : `${this.KEY_PREFIX}${item.key}`;
        const ttl = item.ttl || this.DEFAULT_TTL;
        pipeline.setex(key, ttl, JSON.stringify(item.data));
      });
      
      await pipeline.exec();
      logger.debug(`Cache BATCH SET: ${items.length} items`);
    } catch (error) {
      logger.error('Cache BATCH SET error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Cache warming strategy for popular content
   */
  async warmCache(items: CacheWarmupItem[]): Promise<void> {
    try {
      const warmupPromises = items.map(item => {
        const key = item.key.startsWith(this.KEY_PREFIX) ? item.key : `${this.KEY_PREFIX}${item.key}`;
        const operationType = item.key.split(':')[0] || 'default';
        const ttl = item.ttl || this.getTTLByOperation(operationType);
        return this.set(key, item.data, ttl);
      });
      
      await Promise.all(warmupPromises);
      logger.info(`Cache warmed with ${items.length} items`);
    } catch (error) {
      logger.error('Cache warming error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Get memory usage information
   */
  async getMemoryUsage(): Promise<MemoryInfo> {
    try {
      const memoryInfo = await this.redis.info('memory');
      const lines = memoryInfo.split('\r\n');
      
      const usedMemoryLine = lines.find(line => line.startsWith('used_memory:'));
      const usedMemoryHumanLine = lines.find(line => line.startsWith('used_memory_human:'));
      const maxMemoryLine = lines.find(line => line.startsWith('maxmemory:'));
      const maxMemoryHumanLine = lines.find(line => line.startsWith('maxmemory_human:'));
      
      return {
        usedMemory: usedMemoryLine ? parseInt(usedMemoryLine.split(':')[1] || '0') : 0,
        usedMemoryHuman: usedMemoryHumanLine ? (usedMemoryHumanLine.split(':')[1] || '0B') : '0B',
        maxMemory: maxMemoryLine ? parseInt(maxMemoryLine.split(':')[1] || '0') : undefined,
        maxMemoryHuman: maxMemoryHumanLine ? (maxMemoryHumanLine.split(':')[1] || undefined) : undefined,
      };
    } catch (error) {
      logger.error('Get memory usage error:', error);
      this.metrics.errors++;
      return {
        usedMemory: 0,
        usedMemoryHuman: '0B',
      };
    }
  }

  /**
   * Check cache connectivity and performance
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; error?: string }> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const latency = Date.now() - startTime;
      
      return {
        status: latency < 100 ? 'healthy' : 'unhealthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStatistics(): Promise<CacheMetrics & { memoryInfo: MemoryInfo }> {
    const memoryInfo = await this.getMemoryUsage();
    return {
      ...this.metrics,
      memoryUsage: memoryInfo.usedMemoryHuman,
      memoryInfo,
    };
  }

  /**
   * African market specific caching methods
   */

  /**
   * Cache African exchange data with 30-second TTL
   */
  async cacheAfricanExchangeData(exchange: string, data: any): Promise<void> {
    const key = `african:${exchange}`;
    await this.set(key, data, 30); // 30 seconds as per requirement
  }

  /**
   * Cache mobile money rates with 5-minute TTL
   */
  async cacheMobileMoneyRates(provider: string, data: any): Promise<void> {
    const key = `mobile:${provider}`;
    await this.set(key, data, 300); // 5 minutes
  }

  /**
   * Cache multi-language article content with 1-hour TTL
   */
  async cacheMultiLanguageContent(articleId: string, language: string, content: any): Promise<void> {
    const key = `multilang:article:${articleId}:${language}`;
    await this.set(key, content, 3600); // 1 hour as per article requirement
  }

  /**
   * Get cached multi-language content
   */
  async getMultiLanguageContent(articleId: string, language: string): Promise<any> {
    const key = `multilang:article:${articleId}:${language}`;
    return await this.get(key);
  }

  /**
   * Performance monitoring with African network considerations
   */
  async monitorPerformance(): Promise<{
    cacheHitRate: number;
    averageResponseTime: number;
    slowRequests: number;
    africanOptimized: boolean;
  }> {
    const stats = await this.getStatistics();
    
    return {
      cacheHitRate: stats.hitRate,
      averageResponseTime: stats.averageResponseTime,
      slowRequests: stats.errors,
      africanOptimized: stats.hitRate >= 75, // Target hit rate for African networks
    };
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      logger.error('Cache DELETE error:', error);
    }
  }

  /**
   * Delete cache entries by pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.KEY_PREFIX}${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache DELETE by pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error('Cache DELETE by pattern error:', error);
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
  }

  /**
   * Update average response time
   */
  private updateResponseTime(responseTime: number): void {
    const total = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (total + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      lastReset: new Date(),
      errors: 0,
    };
  }

  /**
   * GraphQL resolver cache wrapper
   */
  cacheResolver<T>(
    operation: string,
    resolver: (args: any, context: any) => Promise<T>,
    options: CacheOptions = {}
  ) {
    return async (parent: any, args: any, context: any): Promise<T> => {
      // Skip cache if disabled
      if (options.skipCache) {
        return await resolver(args, context);
      }

      const cacheKey = this.generateKey(operation, args, context.user?.id);
      
      // Try to get from cache first
      const cached = await this.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute resolver and cache result
      const startTime = Date.now();
      const result = await resolver(args, context);
      const executionTime = Date.now() - startTime;

      // Only cache if execution took less than 2 seconds (performance requirement)
      if (executionTime < 2000) {
        const ttl = options.ttl || this.getTTLByOperation(operation);
        await this.set(cacheKey, result, ttl);
      } else {
        logger.warn(`Slow resolver not cached: ${operation} (${executionTime}ms)`);
      }

      return result;
    };
  }

  /**
   * Get TTL based on operation type with African market optimizations
   */
  private getTTLByOperation(operation: string): number {
    const ttlMap: Record<string, number> = {
      // Articles: 1 hour (3600s) - as per requirement
      'article': 3600,
      'articles': 3600,
      'featuredArticles': 3600,
      'trendingArticles': 1800, // 30 minutes for trending content
      
      // Market data: 30 seconds - as per requirement
      'marketData': 30,
      'market': 30,
      'prices': 30,
      'token': 300, // 5 minutes for individual tokens
      'tokens': 300,
      
      // User data: 5 minutes (300s) - as per requirement
      'user': 300,
      'users': 300,
      'me': 300,
      'profile': 300,
      
      // AI content: 2 hours (7200s) - as per requirement
      'ai': 7200,
      'aiContent': 7200,
      'aiAgents': 7200,
      'aiTasks': 600, // 10 minutes for task status
      'aiGenerated': 7200,
      
      // Categories and tags: 2 hours
      'categories': 7200,
      'category': 7200,
      'tags': 7200,
      'trendingTags': 1800, // 30 minutes for trending tags
      
      // Search: 10 minutes
      'search': 600,
      'searchSuggestions': 1800,
      'searchResults': 600,
      
      // Community: 5 minutes
      'communityPosts': 300,
      'communityPost': 300,
      'comments': 180, // 3 minutes for comments
      
      // African market specific caching
      'african': 30, // African exchange data - 30 seconds
      'luno': 30, // South African exchange
      'quidax': 30, // Nigerian exchange
      'binanceAfrica': 30, // Binance Africa
      'valr': 30, // South African exchange
      'buycoins': 30, // Nigerian exchange
      'ice3x': 30, // South African exchange
      
      // Mobile money data: 5 minutes (rates don't change frequently)
      'mobile': 300,
      'mpesa': 300,
      'orangeMoney': 300,
      'mtnMoney': 300,
      'ecocash': 300,
      
      // Multi-language content: 1 hour
      'multilang': 3600,
      'translation': 3600,
      
      // Analytics and metrics: 10 minutes
      'analytics': 600,
      'metrics': 600,
      'stats': 600,
    };

    return ttlMap[operation] || this.DEFAULT_TTL;
  }

  /**
   * Cache invalidation for content updates with African market support
   */
  async invalidateContent(contentType: string, id?: string): Promise<void> {
    try {
      switch (contentType) {
        case 'article':
          await this.deleteByPattern('article*');
          await this.deleteByPattern('featuredArticles*');
          await this.deleteByPattern('trendingArticles*');
          await this.deleteByPattern('multilang*'); // Invalidate translations
          break;
        
        case 'user':
          if (id) {
            await this.deleteByPattern(`*userId":"${id}"*`);
          }
          await this.deleteByPattern('users*');
          await this.deleteByPattern('profile*');
          break;
        
        case 'market':
          await this.deleteByPattern('marketData*');
          await this.deleteByPattern('market*');
          await this.deleteByPattern('token*');
          await this.deleteByPattern('prices*');
          // Invalidate African exchange data
          await this.deleteByPattern('african*');
          await this.deleteByPattern('luno*');
          await this.deleteByPattern('quidax*');
          await this.deleteByPattern('binanceAfrica*');
          await this.deleteByPattern('valr*');
          await this.deleteByPattern('buycoins*');
          await this.deleteByPattern('ice3x*');
          break;
        
        case 'category':
          await this.deleteByPattern('categor*');
          break;
        
        case 'tag':
          await this.deleteByPattern('tag*');
          break;
        
        case 'ai':
        case 'aiContent':
          await this.deleteByPattern('ai*');
          await this.deleteByPattern('aiContent*');
          await this.deleteByPattern('aiGenerated*');
          break;
        
        case 'mobileMoney':
          await this.deleteByPattern('mobile*');
          await this.deleteByPattern('mpesa*');
          await this.deleteByPattern('orangeMoney*');
          await this.deleteByPattern('mtnMoney*');
          await this.deleteByPattern('ecocash*');
          break;
        
        case 'translation':
          await this.deleteByPattern('multilang*');
          await this.deleteByPattern('translation*');
          break;
        
        case 'search':
          await this.deleteByPattern('search*');
          break;
        
        case 'all':
          // Nuclear option - clear all cache
          await this.redis.flushdb();
          logger.warn('All cache cleared');
          break;
        
        default:
          logger.warn(`Unknown content type for invalidation: ${contentType}`);
      }
      
      logger.info(`Cache invalidated for content type: ${contentType}${id ? ` (id: ${id})` : ''}`);
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      this.metrics.errors++;
    }
  }
}

/**
 * Express middleware for response time monitoring
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: BufferEncoding, cb?: () => void) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests
    if (responseTime > 500) {
      logger.warn(`Slow request detected: ${req.method} ${req.path} (${responseTime}ms)`);
    }
    
    // Add response time header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    // Enforce 2-second timeout (terminate long requests)
    if (responseTime > 2000) {
      logger.error(`Request timeout: ${req.method} ${req.path} (${responseTime}ms)`);
      if (!res.headersSent) {
        res.status(408).json({
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request took too long to process',
            responseTime: responseTime,
          }
        });
        return res;
      }
    }
    
    return originalEnd(chunk as any, encoding as BufferEncoding, cb);
  } as any;
  
  next();
};

/**
 * Cache headers middleware for different content types
 */
export const cacheHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.path.toLowerCase();
  
  // Set appropriate cache headers based on content type
  if (path.includes('/static/') || path.includes('/assets/')) {
    // Static assets: 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path.includes('/api/market') || path.includes('/graphql')) {
    // Market data: 30 seconds
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
  } else if (path.includes('/api/articles') || path.includes('/api/content')) {
    // Article content: 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  } else if (path.includes('/api/user') || path.includes('/api/auth')) {
    // User data: no cache
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  } else {
    // Default: 10 minutes
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  }
  
  next();
};

export { CacheService };