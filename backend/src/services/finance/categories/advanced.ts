import { FinanceTransfers } from './transfers';
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

export class FinanceAdvanced {
  static async bulkTransferAdvanced(input: BulkTransferAdvancedInput): Promise<BulkTransferResult> {
    try {
      const { fromUserId, fromWalletId, transfers, scheduledDate, priority, metadata } = input;

      // Validate source wallet
      const fromWallet = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
      if (!fromWallet || fromWallet.userId !== fromUserId) {
        return { success: false, error: 'Invalid source wallet' };
      }

      // Calculate total amount
      const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0);

      // Check sufficient balance
      if (fromWallet.availableBalance < totalAmount) {
        return { 
          success: false, 
          error: 'Insufficient balance',
          requiredAmount: totalAmount,
          availableAmount: fromWallet.availableBalance
        };
      }

      // If scheduled for future, create pending batch
      if (scheduledDate && scheduledDate > new Date()) {
        // Lock the funds
        await WalletService.lockBalance(fromWalletId, totalAmount);

        // Create scheduled batch record
        const batchId = `BATCH_SCH_${Date.now()}`;
        
        await logFinanceOperation({
          operationKey: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
          userId: fromUserId,
          transactionId: batchId,
          metadata: { 
            fromWalletId, 
            transferCount: transfers.length, 
            totalAmount,
            scheduledDate,
            priority,
            status: 'SCHEDULED',
            ...metadata 
          },
        });

        return {
          success: true,
          batchId,
          totalAmount,
          transferCount: transfers.length,
          status: 'SCHEDULED',
          scheduledDate,
          message: `Bulk transfer scheduled for ${scheduledDate.toISOString()}`,
        };
      }

      // Process immediately
      const results: any[] = [];
      const batchId = `BATCH_${Date.now()}`;

      for (const transfer of transfers) {
        try {
          const result = await FinanceTransfers.transferUserToUser({
            fromUserId,
            fromWalletId,
            toUserId: transfer.toUserId,
            toWalletId: transfer.toWalletId,
            amount: transfer.amount,
            currency: transfer.currency || 'JY', // JOY Token (default platform currency)
            description: transfer.description || `Bulk transfer ${batchId}`,
            metadata: { ...transfer.metadata, batchId, priority },
          });

          results.push({
            toUserId: transfer.toUserId,
            toWalletId: transfer.toWalletId,
            amount: transfer.amount,
            success: result.success,
            transactionId: result.transactionId,
            error: result.error,
          });
        } catch (error) {
          results.push({
            toUserId: transfer.toUserId,
            toWalletId: transfer.toWalletId,
            amount: transfer.amount,
            success: false,
            error: 'Transfer processing failed',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.BULK_TRANSFER,
        userId: fromUserId,
        transactionId: batchId,
        metadata: { 
          fromWalletId, 
          transferCount: transfers.length,
          successCount,
          failureCount,
          totalAmount,
          priority,
          ...metadata 
        },
      });

      return {
        success: true,
        batchId,
        totalAmount,
        transferCount: transfers.length,
        successCount,
        failureCount,
        results,
        status: 'COMPLETED',
      };
    } catch (error) {
      console.error('Bulk transfer advanced failed:', error);
      return { success: false, error: 'Bulk transfer failed' };
    }
  }

  /**
   * 94. Scheduled Payment - Schedule future payments
   */
  static async scheduledPayment(input: ScheduledPaymentInput): Promise<ScheduledPaymentResult> {
    try {
      const { userId, walletId, amount, currency, recipientWalletId, scheduledDate, paymentType, description, metadata } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Validate scheduled date is in future
      if (scheduledDate <= new Date()) {
        return { success: false, error: 'Scheduled date must be in the future' };
      }

      // Check sufficient balance
      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Lock funds for scheduled payment
      await WalletService.lockBalance(walletId, amount);

      // Create scheduled payment record
      const scheduledPaymentId = `SCH_PAY_${Date.now()}`;

      // Store in database (you would need a ScheduledPayment model)
      // For now, we'll create a pending transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          fromWalletId: walletId,
          toWalletId: recipientWalletId,
          transactionType: TransactionType.TRANSFER,
          transactionHash: generateTransactionHash(),
          operationType: ALL_FINANCE_OPERATIONS.SCHEDULED_PAYMENT,
          amount,
          netAmount: amount,
          currency: currency || 'USD',
          status: TransactionStatus.PENDING,
          description: description || 'Scheduled payment',
          purpose: paymentType || 'SCHEDULED_PAYMENT',
          metadata: JSON.stringify({ 
            ...metadata,
            scheduledPaymentId,
            scheduledDate: scheduledDate.toISOString(),
            paymentType,
            status: 'SCHEDULED'
          }),
        },
      });

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.SCHEDULED_PAYMENT,
        userId,
        transactionId: transaction.id,
        metadata: { 
          scheduledPaymentId,
          walletId, 
          recipientWalletId,
          amount, 
          currency, 
          scheduledDate: scheduledDate.toISOString(),
          paymentType,
          ...metadata 
        },
      });

      return {
        success: true,
        scheduledPaymentId,
        transactionId: transaction.id,
        amount,
        currency: currency || 'USD',
        scheduledDate,
        status: 'SCHEDULED',
        message: `Payment scheduled for ${scheduledDate.toISOString()}`,
      };
    } catch (error) {
      console.error('Scheduled payment failed:', error);
      return { success: false, error: 'Failed to schedule payment' };
    }
  }

  /**
   * 95. Recurring Payment - Recurring payment management
   */
  static async recurringPayment(input: RecurringPaymentInput): Promise<RecurringPaymentResult> {
    try {
      const { 
        userId, 
        walletId, 
        amount, 
        currency, 
        recipientWalletId, 
        frequency, 
        startDate, 
        endDate,
        maxOccurrences,
        description, 
        metadata 
      } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Validate frequency
      const validFrequencies = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
      if (!validFrequencies.includes(frequency)) {
        return { success: false, error: 'Invalid frequency' };
      }

      // Validate dates
      const start = startDate || new Date();
      if (endDate && endDate <= start) {
        return { success: false, error: 'End date must be after start date' };
      }

      // Check sufficient balance for at least first payment
      if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance for first payment' };
      }

      // Create recurring payment record
      const recurringPaymentId = `REC_PAY_${Date.now()}`;

      // Store recurring payment configuration
      // You would need a RecurringPayment model for this
      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.RECURRING_PAYMENT,
        userId,
        transactionId: recurringPaymentId,
        metadata: { 
          recurringPaymentId,
          walletId, 
          recipientWalletId,
          amount, 
          currency, 
          frequency,
          startDate: start.toISOString(),
          endDate: endDate?.toISOString(),
          maxOccurrences,
          status: 'ACTIVE',
          occurrenceCount: 0,
          ...metadata 
        },
      });

      return {
        success: true,
        recurringPaymentId,
        amount,
        currency: currency || 'USD',
        frequency,
        startDate: start,
        endDate: endDate || null,
        maxOccurrences: maxOccurrences || null,
        status: 'ACTIVE',
        nextPaymentDate: start,
        message: `Recurring ${frequency.toLowerCase()} payment of ${amount} ${currency} created`,
      };
    } catch (error) {
      console.error('Recurring payment failed:', error);
      return { success: false, error: 'Failed to create recurring payment' };
    }
  }

  /**
   * 96. Payment Link - Generate payment links
   */
  static async paymentLink(input: PaymentLinkInput): Promise<PaymentLinkResult> {
    try {
      const { 
        userId, 
        walletId, 
        amount, 
        currency, 
        description, 
        expiresAt,
        maxUses,
        requiresAuth,
        customSlug,
        metadata 
      } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Generate unique payment link
      const linkId = customSlug || `PL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentUrl = `${process.env.FRONTEND_URL || 'https://sygn.live'}/pay/${linkId}`;

      // Create payment link record
      // You would need a PaymentLink model for this
      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.PAYMENT_LINK,
        userId,
        transactionId: linkId,
        metadata: { 
          linkId,
          walletId, 
          amount, 
          currency, 
          description,
          expiresAt: expiresAt?.toISOString(),
          maxUses: maxUses || null,
          requiresAuth: requiresAuth || false,
          usageCount: 0,
          status: 'ACTIVE',
          paymentUrl,
          ...metadata 
        },
      });

      return {
        success: true,
        linkId,
        paymentUrl,
        qrCodeUrl: `${paymentUrl}/qr`, // QR code generation endpoint
        amount,
        currency: currency || 'USD',
        expiresAt: expiresAt || null,
        maxUses: maxUses || null,
        status: 'ACTIVE',
        message: 'Payment link created successfully',
      };
    } catch (error) {
      console.error('Payment link creation failed:', error);
      return { success: false, error: 'Failed to create payment link' };
    }
  }

  /**
   * 97. Invoice Generation - Create invoices
   */
  static async invoiceGeneration(input: InvoiceGenerationInput): Promise<InvoiceResult> {
    try {
      const { 
        userId, 
        walletId, 
        recipientUserId,
        items, 
        currency,
        dueDate,
        notes,
        taxRate,
        discountAmount,
        metadata 
      } = input;

      // Validate wallet
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Invalid wallet' };
      }

      // Get user details for invoice
      const [issuer, recipient] = await Promise.all([
        prisma.user.findUnique({ 
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, email: true }
        }),
        recipientUserId ? prisma.user.findUnique({ 
          where: { id: recipientUserId },
          select: { id: true, firstName: true, lastName: true, email: true }
        }) : null,
      ]);

      if (!issuer) {
        return { success: false, error: 'Issuer not found' };
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
      const discount = discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discount;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const invoiceId = `invoice_${Date.now()}`;

      // Create invoice record
      // You would need an Invoice model for this
      const invoiceData = {
        invoiceId,
        invoiceNumber,
        issuerId: userId,
        issuerName: `${issuer.firstName} ${issuer.lastName}`,
        issuerEmail: issuer.email,
        recipientId: recipientUserId,
        recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : undefined,
        recipientEmail: recipient?.email,
        walletId,
        items,
        subtotal,
        taxRate: taxRate || 0,
        taxAmount,
        discountAmount: discount,
        totalAmount,
        currency: currency || 'USD',
        status: 'UNPAID',
        issuedAt: new Date(),
        dueDate,
        notes,
        metadata,
      };

      await logFinanceOperation({
        operationKey: ALL_FINANCE_OPERATIONS.INVOICE_GENERATION,
        userId,
        transactionId: invoiceId,
        metadata: invoiceData,
      });

      return {
        success: true,
        invoiceId,
        invoiceNumber,
        subtotal,
        taxAmount,
        discountAmount: discount,
        totalAmount,
        currency: currency || 'USD',
        status: 'UNPAID',
        dueDate: dueDate || null,
        downloadUrl: `${process.env.FRONTEND_URL || 'https://sygn.live'}/invoices/${invoiceId}/download`,
        paymentUrl: `${process.env.FRONTEND_URL || 'https://sygn.live'}/invoices/${invoiceId}/pay`,
        message: 'Invoice generated successfully',
      };
    } catch (error) {
      console.error('Invoice generation failed:', error);
      return { success: false, error: 'Failed to generate invoice' };
    }
  }
}
