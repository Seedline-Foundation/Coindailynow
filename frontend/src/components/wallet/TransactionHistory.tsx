/**
 * Transaction History Component
 * 
 * Displays paginated transaction history with:
 * - Transaction type icons and colors
 * - Status badges
 * - Amount display (+ for incoming, - for outgoing)
 * - Date/time formatting
 * - Transaction details on click
 */

'use client';

import React, { useState } from 'react';
import { WalletTransaction, TransactionType, TransactionStatus } from '../../types/finance';
import { TransactionDetailModal } from './modals/ModalPlaceholders';

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  walletId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, walletId }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);

  const getTransactionIcon = (type: TransactionType) => {
    const iconClass = "w-10 h-10 rounded-full flex items-center justify-center";
    
    switch (type) {
      case TransactionType.DEPOSIT:
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900/30`}>
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
            </svg>
          </div>
        );
      case TransactionType.WITHDRAWAL:
        return (
          <div className={`${iconClass} bg-red-100 dark:bg-red-900/30`}>
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-4 4m4-4l4 4" />
            </svg>
          </div>
        );
      case TransactionType.TRANSFER:
        return (
          <div className={`${iconClass} bg-blue-100 dark:bg-blue-900/30`}>
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case TransactionType.PAYMENT:
        return (
          <div className={`${iconClass} bg-purple-100 dark:bg-purple-900/30`}>
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        );
      case TransactionType.STAKING:
        return (
          <div className={`${iconClass} bg-amber-100 dark:bg-amber-900/30`}>
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case TransactionType.CONVERSION:
        return (
          <div className={`${iconClass} bg-indigo-100 dark:bg-indigo-900/30`}>
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case TransactionType.GIFT:
        return (
          <div className={`${iconClass} bg-pink-100 dark:bg-pink-900/30`}>
            <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100 dark:bg-gray-900/30`}>
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Completed
          </span>
        );
      case TransactionStatus.PENDING:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case TransactionStatus.FAILED:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Failed
          </span>
        );
      case TransactionStatus.CANCELLED:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Cancelled
          </span>
        );
      case TransactionStatus.REFUNDED:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  const isIncoming = (tx: WalletTransaction) => {
    return tx.toWalletId === walletId;
  };

  const formatAmount = (tx: WalletTransaction) => {
    const incoming = isIncoming(tx);
    const sign = incoming ? '+' : '-';
    const colorClass = incoming 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
    
    return (
      <span className={`font-semibold ${colorClass}`}>
        {sign}{tx.amount.toLocaleString()} {tx.currency}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No transactions yet</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="transaction-history bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedTransaction(tx)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Icon and Type */}
                <div className="flex items-center gap-4 flex-1">
                  {getTransactionIcon(tx.transactionType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tx.transactionType.replace('_', ' ')}
                      </h4>
                      {getStatusBadge(tx.status)}
                    </div>
                    {tx.purpose && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                        {tx.purpose}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right ml-4">
                  <div className="text-lg">
                    {formatAmount(tx)}
                  </div>
                  {tx.fee && tx.fee > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Fee: {tx.fee} {tx.currency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
};

export default TransactionHistory;

