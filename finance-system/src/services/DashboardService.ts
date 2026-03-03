import db from '../database/connection';
import { DashboardStats } from '../types';
import { walletService } from './WalletService';
import { notificationService } from './NotificationService';

/**
 * DashboardService
 * Aggregates data for the CFIS Super Admin dashboard.
 */
export class DashboardService {

  async getStats(): Promise<DashboardStats> {
    const [
      revenueResult,
      expenseResult,
      walletCountResult,
      escrowCountResult,
      payrollCountResult,
      partnerCountResult,
      airdropCountResult,
      verificationCountResult,
      recentTxResult,
      unreadCount
    ] = await Promise.all([
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE tx_type IN ('TOKEN_DEPOSIT','FIAT_PAYMENT','SUBSCRIPTION_PAYMENT','PRESS_ESCROW_IN','AIRDROP_FUND') AND status = 'COMPLETED'`),
      db.query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE tx_type IN ('TOKEN_WITHDRAWAL','STAFF_PAYROLL','STAFF_BONUS','PRESS_ESCROW_RELEASE','PARTNERSHIP_PAYMENT','BONUS_PAYMENT') AND status = 'COMPLETED'`),
      db.query(`SELECT COUNT(*) FROM wallets WHERE is_active = true`),
      db.query(`SELECT COUNT(*) FROM press_escrows WHERE status IN ('FUNDED','ACTIVE','VERIFICATION_PENDING')`),
      db.query(`SELECT COUNT(*) FROM staff_payroll WHERE status = 'SCHEDULED'`),
      db.query(`SELECT COUNT(*) FROM partnerships WHERE status IN ('PENDING_DOCS','DOCS_SUBMITTED','DOCS_UNDER_REVIEW')`),
      db.query(`SELECT COUNT(*) FROM airdrop_campaigns WHERE status IN ('CREATED','FUNDING_PENDING','FUNDING_VERIFIED','ACTIVE','DISTRIBUTING')`),
      db.query(`SELECT COUNT(*) FROM ai_verifications WHERE result = 'PENDING'`),
      db.query(`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20`),
      notificationService.getUnreadCount()
    ]);

    const totalRevenue = parseFloat(revenueResult.rows[0].total);
    const totalExpenses = parseFloat(expenseResult.rows[0].total);

    return {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      totalWallets: parseInt(walletCountResult.rows[0].count),
      activeEscrows: parseInt(escrowCountResult.rows[0].count),
      pendingPayrolls: parseInt(payrollCountResult.rows[0].count),
      pendingPartnerships: parseInt(partnerCountResult.rows[0].count),
      activeAirdrops: parseInt(airdropCountResult.rows[0].count),
      pendingVerifications: parseInt(verificationCountResult.rows[0].count),
      recentTransactions: recentTxResult.rows,
      unreadNotifications: unreadCount
    };
  }

  async getRevenueByType(): Promise<any[]> {
    const result = await db.query(
      `SELECT tx_type, currency, SUM(amount) as total, COUNT(*) as count
       FROM transactions WHERE status = 'COMPLETED'
       GROUP BY tx_type, currency
       ORDER BY total DESC`
    );
    return result.rows;
  }

  async getMonthlyRevenue(year: number): Promise<any[]> {
    const result = await db.query(
      `SELECT EXTRACT(MONTH FROM created_at) as month,
              SUM(CASE WHEN tx_type IN ('TOKEN_DEPOSIT','FIAT_PAYMENT','SUBSCRIPTION_PAYMENT','PRESS_ESCROW_IN') THEN amount ELSE 0 END) as revenue,
              SUM(CASE WHEN tx_type IN ('TOKEN_WITHDRAWAL','STAFF_PAYROLL','PRESS_ESCROW_RELEASE','PARTNERSHIP_PAYMENT','BONUS_PAYMENT') THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE status = 'COMPLETED' AND EXTRACT(YEAR FROM created_at) = $1
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month`,
      [year]
    );
    return result.rows;
  }

  async getSystemHealth(): Promise<any> {
    const dbHealthy = await db.healthCheck();
    const pendingTxResult = await db.query(`SELECT COUNT(*) FROM transactions WHERE status IN ('PENDING','PROCESSING')`);
    const failedTxResult = await db.query(`SELECT COUNT(*) FROM transactions WHERE status = 'FAILED' AND created_at > NOW() - INTERVAL '24 hours'`);

    return {
      database: dbHealthy ? 'HEALTHY' : 'DOWN',
      pendingTransactions: parseInt(pendingTxResult.rows[0].count),
      failedLast24h: parseInt(failedTxResult.rows[0].count),
      timestamp: new Date().toISOString()
    };
  }
}

export const dashboardService = new DashboardService();
