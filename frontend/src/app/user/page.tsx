'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Wallet,
  Star,
  BookOpen,
  Bell,
  Clock3,
  Sparkles,
  ArrowRight,
  Coins,
  DollarSign,
  CalendarDays,
} from 'lucide-react';
import { fetchDashboardStats, fetchProfile } from '@/lib/userApi';
import { dashboardThemeMap, DashboardThemeId, DashboardTheme, getStoredDashboardThemeId } from '@/lib/dashboardThemes';

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

/* ── Tokenomics config (fetched from admin settings, with safe defaults) ── */
const DEFAULT_CP_TO_JY_RATE = 100;  // 100 CP = 1 JY token
const DEFAULT_JY_TOKEN_PRICE = 0.0042; // USD per JY token

interface TokenomicsConfig {
  cpToJyRate: number;
  jyTokenPrice: number;
  cpPointValueUsd: number;
  jyTotalSupply: number;
  jyCirculatingSupply: number;
}

async function fetchTokenomicsConfig(): Promise<TokenomicsConfig> {
  const defaults: TokenomicsConfig = {
    cpToJyRate: DEFAULT_CP_TO_JY_RATE,
    jyTokenPrice: DEFAULT_JY_TOKEN_PRICE,
    cpPointValueUsd: DEFAULT_JY_TOKEN_PRICE / DEFAULT_CP_TO_JY_RATE,
    jyTotalSupply: 1_000_000_000,
    jyCirculatingSupply: 100_000_000,
  };
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/tokenomics/config', { signal: controller.signal });
    if (!res.ok) return defaults;
    const data = await res.json();
    return { ...defaults, ...data };
  } catch {
    return defaults;
  }
}

interface EarningsData {
  cpPoints: number;
  jyTokens: number;
  jyValueUsd: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
}

function getEarningsData(cpToJyRate: number, jyTokenPrice: number): EarningsData {
  // Read from localStorage or return defaults — backend integration later
  if (typeof window === 'undefined') return { cpPoints: 0, jyTokens: 0, jyValueUsd: 0, revenueToday: 0, revenueThisMonth: 0, revenueThisYear: 0 };
  try {
    const raw = localStorage.getItem('coindaily_earnings');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Recalculate JY values based on admin-configured rate
      const jyTokens = parsed.cpPoints / cpToJyRate;
      return { ...parsed, jyTokens, jyValueUsd: jyTokens * jyTokenPrice };
    }
  } catch { /* ignore */ }
  // Seed with sample data so dashboard isn't empty
  const cpPoints = 1250;
  const jyTokens = cpPoints / cpToJyRate;
  return {
    cpPoints,
    jyTokens,
    jyValueUsd: jyTokens * jyTokenPrice,
    revenueToday: 0.12,
    revenueThisMonth: 3.45,
    revenueThisYear: 28.90,
  };
}

interface UserProfile {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
  subscriptionTier: string;
}

