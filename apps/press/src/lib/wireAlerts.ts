/**
 * Wire feed alerts — email / Telegram beyond localStorage.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface WireAlertSubscribeInput {
  email?: string;
  telegramChatId?: string;
  sources: string[];
}

export async function subscribeWireAlerts(input: WireAlertSubscribeInput): Promise<void> {
  const res = await fetch(`${API}/api/v1/press/wire/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to subscribe to wire alerts');
  }
}

export async function unsubscribeWireAlerts(email: string, sources?: string[]): Promise<void> {
  await fetch(`${API}/api/v1/press/wire/alerts`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, sources }),
  });
}
