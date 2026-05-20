/**
 * CFIS → backend reverse webhook leg.
 *
 * Per documentations/launch/PRE_POST_LAUNCH_TODO.md spec:
 *   "finance-system ↔ superadmin handshake verified: payment lands in
 *    finance-system → finance-system sends transaction event → superadmin
 *    issues receipt → both stores reconcile."
 *
 * Backend already pushes events into CFIS via `cfisWebhookService.ts`. This
 * module is the missing reverse leg: when CFIS sees a confirmed transaction
 * (subscription payment, wallet deposit, swap, payroll), it POSTs an HMAC-
 * signed event to backend `/api/finance-events` so the backend can emit a
 * receipt PDF + mail it via Postmark/SES and update its own ledger projection.
 *
 * Env:
 *   BACKEND_API_URL          — required, base URL of the backend service
 *   BACKEND_HMAC_SECRET      — required, shared HMAC secret with backend
 *   CFIS_HMAC_SECRET         — optional fallback, for symmetry with backend
 */

import axios from 'axios';
import crypto from 'crypto';

export type CfisToBackendEventType =
  | 'PAYMENT_CONFIRMED'
  | 'WALLET_DEPOSIT_CONFIRMED'
  | 'WALLET_WITHDRAWAL_COMPLETED'
  | 'SWAP_COMPLETED'
  | 'PAYROLL_DISBURSED'
  | 'PRESS_PAYOUT_RELEASED'
  | 'TAX_REPORT_READY';

export interface BackendEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  type: CfisToBackendEventType;
  emittedAt: string;
  cfisTransactionId: string;
  /** When set, backend will reconcile the matching record in its DB. */
  backendReferenceId?: string;
  /** When set, backend will mail/queue a receipt PDF to this user. */
  userId?: string;
  payload: T;
}

export class BackendNotifier {
  private readonly baseUrl?: string;
  private readonly secret?: string;

  constructor(opts: { baseUrl?: string; secret?: string } = {}) {
    this.baseUrl = opts.baseUrl ?? process.env.BACKEND_API_URL;
    this.secret =
      opts.secret ?? process.env.BACKEND_HMAC_SECRET ?? process.env.CFIS_HMAC_SECRET;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.secret);
  }

  async emit<T extends Record<string, unknown>>(
    type: CfisToBackendEventType,
    cfisTransactionId: string,
    payload: T,
    extras: { userId?: string; backendReferenceId?: string } = {},
  ): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('[CFIS→Backend] Skip — BACKEND_API_URL or HMAC secret missing', { type });
      return;
    }

    const event: BackendEvent<T> = {
      type,
      emittedAt: new Date().toISOString(),
      cfisTransactionId,
      payload,
      ...extras,
    };

    const body = JSON.stringify(event);
    const timestamp = String(Date.now());
    const signature = crypto
      .createHmac('sha256', this.secret!)
      .update(timestamp + '.' + body)
      .digest('hex');

    try {
      const url = `${this.baseUrl!.replace(/\/$/, '')}/api/finance-events`;
      const res = await axios.post(url, event, {
        headers: {
          'Content-Type': 'application/json',
          'x-cfis-signature': signature,
          'x-cfis-timestamp': timestamp,
        },
        timeout: 10_000,
      });
      console.log('[CFIS→Backend] ok', { type, cfisTransactionId, status: res.status });
    } catch (e: any) {
      console.error('[CFIS→Backend] fail', {
        type,
        cfisTransactionId,
        error: e.response?.data || e.message,
      });
      // Swallow — never fail a CFIS DB transaction because backend is down.
      // A reconciliation worker will replay missed events.
    }
  }
}

export const backendNotifier = new BackendNotifier();
