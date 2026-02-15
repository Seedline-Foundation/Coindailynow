'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Globe,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite, fetchSitePositions, fetchSiteVerifications } from '@/lib/api';

/**
 * Partner Dashboard Overview - press.coindaily.online/partner
 *
 * Shows partner site stats: DH score, tier, earnings, active PRs,
 * site health, and recent activity. Partners are distributing sites
 * that earn JOY tokens by displaying press releases.
 */

// Fallback mock data — shown until real data loads from Supabase
const FALLBACK_SITE = {
  domain: 'cryptoafrica.news',
  dhScore: 62,
  tier: 'gold',
  status: 'verified',
  threatLevel: 'none',
  positionsTotal: 5,
  positionsActive: 3,
  walletAddress: '0x7a3b...9f2e',
};

const FALLBACK_EARNINGS = {
  thisMonth: 1240,
  lastMonth: 980,
  allTime: 8450,
  pending: 320,
};

const FALLBACK_RELEASES = [
  { id: 'pr-001', title: 'Bitcoin Hits New ATH in African Markets', publisher: 'CoinDaily', status: 'verified', earned: 75, date: '2026-02-12' },
  { id: 'pr-002', title: 'M-Pesa Crypto Integration Launch', publisher: 'FinTechAfrica', status: 'verified', earned: 50, date: '2026-02-11' },
  { id: 'pr-003', title: 'JOY Token Staking Goes Live', publisher: 'CoinDaily', status: 'pending', earned: 0, date: '2026-02-10' },
  { id: 'pr-004', title: 'DeFi Yield Farming Guide for Beginners', publisher: 'Web3Weekly', status: 'verified', earned: 25, date: '2026-02-09' },
];

const tierColors: Record<string, string> = {
  bronze: 'text-amber-600 bg-amber-600/10',
  silver: 'text-gray-300 bg-gray-300/10',
  gold: 'text-yellow-400 bg-yellow-400/10',
  platinum: 'text-cyan-300 bg-cyan-300/10',
};

