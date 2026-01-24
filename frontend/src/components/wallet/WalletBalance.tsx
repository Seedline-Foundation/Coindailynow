/**
 * Wallet Balance Component
 * 
 * Displays wallet balances with visual indicators:
 * - Available balance
 * - Locked balance
 * - Staked balance
 * - CE Points
 * - JOY Tokens
 */

'use client';

import React from 'react';
import { Wallet, WalletStatus } from '../../types/finance';

interface WalletBalanceProps {
  wallet: Wallet;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ wallet }) => {
  const formatCurrency = (amount: number, decimals: number = 2): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const getStatusColor = (status: WalletStatus): string => {
    switch (status) {
      case WalletStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case WalletStatus.LOCKED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case WalletStatus.FROZEN:
      case WalletStatus.SUSPENDED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case WalletStatus.CLOSED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="wallet-balance-card bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-blue-100">Total Balance</p>
          <h2 className="text-4xl font-bold mt-1">
            {formatCurrency(wallet.totalBalance)} {wallet.currency}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(wallet.status)}`}>
            {wallet.status}
          </span>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Available Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-blue-100">Available</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(wallet.availableBalance)}</p>
        </div>

        {/* Locked Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-medium text-blue-100">Locked</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(wallet.lockedBalance)}</p>
        </div>

        {/* Staked Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium text-blue-100">Staked</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(wallet.stakedBalance)}</p>
        </div>
      </div>

      {/* Additional Balances */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
        {/* CE Points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">CE Points</p>
              <p className="text-lg font-bold">{formatCurrency(wallet.cePoints, 0)}</p>
            </div>
          </div>
        </div>

        {/* JOY Tokens */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">JOY Tokens</p>
              <p className="text-lg font-bold">{formatCurrency(wallet.joyTokens, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-xs font-medium text-blue-100 mb-1">Wallet Address</p>
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <code className="text-sm font-mono">{wallet.walletAddress}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(wallet.walletAddress);
              // Could add toast notification here
            }}
            className="ml-2 p-1 hover:bg-white/20 rounded"
            title="Copy address"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Last Transaction */}
      {wallet.lastTransactionAt && (
        <div className="mt-4">
          <p className="text-xs text-blue-100">
            Last transaction: {new Date(wallet.lastTransactionAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletBalance;

