/**
 * Finance Resolvers - Staking (3/3 operations)
 * GraphQL resolvers for staking-related finance operations
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

export const stakingResolvers = {
  Mutation: {
    /**
     * Lock Staking
     * Lock tokens for staking with specified duration and APR
     */
    lockStaking: async (_: any, { walletId, amount, currency, duration, aprRate, metadata }: any, context: any) => {
      await requireOwnership(context, walletId);

      if (!walletId) {
        throw new UserInputError('Wallet ID is required');
      }

      if (!amount || amount <= 0) {
        throw new UserInputError('Valid staking amount is required');
      }

      if (!currency) {
        throw new UserInputError('Currency is required');
      }

      if (!duration || duration <= 0) {
        throw new UserInputError('Valid staking duration (in days) is required');
      }

      if (!aprRate || aprRate <= 0) {
        throw new UserInputError('Valid APR rate is required');
      }

      const result = await FinanceService.lockStaking({
        userId: context.user.id,
        walletId,
        amount,
        currency,
        duration,
        aprRate,
        metadata,
      });

      if (!result.success) {
        throw new UserInputError(result.error || 'Staking lock failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: `Successfully locked ${amount} ${currency} for ${duration} days at ${aprRate}% APR`,
      };
    },

    /**
     * Unlock Staking
     * Unlock staked tokens after lock period ends
     */
    unlockStaking: async (_: any, { stakingId }: any, context: any) => {
      const user = requireAuth(context);

      if (!stakingId) {
        throw new UserInputError('Staking ID is required');
      }

      // Verify staking ownership
      const { prisma } = context;
      const staking = await prisma.stakingRecord.findUnique({
        where: { id: stakingId },
        select: { userId: true, walletId: true },
      });

      if (!staking) {
        throw new UserInputError('Staking record not found');
      }

      if (staking.userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthenticationError('You do not have access to this staking record');
      }

      const result = await FinanceService.unlockStaking(stakingId);

      if (!result.success) {
        throw new UserInputError(result.error || 'Staking unlock failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: 'Staking unlocked successfully',
      };
    },

    /**
     * Claim Staking Rewards
     * Claim accumulated staking rewards
     */
    claimStakingRewards: async (_: any, { stakingId }: any, context: any) => {
      const user = requireAuth(context);

      if (!stakingId) {
        throw new UserInputError('Staking ID is required');
      }

      // Verify staking ownership
      const { prisma } = context;
      const staking = await prisma.stakingRecord.findUnique({
        where: { id: stakingId },
        select: { userId: true, walletId: true },
      });

      if (!staking) {
        throw new UserInputError('Staking record not found');
      }

      if (staking.userId !== user.id && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new AuthenticationError('You do not have access to this staking record');
      }

      const result = await FinanceService.claimStakingRewards(stakingId);

      if (!result.success) {
        throw new UserInputError(result.error || 'Claim staking rewards failed');
      }

      return {
        success: true,
        transactionId: result.transactionId,
        message: 'Staking rewards claimed successfully',
      };
    },
  },
};
