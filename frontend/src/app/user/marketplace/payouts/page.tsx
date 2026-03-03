'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  CreditCard,
  AlertCircle,
  BarChart3,
  ChevronRight,
  Info,
  Coins,
  ArrowRight,
} from 'lucide-react';

// ===========================================================================
// TYPES
// ===========================================================================

interface PayoutRecord {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'completed' | 'processing' | 'scheduled' | 'failed';
  period: string;
  paidAt?: string;
  scheduledAt: string;
  method: 'wallet_transfer' | 'joy_token';
  ordersCount: number;
}

interface EarningBreakdown {
  month: string;
  grossSales: number;
  platformFees: number;
  netEarnings: number;
  orders: number;
  refunds: number;
}

// ===========================================================================
// MOCK DATA
// ===========================================================================

const mockPayouts: PayoutRecord[] = [
  { id: 'pay-001', amount: 2180.50, fee: 0, netAmount: 2180.50, status: 'scheduled', period: 'March 2026', scheduledAt: '2026-03-31', method: 'wallet_transfer', ordersCount: 34 },
  { id: 'pay-002', amount: 1890.20, fee: 0, netAmount: 1890.20, status: 'completed', period: 'February 2026', paidAt: '2026-02-28', scheduledAt: '2026-02-28', method: 'wallet_transfer', ordersCount: 28 },
  { id: 'pay-003', amount: 1540.75, fee: 0, netAmount: 1540.75, status: 'completed', period: 'January 2026', paidAt: '2026-01-31', scheduledAt: '2026-01-31', method: 'wallet_transfer', ordersCount: 22 },
  { id: 'pay-004', amount: 980.00, fee: 0, netAmount: 980.00, status: 'completed', period: 'December 2025', paidAt: '2025-12-31', scheduledAt: '2025-12-31', method: 'joy_token', ordersCount: 15 },
  { id: 'pay-005', amount: 720.30, fee: 0, netAmount: 720.30, status: 'completed', period: 'November 2025', paidAt: '2025-11-30', scheduledAt: '2025-11-30', method: 'wallet_transfer', ordersCount: 11 },
];

const mockEarnings: EarningBreakdown[] = [
  { month: 'Mar 2026', grossSales: 2422.78, platformFees: 242.28, netEarnings: 2180.50, orders: 34, refunds: 1 },
  { month: 'Feb 2026', grossSales: 2100.22, platformFees: 210.02, netEarnings: 1890.20, orders: 28, refunds: 0 },
  { month: 'Jan 2026', grossSales: 1711.94, platformFees: 171.19, netEarnings: 1540.75, orders: 22, refunds: 2 },
  { month: 'Dec 2025', grossSales: 1088.89, platformFees: 108.89, netEarnings: 980.00, orders: 15, refunds: 0 },
  { month: 'Nov 2025', grossSales: 800.33, platformFees: 80.03, netEarnings: 720.30, orders: 11, refunds: 1 },
  { month: 'Oct 2025', grossSales: 540.00, platformFees: 54.00, netEarnings: 486.00, orders: 8, refunds: 0 },
];

const payoutStatusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  completed: { icon: <CheckCircle className="w-4 h-4" />, label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/10' },
  processing: { icon: <Clock className="w-4 h-4" />, label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  scheduled: { icon: <Calendar className="w-4 h-4" />, label: 'Scheduled', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  failed: { icon: <AlertCircle className="w-4 h-4" />, label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10' },
};

// ===========================================================================
// COMPONENT
// ===========================================================================

export default function SellerPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'earnings'>('overview');

  const totalEarned = mockPayouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.netAmount, 0);
  const pendingPayout = mockPayouts.find(p => p.status === 'scheduled');
  const thisMonthEarnings = mockEarnings[0];
  const lastMonthEarnings = mockEarnings[1];
  const growthRate = lastMonthEarnings ? ((thisMonthEarnings.netEarnings - lastMonthEarnings.netEarnings) / lastMonthEarnings.netEarnings * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-500" /> Payouts & Earnings
          </h1>
          <p className="text-dark-400 mt-1">Track your marketplace earnings and withdrawal history</p>
        </div>
        <div className="flex gap-2">
          <Link href="/user/wallet" className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700">
            <Wallet className="w-4 h-4" /> Go to Wallet
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30 rounded-2xl p-5">
          <p className="text-sm text-green-400/80 mb-2">Total Lifetime Earnings</p>
          <p className="text-3xl font-black text-white">${totalEarned.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" /> +{growthRate}% from last month
          </div>
        </div>

        {/* Next Payout */}
        <div className="bg-gradient-to-br from-primary-900/40 to-primary-800/20 border border-primary-700/30 rounded-2xl p-5">
          <p className="text-sm text-primary-400/80 mb-2">Next Payout</p>
          <p className="text-3xl font-black text-white">${pendingPayout?.netAmount.toLocaleString() || '0.00'}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-primary-400">
            <Calendar className="w-4 h-4" />
            {pendingPayout ? new Date(pendingPayout.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No payout scheduled'}
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-2xl p-5">
          <p className="text-sm text-purple-400/80 mb-2">This Month&apos;s Revenue</p>
          <p className="text-3xl font-black text-white">${thisMonthEarnings.grossSales.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-dark-400">{thisMonthEarnings.orders} orders</span>
            <span className="text-dark-500">·</span>
            <span className="text-red-400">-${thisMonthEarnings.platformFees.toFixed(2)} fees</span>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white font-medium">How Payouts Work</p>
          <p className="text-xs text-dark-400 mt-1">
            Earnings are accumulated throughout the month and automatically transferred to your CoinDaily wallet on the last day of each month.
            CoinDaily charges a <strong className="text-primary-400">10% platform fee</strong> on each sale.
            You can use your earnings as JOY Tokens on the platform or withdraw to external wallets.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-dark-900 border border-dark-700 rounded-xl p-1">
        {(['overview', 'payouts', 'earnings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
              activeTab === tab ? 'bg-primary-500/10 text-primary-400' : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}>
            {tab === 'overview' && <BarChart3 className="w-4 h-4 inline mr-1.5" />}
            {tab === 'payouts' && <Wallet className="w-4 h-4 inline mr-1.5" />}
            {tab === 'earnings' && <DollarSign className="w-4 h-4 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Chart Placeholder */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-500" /> Revenue Trend</h3>
            <div className="grid grid-cols-6 gap-2 items-end h-40">
              {mockEarnings.slice().reverse().map((e, i) => {
                const maxEarning = Math.max(...mockEarnings.map(m => m.netEarnings));
                const height = (e.netEarnings / maxEarning) * 100;
                return (
                  <div key={e.month} className="flex flex-col items-center gap-1">
                    <p className="text-xs text-dark-400">${(e.netEarnings / 1000).toFixed(1)}K</p>
                    <div className="w-full bg-primary-500/20 rounded-t-md relative" style={{ height: `${height}%` }}>
                      <div className="absolute inset-0 bg-primary-500/60 rounded-t-md" />
                    </div>
                    <p className="text-xs text-dark-500">{e.month.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Payouts Summary */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="font-bold text-white">Recent Payouts</h3>
              <button onClick={() => setActiveTab('payouts')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-dark-700">
              {mockPayouts.slice(0, 3).map(p => {
                const sc = payoutStatusConfig[p.status];
                return (
                  <div key={p.id} className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sc.bg} ${sc.color}`}>{sc.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{p.period}</p>
                      <p className="text-xs text-dark-400">{p.ordersCount} orders · {p.method === 'joy_token' ? 'JOY' : 'Wallet'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${p.netAmount.toLocaleString()}</p>
                      <span className={`text-xs ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-center">Method</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {mockPayouts.map(p => {
                const sc = payoutStatusConfig[p.status];
                return (
                  <tr key={p.id} className="hover:bg-dark-800/50">
                    <td className="px-4 py-3 font-medium text-white">{p.period}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-400 font-bold">${p.netAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-dark-300">{p.ordersCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-dark-700 text-dark-300">
                        {p.method === 'joy_token' ? '🪙 JOY' : '💼 Wallet'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-400 text-xs">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : `Scheduled: ${new Date(p.scheduledAt).toLocaleDateString()}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Gross Sales</th>
                <th className="px-4 py-3 text-right">Platform Fees</th>
                <th className="px-4 py-3 text-right">Net Earnings</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-center">Refunds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {mockEarnings.map(e => (
                <tr key={e.month} className="hover:bg-dark-800/50">
                  <td className="px-4 py-3 font-medium text-white">{e.month}</td>
                  <td className="px-4 py-3 text-right text-white">${e.grossSales.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-400">-${e.platformFees.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold">${e.netEarnings.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-dark-300">{e.orders}</td>
                  <td className="px-4 py-3 text-center">
                    {e.refunds > 0 ? <span className="text-red-400">{e.refunds}</span> : <span className="text-dark-500">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-dark-700 bg-dark-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Total (6 months)</span>
              <span className="text-green-400 font-bold">
                ${mockEarnings.reduce((sum, e) => sum + e.netEarnings, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
