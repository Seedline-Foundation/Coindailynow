import { authService, LoginCredentials, RegisterData } from '../services/authService';
import { logger } from '../utils/logger';

export const authResolvers = {
  Mutation: {
    /**
     * Register a new user
     */
    register: async (
      _: any,
      args: {
        input: RegisterData & {
          deviceFingerprint?: string;
          ipAddress?: string;
          userAgent?: string;
        }
      },
      context: any
    ) => {
      try {
        const { input } = args;
        
        // Extract device information from context if not provided
        const deviceInfo = {
          deviceFingerprint: input.deviceFingerprint || context.deviceFingerprint,
          ipAddress: input.ipAddress || context.ipAddress,
          userAgent: input.userAgent || context.userAgent
        };

        const result = await authService.register({
          ...input,
          ...deviceInfo
        });

        return {
          success: true,
          user: result.user,
          tokens: result.tokens,
          message: 'Registration successful'
        };
      } catch (error) {
        logger.error('Registration mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: error instanceof Error ? error.message : 'Registration failed'
          }
        };
      }
    },

    /**
     * Login user
     */
    login: async (
      _: any,
      args: {
        input: LoginCredentials & {
          deviceFingerprint?: string;
          ipAddress?: string;
          userAgent?: string;
        }
      },
      context: any
    ) => {
      try {
        const { input } = args;

        // Extract device information from context if not provided
        const deviceInfo = {
          deviceFingerprint: input.deviceFingerprint || context.deviceFingerprint,
          ipAddress: input.ipAddress || context.ipAddress,
          userAgent: input.userAgent || context.userAgent
        };

        const result = await authService.login({
          ...input,
          ...deviceInfo
        });

        return {
          success: true,
          user: result.user,
          tokens: result.tokens,
          message: 'Login successful'
        };
      } catch (error) {
        logger.error('Login mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: error instanceof Error ? error.message : 'Login failed'
          }
        };
      }
    },

    /**
     * Refresh access token
     */
    refreshToken: async (
      _: any,
      args: { refreshToken: string }
    ) => {
      try {
        const tokens = await authService.refreshToken(args.refreshToken);

        return {
          success: true,
          tokens,
          message: 'Token refreshed successfully'
        };
      } catch (error) {
        logger.error('Token refresh mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'TOKEN_REFRESH_FAILED',
            message: error instanceof Error ? error.message : 'Token refresh failed'
          }
        };
      }
    },

    /**
     * Logout user
     */
    logout: async (
      _: any,
      args: { refreshToken?: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        await authService.logout(context.user.id, args.refreshToken);

        return {
          success: true,
          message: 'Logout successful'
        };
      } catch (error) {
        logger.error('Logout mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: error instanceof Error ? error.message : 'Logout failed'
          }
        };
      }
    },

    /**
     * Request password reset
     */
    requestPasswordReset: async (
      _: any,
      args: { email: string },
      context: any
    ) => {
      try {
        await authService.initiatePasswordReset(
          args.email,
          context.ipAddress,
          context.userAgent
        );

        // Always return success for security (don't reveal if email exists)
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        };
      } catch (error) {
        logger.error('Password reset request failed:', error);
        // Still return success for security
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        };
      }
    },

    /**
     * Reset password using token
     */
    resetPassword: async (
      _: any,
      args: { token: string; newPassword: string }
    ) => {
      try {
        await authService.completePasswordReset(args.token, args.newPassword);

        return {
          success: true,
          message: 'Password reset successful'
        };
      } catch (error) {
        logger.error('Password reset mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'PASSWORD_RESET_FAILED',
            message: error instanceof Error ? error.message : 'Password reset failed'
          }
        };
      }
    },

    /**
     * Change password (authenticated user)
     */
    changePassword: async (
      _: any,
      args: { currentPassword: string; newPassword: string },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        await authService.changePassword(
          context.user.id,
          args.currentPassword,
          args.newPassword
        );

        return {
          success: true,
          message: 'Password changed successfully'
        };
      } catch (error) {
        logger.error('Password change mutation failed:', error);
        return {
          success: false,
          error: {
            code: 'PASSWORD_CHANGE_FAILED',
            message: error instanceof Error ? error.message : 'Password change failed'
          }
        };
      }
    },

    /**
     * Verify access token
     */
    verifyToken: async (
      _: any,
      args: { token: string }
    ) => {
      try {
        const user = await authService.verifyAccessToken(args.token);

        return {
          success: true,
          user,
          message: 'Token is valid'
        };
      } catch (error) {
        logger.error('Token verification failed:', error);
        return {
          success: false,
          error: {
            code: 'TOKEN_VERIFICATION_FAILED',
            message: error instanceof Error ? error.message : 'Token verification failed'
          }
        };
      }
    }
  },

  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_: any, __: any, context: any) => {
      try {
        if (!context.user) {
          throw new Error('Authentication required');
        }

        // context.user should already contain fresh user data from auth middleware
        return {
          success: true,
          user: context.user,
          message: 'User retrieved successfully'
        };
      } catch (error) {
        logger.error('Me query failed:', error);
        return {
          success: false,
          error: {
            code: 'USER_RETRIEVAL_FAILED',
            message: error instanceof Error ? error.message : 'Failed to retrieve user'
          }
        };
      }
    },

    /**
     * Check authentication status
     */
    authStatus: async (_: any, __: any, context: any) => {
      return {
        isAuthenticated: !!context.user,
        user: context.user || null
      };
    }
  }
};

// GraphQL type definitions for authentication
export const authTypeDefs = `
  type User {
    id: ID!
    email: String!
    username: String!
    firstName: String
    lastName: String
    subscriptionTier: String!
    emailVerified: Boolean!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type TokenPair {
    accessToken: String!
    refreshToken: String!
  }

  type AuthPayload {
    success: Boolean!
    user: User
    tokens: TokenPair
    message: String
    error: Error
  }

  type AuthResponse {
    success: Boolean!
    message: String
    error: Error
  }

  type UserResponse {
    success: Boolean!
    user: User
    message: String
    error: Error
  }

  type AuthStatus {
    isAuthenticated: Boolean!
    user: User
  }

  type Error {
    code: String!
    message: String!
    details: String
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    firstName: String
    lastName: String
    deviceFingerprint: String
    ipAddress: String
    userAgent: String
  }

  input LoginInput {
    email: String!
    password: String!
    deviceFingerprint: String
    ipAddress: String
    userAgent: String
  }

  extend type Query {
    me: UserResponse!
    authStatus: AuthStatus!
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout(refreshToken: String): AuthResponse!
    refreshToken(refreshToken: String!): AuthPayload!
    requestPasswordReset(email: String!): AuthResponse!
    resetPassword(token: String!, newPassword: String!): AuthResponse!
    changePassword(currentPassword: String!, newPassword: String!): AuthResponse!
    verifyToken(token: String!): UserResponse!
  }
`;