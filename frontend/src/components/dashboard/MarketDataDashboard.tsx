/**
 * Market Data Dashboard Component
 * Task 22: Comprehensive real-time market data dashboard
 * 
 * Features:
 * - Real-time price updates via WebSocket
 * - Interactive price charts with multiple timeframes
 * - African exchange integration with mobile money rates
 * - Portfolio tracking and performance metrics
 * - Price alert management system
 * - Mobile-optimized responsive design
 * - WCAG 2.1 accessibility compliance
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMarketData } from '../../contexts/MarketDataContext';
import { PriceChart } from './PriceChart';
import { AfricanExchangePanel } from './AfricanExchangePanel';
import { PortfolioOverview } from './PortfolioOverview';
import { AlertManager } from './AlertManager';
import { MobileMenuToggle } from './MobileMenuToggle';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';

interface MarketDataDashboardProps {
  showPortfolio?: boolean;
  throwError?: boolean; // For testing error boundaries
}

export function MarketDataDashboard({ 
  showPortfolio = false, 
  throwError = false 
}: MarketDataDashboardProps) {
  const { state, actions } = useMarketData();
  const [isMobile, setIsMobile] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');

  // Test error boundary
  if (throwError) {
    throw new Error('Test error for error boundary');
  }

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isConnected) {
        actions.refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.isConnected, actions]);

  // Memoize market data for performance
  const marketDataBySymbol = useMemo(() => {
    return state.marketData.reduce((acc, item) => {
      acc[item.symbol] = item;
      return acc;
    }, {} as Record<string, any>);
  }, [state.marketData]);

  const selectedCoinData = marketDataBySymbol[selectedSymbol];

  // Handle loading state
  if (state.isLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
        data-testid="dashboard-loading"
      >
        <LoadingSpinner size="lg" message="Loading market data..." />
      </div>
    );
  }

  // Handle error state
  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {state.error}
          </p>
          <button
            onClick={() => actions.refreshData()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            aria-label="Retry connection"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${
          isMobile ? 'mobile-optimized' : ''
        }`}
        data-testid="market-dashboard"
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CoinDaily Africa
                </h1>
                <div 
                  className="ml-4 flex items-center text-sm"
                  data-testid="market-hours"
                >
                  <div 
                    className={`w-3 h-3 rounded-full mr-2 ${
                      state.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    aria-label={state.isConnected ? 'Connected' : 'Disconnected'}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {state.isConnected ? 'Live' : 'Disconnected'}
                  </span>
                  <span className="ml-4 text-gray-600 dark:text-gray-400">
                    CAT • WAT • EAT
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                {!state.isConnected && (
                  <div className="text-orange-500 text-sm">
                    Reconnecting...
                  </div>
                )}

                {/* Region Selector */}
                <div className="relative">
                  <select
                    value={state.selectedRegion}
                    onChange={(e) => actions.setRegion(e.target.value)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
                    data-testid="region-selector"
                    aria-label="Select region"
                  >
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                    <option value="GH">🇬🇭 Ghana</option>
                  </select>
                </div>

                {/* Mobile Menu Toggle */}
                {isMobile && (
                  <MobileMenuToggle
                    isOpen={showAdvancedFeatures}
                    onToggle={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                  />
                )}

                {/* Alert Button */}
                <button
                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                  className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  aria-label="Manage alerts"
                >
                  Alerts
                  {state.alertNotifications.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      {state.alertNotifications.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Alert Notifications */}
        {state.alertNotifications.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              {state.alertNotifications.map((notification, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-yellow-800 dark:text-yellow-200"
                >
                  <span>{notification}</span>
                  <button
                    onClick={() => actions.clearNotifications()}
                    className="ml-4 text-yellow-600 hover:text-yellow-800 dark:text-yellow-300 dark:hover:text-yellow-100"
                    aria-label="Clear notifications"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
            {/* Market Overview */}
            <div className={`${isMobile ? 'col-span-1' : 'col-span-3'} space-y-6`}>
              {/* Price Tickers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {state.marketData.slice(0, 4).map((coin) => (
                  <div
                    key={coin.symbol}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      selectedSymbol === coin.symbol ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSymbol(coin.symbol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedSymbol(coin.symbol);
                      }
                    }}
                    aria-label={`${coin.symbol} current price`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {coin.symbol}
                      </h3>
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          coin.change24h >= 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                        aria-label="Price change percentage"
                      >
                        {coin.change24h >= 0 ? '+' : ''}
                        {coin.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                      data-testid={`${coin.symbol.toLowerCase()}-price`}
                    >
                      ${coin.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <PriceChart
                  symbol={selectedSymbol}
                  data={state.chartData[state.selectedTimeframe] || []}
                  timeframe={state.selectedTimeframe}
                  chartType={state.chartType}
                  onTimeframeChange={actions.setTimeframe}
                  onChartTypeChange={actions.setChartType}
                  isMobile={isMobile}
                />
              </div>

              {/* Portfolio Section */}
              {(showPortfolio || !isMobile) && state.portfolio && (
                <PortfolioOverview
                  portfolio={state.portfolio}
                  isMobile={isMobile}
                />
              )}
            </div>

            {/* Side Panel */}
            <div className={`${isMobile ? 'col-span-1' : 'col-span-1'} space-y-6`}>
              {/* African Exchanges */}
              <AfricanExchangePanel
                exchanges={state.africanExchanges}
                mobileMoneyRates={state.mobileMoneyRates}
                selectedRegion={state.selectedRegion}
                isMobile={isMobile}
              />

              {/* Advanced Features (Mobile: Collapsible) */}
              <div
                className={`space-y-6 ${
                  isMobile && !showAdvancedFeatures ? 'hidden' : 'block'
                }`}
                data-testid="advanced-features"
              >
                <AlertManager
                  alerts={state.alerts}
                  onAddAlert={actions.addAlert}
                  onRemoveAlert={actions.removeAlert}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}