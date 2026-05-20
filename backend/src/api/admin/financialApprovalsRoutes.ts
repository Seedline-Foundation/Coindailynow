/**
 * Financial approval workflow.
 *
 * Implements SPEC-ADM-5 ("Financial operations approval workflow"). The
 * admin panel was previously read-only on financial data; this surface lets
 * the CEO + SUPER_ADMIN trigger explicit approve/reject for high-value
 * outbound money movements with two-step confirmation, audit trail, and
 * real-time push to other admin sessions.
 *
 * Storage: Redis (TTL 14 days, mirrored to CFIS via the existing
 * cfisWebhookService → /api/internal/events bus for ledger persistence).
 *
 * Capability gates: FINANCE_APPROVE on every state-changing route.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import { getRedis } from '../../lib/redis';
import { logger } from '../../utils/logger';
import { emitFinanceApprovalRequest } from '../../services/adminWebSocketService';
import { emitCfisEvent } from '../../services/cfisWebhookService';

const router = Router();

router.use(authMiddleware as any);

const redis = getRedis();
const KEY = (id: string) => `finance:approval:${id}`;
const INDEX = 'finance:approval:index';
const TTL = 60 * 60 * 24 * 14; // 14 days

type ApprovalKind = 'WITHDRAWAL' | 'PAYROLL' | 'PRESS_PAYOUT' | 'BUYBACK';

interface ApprovalRecord {
  id: string;
  kind: ApprovalKind;
  amount: number;
  currency: string;
  recipient: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
  /** Two-step confirmation token returned to the approver and required on commit. */
  confirmationToken?: string;
}

async function loadApproval(id: string): Promise<ApprovalRecord | null> {
  const raw = await redis.get(KEY(id));
  return raw ? (JSON.parse(raw) as ApprovalRecord) : null;
}

async function saveApproval(rec: ApprovalRecord) {
  await redis.set(KEY(rec.id), JSON.stringify(rec), 'EX', TTL);
  await redis.zadd(INDEX, Date.parse(rec.requestedAt), rec.id);
}

// ─── List ─────────────────────────────────────────────────────────
router.get(
  '/',
  requireCapability('FINANCE_READ') as any,
  async (req: Request, res: Response) => {
    const status = String(req.query.status || '');
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    try {
      const ids = await redis.zrevrange(INDEX, 0, limit - 1);
      const items: ApprovalRecord[] = [];
      for (const id of ids) {
        const r = await loadApproval(id);
        if (!r) continue;
        if (status && r.status !== status) continue;
        items.push(r);
      }
      return res.json({ success: true, items });
    } catch (e: any) {
      logger.error('[admin/finance-approvals] list', { error: e?.message });
      return res.status(500).json({ success: false, error: 'list_failed' });
    }
  },
);

router.get(
  '/:id',
  requireCapability('FINANCE_READ') as any,
  async (req: Request, res: Response) => {
    const r = await loadApproval(req.params.id || '');
    if (!r) return res.status(404).json({ success: false, error: 'not_found' });
    return res.json({ success: true, item: r });
  },
);

// ─── Request ──────────────────────────────────────────────────────
const requestSchema = z.object({
  kind: z.enum(['WITHDRAWAL', 'PAYROLL', 'PRESS_PAYOUT', 'BUYBACK']),
  amount: z.number().positive().max(100_000_000),
  currency: z.string().min(2).max(8),
  recipient: z.string().min(2).max(200),
  reason: z.string().max(1000).optional(),
});

router.post(
  '/',
  requireCapability('FINANCE_READ') as any,
  async (req: Request, res: Response) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const id = `appr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const rec: ApprovalRecord = {
      id,
      ...parsed.data,
      status: 'pending',
      requestedBy: (req as any).user?.id || 'unknown',
      requestedAt: new Date().toISOString(),
    };
    await saveApproval(rec);
    emitFinanceApprovalRequest({
      approvalId: id,
      kind: rec.kind,
      amount: rec.amount,
      currency: rec.currency,
      requestedBy: rec.requestedBy,
      requestedAt: rec.requestedAt,
    });
    return res.status(201).json({ success: true, item: rec });
  },
);

// ─── Step 1: decide (approve / reject) — issues confirmation token ─
const decideSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional(),
});

router.post(
  '/:id/decide',
  requireCapability('FINANCE_APPROVE') as any,
  async (req: Request, res: Response) => {
    const parsed = decideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const rec = await loadApproval(req.params.id || '');
    if (!rec) return res.status(404).json({ success: false, error: 'not_found' });
    if (rec.status !== 'pending') {
      return res.status(409).json({ success: false, error: `already_${rec.status}` });
    }
    if (parsed.data.decision === 'reject') {
      rec.status = 'rejected';
      rec.decidedBy = (req as any).user?.id || 'unknown';
      rec.decidedAt = new Date().toISOString();
      rec.decisionReason = parsed.data.reason;
      await saveApproval(rec);
      // Forward to CFIS for ledger note + super admin notification.
      await emitCfisEvent('PAYOUT', {
        approvalId: rec.id,
        kind: rec.kind,
        amount: rec.amount,
        currency: rec.currency,
        decision: 'rejected',
        reason: rec.decisionReason,
      });
      return res.json({ success: true, item: rec });
    }
    // Approve: stage with confirmation token.
    rec.status = 'approved';
    rec.decidedBy = (req as any).user?.id || 'unknown';
    rec.decidedAt = new Date().toISOString();
    rec.decisionReason = parsed.data.reason;
    rec.confirmationToken = crypto.randomBytes(16).toString('hex');
    await saveApproval(rec);
    return res.json({
      success: true,
      item: rec,
      confirmationToken: rec.confirmationToken,
      hint: 'POST /api/admin/finance-approvals/:id/commit with this token within 5 min to execute.',
    });
  },
);

// ─── Step 2: commit (multi-step confirmation) ─────────────────────
const commitSchema = z.object({ confirmationToken: z.string().length(32) });

router.post(
  '/:id/commit',
  requireCapability('FINANCE_APPROVE') as any,
  async (req: Request, res: Response) => {
    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const rec = await loadApproval(req.params.id || '');
    if (!rec) return res.status(404).json({ success: false, error: 'not_found' });
    if (rec.status !== 'approved') {
      return res.status(409).json({ success: false, error: `cannot_commit_${rec.status}` });
    }
    if (!rec.confirmationToken || rec.confirmationToken !== parsed.data.confirmationToken) {
      return res.status(401).json({ success: false, error: 'invalid_token' });
    }
    if (rec.decidedAt && Date.now() - Date.parse(rec.decidedAt) > 5 * 60_000) {
      rec.status = 'cancelled';
      rec.decisionReason = 'confirmation timeout';
      await saveApproval(rec);
      return res.status(410).json({ success: false, error: 'token_expired' });
    }
    rec.status = 'executed';
    delete rec.confirmationToken;
    await saveApproval(rec);

    // Tell CFIS to execute the payout. CFIS is the source of truth for
    // money movement; backend just recorded the approval ceremony.
    await emitCfisEvent('PAYOUT', {
      approvalId: rec.id,
      kind: rec.kind,
      amount: rec.amount,
      currency: rec.currency,
      recipient: rec.recipient,
      decision: 'executed',
      decidedBy: rec.decidedBy,
      reason: rec.decisionReason,
    });
    return res.json({ success: true, item: rec });
  },
);

export default router;
