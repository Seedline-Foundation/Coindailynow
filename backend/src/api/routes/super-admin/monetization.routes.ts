import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  requireAdmin,
  prisma,
  cmsService,
  financeService,
  canEmergencyUnpublish,
  requireFinancePermission,
  getRangeStartDate,
  DEFAULT_ROLES,
  customRoles,
  getStaffMetaPermissions,
  STAFF_DEPARTMENTS,
  ALL_PERMISSIONS,
  getPermissionCategories,
} from './shared';
import { validateBody } from '../../../middleware/validate';
import {
  approveDisbursementSchema,
  rejectDisbursementSchema,
  lockWalletSchema,
} from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/monetization', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    if (await requireFinancePermission(req, res, ['FINANCE_VIEW_ANALYTICS', 'FINANCE_VIEW_TRANSACTIONS'])) return;

    const range = (req.query.range as string) || '30d';
    const startDate = getRangeStartDate(range);

    const [
      revenueAgg,
      monthlyRevenueAgg,
      annualRevenueAgg,
      successfulPayments,
      failedPayments,
      pendingPayments,
      pendingWithdrawals,
      approvedWithdrawals,
      rejectedWithdrawals,
      pendingWithdrawalRows,
      recentFinanceAudits,
      activeSubscriptions,
      premiumSubscriptions,
      users,
    ] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          status: 'COMPLETED',
          transactionType: { in: ['DEPOSIT', 'PAYMENT'] },
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          status: 'COMPLETED',
          transactionType: { in: ['DEPOSIT', 'PAYMENT'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          status: 'COMPLETED',
          transactionType: { in: ['DEPOSIT', 'PAYMENT'] },
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.count({ where: { status: 'COMPLETED', createdAt: { gte: startDate } } }),
      prisma.walletTransaction.count({ where: { status: 'FAILED', createdAt: { gte: startDate } } }),
      prisma.walletTransaction.count({ where: { status: 'PENDING', createdAt: { gte: startDate } } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { status: 'APPROVED', createdAt: { gte: startDate } } }),
      prisma.withdrawalRequest.count({ where: { status: 'REJECTED', createdAt: { gte: startDate } } }),
      prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { id: true, username: true, email: true } },
          wallet: { select: { id: true, isLocked: true, status: true, joyTokens: true, walletAddress: true } },
        },
        orderBy: { requestedAt: 'asc' },
        take: 20,
      }),
      prisma.auditEvent.findMany({
        where: {
          action: {
            in: ['WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'WALLET_LOCKED', 'WALLET_UNLOCKED'],
          },
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 25,
      }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { subscriptionTier: 'PREMIUM', status: 'ACTIVE' } }),
      prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          username: true,
          email: true,
          subscriptionTier: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalRevenue = revenueAgg._sum.amount || 0;
    const mrr = monthlyRevenueAgg._sum.amount || 0;
    const arr = annualRevenueAgg._sum.amount || 0;
    const paymentTotal = successfulPayments + failedPayments + pendingPayments;
    const actorIds = Array.from(new Set(recentFinanceAudits.map(event => event.userId).filter((id): id is string => Boolean(id))));
    const actors = actorIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, username: true, email: true } })
      : [];
    const actorMap = new Map(actors.map(actor => [actor.id, actor.username || actor.email || actor.id]));

    const data = {
      revenue: {
        total: totalRevenue,
        change: 0,
        trend: [
          { date: 'W1', amount: totalRevenue * 0.2 },
          { date: 'W2', amount: totalRevenue * 0.22 },
          { date: 'W3', amount: totalRevenue * 0.27 },
          { date: 'W4', amount: totalRevenue * 0.31 },
        ],
        mrr,
        arr,
      },
      subscriptions: {
        total: activeSubscriptions,
        active: activeSubscriptions,
        new: premiumSubscriptions,
        cancelled: 0,
        churnRate: 0,
        conversionRate: activeSubscriptions > 0
          ? Number(((premiumSubscriptions / activeSubscriptions) * 100).toFixed(2))
          : 0,
        byPlan: [
          { name: 'Premium', count: premiumSubscriptions, revenue: totalRevenue },
          { name: 'Free', count: Math.max(activeSubscriptions - premiumSubscriptions, 0), revenue: 0 },
        ],
      },
      payments: {
        total: paymentTotal,
        successful: successfulPayments,
        failed: failedPayments,
        pending: pendingPayments,
        byGateway: [
          { name: 'Crypto Wallet', count: successfulPayments, amount: totalRevenue },
        ],
      },
      refunds: {
        total: 0,
        amount: 0,
        rate: 0,
        recent: [],
      },
      topCustomers: users.map((user, index) => ({
        id: user.id,
        name: user.username,
        email: user.email,
        totalSpent: Math.max(totalRevenue / Math.max(users.length, 1) - index * 50, 0),
        subscriptionTier: user.subscriptionTier,
      })),
      disbursements: {
        pending: pendingWithdrawals,
        approved: approvedWithdrawals,
        rejected: rejectedWithdrawals,
        queue: pendingWithdrawalRows.map((item) => ({
          id: item.id,
          userId: item.userId,
          user: item.user?.username || item.user?.email || 'Unknown',
          amount: item.amount,
          currency: item.currency,
          destinationAddress: item.destinationAddress,
          requestedAt: item.requestedAt.toISOString(),
          walletId: item.walletId,
          walletStatus: item.wallet?.status,
          walletLocked: item.wallet?.isLocked || false,
          walletAddress: item.wallet?.walletAddress,
        })),
      },
      auditTrail: recentFinanceAudits.map(event => ({
        id: event.id,
        action: event.action,
        actor: event.userId ? (actorMap.get(event.userId) || event.userId) : 'system',
        success: event.success,
        severity: event.severity,
        category: event.category,
        details: event.details,
        timestamp: event.timestamp.toISOString(),
      })),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching monetization data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monetization data' });
  }
});

