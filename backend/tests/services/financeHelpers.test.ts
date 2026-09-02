import { Request } from 'express';
import { logFinanceOperation, getClientIP } from '../../src/services/finance/financeHelpers';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    financeOperationLog: {
      create: jest.fn().mockResolvedValue({ id: 'test-log-id' }),
    },
  },
}));

describe('financeHelpers logFinanceOperation & getClientIP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientIP', () => {
    it('returns 0.0.0.0 when req is undefined', () => {
      expect(getClientIP(undefined)).toBe('0.0.0.0');
    });

    it('extracts first IP from x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
      } as unknown as Request;
      expect(getClientIP(req)).toBe('203.0.113.195');
    });

    it('falls back to req.ip if x-forwarded-for is missing', () => {
      const req = {
        headers: {},
        ip: '198.51.100.1',
      } as unknown as Request;
      expect(getClientIP(req)).toBe('198.51.100.1');
    });

    it('falls back to req.socket.remoteAddress if req.ip is missing', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '192.0.2.1' },
      } as unknown as Request;
      expect(getClientIP(req)).toBe('192.0.2.1');
    });
  });

  describe('logFinanceOperation', () => {
    it('logs operation with default IP and User-Agent when no req is passed', async () => {
      await logFinanceOperation({
        operationKey: 'TEST_OP',
        userId: 'user-123',
        transactionId: 'tx-456',
        metadata: { foo: 'bar' },
      });

      expect(prisma.financeOperationLog.create).toHaveBeenCalledWith({
        data: {
          operationType: 'TEST_OP',
          operationCategory: 'FINANCE',
          userId: 'user-123',
          performedBy: 'user-123',
          transactionId: 'tx-456',
          inputData: JSON.stringify({ foo: 'bar' }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService',
        },
      });
    });

    it('extracts IP and User-Agent from req object when provided', async () => {
      const req = {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'user-agent': 'TestAgent/1.0',
        },
        get: jest.fn((header: string) => {
          if (header.toLowerCase() === 'user-agent') return 'TestAgent/1.0';
          return undefined;
        }),
      } as unknown as Request;

      await logFinanceOperation({
        operationKey: 'TEST_OP',
        userId: 'user-123',
        transactionId: 'tx-456',
        metadata: { foo: 'bar' },
        req,
      });

      expect(prisma.financeOperationLog.create).toHaveBeenCalledWith({
        data: {
          operationType: 'TEST_OP',
          operationCategory: 'FINANCE',
          userId: 'user-123',
          performedBy: 'user-123',
          transactionId: 'tx-456',
          inputData: JSON.stringify({ foo: 'bar' }),
          status: 'SUCCESS',
          ipAddress: '1.2.3.4',
          userAgent: 'TestAgent/1.0',
        },
      });
    });
  });
});
