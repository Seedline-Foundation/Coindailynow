'use client';

/**
 * /super-admin/distribution/settings (P10.6)
 *
 * Full social handles configuration. One card per supported platform; each
 * card shows env-readiness, lists configured handles with inline edit/delete,
 * an "+ Add handle" action, and platform-level defaults (schedule, caption
 * template, daily cap). Per-target schedule + caption overrides are exposed
 * via expandable detail.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, RefreshCw, Trash2, Plus,
  Settings2, Save, Lock, Globe2, Clock, FileText,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const PLATFORMS = ['telegram', 'facebook', 'youtube', 'tiktok', 'instagram', 'x', 'linkedin', 'whatsapp'] as const;
type Platform = typeof PLATFORMS[number];

const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'Telegram', facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok',
  instagram: 'Instagram', x: 'X (Twitter)', linkedin: 'LinkedIn', whatsapp: 'WhatsApp',
};

const HANDLE_HINT: Record<Platform, string> = {
  telegram: '@channelname or numeric chat id',
  facebook: 'Page ID (numeric)',
  youtube: 'Channel ID (UC...) or @handle',
  tiktok: '@username',
  instagram: 'Business account ID (numeric)',
  x: '@username',
  linkedin: 'Org URN (urn:li:organization:123…) or page id',
  whatsapp: 'WABA phone number id',
};

interface Target {
  id: string;
  platform: Platform;
  handle: string;
  enabled: boolean;
  authMode: string;
  authState: any;
  metadata: TargetMetadata | null;
  updatedAt: string;
}

interface TargetMetadata {
  schedule?: {
    cron?: string;
    timezone?: string;
    dailyCap?: number;
    quietHours?: { from: string; to: string };
  };
  captionTemplate?: string;
  itemTypes?: ('article' | 'video' | 'image')[];
  notes?: string;
}

interface PlatformDefaults {
  schedule?: TargetMetadata['schedule'];
  captionTemplate?: string;
  itemTypes?: ('article' | 'video' | 'image')[];
}

interface PlatformStatus { platform: string; configured: boolean; }

export default function DistributionSettingsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [defaults, setDefaults] = useState<Record<string, PlatformDefaults>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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
      const [tRes, pRes, dRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/distribution/targets`, { headers }),
        fetch(`${API_URL}/api/admin/distribution/platforms`, { headers }),
        fetch(`${API_URL}/api/admin/distribution/defaults`, { headers }),
      ]);
      if (!tRes.ok) throw new Error(`targets HTTP ${tRes.status}`);
      const [tJson, pJson, dJson] = await Promise.all([tRes.json(), pRes.json(), dRes.json()]);
      setTargets(tJson.targets || []);
      setPlatforms(pJson.platforms || []);
      setDefaults(dJson.defaults || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { refresh(); }, [refresh]);

  const patchTarget = async (id: string, body: Partial<{ handle: string; enabled: boolean; metadata: TargetMetadata }>) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/distribution/targets/${id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  };

  const deleteTarget = async (t: Target) => {
    if (!confirm(`Delete ${t.platform} target "${t.handle}"? This also removes its post history.`)) return;
    setBusy(t.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/distribution/targets/${t.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  };

  const addTarget = async (platform: Platform, handle: string) => {
    if (!handle.trim()) return;
    setBusy(`new-${platform}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/distribution/targets`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, handle: handle.trim(), enabled: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  };

  const saveDefaults = async (platform: Platform, value: PlatformDefaults) => {
    setBusy(`defaults-${platform}`);
    try {
      const res = await fetch(`${API_URL}/api/admin/distribution/defaults/${platform}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  };

  const configuredMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const p of platforms) m[p.platform] = p.configured;
    return m;
  }, [platforms]);

  const targetsByPlatform = useMemo(() => {
    const m: Record<string, Target[]> = {};
    for (const t of targets) (m[t.platform] ||= []).push(t);
    return m;
  }, [targets]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/distribution" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400">
          <ChevronLeft className="h-4 w-4" /> Distribution dashboard
        </Link>
      </div>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100"><Settings2 className="h-5 w-5 text-indigo-600" /> Distribution settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add handles per platform, set per-target schedule and caption overrides, and configure platform defaults.</p>
        </div>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700/50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(p => (
          <PlatformCard
            key={p}
            platform={p}
            configured={configuredMap[p] ?? false}
            targets={targetsByPlatform[p] || []}
            defaults={defaults[p] || {}}
            busy={busy}
            onAdd={(handle) => addTarget(p, handle)}
            onPatch={patchTarget}
            onDelete={deleteTarget}
            onSaveDefaults={(v) => saveDefaults(p, v)}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformCard({
  platform, configured, targets, defaults, busy, onAdd, onPatch, onDelete, onSaveDefaults,
}: {
  platform: Platform;
  configured: boolean;
  targets: Target[];
  defaults: PlatformDefaults;
  busy: string | null;
  onAdd: (handle: string) => void;
  onPatch: (id: string, body: Partial<{ handle: string; enabled: boolean; metadata: TargetMetadata }>) => void;
  onDelete: (t: Target) => void;
  onSaveDefaults: (v: PlatformDefaults) => void;
}) {
  const [newHandle, setNewHandle] = useState('');
  const [showDefaults, setShowDefaults] = useState(false);
  const [draftDefaults, setDraftDefaults] = useState<PlatformDefaults>(defaults);

  useEffect(() => { setDraftDefaults(defaults); }, [defaults]);

  return (
    <section className="rounded-xl border bg-white dark:bg-gray-800">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${configured ? 'bg-green-500' : 'bg-gray-300'}`} />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{PLATFORM_LABELS[platform]}</h2>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-400">{platform}</span>
          {!configured && <span className="text-xs text-amber-600 inline-flex items-center gap-1"><Lock className="h-3 w-3" /> env not set</span>}
        </div>
        <button
          onClick={() => setShowDefaults(s => !s)}
          className="text-xs text-gray-500 hover:text-indigo-600 inline-flex items-center gap-1 dark:text-gray-400"
        >
          <Settings2 className="h-3 w-3" /> Defaults
        </button>
      </header>

      {/* Handles list */}
      <ul className="divide-y">
        {targets.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No handles yet for {PLATFORM_LABELS[platform]}.</li>
        )}
        {targets.map(t => (
          <TargetRow key={t.id} target={t} busy={busy === t.id} onPatch={onPatch} onDelete={onDelete} />
        ))}
      </ul>

      {/* Add handle */}
      <div className="border-t bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newHandle}
            onChange={e => setNewHandle(e.target.value)}
            placeholder={HANDLE_HINT[platform]}
            className="flex-1 rounded border px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => { onAdd(newHandle); setNewHandle(''); }}
            disabled={!newHandle.trim() || busy === `new-${platform}`}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy === `new-${platform}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
          </button>
        </div>
      </div>

      {/* Defaults editor */}
      {showDefaults && (
        <div className="border-t bg-indigo-50/40 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Platform defaults — applied unless a target overrides</p>
          <DefaultsEditor value={draftDefaults} onChange={setDraftDefaults} />
          <div className="flex justify-end">
            <button
              onClick={() => onSaveDefaults(draftDefaults)}
              disabled={busy === `defaults-${platform}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy === `defaults-${platform}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save defaults
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function TargetRow({
  target, busy, onPatch, onDelete,
}: {
  target: Target;
  busy: boolean;
  onPatch: (id: string, body: Partial<{ handle: string; enabled: boolean; metadata: TargetMetadata }>) => void;
  onDelete: (t: Target) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draftHandle, setDraftHandle] = useState(target.handle);
  const [draftMeta, setDraftMeta] = useState<TargetMetadata>(target.metadata || {});

  useEffect(() => { setDraftHandle(target.handle); setDraftMeta(target.metadata || {}); }, [target]);

  const dirty = draftHandle !== target.handle || JSON.stringify(draftMeta) !== JSON.stringify(target.metadata || {});

  return (
    <li className="px-4 py-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPatch(target.id, { enabled: !target.enabled })}
          disabled={busy}
          className={`h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${target.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
          title={target.enabled ? 'Click to disable' : 'Click to enable'}
        >
          <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${target.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
        <input
          type="text"
          value={draftHandle}
          onChange={e => setDraftHandle(e.target.value)}
          className="flex-1 rounded border px-2 py-1 text-sm font-mono"
        />
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-500 hover:text-indigo-600 inline-flex items-center gap-1 dark:text-gray-400">
          <Settings2 className="h-3 w-3" /> {expanded ? 'Hide' : 'Edit'}
        </button>
        <button onClick={() => onDelete(target)} disabled={busy} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 rounded-lg border bg-gray-50 p-3 dark:bg-gray-900/40">
          <ScheduleEditor value={draftMeta.schedule || {}} onChange={(schedule) => setDraftMeta({ ...draftMeta, schedule })} />
          <CaptionEditor value={draftMeta.captionTemplate || ''} onChange={(captionTemplate) => setDraftMeta({ ...draftMeta, captionTemplate })} />
          <ItemTypesEditor value={draftMeta.itemTypes || []} onChange={(itemTypes) => setDraftMeta({ ...draftMeta, itemTypes })} />
          <label className="block text-xs text-gray-700 dark:text-gray-300">
            Notes
            <textarea
              value={draftMeta.notes || ''}
              onChange={e => setDraftMeta({ ...draftMeta, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border px-2 py-1 text-xs"
              placeholder="Internal notes — visible only to admins"
            />
          </label>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">Auth mode: <span className="font-mono">{target.authMode}</span></div>
            <button
              onClick={() => onPatch(target.id, { handle: draftHandle, metadata: draftMeta })}
              disabled={busy || !dirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
            </button>
          </div>
          {target.authState && Object.keys(target.authState as any).length > 0 && (
            <details className="text-xs text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer">Auth state (masked)</summary>
              <pre className="mt-1 rounded bg-white p-2 font-mono text-[11px] overflow-auto dark:bg-gray-800">{JSON.stringify(target.authState, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
}

function DefaultsEditor({ value, onChange }: { value: PlatformDefaults; onChange: (v: PlatformDefaults) => void }) {
  return (
    <div className="space-y-3">
      <ScheduleEditor value={value.schedule || {}} onChange={(schedule) => onChange({ ...value, schedule })} />
      <CaptionEditor value={value.captionTemplate || ''} onChange={(captionTemplate) => onChange({ ...value, captionTemplate })} />
      <ItemTypesEditor value={value.itemTypes || []} onChange={(itemTypes) => onChange({ ...value, itemTypes })} />
    </div>
  );
}

function ScheduleEditor({ value, onChange }: { value: NonNullable<TargetMetadata['schedule']>; onChange: (v: NonNullable<TargetMetadata['schedule']>) => void }) {
  return (
    <fieldset className="rounded border bg-white p-2 space-y-2 dark:bg-gray-800">
      <legend className="px-1 text-[11px] font-semibold uppercase text-gray-500 inline-flex items-center gap-1 dark:text-gray-400"><Clock className="h-3 w-3" /> Schedule</legend>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="block text-gray-700 dark:text-gray-300">
          Cron (UTC unless tz set)
          <input
            type="text"
            value={value.cron || ''}
            onChange={e => onChange({ ...value, cron: e.target.value })}
            placeholder="0 9 * * 1-5"
            className="mt-1 w-full rounded border px-2 py-1 font-mono"
          />
        </label>
        <label className="block text-gray-700 dark:text-gray-300">
          Timezone
          <input
            type="text"
            value={value.timezone || ''}
            onChange={e => onChange({ ...value, timezone: e.target.value })}
            placeholder="Africa/Lagos"
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block text-gray-700 dark:text-gray-300">
          Daily cap
          <input
            type="number"
            min={0}
            value={value.dailyCap ?? ''}
            onChange={e => onChange({ ...value, dailyCap: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            placeholder="e.g. 5"
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block text-gray-700 dark:text-gray-300">
          Quiet hours (HH:MM)
          <div className="mt-1 flex items-center gap-1">
            <input
              type="text"
              value={value.quietHours?.from || ''}
              onChange={e => onChange({ ...value, quietHours: { from: e.target.value, to: value.quietHours?.to || '' } })}
              placeholder="22:00"
              className="w-full rounded border px-2 py-1"
            />
            <span className="text-gray-400 dark:text-gray-500">→</span>
            <input
              type="text"
              value={value.quietHours?.to || ''}
              onChange={e => onChange({ ...value, quietHours: { from: value.quietHours?.from || '', to: e.target.value } })}
              placeholder="07:00"
              className="w-full rounded border px-2 py-1"
            />
          </div>
        </label>
      </div>
    </fieldset>
  );
}

function CaptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="rounded border bg-white p-2 dark:bg-gray-800">
      <legend className="px-1 text-[11px] font-semibold uppercase text-gray-500 inline-flex items-center gap-1 dark:text-gray-400"><FileText className="h-3 w-3" /> Caption template</legend>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded border px-2 py-1 text-xs font-mono"
        placeholder={'Use {title}, {excerpt}, {url}, {hashtags}. Leave blank to inherit platform defaults.'}
      />
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Tokens: <code>{'{title}'}</code> <code>{'{excerpt}'}</code> <code>{'{url}'}</code> <code>{'{hashtags}'}</code></p>
    </fieldset>
  );
}

function ItemTypesEditor({ value, onChange }: { value: ('article' | 'video' | 'image')[]; onChange: (v: ('article' | 'video' | 'image')[]) => void }) {
  const toggle = (t: 'article' | 'video' | 'image') => {
    const has = value.includes(t);
    onChange(has ? value.filter(x => x !== t) : [...value, t]);
  };
  return (
    <fieldset className="rounded border bg-white p-2 dark:bg-gray-800">
      <legend className="px-1 text-[11px] font-semibold uppercase text-gray-500 inline-flex items-center gap-1 dark:text-gray-400"><Globe2 className="h-3 w-3" /> Item types accepted</legend>
      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        {(['article', 'video', 'image'] as const).map(t => {
          const on = value.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`rounded-full border px-2.5 py-1 ${on ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {on && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
              {t}
            </button>
          );
        })}
        {value.length === 0 && <span className="text-gray-500 text-[11px] dark:text-gray-400">(no filter — accepts all)</span>}
      </div>
    </fieldset>
  );
}
