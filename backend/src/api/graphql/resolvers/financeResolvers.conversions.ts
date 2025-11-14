/**
 * Finance Resolvers - Conversions (3/3 operations)
 * GraphQL resolvers for CE Points, JOY Token, Fiat, and Crypto conversion operations
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

async function requireOwnership(context: any, walletId: string) {
  const user = requireAuth(context);
  
  // Allow admins to perform operations on any wallet
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return user;
  }

  // For regular users, verify wallet ownership
  const { prisma } = context;
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { userId: true },
  });

  if (!wallet || wallet.userId !== user.id) {
    throw new AuthenticationError('You do not have access to this wallet');
  }

  return user;
}

export const conversionResolvers = {
  Mutation: {
    /**
     * Convert CE Points to JOY Token
     * One-way conversion: Users exchange earned CE Points for platform JOY tokens
     */
    convertCEToJOY: async (_: any, { cePointsAmount, conversionRate, metadata }: any, context: any) => {
      const user = requireAuth(context);

      if (!cePointsAmount || cePointsAmount <= 0) {
        throw new UserInputError('Valid CE Points amount is required');
      }

      if (!conversionRate || conversionRate <= 0) {
        throw new UserInputError('Valid conversion rate is required');
      }

      const result = await FinanceService.convertCEToJOY({
        userId: user.id,
        cePointsAmount,
        conversionRate,
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'CE to JOY conversion failed');
      }

      const joyTokenAmount = cePointsAmount / conversionRate;

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Successfully converted ${cePointsAmount} CE Points to ${joyTokenAmount.toFixed(4)} JOY tokens`,
      };
    },

    /**
     * Convert JOY Token to Fiat
     * Swap JOY tokens to any supported fiat currency (USD, EUR, NGN, KES, ZAR, etc.)
     */
    convertJOYToFiat: async (_: any, { walletId, joyTokenAmount, targetCurrency, exchangeRate, metadata }: any, context: any) => {
      await requireOwnership(context, walletId);

      if (!walletId) {
        throw new UserInputError('Wallet ID is required');
      }

      if (!joyTokenAmount || joyTokenAmount <= 0) {
        throw new UserInputError('Valid JOY token amount is required');
      }

      if (!targetCurrency) {
        throw new UserInputError('Target currency is required');
      }

      if (!exchangeRate || exchangeRate <= 0) {
        throw new UserInputError('Valid exchange rate is required');
      }

      // Validate target currency format (3-letter ISO code)
      if (!/^[A-Z]{3}$/.test(targetCurrency)) {
        throw new UserInputError('Target currency must be a valid 3-letter ISO code (e.g., USD, EUR, NGN)');
      }

      const result = await FinanceService.convertJOYToFiat({
        userId: context.user.id,
        walletId,
        joyTokenAmount,
        targetCurrency,
        exchangeRate,
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'JOY to fiat conversion failed');
      }

      const fiatAmount = joyTokenAmount * exchangeRate;

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Successfully converted ${joyTokenAmount} JOY tokens to ${fiatAmount.toFixed(2)} ${targetCurrency}`,
      };
    },

    /**
     * Convert JOY Token to Other Cryptocurrency
     * Swap JOY tokens to any cryptocurrency via ChangeNOW or similar exchanges
     */
    convertJOYToCrypto: async (_: any, { 
      walletId, 
      joyTokenAmount, 
      targetCrypto, 
      exchangeRate, 
      externalWalletAddress,
      swapProvider,
      metadata 
    }: any, context: any) => {
      await requireOwnership(context, walletId);

      if (!walletId) {
        throw new UserInputError('Wallet ID is required');
      }

      if (!joyTokenAmount || joyTokenAmount <= 0) {
        throw new UserInputError('Valid JOY token amount is required');
      }

      if (!targetCrypto) {
        throw new UserInputError('Target cryptocurrency is required');
      }

      if (!exchangeRate || exchangeRate <= 0) {
        throw new UserInputError('Valid exchange rate is required');
      }

      if (!externalWalletAddress) {
        throw new UserInputError('External wallet address is required');
      }

      // Validate crypto symbol format (uppercase, 2-10 characters)
      if (!/^[A-Z]{2,10}$/.test(targetCrypto)) {
        throw new UserInputError('Target crypto must be a valid symbol (e.g., BTC, ETH, USDT, BNB)');
      }

      // Validate wallet address format (basic check)
      if (externalWalletAddress.length < 10) {
        throw new UserInputError('Invalid wallet address format');
      }

      const result = await FinanceService.convertJOYToCrypto({
        userId: context.user.id,
        walletId,
        joyTokenAmount,
        targetCrypto,
        exchangeRate,
        externalWalletAddress,
        swapProvider: swapProvider || 'ChangeNOW',
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'JOY to crypto conversion failed');
      }

      const cryptoAmount = joyTokenAmount * exchangeRate;

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Successfully initiated swap: ${joyTokenAmount} JOY → ${cryptoAmount} ${targetCrypto}. You will receive the crypto at ${externalWalletAddress}`,
      };
    },
  },

  Query: {
    /**
     * Get CE Points to JOY Token conversion rate
     */
    getCEToJOYRate: async (_: any, __: any, context: any) => {
      requireAuth(context);

      // TODO: Implement dynamic rate calculation based on market conditions
      // For now, return a fixed rate (can be configured by super admin)
      const conversionRate = 100; // 100 CE Points = 1 JOY token

      return {
        conversionRate,
        minCEPoints: 100, // Minimum CE Points required for conversion
        maxCEPoints: 1000000, // Maximum CE Points per transaction
        description: `${conversionRate} CE Points = 1 JOY token`,
      };
    },

    /**
     * Get JOY Token to Fiat exchange rates
     */
    getJOYToFiatRates: async (_: any, { currencies }: any, context: any) => {
      requireAuth(context);

      // TODO: Integrate with real-time exchange rate API
      // For now, return mock rates for supported African and major currencies
      const supportedRates = {
        USD: 1.00,   // US Dollar (base)
        EUR: 0.92,   // Euro
        GBP: 0.79,   // British Pound
        NGN: 1550.00, // Nigerian Naira
        KES: 150.00, // Kenyan Shilling
        ZAR: 18.50,  // South African Rand
        GHS: 15.00,  // Ghanaian Cedi
        UGX: 3700.00, // Ugandan Shilling
        TZS: 2500.00, // Tanzanian Shilling
      };

      // Filter by requested currencies if provided
      const requestedCurrencies = currencies || Object.keys(supportedRates);
      const rates = requestedCurrencies
        .filter((currency: string) => currency in supportedRates)
        .map((currency: string) => ({
          currency,
          rate: supportedRates[currency as keyof typeof supportedRates],
          description: `1 JOY = ${supportedRates[currency as keyof typeof supportedRates]} ${currency}`,
        }));

      return {
        baseToken: 'JOY',
        rates,
        lastUpdated: new Date().toISOString(),
        minJOYAmount: 1, // Minimum JOY tokens for conversion
        maxJOYAmount: 1000000, // Maximum JOY tokens per transaction
      };
    },

    /**
     * Get supported cryptocurrencies for JOY token swaps
     */
    getSupportedCryptos: async (_: any, __: any, context: any) => {
      requireAuth(context);

      // TODO: Integrate with ChangeNOW API to get real-time supported currencies
      // For now, return popular cryptocurrencies
      const supportedCryptos = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          network: 'Bitcoin',
          minAmount: 0.0001,
          estimatedRate: 0.00002, // 1 JOY = 0.00002 BTC (example)
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'Ethereum',
          minAmount: 0.001,
          estimatedRate: 0.0003, // 1 JOY = 0.0003 ETH (example)
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          network: 'ERC20',
          minAmount: 1,
          estimatedRate: 1.0, // 1 JOY = 1 USDT (example)
        },
        {
          symbol: 'BNB',
          name: 'Binance Coin',
          network: 'BSC',
          minAmount: 0.01,
          estimatedRate: 0.002, // 1 JOY = 0.002 BNB (example)
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          network: 'ERC20',
          minAmount: 1,
          estimatedRate: 1.0, // 1 JOY = 1 USDC (example)
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          network: 'Solana',
          minAmount: 0.01,
          estimatedRate: 0.005, // 1 JOY = 0.005 SOL (example)
        },
        {
          symbol: 'MATIC',
          name: 'Polygon',
          network: 'Polygon',
          minAmount: 1,
          estimatedRate: 0.5, // 1 JOY = 0.5 MATIC (example)
        },
        {
          symbol: 'ADA',
          name: 'Cardano',
          network: 'Cardano',
          minAmount: 1,
          estimatedRate: 1.5, // 1 JOY = 1.5 ADA (example)
        },
      ];

      return {
        swapProviders: ['ChangeNOW', 'SimpleSwap', 'StealthEX'],
        recommendedProvider: 'ChangeNOW',
        supportedCryptos,
        note: 'Exchange rates are estimates and may vary based on market conditions',
      };
    },
  },
};
