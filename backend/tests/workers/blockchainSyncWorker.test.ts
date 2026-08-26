import { BlockchainSyncWorker } from '../../src/workers/blockchainSyncWorker';
import prisma from '../../src/lib/prisma';
import { BigNumber } from 'ethers';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    walletTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    stakingRecord: {
      create: jest.fn(),
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

describe('BlockchainSyncWorker - Staking Events', () => {
  let worker: BlockchainSyncWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new BlockchainSyncWorker();
  });

  describe('processStakeEvent', () => {
    it('should process a valid stake event successfully', async () => {
      const mockEvent: any = {
        transactionHash: '0xtx123',
        blockNumber: 100,
        args: [
          '0xUserAddress',
          BigNumber.from('1000000000000000000000'), // 1000 tokens (18 decimals)
          BigNumber.from(1), // tierId
          BigNumber.from(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days lockupEnd
        ],
      };

      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
        id: 'wallet_1',
        userId: 'user_1',
        walletAddress: '0xuseraddress',
        currency: 'JY',
      });
      (prisma.stakingRecord.create as jest.Mock).mockResolvedValue({
        id: 'staking_rec_1',
      });
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        id: 'tx_1',
      });
      (prisma.wallet.update as jest.Mock).mockResolvedValue({});

      await (worker as any).processStakeEvent(mockEvent);

      // Check idempotency check was called
      expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
        where: { externalReference: '0xtx123' },
      });

      // Check user wallet lookup
      expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
        where: { walletAddress: '0xuseraddress' },
        include: { user: true },
      });

      // Check StakingRecord creation
      expect(prisma.stakingRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user_1',
            walletId: 'wallet_1',
            stakedAmount: 1000,
            status: 'ACTIVE',
          }),
        })
      );

      // Check WalletTransaction creation
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionHash: '0xtx123',
            fromWalletId: 'wallet_1',
            amount: 1000,
            currency: 'JY',
            externalReference: '0xtx123',
            referenceId: 'staking_rec_1',
            purpose: 'STAKE',
          }),
        })
      );

      // Check Wallet balance update
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet_1' },
        data: {
          availableBalance: { decrement: 1000 },
          stakedBalance: { increment: 1000 },
        },
      });
    });

    it('should skip processing if stake event was already processed (idempotency)', async () => {
      const mockEvent: any = {
        transactionHash: '0xexisting_tx',
        args: ['0xUserAddress', BigNumber.from('1000'), BigNumber.from(1), BigNumber.from(0)],
      };

      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing_tx_id',
      });

      await (worker as any).processStakeEvent(mockEvent);

      expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
      expect(prisma.stakingRecord.create).not.toHaveBeenCalled();
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('should handle unknown wallet gracefully without throwing', async () => {
      const mockEvent: any = {
        transactionHash: '0xtx_unknown',
        args: ['0xUnknownUser', BigNumber.from('1000'), BigNumber.from(1), BigNumber.from(0)],
      };

      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);

      await (worker as any).processStakeEvent(mockEvent);

      expect(prisma.stakingRecord.create).not.toHaveBeenCalled();
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('processUnstakeEvent', () => {
    it('should process a valid unstake event successfully', async () => {
      const mockEvent: any = {
        transactionHash: '0xunstake_tx123',
        blockNumber: 105,
        args: [
          '0xUserAddress',
          BigNumber.from('1000000000000000000000'), // 1000 staked tokens
          BigNumber.from('50000000000000000000'),   // 50 reward tokens
        ],
      };

      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
        id: 'wallet_1',
        userId: 'user_1',
        walletAddress: '0xuseraddress',
        currency: 'JY',
      });
      (prisma.stakingRecord.findFirst as jest.Mock).mockResolvedValue({
        id: 'active_staking_1',
        status: 'ACTIVE',
      });
      (prisma.stakingRecord.update as jest.Mock).mockResolvedValue({});
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
        id: 'tx_unstake_1',
      });
      (prisma.wallet.update as jest.Mock).mockResolvedValue({});

      await (worker as any).processUnstakeEvent(mockEvent);

      // Check idempotency check
      expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
        where: { externalReference: '0xunstake_tx123' },
      });

      // Check StakingRecord update
      expect(prisma.stakingRecord.update).toHaveBeenCalledWith({
        where: { id: 'active_staking_1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          totalRewardsClaimed: { increment: 50 },
        }),
      });

      // Check WalletTransaction creation
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionHash: '0xunstake_tx123',
            toWalletId: 'wallet_1',
            amount: 1000,
            netAmount: 1050,
            currency: 'JY',
            externalReference: '0xunstake_tx123',
            purpose: 'UNSTAKE',
          }),
        })
      );

      // Check Wallet balance update
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet_1' },
        data: {
          stakedBalance: { decrement: 1000 },
          availableBalance: { increment: 1050 },
          totalBalance: { increment: 50 },
        },
      });
    });

    it('should skip processing if unstake event was already processed (idempotency)', async () => {
      const mockEvent: any = {
        transactionHash: '0xexisting_unstake_tx',
        args: ['0xUserAddress', BigNumber.from('1000'), BigNumber.from('50')],
      };

      (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing_tx_id',
      });

      await (worker as any).processUnstakeEvent(mockEvent);

      expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
      expect(prisma.stakingRecord.findFirst).not.toHaveBeenCalled();
      expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
    });
  });
});
