import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import {
  revokeAccessTokenJti,
  isAccessTokenJtiRevoked,
  revokeAllAccessTokensForUser,
  isUserAccessTokenRevoked,
} from './tokenRevocationService';

export interface LoginCredentials {
  email: string;
  password: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  preferredLanguage?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  subscriptionTier: string;
  emailVerified: boolean;
  status: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly PASSWORD_RESET_EXPIRY = '1h';
  private readonly EMAIL_VERIFICATION_EXPIRY = '24h'; // 24 hours
  private readonly SESSION_EXPIRY = '30d';
  private readonly SALT_ROUNDS = 12;

  // Password validation regex
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  constructor(private prisma: PrismaClient) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    try {
      // Validate password strength
      if (!this.PASSWORD_REGEX.test(data.password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email.toLowerCase() },
            { username: data.username.toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          country: data.country || null,
          preferredLanguage: data.preferredLanguage || 'en',
          onboardingCompleted: false,
          status: 'PENDING_VERIFICATION',
          updatedAt: new Date()
        },
        include: {
          Subscription: true
        }
      });

      // Create user profile
      await this.prisma.userProfile.create({
        data: {
          userId: user.id,
          notificationPreferences: JSON.stringify({
            email: true,
            push: true,
            marketAlerts: true,
            newArticles: true
          }),
          privacySettings: JSON.stringify({
            profileVisibility: 'PUBLIC',
            showTradingStats: false,
            allowDataAnalytics: true
          }),
          contentPreferences: null, // Left null until onboarding wizard completes
          updatedAt: new Date()
        }
      });

