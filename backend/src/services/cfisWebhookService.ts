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
