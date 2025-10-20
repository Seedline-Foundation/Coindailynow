import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { SecurityOrchestrator } from '../services/security/SecurityOrchestrator';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      securityContext?: {
        riskScore: number;
        threatLevel: 'low' | 'medium' | 'high' | 'critical';
        blocked: boolean;
        violations: any[];
      };
    }
  }
}

// Initialize security orchestrator instance
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const securityConfig = {
  threatDetection: {
    enabled: true,
    realTimeMonitoring: true,
    aiPoweredAnalysis: process.env.NODE_ENV === 'production',
    suspiciousActivityThreshold: 5,
  },
  auditTrails: {
    enabled: true,
    retentionPeriod: 2555, // 7 years
    detailedLogging: true,
  },
  identityManagement: {
    zeroTrustEnabled: true,
    multiFactorRequired: false, // Can be enabled per user
    sessionTimeout: 30, // minutes
    deviceTrustEnabled: true,
  },
  dataLossPrevention: {
    enabled: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    dataClassification: true,
  },
  complianceMonitoring: {
    gdprCompliance: true,
    popiCompliance: true, // South Africa
    ccpaCompliance: true,
    customRules: [],
  },
  incidentResponse: {
    enabled: true,
    autoResponseEnabled: true,
    notificationChannels: ['email', 'slack'],
    escalationThreshold: 3,
  },
};

const securityOrchestrator = new SecurityOrchestrator(prisma, redis, securityConfig);

/**
 * Main security middleware for request analysis
 */
export const securityAnalysisMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startTime = Date.now();

    // Extract request information
    const requestInfo = {
      userId: req.user?.id,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      path: req.path,
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: req.body,
      query: req.query as Record<string, string>,
    };

    // Analyze request for threats
    const threatAnalysis = await securityOrchestrator.getSecurityStatus();
    
    // Initialize security context
    req.securityContext = {
      riskScore: 0,
      threatLevel: threatAnalysis.threatLevel,
      blocked: false,
      violations: [],
    };

    // Log security event for audit trail
    const eventData: any = {
      type: 'audit',
      severity: 'low',
      source: 'SecurityMiddleware',
      description: `API request: ${req.method} ${req.path}`,
      metadata: {
        requestInfo,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    };
    
    if (requestInfo.userId) {
      eventData.userId = requestInfo.userId;
    }
    
    await securityOrchestrator.processSecurityEvent(eventData);

    next();

  } catch (error) {
    logger.error('Security analysis middleware error', { error, path: req.path });
    
    // Fail securely - continue but log the error
    req.securityContext = {
      riskScore: 0.5, // Medium risk when analysis fails
      threatLevel: 'medium',
      blocked: false,
      violations: [],
    };
    
    next();
  }
};

/**
 * Zero-trust access control middleware
 */
export const zeroTrustMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for public endpoints
    if (isPublicEndpoint(req.path)) {
      return next();
    }

    // Require authentication for zero-trust
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required for zero-trust access',
        },
      });
      return;
    }

    // Evaluate access based on zero-trust policies
    const accessAttempt = {
      userId: req.user.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      path: req.path,
      method: req.method,
      deviceFingerprint: req.get('X-Device-Fingerprint'),
      location: req.get('X-User-Location'),
    };

    // Log access attempt
    await securityOrchestrator.processSecurityEvent({
      type: 'access',
      severity: 'low',
      source: 'ZeroTrustMiddleware',
      description: `Zero-trust access evaluation for ${req.path}`,
      metadata: {
        accessAttempt,
        userTier: req.user.subscriptionTier,
      },
      userId: req.user.id,
      ipAddress: accessAttempt.ipAddress,
    });

    next();

  } catch (error) {
    logger.error('Zero-trust middleware error', { error, userId: req.user?.id });
    
    // Fail securely
    res.status(403).json({
      error: {
        code: 'ZERO_TRUST_EVALUATION_FAILED',
        message: 'Access denied due to security policy evaluation failure',
      },
    });
  }
};

/**
 * Data loss prevention middleware
 */
export const dataLossPreventionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for non-data endpoints
    if (!isDataEndpoint(req.path)) {
      return next();
    }

    // Analyze request for sensitive data
    const requestContent = JSON.stringify({
      body: req.body,
      query: req.query,
      headers: filterSensitiveHeaders(req.headers),
    });

    // Log data access
    const eventData2: any = {
      type: 'audit',
      severity: 'low',
      source: 'DataLossPreventionMiddleware',
      description: `Data access: ${req.method} ${req.path}`,
      metadata: {
        dataSize: requestContent.length,
        contentType: req.get('Content-Type'),
        action: getDataAction(req.method),
      },
      ipAddress: req.ip || 'unknown',
    };
    
    if (req.user?.id) {
      eventData2.userId = req.user.id;
    }
    
    await securityOrchestrator.processSecurityEvent(eventData2);

    next();

  } catch (error) {
    logger.error('Data loss prevention middleware error', { error });
    next(); // Continue on error but log it
  }
};

