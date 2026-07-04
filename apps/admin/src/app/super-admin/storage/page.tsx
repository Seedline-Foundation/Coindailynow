'use client';

/**
 * /super-admin/storage — Contabo bucket management.
 *
 * Upload images / videos / documents into their buckets (simages / svid /
 * sdocs) and browse everything stored there: state, size, URL, download
 * counts, download + delete actions. Super-admin only.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2, AlertCircle, RefreshCw, HardDrive, Image as ImageIcon, Film,
  FileText, UploadCloud, Copy, Check, Trash2, Download, Search,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Kind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

interface AssetRow {
  id: string;
  bucket: string;
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: Kind;
  source: string;
  status: string;
  downloadCount: number;
  createdAt: string;
}

interface BucketStat {
  kind: Kind;
  bucket: string;
  files: number;
  totalBytes: number;
  downloads: number;
}

const KIND_META: Record<Kind, { label: string; icon: React.ElementType; badge: string }> = {
  IMAGE: { label: 'Images', icon: ImageIcon, badge: 'bg-indigo-100 text-indigo-700' },
  VIDEO: { label: 'Videos', icon: Film, badge: 'bg-purple-100 text-purple-700' },
  DOCUMENT: { label: 'Documents', icon: FileText, badge: 'bg-amber-100 text-amber-700' },
};

const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'SUPER_ADMIN_UPLOAD', label: 'Admin uploads' },
  { value: 'AI_SYSTEM', label: 'AI system' },
  { value: 'IENGINE', label: 'Iengine' },
  { value: 'VENGINE', label: 'Vengine' },
  { value: 'PUBLIC_SYNC', label: 'Public assets' },
  { value: 'APP', label: 'App' },
];

function formatBytes(n: number): string {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function StoragePage() {
  const [stats, setStats] = useState<BucketStat[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [assets, setAssets] = useState<AssetRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [kindFilter, setKindFilter] = useState<'' | Kind>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [q, setQ] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const headers = useMemo(() => {
    const t = getAccessToken();
    return t ? { Authorization: `Bearer ${t}` } : null;
  }, []);

  const refresh = useCallback(async () => {
    if (!headers) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (kindFilter) params.set('kind', kindFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (q) params.set('q', q);

      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/storage?${params}`, { headers }),
        fetch(`${API_URL}/api/admin/storage/stats`, { headers }),
      ]);
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const list = await listRes.json();
      setAssets(list.assets || []);
      setTotal(list.total || 0);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats || []);
        setConfigured(Boolean(s.configured));
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers, page, kindFilter, sourceFilter, q]);

  useEffect(() => { refresh(); }, [refresh]);

  const onUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length || !headers) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_URL}/api/admin/storage/upload`, {
          method: 'POST',
          headers,
          body: form,
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `Upload failed (HTTP ${res.status})`);
      }
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }, [headers, refresh]);

  const onDelete = useCallback(async (asset: AssetRow) => {
    if (!headers) return;
    if (!window.confirm(`Delete "${asset.filename}" from ${asset.bucket}? This removes the file from the bucket.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/storage/${asset.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }, [headers, refresh]);

  const onDownload = useCallback((asset: AssetRow) => {
    const t = getAccessToken();
    fetch(`${API_URL}/api/admin/storage/${asset.id}/download`, {
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = asset.filename;
        a.click();
        URL.revokeObjectURL(a.href);
        refresh();
      })
      .catch(e => setError(e.message));
  }, [refresh]);

  const copyUrl = useCallback((asset: AssetRow) => {
    navigator.clipboard.writeText(asset.url).then(() => {
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
            <HardDrive className="h-5 w-5 text-indigo-600" /> Storage buckets
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Contabo object storage — simages (images) · svid (videos) · sdocs (documents).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={e => onUpload(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || !configured}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
            Upload files
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700/50 dark:text-gray-300"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </button>
        </div>
      </header>

      {!configured && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4" />
          Contabo credentials not configured — set CONTABO_ACCESS_KEY / CONTABO_SECRET_KEY in the backend env.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Bucket stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(stats ?? (['IMAGE', 'VIDEO', 'DOCUMENT'] as Kind[]).map(kind => ({
          kind, bucket: '—', files: 0, totalBytes: 0, downloads: 0,
        }))).map(s => {
          const Meta = KIND_META[s.kind].icon;
          return (
            <button
              key={s.kind}
              type="button"
              onClick={() => { setKindFilter(k => (k === s.kind ? '' : s.kind)); setPage(1); }}
              className={`rounded-xl border bg-white p-4 text-left transition hover:border-indigo-300 dark:bg-gray-800 ${
                kindFilter === s.kind ? 'border-indigo-500 ring-1 ring-indigo-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <Meta className="h-4 w-4 text-indigo-600" /> {KIND_META[s.kind].label}
                </span>
                <span className="font-mono text-[10px] text-gray-400">{s.bucket}</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.files}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">files · {formatBytes(s.totalBytes)}</div>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{s.downloads}</div>
                  downloads
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs dark:bg-gray-800">
          <Search className="h-3 w-3 text-gray-400" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search filename or key…"
            className="w-48 bg-transparent text-xs focus:outline-none"
          />
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs dark:bg-gray-800">
          <select
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-xs focus:outline-none"
          >
            {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{total} file{total === 1 ? '' : 's'}</span>
      </div>

      {!loading && assets && assets.length === 0 && (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
          No files match. Upload with the button above — AI-system and Iengine
          uploads appear here automatically.
        </div>
      )}

      {/* Asset table */}
      {assets && assets.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Bucket</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium">Downloads</th>
                <th className="px-4 py-2 font-medium">Uploaded</th>
                <th className="px-4 py-2 font-medium">URL</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="max-w-[240px] px-4 py-2">
                    <div className="flex items-center gap-2">
                      {asset.kind === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                      ) : (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${KIND_META[asset.kind].badge}`}>
                          {asset.kind}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900 dark:text-gray-100" title={asset.filename}>
                          {asset.filename}
                        </div>
                        <div className="truncate font-mono text-[10px] text-gray-400" title={asset.key}>{asset.key}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{asset.bucket}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{asset.source}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{formatBytes(asset.sizeBytes)}</td>
                  <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{asset.downloadCount}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => copyUrl(asset)}
                      className="inline-flex items-center gap-1 rounded border bg-white px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300"
                      title={asset.url}
                    >
                      {copiedId === asset.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      {copiedId === asset.id ? 'Copied' : 'Copy URL'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDownload(asset)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(asset)}
                        className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded border bg-white px-2 py-1 disabled:opacity-40 dark:bg-gray-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded border bg-white px-2 py-1 disabled:opacity-40 dark:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
