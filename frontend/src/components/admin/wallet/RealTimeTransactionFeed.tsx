/**
 * Real-time Transaction Feed Component for Task 3
 * 
 * Features:
 * - WebSocket-based real-time transaction updates
 * - Live transaction monitoring for admin dashboard
 * - Filtering by transaction type, status, and amount
 * - Auto-refresh with customizable intervals
 * - Transaction details modal with full information
 * - Export functionality for transaction reports
 * - Visual indicators for different transaction types
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WalletTransaction, TransactionType, TransactionStatus } from '../../../types/finance';
import { financeRestApi } from '../../../services/financeApi';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface TransactionFeedProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  maxTransactions?: number;
  showFilters?: boolean;
}

interface WebSocketMessage {
  type: 'transaction_update' | 'new_transaction' | 'transaction_status_change';
  data: WalletTransaction;
}

export const RealTimeTransactionFeed: React.FC<TransactionFeedProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
  maxTransactions = 50,
  showFilters = true
}) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    type: '' as TransactionType | '',
    status: '' as TransactionStatus | '',
    minAmount: '',
    maxAmount: '',
    dateRange: '24h' as '1h' | '24h' | '7d' | '30d' | 'all'
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial transactions
  useEffect(() => {
    loadTransactions();
  }, [filters]);

  // WebSocket connection setup
  useEffect(() => {
    if (autoRefresh) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoRefresh]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters based on filters
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
      if (filters.dateRange !== 'all') queryParams.append('dateRange', filters.dateRange);
      queryParams.append('limit', maxTransactions.toString());

      const data = await financeRestApi.getTransactionFeed(queryParams.toString());
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      // Replace with actual WebSocket URL from environment
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/transactions';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (autoRefresh) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
      };
    } catch (err: any) {
      setError('Failed to connect to real-time feed');
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'new_transaction':
        setTransactions(prev => [message.data, ...prev.slice(0, maxTransactions - 1)]);
        break;
      case 'transaction_update':
      case 'transaction_status_change':
        setTransactions(prev => 
          prev.map(tx => tx.id === message.data.id ? message.data : tx)
        );
        break;
    }
  };

  const getTransactionIcon = (type: TransactionType): string => {
    switch (type) {
      case 'DEPOSIT': return '⬇️';
      case 'WITHDRAWAL': return '⬆️';
      case 'TRANSFER': return '↔️';
      case 'PAYMENT': return '💳';
      case 'STAKING': return '🔒';
      case 'CONVERSION': return '🔄';
      case 'GIFT': return '🎁';
      case 'REFUND': return '↩️';
      default: return '💰';
    }
  };

  const getStatusColor = (status: TransactionStatus): string => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'CANCELLED': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatAmount = (amount: number, currency: string): string => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  const formatTime = (date: string): string => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Type', 'Amount', 'Currency', 'Status', 'From Wallet', 'To Wallet', 'Created At'].join(','),
      ...transactions.map(tx => [
        tx.id,
        tx.transactionType,
        tx.amount,
        tx.currency,
        tx.status,
        tx.fromWallet?.walletAddress || '',
        tx.toWallet?.walletAddress || '',
        tx.createdAt
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="real-time-transaction-feed bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Live Transaction Feed
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={exportTransactions}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
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

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />

            <input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && transactions.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => {
                  setSelectedTransaction(transaction);
                  setShowModal(true);
                }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getTransactionIcon(transaction.transactionType)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {transaction.transactionType}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.purpose || transaction.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatTime(transaction.createdAt.toISOString())}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</label>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.transactionType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedTransaction.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed At</label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedTransaction.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              {(selectedTransaction.purpose || selectedTransaction.description) && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedTransaction.purpose || selectedTransaction.description}
                  </p>
                </div>
              )}
              
              {selectedTransaction.transactionHash && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Hash</label>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {selectedTransaction.transactionHash}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeTransactionFeed;
