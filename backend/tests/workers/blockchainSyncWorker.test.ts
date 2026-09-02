import { BlockchainSyncWorker } from '../../src/workers/blockchainSyncWorker';
import prisma from '../../src/lib/prisma';
import { logger } from '../../src/utils/logger';

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

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
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

describe('BlockchainSyncWorker Persistence', () => {
  let worker: BlockchainSyncWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new BlockchainSyncWorker();
  });

  describe('loadLastSyncedBlock', () => {
    it('should load lastSyncedBlock from database when record exists', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockResolvedValue({
        id: 'sync-1',
        workerId: 'main',
        lastSyncedBlock: 123456,
        updatedAt: new Date(),
        createdAt: new Date(),
      });

      // Call private method loadLastSyncedBlock
      await (worker as any).loadLastSyncedBlock();

      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
      expect((worker as any).lastSyncedBlock).toBe(123456);
      expect(logger.info).toHaveBeenCalledWith('Starting blockchain sync from block 123456');
    });

    it('should fallback to CONFIG.startBlock when no database record exists', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockResolvedValue(null);

      await (worker as any).loadLastSyncedBlock();

      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
      expect((worker as any).lastSyncedBlock).toBe(0);
      expect(logger.info).toHaveBeenCalledWith('Starting blockchain sync from block 0');
    });

    it('should handle database errors gracefully and fallback to CONFIG.startBlock', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.blockchainSync.findUnique as jest.Mock).mockRejectedValue(dbError);

      await (worker as any).loadLastSyncedBlock();

      expect(logger.error).toHaveBeenCalledWith('Error loading last synced block:', dbError);
      expect((worker as any).lastSyncedBlock).toBe(0);
    });
  });

  describe('saveLastSyncedBlock', () => {
    it('should upsert lastSyncedBlock into database for workerId: main', async () => {
      (worker as any).lastSyncedBlock = 654321;
      (prisma.blockchainSync.upsert as jest.Mock).mockResolvedValue({
        id: 'sync-1',
        workerId: 'main',
        lastSyncedBlock: 654321,
        updatedAt: new Date(),
        createdAt: new Date(),
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
      expect(logger.debug).toHaveBeenCalledWith('Last synced block: 654321');
    });

    it('should catch and log errors during upsert without throwing', async () => {
      (worker as any).lastSyncedBlock = 654321;
      const dbError = new Error('Upsert failed');
      (prisma.blockchainSync.upsert as jest.Mock).mockRejectedValue(dbError);

      await expect((worker as any).saveLastSyncedBlock()).resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Error saving last synced block:', dbError);
    });
  });

  describe('getStatus', () => {
    it('should return status containing lastSyncedBlock', async () => {
      (worker as any).lastSyncedBlock = 999;

      const status = await worker.getStatus();

      expect(status).toEqual({
        isRunning: false,
        lastSyncedBlock: 999,
        currentBlock: null,
        lag: null,
      });
    });
  });
});
