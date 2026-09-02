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
    sendDepositEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe('BlockchainSyncWorker', () => {
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
        lastSyncedBlock: 5000,
      });

      await (worker as any).loadLastSyncedBlock();

      const status = await worker.getStatus();
      expect(status.lastSyncedBlock).toBe(5000);
      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
    });

    it('should default to startBlock when no record is found in database', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockResolvedValue(null);

      await (worker as any).loadLastSyncedBlock();

      const status = await worker.getStatus();
      expect(status.lastSyncedBlock).toBe(0);
      expect(prisma.blockchainSync.findUnique).toHaveBeenCalledWith({
        where: { workerId: 'main' },
      });
    });

    it('should handle database errors gracefully and default to startBlock', async () => {
      (prisma.blockchainSync.findUnique as jest.Mock).mockRejectedValue(new Error('DB Connection Error'));

      await (worker as any).loadLastSyncedBlock();

      const status = await worker.getStatus();
      expect(status.lastSyncedBlock).toBe(0);
    });
  });

  describe('saveLastSyncedBlock', () => {
    it('should upsert lastSyncedBlock into database for main worker', async () => {
      (prisma.blockchainSync.upsert as jest.Mock).mockResolvedValue({
        id: 'sync-1',
        workerId: 'main',
        lastSyncedBlock: 6000,
      });

      (worker as any).lastSyncedBlock = 6000;
      await (worker as any).saveLastSyncedBlock();

      expect(prisma.blockchainSync.upsert).toHaveBeenCalledWith({
        where: { workerId: 'main' },
        update: { lastSyncedBlock: 6000 },
        create: { workerId: 'main', lastSyncedBlock: 6000 },
      });
    });

    it('should catch and log errors when upsert fails', async () => {
      (prisma.blockchainSync.upsert as jest.Mock).mockRejectedValue(new Error('DB Write Error'));

      (worker as any).lastSyncedBlock = 7000;
      await expect((worker as any).saveLastSyncedBlock()).resolves.not.toThrow();

      expect(prisma.blockchainSync.upsert).toHaveBeenCalledWith({
        where: { workerId: 'main' },
        update: { lastSyncedBlock: 7000 },
        create: { workerId: 'main', lastSyncedBlock: 7000 },
      });
    });
  });

  describe('getStatus', () => {
    it('should return initial sync status', async () => {
      const status = await worker.getStatus();
      expect(status).toEqual({
        isRunning: false,
        lastSyncedBlock: 0,
        currentBlock: null,
        lag: null,
      });
    });
  });
});
