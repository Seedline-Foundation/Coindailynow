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
     * Rate is configurable via CE_TO_JY_CONVERSION_RATE env var
     */
    getCEToJOYRate: async (_: any, __: any, context: any) => {
      requireAuth(context);

      const rateFromEnv = parseFloat(process.env.CE_TO_JY_CONVERSION_RATE || '0.01');
      const conversionRate = rateFromEnv > 0 ? Math.round(1 / rateFromEnv) : 100;

      return {
        conversionRate,
        minCEPoints: 100,
        maxCEPoints: 1000000,
        description: `${conversionRate} CE Points = 1 JOY token`,
      };
    },

    /**
     * Get JOY Token to Fiat exchange rates
     * Fetches live rates from YellowCard when API key is configured
     */
    getJOYToFiatRates: async (_: any, { currencies }: any, context: any) => {
      requireAuth(context);

      const fallbackRates: Record<string, number> = {
        USD: 1.00,
        EUR: 0.92,
        GBP: 0.79,
        NGN: 1550.00,
        KES: 150.00,
        ZAR: 18.50,
        GHS: 15.00,
        UGX: 3700.00,
        TZS: 2500.00,
      };

      let liveRates: Record<string, number> | null = null;

      const ycApiKey = process.env.YELLOWCARD_API_KEY;
      const ycSecretKey = process.env.YELLOWCARD_SECRET_KEY;
      const ycBaseUrl = process.env.YELLOWCARD_API_URL || 'https://sandbox.api.yellowcard.io';

      if (ycApiKey && ycSecretKey) {
        try {
          const axios = (await import('axios')).default;
          const response = await axios.get(`${ycBaseUrl}/rates`, {
            headers: {
              'YC-API-KEY': ycApiKey,
              'YC-SECRET-KEY': ycSecretKey,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          });

          const data = response.data;
          if (data && (Array.isArray(data) || typeof data === 'object')) {
            liveRates = {};
            const rateList = Array.isArray(data) ? data : (data.rates || [data]);
            for (const entry of rateList) {
              const code = (entry.currency || entry.code || '').toUpperCase();
              const rate = entry.rate ?? entry.buy ?? entry.sell;
              if (code && typeof rate === 'number') {
                liveRates[code] = rate;
              }
            }
            if (Object.keys(liveRates).length === 0) liveRates = null;
          }
        } catch (err: any) {
          console.error('YellowCard rates fetch failed:', err.message);
        }
      }

      const activeRates = liveRates || fallbackRates;
      const requestedCurrencies = currencies || Object.keys(activeRates);
      const rates = requestedCurrencies
        .filter((currency: string) => currency in activeRates)
        .map((currency: string) => ({
          currency,
          rate: activeRates[currency],
          description: `1 JOY = ${activeRates[currency]} ${currency}`,
        }));

      return {
        baseToken: 'JOY',
        rates,
        lastUpdated: new Date().toISOString(),
        minJOYAmount: 1,
        maxJOYAmount: 1000000,
        source: liveRates ? 'YellowCard' : 'fallback',
      };
    },

    /**
     * Get supported cryptocurrencies for JOY token swaps
     * Fetches live data from ChangeNOW when API key is configured
     */
    getSupportedCryptos: async (_: any, __: any, context: any) => {
      requireAuth(context);

      const fallbackCryptos = [
        { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', minAmount: 0.0001, estimatedRate: 0.00002 },
        { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', minAmount: 0.001, estimatedRate: 0.0003 },
        { symbol: 'USDT', name: 'Tether', network: 'ERC20', minAmount: 1, estimatedRate: 1.0 },
        { symbol: 'BNB', name: 'Binance Coin', network: 'BSC', minAmount: 0.01, estimatedRate: 0.002 },
        { symbol: 'USDC', name: 'USD Coin', network: 'ERC20', minAmount: 1, estimatedRate: 1.0 },
        { symbol: 'SOL', name: 'Solana', network: 'Solana', minAmount: 0.01, estimatedRate: 0.005 },
        { symbol: 'MATIC', name: 'Polygon', network: 'Polygon', minAmount: 1, estimatedRate: 0.5 },
        { symbol: 'ADA', name: 'Cardano', network: 'Cardano', minAmount: 1, estimatedRate: 1.5 },
      ];

      const cnApiKey = process.env.CHANGENOW_API_KEY;
      const cnBaseUrl = process.env.CHANGENOW_API_URL || 'https://api.changenow.io/v2';

      if (cnApiKey) {
        try {
          const axios = (await import('axios')).default;
          const response = await axios.get(`${cnBaseUrl}/exchange/currencies`, {
            headers: { 'x-changenow-api-key': cnApiKey },
            params: { active: true },
            timeout: 10000,
          });

          const currencies = response.data;
          if (Array.isArray(currencies) && currencies.length > 0) {
            const targetSymbols = new Set(['btc', 'eth', 'usdt', 'bnb', 'usdc', 'sol', 'matic', 'ada', 'xrp', 'doge', 'trx']);
            const liveCryptos = currencies
              .filter((c: any) => targetSymbols.has((c.ticker || '').toLowerCase()))
              .map((c: any) => ({
                symbol: (c.ticker || '').toUpperCase(),
                name: c.name || c.ticker,
                network: c.network || c.ticker,
                minAmount: c.minAmount ?? 0.001,
                estimatedRate: null,
              }));

            if (liveCryptos.length > 0) {
              return {
                swapProviders: ['ChangeNOW'],
                recommendedProvider: 'ChangeNOW',
                supportedCryptos: liveCryptos,
                note: 'Live data from ChangeNOW. Exchange rates vary based on market conditions.',
              };
            }
          }
        } catch (err: any) {
          console.error('ChangeNOW currencies fetch failed:', err.message);
        }
      }

      return {
        swapProviders: ['ChangeNOW'],
        recommendedProvider: 'ChangeNOW',
        supportedCryptos: fallbackCryptos,
        note: 'Exchange rates are estimates and may vary based on market conditions',
      };
    },
  },
};
