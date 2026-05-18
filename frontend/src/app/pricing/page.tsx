'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

interface PricingTier {
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  slug: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'FREE',
    slug: 'free',
    price: '$0',
    priceNote: 'forever',
    description: 'Essential crypto and finance news for Africa. No credit card required.',
    features: [
      'Unlimited news articles',
      'Real-time crypto price data',
      'Exchange rate calculator',
      'P2P premium tracker',
      'Tax calculator tool',
      'Remittance calculator',
      'On-ramp aggregator',
      'Scam watch alerts',
      'Regulatory tracker (read-only)',
      '100 API requests/day',
    ],
    cta: 'Get Started Free',
    ctaHref: '/auth/register',
  },
  {
    name: 'Pro',
    tier: 'PREMIUM',
    slug: 'pro',
    price: '$29',
    priceNote: '/month',
    description: 'For investors, traders, and professionals who need deeper market intelligence.',
    features: [
      'Everything in Free',
      'AI-powered content creation studio',
      'Advanced market data & charts',
      'Factsheet access (20+ entities)',
      'Daily morning brief newsletter',
      'Markets-close newsletter',
      'Weekend deep-dive digest',
      'Priority article access',
      'Ad-free reading experience',
      'Portfolio tracker (read-only)',
      '10,000 API requests/day',
      'Email + chat support',
    ],
    cta: 'Start 14-Day Free Trial',
    ctaHref: '/auth/register?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    tier: 'ENTERPRISE',
    slug: 'enterprise',
    price: 'Custom',
    priceNote: 'contact us',
    description: 'For funds, institutions, and fintechs that need African market data at scale.',
    features: [
      'Everything in Pro',
      'Dedicated API access (unlimited)',
      'Custom data feeds',
      'Real-time WebSocket market data',
      'Regulatory change alerts',
      'Branded indices access',
      'White-label news widget',
      'Custom research reports',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'Invoice billing (NET-30)',
      'SSO / SAML integration',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:enterprise@coindaily.online?subject=Enterprise%20Inquiry',
  },
];

const faqs = [
  {
    q: 'Can I pay with local African currencies?',
    a: 'Yes. We accept payments via YellowCard in NGN, KES, ZAR, and GHS. International users can pay with crypto via ChangeNOW or standard card payment.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes, Pro comes with a 14-day free trial. No credit card required to start. Cancel anytime during the trial at no cost.',
  },
  {
    q: 'What does the API include?',
    a: 'The CoinDaily API provides access to market data, article search, regulatory data, and exchange rates. Free tier gets 100 requests/day, Pro gets 10,000, Enterprise gets unlimited.',
  },
  {
    q: 'Can I switch plans or cancel anytime?',
    a: 'Absolutely. Upgrade, downgrade, or cancel at any time from your account settings. No long-term contracts.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            From free market data to institutional-grade intelligence.
            Choose the plan that fits your needs.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annual <span className="text-green-400 text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const displayPrice =
              tier.slug === 'pro' && billingCycle === 'annual' ? '$23' : tier.price;
            const displayNote =
              tier.slug === 'pro' && billingCycle === 'annual'
                ? '/month (billed annually)'
                : tier.priceNote;

            return (
              <div
                key={tier.slug}
                className={`relative bg-white rounded-2xl shadow-sm border ${
                  tier.highlighted
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-200'
                } p-8 flex flex-col`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
                    <span className="text-sm text-gray-500">{displayNote}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{tier.description}</p>
                </div>

                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {tier.ctaHref.startsWith('mailto:') ? (
                    <a
                      href={tier.ctaHref}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                        tier.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <Link
                      href={tier.ctaHref}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                        tier.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison callout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gray-900 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Built for African markets
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            CoinDaily is the only financial data platform designed specifically for
            Nigeria, Kenya, South Africa, Ghana, and the broader African diaspora.
            Local payment methods, local market data, local regulatory coverage.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { stat: '4+', label: 'African Markets' },
              { stat: '5', label: 'Languages' },
              { stat: '24/7', label: 'Market Coverage' },
              { stat: '< 800ms', label: 'API Response' },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-bold text-white">{item.stat}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">{faq.q}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