const threatColors: Record<string, { label: string; color: string }> = {
  none: { label: 'No Threats', color: 'text-green-500 bg-green-500/10' },
  moderate: { label: 'Moderate', color: 'text-yellow-500 bg-yellow-500/10' },
  high: { label: 'High', color: 'text-orange-500 bg-orange-500/10' },
  'very high': { label: 'Very High', color: 'text-red-500 bg-red-500/10' },
};

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [siteInfo, setSiteInfo] = useState(FALLBACK_SITE);
  const [earningsSummary, setEarningsSummary] = useState(FALLBACK_EARNINGS);
  const [recentReleases, setRecentReleases] = useState(FALLBACK_RELEASES);

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const site = await fetchPartnerSite(user.email);
      if (site) {
        const positions = await fetchSitePositions(site.id);
        const activePos = positions.filter((p: any) => p.is_active).length;
        setSiteInfo({
          domain: site.domain,
          dhScore: Number(site.dh_score) || 0,
          tier: site.tier || 'bronze',
          status: site.status,
          threatLevel: site.threat_level || 'none',
          positionsTotal: positions.length || 5,
          positionsActive: activePos || 0,
          walletAddress: site.wallet_address?.slice(0, 6) + '...' + site.wallet_address?.slice(-4) || '—',
        });

        // Load verifications to compute earnings + releases
        const verifications = await fetchSiteVerifications(site.id);
        if (verifications.length > 0) {
          const now = new Date();
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

          let thisMonth = 0, lastMonth = 0, allTime = 0, pending = 0;
          const releases: typeof FALLBACK_RELEASES = [];

          verifications.forEach((v: any) => {
            const amount = Number(v.amount_joy) || 0;
            const date = v.verified_at || v.created_at || '';

            if (v.result === 'passed') {
              allTime += amount;
              if (date >= thisMonthStart) thisMonth += amount;
              else if (date >= lastMonthStart) lastMonth += amount;
            } else if (v.result === 'pending') {
              pending += amount;
            }

            releases.push({
              id: v.id,
              title: v.snapshot_url || `Verification #${v.id.slice(0, 8)}`,
              publisher: v.verification_type || 'placement',
              status: v.result === 'passed' ? 'verified' : 'pending',
              earned: amount,
              date: (date || '').slice(0, 10),
            });
          });

          setEarningsSummary({ thisMonth, lastMonth, allTime, pending });
          if (releases.length > 0) setRecentReleases(releases.slice(0, 4));
        }
      }
    } catch (err) {
      console.error('Failed to load partner data:', err);
    }
  }, [user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  const SITE_INFO = siteInfo;
  const EARNINGS_SUMMARY = earningsSummary;
  const RECENT_RELEASES = recentReleases;
  const threat = threatColors[SITE_INFO.threatLevel] || threatColors.none;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Partner Dashboard</h1>
          <div className="flex items-center gap-3 text-dark-400">
            <Globe className="w-4 h-4" />
            <span>{SITE_INFO.domain}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${tierColors[SITE_INFO.tier]}`}>
              {SITE_INFO.tier} Tier
            </span>
            <span className="text-dark-600">|</span>
            <span>DH {SITE_INFO.dhScore}</span>
          </div>
        </div>
        <Link
          href="/partner/positions"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
        >
          <Layers className="w-4 h-4" />
          Manage Positions
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          title="Earnings This Month"
          value={`${EARNINGS_SUMMARY.thisMonth} JOY`}
          subtitle={`+${Math.round(((EARNINGS_SUMMARY.thisMonth - EARNINGS_SUMMARY.lastMonth) / EARNINGS_SUMMARY.lastMonth) * 100)}% vs last month`}
          color="text-green-500"
        />
        <StatCard
          icon={FileText}
          title="Active Press Releases"
          value={`${SITE_INFO.positionsActive}`}
          subtitle={`of ${SITE_INFO.positionsTotal} positions filled`}
          color="text-blue-500"
        />
        <StatCard
          icon={Eye}
          title="DH Score"
          value={`${SITE_INFO.dhScore} / 100`}
          subtitle={`${SITE_INFO.tier.charAt(0).toUpperCase() + SITE_INFO.tier.slice(1)} tier`}
          color="text-yellow-500"
        />
        <StatCard
          icon={Shield}
          title="Site Health"
          value={threat.label}
          subtitle="Last scan: 2h ago"
          color={threat.color.split(' ')[0]}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Releases (2/3) */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Press Releases</h2>
            <Link href="/partner/releases" className="text-primary-500 hover:text-primary-400 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {RECENT_RELEASES.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white font-medium truncate">{pr.title}</p>
                  <p className="text-dark-500 text-sm">
                    From {pr.publisher} · {pr.date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {pr.status === 'verified' ? (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-500 text-sm">
                      <AlertTriangle className="w-4 h-4" /> Pending
                    </span>
                  )}
                  <span className="text-white font-medium text-sm w-20 text-right">
                    {pr.earned > 0 ? `+${pr.earned} JOY` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings Sidebar (1/3) */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Earnings Summary</h2>
          <div className="space-y-4">
            <EarningsRow label="This Month" value={`${EARNINGS_SUMMARY.thisMonth} JOY`} />
            <EarningsRow label="Last Month" value={`${EARNINGS_SUMMARY.lastMonth} JOY`} />
            <EarningsRow label="All Time" value={`${EARNINGS_SUMMARY.allTime} JOY`} />
            <div className="border-t border-dark-700 pt-4">
              <EarningsRow label="Pending Release" value={`${EARNINGS_SUMMARY.pending} JOY`} highlight />
            </div>
          </div>
          <Link
            href="/partner/earnings"
            className="flex items-center justify-center gap-2 mt-6 w-full py-2.5 border border-dark-600 hover:border-primary-500 text-white rounded-lg transition-colors text-sm"
          >
            View Full Report <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Price / Positions Summary */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Your Positions & Pricing</h2>
          <Link href="/partner/positions" className="text-primary-500 hover:text-primary-400 text-sm">
            Edit Positions
          </Link>
        </div>
        <p className="text-dark-400 text-sm mb-4">
          You set your own price per position. Publishers see your pricing when selecting distribution targets.
          Prices are denominated in JOY and must fall within the tier range for your DH score.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PositionCard
            slug="/sponsored"
            displayType="Full Article"
            priceJoy={75}
            available
          />
          <PositionCard
            slug="#sidebar-widget"
            displayType="Card"
            priceJoy={25}
            available
          />
          <PositionCard
            slug="/press/feed"
            displayType="Feed"
            priceJoy={15}
            available={false}
          />
        </div>
      </div>
    </>
  );
}

/* ---------- Helper Components ---------- */

function StatCard({ icon: Icon, title, value, subtitle, color }: {
  icon: any; title: string; value: string; subtitle: string; color: string;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-7 h-7 ${color}`} />
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>
      <p className="text-dark-400 text-sm mb-0.5">{title}</p>
      <p className="text-xl font-bold text-white mb-1">{value}</p>
      <p className="text-dark-500 text-xs">{subtitle}</p>
    </div>
  );
}

function EarningsRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dark-400 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${highlight ? 'text-primary-500' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function PositionCard({ slug, displayType, priceJoy, available }: {
  slug: string; displayType: string; priceJoy: number; available: boolean;
}) {
  return (
    <div className={`border rounded-lg p-4 ${available ? 'border-dark-600 bg-dark-800' : 'border-dark-700 bg-dark-900 opacity-60'}`}>
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm text-primary-500 bg-dark-700 px-2 py-0.5 rounded">{slug}</code>
        <span className={`px-2 py-0.5 rounded text-xs ${available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {available ? 'Active' : 'Paused'}
        </span>
      </div>
      <p className="text-dark-400 text-sm mb-1">{displayType}</p>
      <p className="text-white font-bold">{priceJoy} JOY</p>
    </div>
  );
}
