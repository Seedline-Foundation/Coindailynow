'use client';

/**
 * IP whitelist management UI (SPEC-ADM-6).
 *
 * Lists env-static and Redis-dynamic entries, lets SUPER_ADMIN/TECH_ADMIN add
 * or remove dynamic ones, and shows the audit log.
 */

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Entry {
  cidr: string;
  label?: string;
  addedBy: string;
  addedAt: string;
}

interface ListResponse {
  success: boolean;
  env: string[];
  dynamic: Entry[];
  merged: string[];
  error?: string;
}

interface AuditItem {
  action: 'add' | 'remove';
  entry?: Entry;
  cidr?: string;
  by?: string;
  ts: string;
}

export default function IpWhitelistPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cidr, setCidr] = useState('');
  const [label, setLabel] = useState('');

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
      const [listRes, auditRes] = await Promise.all([
        fetch(`${API}/api/admin/ip-whitelist`, { headers: headers() }),
        fetch(`${API}/api/admin/ip-whitelist/audit`, { headers: headers() }),
      ]);
      const listJson = (await listRes.json()) as ListResponse;
      if (!listRes.ok || !listJson.success) {
        throw new Error(listJson.error || `list ${listRes.status}`);
      }
      setData(listJson);
      const auditJson = (await auditRes.json()) as { success: boolean; items: AuditItem[] };
      setAudit(auditJson.items || []);
    } catch (e: any) {
      setError(e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/ip-whitelist`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ cidr, label: label || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(JSON.stringify(json.error || json));
      setCidr('');
      setLabel('');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'add failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(target: string) {
    if (!confirm(`Remove ${target} from the dynamic whitelist?`)) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/admin/ip-whitelist/${encodeURIComponent(target)}`,
        { method: 'DELETE', headers: headers() },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(JSON.stringify(json.error || json));
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'remove failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            IP Whitelist
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Static entries come from <code className="text-amber-400">ADMIN_WHITELISTED_IPS</code>{' '}
            (env). Dynamic entries below take effect within 60 s of the next admin app build.
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
        <h2 className="font-semibold text-white mb-3">Add dynamic entry</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            placeholder="203.0.113.5 or 203.0.113.0/24"
            required
            className="flex-1 min-w-[260px] bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 min-w-[200px] bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-medium text-sm rounded-md"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl">
        <header className="px-5 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 uppercase tracking-wider">
          Static (env)
        </header>
        <ul className="px-5 py-3 space-y-1">
          {(data?.env || []).map((ip) => (
            <li key={ip} className="font-mono text-sm text-gray-200">
              {ip}
            </li>
          ))}
          {!data?.env?.length && <li className="text-sm text-gray-500">(none configured)</li>}
        </ul>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl">
        <header className="px-5 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 uppercase tracking-wider">
          Dynamic (Redis)
        </header>
        <ul className="divide-y divide-gray-800">
          {(data?.dynamic || []).map((entry) => (
            <li key={entry.cidr} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-sm text-gray-100">{entry.cidr}</div>
                {entry.label && <div className="text-xs text-gray-500">{entry.label}</div>}
                <div className="text-[11px] text-gray-600">
                  added by {entry.addedBy} · {new Date(entry.addedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleRemove(entry.cidr)}
                disabled={submitting}
                className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-500/10"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
          {!data?.dynamic?.length && (
            <li className="px-5 py-3 text-sm text-gray-500">(no dynamic entries yet)</li>
          )}
        </ul>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl">
        <header className="px-5 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 uppercase tracking-wider">
          Audit (last 200)
        </header>
        <ul className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
          {audit.map((item, i) => (
            <li key={i} className="px-5 py-2 text-xs font-mono text-gray-400">
              <span
                className={
                  item.action === 'add'
                    ? 'text-emerald-400'
                    : item.action === 'remove'
                      ? 'text-red-400'
                      : 'text-gray-300'
                }
              >
                {item.action.toUpperCase().padEnd(7)}
              </span>
              {' · '}
              {item.entry?.cidr || item.cidr}
              {' · '}
              <span className="text-gray-500">{new Date(item.ts).toLocaleString()}</span>
            </li>
          ))}
          {!audit.length && <li className="px-5 py-3 text-sm text-gray-500">(no events)</li>}
        </ul>
      </section>
    </div>
  );
}
