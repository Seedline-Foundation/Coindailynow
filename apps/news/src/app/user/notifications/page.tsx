'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
      case 'ARTICLE': return '📰';
      case 'MARKET': return '📈';
      case 'SYSTEM': return '🔧';
      case 'SOCIAL': return '👥';
      case 'ALERT': return '⚠️';
      default: return '🔔';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg border border-primary-500/20 hover:bg-primary-500/10 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-dark-900 rounded-lg p-1 w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              filter === f
                ? 'bg-dark-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
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
          <span className="text-4xl block mb-4">🔔</span>
          <p className="text-gray-400">
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
                {/* Icon */}
                <span className="text-xl mt-0.5">{getTypeIcon(n.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-medium ${n.read ? 'text-gray-300' : 'text-white'}`}>
                        {n.title}
                      </h3>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      )}
                    </div>
                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 mt-1.5 bg-primary-400 rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-600">
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
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-xs text-gray-600 hover:text-red-400"
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
