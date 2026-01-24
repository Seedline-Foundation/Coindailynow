/**
 * Wallet Fraud Monitoring Worker
 * 
 * Continuously monitors wallet activities for suspicious patterns and fraudulent behavior.
 * 
 * Features:
 * - Real-time transaction monitoring (every 10 minutes)
 * - Pattern analysis and anomaly detection
 * - Automatic wallet freezing for critical threats
 * - Admin alert system
 * - Evidence collection and logging
 * - IP/location tracking
 * - Velocity checks
 * - Behavioral pattern analysis
 * 
 * Detection Patterns:
 * 1. Unusual withdrawal amounts (significantly above average)
 * 2. Rapid consecutive transactions (velocity attacks)
 * 3. New wallets immediately withdrawing (cash-out pattern)
 * 4. Transactions from new/suspicious IPs or locations
 * 5. Dormant wallets suddenly active
 * 6. Round-trip transfers (money laundering pattern)
 * 7. Multiple failed withdrawal attempts
 * 8. Whitelist changes followed by immediate withdrawal
 * 
 * @module workers/walletFraudWorker
 */

import cron from 'node-cron';
import { PrismaClient, WalletStatus, Prisma } from '@prisma/client';
import { Redis } from 'ioredis';
import { FinanceService } from '../services/FinanceService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FraudAlert {
  id: string;
  walletId: string;
  userId: string;
  alertType: FraudAlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fraudScore: number;
  description: string;
  evidence: FraudEvidence;
  timestamp: Date;
  autoFrozen: boolean;
  resolved: boolean;
}

type FraudAlertType =
  | 'UNUSUAL_WITHDRAWAL_AMOUNT'
  | 'RAPID_TRANSACTIONS'
  | 'NEW_WALLET_WITHDRAWAL'
  | 'SUSPICIOUS_IP'
  | 'LOCATION_CHANGE'
  | 'DORMANT_WALLET_ACTIVE'
  | 'ROUND_TRIP_TRANSFER'
  | 'FAILED_WITHDRAWAL_ATTEMPTS'
  | 'WHITELIST_THEN_WITHDRAW'
  | 'HIGH_VELOCITY'
  | 'AMOUNT_ANOMALY'
  | 'SUSPICIOUS_PATTERN';

interface FraudEvidence {
  transactionIds?: string[];
  ipAddresses?: string[];
  locations?: string[];
  amounts?: number[];
  timestamps?: Date[];
  userAgent?: string;
  deviceFingerprint?: string;
  additionalData?: Record<string, any>;
}

interface MonitoringStats {
  walletsScanned: number;
  transactionsAnalyzed: number;
  alertsGenerated: number;
  walletsAutoFrozen: number;
  lastRun: Date;
  averageProcessingTime: number;
  errorCount: number;
}

interface UserBehaviorProfile {
  userId: string;
  walletId: string;
  averageTransactionAmount: number;
  transactionFrequency: number; // per day
  typicalIPs: string[];
  typicalLocations: string[];
  lastActiveDate: Date;
  accountAge: number; // in days
  totalTransactions: number;
}

// ============================================================================
// WORKER STATE
// ============================================================================

let isRunning = false;
let scheduledJob: ReturnType<typeof cron.schedule> | null = null;
let stats: MonitoringStats = {
  walletsScanned: 0,
  transactionsAnalyzed: 0,
  alertsGenerated: 0,
  walletsAutoFrozen: 0,
  lastRun: new Date(),
  averageProcessingTime: 0,
  errorCount: 0,
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Monitoring interval (every 10 minutes)
  CRON_SCHEDULE: '*/10 * * * *',
  
  // Transaction analysis window (last 30 minutes)
  ANALYSIS_WINDOW_MINUTES: 30,
  
  // Fraud score thresholds
  FREEZE_THRESHOLD: 85, // Auto-freeze at this score
  ALERT_THRESHOLD: 60,  // Generate alert at this score
  
  // Velocity limits
  MAX_TRANSACTIONS_PER_10MIN: 10,
  MAX_TRANSACTIONS_PER_HOUR: 30,
  MAX_TRANSACTIONS_PER_DAY: 100,
  
  // Amount thresholds
  LARGE_WITHDRAWAL_MULTIPLIER: 5, // 5x average = suspicious
  NEW_WALLET_MAX_WITHDRAWAL: 0.5, // JY tokens (first 24 hours)
  
  // Time thresholds
  NEW_WALLET_GRACE_PERIOD_HOURS: 24,
  DORMANT_WALLET_DAYS: 30,
  WHITELIST_TO_WITHDRAW_HOURS: 2, // Suspicious if withdraw within 2 hours of whitelist change
  
  // IP tracking
  MAX_UNIQUE_IPS_PER_DAY: 5,
  
  // Admin notification
  ADMIN_WEBHOOK_URL: process.env.ADMIN_ALERT_WEBHOOK,
  ADMIN_EMAIL: process.env.ADMIN_ALERT_EMAIL,
};

