import { logFinanceOperation, generateTransactionHash } from '../../src/services/finance/financeHelpers';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  financeOperationLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  __esModule: true,
  default: {
    financeOperationLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('financeHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTransactionHash', () => {
    it('should generate a valid transaction hash', () => {
      const hash = generateTransactionHash();
      expect(hash).toMatch(/^TXN_\d+_[A-Z0-9]+$/);
    });
  });

  describe('logFinanceOperation', () => {
    it('should log finance operation with default IP and user agent when req is not provided', async () => {
      await logFinanceOperation({
        operationKey: 'TEST_OP',
        userId: 'user-123',
        transactionId: 'txn-123',
        metadata: { foo: 'bar' },
      });

      expect(prisma.financeOperationLog.create).toHaveBeenCalledWith({
        data: {
          operationType: 'TEST_OP',
          operationCategory: 'FINANCE',
          userId: 'user-123',
          performedBy: 'user-123',
          transactionId: 'txn-123',
          inputData: JSON.stringify({ foo: 'bar' }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService',
        },
      });
    });

    it('should extract IP address and user agent from request object', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      };

      await logFinanceOperation({
        operationKey: 'TEST_OP',
        userId: 'user-123',
        transactionId: 'txn-123',
        metadata: { foo: 'bar' },
        req: mockReq,
      });

      expect(prisma.financeOperationLog.create).toHaveBeenCalledWith({
        data: {
          operationType: 'TEST_OP',
          operationCategory: 'FINANCE',
          userId: 'user-123',
          performedBy: 'user-123',
          transactionId: 'txn-123',
          inputData: JSON.stringify({ foo: 'bar' }),
          status: 'SUCCESS',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should extract IP from x-forwarded-for header when present', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        headers: {
          'x-forwarded-for': '203.0.113.195, 70.41.3.18',
          'user-agent': 'Chrome/90.0',
        },
      };

      await logFinanceOperation({
        operationKey: 'TEST_OP',
        userId: 'user-123',
        transactionId: 'txn-123',
        req: mockReq,
      });

      expect(prisma.financeOperationLog.create).toHaveBeenCalledWith({
        data: {
          operationType: 'TEST_OP',
          operationCategory: 'FINANCE',
          userId: 'user-123',
          performedBy: 'user-123',
          transactionId: 'txn-123',
          inputData: JSON.stringify({}),
          status: 'SUCCESS',
          ipAddress: '203.0.113.195',
          userAgent: 'Chrome/90.0',
        },
      });
    });
  });
});
