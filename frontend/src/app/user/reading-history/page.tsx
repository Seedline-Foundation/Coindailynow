'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Trash2 } from 'lucide-react';
import { fetchReadingHistory, clearReadingHistory } from '@/lib/userApi';

interface HistoryItem {
  id: string;
  articleId: string;
  readAt: string;
  readDurationSec: number | null;
  scrollPercent: number | null;
  completed: boolean;
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string | null;
    publishedAt: string | null;
    readingTimeMinutes: number;
    Category: { id: string; name: string; slug: string } | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ReadingHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [clearing, setClearing] = useState(false);

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await fetchReadingHistory(p);
      setHistory(res.data);
      setPagination(res.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page]);

  async function handleClear() {
    if (!confirm('Clear all reading history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearReadingHistory();
      setHistory([]);
      setPagination(null);
    } catch (err: any) {
      alert('Failed to clear history: ' + err.message);
    } finally {
      setClearing(false);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)} min`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Reading History</h1>
          <p className="text-dark-400 mt-1">Articles you&apos;ve read recently</p>
        </div>
        <div className="flex items-center gap-3">
          {pagination && (
            <span className="text-sm text-dark-400">{pagination.total} articles</span>
          )}
          {history.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400 mb-3">No reading history yet</p>
          <Link href="/" className="text-sm text-primary-500 hover:text-primary-400">
            Start reading articles &rarr;
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.article.slug}`}
                className="flex gap-4 bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/20 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="shrink-0">
                  {item.article.featuredImageUrl ? (
                    <img
                      src={item.article.featuredImageUrl}
                      alt={item.article.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-dark-800 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-dark-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {item.article.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-dark-400">
                    {item.article.Category && (
                      <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full">
                        {item.article.Category.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Read {new Date(item.readAt).toLocaleDateString()}
                    </span>
                    <span>{formatDuration(item.readDurationSec)} spent</span>
                    {item.scrollPercent !== null && (
                      <span>{item.scrollPercent}% scrolled</span>
                    )}
                    {item.completed && (
                      <span className="text-green-400">&#10003; Completed</span>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="shrink-0 self-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dark-600 flex items-center justify-center">
                    <span className="text-xs text-dark-400">
                      {item.scrollPercent || 0}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-dark-800 text-dark-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-dark-400">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-dark-800 text-dark-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