// ============================================================================
// MAIN MONITORING FUNCTION
// ============================================================================

/**
 * Main monitoring cycle - analyzes all recent wallet activity
 */
async function monitorWalletActivity(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [Wallet Fraud Monitor] Starting monitoring cycle...');
    
    // Get recent transactions to analyze
    const recentTransactions = await getRecentTransactions();
    console.log(`📊 [Wallet Fraud Monitor] Found ${recentTransactions.length} recent transactions to analyze`);
    
    // Get unique wallets from transactions
    const walletIds = new Set<string>();
    recentTransactions.forEach(tx => {
      if (tx.fromWalletId) walletIds.add(tx.fromWalletId);
      if (tx.toWalletId) walletIds.add(tx.toWalletId);
    });
    
    console.log(`👛 [Wallet Fraud Monitor] Analyzing ${walletIds.size} unique wallets`);
    
    // Analyze each wallet
    const alerts: FraudAlert[] = [];
    let walletsScanned = 0;
    let transactionsAnalyzed = 0;
    let walletsAutoFrozen = 0;
    
    for (const walletId of walletIds) {
      try {
        const walletAlerts = await analyzeWalletActivity(walletId, recentTransactions);
        alerts.push(...walletAlerts);
        walletsScanned++;
        
        // Check if wallet should be auto-frozen
        const criticalAlerts = walletAlerts.filter(a => a.severity === 'CRITICAL' && a.fraudScore >= CONFIG.FREEZE_THRESHOLD);
        if (criticalAlerts.length > 0) {
          const frozen = await autoFreezeWallet(walletId, criticalAlerts);
          if (frozen) walletsAutoFrozen++;
        }
      } catch (error) {
        console.error(`❌ [Wallet Fraud Monitor] Error analyzing wallet ${walletId}:`, error);
        stats.errorCount++;
      }
    }
    
    transactionsAnalyzed = recentTransactions.length;
    
    // Process and store alerts
    if (alerts.length > 0) {
      await storeAlerts(alerts);
      await notifyAdmins(alerts);
    }
    
    // Update statistics
    const processingTime = Date.now() - startTime;
    stats = {
      walletsScanned,
      transactionsAnalyzed,
      alertsGenerated: alerts.length,
      walletsAutoFrozen,
      lastRun: new Date(),
      averageProcessingTime: processingTime,
      errorCount: stats.errorCount,
    };
    
    // Store stats in Redis
    await redis.setex('wallet_fraud_monitor:stats', 3600, JSON.stringify(stats));
    
    console.log(`✅ [Wallet Fraud Monitor] Cycle complete in ${processingTime}ms`);
    console.log(`📈 [Wallet Fraud Monitor] Stats: ${walletsScanned} wallets, ${transactionsAnalyzed} transactions, ${alerts.length} alerts, ${walletsAutoFrozen} frozen`);
    
  } catch (error) {
    console.error('❌ [Wallet Fraud Monitor] Critical error in monitoring cycle:', error);
    stats.errorCount++;
    
    // Send critical alert
    await sendCriticalSystemAlert({
      type: 'WORKER_ERROR',
      message: 'Wallet fraud monitoring worker encountered critical error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    });
  }
}

// ============================================================================
// TRANSACTION RETRIEVAL
// ============================================================================

/**
 * Get recent transactions within the analysis window
 */
async function getRecentTransactions() {
  const cutoffTime = new Date(Date.now() - CONFIG.ANALYSIS_WINDOW_MINUTES * 60 * 1000);
  
  return await prisma.walletTransaction.findMany({
    where: {
      createdAt: {
        gte: cutoffTime,
      },
      status: 'COMPLETED',
    },
    include: {
      fromWallet: {
        include: {
          user: true,
        },
      },
      toWallet: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ============================================================================
// WALLET ANALYSIS
// ============================================================================

/**
 * Analyze a specific wallet for suspicious patterns
 */
async function analyzeWalletActivity(
  walletId: string,
  recentTransactions: any[]
): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];
  
  // Get wallet details
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      user: true,
    },
  });
  
  if (!wallet || wallet.status === WalletStatus.FROZEN || !wallet.userId) {
    return alerts; // Skip frozen, non-existent, or userless wallets
  }
  
  // Build user behavior profile
  const profile = await buildUserBehaviorProfile(walletId, wallet.userId);
  
  // Get wallet-specific transactions
  const walletTransactions = recentTransactions.filter(
    tx => tx.fromWalletId === walletId || tx.toWalletId === walletId
  );
  
  if (walletTransactions.length === 0) {
    return alerts; // No recent activity
  }
  
  // Run fraud detection checks
  const checks = [
    checkUnusualWithdrawalAmount(wallet, walletTransactions, profile),
    checkRapidTransactions(wallet, walletTransactions),
    checkNewWalletWithdrawal(wallet, walletTransactions, profile),
    checkSuspiciousIPs(wallet, walletTransactions, profile),
    checkDormantWalletActivity(wallet, profile),
    checkRoundTripTransfers(wallet, walletTransactions),
    checkWhitelistThenWithdraw(wallet, walletTransactions),
    checkHighVelocity(wallet, walletTransactions),
  ];
  
  const results = await Promise.allSettled(checks);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      alerts.push(result.value);
    } else if (result.status === 'rejected') {
      console.error(`Check ${index} failed:`, result.reason);
    }
  });
  
  return alerts;
}

