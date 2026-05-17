/**
 * YellowCard checkout session for press distribution (fiat on-ramp to fund JOY escrow).
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PressCheckoutInput {
  orderId: string;
  publisherId: string;
  amountUsd: number;
  email?: string;
}

export async function createYellowCardCheckout(input: PressCheckoutInput) {
  const res = await fetch(`${API}/api/v1/press/checkout/yellowcard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || 'Checkout failed');
  }
  return res.json() as Promise<{ checkoutUrl: string; reference: string }>;
}

export function openYellowCardCheckout(checkoutUrl: string) {
  if (typeof window === 'undefined') return;
  window.open(checkoutUrl, 'yellowcard_checkout', 'width=480,height=720');
}
