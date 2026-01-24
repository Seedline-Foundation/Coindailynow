/**
 * Fraud Detection Service
 * Task 15: Mobile Money Integration - Fraud Detection Component
 * 
 * Analyzes transactions for fraud indicators and risk assessment
 */

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import {
  FraudAnalysis,
  FraudFlag,
  FraudRiskLevel,
  FraudDetectionRules,
  MobileMoneyTransaction
} from '../types/mobile-money';
import { IMobileMoneyFraudDetector } from './interfaces/mobile-money.interface';

export class FraudDetectionService implements IMobileMoneyFraudDetector {
  private readonly prisma: PrismaClient;
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly rules: FraudDetectionRules;

  constructor(prisma: PrismaClient, redis: Redis, logger: Logger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
    
    // Default fraud detection rules - configurable
    this.rules = {
      maxDailyTransactions: 10,
      maxDailyAmount: 100000, // in cents ($1000)
      maxMonthlyAmount: 500000, // in cents ($5000)
      velocityCheckMinutes: 15,
      maxVelocityTransactions: 3,
      suspiciousPatterns: [
        'round_amounts_only',
        'rapid_succession',
        'unusual_hours',
        'new_device'
      ],
      blockedPhoneNumbers: [],
      blockedCountries: []
    };
  }

