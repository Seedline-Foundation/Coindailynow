'use client';

/**
 * /admin/videos/[runId] — review a single video run (P6.7).
 *
 * Shows: parent article context, each video asset with native <video> preview,
 * full step status panel, approve / reject buttons.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Film, ChevronDown, ChevronRight } from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface VideoAsset {
  id: string;
  format: 'SHORT' | 'LONG' | 'BROLL';
  url: string;
  durationSec?: number;
  thumbnailUrl?: string;
  provider?: string;
}

interface VideoStep {
  stepName: string;
  stepOrder: number;
  status: string;
  durationMs?: number | null;
  input?: any;
  output?: any;
  errorMessage?: string | null;
}

interface RunResponse {
  run: {
    id: string;
    articleId: string;
    status: string;
    errorMessage?: string | null;
    createdAt: string;
    steps: VideoStep[];
    assets: VideoAsset[];
  };
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    language: string;
    featuredImageUrl?: string;
    publishedAt?: string;
  } | null;
}

const STEP_LABELS: Record<string, string> = {
  loadArticle: '0. Load article',
  script: '1. Script (LLM)',
  validateScript: '2. Validate script',
  voiceover: '3. Voiceover (Coqui)',
  shortVideo: '4. Short video (D-ID)',
  longVideo: '5. Long video (InVideo)',
  broll: '6. B-roll (fal.ai)',
  compose: '7. Compose',
  validateVideo: '8. Validate video',
  queueForReview: '✓ Queue for review',
};

export default function VideoReviewPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const runId = params.runId;

  const [data, setData] = useState<RunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'approving' | 'rejecting' | null>(null);

  const headers = useMemo(() => {
    const t = getAccessToken();
    return t ? { Authorization: `Bearer ${t}` } : null;
  }, []);

  const refresh = useCallback(async () => {
    if (!headers) {
      setError('Not authenticated');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/video-runs/${runId}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [runId, headers]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async () => {
    if (!headers) return;
    setBusy('approving');
    try {
      const res = await fetch(`${API_URL}/api/admin/video-runs/${runId}/approve`, {
        method: 'POST', headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/super-admin/distribution');
    } catch (e: any) {
      setError(e.message);
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!headers) return;
    const reason = prompt('Reason for rejection (optional):') || '';
    setBusy('rejecting');
    try {
      const res = await fetch(`${API_URL}/api/admin/video-runs/${runId}/reject`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center gap-2 p-6 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading run…
      </div>
    );
  }

  const isApproved = data.run.status === 'APPROVED';
  const isReady = data.run.status === 'READY_FOR_REVIEW';

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-gray-100">
            <Film className="h-5 w-5 text-indigo-600" />
            {data.article?.title || 'Video run'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Run {runId.slice(0, 8)}… · status: <span className="font-medium">{data.run.status}</span>
            {data.article && (
              <>
                {' · article '}
                <Link href={`/${data.article.language || 'en'}/news/${data.article.slug}`} target="_blank" className="text-indigo-600 hover:underline">
                  {data.article.slug}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {isReady && (
            <>
              <button
                type="button"
                onClick={reject}
                disabled={!!busy}
                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300"
              >
                {busy === 'rejecting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </button>
              <button
                type="button"
                onClick={approve}
                disabled={!!busy || data.run.assets.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                title={data.run.assets.length === 0 ? 'No assets — cannot approve' : ''}
              >
                {busy === 'approving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve & distribute
              </button>
            </>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Approved
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {data.run.assets.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20">
              No video assets were produced. Check the step panel for which adapters failed (often: missing API keys).
            </div>
          )}
          {data.run.assets.map(asset => (
            <div key={asset.id} className="rounded-xl border bg-white shadow-sm overflow-hidden dark:bg-gray-800">
              <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold uppercase">{asset.format}</span>
                <span>
                  {asset.provider || 'unknown'} {asset.durationSec ? `· ${asset.durationSec}s` : ''}
                </span>
              </div>
              {asset.url && asset.url.startsWith('http') ? (
                <video controls className="w-full bg-black" src={asset.url} poster={asset.thumbnailUrl} />
              ) : (
                <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No playable URL.</div>
              )}
              <div className="px-4 py-2 text-xs text-gray-500 break-all dark:text-gray-400">{asset.url}</div>
            </div>
          ))}
        </section>

        <aside className="rounded-xl border bg-white shadow-sm dark:bg-gray-800">
          <header className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pipeline steps</h3>
          </header>
          <ul className="divide-y">
            {data.run.steps.sort((a, b) => a.stepOrder - b.stepOrder).map(step => (
              <StepRow key={step.stepName} step={step} />
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function StepRow({ step }: { step: VideoStep }) {
  const [open, setOpen] = useState(false);
  const label = STEP_LABELS[step.stepName] || step.stepName;
  return (
    <li className="px-4 py-2.5 text-sm">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 text-left">
        {open ? <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
        <StatusDot status={step.status} />
        <span className="flex-1 truncate font-medium text-gray-800 dark:text-gray-200">{label}</span>
        {typeof step.durationMs === 'number' && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{(step.durationMs / 1000).toFixed(1)}s</span>
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-6 text-xs">
          {step.errorMessage && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 dark:bg-red-900/20">{step.errorMessage}</div>
          )}
          {step.output != null && (
            <details>
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400">output</summary>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-[11px] dark:bg-gray-900/40">{JSON.stringify(step.output, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
}

function StatusDot({ status }: { status: string }) {
  const cls = status === 'SUCCESS' ? 'bg-green-500'
    : status === 'FAILED' ? 'bg-red-500'
    : status === 'RUNNING' ? 'bg-blue-500'
    : 'bg-gray-300';
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}
