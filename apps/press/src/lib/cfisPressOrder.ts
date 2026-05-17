/**
 * CFIS escrow handshake after press distribution order is created.
 */

const CFIS_URL = process.env.NEXT_PUBLIC_CFIS_API_URL || process.env.NEXT_PUBLIC_FINANCE_API_URL;

export interface CfisPressOrderPayload {
  orderId: string;
  publisherId: string;
  publisherEmail?: string;
  publisherWallet?: string;
  amount: number;
  prTitle: string;
  targetSites: string[];
  siteUrl?: string;
  tier?: string;
}

export async function notifyCfisPressOrder(payload: CfisPressOrderPayload): Promise<void> {
  if (!CFIS_URL) {
    console.warn('[CFIS] NEXT_PUBLIC_CFIS_API_URL not set — escrow handshake skipped');
    return;
  }

  const res = await fetch(`${CFIS_URL.replace(/\/$/, '')}/api/press-orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-press-timestamp': String(Date.now()),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'CFIS escrow handshake failed');
  }
}
