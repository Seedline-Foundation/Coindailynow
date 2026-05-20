/**
 * ChangeNOW REST surface for the diaspora swap UX.
 *
 * Mounted at /api/v1/changenow in backend/src/index.ts.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { changeNowProvider, ChangeNowProvider } from '../../services/providers/changenow.provider';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();

const estimateSchema = z.object({
  fromCurrency: z.string().min(2).max(20),
  toCurrency: z.string().min(2).max(20),
  fromAmount: z.coerce.number().positive().max(1_000_000),
  flow: z.enum(['standard', 'fixed-rate']).optional(),
});

const createSchema = z.object({
  fromCurrency: z.string().min(2).max(20),
  toCurrency: z.string().min(2).max(20),
  fromAmount: z.coerce.number().positive().max(1_000_000),
  toAddress: z.string().min(8).max(200),
  refundAddress: z.string().min(8).max(200).optional(),
  flow: z.enum(['standard', 'fixed-rate']).optional(),
});

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    configured: changeNowProvider.isConfigured(),
    provider: 'ChangeNOW',
  });
});

router.get('/estimate', optionalAuthMiddleware, async (req: Request, res: Response) => {
  const parsed = estimateSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  try {
    const result = await changeNowProvider.estimate(parsed.data);
    return res.json({ success: true, data: result });
  } catch (e: any) {
    logger.error('[ChangeNOW estimate]', { error: e.message });
    return res.status(502).json({ success: false, error: 'estimate_failed', detail: e.message });
  }
});

router.post('/exchange', authMiddleware, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  try {
    const exchange = await changeNowProvider.createExchange({
      ...parsed.data,
      userId: req.user?.id,
    });
    return res.status(201).json({ success: true, data: exchange });
  } catch (e: any) {
    logger.error('[ChangeNOW exchange]', { error: e.message });
    return res.status(502).json({ success: false, error: 'exchange_failed', detail: e.message });
  }
});

router.get('/exchange/:id', authMiddleware, async (req: Request, res: Response) => {
  const id = String(req.params.id || '').trim();
  if (!id) {
    return res.status(400).json({ success: false, error: 'id required' });
  }
  try {
    const exchange = await changeNowProvider.getExchange(id);
    return res.json({ success: true, data: exchange });
  } catch (e: any) {
    logger.error('[ChangeNOW status]', { error: e.message });
    return res.status(502).json({ success: false, error: 'status_failed', detail: e.message });
  }
});

/**
 * HMAC-signed callback from our internal status-poller.
 * Body: { id: string, status: string }
 * Header: x-changenow-signature = HMAC-SHA256(rawBody, CHANGENOW_WEBHOOK_SECRET)
 */
router.post(
  '/callback',
  // We need the raw body for HMAC; mount express.json with verify upstream or
  // re-compute against JSON.stringify(req.body) — we choose the latter for
  // simplicity since our internal poller signs JSON.stringify of the same payload.
  async (req: Request, res: Response) => {
    const signature = String(req.headers['x-changenow-signature'] || '');
    const raw = JSON.stringify(req.body || {});
    if (!ChangeNowProvider.verifyWebhook(raw, signature)) {
      return res.status(401).json({ success: false, error: 'bad_signature' });
    }
    logger.info('[ChangeNOW callback]', { id: req.body?.id, status: req.body?.status });
    // TODO: enqueue reconciliation job here once Wave-1 wallet ledger lands.
    return res.json({ success: true });
  },
);

export default router;
