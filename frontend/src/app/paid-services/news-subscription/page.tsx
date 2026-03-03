'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

// ─── Selectable News Topics ─────────────────────────────
interface NewsTopic {
  id: string;
  icon: string;
  name: string;
  description: string;
  pricePerMonth: number;
  frequency: string;
  sampleHeadlines: string[];
  popular?: boolean;
}

const newsTopics: NewsTopic[] = [
  {
    id: 'top10',
    icon: '🏆',
    name: 'Top 10 Crypto Analysis',
    description: 'Daily editor-picked top 10 stories with in-depth commentary and market impact ratings.',
    pricePerMonth: 5,
    frequency: 'Daily',
    sampleHeadlines: ['BTC Breaks $95K — African Exchange Volumes Surge', 'Top 10 Movers: Week of Feb 24'],
    popular: true,
  },
  {
    id: 'market-outlook',
    icon: '📈',
    name: 'Market Outlook & Forecasts',
    description: 'Weekly and monthly market forecasts, price targets, and trend analysis for African markets.',
    pricePerMonth: 6,
    frequency: 'Weekly + Monthly',
    sampleHeadlines: ['March 2026 Outlook: Bull Flag Forming on BTC/NGN', 'Q2 Forecast: 3 Altcoins Poised for Africa Breakout'],
    popular: true,
  },
  {
    id: 'tax-compliance',
    icon: '📋',
    name: 'Tax & Compliance Updates',
    description: 'Tax law changes, compliance deadlines, and filing guides across Nigeria, Kenya, SA, Ghana.',
    pricePerMonth: 4,
    frequency: 'Bi-weekly',
    sampleHeadlines: ['FIRS Crypto Tax FAQ Updated — Key Changes', 'SA Tax Season: Crypto Reporting Checklist 2026'],
  },
  {
    id: 'regulation',
    icon: '⚖️',
    name: 'Regulation & Policy Alerts',
    description: 'Real-time alerts on central bank decisions, SEC rulings, licensing updates across 14 African nations.',
    pricePerMonth: 5,
    frequency: 'Real-time + Weekly digest',
    sampleHeadlines: ['CBN Issues New Crypto Exchange Guidelines', 'Kenya Passes Digital Asset Bill — Full Analysis'],
    popular: true,
  },
  {
    id: 'defi',
    icon: '🏦',
    name: 'DeFi & Yield Updates',
    description: 'DeFi protocol launches, yield farming opportunities, liquidity mining alerts, and risk analysis.',
    pricePerMonth: 5,
    frequency: 'Daily',
    sampleHeadlines: ['New African DEX Offers 18% APY on Stables', 'DeFi Hack Alert: Protocol X Exploited for $2M'],
  },
  {
    id: 'memecoin',
    icon: '🐸',
    name: 'Memecoin & Trending Tokens',
    description: 'Memecoin surge detection, trending tokens, whale movements, and editor risk ratings.',
    pricePerMonth: 4,
    frequency: 'Daily + Alerts',
    sampleHeadlines: ['Africa-Themed Token Pumps 340% — Our Verdict', 'Whale Alert: $2M Buy of $AFRI Token'],
  },
  {
    id: 'p2p-arb',
    icon: '🔄',
    name: 'P2P & Arbitrage Intel',
    description: 'P2P premium tracking across Luno, Quidax, Binance P2P. Cross-exchange arbitrage opportunities.',
    pricePerMonth: 7,
    frequency: 'Daily',
    sampleHeadlines: ['NGN P2P Premium Hits 4.8% on Luno — Arb Window Open', 'Best P2P Routes This Week: NG → GH → ZA'],
  },
  {
    id: 'nft-web3',
    icon: '🎨',
    name: 'NFTs & Web3',
    description: 'African NFT artists, Web3 gaming, metaverse projects, and digital collectibles coverage.',
    pricePerMonth: 3,
    frequency: 'Weekly',
    sampleHeadlines: ['Nigerian Artist NFT Sells for 8 ETH', 'Top 5 African Web3 Games to Watch in 2026'],
  },
  {
    id: 'mobile-fintech',
    icon: '📱',
    name: 'Mobile Money & Fintech',
    description: 'M-Pesa, Orange Money, MTN Money integration with crypto. Fintech partnerships and launches.',
    pricePerMonth: 4,
    frequency: 'Bi-weekly',
    sampleHeadlines: ['M-Pesa Now Supports Direct USDT Purchases', 'Flutterwave Integrates Crypto Payments'],
  },
  {
    id: 'whale',
    icon: '🐋',
    name: 'Whale & Institutional Moves',
    description: 'Large wallet movements, institutional buying/selling, exchange inflow/outflow tracking.',
    pricePerMonth: 8,
    frequency: 'Real-time alerts',
    sampleHeadlines: ['$50M BTC Moved to Coinbase — Sell Pressure?', 'African Hedge Fund Accumulates 500 ETH'],
  },
  {
    id: 'macro',
    icon: '🌍',
    name: 'African Macro & FX',
    description: 'Currency devaluations, central bank rate decisions, inflation data, and macro impact on crypto.',
    pricePerMonth: 5,
    frequency: 'Weekly + breaking alerts',
    sampleHeadlines: ['Naira Falls 8% — Crypto Demand Spikes', 'ECO Currency Update: ECOWAS Timeline Shifts'],
  },
  {
    id: 'startup',
    icon: '🚀',
    name: 'Crypto Startup & Funding',
    description: 'African crypto startup funding rounds, accelerator picks, M&A news, and founder interviews.',
    pricePerMonth: 3,
    frequency: 'Weekly',
    sampleHeadlines: ['Kenyan DeFi Startup Raises $12M Series A', 'Top 10 African Crypto Startups to Watch'],
  },
];

