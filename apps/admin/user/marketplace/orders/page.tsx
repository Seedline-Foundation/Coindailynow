'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  MessageSquare,
  Download,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

type OrderStatus = 'pending' | 'processing' | 'completed' | 'refunded' | 'disputed';

interface SellerOrder {
  id: string;
  orderNumber: string;
  buyer: {
    name: string;
    email: string;
    avatar: string;
    country: string;
    countryFlag: string;
  };
  product: {
    name: string;
    type: string;
    price: number;
  };
  total: number;
  platformFee: number;
  sellerEarning: number;
  status: OrderStatus;
  paymentMethod: 'joy_token' | 'wallet' | 'mixed';
  createdAt: string;
  completedAt?: string;
  downloadCount: number;
  buyerMessage?: string;
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockOrders: SellerOrder[] = [
  {
    id: 'so1', orderNumber: 'ORD-4871', buyer: { name: 'Amara Konte', email: 'amara@example.com', avatar: 'AK', country: 'Senegal', countryFlag: '🇸🇳' },
    product: { name: 'DeFi Masterclass for Africa', type: 'course', price: 79 },
    total: 79, platformFee: 7.9, sellerEarning: 71.1, status: 'completed', paymentMethod: 'joy_token',
    createdAt: '2026-03-02T10:30:00', completedAt: '2026-03-02T10:30:00', downloadCount: 1,
  },
  {
    id: 'so2', orderNumber: 'ORD-4870', buyer: { name: 'Emeka Okafor', email: 'emeka@example.com', avatar: 'EO', country: 'Nigeria', countryFlag: '🇳🇬' },
    product: { name: 'Crypto Tax Calculator NG', type: 'tool', price: 9.99 },
    total: 9.99, platformFee: 1.0, sellerEarning: 8.99, status: 'completed', paymentMethod: 'wallet',
    createdAt: '2026-03-02T08:15:00', completedAt: '2026-03-02T08:15:00', downloadCount: 3,
  },
  {
    id: 'so3', orderNumber: 'ORD-4869', buyer: { name: 'Fatima Bello', email: 'fatima@example.com', avatar: 'FB', country: 'Nigeria', countryFlag: '🇳🇬' },
    product: { name: 'P2P Trading Blueprint', type: 'ebook', price: 24.99 },
    total: 24.99, platformFee: 2.5, sellerEarning: 22.49, status: 'processing', paymentMethod: 'joy_token',
    createdAt: '2026-03-01T22:45:00', downloadCount: 0, buyerMessage: 'Can I get the bonus chapter too?',
  },
  {
    id: 'so4', orderNumber: 'ORD-4868', buyer: { name: 'Samuel Tetteh', email: 'samuel@example.com', avatar: 'ST', country: 'Ghana', countryFlag: '🇬🇭' },
    product: { name: 'Nigeria Market Report Q1', type: 'report', price: 49.99 },
    total: 49.99, platformFee: 5.0, sellerEarning: 44.99, status: 'completed', paymentMethod: 'wallet',
    createdAt: '2026-03-01T16:20:00', completedAt: '2026-03-01T16:20:00', downloadCount: 2,
  },
  {
    id: 'so5', orderNumber: 'ORD-4867', buyer: { name: 'Grace Mwangi', email: 'grace@example.com', avatar: 'GM', country: 'Kenya', countryFlag: '🇰🇪' },
    product: { name: 'DeFi Masterclass for Africa', type: 'course', price: 79 },
    total: 79, platformFee: 7.9, sellerEarning: 71.1, status: 'pending', paymentMethod: 'joy_token',
    createdAt: '2026-03-01T14:10:00', downloadCount: 0,
  },
  {
    id: 'so6', orderNumber: 'ORD-4866', buyer: { name: 'David Nkosi', email: 'david@example.com', avatar: 'DN', country: 'South Africa', countryFlag: '🇿🇦' },
    product: { name: 'Portfolio Tracker Template', type: 'template', price: 7.99 },
    total: 7.99, platformFee: 0.8, sellerEarning: 7.19, status: 'completed', paymentMethod: 'wallet',
    createdAt: '2026-03-01T09:00:00', completedAt: '2026-03-01T09:00:00', downloadCount: 1,
  },
  {
    id: 'so7', orderNumber: 'ORD-4860', buyer: { name: 'Blessing Adeyemi', email: 'blessing@example.com', avatar: 'BA', country: 'Nigeria', countryFlag: '🇳🇬' },
    product: { name: 'Memecoin Alpha Signal Pack', type: 'digital_asset', price: 4.99 },
    total: 4.99, platformFee: 0.5, sellerEarning: 4.49, status: 'refunded', paymentMethod: 'joy_token',
    createdAt: '2026-02-28T11:00:00', downloadCount: 1,
  },
  {
    id: 'so8', orderNumber: 'ORD-4855', buyer: { name: 'Tendai Moyo', email: 'tendai@example.com', avatar: 'TM', country: 'Zimbabwe', countryFlag: '🇿🇼' },
    product: { name: 'P2P Trading Blueprint', type: 'ebook', price: 24.99 },
    total: 24.99, platformFee: 2.5, sellerEarning: 22.49, status: 'disputed', paymentMethod: 'wallet',
    createdAt: '2026-02-27T15:30:00', downloadCount: 0, buyerMessage: 'The file seems corrupted, can you resend?',
  },
];

const statusConfig: Record<OrderStatus, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  processing: { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Processing', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Completed', bg: 'bg-green-500/10', text: 'text-green-400' },
  refunded: { icon: <XCircle className="w-3.5 h-3.5" />, label: 'Refunded', bg: 'bg-red-500/10', text: 'text-red-400' },
  disputed: { icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Disputed', bg: 'bg-orange-500/10', text: 'text-orange-400' },
};

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>(mockOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [dateRange, setDateRange] = useState('all');

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o => o.orderNumber.toLowerCase().includes(q) || o.buyer.name.toLowerCase().includes(q) || o.product.name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter]);

  const totalEarnings = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.sellerEarning, 0);
  const totalFees = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.platformFee, 0);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const disputeCount = orders.filter(o => o.status === 'disputed').length;

  const handleFulfill = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' as OrderStatus, completedAt: new Date().toISOString() } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary-500" /> Orders
          </h1>
          <p className="text-dark-400 mt-1">{orders.length} total orders · {pendingCount} need attention</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: <DollarSign className="w-5 h-5 text-green-400" />, desc: 'After platform fees' },
          { label: 'Platform Fees', value: `$${totalFees.toFixed(2)}`, icon: <BarChart3 className="w-5 h-5 text-blue-400" />, desc: '10% commission' },
          { label: 'Pending Orders', value: pendingCount.toString(), icon: <Clock className="w-5 h-5 text-yellow-400" />, desc: 'Needs fulfillment' },
          { label: 'Disputes', value: disputeCount.toString(), icon: <AlertCircle className="w-5 h-5 text-orange-400" />, desc: 'Needs resolution' },
        ].map(s => (
          <div key={s.label} className="bg-dark-900 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              {s.icon}
              <span className="text-xs text-dark-400">{s.desc}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-dark-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white text-sm" />
        </div>
        <div className="flex gap-1.5">
          {['all', 'pending', 'processing', 'completed', 'refunded', 'disputed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary-500 text-dark-950' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'pending' && pendingCount > 0 && <span className="ml-1 bg-yellow-500 text-dark-950 px-1 rounded-full text-xs">{pendingCount}</span>}
              {s === 'disputed' && disputeCount > 0 && <span className="ml-1 bg-orange-500 text-dark-950 px-1 rounded-full text-xs">{disputeCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Buyer</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Earning</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filtered.map(order => {
                const sc = statusConfig[order.status];
                return (
                  <tr key={order.id} className="hover:bg-dark-800/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{order.orderNumber}</p>
                      <p className="text-xs text-dark-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">{order.buyer.avatar}</div>
                        <div>
                          <p className="text-white text-sm">{order.buyer.name}</p>
                          <p className="text-xs text-dark-400">{order.buyer.countryFlag} {order.buyer.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm truncate max-w-[200px]">{order.product.name}</p>
                      <p className="text-xs text-dark-400 capitalize">{order.product.type}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-green-400">${order.sellerEarning.toFixed(2)}</p>
                      <p className="text-xs text-dark-500">-${order.platformFee.toFixed(2)} fee</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-dark-700 text-dark-300">
                        {order.paymentMethod === 'joy_token' ? '🪙 JOY' : '💼 Wallet'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button onClick={e => { e.stopPropagation(); handleFulfill(order.id); }}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
                          Fulfill
                        </button>
                      )}
                      {order.buyerMessage && (
                        <span className="inline-flex ml-1" title="Buyer sent a message">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No orders match your filters</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={() => setSelectedOrder(null)}>
          <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-dark-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].text}`}>
                  {statusConfig[selectedOrder.status].icon} {statusConfig[selectedOrder.status].label}
                </span>
                <span className="text-xs text-dark-400">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>

              {/* Buyer */}
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Buyer</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-400">{selectedOrder.buyer.avatar}</div>
                  <div>
                    <p className="font-medium text-white">{selectedOrder.buyer.name} {selectedOrder.buyer.countryFlag}</p>
                    <p className="text-xs text-dark-400">{selectedOrder.buyer.email}</p>
                  </div>
                  <Link href="/user/marketplace/messages" className="ml-auto px-3 py-1.5 bg-dark-700 text-dark-300 text-xs rounded-lg hover:bg-dark-600 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                </div>
              </div>

              {/* Product */}
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Product</p>
                <p className="font-medium text-white">{selectedOrder.product.name}</p>
                <p className="text-xs text-dark-400 capitalize mt-0.5">{selectedOrder.product.type} · {selectedOrder.downloadCount} downloads</p>
              </div>

              {/* Financials */}
              <div className="bg-dark-800 rounded-xl p-4">
                <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Payment Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">Order Total</span>
                    <span className="text-white font-medium">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">Platform Fee (10%)</span>
                    <span className="text-red-400">-${selectedOrder.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-dark-600">
                    <span className="text-white font-bold">Your Earning</span>
                    <span className="text-green-400 font-bold">${selectedOrder.sellerEarning.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-dark-400 flex items-center gap-1">
                    {selectedOrder.paymentMethod === 'joy_token' ? '🪙 Paid with JOY Tokens' : '💼 Paid from Wallet'}
                  </p>
                </div>
              </div>

              {/* Buyer Message */}
              {selectedOrder.buyerMessage && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Buyer Message</p>
                  <p className="text-sm text-white italic">&ldquo;{selectedOrder.buyerMessage}&rdquo;</p>
                </div>
              )}

              {/* Actions */}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleFulfill(selectedOrder.id)}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Fulfill Order
                  </button>
                  <Link href="/user/marketplace/messages"
                    className="px-4 py-2.5 bg-dark-800 text-dark-300 rounded-lg font-medium text-sm hover:bg-dark-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Message Buyer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
