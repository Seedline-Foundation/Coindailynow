/**
 * Real-time Transaction Feed Component
 * 
 * Features:
 * - Live transaction stream via WebSocket
 * - Auto-scroll with pause option
 * - Transaction filtering by type
 * - Visual/sound notifications
 * - Admin alerts for pending actions
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { WalletTransaction, TransactionType, TransactionStatus } from '../../types/finance';

interface TransactionFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  autoScroll?: boolean;
  isAdmin?: boolean;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  maxItems = 50,
  showFilters = true,
  autoScroll = true,
  isAdmin = false
}) => {
  const { isConnected, transactions, pendingCount } = useWebSocket();
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([]);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [isPaused, setIsPaused] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (filterType !== 'ALL') {
      filtered = filtered.filter(tx => tx.transactionType === filterType);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    setFilteredTransactions(filtered.slice(0, maxItems));
  }, [transactions, filterType, filterStatus, maxItems]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !isPaused && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [filteredTransactions, autoScroll, isPaused]);

  // Get transaction icon and color
  const getTransactionIcon = (type: TransactionType) => {
    const icons: Record<TransactionType, { icon: JSX.Element; color: string }> = {
      DEPOSIT: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        ),
        color: 'text-green-600 bg-green-100'
      },
      WITHDRAWAL: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        ),
        color: 'text-red-600 bg-red-100'
      },
      TRANSFER: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        ),
        color: 'text-blue-600 bg-blue-100'
      },
      PAYMENT: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
        color: 'text-purple-600 bg-purple-100'
      },
      REFUND: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        ),
        color: 'text-yellow-600 bg-yellow-100'
      },
      REWARD: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-amber-600 bg-amber-100'
      },
      STAKING: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        color: 'text-indigo-600 bg-indigo-100'
      },
      UNSTAKING: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        ),
        color: 'text-pink-600 bg-pink-100'
      },
      CE_CONVERSION: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        ),
        color: 'text-orange-600 bg-orange-100'
      },
      CONVERSION: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        ),
        color: 'text-teal-600 bg-teal-100'
      },
      AIRDROP: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-pink-600 bg-pink-100'
      },
      GIFT: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        ),
        color: 'text-rose-600 bg-rose-100'
      },
      COMMISSION: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-cyan-600 bg-cyan-100'
      },
      FEE: {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'text-gray-600 bg-gray-100'
      }
    };
    return icons[type] || icons.PAYMENT;
  };

  // Get status badge
  const getStatusBadge = (status: TransactionStatus) => {
    const badges: Record<TransactionStatus, { text: string; color: string }> = {
      PENDING: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { text: 'Processing', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { text: 'Completed', color: 'bg-green-100 text-green-800' },
      FAILED: { text: 'Failed', color: 'bg-red-100 text-red-800' },
      CANCELLED: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
      REFUNDED: { text: 'Refunded', color: 'bg-purple-100 text-purple-800' }
    };
    return badges[status];
  };

  // Format time
  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="transaction-feed bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Transaction Feed
            </h3>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                isPaused
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            {isAdmin && pendingCount > 0 && (
              <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {pendingCount} Pending
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="ALL">All Types</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAWAL">Withdrawals</option>
                <option value="TRANSFER">Transfers</option>
                <option value="PAYMENT">Payments</option>
                <option value="STAKING">Staking</option>
                <option value="REWARD">Rewards</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | 'ALL')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div
        ref={feedRef}
        className="overflow-y-auto max-h-96 divide-y divide-gray-200 dark:divide-gray-700"
      >
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isConnected ? 'Waiting for transactions...' : 'Connect to see live transactions'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const { icon, color } = getTransactionIcon(tx.transactionType);
            const statusBadge = getStatusBadge(tx.status);

            return (
              <div
                key={tx.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fadeIn"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {tx.transactionType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tx.description || tx.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(4)} {tx.currency}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(tx.transactionDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                      {tx.metadata?.fee && (
                        <span className="text-xs text-gray-500">
                          Fee: {tx.metadata.fee} {tx.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {filteredTransactions.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
            <p className="text-lg font-bold text-green-600">
              {filteredTransactions.filter(tx => tx.status === 'COMPLETED').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-lg font-bold text-yellow-600">
              {filteredTransactions.filter(tx => tx.status === 'PENDING').length}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TransactionFeed;

