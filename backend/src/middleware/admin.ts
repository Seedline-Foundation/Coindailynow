/**
 * Admin Middleware
 * Ensures that only users with admin privileges can access protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to verify user has admin role
 * Requires authMiddleware to be applied first
 */
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user exists on request (set by authMiddleware)
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        }
      });
      return;
    }

    // Check if user has admin role
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAILS?.split(',')?.includes(req.user.email) || false;
    const isAdmin = adminEmails.includes(req.user.email) || isSuperAdmin;

    if (!isAdmin) {
      logger.warn(`Unauthorized admin access attempt by user ${req.user.id}`, {
        userId: req.user.id,
        email: req.user.email,
        path: req.path,
        method: req.method
      });

      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin privileges required',
        }
      });
      return;
    }

    // User is admin, proceed
    logger.info(`Admin access granted to user ${req.user.id} for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      }
    });
  }
};

/**
 * Middleware to verify user has super admin role
 * Requires authMiddleware to be applied first
 */
export const superAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user exists on request (set by authMiddleware)
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        }
      });
      return;
    }

    // Check if user has super admin role
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS?.split(',') || [];
    const isSuperAdmin = superAdminEmails.includes(req.user.email);

    if (!isSuperAdmin) {
      logger.warn(`Unauthorized super admin access attempt by user ${req.user.id}`, {
        userId: req.user.id,
        email: req.user.email,
        path: req.path,
        method: req.method
      });

      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Super admin privileges required',
        }
      });
      return;
    }

    // User is super admin, proceed
    logger.info(`Super admin access granted to user ${req.user.id} for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    logger.error('Super admin middleware error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      }
    });
  }
};

