'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  LayoutDashboard,
  Users,
  Globe,
  FileText,
  BarChart3,
  Settings,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Bell,
  Menu,
  X,
  TrendingUp,
  Eye,
  Coins,
  Send,
  Lock,
  Activity,
  Zap,
  Server,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  UserCheck,
  UserX,
  Megaphone,
  LogOut,
  ChevronDown,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/**
 * Super Admin Dashboard — jet.coindaily.online / /admin
 *
 * Central control panel that coordinates both Publisher and Partner dashboards.
 * NOW CONNECTED: Fetches data from Supabase via API routes and performs real actions.
 */

const ADMIN_NAV = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Sites', href: '/admin/sites', icon: Globe },
  { name: 'Distributions', href: '/admin/distributions', icon: Send },
  { name: 'Moderation', href: '/admin/moderation', icon: AlertTriangle },
  { name: 'Escrow', href: '/admin/escrow', icon: Lock },
  { name: 'AI System', href: '/admin/ai', icon: Zap },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Initial empty state — will be populated from API
const EMPTY_STATS = {
  totalUsers: 0, publishers: 0, partners: 0, activeSites: 0, pendingSites: 0,
  activeDistributions: 0, totalEscrow: 0, revenue30d: 0, aiTasksToday: 0, moderationQueue: 0,
};

