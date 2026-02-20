'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone, DollarSign, Users, TrendingUp, BarChart3,
  CheckCircle, Clock, XCircle, ArrowRight, Loader2,
  ExternalLink, Star, Handshake, Wallet
} from 'lucide-react';

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  website: string;
  country: string;
  niche: string;
  status: string;
  overallScore: number;
  tier: string;
  socialHandles: SocialHandle[];
  verifications: Verification[];
  earnings: Earning[];
  collaborations: Collaboration[];
}

interface SocialHandle {
  platform: string;
  handle: string;
  profileUrl: string;
  followers: number;
  avgViews: number;
  watchHours: number;
  engagementRate: number;
  verified: boolean;
}

interface Verification {
  category: string;
  score: number;
  weight: number;
  passed: boolean;
}

interface Earning {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

interface Collaboration {
  id: string;
  title: string;
  type: string;
  status: string;
  budget: number | null;
  deadline: string | null;
  completedAt: string | null;
  proofUrl: string | null;
}

const TIER_COLORS: Record<string, string> = {
  standard: 'text-gray-400 border-gray-400/30 bg-gray-400/5',
  silver: 'text-slate-300 border-slate-300/30 bg-slate-300/5',
  gold: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  platinum: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
};

const STATUS_ICONS: Record<string, any> = {
  approved: { icon: CheckCircle, color: 'text-green-400' },
  pending: { icon: Clock, color: 'text-yellow-400' },
  rejected: { icon: XCircle, color: 'text-red-400' },
  under_review: { icon: Clock, color: 'text-blue-400' },
  suspended: { icon: XCircle, color: 'text-red-500' },
};

// ─── Demo data for fallback ──────────────────────────────────

const demoProfile: ProfileData = {
  id: 'demo',
  displayName: 'CryptoKing Africa',
  bio: 'Leading crypto educator for the African market.',
  website: 'https://cryptoking.africa',
  country: 'Nigeria',
  niche: 'crypto',
  status: 'approved',
  overallScore: 78.5,
  tier: 'gold',
  socialHandles: [
    { platform: 'twitter', handle: '@cryptoking_ng', profileUrl: 'https://twitter.com/cryptoking_ng', followers: 85000, avgViews: 0, watchHours: 0, engagementRate: 5.2, verified: true },
    { platform: 'youtube', handle: 'CryptoKing Africa', profileUrl: 'https://youtube.com/@cryptoking', followers: 42000, avgViews: 180000, watchHours: 12000, engagementRate: 4.1, verified: true },
    { platform: 'telegram', handle: '@cryptoking_chat', profileUrl: 'https://t.me/cryptoking_chat', followers: 28000, avgViews: 0, watchHours: 0, engagementRate: 8.5, verified: true },
  ],
  verifications: [
    { category: 'followers', score: 82, weight: 0.25, passed: true },
    { category: 'views', score: 70, weight: 0.20, passed: true },
    { category: 'watch_hours', score: 73.3, weight: 0.15, passed: true },
    { category: 'engagement', score: 100, weight: 0.25, passed: true },
    { category: 'organic', score: 100, weight: 0.15, passed: true },
  ],
  earnings: [
    { id: '1', type: 'distribution', amount: 150, currency: 'USD', status: 'paid', createdAt: '2024-12-01', paidAt: '2024-12-05' },
    { id: '2', type: 'campaign', amount: 300, currency: 'USD', status: 'paid', createdAt: '2024-12-10', paidAt: '2024-12-15' },
    { id: '3', type: 'referral', amount: 50, currency: 'USD', status: 'paid', createdAt: '2024-12-20', paidAt: '2024-12-25' },
    { id: '4', type: 'distribution', amount: 200, currency: 'USD', status: 'pending', createdAt: '2025-01-05', paidAt: null },
    { id: '5', type: 'campaign', amount: 500, currency: 'USD', status: 'approved', createdAt: '2025-01-10', paidAt: null },
  ],
  collaborations: [
    { id: '1', title: 'DeFi Protocol Launch Thread', type: 'thread', status: 'completed', budget: 200, deadline: '2024-12-15', completedAt: '2024-12-14', proofUrl: 'https://twitter.com/example/status/123' },
    { id: '2', title: 'NFT Marketplace Review Video', type: 'video', status: 'in_progress', budget: 500, deadline: '2025-02-01', completedAt: null, proofUrl: null },
    { id: '3', title: 'Token Launch AMA Session', type: 'ama', status: 'proposed', budget: 300, deadline: '2025-02-15', completedAt: null, proofUrl: null },
  ],
};

export default function InfluencerDashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'collaborations' | 'channels'>('overview');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/influencer/profile');
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
      } else {
        setProfile(demoProfile);
      }
    } catch {
      setProfile(demoProfile);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-bold mb-2">No Profile Found</h2>
          <p className="text-gray-400 mb-4">You haven&apos;t registered as an influencer partner yet.</p>
          <Link href="/influencer/register" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg transition inline-flex items-center gap-2">
            Register Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const totalEarned = profile.earnings.reduce((s, e) => s + e.amount, 0);
  const pendingAmount = profile.earnings.filter(e => e.status === 'pending' || e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const paidAmount = profile.earnings.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);
  const activeCollabs = profile.collaborations.filter(c => c.status === 'in_progress' || c.status === 'proposed').length;
  const statusInfo = STATUS_ICONS[profile.status] || STATUS_ICONS.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-amber-400" />
            <span className="font-bold text-lg">SENDPRESS</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className={`text-xs px-2 py-1 rounded-full border ${TIER_COLORS[profile.tier] || TIER_COLORS.standard}`}>
              {profile.tier.toUpperCase()} Partner
            </span>
            <span className="text-sm text-gray-400">{profile.displayName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Profile Status Banner */}
        <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between ${
          profile.status === 'approved' ? 'bg-green-500/5 border-green-500/20' :
          profile.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
          'bg-yellow-500/5 border-yellow-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
            <div>
              <div className="font-medium capitalize">{profile.status.replace('_', ' ')}</div>
              <div className="text-sm text-gray-400">
                Verification Score: <span className="text-amber-400 font-bold">{profile.overallScore}/100</span>
              </div>
            </div>
          </div>
          {profile.status === 'rejected' && (
            <Link href="/influencer/register" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Re-verify <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <DollarSign className="h-4 w-4" /> Total Earned
            </div>
            <div className="text-2xl font-bold text-green-400">${totalEarned.toLocaleString()}</div>
          </div>
          <div className="bg-dark-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Wallet className="h-4 w-4" /> Pending
            </div>
            <div className="text-2xl font-bold text-yellow-400">${pendingAmount.toLocaleString()}</div>
          </div>
          <div className="bg-dark-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Users className="h-4 w-4" /> Followers
            </div>
            <div className="text-2xl font-bold">
              {profile.socialHandles.reduce((s, h) => s + h.followers, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-dark-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Handshake className="h-4 w-4" /> Active Collabs
            </div>
            <div className="text-2xl font-bold text-blue-400">{activeCollabs}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-6">
          <div className="flex gap-1">
            {(['overview', 'earnings', 'collaborations', 'channels'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize ${
                  activeTab === tab
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* === Overview Tab === */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Scores */}
            <div className="bg-dark-900/60 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-400" /> Verification Breakdown
              </h3>
              {profile.verifications.map(v => (
                <div key={v.category} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{v.category.replace('_', ' ')}</span>
                    <span className={v.passed ? 'text-green-400' : 'text-red-400'}>{v.score}/100</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${v.passed ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(v.score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Earnings */}
            <div className="bg-dark-900/60 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" /> Recent Earnings
              </h3>
              {profile.earnings.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <div className="text-sm font-medium capitalize">{e.type}</div>
                    <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">${e.amount}</div>
                    <div className={`text-xs capitalize ${
                      e.status === 'paid' ? 'text-green-400' :
                      e.status === 'pending' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>{e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === Earnings Tab === */}
        {activeTab === 'earnings' && (
          <div className="bg-dark-900/60 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">All Earnings</h3>
              <div className="text-sm text-gray-400">
                Paid: <span className="text-green-400 font-bold">${paidAmount}</span> | 
                Pending: <span className="text-yellow-400 font-bold">${pendingAmount}</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/10">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Paid</th>
                </tr>
              </thead>
              <tbody>
                {profile.earnings.map(e => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="py-2 capitalize">{e.type}</td>
                    <td className="py-2 font-bold text-green-400">${e.amount}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        e.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        e.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{e.status}</span>
                    </td>
                    <td className="py-2 text-gray-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-gray-400">{e.paidAt ? new Date(e.paidAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === Collaborations Tab === */}
        {activeTab === 'collaborations' && (
          <div className="space-y-4">
            {profile.collaborations.map(c => (
              <div key={c.id} className="bg-dark-900/60 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{c.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="capitalize">{c.type.replace('_', ' ')}</span>
                      {c.budget && <span>Budget: <span className="text-amber-400">${c.budget}</span></span>}
                      {c.deadline && <span>Due: {new Date(c.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    c.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    c.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    c.status === 'proposed' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{c.status.replace('_', ' ')}</span>
                </div>
                {c.proofUrl && (
                  <a
                    href={c.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-2"
                  >
                    View Proof <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === Channels Tab === */}
        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.socialHandles.map((h, i) => (
              <div key={i} className="bg-dark-900/60 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold capitalize">{h.platform}</span>
                  {h.verified && <CheckCircle className="h-4 w-4 text-green-400" />}
                </div>
                <div className="text-sm text-amber-400 mb-3">{h.handle}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-dark-800 rounded p-2">
                    <div className="text-gray-500">Followers</div>
                    <div className="font-bold">{h.followers.toLocaleString()}</div>
                  </div>
                  <div className="bg-dark-800 rounded p-2">
                    <div className="text-gray-500">Engagement</div>
                    <div className="font-bold">{h.engagementRate}%</div>
                  </div>
                  {h.avgViews > 0 && (
                    <div className="bg-dark-800 rounded p-2">
                      <div className="text-gray-500">Avg Views</div>
                      <div className="font-bold">{h.avgViews.toLocaleString()}</div>
                    </div>
                  )}
                  {h.watchHours > 0 && (
                    <div className="bg-dark-800 rounded p-2">
                      <div className="text-gray-500">Watch Hours</div>
                      <div className="font-bold">{h.watchHours.toLocaleString()}</div>
                    </div>
                  )}
                </div>
                <a
                  href={h.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-3"
                >
                  View Profile <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
