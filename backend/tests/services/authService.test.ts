import { AuthService } from '../../src/services/authService';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/utils/logger');

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userProfile: {
    create: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordReset: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test'
    };

    it('should successfully register a new user', async () => {
      // Mock implementations
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        subscriptionTier: 'FREE',
        emailVerified: false,
        status: 'PENDING_VERIFICATION',
        subscription: null
      });
      mockPrisma.userProfile.create.mockResolvedValue({});
      mockPrisma.securityEvent.create.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('mock-access-token' as never);
      mockBcrypt.hash.mockResolvedValueOnce('hashed-password' as never);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

      const result = await authService.register(mockRegisterData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');

      // Verify user creation
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hashed-password',
          firstName: 'Test',
          lastName: 'User',
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

      // Verify profile creation
      expect(mockPrisma.userProfile.create).toHaveBeenCalled();
    });

    it('should reject weak passwords', async () => {
      const weakPasswordData = {
        ...mockRegisterData,
        password: 'weak'
      };

      await expect(authService.register(weakPasswordData)).rejects.toThrow(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      );
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        'User with this email or username already exists'
      );
    });

    it('should reject duplicate username', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        username: 'testuser'
      });

      await expect(authService.register(mockRegisterData)).rejects.toThrow(
        'User with this email or username already exists'
      );
    });
  });

  describe('login', () => {
    const mockLoginCredentials = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      ipAddress: '127.0.0.1',
      userAgent: 'Jest Test'
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed-password',
      subscriptionTier: 'FREE',
      emailVerified: true,
      status: 'ACTIVE',
      subscription: null
    };

    it('should successfully login with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.securityEvent.create.mockResolvedValue({});
      mockJwt.sign.mockReturnValue('mock-access-token' as never);
      mockBcrypt.hash.mockResolvedValue('hashed-refresh-token' as never);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

      const result = await authService.login(mockLoginCredentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');

      // Verify login attempt logging
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: 'LOGIN_SUCCESS',
          severity: 'INFO'
        })
      });
    });

    it('should reject invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Invalid credentials');

      // Verify failed login logging
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING'
        })
      });
    });

    it('should reject invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow('Invalid credentials');

      // Verify failed login logging
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: 'LOGIN_FAILED',
          severity: 'WARNING'
        })
      });
    });

    it('should reject suspended account', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      mockPrisma.user.findUnique.mockResolvedValue(suspendedUser);
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow(
        'Account is suspended or banned'
      );

      // Verify blocked login logging
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: 'LOGIN_BLOCKED',
          severity: 'WARNING'
        })
      });
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockTokenRecord = {
      id: 'token-1',
      token: mockRefreshToken,
      hashedToken: 'hashed-token',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        subscriptionTier: 'FREE',
        status: 'ACTIVE',
        subscription: null
      }
    };

    it('should successfully refresh valid token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('new-access-token' as never);
      mockBcrypt.hash.mockResolvedValue('new-hashed-refresh-token' as never);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});

      const result = await authService.refreshToken(mockRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Verify old token is revoked
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
          revokedBy: 'user-1'
        }
      });
    });

    it('should reject invalid refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should reject expired refresh token', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 1000)
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should reject revoked refresh token', async () => {
      const revokedTokenRecord = {
        ...mockTokenRecord,
        isRevoked: true
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(revokedTokenRecord);

      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });
  });

  describe('verifyAccessToken', () => {
    const mockAccessToken = 'valid-access-token';
    const mockDecodedToken = {
      sub: 'user-1',
      email: 'test@example.com',
      username: 'testuser'
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      subscriptionTier: 'FREE',
      emailVerified: true,
      status: 'ACTIVE'
    };

    it('should successfully verify valid token', async () => {
      mockJwt.verify.mockReturnValue(mockDecodedToken as never);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.verifyAccessToken(mockAccessToken);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        subscriptionTier: 'FREE',
        emailVerified: true,
        status: 'ACTIVE'
      });
    });

    it('should reject invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyAccessToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should reject token for non-existent user', async () => {
      mockJwt.verify.mockReturnValue(mockDecodedToken as never);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.verifyAccessToken(mockAccessToken)).rejects.toThrow(
        'User not found'
      );
    });

    it('should reject token for suspended user', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      mockJwt.verify.mockReturnValue(mockDecodedToken as never);
      mockPrisma.user.findUnique.mockResolvedValue(suspendedUser);

      await expect(authService.verifyAccessToken(mockAccessToken)).rejects.toThrow(
        'Account is suspended or banned'
      );
    });
  });

  describe('initiatePasswordReset', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com'
    };

    it('should create password reset token for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.hash.mockResolvedValue('hashed-token' as never);
      mockPrisma.passwordReset.create.mockResolvedValue({});
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await authService.initiatePasswordReset(
        'test@example.com',
        '127.0.0.1',
        'Jest Test'
      );

      expect(mockPrisma.passwordReset.create).toHaveBeenCalled();
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          eventType: 'PASSWORD_RESET_REQUESTED',
          severity: 'INFO'
        })
      });
    });

    it('should not reveal if email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Should not throw error even if user doesn't exist
      await expect(
        authService.initiatePasswordReset('nonexistent@example.com')
      ).resolves.not.toThrow();

      expect(mockPrisma.passwordReset.create).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await authService.logout('user-1', 'refresh-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          token: 'refresh-token',
          isRevoked: false
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
          revokedBy: 'user-1'
        }
      });
    });

    it('should revoke all tokens when no specific token provided', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.session.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.securityEvent.create.mockResolvedValue({});

      await authService.logout('user-1');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date),
          revokedBy: 'user-1'
        }
      });
    });
  });
});