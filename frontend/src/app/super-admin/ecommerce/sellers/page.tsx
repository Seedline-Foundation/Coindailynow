'use client';

import { useState } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Ban,
  ShieldCheck,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  MessageSquare,
  MoreVertical,
  Download,
  RefreshCw,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Flag,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
interface Seller {
  id: string;
  name: string;
  email: string;
  avatar: string;
  country: string;
  countryFlag: string;
  storeName: string;
  status: 'active' | 'pending' | 'suspended' | 'banned';
  verified: boolean;
  joinedAt: string;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  platformFees: number;
  avgRating: number;
  totalReviews: number;
  lastActive: string;
  payoutBalance: number;
  boostSpend: number;
  disputes: number;
  fulfillmentRate: number;
  responseTime: string; // e.g. "< 2 hours"
}

// ─── Mock Data ──────────────────────────────────────────
const mockSellers: Seller[] = [
  {
    id: 'S001',
    name: 'Chinedu Okafor',
    email: 'chinedu@cryptoexpert.ng',
    avatar: 'CO',
    country: 'Nigeria',
    countryFlag: '🇳🇬',
    storeName: 'CryptoExpert_NG',
    status: 'active',
    verified: true,
    joinedAt: '2025-06-15',
    totalProducts: 8,
    activeProducts: 6,
    totalOrders: 347,
    totalRevenue: 28450,
    platformFees: 2845,
    avgRating: 4.8,
    totalReviews: 214,
    lastActive: '2 hours ago',
    payoutBalance: 1240,
    boostSpend: 450,
    disputes: 1,
    fulfillmentRate: 98.2,
    responseTime: '< 2 hours',
  },
  {
    id: 'S002',
    name: 'Amina Abdi',
    email: 'amina@fintax.ke',
    avatar: 'AA',
    country: 'Kenya',
    countryFlag: '🇰🇪',
    storeName: 'FinTax_Africa',
    status: 'active',
    verified: true,
    joinedAt: '2025-08-03',
    totalProducts: 4,
    activeProducts: 3,
    totalOrders: 89,
    totalRevenue: 6230,
    platformFees: 623,
    avgRating: 4.6,
    totalReviews: 67,
    lastActive: '5 hours ago',
    payoutBalance: 380,
    boostSpend: 150,
    disputes: 0,
    fulfillmentRate: 100,
    responseTime: '< 4 hours',
  },
  {
    id: 'S003',
    name: 'Kofi Mensah',
    email: 'kofi@templatehub.gh',
    avatar: 'KM',
    country: 'Ghana',
    countryFlag: '🇬🇭',
    storeName: 'TemplateHub_KE',
    status: 'active',
    verified: false,
    joinedAt: '2025-09-20',
    totalProducts: 6,
    activeProducts: 5,
    totalOrders: 52,
    totalRevenue: 2340,
    platformFees: 234,
    avgRating: 4.4,
    totalReviews: 38,
    lastActive: '1 day ago',
    payoutBalance: 210,
    boostSpend: 200,
    disputes: 0,
    fulfillmentRate: 96.1,
    responseTime: '< 6 hours',
  },
  {
    id: 'S004',
    name: 'Thandi Nkosi',
    email: 'thandi@blockcourse.za',
    avatar: 'TN',
    country: 'South Africa',
    countryFlag: '🇿🇦',
    storeName: 'BlockCourse_ZA',
    status: 'pending',
    verified: false,
    joinedAt: '2025-12-01',
    totalProducts: 2,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    platformFees: 0,
    avgRating: 0,
    totalReviews: 0,
    lastActive: '12 hours ago',
    payoutBalance: 0,
    boostSpend: 0,
    disputes: 0,
    fulfillmentRate: 0,
    responseTime: 'N/A',
  },
  {
    id: 'S005',
    name: 'Emeka Eze',
    email: 'emeka@scamcourse.ng',
    avatar: 'EE',
    country: 'Nigeria',
    countryFlag: '🇳🇬',
    storeName: 'Quick_Crypto_NG',
    status: 'suspended',
    verified: false,
    joinedAt: '2025-10-10',
    totalProducts: 3,
    activeProducts: 0,
    totalOrders: 14,
    totalRevenue: 420,
    platformFees: 42,
    avgRating: 2.1,
    totalReviews: 9,
    lastActive: '2 weeks ago',
    payoutBalance: 84,
    boostSpend: 50,
    disputes: 4,
    fulfillmentRate: 57.1,
    responseTime: '> 48 hours',
  },
  {
    id: 'S006',
    name: 'Fatou Diallo',
    email: 'fatou@tradeguide.sn',
    avatar: 'FD',
    country: 'Senegal',
    countryFlag: '🇸🇳',
    storeName: 'TradeGuide_SN',
    status: 'active',
    verified: true,
    joinedAt: '2025-07-22',
    totalProducts: 5,
    activeProducts: 4,
    totalOrders: 123,
    totalRevenue: 9870,
    platformFees: 987,
    avgRating: 4.7,
    totalReviews: 91,
    lastActive: '3 hours ago',
    payoutBalance: 620,
    boostSpend: 300,
    disputes: 0,
    fulfillmentRate: 99.2,
    responseTime: '< 1 hour',
  },
  {
    id: 'S007',
    name: 'Tendai Moyo',
    email: 'tendai@defi.zw',
    avatar: 'TM',
    country: 'Zimbabwe',
    countryFlag: '🇿🇼',
    storeName: 'DeFi_Academy_ZW',
    status: 'banned',
    verified: false,
    joinedAt: '2025-08-15',
    totalProducts: 1,
    activeProducts: 0,
    totalOrders: 7,
    totalRevenue: 140,
    platformFees: 14,
    avgRating: 1.3,
    totalReviews: 5,
    lastActive: '1 month ago',
    payoutBalance: 0,
    boostSpend: 0,
    disputes: 6,
    fulfillmentRate: 28.6,
    responseTime: 'No response',
  },
  {
    id: 'S008',
    name: 'Kwame Appiah',
    email: 'kwame@africrypto.gh',
    avatar: 'KA',
    country: 'Ghana',
    countryFlag: '🇬🇭',
    storeName: 'AfriCrypto_GH',
    status: 'pending',
    verified: false,
    joinedAt: '2025-12-10',
    totalProducts: 1,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    platformFees: 0,
    avgRating: 0,
    totalReviews: 0,
    lastActive: '6 hours ago',
    payoutBalance: 0,
    boostSpend: 0,
    disputes: 0,
    fulfillmentRate: 0,
    responseTime: 'N/A',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  pending: { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock },
  suspended: { label: 'Suspended', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertTriangle },
  banned: { label: 'Banned', color: 'text-red-400', bg: 'bg-red-500/10', icon: Ban },
};

// ─── Component ──────────────────────────────────────────
export default function SellerManagementPage() {
  const { user: admin } = useSuperAdmin();
  const [sellers, setSellers] = useState(mockSellers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'verification' | 'disputes'>('overview');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // ── Computed stats ──
  const totalSellers = sellers.length;
  const activeSellers = sellers.filter(s => s.status === 'active').length;
  const pendingSellers = sellers.filter(s => s.status === 'pending').length;
  const totalRevenue = sellers.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalFees = sellers.reduce((sum, s) => sum + s.platformFees, 0);
  const totalProducts = sellers.reduce((sum, s) => sum + s.totalProducts, 0);
  const totalOrders = sellers.reduce((sum, s) => sum + s.totalOrders, 0);
  const totalDisputes = sellers.reduce((sum, s) => sum + s.disputes, 0);
  const avgFulfillment = sellers.filter(s => s.totalOrders > 0).reduce((sum, s) => sum + s.fulfillmentRate, 0) / (sellers.filter(s => s.totalOrders > 0).length || 1);

  // ── Filtered sellers ──
  const filteredSellers = sellers.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) && !s.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // ── Actions ──
  const handleAction = (sellerId: string, action: 'approve' | 'suspend' | 'unsuspend' | 'ban' | 'verify') => {
    setSellers(prev => prev.map(s => {
      if (s.id !== sellerId) return s;
      switch (action) {
        case 'approve': return { ...s, status: 'active' as const };
        case 'suspend': return { ...s, status: 'suspended' as const };
        case 'unsuspend': return { ...s, status: 'active' as const };
        case 'ban': return { ...s, status: 'banned' as const, activeProducts: 0 };
        case 'verify': return { ...s, verified: true };
        default: return s;
      }
    }));
    setShowActionMenu(null);
  };

  const openDetail = (seller: Seller) => {
    setSelectedSeller(seller);
    setShowDetailModal(true);
  };

  // ── KPI cards for overview ──
  const kpis = [
    { label: 'Total Sellers', value: totalSellers, icon: Users, color: 'from-blue-500 to-blue-600', change: '+3 this month', up: true },
    { label: 'Active Sellers', value: activeSellers, icon: CheckCircle, color: 'from-green-500 to-green-600', change: `${((activeSellers / totalSellers) * 100).toFixed(0)}% of total`, up: true },
    { label: 'Pending Approval', value: pendingSellers, icon: Clock, color: 'from-yellow-500 to-yellow-600', change: 'Needs review', up: false },
    { label: 'Total GMV', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-orange-500 to-orange-600', change: '+12% vs last month', up: true },
    { label: 'Platform Fees', value: `$${totalFees.toLocaleString()}`, icon: TrendingUp, color: 'from-purple-500 to-purple-600', change: '10% commission', up: true },
    { label: 'Total Products', value: totalProducts, icon: Package, color: 'from-cyan-500 to-cyan-600', change: 'Across all sellers', up: true },
    { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'from-pink-500 to-pink-600', change: '+8% this week', up: true },
    { label: 'Open Disputes', value: totalDisputes, icon: AlertTriangle, color: totalDisputes > 5 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600', change: totalDisputes > 5 ? 'Needs attention' : 'Under control', up: totalDisputes <= 5 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sellers', label: `All Sellers (${totalSellers})` },
    { id: 'verification', label: `Pending (${pendingSellers})` },
    { id: 'disputes', label: `Disputes (${totalDisputes})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-7 h-7 text-orange-500" />
            Seller Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage marketplace sellers, verify stores, and resolve disputes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {kpi.up ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{kpi.change}</p>
                </div>
              );
            })}
          </div>

          {/* Top Sellers + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Sellers */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Top Sellers by Revenue</h3>
              <div className="space-y-3">
                {sellers
                  .filter(s => s.status === 'active')
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 5)
                  .map((seller, idx) => (
                    <div key={seller.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-lg font-bold text-gray-500 w-6">#{idx + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                        {seller.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white truncate">{seller.storeName}</span>
                          {seller.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{seller.countryFlag} {seller.country}</span>
                          <span>•</span>
                          <span>★ {seller.avgRating}</span>
                          <span>•</span>
                          <span>{seller.totalOrders} orders</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">${seller.totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Fee: ${seller.platformFees.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Marketplace Health */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Marketplace Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-300">Avg. Fulfillment Rate</span>
                  </div>
                  <span className="text-sm font-bold text-white">{avgFulfillment.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-300">Avg. Seller Rating</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {(sellers.filter(s => s.avgRating > 0).reduce((sum, s) => sum + s.avgRating, 0) / (sellers.filter(s => s.avgRating > 0).length || 1)).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-gray-300">Total Boost Revenue</span>
                  </div>
                  <span className="text-sm font-bold text-white">${sellers.reduce((s, sel) => s + sel.boostSpend, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-300">Pending Payouts</span>
                  </div>
                  <span className="text-sm font-bold text-white">${sellers.reduce((s, sel) => s + sel.payoutBalance, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-300">Dispute Rate</span>
                  </div>
                  <span className={`text-sm font-bold ${totalDisputes / (totalOrders || 1) * 100 > 5 ? 'text-red-400' : 'text-green-400'}`}>
                    {((totalDisputes / (totalOrders || 1)) * 100).toFixed(2)}%
                  </span>
                </div>

                {/* Status breakdown */}
                <div className="pt-3 border-t border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Seller Status Breakdown</p>
                  <div className="flex gap-2">
                    {Object.entries(statusConfig).map(([key, cfg]) => {
                      const count = sellers.filter(s => s.status === key).length;
                      const StatusIcon = cfg.icon;
                      return (
                        <div key={key} className={`flex-1 p-2 rounded-lg ${cfg.bg} text-center`}>
                          <StatusIcon className={`w-4 h-4 ${cfg.color} mx-auto mb-1`} />
                          <p className="text-lg font-bold text-white">{count}</p>
                          <p className="text-[10px] text-gray-400">{cfg.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SELLERS TAB ─── */}
      {(activeTab === 'sellers' || activeTab === 'verification') && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sellers by name, store, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {activeTab === 'sellers' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            )}
          </div>

          {/* Sellers Table */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">Seller</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-center">Products</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-center">Orders</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Revenue</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Fees</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-center">Rating</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-center">Fulfill</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'verification' ? sellers.filter(s => s.status === 'pending') : filteredSellers).map((seller) => {
                    const st = statusConfig[seller.status];
                    const StatusIcon = st.icon;
                    return (
                      <tr key={seller.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {seller.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white">{seller.storeName}</span>
                                {seller.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                              </div>
                              <div className="text-xs text-gray-400">
                                {seller.countryFlag} {seller.name} · Joined {new Date(seller.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                            <StatusIcon className="w-3 h-3" /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{seller.activeProducts}/{seller.totalProducts}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{seller.totalOrders}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-400">${seller.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-400">${seller.platformFees.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {seller.avgRating > 0 ? (
                            <span className={`text-sm font-semibold ${seller.avgRating >= 4 ? 'text-green-400' : seller.avgRating >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                              ★ {seller.avgRating}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {seller.totalOrders > 0 ? (
                            <span className={`text-sm font-semibold ${seller.fulfillmentRate >= 90 ? 'text-green-400' : seller.fulfillmentRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {seller.fulfillmentRate}%
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 relative">
                            <button onClick={() => openDetail(seller)} className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === seller.id ? null : seller.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {showActionMenu === seller.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10 py-1">
                                {seller.status === 'pending' && (
                                  <button onClick={() => handleAction(seller.id, 'approve')} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-600 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Approve Seller
                                  </button>
                                )}
                                {!seller.verified && seller.status === 'active' && (
                                  <button onClick={() => handleAction(seller.id, 'verify')} className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-600 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Verify Seller
                                  </button>
                                )}
                                {seller.status === 'active' && (
                                  <button onClick={() => handleAction(seller.id, 'suspend')} className="w-full text-left px-4 py-2 text-sm text-orange-400 hover:bg-gray-600 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Suspend
                                  </button>
                                )}
                                {seller.status === 'suspended' && (
                                  <button onClick={() => handleAction(seller.id, 'unsuspend')} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-600 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Unsuspend
                                  </button>
                                )}
                                {seller.status !== 'banned' && (
                                  <button onClick={() => handleAction(seller.id, 'ban')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2">
                                    <Ban className="w-4 h-4" /> Ban Seller
                                  </button>
                                )}
                                <button onClick={() => { openDetail(seller); setShowActionMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center gap-2">
                                  <Eye className="w-4 h-4" /> View Details
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredSellers.length === 0 && (
              <div className="text-center py-12 text-gray-500">No sellers match your criteria.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── DISPUTES TAB ─── */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300">Dispute Resolution Center</p>
              <p className="text-xs text-yellow-200/70 mt-1">Review and resolve disputes between buyers and sellers. Sellers with high dispute rates may be automatically flagged for suspension.</p>
            </div>
          </div>

          {/* Sellers with disputes */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-bold text-white">Sellers with Open Disputes</h3>
            </div>
            <div className="divide-y divide-gray-700/50">
              {sellers.filter(s => s.disputes > 0).sort((a, b) => b.disputes - a.disputes).map((seller) => {
                const st = statusConfig[seller.status];
                const StatusIcon = st.icon;
                const disputeRate = ((seller.disputes / (seller.totalOrders || 1)) * 100).toFixed(1);
                return (
                  <div key={seller.id} className="p-4 flex items-center gap-4 hover:bg-gray-700/30">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                      {seller.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{seller.storeName}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg} ${st.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" /> {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{seller.countryFlag} {seller.name} · {seller.email}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-2xl font-bold text-red-400">{seller.disputes}</p>
                      <p className="text-[10px] text-gray-500">Disputes</p>
                    </div>
                    <div className="text-center px-4">
                      <p className={`text-sm font-bold ${parseFloat(disputeRate) > 10 ? 'text-red-400' : 'text-yellow-400'}`}>{disputeRate}%</p>
                      <p className="text-[10px] text-gray-500">Dispute Rate</p>
                    </div>
                    <div className="text-center px-4">
                      <p className={`text-sm font-bold ${seller.fulfillmentRate >= 90 ? 'text-green-400' : seller.fulfillmentRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{seller.fulfillmentRate}%</p>
                      <p className="text-[10px] text-gray-500">Fulfillment</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {seller.status === 'active' && (
                        <button onClick={() => handleAction(seller.id, 'suspend')} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-500/20">
                          Suspend
                        </button>
                      )}
                      <button onClick={() => openDetail(seller)} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600">
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
              {sellers.filter(s => s.disputes > 0).length === 0 && (
                <div className="text-center py-12 text-gray-500">No disputes currently open. 🎉</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL MODAL ─── */}
      {showDetailModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-700" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold">
                  {selectedSeller.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedSeller.storeName}</h2>
                    {selectedSeller.verified && <ShieldCheck className="w-5 h-5 text-blue-400" />}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedSeller.status].bg} ${statusConfig[selectedSeller.status].color}`}>
                      {statusConfig[selectedSeller.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{selectedSeller.countryFlag} {selectedSeller.name} · {selectedSeller.email}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(selectedSeller.joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Last active {selectedSeller.lastActive}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">${selectedSeller.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Total Revenue</p>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{selectedSeller.totalOrders}</p>
                <p className="text-xs text-gray-400">Total Orders</p>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">${selectedSeller.platformFees.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Platform Fees</p>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className="text-2xl font-bold text-white">{selectedSeller.activeProducts}/{selectedSeller.totalProducts}</p>
                <p className="text-xs text-gray-400">Active/Total Products</p>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className={`text-2xl font-bold ${selectedSeller.avgRating >= 4 ? 'text-green-400' : selectedSeller.avgRating >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {selectedSeller.avgRating > 0 ? `★ ${selectedSeller.avgRating}` : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">{selectedSeller.totalReviews} Reviews</p>
              </div>
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <p className={`text-2xl font-bold ${selectedSeller.fulfillmentRate >= 90 ? 'text-green-400' : selectedSeller.fulfillmentRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {selectedSeller.totalOrders > 0 ? `${selectedSeller.fulfillmentRate}%` : 'N/A'}
                </p>
                <p className="text-xs text-gray-400">Fulfillment Rate</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="px-6 pb-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Response Time</span>
                <span className="text-sm font-medium text-white">{selectedSeller.responseTime}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Pending Payout Balance</span>
                <span className="text-sm font-bold text-green-400">${selectedSeller.payoutBalance.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Boost Ad Spend</span>
                <span className="text-sm font-medium text-orange-400">${selectedSeller.boostSpend.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <span className="text-sm text-gray-400">Open Disputes</span>
                <span className={`text-sm font-bold ${selectedSeller.disputes > 0 ? 'text-red-400' : 'text-green-400'}`}>{selectedSeller.disputes}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-700 flex flex-wrap gap-2">
              {selectedSeller.status === 'pending' && (
                <button onClick={() => { handleAction(selectedSeller.id, 'approve'); setShowDetailModal(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  ✓ Approve Seller
                </button>
              )}
              {!selectedSeller.verified && selectedSeller.status === 'active' && (
                <button onClick={() => { handleAction(selectedSeller.id, 'verify'); setSelectedSeller({ ...selectedSeller, verified: true }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <ShieldCheck className="w-4 h-4 inline mr-1" /> Verify
                </button>
              )}
              {selectedSeller.status === 'active' && (
                <button onClick={() => { handleAction(selectedSeller.id, 'suspend'); setShowDetailModal(false); }} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                  Suspend
                </button>
              )}
              {selectedSeller.status === 'suspended' && (
                <button onClick={() => { handleAction(selectedSeller.id, 'unsuspend'); setShowDetailModal(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  Unsuspend
                </button>
              )}
              {selectedSeller.status !== 'banned' && (
                <button onClick={() => { handleAction(selectedSeller.id, 'ban'); setShowDetailModal(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                  Ban
                </button>
              )}
              <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> Message Seller
              </button>
              <button onClick={() => setShowDetailModal(false)} className="ml-auto px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}