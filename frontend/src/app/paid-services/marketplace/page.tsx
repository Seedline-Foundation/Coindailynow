'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const categories = ['All', 'Subscriptions', 'Reports', 'Courses', 'Digital Tools', 'API Access', 'Merchandise'];

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  interval?: string;
  description: string;
  badge?: string;
  rating?: number;
  reviews?: number;
  features: string[];
  href?: string;
  cta: string;
  seller?: { name: string; avatar: string; verified: boolean; rating: number; sales: number };
  isBoosted?: boolean;
  paysWith?: 'joy_token' | 'fiat' | 'both';
}

const products: MarketplaceProduct[] = [
  {
    id: 'pro-sub',
    name: 'CoinDaily Pro',
    category: 'Subscriptions',
    price: 29,
    originalPrice: 49,
    interval: '/month',
    description: 'Full access to premium regulatory intelligence, risk scores, expert analysis, and real-time alerts across 14 African countries.',
    badge: 'Bestseller',
    rating: 4.8,
    reviews: 1240,
    features: ['14+ country deep analysis', 'Risk scores & compliance ratings', 'Expert editorial views', 'Real-time regulatory alerts', 'API access (1K req/day)', 'CSV & PDF exports'],
    href: '/membership',
    cta: 'View Plans',
    paysWith: 'both',
  },
  {
    id: 'enterprise-sub',
    name: 'CoinDaily Enterprise',
    category: 'Subscriptions',
    price: 199,
    interval: '/month',
    description: 'Team access with white-label data, unlimited API, custom reports, dedicated analyst support, and SLA-backed uptime.',
    badge: 'Enterprise',
    rating: 4.9,
    reviews: 34,
    features: ['Everything in Pro', 'White-label data', 'Unlimited API', 'Custom reports', 'Dedicated analyst', 'Multi-seat teams'],
    href: '/membership',
    cta: 'Contact Sales',
    paysWith: 'both',
  },
  // ── Seller Products ──────────────────────────────────
  {
    id: 'seller-defi-course',
    name: 'DeFi Masterclass for Africa',
    category: 'Courses',
    price: 79,
    originalPrice: 129,
    description: 'Complete DeFi course tailored for African markets. 12 modules with video lessons, quizzes, and practical labs on PancakeSwap, Uniswap, and African DEXs.',
    badge: 'Boosted',
    rating: 4.9,
    reviews: 87,
    features: ['12 video modules', 'Practical labs', 'Certificate of completion', 'Community Discord', 'Africa-focused strategies'],
    cta: 'Buy with JOY',
    seller: { name: 'CryptoExpert_NG', avatar: 'CE', verified: true, rating: 4.8, sales: 347 },
    isBoosted: true,
    paysWith: 'joy_token',
  },
  {
    id: 'seller-p2p-blueprint',
    name: 'P2P Trading Blueprint',
    category: 'Digital Tools',
    price: 24.99,
    description: 'Step-by-step ebook guide for profitable P2P trading on Luno, Quidax, and Binance P2P. Includes arbitrage strategies across African exchanges.',
    badge: 'Boosted',
    rating: 4.6,
    reviews: 31,
    features: ['Step-by-step guide', 'Arbitrage strategies', 'Exchange walkthroughs', 'Risk management tips'],
    cta: 'Buy with JOY',
    seller: { name: 'CryptoExpert_NG', avatar: 'CE', verified: true, rating: 4.8, sales: 347 },
    isBoosted: true,
    paysWith: 'joy_token',
  },
  {
    id: 'seller-ng-report',
    name: 'Nigeria Market Report Q1 2026',
    category: 'Reports',
    price: 49.99,
    description: 'In-depth analysis of Nigerian crypto market trends, P2P volumes, regulatory updates, and institutional adoption for Q1 2026.',
    badge: 'New',
    rating: 4.8,
    reviews: 42,
    features: ['Market sizing', 'P2P premium analysis', 'Regulatory timeline', 'Exchange ranking', 'DeFi activity breakdown'],
    cta: 'Buy with JOY',
    seller: { name: 'CryptoExpert_NG', avatar: 'CE', verified: true, rating: 4.8, sales: 347 },
    paysWith: 'joy_token',
  },
  {
    id: 'seller-tax-tool',
    name: 'Crypto Tax Calculator NG/GH',
    category: 'Digital Tools',
    price: 9.99,
    description: 'Audit-ready PDF tax reports for Nigerian and Ghanaian crypto traders. Supports Binance, Luno, Quidax imports.',
    badge: 'Popular',
    rating: 4.5,
    reviews: 18,
    features: ['Transaction import', 'Capital gains calc', 'PDF reports', 'FIRS/GRA compliant'],
    cta: 'Buy with JOY',
    seller: { name: 'FinTax_Africa', avatar: 'FA', verified: true, rating: 4.6, sales: 89 },
    paysWith: 'joy_token',
  },
  {
    id: 'seller-portfolio-tmpl',
    name: 'Portfolio Tracker Template',
    category: 'Digital Tools',
    price: 7.99,
    description: 'Notion + Google Sheets template for tracking your African crypto portfolio across exchanges.',
    badge: 'Boosted',
    rating: 4.7,
    reviews: 11,
    features: ['Google Sheets', 'Notion dashboard', 'Multi-exchange', 'Auto-price fetch'],
    cta: 'Buy with JOY',
    seller: { name: 'TemplateHub_KE', avatar: 'TK', verified: false, rating: 4.4, sales: 52 },
    isBoosted: true,
    paysWith: 'joy_token',
  },
  // ── CoinDaily Products ───────────────────────────────
  {
    id: 'q1-report',
    name: 'Africa Crypto Q1 2026 Report',
    category: 'Reports',
    price: 49.99,
    description: 'Institutional-grade analysis of the African crypto market for Q1 2026. ECOWAS focus with DeFi, P2P, and regulatory chapters.',
    badge: 'CoinDaily',
    rating: 4.9,
    reviews: 430,
    features: ['80+ pages', 'Market sizing data', '14 country profiles', 'DeFi & P2P analysis', 'Regulatory outlook', 'Downloadable PDF'],
    cta: 'Buy Report',
    paysWith: 'both',
  },
  {
    id: 'eco-course',
    name: 'ECO Transition Masterclass',
    category: 'Courses',
    price: 79,
    description: '6-hour video course on trading and investing strategies during the ECO currency launch across ECOWAS.',
    badge: 'Hot',
    rating: 4.8,
    reviews: 215,
    features: ['6 hours of video', '12 modules', 'Strategy templates', 'Community Discord access', 'Certificate of completion'],
    cta: 'Enroll Now',
    paysWith: 'both',
  },
  {
    id: 'defi-bundle',
    name: 'DeFi Beginner Bundle',
    category: 'Courses',
    price: 19.99,
    description: 'Three beginner guides covering DeFi basics, cross-chain bridging, and staking strategies on Polygon and BSC.',
    rating: 4.5,
    reviews: 396,
    features: ['3 comprehensive guides', 'Step-by-step tutorials', 'Video walkthroughs', 'Africa-focused examples'],
    cta: 'Buy Course',
    paysWith: 'both',
  },
  {
    id: 'api-dev',
    name: 'API Developer Plan',
    category: 'API Access',
    price: 49,
    interval: '/month',
    description: 'Access live African exchange rates, P2P premiums, historical data, and WebSocket feeds for your apps and bots.',
    rating: 4.5,
    reviews: 88,
    features: ['10K requests/day', 'Real-time exchange rates', 'P2P premiums (12 exchanges)', 'WebSocket feeds', '1-year historical data'],
    href: '/paid-services/api',
    cta: 'View API Plans',
    paysWith: 'both',
  },
  {
    id: 'surge-alerts',
    name: 'Memecoin Surge Alert Pack',
    category: 'Digital Tools',
    price: 4.99,
    interval: '/month',
    description: 'Instant Telegram and email alerts when any token pumps 20%+ within 1 hour. Covers all African exchanges and BSC/SOL.',
    rating: 4.3,
    reviews: 1120,
    features: ['Real-time surge detection', 'Telegram + Email alerts', '20%+ pump threshold', 'African exchange focus', 'BSC & Solana coverage'],
    cta: 'Subscribe',
    paysWith: 'both',
  },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [sellerFilter, setSellerFilter] = useState<'all' | 'sellers' | 'coindaily'>('all');

  const filtered = products
    .filter(p => {
      if (sellerFilter === 'sellers' && !p.seller) return false;
      if (sellerFilter === 'coindaily' && p.seller) return false;
      return true;
    })
    .filter(p => (activeCategory === 'All' || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (p.seller?.name || '').toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      // Boosted products always appear first
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.reviews || 0) - (a.reviews || 0);
    });

  const totalSellers = new Set(products.filter(p => p.seller).map(p => p.seller!.name)).size;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            🛒 CoinDaily Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Products &amp; Digital Goods
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
            Premium reports, courses, API access, digital tools from CoinDaily and verified sellers — everything you need to succeed in Africa&apos;s crypto ecosystem.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">📦 <strong className="text-gray-900 dark:text-white">{products.length}</strong> Products</span>
            <span className="flex items-center gap-1">👥 <strong className="text-gray-900 dark:text-white">{totalSellers}</strong> Verified Sellers</span>
            <span className="flex items-center gap-1">🪙 <strong className="text-orange-500">JOY Token</strong> Accepted</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/paid-services" className="text-sm text-orange-600 hover:underline">← All Paid Services</Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/user/marketplace" className="text-sm text-orange-600 hover:underline font-semibold">🏪 Sell on Marketplace →</Link>
          </div>
        </div>

        {/* Sell CTA Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white">
            <h3 className="text-xl font-bold mb-1">Start Selling on CoinDaily Marketplace</h3>
            <p className="text-orange-100 text-sm">List your courses, ebooks, tools, and reports for free. Boost them with our AI-powered ad agent.</p>
          </div>
          <Link href="/user/marketplace/products" className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all whitespace-nowrap">
            Open Your Store
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products or sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value as typeof sellerFilter)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Sellers</option>
            <option value="coindaily">CoinDaily Official</option>
            <option value="sellers">Community Sellers</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-orange-500'}`}
            >
              {cat} {cat !== 'All' && <span className="text-xs opacity-60">({products.filter(p => p.category === cat).length})</span>}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map(product => (
            <div key={product.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all p-6 flex flex-col relative ${product.isBoosted ? 'border-2 border-orange-400 ring-1 ring-orange-200' : 'border-2 border-transparent hover:border-orange-400'}`}>
              {/* Boosted badge */}
              {product.isBoosted && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                  ⚡ Boosted
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                    {product.badge && product.badge !== 'Boosted' && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${product.badge === 'CoinDaily' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'}`}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>
              </div>

              {/* Seller info */}
              {product.seller ? (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {product.seller.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{product.seller.name}</span>
                      {product.seller.verified && <span className="text-blue-500 text-[10px]">✓</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>★ {product.seller.rating}</span>
                      <span>•</span>
                      <span>{product.seller.sales} sales</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">🏢 Sold by CoinDaily</span>
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">{product.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {product.features.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">✓ {f}</span>
                ))}
                {product.features.length > 3 && (
                  <span className="text-xs px-2 py-1 text-gray-400">+{product.features.length - 3} more</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t dark:border-gray-700">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-orange-600">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                    )}
                    {product.interval && (
                      <span className="text-xs text-gray-500">{product.interval}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {product.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-yellow-500">★</span> {product.rating} ({product.reviews?.toLocaleString()})
                      </span>
                    )}
                    {product.paysWith === 'joy_token' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded font-bold">🪙 JOY</span>
                    )}
                  </div>
                </div>
                {product.href ? (
                  <Link href={product.href} className="px-5 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-all">
                    {product.cta}
                  </Link>
                ) : (
                  <button className="px-5 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-all">
                    {product.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No products match your search.</p>
          </div>
        )}

        {/* Trust */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">Secure Payments with JOY Tokens</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Pay with JOY Tokens from your CoinDaily Wallet, or fiat via Visa, Mastercard, M-Pesa, and crypto (BTC/ETH/USDT). All transactions are encrypted and secure.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-2xl">
            <span>🪙</span><span>💳</span><span>📱</span><span>₿</span><span>🔒</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
