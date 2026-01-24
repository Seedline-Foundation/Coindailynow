/**
 * Finance Resolvers - Refunds (4/4 operations)
 * GraphQL resolvers for refund-related finance operations
 */

import { FinanceService } from '../../../services/FinanceService';
import { UserInputError, AuthenticationError } from 'apollo-server-express';

// Helper functions
function requireAuth(context: any) {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in');
  }
  return context.user;
}

function requireAdmin(context: any) {
  const user = requireAuth(context);
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    throw new AuthenticationError('Admin access required');
  }
  return user;
}

export const refundResolvers = {
  Mutation: {
    /**
     * Process Full Refund
     * Refund the full amount of a transaction
     */
    processFullRefund: async (_: any, { transactionId, reason, metadata }: any, context: any) => {
      const user = requireAdmin(context);

      if (!transactionId) {
        throw new UserInputError('Transaction ID is required');
      }

      const result = await FinanceService.processFullRefund({
        originalTransactionId: transactionId,
        reason: reason || 'Full refund requested',
        refundType: 'FULL',
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'Full refund failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: 'Full refund processed successfully',
      };
    },

    /**
     * Process Partial Refund
     * Refund a partial amount of a transaction
     */
    processPartialRefund: async (_: any, { transactionId, amount, reason, metadata }: any, context: any) => {
      const user = requireAdmin(context);

      if (!transactionId) {
        throw new UserInputError('Transaction ID is required');
      }

      if (!amount || amount <= 0) {
        throw new UserInputError('Valid refund amount is required');
      }

      const result = await FinanceService.processPartialRefund({
        originalTransactionId: transactionId,
        amount,
        reason: reason || 'Partial refund requested',
        refundType: 'PARTIAL',
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'Partial refund failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Partial refund of ${amount} processed successfully`,
      };
    },

    /**
     * Process Subscription Refund
     * Refund a subscription with prorated amount calculation
     */
    processSubscriptionRefund: async (_: any, { subscriptionId, reason, metadata }: any, context: any) => {
      const user = requireAdmin(context);

      if (!subscriptionId) {
        throw new UserInputError('Subscription ID is required');
      }

      const result = await FinanceService.processSubscriptionRefund({
        originalTransactionId: subscriptionId,
        reason: reason || 'Subscription refund requested',
        refundType: 'FULL',
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'Subscription refund failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: 'Subscription refund processed successfully',
      };
    },

    /**
     * Handle Chargeback
     * Process a chargeback from payment processor
     */
    handleChargeback: async (_: any, { transactionId, chargebackAmount, reason, metadata }: any, context: any) => {
      const user = requireAdmin(context);

      if (!transactionId) {
        throw new UserInputError('Transaction ID is required');
      }

      if (!chargebackAmount || chargebackAmount <= 0) {
        throw new UserInputError('Valid chargeback amount is required');
      }

      const result = await FinanceService.handleChargeback({
        originalTransactionId: transactionId,
        amount: chargebackAmount,
        reason: reason || 'Chargeback from payment processor',
        refundType: 'PARTIAL',
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'Chargeback handling failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Chargeback of ${chargebackAmount} processed successfully`,
      };
    },
  },
};
