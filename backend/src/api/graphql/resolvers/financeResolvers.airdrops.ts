/**
 * GraphQL Resolvers: Airdrop Operations
 * 
 * Handles airdrop campaign management, token claiming, and batch distribution
 * operations with proper permissions and validation.
 * 
 * Category 8: Airdrops (3/3)
 * - createAirdropCampaign: Super Admin creates airdrop campaigns
 * - claimAirdrop: Users claim tokens from active campaigns
 * - distributeAirdrop: Super Admin performs batch token distribution
 */

import { FinanceService } from '../../../services/FinanceService';

/**
 * Airdrop GraphQL Resolvers
 */
export const airdropResolvers = {
  Mutation: {
    /**
     * Create new airdrop campaign (Super Admin only)
     */
    createAirdropCampaign: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.createAirdropCampaign(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Airdrop campaign created successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Claim airdrop tokens (User)
     */
    claimAirdrop: async (
      _: any, 
      { campaignId, userId }: { campaignId: string; userId: string },
      context: any
    ) => {
      try {
        const result = await FinanceService.claimAirdrop({ campaignId, userId });
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Airdrop claimed successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Distribute airdrop to multiple users (Super Admin only)
     */
    distributeAirdrop: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.distributeAirdrop(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Airdrop distributed successfully',
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
