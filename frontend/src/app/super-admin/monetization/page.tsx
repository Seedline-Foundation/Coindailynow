/**
 * Monetization Dashboard
 * Revenue analytics, subscriptions, payments, and financial metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  Calendar,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  PieChart,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  Smartphone
} from 'lucide-react';

interface MonetizationData {
  revenue: {
    total: number;
    change: number;
    trend: Array<{ date: string; amount: number }>;
    mrr: number;
    arr: number;
  };
  subscriptions: {
    total: number;
    active: number;
    new: number;
    cancelled: number;
    churnRate: number;
    conversionRate: number;
    byPlan: Array<{ name: string; count: number; revenue: number }>;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    byGateway: Array<{ name: string; count: number; amount: number }>;
  };
  refunds: {
    total: number;
    amount: number;
    rate: number;
    recent: Array<{ id: string; user: string; amount: number; reason: string; date: string }>;
  };
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    subscriptionTier: string;
  }>;
}

export default function MonetizationPage() {
  const [data, setData] = useState<MonetizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchMonetizationData();
  }, [timeRange]);

  const fetchMonetizationData = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`/api/super-admin/monetization?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching monetization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csv = 'data:text/csv;charset=utf-8,' + 
      'Metric,Value\n' +
      `Total Revenue,$${data?.revenue.total}\n` +
      `MRR,$${data?.revenue.mrr}\n` +
      `ARR,$${data?.revenue.arr}\n` +
      `Active Subscriptions,${data?.subscriptions.active}\n`;
    
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `monetization_${timeRange}_${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            <span>Monetization Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Revenue analytics, subscriptions, and payment tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchMonetizationData}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' :
               range === '30d' ? 'Last 30 Days' :
               range === '90d' ? 'Last 90 Days' :
               'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading monetization data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div className={`flex items-center space-x-1 text-sm ${
                  (data?.revenue.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(data?.revenue.change || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(data?.revenue.change || 0)}%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">${data?.revenue.total.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Total Revenue</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
                <span className="text-sm text-green-400">
                  <ArrowUpRight className="h-4 w-4 inline" /> 12%
                </span>
              </div>
              <p className="text-3xl font-bold text-white">${data?.revenue.mrr.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Monthly Recurring Revenue</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <span className="text-sm text-gray-400">Annual</span>
              </div>
              <p className="text-3xl font-bold text-white">${data?.revenue.arr.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Annual Recurring Revenue</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-yellow-400" />
                <span className="text-sm text-blue-400">
                  {data?.subscriptions.new} new
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{data?.subscriptions.active.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Active Subscriptions</p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span>Revenue Trend</span>
            </h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data?.revenue.trend.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-600 rounded-t hover:bg-green-500 transition-colors cursor-pointer"
                    style={{
                      height: `${(point.amount / Math.max(...data.revenue.trend.map(p => p.amount))) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`$${point.amount.toLocaleString()}`}
                  ></div>
                  <span className="text-xs text-gray-400 mt-2">{point.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriptions & Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Plans */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                <span>Subscription Plans</span>
              </h2>
              <div className="space-y-4">
                {data?.subscriptions.byPlan.map((plan, index) => (
                  <div key={index} className="bg-gray-750 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      <span className="text-sm text-gray-400">{plan.count} subscribers</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-400">${plan.revenue.toLocaleString()}</p>
                      <span className="text-sm text-gray-400">
                        ${(plan.revenue / plan.count).toFixed(2)}/month
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(plan.count / data.subscriptions.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <p className="text-sm text-yellow-400 mb-1">Churn Rate</p>
                  <p className="text-2xl font-bold text-white">{data?.subscriptions.churnRate}%</p>
                </div>
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                  <p className="text-sm text-green-400 mb-1">Conversion</p>
                  <p className="text-2xl font-bold text-white">{data?.subscriptions.conversionRate}%</p>
                </div>
              </div>
            </div>

            {/* Payment Gateways */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-green-400" />
                <span>Payment Gateways</span>
              </h2>
              <div className="space-y-4 mb-6">
                {data?.payments.byGateway.map((gateway, index) => (
                  <div key={index} className="bg-gray-750 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {gateway.name.includes('M-Pesa') ? (
                          <Smartphone className="h-5 w-5 text-green-400" />
                        ) : (
                          <CreditCard className="h-5 w-5 text-blue-400" />
                        )}
                        <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                      </div>
                      <span className="text-sm text-gray-400">{gateway.count} transactions</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">${gateway.amount.toLocaleString()}</p>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${(gateway.amount / data.payments.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">Successful</p>
                  <p className="text-lg font-bold text-white">{data?.payments.successful}</p>
                </div>
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-center">
                  <XCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">Failed</p>
                  <p className="text-lg font-bold text-white">{data?.payments.failed}</p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 text-center">
                  <Clock className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">Pending</p>
                  <p className="text-lg font-bold text-white">{data?.payments.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Refunds & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Refunds */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-red-400" />
                  <span>Recent Refunds</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-lg font-bold text-red-400">${data?.refunds.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-3">
                {data?.refunds.recent.map((refund) => (
                  <div
                    key={refund.id}
                    className="bg-red-900/20 border border-red-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{refund.user}</span>
                      <span className="text-sm font-bold text-red-400">${refund.amount}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{refund.reason}</p>
                    <p className="text-xs text-gray-500">{new Date(refund.date).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-400">Refund Rate</span>
                  <span className="text-lg font-bold text-white">{data?.refunds.rate}%</span>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Banknote className="h-5 w-5 text-yellow-400" />
                <span>Top Customers</span>
              </h2>
              <div className="space-y-3">
                {data?.topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-600 rounded-full">
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white">{customer.name}</h3>
                        <p className="text-xs text-gray-400">{customer.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                          {customer.subscriptionTier}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">${customer.totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Total Spent</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

