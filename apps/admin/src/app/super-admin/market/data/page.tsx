'use client';

import { useState } from 'react';
import {
  BarChart3, Activity, RefreshCw, TrendingUp, TrendingDown, Globe,
  Zap, Database, AlertTriangle, CheckCircle, Clock, ArrowUpRight,
  ArrowDownRight, Flame, Eye
} from 'lucide-react';

const DATA_SOURCES = [
  { name: 'CoinGecko', category: 'Crypto', symbols: 12_000, latency: '0.8s', status: 'healthy', coverage: 98 },
  { name: 'CoinMarketCap', category: 'Crypto', symbols: 11_000, latency: '1.2s', status: 'healthy', coverage: 97 },
  { name: 'Binance WS', category: 'Exchange', symbols: 2_100, latency: '12ms', status: 'healthy', coverage: 100 },
  { name: 'Luno', category: 'Africa Exchange', symbols: 18, latency: '0.6s', status: 'healthy', coverage: 100 },
  { name: 'Quidax', category: 'Africa Exchange', symbols: 24, latency: '0.7s', status: 'healthy', coverage: 100 },
  { name: 'BuyCoins (Nigeria)', category: 'Africa Exchange', symbols: 8, latency: '0.9s', status: 'warning', coverage: 92 },
  { name: 'VALR', category: 'Africa Exchange', symbols: 35, latency: '0.5s', status: 'healthy', coverage: 100 },
  { name: 'Ice3X', category: 'Africa Exchange', symbols: 12, latency: '1.1s', status: 'healthy', coverage: 98 },
  { name: 'Yahoo Finance', category: 'Finance', symbols: 50_000, latency: '2.1s', status: 'healthy', coverage: 96 },
  { name: 'Alpha Vantage', category: 'Finance', symbols: 20_000, latency: '1.8s', status: 'healthy', coverage: 94 },
  { name: 'M-Pesa FX', category: 'Mobile Money', symbols: 12, latency: '3.2s', status: 'healthy', coverage: 89 },
  { name: 'MTN MoMo FX', category: 'Mobile Money', symbols: 8, latency: '2.8s', status: 'warning', coverage: 85 },
];

const TRENDING = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$67,420', change: '+3.4%', up: true, volume: '$42B', sentiment: 'Bullish' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,512', change: '+2.1%', up: true, volume: '$18B', sentiment: 'Bullish' },
  { symbol: 'DOGE', name: 'Dogecoin', price: '$0.1842', change: '+12.7%', up: true, volume: '$3.1B', sentiment: 'Hot' },
  { symbol: 'PEPE', name: 'PepeCoin', price: '$0.00001541', change: '+28.4%', up: true, volume: '$1.8B', sentiment: 'Viral' },
  { symbol: 'SOL', name: 'Solana', price: '$183.40', change: '-1.2%', up: false, volume: '$5.2B', sentiment: 'Neutral' },
  { symbol: 'BONK', name: 'Bonk', price: '$0.00003291', change: '+18.9%', up: true, volume: '$820M', sentiment: 'Hot' },
];

const BENCHMARKS = [
  { label: 'Crypto symbols tracked', value: '23,000+', icon: '🪙', status: 'complete' },
  { label: 'African exchange pairs', value: '97', icon: '🌍', status: 'complete' },
  { label: 'Mobile money FX pairs', value: '20', icon: '📱', status: 'partial' },
  { label: 'Traditional finance assets', value: '70,000+', icon: '📈', status: 'complete' },
  { label: 'Memecoin surge detection', value: 'Real-time', icon: '🚀', status: 'complete' },
  { label: 'Historic OHLCV depth (crypto)', value: '10 years', icon: '📊', status: 'complete' },
  { label: 'Orderbook depth streams', value: '50 exchanges', icon: '📋', status: 'partial' },
  { label: 'On-chain whale tracking', value: 'BTC + ETH + SOL', icon: '🐋', status: 'partial' },
  { label: 'Stablecoin depeg alerts', value: 'USDT/USDC/DAI', icon: '⚠️', status: 'complete' },
  { label: 'African influencer sentiment', value: '150+ tracked', icon: '👥', status: 'complete' },
];

const DEMAND_SIGNALS = [
  { topic: 'Bitcoin halving analysis', searches: '18,200/day', trend: 'up', source: 'Organic' },
  { topic: 'M-Pesa to BTC conversion', searches: '4,600/day', trend: 'up', source: 'Organic' },
  { topic: 'Nigeria crypto regulations', searches: '3,900/day', trend: 'up', source: 'News' },
  { topic: 'PEPE memecoin price', searches: '12,300/day', trend: 'viral', source: 'Social' },
  { topic: 'Binance Africa fees', searches: '2,100/day', trend: 'stable', source: 'Organic' },
  { topic: 'South Africa crypto tax', searches: '1,800/day', trend: 'up', source: 'Organic' },
  { topic: 'Kenya crypto exchange', searches: '5,400/day', trend: 'up', source: 'Organic' },
  { topic: 'BONK meme coin', searches: '9,800/day', trend: 'viral', source: 'Social' },
];

