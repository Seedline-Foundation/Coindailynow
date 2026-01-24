import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { redis } from '../api/context';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  cacheHit?: boolean;
  dbQueryTime?: number;
  dbQueryCount?: number;
  memoryUsage?: number;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowQueries: number;
  cacheHitRate: number;
  errorRate: number;
  requestsPerMinute: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 500; // ms
  private readonly MAX_METRICS_MEMORY = 10000;
  private readonly REDIS_KEY_PREFIX = 'perf:';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Middleware for tracking API performance
   */
  trackPerformance() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      // Store query tracking info
      req.performanceData = {
        startTime,
        startMemory,
        dbQueryCount: 0,
        dbQueryTime: 0,
      };

      // Override res.json to capture response time
      const originalJson = res.json;
      res.json = function (body) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryDelta = endMemory - startMemory;

        const userAgent = req.get('User-Agent');
        const ipAddress = req.ip;
        
        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: new Date(),
          ...(userAgent && { userAgent }),
          ...(ipAddress && { ip: ipAddress }),
          cacheHit: res.get('X-Cache-Hit') === 'true',
          dbQueryTime: req.performanceData?.dbQueryTime || 0,
          dbQueryCount: req.performanceData?.dbQueryCount || 0,
          memoryUsage: memoryDelta,
        };

        PerformanceMonitor.getInstance().recordMetric(metric);

        // Log slow requests
        if (responseTime > PerformanceMonitor.getInstance().SLOW_QUERY_THRESHOLD) {
          logger.warn('Slow API request detected', {
            endpoint: req.path,
            method: req.method,
            responseTime,
            statusCode: res.statusCode,
            dbQueryCount: req.performanceData?.dbQueryCount,
            dbQueryTime: req.performanceData?.dbQueryTime,
          });
        }

        // Add performance headers
        res.set({
          'X-Response-Time': `${responseTime}ms`,
          'X-DB-Query-Count': `${req.performanceData?.dbQueryCount || 0}`,
          'X-DB-Query-Time': `${req.performanceData?.dbQueryTime || 0}ms`,
          'X-Memory-Delta': `${Math.round(memoryDelta / 1024)}KB`,
        });

        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Record performance metric
   */
  async recordMetric(metric: PerformanceMetrics): Promise<void> {
    try {
      // Store in memory (limited size)
      this.metrics.push(metric);
      if (this.metrics.length > this.MAX_METRICS_MEMORY) {
        this.metrics = this.metrics.slice(-this.MAX_METRICS_MEMORY / 2);
      }

      // Store in Redis for persistence
      const key = `${this.REDIS_KEY_PREFIX}${Date.now()}`;
      await redis.setex(key, 86400, JSON.stringify(metric)); // 24 hours TTL

      // Update real-time stats
      await this.updateRealTimeStats(metric);
    } catch (error) {
      logger.error('Failed to record performance metric', error);
    }
  }

  /**
   * Update real-time performance statistics
   */
  private async updateRealTimeStats(metric: PerformanceMetrics): Promise<void> {
    const now = new Date();
    const minuteKey = `${this.REDIS_KEY_PREFIX}stats:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;

    try {
      const multi = redis.multi();
      
      // Increment counters
      multi.hincrby(minuteKey, 'total_requests', 1);
      multi.hincrby(minuteKey, 'total_response_time', metric.responseTime);
      multi.hincrby(minuteKey, 'total_db_queries', metric.dbQueryCount || 0);
      multi.hincrby(minuteKey, 'total_db_time', metric.dbQueryTime || 0);

      if (metric.cacheHit) {
        multi.hincrby(minuteKey, 'cache_hits', 1);
      } else {
        multi.hincrby(minuteKey, 'cache_misses', 1);
      }

      if (metric.statusCode >= 400) {
        multi.hincrby(minuteKey, 'error_count', 1);
      }

      if (metric.responseTime > this.SLOW_QUERY_THRESHOLD) {
        multi.hincrby(minuteKey, 'slow_queries', 1);
      }

      // Set expiration for cleanup
      multi.expire(minuteKey, 3600); // 1 hour

      await multi.exec();
    } catch (error) {
      logger.error('Failed to update real-time stats', error);
    }
  }

  /**
   * Get performance statistics
   */
  async getStats(timeRange: 'hour' | 'day' = 'hour'): Promise<PerformanceStats> {
    try {
      const now = new Date();
      const keys: string[] = [];
      
      const minutes = timeRange === 'hour' ? 60 : 1440; // 60 minutes or 24 hours
      
      for (let i = 0; i < minutes; i++) {
        const time = new Date(now.getTime() - i * 60000); // Go back i minutes
        const key = `${this.REDIS_KEY_PREFIX}stats:${time.getFullYear()}-${time.getMonth()}-${time.getDate()}-${time.getHours()}-${time.getMinutes()}`;
        keys.push(key);
      }

      let totalRequests = 0;
      let totalResponseTime = 0;
      let slowQueries = 0;
      let cacheHits = 0;
      let cacheMisses = 0;
      let errorCount = 0;
      const responseTimes: number[] = [];

      for (const key of keys) {
        const stats = await redis.hgetall(key);
        if (Object.keys(stats).length > 0) {
          const requests = parseInt(stats.total_requests || '0');
          const responseTime = parseInt(stats.total_response_time || '0');
          
          totalRequests += requests;
          totalResponseTime += responseTime;
          slowQueries += parseInt(stats.slow_queries || '0');
          cacheHits += parseInt(stats.cache_hits || '0');
          cacheMisses += parseInt(stats.cache_misses || '0');
          errorCount += parseInt(stats.error_count || '0');

          if (requests > 0) {
            responseTimes.push(responseTime / requests);
          }
        }
      }

      // Calculate percentiles
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);

      const stats: PerformanceStats = {
        totalRequests,
        averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        p95ResponseTime: responseTimes[p95Index] || 0,
        p99ResponseTime: responseTimes[p99Index] || 0,
        slowQueries,
        cacheHitRate: (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0,
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
        requestsPerMinute: totalRequests / minutes,
      };

      return stats;
    } catch (error) {
      logger.error('Failed to get performance stats', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      };
    }
  }

  /**
   * Get recent slow queries
   */
  getSlowQueries(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.responseTime > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, limit);
  }

  /**
   * Clear metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      performanceData?: {
        startTime: number;
        startMemory: number;
        dbQueryCount: number;
        dbQueryTime: number;
      };
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
export const performanceMiddleware = performanceMonitor.trackPerformance();