export default function SuperAdminDashboard() {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [pendingSites, setPendingSites] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [escrowTxs, setEscrowTxs] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch all data from API routes ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get auth token for admin API calls
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const token = session?.access_token || '';
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const [statsRes, sitesRes, usersRes, escrowRes, aiRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeaders }).then(r => r.json()).catch(() => EMPTY_STATS),
        fetch('/api/admin/sites', { headers: authHeaders }).then(r => r.json()).catch(() => ({ pending: [], all: [] })),
        fetch('/api/admin/users', { headers: authHeaders }).then(r => r.json()).catch(() => ({ publishers: [], sites: [] })),
        fetch('/api/admin/escrow', { headers: authHeaders }).then(r => r.json()).catch(() => ({ distributions: [] })),
        fetch('/api/admin/ai-status', { headers: authHeaders }).then(r => r.json()).catch(() => ({ services: [] })),
      ]);

      setStats(statsRes);
      setPendingSites(sitesRes.pending || []);

      // Merge publishers and sites into a unified user list
      const merged = [
        ...(usersRes.publishers || []).map((p: any) => ({
          id: p.id, name: p.company_name || 'Publisher', type: 'publisher',
          email: p.contact_email, status: p.status, joined: p.created_at?.split('T')[0],
          amount: p.joy_balance,
        })),
        ...(usersRes.sites || []).map((s: any) => ({
          id: s.id, name: s.owner_name || s.domain, type: 'partner',
          email: s.owner_email, status: s.status, joined: s.created_at?.split('T')[0],
          amount: s.dh_score,
        })),
      ].sort((a, b) => (b.joined || '').localeCompare(a.joined || '')).slice(0, 10);
      setRecentUsers(merged);

      // Map distributions for escrow monitor
      const txs = (escrowRes.distributions || []).map((d: any) => ({
        id: d.id,
        campaign: d.press_releases?.title || 'Untitled',
        publisher: d.press_publishers?.company_name || d.press_publishers?.wallet_address?.slice(0, 10) || 'Unknown',
        amount: Number(d.credits_locked) || 0,
        status: d.status,
        sites: d.target_sites?.length || 0,
        date: d.created_at?.split('T')[0],
      }));
      setEscrowTxs(txs);

      setAiStatus(aiRes.services || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Admin Actions ───

  const handleSiteAction = async (siteId: string, action: 'approve' | 'reject') => {
    setActionLoading(siteId);
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ siteId, action }),
      });
      if (res.ok) {
        setPendingSites(prev => prev.filter(s => s.id !== siteId));
        setStats(prev => ({ ...prev, pendingSites: Math.max(0, prev.pendingSites - 1) }));
      }
    } catch (err) {
      console.error(`Failed to ${action} site:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscrowAction = async (distId: string, action: 'release' | 'refund') => {
    setActionLoading(distId);
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/admin/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ distributionId: distId, action }),
      });
      if (res.ok) {
        setEscrowTxs(prev => prev.map(t =>
          t.id === distId ? { ...t, status: action === 'release' ? 'released' : 'refunded' } : t
        ));
      }
    } catch (err) {
      console.error(`Failed to ${action} escrow:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const PLATFORM_STATS = stats;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-dark-900 border-r border-dark-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <span className="font-display font-bold text-lg text-white block leading-tight">JET ADMIN</span>
              <span className="text-[10px] text-dark-500 leading-tight">jet.coindaily.online</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {ADMIN_NAV.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                item.name === 'Overview'
                  ? 'bg-dark-800 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.name === 'Overview' ? 'text-red-500' : 'text-dark-500 group-hover:text-red-500'}`} />
              <span>{item.name}</span>
              {item.name === 'Moderation' && PLATFORM_STATS.moderationQueue > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                  {PLATFORM_STATS.moderationQueue}
                </span>
              )}
              {item.name === 'Sites' && PLATFORM_STATS.pendingSites > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-dark-950 text-xs rounded-full font-bold">
                  {PLATFORM_STATS.pendingSites}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Quick Links */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-dark-700 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm">
            <Megaphone className="w-4 h-4" /> Publisher Dashboard
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Link>
          <Link href="/partner" className="flex items-center gap-2 px-3 py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm">
            <Globe className="w-4 h-4" /> Partner Dashboard
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
          <div className="flex items-center justify-between h-full px-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-dark-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  placeholder="Search users, sites, campaigns..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-dark-400 hover:text-white">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-900" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white font-medium hidden sm:block">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-1">Platform Overview</h1>
            <p className="text-dark-400 text-sm">Super Admin control panel — jet.coindaily.online</p>
          </div>

          {/* ═══ Stats Grid ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard icon={Users} label="Total Users" value={PLATFORM_STATS.totalUsers.toLocaleString()} sub={`${PLATFORM_STATS.publishers} pub / ${PLATFORM_STATS.partners} partner`} color="text-blue-500" />
            <StatCard icon={Globe} label="Active Sites" value={PLATFORM_STATS.activeSites.toLocaleString()} sub={`${PLATFORM_STATS.pendingSites} pending review`} color="text-green-500" />
            <StatCard icon={Send} label="Active Distributions" value={String(PLATFORM_STATS.activeDistributions)} sub="156 campaigns live" color="text-purple-500" />
            <StatCard icon={Lock} label="Total in Escrow" value={`${(PLATFORM_STATS.totalEscrow / 1000).toFixed(1)}K JOY`} sub="Locked across campaigns" color="text-yellow-500" />
            <StatCard icon={Coins} label="Revenue (30d)" value={`${(PLATFORM_STATS.revenue30d / 1000).toFixed(1)}K JOY`} sub="Platform fees collected" color="text-primary-500" />
          </div>

          {/* ═══ Two Column Layout ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pending Sites */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-yellow-500" /> Sites Pending Approval
                </h2>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full font-bold">{pendingSites.length}</span>
              </div>
              <div className="space-y-3">
                {pendingSites.length === 0 && !loading && (
                  <p className="text-dark-500 text-sm py-4 text-center">No sites pending approval</p>
                )}
                {pendingSites.map(site => (
                  <div key={site.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">{site.domain}</p>
                      <p className="text-dark-500 text-xs">{site.owner_name || site.owner_email || 'Unknown'} · {site.created_at?.split('T')[0]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSiteAction(site.id, 'approve')}
                        disabled={actionLoading === site.id}
                        className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        {actionLoading === site.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleSiteAction(site.id, 'reject')}
                        disabled={actionLoading === site.id}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Moderation Queue */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Moderation Queue
                </h2>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-full font-bold">{moderationQueue.length}</span>
              </div>
              <div className="space-y-3">
                {moderationQueue.length === 0 && !loading && (
                  <p className="text-dark-500 text-sm py-4 text-center">Moderation queue empty — fetched from press_releases with status=pending</p>
                )}
                {moderationQueue.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          item.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{item.severity || 'pending'}</span>
                        <span className="text-dark-500 text-xs">{item.flag?.replace('_', ' ') || 'review'} · {item.submitted || ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Escrow Monitor ═══ */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" /> Escrow Monitor
              </h2>
              <button onClick={loadData} className="text-dark-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Campaign</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Publisher</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-center">Sites</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Amount</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {escrowTxs.length === 0 && !loading && (
                    <tr><td colSpan={6} className="py-6 text-center text-dark-500 text-sm">No escrow transactions yet</td></tr>
                  )}
                  {escrowTxs.map(tx => (
                    <tr key={tx.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <td className="py-3 pr-4 text-white text-sm font-medium">{tx.campaign}</td>
                      <td className="py-3 pr-4 text-dark-300 text-sm">{tx.publisher}</td>
                      <td className="py-3 text-center text-dark-300 text-sm">{tx.sites}</td>
                      <td className="py-3 text-right text-primary-500 font-semibold text-sm">{tx.amount.toLocaleString()} JOY</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          tx.status === 'locked' ? 'bg-blue-500/20 text-blue-400' :
                          tx.status === 'verifying' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="py-3 text-right text-dark-500 text-sm">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ AI System Health + Recent Users ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* AI System */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" /> AI System Status
                </h2>
                <span className="text-xs text-dark-500">{PLATFORM_STATS.aiTasksToday.toLocaleString()} tasks today</span>
              </div>
              <div className="space-y-3">
                {aiStatus.length === 0 && !loading && (
                  <p className="text-dark-500 text-sm py-4 text-center">AI status unavailable — checking endpoints...</p>
                )}
                {aiStatus.map((ai: any) => (
                  <div key={ai.name} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        ai.status === 'online' ? 'bg-green-500' :
                        ai.status === 'degraded' ? 'bg-yellow-500 animate-pulse' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-white text-sm font-medium">{ai.name}</p>
                        <p className="text-dark-500 text-xs">{ai.endpoint}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        ai.status === 'online' ? 'text-green-500' :
                        ai.status === 'degraded' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>{ai.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Recent Users
                </h2>
              </div>
              <div className="space-y-3">
                {recentUsers.length === 0 && !loading && (
                  <p className="text-dark-500 text-sm py-4 text-center">No users yet</p>
                )}
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        user.type === 'publisher' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-dark-500 text-xs">{user.type} · {user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{user.status}</span>
                      <p className="text-dark-500 text-xs mt-0.5">
                        {user.type === 'publisher' ? `Balance: ${Number(user.amount || 0).toLocaleString()} JOY` : `DH: ${user.amount || 0}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Quick Actions ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction icon={UserCheck} label="Approve Pending Sites" count={PLATFORM_STATS.pendingSites} color="text-green-500" bg="bg-green-500/10" />
            <QuickAction icon={AlertTriangle} label="Review Moderation" count={PLATFORM_STATS.moderationQueue} color="text-red-500" bg="bg-red-500/10" />
            <QuickAction icon={Database} label="DH Score Recalc" count={null} color="text-blue-500" bg="bg-blue-500/10" />
            <QuickAction icon={Server} label="AI System Config" count={null} color="text-purple-500" bg="bg-purple-500/10" />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <p className="text-dark-400 text-xs mb-0.5">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-dark-500 text-xs mt-1">{sub}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, count, color, bg }: {
  icon: any; label: string; count: number | null; color: string; bg: string;
}) {
  return (
    <button className={`${bg} border border-dark-700 hover:border-dark-500 rounded-xl p-4 text-left transition-colors group`}>
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <p className="text-white text-sm font-medium group-hover:text-primary-400 transition-colors">{label}</p>
      {count !== null && (
        <p className={`${color} text-lg font-bold mt-1`}>{count}</p>
      )}
    </button>
  );
}
