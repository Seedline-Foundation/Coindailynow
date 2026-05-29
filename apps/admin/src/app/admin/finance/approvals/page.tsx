'use client';

/**
 * Financial approvals (SPEC-ADM-5).
 *
 * Two-step approval ceremony for high-value outbound money movements.
 * 1. Anyone with FINANCE_READ files a request (kind, amount, recipient).
 * 2. CEO/SUPER_ADMIN decides approve/reject — approve issues a
 *    confirmation token (5-min TTL).
 * 3. Approver re-confirms with the token; backend marks executed and
 *    forwards to CFIS for ledger persistence.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  CircleDollarSign,
  Check,
  X,
  Send,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Status = 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';

interface Approval {
  id: string;
  kind: 'WITHDRAWAL' | 'PAYROLL' | 'PRESS_PAYOUT' | 'BUYBACK';
  amount: number;
  currency: string;
  recipient: string;
  reason?: string;
  status: Status;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
  confirmationToken?: string;
}

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  executed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function FinanceApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingTokens, setPendingTokens] = useState<Record<string, string>>({});

  // New request form
  const [form, setForm] = useState({
    kind: 'WITHDRAWAL' as Approval['kind'],
    amount: '',
    currency: 'USD',
    recipient: '',
    reason: '',
  });

  const headers = useCallback((): HeadersInit => {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/finance-approvals`, { headers: headers() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `list ${res.status}`);
      setItems(json.items || []);
    } catch (e: any) {
      setError(e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy('new');
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/finance-approvals`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          kind: form.kind,
          amount: Number(form.amount),
          currency: form.currency.toUpperCase(),
          recipient: form.recipient,
          reason: form.reason || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(JSON.stringify(json.error || json));
      setForm({ kind: 'WITHDRAWAL', amount: '', currency: 'USD', recipient: '', reason: '' });
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'submit failed');
    } finally {
      setBusy(null);
    }
  }

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/finance-approvals/${id}/decide`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ decision }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(JSON.stringify(json.error || json));
      if (decision === 'approve' && json.confirmationToken) {
        setPendingTokens((m) => ({ ...m, [id]: json.confirmationToken }));
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'decide failed');
    } finally {
      setBusy(null);
    }
  }

  async function commit(id: string) {
    const token = pendingTokens[id];
    if (!token) {
      setError('No confirmation token in memory. Re-approve to refresh it.');
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/finance-approvals/${id}/commit`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ confirmationToken: token }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(JSON.stringify(json.error || json));
      setPendingTokens((m) => {
        const { [id]: _, ...rest } = m;
        return rest;
      });
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'commit failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-400" />
            Financial Approvals
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Two-step ceremony for outbound money movements. CEO/SUPER_ADMIN approve;
            confirmation token is single-use and expires in 5 minutes.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-lg">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap break-all">{error}</pre>
        </div>
      )}

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3">File approval request</h2>
        <form onSubmit={submitRequest} className="grid sm:grid-cols-2 gap-3">
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Approval['kind'] }))}
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          >
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="PAYROLL">PAYROLL</option>
            <option value="PRESS_PAYOUT">PRESS_PAYOUT</option>
            <option value="BUYBACK">BUYBACK</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            placeholder="Currency (USD/JY)"
            required
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            placeholder="Recipient (wallet/address/userId)"
            required
            value={form.recipient}
            onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))}
            className="bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <textarea
            placeholder="Reason / context"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={2}
            className="sm:col-span-2 bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy === 'new'}
            className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-medium py-2 rounded-md text-sm"
          >
            File request
          </button>
        </form>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl">
        <header className="px-5 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 uppercase tracking-wider">
          Approvals
        </header>
        <ul className="divide-y divide-gray-800">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-white">
                    {item.kind} · {item.currency} {item.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    → {item.recipient} · requested by {item.requestedBy} ·{' '}
                    {new Date(item.requestedAt).toLocaleString()}
                  </div>
                  {item.reason && (
                    <div className="text-xs text-gray-500 mt-1 italic">"{item.reason}"</div>
                  )}
                </div>
                <span
                  className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
              </div>

              {item.decidedBy && (
                <div className="text-[11px] text-gray-500">
                  Decided by {item.decidedBy} · {new Date(item.decidedAt!).toLocaleString()}
                  {item.decisionReason && ` · ${item.decisionReason}`}
                </div>
              )}

              {item.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => decide(item.id, 'approve')}
                    disabled={busy === item.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-medium rounded-md"
                  >
                    <Check className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => decide(item.id, 'reject')}
                    disabled={busy === item.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-medium rounded-md"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}

              {item.status === 'approved' && (
                <div className="flex items-center gap-2 pt-1">
                  {pendingTokens[item.id] ? (
                    <button
                      onClick={() => commit(item.id)}
                      disabled={busy === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium rounded-md"
                    >
                      <Send className="w-3 h-3" /> Confirm & execute
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                      <Clock className="w-3 h-3" /> Re-approve to refresh confirmation token
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <ShieldCheck className="w-3 h-3" /> token expires 5 min after approval
                  </span>
                </div>
              )}
            </li>
          ))}
          {!items.length && <li className="px-5 py-3 text-sm text-gray-500">(no approvals yet)</li>}
        </ul>
      </section>
    </div>
  );
}
