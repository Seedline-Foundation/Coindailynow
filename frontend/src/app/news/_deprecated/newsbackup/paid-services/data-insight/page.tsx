'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const plans = [
  {
    name: 'Trader',
    price: 99,
    period: '/month',
    annualPrice: 79,
    description: 'For active traders looking for reliable signals and market intelligence',
    badge: null,
    features: [
      'Daily trading signals (crypto + forex)',
      'African exchange spread alerts',
      'P2P premium index (8 countries)',
      'Memecoin surge early detection',
      'Mobile push notifications',
      'Basic technical analysis reports',
      'Access to community trading chat',
      'Weekly market summary digest',
    ],
    excluded: [
      'Institutional-grade reports',
      'Custom data feeds',
      'On-chain flow analysis',
      'API access for signals',
    ],
    cta: 'Start Trading Smarter →',
    highlight: false,
    color: 'blue',
  },
  {
    name: 'Analyst',
    price: 299,
    period: '/month',
    annualPrice: 239,
    description: 'For analysts and fund managers needing in-depth research and data',
    badge: 'Most Popular',
    features: [
      'Everything in Trader plan',
      'Daily in-depth market analysis (crypto & fiat)',
      'On-chain flow analysis (BTC, ETH, BNB)',
      'Whale wallet tracking & alerts',
      'Regulatory impact assessments (14 African countries)',
      'Cross-border fund flow intelligence',
      'African stablecoin corridor analysis',
      'Downloadable PDF reports (weekly)',
      'Priority analyst chat support',
      'Custom alert configurations',
    ],
    excluded: [
      'White-label reports',
      'Custom data feeds & API',
      'Dedicated analyst calls',
    ],
    cta: 'Get Deep Insights →',
    highlight: true,
    color: 'orange',
  },
  {
    name: 'Enterprise',
    price: 999,
    period: '/month',
    annualPrice: 799,
    description: 'For banks, enterprises, and high-net-worth individuals requiring premium intelligence',
    badge: 'Premium',
    features: [
      'Everything in Analyst plan',
      'Institutional-grade research reports',
      'Custom data feeds via API',
      'White-label report generation',
      'Dedicated analyst with scheduled calls',
      'Bespoke market research on request',
      'Regulatory compliance intel (real-time)',
      'M&A and investment opportunity briefs',
      'Multi-currency macro analysis (NGN, KES, ZAR, GHS)',
      'Priority access to new datasets',
      'Board-ready presentation templates',
      'Quarterly strategy sessions with CoinDaily analysts',
      'SLA-backed data availability (99.9%)',
    ],
    excluded: [],
    cta: 'Contact Enterprise Sales →',
    highlight: false,
    color: 'purple',
  },
];

const dataAssets = [
  { icon: '📊', title: 'Trading Signals', desc: 'AI-generated buy/sell/hold signals for 500+ crypto assets across African exchanges. Includes confidence scores and time horizons.', plans: 'All plans' },
  { icon: '🐋', title: 'Whale Tracking', desc: 'Real-time monitoring of large wallet movements. Know when whales are accumulating or distributing across African exchanges.', plans: 'Analyst & Enterprise' },
  { icon: '🔗', title: 'On-Chain Analytics', desc: 'Deep on-chain flow analysis for BTC, ETH, BNB. Transaction volume, active addresses, exchange inflows/outflows.', plans: 'Analyst & Enterprise' },
  { icon: '💱', title: 'Fiat-Crypto Corridors', desc: 'In-depth analysis of NGN, KES, ZAR, GHS against major stablecoins. P2P premium trends, remittance flow data.', plans: 'All plans' },
  { icon: '📜', title: 'Regulatory Intelligence', desc: 'Real-time regulatory updates from 14 African countries. Impact assessments on markets and compliance requirements.', plans: 'Analyst & Enterprise' },
  { icon: '🏦', title: 'Institutional Reports', desc: 'Board-ready research reports on African crypto markets. Investment thesis, risk assessments, opportunity briefs.', plans: 'Enterprise only' },
];

