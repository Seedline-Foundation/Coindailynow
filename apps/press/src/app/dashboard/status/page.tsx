'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
  ArrowRight,
  Zap,
  CreditCard,
  Shield,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/**
 * Status Tracking Page — /dashboard/status
 *
 * Allows agencies / publishers to see the full lifecycle of their press
 * releases: draft → pending_review → approved → published → distributed.
 *
 * Fetches from the backend REST API:  GET /api/v1/press/releases
 * And distribution status:            GET /api/v1/press/releases/:id/distribution
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Release {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  region: string | null;
  boostLevel: string;
  createdAt: string;
  publishedAt: string | null;
  packageId: string | null;
  distribution?: {
    total: number;
    published: number;
    pending: number;
    failed: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle; step: number }> = {
  draft:           { label: 'Draft',           color: 'bg-dark-700 text-dark-300',      icon: FileText,    step: 0 },
  pending_review:  { label: 'Pending Review',  color: 'bg-yellow-500/20 text-yellow-500', icon: Clock,      step: 1 },
  approved:        { label: 'Approved',        color: 'bg-green-500/20 text-green-500',   icon: CheckCircle, step: 2 },
  rejected:        { label: 'Rejected',        color: 'bg-red-500/20 text-red-500',       icon: XCircle,    step: -1 },
  published:       { label: 'Published',       color: 'bg-blue-500/20 text-blue-500',     icon: Eye,        step: 3 },
  distributed:     { label: 'Distributed',     color: 'bg-purple-500/20 text-purple-500', icon: Globe,      step: 4 },
};

const FLOW_STEPS = [
  { key: 'submit', label: 'Submit', icon: Send },
  { key: 'pay', label: 'Pay', icon: CreditCard },
  { key: 'review', label: 'Review', icon: Shield },
  { key: 'publish', label: 'Publish', icon: Eye },
  { key: 'distribute', label: 'Distribute', icon: Globe },
];

function stepFromStatus(status: string): number {
  if (status === 'draft') return 0;
  if (status === 'pending_review') return 2;
  if (status === 'approved' || status === 'published') return 3;
  if (status === 'distributed') return 4;
  return -1;
}

export default function StatusTrackingPage() {
  const { session } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadReleases = useCallback(async () => {
    setLoading(true);
    try {
      const token = session?.access_token || '';
      const res = await fetch(`${API_URL}/api/v1/press/releases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const { data } = await res.json();

      const enriched: Release[] = await Promise.all(
        (data || []).map(async (r: any) => {
          let distribution;
          try {
            const distRes = await fetch(
              `${API_URL}/api/v1/press/releases/${r.id}/distribution`
            );
            if (distRes.ok) {
              const distData = await distRes.json();
              distribution = distData.summary;
            }
          } catch { /* non-critical */ }

          return {
            id: r.id,
            title: r.title,
            slug: r.slug,
            status: r.status,
            category: r.category || 'general',
            region: r.region,
            boostLevel: r.boostLevel || 'standard',
            createdAt: r.createdAt,
            publishedAt: r.publishedAt,
            packageId: r.packageId,
            distribution,
          };
        })
      );

      setReleases(enriched);
      if (enriched.length > 0 && !selectedId) {
        setSelectedId(enriched[0].id);
      }
    } catch (err) {
      console.error('Failed to load releases:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, selectedId]);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const selected = releases.find((r) => r.id === selectedId);
  const selectedConfig = selected
    ? STATUS_CONFIG[selected.status] || STATUS_CONFIG.draft
    : null;
  const currentStep = selected ? stepFromStatus(selected.status) : -1;

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-primary-500" /> Status Tracking
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Press Release Status
            </h1>
            <p className="text-dark-400 text-sm">
              Track the progress of your press releases through the distribution
              pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadReleases}
              className="flex items-center gap-1.5 px-3 py-2 border border-dark-700 hover:border-dark-500 text-dark-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/dashboard/submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg text-sm transition-colors"
            >
              <Send className="w-4 h-4" /> New Release
            </Link>
          </div>
        </div>

        {loading && releases.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-dark-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your
            releases…
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-dark-700 mx-auto mb-4" />
            <p className="text-dark-400 mb-2">No press releases yet.</p>
            <Link
              href="/dashboard/submit"
              className="text-primary-500 hover:text-primary-400 text-sm"
            >
              Submit your first press release →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Release list */}
            <div className="lg:col-span-1 space-y-2">
              {releases.map((r) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.draft;
                const Icon = cfg.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedId === r.id
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-medium text-sm truncate flex-1">
                        {r.title}
                      </p>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-dark-500 text-xs mt-1">
                      {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                      {r.category}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {selected && selectedConfig ? (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 space-y-6">
                  {/* Title + status badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h2 className="text-xl font-bold text-white">
                        {selected.title}
                      </h2>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedConfig.color}`}
                      >
                        <selectedConfig.icon className="w-3.5 h-3.5" />
                        {selectedConfig.label}
                      </span>
                    </div>
                    <p className="text-dark-500 text-sm">
                      ID: {selected.id} · Created{' '}
                      {new Date(selected.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Pipeline progress */}
                  <div>
                    <h3 className="text-sm font-semibold text-dark-300 mb-3">
                      Distribution Pipeline
                    </h3>
                    <div className="flex items-center gap-1">
                      {FLOW_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isDone = currentStep >= 0 && i < currentStep;
                        const isActive = i === currentStep;
                        const isRejected = selected.status === 'rejected';
                        return (
                          <div
                            key={step.key}
                            className="flex items-center gap-1 flex-1"
                          >
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium w-full justify-center ${
                                isRejected && i >= 2
                                  ? 'bg-red-500/10 text-red-400'
                                  : isDone
                                  ? 'bg-green-500/20 text-green-500'
                                  : isActive
                                  ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30'
                                  : 'bg-dark-800 text-dark-500'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <StepIcon className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {step.label}
                              </span>
                            </div>
                            {i < FLOW_STEPS.length - 1 && (
                              <div
                                className={`w-4 h-0.5 shrink-0 ${
                                  isDone
                                    ? 'bg-green-500'
                                    : isActive
                                    ? 'bg-primary-500'
                                    : 'bg-dark-700'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-dark-800 rounded-lg p-3">
                      <p className="text-dark-500 text-xs mb-0.5">Category</p>
                      <p className="text-white text-sm font-medium capitalize">
                        {selected.category}
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-3">
                      <p className="text-dark-500 text-xs mb-0.5">Region</p>
                      <p className="text-white text-sm font-medium capitalize">
                        {selected.region || 'Global'}
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-3">
                      <p className="text-dark-500 text-xs mb-0.5">Boost</p>
                      <p className="text-white text-sm font-medium capitalize">
                        {selected.boostLevel}
                      </p>
                    </div>
                    <div className="bg-dark-800 rounded-lg p-3">
                      <p className="text-dark-500 text-xs mb-0.5">Published</p>
                      <p className="text-white text-sm font-medium">
                        {selected.publishedAt
                          ? new Date(selected.publishedAt).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Distribution stats */}
                  {selected.distribution && (
                    <div>
                      <h3 className="text-sm font-semibold text-dark-300 mb-3">
                        Distribution Progress
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-dark-800 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-white">
                            {selected.distribution.total}
                          </p>
                          <p className="text-dark-500 text-xs">Total Sites</p>
                        </div>
                        <div className="bg-dark-800 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-green-500">
                            {selected.distribution.published}
                          </p>
                          <p className="text-dark-500 text-xs">Published</p>
                        </div>
                        <div className="bg-dark-800 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-yellow-500">
                            {selected.distribution.pending}
                          </p>
                          <p className="text-dark-500 text-xs">Pending</p>
                        </div>
                        <div className="bg-dark-800 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-red-400">
                            {selected.distribution.failed}
                          </p>
                          <p className="text-dark-500 text-xs">Failed</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    {selected.status === 'draft' && (
                      <Link
                        href={`/dashboard/checkout/${selected.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg text-sm transition-colors"
                      >
                        Continue to Payment <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    {(selected.status === 'approved' || selected.status === 'published') && (
                      <Link
                        href="/wire"
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm transition-colors"
                      >
                        <Zap className="w-4 h-4" /> View on Wire
                      </Link>
                    )}
                    {selected.status === 'rejected' && (
                      <Link
                        href="/dashboard/submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg text-sm transition-colors"
                      >
                        Resubmit <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 text-center text-dark-500">
                  Select a press release to view its status.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
