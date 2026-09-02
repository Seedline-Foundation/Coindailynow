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
      updateMany: jest.fn(),
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

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('FinanceSecurityMiddleware - IP Whitelisting', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' } as any,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('addIPToWhitelist', () => {
    it('should upsert the IP into WhitelistedIP table and log admin operation', async () => {
      const adminId = 'admin-123';
      const ipAddress = '10.0.0.1';
      const reason = 'Trusted office IP';

      (prisma as any).whitelistedIP.upsert.mockResolvedValue({
        id: 'wip-1',
        ipAddress,
        addedBy: adminId,
        reason,
        isActive: true,
      });

      await financeSecurityMiddleware.addIPToWhitelist(
        adminId,
        ipAddress,
        reason,
        mockReq as Request
      );

      expect((prisma as any).whitelistedIP.upsert).toHaveBeenCalledWith({
        where: { ipAddress },
        create: {
          ipAddress,
          addedBy: adminId,
          reason,
          isActive: true,
        },
        update: {
          addedBy: adminId,
          reason,
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
    it('should set isActive to false for the IP in WhitelistedIP table and log operation', async () => {
      const adminId = 'admin-123';
      const ipAddress = '10.0.0.1';
      const reason = 'Revoked access';

      (prisma as any).whitelistedIP.updateMany.mockResolvedValue({ count: 1 });

      await financeSecurityMiddleware.removeIPFromWhitelist(
        adminId,
        ipAddress,
        reason,
        mockReq as Request
      );

      expect((prisma as any).whitelistedIP.updateMany).toHaveBeenCalledWith({
        where: { ipAddress },
        data: {
          isActive: false,
        },
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

  describe('getWhitelistFromDB & requireWhitelistedIP', () => {
    it('should allow access when client IP is in database whitelist', async () => {
      (prisma as any).whitelistedIP.findMany.mockResolvedValue([
        { ipAddress: '192.168.1.100' },
        { ipAddress: '10.0.0.2' },
      ]);

      await financeSecurityMiddleware.requireWhitelistedIP(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect((prisma as any).whitelistedIP.findMany).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny access when client IP is not in whitelist', async () => {
      (prisma as any).whitelistedIP.findMany.mockResolvedValue([
        { ipAddress: '10.0.0.2' },
      ]);

      await financeSecurityMiddleware.requireWhitelistedIP(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. Your IP address is not whitelisted for finance operations.',
        code: 'IP_NOT_WHITELISTED',
      });
    });
  });
});
