/**
 * Wallet Service - Handles wallet creation, balance management, and queries
 * 
 * This service manages:
 * - Wallet creation and initialization
 * - Balance tracking (available, locked, staked)
 * - Multi-currency support (Platform Token, CE Points, JOY Tokens)
 * - Wallet security (locking, freezing, whitelisting)
 * - We Wallet (platform central wallet) management
 * - Wallet queries and auditing
 */

import { PrismaClient, Wallet, WalletType, WalletStatus, UserRole } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// WALLET CREATION
// ============================================================================

interface CreateWalletInput {
  userId?: string;                    // Null for platform wallets (WE_WALLET)
  walletType: WalletType;
  currency?: string;
  dailyWithdrawalLimit?: number;
  transactionLimit?: number;
  twoFactorRequired?: boolean;
  otpRequired?: boolean;
}

/**
 * Create a new wallet
 */
export async function createWallet(input: CreateWalletInput): Promise<Wallet> {
  const {
    userId,
    walletType,
    currency = 'PLATFORM_TOKEN',
    dailyWithdrawalLimit,
    transactionLimit,
    twoFactorRequired = false,
    otpRequired = true,
  } = input;

  // 1. Validate user exists (if userId provided)
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a wallet of this type
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        walletType,
      },
    });

    if (existingWallet) {
      throw new Error(`User already has a ${walletType} wallet`);
    }
  }

  // 2. Generate unique wallet address
  const walletAddress = generateWalletAddress(walletType, userId);

  // 3. Create wallet
  return await prisma.wallet.create({
    data: {
      walletType,
      userId: userId ?? null,
      walletAddress,
      currency,
      availableBalance: 0,
      lockedBalance: 0,
      stakedBalance: 0,
      totalBalance: 0,
      cePoints: 0,
      joyTokens: 0,
      dailyWithdrawalLimit: dailyWithdrawalLimit ?? null,
      transactionLimit: transactionLimit ?? null,
      twoFactorRequired,
      otpRequired,
      status: WalletStatus.ACTIVE,
    },
  });
}

/**
 * Create wallet for new user (auto-called on registration)
 */
export async function createUserWallet(userId: string): Promise<Wallet> {
  return await createWallet({
    userId,
    walletType: WalletType.USER_WALLET,
    dailyWithdrawalLimit: 10000, // Default $10,000/day
    transactionLimit: 5000,      // Default $5,000/transaction
    otpRequired: true,
  });
}

/**
 * Create "We" Wallet (platform central wallet) - Super Admin only
 */
export async function createWeWallet(): Promise<Wallet> {
  // Check if We Wallet already exists
  const existing = await prisma.wallet.findFirst({
    where: {
      walletType: WalletType.WE_WALLET,
    },
  });

  if (existing) {
    throw new Error('We Wallet already exists');
  }

  return await createWallet({
    walletType: WalletType.WE_WALLET,
    currency: 'PLATFORM_TOKEN',
    twoFactorRequired: true,
    otpRequired: true,
  });
}

/**
 * Generate unique wallet address
 */
function generateWalletAddress(walletType: WalletType, userId?: string): string {
  const prefix = walletType.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  const userSuffix = userId ? userId.substring(0, 4) : '0000';

  return `${prefix}-${timestamp}-${userSuffix}-${random}`.toUpperCase();
}

// ============================================================================
// BALANCE MANAGEMENT
// ============================================================================

/**
 * Get wallet balance
 */
export async function getWalletBalance(walletId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return {
    walletId: wallet.id,
    walletAddress: wallet.walletAddress,
    availableBalance: wallet.availableBalance,
    lockedBalance: wallet.lockedBalance,
    stakedBalance: wallet.stakedBalance,
    totalBalance: wallet.totalBalance,
    cePoints: wallet.cePoints,
    joyTokens: wallet.joyTokens,
    currency: wallet.currency,
  };
}

/**
 * Update wallet balance (internal use only)
 */
export async function updateWalletBalance(
  walletId: string,
  balanceChanges: {
    availableBalance?: number;
    lockedBalance?: number;
    stakedBalance?: number;
    cePoints?: number;
    joyTokens?: number;
  }
): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const updatedData: any = {};

  if (balanceChanges.availableBalance !== undefined) {
    updatedData.availableBalance = wallet.availableBalance + balanceChanges.availableBalance;
  }

  if (balanceChanges.lockedBalance !== undefined) {
    updatedData.lockedBalance = wallet.lockedBalance + balanceChanges.lockedBalance;
  }

  if (balanceChanges.stakedBalance !== undefined) {
    updatedData.stakedBalance = wallet.stakedBalance + balanceChanges.stakedBalance;
  }

  if (balanceChanges.cePoints !== undefined) {
    updatedData.cePoints = wallet.cePoints + balanceChanges.cePoints;
  }

  if (balanceChanges.joyTokens !== undefined) {
    updatedData.joyTokens = wallet.joyTokens + balanceChanges.joyTokens;
  }

  // Recalculate total balance
  updatedData.totalBalance =
    (updatedData.availableBalance || wallet.availableBalance) +
    (updatedData.lockedBalance || wallet.lockedBalance) +
    (updatedData.stakedBalance || wallet.stakedBalance);

  updatedData.lastTransactionAt = new Date();

  return await prisma.wallet.update({
    where: { id: walletId },
    data: updatedData,
  });
}