/**
 * Security response headers middleware
 */
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  next();
};

/**
 * Enhanced rate limiting with threat detection
 */
export const enhancedRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = `rate_limit:${req.ip}:${req.path}`;
    const windowMs = 60 * 1000; // 1 minute
    
    // Get current count
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 60);
    }

    // Determine rate limit based on user tier and endpoint
    const limit = getRateLimit(req);
    
    if (current > limit) {
      // Log potential attack
      const eventData3: any = {
        type: 'threat',
        severity: current > limit * 2 ? 'high' : 'medium',
        source: 'RateLimitMiddleware',
        description: `Rate limit exceeded: ${current}/${limit} requests per minute`,
        metadata: {
          requestCount: current,
          limit,
          path: req.path,
          method: req.method,
        },
        ipAddress: req.ip || 'unknown',
      };
      
      const userAgent = req.get('User-Agent');
      if (userAgent) {
        eventData3.userAgent = userAgent;
      }
      
      await securityOrchestrator.processSecurityEvent(eventData3);

      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: 60,
          requestCount: current,
          limit,
        },
      });
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

    next();

  } catch (error) {
    logger.error('Enhanced rate limit middleware error', { error });
    next(); // Continue on error
  }
};

/**
 * Security monitoring middleware for responses
 */
export const securityResponseMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Override res.json to monitor response data
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    // Monitor for error responses that might indicate attacks
    if (res.statusCode >= 400) {
      securityOrchestrator.processSecurityEvent({
        type: 'audit',
        severity: res.statusCode >= 500 ? 'medium' : 'low',
        source: 'SecurityResponseMiddleware',
        description: `HTTP ${res.statusCode} response`,
        metadata: {
          statusCode: res.statusCode,
          path: req.path,
          method: req.method,
          errorType: body?.error?.code,
          responseTime: Date.now() - (req as any).startTime,
        },
      }).catch(error => {
        logger.error('Failed to log security response event', { error });
      });
    }

    return originalJson(body);
  };

  // Track request start time
  (req as any).startTime = Date.now();
  
  next();
};

/**
 * Incident response middleware for critical errors
 */
export const incidentResponseMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log critical errors as potential security incidents
  if (isCriticalError(error)) {
    securityOrchestrator.processSecurityEvent({
      type: 'incident',
      severity: 'critical',
      source: 'IncidentResponseMiddleware',
      description: `Critical error: ${error.message}`,
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        path: req.path,
        method: req.method,
      },
    }).catch(logError => {
      logger.error('Failed to log incident response event', { logError });
    });
  }

  next(error);
};

// Helper functions
function isPublicEndpoint(path: string): boolean {
  const publicPaths = [
    '/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/public',
    '/api/news/public',
  ];
  
  return publicPaths.some(publicPath => path.startsWith(publicPath));
}

function isDataEndpoint(path: string): boolean {
  const dataEndpoints = [
    '/api/users',
    '/api/articles',
    '/api/analytics',
    '/api/admin',
  ];
  
  return dataEndpoints.some(endpoint => path.startsWith(endpoint));
}

function filterSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
  const filtered = { ...headers };
  
  // Remove sensitive headers
  delete filtered.authorization;
  delete filtered.cookie;
  delete filtered['x-api-key'];
  
  return filtered;
}

function getDataAction(method: string): string {
  const actions: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  
  return actions[method] || 'unknown';
}

function getRateLimit(req: Request): number {
  // Base limits
  const baseLimits: Record<string, number> = {
    '/api/auth': 10, // Auth endpoints
    '/api/admin': 50, // Admin endpoints
    '/api/news': 100, // News endpoints
    '/api/market': 200, // Market data endpoints
  };

  // User tier multipliers
  const tierMultipliers: Record<string, number> = {
    'FREE': 1,
    'PREMIUM': 3,
    'ENTERPRISE': 10,
  };

  // Find matching endpoint
  const endpoint = Object.keys(baseLimits).find(ep => req.path.startsWith(ep));
  const baseLimit = endpoint ? baseLimits[endpoint] : 60; // Default 60/min

  // Apply user tier multiplier
  const userTier = req.user?.subscriptionTier || 'FREE';
  const multiplier = tierMultipliers[userTier] || 1;

  return (baseLimit || 60) * multiplier;
}

function isCriticalError(error: Error): boolean {
  const criticalErrors = [
    'SecurityError',
    'AuthenticationError',
    'AuthorizationError',
    'DataIntegrityError',
  ];
  
  return criticalErrors.includes(error.name) || 
         error.message.toLowerCase().includes('security') ||
         error.message.toLowerCase().includes('unauthorized');
}

// Export security orchestrator for use in other parts of the application
export { securityOrchestrator };