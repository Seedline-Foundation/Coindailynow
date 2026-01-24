/**
 * FinanceAuditService - Comprehensive Audit Logging for Financial Operations
 * 
 * Tracks all financial operations with:
 * - Admin/Super Admin actions
 * - Backend wallet operations
 * - User financial activities
 * - Security events
 * - Fraud detection triggers
 * 
 * All logs include: timestamp, admin ID, action type, resource, IP address, and full details
 */

import { PrismaClient, User, UserRole } from '@prisma/client';
import { logger } from '../utils/logger';
import { Request } from 'express';

const prisma = new PrismaClient();

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export enum AuditAction {
  // Wallet Management
  WALLET_CREATED = 'wallet_created',
  WALLET_UPDATED = 'wallet_updated',
  WALLET_DELETED = 'wallet_deleted',
  WALLET_LOCKED = 'wallet_locked',
  WALLET_UNLOCKED = 'wallet_unlocked',
  WALLET_BALANCE_ADJUSTED = 'wallet_balance_adjusted',
  
  // Transactions
  DEPOSIT_INITIATED = 'deposit_initiated',
  DEPOSIT_COMPLETED = 'deposit_completed',
  DEPOSIT_FAILED = 'deposit_failed',
  WITHDRAWAL_REQUEST = 'withdrawal_request',
  WITHDRAWAL_APPROVED = 'withdrawal_approved',
  WITHDRAWAL_REJECTED = 'withdrawal_rejected',
  WITHDRAWAL_COMPLETED = 'withdrawal_completed',
  TRANSFER_EXECUTED = 'transfer_executed',
  PAYMENT_PROCESSED = 'payment_processed',
  
  // Staking
  STAKE_CREATED = 'stake_created',
  STAKE_EXTENDED = 'stake_extended',
  UNSTAKE_EXECUTED = 'unstake_executed',
  STAKING_REWARDS_CLAIMED = 'staking_rewards_claimed',
  
  // CE Points & Conversions
  CE_POINTS_AWARDED = 'ce_points_awarded',
  CE_POINTS_DEDUCTED = 'ce_points_deducted',
  CE_CONVERSION_EXECUTED = 'ce_conversion_executed',
  
  // Airdrops & Gifts
  AIRDROP_CREATED = 'airdrop_created',
  AIRDROP_DISTRIBUTED = 'airdrop_distributed',
  GIFT_SENT = 'gift_sent',
  GIFT_RECEIVED = 'gift_received',
  
  // Refunds & Reversals
  REFUND_ISSUED = 'refund_issued',
  TRANSACTION_REVERSED = 'transaction_reversed',
  
  // Security Events
  OTP_GENERATED = 'otp_generated',
  OTP_VERIFIED = 'otp_verified',
  OTP_FAILED = 'otp_failed',
  OTP_EXPIRED = 'otp_expired',
  SUSPICIOUS_ACTIVITY_DETECTED = 'suspicious_activity_detected',
  FRAUD_ALERT_TRIGGERED = 'fraud_alert_triggered',
  IP_WHITELIST_ADDED = 'ip_whitelist_added',
  IP_WHITELIST_REMOVED = 'ip_whitelist_removed',
  IP_BLOCKED = 'ip_blocked',
  
  // Admin Operations
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  ADMIN_MANUAL_ADJUSTMENT = 'admin_manual_adjustment',
  ADMIN_OVERRIDE = 'admin_override',
  ADMIN_EXPORT_REPORT = 'admin_export_report',
  ADMIN_RESTORE_BACKUP = 'admin_restore_backup',
  
  // We Wallet Operations
  WE_WALLET_ACCESSED = 'we_wallet_accessed',
  WE_WALLET_TRANSACTION = 'we_wallet_transaction',
  WE_WALLET_MULTI_AUTH_INIT = 'we_wallet_multi_auth_init',
  WE_WALLET_MULTI_AUTH_VERIFIED = 'we_wallet_multi_auth_verified',
  
  // System Events
  BLOCKCHAIN_SYNC_COMPLETED = 'blockchain_sync_completed',
  BLOCKCHAIN_DEPOSIT_DETECTED = 'blockchain_deposit_detected',
  AUTOMATED_REPORT_SENT = 'automated_report_sent',
}