const BASE_PRICE = 5;

// ─── Bundled Plans ──────────────────────────────────────
const plans = [
  {
    name: 'Essential',
    price: 19,
    period: '/month',
    annualPrice: 15,
    badge: null,
    description: 'Stay informed with editor-curated daily news that matters to your portfolio',
    includedTopics: ['top10', 'market-outlook', 'regulation'],
    features: [
      'Daily curated news digest (email)',
      'Editor-picked top 10 stories each day',
      'African market morning brief',
      'Weekend roundup newsletter',
      'Early access to breaking news (30 min ahead)',
      'Ad-free reading experience',
      'Bookmark & save articles',
      'Monthly trend summary report',
    ],
    excluded: [
      'Real-time push alerts',
      'Sector-specific feeds',
      'Analyst commentary',
      'Archived research library',
    ],
    cta: 'Subscribe Now →',
    highlight: false,
  },
  {
    name: 'Professional',
    price: 49,
    period: '/month',
    annualPrice: 39,
    badge: 'Best Value',
    description: 'Deep curated intelligence for serious traders and fund managers',
    includedTopics: ['top10', 'market-outlook', 'regulation', 'tax-compliance', 'defi', 'p2p-arb', 'memecoin', 'whale'],
    features: [
      'Everything in Essential plan',
      'Real-time push notifications for breaking news',
      'Sector-specific feeds (DeFi, NFT, Memecoin, Regulation)',
      'Analyst commentary on top stories',
      'Exclusive interviews with African crypto leaders',
      'Weekly deep-dive analysis articles',
      'Personalized news feed algorithm',
      'Access to archived research library (2+ years)',
      'Priority access to live events & AMAs',
      'Export & share curated briefings (PDF)',
    ],
    excluded: [
      'Custom news feed API',
      'White-label newsletter',
    ],
    cta: 'Go Professional →',
    highlight: true,
  },
  {
    name: 'Institutional',
    price: 199,
    period: '/month',
    annualPrice: 159,
    badge: 'Premium',
    description: 'White-glove news curation for institutions and teams',
    includedTopics: newsTopics.map(t => t.id),
    features: [
      'Everything in Professional plan',
      'All 12 news topics included',
      'Custom news feed via API',
      'White-label newsletter for your firm',
      'Dedicated editor for your content preferences',
      'Multi-seat team access (up to 25 users)',
      'Custom regulatory tracking by jurisdiction',
      'Board-ready news briefing templates',
      'Competitor intelligence monitoring',
      'Direct line to CoinDaily editorial team',
      'Quarterly trend forecast reports',
      'Compliance-ready audit trail for news sources',
    ],
    excluded: [],
    cta: 'Contact Sales →',
    highlight: false,
  },
];

