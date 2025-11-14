/**
 * GraphQL Resolvers: Escrow Operations
 * 
 * Handles escrow transaction management including creation, release, 
 * and dispute resolution with secure fund holding.
 * 
 * Category 9: Escrow (3/3)
 * - createEscrow: Create escrow transaction with locked funds
 * - releaseEscrow: Release funds to seller when conditions met
 * - handleEscrowDispute: Handle disputes with mediator resolution
 */

import { FinanceService } from '../../../services/FinanceService';

/**
 * Escrow GraphQL Resolvers
 */
export const escrowResolvers = {
  Mutation: {
    /**
     * Create escrow transaction
     */
    createEscrow: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.createEscrow(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Escrow transaction created successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Release escrow funds
     */
    releaseEscrow: async (
      _: any, 
      { escrowId, releasedByUserId, metadata }: { escrowId: string; releasedByUserId: string; metadata?: Record<string, any> },
      context: any
    ) => {
      try {
        const input: any = { escrowId, releasedByUserId };
        if (metadata) input.metadata = metadata;
        
        const result = await FinanceService.releaseEscrow(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Escrow funds released successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Handle escrow dispute
     */
    handleEscrowDispute: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.handleEscrowDispute(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: input.resolution 
            ? 'Escrow dispute resolved successfully' 
            : 'Escrow dispute raised successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
};
