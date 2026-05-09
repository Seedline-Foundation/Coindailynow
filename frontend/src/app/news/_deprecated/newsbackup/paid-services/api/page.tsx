'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const apiPlans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'For hobbyists and small personal projects',
    rateLimit: '100 requests/day',
    features: [
      '100 API calls per day',
      'Live prices for 50+ coins',
      'African exchange rates (15-min delay)',
      'Basic market data (BTC, ETH, USDT)',
      'JSON response format',
      'Community support',
    ],
    excluded: [
      'Real-time WebSocket feeds',
      'Historical data access',
      'On-chain analytics',
      'Premium endpoints',
      'Priority support',
    ],
    cta: 'Get Free API Key',
    highlight: false,
  },
  {
    name: 'Developer',
    price: 49,
    period: '/month',
    annualPrice: 39,
    description: 'For developers building African crypto apps and bots',
    rateLimit: '10,000 requests/day',
    features: [
      '10,000 API calls per day',
      'Live prices for 500+ coins',
      'Real-time African exchange rates',
      'P2P premium data (12 exchanges)',
      'Historical price data (1 year)',
      'NFT floor prices (African collections)',
      'WebSocket real-time feeds',
      'JSON + CSV response formats',
      'Email support (24h response)',
    ],
    excluded: [
      'On-chain analytics',
      'Whale tracking alerts',
      'Custom endpoints',
      'SLA guarantees',
    ],
    cta: 'Start Building →',
    highlight: true,
  },
  {
    name: 'Business',
    price: 199,
    period: '/month',
    annualPrice: 159,
    description: 'For exchanges, fintech apps, and trading platforms',
    rateLimit: '100,000 requests/day',
    features: [
      '100,000 API calls per day',
      'All Developer features',
      'On-chain analytics (BTC, ETH, BNB)',
      'Whale transaction tracking',
      'Memecoin surge detection',
      'Regulatory data API (14 countries)',
      'Historical data (5 years)',
      'Custom webhook alerts',
      'Dedicated API subdomain',
      'Priority support (4h response)',
      '99.9% uptime SLA',
    ],
    excluded: [
      'White-label data feeds',
      'Custom endpoints',
    ],
    cta: 'Contact Sales →',
    highlight: false,
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    description: 'For institutional clients, exchanges, and data providers',
    rateLimit: 'Unlimited',
    features: [
      'Unlimited API calls',
      'All Business features',
      'White-label data feeds',
      'Custom endpoint development',
      'Dedicated infrastructure',
      'Real-time on-chain analytics',
      'AI-powered market signals',
      'Multi-region deployment',
      'SSO / OAuth integration',
      'Dedicated account manager',
      '99.99% uptime SLA',
      'Custom data retention',
      'Quarterly strategy reviews',
    ],
    excluded: [],
    cta: 'Contact Enterprise Sales →',
    highlight: false,
  },
];

const endpoints = [
  { method: 'GET', path: '/v1/prices', description: 'Live cryptocurrency prices across African exchanges', free: true },
  { method: 'GET', path: '/v1/prices/history', description: 'Historical price data with OHLCV', free: false },
  { method: 'GET', path: '/v1/exchanges/rates', description: 'Real-time rates from 12+ African exchanges', free: true },
  { method: 'GET', path: '/v1/p2p/premiums', description: 'P2P premium index across 8 countries', free: false },
  { method: 'GET', path: '/v1/regulations/:country', description: 'Regulatory data for African countries', free: false },
  { method: 'GET', path: '/v1/onchain/whale-alerts', description: 'Whale transaction monitoring', free: false },
  { method: 'GET', path: '/v1/memecoin/surges', description: 'Real-time memecoin surge detection', free: false },
  { method: 'GET', path: '/v1/news/feed', description: 'Curated African crypto news feed', free: true },
  { method: 'WS', path: '/v1/ws/prices', description: 'WebSocket real-time price stream', free: false },
  { method: 'GET', path: '/v1/nft/floors', description: 'NFT collection floor prices', free: false },
];

export default function ApiPricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const getPrice = (plan: typeof apiPlans[0]) => {
    if (plan.price === null || plan.price === 0) return plan.price;
    return billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            🔌 API Access
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            CoinDaily API
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Integrate real-time African crypto market data into your applications. REST API and WebSocket feeds
            for exchanges, fintech apps, and trading bots.
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-sm ${billing === 'monthly' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`w-12 h-6 rounded-full transition-all ${billing === 'annual' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${billing === 'annual' ? 'left-6' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm ${billing === 'annual' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>Annual</span>
            {billing === 'annual' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Save 20%</span>}
          </div>
          <Link href="/paid-services" className="text-sm text-orange-600 hover:underline">← All Paid Services</Link>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {apiPlans.map(plan => (
            <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-transparent'} flex flex-col relative`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 my-3">
                {plan.price === null ? (
                  <span className="text-3xl font-black text-gray-900 dark:text-white">Custom</span>
                ) : plan.price === 0 ? (
                  <span className="text-3xl font-black text-green-600">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-black text-blue-600">${getPrice(plan)}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{plan.description}</p>
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 mb-4 text-center">
                {plan.rateLimit}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
                {plan.excluded.map((f, i) => (
                  <li key={`x-${i}`} className="flex items-start gap-2 text-sm text-gray-400 line-through">
                    <span className="text-gray-300 mt-0.5 flex-shrink-0">✗</span>{f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* API Endpoints Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📡 API Endpoints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Method</th>
                  <th className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Endpoint</th>
                  <th className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Description</th>
                  <th className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium text-center">Free</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {endpoints.map((ep, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : ep.method === 'WS' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-900 dark:text-white text-xs">{ep.path}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{ep.description}</td>
                    <td className="py-3 px-4 text-center">{ep.free ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-400">Paid</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 mb-12 text-white">
          <h3 className="text-lg font-bold mb-4">Quick Start Example</h3>
          <pre className="text-sm overflow-x-auto text-green-400"><code>{`// Fetch live BTC price across African exchanges
const response = await fetch('https://api.coindaily.africa/v1/prices?coin=BTC', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

const data = await response.json();
// {
//   "coin": "BTC",
//   "prices": {
//     "binance_p2p_ngn": 95420000,
//     "luno_zar": 1823400,
//     "quidax_ngn": 95180000,
//     "yellow_card_ghs": 834200
//   },
//   "timestamp": "2026-02-26T12:00:00Z"
// }`}</code></pre>
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🏦', title: 'Exchanges', desc: 'Power your exchange with real-time African market data, P2P premium calculations, and regulatory compliance feeds.' },
            { icon: '📱', title: 'Fintech Apps', desc: 'Embed crypto prices, exchange rate comparisons, and on-ramp data directly into your African fintech application.' },
            { icon: '🤖', title: 'Trading Bots', desc: 'Build arbitrage bots that exploit P2P premiums across African markets using our real-time WebSocket feeds.' },
          ].map(uc => (
            <div key={uc.title} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center">
              <p className="text-4xl mb-3">{uc.icon}</p>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">{uc.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{uc.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
