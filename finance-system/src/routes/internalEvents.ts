import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';

const router = Router();
const SECRET = process.env.CFIS_HMAC_SECRET || process.env.PRESS_HMAC_SECRET || '';

function verifySignature(req: Request): boolean {
  const signature = req.headers['x-cfis-signature'] as string;
  const timestamp = req.headers['x-cfis-timestamp'] as string;
  if (!signature || !timestamp || !SECRET) return false;
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > 5 * 60 * 1000) return false;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(timestamp + '.' + JSON.stringify(req.body))
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** POST /api/internal/events — generic backend → CFIS events (GAP-1-2) */
router.post('/events', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !verifySignature(req)) {
    res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
    return;
  }

  const { type, ...rest } = req.body;
  await notificationService.notifySuperAdmin(
    `Backend event: ${type || 'UNKNOWN'}`,
    JSON.stringify(rest).slice(0, 500),
    'SYSTEM',
    'NORMAL',
    'EVENT',
    String(rest.userId || rest.orderId || 'n/a'),
  );

  await auditService.log({
    action: `BACKEND_EVENT_${type || 'UNKNOWN'}`,
    actor: 'BACKEND',
    entity_type: 'EVENT',
    entity_id: String(rest.subscriptionId || rest.transactionId || Date.now()),
    metadata: rest,
  });

  res.json({ success: true });
});

export default router;
