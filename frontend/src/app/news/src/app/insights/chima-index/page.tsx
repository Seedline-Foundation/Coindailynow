'use client';

import React, { useState } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const indices = [
  {
    symbol: 'EMAI',
    name: 'CHIMA EM Crypto Adoption Index',
    value: 67.4,
    change: '+2.3%',
    positive: true,
    description: 'Monthly composite score measuring crypto adoption velocity across 40 emerging markets.',
    frequency: 'Monthly',
    countries: 40,
    components: ['Wallet Growth', 'On-Chain Volume', 'P2P Trading', 'Exchange Sign-ups', 'Search Interest'],
  },
  {
    symbol: 'ADAI',
    name: 'CHIMA Africa DeFi Activity Index',
    value: 54.2,
    change: '-1.2%',
    positive: false,
    description: 'Tracks DeFi protocol usage across Sub-Saharan Africa: TVL, stablecoin flows, yield farming.',
    frequency: 'Weekly',
    countries: 14,
    components: ['TVL', 'Stablecoin Transfers', 'Unique DeFi Users', 'Yield Farming', 'DEX Volume'],
  },
  {
    symbol: 'RRS',
    name: 'CHIMA EM Regulatory Risk Score',
    value: 58.7,
    change: '+0.5',
    positive: true,
    description: 'Daily risk score for 40 EM countries: 0 (ban) to 100 (fully progressive).',
    frequency: 'Daily',
    countries: 40,
    components: ['Legal Status', 'Licensing', 'Tax Clarity', 'AML/CFT', 'CBDC Progress', 'Enforcement', 'FATF Status'],
  },
  {
    symbol: 'CRI',
    name: 'CHIMA Caribbean Remittance Corridor Index',
    value: 43.8,
    change: '+0.8',
    positive: true,
    description: 'Tracks cost and speed of crypto vs traditional remittance transfers to Caribbean islands.',
    frequency: 'Weekly',
    countries: 8,
    components: ['Cost Savings', 'Volume Growth', 'Speed Advantage', 'Adoption Rate', 'Corridor Coverage'],
  },
];

export default function ChimaIndexPage() {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            CHIMA Index Products
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Proprietary Market Intelligence
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2">
            The Bloomberg of emerging markets — proprietary indices tracking crypto adoption,
            DeFi activity, regulatory risk, and remittance corridors across Africa, Caribbean, and Latin America.
          </p>
        </div>

        {/* Index Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {indices.map(idx => (
            <div key={idx.symbol}
              onClick={() => setSelectedIndex(selectedIndex === idx.symbol ? null : idx.symbol)}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer transition-all border-2 ${
                selectedIndex === idx.symbol ? 'border-blue-500' : 'border-transparent hover:border-blue-200 dark:hover:border-blue-800'
              }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{idx.symbol}</span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{idx.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{idx.value}</p>
                  <p className={`text-sm font-bold ${idx.positive ? 'text-green-600' : 'text-red-600'}`}>{idx.change}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{idx.description}</p>

              <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Updated: {idx.frequency}</span>
                <span>{idx.countries} countries</span>
              </div>

              {selectedIndex === idx.symbol && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Index Components</h4>
                  <div className="flex flex-wrap gap-2">
                    {idx.components.map(c => (
                      <span key={c} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                      View Full Data
                    </button>
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                      API Access
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* API Access CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white mb-12">
          <h2 className="text-2xl font-bold mb-3">Enterprise API Access</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-6">
            Integrate CHIMA Index data into your apps, research, and trading systems.
            REST API with JSON and CSV export. Real-time updates.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50">
              View API Docs
            </button>
            <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-400">
              Request Access
            </button>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Methodology</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Each CHIMA index is a weighted composite of sub-metrics, calculated per country and aggregated.
            Data is sourced from on-chain analytics, exchange APIs, regulatory databases, and sentiment analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Data Sources</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>CoinGecko & CoinMarketCap APIs</li>
                <li>The Graph Protocol (on-chain DeFi data)</li>
                <li>Dune Analytics (custom dashboards)</li>
                <li>Regulatory agency feeds (40+ countries)</li>
                <li>P2P market scrapers (Binance P2P, Paxful)</li>
                <li>Google Trends API (search interest)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Publication Schedule</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>EMAI: Published monthly (1st of each month)</li>
                <li>ADAI: Published weekly (every Monday)</li>
                <li>RRS: Updated daily (continuous monitoring)</li>
                <li>CRI: Published weekly (every Wednesday)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
