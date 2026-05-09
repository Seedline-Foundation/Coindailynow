'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const feedItems = [
  { id: 1, title: 'Nigeria SEC Announces New Crypto Licensing Framework for 2026', source: 'Mariblock', category: 'Regulation', country: 'Nigeria', time: '5 min ago', image: '', url: '#' },
  { id: 2, title: 'Bitcoin Trading Volume on Luno South Africa Hits $50M Monthly Record', source: 'TechCabal', category: 'Market', country: 'South Africa', time: '12 min ago', image: '', url: '#' },
  { id: 3, title: 'Yellow Card Expands to 5 New African Countries in Q1 2026', source: 'Disrupt Africa', category: 'Adoption', country: 'Pan-Africa', time: '25 min ago', image: '', url: '#' },
  { id: 4, title: 'Kenyan Central Bank Issues Guidance on Digital Asset Tax Compliance', source: 'CBK Official', category: 'Regulation', country: 'Kenya', time: '32 min ago', image: '', url: '#' },
  { id: 5, title: 'Binance P2P NGN Volume Surges 300% After eNaira Phase 2 Launch', source: 'CoinTelegraph Africa', category: 'Market', country: 'Nigeria', time: '45 min ago', image: '', url: '#' },
  { id: 6, title: 'Ghana SEC Exploring Blockchain for Securities Settlement', source: 'Techpoint Africa', category: 'Innovation', country: 'Ghana', time: '1 hour ago', image: '', url: '#' },
  { id: 7, title: 'M-Pesa Crypto Integration Passes 1 Million Users in Kenya', source: 'Safaricom Blog', category: 'Adoption', country: 'Kenya', time: '1.5 hours ago', image: '', url: '#' },
  { id: 8, title: 'VALR Exchange Obtains Full FSCA License in South Africa', source: 'CryptoSlate', category: 'Regulation', country: 'South Africa', time: '2 hours ago', image: '', url: '#' },
  { id: 9, title: 'African DeFi Protocol Raises $15M Series A from Paradigm', source: 'Bitcoin.com', category: 'Funding', country: 'Pan-Africa', time: '2.5 hours ago', image: '', url: '#' },
  { id: 10, title: 'Egypt Explores CBDC with Blockchain-Based Solution for Cross-Border Trade', source: 'CBE Bulletin', category: 'CBDC', country: 'Egypt', time: '3 hours ago', image: '', url: '#' },
];

const sources = [
  { name: 'Mariblock', status: 'active', articles: 342, lastUpdate: '5 min ago' },
  { name: 'TechCabal', status: 'active', articles: 278, lastUpdate: '12 min ago' },
  { name: 'CoinTelegraph Africa', status: 'active', articles: 856, lastUpdate: '45 min ago' },
  { name: 'Disrupt Africa', status: 'active', articles: 156, lastUpdate: '25 min ago' },
  { name: 'CryptoSlate', status: 'active', articles: 423, lastUpdate: '2 hours ago' },
  { name: 'Bitcoin.com Africa', status: 'active', articles: 289, lastUpdate: '2.5 hours ago' },
  { name: 'Central Bank Press', status: 'active', articles: 97, lastUpdate: '32 min ago' },
  { name: 'Techpoint Africa', status: 'active', articles: 201, lastUpdate: '1 hour ago' },
];

const categoryColors: Record<string, string> = {
  Regulation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Market: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Adoption: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Innovation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Funding: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  CBDC: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
};

export default function RSSAggregatorPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [tab, setTab] = useState<'feed' | 'sources' | 'embed'>('feed');

  const categories = ['all', ...new Set(feedItems.map(f => f.category))];
  const countries = ['all', ...new Set(feedItems.map(f => f.country))];

  const filtered = feedItems.filter(f =>
    (categoryFilter === 'all' || f.category === categoryFilter) &&
    (countryFilter === 'all' || f.country === countryFilter)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📡 African Crypto News Aggregator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Real-time aggregation from 50+ African crypto news sources. Auto-categorized, deduplicated, and syndicated to Google News. Updated every 5 minutes.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-xl p-1 mb-8 max-w-md mx-auto">
          {(['feed', 'sources', 'embed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
              {t === 'feed' ? '📰 Live Feed' : t === 'sources' ? '📡 Sources' : '🔗 Embed & API'}
            </button>
          ))}
        </div>

        {tab === 'feed' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
              </select>
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                {countries.map(c => <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>)}
              </select>
              <div className="ml-auto flex items-center space-x-2">
                <a href="/rss.xml" className="px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-200 rounded-lg text-sm font-medium">📡 RSS Feed</a>
                <a href="/api/news-feed" className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-lg text-sm font-medium">🔗 JSON API</a>
              </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-4">
              {filtered.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[item.category] || ''}`}>{item.category}</span>
                        <span className="text-xs text-gray-500">🌍 {item.country}</span>
                        <span className="text-xs text-gray-400">via {item.source}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 hover:text-orange-600 cursor-pointer">{item.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'sources' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Articles Indexed</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sources.map(s => (
                  <tr key={s.name}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">{s.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{s.articles}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">{s.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'embed' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-4">📦 Embed Widget</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add the African crypto news feed to your website with a simple embed code:</p>
              <code className="block bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs text-gray-800 dark:text-gray-300 break-all">
                {`<iframe src="https://coindaily.online/embed/news-feed?category=all&country=all" width="100%" height="600" frameborder="0"></iframe>`}
              </code>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-4">🔗 API Access</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-mono text-gray-800 dark:text-gray-200">GET /api/v1/news-feed</p>
                  <p className="text-xs text-gray-500 mt-1">Params: ?category=regulation&country=nigeria&limit=20</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-mono text-gray-800 dark:text-gray-200">GET /rss.xml</p>
                  <p className="text-xs text-gray-500 mt-1">RSS/Atom feed — auto-updates every 5 minutes</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-mono text-gray-800 dark:text-gray-200">POST /api/v1/webhooks/subscribe</p>
                  <p className="text-xs text-gray-500 mt-1">Real-time push notifications for new articles</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
