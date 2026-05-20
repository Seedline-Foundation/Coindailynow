import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';
import { backendNotifier } from '../services/BackendNotifier';

const router = Router();
const SECRET = process.env.CFIS_HMAC_SECRET || process.env.PRESS_HMAC_SECRET || '';

function verifySignature(req: Request): boolean {
  const signature = req.headers['x-cfis-signature'] as string;
  const timestamp = req.headers['x-cfis-timestamp'] as string;
  if (!signature || !timestamp || !SECRET) return false;
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > 5 * 60 * 1000) return false;
  const payload = timestamp + '.' + JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * POST /api/subscriptions/webhook
 * Backend subscription payments → CFIS ledger notification (Super Admin visibility).
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !verifySignature(req)) {
    res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid CFIS signature' } });
    return;
  }

  const { subscriptionId, userId, amount, invoiceNumber, currency } = req.body;
  if (!subscriptionId || !userId) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'subscriptionId and userId required' } });
    return;
  }

  await notificationService.notifySuperAdmin(
    `Subscription payment — ${currency || 'USD'} ${amount}`,
    `User ${userId} paid subscription ${subscriptionId}. Invoice: ${invoiceNumber || 'n/a'}.`,
    'SUBSCRIPTION',
    'NORMAL',
    'PAYMENT',
    subscriptionId,
  );

  await auditService.log({
    action: 'SUBSCRIPTION_PAYMENT_RECEIVED',
    actor: `BACKEND:${userId}`,
    entity_type: 'SUBSCRIPTION',
    entity_id: subscriptionId,
    metadata: { amount, invoiceNumber, currency },
  });

  // Reverse leg: tell backend the payment is confirmed in CFIS so it can
  // issue + email the receipt PDF and update its own subscription record.
  await backendNotifier.emit(
    'PAYMENT_CONFIRMED',
    subscriptionId,
    {
      amount,
      currency: currency || 'USD',
      invoiceNumber: invoiceNumber || `INV-${subscriptionId}`,
      kind: 'SUBSCRIPTION',
    },
    { userId, backendReferenceId: subscriptionId },
  );

  res.json({ success: true, received: true });
});

export default router;
