import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

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
  subscriptionTier: string;
  emailVerified: boolean;
  status: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly PASSWORD_RESET_EXPIRY = '1h';
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
          email: data.email.toLowerCase(),
          username: data.username.toLowerCase(),
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          status: 'PENDING_VERIFICATION',
        },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
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
          contentPreferences: JSON.stringify({
            categories: ['bitcoin', 'ethereum', 'defi'],
            languages: ['en'],
            difficulty: 'BEGINNER'
          })
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
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      if (!user) {
        await this.logSecurityEvent({
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            email: credentials.email, 
            reason: 'USER_NOT_FOUND' 
          })
        });
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_BLOCKED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            reason: 'ACCOUNT_SUSPENDED_OR_BANNED',
            status: user.status 
          })
        });
        throw new Error('Account is suspended or banned');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING',
          ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
          ...(credentials.userAgent && { userAgent: credentials.userAgent }),
          metadata: JSON.stringify({ 
            email: credentials.email,
            reason: 'INVALID_PASSWORD' 
          })
        });
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Log successful login
      await this.logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        ...(credentials.ipAddress && { ipAddress: credentials.ipAddress }),
        ...(credentials.userAgent && { userAgent: credentials.userAgent })
      });

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
          user: {
            include: {
              subscription: {
                include: {
                  plan: true
                }
              }
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
      if (tokenRecord.user.status === 'SUSPENDED' || tokenRecord.user.status === 'BANNED') {
        // Revoke all tokens for this user
        await this.revokeAllUserTokens(tokenRecord.user.id);
        throw new Error('Account is suspended or banned');
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(tokenRecord.user, {
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
          revokedBy: tokenRecord.user.id
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
    // Generate access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
        status: user.status,
        emailVerified: user.emailVerified,
        type: 'access'
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
  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
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

      // TODO: Send password reset email
      logger.info(`Password reset token generated for user ${user.id}: ${resetToken}`);
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
        include: { user: true }
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
   * Verify JWT token and return user
   */
  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Get fresh user data
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
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
const prisma = new PrismaClient();
export const authService = new AuthService(prisma);
