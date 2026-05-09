'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const cryptos = [
  { symbol: 'BTC', name: 'Bitcoin', prices: { NGN: 67800000, ZAR: 782500, KES: 6550000, GHS: 635000, UGX: 163500000, TZS: 111800000, EGP: 2095000, MAD: 436500, XOF: 26850000, XAF: 26850000 }, change: 2.98, volume: '$24.5B', mcap: '$846B' },
  { symbol: 'ETH', name: 'Ethereum', prices: { NGN: 4185000, ZAR: 48250, KES: 403800, GHS: 39200, UGX: 10080000, TZS: 6897000, EGP: 129300, MAD: 26900, XOF: 1657000, XAF: 1657000 }, change: -1.20, volume: '$12.3B', mcap: '$318B' },
  { symbol: 'USDT', name: 'Tether', prices: { NGN: 1695, ZAR: 18.9, KES: 158, GHS: 15.9, UGX: 3920, TZS: 2680, EGP: 53.2, MAD: 10.6, XOF: 658, XAF: 658 }, change: 0.01, volume: '$45.2B', mcap: '$120B' },
  { symbol: 'BNB', name: 'BNB', prices: { NGN: 472000, ZAR: 5440, KES: 45600, GHS: 4420, UGX: 1138000, TZS: 778000, EGP: 14580, MAD: 3040, XOF: 187000, XAF: 187000 }, change: 1.55, volume: '$1.8B', mcap: '$43B' },
  { symbol: 'XRP', name: 'Ripple', prices: { NGN: 4100, ZAR: 47.3, KES: 396, GHS: 38.4, UGX: 9880, TZS: 6760, EGP: 126.5, MAD: 26.4, XOF: 1624, XAF: 1624 }, change: 4.32, volume: '$3.2B', mcap: '$136B' },
  { symbol: 'SOL', name: 'Solana', prices: { NGN: 267000, ZAR: 3080, KES: 25800, GHS: 2500, UGX: 643000, TZS: 440000, EGP: 8240, MAD: 1720, XOF: 106000, XAF: 106000 }, change: 3.87, volume: '$4.5B', mcap: '$78B' },
  { symbol: 'USDC', name: 'USD Coin', prices: { NGN: 1690, ZAR: 18.85, KES: 157.5, GHS: 15.85, UGX: 3910, TZS: 2670, EGP: 53.0, MAD: 10.55, XOF: 656, XAF: 656 }, change: -0.02, volume: '$8.1B', mcap: '$58B' },
  { symbol: 'ADA', name: 'Cardano', prices: { NGN: 1350, ZAR: 15.6, KES: 130, GHS: 12.6, UGX: 3250, TZS: 2220, EGP: 41.6, MAD: 8.7, XOF: 534, XAF: 534 }, change: -0.45, volume: '$890M', mcap: '$28B' },
];

const currencies = ['NGN', 'ZAR', 'KES', 'GHS', 'UGX', 'TZS', 'EGP', 'MAD', 'XOF', 'XAF'];
const currencyNames: Record<string, string> = {
  NGN: '🇳🇬 Nigerian Naira', ZAR: '🇿🇦 SA Rand', KES: '🇰🇪 Kenyan Shilling', GHS: '🇬🇭 Ghanaian Cedi',
  UGX: '🇺🇬 Ugandan Shilling', TZS: '🇹🇿 Tanzanian Shilling', EGP: '🇪🇬 Egyptian Pound', MAD: '🇲🇦 Moroccan Dirham',
  XOF: '🇸🇳 West African CFA', XAF: '🇨🇲 Central African CFA',
};

const topExchanges = [
  { name: 'Yellow Card', pairs: 45, countries: 16, type: 'Direct' },
  { name: 'Luno', pairs: 24, countries: 6, type: 'Direct' },
  { name: 'Binance P2P', pairs: 60, countries: 20, type: 'P2P' },
  { name: 'Quidax', pairs: 12, countries: 1, type: 'Direct' },
  { name: 'VALR', pairs: 18, countries: 2, type: 'Direct' },
  { name: 'Paxful', pairs: 30, countries: 15, type: 'P2P' },
];

export default function ExchangeWidgetPage() {
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [amount, setAmount] = useState('1');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [direction, setDirection] = useState<'crypto-to-fiat' | 'fiat-to-crypto'>('crypto-to-fiat');

  const crypto = cryptos.find(c => c.symbol === selectedCrypto)!;
  const rate = crypto.prices[selectedCurrency as keyof typeof crypto.prices] || 0;
  const amtNum = parseFloat(amount) || 0;
  const converted = direction === 'crypto-to-fiat' ? amtNum * rate : amtNum / rate;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💱 Real-Time African Crypto/Fiat Exchange
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Live exchange rates for crypto ↔ 10 African currencies. Compare rates across exchanges and find the best deal.
          </p>
        </div>

        {/* Converter Widget */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Convert</h2>
            <button onClick={() => setDirection(d => d === 'crypto-to-fiat' ? 'fiat-to-crypto' : 'crypto-to-fiat')}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200">
              🔄 Swap Direction
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {direction === 'crypto-to-fiat' ? 'Amount (Crypto)' : `Amount (${selectedCurrency})`}
              </label>
              <div className="flex">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold" />
                {direction === 'crypto-to-fiat' ? (
                  <select value={selectedCrypto} onChange={e => setSelectedCrypto(e.target.value)}
                    className="px-3 py-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white font-medium">
                    {cryptos.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                  </select>
                ) : (
                  <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)}
                    className="px-3 py-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white font-medium">
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="text-center text-2xl text-gray-400">→</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {direction === 'crypto-to-fiat' ? `You Get (${selectedCurrency})` : `You Get (${selectedCrypto})`}
              </label>
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {direction === 'crypto-to-fiat'
                    ? `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedCurrency}`
                    : `${converted.toFixed(8)} ${selectedCrypto}`}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">Rate: 1 {selectedCrypto} = {rate.toLocaleString()} {selectedCurrency} • Updated 30s ago</p>
        </div>

        {/* Currency Selector */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {currencies.map(c => (
            <button key={c} onClick={() => setSelectedCurrency(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${selectedCurrency === c ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
              {currencyNames[c]}
            </button>
          ))}
        </div>

        {/* Price Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-10">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Price ({selectedCurrency})</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">24h Change</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Volume</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Market Cap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cryptos.map(c => (
                <tr key={c.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer" onClick={() => setSelectedCrypto(c.symbol)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-300">{c.symbol[0]}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                    {(c.prices[selectedCurrency as keyof typeof c.prices] || 0).toLocaleString()} {selectedCurrency}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${c.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {c.change >= 0 ? '+' : ''}{c.change}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{c.volume}</td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{c.mcap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Exchange Comparison */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🏦 African Exchanges</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topExchanges.map(ex => (
            <div key={ex.name} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <h3 className="font-bold text-gray-900 dark:text-white">{ex.name}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                <span>{ex.pairs} pairs</span>
                <span>{ex.countries} countries</span>
                <span className={`px-2 py-0.5 rounded text-xs ${ex.type === 'P2P' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'}`}>{ex.type}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
