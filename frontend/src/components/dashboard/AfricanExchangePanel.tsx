/**
 * African Exchange Panel Component
 * Task 22: African cryptocurrency exchange integration
 * 
 * Features:
 * - Real-time rates from major African exchanges
 * - Mobile money correlation display
 * - Regional market insights
 * - Exchange comparison tools
 */

import React from 'react';
import { AfricanExchange, MobileMoneyRate } from '../../contexts/MarketDataContext';

interface AfricanExchangePanelProps {
  exchanges: Record<string, AfricanExchange>;
  mobileMoneyRates: Record<string, MobileMoneyRate>;
  selectedRegion: string;
  isMobile: boolean;
}

export function AfricanExchangePanel({
  exchanges,
  mobileMoneyRates,
  selectedRegion,
  isMobile
}: AfricanExchangePanelProps) {
  const exchangeEntries = Object.entries(exchanges);
  const mobileMoneyEntries = Object.entries(mobileMoneyRates);

  // Filter exchanges by region
  const regionalExchanges = exchangeEntries.filter(([_, exchange]) =>
    exchange.supportedCountries.includes(selectedRegion)
  );

  if (exchangeEntries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          African Exchanges
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Loading exchange data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* African Exchanges */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          African Exchanges
        </h3>
        
        <div className="space-y-4">
          {regionalExchanges.length > 0 ? (
            regionalExchanges.map(([key, exchange]) => (
              <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {exchange.name}
                  </h4>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                    {exchange.tradingFee}% fee
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">BTC</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${exchange.btcPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ETH</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${exchange.ethPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {exchange.depositMethods.map(method => (
                    <span
                      key={method}
                      className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No exchanges available for selected region
            </p>
          )}
        </div>
      </div>

      {/* Mobile Money Rates */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Mobile Money Rates
        </h3>
        
        <div className="space-y-4">
          {mobileMoneyEntries.length > 0 ? (
            mobileMoneyEntries.slice(0, isMobile ? 2 : 4).map(([key, rate]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {rate.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {rate.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rate.country} • {rate.currency}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {rate.currency} {rate.btcRate.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    per BTC
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Loading mobile money rates...
            </p>
          )}
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Market Insights
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {regionalExchanges.length} exchanges active in your region
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mobile money integration available
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Compare rates across exchanges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}