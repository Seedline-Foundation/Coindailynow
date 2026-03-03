'use client';

import { useState, useCallback } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  ShoppingCart, Package, Search, Plus, ExternalLink,
  Star, TrendingUp, DollarSign, ChevronDown, Tag, Filter
} from 'lucide-react';
import Link from 'next/link';

// ─── Static demo data ───
const CATEGORIES = ['All', 'Digital', 'Subscription', 'Report', 'Course', 'API Access', 'Merchandise'];

const ALL_PRODUCTS = [
  { id: 'p1', name: 'CoinDaily Pro Subscription', category: 'Subscription', price: 29.99, description: 'Full access to premium news, alerts and analytics.', sales: 1240, rating: 4.8, status: 'active', badge: 'Bestseller', image: null },
  { id: 'p2', name: 'Eco-Zone Q1 2026 Market Report', category: 'Report', price: 49.99, description: 'Institutional-grade ECOWAS crypto market analysis for Q1 2026.', sales: 430, rating: 4.9, status: 'active', badge: 'New', image: null },
  { id: 'p3', name: 'West Africa Regulatory Passport Guide', category: 'Report', price: 24.99, description: 'Complete compliance guide for 15 ECOWAS jurisdictions.', sales: 320, rating: 4.7, status: 'active', badge: null, image: null },
  { id: 'p4', name: 'Crypto Tax Calculator — Nigeria/Ghana', category: 'Digital', price: 9.99, description: 'Audit-ready PDF tax reports for NG and GH crypto traders.', sales: 862, rating: 4.6, status: 'active', badge: 'Popular', image: null },
  { id: 'p5', name: 'Bloomberg API — Basic Tier', category: 'API Access', price: 99.00, description: '10,000 API requests/month. Real-time prices and on-chain data.', sales: 88, rating: 4.5, status: 'active', badge: null, image: null },
  { id: 'p6', name: 'Stablecoin Corridors Data Feed', category: 'API Access', price: 79.00, description: 'Live NGN/GHS/XOF premium feeds across 12 African exchanges.', sales: 56, rating: 4.7, status: 'active', badge: null, image: null },
  { id: 'p7', name: 'ECO Transition Masterclass', category: 'Course', price: 79.00, description: '6-hour video course on trading and investing through the ECO launch.', sales: 215, rating: 4.8, status: 'active', badge: 'Hot', image: null },
  { id: 'p8', name: 'CoinDaily Analyst T-Shirt', category: 'Merchandise', price: 24.99, description: 'Premium cotton. Ships within Africa.', sales: 184, rating: 4.4, status: 'active', badge: null, image: null },
  { id: 'p9', name: 'DeFi Beginner Bundle', category: 'Course', price: 19.99, description: 'Three beginner guides to DeFi, bridging, and staking on Polygon.', sales: 396, rating: 4.5, status: 'active', badge: null, image: null },
  { id: 'p10', name: 'CoinDaily Enterprise Subscription', category: 'Subscription', price: 299.00, description: 'Team access, API bundle and weekly analyst calls.', sales: 34, rating: 4.9, status: 'active', badge: 'Enterprise', image: null },
  { id: 'p11', name: 'Memecoin Surge Alert Pack', category: 'Digital', price: 4.99, description: 'Instant alerts when any token pumps 20%+ in under 1 hour.', sales: 1120, rating: 4.3, status: 'active', badge: null, image: null },
  { id: 'p12', name: 'Crypto Portfolio Tracker Template', category: 'Digital', price: 7.99, description: 'Google Sheets + Notion template for African crypto portfolios.', sales: 540, rating: 4.6, status: 'active', badge: 'Popular', image: null },
];

const PAGE_SIZE = 6;

export default function MarketplacePage() {
  const { user } = useSuperAdmin();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'sales' | 'price' | 'rating'>('sales');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = ALL_PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.sales - a.sales;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => setVisibleCount(c => c + PAGE_SIZE), []);

  const totalRevenue = ALL_PRODUCTS.reduce((a, p) => a + p.price * p.sales, 0);
  const totalSales = ALL_PRODUCTS.reduce((a, p) => a + p.sales, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-400" />
            Marketplace
          </h1>
          <p className="text-gray-400 mt-1">All published products available to customers</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/super-admin/ecommerce"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            <Package className="w-4 h-4" />
            Manage Products
          </Link>
          <Link
            href="/super-admin/ecommerce?tab=products"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-white">{ALL_PRODUCTS.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-white">{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Gross Revenue</p>
          <p className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Categories</p>
          <p className="text-2xl font-bold text-white">{CATEGORIES.length - 1}</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'sales' | 'price' | 'rating')}
            className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="sales">Most Sold</option>
            <option value="rating">Top Rated</option>
            <option value="price">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setVisibleCount(PAGE_SIZE); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400">
        Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} products
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map(product => (
          <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden flex flex-col hover:border-gray-500 transition-colors">
            {/* Image placeholder */}
            <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
              <Package className="w-14 h-14 text-gray-600" />
              {product.badge && (
                <span className={`absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  product.badge === 'Bestseller' ? 'bg-yellow-500 text-black' :
                  product.badge === 'Hot' ? 'bg-red-500 text-white' :
                  product.badge === 'New' ? 'bg-green-500 text-white' :
                  product.badge === 'Enterprise' ? 'bg-purple-500 text-white' :
                  product.badge === 'Popular' ? 'bg-blue-500 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {product.badge}
                </span>
              )}
              <span className={`absolute top-3 right-3 px-2 py-0.5 text-xs rounded-full ${
                product.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
              }`}>
                {product.status}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <div className="mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</span>
                <h3 className="text-white font-semibold text-sm mt-0.5 leading-snug">{product.name}</h3>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{product.description}</p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-white">${product.price.toFixed(2)}</span>
                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-medium">{product.rating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {product.sales.toLocaleString()} sales
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${(product.price * product.sales).toLocaleString(undefined, { maximumFractionDigits: 0 })} rev
                </span>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Live
                </button>
                <Link
                  href="/super-admin/ecommerce"
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            Show More ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No products match your search.</p>
        </div>
      )}
    </div>
  );
}
