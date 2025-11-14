import { Request, Response, NextFunction } from 'express';
import { 
  authMiddleware,
  requireSubscription,
  requireEmailVerified,
  requireRole 
} from '../../src/middleware/auth';
import { AuthService } from '../../src/services/authService';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@prisma/client');
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
} as any;

// Mock PrismaClient constructor to return our mock
mockPrismaClient.mockImplementation(() => mockPrisma);

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authMiddleware', () => {
    it('should authenticate valid token', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        subscriptionTier: 'FREE',
        status: 'ACTIVE',
        emailVerified: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ sub: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'Invalid token-format',
      };

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject suspended user', async () => {
      const suspendedUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        subscriptionTier: 'FREE',
        status: 'SUSPENDED',
        emailVerified: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ sub: 'user-1' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(suspendedUser);

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Account is suspended or banned',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-existent user', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      mockJwt.verify.mockReturnValue({ sub: 'non-existent-user' } as any);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireSubscription', () => {
    it('should allow premium user to access premium content', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'PREMIUM',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const middleware = requireSubscription('PREMIUM');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow enterprise user to access premium content', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'ENTERPRISE',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const middleware = requireSubscription('PREMIUM');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject free user from premium content', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'FREE',
        status: 'ACTIVE',
        emailVerified: true,
      };

      const middleware = requireSubscription('PREMIUM');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_SUBSCRIPTION',
          message: 'PREMIUM subscription required',
          details: {
            currentTier: 'FREE',
            requiredTier: 'PREMIUM',
          },
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      const middleware = requireSubscription('PREMIUM');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireEmailVerified', () => {
    it('should allow verified user', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'FREE',
        status: 'ACTIVE',
        emailVerified: true,
      };

      requireEmailVerified(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unverified user', () => {
      mockRequest.user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'FREE',
        status: 'ACTIVE',
        emailVerified: false,
      };

      requireEmailVerified(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Email verification required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated user', () => {
      requireEmailVerified(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});