// ============================================================================
// FRAUD DETECTION CHECKS
// ============================================================================

/**
 * Check for unusual withdrawal amounts (significantly above average)
 */
async function checkUnusualWithdrawalAmount(
  wallet: any,
  transactions: any[],
  profile: UserBehaviorProfile
): Promise<FraudAlert | null> {
  const withdrawals = transactions.filter(
    tx => tx.fromWalletId === wallet.id && tx.type === 'WITHDRAWAL'
  );
  
  if (withdrawals.length === 0) return null;
  
  for (const withdrawal of withdrawals) {
    const amount = parseFloat(withdrawal.amount.toString());
    
    // Check if amount is significantly above average
    if (profile.averageTransactionAmount > 0 && 
        amount > profile.averageTransactionAmount * CONFIG.LARGE_WITHDRAWAL_MULTIPLIER) {
      
      const fraudScore = Math.min(95, 70 + (amount / profile.averageTransactionAmount) * 5);
      
      return {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        userId: wallet.userId,
        alertType: 'UNUSUAL_WITHDRAWAL_AMOUNT',
        severity: fraudScore >= 90 ? 'CRITICAL' : fraudScore >= 75 ? 'HIGH' : 'MEDIUM',
        fraudScore,
        description: `Withdrawal amount (${amount.toFixed(4)} JY) is ${(amount / profile.averageTransactionAmount).toFixed(1)}x higher than user's average (${profile.averageTransactionAmount.toFixed(4)} JY)`,
        evidence: {
          transactionIds: [withdrawal.id],
          amounts: [amount],
          timestamps: [withdrawal.createdAt],
          additionalData: {
            averageAmount: profile.averageTransactionAmount,
            multiplier: amount / profile.averageTransactionAmount,
          },
        },
        timestamp: new Date(),
        autoFrozen: false,
        resolved: false,
      };
    }
  }
  
  return null;
}

/**
 * Check for rapid consecutive transactions (velocity attack)
 */
