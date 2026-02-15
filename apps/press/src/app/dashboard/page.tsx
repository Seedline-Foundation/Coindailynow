'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Eye,
  MousePointer,
  Coins,
  Lock,
  CheckCircle,
  Clock,
  ArrowRight,
  Globe,
  Layers,
  Send,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchPublisherProfile,
  fetchPublisherDistributions,
  fetchAvailablePartnerSites,
} from '@/lib/api';

/**
 * Publisher Dashboard - press.coindaily.online/dashboard
 *
 * Main dashboard for PR publishers (buyers) to:
 * - Distribute press releases across the SENDPRESS network
 * - Create distribution campaigns using the Distribution Wizard
 * - Track campaign performance, impressions, CTR
 * - Manage JOY token balance and escrow status
 * - View partner network (pre-existing + extended)
 * - All pricing in JOY tokens on Polygon
 */

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Distribute', href: '/dashboard/distribute', icon: Send },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: FileText },
  { name: 'Network', href: '/dashboard/network', icon: Globe },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

// Fallback mock data — shown until real data loads from Supabase
const FALLBACK_WALLET = {
  address: '0x4e2a...c8f1',
  joyBalance: 15200,
  lockedInEscrow: 3800,
  available: 11400,
};

const FALLBACK_STATS = {
  activeCampaigns: 12,
  totalImpressions: '2.4M',
  avgCTR: '4.2%',
  totalSpent: 8450,
};

const FALLBACK_DISTRIBUTIONS = [
  { id: 'dist-1', prTitle: 'Token Launch Announcement', status: 'verified', sites: 8, spent: 2400, impressions: '450K', ctr: '4.8%', date: '2026-02-12' },
  { id: 'dist-2', prTitle: 'Partnership Press Release', status: 'active', sites: 5, spent: 1600, impressions: '320K', ctr: '3.9%', date: '2026-02-11' },
  { id: 'dist-3', prTitle: 'Product Update Article', status: 'completed', sites: 3, spent: 750, impressions: '180K', ctr: '3.2%', date: '2026-02-09' },
  { id: 'dist-4', prTitle: 'Market Analysis Piece', status: 'pending', sites: 6, spent: 1800, impressions: '—', ctr: '—', date: '2026-02-08' },
];

const ESCROW_SUMMARY = [
  { label: 'Locked in Escrow', value: '3,800 JOY', color: 'text-blue-500', icon: Lock },
  { label: 'Pending Verification', value: '1,200 JOY', color: 'text-yellow-500', icon: Clock },
  { label: 'Released (Paid)', value: '4,650 JOY', color: 'text-green-500', icon: CheckCircle },
];

