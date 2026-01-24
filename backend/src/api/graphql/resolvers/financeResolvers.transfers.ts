/**
 * Finance GraphQL Resolvers - Transfer Operations
 * User-to-User, Admin-to-User, Platform Transfers, Batch Transfers
 * 
 * This file contains ONLY the implemented transfer operations:
 * - Transfers (6 operations) ✅
 */

import { PrismaClient } from '@prisma/client';
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

interface TransferInput {
  fromUserId: string;
  fromWalletId: string;
  toUserId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface BatchTransferInput {
  fromUserId: string;
  fromWalletId: string;
  transfers: Array<{
    toUserId: string;
    toWalletId: string;
    amount: number;
    description?: string;
  }>;
  currency: string;
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

/**
 * Verify super admin role
 */
function requireSuperAdmin(context: Context): void {
  requireAuth(context);
  if (context.user!.role !== 'SUPER_ADMIN') {
    throw new GraphQLError('Unauthorized: Super Admin access required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

// ============================================================================
// RESOLVERS
// ============================================================================

export const transferResolvers: any = {
  // ==========================================================================
  // MUTATIONS - TRANSFER OPERATIONS
  // ==========================================================================
  Mutation: {
    /**
     * 8. Transfer User to User
     * P2P transfer between user wallets
     */
    transferUserToUser: async (
      _: any,
      { input }: { input: TransferInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the source wallet
        requireOwnership(context, input.fromUserId);

        // Call service layer
        const result = await FinanceService.transferUserToUser(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Transfer failed', {
            extensions: { code: 'TRANSFER_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('transferUserToUser error:', error);
        throw new GraphQLError('Internal server error during transfer', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 9. Transfer Admin to User
     * Admin can transfer funds to any user wallet
     */
    transferAdminToUser: async (
      _: any,
      { input }: { input: TransferInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify admin permissions
        requireAdmin(context);

        // Call service layer
        const result = await FinanceService.transferAdminToUser(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Admin transfer failed', {
            extensions: { code: 'TRANSFER_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('transferAdminToUser error:', error);
        throw new GraphQLError('Internal server error during admin transfer', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 10. Transfer User to We Wallet
     * User pays platform (subscription, fees, etc.)
     */
    transferUserToWeWallet: async (
      _: any,
      { input }: { input: TransferInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the source wallet
        requireOwnership(context, input.fromUserId);

        // Call service layer
        const result = await FinanceService.transferUserToWeWallet(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Payment to platform failed', {
            extensions: { code: 'TRANSFER_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('transferUserToWeWallet error:', error);
        throw new GraphQLError('Internal server error during payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 11. Transfer We Wallet to User
     * Platform pays user (rewards, refunds, payouts)
     * Requires SUPER_ADMIN approval
     */
    transferWeWalletToUser: async (
      _: any,
      { input }: { input: TransferInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify super admin permissions
        requireSuperAdmin(context);

        // Add approver ID to input
        const inputWithApprover = {
          ...input,
          approvedByUserId: context.user!.id
        };

        // Call service layer
        const result = await FinanceService.transferWeWalletToUser(inputWithApprover);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Platform payout failed', {
            extensions: { code: 'TRANSFER_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('transferWeWalletToUser error:', error);
        throw new GraphQLError('Internal server error during payout', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 12. Transfer We Wallet to External
     * Platform transfers to external wallet (vendor payments, etc.)
     * Requires SUPER_ADMIN approval
     */
    transferWeWalletToExternal: async (
      _: any,
      { input }: { input: TransferInput & { destinationAddress: string } },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify super admin permissions
        requireSuperAdmin(context);

        // Note: This operation is not yet implemented in FinanceService
        // The document says it's implemented, but it's not in the actual code
        throw new GraphQLError('This operation is not yet implemented in the service layer', {
          extensions: { code: 'NOT_IMPLEMENTED' }
        });
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('transferWeWalletToExternal error:', error);
        throw new GraphQLError('Internal server error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 13. Batch Transfer
     * Bulk transfer to multiple recipients in one transaction
     */
    batchTransfer: async (
      _: any,
      { input }: { input: BatchTransferInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the source wallet
        requireOwnership(context, input.fromUserId);

        // Validate batch size
        if (!input.transfers || input.transfers.length === 0) {
          throw new GraphQLError('Batch transfer must include at least one recipient', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        if (input.transfers.length > 100) {
          throw new GraphQLError('Batch transfer limited to 100 recipients per transaction', {
            extensions: { code: 'BATCH_LIMIT_EXCEEDED' }
          });
        }

        // Call service layer
        const result = await FinanceService.batchTransfer(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Batch transfer failed', {
            extensions: { code: 'TRANSFER_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('batchTransfer error:', error);
        throw new GraphQLError('Internal server error during batch transfer', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
};

// Export for merging with other resolvers
export default transferResolvers;