export default function SuperAdminMarketDataPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'trending' | 'demand'>('overview');

  const healthySources = DATA_SOURCES.filter(s => s.status === 'healthy').length;
  const totalSymbols = DATA_SOURCES.reduce((a, s) => a + s.symbols, 0);
  const avgCoverage = Math.round(DATA_SOURCES.reduce((a, s) => a + s.coverage, 0) / DATA_SOURCES.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            Market Data Management
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor feeds, benchmarks, trending analysis, and market demand signals.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-6 h-6 text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Feed Health</span>
          </div>
          <p className="text-3xl font-bold text-white">{healthySources}/{DATA_SOURCES.length}</p>
          <p className="text-sm text-green-400 mt-1">Sources operational</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Symbols</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalSymbols.toLocaleString()}+</p>
          <p className="text-sm text-gray-400 mt-1">Total tracked</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Latency</span>
          </div>
          <p className="text-3xl font-bold text-white">12ms</p>
          <p className="text-sm text-gray-400 mt-1">Fastest feed (Binance WS)</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Coverage</span>
          </div>
          <p className="text-3xl font-bold text-white">{avgCoverage}%</p>
          <p className="text-sm text-gray-400 mt-1">Avg. feed coverage</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['overview', 'sources', 'trending', 'demand'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'demand' ? 'Demand Signals' : tab}
          </button>
        ))}
      </div>

      {/* Overview tab — data benchmarks */}
      {activeTab === 'overview' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Data Coverage Benchmarks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BENCHMARKS.map((b, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
                <span className="text-2xl">{b.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{b.label}</p>
                  <p className="text-white font-semibold">{b.value}</p>
                </div>
                {b.status === 'complete' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 bg-blue-900/30 border border-blue-700/40 rounded-xl p-5">
            <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Analysis Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Completed analyses today</p>
                <p className="text-white font-bold text-xl">1,842</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Pending AI analysis queue</p>
                <p className="text-yellow-300 font-bold text-xl">47</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Anomalies flagged (24h)</p>
                <p className="text-red-400 font-bold text-xl">12</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sources tab */}
      {activeTab === 'sources' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Data Feed Sources</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-400 font-medium">Symbols</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-400 font-medium">Latency</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-400 font-medium">Coverage</th>
                  <th className="text-center py-3 px-4 text-sm text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {DATA_SOURCES.map((src, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/60">
                    <td className="py-3 px-4 text-white font-medium">{src.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300">{src.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{src.symbols.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-300 font-mono text-sm">{src.latency}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${src.coverage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-300 w-10 text-right">{src.coverage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {src.status === 'healthy' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900 text-green-300">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900 text-yellow-300">
                          <AlertTriangle className="w-3 h-3" />
                          Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trending tab */}
      {activeTab === 'trending' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Trending Tokens (24h)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRENDING.map((coin, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">{coin.symbol}</span>
                      {(coin.sentiment === 'Hot' || coin.sentiment === 'Viral') && (
                        <Flame className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{coin.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    coin.sentiment === 'Viral' ? 'bg-red-900 text-red-300' :
                    coin.sentiment === 'Hot' ? 'bg-orange-900 text-orange-300' :
                    coin.sentiment === 'Bullish' ? 'bg-green-900 text-green-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {coin.sentiment}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mb-2">{coin.price}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className={`flex items-center gap-1 font-semibold ${coin.up ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {coin.change}
                  </span>
                  <span className="text-gray-400">Vol: {coin.volume}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demand Signals tab */}
      {activeTab === 'demand' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Market Demand Signals</h2>
          <p className="text-sm text-gray-400 mb-4">
            Real-time search and social signals indicating what African crypto audiences are actively looking for.
          </p>
          <div className="space-y-3">
            {DEMAND_SIGNALS.map((sig, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
                <span className="text-gray-500 text-sm w-6 text-center font-mono">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{sig.topic}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{sig.searches}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  sig.source === 'Social' ? 'bg-purple-900 text-purple-300' :
                  sig.source === 'News' ? 'bg-blue-900 text-blue-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {sig.source}
                </span>
                <span className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${
                  sig.trend === 'viral' ? 'bg-red-900 text-red-300' :
                  sig.trend === 'up' ? 'bg-green-900 text-green-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {sig.trend === 'viral' ? <Flame className="w-3 h-3" /> :
                   sig.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                   <Eye className="w-3 h-3" />}
                  {sig.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
