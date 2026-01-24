/**
 * Finance Security Resolvers - Admin Security Dashboard
 * 
 * GraphQL resolvers for:
 * - Viewing security logs
 * - Triggering manual alerts
 * - Exporting audit reports
 * - Managing IP whitelist
 * - Monitoring fraud statistics
 * - Wallet lock/unlock operations
 */

import { PrismaClient, WalletType } from '@prisma/client';
import { financeAuditService, AuditAction, AuditLogQuery } from '../../services/FinanceAuditService';
import { fraudMonitoringService } from '../../services/FraudMonitoringService';
import { financeEmailService } from '../../services/FinanceEmailService';
import { financeSecurityMiddleware } from '../../middleware/financeSecurityMiddleware';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export const financeSecurityResolvers = {
  Query: {
    /**
     * Get security audit logs with filters
     */
    financeSecurityAuditLogs: async (_: any, args: {
      adminId?: string;
      action?: string;
      resource?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }, context: any) => {
      // Require admin authentication
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      const query: any = {
        limit: args.limit || 100,
        offset: args.offset || 0,
      };
      
      if (args.adminId) query.adminId = args.adminId;
      if (args.action) query.action = args.action;
      if (args.resource) query.resource = args.resource;
      if (args.startDate) query.startDate = new Date(args.startDate);
      if (args.endDate) query.endDate = new Date(args.endDate);

      return await financeAuditService.queryLogs(query);
    },

    /**
     * Get audit log statistics
     */
    financeSecurityStats: async (_: any, args: {
      startDate?: string;
      endDate?: string;
    }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      return await financeAuditService.getStats(
        args.startDate ? new Date(args.startDate) : undefined,
        args.endDate ? new Date(args.endDate) : undefined
      );
    },

    /**
     * Get suspicious activity logs
     */
    financeSuspiciousActivities: async (_: any, args: { days?: number }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      return await financeAuditService.getSuspiciousActivity(args.days || 7);
    },

    /**
     * Get failed operations
     */
    financeFailedOperations: async (_: any, args: { days?: number }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      return await financeAuditService.getFailedOperations(args.days || 7);
    },

    /**
     * Get fraud monitoring statistics
     */
    financeFraudStats: async (_: any, args: { days?: number }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      return await fraudMonitoringService.getFraudStatistics(args.days || 7);
    },

    /**
     * Get user risk profile
     */
    financeUserRiskProfile: async (_: any, args: { userId: string }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      return await fraudMonitoringService.getUserRiskProfile(args.userId);
    },

    /**
     * Get blockchain sync status
     */
    financeBlockchainSyncStatus: async (_: any, __: any, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      const { blockchainSyncWorker } = await import('../../workers/blockchainSyncWorker');
      return await blockchainSyncWorker.getStatus();
    },
  },

  Mutation: {
    /**
     * Export audit logs to CSV/JSON
     */
    financeExportAuditLogs: async (_: any, args: {
      format: 'CSV' | 'JSON';
      adminId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      const query: any = {};
      if (args.adminId) query.adminId = args.adminId;
      if (args.action) query.action = args.action;
      if (args.startDate) query.startDate = new Date(args.startDate);
      if (args.endDate) query.endDate = new Date(args.endDate);

      let content: string;
      if (args.format === 'CSV') {
        content = await financeAuditService.exportToCSV(query);
      } else {
        content = await financeAuditService.exportToJSON(query);
      }

      // Log export action
      await financeAuditService.logAdminOperation(
        context.user.id,
        AuditAction.ADMIN_EXPORT_REPORT,
        'security' as any,
        undefined,
        {
          format: args.format,
          query: args,
        },
        context.req
      );

      return {
        success: true,
        format: args.format,
        content,
        filename: `audit_logs_${new Date().toISOString()}.${args.format.toLowerCase()}`,
      };
    },

    /**
     * Send manual security alert to user
     */
    financeSendSecurityAlert: async (_: any, args: {
      userId: string;
      alertType: string;
      message: string;
    }, context: any) => {
      if (!context.user || (context.user.role !== 'ADMIN' && context.user.role !== 'SUPER_ADMIN')) {
        throw new Error('Admin access required');
      }

      const user = await prisma.user.findUnique({
        where: { id: args.userId },
        select: { email: true, username: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Send security alert email
      const sent = await financeEmailService.sendSecurityAlert(user.email, {
        username: user.username,
        alertType: args.alertType as any,
        message: args.message,
        timestamp: new Date(),
        actionRequired: 'Please review your account security settings.',
      });

      // Log the action
      await financeAuditService.logAdminOperation(
        context.user.id,
        AuditAction.ADMIN_MANUAL_ADJUSTMENT,
        'security' as any,
        args.userId,
        {
          action: 'send_security_alert',
          alert_type: args.alertType,
          message: args.message,
        },
        context.req
      );

      return {
        success: sent,
        message: sent ? 'Security alert sent successfully' : 'Failed to send security alert',
      };
    },

    /**
     * Lock user wallet manually
     */
    financeLockWallet: async (_: any, args: {
      userId: string;
      reason: string;
    }, context: any) => {
      if (!context.user || context.user.role !== 'SUPER_ADMIN') {
        throw new Error('Super Admin access required');
      }

      const wallet = await prisma.wallet.findFirst({
        where: { userId: args.userId, walletType: WalletType.USER_WALLET },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Lock wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { status: 'LOCKED' as any },
      });

      // Log the action
      await financeAuditService.logAdminOperation(
        context.user.id,
        AuditAction.WALLET_LOCKED,
        'wallet' as any,
        wallet.id,
        {
          userId: args.userId,
          reason: args.reason,
          manual_lock: true,
        },
        context.req
      );

      // Send notification to user
      const user = await prisma.user.findUnique({
        where: { id: args.userId },
        select: { email: true, username: true },
      });

      if (user) {
        await financeEmailService.sendSecurityAlert(user.email, {
          username: user.username,
          alertType: 'wallet_locked',
          message: `Your wallet has been locked by an administrator. Reason: ${args.reason}`,
          timestamp: new Date(),
          actionRequired: 'Please contact support for assistance.',
        });
      }

      return {
        success: true,
        message: 'Wallet locked successfully',
      };
    },

    /**
     * Unlock user wallet manually
     */
    financeUnlockWallet: async (_: any, args: {
      userId: string;
      reason: string;
    }, context: any) => {
      if (!context.user || context.user.role !== 'SUPER_ADMIN') {
        throw new Error('Super Admin access required');
      }

      const wallet = await prisma.wallet.findFirst({
        where: { userId: args.userId, walletType: WalletType.USER_WALLET },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Unlock wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { status: 'ACTIVE' as any },
      });

      // Log the action
      await financeAuditService.logAdminOperation(
        context.user.id,
        AuditAction.WALLET_UNLOCKED,
        'wallet' as any,
        wallet.id,
        {
          userId: args.userId,
          reason: args.reason,
          manual_unlock: true,
        },
        context.req
      );

      return {
        success: true,
        message: 'Wallet unlocked successfully',
      };
    },

    /**
     * Add IP to whitelist
     */
    financeAddIPWhitelist: async (_: any, args: {
      ipAddress: string;
      reason: string;
    }, context: any) => {
      if (!context.user || context.user.role !== 'SUPER_ADMIN') {
        throw new Error('Super Admin access required');
      }

      await financeSecurityMiddleware.addIPToWhitelist(
        context.user.id,
        args.ipAddress,
        args.reason,
        context.req
      );

      return {
        success: true,
        message: 'IP address added to whitelist',
      };
    },

    /**
     * Remove IP from whitelist
     */
    financeRemoveIPWhitelist: async (_: any, args: {
      ipAddress: string;
      reason: string;
    }, context: any) => {
      if (!context.user || context.user.role !== 'SUPER_ADMIN') {
        throw new Error('Super Admin access required');
      }

      await financeSecurityMiddleware.removeIPFromWhitelist(
        context.user.id,
        args.ipAddress,
        args.reason,
        context.req
      );

      return {
        success: true,
        message: 'IP address removed from whitelist',
      };
    },

    /**
     * Archive old audit logs
     */
    financeArchiveOldLogs: async (_: any, args: { daysToKeep?: number }, context: any) => {
      if (!context.user || context.user.role !== 'SUPER_ADMIN') {
        throw new Error('Super Admin access required');
      }

      const archived = await financeAuditService.archiveOldLogs(args.daysToKeep || 30);

      // Log the action
      await financeAuditService.logAdminOperation(
        context.user.id,
        AuditAction.ADMIN_RESTORE_BACKUP,
        'system' as any,
        undefined,
        {
          action: 'archive_old_logs',
          days_to_keep: args.daysToKeep || 30,
          logs_archived: archived,
        },
        context.req
      );

      return {
        success: true,
        message: `Archived ${archived} old logs`,
        archivedCount: archived,
      };
    },
  },
};