      // Log security event
      if (data.ipAddress || data.userAgent) {
        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'USER_REGISTERED',
          severity: 'INFO',
          ...(data.ipAddress && { ipAddress: data.ipAddress }),
          ...(data.userAgent && { userAgent: data.userAgent }),
          metadata: JSON.stringify({ email: data.email, username: data.username })
        });
      }

      // Generate tokens
      const tokens = await this.generateTokenPair(user, {
        ...(data.deviceFingerprint && { deviceFingerprint: data.deviceFingerprint }),
        ...(data.ipAddress && { ipAddress: data.ipAddress }),
        ...(data.userAgent && { userAgent: data.userAgent })
      });

      // Send verification email (fire-and-forget — don't block registration response)
      this.sendEmailVerification(user.id, user.email, user.username)
        .catch(e => logger.error('Failed to send verification email during registration:', e));

      return {
        user: this.formatUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
        include: {
          Subscription: true
        }
      });

      if (!user) {
        this.logSecurityEvent({
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            email: credentials.email, 
            reason: 'USER_NOT_FOUND' 
          })
        }).catch(() => {});
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_BLOCKED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            reason: 'ACCOUNT_SUSPENDED_OR_BANNED',
            status: user.status 
          })
        }).catch(() => {});
        throw new Error('Account is suspended or banned');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            email: credentials.email,
            reason: 'INVALID_PASSWORD' 
          })
        }).catch(() => {});
        throw new Error('Invalid credentials');
      }

      // Update last login (fire-and-forget - don't block the login response)
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      }).catch(e => logger.error('Failed to update lastLoginAt:', e));

      // Log successful login (fire-and-forget)
      this.logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
        ...(credentials.userAgent && { userAgent: credentials.userAgent })
      }).catch(e => logger.error('Failed to log login success:', e));

      // Generate tokens
      const tokens = await this.generateTokenPair(user, {
        ...(credentials.deviceFingerprint && { deviceFingerprint: credentials.deviceFingerprint }),
        ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
        ...(credentials.userAgent && { userAgent: credentials.userAgent })
      });

      return {
        user: this.formatUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Find and validate refresh token
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          User: {
            include: {
              Subscription: true
            }
          }
        }
      });

      if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Verify token signature
      const isValid = await bcrypt.compare(refreshToken, tokenRecord.hashedToken);
      if (!isValid) {
        throw new Error('Invalid refresh token');
      }

      // Check user status
      if (tokenRecord.User.status === 'SUSPENDED' || tokenRecord.User.status === 'BANNED') {
        // Revoke all tokens for this user
        await this.revokeAllUserTokens(tokenRecord.User.id);
        throw new Error('Account is suspended or banned');
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(tokenRecord.User, {
        ...(tokenRecord.deviceFingerprint && { deviceFingerprint: tokenRecord.deviceFingerprint }),
        ...(tokenRecord.ipAddress && { ipAddress: tokenRecord.ipAddress }),
        ...(tokenRecord.userAgent && { userAgent: tokenRecord.userAgent })
      });

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedBy: tokenRecord.User.id
        }
      });

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh token pair
   */
  private async generateTokenPair(
    user: any,
    deviceInfo?: {
      deviceFingerprint?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TokenPair> {
    const jti = crypto.randomUUID();
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        status: user.status,
        emailVerified: user.emailVerified,
        type: 'access',
        jti,
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'coindaily-api',
        audience: 'coindaily-app'
      }
    );

    // Generate refresh token
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = await bcrypt.hash(refreshTokenValue, this.SALT_ROUNDS);

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: refreshTokenValue,
        hashedToken: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        deviceFingerprint: deviceInfo?.deviceFingerprint || null,
        ipAddress: deviceInfo?.ipAddress || null,
        userAgent: deviceInfo?.userAgent || null
      }
    });

    // Create or update session
    await this.createSession(user.id, deviceInfo);

    return {
      accessToken,
      refreshToken: refreshTokenValue
    };
  }

  /**
   * Create user session
   */
  private async createSession(
    userId: string,
    deviceInfo?: {
      deviceFingerprint?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const sessionToken = crypto.randomBytes(64).toString('hex');
    const hashedSessionToken = await bcrypt.hash(sessionToken, this.SALT_ROUNDS);

    await this.prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        sessionToken,
        hashedSessionToken,
        deviceFingerprint: deviceInfo?.deviceFingerprint || null,
        ipAddress: deviceInfo?.ipAddress || null,
        userAgent: deviceInfo?.userAgent || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        lastActivityAt: new Date()
      }
    });
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(userId: string, refreshToken?: string, accessToken?: string): Promise<void> {
    try {
      if (accessToken) {
        try {
          const decoded = jwt.decode(accessToken) as { jti?: string } | null;
          if (decoded?.jti) await revokeAccessTokenJti(decoded.jti);
        } catch {
          /* ignore decode errors */
        }
      } else {
        await revokeAllAccessTokensForUser(userId);
      }

      if (refreshToken) {
        // Revoke specific refresh token
        await this.prisma.refreshToken.updateMany({
          where: {
            userId,
            token: refreshToken,
            isRevoked: false
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedBy: userId
          }
        });
      } else {
        // Revoke all tokens for this user
        await this.revokeAllUserTokens(userId);
      }

      // Deactivate sessions
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'USER_LOGOUT',
        severity: 'INFO'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await revokeAllAccessTokensForUser(userId);
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: userId
      }
    });
  }

  /**
   * Initialize password reset
   */
  async initiatePasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if email exists for security
        logger.warn(`Password reset attempted for non-existent email: ${email}`);
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, this.SALT_ROUNDS);

      // Store reset token
      await this.prisma.passwordReset.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          token: resetToken,
          hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          ipAddress: ipAddress || null,
          userAgent: userAgent || null
        }
      });

      // Log security event
      await this.logSecurityEvent({
        userId: user.id,
        eventType: 'PASSWORD_RESET_REQUESTED',
        severity: 'INFO',
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent })
      });

      // Send password reset email
      const emailService = (await import('./emailService')).default;
      const resetUrl = `${process.env.FRONTEND_URL || 'https://sygn.live'}/auth/reset-password?token=${resetToken}`;
      
      const emailSent = await emailService.sendPasswordResetEmail(user.email, {
        username: user.username,
        resetToken,
        resetUrl,
        expiresInMinutes: 15, // Token expires in 15 minutes
      });

      if (!emailSent) {
        logger.warn(`Failed to send password reset email to ${user.email}, but token was generated`);
      } else {
        logger.info(`Password reset email sent successfully to ${user.email}`);
      }
    } catch (error) {
      logger.error('Password reset initiation failed:', error);
      throw error;
    }
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      // Validate password strength
      if (!this.PASSWORD_REGEX.test(newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      // Find reset token
      const resetRecord = await this.prisma.passwordReset.findUnique({
        where: { token },
        include: { User: true }
      });

      if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
        throw new Error('Invalid or expired reset token');
      }

      // Verify token
      const isValid = await bcrypt.compare(token, resetRecord.hashedToken);
      if (!isValid) {
        throw new Error('Invalid reset token');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: resetRecord.userId },
          data: { passwordHash }
        }),
        this.prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: {
            isUsed: true,
            usedAt: new Date()
          }
        })
      ]);

      // Revoke all existing tokens
      await this.revokeAllUserTokens(resetRecord.userId);

      // Log security event
      await this.logSecurityEvent({
        userId: resetRecord.userId,
        eventType: 'PASSWORD_CHANGED',
        severity: 'INFO',
        ...(resetRecord.ipAddress && { ipAddress: resetRecord.ipAddress }),
        ...(resetRecord.userAgent && { userAgent: resetRecord.userAgent })
      });
    } catch (error) {
      logger.error('Password reset completion failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate new password strength
      if (!this.PASSWORD_REGEX.test(newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      // Revoke all existing tokens except current session
      await this.revokeAllUserTokens(userId);

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'PASSWORD_CHANGED',
        severity: 'INFO'
      });
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Alias for initiatePasswordReset (for test compatibility)
   */
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.initiatePasswordReset(email, ipAddress, userAgent);
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      logger.error('Request password reset failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process password reset request'
      };
    }
  }

  /**
   * Alias for completePasswordReset (for test compatibility)
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.completePasswordReset(token, newPassword);
      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      logger.error('Reset password failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset password'
      };
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.jti && (await isAccessTokenJtiRevoked(decoded.jti))) {
        throw new Error('Token has been revoked');
      }

      const issuedAtSec = decoded.iat ?? 0;
      if (decoded.sub && (await isUserAccessTokenRevoked(decoded.sub, issuedAtSec))) {
        throw new Error('Token has been revoked');
      }
      
      // Get fresh user data
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          Subscription: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        throw new Error('Account is suspended or banned');
      }

      return this.formatUser(user);
    } catch (error) {
      logger.error('Token verification failed:', error);
      
      // Re-throw specific error messages
      if (error instanceof Error) {
        if (error.message === 'User not found' || 
            error.message === 'Account is suspended or banned') {
          throw error;
        }
      }
      
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Format user for response
   */
  private formatUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      status: user.status
    };
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    userId?: string;
    eventType: string;
    severity?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: string;
  }): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          id: crypto.randomUUID(),
          userId: event.userId || null,
          eventType: event.eventType,
          severity: event.severity || 'INFO',
          ipAddress: event.ipAddress || null,
          userAgent: event.userAgent || null,
          metadata: event.metadata || null
        }
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Create and send email verification token for a user
   */
  async sendEmailVerification(userId: string, email: string, username: string): Promise<void> {
    try {
      // Invalidate any existing unused verification tokens
      await this.prisma.emailVerification.updateMany({
        where: { userId, isUsed: false },
        data: { isUsed: true, usedAt: new Date() }
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(verificationToken, this.SALT_ROUNDS);

      // Store verification token (24-hour expiry)
      await this.prisma.emailVerification.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          token: verificationToken,
          hashedToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      // Send verification email
      const frontendUrl = process.env.FRONTEND_URL || 'https://sygn.live';
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

      const emailService = (await import('./emailService')).default;
      const emailSent = await emailService.sendEmailVerification(email, verificationToken, verificationUrl);

      if (!emailSent) {
        logger.warn(`Failed to send verification email to ${email}, but token was generated`);
      } else {
        logger.info(`Verification email sent to ${email}`);
      }

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'EMAIL_VERIFICATION_SENT',
        severity: 'INFO',
        metadata: JSON.stringify({ email })
      });
    } catch (error) {
      logger.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * Verify email using token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find verification token
      const record = await this.prisma.emailVerification.findUnique({
        where: { token },
        include: { User: true }
      });

      if (!record) {
        return { success: false, message: 'Invalid verification token' };
      }

      if (record.isUsed) {
        return { success: false, message: 'Verification token has already been used' };
      }

      if (record.expiresAt < new Date()) {
        return { success: false, message: 'Verification token has expired. Please request a new one.' };
      }

      // Verify token hash
      const isValid = await bcrypt.compare(token, record.hashedToken);
      if (!isValid) {
        return { success: false, message: 'Invalid verification token' };
      }

      // Check if user already verified
      if (record.User.emailVerified) {
        // Mark token as used anyway
        await this.prisma.emailVerification.update({
          where: { id: record.id },
          data: { isUsed: true, usedAt: new Date() }
        });
        return { success: true, message: 'Email is already verified' };
      }

      // Update user and mark token as used in a transaction
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: record.userId },
          data: {
            emailVerified: true,
            status: 'ACTIVE' // Transition from PENDING_VERIFICATION to ACTIVE
          }
        }),
        this.prisma.emailVerification.update({
          where: { id: record.id },
          data: { isUsed: true, usedAt: new Date() }
        })
      ]);

      // Log security event
      await this.logSecurityEvent({
        userId: record.userId,
        eventType: 'EMAIL_VERIFIED',
        severity: 'INFO',
        metadata: JSON.stringify({ email: record.User.email })
      });

      logger.info(`Email verified for user ${record.userId}`);
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification failed:', error);
      return { success: false, message: 'Email verification failed. Please try again.' };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: 'If this email exists, a verification email has been sent' };
      }

      if (user.emailVerified) {
        return { success: true, message: 'Email is already verified' };
      }

      // Rate limit: check if a verification was sent in the last 2 minutes
      const recentVerification = await this.prisma.emailVerification.findFirst({
        where: {
          userId: user.id,
          isUsed: false,
          createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) }
        }
      });

      if (recentVerification) {
        return { success: false, message: 'Please wait before requesting another verification email' };
      }

      await this.sendEmailVerification(user.id, user.email, user.username);
      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      logger.error('Resend verification failed:', error);
      return { success: false, message: 'Failed to resend verification email' };
    }
  }

  /**
   * GDPR Art. 17 — Right to Erasure (Account Deletion)
   *
   * Anonymizes PII instead of hard-deleting to preserve referential integrity
   * for articles, audit logs, and compliance records. Revokes all active
   * sessions and tokens. Sets account status to DELETED.
   *
   * Flow: user requests → password confirmed → PII anonymized → tokens revoked
   * → status set to DELETED → confirmation returned.
   *
   * Retention: anonymized record kept for 90 days for fraud/abuse review,
   * then eligible for hard-delete via data retention cleanup job.
   */
  async requestAccountDeletion(
    userId: string,
    password: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Verify user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.status === 'DELETED') {
        return { success: false, message: 'Account already deleted' };
      }

      // 2. Verify password (prevent unauthorized deletion)
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return { success: false, message: 'Invalid password. Account deletion requires password confirmation.' };
      }

      // 3. Prevent admin self-deletion (admins must be demoted first)
      if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
        return { success: false, message: 'Admin accounts cannot self-delete. Contact a super-admin to demote the account first.' };
      }

      const anonymizedEmail = `deleted-${crypto.randomBytes(8).toString('hex')}@deleted.sygn.local`;
      const anonymizedUsername = `deleted-user-${crypto.randomBytes(6).toString('hex')}`;
      const deletionTimestamp = new Date();

      // 4. Anonymize PII in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Anonymize the user record
        await tx.user.update({
          where: { id: userId },
          data: {
            email: anonymizedEmail,
            username: anonymizedUsername,
            passwordHash: 'DELETED',
            firstName: null,
            lastName: null,
            avatarUrl: null,
            bio: null,
            location: null,
            twoFactorSecret: null,
            twoFactorEnabled: false,
            status: 'DELETED',
            updatedAt: deletionTimestamp,
          }
        });

        // Anonymize user profile if exists
        await tx.userProfile.updateMany({
          where: { userId },
          data: {
            bio: null,
            location: null,
            website: null,
            socialMedia: null,
            tradingExperience: null,
            investmentPortfolioSize: null,
            preferredExchanges: null,
            notificationPreferences: null,
            privacySettings: null,
            contentPreferences: null,
          }
        }).catch(() => { /* Profile may not exist */ });

        // 5. Revoke all refresh tokens
        await tx.refreshToken.updateMany({
          where: { userId },
          data: { isRevoked: true }
        });

        // 6. Delete all sessions
        await tx.session.deleteMany({
          where: { userId }
        });

        // 7. Delete password reset tokens
        await tx.passwordReset.deleteMany({
          where: { userId }
        });

        // 8. Delete email verification tokens
        await tx.emailVerification.deleteMany({
          where: { userId }
        });

        // 9. Revoke all API keys
        await tx.aPIKey.updateMany({
          where: { userId },
          data: { isActive: false }
        }).catch(() => { /* API keys may not exist */ });

        // 10. Log the deletion for compliance audit trail
        await tx.auditLog.create({
          data: {
            adminId: userId,
            action: 'ACCOUNT_DELETION_GDPR_ART17',
            resource: 'user',
            resourceId: userId,
            details: JSON.stringify({
              reason: reason || 'User requested account deletion (GDPR Art. 17)',
              anonymizedEmail,
              deletionTimestamp: deletionTimestamp.toISOString(),
            }),
            ipAddress: 'self-service',
            userAgent: 'self-service',
            status: 'success',
          }
        }).catch((err) => {
          // Audit log failure shouldn't block deletion
          logger.warn('Failed to create deletion audit log:', err);
        });
      });

      logger.info(`Account deletion completed for user ${userId} (anonymized to ${anonymizedEmail})`);

      return {
        success: true,
        message: 'Your account has been deleted and personal data anonymized. This action cannot be undone.'
      };
    } catch (error) {
      logger.error('Account deletion failed:', error);
      return {
        success: false,
        message: 'Account deletion failed. Please try again or contact support.'
      };
    }
  }

  /**
   * Clean up expired tokens and sessions
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      // Delete expired refresh tokens
      await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isRevoked: true }
          ]
        }
      });

      // Delete expired password reset tokens
      await this.prisma.passwordReset.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isUsed: true }
          ]
        }
      });

      // Delete expired/used email verification tokens
      await this.prisma.emailVerification.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isUsed: true }
          ]
        }
      });

      // Delete expired sessions
      await this.prisma.session.deleteMany({
        where: {
          expiresAt: { lt: now }
        }
      });

      logger.info('Expired tokens and sessions cleaned up');
    } catch (error) {
      logger.error('Token cleanup failed:', error);
    }
  }
}

// Export a default instance for convenience
export const authService = new AuthService(prisma);
