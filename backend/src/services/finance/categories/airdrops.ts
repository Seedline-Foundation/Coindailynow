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

export class FinanceAirdrops {
  // CATEGORY 8: AIRDROP OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 29. Create Airdrop Campaign
   * Super Admin creates an airdrop campaign with eligibility criteria
   */
  static async createAirdropCampaign(input: AirdropInput): Promise<TransactionResult> {
    try {
      const { 
        campaignName, 
        totalAmount, 
        currency, 
        eligibilityCriteria, 
        distributionDate, 
        createdByUserId,
        metadata 
      } = input;

      if (!campaignName || campaignName.trim().length === 0) {
        return { success: false, error: 'Campaign name is required' };
      }

      if (totalAmount <= 0) {
        return { success: false, error: 'Total airdrop amount must be positive' };
      }

      // Verify creator is Super Admin
      const creator = await prisma.user.findUnique({ where: { id: createdByUserId } });
      if (!creator || creator.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Only Super Admins can create airdrop campaigns' };
      }

      // Get or create airdrop wallet
      let airdropWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.AIRDROP_WALLET },
      });

      if (!airdropWallet) {
        // Create airdrop wallet if it doesn't exist
        airdropWallet = await prisma.wallet.create({
          data: {
            userId: createdByUserId,
            walletType: WalletType.AIRDROP_WALLET,
            walletAddress: `AIRDROP_WALLET_${Date.now()}`,
            currency,
            availableBalance: 0,
            totalBalance: 0,
            stakedBalance: 0,
            lockedBalance: 0,
            cePoints: 0,
          },
        });
      }

      // Check if airdrop wallet has sufficient funds
      if (airdropWallet.availableBalance < totalAmount) {
        return { 
          success: false, 
          error: `Insufficient funds in airdrop wallet. Required: ${totalAmount}, Available: ${airdropWallet.availableBalance}` 
        };
      }

      // Lock the airdrop amount
      await WalletService.updateWalletBalance(airdropWallet.id, {
        availableBalance: -totalAmount,
        lockedBalance: totalAmount,
      });

      // Create airdrop campaign record
      const campaign = await prisma.airdropCampaign.create({
        data: {
          campaignName,
          name: campaignName,
          totalAmount,
          totalSupply: totalAmount,
          distributedAmount: 0,
          remainingAmount: totalAmount,
          currency,
          eligibilityCriteria,
          distributionDate,
          claimStartDate: distributionDate,
          claimEndDate: new Date(distributionDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after distribution
          status: 'PENDING',
          createdByUserId,
          createdBy: createdByUserId,
          metadata: metadata || {},
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: airdropWallet.id,
          transactionType: TransactionType.AIRDROP,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.AIRDROP_CREATE,
          netAmount: totalAmount,
          purpose: `Airdrop Campaign: ${campaignName}`,
          amount: totalAmount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: campaign.id,
          metadata: JSON.stringify({ 
            ...metadata, 
            campaignId: campaign.id,
            campaignName,
            eligibilityCriteria,
            distributionDate 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.AIRDROP_CREATE,
        userId: createdByUserId,
        transactionId: transaction.id,
        metadata: { campaignId: campaign.id, campaignName, totalAmount, currency },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Create airdrop campaign failed:', error);
      return { success: false, error: 'Create airdrop campaign failed' };
    }
  }

  /**
   * 30. Claim Airdrop
   * Users claim their allocated airdrop tokens
   */
  static async claimAirdrop(input: {
    userId: string;
    campaignId: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { userId, campaignId, metadata } = input;

      // Get campaign details
      const campaign = await prisma.airdropCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return { success: false, error: 'Airdrop campaign not found' };
      }

      if (campaign.status !== 'ACTIVE') {
        return { success: false, error: 'Airdrop campaign is not active' };
      }

      // Check if distribution date has passed
      if (new Date() < campaign.distributionDate) {
        return { success: false, error: 'Airdrop distribution has not started yet' };
      }

      // Check if user has already claimed
      const existingClaim = await prisma.airdropClaim.findFirst({
        where: { campaignId, userId },
      });

      if (existingClaim) {
        return { success: false, error: 'You have already claimed this airdrop' };
      }

      // TODO: Check eligibility criteria from campaign.eligibilityCriteria
      // For now, assume all users are eligible with equal distribution

      // Calculate user's airdrop amount (simplified - equal distribution)
      // In production, this should be based on eligibility criteria
      const eligibleUserCount = await prisma.user.count();
      const userAmount = campaign.totalAmount / eligibleUserCount;

      if (campaign.remainingAmount < userAmount) {
        return { success: false, error: 'Insufficient remaining airdrop funds' };
      }

      // Get user's wallet
      const userWallet = await prisma.wallet.findFirst({
        where: { userId, walletType: WalletType.USER_WALLET },
      });

      if (!userWallet) {
        return { success: false, error: 'User wallet not found' };
      }

      // Get airdrop wallet
      const airdropWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.AIRDROP_WALLET },
      });

      if (!airdropWallet) {
        return { success: false, error: 'Airdrop wallet not found' };
      }

      // Transfer from airdrop wallet to user wallet
      await WalletService.updateWalletBalance(airdropWallet.id, {
        lockedBalance: -userAmount,
      });

      await WalletService.updateWalletBalance(userWallet.id, {
        availableBalance: userAmount,
      });

      // Update campaign remaining amount and distributed amount
      await prisma.airdropCampaign.update({
        where: { id: campaignId },
        data: { 
          remainingAmount: campaign.remainingAmount - userAmount,
          distributedAmount: campaign.distributedAmount + userAmount,
        },
      });

      // Create claim record
      await prisma.airdropClaim.create({
        data: {
          campaignId,
          userId,
          walletId: userWallet.id,
          amount: userAmount,
          claimAmount: userAmount,
          status: 'CLAIMED',
          claimedAt: new Date(),
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: airdropWallet.id,
          toWalletId: userWallet.id,
          transactionType: TransactionType.AIRDROP,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.AIRDROP_CLAIM,
          netAmount: userAmount,
          purpose: `Airdrop Claim: ${campaign.name}`,
          amount: userAmount,
          currency: campaign.currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: campaignId,
          metadata: JSON.stringify({ 
            ...metadata, 
            campaignId,
            campaignName: campaign.name,
            claimedAmount: userAmount 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.AIRDROP_CLAIM,
        userId,
        transactionId: transaction.id,
        metadata: { campaignId, campaignName: campaign.name, amount: userAmount },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Claim airdrop failed:', error);
      return { success: false, error: 'Claim airdrop failed' };
    }
  }

  /**
   * 31. Distribute Airdrop (Batch Distribution)
   * Super Admin distributes airdrop to multiple users at once
   */
  static async distributeAirdrop(input: {
    campaignId: string;
    distributions: Array<{ userId: string; amount: number }>;
    distributedByUserId: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { campaignId, distributions, distributedByUserId, metadata } = input;

      if (!distributions || distributions.length === 0) {
        return { success: false, error: 'No distribution recipients specified' };
      }

      // Verify distributor is Super Admin
      const distributor = await prisma.user.findUnique({ where: { id: distributedByUserId } });
      if (!distributor || distributor.role !== 'SUPER_ADMIN') {
        return { success: false, error: 'Only Super Admins can distribute airdrops' };
      }

      // Get campaign details
      const campaign = await prisma.airdropCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return { success: false, error: 'Airdrop campaign not found' };
      }

      if (campaign.status !== 'ACTIVE') {
        return { success: false, error: 'Airdrop campaign is not active' };
      }

      // Calculate total distribution amount
      const totalDistribution = distributions.reduce((sum, d) => sum + d.amount, 0);

      if (campaign.remainingAmount < totalDistribution) {
        return { 
          success: false, 
          error: `Insufficient remaining funds. Required: ${totalDistribution}, Available: ${campaign.remainingAmount}` 
        };
      }

      // Get airdrop wallet
      const airdropWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.AIRDROP_WALLET },
      });

      if (!airdropWallet) {
        return { success: false, error: 'Airdrop wallet not found' };
      }

      // Process each distribution
      const transactionIds: string[] = [];
      let successfulDistributions = 0;

      for (const dist of distributions) {
        try {
          // Check if user already claimed
          const existingClaim = await prisma.airdropClaim.findFirst({
            where: { campaignId, userId: dist.userId },
          });

          if (existingClaim) {
            console.warn(`User ${dist.userId} already claimed this airdrop`);
            continue;
          }

          // Get user's wallet
          const userWallet = await prisma.wallet.findFirst({
            where: { userId: dist.userId, walletType: WalletType.USER_WALLET },
          });

          if (!userWallet) {
            console.warn(`Wallet not found for user ${dist.userId}`);
            continue;
          }

          // Transfer funds
          await WalletService.updateWalletBalance(airdropWallet.id, {
            lockedBalance: -dist.amount,
          });

          await WalletService.updateWalletBalance(userWallet.id, {
            availableBalance: dist.amount,
          });

          // Create claim record
          await prisma.airdropClaim.create({
            data: {
              campaignId,
              userId: dist.userId,
              walletId: userWallet.id,
              amount: dist.amount,
              claimAmount: dist.amount,
              status: 'CLAIMED',
              claimedAt: new Date(),
            },
          });

          // Create transaction record
          const transaction = await prisma.walletTransaction.create({
            data: {
              fromWalletId: airdropWallet.id,
              toWalletId: userWallet.id,
              transactionType: TransactionType.AIRDROP,
              transactionHash: generateTransactionHash(),
              operationType: ALL_FINANCE_OPERATIONS.AIRDROP_DISTRIBUTE,
              netAmount: dist.amount,
              purpose: `Batch Airdrop: ${campaign.name}`,
              amount: dist.amount,
              currency: campaign.currency,
              status: TransactionStatus.COMPLETED,
              paymentMethod: PaymentMethod.WALLET,
              externalReference: campaignId,
              metadata: JSON.stringify({ 
                campaignId,
                campaignName: campaign.name,
                distributedBy: distributedByUserId,
                batchDistribution: true 
              }),
            },
          });

          transactionIds.push(transaction.id);
          successfulDistributions++;
        } catch (error) {
          console.error(`Failed to distribute to user ${dist.userId}:`, error);
          // Continue with other distributions
        }
      }

      // Update campaign remaining amount and distributed amount
      await prisma.airdropCampaign.update({
        where: { id: campaignId },
        data: { 
          remainingAmount: campaign.remainingAmount - totalDistribution,
          distributedAmount: campaign.distributedAmount + totalDistribution,
        },
      });

      // Create summary transaction
      const summaryTransaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: airdropWallet.id,
          transactionType: TransactionType.AIRDROP,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.AIRDROP_DISTRIBUTE,
          netAmount: totalDistribution,
          purpose: `Batch Airdrop Distribution: ${campaign.name}`,
          amount: totalDistribution,
          currency: campaign.currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: campaignId,
          metadata: JSON.stringify({ 
            ...metadata,
            campaignId,
            campaignName: campaign.name,
            totalRecipients: distributions.length,
            successfulDistributions,
            totalAmount: totalDistribution,
            individualTransactions: transactionIds 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.AIRDROP_DISTRIBUTE,
        userId: distributedByUserId,
        transactionId: summaryTransaction.id,
        metadata: { 
          campaignId, 
          campaignName: campaign.name, 
          totalRecipients: distributions.length,
          successfulDistributions,
          totalAmount: totalDistribution 
        },
      });

      return { success: true, transactionId: summaryTransaction.id };
    } catch (error) {
      console.error('Batch airdrop distribution failed:', error);
      return { success: false, error: 'Batch airdrop distribution failed' };
    }
  }

}
