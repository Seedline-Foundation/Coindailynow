'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';
import { COMPARISON_ITEMS } from '@/data/blog-articles';

const FEATURES = [
  { key: 'africanCoverage', label: 'African Market Coverage', description: 'Dedicated coverage of crypto in African countries' },
  { key: 'languages', label: 'African Languages', description: 'Number of African languages supported' },
  { key: 'aiPowered', label: 'AI-Powered Content', description: 'Uses AI for content generation and analysis' },
  { key: 'realTimeData', label: 'Real-Time Market Data', description: 'Live price feeds and market alerts' },
  { key: 'mobileMoneyIntegration', label: 'Mobile Money Coverage', description: 'Coverage of M-Pesa, MTN Money, etc.' },
  { key: 'communityFeatures', label: 'Community Features', description: 'Forums, discussions, and social features' },
  { key: 'freeAccess', label: 'Free Access', description: 'Core content available for free' },
] as const;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : star - 0.5 <= rating ? 'text-yellow-300' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ComparisonPageClient() {
  const coindaily = COMPARISON_ITEMS.find(c => c.name === 'CoinDaily')!;
  const others = COMPARISON_ITEMS.filter(c => c.name !== 'CoinDaily');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-800">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-800">Blog</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Platform Comparison</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide mb-4">
            Comparison
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Best Crypto News Platforms for <span className="text-orange-400">Africa</span> (2025)
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            An unbiased side-by-side comparison of the top cryptocurrency news platforms
            serving the African market. Find which one best fits your needs.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Platform Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-16">
          {[coindaily, ...others].map((platform, idx) => (
            <div
              key={platform.name}
              className={`bg-white rounded-2xl p-6 border-2 transition ${
                idx === 0
                  ? 'border-orange-500 shadow-lg shadow-orange-500/10 relative'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {idx === 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                    #1 Recommended
                  </span>
                </div>
              )}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{platform.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{platform.tagline}</p>
              </div>
              <StarRating rating={platform.rating} />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pricing</span>
                  <span className="font-medium text-gray-800">{platform.pricing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Founded</span>
                  <span className="font-medium text-gray-800">{platform.founded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Languages</span>
                  <span className="font-medium text-gray-800">{platform.languages}</span>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pros</h4>
                <ul className="space-y-1">
                  {platform.pros.slice(0, 3).map((pro, j) => (
                    <li key={j} className="flex items-start gap-1 text-xs text-green-700">
                      <span className="mt-0.5">✓</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Cons</h4>
                <ul className="space-y-1">
                  {platform.cons.slice(0, 2).map((con, j) => (
                    <li key={j} className="flex items-start gap-1 text-xs text-red-600">
                      <span className="mt-0.5">✗</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
              {platform.url && (
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 block text-center py-2 rounded-lg text-sm font-semibold transition ${
                    idx === 0
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Visit {platform.name}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Feature-by-Feature Comparison</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Feature</th>
                    {[coindaily, ...others].map((p, idx) => (
                      <th key={p.name} className={`py-4 px-4 font-semibold text-center ${idx === 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-700'}`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((feature, i) => (
                    <tr key={feature.key} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-gray-800">{feature.label}</div>
                        <div className="text-xs text-gray-400">{feature.description}</div>
                      </td>
                      {[coindaily, ...others].map((p, idx) => {
                        const val = (p.features as Record<string, any>)[feature.key];
                        return (
                          <td key={p.name} className={`py-3.5 px-4 text-center ${idx === 0 ? 'bg-orange-50/50' : ''}`}>
                            {typeof val === 'boolean' ? (
                              val ? (
                                <span className="text-green-500 text-lg">✓</span>
                              ) : (
                                <span className="text-red-400 text-lg">✗</span>
                              )
                            ) : (
                              <span className="font-medium text-gray-700">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="py-4 px-6 font-bold text-gray-800">Overall Rating</td>
                    {[coindaily, ...others].map((p, idx) => (
                      <td key={p.name} className={`py-4 px-4 text-center font-bold ${idx === 0 ? 'text-orange-600 bg-orange-50 text-lg' : 'text-gray-700'}`}>
                        {p.rating.toFixed(1)}/5.0
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why CoinDaily Section */}
        <section className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 md:p-12 text-white text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Why CoinDaily Leads for African Crypto News</h2>
          <p className="text-orange-100 max-w-2xl mx-auto mb-6">
            CoinDaily is the only platform built from the ground up for Africa&apos;s crypto community.
            With 15+ African language support, coverage of local exchanges like Luno and Quidax,
            mobile money integration tracking, and AI-powered content — no other platform comes close.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition">
              Explore CoinDaily →
            </Link>
            <Link href="/blog" className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition">
              Read Our Blog
            </Link>
          </div>
        </section>

        {/* Detailed Reviews */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Detailed Platform Reviews</h2>
          <div className="space-y-6">
            {[coindaily, ...others].map((platform, idx) => (
              <div key={platform.name} className={`bg-white rounded-xl p-6 md:p-8 border ${idx === 0 ? 'border-orange-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{platform.name}</h3>
                    <p className="text-gray-500">{platform.tagline}</p>
                  </div>
                  <StarRating rating={platform.rating} />
                </div>
                <p className="text-gray-700 mb-4">{platform.review}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                    <ul className="space-y-1">
                      {platform.pros.map((pro, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500">✓</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Cons</h4>
                    <ul className="space-y-1">
                      {platform.cons.map((con, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-500">✗</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>Founded: {platform.founded}</span>
                  <span>·</span>
                  <span>Pricing: {platform.pricing}</span>
                  <span>·</span>
                  <span>Coverage: {platform.coverage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Best Cryptocurrency News Platforms in Africa 2025 – Comparison',
            description: 'Compare Africa\'s top crypto news platforms side-by-side.',
            url: 'https://sygn.live/blog/comparison',
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: [coindaily, ...others].map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'WebSite',
                  name: p.name,
                  url: p.url,
                  description: p.tagline,
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: p.rating,
                    bestRating: 5,
                    worstRating: 1,
                    ratingCount: 1,
                  },
                },
              })),
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sygn.live' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://sygn.live/blog' },
                { '@type': 'ListItem', position: 3, name: 'Comparison', item: 'https://sygn.live/blog/comparison' },
              ],
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
}
