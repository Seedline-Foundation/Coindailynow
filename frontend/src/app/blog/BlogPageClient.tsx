'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';
import { PILLAR_ARTICLES, type BlogArticle } from '@/data/blog-articles';

const CATEGORIES = ['All', ...Array.from(new Set(PILLAR_ARTICLES.map(a => a.category)))];

function BlogCard({ article, featured = false }: { article: BlogArticle; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className={`group block rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      {/* Hero Image */}
      <div className={`relative overflow-hidden ${featured ? 'h-72 md:h-96' : 'h-48 md:h-56'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
            {article.category}
          </span>
        </div>
        {/* Featured Badge */}
        {article.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
              ★ Featured
            </span>
          </div>
        )}
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h2 className={`text-white font-bold leading-tight group-hover:text-yellow-300 transition-colors ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
          }`}>
            {article.title}
          </h2>
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{article.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>{article.author}</span>
            <span>·</span>
            <span>{article.readingTime} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{article.wordCount.toLocaleString()} words</span>
          </div>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function BlogPageClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    return PILLAR_ARTICLES.filter(a => {
      const matchCat = activeCategory === 'All' || a.category === activeCategory;
      const matchSearch = !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured || featuredArticles.indexOf(a) > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Blog Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-sm mb-6">
            <span>📰</span> Africa&apos;s #1 Crypto Knowledge Hub
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            CoinDaily <span className="text-orange-400">Blog</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Expert cryptocurrency insights, guides, and analysis for the African market.
            From Bitcoin basics to advanced DeFi strategies — in your language.
          </p>
          {/* Search */}
          <div className="max-w-lg mx-auto relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {/* Quick Links */}
          <div className="flex justify-center gap-4 mt-6 text-sm">
            <Link href="/blog/comparison" className="text-orange-300 hover:text-orange-200 underline underline-offset-4">
              Platform Comparison →
            </Link>
            <Link href="/blog/faq" className="text-orange-300 hover:text-orange-200 underline underline-offset-4">
              Crypto FAQ →
            </Link>
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
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No articles found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="flex items-center justify-between mb-8 text-sm text-gray-500">
              <span>{filteredArticles.length} articles · {Math.round(filteredArticles.reduce((s, a) => s + a.wordCount, 0) / 1000)}K+ words of expert content</span>
              <span className="text-orange-500 font-medium">Available in 15+ African languages</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article, idx) => (
                <BlogCard
                  key={article.id}
                  article={article}
                  featured={idx === 0 && activeCategory === 'All'}
                />
              ))}
            </div>
          </>
        )}

        {/* CTA Section */}
        <section className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Ahead of the Crypto Market</h2>
          <p className="text-orange-100 max-w-2xl mx-auto mb-6">
            Get breaking crypto news, market analysis, and educational content delivered to your inbox.
            All tailored for the African market.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-orange-200 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition">
              Subscribe Free
            </button>
          </div>
        </section>
      </main>

      {/* Blog JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'CoinDaily Blog',
            description: 'Expert cryptocurrency insights, guides, and analysis for Africa',
            url: 'https://sygn.live/blog',
            publisher: {
              '@type': 'Organization',
              name: 'CoinDaily',
              url: 'https://sygn.live',
              logo: { '@type': 'ImageObject', url: 'https://sygn.live/images/logo.svg' },
            },
            blogPost: PILLAR_ARTICLES.slice(0, 10).map(a => ({
              '@type': 'BlogPosting',
              headline: a.title,
              description: a.excerpt,
              url: `https://sygn.live/blog/${a.slug}`,
              datePublished: a.publishedAt,
              dateModified: a.updatedAt,
              author: { '@type': 'Person', name: a.author },
              publisher: { '@type': 'Organization', name: 'CoinDaily' },
              wordCount: a.wordCount,
              articleSection: a.category,
              keywords: a.targetKeywords.join(', '),
              inLanguage: 'en',
              isAccessibleForFree: true,
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://sygn.live/blog/${a.slug}` },
            })),
          }),
        }}
      />

      <Footer />
    </div>
  );
}
