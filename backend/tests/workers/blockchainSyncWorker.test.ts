import { ethers } from 'ethers';
import { BlockchainSyncWorker } from '../../src/workers/blockchainSyncWorker';
import prisma from '../../src/lib/prisma';
import { WalletService } from '../../src/services/WalletService';
import { StakingStatus } from '@prisma/client';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    walletTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
    },
    stakingRecord: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/WalletService', () => ({
  WalletService: {
    updateWalletBalance: jest.fn(),
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    createLog: jest.fn().mockResolvedValue(true),
  },
  AuditAction: {
    BLOCKCHAIN_SYNC_COMPLETED: 'BLOCKCHAIN_SYNC_COMPLETED',
  },
}));

describe('BlockchainSyncWorker Staking Events', () => {
  let worker: BlockchainSyncWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new BlockchainSyncWorker();
  });

  describe('processStakeEvent', () => {
    it('should skip if user is missing', async () => {
      const mockEvent = {
        args: [null, ethers.BigNumber.from('100000000000000000000'), 30],
        transactionHash: '0xtx123',
        blockNumber: 100,
      } as unknown as ethers.Event;

      await (worker as any).processStakeEvent(mockEvent);

      expect(prisma.walletTransaction.findFirst).not.toHaveBeenCalled();
    });

    it('should skip if transaction was already processed', async () => {
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx-existing',
        externalReference: '0xtx123',
      });

      const mockEvent = {
        args: ['0xUserAddress', ethers.BigNumber.from('100000000000000000000'), 30],
        transactionHash: '0xtx123',
        blockNumber: 100,
      } as unknown as ethers.Event;

      await (worker as any).processStakeEvent(mockEvent);

      expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
        where: { externalReference: '0xtx123' },
      });
      expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
    });

    it('should process stake event successfully and update wallet balance', async () => {
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
        id: 'wallet-123',
        userId: 'user-123',
        walletAddress: '0xuseraddress',
        currency: 'JY',
      });
      (prisma.stakingRecord.create as jest.Mock).mockResolvedValue({
        id: 'staking-rec-1',
        stakedAmount: 100,
      });
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        id: 'wtx-1',
      });

      const mockEvent = {
        args: ['0xUserAddress', ethers.utils.parseUnits('100', 18), 30],
        transactionHash: '0xtx123',
        blockNumber: 100,
      } as unknown as ethers.Event;

      await (worker as any).processStakeEvent(mockEvent);

      expect(prisma.stakingRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          walletId: 'wallet-123',
          stakedAmount: 100,
          lockPeriodDays: 30,
          status: StakingStatus.ACTIVE,
        }),
      });

      expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionHash: '0xtx123',
          fromWalletId: 'wallet-123',
          amount: 100,
          operationType: 'stake_lock',
          externalReference: '0xtx123',
        }),
      });

      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('wallet-123', {
        availableBalance: -100,
        stakedBalance: 100,
      });
    });
  });

  describe('processUnstakeEvent', () => {
    it('should skip if user is missing', async () => {
      const mockEvent = {
        args: [null, ethers.BigNumber.from('100000000000000000000'), 0],
        transactionHash: '0xtx456',
        blockNumber: 101,
      } as unknown as ethers.Event;

      await (worker as any).processUnstakeEvent(mockEvent);

      expect(prisma.walletTransaction.findFirst).not.toHaveBeenCalled();
    });

    it('should skip if transaction was already processed', async () => {
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx-existing',
        externalReference: '0xtx456',
      });

      const mockEvent = {
        args: ['0xUserAddress', ethers.BigNumber.from('100000000000000000000'), 0],
        transactionHash: '0xtx456',
        blockNumber: 101,
      } as unknown as ethers.Event;

      await (worker as any).processUnstakeEvent(mockEvent);

      expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
        where: { externalReference: '0xtx456' },
      });
      expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
    });

    it('should process unstake event successfully and update wallet balance', async () => {
      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
        id: 'wallet-123',
        userId: 'user-123',
        walletAddress: '0xuseraddress',
        currency: 'JY',
      });
      (prisma.stakingRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'staking-rec-1',
        walletId: 'wallet-123',
        status: StakingStatus.ACTIVE,
      });
      (prisma.stakingRecord.update as jest.Mock).mockResolvedValue({
        id: 'staking-rec-1',
        status: StakingStatus.COMPLETED,
      });
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        id: 'wtx-2',
      });

      const mockEvent = {
        args: [
          '0xUserAddress',
          ethers.utils.parseUnits('100', 18),
          ethers.utils.parseUnits('5', 18),
        ],
        transactionHash: '0xtx456',
        blockNumber: 101,
      } as unknown as ethers.Event;

      await (worker as any).processUnstakeEvent(mockEvent);

      expect(prisma.stakingRecord.update).toHaveBeenCalledWith({
        where: { id: 'staking-rec-1' },
        data: expect.objectContaining({
          status: StakingStatus.COMPLETED,
          totalRewardsClaimed: { increment: 5 },
        }),
      });

      expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionHash: '0xtx456',
          toWalletId: 'wallet-123',
          amount: 100,
          netAmount: 105,
          operationType: 'stake_unlock',
          externalReference: '0xtx456',
        }),
      });

      expect(WalletService.updateWalletBalance).toHaveBeenCalledWith('wallet-123', {
        stakedBalance: -100,
        availableBalance: 105,
      });
    });
  });
});
