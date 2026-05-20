/**
 * Backend → CFIS event webhooks (GAP-1-2).
 */

import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export type CfisEventType =
  | 'SUBSCRIPTION_PAYMENT'
  | 'WALLET_DEPOSIT'
  | 'WALLET_SWAP'
  | 'PRESS_ORDER'
  | 'PAYOUT'
  | 'TAX_EXPORT';

export type CfisSubscriptionEventType =
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled';

export async function emitCfisEvent(
  type: CfisEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const baseUrl = process.env.CFIS_API_URL || process.env.FINANCE_SYSTEM_URL;
  const secret = process.env.CFIS_HMAC_SECRET || process.env.PRESS_HMAC_SECRET;
  if (!baseUrl || !secret) {
    logger.debug('[CFIS] Webhook skipped — CFIS_API_URL or CFIS_HMAC_SECRET not set');
    return;
  }

  const timestamp = String(Date.now());
  const body = { type, ...payload, emittedAt: new Date().toISOString() };
  const sigPayload = timestamp + '.' + JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret).update(sigPayload).digest('hex');

  const path =
    type === 'SUBSCRIPTION_PAYMENT'
      ? '/api/subscriptions/webhook'
      : '/api/internal/events';

  try {
    await axios.post(`${baseUrl.replace(/\/$/, '')}${path}`, body, {
      headers: {
        'x-cfis-signature': signature,
        'x-cfis-timestamp': timestamp,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  } catch (e: any) {
    logger.warn('[CFIS] Webhook failed', { type, error: e.message });
  }
}

/**
 * Emit a subscription-lifecycle webhook to CFIS (W2).
 * Events: subscription.created, subscription.renewed, subscription.cancelled
 */
export async function emitCfisSubscriptionEvent(
  event: CfisSubscriptionEventType,
  payload: {
    subscriptionId: string;
    userId: string;
    planId: string;
    amount?: number;
    currency?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelledAt?: string;
    [key: string]: unknown;
  },
): Promise<void> {
  const baseUrl = process.env.CFIS_API_URL || process.env.FINANCE_SYSTEM_URL;
  const secret = process.env.CFIS_HMAC_SECRET || process.env.PRESS_HMAC_SECRET;
  if (!baseUrl || !secret) {
    logger.debug('[CFIS] Subscription webhook skipped — CFIS_API_URL or CFIS_HMAC_SECRET not set');
    return;
  }

  const timestamp = String(Date.now());
  const body = { event, ...payload, emittedAt: new Date().toISOString() };
  const sigPayload = timestamp + '.' + JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret).update(sigPayload).digest('hex');

  try {
    await axios.post(`${baseUrl.replace(/\/$/, '')}/api/subscriptions/webhook`, body, {
      headers: {
        'x-cfis-signature': signature,
        'x-cfis-timestamp': timestamp,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    logger.info('[CFIS] Subscription webhook sent', { event, subscriptionId: payload.subscriptionId });
  } catch (e: any) {
    logger.warn('[CFIS] Subscription webhook failed', { event, error: e.message });
  }
}
