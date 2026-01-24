/**
 * Portfolio Overview Component
 * Task 22: Cryptocurrency portfolio tracking and analytics
 * 
 * Features:
 * - Total portfolio value and performance
 * - Individual holdings breakdown
 * - Performance metrics and insights
 * - Rebalancing suggestions
 */

import React, { useState } from 'react';
import { Portfolio } from '../../contexts/MarketDataContext';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
  isMobile: boolean;
}

export function PortfolioOverview({ portfolio, isMobile }: PortfolioOverviewProps) {
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div data-testid="portfolio-overview">
      {/* Portfolio Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Portfolio Overview
          </h2>
          <button
            onClick={() => setShowRebalanceModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            aria-label="Rebalance portfolio"
          >
            Rebalance
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Balance */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Balance
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(portfolio.totalBalance)}
            </p>
          </div>

          {/* 24h Change */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              24h Change
            </p>
            <div className="flex items-center justify-center md:justify-start">
              <p className={`text-2xl font-bold ${
                portfolio.change24h >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(Math.abs(portfolio.change24h))}
              </p>
              <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                portfolio.change24hPercent >= 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {formatPercent(portfolio.change24hPercent)}
              </span>
            </div>
          </div>

          {/* Total P&L */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total P&L
            </p>
            <div className="flex items-center justify-center md:justify-start">
              <p className={`text-2xl font-bold ${
                portfolio.performance.totalPnL >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(Math.abs(portfolio.performance.totalPnL))}
              </p>
              <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                portfolio.performance.totalPnLPercent >= 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {formatPercent(portfolio.performance.totalPnLPercent)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Holdings
        </h3>
        
        <div className="space-y-4" data-testid="holdings-list">
          {portfolio.holdings.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {holding.symbol.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {holding.symbol}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {holding.amount} {holding.symbol}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(holding.value)}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    holding.change24hPercent >= 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {formatPercent(holding.change24hPercent)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {holding.allocation}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Best Performer
            </p>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {portfolio.performance.bestPerformer.symbol}
              </span>
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                {formatPercent(portfolio.performance.bestPerformer.change)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Worst Performer
            </p>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {portfolio.performance.worstPerformer.symbol}
              </span>
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                {formatPercent(portfolio.performance.worstPerformer.change)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rebalance Modal */}
      {showRebalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rebalancing Suggestions
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Consider reducing your {portfolio.holdings[0]?.symbol} allocation from {portfolio.holdings[0]?.allocation}% to 60% for better diversification.
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your portfolio is well-balanced across major cryptocurrencies. Consider DCA strategies for continued growth.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowRebalanceModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Apply Suggestions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
