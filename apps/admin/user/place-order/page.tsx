'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Newspaper,
  BarChart3,
  Globe,
  Megaphone,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react';

/* ── Service catalogue ─────────────────────────────────────── */

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'subscription' | 'content' | 'advertising' | 'analytics' | 'other';
  prices: { label: string; amount: number; period?: string }[];
  features: string[];
  popular?: boolean;
}

const SERVICES: Service[] = [
  {
    id: 'premium-news',
    name: 'Premium News Access',
    description: 'Unlock exclusive articles, deep-dive reports, and premium market analysis from our expert editors.',
    icon: <Newspaper className="w-6 h-6" />,
    category: 'subscription',
    prices: [
      { label: 'Monthly', amount: 9.99, period: '/mo' },
      { label: 'Yearly', amount: 89.99, period: '/yr' },
    ],
    features: ['Unlimited premium articles', 'Early access to reports', 'Ad-free reading', 'Priority newsletter'],
    popular: true,
  },
  {
    id: 'pro-analytics',
    name: 'Pro Analytics Suite',
    description: 'Advanced charts, whale tracking, memecoin surge alerts, and African exchange data in real-time.',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'analytics',
    prices: [
      { label: 'Monthly', amount: 19.99, period: '/mo' },
      { label: 'Yearly', amount: 179.99, period: '/yr' },
    ],
    features: ['Real-time whale alerts', 'Memecoin surge detection', 'African exchange data', 'Custom watchlists', 'API access'],
  },
  {
    id: 'sponsored-article',
    name: 'Sponsored Article',
    description: 'Publish a branded article on CoinDaily reaching our 500k+ monthly African crypto audience.',
    icon: <Megaphone className="w-6 h-6" />,
    category: 'advertising',
    prices: [
      { label: 'Standard', amount: 299 },
      { label: 'Featured (homepage)', amount: 599 },
    ],
    features: ['Written by our AI + editors', 'SEO optimized', 'Social media promotion', '30-day placement'],
  },
  {
    id: 'banner-ad',
    name: 'Banner Advertising',
    description: 'Display your ads across CoinDaily pages with geo-targeting for African markets.',
    icon: <Zap className="w-6 h-6" />,
    category: 'advertising',
    prices: [
      { label: '1 Week', amount: 49 },
      { label: '1 Month', amount: 149 },
      { label: '3 Months', amount: 349 },
    ],
    features: ['Country-level targeting', 'Mobile & desktop', 'Real-time impressions', 'Click analytics dashboard'],
  },
  {
    id: 'translation-pack',
    name: 'Translation Pack',
    description: 'Translate your content into 15 African languages with cultural context and crypto glossary.',
    icon: <Globe className="w-6 h-6" />,
    category: 'content',
    prices: [
      { label: 'Per Article (up to 5 langs)', amount: 29 },
      { label: 'Bulk 10 Articles', amount: 199 },
    ],
    features: ['15 African languages', 'Crypto-specific glossary', 'Cultural localisation', 'Human QA review'],
  },
  {
    id: 'ai-report',
    name: 'Custom AI Market Report',
    description: 'Get a personalised AI-generated market report for any token, sector, or African market trend.',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'analytics',
    prices: [
      { label: 'Single Report', amount: 14.99 },
      { label: '5-Report Bundle', amount: 49.99 },
    ],
    features: ['GPT-4 + Gemini analysis', 'African market focus', 'PDF + web version', 'Delivered in 24h'],
  },
  {
    id: 'verification-badge',
    name: 'Verified Creator Badge',
    description: 'Get a verified badge on your CoinDaily profile. Builds trust with the community.',
    icon: <Shield className="w-6 h-6" />,
    category: 'other',
    prices: [{ label: 'One-time', amount: 4.99 }],
    features: ['Profile badge', 'Priority support', 'Community trust signal', 'Comment highlighting'],
  },
  {
    id: 'boost-listing',
    name: 'Marketplace Boost',
    description: 'Boost your marketplace listing to the top of search results and category pages.',
    icon: <Star className="w-6 h-6" />,
    category: 'other',
    prices: [
      { label: '7 Days', amount: 9.99 },
      { label: '30 Days', amount: 29.99 },
    ],
    features: ['Top-of-search placement', 'Featured badge', 'Higher visibility', 'Analytics included'],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Services' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'content', label: 'Content' },
  { key: 'advertising', label: 'Advertising' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'other', label: 'Other' },
];

/* ── Page component ────────────────────────────────────────── */

export default function PlaceOrderPage() {
  const [category, setCategory] = useState('all');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<Record<string, number>>({});
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const filtered = category === 'all'
    ? SERVICES
    : SERVICES.filter((s) => s.category === category);

  function handleOrder(serviceId: string) {
    // In production this would call a payment API; for now show confirmation
    setOrderSuccess(serviceId);
    setTimeout(() => setOrderSuccess(null), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary-500" />
          Place Order
        </h1>
        <p className="text-dark-400 mt-1">Browse and purchase CoinDaily paid services directly from your dashboard.</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat.key
                ? 'bg-primary-500 text-dark-950'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((service) => {
          const isOpen = selectedService === service.id;
          const priceIdx = selectedPrice[service.id] ?? 0;
          const price = service.prices[priceIdx];

          return (
            <div
              key={service.id}
              className={`relative bg-dark-900 border rounded-2xl p-6 transition-all ${
                isOpen ? 'border-primary-500 ring-1 ring-primary-500/30' : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              {service.popular && (
                <span className="absolute -top-2.5 right-4 bg-primary-500 text-dark-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Popular
                </span>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                  {service.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">{service.name}</h3>
                  <p className="mt-1 text-xs text-dark-400 leading-relaxed">{service.description}</p>
                </div>
              </div>

              {/* Price selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                {service.prices.map((p, idx) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setSelectedPrice((prev) => ({ ...prev, [service.id]: idx }));
                      setSelectedService(service.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      priceIdx === idx && isOpen
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-700 bg-dark-800 text-dark-300 hover:border-dark-500'
                    }`}
                  >
                    {p.label}
                    <span className="ml-1 font-bold text-white">${p.amount}</span>
                    {p.period && <span className="text-dark-500">{p.period}</span>}
                  </button>
                ))}
              </div>

              {/* Features */}
              <ul className="space-y-1.5 mb-5">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-dark-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Order button */}
              {orderSuccess === service.id ? (
                <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Order placed!
                </div>
              ) : (
                <button
                  onClick={() => handleOrder(service.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-dark-950 text-sm font-semibold transition-colors"
                >
                  Order — ${price?.amount ?? service.prices[0].amount}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Help callout */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 flex items-start gap-4">
        <Clock className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">Need a custom package?</p>
          <p className="text-xs text-dark-400 mt-1">
            Contact our team for enterprise pricing, bulk discounts, or bespoke services.{' '}
            <Link href="/user/tickets" className="text-primary-400 hover:text-primary-300 underline">
              Open a support ticket
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
