/**
 * User Dashboard Home Page
 * Main dashboard view for authenticated users
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Star, 
  BookOpen, 
  Bell,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

// Import existing user components
import UserDashboard from '@/components/user/UserDashboard';
import PersonalizedFeed from '@/components/user/PersonalizedFeed';

export default function UserHomePage() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Welcome back!</h1>
          <p className="text-dark-400 mt-1">Here's what's happening with your crypto today.</p>
        </div>
        <Link
          href="/user/wallet"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
        >
          <Wallet className="w-4 h-4" />
          View Wallet
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value="$12,450.00"
          change="+5.2%"
          trend="up"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="24h P&L"
          value="+$620.50"
          change="+5.2%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Saved Articles"
          value="24"
          change="+3 this week"
          trend="neutral"
          icon={<Star className="w-5 h-5" />}
        />
        <StatCard
          title="Unread Updates"
          value="8"
          change="From watchlist"
          trend="neutral"
          icon={<Bell className="w-5 h-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personalized Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Your Feed</h2>
              <Link
                href="/user/feed"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <PersonalizedFeed />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Watchlist */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Watchlist</h3>
              <Link href="/user/portfolio" className="text-sm text-primary-500 hover:text-primary-400">
                Edit
              </Link>
            </div>
            <div className="space-y-3">
              <WatchlistItem symbol="BTC" name="Bitcoin" price="$43,250" change="+2.98%" trend="up" />
              <WatchlistItem symbol="ETH" name="Ethereum" price="$2,650" change="-1.20%" trend="down" />
              <WatchlistItem symbol="PEPE" name="Pepe" price="$0.00000125" change="+7.48%" trend="up" />
              <WatchlistItem symbol="SHIB" name="Shiba Inu" price="$0.000024" change="+5.26%" trend="up" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <ActivityItem
                icon={<BookOpen className="w-4 h-4" />}
                title="Read: Bitcoin Hits New ATH"
                time="2 hours ago"
              />
              <ActivityItem
                icon={<Star className="w-4 h-4" />}
                title="Saved: M-Pesa Crypto Integration"
                time="5 hours ago"
              />
              <ActivityItem
                icon={<Wallet className="w-4 h-4" />}
                title="Wallet: Received 0.05 ETH"
                time="1 day ago"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <QuickLink href="/news" label="Latest News" />
              <QuickLink href="/user/settings" label="Account Settings" />
              <QuickLink href="https://token.coindaily.online" label="JY Token" external />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-dark-400 text-sm">{title}</span>
        <div className="text-primary-500">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className={`text-sm mt-1 ${
        trend === 'up' ? 'text-green-500' : 
        trend === 'down' ? 'text-red-500' : 
        'text-dark-400'
      }`}>
        {change}
      </p>
    </div>
  );
}

// Watchlist Item Component
function WatchlistItem({ 
  symbol, 
  name, 
  price, 
  change, 
  trend 
}: { 
  symbol: string; 
  name: string; 
  price: string; 
  change: string; 
  trend: 'up' | 'down';
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center">
          <span className="text-xs font-bold text-primary-500">{symbol.slice(0, 2)}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{symbol}</p>
          <p className="text-xs text-dark-400">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-white">{price}</p>
        <p className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </p>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ 
  icon, 
  title, 
  time 
}: { 
  icon: React.ReactNode; 
  title: string; 
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-dark-800 text-dark-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
        <p className="text-xs text-dark-500">{time}</p>
      </div>
    </div>
  );
}

// Quick Link Component
function QuickLink({ 
  href, 
  label, 
  external 
}: { 
  href: string; 
  label: string; 
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800 transition-colors group"
    >
      <span className="text-sm text-dark-300 group-hover:text-white">{label}</span>
      {external ? (
        <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-primary-500" />
      ) : (
        <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-primary-500" />
      )}
    </Link>
  );
}
