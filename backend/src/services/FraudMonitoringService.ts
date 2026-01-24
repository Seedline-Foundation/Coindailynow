/**
 * FraudMonitoringService - Detect and Prevent Fraudulent Activities
 * 
 * Real-time fraud detection system that monitors:
 * - Suspicious withdrawal patterns
 * - Multiple failed OTP attempts
 * - Unusual transaction amounts/frequencies
 * - IP address changes and geographic anomalies
 * - Velocity checks (rapid successive transactions)
 * - Auto-locks wallets when thresholds exceeded
 */

import { PrismaClient, TransactionType, User, Wallet, WalletType } from '@prisma/client';
import { logger } from '../utils/logger';
import { financeAuditService, AuditAction } from './FinanceAuditService';
import { financeEmailService } from './FinanceEmailService';
import { Request } from 'express';

const prisma = new PrismaClient();

// ============================================================================
// FRAUD DETECTION CONFIGURATION
// ============================================================================

const FRAUD_THRESHOLDS = {
  // OTP failures
  maxFailedOTP: parseInt(process.env.MAX_FAILED_OTP || '5'),
  otpFailureWindow: 15 * 60 * 1000, // 15 minutes

  // Withdrawal limits
  maxWithdrawalAmount: parseFloat(process.env.MAX_WITHDRAWAL_AMOUNT || '50000'),
  maxDailyWithdrawals: parseInt(process.env.MAX_DAILY_WITHDRAWALS || '10'),
  maxWithdrawalFrequency: 5, // Max withdrawals per hour

  // Transaction velocity
  maxTransactionsPerMinute: 10,
  maxTransactionsPerHour: 50,
  maxDailyTransactionAmount: 100000,

  // Geographic anomalies
  ipChangeThreshold: 2, // Max IP changes per day
  suspiciousCountries: ['XX', 'YY'], // Placeholder - add high-risk countries

  // Amount-based alerts
  largeTransactionThreshold: 10000,
  unusualAmountVariance: 3, // Standard deviations from user's average

  // Time-based patterns
  nightTimeTransactionThreshold: 5000, // Suspicious if > $5k between 12am-6am
};

// ============================================================================
// TYPES
// ============================================================================

export interface FraudCheck {
  passed: boolean;
  riskScore: number; // 0-100
  reasons: string[];
  shouldLock: boolean;
  shouldAlert: boolean;
}

export interface TransactionAnalysis {
  userId: string;
  transactionType: TransactionType;
  amount: number;
  ipAddress: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserRiskProfile {
  userId: string;
  riskScore: number;
  flags: string[];
  lastActivity: Date;
  suspiciousActivityCount: number;
  walletLocked: boolean;
}

// ============================================================================
// FRAUD MONITORING SERVICE
// ============================================================================

export class FraudMonitoringService {
  private failedOTPAttempts: Map<string, { count: number; resetTime: number }> = new Map();
  private transactionVelocity: Map<string, number[]> = new Map(); // userId -> timestamps
  private ipChangeTracking: Map<string, string[]> = new Map(); // userId -> IP addresses