/**
 * POST /api/super-admin/monetization/disbursements/:requestId/approve
 */
router.post('/monetization/disbursements/:requestId/approve', authMiddleware, validateBody(approveDisbursementSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    if (await requireFinancePermission(req, res, ['FINANCE_APPROVE_TRANSACTION'])) return;

    const { requestId } = req.params;
    const { adminNotes, txHash } = req.body;

    const result = await financeService.approveWithdrawalRequest({
      requestId,
      adminId: req.user?.id || 'system-admin',
      adminNotes,
      txHash,
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error || 'Failed to approve disbursement' });
      return;
    }

    res.json({ success: true, message: 'Disbursement approved successfully' });
  } catch (error) {
    console.error('Error approving disbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to approve disbursement' });
  }
});

/**
 * POST /api/super-admin/monetization/disbursements/:requestId/reject
 */
router.post('/monetization/disbursements/:requestId/reject', authMiddleware, validateBody(rejectDisbursementSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    if (await requireFinancePermission(req, res, ['FINANCE_CANCEL_TRANSACTION'])) return;

    const { requestId } = req.params;
    const { reason, adminNotes } = req.body;

    const result = await financeService.rejectWithdrawalRequest({
      requestId,
      adminId: req.user?.id || 'system-admin',
      reason,
      adminNotes,
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.error || 'Failed to reject disbursement' });
      return;
    }

    res.json({ success: true, message: 'Disbursement rejected successfully' });
  } catch (error) {
    console.error('Error rejecting disbursement:', error);
    res.status(500).json({ success: false, error: 'Failed to reject disbursement' });
  }
});

/**
 * POST /api/super-admin/monetization/wallets/:walletId/lock
 */
router.post('/monetization/wallets/:walletId/lock', authMiddleware, validateBody(lockWalletSchema), async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    if (await requireFinancePermission(req, res, ['FINANCE_LOCK_WALLET'])) return;

    const { walletId } = req.params;
    const { reason } = req.body;

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        isLocked: true,
        lockReason: reason,
        lockedAt: new Date(),
        lockedBy: req.user?.id,
        status: 'LOCKED',
      },
      select: { id: true, isLocked: true, status: true, lockReason: true, lockedAt: true },
    });

    await prisma.auditEvent.create({
      data: {
        type: 'ADMIN_ACTION',
        action: 'WALLET_LOCKED',
        userId: req.user?.id,
        resource: walletId,
        success: true,
        severity: 'high',
        category: 'finance',
        details: JSON.stringify({ reason }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ success: true, data: updatedWallet, message: 'Wallet locked successfully' });
  } catch (error) {
    console.error('Error locking wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to lock wallet' });
  }
});

/**
 * POST /api/super-admin/monetization/wallets/:walletId/unlock
 */
router.post('/monetization/wallets/:walletId/unlock', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    if (await requireFinancePermission(req, res, ['FINANCE_UNLOCK_WALLET'])) return;

    const { walletId } = req.params;

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        isLocked: false,
        lockReason: null,
        lockedAt: null,
        lockedBy: null,
        status: 'ACTIVE',
      },
      select: { id: true, isLocked: true, status: true, lockReason: true, lockedAt: true },
    });

    await prisma.auditEvent.create({
      data: {
        type: 'ADMIN_ACTION',
        action: 'WALLET_UNLOCKED',
        userId: req.user?.id,
        resource: walletId,
        success: true,
        severity: 'medium',
        category: 'finance',
        details: JSON.stringify({ reason: 'Wallet unlocked by admin' }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ success: true, data: updatedWallet, message: 'Wallet unlocked successfully' });
  } catch (error) {
    console.error('Error unlocking wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to unlock wallet' });
  }
});

// ============================================================================
// AI CONTENT MANAGEMENT
// ============================================================================

/**
 * GET /api/super-admin/content/ai
 * Get AI-generated content
 */
export default router;
