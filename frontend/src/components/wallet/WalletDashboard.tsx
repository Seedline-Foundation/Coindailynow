/**
 * Wallet Dashboard - User's Financial Interface
 * 
 * Features:
 * - Display wallet balances (Tokens, CE Points, JOY Tokens)
 * - Action buttons (Send, Receive, Stake, Subscribe, Withdraw)
 * - Transaction history with sorting and filtering
 * - Real-time balance updates
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { financeApi } from '../../services/financeApi';
import { Wallet, WalletTransaction, TransactionStatus, TransactionType } from '../../types/finance';
import { WalletBalance } from './WalletBalance';
import { WalletActions } from './WalletActions';
import { TransactionHistory } from './TransactionHistory';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface WalletDashboardProps {
  userId?: string;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ userId }) => {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Helper function
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Load wallet and transactions
  useEffect(() => {
    const loadWalletData = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);
        setError(null);

        // Load user's wallets
        const wallets = await financeApi.getUserWallets(currentUserId);
        
        if (wallets.length === 0) {
          setError('No wallet found. Please contact support.');
          return;
        }

        // Use primary wallet (first USER_WALLET)
        const primaryWallet = wallets.find(w => w.walletType === 'USER_WALLET') || wallets[0];
        setWallet(primaryWallet);

        // Load transactions
        const txs = await financeApi.getWalletTransactions(primaryWallet.id, {
          limit: 50,
          status: statusFilter
        });
        setTransactions(txs);

      } catch (err) {
        console.error('Failed to load wallet data:', err);
        setError('Failed to load wallet. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [currentUserId, refreshKey, statusFilter]);

  // Refresh wallet data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle transaction completion
  const handleTransactionComplete = (transactionId: string) => {
    // Refresh wallet and transactions after successful transaction
    handleRefresh();
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(tx => !typeFilter || tx.transactionType === typeFilter)
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'type':
          comparison = a.transactionType.localeCompare(b.transactionType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-6">
        <ErrorMessage message="Wallet not found" />
      </div>
    );
  }

  return (
    <div className="wallet-dashboard space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Wallet
        </h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Wallet Balance Card */}
      <WalletBalance wallet={wallet} />

      {/* Action Buttons */}
      <WalletActions 
        wallet={wallet} 
        onTransactionComplete={handleTransactionComplete}
      />

      {/* Transaction History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Transaction History
          </h2>
          
          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value as TransactionStatus || undefined)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter || ''}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType || undefined)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER">Transfers</option>
              <option value="PAYMENT">Payments</option>
              <option value="STAKING">Staking</option>
              <option value="CONVERSION">Conversions</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'type')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="type">Sort by Type</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <TransactionHistory transactions={filteredTransactions} walletId={wallet.id} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Volume</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(filteredTransactions
                  .filter(tx => new Date(tx.createdAt).getMonth() === new Date().getMonth())
                  .reduce((sum, tx) => sum + tx.amount, 0)
                )} {wallet.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Transactions</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {filteredTransactions.filter(tx => tx.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Staked</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(wallet.stakedBalance)} {wallet.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Security Notice */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
              Email OTP Verification Required
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Sensitive transactions (withdrawals, large transfers, payments) require email OTP verification. 
              Check your email for verification codes that expire in 5 minutes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                ⚠️ Keep email secure
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                🕒 OTP expires in 5 mins
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                🚫 Never share OTP codes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;

