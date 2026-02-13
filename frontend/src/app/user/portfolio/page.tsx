/**
 * User Portfolio Page
 * Track crypto portfolio and watchlist
 */

'use client';

import React from 'react';
import PortfolioOverview from '@/components/dashboard/PortfolioOverview';
import PriceChart from '@/components/dashboard/PriceChart';

export default function UserPortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Portfolio</h1>
        <p className="text-dark-400 mt-1">Track your cryptocurrency investments and market performance.</p>
      </div>

      <PortfolioOverview />

      <div className="bg-dark-900 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Price Chart</h2>
        <PriceChart />
      </div>
    </div>
  );
}