export default function PublisherDashboard() {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Real data state with fallbacks
  const [walletInfo, setWalletInfo] = useState(FALLBACK_WALLET);
  const [campaignStats, setCampaignStats] = useState(FALLBACK_STATS);
  const [distributions, setDistributions] = useState(FALLBACK_DISTRIBUTIONS);
  const [escrowSummary, setEscrowSummary] = useState(ESCROW_SUMMARY);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const profile = await fetchPublisherProfile(user.id);
      if (profile) {
        const locked = Number(profile.joy_balance) * 0.25; // estimate
        setWalletInfo({
          address: profile.wallet_address?.slice(0, 6) + '...' + profile.wallet_address?.slice(-4) || '—',
          joyBalance: Number(profile.joy_balance) || 0,
          lockedInEscrow: locked,
          available: Number(profile.joy_balance) - locked,
        });
      }

      const dists = await fetchPublisherDistributions(profile?.id || '');
      if (dists.length > 0) {
        const mapped = dists.map((d: any) => ({
          id: d.id,
          prTitle: d.press_releases?.title || 'Untitled',
          status: d.status,
          sites: d.target_sites?.length || 0,
          spent: Number(d.credits_locked) || 0,
          impressions: '—',
          ctr: '—',
          date: d.created_at?.split('T')[0] || '',
        }));
        setDistributions(mapped);

        const active = dists.filter((d: any) => ['pending', 'processing'].includes(d.status)).length;
        const totalSpent = dists.reduce((s: number, d: any) => s + (Number(d.credits_locked) || 0), 0);
        setCampaignStats(prev => ({ ...prev, activeCampaigns: active, totalSpent }));
      }
    } catch (err) {
      console.error('Failed to load publisher data:', err);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const WALLET_INFO = walletInfo;
  const CAMPAIGN_STATS = campaignStats;
  const RECENT_DISTRIBUTIONS = distributions;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-dark-900 border-r border-dark-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-lg text-white">SENDPRESS</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-dark-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors group"
            >
              <item.icon className="w-5 h-5 text-dark-500 group-hover:text-primary-500" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Wallet & JOY Balance */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-dark-700">
          <div className="p-4 space-y-2">
            <a
              href="https://discord.gg/coindaily"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm w-full"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Help Center (Discord)
            </a>
            <div className="bg-dark-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4 text-primary-500" />
                <span className="text-xs text-dark-400">JOY Balance</span>
              </div>
              <p className="text-lg font-bold text-white">{WALLET_INFO.joyBalance.toLocaleString()} JOY</p>
              <p className="text-xs text-dark-500 mt-1">
                Available: {WALLET_INFO.available.toLocaleString()} · Escrow: {WALLET_INFO.lockedInEscrow.toLocaleString()}
              </p>
            </div>
            <div className="px-1">
              <p className="text-xs text-dark-500 truncate">{WALLET_INFO.address}</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-dark-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search distributions..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-dark-400 hover:text-white">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
              </button>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">P</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Publisher Dashboard
              </h1>
              <p className="text-dark-400">
                Distribute press releases across the SENDPRESS network and track performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/distribute"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-primary-600 hover:opacity-90 text-white font-semibold rounded-lg transition-opacity"
              >
                <Layers className="w-5 h-5" />
                AI Write (Ollama3)
              </Link>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                New Distribution
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={FileText}
              title="Active Distributions"
              value={String(CAMPAIGN_STATS.activeCampaigns)}
              change="+3 this week"
              color="text-blue-500"
            />
            <StatCard
              icon={Eye}
              title="Total Impressions"
              value={CAMPAIGN_STATS.totalImpressions}
              change="+18.5% vs last week"
              color="text-green-500"
            />
            <StatCard
              icon={MousePointer}
              title="Click-Through Rate"
              value={CAMPAIGN_STATS.avgCTR}
              change="+0.8% vs avg"
              color="text-purple-500"
            />
            <StatCard
              icon={Coins}
              title="Total Spent"
              value={`${CAMPAIGN_STATS.totalSpent.toLocaleString()} JOY`}
              change="2,100 JOY this week"
              color="text-primary-500"
            />
          </div>

          {/* Escrow Status + Buy JOY */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            {ESCROW_SUMMARY.map((item) => (
              <div key={item.label} className="bg-dark-900 border border-dark-700 rounded-xl p-5">
                <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
                <p className="text-dark-400 text-sm mb-0.5">{item.label}</p>
                <p className="text-lg font-bold text-white">{item.value}</p>
              </div>
            ))}
            {/* Buy JOY CTA */}
            <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <Coins className="w-6 h-6 text-primary-500 mb-2" />
                <p className="text-white font-semibold mb-1">Need more JOY?</p>
                <p className="text-dark-400 text-xs">Buy JOY on ImaSwap DEX (Polygon)</p>
              </div>
              <a
                href="https://imaswap.online"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-1.5 text-primary-500 hover:text-primary-400 text-sm font-semibold"
              >
                Open DEX <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Distribution Wizard Modal */}
          {showWizard && (
            <DistributionWizard onClose={() => setShowWizard(false)} walletInfo={walletInfo} />
          )}

          {/* Recent Distributions */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Distributions</h2>
              <Link href="/dashboard/campaigns" className="text-primary-500 hover:text-primary-400 text-sm">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Press Release</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-center">Sites</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Spent</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Impressions</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">CTR</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_DISTRIBUTIONS.map((dist) => (
                    <DistributionRow key={dist.id} {...dist} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Performance Overview</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-dark-600 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400">Impressions & CTR chart will render here</p>
                <p className="text-dark-500 text-sm">Connect to Recharts for live data</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Distribution Wizard (Step 1-4) ---------- */

function DistributionWizard({ onClose, walletInfo }: { onClose: () => void; walletInfo: { address: string; joyBalance: number; lockedInEscrow: number; available: number } }) {
  const WALLET_INFO = walletInfo;
  const [step, setStep] = useState(1);
  const [wizardPartners, setWizardPartners] = useState<{ id: string; domain: string; dh: number; tier: string; type: string }[]>([]);
  const [strategy, setStrategy] = useState({
    usePreExisting: true,
    preExistingPartners: [] as string[],
    extendToTiers: [] as string[],
    budget: 0,
    prUrl: '',
  });

  // Load real partners from Supabase
  useEffect(() => {
    fetchAvailablePartnerSites().then(sites => {
      const mapped = sites.map(s => ({
        id: s.id,
        domain: s.domain,
        dh: Number(s.dh_score) || 0,
        tier: s.tier || 'bronze',
        type: 'pre-existing',
      }));
      if (mapped.length > 0) setWizardPartners(mapped);
    }).catch(console.error);
  }, []);

  const TIERS = [
    { id: 'bronze', label: 'Bronze (DH 20-39)', range: '5–20 JOY/site', color: 'text-amber-600 border-amber-600/30' },
    { id: 'silver', label: 'Silver (DH 40-59)', range: '15–50 JOY/site', color: 'text-gray-300 border-gray-300/30' },
    { id: 'gold', label: 'Gold (DH 60-79)', range: '40–150 JOY/site', color: 'text-yellow-400 border-yellow-400/30' },
    { id: 'platinum', label: 'Platinum (DH 80-100)', range: '100–500 JOY/site', color: 'text-cyan-300 border-cyan-300/30' },
  ];

  const toggleTier = (tier: string) => {
    setStrategy((s) => ({
      ...s,
      extendToTiers: s.extendToTiers.includes(tier)
        ? s.extendToTiers.filter((t) => t !== tier)
        : [...s.extendToTiers, tier],
    }));
  };

  const togglePartner = (id: string) => {
    setStrategy((s) => ({
      ...s,
      preExistingPartners: s.preExistingPartners.includes(id)
        ? s.preExistingPartners.filter((p) => p !== id)
        : [...s.preExistingPartners, id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Wizard Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-xl font-bold text-white">Distribution Wizard</h2>
            <p className="text-dark-400 text-sm">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary-500' : 'bg-dark-700'}`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Select Pre-existing Partners */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Select Pre-Existing Partners</h3>
              <p className="text-dark-400 text-sm mb-4">
                These are your affiliate partners. Distribution to them is <span className="text-green-500 font-semibold">free</span> (no JOY charge).
              </p>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={strategy.usePreExisting}
                  onChange={(e) => setStrategy((s) => ({ ...s, usePreExisting: e.target.checked }))}
                  className="rounded border-dark-600"
                />
                <label className="text-sm text-dark-300">Include pre-existing partners</label>
              </div>
              {strategy.usePreExisting && (
                <div className="space-y-2">
                  {wizardPartners.length === 0 ? (
                    <p className="text-dark-500 text-sm py-4 text-center">No verified partner sites yet.</p>
                  ) : wizardPartners.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => togglePartner(p.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        strategy.preExistingPartners.includes(p.id)
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-dark-400" />
                        <span className="text-white font-medium">{p.domain}</span>
                        <span className="text-xs text-dark-500 capitalize">DH {p.dh} · {p.tier}</span>
                      </div>
                      <span className="text-green-500 text-xs font-semibold">FREE</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Extend to Tier Network */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Extend to Tier Network</h3>
              <p className="text-dark-400 text-sm mb-4">
                Select additional tiers to distribute to. These sites charge JOY per placement based on their tier.
              </p>
              <div className="space-y-3">
                {TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => toggleTier(tier.id)}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      strategy.extendToTiers.includes(tier.id)
                        ? 'border-primary-500 bg-primary-500/5'
                        : `border-dark-700 hover:border-dark-500`
                    }`}
                  >
                    <div>
                      <span className={`font-semibold ${tier.color.split(' ')[0]}`}>{tier.label}</span>
                    </div>
                    <span className="text-dark-400 text-sm">{tier.range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Set Budget & PR Details */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Budget & PR Details</h3>
              <p className="text-dark-400 text-sm mb-4">
                Set your JOY budget and provide the PR URL to distribute.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1">PR URL</label>
                  <input
                    type="url"
                    placeholder="https://your-site.com/press-release"
                    value={strategy.prUrl}
                    onChange={(e) => setStrategy((s) => ({ ...s, prUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1">Maximum Budget (JOY)</label>
                  <input
                    type="number"
                    placeholder="5000"
                    value={strategy.budget || ''}
                    onChange={(e) => setStrategy((s) => ({ ...s, budget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <p className="text-dark-500 text-xs mt-1">
                    Available balance: <span className="text-primary-500">{WALLET_INFO.available.toLocaleString()} JOY</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Review & Confirm</h3>
              <p className="text-dark-400 text-sm mb-4">Review your distribution strategy before locking credits in escrow.</p>
              <div className="bg-dark-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Pre-existing Partners</span>
                  <span className="text-white font-medium">{strategy.preExistingPartners.length} sites (free)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Extended Tiers</span>
                  <span className="text-white font-medium capitalize">{strategy.extendToTiers.join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">PR URL</span>
                  <span className="text-primary-400 text-xs truncate max-w-[250px]">{strategy.prUrl || '—'}</span>
                </div>
                <div className="border-t border-dark-600 pt-3 flex justify-between">
                  <span className="text-dark-400">Budget (max escrow lock)</span>
                  <span className="text-white font-bold">{strategy.budget.toLocaleString()} JOY</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <Lock className="w-4 h-4 inline mr-1" />
                  JOY tokens will be locked in the CreditsEscrow contract until AI verification confirms placement on each site. Pre-existing partners receive no charge.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="flex items-center justify-between p-6 border-t border-dark-700">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              if (step < 4) setStep(step + 1);
              else {
                // TODO: Call DistributionService.process() to lock escrow & begin distribution
                onClose();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
          >
            {step < 4 ? (
              <>Next <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Lock Escrow & Distribute <Send className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function StatCard({ icon: Icon, title, value, change, color }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  color: string;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-8 h-8 ${color}`} />
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <p className="text-dark-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      <p className="text-dark-500 text-sm">{change}</p>
    </div>
  );
}

function DistributionRow({ prTitle, status, sites, spent, impressions, ctr, date }: {
  id: string;
  prTitle: string;
  status: string;
  sites: number;
  spent: number;
  impressions: string;
  ctr: string;
  date: string;
}) {
  const statusColors: Record<string, string> = {
    verified: 'bg-green-500/20 text-green-500',
    active: 'bg-blue-500/20 text-blue-500',
    completed: 'bg-cyan-500/20 text-cyan-500',
    pending: 'bg-yellow-500/20 text-yellow-500',
  };

  return (
    <tr className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
      <td className="py-3 pr-4">
        <p className="text-white font-medium truncate max-w-[220px]">{prTitle}</p>
        <p className="text-dark-500 text-xs mt-0.5">{date}</p>
      </td>
      <td className="py-3 text-center">
        <span className="text-dark-300">{sites}</span>
      </td>
      <td className="py-3 text-right">
        <span className="text-white font-medium">{spent.toLocaleString()} JOY</span>
      </td>
      <td className="py-3 text-right text-dark-300">{impressions}</td>
      <td className="py-3 text-right text-dark-300">{ctr}</td>
      <td className="py-3">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] || ''}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
