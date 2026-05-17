import * as FinPriv from '../financePrivateCompliance';
import { FinanceSecurity } from './security';
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

export class FinanceTax {
  static async taxCalculation(input: TaxCalculationInput): Promise<TaxComplianceResult> {
    try {
      const { userId, transactionId, amount, currency, transactionType, jurisdiction, taxYear, metadata } = input;

      // Get user for tax calculations
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Tax calculation logic based on jurisdiction and transaction type
      let taxRate = 0;
      let taxAmount = 0;

      // African jurisdiction tax rates (simplified)
      const taxRates: Record<string, Record<string, number>> = {
        'NG': { // Nigeria
          'CRYPTO_GAINS': 0.10, // 10% capital gains
          'TRADING_FEES': 0.075, // 7.5% VAT
          'INCOME': 0.24 // 24% income tax
        },
        'KE': { // Kenya
          'CRYPTO_GAINS': 0.05, // 5% capital gains
          'TRADING_FEES': 0.16, // 16% VAT
          'INCOME': 0.30 // 30% income tax
        },
        'ZA': { // South Africa
          'CRYPTO_GAINS': 0.18, // 18% capital gains
          'TRADING_FEES': 0.15, // 15% VAT
          'INCOME': 0.45 // 45% income tax
        },
        'GH': { // Ghana
          'CRYPTO_GAINS': 0.15, // 15% capital gains
          'TRADING_FEES': 0.125, // 12.5% VAT
          'INCOME': 0.25 // 25% income tax
        }
      };

      // Get tax rate for jurisdiction and transaction type
      const jurisdictionRates = taxRates[jurisdiction];
      if (jurisdictionRates) {
        taxRate = jurisdictionRates[transactionType] || 0;
        taxAmount = amount * taxRate;
      }

      // Create tax calculation record
      const taxRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.TAX_CALCULATION,
          operationCategory: 'TAX_COMPLIANCE',
          userId,
          performedBy: 'SYSTEM',
          transactionId: transactionId || null,
          inputData: JSON.stringify({ amount, currency, transactionType, jurisdiction, taxYear, metadata }),
          outputData: JSON.stringify({ taxRate, taxAmount }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Tax',
        },
      });