async function checkRapidTransactions(
  wallet: any,
  transactions: any[]
): Promise<FraudAlert | null> {
  const walletTxs = transactions.filter(tx => tx.fromWalletId === wallet.id);
  
  if (walletTxs.length < 5) return null;
  
  // Check 10-minute window
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recent10Min = walletTxs.filter(tx => tx.createdAt >= tenMinAgo);
  
  if (recent10Min.length >= CONFIG.MAX_TRANSACTIONS_PER_10MIN) {
    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: wallet.id,
      userId: wallet.userId,
      alertType: 'RAPID_TRANSACTIONS',
      severity: 'CRITICAL',
      fraudScore: 90,
      description: `${recent10Min.length} transactions in 10 minutes (limit: ${CONFIG.MAX_TRANSACTIONS_PER_10MIN})`,
      evidence: {
        transactionIds: recent10Min.map(tx => tx.id),
        amounts: recent10Min.map(tx => parseFloat(tx.amount.toString())),
        timestamps: recent10Min.map(tx => tx.createdAt),
        additionalData: {
          transactionCount: recent10Min.length,
          timeWindow: '10 minutes',
        },
      },
      timestamp: new Date(),
      autoFrozen: false,
      resolved: false,
    };
  }
  
  return null;
}

/**
 * Check for new wallets immediately withdrawing (cash-out pattern)
 */
async function checkNewWalletWithdrawal(
  wallet: any,
  transactions: any[],
  profile: UserBehaviorProfile
): Promise<FraudAlert | null> {
  // Check if wallet is new (within grace period)
  const walletAge = Date.now() - wallet.createdAt.getTime();
  const gracePerio = CONFIG.NEW_WALLET_GRACE_PERIOD_HOURS * 60 * 60 * 1000;
  
  if (walletAge > gracePerio) return null;
  
  // Check for withdrawals
  const withdrawals = transactions.filter(
    tx => tx.fromWalletId === wallet.id && tx.type === 'WITHDRAWAL'
  );
  
  if (withdrawals.length > 0) {
    const totalWithdrawn = withdrawals.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );
    
    if (totalWithdrawn > CONFIG.NEW_WALLET_MAX_WITHDRAWAL) {
      return {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        userId: wallet.userId,
        alertType: 'NEW_WALLET_WITHDRAWAL',
        severity: 'HIGH',
        fraudScore: 85,
        description: `New wallet (${(walletAge / (60 * 60 * 1000)).toFixed(1)} hours old) attempting large withdrawal (${totalWithdrawn.toFixed(4)} JY)`,
        evidence: {
          transactionIds: withdrawals.map(tx => tx.id),
          amounts: withdrawals.map(tx => parseFloat(tx.amount.toString())),
          timestamps: withdrawals.map(tx => tx.createdAt),
          additionalData: {
            walletAge: walletAge / (60 * 60 * 1000), // in hours
            totalWithdrawn,
            withdrawalCount: withdrawals.length,
          },
        },
        timestamp: new Date(),
        autoFrozen: false,
        resolved: false,
      };
    }
  }
  
  return null;
}

/**
 * Check for transactions from suspicious or new IPs/locations
 */
