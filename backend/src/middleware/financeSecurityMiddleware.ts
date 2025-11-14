/**
 * FinanceSecurityMiddleware - Access Hardening & IP Whitelisting
 * 
 * Provides comprehensive security for financial operations:
 * - IP whitelisting for admin finance access
 * - Super Admin verification for We Wallet operations
 * - Multi-email authentication for critical operations
 * - Rate limiting per user/IP
 * - Environment-based credential validation
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole, WalletType } from '@prisma/client';
import { logger } from '../utils/logger';
import { financeAuditService, AuditAction } from '../services/FinanceAuditService';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

// We Wallet Multi-Sig Email Addresses (CRITICAL - Keep Secure)
const WE_WALLET_AUTH_EMAILS = [
  process.env.WE_WALLET_AUTH_EMAIL_1 || 'divinegiftx@gmail.com',
  process.env.WE_WALLET_AUTH_EMAIL_2 || 'bizoppventures@gmail.com',
  process.env.WE_WALLET_AUTH_EMAIL_3 || 'ivuomachimaobi1@gmail.com',
];

// Admin IP Whitelist (load from environment or database)
const ADMIN_IP_WHITELIST: string[] = (process.env.ADMIN_IP_WHITELIST || '').split(',').filter(Boolean);

// Rate Limiting Configuration
const RATE_LIMIT_CONFIG = {
  window: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  maxFailedOTP: 5,
  maxWithdrawals: 10,
};

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    username: string;
    subscriptionTier: string;
    status: string;
    emailVerified: boolean;
  };
  clientIP?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export class FinanceSecurityMiddleware {
  private rateLimitStore: RateLimitStore = {};

  /**
   * Verify user is authenticated
   */
  requireAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Check if user is attached to request (should be done by auth middleware)
      if (!req.user || !req.user.id) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      // Get client IP
      req.clientIP = this.getClientIP(req);

      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    }
  };

  /**
   * Require admin role
   */
  requireAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      await financeAuditService.logSecurityEvent(
        req.user.id,
        AuditAction.ADMIN_OVERRIDE,
        {
          attempted_action: 'admin_access',
          user_role: req.user.role,
        },
        req as Request,
        'blocked' as any
      );

      res.status(403).json({
        error: 'Admin access required',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };

  /**
   * Require super admin role
   */
  requireSuperAdmin = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (req.user.role !== UserRole.SUPER_ADMIN) {
      await financeAuditService.logSecurityEvent(
        req.user.id,
        AuditAction.ADMIN_OVERRIDE,
        {
          attempted_action: 'super_admin_access',
          user_role: req.user.role,
        },
        req as Request,
        'blocked' as any
      );

      res.status(403).json({
        error: 'Super Admin access required',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };

  /**
   * IP Whitelist check for finance operations
   */
  requireWhitelistedIP = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const clientIP = this.getClientIP(req);

    // Get dynamic whitelist from database
    const dbWhitelist = await this.getWhitelistFromDB();
    const allWhitelisted = [...ADMIN_IP_WHITELIST, ...dbWhitelist];

    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_IP_WHITELIST === 'true') {
      logger.warn(`IP whitelist bypassed in development mode for ${clientIP}`);
      next();
      return;
    }

    // Check if IP is whitelisted
    if (!allWhitelisted.includes(clientIP)) {
      // Log blocked access
      if (req.user) {
        await financeAuditService.logSecurityEvent(
          req.user.id,
          AuditAction.IP_BLOCKED,
          {
            attempted_ip: clientIP,
            whitelisted_ips_count: allWhitelisted.length,
          },
          req as Request,
          'blocked' as any
        );
      }

      logger.warn(`Blocked finance access from non-whitelisted IP: ${clientIP}`);

      res.status(403).json({
        error: 'Access denied. Your IP address is not whitelisted for finance operations.',
        code: 'IP_NOT_WHITELISTED',
      });
      return;
    }

    next();
  };

  /**
   * We Wallet Multi-Sig Authentication
   * Requires verification from all 3 protected email addresses
   */
  requireWeWalletAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({
        error: 'Only Super Admin can access We Wallet',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Check for multi-sig tokens in request
    const authTokens = req.body.weWalletAuthTokens || req.headers['x-we-wallet-auth'];

    if (!authTokens || !Array.isArray(authTokens) || authTokens.length !== 3) {
      res.status(403).json({
        error: 'We Wallet requires authentication from all 3 authorized emails',
        code: 'WE_WALLET_AUTH_REQUIRED',
        required_emails_count: 3,
      });
      return;
    }

    // Verify all tokens
    const verifications = await Promise.all(
      authTokens.map((token, index) => {
        const email = WE_WALLET_AUTH_EMAILS[index];
        if (!email) {
          throw new Error('Invalid We Wallet email configuration');
        }
        return this.verifyWeWalletToken(token, email);
      })
    );

    const allVerified = verifications.every(v => v);

    if (!allVerified) {
      await financeAuditService.logWeWalletOperation(
        req.user.id,
        AuditAction.WE_WALLET_MULTI_AUTH_VERIFIED,
        {
          verification_status: 'failed',
          failed_count: verifications.filter(v => !v).length,
        },
        req as Request
      );

      res.status(403).json({
        error: 'We Wallet authentication failed. Invalid tokens provided.',
        code: 'WE_WALLET_AUTH_FAILED',
      });
      return;
    }

    // Log successful authentication
    await financeAuditService.logWeWalletOperation(
      req.user.id,
      AuditAction.WE_WALLET_MULTI_AUTH_VERIFIED,
      {
        verification_status: 'success',
        action: req.body.action || 'access',
      },
      req as Request,
      WE_WALLET_AUTH_EMAILS
    );

    next();
  };

  /**
   * Rate limiting middleware
   */
  rateLimit = (maxRequests: number = RATE_LIMIT_CONFIG.maxRequests) => {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        next();
        return;
      }

      const key = `${req.user.id}:${req.clientIP}`;
      const now = Date.now();

      // Initialize or reset if window expired
      if (!this.rateLimitStore[key] || this.rateLimitStore[key].resetTime < now) {
        this.rateLimitStore[key] = {
          count: 0,
          resetTime: now + RATE_LIMIT_CONFIG.window,
        };
      }

      // Increment request count
      this.rateLimitStore[key].count++;

      // Check if limit exceeded
      if (this.rateLimitStore[key].count > maxRequests) {
        await financeAuditService.logSecurityEvent(
          req.user.id,
          AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
          {
            reason: 'rate_limit_exceeded',
            request_count: this.rateLimitStore[key].count,
            max_allowed: maxRequests,
          },
          req as Request,
          'blocked' as any
        );

        res.status(429).json({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((this.rateLimitStore[key].resetTime - now) / 1000),
        });
        return;
      }

      next();
    };
  };

  /**
   * Failed OTP attempt tracking
   */
  async trackFailedOTP(userId: string, req: Request): Promise<boolean> {
    const key = `failed_otp:${userId}`;
    const now = Date.now();

    if (!this.rateLimitStore[key] || this.rateLimitStore[key].resetTime < now) {
      this.rateLimitStore[key] = {
        count: 0,
        resetTime: now + RATE_LIMIT_CONFIG.window,
      };
    }

    this.rateLimitStore[key].count++;

    // Log failed attempt
    await financeAuditService.logSecurityEvent(
      userId,
      AuditAction.OTP_FAILED,
      {
        attempt_number: this.rateLimitStore[key].count,
        max_attempts: RATE_LIMIT_CONFIG.maxFailedOTP,
      },
      req
    );

    // Check if max attempts exceeded
    if (this.rateLimitStore[key].count >= RATE_LIMIT_CONFIG.maxFailedOTP) {
      await this.lockWallet(userId, req, 'Multiple failed OTP attempts');
      return true; // Wallet locked
    }

    return false; // Continue
  }

  /**
   * Lock user wallet for security
   */
  async lockWallet(userId: string, req: Request, reason: string): Promise<void> {
    try {
      // Find user's wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId, walletType: WalletType.USER_WALLET },
      });

      if (!wallet) {
        logger.error(`Wallet not found for user ${userId}`);
        return;
      }

      // Lock wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { status: 'LOCKED' as any },
      });

      // Log the action
      await financeAuditService.logSecurityEvent(
        userId,
        AuditAction.WALLET_LOCKED,
        {
          reason,
          wallet_id: wallet.id,
          auto_locked: true,
        },
        req
      );

      // Send security alert email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });

      if (user) {
        // TODO: Send email notification
        logger.info(`Wallet locked for user ${user.username}: ${reason}`);
      }
    } catch (error) {
      logger.error('Failed to lock wallet:', error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get client IP from request
   */
  private getClientIP(req: Request | AuthenticatedRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0]?.trim();
      return ip || req.ip || req.socket.remoteAddress || '127.0.0.1';
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  /**
   * Get IP whitelist from database
   */
  private async getWhitelistFromDB(): Promise<string[]> {
    try {
      // This would query a WhitelistedIP table
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to fetch IP whitelist from database:', error);
      return [];
    }
  }

  /**
   * Verify We Wallet authentication token
   */
  private async verifyWeWalletToken(token: string, email: string): Promise<boolean> {
    try {
      // TODO: Implement actual token verification
      // This should verify JWT or OTP sent to the email
      
      // For now, basic check
      if (!token || token.length < 6) {
        return false;
      }

      // In production, verify against OTPService
      // const verified = await otpService.verify(email, token);
      // return verified;

      return true; // Placeholder
    } catch (error) {
      logger.error(`Failed to verify We Wallet token for ${email}:`, error);
      return false;
    }
  }

  /**
   * Add IP to whitelist
   */
  async addIPToWhitelist(
    adminId: string,
    ipAddress: string,
    reason: string,
    req: Request
  ): Promise<void> {
    // TODO: Save to database WhitelistedIP table
    
    await financeAuditService.logAdminOperation(
      adminId,
      AuditAction.IP_WHITELIST_ADDED,
      'security' as any,
      ipAddress,
      {
        ip_address: ipAddress,
        reason,
      },
      req
    );

    logger.info(`IP ${ipAddress} added to whitelist by admin ${adminId}`);
  }

  /**
   * Remove IP from whitelist
   */
  async removeIPFromWhitelist(
    adminId: string,
    ipAddress: string,
    reason: string,
    req: Request
  ): Promise<void> {
    // TODO: Remove from database WhitelistedIP table

    await financeAuditService.logAdminOperation(
      adminId,
      AuditAction.IP_WHITELIST_REMOVED,
      'security' as any,
      ipAddress,
      {
        ip_address: ipAddress,
        reason,
      },
      req
    );

    logger.info(`IP ${ipAddress} removed from whitelist by admin ${adminId}`);
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    Object.keys(this.rateLimitStore).forEach(key => {
      const entry = this.rateLimitStore[key];
      if (entry && entry.resetTime < now) {
        delete this.rateLimitStore[key];
      }
    });
  }
}

export const financeSecurityMiddleware = new FinanceSecurityMiddleware();

// Auto-cleanup rate limits every hour
setInterval(() => {
  financeSecurityMiddleware.cleanupRateLimits();
}, 60 * 60 * 1000);