/**
 * Lock balance (for pending transactions)
 */
export async function lockBalance(walletId: string, amount: number): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.availableBalance < amount) {
    throw new Error('Insufficient available balance');
  }

  return await updateWalletBalance(walletId, {
    availableBalance: -amount,
    lockedBalance: amount,
  });
}

/**
 * Unlock balance (cancel transaction or complete it)
 */
export async function unlockBalance(
  walletId: string,
  amount: number,
  moveToAvailable: boolean = true
): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.lockedBalance < amount) {
    throw new Error('Insufficient locked balance');
  }

  if (moveToAvailable) {
    return await updateWalletBalance(walletId, {
      lockedBalance: -amount,
      availableBalance: amount,
    });
  } else {
    // Just remove from locked (amount was transferred out)
    return await updateWalletBalance(walletId, {
      lockedBalance: -amount,
    });
  }
}

// ============================================================================
// WALLET SECURITY
// ============================================================================

/**
 * Lock wallet (suspend all transactions)
 */
export async function lockWallet(
  walletId: string,
  lockedBy: string,
  reason: string
): Promise<Wallet> {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      isLocked: true,
      lockReason: reason,
      lockedAt: new Date(),
      lockedBy,
      status: WalletStatus.LOCKED,
    },
  });
}

/**
 * Unlock wallet
 */
export async function unlockWallet(walletId: string): Promise<Wallet> {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      isLocked: false,
      lockReason: null,
      lockedAt: null,
      lockedBy: null,
      status: WalletStatus.ACTIVE,
    },
  });
}

/**
 * Freeze wallet (security issue - requires investigation)
 */
export async function freezeWallet(
  walletId: string,
  frozenBy: string,
  reason: string
): Promise<Wallet> {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      isLocked: true,
      lockReason: `FROZEN: ${reason}`,
      lockedAt: new Date(),
      lockedBy: frozenBy,
      status: WalletStatus.FROZEN,
    },
  });
}

/**
 * Add wallet address to whitelist
 */
export async function addToWhitelist(
  walletId: string,
  address: string
): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const whitelist = wallet.whitelistedAddresses
    ? JSON.parse(wallet.whitelistedAddresses)
    : [];

  if (whitelist.includes(address)) {
    throw new Error('Address already whitelisted');
  }

  whitelist.push(address);

  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      whitelistedAddresses: JSON.stringify(whitelist),
    },
  });
}

/**
 * Remove wallet address from whitelist
 */
export async function removeFromWhitelist(
  walletId: string,
  address: string
): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const whitelist = wallet.whitelistedAddresses
    ? JSON.parse(wallet.whitelistedAddresses)
    : [];

  const filtered = whitelist.filter((addr: string) => addr !== address);

  return await prisma.wallet.update({
    where: { id: walletId },
    data: {
      whitelistedAddresses: JSON.stringify(filtered),
    },
  });
}

/**
 * Check if address is whitelisted
 */
export async function isWhitelisted(walletId: string, address: string): Promise<boolean> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet || !wallet.whitelistedAddresses) {
    return false;
  }

  const whitelist = JSON.parse(wallet.whitelistedAddresses);
  return whitelist.includes(address);
}

// ============================================================================
// WALLET QUERIES
// ============================================================================

/**
 * Get wallet by address
 */
