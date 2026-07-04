'use client';

/**
 * /super-admin/dashboard-access (P10.5)
 *
 * CEO surface for controlling which sidebar menus each staff member sees.
 * Top: staff list (clickable). Right: grid of menu IDs grouped by domain,
 * plus role preset buttons that auto-tick a standard kit.
 *
 * SUPER_ADMIN + CEO bypass all restrictions on the backend; this UI hides
 * the toggles for them in the staff list (their row is informational only).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, RefreshCw, Save, ShieldAlert,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface MenuItem { id: string; label: string; group: string; }
interface RolePreset { label: string; menus: string[]; }
interface StaffUser {
  id: string; email: string; username: string;
  firstName?: string; lastName?: string;
  role: string; status?: string;
  lastLoginAt?: string;
  access?: { presetRole?: string; allowedMenuIds: string[]; updatedAt?: string } | null;
}

const GROUP_LABELS: Record<string, string> = {
  always: 'Always visible (forced)',
  content: 'Content + AI',
  users: 'Users + Community',
  hr: 'HR + Events',
  finance: 'Finance + Monetization',
  security: 'Security + Compliance',
  ops: 'Admin + Ops',
  market: 'Market + Regulatory',
  misc: 'Other',
};

export default function DashboardAccessPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [presets, setPresets] = useState<Record<string, RolePreset>>({});
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [draftPreset, setDraftPreset] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const headers = useMemo<Record<string, string>>(() => {
    const t = getAccessToken();
    const h: Record<string, string> = {};
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menusRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/dashboard-access/menus`, { headers }),
        fetch(`${API_URL}/api/admin/dashboard-access/users`, { headers }),
      ]);
      if (usersRes.status === 403) {
        setForbidden(true);
        setUsers([]);
        return;
      }
      if (!menusRes.ok) throw new Error(`menus HTTP ${menusRes.status}`);
      if (!usersRes.ok) throw new Error(`users HTTP ${usersRes.status}`);
      const menusJson = await menusRes.json();
      const usersJson = await usersRes.json();
      setMenus(menusJson.menus || []);
      setPresets(menusJson.presets || {});
      setUsers(usersJson.users || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { refresh(); }, [refresh]);

  const selected = users.find(u => u.id === selectedId) || null;

  const selectUser = (u: StaffUser) => {
    setSelectedId(u.id);
    setDraft(new Set(u.access?.allowedMenuIds || []));
    setDraftPreset(u.access?.presetRole || '');
  };

  const togglemenu = (id: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyPreset = (presetKey: string) => {
    const p = presets[presetKey];
    if (!p) return;
    setDraft(new Set(p.menus));
    setDraftPreset(presetKey);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard-access/users/${selected.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetRole: draftPreset || undefined,
          allowedMenuIds: Array.from(draft),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    for (const m of menus) {
      (groups[m.group] ||= []).push(m);
    }
    return Object.entries(groups);
  }, [menus]);

  const isUnrestricted = (role: string) => role === 'SUPER_ADMIN' || role === 'CEO';

  if (forbidden) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400">
          <ChevronLeft className="h-4 w-4" /> Super Admin
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">CEO only</p>
            <p>Only SUPER_ADMIN or CEO role can assign dashboard menus.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Link href="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400">
        <ChevronLeft className="h-4 w-4" /> Super Admin
      </Link>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard access</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pick a staff member, apply a role preset, then tweak per-menu. SUPER_ADMIN + CEO always see everything.</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User list */}
        <aside className="rounded-xl border bg-white dark:bg-gray-800">
          <header className="border-b px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            Staff ({users.length})
          </header>
          <ul className="divide-y max-h-[70vh] overflow-y-auto">
            {users.length === 0 && !loading && (
              <li className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No staff users found.</li>
            )}
            {users.map(u => {
              const isSel = u.id === selectedId;
              const unrestricted = isUnrestricted(u.role);
              return (
                <li key={u.id}>
                  <button
                    onClick={() => selectUser(u)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${isSel ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 truncate dark:text-gray-100">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username}
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400">{u.role}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{u.email}</span>
                      {unrestricted ? (
                        <span className="text-amber-600">all</span>
                      ) : u.access ? (
                        <span className="text-green-600">{u.access.allowedMenuIds.length} menus</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">unset</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Editor */}
        <section className="lg:col-span-2 rounded-xl border bg-white dark:bg-gray-800">
          {!selected ? (
            <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
              Select a staff member from the left to edit their menu access.
            </div>
          ) : isUnrestricted(selected.role) ? (
            <div className="p-6 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {[selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.username}
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-mono text-amber-800">{selected.role}</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SUPER_ADMIN and CEO bypass dashboard access restrictions by design.
                If you want to limit this user, change their role first via Admin Management.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {[selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.username}
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">{selected.role}</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selected.email}</p>
                </div>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                </button>
              </header>

              {/* Presets */}
              <div className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-900/40">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2 dark:text-gray-400">Apply preset</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(presets).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-white ${draftPreset === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white'}`}
                      title={p.label}
                    >
                      {draftPreset === key && <CheckCircle2 className="h-3 w-3 text-indigo-600" />}
                      {p.label}
                    </button>
                  ))}
                  {draftPreset && (
                    <button
                      onClick={() => setDraftPreset('')}
                      className="text-xs text-gray-500 hover:text-red-600 underline dark:text-gray-400"
                    >
                      clear preset tag
                    </button>
                  )}
                </div>
              </div>

              {/* Menu grid */}
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {grouped.map(([groupKey, items]) => (
                  <fieldset key={groupKey} className="rounded-lg border p-3">
                    <legend className="px-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {GROUP_LABELS[groupKey] || groupKey}
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {items.map(m => {
                        const checked = draft.has(m.id);
                        const forced = groupKey === 'always';
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${forced ? 'text-gray-400' : checked ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                            title={forced ? 'Always visible regardless of selection' : ''}
                          >
                            <input
                              type="checkbox"
                              checked={forced || checked}
                              disabled={forced}
                              onChange={() => togglemenu(m.id)}
                              className="rounded"
                            />
                            <span>{m.label}</span>
                            <span className="ml-auto text-[10px] font-mono text-gray-400 dark:text-gray-500">{m.id}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
