import { Request } from 'express';
import { financeSecurityMiddleware } from '../../src/middleware/financeSecurityMiddleware';
import prisma from '../../src/lib/prisma';
import { financeAuditService, AuditAction } from '../../src/services/FinanceAuditService';

// Mock the prisma dependency
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    whitelistedIP: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock the financeAuditService dependency but preserve the original enum exports
jest.mock('../../src/services/FinanceAuditService', () => {
  const originalModule = jest.requireActual('../../src/services/FinanceAuditService');
  return {
    ...originalModule,
    financeAuditService: {
      logAdminOperation: jest.fn(),
    },
  };
});

describe('FinanceSecurityMiddleware - Whitelisted IP Operations', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockRequest = {};
    jest.clearAllMocks();
  });

  describe('getWhitelistFromDB', () => {
    it('should query active whitelisted IPs and return their addresses', async () => {
      const mockIps = [
        { ipAddress: '192.168.1.1' },
        { ipAddress: '10.0.0.1' },
      ];
      (prisma.whitelistedIP.findMany as jest.Mock).mockResolvedValue(mockIps);

      // Access private method getWhitelistFromDB via bracket notation
      const result = await (financeSecurityMiddleware as any).getWhitelistFromDB();

      expect(prisma.whitelistedIP.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { ipAddress: true },
      });
      expect(result).toEqual(['192.168.1.1', '10.0.0.1']);
    });

    it('should handle database errors gracefully and return an empty array', async () => {
      (prisma.whitelistedIP.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const result = await (financeSecurityMiddleware as any).getWhitelistFromDB();

      expect(result).toEqual([]);
    });
  });

  describe('addIPToWhitelist', () => {
    it('should upsert the IP into the WhitelistedIP table and log the admin operation', async () => {
      (prisma.whitelistedIP.upsert as jest.Mock).mockResolvedValue({
        id: 'id-1',
        ipAddress: '192.168.1.1',
        reason: 'Authorized Office',
        isActive: true,
      });

      await financeSecurityMiddleware.addIPToWhitelist(
        'admin-123',
        '192.168.1.1',
        'Authorized Office',
        mockRequest as Request
      );

      expect(prisma.whitelistedIP.upsert).toHaveBeenCalledWith({
        where: { ipAddress: '192.168.1.1' },
        create: {
          ipAddress: '192.168.1.1',
          reason: 'Authorized Office',
          addedBy: 'admin-123',
          isActive: true,
        },
        update: {
          reason: 'Authorized Office',
          addedBy: 'admin-123',
          isActive: true,
        },
      });

      expect(financeAuditService.logAdminOperation).toHaveBeenCalledWith(
        'admin-123',
        AuditAction.IP_WHITELIST_ADDED,
        'security',
        '192.168.1.1',
        {
          ip_address: '192.168.1.1',
          reason: 'Authorized Office',
        },
        mockRequest
      );
    });

    it('should catch database errors gracefully and still log the operation', async () => {
      (prisma.whitelistedIP.upsert as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await financeSecurityMiddleware.addIPToWhitelist(
        'admin-123',
        '192.168.1.1',
        'Authorized Office',
        mockRequest as Request
      );

      expect(prisma.whitelistedIP.upsert).toHaveBeenCalled();
      expect(financeAuditService.logAdminOperation).toHaveBeenCalled();
    });
  });

  describe('removeIPFromWhitelist', () => {
    it('should delete the IP from the WhitelistedIP table and log the admin operation', async () => {
      (prisma.whitelistedIP.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await financeSecurityMiddleware.removeIPFromWhitelist(
        'admin-123',
        '192.168.1.1',
        'No longer needed',
        mockRequest as Request
      );

      expect(prisma.whitelistedIP.deleteMany).toHaveBeenCalledWith({
        where: { ipAddress: '192.168.1.1' },
      });

      expect(financeAuditService.logAdminOperation).toHaveBeenCalledWith(
        'admin-123',
        AuditAction.IP_WHITELIST_REMOVED,
        'security',
        '192.168.1.1',
        {
          ip_address: '192.168.1.1',
          reason: 'No longer needed',
        },
        mockRequest
      );
    });

    it('should catch database errors gracefully and still log the operation', async () => {
      (prisma.whitelistedIP.deleteMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await financeSecurityMiddleware.removeIPFromWhitelist(
        'admin-123',
        '192.168.1.1',
        'No longer needed',
        mockRequest as Request
      );

      expect(prisma.whitelistedIP.deleteMany).toHaveBeenCalled();
      expect(financeAuditService.logAdminOperation).toHaveBeenCalled();
    });
  });
});
