/**
 * GraphQL Resolvers: Gift & Donation Operations
 * 
 * Handles gift transfers, creator tips, and charitable donations
 * with optional anonymity and platform fee management.
 * 
 * Category 10: Gifts & Donations (3/3)
 * - sendGift: Send gift to another user
 * - sendTip: Tip content creator (with platform fee)
 * - sendDonation: Donate to creator/charity (no platform fee)
 */

import { FinanceService } from '../../../services/FinanceService';

/**
 * Gift & Donation GraphQL Resolvers
 */
export const giftResolvers = {
  Mutation: {
    /**
     * Send gift to another user
     */
    sendGift: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.sendGift(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Gift sent successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Send tip to content creator
     */
    sendTip: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.sendTip(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Tip sent successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Send donation to creator or charity
     */
    sendDonation: async (_: any, { input }: any, context: any) => {
      try {
        const result = await FinanceService.sendDonation(input);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          transactionId: result.transactionId,
          message: 'Donation sent successfully',
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