export async function getWalletByAddress(address: string) {
  return await prisma.wallet.findUnique({
    where: { walletAddress: address },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Get wallet by user ID
 */
export async function getUserWallet(userId: string) {
  return await prisma.wallet.findFirst({
    where: {
      userId,
      walletType: WalletType.USER_WALLET,
    },
  });
}

/**
 * Get We Wallet
 */
export async function getWeWallet() {
  return await prisma.wallet.findFirst({
    where: {
      walletType: WalletType.WE_WALLET,
    },
  });
}

/**
 * Search wallets (admin function)
 */
export async function searchWallets(filters: {
  userId?: string;
  walletType?: WalletType;
  status?: WalletStatus;
  minBalance?: number;
  maxBalance?: number;
  isLocked?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.walletType) where.walletType = filters.walletType;
  if (filters.status) where.status = filters.status;
  if (filters.isLocked !== undefined) where.isLocked = filters.isLocked;

  if (filters.minBalance !== undefined || filters.maxBalance !== undefined) {
    where.totalBalance = {};
    if (filters.minBalance !== undefined) where.totalBalance.gte = filters.minBalance;
    if (filters.maxBalance !== undefined) where.totalBalance.lte = filters.maxBalance;
  }

  const [wallets, total] = await Promise.all([
    prisma.wallet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.count({ where }),
  ]);

  return {
    wallets,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactionHistory(
  walletId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {
    OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
  };

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lte = options.endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      include: {
        fromWallet: {
          select: {
            id: true,
            walletAddress: true,
            walletType: true,
          },
        },
        toWallet: {
          select: {
            id: true,
            walletAddress: true,
            walletType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
}

// ============================================================================
// WALLET LIMITS
// ============================================================================

/**
 * Set daily withdrawal limit
 */
export async function setDailyWithdrawalLimit(
  walletId: string,
  limit: number
): Promise<Wallet> {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: { dailyWithdrawalLimit: limit },
  });
}

/**
 * Set transaction limit
 */
export async function setTransactionLimit(
  walletId: string,
  limit: number
): Promise<Wallet> {
  return await prisma.wallet.update({
    where: { id: walletId },
    data: { transactionLimit: limit },
  });
}

/**
 * Check if withdrawal amount exceeds daily limit
 */
export async function checkDailyWithdrawalLimit(
  walletId: string,
  amount: number
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (!wallet.dailyWithdrawalLimit) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  // Get today's withdrawals
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayWithdrawals = await prisma.walletTransaction.aggregate({
    where: {
      fromWalletId: walletId,
      transactionType: 'WITHDRAWAL',
      status: 'COMPLETED',
      completedAt: { gte: startOfDay },
    },
    _sum: {
      amount: true,
    },
  });

  const todayTotal = todayWithdrawals._sum.amount || 0;
  const remaining = wallet.dailyWithdrawalLimit - todayTotal;

  return {
    allowed: amount <= remaining,
    remaining,
    limit: wallet.dailyWithdrawalLimit,
  };
}

// ============================================================================
// WALLET STATISTICS
// ============================================================================

/**
 * Get wallet statistics
 */
export async function getWalletStatistics(walletId: string) {
  const [wallet, transactions, depositsSum, withdrawalsSum, stakingRecords] =
    await Promise.all([
      prisma.wallet.findUnique({ where: { id: walletId } }),
      prisma.walletTransaction.count({
        where: {
          OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
        },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          toWalletId: walletId,
          transactionType: 'DEPOSIT',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          fromWalletId: walletId,
          transactionType: 'WITHDRAWAL',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      prisma.stakingRecord.findMany({
        where: { walletId, status: 'ACTIVE' },
      }),
    ]);

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return {
    wallet: {
      id: wallet.id,
      address: wallet.walletAddress,
      type: wallet.walletType,
      status: wallet.status,
    },
    balances: {
      available: wallet.availableBalance,
      locked: wallet.lockedBalance,
      staked: wallet.stakedBalance,
      total: wallet.totalBalance,
      cePoints: wallet.cePoints,
      joyTokens: wallet.joyTokens,
    },
    transactions: {
      total: transactions,
      totalDeposits: depositsSum._sum.amount || 0,
      totalWithdrawals: withdrawalsSum._sum.amount || 0,
      netFlow: (depositsSum._sum.amount || 0) - (withdrawalsSum._sum.amount || 0),
    },
    staking: {
      activeStakes: stakingRecords.length,
      totalStaked: stakingRecords.reduce((sum, s) => sum + s.stakedAmount, 0),
      pendingRewards: stakingRecords.reduce((sum, s) => sum + s.accumulatedRewards, 0),
    },
  };
}

/**
 * Get platform-wide wallet statistics
 */
export async function getPlatformWalletStatistics() {
  const [totalWallets, activeWallets, totalBalance, weWallet] = await Promise.all([
    prisma.wallet.count(),
    prisma.wallet.count({ where: { status: WalletStatus.ACTIVE } }),
    prisma.wallet.aggregate({
      _sum: { totalBalance: true },
    }),
    getWeWallet(),
  ]);

  return {
    totalWallets,
    activeWallets,
    totalBalance: totalBalance._sum.totalBalance || 0,
    weWallet: weWallet
      ? {
          id: weWallet.id,
          balance: weWallet.totalBalance,
          availableBalance: weWallet.availableBalance,
        }
      : null,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const WalletService = {
  // Creation
  createWallet,
  createUserWallet,
  createWeWallet,

  // Balance management
  getWalletBalance,
  updateWalletBalance,
  lockBalance,
  unlockBalance,

  // Security
  lockWallet,
  unlockWallet,
  freezeWallet,
  addToWhitelist,
  removeFromWhitelist,
  isWhitelisted,

  // Queries
  getWalletByAddress,
  getUserWallet,
  getWeWallet,
  searchWallets,
  getWalletTransactionHistory,

  // Limits
  setDailyWithdrawalLimit,
  setTransactionLimit,
  checkDailyWithdrawalLimit,

  // Statistics
  getWalletStatistics,
  getPlatformWalletStatistics,
};

export default WalletService;
