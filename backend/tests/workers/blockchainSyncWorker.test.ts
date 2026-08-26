import { BlockchainSyncWorker } from '../../src/workers/blockchainSyncWorker';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    blockchainSync: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    walletTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    createLog: jest.fn().mockResolvedValue({}),
  },
  AuditAction: {
    BLOCKCHAIN_SYNC_COMPLETED: 'BLOCKCHAIN_SYNC_COMPLETED',
  },
}));

jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendDepositEmail: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('BlockchainSyncWorker', () => {
  let worker: BlockchainSyncWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new BlockchainSyncWorker();
  });

  describe('loadLastSyncedBlock', () => {
    it('should load lastSyncedBlock from prisma when record exists', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockResolvedValue({
        id: 'sync-1',
        workerId: 'main',
        lastSyncedBlock: 123456,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await (worker as any).loadLastSyncedBlock();

      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
      expect((worker as any).lastSyncedBlock).toBe(123456);
    });

    it('should fallback to startBlock when no record is found', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockResolvedValue(null);

      await (worker as any).loadLastSyncedBlock();

      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
      expect((worker as any).lastSyncedBlock).toBe(0);
    });

    it('should fallback to startBlock when database lookup fails', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await (worker as any).loadLastSyncedBlock();

      expect((worker as any).lastSyncedBlock).toBe(0);
    });
  });

  describe('saveLastSyncedBlock', () => {
    it('should upsert lastSyncedBlock into prisma', async () => {
      (worker as any).lastSyncedBlock = 654321;
      (prisma.blockchainSync.upsert as jest.Mock).mockResolvedValue({
        id: 'sync-1',
        workerId: 'main',
        lastSyncedBlock: 654321,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await (worker as any).saveLastSyncedBlock();

      expect(prisma.blockchainSync.upsert).toHaveBeenCalledWith({
        where: { workerId: 'main' },
        update: { lastSyncedBlock: 654321 },
        create: {
          workerId: 'main',
          lastSyncedBlock: 654321,
        },
      });
    });

    it('should handle database errors gracefully when saving lastSyncedBlock', async () => {
      (worker as any).lastSyncedBlock = 654321;
      (prisma.blockchainSync.upsert as jest.Mock).mockRejectedValue(new Error('DB Upsert Error'));

      await expect((worker as any).saveLastSyncedBlock()).resolves.not.toThrow();
    });
  });
});
