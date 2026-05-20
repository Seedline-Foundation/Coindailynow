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

export class FinanceAuditReporting {
  // ==========================================================================
  // AUDIT & REPORTING OPERATIONS
  // ==========================================================================

  /**
   * 61. Audit Wallet
   * Perform comprehensive wallet audit for balance reconciliation and security
   */
  static async auditWallet(input: AuditInput): Promise<AuditResult> {
    try {
      const { targetId, auditedByUserId, auditScope, metadata } = input;

      // Get wallet details
      const wallet = await prisma.wallet.findUnique({
        where: { id: targetId },
        include: {
          user: true
        }
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Get recent transactions for analysis
      const recentTransactions = await prisma.walletTransaction.findMany({
        where: {
          OR: [
            { fromWalletId: targetId },
            { toWalletId: targetId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      // Calculate expected balance from transactions
      const incomingTransactions = await prisma.walletTransaction.findMany({
        where: { 
          toWalletId: targetId,
          status: 'COMPLETED'
        }
      });

      const outgoingTransactions = await prisma.walletTransaction.findMany({
        where: { 
          fromWalletId: targetId,
          status: 'COMPLETED'
        }
      });

      const totalIncoming = incomingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const totalOutgoing = outgoingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const calculatedBalance = totalIncoming - totalOutgoing;

      // Audit findings
      const findings = {
        walletId: targetId,
        userId: wallet.userId || '',
        currentBalance: wallet.availableBalance,
        calculatedBalance,
        balanceDiscrepancy: wallet.availableBalance - calculatedBalance,
        totalTransactions: incomingTransactions.length + outgoingTransactions.length,
        lastTransactionDate: recentTransactions[0]?.createdAt || null,
        suspiciousPatterns: [] as string[],
        recommendations: [] as string[]
      };

      // Check for suspicious patterns
      if (Math.abs(findings.balanceDiscrepancy) > 0.01) {
        findings.suspiciousPatterns.push(`Balance discrepancy: ${findings.balanceDiscrepancy}`);
        findings.recommendations.push('Manual balance reconciliation required');
      }

      // Check for unusual transaction patterns
      const largeTransactions = recentTransactions.filter(tx => tx.amount > 10000);
      if (largeTransactions.length > 0) {
        findings.suspiciousPatterns.push(`${largeTransactions.length} large transactions found`);
      }

      // Create audit record
      const auditRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.AUDIT_WALLET,
          operationCategory: 'AUDIT',
          userId: auditedByUserId,
          performedBy: auditedByUserId,
          inputData: JSON.stringify({ auditScope, metadata }),
          outputData: JSON.stringify(findings),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Audit',
        },
      });

      return { 
        success: true, 
        auditId: auditRecord.id,
        findings 
      };

    } catch (error) {
      console.error('Wallet audit failed:', error);
      return { success: false, error: 'Failed to perform wallet audit' };
    }
  }

  /**
   * 62. Audit User Financial
   * Comprehensive financial audit for a user across all their wallets and transactions
   */
  static async auditUserFinancial(input: AuditInput): Promise<AuditResult> {
    try {
      const { targetId, auditedByUserId, auditScope, metadata } = input;

      // Get user and all their wallets
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        include: {
          Wallets: true
        }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Calculate overall financial position
      const totalBalance = user.Wallets.reduce((sum: number, wallet: any) => sum + wallet.availableBalance, 0);

      // Get all user transactions for analysis
      const walletIds = user.Wallets.map((w: any) => w.id);
      const allTransactions = await prisma.walletTransaction.findMany({
        where: {
          OR: [
            { fromWalletId: { in: walletIds } },
            { toWalletId: { in: walletIds } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 200
      });

      const totalTransactions = allTransactions.length;

      // Calculate transaction statistics
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentTransactions = allTransactions.filter(tx => 
        new Date(tx.createdAt) > last30Days
      );

      const findings = {
        userId: targetId,
        email: user.email,
        totalWallets: user.Wallets.length,
        totalBalance,
        totalTransactions,
        recentTransactionCount: recentTransactions.length,
        averageTransactionAmount: recentTransactions.length > 0 
          ? recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length 
          : 0,
        largestTransaction: Math.max(...allTransactions.map(tx => tx.amount), 0),
        suspiciousPatterns: [] as string[],
        recommendations: [] as string[],
        riskScore: 0
      };

      // Risk assessment
      if (findings.totalBalance > 100000) {
        findings.riskScore += 30;
        findings.recommendations.push('High-value account - implement enhanced monitoring');
      }

      if (findings.recentTransactionCount > 50) {
        findings.riskScore += 20;
        findings.suspiciousPatterns.push('High transaction frequency in last 30 days');
      }

      if (findings.largestTransaction > 50000) {
        findings.riskScore += 25;
        findings.suspiciousPatterns.push('Large single transaction detected');
      }

      // Check for unusual patterns
      const failedTransactions = allTransactions.filter(tx => tx.status === 'FAILED');
      if (failedTransactions.length > 5) {
        findings.riskScore += 15;
        findings.suspiciousPatterns.push(`${failedTransactions.length} failed transactions`);
      }

      // Create audit record
      const auditRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.AUDIT_USER_FINANCIAL,
          operationCategory: 'AUDIT',
          userId: auditedByUserId,
          performedBy: auditedByUserId,
          inputData: JSON.stringify({ auditScope, metadata }),
          outputData: JSON.stringify(findings),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Audit',
        },
      });

      return { 
        success: true, 
        auditId: auditRecord.id,
        findings 
      };

    } catch (error) {
      console.error('User financial audit failed:', error);
      return { success: false, error: 'Failed to perform user financial audit' };
    }
  }

  /**
   * 63. Report Transaction
   * Generate comprehensive transaction reports with filtering and analytics
   */
  static async reportTransaction(input: ReportInput): Promise<ReportResult> {
    try {
      const { startDate, endDate, filters, requestedByUserId, format = 'JSON', metadata } = input;

      // Build query filters
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.transactionType) {
        whereClause.transactionType = filters.transactionType;
      }

      if (filters?.currency) {
        whereClause.currency = filters.currency;
      }

      if (filters?.minAmount) {
        whereClause.amount = { ...whereClause.amount, gte: filters.minAmount };
      }

      if (filters?.maxAmount) {
        whereClause.amount = { ...whereClause.amount, lte: filters.maxAmount };
      }

      // Get transactions
      const transactions = await prisma.walletTransaction.findMany({
        where: whereClause,
        include: {
          fromWallet: { select: { userId: true, walletType: true } },
          toWallet: { select: { userId: true, walletType: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate summary statistics
      const summary = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        averageAmount: transactions.length > 0 
          ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length 
          : 0,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        byCurrency: {} as Record<string, number>,
        dateRange: { start: startDate, end: endDate }
      };

      // Group by status
      transactions.forEach(tx => {
        summary.byStatus[tx.status] = (summary.byStatus[tx.status] || 0) + 1;
        summary.byType[tx.transactionType] = (summary.byType[tx.transactionType] || 0) + 1;
        summary.byCurrency[tx.currency] = (summary.byCurrency[tx.currency] || 0) + 1;
      });

      const reportData = {
        summary,
        transactions: transactions.map(tx => ({
          id: tx.id,
          hash: tx.transactionHash,
          type: tx.transactionType,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          purpose: tx.purpose,
          createdAt: tx.createdAt,
          fromWallet: tx.fromWallet?.walletType || 'EXTERNAL',
          toWallet: tx.toWallet?.walletType || 'EXTERNAL'
        }))
      };

      // Create report record
      const reportRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.REPORT_TRANSACTION,
          operationCategory: 'REPORTING',
          userId: requestedByUserId,
          performedBy: requestedByUserId,
          inputData: JSON.stringify({ startDate, endDate, filters, format }),
          outputData: JSON.stringify({ summary }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Report',
        },
      });

      return { 
        success: true, 
        reportId: reportRecord.id,
        data: reportData 
      };

    } catch (error) {
      console.error('Transaction report failed:', error);
      return { success: false, error: 'Failed to generate transaction report' };
    }
  }

  /**
   * 64. Report Revenue
   * Generate revenue reports with breakdown by source and time periods
   */
  static async reportRevenue(input: ReportInput): Promise<ReportResult> {
    try {
      const { startDate, endDate, filters, requestedByUserId, format = 'JSON', metadata } = input;

      // Get revenue transactions (payments to WE_WALLET)
      const revenueTransactions = await prisma.walletTransaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          toWallet: {
            walletType: 'WE_WALLET'
          },
          status: 'COMPLETED',
          ...(filters?.currency && { currency: filters.currency })
        },
        include: {
          toWallet: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate revenue breakdown
      const revenueByType = {} as Record<string, number>;
      const revenueByMonth = {} as Record<string, number>;
      const revenueByCurrency = {} as Record<string, number>;
      let totalRevenue = 0;

      revenueTransactions.forEach(tx => {
        totalRevenue += tx.amount;

        // By operation type
        const opType = tx.operationType || 'OTHER';
        revenueByType[opType] = (revenueByType[opType] || 0) + tx.amount;

        // By month
        const month = new Date(tx.createdAt).toISOString().substring(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + tx.amount;

        // By currency
        revenueByCurrency[tx.currency] = (revenueByCurrency[tx.currency] || 0) + tx.amount;
      });

      const reportData = {
        summary: {
          totalRevenue,
          transactionCount: revenueTransactions.length,
          averageRevenue: revenueTransactions.length > 0 ? totalRevenue / revenueTransactions.length : 0,
          dateRange: { start: startDate, end: endDate },
          topRevenueSource: Object.keys(revenueByType).reduce((a, b) => 
            (revenueByType[a] || 0) > (revenueByType[b] || 0) ? a : b, 'NONE'
          )
        },
        breakdown: {
          byType: revenueByType,
          byMonth: revenueByMonth,
          byCurrency: revenueByCurrency
        },
        transactions: revenueTransactions.slice(0, 100).map(tx => ({
          id: tx.id,
          amount: tx.amount,
          currency: tx.currency,
          source: tx.operationType,
          date: tx.createdAt,
          purpose: tx.purpose
        }))
      };

      // Create report record
      const reportRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.REPORT_REVENUE,
          operationCategory: 'REPORTING',
          userId: requestedByUserId,
          performedBy: requestedByUserId,
          inputData: JSON.stringify({ startDate, endDate, filters, format }),
          outputData: JSON.stringify(reportData.summary),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Report',
        },
      });

      return { 
        success: true, 
        reportId: reportRecord.id,
        data: reportData 
      };

    } catch (error) {
      console.error('Revenue report failed:', error);
      return { success: false, error: 'Failed to generate revenue report' };
    }
  }

  /**
   * 65. Report Payouts
   * Generate payout reports for creators, affiliates, and other beneficiaries
   */
  static async reportPayouts(input: ReportInput): Promise<ReportResult> {
    try {
      const { startDate, endDate, filters, requestedByUserId, format = 'JSON', metadata } = input;

      // Get payout transactions (payments from WE_WALLET)
      const payoutTransactions = await prisma.walletTransaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          fromWallet: {
            walletType: 'WE_WALLET'
          },
          status: 'COMPLETED',
          ...(filters?.currency && { currency: filters.currency })
        },
        include: {
          fromWallet: true,
          toWallet: {
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate payout breakdown
      const payoutsByType = {} as Record<string, number>;
      const payoutsByUser = {} as Record<string, any>;
      const payoutsByMonth = {} as Record<string, number>;
      let totalPayouts = 0;

      payoutTransactions.forEach(tx => {
        totalPayouts += tx.amount;

        // By operation type
        const opType = tx.operationType || 'OTHER';
        payoutsByType[opType] = (payoutsByType[opType] || 0) + tx.amount;

        // By user
        if (tx.toWallet?.user) {
          const userId = tx.toWallet.user.id;
          if (!payoutsByUser[userId]) {
            payoutsByUser[userId] = {
              user: tx.toWallet.user,
              totalAmount: 0,
              transactionCount: 0
            };
          }
          payoutsByUser[userId].totalAmount += tx.amount;
          payoutsByUser[userId].transactionCount += 1;
        }

        // By month
        const month = new Date(tx.createdAt).toISOString().substring(0, 7);
        payoutsByMonth[month] = (payoutsByMonth[month] || 0) + tx.amount;
      });

      const reportData = {
        summary: {
          totalPayouts,
          transactionCount: payoutTransactions.length,
          averagePayout: payoutTransactions.length > 0 ? totalPayouts / payoutTransactions.length : 0,
          uniqueRecipients: Object.keys(payoutsByUser).length,
          dateRange: { start: startDate, end: endDate }
        },
        breakdown: {
          byType: payoutsByType,
          byMonth: payoutsByMonth,
          topRecipients: Object.values(payoutsByUser)
            .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
            .slice(0, 10)
        },
        transactions: payoutTransactions.slice(0, 100).map(tx => ({
          id: tx.id,
          amount: tx.amount,
          currency: tx.currency,
          type: tx.operationType,
          recipient: tx.toWallet?.user?.email || 'External',
          date: tx.createdAt,
          purpose: tx.purpose
        }))
      };

      // Create report record
      const reportRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.REPORT_PAYOUTS,
          operationCategory: 'REPORTING',
          userId: requestedByUserId,
          performedBy: requestedByUserId,
          inputData: JSON.stringify({ startDate, endDate, filters, format }),
          outputData: JSON.stringify(reportData.summary),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Report',
        },
      });

      return { 
        success: true, 
        reportId: reportRecord.id,
        data: reportData 
      };

    } catch (error) {
      console.error('Payouts report failed:', error);
      return { success: false, error: 'Failed to generate payouts report' };
    }
  }

  /**
   * 66. Report Reconciliation
   * Generate financial reconciliation reports for balance verification
   */
  static async reportReconciliation(input: ReportInput): Promise<ReportResult> {
    try {
      const { startDate, endDate, filters, requestedByUserId, format = 'JSON', metadata } = input;

      // Get all wallets for reconciliation
      const wallets = await prisma.wallet.findMany({
        include: {
          user: { select: { id: true, email: true } }
        }
      });

      const reconciliationResults = [];
      let totalDiscrepancies = 0;

      for (const wallet of wallets) {
        // Calculate expected balance from transactions
        const incomingTxs = await prisma.walletTransaction.findMany({
          where: {
            toWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate }
          }
        });

        const outgoingTxs = await prisma.walletTransaction.findMany({
          where: {
            fromWalletId: wallet.id,
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate }
          }
        });

        const totalIncoming = incomingTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const totalOutgoing = outgoingTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const netChange = totalIncoming - totalOutgoing;

        // Get balance at start of period
        const startBalance = wallet.availableBalance - netChange;
        const expectedBalance = startBalance + netChange;
        const discrepancy = wallet.availableBalance - expectedBalance;

        if (Math.abs(discrepancy) > 0.01) {
          totalDiscrepancies += Math.abs(discrepancy);
        }

        reconciliationResults.push({
          walletId: wallet.id,
          walletType: wallet.walletType,
          userId: wallet.userId,
          userEmail: wallet.user?.email || 'N/A',
          currentBalance: wallet.availableBalance,
          expectedBalance,
          discrepancy,
          transactionCount: incomingTxs.length + outgoingTxs.length,
          netChange,
          status: Math.abs(discrepancy) > 0.01 ? 'DISCREPANCY' : 'BALANCED'
        });
      }

      const reportData = {
        summary: {
          totalWallets: wallets.length,
          balancedWallets: reconciliationResults.filter(r => r.status === 'BALANCED').length,
          walletsWithDiscrepancies: reconciliationResults.filter(r => r.status === 'DISCREPANCY').length,
          totalDiscrepancies,
          dateRange: { start: startDate, end: endDate }
        },
        discrepancies: reconciliationResults.filter(r => r.status === 'DISCREPANCY'),
        allWallets: reconciliationResults
      };

      // Create report record
      const reportRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.REPORT_RECONCILIATION,
          operationCategory: 'REPORTING',
          userId: requestedByUserId,
          performedBy: requestedByUserId,
          inputData: JSON.stringify({ startDate, endDate, filters, format }),
          outputData: JSON.stringify(reportData.summary),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Report',
        },
      });

      return { 
        success: true, 
        reportId: reportRecord.id,
        data: reportData 
      };

    } catch (error) {
      console.error('Reconciliation report failed:', error);
      return { success: false, error: 'Failed to generate reconciliation report' };
    }
  }
}
