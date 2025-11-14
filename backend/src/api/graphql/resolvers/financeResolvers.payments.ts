/**
 * Finance GraphQL Resolvers - Payment Operations
 * Subscription, Product, Service, Premium Content, and Boost Campaign Payments
 * 
 * This file contains ONLY the implemented payment operations:
 * - Payments (5 operations) ✅
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

interface PaymentInput {
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentType: 'SUBSCRIPTION' | 'PRODUCT' | 'SERVICE' | 'PREMIUM_CONTENT' | 'BOOST_CAMPAIGN';
  referenceId: string;
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

// ============================================================================
// RESOLVERS
// ============================================================================

export const paymentResolvers: any = {
  // ==========================================================================
  // MUTATIONS - PAYMENT OPERATIONS
  // ==========================================================================
  Mutation: {
    /**
     * 14. Process Subscription Payment
     * User pays for subscription using their wallet balance
     */
    processSubscriptionPayment: async (
      _: any,
      { input }: { input: PaymentInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the wallet
        requireOwnership(context, input.userId);

        // Validate payment type
        if (input.paymentType !== 'SUBSCRIPTION') {
          throw new GraphQLError('Invalid payment type for this operation', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Validate amount
        if (input.amount <= 0) {
          throw new GraphQLError('Payment amount must be greater than zero', {
            extensions: { code: 'INVALID_AMOUNT' }
          });
        }

        // Call service layer
        const result = await FinanceService.processSubscriptionPayment(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Subscription payment failed', {
            extensions: { code: 'PAYMENT_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('processSubscriptionPayment error:', error);
        throw new GraphQLError('Internal server error during subscription payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 15. Process Product Payment
     * User purchases digital products (NFTs, digital assets, etc.)
     */
    processProductPayment: async (
      _: any,
      { input }: { input: PaymentInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the wallet
        requireOwnership(context, input.userId);

        // Validate payment type
        if (input.paymentType !== 'PRODUCT') {
          throw new GraphQLError('Invalid payment type for this operation', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Validate amount
        if (input.amount <= 0) {
          throw new GraphQLError('Payment amount must be greater than zero', {
            extensions: { code: 'INVALID_AMOUNT' }
          });
        }

        // Call service layer
        const result = await FinanceService.processProductPayment(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Product payment failed', {
            extensions: { code: 'PAYMENT_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('processProductPayment error:', error);
        throw new GraphQLError('Internal server error during product payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 16. Process Service Payment
     * User pays for service bookings (consulting, advisory, etc.)
     */
    processServicePayment: async (
      _: any,
      { input }: { input: PaymentInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the wallet
        requireOwnership(context, input.userId);

        // Validate payment type
        if (input.paymentType !== 'SERVICE') {
          throw new GraphQLError('Invalid payment type for this operation', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Validate amount
        if (input.amount <= 0) {
          throw new GraphQLError('Payment amount must be greater than zero', {
            extensions: { code: 'INVALID_AMOUNT' }
          });
        }

        // Call service layer
        const result = await FinanceService.processServicePayment(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Service payment failed', {
            extensions: { code: 'PAYMENT_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('processServicePayment error:', error);
        throw new GraphQLError('Internal server error during service payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 17. Process Premium Content Payment
     * User pays for premium articles, exclusive content, etc.
     */
    processPremiumContentPayment: async (
      _: any,
      { input }: { input: PaymentInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the wallet
        requireOwnership(context, input.userId);

        // Validate payment type
        if (input.paymentType !== 'PREMIUM_CONTENT') {
          throw new GraphQLError('Invalid payment type for this operation', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Validate amount
        if (input.amount <= 0) {
          throw new GraphQLError('Payment amount must be greater than zero', {
            extensions: { code: 'INVALID_AMOUNT' }
          });
        }

        // Call service layer
        const result = await FinanceService.processPremiumContentPayment(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Premium content payment failed', {
            extensions: { code: 'PAYMENT_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('processPremiumContentPayment error:', error);
        throw new GraphQLError('Internal server error during premium content payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    /**
     * 18. Process Boost Campaign Payment
     * User pays to boost posts, promote content, etc.
     */
    processBoostCampaignPayment: async (
      _: any,
      { input }: { input: PaymentInput },
      context: Context
    ): Promise<TransactionResult> => {
      try {
        // Verify user owns the wallet
        requireOwnership(context, input.userId);

        // Validate payment type
        if (input.paymentType !== 'BOOST_CAMPAIGN') {
          throw new GraphQLError('Invalid payment type for this operation', {
            extensions: { code: 'INVALID_INPUT' }
          });
        }

        // Validate amount
        if (input.amount <= 0) {
          throw new GraphQLError('Payment amount must be greater than zero', {
            extensions: { code: 'INVALID_AMOUNT' }
          });
        }

        // Call service layer
        const result = await FinanceService.processBoostCampaignPayment(input);

        if (!result.success) {
          throw new GraphQLError(result.error || 'Boost campaign payment failed', {
            extensions: { code: 'PAYMENT_FAILED' }
          });
        }

        return result;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('processBoostCampaignPayment error:', error);
        throw new GraphQLError('Internal server error during boost campaign payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }
};

// Export for merging with other resolvers
export default paymentResolvers;
