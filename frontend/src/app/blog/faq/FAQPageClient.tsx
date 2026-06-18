'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';
import { FAQ_ITEMS, type FAQItem } from '@/data/blog-articles';

const CATEGORIES = ['All', ...Array.from(new Set(FAQ_ITEMS.map(f => f.category)))];

const CATEGORY_ICONS: Record<string, string> = {
  'Getting Started': '🚀',
  'Exchanges & Trading': '📊',
  'Regulations & Taxes': '⚖️',
  'Security': '🔒',
  'DeFi & Advanced': '🏦',
  'African Market': '🌍',
};

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${isOpen ? 'border-orange-300 shadow-md shadow-orange-500/10' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{CATEGORY_ICONS[item.category] || '❓'}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm md:text-base">{item.question}</h3>
            <span className="text-xs text-orange-500">{item.category}</span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
          <p className="whitespace-pre-line">{item.answer}</p>
          {item.relatedArticles && item.relatedArticles.length > 0 && (
            <Link
              href={item.relatedArticles[0]}
              className="inline-block mt-3 text-orange-600 text-xs font-semibold hover:text-orange-800"
            >
              📖 Read full guide →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function FAQPageClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter(f => {
      const matchCat = activeCategory === 'All' || f.category === activeCategory;
      const matchSearch = !searchQuery ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const groupedFAQs = useMemo(() => {
    if (activeCategory !== 'All') return { [activeCategory]: filteredFAQs };
    const groups: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, [filteredFAQs, activeCategory]);

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
            <span className="text-gray-800 font-medium">FAQ</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide mb-4">
            FAQ
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Cryptocurrency <span className="text-orange-400">FAQ</span> for Africa
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            All your cryptocurrency questions answered — specifically for the African market.
            From buying your first Bitcoin to understanding DeFi.
          </p>
          {/* Search */}
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenIdx(null); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat !== 'All' && <span>{CATEGORY_ICONS[cat] || '❓'}</span>}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-sm text-gray-500 mb-6">
          {filteredFAQs.length} questions found
        </div>

        {Object.keys(groupedFAQs).length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No questions found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([category, faqs]) => (
              <div key={category}>
                {activeCategory === 'All' && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>{CATEGORY_ICONS[category] || '❓'}</span>
                    {category}
                  </h2>
                )}
                <div className="space-y-3">
                  {faqs.map((faq, i) => {
                    const globalIdx = FAQ_ITEMS.indexOf(faq);
                    return (
                      <FAQAccordion
                        key={globalIdx}
                        item={faq}
                        isOpen={openIdx === globalIdx}
                        onToggle={() => setOpenIdx(openIdx === globalIdx ? null : globalIdx)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-orange-100 max-w-xl mx-auto mb-6">
            Our team is here to help. Browse our in-depth guides or join the CoinDaily community
            to get answers from fellow African crypto enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/blog" className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition">
              Browse All Guides
            </Link>
            <Link href="/blog/comparison" className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition">
              Compare Platforms
            </Link>
          </div>
        </section>
      </main>

      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            name: 'Cryptocurrency FAQ for Africa',
            description: 'Comprehensive cryptocurrency FAQ answered for the African market.',
            url: 'https://sygn.live/blog/faq',
            mainEntity: FAQ_ITEMS.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sygn.live' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://sygn.live/blog' },
              { '@type': 'ListItem', position: 3, name: 'FAQ', item: 'https://sygn.live/blog/faq' },
            ],
          }),
        }}
      />

      <Footer />
    </div>
  );
}
