'use client';

import { useState } from 'react';
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
  Search
} from 'lucide-react';

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
  const router = useRouter();

  const handleLogout = async () => {
    // Clear session and redirect to landing
    // In production, this would call the auth API
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
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-dark-400">
              Welcome back. Here's what's happening with CoinDaily today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total Users" 
              value="12,847" 
              change="+12.5%" 
              positive 
            />
            <StatCard 
              title="Articles Published" 
              value="1,234" 
              change="+8.2%" 
              positive 
            />
            <StatCard 
              title="AI Tasks Today" 
              value="456" 
              change="+24.1%" 
              positive 
            />
            <StatCard 
              title="Revenue (24h)" 
              value="$8,432" 
              change="-2.4%" 
              positive={false} 
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton icon={FileText} label="New Article" />
                <ActionButton icon={Users} label="Add User" />
                <ActionButton icon={Bot} label="AI Tasks" />
                <ActionButton icon={BarChart3} label="Reports" />
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
              <div className="space-y-3">
                <StatusItem name="Backend API" status="operational" />
                <StatusItem name="AI Services" status="operational" />
                <StatusItem name="Database" status="operational" />
                <StatusItem name="CDN" status="degraded" />
              </div>
            </div>
          </div>
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