export default function UserHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<DashboardThemeId>('milk');
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [tokenomics, setTokenomics] = useState<TokenomicsConfig>({
    cpToJyRate: DEFAULT_CP_TO_JY_RATE,
    jyTokenPrice: DEFAULT_JY_TOKEN_PRICE,
    cpPointValueUsd: DEFAULT_JY_TOKEN_PRICE / DEFAULT_CP_TO_JY_RATE,
    jyTotalSupply: 1_000_000_000,
    jyCirculatingSupply: 100_000_000,
  });

  useEffect(() => {
    setThemeId(getStoredDashboardThemeId());

    // Build fallback data from localStorage so the page always renders
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let fallbackProfile: UserProfile = {
      id: '',
      username: 'User',
      firstName: null,
      lastName: null,
      avatarUrl: null,
      email: '',
      subscriptionTier: 'FREE',
    };
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        fallbackProfile = {
          ...fallbackProfile,
          username: parsed.name || parsed.username || 'User',
          firstName: parsed.firstName || parsed.name?.split(' ')[0] || null,
          email: parsed.email || '',
        };
      } catch { /* ignore */ }
    }

    const fallbackStats: DashboardStats = {
      bookmarkCount: 0,
      articlesRead: 0,
      unreadNotifications: 0,
      totalReadingTimeSec: 0,
      recentlyRead: [],
    };

    async function load() {
      try {
        // Fetch tokenomics config (public endpoint, no auth needed)
        const tkConfig = await fetchTokenomicsConfig();
        setTokenomics(tkConfig);
        setEarnings(getEarningsData(tkConfig.cpToJyRate, tkConfig.jyTokenPrice));

        const [statsRes, profileRes] = await Promise.all([
          fetchDashboardStats(),
          fetchProfile(),
        ]);
        setStats(statsRes.data ?? fallbackStats);
        setProfile(profileRes.data ?? fallbackProfile);
      } catch (err: any) {
        // If backend is unreachable/timeout, show page with fallback data
        console.warn('Dashboard API error, using fallback data:', err.message);
        setStats(fallbackStats);
        setProfile(fallbackProfile);
        setEarnings(getEarningsData(DEFAULT_CP_TO_JY_RATE, DEFAULT_JY_TOKEN_PRICE));
      } finally {
        setLoading(false);
      }
    }
    load();

    // Poll tokenomics config every 60s so admin rate changes appear instantly
    const pollInterval = setInterval(async () => {
      try {
        const tkConfig = await fetchTokenomicsConfig();
        setTokenomics(prev => {
          // Only update state if something actually changed
          if (prev.cpToJyRate !== tkConfig.cpToJyRate || prev.jyTokenPrice !== tkConfig.jyTokenPrice) {
            setEarnings(getEarningsData(tkConfig.cpToJyRate, tkConfig.jyTokenPrice));
            return tkConfig;
          }
          return prev;
        });
      } catch { /* silent — keep showing last known values */ }
    }, 60_000);

    return () => clearInterval(pollInterval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 rounded-2xl bg-orange-50 p-6">
        <div className="h-8 w-48 bg-orange-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="mb-2 text-red-700">Failed to load dashboard</p>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const readingMinutes = Math.round((stats?.totalReadingTimeSec || 0) / 60);
  const activityScore = Math.min(100, Math.round(((stats?.articlesRead || 0) * 6) + ((stats?.bookmarkCount || 0) * 3)));
  const unreadCount = stats?.unreadNotifications || 0;
  const theme = dashboardThemeMap[themeId];
  const t = theme.classes;
  const cx = (...classes: string[]) => classes.filter(Boolean).join(' ');

  return (
    <div className={cx('space-y-8 rounded-2xl p-4 sm:p-6', t.pageBg)}>
      <section className={cx('relative overflow-hidden rounded-2xl border p-6 sm:p-8', t.heroBorder, t.heroBg)}>
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-orange-200/40 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-orange-100/70 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className={cx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', t.heroBorder, t.heroBadgeBg, t.heroBadgeText)}>
              <Sparkles className="h-3.5 w-3.5" />
              Your Personal Dashboard
            </div>
            <h1 className={cx('text-2xl font-display font-bold sm:text-3xl', t.headingText)}>
              Welcome back, {profile?.firstName || profile?.username || 'User'}
            </h1>
            <p className={cx('max-w-2xl text-sm sm:text-base', t.bodyText)}>
              Track your growth, continue reading, and stay ahead with your personalized crypto activity feed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <HeroPill classes={t} label="Activity Score" value={`${activityScore}%`} />
            <HeroPill classes={t} label="Reading Time" value={`${readingMinutes} min`} />
            <HeroPill classes={t} label="Alerts" value={`${unreadCount}`} />
            <HeroPill classes={t} label="Plan" value={profile?.subscriptionTier || 'FREE'} />
          </div>
        </div>
      </section>

      {/* ── Earnings Overview ───────────────────────────── */}
      {earnings && (
        <section className={cx('rounded-2xl border p-6', t.sectionBorder, t.sectionBg)}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={cx('text-lg font-display font-semibold flex items-center gap-2', t.headingText)}>
              <Coins className="h-5 w-5" /> Your Earnings
            </h2>
            <Link href="/user/wallet" className={cx('inline-flex items-center gap-1 text-sm font-medium', t.softAccentText)}>
              Wallet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className={cx('h-4 w-4', t.iconChipText)} />
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>CP Points</span>
              </div>
              <p className={cx('text-xl font-bold', t.headingText)}>{earnings.cpPoints.toLocaleString()}</p>
            </div>

            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cx('text-xs font-bold', t.iconChipText)}>JY</span>
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>Token Balance</span>
              </div>
              <p className={cx('text-xl font-bold', t.headingText)}>{earnings.jyTokens.toFixed(1)}</p>
              <p className={cx('text-[11px] mt-0.5', t.mutedText)}>${earnings.jyValueUsd.toFixed(2)} USD</p>
            </div>

            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cx('text-xs', t.iconChipText)}>JY</span>
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>Price</span>
              </div>
              <p className={cx('text-xl font-bold', t.headingText)}>${tokenomics.jyTokenPrice}</p>
              <p className={cx('text-[11px] mt-0.5', t.mutedText)}>{tokenomics.cpToJyRate} CP = 1 JY</p>
            </div>

            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarDays className={cx('h-4 w-4', t.iconChipText)} />
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>Today</span>
              </div>
              <p className={cx('text-xl font-bold', t.headingText)}>${earnings.revenueToday.toFixed(2)}</p>
            </div>

            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className={cx('h-4 w-4', t.iconChipText)} />
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>This Month</span>
              </div>
              <p className={cx('text-xl font-bold', t.headingText)}>${earnings.revenueThisMonth.toFixed(2)}</p>
            </div>

            <div className={cx('rounded-xl border p-4', t.cardBorder, t.cardBg)}>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className={cx('h-4 w-4', t.iconChipText)} />
                <span className={cx('text-[11px] font-semibold uppercase tracking-wide', t.mutedText)}>This Year</span>
              </div>
              <p className={cx('text-xl font-bold text-green-500', t.headingText)}>${earnings.revenueThisYear.toFixed(2)}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          classes={t}
          title="Saved Articles"
          value={stats?.bookmarkCount || 0}
          subtitle="Your curated watchlist"
          icon={<Star className="w-5 h-5" />}
          href="/user/bookmarks"
        />
        <StatCard
          classes={t}
          title="Articles Read"
          value={stats?.articlesRead || 0}
          subtitle="Insights consumed"
          icon={<BookOpen className="w-5 h-5" />}
          href="/user/reading-history"
        />
        <StatCard
          classes={t}
          title="Unread Alerts"
          value={unreadCount}
          subtitle="Notifications waiting"
          icon={<Bell className="w-5 h-5" />}
          href="/user/notifications"
        />
        <StatCard
          classes={t}
          title="Wallet Access"
          value="Open"
          subtitle="Manage funds quickly"
          icon={<Wallet className="w-5 h-5" />}
          href="/user/wallet"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className={cx('rounded-2xl border p-6 xl:col-span-2', t.sectionBorder, t.sectionBg)}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={cx('text-lg font-display font-semibold', t.headingText)}>Recently Read</h2>
            <Link
              href="/user/reading-history"
              className={cx('inline-flex items-center gap-1 text-sm font-medium', t.softAccentText)}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {stats?.recentlyRead && stats.recentlyRead.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {stats.recentlyRead.map((item) => (
                <Link
                  key={item.article.id}
                  href={`/news/${item.article.slug}`}
                  className={cx('group overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5', t.cardBorder, t.cardBg, t.cardHoverBorder)}
                >
                  {item.article.featuredImageUrl ? (
                    <img
                      src={item.article.featuredImageUrl}
                      alt={item.article.title}
                      className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={cx('flex h-32 w-full items-center justify-center', t.quickLinkBg)}>
                      <BookOpen className={cx('h-8 w-8', t.arrowText)} />
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <h3 className={cx('line-clamp-2 text-sm font-medium transition-colors', t.headingText)}>
                      {item.article.title}
                    </h3>
                    <div className={cx('flex items-center gap-2 text-xs', t.mutedText)}>
                      <Clock3 className="h-3.5 w-3.5" />
                      Read {new Date(item.readAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={cx('rounded-xl border p-10 text-center', t.cardBorder, t.cardBg)}>
              <BookOpen className={cx('mx-auto mb-3 h-8 w-8', t.arrowText)} />
              <p className={t.bodyText}>No reading history yet. Start exploring articles.</p>
              <Link href="/" className={cx('mt-3 inline-block text-sm font-medium', t.softAccentText)}>
                Browse articles
              </Link>
            </div>
          )}
        </section>

        <section className={cx('rounded-2xl border p-6', t.sectionBorder, t.sectionBg)}>
          <h2 className={cx('mb-4 text-lg font-display font-semibold', t.headingText)}>Quick Actions</h2>
          <div className="space-y-3">
            <QuickLink theme={theme} href="/user/portfolio" icon={<TrendingUp className="h-5 w-5" />} label="View Portfolio" />
            <QuickLink theme={theme} href="/user/wallet" icon={<Wallet className="h-5 w-5" />} label="Open Wallet" />
            <QuickLink theme={theme} href="/user/bookmarks" icon={<Star className="h-5 w-5" />} label="Saved Articles" />
            <QuickLink theme={theme} href="/user/notifications" icon={<Bell className="h-5 w-5" />} label="Check Notifications" />
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroPill({
  classes,
  label,
  value,
}: {
  classes: DashboardTheme['classes'];
  label: string;
  value: string;
}) {
  return (
    <div className={['rounded-xl border px-3 py-3', classes.cardBorder, classes.cardBg].join(' ')}>
      <p className={['text-[11px] font-semibold uppercase tracking-wide', classes.mutedText].join(' ')}>{label}</p>
      <p className={['mt-1 text-base font-bold', classes.headingText].join(' ')}>{value}</p>
    </div>
  );
}

function StatCard({
  classes,
  title,
  value,
  subtitle,
  icon,
  href,
}: {
  classes: DashboardTheme['classes'];
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className={['group rounded-xl border p-5 transition-all hover:-translate-y-0.5', classes.cardBorder, classes.cardBg, classes.cardHoverBorder].join(' ')}>
      <div className="flex items-center justify-between mb-3">
        <div className={['flex h-10 w-10 items-center justify-center rounded-lg transition-colors', classes.iconChipBg, classes.iconChipText].join(' ')}>
          {icon}
        </div>
        {href && <ArrowRight className={['h-4 w-4 transition-transform group-hover:translate-x-0.5', classes.arrowText].join(' ')} />}
      </div>
      <p className={['text-2xl font-bold', classes.headingText].join(' ')}>{value}</p>
      <p className={['mt-1 text-xs font-semibold uppercase tracking-wide', classes.bodyText].join(' ')}>{title}</p>
      <p className={['mt-2 text-xs', classes.mutedText].join(' ')}>{subtitle}</p>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function QuickLink({
  theme,
  href,
  icon,
  label,
}: {
  theme: DashboardTheme;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const t = theme.classes;
  return (
    <Link
      href={href}
      className={['flex items-center justify-between rounded-xl border px-4 py-3 transition-all', t.quickLinkBorder, t.quickLinkBg, t.cardHoverBorder, t.quickLinkHoverBg].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className={['flex h-9 w-9 items-center justify-center rounded-lg', t.cardBg, t.iconChipText].join(' ')}>{icon}</div>
        <span className={['text-sm font-medium', t.headingText].join(' ')}>{label}</span>
      </div>
      <ArrowRight className={['h-4 w-4', t.arrowText].join(' ')} />
    </Link>
  );
}
