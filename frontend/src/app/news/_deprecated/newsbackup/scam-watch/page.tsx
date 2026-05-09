'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const scamAlerts = [
  { id: 1, severity: 'critical', title: 'AfriCoin Rug Pull — $2.3M Lost', chain: 'BSC', date: '2026-02-16', country: 'Nigeria', description: 'AfriCoin token contract had hidden mint function. Deployer minted 1B tokens and dumped on DEX. Liquidity drained within 30 minutes.', status: 'confirmed' },
  { id: 2, severity: 'high', title: 'Fake Luno Support Telegram Group', chain: 'N/A', date: '2026-02-15', country: 'Kenya', description: 'Fraudulent Telegram group impersonating Luno support. Asking users for recovery phrases and private keys.', status: 'confirmed' },
  { id: 3, severity: 'medium', title: 'Suspicious Token: SafeMoonAfrica', chain: 'BSC', date: '2026-02-14', country: 'Ghana', description: 'New token with honeypot characteristics — buy tax 0%, sell tax 99%. Contract not verified on BscScan.', status: 'investigating' },
  { id: 4, severity: 'high', title: 'Binance Africa Phishing Site', chain: 'N/A', date: '2026-02-13', country: 'South Africa', description: 'Domain binance-africa-login.com serving phishing page identical to Binance. SSL certificate from Let\'s Encrypt.', status: 'confirmed' },
  { id: 5, severity: 'low', title: 'M-Pesa Crypto Scam SMS Campaign', chain: 'N/A', date: '2026-02-12', country: 'Kenya', description: 'SMS messages promising 500% returns on M-Pesa crypto investment. Links to fake investment platform.', status: 'confirmed' },
];

const exchangeStatus = [
  { name: 'Binance', status: 'operational', deposits: true, withdrawals: true, p2p: true, note: '' },
  { name: 'Luno', status: 'operational', deposits: true, withdrawals: true, p2p: false, note: '' },
  { name: 'Quidax', status: 'degraded', deposits: true, withdrawals: false, p2p: false, note: 'NGN withdrawals delayed 2-4 hours' },
  { name: 'Yellow Card', status: 'operational', deposits: true, withdrawals: true, p2p: true, note: '' },
  { name: 'VALR', status: 'operational', deposits: true, withdrawals: true, p2p: false, note: '' },
  { name: 'Paxful', status: 'maintenance', deposits: false, withdrawals: false, p2p: false, note: 'Scheduled maintenance until 18:00 UTC' },
];

const gasData = [
  { chain: 'Ethereum', symbol: 'ETH', fast: '32 Gwei', standard: '24 Gwei', slow: '18 Gwei', txCost: '$4.20', color: 'bg-blue-500' },
  { chain: 'BNB Chain', symbol: 'BNB', fast: '5 Gwei', standard: '3 Gwei', slow: '1 Gwei', txCost: '$0.12', color: 'bg-yellow-500' },
  { chain: 'Tron', symbol: 'TRX', fast: '420 SUN', standard: '400 SUN', slow: '350 SUN', txCost: '$0.50', color: 'bg-red-500' },
  { chain: 'Solana', symbol: 'SOL', fast: '0.00025', standard: '0.00015', slow: '0.00005', txCost: '$0.025', color: 'bg-purple-500' },
  { chain: 'Polygon', symbol: 'MATIC', fast: '120 Gwei', standard: '80 Gwei', slow: '40 Gwei', txCost: '$0.02', color: 'bg-violet-500' },
];

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  high: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
  low: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
};

export default function ScamWatchPage() {
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState<'scams' | 'exchanges' | 'gas'>('scams');

  const filtered = filter === 'all' ? scamAlerts : scamAlerts.filter(a => a.severity === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🛡️ Scam Watch, Exchange Monitor & Gas Fees
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Protect yourself with real-time scam alerts, exchange status monitoring, and live gas fee tracking across all major chains used in Africa.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-xl p-1 mb-8 max-w-md mx-auto">
          {(['scams', 'exchanges', 'gas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
              {t === 'scams' ? '⚠️ Scam Alerts' : t === 'exchanges' ? '🏦 Exchange Status' : '⛽ Gas Fees'}
            </button>
          ))}
        </div>

        {/* Scam Alerts Tab */}
        {tab === 'scams' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize ${filter === s ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {filtered.map(alert => (
                <div key={alert.id} className={`border rounded-xl p-6 ${severityColors[alert.severity]}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-white/50 dark:bg-black/20">
                        {alert.severity}
                      </span>
                      <h3 className="font-bold text-lg">{alert.title}</h3>
                    </div>
                    <span className="text-xs opacity-75">{alert.date}</span>
                  </div>
                  <p className="text-sm mb-3">{alert.description}</p>
                  <div className="flex items-center space-x-4 text-xs opacity-75">
                    <span>🌍 {alert.country}</span>
                    <span>⛓️ {alert.chain}</span>
                    <span className={`px-2 py-0.5 rounded ${alert.status === 'confirmed' ? 'bg-red-200 dark:bg-red-800' : 'bg-yellow-200 dark:bg-yellow-800'}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Exchange Status Tab */}
        {tab === 'exchanges' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Exchange</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Deposits</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Withdrawals</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">P2P</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {exchangeStatus.map(ex => (
                  <tr key={ex.name}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{ex.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ex.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ex.status === 'degraded' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xl">{ex.deposits ? '✅' : '❌'}</td>
                    <td className="px-6 py-4 text-center text-xl">{ex.withdrawals ? '✅' : '❌'}</td>
                    <td className="px-6 py-4 text-center text-xl">{ex.p2p ? '✅' : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{ex.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Gas Fees Tab */}
        {tab === 'gas' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {gasData.map(chain => (
                <div key={chain.chain} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${chain.color} flex items-center justify-center text-white font-bold text-sm`}>
                      {chain.symbol[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{chain.chain}</h3>
                      <p className="text-xs text-gray-500">Avg transfer: {chain.txCost}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">🚀 Fast</span>
                      <span className="font-mono text-gray-900 dark:text-white">{chain.fast}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">⚡ Standard</span>
                      <span className="font-mono text-gray-900 dark:text-white">{chain.standard}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">🐢 Slow</span>
                      <span className="font-mono text-gray-900 dark:text-white">{chain.slow}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">💡 Cheapest Transfer Recommendation</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Right now, <strong>Solana</strong> offers the cheapest transfers at ~$0.025 per transaction. For USDT transfers to Africa, 
                use <strong>Tron (TRC-20)</strong> for the best balance of cost ($0.50) and exchange support.
              </p>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
