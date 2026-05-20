import * as FinPriv from '../financePrivateCompliance';
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

export class FinanceSecurity {
  // CATEGORY 14: SECURITY & FRAUD PREVENTION (7/7 operations) ✅
  // ==========================================================================

  /**
   * 67. Security OTP Verify
   * Verify OTP for sensitive financial operations
   */
  static async securityOTPVerify(input: SecurityOTPInput): Promise<SecurityResult> {
    try {
      const { userId, operationType, transactionId, otpCode, metadata } = input;

      // Get user and validate OTP
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Generate expected OTP (in real implementation, this would be stored/cached)
      const expectedOTP = FinPriv.generateOTP(userId, operationType);
      const isValidOTP = otpCode === expectedOTP;

      // Log OTP verification attempt
      await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.SECURITY_OTP_VERIFY,
          operationCategory: 'SECURITY',
          userId,
          performedBy: userId,
          transactionId: transactionId || null,
          inputData: JSON.stringify({ operationType, otpCode: '***', metadata }),
          outputData: JSON.stringify({ verified: isValidOTP }),
          status: isValidOTP ? 'SUCCESS' : 'FAILED',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      if (!isValidOTP) {
        // Increment failed OTP attempts
        await FinPriv.incrementFailedOTPAttempts(userId);
        return { success: false, error: 'Invalid OTP code', verified: false };
      }

      // Clear failed attempts on successful verification
      await FinPriv.clearFailedOTPAttempts(userId);

      return { 
        success: true, 
        verified: true 
      };

    } catch (error) {
      console.error('OTP verification failed:', error);
      return { success: false, error: 'OTP verification failed', verified: false };
    }
  }

  /**
   * 68. Security 2FA
   * Two-factor authentication for enhanced security
   */
  static async security2FA(input: Security2FAInput): Promise<SecurityResult> {
    try {
      const { userId, operationType, token, deviceId, metadata } = input;

      // Get user and validate 2FA token
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, error: '2FA not enabled for this user' };
      }

      // Validate 2FA token (in real implementation, use TOTP library)
      const isValidToken = FinPriv.validate2FAToken(user.twoFactorSecret || '', token);

      // Log 2FA attempt
      await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.SECURITY_2FA,
          operationCategory: 'SECURITY',
          userId,
          performedBy: userId,
          inputData: JSON.stringify({ operationType, deviceId, token: '***', metadata }),
          outputData: JSON.stringify({ verified: isValidToken }),
          status: isValidToken ? 'SUCCESS' : 'FAILED',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      if (!isValidToken) {
        return { success: false, error: 'Invalid 2FA token', verified: false };
      }

