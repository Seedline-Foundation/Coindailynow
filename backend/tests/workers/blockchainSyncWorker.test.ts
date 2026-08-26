import { ethers } from 'ethers';
import { BlockchainSyncWorker } from '../../src/workers/blockchainSyncWorker';
import prisma from '../../src/lib/prisma';
import { logger } from '../../src/utils/logger';

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
    airdropCampaign: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    airdropClaim: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    createLog: jest.fn(),
  },
  AuditAction: {
    BLOCKCHAIN_SYNC_COMPLETED: 'BLOCKCHAIN_SYNC_COMPLETED',
  },
}));

jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendDepositEmail: jest.fn(),
  },
}));

describe('BlockchainSyncWorker - processAirdropEvent', () => {
  let worker: BlockchainSyncWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    worker = new BlockchainSyncWorker();
  });

  it('should skip processing if a transaction with the same txHash already exists', async () => {
    const mockEvent = {
      args: ['0x1234567890123456789012345678901234567890', ethers.BigNumber.from('1000000000000000000'), 'campaign-1'],
      transactionHash: '0xhash123',
      blockNumber: 100,
    } as any;

    (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      externalReference: '0xhash123',
    });

    // Call private method using any cast
    await (worker as any).processAirdropEvent(mockEvent);

    expect(prisma.walletTransaction.findFirst).toHaveBeenCalledWith({
      where: { externalReference: '0xhash123' },
    });
    expect(prisma.wallet.findFirst).not.toHaveBeenCalled();
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('should skip processing if recipient wallet is not found', async () => {
    const mockEvent = {
      args: ['0x1234567890123456789012345678901234567890', ethers.BigNumber.from('1000000000000000000'), 'campaign-1'],
      transactionHash: '0xhash456',
      blockNumber: 101,
    } as any;

    (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);

    await (worker as any).processAirdropEvent(mockEvent);

    expect(prisma.walletTransaction.findFirst).toHaveBeenCalled();
    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
      where: { walletAddress: '0x1234567890123456789012345678901234567890' },
      include: { user: true },
    });
    expect(prisma.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('should successfully process airdrop event and update wallet balance', async () => {
    const recipientAddr = '0x1234567890123456789012345678901234567890';
    const mockEvent = {
      args: [recipientAddr, ethers.BigNumber.from('1000000000000000000'), 'campaign-100'],
      transactionHash: '0xhash789',
      blockNumber: 102,
    } as any;

    (prisma.walletTransaction.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: 'wallet-user-1',
      userId: 'user-1',
      walletAddress: recipientAddr,
      currency: 'JY',
      availableBalance: 50,
      totalBalance: 50,
      user: { id: 'user-1', email: 'test@example.com' },
    });
    (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({
      id: 'tx-airdrop-1',
      transactionHash: '0xhash789',
    });

    (prisma.airdropCampaign.findFirst as jest.Mock).mockResolvedValue({
      id: 'campaign-100',
      distributedAmount: 0,
      remainingAmount: 1000,
    });
    (prisma.airdropClaim.findFirst as jest.Mock).mockResolvedValue(null);

    await (worker as any).processAirdropEvent(mockEvent);

    expect(prisma.walletTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transactionHash: '0xhash789',
        externalReference: '0xhash789',
        transactionType: 'AIRDROP',
        toWalletId: 'wallet-user-1',
        amount: 1,
        netAmount: 1,
        status: 'COMPLETED',
      }),
    });

    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-user-1' },
      data: {
        availableBalance: { increment: 1 },
        totalBalance: { increment: 1 },
      },
    });

    expect(prisma.airdropCampaign.update).toHaveBeenCalledWith({
      where: { id: 'campaign-100' },
      data: {
        distributedAmount: { increment: 1 },
        remainingAmount: 999,
      },
    });

    expect(prisma.airdropClaim.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        campaignId: 'campaign-100',
        userId: 'user-1',
        walletId: 'wallet-user-1',
        amount: 1,
        claimAmount: 1,
        status: 'CLAIMED',
        transactionId: 'tx-airdrop-1',
      }),
    });
  });
});
