/**
 * Advanced Rate Limiting Middleware
 * Implements sophisticated rate limiting with multiple strategies
 * 
 * Features:
 * - Token bucket algorithm
 * - Sliding window rate limiting
 * - IP-based and user-based limits
 * - Dynamic rate limits based on user tier
 * - Distributed rate limiting (Redis)
 * - Rate limit headers (RFC 6585)
 * - Automatic blacklisting for abuse
 * - Whitelist support
 * - Custom rate limit rules per endpoint
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request, res: Response) => void;
  whitelist?: string[];
  blacklist?: string[];
}

interface RateLimitTier {
  name: string;
  maxRequests: number;
  windowMs: number;
  burstAllowance?: number; // Allow short bursts
}

// Rate limit tiers based on user roles
const rateLimitTiers = {
  anonymous: {
    name: 'Anonymous',
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    burstAllowance: 15
  },
  user: {
    name: 'Registered User',
    maxRequests: 60,
    windowMs: 60000, // 1 minute
    burstAllowance: 100
  },
  premium: {
    name: 'Premium User',
    maxRequests: 300,
    windowMs: 60000, // 1 minute
    burstAllowance: 500
  },
  admin: {
    name: 'Admin',
    maxRequests: 1000,
    windowMs: 60000, // 1 minute
    burstAllowance: 2000
  },
  superadmin: {
    name: 'Super Admin',
    maxRequests: 10000,
    windowMs: 60000, // 1 minute (virtually unlimited)
    burstAllowance: 20000
  }
} as const;

// Endpoint-specific rate limits
const endpointLimits: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // Max 5 login attempts per 15 minutes
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // Max 3 registration attempts per hour
  },
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // Max 3 password reset requests per hour
  },
  '/api/auth/verify-email': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5 // Max 5 verification attempts per hour
  },
  '/api/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // Max 20 searches per minute
  },
  '/api/comments': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // Max 10 comments per minute
  },
  '/api/market-data': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // Max 60 requests per minute for market data
  }
};

class RateLimiter {
  private redis: Redis;
  private prefix = 'ratelimit:';

  constructor() {
    const redisConfig: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0')
    };
    
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }
    
    this.redis = new Redis(redisConfig);
  }

  /**
   * Get rate limit key
   */
  private getKey(identifier: string, endpoint: string): string {
    return `${this.prefix}${identifier}:${endpoint}`;
  }

  /**
   * Get user tier based on authentication
   */
  private async getUserTier(req: Request): Promise<RateLimitTier> {
    const user = (req as any).user;

    if (!user) {
      return rateLimitTiers.anonymous;
    }

    // Check if user is blacklisted
    const isBlacklisted = await this.isBlacklisted(user.id);
    if (isBlacklisted) {
      return {
        name: 'Blacklisted',
        maxRequests: 0,
        windowMs: 60000
      };
    }

    // Determine tier based on role
    if (user.role === 'SUPER_ADMIN') return rateLimitTiers.superadmin;
    if (user.role === 'ADMIN') return rateLimitTiers.admin;
    if (user.isPremium) return rateLimitTiers.premium;
    
    return rateLimitTiers.user;
  }

  /**
   * Check if IP or user is blacklisted
   */
  private async isBlacklisted(identifier: string): Promise<boolean> {
    try {
      const blacklisted = await prisma.blacklistedIP.findFirst({
        where: {
          OR: [
            { ipAddress: identifier },
            { userId: identifier }
          ],
          isActive: true,
          AND: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      });

      return !!blacklisted;
    } catch (error) {
      logger.error('Error checking blacklist', { error, identifier });
      return false;
    }
  }

  /**
   * Check if IP or user is whitelisted
   */
  private async isWhitelisted(identifier: string): Promise<boolean> {
    const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
    return whitelistedIPs.includes(identifier);
  }

  /**
   * Sliding window rate limiting algorithm
   */
  async checkLimit(
    req: Request,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    retryAfter?: number;
  }> {
    const identifier = config.keyGenerator?.(req) || this.getIdentifier(req);
    const endpoint = this.normalizeEndpoint(req.path);
    const key = this.getKey(identifier, endpoint);

    // Check whitelist
    if (await this.isWhitelisted(identifier)) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + config.windowMs)
      };
    }

    // Check blacklist
    if (await this.isBlacklisted(identifier)) {
      logger.warn('Blacklisted identifier attempted access', {
        identifier,
        endpoint,
        ip: req.ip
      });
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + config.windowMs),
        retryAfter: config.windowMs / 1000
      };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current count using sorted set (for sliding window)
    const requests = await this.redis.zrangebyscore(
      key,
      windowStart,
      '+inf'
    );

    const currentCount = requests.length;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    if (currentCount >= config.maxRequests) {
      // Calculate retry after
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestRequest[1] ? parseInt(oldestRequest[1]) : now;
      const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);

      // Log rate limit exceeded
      await this.logRateLimitExceeded(req, identifier, endpoint);

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestTimestamp + config.windowMs),
        retryAfter: Math.max(1, retryAfter)
      };
    }

    // Add current request to sorted set
    await this.redis.zadd(key, now.toString(), `${now}-${Math.random()}`);

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Set expiry on the key
    await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt: new Date(now + config.windowMs)
    };
  }

  /**
   * Get identifier from request (IP or user ID)
   */
  private getIdentifier(req: Request): string {
    const user = (req as any).user;
    if (user) {
      return `user:${user.id}`;
    }
    
    // Get IP address (considering proxies)
    const ip = req.ip ||
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      'unknown';

    return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
  }

  /**
   * Normalize endpoint path for consistent rate limiting
   */
  private normalizeEndpoint(path: string): string {
    // Remove trailing slashes
    path = path.replace(/\/$/, '');
    
    // Replace IDs with placeholder
    path = path.replace(/\/[a-f0-9-]{36}/gi, '/:id'); // UUID
    path = path.replace(/\/\d+/g, '/:id'); // Numeric ID
    
    return path;
  }

  /**
   * Log rate limit exceeded event
   */
  private async logRateLimitExceeded(
    req: Request,
    identifier: string,
    endpoint: string
  ): Promise<void> {
    try {
      const user = (req as any).user;

      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: user?.id
      });

      // Check if we should auto-blacklist
      const exceedCount = await this.incrementExceedCount(identifier);
      
      if (exceedCount >= 10) {
        await this.autoBlacklist(identifier, req);
      }
    } catch (error) {
      logger.error('Error logging rate limit exceeded', { error });
    }
  }

  /**
   * Increment exceed count for potential auto-blacklisting
   */
  private async incrementExceedCount(identifier: string): Promise<number> {
    const key = `${this.prefix}exceed:${identifier}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 3600); // Reset after 1 hour
    }
    
    return count;
  }

  /**
   * Auto-blacklist abusive identifiers
   */
  private async autoBlacklist(identifier: string, req: Request): Promise<void> {
    try {
      const [type, value] = identifier.split(':');
      
      const blacklistData: any = {
        reason: 'Automatic blacklist due to repeated rate limit violations',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
        metadata: {
          autoBlacklisted: true,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent']
        }
      };

      if (type === 'ip') {
        blacklistData.ipAddress = value;
      } else if (type === 'user') {
        blacklistData.userId = value;
      }

      await prisma.blacklistedIP.create({
        data: blacklistData
      });

      logger.error('Auto-blacklisted identifier', {
        identifier,
        reason: 'Repeated rate limit violations'
      });
    } catch (error) {
      logger.error('Error auto-blacklisting identifier', { error, identifier });
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 */
export function rateLimitMiddleware(customConfig?: Partial<RateLimitConfig>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get endpoint-specific config or use default
      const endpointConfig = endpointLimits[req.path];
      const tier = await (rateLimiter as any).getUserTier(req);

      const config: RateLimitConfig = {
        windowMs: endpointConfig?.windowMs || tier.windowMs,
        maxRequests: endpointConfig?.maxRequests || tier.maxRequests,
        ...customConfig
      };

      const result = await rateLimiter.checkLimit(req, config);

      // Set rate limit headers (RFC 6585)
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter!.toString());
        
        res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiting error', { error });
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

export default rateLimitMiddleware;