const whySubscribe = [
  { icon: '✋', title: 'Editor Hand-Picked', desc: 'No algorithms. Our experienced editors personally select every story that reaches your inbox.' },
  { icon: '⏰', title: 'Early Access', desc: 'Get breaking news 30 minutes before it goes public. In crypto, minutes matter.' },
  { icon: '🎯', title: 'Africa-First', desc: 'Not just global news repackaged. Deep local coverage of African markets, regulations, and opportunities.' },
  { icon: '🧹', title: 'No Noise', desc: 'We filter thousands of stories daily. You only see what actually matters to your portfolio and interests.' },
  { icon: '📊', title: 'Actionable Intel', desc: 'Every piece comes with context and analysis. Know what a story means for your positions.' },
  { icon: '🔒', title: 'Ad-Free', desc: 'Clean reading experience. No sponsored content mixed in. Pure editorial integrity.' },
];

const sampleDigest = [
  { time: '06:00 AM', tag: 'Breaking', title: 'CBN Reverses Crypto Ban — What It Means for Nigerian Traders', color: 'red' },
  { time: '07:15 AM', tag: 'Markets', title: 'BTC P2P Premium on Luno SA Hits 6-Month High at 4.8%', color: 'blue' },
  { time: '08:30 AM', tag: 'DeFi', title: 'Kenyan DeFi Protocol Raises $12M Series A — Full Breakdown', color: 'green' },
  { time: '10:00 AM', tag: 'Analysis', title: 'Why GHS/USDT Corridor Volume Just 3x-ed This Week', color: 'orange' },
  { time: '12:00 PM', tag: 'Regulation', title: 'South Africa FSCA Licenses 4 New Crypto Exchanges — List Inside', color: 'purple' },
  { time: '02:00 PM', tag: 'Memecoin', title: 'Africa-Themed Memecoin Surges 340% — Editor Analysis & Rating', color: 'yellow' },
];

