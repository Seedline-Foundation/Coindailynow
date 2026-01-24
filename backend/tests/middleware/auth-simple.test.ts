import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireSubscription } from '../../src/middleware/auth';
import { AuthService } from '../../src/services/authService';

// Mock the AuthService
jest.mock('../../src/services/authService');
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
}));

const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    mockAuthServiceInstance = {
      verifyAccessToken: jest.fn(),
    } as any;

    MockedAuthService.mockImplementation(() => mockAuthServiceInstance);
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      req.headers = {
        authorization: 'Bearer valid-token-123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        subscriptionTier: 'FREE',
        emailVerified: true,
        status: 'ACTIVE',
      };

      mockAuthServiceInstance.verifyAccessToken.mockResolvedValue(mockUser);

      await authMiddleware(req as Request, res as Response, next);

      expect(mockAuthServiceInstance.verifyAccessToken).toHaveBeenCalledWith('valid-token-123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', async () => {
      req.headers = {};

      await authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      req.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockAuthServiceInstance.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      await authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireSubscription', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-1',
        subscriptionTier: 'FREE',
      } as any;
    });

    it('should allow access for FREE tier requirement', async () => {
      const middleware = requireSubscription('FREE');
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow PREMIUM user to access FREE content', async () => {
      req.user!.subscriptionTier = 'PREMIUM';
      const middleware = requireSubscription('FREE');
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny FREE user access to PREMIUM content', async () => {
      req.user!.subscriptionTier = 'FREE';
      const middleware = requireSubscription('PREMIUM');
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_SUBSCRIPTION',
          message: 'Premium subscription required',
          requiredTier: 'PREMIUM',
          currentTier: 'FREE',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if no user in request', async () => {
      req.user = undefined;
      const middleware = requireSubscription('PREMIUM');
      await middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});