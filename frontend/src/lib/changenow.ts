/**
 * Browser-side ChangeNOW client. Pairs with backend/src/api/routes/v1Changenow.routes.ts.
 *
 * The diaspora swap UX uses this for:
 *   - GET /estimate — instant rate quotes with no auth
 *   - POST /exchange — create a real swap (requires auth)
 *   - GET /exchange/:id — poll until finished
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ChangeNowEstimate {
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  rateId?: string;
  validUntil?: string;
  fee: string;
  flow: 'standard' | 'fixed-rate';
}

export interface ChangeNowExchange {
  id: string;
  fromAmount: string;
  toAmount: string;
  fromCurrency: string;
  toCurrency: string;
  payinAddress: string;
  payoutAddress: string;
  status: string;
  createdAt: string;
}

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function estimateChangeNow(params: {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  flow?: 'standard' | 'fixed-rate';
}): Promise<ChangeNowEstimate> {
  const qs = new URLSearchParams({
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    fromAmount: String(params.fromAmount),
    ...(params.flow ? { flow: params.flow } : {}),
  });
  const res = await fetch(`${API}/api/v1/changenow/estimate?${qs.toString()}`);
  if (!res.ok) throw new Error(`estimate ${res.status}`);
  const json = (await res.json()) as { success: boolean; data?: ChangeNowEstimate; error?: string };
  if (!json.success || !json.data) throw new Error(json.error || 'estimate_failed');
  return json.data;
}

export async function createChangeNowExchange(
  input: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAddress: string;
    refundAddress?: string;
    flow?: 'standard' | 'fixed-rate';
  },
  token: string,
): Promise<ChangeNowExchange> {
  const res = await fetch(`${API}/api/v1/changenow/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as { success: boolean; data?: ChangeNowExchange; error?: string };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'exchange_failed');
  }
  return json.data;
}

export async function getChangeNowExchange(id: string, token: string): Promise<ChangeNowExchange> {
  const res = await fetch(`${API}/api/v1/changenow/exchange/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  const json = (await res.json()) as { success: boolean; data?: ChangeNowExchange; error?: string };
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || 'status_failed');
  }
  return json.data;
}