const targetAudience = [
  { icon: '📈', title: 'Active Traders', desc: 'Get signals and alerts to make better trading decisions across African crypto markets.' },
  { icon: '🏦', title: 'Banks & Financial Institutions', desc: 'Understand crypto\'s impact on African financial markets. Compliance-ready intelligence.' },
  { icon: '💼', title: 'Fund Managers', desc: 'Institutional-grade research for portfolio allocation decisions in African digital assets.' },
  { icon: '📊', title: 'Data Analysts', desc: 'Rich datasets and APIs for building your own models and dashboards.' },
  { icon: '💎', title: 'High-Net-Worth Individuals', desc: 'Premium intelligence for private investment decisions in African crypto markets.' },
  { icon: '🏢', title: 'Enterprises', desc: 'Strategic market intelligence for corporate crypto adoption and treasury management.' },
];

export default function DataInsightPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [showContact, setShowContact] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price === null || plan.price === 0) return plan.price;
    return billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            📊 Premium Data Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            CoinDaily Data Insight
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-3">
            In-depth analysis of African crypto and fiat markets. Trading signals, whale tracking, on-chain analytics,
            and institutional-grade research — designed to help you make money.
          </p>
          <p className="text-base text-gray-500 max-w-2xl mx-auto mb-6">
            Trusted by traders, fund managers, banks, and high-net-worth individuals across Africa.
          </p>

          {/* Billing Toggle */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map(plan => (
            <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${plan.highlight ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800' : 'border-transparent'} flex flex-col relative`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full ${plan.highlight ? 'bg-orange-500' : 'bg-purple-500'}`}>
                  {plan.badge}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-3xl font-black text-orange-600">${getPrice(plan)}</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
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
              <button onClick={() => plan.name === 'Enterprise' ? setShowContact(true) : null}
                className={`w-full py-3 rounded-xl font-bold transition-all ${plan.highlight ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Data Assets */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">What You Get</h2>
          <p className="text-gray-500 text-center mb-8">Premium datasets and analysis powering your decisions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataAssets.map(d => (
              <div key={d.title} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <p className="text-3xl mb-3">{d.icon}</p>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{d.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{d.desc}</p>
                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">{d.plans}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Who Is This For */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Who Is Data Insight For?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {targetAudience.map(t => (
              <div key={t.title} className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                <p className="text-3xl mb-2">{t.icon}</p>
                <h4 className="font-bold mb-1">{t.title}</h4>
                <p className="text-sm opacity-90">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Report Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📄 Sample Analysis Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Daily Signal — BTC/NGN</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Signal</span><span className="text-green-600 font-bold">BUY</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Confidence</span><span className="text-white font-bold">87%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">P2P Premium (Binance)</span><span className="text-orange-500 font-bold">+3.2%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Whale Activity</span><span className="text-blue-400 font-bold">Accumulating</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time Horizon</span><span className="text-gray-300">24-48h</span></div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <p className="text-gray-500">Analysis: Large BTC inflows to Nigerian exchanges suggest institutional accumulation. CBN policy meeting next week may trigger volatility.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Weekly Corridor Report — KES/USDT</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">7-Day Volume</span><span className="text-white font-bold">$48.2M</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Avg Premium</span><span className="text-yellow-500 font-bold">+1.8%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Trend</span><span className="text-green-500 font-bold">▲ Increasing</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Top Corridor</span><span className="text-gray-300">KES → USDT → NGN</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Risk Level</span><span className="text-yellow-400 font-bold">Medium</span></div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <p className="text-gray-500">Remittance flows via stablecoin corridors continue to grow. M-Pesa on/off-ramp volume up 23% week-over-week.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gray-900 dark:bg-gray-800 rounded-2xl p-10 mb-8">
          <h3 className="text-2xl font-bold text-white mb-3">Stop Guessing. Start Knowing.</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">Join hundreds of traders, analysts, and institutions using CoinDaily Data Insight to make informed decisions in Africa&apos;s crypto markets.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg">
              Start Free Trial (7 Days) →
            </button>
            <button onClick={() => setShowContact(true)} className="px-8 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all">
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </main>

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Contact Enterprise Sales</h3>
              <button onClick={() => setShowContact(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
                <input type="text" required className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Email *</label>
                <input type="email" required className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Use Case *</label>
                <textarea required rows={3} placeholder="Tell us about your data needs..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700">
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
