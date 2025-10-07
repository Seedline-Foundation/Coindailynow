/**
 * Compliance Service
 * Task 15: Mobile Money Integration - Regulatory Compliance
 * 
 * Handles regulatory compliance validation for mobile money transactions
 * across different African jurisdictions
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import {
  ComplianceCheck,
  ComplianceRequirement,
  MobileMoneyTransaction,
  MobileMoneyProvider
} from '../types/mobile-money';

// Additional types for comprehensive compliance
export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  VIOLATION = 'VIOLATION',
  PENDING_REVIEW = 'PENDING_REVIEW'
}

export enum KYCStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface ComplianceValidation {
  transactionId: string;
  status: ComplianceStatus;
  checks: ComplianceCheckResult[];
  violations: string[];
  approvedAt?: Date;
  requiresManualReview: boolean;
}

export interface ComplianceCheckResult {
  type: string;
  status: ComplianceStatus;
  description: string;
  violations?: string[];
}

export class ComplianceService {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;

  // Compliance thresholds by country (in local currency minor units)
  private readonly complianceThresholds = {
    KE: { // Kenya
      dailyLimit: 7000000, // 70,000 KES in cents
      monthlyLimit: 30000000, // 300,000 KES in cents
      kycRequired: 1000000, // 10,000 KES in cents
      requiresIds: ['nationalId', 'passport']
    },
    NG: { // Nigeria
      dailyLimit: 500000000, // 5,000,000 NGN in kobo
      monthlyLimit: 2000000000, // 20,000,000 NGN in kobo
      kycRequired: 5000000, // 50,000 NGN in kobo
      requiresIds: ['nin', 'bvn', 'passport']
    },
    GH: { // Ghana
      dailyLimit: 500000, // 5,000 GHS in pesewas
      monthlyLimit: 2000000, // 20,000 GHS in pesewas
      kycRequired: 100000, // 1,000 GHS in pesewas
      requiresIds: ['ghanaCard', 'passport', 'votersId']
    },
    ZA: { // South Africa
      dailyLimit: 500000, // 5,000 ZAR in cents
      monthlyLimit: 2500000, // 25,000 ZAR in cents
      kycRequired: 100000, // 1,000 ZAR in cents
      requiresIds: ['nationalId', 'passport', 'driversLicense']
    }
  };

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Validate transaction compliance
   */
  async validateTransaction(
    transaction: Partial<MobileMoneyTransaction>,
    provider: MobileMoneyProvider
  ): Promise<ComplianceValidation> {
    try {
      const validationStart = Date.now();
      const checks: ComplianceCheckResult[] = [];
      let overallStatus: ComplianceStatus = ComplianceStatus.COMPLIANT;
      const violations: string[] = [];

      // Country-specific compliance check
      const countryCheck = await this.validateCountryRequirements(transaction, provider);
      checks.push(countryCheck);
      if (countryCheck.status !== ComplianceStatus.COMPLIANT) {
        overallStatus = ComplianceStatus.VIOLATION;
        violations.push(...countryCheck.violations || []);
      }

      // KYC compliance check
      const kycCheck = await this.validateKYCRequirements(transaction);
      checks.push(kycCheck);
      if (kycCheck.status !== ComplianceStatus.COMPLIANT) {
        overallStatus = ComplianceStatus.VIOLATION;
        violations.push(...kycCheck.violations || []);
      }

      // Transaction limits check
      const limitsCheck = await this.validateTransactionLimits(transaction);
      checks.push(limitsCheck);
      if (limitsCheck.status !== ComplianceStatus.COMPLIANT) {
        overallStatus = ComplianceStatus.VIOLATION;
        violations.push(...limitsCheck.violations || []);
      }

      // Sanctions screening
      const sanctionsCheck = await this.performSanctionsScreening(transaction);
      checks.push(sanctionsCheck);
      if (sanctionsCheck.status !== ComplianceStatus.COMPLIANT) {
        overallStatus = ComplianceStatus.VIOLATION;
        violations.push(...sanctionsCheck.violations || []);
      }

      // AML compliance
      const amlCheck = await this.validateAMLRequirements(transaction);
      checks.push(amlCheck);
      if (amlCheck.status !== ComplianceStatus.COMPLIANT) {
        overallStatus = ComplianceStatus.VIOLATION;
        violations.push(...amlCheck.violations || []);
      }

      // Create compliance validation result
      const approvedAt = overallStatus === ComplianceStatus.COMPLIANT ? new Date() : undefined;
      const validation: ComplianceValidation = {
        transactionId: transaction.id || '',
        status: overallStatus,
        checks,
        violations,
        ...(approvedAt && { approvedAt }),
        requiresManualReview: false
      };

      this.logger.info('Compliance validation completed', {
        transactionId: transaction.id,
        status: overallStatus,
        checksCount: checks.length,
        violationsCount: violations.length,
        processingTime: Date.now() - validationStart
      });

      return validation;

    } catch (error: any) {
      this.logger.error('Compliance validation failed', {
        error: error.message,
        transactionId: transaction.id
      });

      // Return safe default - violation status for failed validation
      return {
        transactionId: transaction.id || '',
        status: ComplianceStatus.VIOLATION,
        checks: [{
          type: 'system_error',
          status: ComplianceStatus.VIOLATION,
          description: 'Compliance system error',
          violations: ['System error during compliance validation']
        }],
        violations: ['System error during compliance validation'],
        requiresManualReview: true
      };
    }
  }

  /**
   * Validate country-specific requirements
   */
  private async validateCountryRequirements(
    transaction: Partial<MobileMoneyTransaction>,
    provider: MobileMoneyProvider
  ): Promise<ComplianceCheckResult> {
    try {
      // Mock country mapping - in real implementation this would come from provider config
      const countryMap: Record<MobileMoneyProvider, string> = {
        [MobileMoneyProvider.MPESA]: 'KE',
        [MobileMoneyProvider.MTN_MONEY]: 'GH',
        [MobileMoneyProvider.ORANGE_MONEY]: 'CI',
        [MobileMoneyProvider.AIRTEL_MONEY]: 'UG',
        [MobileMoneyProvider.ECOCASH]: 'ZW',
        [MobileMoneyProvider.TIGO_PESA]: 'TZ',
        [MobileMoneyProvider.VODAFONE_CASH]: 'GH',
        [MobileMoneyProvider.ORANGE_CASH]: 'SN'
      };
      const country = countryMap[provider] || 'KE';
      const thresholds = this.complianceThresholds[country as keyof typeof this.complianceThresholds];
      
      if (!thresholds) {
        return {
          type: 'country_requirements',
          status: ComplianceStatus.PENDING_REVIEW,
          description: `Country ${country} compliance rules not configured`,
          violations: [`Unsupported country: ${country}`]
        };
      }

      // Mock validation - in real implementation would check actual regulatory requirements
      const violations: string[] = [];

      // Check if transaction requires additional documentation
      if (transaction.amount && transaction.amount > thresholds.kycRequired) {
        if (!this.hasRequiredDocuments(transaction, thresholds.requiresIds)) {
          violations.push(`Transaction above ${thresholds.kycRequired} requires additional ID verification`);
        }
      }

      return {
        type: 'country_requirements',
        status: violations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        description: `${country} regulatory requirements validation`,
        violations: violations
      };

    } catch (error) {
      this.logger.warn('Country requirements check failed', { error: (error as Error).message });
      return {
        type: 'country_requirements',
        status: ComplianceStatus.VIOLATION,
        description: 'Failed to validate country requirements',
        violations: ['Country requirements validation error']
      };
    }
  }

  /**
   * Validate KYC requirements
   */
  private async validateKYCRequirements(
    transaction: Partial<MobileMoneyTransaction>
  ): Promise<ComplianceCheckResult> {
    try {
      const violations: string[] = [];

      // Mock KYC status check - in real implementation would query user's KYC status
      const possibleStatuses = [KYCStatus.VERIFIED, KYCStatus.PENDING, KYCStatus.REJECTED, KYCStatus.EXPIRED];
      const mockKycStatus = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];

      if (mockKycStatus === KYCStatus.PENDING) {
        violations.push('User KYC verification is pending');
      } else if (mockKycStatus === KYCStatus.REJECTED) {
        violations.push('User KYC verification was rejected');
      } else if (mockKycStatus === KYCStatus.EXPIRED) {
        violations.push('User KYC verification has expired');
      }

      return {
        type: 'kyc_requirements',
        status: violations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        description: 'KYC verification status check',
        violations: violations
      };

    } catch (error) {
      this.logger.warn('KYC requirements check failed', { error: (error as Error).message });
      return {
        type: 'kyc_requirements',
        status: ComplianceStatus.VIOLATION,
        description: 'Failed to validate KYC requirements',
        violations: ['KYC validation error']
      };
    }
  }

  /**
   * Validate transaction limits
   */
  private async validateTransactionLimits(
    transaction: Partial<MobileMoneyTransaction>
  ): Promise<ComplianceCheckResult> {
    try {
      const violations: string[] = [];

      if (!transaction.amount || !transaction.userId) {
        return {
          type: 'transaction_limits',
          status: ComplianceStatus.COMPLIANT,
          description: 'Transaction limits validation skipped - insufficient data'
        };
      }

      // Mock limits check - in real implementation would query actual user limits
      const mockDailyUsage = 50000; // Mock daily usage
      const mockMonthlyUsage = 500000; // Mock monthly usage
      const mockDailyLimit = 1000000; // Mock daily limit
      const mockMonthlyLimit = 5000000; // Mock monthly limit

      if (mockDailyUsage + transaction.amount > mockDailyLimit) {
        violations.push(`Transaction would exceed daily limit of ${mockDailyLimit}`);
      }

      if (mockMonthlyUsage + transaction.amount > mockMonthlyLimit) {
        violations.push(`Transaction would exceed monthly limit of ${mockMonthlyLimit}`);
      }

      return {
        type: 'transaction_limits',
        status: violations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        description: 'Transaction limits validation',
        violations: violations
      };

    } catch (error) {
      this.logger.warn('Transaction limits check failed', { error: (error as Error).message });
      return {
        type: 'transaction_limits',
        status: ComplianceStatus.VIOLATION,
        description: 'Failed to validate transaction limits',
        violations: ['Transaction limits validation error']
      };
    }
  }

  /**
   * Perform sanctions screening
   */
  private async performSanctionsScreening(
    transaction: Partial<MobileMoneyTransaction>
  ): Promise<ComplianceCheckResult> {
    try {
      const violations: string[] = [];

      // Mock sanctions screening - in real implementation would check against sanctions lists
      const isOnSanctionsList = false; // Mock result

      if (isOnSanctionsList) {
        violations.push('User or transaction appears on sanctions list');
      }

      return {
        type: 'sanctions_screening',
        status: violations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        description: 'Sanctions list screening',
        violations: violations
      };

    } catch (error) {
      this.logger.warn('Sanctions screening failed', { error: (error as Error).message });
      return {
        type: 'sanctions_screening',
        status: ComplianceStatus.VIOLATION,
        description: 'Failed to perform sanctions screening',
        violations: ['Sanctions screening error']
      };
    }
  }

  /**
   * Validate AML requirements
   */
  private async validateAMLRequirements(
    transaction: Partial<MobileMoneyTransaction>
  ): Promise<ComplianceCheckResult> {
    try {
      const violations: string[] = [];

      // Mock AML validation - in real implementation would perform comprehensive AML checks
      const suspiciousActivityDetected = false; // Mock result

      if (suspiciousActivityDetected) {
        violations.push('Suspicious activity pattern detected - AML review required');
      }

      return {
        type: 'aml_requirements',
        status: violations.length > 0 ? ComplianceStatus.VIOLATION : ComplianceStatus.COMPLIANT,
        description: 'Anti-Money Laundering validation',
        violations: violations
      };

    } catch (error) {
      this.logger.warn('AML requirements check failed', { error: (error as Error).message });
      return {
        type: 'aml_requirements',
        status: ComplianceStatus.VIOLATION,
        description: 'Failed to validate AML requirements',
        violations: ['AML validation error']
      };
    }
  }

  /**
   * Check if user has required documents
   */
  private hasRequiredDocuments(
    transaction: Partial<MobileMoneyTransaction>,
    requiredIds: string[]
  ): boolean {
    // Mock implementation - would check user's document verification status
    return true; // Assume user has required documents
  }
}