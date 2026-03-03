'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Star,
  Plus,
  BarChart3,
  ArrowUpRight,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  MessageSquare,
  Rocket,
  Gift,
  Calendar,
  Target,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

interface SellerStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  activeListings: number;
  totalViews: number;
  viewsChange: number;
  conversionRate: number;
  conversionChange: number;
  avgRating: number;
  totalReviews: number;
  followers: number;
  followersChange: number;
  pendingPayouts: number;
  nextPayoutDate: string;
  boostedProducts: number;
  boostBudgetRemaining: number;
  unreadMessages: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  product: string;
  buyer: string;
  buyerAvatar: string;
  amount: number;
  status: 'completed' | 'processing' | 'pending' | 'refunded';
  date: string;
  paymentMethod: 'joy_token' | 'wallet';
}

interface TopProduct {
  id: string;
  name: string;
  type: 'course' | 'ebook' | 'template' | 'tool' | 'report';
  sales: number;
  revenue: number;
  views: number;
  rating: number;
  isBoosted: boolean;
}

interface SellerNotification {
  id: string;
  type: 'sale' | 'review' | 'message' | 'payout' | 'boost' | 'follower';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockStats: SellerStats = {
  totalRevenue: 12450,
  revenueChange: 18.5,
  totalOrders: 347,
  ordersChange: 12.3,
  totalProducts: 14,
  activeListings: 11,
  totalViews: 28340,
  viewsChange: 22.7,
  conversionRate: 3.8,
  conversionChange: 0.4,
  avgRating: 4.7,
  totalReviews: 189,
  followers: 1240,
  followersChange: 8.2,
  pendingPayouts: 2180,
  nextPayoutDate: '2026-03-31',
  boostedProducts: 3,
  boostBudgetRemaining: 450,
  unreadMessages: 7,
  pendingOrders: 4,
};

const mockRecentOrders: RecentOrder[] = [
  { id: 'ORD-4871', product: 'DeFi Masterclass for Africa', buyer: 'Amara K.', buyerAvatar: 'AK', amount: 79, status: 'completed', date: '2026-03-02T10:30:00', paymentMethod: 'joy_token' },
  { id: 'ORD-4870', product: 'Crypto Tax Calculator NG', buyer: 'Emeka O.', buyerAvatar: 'EO', amount: 9.99, status: 'completed', date: '2026-03-02T08:15:00', paymentMethod: 'wallet' },
  { id: 'ORD-4869', product: 'P2P Trading Blueprint', buyer: 'Fatima B.', buyerAvatar: 'FB', amount: 24.99, status: 'processing', date: '2026-03-01T22:45:00', paymentMethod: 'joy_token' },
  { id: 'ORD-4868', product: 'Nigeria Market Report Q1', buyer: 'Samuel T.', buyerAvatar: 'ST', amount: 49.99, status: 'completed', date: '2026-03-01T16:20:00', paymentMethod: 'wallet' },
  { id: 'ORD-4867', product: 'DeFi Masterclass for Africa', buyer: 'Grace M.', buyerAvatar: 'GM', amount: 79, status: 'pending', date: '2026-03-01T14:10:00', paymentMethod: 'joy_token' },
  { id: 'ORD-4866', product: 'Portfolio Tracker Template', buyer: 'David N.', buyerAvatar: 'DN', amount: 7.99, status: 'completed', date: '2026-03-01T09:00:00', paymentMethod: 'wallet' },
];

const mockTopProducts: TopProduct[] = [
  { id: 'p1', name: 'DeFi Masterclass for Africa', type: 'course', sales: 124, revenue: 9796, views: 8420, rating: 4.9, isBoosted: true },
  { id: 'p2', name: 'Nigeria Market Report Q1 2026', type: 'report', sales: 89, revenue: 4449, views: 5210, rating: 4.8, isBoosted: false },
  { id: 'p3', name: 'P2P Trading Blueprint', type: 'ebook', sales: 67, revenue: 1674, views: 3890, rating: 4.6, isBoosted: true },
  { id: 'p4', name: 'Crypto Tax Calculator NG', type: 'tool', sales: 52, revenue: 519, views: 2340, rating: 4.5, isBoosted: false },
  { id: 'p5', name: 'Portfolio Tracker Template', type: 'template', sales: 41, revenue: 327, views: 1780, rating: 4.7, isBoosted: true },
];

const mockNotifications: SellerNotification[] = [
  { id: 'n1', type: 'sale', title: 'New Sale!', description: 'Amara K. purchased DeFi Masterclass for 79 JOY', time: '2 hours ago', read: false },
  { id: 'n2', type: 'review', title: '5-Star Review', description: 'Emeka O. rated Crypto Tax Calculator ★★★★★', time: '4 hours ago', read: false },
  { id: 'n3', type: 'message', title: 'New Message', description: 'Fatima B. asked about P2P Trading Blueprint', time: '6 hours ago', read: false },
  { id: 'n4', type: 'boost', title: 'Boost Active', description: 'DeFi Masterclass is being promoted — 840 impressions today', time: '8 hours ago', read: true },
  { id: 'n5', type: 'payout', title: 'Payout Scheduled', description: '$2,180 will be sent to your wallet on Mar 31', time: '1 day ago', read: true },
  { id: 'n6', type: 'follower', title: 'New Follower', description: 'Grace M. started following your store', time: '1 day ago', read: true },
];

// ===========================================================================
// HELPERS
// ===========================================================================

const formatCurrency = (n: number) => {
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-green-500/10', text: 'text-green-400' },
  processing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  refunded: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

const productTypeIcons: Record<string, string> = {
  course: '🎓', ebook: '📚', template: '📋', tool: '🔧', report: '📊',
};

const notifIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  sale: { icon: <DollarSign className="w-4 h-4" />, color: 'text-green-400 bg-green-500/10' },
  review: { icon: <Star className="w-4 h-4" />, color: 'text-yellow-400 bg-yellow-500/10' },
  message: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10' },
  payout: { icon: <Wallet className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10' },
  boost: { icon: <Rocket className="w-4 h-4" />, color: 'text-orange-400 bg-orange-500/10' },
  follower: { icon: <Users className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-500/10' },
};

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function SellerDashboardPage() {
  const [stats] = useState<SellerStats>(mockStats);
  const [recentOrders] = useState<RecentOrder[]>(mockRecentOrders);
  const [topProducts] = useState<TopProduct[]>(mockTopProducts);
  const [notifications] = useState<SellerNotification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Store className="w-7 h-7 text-primary-500" />
            My Marketplace
          </h1>
          <p className="text-dark-400 mt-1">Manage your digital products, track sales, and grow your store</p>
        </div>
        <div className="flex gap-3">
          <Link href="/user/marketplace/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" /> New Product
          </Link>
          <Link href="/user/marketplace/boost"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors">
            <Rocket className="w-4 h-4" /> Boost
          </Link>
        </div>
      </div>

      {/* Quick Actions Banner */}
      {(stats.pendingOrders > 0 || stats.unreadMessages > 0) && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 flex flex-wrap items-center gap-4">
          {stats.pendingOrders > 0 && (
            <Link href="/user/marketplace/orders" className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300">
              <AlertCircle className="w-4 h-4" />
              <span><strong>{stats.pendingOrders}</strong> orders need attention</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {stats.unreadMessages > 0 && (
            <Link href="/user/marketplace/messages" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <MessageSquare className="w-4 h-4" />
              <span><strong>{stats.unreadMessages}</strong> unread messages</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: stats.revenueChange, icon: <DollarSign className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'Total Orders', value: stats.totalOrders.toString(), change: stats.ordersChange, icon: <ShoppingCart className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'Store Views', value: stats.totalViews.toLocaleString(), change: stats.viewsChange, icon: <Eye className="w-5 h-5" />, color: 'text-purple-400' },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, change: stats.conversionChange, icon: <Target className="w-5 h-5" />, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={s.color}>{s.icon}</span>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {s.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change >= 0 ? '+' : ''}{s.change}%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-dark-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Products', value: `${stats.activeListings}/${stats.totalProducts}`, sub: 'active', icon: <Package className="w-4 h-4 text-blue-400" /> },
          { label: 'Avg Rating', value: `${stats.avgRating}★`, sub: `${stats.totalReviews} reviews`, icon: <Star className="w-4 h-4 text-yellow-400" /> },
          { label: 'Followers', value: stats.followers.toLocaleString(), sub: `+${stats.followersChange}%`, icon: <Users className="w-4 h-4 text-cyan-400" /> },
          { label: 'Pending Payout', value: formatCurrency(stats.pendingPayouts), sub: `Due ${new Date(stats.nextPayoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, icon: <Wallet className="w-4 h-4 text-purple-400" /> },
          { label: 'Boost Budget', value: formatCurrency(stats.boostBudgetRemaining), sub: `${stats.boostedProducts} active`, icon: <Rocket className="w-4 h-4 text-orange-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-dark-900 border border-dark-700 rounded-xl p-3 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-sm font-bold text-white">{s.value}</p>
              <p className="text-xs text-dark-400">{s.label} · {s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - 2 columns */}
        <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-500" /> Recent Orders
            </h2>
            <Link href="/user/marketplace/orders" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-dark-700">
            {recentOrders.map(order => (
              <div key={order.id} className="p-4 flex items-center gap-3 hover:bg-dark-800/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                  {order.buyerAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{order.product}</p>
                  <p className="text-xs text-dark-400">{order.buyer} · {order.id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">{order.paymentMethod === 'joy_token' ? `${order.amount} JOY` : `$${order.amount}`}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications - 1 column */}
        <div className="bg-dark-900 border border-dark-700 rounded-xl">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              Activity
              {unreadCount > 0 && <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>}
            </h2>
          </div>
          <div className="divide-y divide-dark-700 max-h-[420px] overflow-y-auto">
            {notifications.map(n => {
              const ni = notifIcons[n.type];
              return (
                <div key={n.id} className={`p-3 flex items-start gap-3 ${!n.read ? 'bg-primary-500/5' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ni.color}`}>
                    {ni.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-dark-400 truncate">{n.description}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" /> Top Products
          </h2>
          <Link href="/user/marketplace/products" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            All Products <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Sales</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Rating</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {topProducts.map((p, i) => (
                <tr key={p.id} className="hover:bg-dark-800/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <span className="text-lg">{productTypeIcons[p.type]}</span>
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-dark-400 capitalize">{p.type}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">{p.sales}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(p.revenue)}</td>
                  <td className="px-4 py-3 text-right text-dark-300">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-yellow-400">{p.rating}★</td>
                  <td className="px-4 py-3 text-center">
                    {p.isBoosted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full">
                        <Rocket className="w-3 h-3" /> Boosted
                      </span>
                    ) : (
                      <span className="text-xs text-dark-400">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Products', desc: 'Manage & edit listings', href: '/user/marketplace/products', icon: <Package className="w-6 h-6" />, color: 'from-blue-600 to-blue-800' },
          { label: 'Orders', desc: 'Track & fulfill orders', href: '/user/marketplace/orders', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-green-600 to-green-800' },
          { label: 'Messages', desc: 'Chat with buyers', href: '/user/marketplace/messages', icon: <MessageSquare className="w-6 h-6" />, color: 'from-purple-600 to-purple-800' },
          { label: 'Payouts', desc: 'Earnings & withdrawals', href: '/user/marketplace/payouts', icon: <Wallet className="w-6 h-6" />, color: 'from-orange-600 to-orange-800' },
        ].map(card => (
          <Link key={card.label} href={card.href} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 hover:scale-[1.02] transition-transform`}>
            <div className="text-white/80 mb-3">{card.icon}</div>
            <p className="font-bold text-white text-sm">{card.label}</p>
            <p className="text-white/60 text-xs mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