// ─── Component ──────────────────────────────────────────
export default function NewsSubscriptionPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [activeView, setActiveView] = useState<'bundles' | 'custom'>('custom');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const getPrice = (plan: typeof plans[0]) => {
    return billing === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const selectAllTopics = () => {
    if (selectedTopics.length === newsTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(newsTopics.map(t => t.id));
    }
  };

  const customPrice = useMemo(() => {
    if (selectedTopics.length === 0) return 0;
    const topicsTotal = selectedTopics.reduce((sum, id) => {
      const topic = newsTopics.find(t => t.id === id);
      return sum + (topic?.pricePerMonth || 0);
    }, 0);
    return BASE_PRICE + topicsTotal;
  }, [selectedTopics]);

  const customAnnualPrice = useMemo(() => Math.round(customPrice * 0.8), [customPrice]);
  const displayCustomPrice = billing === 'annual' ? customAnnualPrice : customPrice;

  // Check if a bundle is a better deal
  const bestBundle = useMemo(() => {
    if (selectedTopics.length === 0) return null;
    for (const plan of plans) {
      const planCoversAll = selectedTopics.every(t => plan.includedTopics.includes(t));
      const planPrice = billing === 'annual' ? plan.annualPrice : plan.price;
      if (planCoversAll && planPrice <= displayCustomPrice) {
        return plan;
      }
    }
    return null;
  }, [selectedTopics, displayCustomPrice, billing]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            📰 Premium News Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            CoinDaily News Subscription
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-3">
            Choose the exact news topics you want — or pick a ready-made bundle.
            Only pay for the intelligence that matters to you.
          </p>
          <p className="text-base text-gray-500 max-w-2xl mx-auto mb-6">
            Our editors read thousands of stories daily so you don&apos;t have to. Only the best reach your inbox.
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
          <Link href="/paid-services" className="text-sm text-blue-600 hover:underline">← All Paid Services</Link>
        </div>

        {/* View Toggle: Custom Builder vs Bundles */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white dark:bg-gray-800 rounded-xl shadow p-1 gap-1">
            <button
              onClick={() => setActiveView('custom')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'custom' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              🛠️ Build Your Own Plan
            </button>
            <button
              onClick={() => setActiveView('bundles')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'bundles' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              📦 Ready-Made Bundles
            </button>
          </div>
        </div>

        {/* ═══════════ CUSTOM BUILDER ═══════════ */}
        {activeView === 'custom' && (
          <div className="mb-16">
            {/* Pricing info bar */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">How pricing works</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Base fee of <strong>${BASE_PRICE}/mo</strong> + cost per topic selected ($3–$8/mo each). Select only what you need!</p>
                </div>
              </div>
              <button
                onClick={selectAllTopics}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-700 transition-all"
              >
                {selectedTopics.length === newsTopics.length ? 'Deselect All' : 'Select All Topics'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Topic selection grid — left 2 columns */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {newsTopics.map(topic => {
                    const isSelected = selectedTopics.includes(topic.id);
                    const isExpanded = expandedTopic === topic.id;
                    return (
                      <div
                        key={topic.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 shadow-lg ring-1 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                      >
                        <div className="p-4" onClick={() => toggleTopic(topic.id)}>
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{topic.icon}</span>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{topic.name}</h4>
                                {topic.popular && (
                                  <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-full">Popular</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{topic.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+${topic.pricePerMonth}/mo</span>
                                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{topic.frequency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Expandable sample headlines */}
                        <div className="px-4 pb-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedTopic(isExpanded ? null : topic.id); }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mb-2"
                          >
                            {isExpanded ? '▾ Hide samples' : '▸ Sample headlines'}
                          </button>
                          {isExpanded && (
                            <div className="pb-3 space-y-1">
                              {topic.sampleHeadlines.map((h, i) => (
                                <p key={i} className="text-xs text-gray-600 dark:text-gray-400 pl-3 border-l-2 border-blue-300 dark:border-blue-700">{h}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky pricing summary — right column */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                      <h3 className="font-bold text-lg">Your Custom Plan</h3>
                      <p className="text-blue-100 text-xs mt-1">Select topics from the left to build your plan</p>
                    </div>

                    <div className="p-5">
                      {/* Price breakdown */}
                      {selectedTopics.length > 0 ? (
                        <>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Base fee</span>
                              <span className="text-gray-700 dark:text-gray-300">${BASE_PRICE}/mo</span>
                            </div>
                            {selectedTopics.map(id => {
                              const t = newsTopics.find(nt => nt.id === id);
                              return t ? (
                                <div key={id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 truncate mr-2">{t.icon} {t.name}</span>
                                  <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">+${t.pricePerMonth}</span>
                                </div>
                              ) : null;
                            })}
                            <div className="border-t dark:border-gray-700 pt-2 flex items-center justify-between">
                              <span className="font-bold text-gray-900 dark:text-white">Total</span>
                              <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">${displayCustomPrice}</span>
                                <span className="text-gray-500 text-sm">/mo</span>
                                {billing === 'annual' && (
                                  <p className="text-xs text-gray-400 line-through">${customPrice}/mo</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Better bundle suggestion */}
                          {bestBundle && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                              <p className="text-xs font-bold text-green-800 dark:text-green-300">💡 Save with a bundle!</p>
                              <p className="text-[11px] text-green-700 dark:text-green-400 mt-0.5">
                                The <strong>{bestBundle.name}</strong> plan includes all your selected topics + extras for just <strong>${billing === 'annual' ? bestBundle.annualPrice : bestBundle.price}/mo</strong>.
                              </p>
                              <button
                                onClick={() => setActiveView('bundles')}
                                className="mt-2 text-xs font-bold text-green-700 dark:text-green-300 hover:underline"
                              >
                                View Bundle →
                              </button>
                            </div>
                          )}

                          <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">
                            Subscribe — ${displayCustomPrice}/mo →
                          </button>
                          <p className="text-[10px] text-gray-400 text-center mt-2">14-day free trial · Cancel anytime</p>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-4xl mb-3">👈</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Select at least one topic to see pricing</p>
                          <p className="text-xs text-gray-400 mt-1">Base fee: ${BASE_PRICE}/mo + per-topic pricing</p>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedTopics.length}</p>
                          <p className="text-[10px] text-gray-500">Topics Selected</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{newsTopics.length}</p>
                          <p className="text-[10px] text-gray-500">Available</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick bundle comparison */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mt-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Or choose a bundle</p>
                    {plans.map(plan => (
                      <button
                        key={plan.name}
                        onClick={() => setActiveView('bundles')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</span>
                          <span className="text-[10px] text-gray-400">{plan.includedTopics.length} topics</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">${billing === 'annual' ? plan.annualPrice : plan.price}/mo</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ BUNDLED PLANS ═══════════ */}
        {activeView === 'bundles' && (
          <div className="mb-16">
            {/* Upsell to custom */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛠️</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Want only specific topics?</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Build a custom plan starting at ${BASE_PRICE}/mo and only pay for what you read.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('custom')}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all whitespace-nowrap"
              >
                Build Custom Plan →
              </button>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${plan.highlight ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-transparent'} flex flex-col relative`}>
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full ${plan.highlight ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-3xl font-black text-blue-600">${getPrice(plan)}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>

                  {/* Included topics */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Included Topics ({plan.includedTopics.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.includedTopics.map(id => {
                        const t = newsTopics.find(nt => nt.id === id);
                        return t ? (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] rounded-full font-medium">
                            {t.icon} {t.name}
                          </span>
                        ) : null;
                      })}
                    </div>
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
          </div>
        )}

        {/* Sample Daily Digest */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📬 Sample Daily Digest</h3>
          <p className="text-gray-500 text-sm mb-6">Here&apos;s what a typical day in your inbox looks like</p>
          <div className="space-y-3">
            {sampleDigest.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <span className="text-xs text-gray-400 font-mono w-16 flex-shrink-0">{item.time}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  item.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  item.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  item.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  item.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                  item.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>{item.tag}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Subscribe */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Why Subscribe?</h2>
          <p className="text-gray-500 text-center mb-8">What makes CoinDaily News different from free crypto news</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whySubscribe.map(w => (
              <div key={w.title} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <p className="text-3xl mb-3">{w.icon}</p>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{w.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16 text-center max-w-3xl mx-auto">
          <p className="text-lg text-gray-700 dark:text-gray-300 italic mb-4">
            &ldquo;I used to spend 2 hours every morning reading crypto news. CoinDaily&apos;s curated digest gives me everything I need in 10 minutes. As a fund manager, those saved hours are worth more than the subscription.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold">AO</div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white text-sm">Adebayo O.</p>
              <p className="text-gray-500 text-xs">Fund Manager, Lagos</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gray-900 dark:bg-gray-800 rounded-2xl p-10 mb-8">
          <h3 className="text-2xl font-bold text-white mb-3">Never Miss a Story That Matters</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Join traders and institutions who trust CoinDaily editors to keep them ahead of the market.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => { setActiveView('custom'); window.scrollTo(0, 0); }} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">
              Build Your Plan →
            </button>
            <button onClick={() => { setActiveView('bundles'); window.scrollTo(0, 0); }} className="px-8 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all">
              View Bundles
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
