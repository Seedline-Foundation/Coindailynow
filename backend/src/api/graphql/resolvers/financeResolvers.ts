/**
 * Finance GraphQL Resolvers - Complete Integration
 * Combines all finance operation resolvers
 * 
 * This file exports a unified resolver object that includes:
 * - Deposits (4 operations) ✅
 * - Withdrawals (3 operations) ✅
 * - Transfers (6 operations) ✅
 * - Payments (5 operations) ✅
 * - Refunds (4 operations) ✅
 * - Staking (3 operations) ✅
 * - Conversions (3 operations) ✅
 * - Airdrops (3 operations) ✅
 * - Escrow (3 operations) ✅
 * - Gifts & Donations (3 operations) ✅
 * - Queries (8 operations) ✅
 * 
 * Total: 45 operations exposed via GraphQL
 */

import { financeResolvers as depositsAndWithdrawals } from './financeResolvers.deposits';
import { transferResolvers } from './financeResolvers.transfers';
import { paymentResolvers } from './financeResolvers.payments';
import { refundResolvers } from './financeResolvers.refunds';
import { stakingResolvers } from './financeResolvers.staking';
import { conversionResolvers } from './financeResolvers.conversions';
import { airdropResolvers } from './financeResolvers.airdrops';
import { escrowResolvers } from './financeResolvers.escrow';
import { giftResolvers } from './financeResolvers.gifts';

// Merge all resolvers
export const financeResolvers = {
  Query: {
    ...depositsAndWithdrawals.Query,
    ...conversionResolvers.Query,
  },
  Mutation: {
    ...depositsAndWithdrawals.Mutation,
    ...transferResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...refundResolvers.Mutation,
    ...stakingResolvers.Mutation,
    ...conversionResolvers.Mutation,
    ...airdropResolvers.Mutation,
    ...escrowResolvers.Mutation,
    ...giftResolvers.Mutation,
  },
  Subscription: {
    ...depositsAndWithdrawals.Subscription,
  }
};

// Export individual resolver modules for testing
export { 
  depositsAndWithdrawals, 
  transferResolvers, 
  paymentResolvers,
  refundResolvers,
  stakingResolvers,
  conversionResolvers,
  airdropResolvers,
  escrowResolvers,
  giftResolvers,
};

// Export default
export default financeResolvers;