  /**
   * Helper: Get user's wallet ID
   */
  private async getUserWalletId(userId: string): Promise<string | null> {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, walletType: WalletType.USER_WALLET },
      select: { id: true },
    });
    return wallet?.id || null;
  }

  /**
   * Analyze transaction for fraud indicators
   */
  async analyzeTransaction(analysis: TransactionAnalysis): Promise<FraudCheck> {
    const checks: FraudCheck = {
      passed: true,
      riskScore: 0,
      reasons: [],
      shouldLock: false,
      shouldAlert: false,
    };

    try {
      // 1. Check withdrawal limits
      if (analysis.transactionType === TransactionType.WITHDRAWAL) {
        await this.checkWithdrawalLimits(analysis, checks);
      }

      // 2. Check transaction velocity
      await this.checkTransactionVelocity(analysis, checks);

      // 3. Check transaction amount anomalies
      await this.checkAmountAnomaly(analysis, checks);

      // 4. Check time-based patterns
      await this.checkTimingPattern(analysis, checks);

      // 5. Check IP address changes
      await this.checkIPAnomaly(analysis, checks);

      // 6. Check user risk profile
      await this.checkUserRiskProfile(analysis, checks);

      // Calculate final risk score
      checks.passed = checks.riskScore < 70;
      checks.shouldLock = checks.riskScore >= 85;
      checks.shouldAlert = checks.riskScore >= 60;

      // Log if suspicious
      if (checks.riskScore > 50) {
        logger.warn(`Suspicious transaction detected: User ${analysis.userId}, Risk Score: ${checks.riskScore}`);
      }

      return checks;
    } catch (error) {
      logger.error('Error analyzing transaction for fraud:', error);
      // Fail-safe: Allow transaction but log error
      return checks;
    }
  }

  /**
   * Check withdrawal limits and patterns
   */
  private async checkWithdrawalLimits(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    // Check single withdrawal amount
    if (analysis.amount > FRAUD_THRESHOLDS.maxWithdrawalAmount) {
      checks.riskScore += 30;
      checks.reasons.push(`Withdrawal amount exceeds limit: $${analysis.amount} > $${FRAUD_THRESHOLDS.maxWithdrawalAmount}`);
    }

    // Get user's wallet ID first
    const userWallet = await prisma.wallet.findFirst({
      where: { userId: analysis.userId, walletType: WalletType.USER_WALLET },
      select: { id: true },
    });

    if (!userWallet) return;

    // Check daily withdrawal count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawals = await prisma.walletTransaction.count({
      where: {
        fromWalletId: userWallet.id,
        transactionType: 'WITHDRAWAL' as any,
        createdAt: { gte: today },
      },
    });

    if (dailyWithdrawals >= FRAUD_THRESHOLDS.maxDailyWithdrawals) {
      checks.riskScore += 25;
      checks.reasons.push(`Daily withdrawal limit exceeded: ${dailyWithdrawals} withdrawals`);
    }

    // Check hourly withdrawal frequency
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyWithdrawals = await prisma.walletTransaction.count({
      where: {
        fromWalletId: userWallet.id,
        transactionType: 'WITHDRAWAL' as any,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (hourlyWithdrawals >= FRAUD_THRESHOLDS.maxWithdrawalFrequency) {
      checks.riskScore += 35;
      checks.reasons.push(`Withdrawal frequency too high: ${hourlyWithdrawals} withdrawals in past hour`);
    }
  }

  /**
   * Check transaction velocity (rapid successive transactions)
   */
  private async checkTransactionVelocity(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    const now = Date.now();
    const userId = analysis.userId;

    // Initialize or get existing velocity data
    if (!this.transactionVelocity.has(userId)) {
      this.transactionVelocity.set(userId, []);
    }

    const timestamps = this.transactionVelocity.get(userId)!;

    // Remove timestamps older than 1 hour
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);

    // Add current transaction
    recentTimestamps.push(now);
    this.transactionVelocity.set(userId, recentTimestamps);

    // Check velocity thresholds
    const oneMinuteAgo = now - 60 * 1000;
    const transactionsLastMinute = recentTimestamps.filter(ts => ts > oneMinuteAgo).length;

    if (transactionsLastMinute > FRAUD_THRESHOLDS.maxTransactionsPerMinute) {
      checks.riskScore += 40;
      checks.reasons.push(`Transaction velocity too high: ${transactionsLastMinute} transactions per minute`);
    }

    if (recentTimestamps.length > FRAUD_THRESHOLDS.maxTransactionsPerHour) {
      checks.riskScore += 30;
      checks.reasons.push(`Too many transactions per hour: ${recentTimestamps.length}`);
    }
  }

  /**
   * Check for unusual transaction amounts
   */
  private async checkAmountAnomaly(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    // Check for large transactions
    if (analysis.amount > FRAUD_THRESHOLDS.largeTransactionThreshold) {
      checks.riskScore += 20;
      checks.reasons.push(`Large transaction amount: $${analysis.amount}`);
    }

    // Get user's wallet ID first
    const userWalletId = await this.getUserWalletId(analysis.userId);
    if (!userWalletId) return;

    // Get user's historical transaction average
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const historicalTransactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { fromWalletId: userWalletId },
          { toWalletId: userWalletId },
        ],
        transactionType: analysis.transactionType as any,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true },
    });

    if (historicalTransactions.length >= 10) {
      const amounts = historicalTransactions.map(tx => tx);
      const avg = amounts.reduce((sum, amt) => sum + amt.amount, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sum, amt) => sum + Math.pow(amt.amount - avg, 2), 0) / amounts.length
      );

      // Check if current amount is unusual
      const zScore = Math.abs((analysis.amount - avg) / (stdDev || 1));
      if (zScore > FRAUD_THRESHOLDS.unusualAmountVariance) {
        checks.riskScore += 25;
        checks.reasons.push(
          `Unusual transaction amount: $${analysis.amount} (${zScore.toFixed(2)} std devs from average)`
        );
      }
    }

    // Check daily transaction volume
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's wallet ID
    const walletId = await this.getUserWalletId(analysis.userId);
    if (!walletId) return;

    const dailyVolume = await prisma.walletTransaction.aggregate({
      where: {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ],
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });

    const totalDaily = (dailyVolume._sum?.amount || 0) + analysis.amount;
    if (totalDaily > FRAUD_THRESHOLDS.maxDailyTransactionAmount) {
      checks.riskScore += 30;
      checks.reasons.push(`Daily transaction volume exceeded: $${totalDaily}`);
    }
  }

  /**
   * Check time-based patterns (e.g., night transactions)
   */
  private async checkTimingPattern(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    const hour = analysis.timestamp.getHours();

    // Night-time transactions (12am - 6am)
    if (hour >= 0 && hour < 6) {
      if (analysis.amount > FRAUD_THRESHOLDS.nightTimeTransactionThreshold) {
        checks.riskScore += 20;
        checks.reasons.push(`Large night-time transaction: $${analysis.amount} at ${hour}:00`);
      }
    }

    // Get user's wallet ID
    const userWalletId = await this.getUserWalletId(analysis.userId);
    if (!userWalletId) return;

    // Check for unusual transaction times for this user
    const userTransactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { fromWalletId: userWalletId },
          { toWalletId: userWalletId },
        ],
      },
      select: { createdAt: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const userTypicalHours = userTransactions.map(tx => tx.createdAt.getHours());
    const isTypicalHour = userTypicalHours.includes(hour);

    if (!isTypicalHour && userTransactions.length > 20) {
      checks.riskScore += 15;
      checks.reasons.push(`Transaction at unusual time for user: ${hour}:00`);
    }
  }

  /**
   * Check for IP address anomalies
   */
  private async checkIPAnomaly(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    const userId = analysis.userId;
    const currentIP = analysis.ipAddress;

    // Initialize or get IP history
    if (!this.ipChangeTracking.has(userId)) {
      this.ipChangeTracking.set(userId, []);
    }

    const ipHistory = this.ipChangeTracking.get(userId)!;

    // Check if this is a new IP
    if (!ipHistory.includes(currentIP)) {
      ipHistory.push(currentIP);
      this.ipChangeTracking.set(userId, ipHistory);

      // Check for too many IP changes today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ipChangesToday = ipHistory.slice(-FRAUD_THRESHOLDS.ipChangeThreshold - 1);
      if (ipChangesToday.length > FRAUD_THRESHOLDS.ipChangeThreshold) {
        checks.riskScore += 25;
        checks.reasons.push(`Multiple IP address changes: ${ipChangesToday.length} different IPs`);
      }

      // Alert on first IP change
      checks.riskScore += 10;
      checks.reasons.push(`New IP address detected: ${currentIP}`);
    }
  }

  /**
   * Check user's overall risk profile
   */
  private async checkUserRiskProfile(
    analysis: TransactionAnalysis,
    checks: FraudCheck
  ): Promise<void> {
    const profile = await this.getUserRiskProfile(analysis.userId);

    if (profile.walletLocked) {
      checks.riskScore += 100; // Instant fail
      checks.reasons.push('Wallet is locked');
      return;
    }

    if (profile.suspiciousActivityCount > 5) {
      checks.riskScore += 30;
      checks.reasons.push(`User has ${profile.suspiciousActivityCount} previous suspicious activities`);
    }

    if (profile.riskScore > 70) {
      checks.riskScore += 25;
      checks.reasons.push(`User's overall risk score is high: ${profile.riskScore}`);
    }
  }

  /**
   * Track failed OTP attempt
   */
  async trackFailedOTP(userId: string): Promise<{ shouldLock: boolean; attemptsRemaining: number }> {
    const now = Date.now();
    const key = userId;

    // Initialize or get existing data
    if (!this.failedOTPAttempts.has(key) || this.failedOTPAttempts.get(key)!.resetTime < now) {
      this.failedOTPAttempts.set(key, {
        count: 0,
        resetTime: now + FRAUD_THRESHOLDS.otpFailureWindow,
      });
    }

    const data = this.failedOTPAttempts.get(key)!;
    data.count++;

    const shouldLock = data.count >= FRAUD_THRESHOLDS.maxFailedOTP;
    const attemptsRemaining = Math.max(0, FRAUD_THRESHOLDS.maxFailedOTP - data.count);

    if (shouldLock) {
      logger.warn(`User ${userId} exceeded max failed OTP attempts: ${data.count}`);
    }

    return { shouldLock, attemptsRemaining };
  }

  /**
   * Auto-lock wallet after fraud detection
   */
  async autoLockWallet(
    userId: string,
    reason: string,
    req: Request,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      // Find user's primary wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId, walletType: WalletType.USER_WALLET },
        include: { user: true },
      });

      if (!wallet || !wallet.user) {
        logger.error(`Cannot lock wallet: No wallet or user found for user ${userId}`);
        return;
      }

      // Lock wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { status: 'LOCKED' as any },
      });

      // Log audit event
      await financeAuditService.logSecurityEvent(
        userId,
        AuditAction.WALLET_LOCKED,
        {
          reason,
          auto_locked: true,
          ...details,
        },
        req
      );

      // Send security alert email
      await financeEmailService.sendSecurityAlert(wallet.user.email, {
        username: wallet.user.username,
        alertType: 'wallet_locked',
        message: `Your wallet has been locked due to: ${reason}`,
        timestamp: new Date(),
        ipAddress: this.getClientIP(req),
        actionRequired: 'Please contact support to unlock your wallet.',
      });

      logger.info(`Wallet auto-locked for user ${userId}: ${reason}`);
    } catch (error) {
      logger.error('Error auto-locking wallet:', error);
    }
  }

  /**
   * Get user's risk profile
   */
  async getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count suspicious activities
    const suspiciousLogs = await prisma.auditLog.count({
      where: {
        adminId: userId,
        action: {
          in: ['suspicious_activity_detected', 'fraud_alert_triggered', 'otp_failed'],
        },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Check wallet status
    const wallet = await prisma.wallet.findFirst({
      where: { userId, walletType: WalletType.USER_WALLET },
    });

    if (!wallet) {
      return {
        userId,
        riskScore: 0,
        flags: ['No wallet found'],
        lastActivity: new Date(),
        suspiciousActivityCount: 0,
        walletLocked: false,
      };
    }

    // Get last activity
    const lastTransaction = await prisma.walletTransaction.findFirst({
      where: {
        OR: [
          { fromWalletId: wallet.id },
          { toWalletId: wallet.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate risk score
    let riskScore = 0;
    const flags: string[] = [];

    if (suspiciousLogs > 5) {
      riskScore += 40;
      flags.push('Multiple suspicious activities');
    }

    if (wallet?.status === 'LOCKED') {
      riskScore += 100;
      flags.push('Wallet locked');
    }

    return {
      userId,
      riskScore,
      flags,
      lastActivity: lastTransaction?.createdAt || new Date(),
      suspiciousActivityCount: suspiciousLogs,
      walletLocked: wallet?.status === 'LOCKED',
    };
  }

  /**
   * Get fraud statistics for admin dashboard
   */
  async getFraudStatistics(days: number = 7): Promise<{
    totalAlertsTriggered: number;
    walletsLocked: number;
    flaggedTransactions: number;
    averageRiskScore: number;
    topRiskUsers: Array<{ userId: string; username: string; riskScore: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await prisma.auditLog.count({
      where: {
        action: {
          in: ['suspicious_activity_detected', 'fraud_alert_triggered'],
        },
        timestamp: { gte: startDate },
      },
    });

    const walletsLocked = await prisma.auditLog.count({
      where: {
        action: 'wallet_locked',
        timestamp: { gte: startDate },
      },
    });

    // Get top risk users
    const users = await prisma.user.findMany({
      take: 100,
      select: { id: true, username: true },
    });

    const userRiskProfiles = await Promise.all(
      users.map(async user => ({
        userId: user.id,
        username: user.username,
        riskScore: (await this.getUserRiskProfile(user.id)).riskScore,
      }))
    );

    const topRiskUsers = userRiskProfiles
      .filter(profile => profile.riskScore > 50)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    const avgRiskScore =
      userRiskProfiles.reduce((sum, p) => sum + p.riskScore, 0) / userRiskProfiles.length;

    return {
      totalAlertsTriggered: alerts,
      walletsLocked,
      flaggedTransactions: alerts, // Simplified
      averageRiskScore: avgRiskScore,
      topRiskUsers,
    };
  }

  /**
   * Helper: Get client IP from request
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0]?.trim();
      return ip || req.ip || req.socket.remoteAddress || '127.0.0.1';
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  /**
   * Clean up old tracking data (run periodically)
   */
  cleanup(): void {
    const now = Date.now();

    // Clean failed OTP attempts
    for (const [key, data] of this.failedOTPAttempts.entries()) {
      if (data.resetTime < now) {
        this.failedOTPAttempts.delete(key);
      }
    }

    // Clean transaction velocity (keep only last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    for (const [userId, timestamps] of this.transactionVelocity.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > oneDayAgo);
      if (recentTimestamps.length === 0) {
        this.transactionVelocity.delete(userId);
      } else {
        this.transactionVelocity.set(userId, recentTimestamps);
      }
    }

    // Clean IP tracking (keep only last 30 days worth)
    for (const [userId, ips] of this.ipChangeTracking.entries()) {
      if (ips.length > 30) {
        this.ipChangeTracking.set(userId, ips.slice(-30));
      }
    }

    logger.debug('Fraud monitoring cleanup completed');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const fraudMonitoringService = new FraudMonitoringService();

// Auto-cleanup every hour
setInterval(() => {
  fraudMonitoringService.cleanup();
}, 60 * 60 * 1000);
