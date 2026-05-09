'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchDashboardStats, fetchProfile } from '@/lib/userApi';

interface DashboardStats {
  bookmarkCount: number;
  articlesRead: number;
  unreadNotifications: number;
  totalReadingTimeSec: number;
  recentlyRead: Array<{
    article: { id: string; title: string; slug: string; featuredImageUrl: string | null };
    readAt: string;
  }>;
}

interface UserProfile {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
  subscriptionTier: string;
  createdAt: string;
  _count: {
    UserBookmarks: number;
    ReadingHistories: number;
    UserNotifications: number;
    Article: number;
  };
}

export default function UserDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, profileRes] = await Promise.all([
          fetchDashboardStats(),
          fetchProfile(),
        ]);
        setStats(statsRes.data);
        setProfile(profileRes.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-dark-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-dark-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-2">Failed to load dashboard</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const readingMinutes = Math.round((stats?.totalReadingTimeSec || 0) / 60);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          Welcome back, {profile?.firstName || profile?.username || 'User'}
        </h1>
        <p className="text-gray-400 mt-1">Here&apos;s your reading activity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bookmarks" value={stats?.bookmarkCount || 0} icon="🔖" href="/user/bookmarks" />
        <StatCard title="Articles Read" value={stats?.articlesRead || 0} icon="📚" href="/user/reading-history" />
        <StatCard title="Unread Notifications" value={stats?.unreadNotifications || 0} icon="🔔" href="/user/notifications" />
        <StatCard title="Reading Time" value={`${readingMinutes} min`} icon="⏱️" />
      </div>

      {/* Recently Read */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recently Read</h2>
          <Link href="/user/reading-history" className="text-sm text-primary-400 hover:text-primary-300">
            View all &rarr;
          </Link>
        </div>

        {stats?.recentlyRead && stats.recentlyRead.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentlyRead.map((item) => (
              <Link
                key={item.article.id}
                href={`/article/${item.article.slug}`}
                className="group bg-dark-900 border border-dark-700 rounded-xl overflow-hidden hover:border-primary-500/30 transition-colors"
              >
                {item.article.featuredImageUrl ? (
                  <img
                    src={item.article.featuredImageUrl}
                    alt={item.article.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-32 bg-dark-800 flex items-center justify-center text-3xl">📰</div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {item.article.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    Read {new Date(item.readAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-8 text-center">
            <p className="text-gray-500">No reading history yet. Start exploring articles!</p>
            <Link href="/" className="inline-block mt-3 text-sm text-primary-400 hover:text-primary-300">
              Browse Articles &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/user/bookmarks" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors">
            <span className="text-2xl">🔖</span>
            <span className="text-xs text-gray-400">My Bookmarks</span>
          </Link>
          <Link href="/user/reading-history" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors">
            <span className="text-2xl">📚</span>
            <span className="text-xs text-gray-400">Reading History</span>
          </Link>
          <Link href="/user/notifications" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors">
            <span className="text-2xl">🔔</span>
            <span className="text-xs text-gray-400">Notifications</span>
          </Link>
          <Link href="/user/settings" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs text-gray-400">Settings</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number | string;
  icon: string;
  href?: string;
}) {
  const content = (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-primary-500/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {href && <span className="text-xs text-gray-600">&rarr;</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
