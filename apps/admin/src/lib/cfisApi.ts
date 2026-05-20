/**
 * CFIS API Client — calls CoinDaily Financial Intelligence System endpoints.
 * CFIS runs on a separate port (default 3005) and uses Super Admin JWT auth.
 */

import { getAccessToken } from './auth';

const CFIS_BASE =
  process.env.NEXT_PUBLIC_CFIS_URL ||
  process.env.NEXT_PUBLIC_FINANCE_SYSTEM_URL ||
  'http://localhost:3005';

export interface CfisResponse<T = unknown> {
  data?: T;
  total?: number;
  error?: { code: string; message: string };
}

async function cfisRequest<T = unknown>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<CfisResponse<T>> {
  const token = typeof window !== 'undefined' ? getAccessToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${CFIS_BASE.replace(/\/$/, '')}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as CfisResponse<T>;
  if (!res.ok) {
    const msg = json.error?.message || `CFIS API error: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// ─── Dashboard ────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalWallets: number;
  activeEscrows: number;
  pendingPayrolls: number;
  pendingPartnerships: number;
  activeAirdrops: number;
  pendingVerifications: number;
  recentTransactions: Transaction[];
  unreadNotifications: number;
}

export interface Transaction {
  id: string;
  tx_type: string;
  status: string;
  from_wallet_id?: string;
  to_wallet_id?: string;
  amount: number;
  currency: string;
  fee: number;
  description?: string;
  requested_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  metadata: Record<string, unknown>;
}

export interface Wallet {
  id: string;
  owner_type: string;
  owner_id: string;
  wallet_address?: string;
  balance_points: number;
  balance_jy: number;
  balance_usd: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface SystemHealth {
  database: string;
  pendingTransactions: number;
  failedLast24h: number;
  timestamp: string;
}

export async function fetchDashboardStats() {
  return cfisRequest<DashboardStats>('/api/dashboard/stats');
}

export async function fetchSystemHealth() {
  return cfisRequest<SystemHealth>('/api/dashboard/health');
}

export async function fetchRevenueByType() {
  return cfisRequest<Array<{ tx_type: string; currency: string; total: number; count: number }>>(
    '/api/dashboard/revenue-by-type',
  );
}

// ─── Transactions ─────────────────────────────────────────────

export async function fetchTransactions(params?: {
  status?: string;
  tx_type?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.tx_type) qs.set('tx_type', params.tx_type);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const suffix = qs.toString() ? `?${qs}` : '';
  return cfisRequest<Transaction[]>(`/api/transactions${suffix}`);
}

export async function fetchPendingTransactions() {
  return cfisRequest<Transaction[]>('/api/transactions/pending');
}

// ─── Wallets ──────────────────────────────────────────────────

export async function fetchWallets(ownerType?: string) {
  const qs = ownerType ? `?owner_type=${ownerType}` : '';
  return cfisRequest<Wallet[]>(`/api/wallets${qs}`);
}

// ─── CFIS Health (public, no auth) ────────────────────────────

export async function fetchCfisHealth(): Promise<{
  status: string;
  system: string;
  version: string;
  uptime: number;
} | null> {
  try {
    const res = await fetch(`${CFIS_BASE.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function getCfisDashboardUrl(): string {
  return `${CFIS_BASE.replace(/\/$/, '')}/dashboard`;
}
