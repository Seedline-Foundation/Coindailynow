/**
 * Wallet Modal GraphQL Resolvers
 * 
 * Exposes 7 new finance operations for wallet modal integration:
 * - convertCEToJY: Convert CE Points to JY Tokens
 * - getWhitelistedWallets: Get user's whitelisted addresses
 * - depositFromWallet: Deposit from whitelisted wallet
 * - createTransfer: Internal platform transfers
 * - searchUsers: Search users for transfers/gifts
 * - getExchangeRate: Real-time exchange rates
 * - checkSwapStatus: Check swap completion status
 */

import { financeService } from '../../services/FinanceService';

// Helper function to require authentication
const requireAuth = (context: any) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
};

export const walletModalResolvers = {
  Query: {
    /**
     * Get whitelisted wallet addresses for current user
     */
    getWhitelistedWallets: async (_: any, __: any, context: any) => {
      const user = requireAuth(context);
      return await financeService.getWhitelistedWallets(user.id);
    },

    /**
     * Search users by username/email for transfers and gifts
     */
    searchUsers: async (_: any, { query, limit }: { query: string; limit?: number }, context: any) => {
      requireAuth(context);
      return await financeService.searchUsers(query, limit);
    },

    /**
     * Get real-time exchange rate for swaps
     */
    getExchangeRate: async (
      _: any,
      {
        fromCurrency,
        toCurrency,
        amount,
        provider,
      }: {
        fromCurrency: string;
        toCurrency: string;
        amount: number;
        provider: 'YellowCard' | 'ChangeNOW';
      },
      context: any
    ) => {
      requireAuth(context);
      return await financeService.getExchangeRate(fromCurrency, toCurrency, amount, provider);
    },

    /**
     * Check if recent swap has been completed
     */
    checkSwapStatus: async (_: any, { walletId }: { walletId: string }, context: any) => {
      const user = requireAuth(context);
      return await financeService.checkSwapStatus(walletId);
    },
  },

  Mutation: {
    /**
     * Convert CE Points to JY Tokens
     */
    convertCEToJY: async (
      _: any,
      { walletId, ceAmount }: { walletId: string; ceAmount: number },
      context: any
    ) => {
      const user = requireAuth(context);
      return await financeService.convertCEToJY(walletId, ceAmount, user.id);
    },

    /**
     * Deposit JY from whitelisted external wallet
     */
    depositFromWallet: async (
      _: any,
      {
        walletId,
        sourceAddress,
        amount,
        txHash,
      }: {
        walletId: string;
        sourceAddress: string;
        amount: number;
        txHash?: string;
      },
      context: any
    ) => {
      const user = requireAuth(context);
      return await financeService.depositFromWallet(walletId, sourceAddress, amount, user.id, txHash);
    },

    /**
     * Create internal platform transfer
     */
    createTransfer: async (
      _: any,
      {
        fromWalletId,
        toIdentifier,
        amount,
        transferType,
        note,
      }: {
        fromWalletId: string;
        toIdentifier: string;
        amount: number;
        transferType: 'USER' | 'SERVICE' | 'CONTENT';
        note?: string;
      },
      context: any
    ) => {
      const user = requireAuth(context);
      return await financeService.createTransfer(
        fromWalletId,
        toIdentifier,
        amount,
        transferType,
        user.id,
        note
      );
    },
  },
};

// Type definitions for GraphQL schema
export const walletModalTypeDefs = `
  type ConversionResult {
    success: Boolean!
    jyAmount: Float
    transactionId: String
    error: String
  }

  type DepositResult {
    success: Boolean!
    txHash: String
    transactionId: String
    error: String
  }

  type TransferResult {
    success: Boolean!
    txId: String
    error: String
  }

  type UserSearchResult {
    id: ID!
    username: String!
    displayName: String!
    avatar: String
    role: String!
  }

  type ExchangeRate {
    fromCurrency: String!
    toCurrency: String!
    rate: Float!
    fee: Float!
    estimatedTime: String!
    provider: String!
  }

  type SwapStatus {
    success: Boolean!
    txHash: String
    error: String
  }

  enum TransferType {
    USER
    SERVICE
    CONTENT
  }

  enum PaymentProvider {
    YellowCard
    ChangeNOW
  }

  extend type Query {
    """Get whitelisted wallet addresses for current user"""
    getWhitelistedWallets: [String!]!

    """Search users by username or email"""
    searchUsers(query: String!, limit: Int): [UserSearchResult!]!

    """Get real-time exchange rate from payment provider"""
    getExchangeRate(
      fromCurrency: String!
      toCurrency: String!
      amount: Float!
      provider: PaymentProvider!
    ): ExchangeRate!

    """Check if recent swap transaction has been completed"""
    checkSwapStatus(walletId: ID!): SwapStatus!
  }

  extend type Mutation {
    """Convert CE Points to JY Tokens"""
    convertCEToJY(walletId: ID!, ceAmount: Float!): ConversionResult!

    """Deposit JY from whitelisted external wallet"""
    depositFromWallet(
      walletId: ID!
      sourceAddress: String!
      amount: Float!
      txHash: String
    ): DepositResult!

    """Create internal platform transfer"""
    createTransfer(
      fromWalletId: ID!
      toIdentifier: String!
      amount: Float!
      transferType: TransferType!
      note: String
    ): TransferResult!
  }
`;
