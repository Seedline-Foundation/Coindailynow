'use client';

/**
 * Emergency moderation bypass.
 *
 * The launch spec requires that human editors can pull dangerous content
 * (hate speech, financial misinformation) from the live site in <2 clicks.
 * This page is the dedicated emergency switch — search any published
 * article and one-click unpublish, with reason logging for audit.
 *
 * Capability: ARTICLE_EMERGENCY_UNPUBLISH (EDITOR+).
 */

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Search, ShieldOff, RefreshCw } from 'lucide-react';
import { fetchArticles, emergencyUnpublishArticle } from '@/lib/api';

type Article = {
  id: string;
  title: string;
  slug?: string;
  status?: string;
  publishedAt?: string;
  authorName?: string;
};

export default function EmergencyModerationPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchArticles({ status: 'PUBLISHED', search: query || undefined, limit: 100 });
      setItems((res?.articles || res?.items || []) as Article[]);
    } catch (e: any) {
      setError(e?.message || 'load failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function unpublish(article: Article) {
    if (!article.id) return;
    if (!reason.trim()) {
      setError('Provide a reason before unpublishing.');
      return;
    }
    setBusy(article.id);
    setError(null);
    try {
      await emergencyUnpublishArticle(article.id, reason);
      setItems((arr) => arr.filter((a) => a.id !== article.id));
    } catch (e: any) {
      setError(e?.message || 'unpublish failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldOff className="w-6 h-6 text-red-400" />
            Emergency Moderation
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Pull a published article from the live site in &lt;2 clicks. Every
            action is audit-logged with the reason you provide.
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
          <span>{error}</span>
        </div>
      )}

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-gray-400">Reason (required)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. financial misinformation, defamatory statement"
            className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-gray-400">Search published articles</span>
          <div className="mt-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refresh()}
              placeholder="title, slug, author…"
              className="flex-1 bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
            />
          </div>
        </label>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl">
        <header className="px-5 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 uppercase tracking-wider">
          Published articles
        </header>
        <ul className="divide-y divide-gray-800">
          {items.map((a) => (
            <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {a.authorName ? `by ${a.authorName} · ` : ''}
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}
                  {a.slug ? ` · /${a.slug}` : ''}
                </div>
              </div>
              <button
                onClick={() => unpublish(a)}
                disabled={busy === a.id || !reason.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-medium rounded-md"
                title={!reason.trim() ? 'Provide a reason first' : 'Unpublish from live site'}
              >
                <ShieldOff className="w-3 h-3" />
                Unpublish
              </button>
            </li>
          ))}
          {!items.length && !loading && (
            <li className="px-5 py-4 text-sm text-gray-500">(no results)</li>
          )}
          {loading && <li className="px-5 py-4 text-sm text-gray-500">Loading…</li>}
        </ul>
      </section>
    </div>
  );
}
