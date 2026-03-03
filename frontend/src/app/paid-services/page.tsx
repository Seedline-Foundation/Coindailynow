'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const services = [
  {
    icon: '👑',
    title: 'Membership Plans',
    description: 'Free, Pro ($29/mo), and Enterprise ($199/mo) tiers with premium regulatory intelligence, risk scores, and expert analysis.',
    href: '/membership',
    cta: 'View Plans',
    highlight: 'Most Popular',
    priceFrom: 'Free – $199/mo',
  },
  {
    icon: '📢',
    title: 'Advertising & Media',
    description: '8 ad formats including banners, sponsored articles, press releases, newsletter sponsorships, and homepage takeovers.',
    href: '/paid-services/advertise',
    cta: 'View Ad Rates',
    priceFrom: '$499 – $3,999/mo',
  },
  {
    icon: '🔌',
    title: 'API & Data Feeds',
    description: 'Real-time African exchange rates, P2P premiums, on-chain analytics, and whale tracking via our REST & WebSocket APIs.',
    href: '/paid-services/api',
    cta: 'View API Plans',
    priceFrom: 'Free – $199/mo',
  },
  {
    icon: '🛒',
    title: 'Digital Marketplace',
    description: 'Premium reports, courses, digital tools, tax calculators, surge alerts, portfolio trackers, and CoinDaily merchandise.',
    href: '/paid-services/marketplace',
    cta: 'Browse Shop',
    priceFrom: '$4.99 – $299',
  },
  {
    icon: '📝',
    title: 'Sponsored Content',
    description: 'Press releases, sponsored articles, and thought leadership campaigns distributed to 1.2M+ monthly readers across Africa.',
    href: '/paid-services/sponsored-content',
    cta: 'Get Published',
    priceFrom: '$350 – $1,200',
  },
  {
    icon: '🤝',
    title: 'Affiliate Program',
    description: 'Earn 20–30% recurring commissions promoting CoinDaily products. Payouts via USDT, BTC, M-Pesa, or bank transfer.',
    href: '/paid-services/affiliate',
    cta: 'Join Program',
    priceFrom: '20–30% commission',
  },
  {
    icon: '📊',
    title: 'Premium Regulation Data',
    description: 'Deep analysis of crypto regulations across 14 African countries with compliance ratings, risk scores, and expert commentary.',
    href: '/regulation/premium',
    cta: 'View Premium',
    priceFrom: 'Included with Pro',
  },
  {
    icon: '💱',
    title: 'P2P Premium Index',
    description: 'Real-time P2P premium tracking across African exchanges with arbitrage analysis and on/off-ramp data.',
    href: '/tools/p2p-premium',
    cta: 'View Tool',
    priceFrom: 'Included with Pro',
  },
];

const stats = [
  { label: 'Monthly Readers', value: '1.2M+' },
  { label: 'African Countries', value: '14' },
  { label: 'Languages Supported', value: '18' },
  { label: 'Active API Users', value: '2,400+' },
];

export default function PaidServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            💼 CoinDaily Paid Services
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Grow with Africa&apos;s #1 Crypto Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Subscriptions, advertising, APIs, digital products, sponsored content, and partner programs —
            everything to help you reach and serve Africa&apos;s crypto community.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
              <p className="text-2xl font-black text-orange-600">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {services.map((svc) => (
            <Link
              key={svc.title}
              href={svc.href}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all p-6 flex flex-col border-2 border-transparent hover:border-orange-400"
            >
              <div className="flex items-start gap-4 mb-3">
                <span className="text-3xl">{svc.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                      {svc.title}
                    </h2>
                    {svc.highlight && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full">
                        {svc.highlight}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">{svc.priceFrom}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{svc.description}</p>
              <span className="inline-flex items-center text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                {svc.cta} →
              </span>
            </Link>
          ))}
        </div>

        {/* Custom / Enterprise CTA */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-8 md:p-12 text-center text-white mb-12">
          <h2 className="text-3xl font-black mb-4">Need a Custom Package?</h2>
          <p className="text-orange-100 max-w-2xl mx-auto mb-6">
            We work with Africa&apos;s top exchanges, fintechs, and blockchain projects. Let us put together a bespoke
            advertising, API, or content package that fits your goals and budget.
          </p>
          <a href="mailto:sales@coindaily.africa" className="inline-block px-8 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all">
            Contact Sales — sales@coindaily.africa
          </a>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Common Questions</h2>
          <div className="text-left space-y-4">
            {[
              { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, PayPal, bank transfers, M-Pesa, Orange Money, and crypto (BTC, ETH, USDT).' },
              { q: 'Can I upgrade or switch plans anytime?', a: 'Yes. You can upgrade, downgrade, or switch any subscription at any time. The prorated difference is applied to your next billing cycle.' },
              { q: 'Do you offer discounts for African startups?', a: 'Absolutely. We have special pricing for early-stage African crypto companies. Contact sales@coindaily.africa for startup rates.' },
              { q: 'Is there an annual billing discount?', a: 'Yes, most subscriptions offer 20% off when billed annually. Check individual pricing pages for details.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">{faq.q}</summary>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
