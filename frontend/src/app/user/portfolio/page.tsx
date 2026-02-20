/**
 * User Portfolio Page
 * Track crypto portfolio and watchlist
 */

'use client';

import React from 'react';
import { MarketDataProvider } from '@/contexts/MarketDataContext';
import { MarketDataDashboard } from '@/components/dashboard/MarketDataDashboard';

export default function UserPortfolioPage() {
  return (
    <MarketDataProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Portfolio</h1>
          <p className="text-dark-400 mt-1">Track your cryptocurrency investments and market performance.</p>
        </div>

        <div className="rounded-xl overflow-hidden">
          <MarketDataDashboard showPortfolio />
        </div>
      </div>
    </MarketDataProvider>
  );
}
