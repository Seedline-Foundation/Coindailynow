'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchBookmarks, removeBookmark } from '@/lib/userApi';

interface Bookmark {
  id: string;
  articleId: string;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string | null;
    publishedAt: string | null;
    readingTimeMinutes: number;
    viewCount: number;
    Category: { id: string; name: string; slug: string } | null;
    User: { id: string; username: string; displayName: string | null; avatarUrl: string | null } | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await fetchBookmarks(p);
      setBookmarks(res.data);
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

  async function handleRemove(articleId: string) {
    setRemoving(articleId);
    try {
      await removeBookmark(articleId);
      setBookmarks((prev) => prev.filter((b) => b.articleId !== articleId));
    } catch (err: any) {
      alert('Failed to remove bookmark: ' + err.message);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Bookmarks</h1>
          <p className="text-gray-400 mt-1">Articles you&apos;ve saved for later</p>
        </div>
        {pagination && (
          <span className="text-sm text-gray-500">{pagination.total} saved</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-dark-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
          <span className="text-4xl block mb-4">🔖</span>
          <p className="text-gray-400 mb-3">No bookmarks yet</p>
          <Link href="/" className="text-sm text-primary-400 hover:text-primary-300">
            Browse articles to bookmark &rarr;
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex gap-4 bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-primary-500/20 transition-colors"
              >
                {/* Thumbnail */}
                <Link href={`/article/${bm.article.slug}`} className="shrink-0">
                  {bm.article.featuredImageUrl ? (
                    <img
                      src={bm.article.featuredImageUrl}
                      alt={bm.article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-dark-800 rounded-lg flex items-center justify-center text-2xl">
                      📰
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link href={`/article/${bm.article.slug}`}>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 hover:text-primary-400 transition-colors">
                      {bm.article.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{bm.article.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    {bm.article.Category && (
                      <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full">
                        {bm.article.Category.name}
                      </span>
                    )}
                    <span>{bm.article.readingTimeMinutes} min read</span>
                    <span>Saved {new Date(bm.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(bm.articleId)}
                  disabled={removing === bm.articleId}
                  className="shrink-0 self-start p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Remove bookmark"
                >
                  {removing === bm.articleId ? (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-dark-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-dark-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
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
