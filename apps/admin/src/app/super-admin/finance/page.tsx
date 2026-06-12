'use client';

/**
 * GAP-3-1: CFIS Dashboard — Financial Intelligence overview embedded in the admin panel.
 * Fetches live data from CFIS API endpoints and renders key metrics, recent
 * transactions, pending approvals, fraud summary, and wallet balances.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Loader2,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchPendingTransactions,
  fetchWallets,
  fetchCfisHealth,
  type DashboardStats,
  type Transaction,
  type Wallet as WalletType,
} from '@/lib/cfisApi';

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'JY' || currency === 'POINTS') {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
  APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  AI_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REVERSED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function statusBadge(status: string) {
  const style = STATUS_STYLES[status] || 'bg-dark-700 text-dark-300 border-dark-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

function txTypeLabel(txType: string): string {
  return txType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Metric Card ──────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'text-white',
  subValue,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  subValue?: string;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-dark-400">{label}</span>
        <div className={`p-2 rounded-lg bg-dark-800 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subValue && <p className="text-xs text-dark-400 mt-1">{subValue}</p>}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────

export default function SuperAdminFinancePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pending, setPending] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [cfisOnline, setCfisOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statsRes, pendingRes, walletsRes, health] = await Promise.allSettled([
        fetchDashboardStats(),
        fetchPendingTransactions(),
        fetchWallets(),
        fetchCfisHealth(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      } else if (statsRes.status === 'rejected') {
        setError(statsRes.reason?.message || 'Failed to load dashboard stats');
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value.data) {
        setPending(pendingRes.value.data);
      }

      if (walletsRes.status === 'fulfilled' && walletsRes.value.data) {
        setWallets(walletsRes.value.data);
      }

      setCfisOnline(health.status === 'fulfilled' && health.value !== null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ─── Loading State ────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="text-dark-400 text-sm">Loading CFIS dashboard…</p>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 rounded-full bg-red-500/10">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white">CFIS Unavailable</h2>
        <p className="text-dark-400 text-sm max-w-md text-center">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Derived values
  const treasuryWallets = wallets.filter((w) => w.owner_type === 'TREASURY');
  const totalWalletBalanceJY = wallets.reduce((sum, w) => sum + (w.balance_jy || 0), 0);
  const totalWalletBalanceUSD = wallets.reduce((sum, w) => sum + (w.balance_usd || 0), 0);

  const fraudTxCount =
    stats?.recentTransactions?.filter((t) => t.status === 'REJECTED' || t.status === 'FAILED').length ?? 0;

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CFIS — Financial Intelligence</h1>
          <p className="text-dark-400 text-sm mt-1">
            CoinDaily Financial Intelligence System overview. Real-time metrics from CFIS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* CFIS status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 border border-dark-700 rounded-lg text-xs">
            <Server className="w-3.5 h-3.5" />
            <span className="text-dark-400">CFIS</span>
            {cfisOnline === null ? (
              <span className="w-2 h-2 rounded-full bg-dark-500 animate-pulse" />
            ) : cfisOnline ? (
              <span className="w-2 h-2 rounded-full bg-green-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 border border-dark-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Key Metrics ───────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={TrendingUp}
            color="text-green-400"
            subValue="All completed inflows"
          />
          <MetricCard
            label="Total Expenses"
            value={formatCurrency(stats.totalExpenses)}
            icon={TrendingDown}
            color="text-red-400"
            subValue="All completed outflows"
          />
          <MetricCard
            label="Net Income"
            value={formatCurrency(stats.netIncome)}
            icon={DollarSign}
            color={stats.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}
            subValue="Revenue − Expenses"
          />
          <MetricCard
            label="Pending Transactions"
            value={pending.length}
            icon={Clock}
            color="text-yellow-400"
            subValue={`${stats.pendingVerifications} awaiting AI review`}
          />
        </div>
      )}

      {/* ─── Secondary Metrics ─────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Wallets" value={stats.totalWallets} icon={Wallet} />
          <MetricCard label="Active Escrows" value={stats.activeEscrows} icon={Activity} />
          <MetricCard label="Pending Payrolls" value={stats.pendingPayrolls} icon={Clock} color="text-yellow-400" />
          <MetricCard label="Partnerships" value={stats.pendingPartnerships} icon={ArrowUpRight} color="text-blue-400" />
          <MetricCard label="Active Airdrops" value={stats.activeAirdrops} icon={ArrowDownRight} color="text-purple-400" />
          <MetricCard label="Notifications" value={stats.unreadNotifications} icon={AlertTriangle} color="text-orange-400" />
        </div>
      )}

      {/* ─── Middle Row: Pending Approvals + Wallet Balances ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Transactions */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" /> Pending Transactions
            </h2>
            <span className="text-xs text-dark-400">{pending.length} awaiting action</span>
          </div>
          <div className="divide-y divide-dark-800 max-h-[420px] overflow-y-auto">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-dark-500">
                <CheckCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">No pending transactions</p>
              </div>
            ) : (
              pending.slice(0, 15).map((tx) => (
                <div key={tx.id} className="px-5 py-3 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(tx.status)}
                        <span className="text-xs text-dark-500 font-mono truncate">{tx.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-white truncate">{txTypeLabel(tx.tx_type)}</p>
                      {tx.description && (
                        <p className="text-xs text-dark-400 truncate mt-0.5">{tx.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <p className="text-xs text-dark-500">{timeAgo(tx.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wallet Balances */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-400" /> Wallet Balances
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Summary */}
            <div className="bg-dark-800 rounded-lg p-4 space-y-2">
              <p className="text-xs text-dark-400 uppercase tracking-wider">Aggregate Balance</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalWalletBalanceUSD)}</p>
              <p className="text-sm text-dark-400">
                {totalWalletBalanceJY.toLocaleString(undefined, { maximumFractionDigits: 2 })} JY
              </p>
            </div>

            {/* Treasury wallets */}
            {treasuryWallets.length > 0 && (
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Treasury</p>
                <div className="space-y-2">
                  {treasuryWallets.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between bg-dark-800 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-dark-300 truncate">
                          {w.wallet_address ? `${w.wallet_address.slice(0, 10)}…` : w.id.slice(0, 8)}
                        </p>
                        <p className="text-[10px] text-dark-500">{w.owner_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatCurrency(w.balance_usd)}</p>
                        <p className="text-[10px] text-dark-500">
                          {w.balance_jy.toLocaleString()} JY
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet count by type */}
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">By Type</p>
              <div className="space-y-1">
                {Object.entries(
                  wallets.reduce<Record<string, number>>((acc, w) => {
                    acc[w.owner_type] = (acc[w.owner_type] || 0) + 1;
                    return acc;
                  }, {}),
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">{type}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Recent Transactions + Fraud Summary ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" /> Recent Transactions
            </h2>
            <span className="text-xs text-dark-400">Last 20</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-dark-400 uppercase border-b border-dark-800">
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {(stats?.recentTransactions ?? []).map((tx) => (
                  <tr key={tx.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="px-5 py-3">{statusBadge(tx.status)}</td>
                    <td className="px-5 py-3 text-white">{txTypeLabel(tx.tx_type)}</td>
                    <td className="px-5 py-3 text-right font-medium text-white">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-5 py-3 text-right text-dark-400">{timeAgo(tx.created_at)}</td>
                  </tr>
                ))}
                {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-dark-500">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fraud Alert Summary */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Fraud Summary
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{fraudTxCount}</p>
                <p className="text-xs text-dark-400 mt-1">Rejected / Failed (Recent)</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats?.pendingVerifications ?? 0}</p>
                <p className="text-xs text-dark-400 mt-1">Pending AI Verification</p>
              </div>
            </div>

            <div className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <p className="text-sm font-medium text-white">ARIA AI Agent</p>
              </div>
              <p className="text-xs text-dark-400 leading-relaxed">
                All outbound transactions are verified by the ARIA AI agent before execution.
                Flagged transactions require Super Admin manual approval in the CFIS dashboard.
              </p>
            </div>

            <a
              href="/super-admin/fraud-alerts"
              className="block w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium text-center transition-colors"
            >
              View Full Fraud Alerts Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
