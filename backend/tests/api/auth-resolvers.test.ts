import { authResolvers } from '../../src/api/auth-resolvers';
import { authService } from '../../src/services/authService';

// Mock dependencies
jest.mock('../../src/services/authService', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    initiatePasswordReset: jest.fn(),
    completePasswordReset: jest.fn(),
    changePassword: jest.fn(),
  },
}));
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Helper to create mock authenticated user
const createMockUser = (overrides: any = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER',
  subscriptionTier: 'FREE',
  emailVerified: true,
  status: 'ACTIVE',
  ...overrides,
});

describe('Auth Resolvers', () => {
  let context: any;

  beforeEach(() => {
    context = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
    };

    jest.clearAllMocks();
  });

  describe('Query resolvers', () => {
    describe('me', () => {
      it('should return current user when authenticated', async () => {
        const result = await authResolvers.Query.me(null, {}, context);
        expect(result).toEqual({
          success: true,
          user: context.user,
          message: 'User retrieved successfully',
        });
      });

      it('should return an auth error when not authenticated', async () => {
        context.user = null;
        const result = await authResolvers.Query.me(null, {}, context);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('USER_RETRIEVAL_FAILED');
      });
    });

    describe('authStatus', () => {
      it('should return authentication status', async () => {
        const result = await authResolvers.Query.authStatus(null, {}, context);
        
        expect(result).toEqual({
          isAuthenticated: true,
          user: context.user,
        });
      });

      it('should return unauthenticated status', async () => {
        context.user = null;
        const result = await authResolvers.Query.authStatus(null, {}, context);
        
        expect(result).toEqual({
          isAuthenticated: false,
          user: null,
        });
      });
    });
  });

  describe('Mutation resolvers', () => {
    describe('register', () => {
      const registerInput = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      it('should successfully register a new user', async () => {
        const mockResult = {
          user: createMockUser({
            email: registerInput.email,
            username: registerInput.username,
            firstName: registerInput.firstName,
            lastName: registerInput.lastName,
          }),
          tokens: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123',
          },
        };

        mockedAuthService.register.mockResolvedValue(mockResult as any);

        const result = await authResolvers.Mutation.register(
          null,
          { input: registerInput },
          context
        );

        expect(mockedAuthService.register).toHaveBeenCalledWith({
          ...registerInput,
          deviceFingerprint: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        });

        expect(result).toEqual({
          success: true,
          user: mockResult.user,
          tokens: mockResult.tokens,
          message: 'Registration successful',
        });
      });

      it('should handle registration errors', async () => {
        mockedAuthService.register.mockRejectedValue(new Error('Email already registered'));

        const result = await authResolvers.Mutation.register(null, { input: registerInput }, context);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Email already registered');

        expect(mockedAuthService.register).toHaveBeenCalledWith({
          ...registerInput,
          deviceFingerprint: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        });
      });
    });

    describe('login', () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      it('should successfully login with valid credentials', async () => {
        const mockResult = {
          user: createMockUser({
            email: loginInput.email,
            username: 'testuser',
          }),
          tokens: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123',
          },
        };

        mockedAuthService.login.mockResolvedValue(mockResult as any);

        const result = await authResolvers.Mutation.login(
          null,
          { input: loginInput },
          context
        );

        expect(mockedAuthService.login).toHaveBeenCalledWith({
          ...loginInput,
          deviceFingerprint: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        });

        expect(result).toEqual({
          success: true,
          user: mockResult.user,
          tokens: mockResult.tokens,
          message: 'Login successful',
        });
      });

      it('should handle login errors', async () => {
        mockedAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

        const result = await authResolvers.Mutation.login(null, { input: loginInput }, context);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('logout', () => {
      it('should successfully logout a user', async () => {
        mockedAuthService.logout.mockResolvedValue(undefined);

        const result = await authResolvers.Mutation.logout(
          null,
          { refreshToken: 'refresh-token-123' },
          { ...context, user: { id: 'user-1' } }
        );

        expect(result).toEqual({
          success: true,
          message: 'Logout successful',
        });
      });
    });

    describe('refreshToken', () => {
      const refreshTokenInput = 'refresh-token-123';

      it('should successfully refresh token', async () => {
        const mockResult = {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        };

        mockedAuthService.refreshToken.mockResolvedValue(mockResult as any);

        const result = await authResolvers.Mutation.refreshToken(
          null,
          { refreshToken: refreshTokenInput }
        );

        expect(result).toEqual({
          success: true,
          tokens: mockResult,
          message: 'Token refreshed successfully',
        });
      });

      it('should handle refresh token errors', async () => {
        mockedAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

        const result = await authResolvers.Mutation.refreshToken(
          null,
          { refreshToken: refreshTokenInput }
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('requestPasswordReset', () => {
      it('should always return success for security', async () => {
        mockedAuthService.initiatePasswordReset.mockResolvedValue(undefined);

        const result = await authResolvers.Mutation.requestPasswordReset(
          null,
          { email: 'test@example.com' },
          context
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('If the email exists, a password reset link has been sent');
      });
    });

    describe('resetPassword', () => {
      it('should handle reset password errors', async () => {
        mockedAuthService.completePasswordReset.mockRejectedValue(new Error('Invalid token'));

        const result = await authResolvers.Mutation.resetPassword(
          null,
          { token: 'reset-token', newPassword: 'newPassword123!' }
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('changePassword', () => {
      it('should successfully change password', async () => {
        mockedAuthService.changePassword.mockResolvedValue(undefined);

        const result = await authResolvers.Mutation.changePassword(
          null,
          {
            currentPassword: 'currentPass123',
            newPassword: 'newPass123!',
          },
          { ...context, user: { id: 'user-1' } }
        );

        expect(result).toEqual({
          success: true,
          message: 'Password changed successfully',
        });
      });

      it('should handle change password errors', async () => {
        mockedAuthService.changePassword.mockRejectedValue(new Error('Current password incorrect'));

        const result = await authResolvers.Mutation.changePassword(
          null,
          {
            currentPassword: 'wrongPass',
            newPassword: 'newPass123!',
          },
          { ...context, user: { id: 'user-1' } }
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('verifyToken', () => {
      it('should successfully verify access token', async () => {
        const mockUser = createMockUser();

        mockedAuthService.verifyAccessToken.mockResolvedValue(mockUser as any);

        const result = await authResolvers.Mutation.verifyToken(
          null,
          { token: 'valid-token-123' }
        );

        expect(result).toEqual({
          success: true,
          user: mockUser,
          message: 'Token is valid'
        });
      });

      it('should handle invalid token', async () => {
        mockedAuthService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

        const result = await authResolvers.Mutation.verifyToken(
          null,
          { token: 'invalid-token' }
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});