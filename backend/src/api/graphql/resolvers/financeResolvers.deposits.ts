/**
 * Finance GraphQL Resolvers - Deposit Operations Only
 * Wallet and Transaction Management System
 * 
 * This file contains ONLY the implemented deposit operations:
 * - Deposits (4 operations) ✅
 * - Withdrawals (3 operations) ✅
 * 
 * Other operations are in FinanceService but not exposed here yet.
 */

import { PrismaClient, PaymentMethod } from '@prisma/client';
import { FinanceService } from '../../../services/FinanceService';
import { GraphQLError } from 'graphql';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  requiresOTP?: boolean;
  requiresApproval?: boolean;
}

interface Context {
  prisma: PrismaClient;
  user?: { 
    id: string; 
    role: string;
    email: string;
  };
}

interface DepositInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  externalReference?: string;
  metadata?: Record<string, any>;
}

interface WithdrawalInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  destinationType: 'EXTERNAL_WALLET' | 'MOBILE_MONEY' | 'BANK_ACCOUNT';
  destinationAddress: string;
  otpCode?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify user authentication
 */
function requireAuth(context: Context): void {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

/**
 * Verify user owns the resource
 */
function requireOwnership(context: Context, userId: string): void {
  requireAuth(context);
  if (context.user!.id !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(context.user!.role)) {
    throw new GraphQLError('Unauthorized: You can only access your own resources', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

/**
 * Verify admin role
 */
function requireAdmin(context: Context): void {
  requireAuth(context);
  if (!['ADMIN', 'SUPER_ADMIN'].includes(context.user!.role)) {
    throw new GraphQLError('Unauthorized: Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

// ============================================================================
// RESOLVERS
// ============================================================================

export const financeResolvers: any = {
  // ==========================================================================
  // QUERIES
  // ==========================================================================
  Query: {
    /**
     * Get wallet by ID
     */
    getWallet: async (
      _: any,
      { walletId }: { walletId: string },
      context: Context
    ) => {
      requireAuth(context);
      
      const wallet = await context.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new GraphQLError('Wallet not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!wallet.userId) {
        throw new GraphQLError('Invalid wallet: missing userId', {
          extensions: { code: 'INVALID_DATA' }
        });
      }

      requireOwnership(context, wallet.userId);
      return wallet;
    },

    /**
     * Get user's wallets
     */
    getUserWallets: async (
      _: any,
      { userId }: { userId: string },
      context: Context
    ) => {
      requireOwnership(context, userId);
      
      return context.prisma.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    },

    /**
     * Get wallet transactions
     */
    getWalletTransactions: async (
      _: any,
      { walletId, limit = 50, offset = 0, status }: {
        walletId: string;
        limit?: number;
        offset?: number;
        status?: string;
      },
      context: Context
    ) => {
      requireAuth(context);
      
      const wallet = await context.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new GraphQLError('Wallet not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!wallet.userId) {
        throw new GraphQLError('Invalid wallet: missing userId', {
          extensions: { code: 'INVALID_DATA' }
        });
      }

      requireOwnership(context, wallet.userId);

      const where: any = {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId }
        ]
      };

      if (status) {
        where.status = status;
      }

      return context.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
    },

    /**
     * Get transaction by ID
     */
    getTransaction: async (
      _: any,
      { transactionId }: { transactionId: string },
      context: Context
    ) => {
      requireAuth(context);
      
      const transaction = await context.prisma.walletTransaction.findUnique({
        where: { id: transactionId },
        include: {
          fromWallet: true,
          toWallet: true
        }
      });

      if (!transaction) {
        throw new GraphQLError('Transaction not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check if user owns either wallet
      const userId = context.user!.id;
      const isOwner = transaction.fromWallet?.userId === userId || 
                     transaction.toWallet?.userId === userId;
      
      if (!isOwner && !['ADMIN', 'SUPER_ADMIN'].includes(context.user!.role)) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return transaction;
    },

    /**
     * Get wallet balance
     */
    getWalletBalance: async (
      _: any,
      { walletId }: { walletId: string },
      context: Context
    ) => {
      requireAuth(context);
      
      const wallet = await context.prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        throw new GraphQLError('Wallet not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!wallet.userId) {
        throw new GraphQLError('Invalid wallet: missing userId', {
          extensions: { code: 'INVALID_DATA' }
        });
      }

      requireOwnership(context, wallet.userId);
      return wallet;
    }
  },

  // ==========================================================================
  // MUTATIONS - DEPOSITS (4 operations - ALL IMPLEMENTED)
  // ==========================================================================
  Mutation: {
    /**
     * Deposit from external wallet
     */
    depositFromExternalWallet: async (
      _: any,
      { input }: { input: DepositInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.depositFromExternalWallet(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Deposit failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Deposit via mobile money
     */
    depositViaMobileMoney: async (
      _: any,
      { input }: { input: DepositInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.depositViaMobileMoney(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Deposit failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Deposit via card
     */
    depositViaCard: async (
      _: any,
      { input }: { input: DepositInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.depositViaCard(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Deposit failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Deposit via bank transfer
     */
    depositViaBankTransfer: async (
      _: any,
      { input }: { input: DepositInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.depositViaBankTransfer(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Deposit failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    // ========================================================================
    // MUTATIONS - WITHDRAWALS (3 operations - ALL IMPLEMENTED)
    // ========================================================================

    /**
     * Withdraw to external wallet
     */
    withdrawToExternalWallet: async (
      _: any,
      { input }: { input: WithdrawalInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.withdrawToExternalWallet(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Withdrawal failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Withdraw via mobile money
     */
    withdrawViaMobileMoney: async (
      _: any,
      { input }: { input: WithdrawalInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.withdrawViaMobileMoney(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Withdrawal failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * Withdraw to bank account
     */
    withdrawToBankAccount: async (
      _: any,
      { input }: { input: WithdrawalInput },
      context: Context
    ) => {
      requireOwnership(context, input.userId);
      
      try {
        return await FinanceService.withdrawToBankAccount(input);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Withdrawal failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }

    // TODO: Add remaining operations (transfers, payments, etc.) when needed
  }
};

export default financeResolvers;
