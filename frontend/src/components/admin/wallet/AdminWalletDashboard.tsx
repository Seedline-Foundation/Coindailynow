/**
 * Admin Wallet Dashboard
 * 
 * Comprehensive admin interface for wallet management:
 * - Total balances overview
 * - Active users statistics
 * - Pending withdrawals
 * - Real-time transaction feed
 * - Quick actions for admin operations
 */

'use client';

import React, { useEffect, useState } from 'react';
import { financeRestApi } from '../../../services/financeApi';
import { AdminWalletOverview } from '../../../types/finance';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AdminWalletDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminWalletOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await financeRestApi.getAdminWalletOverview();
        setOverview(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin overview');
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => setRefreshKey(prev => prev + 1), 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const stats = [
    {
      name: 'Total Wallets',
      value: overview.totalWallets.toLocaleString(),
      subtitle: `${overview.activeWallets} active`,
      icon: '👛',
      color: 'bg-blue-500'
    },
    {
      name: 'Total Balance',
      value: formatCurrency(overview.totalBalance),
      subtitle: 'Platform tokens',
      icon: '💰',
      color: 'bg-green-500'
    },
    {
      name: 'Staked Balance',
      value: formatCurrency(overview.totalStakedBalance),
      subtitle: 'Locked in staking',
      icon: '🔒',
      color: 'bg-purple-500'
    },
    {
      name: 'CE Points',
      value: overview.totalCEPoints.toLocaleString(),
      subtitle: 'Community engagement',
      icon: '⭐',
      color: 'bg-amber-500'
    },
    {
      name: 'JOY Tokens',
      value: overview.totalJoyTokens.toLocaleString(),
      subtitle: 'Platform currency',
      icon: '🎉',
      color: 'bg-pink-500'
    },
    {
      name: 'Pending Withdrawals',
      value: overview.pendingWithdrawals.toString(),
      subtitle: 'Requires review',
      icon: '⏳',
      color: 'bg-orange-500'
    },
    {
      name: 'Today\'s Transactions',
      value: overview.totalTransactionsToday.toLocaleString(),
      subtitle: `Volume: ${formatCurrency(overview.totalVolumeToday)}`,
      icon: '📊',
      color: 'bg-indigo-500'
    },
    {
      name: 'Pending Transactions',
      value: overview.pendingTransactions.toString(),
      subtitle: 'Awaiting processing',
      icon: '🕐',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="admin-wallet-dashboard p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Wallet Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Platform-wide wallet and transaction overview
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.name}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/wallet/airdrops"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="text-sm font-semibold">Airdrops</span>
          </a>

          <a
            href="/admin/wallet/ce-points"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-sm font-semibold">CE Points</span>
          </a>

          <a
            href="/admin/wallet/transactions"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-semibold">Transactions</span>
          </a>

          <a
            href="/admin/wallet/users"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-semibold">User Wallets</span>
          </a>
        </div>
      </div>

      {/* Alert Section */}
      {(overview.pendingWithdrawals > 0 || overview.pendingTransactions > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
                Action Required
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {overview.pendingWithdrawals > 0 && (
                  <span>There are {overview.pendingWithdrawals} pending withdrawals requiring review. </span>
                )}
                {overview.pendingTransactions > 0 && (
                  <span>{overview.pendingTransactions} transactions are awaiting processing.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletDashboard;