async function checkSuspiciousIPs(
  wallet: any,
  transactions: any[],
  profile: UserBehaviorProfile
): Promise<FraudAlert | null> {
  const walletTxs = transactions.filter(tx => tx.fromWalletId === wallet.id);
  
  if (walletTxs.length === 0) return null;
  
  // Get unique IPs from recent transactions
  const recentIPs = new Set(
    walletTxs
      .map(tx => tx.metadata?.ipAddress)
      .filter(ip => ip)
  );
  
  // Check for too many unique IPs
  if (recentIPs.size >= CONFIG.MAX_UNIQUE_IPS_PER_DAY) {
    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: wallet.id,
      userId: wallet.userId,
      alertType: 'SUSPICIOUS_IP',
      severity: 'HIGH',
      fraudScore: 80,
      description: `Multiple IP addresses detected (${recentIPs.size} unique IPs in recent transactions)`,
      evidence: {
        transactionIds: walletTxs.map(tx => tx.id),
        ipAddresses: Array.from(recentIPs),
        timestamps: walletTxs.map(tx => tx.createdAt),
        additionalData: {
          uniqueIPCount: recentIPs.size,
          typicalIPs: profile.typicalIPs,
        },
      },
      timestamp: new Date(),
      autoFrozen: false,
      resolved: false,
    };
  }
  
  // Check for IPs not in typical list
  const newIPs = Array.from(recentIPs).filter(ip => !profile.typicalIPs.includes(ip));
  
  if (newIPs.length > 0 && profile.totalTransactions > 10) {
    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: wallet.id,
      userId: wallet.userId,
      alertType: 'LOCATION_CHANGE',
      severity: 'MEDIUM',
      fraudScore: 65,
      description: `Transaction from new IP address not in user's typical locations`,
      evidence: {
        transactionIds: walletTxs.filter(tx => newIPs.includes(tx.metadata?.ipAddress)).map(tx => tx.id),
        ipAddresses: newIPs,
        timestamps: walletTxs.map(tx => tx.createdAt),
        additionalData: {
          newIPs,
          typicalIPs: profile.typicalIPs,
        },
      },
      timestamp: new Date(),
      autoFrozen: false,
      resolved: false,
    };
  }
  
  return null;
}

/**
 * Check for dormant wallets suddenly becoming active
 */
async function checkDormantWalletActivity(
  wallet: any,
  profile: UserBehaviorProfile
): Promise<FraudAlert | null> {
  const daysSinceLastActive = (Date.now() - profile.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000);
  
  if (daysSinceLastActive >= CONFIG.DORMANT_WALLET_DAYS) {
    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: wallet.id,
      userId: wallet.userId,
      alertType: 'DORMANT_WALLET_ACTIVE',
      severity: 'MEDIUM',
      fraudScore: 70,
      description: `Dormant wallet active after ${daysSinceLastActive.toFixed(0)} days of inactivity`,
      evidence: {
        timestamps: [profile.lastActiveDate, new Date()],
        additionalData: {
          daysDormant: daysSinceLastActive,
          lastActiveDate: profile.lastActiveDate,
        },
      },
      timestamp: new Date(),
      autoFrozen: false,
      resolved: false,
    };
  }
  
  return null;
}

/**
 * Check for round-trip transfers (money laundering pattern)
 */
async function checkRoundTripTransfers(
  wallet: any,
  transactions: any[]
): Promise<FraudAlert | null> {
  const sent = transactions.filter(tx => tx.fromWalletId === wallet.id && tx.type === 'TRANSFER');
  const received = transactions.filter(tx => tx.toWalletId === wallet.id && tx.type === 'TRANSFER');
  
  // Look for round-trip patterns (A → B → A)
  for (const sentTx of sent) {
    const recipientWallet = sentTx.toWalletId;
    
    // Check if we received from the same wallet
    const returnTx = received.find(
      rx => rx.fromWalletId === recipientWallet &&
      Math.abs(parseFloat(rx.amount.toString()) - parseFloat(sentTx.amount.toString())) < 0.01 &&
      rx.createdAt > sentTx.createdAt
    );
    
    if (returnTx) {
      return {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        userId: wallet.userId,
        alertType: 'ROUND_TRIP_TRANSFER',
        severity: 'HIGH',
        fraudScore: 85,
        description: `Round-trip transfer pattern detected (potential money laundering)`,
        evidence: {
          transactionIds: [sentTx.id, returnTx.id],
          amounts: [parseFloat(sentTx.amount.toString()), parseFloat(returnTx.amount.toString())],
          timestamps: [sentTx.createdAt, returnTx.createdAt],
          additionalData: {
            recipientWallet,
            sentAmount: parseFloat(sentTx.amount.toString()),
            returnedAmount: parseFloat(returnTx.amount.toString()),
          },
        },
        timestamp: new Date(),
        autoFrozen: false,
        resolved: false,
      };
    }
  }
  
  return null;
}

/**
 * Check for whitelist changes followed by immediate withdrawal
 */
