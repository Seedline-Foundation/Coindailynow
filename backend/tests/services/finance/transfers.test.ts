import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FinanceTransfers } from '../../../src/services/finance/categories/transfers';
import prisma from '../../../src/lib/prisma';
import { WalletService } from '../../../src/services/WalletService';
import { logFinanceOperation } from '../../../src/services/finance/financeHelpers';
import { TransactionType, TransactionStatus } from '@prisma/client';

// Mock Prisma
jest.mock('../../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    wallet: {
      findUnique: jest.fn(),
    },
    walletTransaction: {
      createMany: jest.fn(),
    },
  },
}));

// Mock WalletService
jest.mock('../../../src/services/WalletService', () => ({
  __esModule: true,
  WalletService: {
    updateWalletBalance: jest.fn(),
  },
}));

// Mock Finance Helpers
jest.mock('../../../src/services/finance/financeHelpers', () => ({
  __esModule: true,
  generateTransactionHash: () => 'mock-tx-hash',
  logFinanceOperation: jest.fn(),
}));

describe('FinanceTransfers - batchTransfer (Optimized)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process batch transfers in optimized queries', async () => {
    const mockFromWallet = {
      id: 'from-wallet-id',
      userId: 'from-user-id',
      availableBalance: 1000,
    };

    // Setup Prisma mocks
    const findUniqueMock = prisma.wallet.findUnique as jest.MockedFunction<any>;
    findUniqueMock.mockResolvedValue(mockFromWallet);

    const createManyMock = prisma.walletTransaction.createMany as jest.MockedFunction<any>;
    createManyMock.mockResolvedValue({ count: 3 });

    // Setup WalletService mocks
    const updateWalletBalanceMock = WalletService.updateWalletBalance as jest.MockedFunction<any>;
    updateWalletBalanceMock.mockResolvedValue({});

    // Setup log mock
    const logFinanceMock = logFinanceOperation as jest.MockedFunction<any>;
    logFinanceMock.mockResolvedValue({});

    const transfersInput = {
      fromUserId: 'from-user-id',
      fromWalletId: 'from-wallet-id',
      currency: 'PLATFORM_TOKEN',
      transfers: [
        { toUserId: 'to-user-1', toWalletId: 'to-wallet-1', amount: 100, description: 'Payment 1' },
        { toUserId: 'to-user-2', toWalletId: 'to-wallet-2', amount: 200, description: 'Payment 2' },
        { toUserId: 'to-user-1', toWalletId: 'to-wallet-1', amount: 150, description: 'Payment 3' }, // Duplicate to-wallet-1
      ],
      metadata: { memo: 'Optimized Batch' },
    };

    // Execute the optimized batch transfer function
    const result = await FinanceTransfers.batchTransfer(transfersInput);

    // Verify operation was successful
    expect(result.success).toBe(true);
    expect(result.transactionId).toBeDefined();

    // Verify 1: From-wallet was fetched
    expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
      where: { id: 'from-wallet-id' },
    });

    // Verify 2: Transactions were created in a single batch (createMany)
    expect(prisma.walletTransaction.createMany).toHaveBeenCalledTimes(1);
    const createManyArgs = createManyMock.mock.calls[0][0];
    expect(createManyArgs.data).toHaveLength(3);

    // Check fields of the first transaction
    const firstTx = createManyArgs.data[0];
    expect(firstTx).toBeDefined();
    expect(firstTx.id).toBeDefined();
    expect(firstTx.fromWalletId).toBe('from-wallet-id');
    expect(firstTx.toWalletId).toBe('to-wallet-1');
    expect(firstTx.amount).toBe(100);
    expect(firstTx.netAmount).toBe(100);
    expect(firstTx.transactionType).toBe(TransactionType.TRANSFER);
    expect(firstTx.status).toBe(TransactionStatus.COMPLETED);

    // Verify 3: Source wallet balance updated ONCE for total amount (100 + 200 + 150 = 450)
    expect(WalletService.updateWalletBalance).toHaveBeenCalledWith(
      'from-wallet-id',
      { availableBalance: -450 }
    );

    // Verify 4: Destination wallet updates were grouped/deduplicated (to-wallet-1 has total of 250, to-wallet-2 has 200)
    expect(WalletService.updateWalletBalance).toHaveBeenCalledWith(
      'to-wallet-1',
      { availableBalance: 250 }
    );
    expect(WalletService.updateWalletBalance).toHaveBeenCalledWith(
      'to-wallet-2',
      { availableBalance: 200 }
    );

    // Since we call it once for source wallet and twice for unique dest wallets, updateWalletBalance should be called exactly 3 times
    expect(WalletService.updateWalletBalance).toHaveBeenCalledTimes(3);

    // Verify 5: Finance operation was logged
    expect(logFinanceOperation).toHaveBeenCalledTimes(1);
  });

  it('should return error if source wallet does not exist', async () => {
    const findUniqueMock = prisma.wallet.findUnique as jest.MockedFunction<any>;
    findUniqueMock.mockResolvedValue(null);

    const transfersInput = {
      fromUserId: 'from-user-id',
      fromWalletId: 'from-wallet-id',
      currency: 'PLATFORM_TOKEN',
      transfers: [{ toUserId: 'to-user-1', toWalletId: 'to-wallet-1', amount: 100 }],
    };

    const result = await FinanceTransfers.batchTransfer(transfersInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid source wallet');
    expect(prisma.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  it('should return error if source wallet has insufficient balance', async () => {
    const mockFromWallet = {
      id: 'from-wallet-id',
      userId: 'from-user-id',
      availableBalance: 50, // Insufficient for 100
    };

    const findUniqueMock = prisma.wallet.findUnique as jest.MockedFunction<any>;
    findUniqueMock.mockResolvedValue(mockFromWallet);

    const transfersInput = {
      fromUserId: 'from-user-id',
      fromWalletId: 'from-wallet-id',
      currency: 'PLATFORM_TOKEN',
      transfers: [{ toUserId: 'to-user-1', toWalletId: 'to-wallet-1', amount: 100 }],
    };

    const result = await FinanceTransfers.batchTransfer(transfersInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient balance');
    expect(prisma.walletTransaction.createMany).not.toHaveBeenCalled();
  });
});
