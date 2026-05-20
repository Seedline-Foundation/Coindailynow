import { Prisma } from '@prisma/client';
import {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  StakingStatus,
  EscrowStatus,
  AirdropStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../../../lib/prisma';
import { WalletService } from '../../WalletService';
import { PermissionService } from '../../PermissionService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import {
  ALL_FINANCE_OPERATIONS,
  requiresOTP,
  requiresApproval,
  isHighRisk,
} from '../../../constants/financeOperations';
import { generateTransactionHash, logFinanceOperation } from '../financeHelpers';
import type {
  TransactionResult,
  DepositInput,
  WithdrawalInput,
  TransferInput,
  PaymentInput,
  RefundInput,
  StakingInput,
  ConversionInput,
  AirdropInput,
  EscrowInput,
  GiftInput,
  BatchTransferInput,
  CommissionInput,
  AffiliateCommissionInput,
  RevenueTrackingInput,
  ExpenseInput,
  AuditInput,
  ReportInput,
  AuditResult,
  ReportResult,
  SecurityOTPInput,
  Security2FAInput,
  SecurityWalletFreezeInput,
  SecurityWhitelistInput,
  SecurityFraudDetectionInput,
  SecurityTransactionLimitInput,
  SecurityResult,
  TaxCalculationInput,
  TaxReportInput,
  ComplianceKYCInput,
  ComplianceAMLInput,
  TaxComplianceResult,
  WalletCreateInput,
  WalletViewBalanceInput,
  WalletViewHistoryInput,
  WalletSetLimitsInput,
  WalletRecoveryInput,
  WalletOperationResult,
  GatewayStripeInput,
  GatewayPayPalInput,
  GatewayMobileMoneyInput,
  GatewayCryptoInput,
  GatewayBankTransferInput,
  GatewayResult,
  BulkTransferAdvancedInput,
  ScheduledPaymentInput,
  RecurringPaymentInput,
  PaymentLinkInput,
  InvoiceGenerationInput,
  BulkTransferResult,
  ScheduledPaymentResult,
  RecurringPaymentResult,
  PaymentLinkResult,
  InvoiceResult,
  SubscriptionAutoRenewInput,
  SubscriptionUpgradeInput,
  SubscriptionDowngradeInput,
  SubscriptionPauseInput,
  SubscriptionCancelInput,
  SubscriptionResult,
} from '../financeTypes';

export class FinanceStaking {
  // CATEGORY 6: STAKING OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 23. Lock Staking
   */
  static async lockStaking(input: StakingInput): Promise<TransactionResult> {
    try {
      const { userId, walletId, amount, currency, duration, aprRate, metadata } = input;

      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Calculate end date and expected rewards
      const stakedAt = new Date();
      const unlockAt = new Date(stakedAt.getTime() + duration * 24 * 60 * 60 * 1000);
      const expectedRewards = (amount * aprRate * duration) / 365 / 100;

      // Create staking record
      const staking = await prisma.stakingRecord.create({
        data: {
          userId,
          walletId,
          stakedAmount: amount,
          lockPeriodDays: duration,
          rewardRate: aprRate,
          status: StakingStatus.ACTIVE,
          stakedAt,
          unlockAt,
        },
      });

      // Lock the balance
      await WalletService.updateWalletBalance(walletId, { 
        availableBalance: -amount,
        stakedBalance: amount
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          transactionType: TransactionType.STAKE,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.STAKE_LOCK,
          netAmount: amount,
          purpose: 'Staking Lock',
          amount,
          currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: staking.id,
          metadata: JSON.stringify({ ...metadata, stakingId: staking.id, duration, aprRate, expectedRewards }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.STAKE_LOCK,
        userId,
        transactionId: transaction.id,
        metadata: { stakingId: staking.id, duration, aprRate },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Staking lock failed:', error);
      return { success: false, error: 'Staking lock failed' };
    }
  }

  /**
   * 24. Unlock Staking
   */
  static async unlockStaking(stakingId: string): Promise<TransactionResult> {
    try {
      const staking = await prisma.stakingRecord.findUnique({ where: { id: stakingId } });

      if (!staking) {
        return { success: false, error: 'Staking record not found' };
      }

      if (staking.status !== StakingStatus.ACTIVE) {
        return { success: false, error: 'Staking is not active' };
      }

      const now = new Date();
      if (now < staking.unlockAt) {
        return { success: false, error: 'Staking period not yet completed' };
      }

      // Get wallet for currency
      const wallet = await prisma.wallet.findUnique({ where: { id: staking.walletId } });

      // Unlock the balance
      await WalletService.updateWalletBalance(staking.walletId, { 
        stakedBalance: -staking.stakedAmount,
        availableBalance: staking.stakedAmount
      });

      // Update staking status
      await prisma.stakingRecord.update({
        where: { id: stakingId },
        data: { status: StakingStatus.COMPLETED },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: staking.walletId,
          transactionType: TransactionType.UNSTAKE,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.STAKE_UNLOCK,
          netAmount: staking.stakedAmount,
          purpose: 'Staking Unlock',
          amount: staking.stakedAmount,
          currency: wallet?.currency || 'USD',
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: stakingId,
          metadata: JSON.stringify({ stakingId, unlockedAmount: staking.stakedAmount }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.STAKE_UNLOCK,
        userId: staking.userId,
        transactionId: transaction.id,
        metadata: { stakingId, unlockedAmount: staking.stakedAmount },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Staking unlock failed:', error);
      return { success: false, error: 'Staking unlock failed' };
    }
  }

  /**
   * 25. Claim Staking Rewards
   */
  static async claimStakingRewards(stakingId: string): Promise<TransactionResult> {
    try {
      const staking = await prisma.stakingRecord.findUnique({ where: { id: stakingId } });

      if (!staking) {
        return { success: false, error: 'Staking record not found' };
      }

      if (staking.status !== StakingStatus.ACTIVE && staking.status !== StakingStatus.COMPLETED) {
        return { success: false, error: 'Cannot claim rewards for this staking' };
      }

      // Calculate rewards earned
      const now = new Date();
      const stakingDuration = Math.min(
        (now.getTime() - staking.stakedAt.getTime()) / (1000 * 60 * 60 * 24),
        (staking.unlockAt.getTime() - staking.stakedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const totalRewards = (staking.stakedAmount * staking.rewardRate * stakingDuration) / 365 / 100;
      const unclaimedRewards = totalRewards - staking.totalRewardsClaimed;

      if (unclaimedRewards <= 0) {
        return { success: false, error: 'No rewards available to claim' };
      }

      // Get wallet for currency
      const wallet = await prisma.wallet.findUnique({ where: { id: staking.walletId } });

      // Add rewards to wallet
      await WalletService.updateWalletBalance(staking.walletId, { 
        availableBalance: unclaimedRewards
      });

      // Update staking record
      await prisma.stakingRecord.update({
        where: { id: stakingId },
        data: { totalRewardsClaimed: totalRewards },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          toWalletId: staking.walletId,
          transactionType: TransactionType.REWARD,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.STAKE_CLAIM_REWARDS,
          netAmount: unclaimedRewards,
          purpose: 'Staking Rewards',
          amount: unclaimedRewards,
          currency: wallet?.currency || 'USD',
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: stakingId,
          metadata: JSON.stringify({ stakingId, rewardsClaimed: unclaimedRewards, totalRewards }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.STAKE_CLAIM_REWARDS,
        userId: staking.userId,
        transactionId: transaction.id,
        metadata: { stakingId, rewardsClaimed: unclaimedRewards },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Claim staking rewards failed:', error);
      return { success: false, error: 'Claim staking rewards failed' };
    }
  }

}
