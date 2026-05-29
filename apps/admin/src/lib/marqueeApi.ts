import { getAuthHeaders as buildAuthHeaders } from '@/lib/auth';
/**
 * Marquee admin API — targets backend `/api/marquee/admin*` routes.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const BASE = `${API_URL}/api/marquee`;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  return buildAuthHeaders();
}

export type MarqueeApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

async function marqueeRequest<T extends MarqueeApiResponse>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers: getAuthHeaders(),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(json.error || json.message || `Marquee API error: ${res.status}`);
  }
  return json as T;
}

export const marqueeApi = {
  list: () => marqueeRequest<MarqueeApiResponse<unknown[]>>('/admin'),
  create: (body: unknown) =>
    marqueeRequest<MarqueeApiResponse>('/admin', { method: 'POST', body }),
  update: (id: string, body: unknown) =>
    marqueeRequest<MarqueeApiResponse>(`/admin/${id}`, { method: 'PUT', body }),
  remove: (id: string) =>
    marqueeRequest<MarqueeApiResponse>(`/admin/${id}`, { method: 'DELETE' }),
  listItems: (marqueeId: string) =>
    marqueeRequest<MarqueeApiResponse<unknown[]>>(`/admin/${marqueeId}/items`),
  createItem: (marqueeId: string, body: unknown) =>
    marqueeRequest<MarqueeApiResponse>(`/admin/${marqueeId}/items`, {
      method: 'POST',
      body,
    }),
  updateItem: (marqueeId: string, itemId: string, body: unknown) =>
    marqueeRequest<MarqueeApiResponse>(`/admin/${marqueeId}/items/${itemId}`, {
      method: 'PUT',
      body,
    }),
  removeItem: (marqueeId: string, itemId: string) =>
    marqueeRequest<MarqueeApiResponse>(`/admin/${marqueeId}/items/${itemId}`, {
      method: 'DELETE',
    }),
};
