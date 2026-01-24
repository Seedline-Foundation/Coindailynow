/**
 * Withdrawal Management GraphQL Resolvers
 * 
 * Handles withdrawal requests with:
 * - 48-hour cooldown tracking
 * - Wed/Fri withdrawal windows
 * - Minimum 0.05 JY validation
 * - Whitelist verification
 * - Admin approval workflow
 */

import { financeService } from '../../services/FinanceService';

// Helper function to require authentication
const requireAuth = (context: any) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
};

// Helper function to require admin role
const requireAdmin = (context: any) => {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin privileges required');
  }
  return user;
};

export const withdrawalResolvers = {
  Query: {
    /**
     * Get user's withdrawal requests
     */
    getUserWithdrawalRequests: async (
      _: any,
      { status, limit }: { status?: string; limit?: number },
      context: any
    ) => {
      const user = requireAuth(context);
      const filters: { status?: string; limit?: number } = {};
      if (status !== undefined) filters.status = status;
      if (limit !== undefined) filters.limit = limit;
      return await financeService.getUserWithdrawalRequests(user.id, filters);
    },

    /**
     * Get all pending withdrawal requests (Admin only)
     */
    getPendingWithdrawalRequests: async (
      _: any,
      { limit, offset }: { limit?: number; offset?: number },
      context: any
    ) => {
      requireAdmin(context);
      const filters: { limit?: number; offset?: number } = {};
      if (limit !== undefined) filters.limit = limit;
      if (offset !== undefined) filters.offset = offset;
      return await financeService.getPendingWithdrawalRequests(filters);
    },

    /**
     * Get withdrawal statistics (Admin only)
     */
    getWithdrawalStats: async (_: any, __: any, context: any) => {
      requireAdmin(context);
      return await financeService.getWithdrawalStats();
    },
  },

  Mutation: {
    /**
     * Create a withdrawal request
     */
    createWithdrawalRequest: async (
      _: any,
      {
        walletId,
        amount,
        destinationAddress,
        notes,
      }: {
        walletId: string;
        amount: number;
        destinationAddress: string;
        notes?: string;
      },
      context: any
    ) => {
      const user = requireAuth(context);
      const input: {
        userId: string;
        walletId: string;
        amount: number;
        destinationAddress: string;
        notes?: string;
      } = {
        userId: user.id,
        walletId,
        amount,
        destinationAddress,
      };
      if (notes !== undefined) input.notes = notes;
      return await financeService.createWithdrawalRequest(input);
    },

    /**
     * Approve withdrawal request (Admin only)
     */
    approveWithdrawalRequest: async (
      _: any,
      {
        requestId,
        adminNotes,
        txHash,
      }: {
        requestId: string;
        adminNotes?: string;
        txHash?: string;
      },
      context: any
    ) => {
      const admin = requireAdmin(context);
      const input: {
        requestId: string;
        adminId: string;
        adminNotes?: string;
        txHash?: string;
      } = {
        requestId,
        adminId: admin.id,
      };
      if (adminNotes !== undefined) input.adminNotes = adminNotes;
      if (txHash !== undefined) input.txHash = txHash;
      return await financeService.approveWithdrawalRequest(input);
    },

    /**
     * Reject withdrawal request (Admin only)
     */
    rejectWithdrawalRequest: async (
      _: any,
      {
        requestId,
        reason,
        adminNotes,
      }: {
        requestId: string;
        reason: string;
        adminNotes?: string;
      },
      context: any
    ) => {
      const admin = requireAdmin(context);
      const input: {
        requestId: string;
        adminId: string;
        reason: string;
        adminNotes?: string;
      } = {
        requestId,
        adminId: admin.id,
        reason,
      };
      if (adminNotes !== undefined) input.adminNotes = adminNotes;
      return await financeService.rejectWithdrawalRequest(input);
    },
  },
};