  async analyze(transaction: Partial<MobileMoneyTransaction>): Promise<FraudAnalysis> {
    const analysisId = `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.logger.info('Starting fraud analysis', {
        analysisId,
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount
      });

      const flags: FraudFlag[] = [];
      let riskScore = 0;

      // Check velocity rules
      const velocityCheck = await this.checkVelocity(
        transaction.userId!,
        transaction.phoneNumber!,
        this.rules.velocityCheckMinutes
      );

      if (velocityCheck.exceedsLimit) {
        flags.push({
          type: 'velocity_exceeded',
          severity: 'high',
          description: `Too many transactions in ${this.rules.velocityCheckMinutes} minutes`,
          details: {
            count: velocityCheck.transactionCount,
            limit: this.rules.maxVelocityTransactions,
            amount: velocityCheck.totalAmount
          }
        });
        riskScore += 30;
      }

      // Check daily/monthly limits
      const limitsCheck = await this.checkLimits(
        transaction.userId!,
        transaction.amount!,
        transaction.currency!
      );

      if (limitsCheck.exceedsDailyLimit) {
        flags.push({
          type: 'daily_limit_exceeded',
          severity: 'medium',
          description: 'Daily transaction limit exceeded',
          details: {
            dailyUsed: limitsCheck.dailyUsed,
            dailyLimit: this.rules.maxDailyAmount,
            currentTransaction: transaction.amount
          }
        });
        riskScore += 20;
      }

      if (limitsCheck.exceedsMonthlyLimit) {
        flags.push({
          type: 'monthly_limit_exceeded',
          severity: 'high',
          description: 'Monthly transaction limit exceeded',
          details: {
            monthlyUsed: limitsCheck.monthlyUsed,
            monthlyLimit: this.rules.maxMonthlyAmount,
            currentTransaction: transaction.amount
          }
        });
        riskScore += 25;
      }

      // Check blocked phone number
      const isBlocked = await this.isPhoneNumberBlocked(transaction.phoneNumber!);
      if (isBlocked) {
        flags.push({
          type: 'blocked_phone_number',
          severity: 'critical',
          description: 'Phone number is on blocked list',
          details: { phoneNumber: transaction.phoneNumber }
        });
        riskScore += 50;
      }

      // Check for suspicious patterns
      const patternFlags = await this.checkSuspiciousPatterns(transaction);
      flags.push(...patternFlags);
      riskScore += patternFlags.reduce((sum, flag) => {
        switch (flag.severity) {
          case 'low': return sum + 5;
          case 'medium': return sum + 15;
          case 'high': return sum + 25;
          case 'critical': return sum + 40;
          default: return sum;
        }
      }, 0);

      // Determine risk level and recommendation
      let riskLevel: FraudRiskLevel;
      let recommendation: 'approve' | 'review' | 'decline';
      let reason: string;

      if (riskScore >= 70) {
        riskLevel = FraudRiskLevel.CRITICAL;
        recommendation = 'decline';
        reason = 'Critical fraud risk detected - automatic decline';
      } else if (riskScore >= 40) {
        riskLevel = FraudRiskLevel.HIGH;
        recommendation = 'review';
        reason = 'High fraud risk - manual review required';
      } else if (riskScore >= 20) {
        riskLevel = FraudRiskLevel.MEDIUM;
        recommendation = 'review';
        reason = 'Medium fraud risk - caution advised';
      } else {
        riskLevel = FraudRiskLevel.LOW;
        recommendation = 'approve';
        reason = 'Low fraud risk - transaction approved';
      }

      // Create fraud analysis record
      const analysis: FraudAnalysis = {
        transactionId: transaction.id || '',
        riskLevel,
        riskScore: Math.min(100, Math.max(0, riskScore)), // Clamp to 0-100
        flags,
        recommendation,
        reason,
        analyzedAt: new Date()
      };

      // Mock database storage - in production would save to database
      await this.redis.setex(
        `fraud_analysis:${analysisId}`,
        3600, // 1 hour cache
        JSON.stringify(analysis)
      );

      this.logger.info('Fraud analysis completed', {
        analysisId,
        transactionId: transaction.id,
        riskLevel,
        riskScore: analysis.riskScore,
        recommendation,
        flagsCount: flags.length
      });

      return analysis;

    } catch (error: any) {
      this.logger.error('Fraud analysis failed', {
        analysisId,
        transactionId: transaction.id,
        error: error.message,
        stack: error.stack
      });

      // Return safe defaults on error
      return {
        transactionId: transaction.id || '',
        riskLevel: FraudRiskLevel.HIGH,
        riskScore: 50,
        flags: [{
          type: 'analysis_error',
          severity: 'medium',
          description: 'Fraud analysis encountered an error - flagged for review',
          details: { error: error.message }
        }],
        recommendation: 'review',
        reason: 'Fraud analysis error - manual review required',
        analyzedAt: new Date()
      };
    }
  }

  async checkVelocity(userId: string, phoneNumber: string, timeWindowMinutes: number): Promise<{
    transactionCount: number;
    totalAmount: number;
    exceedsLimit: boolean;
  }> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      // Mock velocity check - in production would query real database
      const transactions: any[] = [];

      const transactionCount = transactions.length;
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const exceedsLimit = transactionCount > this.rules.maxVelocityTransactions;

      this.logger.debug('Velocity check completed', {
        userId,
        phoneNumber,
        transactionCount,
        totalAmount,
        exceedsLimit,
        timeWindowMinutes
      });

      return { transactionCount, totalAmount, exceedsLimit };

    } catch (error: any) {
      this.logger.error('Velocity check failed', {
        userId,
        phoneNumber,
        error: error.message
      });
      
      return {
        transactionCount: 0,
        totalAmount: 0,
        exceedsLimit: false
      };
    }
  }

  async isPhoneNumberBlocked(phoneNumber: string): Promise<boolean> {
    try {
      // Check against blocked list
      if (this.rules.blockedPhoneNumbers.includes(phoneNumber)) {
        return true;
      }

      // Check Redis cache for dynamic blocks
      const blocked = await this.redis.get(`blocked_phone_${phoneNumber}`);
      return blocked === 'true';

    } catch (error: any) {
      this.logger.error('Phone number block check failed', {
        phoneNumber,
        error: error.message
      });
      return false;
    }
  }

  async checkLimits(userId: string, amount: number, currency: string): Promise<{
    dailyUsed: number;
    monthlyUsed: number;
    exceedsDailyLimit: boolean;
    exceedsMonthlyLimit: boolean;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Mock daily usage - in production would query real database
      const dailyTransactions: any[] = [];

      const dailyUsed = dailyTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);

      // Mock monthly usage - in production would query real database  
      const monthlyTransactions: any[] = [];

      const monthlyUsed = monthlyTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);

      const exceedsDailyLimit = (dailyUsed + amount) > this.rules.maxDailyAmount;
      const exceedsMonthlyLimit = (monthlyUsed + amount) > this.rules.maxMonthlyAmount;

      return {
        dailyUsed,
        monthlyUsed,
        exceedsDailyLimit,
        exceedsMonthlyLimit
      };

    } catch (error: any) {
      this.logger.error('Limits check failed', {
        userId,
        amount,
        currency,
        error: error.message
      });

      return {
        dailyUsed: 0,
        monthlyUsed: 0,
        exceedsDailyLimit: false,
        exceedsMonthlyLimit: false
      };
    }
  }

  async updateRules(rules: Partial<FraudDetectionRules>): Promise<void> {
    try {
      Object.assign(this.rules, rules);
      
      // Cache updated rules
      await this.redis.setex('fraud_detection_rules', 3600, JSON.stringify(this.rules));
      
      this.logger.info('Fraud detection rules updated', { rules });
    } catch (error: any) {
      this.logger.error('Failed to update fraud detection rules', {
        error: error.message,
        rules
      });
      throw error;
    }
  }

  private async checkSuspiciousPatterns(transaction: Partial<MobileMoneyTransaction>): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = [];

    try {
      // Mock round amounts check - in production would query real database
      if (transaction.amount && transaction.amount % 1000 === 0) {
        const recentRoundAmounts = 0; // Mock value

        if (recentRoundAmounts >= 3) {
          flags.push({
            type: 'round_amounts_pattern',
            severity: 'medium',
            description: 'Multiple round amount transactions detected',
            details: { recentCount: recentRoundAmounts, amount: transaction.amount }
          });
        }
      }

      // Check for unusual hours (late night transactions)
      const hour = new Date().getHours();
      if (hour >= 23 || hour <= 5) {
        flags.push({
          type: 'unusual_hours',
          severity: 'low',
          description: 'Transaction during unusual hours',
          details: { hour }
        });
      }

      // Additional pattern checks can be added here

    } catch (error: any) {
      this.logger.error('Pattern check failed', {
        transactionId: transaction.id,
        error: error.message
      });
    }

    return flags;
  }
}