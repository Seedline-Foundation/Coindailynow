/**
 * Reverse webhook leg: CFIS → backend.
 *
 * Per documentations/launch/PRE_POST_LAUNCH_TODO.md:
 *   "payment lands in finance-system → finance-system sends transaction event
 *    → superadmin issues receipt → both stores reconcile."
 *
 * CFIS' BackendNotifier signs each event with HMAC-SHA256 over
 *   `${timestamp}.${JSON.stringify(body)}` using BACKEND_HMAC_SECRET (or
 * CFIS_HMAC_SECRET as fallback) and posts here.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { subscriptionService } from '../services/subscriptionService';
import prisma from '../lib/prisma';

const router = Router();

const eventSchema = z.object({
  type: z.enum([
    'PAYMENT_CONFIRMED',
    'WALLET_DEPOSIT_CONFIRMED',
    'WALLET_WITHDRAWAL_COMPLETED',
    'SWAP_COMPLETED',
    'PAYROLL_DISBURSED',
    'PRESS_PAYOUT_RELEASED',
    'TAX_REPORT_READY',
  ]),
  emittedAt: z.string(),
  cfisTransactionId: z.string(),
  backendReferenceId: z.string().optional(),
  userId: z.string().optional(),
  payload: z.record(z.any()).default({}),
});

function verifySignature(req: Request): boolean {
  const secret = process.env.BACKEND_HMAC_SECRET || process.env.CFIS_HMAC_SECRET;
  if (!secret) return false;

  const sig = req.header('x-cfis-signature') || '';
  const ts = req.header('x-cfis-timestamp') || '';
  if (!sig || !ts) return false;

  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age > 5 * 60_000) return false;

  const body = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function authGate(req: Request, res: Response, next: NextFunction) {
  // In dev allow unsigned events to ease local testing.
  if (process.env.NODE_ENV !== 'production') {
    if (!verifySignature(req)) {
      logger.debug('[finance-events] dev-mode: unsigned event accepted');
    }
    return next();
  }
  if (!verifySignature(req)) {
    res.status(401).json({ error: 'INVALID_SIGNATURE' });
    return;
  }
  next();
}

router.post('/', authGate, async (req: Request, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_PAYLOAD', detail: parsed.error.flatten() });
    return;
  }
  const event = parsed.data;
  logger.info('[finance-events] received', {
    type: event.type,
    cfisTxId: event.cfisTransactionId,
    userId: event.userId,
  });

  try {
    switch (event.type) {
      case 'PAYMENT_CONFIRMED': {
        if (event.userId) {
          await subscriptionService.reissueReceipt({
            userId: event.userId,
            subscriptionId: event.backendReferenceId,
            invoiceNumber: String(event.payload.invoiceNumber || ''),
            amount: Number(event.payload.amount || 0),
            currency: String(event.payload.currency || 'USD'),
          });
        }
        // Reconciliation: mark backend payment record as cleared.
        if (event.backendReferenceId) {
          await prisma.subscription
            .updateMany({
              where: { id: event.backendReferenceId },
              data: { status: 'ACTIVE', updatedAt: new Date() },
            })
            .catch((e) =>
              logger.warn('[finance-events] subscription update failed', { error: e.message }),
            );
        }
        break;
      }

      case 'WALLET_DEPOSIT_CONFIRMED':
      case 'WALLET_WITHDRAWAL_COMPLETED':
      case 'SWAP_COMPLETED':
      case 'PAYROLL_DISBURSED':
      case 'PRESS_PAYOUT_RELEASED':
      case 'TAX_REPORT_READY': {
        // Audit-log only for now; downstream consumers (notifications, ledger
        // mirror, admin alerts) can subscribe via WebSocket once Wave-1 lands.
        logger.info('[finance-events] audited', {
          type: event.type,
          cfisTxId: event.cfisTransactionId,
        });
        break;
      }
    }
  } catch (err: any) {
    logger.error('[finance-events] processing error', { error: err.message, type: event.type });
    // Always 200 so CFIS does not retry-storm; reconciliation worker handles drift.
  }

  res.json({ success: true, processed: event.type });
});

export default router;
