import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

// Create AuthService instance
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: string;
        subscriptionTier: string;
        status: string;
        emailVerified: boolean;
      };
    }
  }
}

// JWT authentication middleware for HTTP requests
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required',
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Use AuthService to verify token
    const user = await authService.verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      status: user.status,
      emailVerified: user.emailVerified
    };
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
      }
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        subscriptionTier: true,
        status: true,
        emailVerified: true
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }

    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

// Authorization middleware for subscription tiers
export const requireSubscription = (requiredTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        }
      });
      return;
    }

    const tierHierarchy = ['FREE', 'PREMIUM', 'ENTERPRISE'];
    const userTierIndex = tierHierarchy.indexOf(req.user.subscriptionTier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_SUBSCRIPTION',
          message: `${requiredTier} subscription required`,
          details: {
            currentTier: req.user.subscriptionTier,
            requiredTier
          }
        }
      });
      return;
    }

    next();
  };
};

// Authorization middleware for email verification
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      }
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      error: {
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Email verification required',
      }
    });
    return;
  }

  next();
};

// Socket.IO authentication middleware
export const socketAuthMiddleware = async (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        subscriptionTier: true,
        status: true,
        emailVerified: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return next(new Error('Account is suspended or banned'));
    }

    socket.user = user;
    next();
  } catch (error) {
    logger.error('Socket authentication failed:', error);
    next(new Error('Invalid authentication token'));
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        }
      });
      return;
    }

    try {
      // Get user with additional role information
      const userWithRoles = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          status: true,
          // Note: Add role relations when implemented
        }
      });

      // For now, check if user is admin based on email domain or specific IDs
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(req.user.email);

      const hasRequiredRole = roles.includes('admin') ? isAdmin : true;

      if (!hasRequiredRole) {
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions',
            details: {
              requiredRoles: roles
            }
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check failed:', error);
      res.status(500).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed',
        }
      });
    }
  };
};

// Rate limiting by user
export const userRateLimit = (requests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.id;
    const now = Date.now();
    const userRecord = userRequests.get(userId);

    if (!userRecord || now > userRecord.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRecord.count >= requests) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          details: {
            limit: requests,
            windowMs,
            resetTime: userRecord.resetTime
          }
        }
      });
      return;
    }

    userRecord.count++;
    next();
  };
};

// Alias for backward compatibility
export const authenticate = authMiddleware;