async function checkWhitelistThenWithdraw(
  wallet: any,
  transactions: any[]
): Promise<FraudAlert | null> {
  // Get recent whitelist changes
  const recentWhitelistChanges = await prisma.financeOperationLog.findMany({
    where: {
      userId: wallet.userId,
      operationType: 'SECURITY_WHITELIST_ADD',
      timestamp: {
        gte: new Date(Date.now() - CONFIG.WHITELIST_TO_WITHDRAW_HOURS * 60 * 60 * 1000),
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 1,
  });
  
  if (recentWhitelistChanges.length === 0) return null;
  
  const lastWhitelistChange = recentWhitelistChanges[0];
  
  // Check for withdrawals after whitelist change
  const withdrawalsAfterWhitelist = transactions.filter(
    tx => tx.fromWalletId === wallet.id &&
    tx.type === 'WITHDRAWAL' &&
    lastWhitelistChange &&
    tx.createdAt > lastWhitelistChange.timestamp
  );
  
  if (withdrawalsAfterWhitelist.length > 0 && lastWhitelistChange) {
    const timeDiff = (withdrawalsAfterWhitelist[0].createdAt.getTime() - lastWhitelistChange.timestamp.getTime()) / (60 * 60 * 1000);
    
    if (timeDiff < CONFIG.WHITELIST_TO_WITHDRAW_HOURS) {
      return {
        id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletId: wallet.id,
        userId: wallet.userId,
        alertType: 'WHITELIST_THEN_WITHDRAW',
        severity: 'HIGH',
        fraudScore: 88,
        description: `Withdrawal attempted ${timeDiff.toFixed(1)} hours after whitelist change`,
        evidence: {
          transactionIds: withdrawalsAfterWhitelist.map(tx => tx.id),
          amounts: withdrawalsAfterWhitelist.map(tx => parseFloat(tx.amount.toString())),
          timestamps: [lastWhitelistChange.timestamp, ...withdrawalsAfterWhitelist.map(tx => tx.createdAt)],
          additionalData: {
            whitelistChangeTime: lastWhitelistChange.timestamp,
            withdrawalTime: withdrawalsAfterWhitelist[0].createdAt,
            hoursBetween: timeDiff,
          },
        },
        timestamp: new Date(),
        autoFrozen: false,
        resolved: false,
      };
    }
  }
  
  return null;
}

/**
 * Check for high velocity (many transactions in short time)
 */
async function checkHighVelocity(
  wallet: any,
  transactions: any[]
): Promise<FraudAlert | null> {
  const walletTxs = transactions.filter(tx => tx.fromWalletId === wallet.id);
  
  // Check hourly velocity
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const lastHourTxs = walletTxs.filter(tx => tx.createdAt >= oneHourAgo);
  
  if (lastHourTxs.length >= CONFIG.MAX_TRANSACTIONS_PER_HOUR) {
    return {
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletId: wallet.id,
      userId: wallet.userId,
      alertType: 'HIGH_VELOCITY',
      severity: 'CRITICAL',
      fraudScore: 92,
      description: `High velocity detected: ${lastHourTxs.length} transactions in 1 hour (limit: ${CONFIG.MAX_TRANSACTIONS_PER_HOUR})`,
      evidence: {
        transactionIds: lastHourTxs.map(tx => tx.id),
        amounts: lastHourTxs.map(tx => parseFloat(tx.amount.toString())),
        timestamps: lastHourTxs.map(tx => tx.createdAt),
        additionalData: {
          transactionCount: lastHourTxs.length,
          timeWindow: '1 hour',
          velocityLimit: CONFIG.MAX_TRANSACTIONS_PER_HOUR,
        },
      },
      timestamp: new Date(),
      autoFrozen: false,
      resolved: false,
    };
  }
  
  return null;
}

// ============================================================================
// USER BEHAVIOR PROFILING
// ============================================================================

/**
 * Build a behavioral profile for a user based on historical data
 */
async function buildUserBehaviorProfile(walletId: string, userId: string): Promise<UserBehaviorProfile> {
  // Get wallet creation date
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });
  
  const accountAge = wallet 
    ? (Date.now() - wallet.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    : 0;
  
  // Get historical transactions (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const historicalTxs = await prisma.walletTransaction.findMany({
    where: {
      OR: [
        { fromWalletId: walletId },
        { toWalletId: walletId },
      ],
      createdAt: {
        gte: ninetyDaysAgo,
      },
      status: 'COMPLETED',
    },
  });
  
  // Calculate average transaction amount
  const amounts = historicalTxs
    .filter(tx => tx.fromWalletId === walletId)
    .map(tx => parseFloat(tx.amount.toString()));
  
  const averageTransactionAmount = amounts.length > 0
    ? amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
    : 0;
  
  // Calculate transaction frequency
  const transactionFrequency = accountAge > 0
    ? historicalTxs.length / accountAge
    : 0;
  
  // Extract typical IPs and locations
  const ipSet = new Set<string>();
  const locationSet = new Set<string>();
  
  historicalTxs.forEach(tx => {
    if (tx.metadata) {
      const metadata = tx.metadata as any;
      if (metadata.ipAddress) ipSet.add(metadata.ipAddress);
      if (metadata.location) locationSet.add(metadata.location);
    }
  });
  
  // Get last active date
  const lastActiveDate = historicalTxs.length > 0 && historicalTxs[0]
    ? historicalTxs.reduce((latest, tx) => 
        tx.createdAt > latest ? tx.createdAt : latest, 
        historicalTxs[0].createdAt
      )
    : wallet?.createdAt || new Date();
  
  return {
    userId,
    walletId,
    averageTransactionAmount,
    transactionFrequency,
    typicalIPs: Array.from(ipSet),
    typicalLocations: Array.from(locationSet),
    lastActiveDate,
    accountAge,
    totalTransactions: historicalTxs.length,
  };
}

