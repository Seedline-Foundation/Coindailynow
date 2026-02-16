'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Wallet,
  Bot,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  RefreshCw
} from 'lucide-react';
import { fetchPlatformStats, fetchAlerts, fetchAIHealth } from '@/lib/api';

/**
 * Staff Admin Portal - jet.coindaily.online/admin
 * 
 * Main dashboard for staff members. Shows:
 * - System overview
 * - Content management
 * - User management
 * - AI system status
 * - Quick actions
 */

const NAVIGATION_ITEMS = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    description: 'System overview'
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: Users,
    description: 'User management'
  },
  { 
    name: 'Content', 
    href: '/admin/content', 
    icon: FileText,
    description: 'Articles & news'
  },
  { 
    name: 'AI System', 
    href: '/admin/ai', 
    icon: Bot,
    description: 'AI agents & automation'
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3,
    description: 'Platform metrics'
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    description: 'System configuration'
  },
];

const CEO_ITEMS = [
  { 
    name: 'CEO Portal', 
    href: '/admin/CEO', 
    icon: Shield,
    description: 'Executive access',
    restricted: true
  },
  { 
    name: 'Funds Management', 
    href: '/admin/funds', 
    icon: Wallet,
    description: 'Treasury & payments',
    restricted: true
  },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, alertsData] = await Promise.all([
        fetchPlatformStats().catch(() => null),
        fetchAlerts().catch(() => []),
      ]);
      setStats(statsData);
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.alerts || []);
      
      // AI health check (may timeout)
      fetchAIHealth().then(setAiHealth).catch(() => null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    router.push('/');
  };

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
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-lg text-white">Admin</span>
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
          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3">
            Management
          </p>
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

          {/* CEO Section */}
          <div className="pt-4 mt-4 border-t border-dark-700">
            <p className="text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-3">
              Executive Only
            </p>
            {CEO_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-red-500/10 transition-colors group"
              >
                <item.icon className="w-5 h-5 text-red-500/50 group-hover:text-red-500" />
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-dark-600" />
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
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
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-dark-400 hover:text-white">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-dark-950">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-dark-400">
                Welcome back. Here&apos;s what&apos;s happening with CoinDaily today.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total Users" 
              value={loading ? '...' : (stats?.totalUsers?.toLocaleString() || '0')} 
              change={stats ? `${stats.totalUsers || 0} registered` : 'Loading...'} 
              positive 
            />
            <StatCard 
              title="Articles Published" 
              value={loading ? '...' : (stats?.publishedArticles?.toLocaleString() || stats?.totalArticles?.toLocaleString() || '0')} 
              change={stats ? `${stats.totalArticles || 0} total` : 'Loading...'} 
              positive 
            />
            <StatCard 
              title="AI Tasks" 
              value={loading ? '...' : (stats?.totalAITasks?.toLocaleString() || '0')} 
              change={stats ? `${stats.pendingAITasks || 0} pending` : 'Loading...'} 
              positive 
            />
            <StatCard 
              title="Active Agents" 
              value={loading ? '...' : (stats?.activeAgents?.toString() || '0')} 
              change="AI system"
              positive 
            />
          </div>

          {/* Quick Actions & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/content"><ActionButton icon={FileText} label="Manage Content" /></Link>
                <Link href="/admin/users"><ActionButton icon={Users} label="Manage Users" /></Link>
                <Link href="/admin/ai"><ActionButton icon={Bot} label="AI System" /></Link>
                <Link href="/admin/analytics"><ActionButton icon={BarChart3} label="Reports" /></Link>
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
              <div className="space-y-3">
                <StatusItem name="Backend API" status={stats ? 'operational' : 'down'} />
                <StatusItem name="AI Services" status={
                  aiHealth?.status === 'operational' ? 'operational' :
                  aiHealth?.status === 'degraded' ? 'degraded' : 
                  aiHealth ? 'degraded' : 'down'
                } />
                <StatusItem name="Database" status={stats ? 'operational' : 'down'} />
                <StatusItem name="CDN" status="operational" />
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-800 last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm text-dark-300 flex-1">{alert.message}</span>
                    <span className="text-xs text-dark-500">{alert.time || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive }: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
      <p className="text-dark-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-white mb-2">{value}</p>
      <p className={`text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>
        {change} from yesterday
      </p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex items-center gap-2 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors">
      <Icon className="w-5 h-5 text-primary-500" />
      <span className="text-sm text-white">{label}</span>
    </button>
  );
}

function StatusItem({ name, status }: { name: string; status: 'operational' | 'degraded' | 'down' }) {
  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-dark-300">{name}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-dark-400 capitalize">{status}</span>
      </div>
    </div>
  );
}
