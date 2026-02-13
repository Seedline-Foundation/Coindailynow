'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Megaphone, 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign
} from 'lucide-react';

/**
 * Operator Dashboard - press.coindaily.online/dashboard
 * 
 * Main dashboard for PR operators to:
 * - View campaign performance
 * - Create new campaigns
 * - Manage content
 * - Track analytics
 */

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Operators', href: '/operators', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function OperatorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <span className="font-display font-bold text-lg text-white">Press</span>
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

        {/* User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
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
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-dark-400 hover:text-white">
                <Bell className="w-6 h-6" />
              </button>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">O</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Operator Dashboard
              </h1>
              <p className="text-dark-400">
                Manage your PR campaigns and track performance.
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={FileText}
              title="Active Campaigns" 
              value="12" 
              change="+3 this week"
              color="text-blue-500"
            />
            <StatCard 
              icon={Eye}
              title="Total Impressions" 
              value="2.4M" 
              change="+18.5% vs last week"
              color="text-green-500"
            />
            <StatCard 
              icon={MousePointer}
              title="Click-Through Rate" 
              value="4.2%" 
              change="+0.8% vs avg"
              color="text-purple-500"
            />
            <StatCard 
              icon={DollarSign}
              title="Total Spent" 
              value="$12,450" 
              change="$2,100 this week"
              color="text-primary-500"
            />
          </div>

          {/* Recent Campaigns */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
              <Link href="/campaigns" className="text-primary-500 hover:text-primary-400 text-sm">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              <CampaignRow 
                name="Token Launch Announcement"
                status="active"
                impressions="450K"
                ctr="4.8%"
                spent="$2,500"
              />
              <CampaignRow 
                name="Partnership Press Release"
                status="active"
                impressions="320K"
                ctr="3.9%"
                spent="$1,800"
              />
              <CampaignRow 
                name="Product Update Article"
                status="completed"
                impressions="180K"
                ctr="3.2%"
                spent="$950"
              />
              <CampaignRow 
                name="Market Analysis Piece"
                status="pending"
                impressions="-"
                ctr="-"
                spent="$1,200"
              />
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Performance Overview</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-dark-600 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400">Performance chart will be displayed here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

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

function CampaignRow({ name, status, impressions, ctr, spent }: {
  name: string;
  status: 'active' | 'completed' | 'pending';
  impressions: string;
  ctr: string;
  spent: string;
}) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-500',
    completed: 'bg-blue-500/20 text-blue-500',
    pending: 'bg-yellow-500/20 text-yellow-500',
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
      <div className="flex-1">
        <p className="text-white font-medium">{name}</p>
        <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusColors[status]} mt-1`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-8 text-right">
        <div>
          <p className="text-dark-400 text-xs">Impressions</p>
          <p className="text-white font-medium">{impressions}</p>
        </div>
        <div>
          <p className="text-dark-400 text-xs">CTR</p>
          <p className="text-white font-medium">{ctr}</p>
        </div>
        <div>
          <p className="text-dark-400 text-xs">Spent</p>
          <p className="text-white font-medium">{spent}</p>
        </div>
      </div>
    </div>
  );
}
