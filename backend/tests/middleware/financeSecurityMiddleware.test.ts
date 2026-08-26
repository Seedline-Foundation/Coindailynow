import { Request, Response, NextFunction } from 'express';
import { financeSecurityMiddleware, AuthenticatedRequest } from '../../src/middleware/financeSecurityMiddleware';
import prisma from '../../src/lib/prisma';
import { financeAuditService, AuditAction } from '../../src/services/FinanceAuditService';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    whitelistedIP: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    logAdminOperation: jest.fn().mockResolvedValue(undefined),
    logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  },
  AuditAction: {
    IP_WHITELIST_ADDED: 'IP_WHITELIST_ADDED',
    IP_WHITELIST_REMOVED: 'IP_WHITELIST_REMOVED',
    IP_BLOCKED: 'IP_BLOCKED',
  },
}));

describe('FinanceSecurityMiddleware - IP Whitelisting', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {
        'x-forwarded-for': '192.168.1.50',
      },
      socket: { remoteAddress: '192.168.1.50' } as any,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFn = jest.fn();
  });

  describe('addIPToWhitelist', () => {
    it('should upsert IP address to database and log admin operation', async () => {
      const adminId = 'admin-123';
      const ipAddress = '10.0.0.1';
      const reason = 'Office IP';

      (prisma.whitelistedIP.upsert as jest.Mock).mockResolvedValue({
        id: 'wip-1',
        ipAddress,
        reason,
        addedBy: adminId,
        isActive: true,
      });

      await financeSecurityMiddleware.addIPToWhitelist(
        adminId,
        ipAddress,
        reason,
        mockReq as Request
      );

      expect(prisma.whitelistedIP.upsert).toHaveBeenCalledWith({
        where: { ipAddress },
        create: {
          ipAddress,
          reason,
          addedBy: adminId,
          isActive: true,
        },
        update: {
          reason,
          addedBy: adminId,
          isActive: true,
        },
      });

      expect(financeAuditService.logAdminOperation).toHaveBeenCalledWith(
        adminId,
        AuditAction.IP_WHITELIST_ADDED,
        'security',
        ipAddress,
        {
          ip_address: ipAddress,
          reason,
        },
        mockReq
      );
    });
  });

  describe('removeIPFromWhitelist', () => {
    it('should delete IP address from database and log admin operation', async () => {
      const adminId = 'admin-123';
      const ipAddress = '10.0.0.1';
      const reason = 'Deprecated IP';

      (prisma.whitelistedIP.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await financeSecurityMiddleware.removeIPFromWhitelist(
        adminId,
        ipAddress,
        reason,
        mockReq as Request
      );

      expect(prisma.whitelistedIP.deleteMany).toHaveBeenCalledWith({
        where: { ipAddress },
      });

      expect(financeAuditService.logAdminOperation).toHaveBeenCalledWith(
        adminId,
        AuditAction.IP_WHITELIST_REMOVED,
        'security',
        ipAddress,
        {
          ip_address: ipAddress,
          reason,
        },
        mockReq
      );
    });
  });

  describe('requireWhitelistedIP', () => {
    it('should allow access if IP is in database whitelist', async () => {
      mockReq.headers = { 'x-forwarded-for': '10.0.0.1' };
      (prisma.whitelistedIP.findMany as jest.Mock).mockResolvedValue([
        { ipAddress: '10.0.0.1' },
      ]);

      await financeSecurityMiddleware.requireWhitelistedIP(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        nextFn
      );

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block access if IP is not whitelisted', async () => {
      mockReq.headers = { 'x-forwarded-for': '172.16.0.99' };
      (prisma.whitelistedIP.findMany as jest.Mock).mockResolvedValue([
        { ipAddress: '10.0.0.1' },
      ]);

      await financeSecurityMiddleware.requireWhitelistedIP(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        nextFn
      );

      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. Your IP address is not whitelisted for finance operations.',
        code: 'IP_NOT_WHITELISTED',
      });
    });
  });
});
