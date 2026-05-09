'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

interface PremiumData {
  country: string;
  flag: string;
  currency: string;
  officialRate: number;
  p2pRate: number;
  premium: number;
  volume24h: string;
  exchanges: string[];
  trend: 'up' | 'down' | 'stable';
}

const mockData: PremiumData[] = [
  { country: 'Nigeria', flag: '🇳🇬', currency: 'NGN', officialRate: 1580, p2pRate: 1695, premium: 7.28, volume24h: '$12.4M', exchanges: ['Binance P2P', 'Quidax', 'Paxful'], trend: 'up' },
  { country: 'Kenya', flag: '🇰🇪', currency: 'KES', officialRate: 152, p2pRate: 158, premium: 3.95, volume24h: '$4.2M', exchanges: ['Binance P2P', 'Luno', 'Yellow Card'], trend: 'stable' },
  { country: 'South Africa', flag: '🇿🇦', currency: 'ZAR', officialRate: 18.2, p2pRate: 18.9, premium: 3.85, volume24h: '$8.7M', exchanges: ['Luno', 'VALR', 'Binance P2P'], trend: 'down' },
  { country: 'Ghana', flag: '🇬🇭', currency: 'GHS', officialRate: 14.8, p2pRate: 15.9, premium: 7.43, volume24h: '$2.1M', exchanges: ['Binance P2P', 'Yellow Card'], trend: 'up' },
  { country: 'Uganda', flag: '🇺🇬', currency: 'UGX', officialRate: 3780, p2pRate: 3920, premium: 3.70, volume24h: '$980K', exchanges: ['Binance P2P', 'Yellow Card'], trend: 'stable' },
  { country: 'Egypt', flag: '🇪🇬', currency: 'EGP', officialRate: 48.5, p2pRate: 53.2, premium: 9.69, volume24h: '$5.6M', exchanges: ['Binance P2P'], trend: 'up' },
  { country: 'Tanzania', flag: '🇹🇿', currency: 'TZS', officialRate: 2580, p2pRate: 2680, premium: 3.88, volume24h: '$450K', exchanges: ['Binance P2P'], trend: 'stable' },
  { country: 'Morocco', flag: '🇲🇦', currency: 'MAD', officialRate: 10.1, p2pRate: 10.6, premium: 4.95, volume24h: '$1.8M', exchanges: ['Binance P2P'], trend: 'down' },
];

export default function P2PPremiumPage() {
  const [sortBy, setSortBy] = useState<'premium' | 'volume' | 'country'>('premium');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [timeRange, setTimeRange] = useState('7d');

  const sorted = [...mockData].sort((a, b) => {
    if (sortBy === 'premium') return b.premium - a.premium;
    if (sortBy === 'country') return a.country.localeCompare(b.country);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💱 Live P2P Premium & On/Off-Ramp Index
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real-time premium calculations for P2P crypto trading across Africa. See how much more traders pay 
            compared to official exchange rates — updated every 10 minutes.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset:</label>
            <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option>USDT</option>
              <option>USDC</option>
              <option>BTC</option>
              <option>ETH</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
            {['24h', '7d', '30d', '90d'].map(t => (
              <button key={t} onClick={() => setTimeRange(t)} className={`px-3 py-2 rounded-lg text-sm ${timeRange === t ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="premium">Highest Premium</option>
              <option value="country">Country A-Z</option>
            </select>
          </div>
        </div>

        {/* Methodology Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">📊 Methodology</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Premium = (Local P2P Price / Official USD × FX Rate) − 1. Data sourced from Binance P2P, OKX P2P, Yellow Card, Luno, Paxful, and bank FX rates. Refreshed every 10 minutes.
          </p>
        </div>

        {/* Premium Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Country</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Official Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">P2P Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Premium</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">24h Volume</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Trend</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sorted.map((row) => (
                  <tr key={row.country} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{row.flag}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{row.country}</p>
                          <p className="text-xs text-gray-500">{row.currency}/{selectedAsset}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300 font-mono">
                      {row.officialRate.toLocaleString()} {row.currency}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300 font-mono">
                      {row.p2pRate.toLocaleString()} {row.currency}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-lg ${row.premium > 5 ? 'text-red-600' : row.premium > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                        +{row.premium.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{row.volume24h}</td>
                    <td className="px-6 py-4 text-right text-xl">
                      {row.trend === 'up' ? '📈' : row.trend === 'down' ? '📉' : '➡️'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.exchanges.map(ex => (
                          <span key={ex} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{ex}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embed Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔗 Embed This Widget</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add the P2P Premium widget to your website.</p>
            <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs text-gray-800 dark:text-gray-300 break-all">
              {`<iframe src="https://coindaily.online/embed/p2p-premium" width="100%" height="400" frameborder="0"></iframe>`}
            </code>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📡 API Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Integrate P2P premium data into your app.</p>
            <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs text-gray-800 dark:text-gray-300 break-all">
              GET https://api.coindaily.online/v1/p2p-premium?country=NG&asset=USDT
            </code>
            <Link href="/services/api" className="inline-block mt-3 text-orange-600 text-sm font-medium hover:underline">
              View API Docs →
            </Link>
          </div>
        </div>

        {/* Why It Matters */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why P2P Premiums Matter in Africa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">💵 Capital Controls</h4>
              <p>Many African countries have capital controls that restrict USD access, driving premiums in the P2P market.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Market Indicator</h4>
              <p>P2P premiums serve as a real-time indicator of forex market stress and crypto demand in each country.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔄 Arbitrage Signals</h4>
              <p>Traders use premium differentials between countries and exchanges to identify arbitrage opportunities.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