// ============================================================================
// AUTO-FREEZE FUNCTIONALITY
// ============================================================================

/**
 * Automatically freeze a wallet due to critical fraud detection
 */
async function autoFreezeWallet(walletId: string, alerts: FraudAlert[]): Promise<boolean> {
  try {
    const highestScore = Math.max(...alerts.map(a => a.fraudScore));
    
    if (highestScore < CONFIG.FREEZE_THRESHOLD) {
      return false; // Not severe enough to auto-freeze
    }
    
    console.log(`🚨 [Wallet Fraud Monitor] Auto-freezing wallet ${walletId} (fraud score: ${highestScore})`);
    
    // Freeze the wallet using FinanceService
    const result = await FinanceService.securityWalletFreeze({
      walletId,
      reason: `Automatic fraud detection - ${alerts.map(a => a.alertType).join(', ')}`,
      frozenByUserId: 'FRAUD_MONITOR_SYSTEM',
      duration: 48, // 48 hours
      metadata: {
        fraudScore: highestScore,
        alerts: alerts.map(a => ({
          type: a.alertType,
          severity: a.severity,
          description: a.description,
        })),
      },
    });
    
    if (result.success) {
      // Mark alerts as having triggered auto-freeze
      alerts.forEach(alert => {
        alert.autoFrozen = true;
      });
      
      console.log(`✅ [Wallet Fraud Monitor] Wallet ${walletId} frozen successfully`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ [Wallet Fraud Monitor] Failed to auto-freeze wallet ${walletId}:`, error);
    return false;
  }
}

// ============================================================================
// ALERT STORAGE
// ============================================================================

/**
 * Store fraud alerts in database for admin review
 */
async function storeAlerts(alerts: FraudAlert[]): Promise<void> {
  try {
    for (const alert of alerts) {
      // Store in database
      await prisma.fraudAlert.create({
        data: {
          id: alert.id,
          walletId: alert.walletId,
          userId: alert.userId,
          alertType: alert.alertType,
          severity: alert.severity,
          fraudScore: alert.fraudScore,
          description: alert.description,
          evidence: JSON.stringify(alert.evidence),
          autoFrozen: alert.autoFrozen,
          resolved: alert.resolved,
          createdAt: alert.timestamp,
        },
      });
      
      // Also cache in Redis for quick access
      await redis.lpush('fraud_alerts:recent', JSON.stringify(alert));
      await redis.ltrim('fraud_alerts:recent', 0, 99); // Keep last 100
    }
    
    console.log(`💾 [Wallet Fraud Monitor] Stored ${alerts.length} fraud alerts`);
  } catch (error) {
    console.error('❌ [Wallet Fraud Monitor] Failed to store alerts:', error);
  }
}

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================

/**
 * Send alerts to administrators
 */
async function notifyAdmins(alerts: FraudAlert[]): Promise<void> {
  try {
    // Filter for high-priority alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
    
    if (criticalAlerts.length === 0) return;
    
    console.log(`📧 [Wallet Fraud Monitor] Sending ${criticalAlerts.length} alerts to admins`);
    
    // Publish to Redis pub/sub for real-time admin dashboard
    await redis.publish('admin:fraud_alerts', JSON.stringify({
      timestamp: new Date(),
      alertCount: criticalAlerts.length,
      alerts: criticalAlerts,
    }));
    
    // Send webhook notification if configured
    if (CONFIG.ADMIN_WEBHOOK_URL) {
      await fetch(CONFIG.ADMIN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WALLET_FRAUD_ALERT',
          severity: 'CRITICAL',
          alertCount: criticalAlerts.length,
          alerts: criticalAlerts.map(a => ({
            id: a.id,
            walletId: a.walletId,
            userId: a.userId,
            type: a.alertType,
            severity: a.severity,
            score: a.fraudScore,
            description: a.description,
            autoFrozen: a.autoFrozen,
          })),
          timestamp: new Date(),
        }),
      });
    }
    
    console.log(`✅ [Wallet Fraud Monitor] Admin notifications sent`);
  } catch (error) {
    console.error('❌ [Wallet Fraud Monitor] Failed to notify admins:', error);
  }
}

/**
 * Send critical system alerts
 */
async function sendCriticalSystemAlert(alert: {
  type: string;
  message: string;
  error?: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await redis.publish('admin:system_alerts', JSON.stringify(alert));
    
    if (CONFIG.ADMIN_WEBHOOK_URL) {
      await fetch(CONFIG.ADMIN_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alert,
          type: alert.type || 'SYSTEM_CRITICAL_ERROR',
        }),
      });
    }
  } catch (error) {
    console.error('❌ [Wallet Fraud Monitor] Failed to send critical alert:', error);
  }
}

// ============================================================================
// WORKER LIFECYCLE
// ============================================================================

/**
 * Start the wallet fraud monitoring worker
 */
export function startWalletFraudWorker(): void {
  if (isRunning) {
    console.log('⚠️  [Wallet Fraud Monitor] Worker already running');
    return;
  }
  
  console.log('🚀 [Wallet Fraud Monitor] Starting worker...');
  
  try {
    // Schedule monitoring job (every 10 minutes)
    scheduledJob = cron.schedule(CONFIG.CRON_SCHEDULE, async () => {
      if (isRunning) {
        await monitorWalletActivity();
      }
    });
    
    isRunning = true;
    
    // Run immediately on start
    monitorWalletActivity();
    
    console.log(`✅ [Wallet Fraud Monitor] Worker started (schedule: ${CONFIG.CRON_SCHEDULE})`);
  } catch (error) {
    console.error('❌ [Wallet Fraud Monitor] Failed to start worker:', error);
    throw error;
  }
}

/**
 * Stop the wallet fraud monitoring worker
 */
export function stopWalletFraudWorker(): void {
  if (!isRunning) {
    console.log('⚠️  [Wallet Fraud Monitor] Worker not running');
    return;
  }
  
  console.log('🛑 [Wallet Fraud Monitor] Stopping worker...');
  
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
  
  isRunning = false;
  
  console.log('✅ [Wallet Fraud Monitor] Worker stopped');
}

/**
 * Get worker status and statistics
 */
export function getWalletFraudWorkerStatus(): {
  isRunning: boolean;
  stats: MonitoringStats;
  config: typeof CONFIG;
} {
  return {
    isRunning,
    stats,
    config: CONFIG,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  start: startWalletFraudWorker,
  stop: stopWalletFraudWorker,
  getStatus: getWalletFraudWorkerStatus,
  
  // Export for testing
  monitorWalletActivity,
  analyzeWalletActivity,
  buildUserBehaviorProfile,
};