      return { 
        success: true, 
        taxAmount,
        taxRate,
        findings: { 
          jurisdiction, 
          transactionType, 
          taxYear,
          calculationId: taxRecord.id 
        }
      };

    } catch (error) {
      console.error('Tax calculation failed:', error);
      return { success: false, error: 'Tax calculation failed' };
    }
  }

  /**
   * 75. Tax Report Generate
   * Generate comprehensive tax reports for compliance
   */
  static async taxReportGenerate(input: TaxReportInput): Promise<TaxComplianceResult> {
    try {
      const { userId, fromDate, toDate, jurisdiction, reportType, taxYear, requestedByUserId, metadata } = input;

      // Get transactions in date range
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          ...(userId && { 
            OR: [
              { fromWallet: { userId } },
              { toWallet: { userId } }
            ]
          }),
          createdAt: {
            gte: fromDate,
            lte: toDate
          },
          status: 'COMPLETED'
        },
        include: {
          fromWallet: { include: { user: true } },
          toWallet: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate tax summary
      let totalTaxableAmount = 0;
      let totalTaxDue = 0;
      const taxableTransactions = [];

      for (const tx of transactions) {
        // Determine if transaction is taxable
        const isTaxable = FinPriv.isTransactionTaxable(tx.transactionType, tx.operationType || '');
        
        if (isTaxable) {
          const taxCalculation = await this.taxCalculation({
            userId: tx.fromWallet?.userId || tx.toWallet?.userId || '',
            transactionId: tx.id,
            amount: tx.amount,
            currency: tx.currency,
            transactionType: tx.transactionType,
            jurisdiction,
            taxYear
          });

          if (taxCalculation.success && taxCalculation.taxAmount) {
            totalTaxableAmount += tx.amount;
            totalTaxDue += taxCalculation.taxAmount;
            
            taxableTransactions.push({
              transactionId: tx.id,
              date: tx.createdAt,
              amount: tx.amount,
              currency: tx.currency,
              type: tx.transactionType,
              taxAmount: taxCalculation.taxAmount,
              taxRate: taxCalculation.taxRate
            });
          }
        }
      }

      const reportData = {
        reportType,
        taxYear,
        jurisdiction,
        period: { from: fromDate, to: toDate },
        summary: {
          totalTransactions: transactions.length,
          taxableTransactions: taxableTransactions.length,
          totalTaxableAmount,
          totalTaxDue,
          effectiveTaxRate: totalTaxableAmount > 0 ? totalTaxDue / totalTaxableAmount : 0
        },
        transactions: taxableTransactions
      };

      // Create tax report record
      const reportRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.TAX_REPORT_GENERATE,
          operationCategory: 'TAX_COMPLIANCE',
          userId: userId || requestedByUserId,
          performedBy: requestedByUserId,
          inputData: JSON.stringify({ fromDate, toDate, jurisdiction, reportType, taxYear, metadata }),
          outputData: JSON.stringify(reportData.summary),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Tax',
        },
      });

      return { 
        success: true, 
        reportId: reportRecord.id,
        findings: reportData
      };

    } catch (error) {
      console.error('Tax report generation failed:', error);
      return { success: false, error: 'Failed to generate tax report' };
    }
  }

  /**
   * 76. Compliance KYC
   * Know Your Customer verification for compliance
   */
  static async complianceKYC(input: ComplianceKYCInput): Promise<TaxComplianceResult> {
    try {
      const { userId, documentType, documentNumber, documentUrl, verifiedByUserId, metadata } = input;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Validate document format (simplified)
      const isValidDocument = await FinPriv.validateKYCDocument(documentType, documentNumber, documentUrl);
      
      if (!isValidDocument) {
        return { success: false, error: 'Invalid document provided' };
      }

      // KYC verification status
      const kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' = 'APPROVED';

      // Create KYC record (in real implementation, this would be a separate KYC table)
      const kycRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.COMPLIANCE_KYC,
          operationCategory: 'TAX_COMPLIANCE',
          userId,
          performedBy: verifiedByUserId,
          inputData: JSON.stringify({ documentType, documentNumber, documentUrl: '***', metadata }),
          outputData: JSON.stringify({ kycStatus, verificationDate: new Date() }),
          status: kycStatus === 'APPROVED' ? 'SUCCESS' : 'FAILED',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Compliance',
        },
      });

      // Update user verification status if approved
      if (kycStatus === 'APPROVED') {
        await prisma.user.update({
          where: { id: userId },
          data: {
            emailVerified: true // In real implementation, have separate KYC verified field
          }
        });
      }

      return { 
        success: true, 
        kycStatus,
        findings: { 
          documentType, 
          verificationDate: new Date(),
          verificationId: kycRecord.id 
        }
      };

    } catch (error) {
      console.error('KYC verification failed:', error);
      return { success: false, error: 'KYC verification failed' };
    }
  }

  /**
   * 77. Compliance AML
   * Anti-Money Laundering checks and screening
   */
  static async complianceAML(input: ComplianceAMLInput): Promise<TaxComplianceResult> {
    try {
      const { userId, checkType, transactionId, amount, currency, performedByUserId, metadata } = input;

      // Get user for AML check
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      let amlStatus: 'CLEAR' | 'FLAGGED' | 'REVIEW_REQUIRED' = 'CLEAR';
      let riskScore = 0;
      const findings: Record<string, any> = {};

      // Perform different types of AML checks
      switch (checkType) {
        case 'SANCTIONS':
          const sanctionsCheck = await FinPriv.checkSanctionsList(user.email, user.firstName, user.lastName);
          if (sanctionsCheck.isListed) {
            amlStatus = 'FLAGGED';
            riskScore = 100;
            findings.sanctions = sanctionsCheck;
          }
          break;

        case 'PEP':
          const pepCheck = await FinPriv.checkPEPList(user.email, user.firstName, user.lastName);
          if (pepCheck.isPEP) {
            amlStatus = 'REVIEW_REQUIRED';
            riskScore = 70;
            findings.pep = pepCheck;
          }
          break;

        case 'ADVERSE_MEDIA':
          const mediaCheck = await FinPriv.checkAdverseMedia(user.email, user.firstName, user.lastName);
          if (mediaCheck.hasAdverseMedia) {
            amlStatus = 'REVIEW_REQUIRED';
            riskScore = 60;
            findings.adverseMedia = mediaCheck;
          }
          break;

        case 'COMPREHENSIVE':
          // Perform all checks
          const allChecks = await Promise.all([
            FinPriv.checkSanctionsList(user.email, user.firstName, user.lastName),
            FinPriv.checkPEPList(user.email, user.firstName, user.lastName),
            FinPriv.checkAdverseMedia(user.email, user.firstName, user.lastName)
          ]);

          findings.sanctions = allChecks[0];
          findings.pep = allChecks[1];
          findings.adverseMedia = allChecks[2];

          if (allChecks[0].isListed) {
            amlStatus = 'FLAGGED';
            riskScore = 100;
          } else if (allChecks[1].isPEP || allChecks[2].hasAdverseMedia) {
            amlStatus = 'REVIEW_REQUIRED';
            riskScore = 70;
          }
          break;
      }

      // Additional transaction-based risk scoring
      if (transactionId && amount) {
        const transactionRisk = await FinPriv.assessTransactionAMLRisk(transactionId, amount, currency || 'USD');
        riskScore = Math.max(riskScore, transactionRisk.riskScore);
        findings.transactionRisk = transactionRisk;
        
        if (transactionRisk.riskScore > 80 && amlStatus === 'CLEAR') {
          amlStatus = 'REVIEW_REQUIRED';
        }
      }

      // Create AML record
      const amlRecord = await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.COMPLIANCE_AML,
          operationCategory: 'TAX_COMPLIANCE',
          userId,
          performedBy: performedByUserId,
          transactionId: transactionId || null,
          inputData: JSON.stringify({ checkType, amount, currency, metadata }),
          outputData: JSON.stringify({ amlStatus, riskScore, checkType }),
          status: amlStatus === 'FLAGGED' ? 'FAILED' : 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Compliance',
        },
      });

      // Take action based on AML status
      if (amlStatus === 'FLAGGED') {
        // Auto-freeze user's wallets
        const userWallets = await prisma.wallet.findMany({
          where: { userId }
        });

        for (const wallet of userWallets) {
          await FinanceSecurity.securityWalletFreeze({
            walletId: wallet.id,
            reason: 'AML sanctions list match',
            frozenByUserId: 'SYSTEM',
            duration: 0 // Indefinite freeze
          });
        }
      }

      return { 
        success: true, 
        amlStatus,
        riskScore,
        findings: {
          ...findings,
          checkType,
          verificationId: amlRecord.id
        }
      };

    } catch (error) {
      console.error('AML check failed:', error);
      return { success: false, error: 'AML compliance check failed' };
    }
  }
}
