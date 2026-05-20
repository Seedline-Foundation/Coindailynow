'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Globe,
} from 'lucide-react';

/**
 * Admin Press Approval Page — /admin/press
 *
 * Allows super admins to review, approve, or reject press releases
 * that are in 'pending_review' status.
 *
 * Flow:  submit → pay → **approve** → publish → distribute
 *
 * Calls:
 *   GET   /api/v1/press/releases/:id
 *   PATCH /api/v1/press/releases/:id/review  { status: 'approved' | 'rejected' }
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface PendingRelease {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  region: string | null;
  slug: string;
  status: string;
  createdAt: string;
  user: { id: string; username?: string; firstName?: string; lastName?: string } | null;
}

export default function AdminPressPage() {
  const [releases, setReleases] = useState<PendingRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      // Fetch all releases (backend returns user's own, but for admin we
      // fetch pending_review ones). The /wire endpoint shows approved ones,
      // so we'll fetch from the main backend API that can show all statuses
      // for admin users.
      const res = await fetch(`${API_URL}/api/v1/press/releases`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch releases');
      const { data } = await res.json();

      // Filter to pending_review only
      const pending = (data || [])
        .filter((r: any) => r.status === 'pending_review')
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          summary: r.summary || '',
          body: r.body || '',
          category: r.category || 'general',
          region: r.region,
          slug: r.slug,
          status: r.status,
          createdAt: r.createdAt,
          user: r.user || null,
        }));

      setReleases(pending);
      if (pending.length > 0 && !selectedId) {
        setSelectedId(pending[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pending releases');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(id);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`${API_URL}/api/v1/press/releases/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Review action failed');
      }

      // Remove from list
      setReleases((prev) => prev.filter((r) => r.id !== id));
      if (selectedId === id) {
        const remaining = releases.filter((r) => r.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const selected = releases.find((r) => r.id === selectedId);

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-red-500" /> Press Approval
          </span>
          <span className="ml-auto px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full font-bold">
            {releases.length} pending
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">
            Press Release Approval Queue
          </h1>
          <button
            onClick={loadPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-dark-700 hover:border-dark-500 text-dark-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />{' '}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && releases.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-dark-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-dark-400">All press releases have been reviewed.</p>
            <Link
              href="/admin"
              className="text-primary-500 hover:text-primary-400 text-sm mt-2 inline-block"
            >
              Back to admin dashboard →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {releases.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedId === r.id
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                  }`}
                >
                  <p className="text-white font-medium text-sm truncate">
                    {r.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-medium">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                    <span className="text-dark-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.user && (
                    <p className="text-dark-500 text-xs mt-1">
                      by{' '}
                      {[r.user.firstName, r.user.lastName].filter(Boolean).join(' ') ||
                        r.user.username ||
                        'Unknown'}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Preview + Actions */}
            <div className="lg:col-span-2">
              {selected ? (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {selected.title}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-dark-500">
                      <span className="capitalize">{selected.category}</span>
                      <span>·</span>
                      <span>{selected.region || 'Global'}</span>
                      <span>·</span>
                      <span>
                        {new Date(selected.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-dark-300 mb-2">
                      Summary
                    </h3>
                    <p className="text-dark-300 text-sm leading-relaxed bg-dark-800 rounded-lg p-4">
                      {selected.summary || 'No summary provided.'}
                    </p>
                  </div>

                  {/* Body preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-dark-300 mb-2">
                      Content Preview
                    </h3>
                    <div className="bg-dark-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selected.body.slice(0, 2000)}
                        {selected.body.length > 2000 && (
                          <span className="text-dark-500">
                            … ({selected.body.length - 2000} more characters)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2 border-t border-dark-700">
                    <button
                      onClick={() => handleReview(selected.id, 'approved')}
                      disabled={actionLoading === selected.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-dark-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selected.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReview(selected.id, 'rejected')}
                      disabled={actionLoading === selected.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-colors border border-red-500/30 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>

                  <p className="text-dark-600 text-xs">
                    Approving will set the release to &quot;approved&quot; status,
                    set publishedAt to now, and trigger wire feed alerts to
                    subscribers.
                  </p>
                </div>
              ) : (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 text-center text-dark-500">
                  Select a press release to review.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
