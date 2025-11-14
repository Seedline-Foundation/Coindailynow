/**
 * Platform Settings GraphQL Resolvers
 * Manages JOY Token (JY) exchange rates and platform configuration
 * 
 * SUPER ADMIN functionality
 */

import { PlatformSettingsService } from '../../services/PlatformSettingsService';

// Context type definition
interface Context {
  user?: {
    id: string;
    role: string;
  };
  prisma: any;
}

export const platformSettingsResolvers = {
  Query: {
    /**
     * Get current JOY Token rate
     * PUBLIC - Anyone can view
     */
    joyTokenRate: async () => {
      return await PlatformSettingsService.getJoyTokenRate();
    },
    
    /**
     * Get complete platform settings
     * SUPER ADMIN ONLY
     */
    platformSettings: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      const settings = await PlatformSettingsService.getPlatformSettings(context.user.id);
      
      // Parse supported currencies string to array
      return {
        ...settings,
        supportedCurrencies: settings.supportedCurrencies.split(',')
      };
    },
    
    /**
     * Get JOY Token rate history
     * SUPER ADMIN or FINANCE_ADMIN
     */
    joyTokenRateHistory: async (
      _: any,
      { limit = 50 }: { limit?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      return await PlatformSettingsService.getJoyTokenRateHistory(
        context.user.id,
        limit
      );
    },
    
    /**
     * Convert between currencies
     * PUBLIC
     */
    convertCurrency: async (
      _: any,
      { input }: { input: { amount: number; fromCurrency: string; toCurrency: string } }
    ) => {
      const convertedAmount = await PlatformSettingsService.convertCurrency(
        input.amount,
        input.fromCurrency,
        input.toCurrency
      );
      
      const rate = convertedAmount / input.amount;
      
      return {
        amount: input.amount,
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        convertedAmount,
        rate
      };
    },
    
    /**
     * Convert CE Points to JY
     * PUBLIC
     */
    convertCEPointsToJY: async (_: any, { cePoints }: { cePoints: number }) => {
      return await PlatformSettingsService.convertCEPointsToJY(cePoints);
    }
  },
  
  Mutation: {
    /**
     * Update JOY Token rate
     * SUPER ADMIN ONLY
     */
    updateJoyTokenRate: async (
      _: any,
      { input }: { input: { newRate: number; reason?: string; notes?: string } },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      return await PlatformSettingsService.updateJoyTokenRate({
        adminUserId: context.user.id,
        newRate: input.newRate,
        ...(input.reason && { reason: input.reason }),
        ...(input.notes && { notes: input.notes })
      });
    },
    
    /**
     * Update CE Points rate
     * SUPER ADMIN ONLY
     */
    updateCEPointsRate: async (
      _: any,
      { input }: { input: { newRate: number; reason?: string } },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      return await PlatformSettingsService.updateCEPointsRate({
        adminUserId: context.user.id,
        newRate: input.newRate,
        ...(input.reason && { reason: input.reason })
      });
    },
    
    /**
     * Update platform configuration
     * SUPER ADMIN ONLY
     */
    updatePlatformConfig: async (
      _: any,
      { input }: { input: any },
      context: Context
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      const result = await PlatformSettingsService.updatePlatformConfig({
        adminUserId: context.user.id,
        ...input
      });
      
      return {
        ...result,
        settings: {
          ...result.settings,
          supportedCurrencies: result.settings.supportedCurrencies.split(',')
        }
      };
    }
  },
  
  // Field resolvers
  CurrencyRateHistory: {
    updatedByUser: async (parent: any, _: any, context: Context) => {
      if (!parent.updatedBy) return null;
      
      // Fetch user from database
      const user = await context.prisma.user.findUnique({
        where: { id: parent.updatedBy }
      });
      
      return user;
    }
  }
};
