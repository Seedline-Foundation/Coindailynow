import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { FinanceSecurityMiddleware, AuthenticatedRequest } from '../../src/middleware/financeSecurityMiddleware';
import prisma from '../../src/lib/prisma';
import { verifyOTP, OTPPurpose } from '../../src/services/OTPService';
import { financeAuditService } from '../../src/services/FinanceAuditService';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/OTPService', () => ({
  verifyOTP: jest.fn(),
  OTPPurpose: {
    WE_WALLET_ACCESS: 'WE_WALLET_ACCESS',
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    logWeWalletOperation: jest.fn(),
    logSecurityEvent: jest.fn(),
  },
  AuditAction: {
    WE_WALLET_MULTI_AUTH_VERIFIED: 'WE_WALLET_MULTI_AUTH_VERIFIED',
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

describe('FinanceSecurityMiddleware - We Wallet Auth', () => {
  let middleware: FinanceSecurityMiddleware;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new FinanceSecurityMiddleware();
    mockRequest = {
      user: {
        id: 'super-admin-1',
        email: 'admin@example.com',
        role: UserRole.SUPER_ADMIN,
        username: 'superadmin',
        subscriptionTier: 'ENTERPRISE',
        status: 'ACTIVE',
        emailVerified: true,
      },
      body: {},
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyWeWalletToken (private method invoked via requireWeWalletAuth)', () => {
    it('should reject if user is not Super Admin', async () => {
      mockRequest.user!.role = UserRole.ADMIN;

      await middleware.requireWeWalletAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Only Super Admin can access We Wallet',
        code: 'FORBIDDEN',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if auth tokens array length is not 3', async () => {
      mockRequest.body = {
        weWalletAuthTokens: ['token1', 'token2'],
      };

      await middleware.requireWeWalletAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'We Wallet requires authentication from all 3 authorized emails',
        code: 'WE_WALLET_AUTH_REQUIRED',
        required_emails_count: 3,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail verification when user is not found for email', async () => {
      mockRequest.body = {
        weWalletAuthTokens: ['123456', '654321', '112233'],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await middleware.requireWeWalletAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'We Wallet authentication failed. Invalid tokens provided.',
        code: 'WE_WALLET_AUTH_FAILED',
      });
      expect(financeAuditService.logWeWalletOperation).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail verification when OTP code verification fails for any email', async () => {
      mockRequest.body = {
        weWalletAuthTokens: ['123456', '654321', '112233'],
      };

      (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { email: string } }) => {
        return Promise.resolve({ id: `user-${where.email}` });
      });

      (verifyOTP as jest.Mock).mockImplementation(({ code }: { code: string }) => {
        if (code === '123456') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false, error: 'Invalid code' });
      });

      await middleware.requireWeWalletAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'We Wallet authentication failed. Invalid tokens provided.',
        code: 'WE_WALLET_AUTH_FAILED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully authenticate when all 3 OTP tokens are valid', async () => {
      mockRequest.body = {
        weWalletAuthTokens: ['123456', '654321', '112233'],
        action: 'transfer',
      };

      (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { email: string } }) => {
        return Promise.resolve({ id: `user-${where.email}` });
      });

      (verifyOTP as jest.Mock).mockResolvedValue({ success: true });

      await middleware.requireWeWalletAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(verifyOTP).toHaveBeenCalledTimes(3);
      expect(verifyOTP).toHaveBeenCalledWith({
        userId: expect.any(String),
        code: expect.any(String),
        purpose: OTPPurpose.WE_WALLET_ACCESS,
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