      return { 
        success: true, 
        verified: true 
      };

    } catch (error) {
      console.error('2FA verification failed:', error);
      return { success: false, error: '2FA verification failed', verified: false };
    }
  }

  /**
   * 69. Security Wallet Freeze
   * Freeze suspicious wallets to prevent unauthorized transactions
   */
  static async securityWalletFreeze(input: SecurityWalletFreezeInput): Promise<SecurityResult> {
    try {
      const { walletId, reason, frozenByUserId, duration, metadata } = input;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        include: { user: true }
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Calculate freeze end time if duration is provided
      const freezeEndTime = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

      // Update wallet status to locked
      const updatedWallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          isLocked: true,
          lockReason: reason,
          lockedAt: new Date(),
          lockedBy: frozenByUserId
        }
      });

      // Log security action
      await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.SECURITY_WALLET_FREEZE,
          operationCategory: 'SECURITY',
          userId: wallet.userId,
          performedBy: frozenByUserId,
          inputData: JSON.stringify({ reason, duration, metadata }),
          outputData: JSON.stringify({ walletId, freezeEndTime }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      // TODO: Send notification to wallet owner
      // TODO: Set up automatic unfreeze if duration is specified

      return { 
        success: true, 
        walletFrozen: true,
        findings: { walletId, reason, freezeEndTime }
      };

    } catch (error) {
      console.error('Wallet freeze failed:', error);
      return { success: false, error: 'Failed to freeze wallet' };
    }
  }

  /**
   * 70. Security Whitelist Add
   * Add wallet address to whitelist for trusted transactions
   */
  static async securityWhitelistAdd(input: SecurityWhitelistInput): Promise<SecurityResult> {
    try {
      const { userId, walletAddress, operationType, approvedByUserId, metadata } = input;

      // Get user's wallet
      const userWallet = await prisma.wallet.findFirst({
        where: { userId }
      });

      if (!userWallet) {
        return { success: false, error: 'User wallet not found' };
      }

      // Get current whitelist
      const currentWhitelist = userWallet.whitelistedAddresses 
        ? JSON.parse(userWallet.whitelistedAddresses) 
        : [];

      let updatedWhitelist = currentWhitelist;

      if (operationType === 'ADD') {
        // Add to whitelist if not already present
        if (!currentWhitelist.includes(walletAddress)) {
          updatedWhitelist = [...currentWhitelist, walletAddress];
        } else {
          return { success: false, error: 'Address already whitelisted' };
        }
      } else if (operationType === 'REMOVE') {
        // Remove from whitelist
        updatedWhitelist = currentWhitelist.filter((addr: string) => addr !== walletAddress);
        if (updatedWhitelist.length === currentWhitelist.length) {
          return { success: false, error: 'Address not found in whitelist' };
        }
      }

      // Update wallet with new whitelist
      await prisma.wallet.update({
        where: { id: userWallet.id },
        data: {
          whitelistedAddresses: JSON.stringify(updatedWhitelist)
        }
      });

      // Log security action
      await prisma.financeOperationLog.create({
        data: {
          operationType: operationType === 'ADD' 
            ? ALL_FINANCE_OPERATIONS.SECURITY_WHITELIST_ADD 
            : ALL_FINANCE_OPERATIONS.SECURITY_WHITELIST_REMOVE,
          operationCategory: 'SECURITY',
          userId,
          performedBy: approvedByUserId,
          inputData: JSON.stringify({ walletAddress, operationType, metadata }),
          outputData: JSON.stringify({ updatedWhitelist }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      return { 
        success: true, 
        whitelistUpdated: true,
        findings: { 
          operation: operationType, 
          address: walletAddress, 
          totalWhitelisted: updatedWhitelist.length 
        }
      };

    } catch (error) {
      console.error('Whitelist operation failed:', error);
      return { success: false, error: 'Failed to update whitelist' };
    }
  }

  /**
   * 71. Security Whitelist Remove
   * Remove wallet address from whitelist (uses same method as Add)
   */
  static async securityWhitelistRemove(input: SecurityWhitelistInput): Promise<SecurityResult> {
    // Reuse the same method with REMOVE operation
    return this.securityWhitelistAdd({ ...input, operationType: 'REMOVE' });
  }

  /**
   * 72. Security Fraud Detection
   * Automated fraud detection and risk assessment
   */
  static async securityFraudDetection(input: SecurityFraudDetectionInput): Promise<SecurityResult> {
    try {
      const { transactionId, userId, walletId, analysisType, metadata } = input;

      let fraudScore = 0;
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      const findings: Record<string, any> = {};

      if (analysisType === 'TRANSACTION' && transactionId) {
        const analysis = await FinPriv.analyzeTransactionFraud(transactionId);
        fraudScore = analysis.fraudScore;
        findings.transaction = analysis.findings;
      } else if (analysisType === 'USER' && userId) {
        const analysis = await FinPriv.analyzeUserFraud(userId);
        fraudScore = analysis.fraudScore;
        findings.user = analysis.findings;
      } else if (analysisType === 'WALLET' && walletId) {
        const analysis = await FinPriv.analyzeWalletFraud(walletId);
        fraudScore = analysis.fraudScore;
        findings.wallet = analysis.findings;
      } else if (analysisType === 'PATTERN') {
        const analysis = await FinPriv.analyzePatternFraud();
        fraudScore = analysis.fraudScore;
        findings.patterns = analysis.findings;
      }

      // Determine risk level based on fraud score
      if (fraudScore >= 90) {
        riskLevel = 'CRITICAL';
      } else if (fraudScore >= 70) {
        riskLevel = 'HIGH';
      } else if (fraudScore >= 40) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      // Log fraud detection analysis
      await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.SECURITY_FRAUD_DETECTION,
          operationCategory: 'SECURITY',
          userId: userId || 'SYSTEM',
          performedBy: 'SYSTEM',
          transactionId: transactionId || null,
          inputData: JSON.stringify({ analysisType, metadata }),
          outputData: JSON.stringify({ fraudScore, riskLevel, findings }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      // Take action based on risk level
      if (riskLevel === 'CRITICAL' && walletId) {
        // Auto-freeze wallet for critical risk
        await this.securityWalletFreeze({
          walletId,
          reason: 'Automated fraud detection - critical risk',
          frozenByUserId: 'SYSTEM',
          duration: 24 // 24 hours
        });
      }

      return { 
        success: true, 
        fraudScore,
        riskLevel,
        findings
      };

    } catch (error) {
      console.error('Fraud detection failed:', error);
      return { success: false, error: 'Fraud detection analysis failed' };
    }
  }

  /**
   * 73. Security Transaction Limit
   * Set and enforce transaction limits for enhanced security
   */
  static async securityTransactionLimit(input: SecurityTransactionLimitInput): Promise<SecurityResult> {
    try {
      const { userId, walletId, limitType, amount, currency, setByUserId, metadata } = input;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
      });

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Set appropriate limit based on type
      let updateData: any = {};
      
      switch (limitType) {
        case 'DAILY':
          updateData.dailyWithdrawalLimit = amount;
          break;
        case 'TRANSACTION':
          updateData.transactionLimit = amount;
          break;
        case 'WEEKLY':
        case 'MONTHLY':
          // For weekly/monthly limits, we'd store in a separate table in real implementation
          // For now, use transactionLimit field
          updateData.transactionLimit = amount;
          break;
      }

      // Update wallet with new limits
      await prisma.wallet.update({
        where: { id: walletId },
        data: updateData
      });

      // Log security action
      await prisma.financeOperationLog.create({
        data: {
          operationType: ALL_FINANCE_OPERATIONS.SECURITY_TRANSACTION_LIMIT,
          operationCategory: 'SECURITY',
          userId,
          performedBy: setByUserId,
          inputData: JSON.stringify({ limitType, amount, currency, metadata }),
          outputData: JSON.stringify({ walletId, limitSet: true }),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0',
          userAgent: 'FinanceService-Security',
        },
      });

      return { 
        success: true, 
        limitSet: true,
        findings: { limitType, amount, currency }
      };

    } catch (error) {
      console.error('Transaction limit setting failed:', error);
      return { success: false, error: 'Failed to set transaction limit' };
    }
  }

}
