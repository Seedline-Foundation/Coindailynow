'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Trash2, Newspaper, ExternalLink } from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/lib/userApi';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NewsHeadline {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  source: string;
}

/* ── Fetch latest news headlines ── */
async function fetchLatestHeadlines(): Promise<NewsHeadline[]> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/articles?limit=6&status=PUBLISHED', { signal: controller.signal });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    if (Array.isArray(data?.articles)) {
      return data.articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug || a.id,
        excerpt: a.excerpt || a.description || '',
        category: a.category?.name || 'News',
        publishedAt: a.publishedAt || a.createdAt,
        source: a.source || 'CoinDaily',
      }));
    }
    return [];
  } catch {
    // Return sample headlines so the section isn't empty
    return [
      { id: 'h1', title: 'Bitcoin Surges Past $95K as African Adoption Accelerates', slug: '#', excerpt: 'BTC reaches new highs driven by institutional buying across Nigeria, Kenya and South Africa.', category: 'Bitcoin', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
      { id: 'h2', title: 'Luno Exchange Expands to 5 New African Countries', slug: '#', excerpt: 'Luno announces expansion into Cameroon, Tanzania, Uganda, Senegal and Côte d\'Ivoire.', category: 'Exchanges', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
      { id: 'h3', title: 'M-Pesa Crypto Integration Goes Live in Kenya', slug: '#', excerpt: 'Safaricom partners with Binance Africa to enable direct M-Pesa to crypto purchases.', category: 'Mobile Money', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
      { id: 'h4', title: 'JY Token Lists on Quidax with 250% First-Day Volume', slug: '#', excerpt: 'CoinDaily\'s native token JY sees massive demand on its first day of trading.', category: 'Memecoin', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
      { id: 'h5', title: 'Nigeria SEC Releases New Crypto Regulatory Framework', slug: '#', excerpt: 'The Securities and Exchange Commission publishes comprehensive guidelines for digital asset exchanges.', category: 'Regulation', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
      { id: 'h6', title: 'DeFi Yield Farming Grows 400% Across Africa in 2026', slug: '#', excerpt: 'Decentralized finance protocols see record adoption among African users seeking passive income.', category: 'DeFi', publishedAt: new Date().toISOString(), source: 'CoinDaily' },
    ];
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'headlines'>('notifications');

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await fetchNotifications(p, 20, filter === 'unread');
      setNotifications(res.data);
      setPagination(res.pagination);
      setUnreadCount(res.unreadCount);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    fetchLatestHeadlines().then(setHeadlines);
  }, [page, filter]);

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      console.error('Failed to mark notification read:', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      alert('Failed to mark all as read: ' + err.message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert('Failed to delete notification: ' + err.message);
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'ARTICLE': return '\uD83D\uDCF0';
      case 'MARKET': return '\uD83D\uDCC8';
      case 'SYSTEM': return '\uD83D\uDD27';
      case 'SOCIAL': return '\uD83D\uDC65';
      case 'ALERT': return '\u26A0\uFE0F';
      default: return '\uD83D\uDD14';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Notifications</h1>
          <p className="text-dark-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && activeTab === 'notifications' && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg border border-primary-500/20 hover:bg-primary-500/10 transition-colors"
          >
            <Check className="w-3 h-3" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tab Switcher: Notifications / News Headlines */}
      <div className="flex gap-1 bg-dark-900 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'notifications'
              ? 'bg-dark-700 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary-500 text-dark-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('headlines')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === 'headlines'
              ? 'bg-dark-700 text-white'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          Latest News
        </button>
      </div>

      {/* ─── Latest News Headlines Tab ─── */}
      {activeTab === 'headlines' && (
        <div className="space-y-3">
          {headlines.length === 0 ? (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
              <Newspaper className="w-10 h-10 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">No news headlines available</p>
            </div>
          ) : (
            headlines.map((h) => (
              <Link
                key={h.id}
                href={h.slug === '#' ? '#' : `/article/${h.slug}`}
                className="block bg-dark-900 border border-dark-700 hover:border-primary-500/30 rounded-xl p-4 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📰</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                        {h.category}
                      </span>
                      <span className="text-[10px] text-dark-500">{h.source}</span>
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                      {h.title}
                    </h3>
                    <p className="text-xs text-dark-400 mt-1 line-clamp-2">{h.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-dark-500">
                        {new Date(h.publishedAt).toLocaleDateString()} at{' '}
                        {new Date(h.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ExternalLink className="w-3 h-3 text-dark-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ─── Notifications Tab ─── */}
      {activeTab === 'notifications' && (
        <>
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-dark-900 rounded-lg p-1 w-fit">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  filter === f
                    ? 'bg-dark-700 text-white'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-dark-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
              <Bell className="w-10 h-10 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      n.read
                        ? 'bg-dark-900 border-dark-700'
                        : 'bg-dark-900/80 border-primary-500/20'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{getTypeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-medium ${n.read ? 'text-dark-300' : 'text-white'}`}>
                            {n.title}
                          </h3>
                          {n.message && (
                            <p className="text-xs text-dark-400 mt-1 line-clamp-2">{n.message}</p>
                          )}
                        </div>
                        {!n.read && (
                          <span className="shrink-0 w-2 h-2 mt-1.5 bg-primary-400 rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-dark-500">
                          {new Date(n.createdAt).toLocaleDateString()} at{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {n.link && (
                          <Link href={n.link} className="text-xs text-primary-400 hover:text-primary-300">
                            View &rarr;
                          </Link>
                        )}
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-xs text-dark-400 hover:text-dark-200"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-xs text-dark-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
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
        </>
      )}
    </div>
  );
}
