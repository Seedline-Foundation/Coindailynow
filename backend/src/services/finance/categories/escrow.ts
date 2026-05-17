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

export class FinanceEscrow {
  // CATEGORY 9: ESCROW OPERATIONS (3/3 operations) ✅
  // ==========================================================================

  /**
   * 32. Create Escrow Transaction
   * Creates an escrow transaction where funds are held until conditions are met
   */
  static async createEscrow(input: EscrowInput): Promise<TransactionResult> {
    try {
      const { 
        buyerId, 
        sellerId, 
        amount, 
        currency, 
        description, 
        releaseConditions,
        metadata 
      } = input;

      // Get buyer's wallet
      const buyerWallet = await prisma.wallet.findFirst({
        where: { userId: buyerId, walletType: WalletType.USER_WALLET },
      });

      if (!buyerWallet) {
        return { success: false, error: 'Buyer wallet not found' };
      }

      // Check if buyer has sufficient balance
      if (buyerWallet.availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Required: ${amount}, Available: ${buyerWallet.availableBalance}` 
        };
      }

      // Get or create escrow wallet
      let escrowWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.ESCROW_WALLET },
      });

      if (!escrowWallet) {
        escrowWallet = await prisma.wallet.create({
          data: {
            walletType: WalletType.ESCROW_WALLET,
            walletAddress: `ESCROW_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            currency,
            availableBalance: 0,
            lockedBalance: 0,
            status: WalletStatus.ACTIVE,
          },
        });
      }

      // Lock funds from buyer's wallet
      await WalletService.updateWalletBalance(buyerWallet.id, {
        availableBalance: -amount,
        lockedBalance: amount,
      });

      // Create escrow transaction record
      const escrow = await prisma.escrowTransaction.create({
        data: {
          buyerId,
          sellerId,
          escrowWalletId: escrowWallet.id,
          amount,
          escrowAmount: amount,
          currency,
          description,
          releaseConditions,
          conditions: JSON.stringify(releaseConditions),
          status: 'PENDING',
          metadata: metadata || {},
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: buyerWallet.id,
          toWalletId: escrowWallet.id,
          transactionType: TransactionType.ESCROW,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.ESCROW_CREATE,
          netAmount: amount,
          purpose: `Escrow: ${description}`,
          amount,
          currency,
          status: TransactionStatus.PENDING,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: escrow.id,
          metadata: JSON.stringify({ 
            ...metadata, 
            escrowId: escrow.id,
            buyerId,
            sellerId,
            releaseConditions 
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.ESCROW_CREATE,
        userId: buyerId,
        transactionId: transaction.id,
        metadata: { escrowId: escrow.id, amount, currency, sellerId },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Create escrow failed:', error);
      return { success: false, error: 'Create escrow failed' };
    }
  }

  /**
   * 33. Release Escrow Funds
   * Releases funds from escrow to seller when conditions are met
   */
  static async releaseEscrow(input: {
    escrowId: string;
    releasedByUserId: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { escrowId, releasedByUserId, metadata } = input;

      // Get escrow transaction
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        return { success: false, error: 'Escrow transaction not found' };
      }

      if (escrow.status !== 'PENDING' && escrow.status !== 'LOCKED') {
        return { success: false, error: `Escrow is ${escrow.status}, cannot release` };
      }

      // Get buyer's wallet to unlock funds
      const buyerWallet = await prisma.wallet.findFirst({
        where: { userId: escrow.buyerId, walletType: WalletType.USER_WALLET },
      });

      if (!buyerWallet) {
        return { success: false, error: 'Buyer wallet not found' };
      }

      // Get seller's wallet
      const sellerWallet = await prisma.wallet.findFirst({
        where: { userId: escrow.sellerId, walletType: WalletType.USER_WALLET },
      });

      if (!sellerWallet) {
        return { success: false, error: 'Seller wallet not found' };
      }

      // Unlock funds from buyer's wallet and transfer to seller
      await WalletService.updateWalletBalance(buyerWallet.id, {
        lockedBalance: -escrow.escrowAmount,
      });

      await WalletService.updateWalletBalance(sellerWallet.id, {
        availableBalance: escrow.escrowAmount,
      });

      // Update escrow status
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: { 
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: buyerWallet.id,
          toWalletId: sellerWallet.id,
          transactionType: TransactionType.ESCROW,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.ESCROW_RELEASE,
          netAmount: escrow.escrowAmount,
          purpose: `Escrow Release: ${escrow.description}`,
          amount: escrow.escrowAmount,
          currency: escrow.currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: escrowId,
          metadata: JSON.stringify({ 
            ...metadata, 
            escrowId,
            buyerId: escrow.buyerId,
            sellerId: escrow.sellerId,
            releasedBy: releasedByUserId
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.ESCROW_RELEASE,
        userId: releasedByUserId,
        transactionId: transaction.id,
        metadata: { escrowId, amount: escrow.escrowAmount, currency: escrow.currency },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Release escrow failed:', error);
      return { success: false, error: 'Release escrow failed' };
    }
  }

  /**
   * 34. Handle Escrow Dispute
   * Handles disputes in escrow transactions with mediator involvement
   */
  static async handleEscrowDispute(input: {
    escrowId: string;
    raisedByUserId: string;
    disputeReason: string;
    disputeEvidence?: string;
    resolution?: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER' | 'PARTIAL_REFUND';
    refundPercentage?: number;
    mediatorId?: string;
    metadata?: Record<string, any>;
  }): Promise<TransactionResult> {
    try {
      const { 
        escrowId, 
        raisedByUserId, 
        disputeReason, 
        disputeEvidence,
        resolution,
        refundPercentage = 0,
        mediatorId,
        metadata 
      } = input;

      // Get escrow transaction
      const escrow = await prisma.escrowTransaction.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        return { success: false, error: 'Escrow transaction not found' };
      }

      // Verify the user raising dispute is buyer or seller
      if (raisedByUserId !== escrow.buyerId && raisedByUserId !== escrow.sellerId) {
        return { success: false, error: 'Only buyer or seller can raise a dispute' };
      }

      // If just raising a dispute (no resolution yet)
      if (!resolution) {
        await prisma.escrowTransaction.update({
          where: { id: escrowId },
          data: {
            disputeRaised: true,
            disputeRaisedBy: raisedByUserId,
            disputeRaisedAt: new Date(),
            disputeReason,
            disputeEvidence: disputeEvidence || null,
            mediatorId: mediatorId || null,
            status: 'DISPUTED',
          },
        });

        // Create notification transaction
        const transaction = await prisma.walletTransaction.create({
          data: {
            fromWalletId: escrow.escrowWalletId || '',
            transactionType: TransactionType.ESCROW,
            transactionHash: generateTransactionHash(),
            operationType: ALL_FINANCE_OPERATIONS.ESCROW_DISPUTE,
            netAmount: 0,
            purpose: `Escrow Dispute Raised: ${escrow.description}`,
            amount: 0,
            currency: escrow.currency,
            status: TransactionStatus.PENDING,
            paymentMethod: PaymentMethod.WALLET,
            externalReference: escrowId,
            metadata: JSON.stringify({ 
              ...metadata, 
              escrowId,
              disputeReason,
              raisedBy: raisedByUserId,
              action: 'DISPUTE_RAISED'
            }),
          },
        });

        await logFinanceOperation({
          operationKey: ALL_FINANCE_OPERATIONS.ESCROW_DISPUTE,
          userId: raisedByUserId,
          transactionId: transaction.id,
          metadata: { escrowId, action: 'DISPUTE_RAISED' },
        });

        return { success: true, transactionId: transaction.id };
      }

      // Handle dispute resolution
      const buyerWallet = await prisma.wallet.findFirst({
        where: { userId: escrow.buyerId, walletType: WalletType.USER_WALLET },
      });

      const sellerWallet = await prisma.wallet.findFirst({
        where: { userId: escrow.sellerId, walletType: WalletType.USER_WALLET },
      });

      if (!buyerWallet || !sellerWallet) {
        return { success: false, error: 'Buyer or seller wallet not found' };
      }

      let buyerAmount = 0;
      let sellerAmount = 0;
      let resolutionStatus: EscrowStatus = 'RESOLVED';

      switch (resolution) {
        case 'RELEASE_TO_SELLER':
          sellerAmount = escrow.escrowAmount;
          break;
        case 'REFUND_TO_BUYER':
          buyerAmount = escrow.escrowAmount;
          break;
        case 'PARTIAL_REFUND':
          buyerAmount = (escrow.escrowAmount * refundPercentage) / 100;
          sellerAmount = escrow.escrowAmount - buyerAmount;
          break;
      }

      // Unlock funds from buyer's locked balance
      await WalletService.updateWalletBalance(buyerWallet.id, {
        lockedBalance: -escrow.escrowAmount,
        availableBalance: buyerAmount,
      });

      // Transfer to seller if applicable
      if (sellerAmount > 0) {
        await WalletService.updateWalletBalance(sellerWallet.id, {
          availableBalance: sellerAmount,
        });
      }

      // Update escrow with resolution
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: {
          status: resolutionStatus,
          disputeResolution: resolution,
          disputeResolvedAt: new Date(),
          resolvedAt: new Date(),
        },
      });

      // Create transaction record
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: buyerWallet.id,
          toWalletId: sellerWallet.id,
          transactionType: TransactionType.ESCROW,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.ESCROW_DISPUTE,
          netAmount: escrow.escrowAmount,
          purpose: `Escrow Dispute Resolved: ${resolution}`,
          amount: escrow.escrowAmount,
          currency: escrow.currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: PaymentMethod.WALLET,
          externalReference: escrowId,
          metadata: JSON.stringify({ 
            ...metadata, 
            escrowId,
            resolution,
            buyerAmount,
            sellerAmount,
            resolvedBy: mediatorId || raisedByUserId
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.ESCROW_DISPUTE,
        userId: mediatorId || raisedByUserId,
        transactionId: transaction.id,
        metadata: { escrowId, resolution, buyerAmount, sellerAmount },
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      console.error('Handle escrow dispute failed:', error);
      return { success: false, error: 'Handle escrow dispute failed' };
    }
  }

}
