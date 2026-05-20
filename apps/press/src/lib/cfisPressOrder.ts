/**
 * CFIS escrow handshake after press distribution order is created.
 *
 * The actual HMAC signing happens server-side in the API route
 * (/api/cfis/press-order) so the secret is never exposed to the browser.
 */

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
  const res = await fetch('/api/cfis/press-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'CFIS escrow handshake failed');
  }
}
