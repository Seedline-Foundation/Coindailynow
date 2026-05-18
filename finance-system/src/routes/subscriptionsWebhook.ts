import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';
import { transactionService } from '../services/TransactionService';
import { ledgerService } from '../services/LedgerService';

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
 * Backend subscription events → CFIS ledger (W2).
 * Handles: SUBSCRIPTION_PAYMENT (legacy), subscription.created, subscription.renewed, subscription.cancelled
 */
router.post('/webhook', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !verifySignature(req)) {
    res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid CFIS signature' } });
    return;
  }

  const { event, type, subscriptionId, userId, amount, invoiceNumber, currency, planId } = req.body;
  const eventName: string = event || type || '';

  if (!subscriptionId || !userId) {
    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'subscriptionId and userId required' } });
    return;
  }

  try {
    if (eventName === 'subscription.created') {
      await handleSubscriptionCreated(req.body);
    } else if (eventName === 'subscription.renewed') {
      await handleSubscriptionRenewed(req.body);
    } else if (eventName === 'subscription.cancelled') {
      await handleSubscriptionCancelled(req.body);
    } else {
      await handleLegacyPayment(req.body);
    }

    res.json({ success: true, received: true, event: eventName || 'SUBSCRIPTION_PAYMENT' });
  } catch (e: any) {
    console.error('[CFIS] Subscription webhook processing error:', e.message);
    res.status(500).json({ error: { code: 'PROCESSING_ERROR', message: e.message } });
  }
});

async function handleSubscriptionCreated(body: Record<string, any>): Promise<void> {
  const { subscriptionId, userId, amount, currency, planId, currentPeriodStart, currentPeriodEnd } = body;

  const tx = await transactionService.createTransaction({
    tx_type: 'SUBSCRIPTION_PAYMENT',
    amount: amount || 0,
    currency: currency || 'USD',
    description: `Subscription created — plan ${planId || 'unknown'}, user ${userId}`,
    requested_by: `BACKEND:${userId}`,
    metadata: { subscriptionId, planId, currentPeriodStart, currentPeriodEnd },
  });
  await transactionService.updateStatus(tx.id, 'COMPLETED');

  if (amount && amount > 0) {
    await ledgerService.createJournalEntry({
      description: `Subscription revenue — ${subscriptionId}`,
      reference_type: 'SUBSCRIPTION',
      reference_id: subscriptionId,
      created_by: 'WEBHOOK',
      lines: [
        { account_code: '1100', debit: amount, credit: 0, currency: currency || 'USD', description: 'Accounts receivable' },
        { account_code: '4100', debit: 0, credit: amount, currency: currency || 'USD', description: 'Subscription revenue' },
      ],
      metadata: { userId, planId, event: 'subscription.created' },
    });
  }

  await notificationService.notifySuperAdmin(
    `New subscription — ${currency || 'USD'} ${amount || 0}`,
    `User ${userId} subscribed (plan: ${planId || 'unknown'}). Subscription: ${subscriptionId}.`,
    'SUBSCRIPTION',
    'MEDIUM',
    'SUBSCRIPTION',
    subscriptionId,
  );

  await auditService.log({
    action: 'SUBSCRIPTION_CREATED',
    actor: `BACKEND:${userId}`,
    entity_type: 'SUBSCRIPTION',
    entity_id: subscriptionId,
    new_value: { amount, currency, planId },
  });
}

async function handleSubscriptionRenewed(body: Record<string, any>): Promise<void> {
  const { subscriptionId, userId, amount, currency, planId, currentPeriodStart, currentPeriodEnd } = body;

  const tx = await transactionService.createTransaction({
    tx_type: 'SUBSCRIPTION_PAYMENT',
    amount: amount || 0,
    currency: currency || 'USD',
    description: `Subscription renewed — plan ${planId || 'unknown'}, user ${userId}`,
    requested_by: `BACKEND:${userId}`,
    metadata: { subscriptionId, planId, currentPeriodStart, currentPeriodEnd },
  });
  await transactionService.updateStatus(tx.id, 'COMPLETED');

  if (amount && amount > 0) {
    await ledgerService.createJournalEntry({
      description: `Subscription renewal revenue — ${subscriptionId}`,
      reference_type: 'SUBSCRIPTION',
      reference_id: subscriptionId,
      created_by: 'WEBHOOK',
      lines: [
        { account_code: '1100', debit: amount, credit: 0, currency: currency || 'USD', description: 'Accounts receivable' },
        { account_code: '4100', debit: 0, credit: amount, currency: currency || 'USD', description: 'Subscription revenue' },
      ],
      metadata: { userId, planId, event: 'subscription.renewed' },
    });
  }

  await notificationService.notifySuperAdmin(
    `Subscription renewed — ${currency || 'USD'} ${amount || 0}`,
    `User ${userId} renewed subscription ${subscriptionId} (plan: ${planId || 'unknown'}).`,
    'SUBSCRIPTION',
    'LOW',
    'SUBSCRIPTION',
    subscriptionId,
  );

  await auditService.log({
    action: 'SUBSCRIPTION_RENEWED',
    actor: `BACKEND:${userId}`,
    entity_type: 'SUBSCRIPTION',
    entity_id: subscriptionId,
    new_value: { amount, currency, planId },
  });
}

async function handleSubscriptionCancelled(body: Record<string, any>): Promise<void> {
  const { subscriptionId, userId, planId, cancelledAt, currentPeriodEnd } = body;

  await notificationService.notifySuperAdmin(
    `Subscription cancelled`,
    `User ${userId} cancelled subscription ${subscriptionId} (plan: ${planId || 'unknown'}). Effective end: ${currentPeriodEnd || 'immediate'}.`,
    'SUBSCRIPTION',
    'MEDIUM',
    'SUBSCRIPTION',
    subscriptionId,
  );

  await auditService.log({
    action: 'SUBSCRIPTION_CANCELLED',
    actor: `BACKEND:${userId}`,
    entity_type: 'SUBSCRIPTION',
    entity_id: subscriptionId,
    new_value: { planId, cancelledAt, currentPeriodEnd },
  });
}

async function handleLegacyPayment(body: Record<string, any>): Promise<void> {
  const { subscriptionId, userId, amount, invoiceNumber, currency } = body;

  await notificationService.notifySuperAdmin(
    `Subscription payment — ${currency || 'USD'} ${amount}`,
    `User ${userId} paid subscription ${subscriptionId}. Invoice: ${invoiceNumber || 'n/a'}.`,
    'SUBSCRIPTION',
    'MEDIUM',
    'PAYMENT',
    subscriptionId,
  );

  await auditService.log({
    action: 'SUBSCRIPTION_PAYMENT_RECEIVED',
    actor: `BACKEND:${userId}`,
    entity_type: 'SUBSCRIPTION',
    entity_id: subscriptionId,
    new_value: { amount, invoiceNumber, currency },
  });
}

export default router;