export enum AuditResource {
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
  USER = 'user',
  ADMIN = 'admin',
  STAKING = 'staking',
  CE_POINTS = 'ce_points',
  AIRDROP = 'airdrop',
  SECURITY = 'security',
  SYSTEM = 'system',
  WE_WALLET = 'we_wallet',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

export interface AuditLogInput {
  adminId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status?: AuditStatus;
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  adminId?: string;
  action?: AuditAction | AuditAction[];
  resource?: AuditResource | AuditResource[];
  resourceId?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byStatus: Record<string, number>;
  byAdmin: Array<{
    adminId: string;
    adminName: string;
    count: number;
    lastAction: Date;
  }>;
  suspiciousActivities: number;
  failedOperations: number;
}

// ============================================================================
// AUDIT SERVICE
// ============================================================================

export class FinanceAuditService {
  /**
   * Create an audit log entry
   */
  async createLog(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: input.adminId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId || null,
          details: JSON.stringify({
            ...input.details,
            metadata: input.metadata,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          status: input.status || AuditStatus.SUCCESS,
        },
      });

      logger.info(`Audit log created: ${input.action} by ${input.adminId}`);
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit failures shouldn't block operations
    }
  }

  /**
   * Log wallet operation
   */
  async logWalletOperation(
    adminId: string,
    action: AuditAction,
    walletId: string,
    details: Record<string, any>,
    req: Request
  ): Promise<void> {
    await this.createLog({
      adminId,
      action,
      resource: AuditResource.WALLET,
      resourceId: walletId,
      details: {
        ...details,
        walletId,
      },
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      status: AuditStatus.SUCCESS,
    });
  }

  /**
   * Log transaction operation
   */
  async logTransaction(
    userId: string,
    action: AuditAction,
    transactionId: string,
    details: Record<string, any>,
    req: Request,
    status: AuditStatus = AuditStatus.SUCCESS
  ): Promise<void> {
    await this.createLog({
      adminId: userId,
      action,
      resource: AuditResource.TRANSACTION,
      resourceId: transactionId,
      details: {
        ...details,
        transactionId,
      },
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      status,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    action: AuditAction,
    details: Record<string, any>,
    req: Request,
    status: AuditStatus = AuditStatus.SUCCESS
  ): Promise<void> {
    await this.createLog({
      adminId: userId,
      action,
      resource: AuditResource.SECURITY,
      details: {
        ...details,
        severity: this.getSecuritySeverity(action),
      },
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      status,
    });

    // If it's a critical security event, also log to system logger
    if (this.isCriticalSecurityEvent(action)) {
      logger.warn(`Critical security event: ${action} by ${userId}`, {
        details,
        ipAddress: this.getClientIP(req),
      });
    }
  }

  /**
   * Log admin operation
   */
  async logAdminOperation(
    adminId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string | undefined,
    details: Record<string, any>,
    req: Request
  ): Promise<void> {
    const logData: AuditLogInput = {
      adminId,
      action,
      resource,
      details: {
        ...details,
        adminRole: await this.getAdminRole(adminId),
      },
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      status: AuditStatus.SUCCESS,
    };
    
    if (resourceId) {
      logData.resourceId = resourceId;
    }
    
    await this.createLog(logData);
  }

  /**
   * Log We Wallet multi-sig operation
   */
  async logWeWalletOperation(
    adminId: string,
    action: AuditAction,
    details: Record<string, any>,
    req: Request,
    authEmails?: string[]
  ): Promise<void> {
    await this.createLog({
      adminId,
      action,
      resource: AuditResource.WE_WALLET,
      resourceId: 'we-wallet',
      details: {
        ...details,
        authEmails: authEmails?.map(email => this.maskEmail(email)),
        multiSigRequired: true,
      },
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      status: AuditStatus.SUCCESS,
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(query: AuditLogQuery): Promise<any[]> {
    const where: any = {};

    if (query.adminId) where.adminId = query.adminId;
    if (query.action) {
      where.action = Array.isArray(query.action) ? { in: query.action } : query.action;
    }
    if (query.resource) {
      where.resource = Array.isArray(query.resource) ? { in: query.resource } : query.resource;
    }
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.status) where.status = query.status;
    if (query.ipAddress) where.ipAddress = query.ipAddress;
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: query.limit || 100,
      skip: query.offset || 0,
    });

    return logs.map(log => ({
      ...log,
      details: JSON.parse(log.details),
    }));
  }

  /**
   * Get audit log statistics
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<AuditLogStats> {
    const where: any = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({ where });

    const stats: AuditLogStats = {
      totalLogs: logs.length,
      byAction: {},
      byResource: {},
      byStatus: {},
      byAdmin: [],
      suspiciousActivities: 0,
      failedOperations: 0,
    };

    // Count by action
    logs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;

      if (log.action.includes('suspicious') || log.action.includes('fraud')) {
        stats.suspiciousActivities++;
      }
      if (log.status === AuditStatus.FAILURE) {
        stats.failedOperations++;
      }
    });

    // Count by admin
    const adminActivity = new Map<string, { count: number; lastAction: Date; admin: any }>();
    logs.forEach(log => {
      const existing = adminActivity.get(log.adminId);
      if (!existing || log.timestamp > existing.lastAction) {
        adminActivity.set(log.adminId, {
          count: (existing?.count || 0) + 1,
          lastAction: log.timestamp,
          admin: null, // Will populate later
        });
      }
    });

    // Get admin details
    for (const [adminId, data] of adminActivity.entries()) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, username: true, email: true },
      });

      if (admin) {
        stats.byAdmin.push({
          adminId,
          adminName: admin.username,
          count: data.count,
          lastAction: data.lastAction,
        });
      }
    }

    stats.byAdmin.sort((a, b) => b.count - a.count);

    return stats;
  }

  /**
   * Export audit logs to CSV
   */
  async exportToCSV(query: AuditLogQuery): Promise<string> {
    const logs = await this.queryLogs({ ...query, limit: 100000 });

    const headers = [
      'Timestamp',
      'Admin ID',
      'Admin Name',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'Details',
    ];

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.adminId,
      log.admin?.username || 'Unknown',
      log.action,
      log.resource,
      log.resourceId || '',
      log.status,
      log.ipAddress,
      JSON.stringify(log.details),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Export audit logs to JSON
   */
  async exportToJSON(query: AuditLogQuery): Promise<string> {
    const logs = await this.queryLogs({ ...query, limit: 100000 });
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Get suspicious activity logs
   */
  async getSuspiciousActivity(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      action: [
        AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
        AuditAction.FRAUD_ALERT_TRIGGERED,
        AuditAction.OTP_FAILED,
        AuditAction.IP_BLOCKED,
      ],
      startDate,
      limit: 1000,
    });
  }

  /**
   * Get failed operations
   */
  async getFailedOperations(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      status: AuditStatus.FAILURE,
      startDate,
      limit: 1000,
    });
  }

  /**
   * Archive old logs (move to cold storage)
   */
  async archiveOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // In production, export to cold storage (S3, etc.) before deleting
    const logsToArchive = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Archiving ${logsToArchive.length} old audit logs`);

    // TODO: Export to cold storage here
    // await this.exportToColdStorage(logsToArchive);

    // Delete archived logs from database
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0]?.trim();
      return ip || req.ip || req.socket.remoteAddress || 'Unknown';
    }
    return req.ip || req.socket.remoteAddress || 'Unknown';
  }

  /**
   * Get admin role
   */
  private async getAdminRole(adminId: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true },
      });
      return user?.role || 'UNKNOWN';
    } catch (error) {
      return 'UNKNOWN';
    }
  }

  /**
   * Determine security severity
   */
  private getSecuritySeverity(action: AuditAction): 'low' | 'medium' | 'high' | 'critical' {
    const criticalActions = [
      AuditAction.FRAUD_ALERT_TRIGGERED,
      AuditAction.WALLET_LOCKED,
      AuditAction.IP_BLOCKED,
    ];

    const highActions = [
      AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
      AuditAction.OTP_FAILED,
      AuditAction.WITHDRAWAL_REJECTED,
    ];

    const mediumActions = [
      AuditAction.OTP_GENERATED,
      AuditAction.IP_WHITELIST_ADDED,
    ];

    if (criticalActions.includes(action)) return 'critical';
    if (highActions.includes(action)) return 'high';
    if (mediumActions.includes(action)) return 'medium';
    return 'low';
  }

  /**
   * Check if action is critical security event
   */
  private isCriticalSecurityEvent(action: AuditAction): boolean {
    return [
      AuditAction.FRAUD_ALERT_TRIGGERED,
      AuditAction.WALLET_LOCKED,
      AuditAction.IP_BLOCKED,
      AuditAction.ADMIN_OVERRIDE,
    ].includes(action);
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    if (local.length < 3) return `${local}@${domain}`;
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}

export const financeAuditService = new FinanceAuditService();
