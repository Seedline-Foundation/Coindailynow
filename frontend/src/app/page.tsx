'use client';

import React from 'react';
import { 
  Header, 
  HeroSection, 
  ThreeColumnLayout,
  LeftSidebar,
  RightSidebar 
} from '@/components/landing';
import MarqueeWrapper from '@/components/landing/MarqueeWrapper';
import MainNavigation from '@/components/navigation/MainNavigation';
import Footer from '@/components/footer/Footer';

// Mock data for demonstration
const mockTrendingTokens = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.00,
    change24h: 1250.50,
    changePercent24h: 2.98,
    isHot: true,
    marketCap: 846000000000,
    volume24h: 24500000000,
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -32.25,
    changePercent24h: -1.20,
    marketCap: 318000000000,
    volume24h: 12300000000,
  },
  {
    id: '3',
    symbol: 'DOGE',
    name: 'Dogecoin',
    price: 0.082,
    change24h: 0.0045,
    changePercent24h: 5.81,
    isHot: true,
    marketCap: 11800000000,
    volume24h: 890000000,
  },
  {
    id: '4',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    price: 0.000024,
    change24h: 0.0000012,
    changePercent24h: 5.26,
    isHot: true,
    marketCap: 14200000000,
    volume24h: 567000000,
  },
  {
    id: '5',
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.00000125,
    change24h: 0.000000087,
    changePercent24h: 7.48,
    isHot: true,
    marketCap: 525000000,
    volume24h: 234000000,
  },
];

const mockFeaturedNews = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High as African Adoption Surges',
    excerpt: 'Bitcoin has hit a new record high of $43,250 as adoption across African countries continues to accelerate, driven by mobile money integration.',
    category: 'Bitcoin',
    publishedAt: '2 hours ago',
    imageUrl: '/images/news/bitcoin-ath-africa.jpg',
    author: 'Kwame Osei',
    readTime: '5 min read',
    slug: 'bitcoin-ath-african-adoption-surge',
  },
  {
    id: '2',
    title: 'Nigerian Central Bank Announces Digital Naira Phase 2',
    excerpt: 'The Central Bank of Nigeria reveals plans for the second phase of the eNaira rollout, focusing on rural areas and cross-border payments.',
    category: 'CBDC',
    publishedAt: '4 hours ago',
    imageUrl: '/images/news/enaira-phase-2.jpg',
    author: 'Amina Hassan',
    readTime: '4 min read',
    slug: 'nigeria-enaira-phase-2-announcement',
  },
  {
    id: '3',
    title: 'M-Pesa Crypto Integration Goes Live in Kenya',
    excerpt: 'Safaricom launches crypto buying and selling directly through M-Pesa, making cryptocurrency accessible to 30 million Kenyan users.',
    category: 'Mobile Money',
    publishedAt: '6 hours ago',
    imageUrl: '/images/news/mpesa-crypto-integration.jpg',
    author: 'Thabo Mthembu',
    readTime: '3 min read',
    slug: 'mpesa-crypto-integration-kenya-launch',
  },
  {
    id: '4',
    title: 'Ethereum Scaling Solutions Gain Traction in South Africa',
    excerpt: 'Layer 2 solutions see rapid adoption among South African DeFi users, reducing transaction costs by up to 90%.',
    category: 'Ethereum',
    publishedAt: '8 hours ago',
    imageUrl: '/images/news/ethereum-scaling-south-africa.jpg',
    author: 'Nkosazana Duma',
    readTime: '6 min read',
    slug: 'ethereum-scaling-south-africa-adoption',
  },
];

const mockBreakingNews = [
  {
    id: 'breaking-1',
    title: 'BREAKING: Binance Africa Announces $100M Fund for African Crypto Startups',
    excerpt: 'Binance launches dedicated venture fund to support cryptocurrency and blockchain startups across the African continent.',
    category: 'Breaking',
    publishedAt: '30 minutes ago',
    author: 'Breaking News Team',
    readTime: '2 min read',
    slug: 'binance-africa-100m-startup-fund',
    isBreaking: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Date/Time, Logo, Search, Auth */}
      <Header showDateTime={true} showSocialIcons={true} />

      {/* Main Navigation Menu - Below Header, Above Marquee */}
      <MainNavigation />

      {/* Marquee Ticker for Trending Tokens */}
      <MarqueeWrapper 
        useDynamic={true}
        position="header"
        fallbackTokens={mockTrendingTokens} 
        speed={60} 
        showVolume={true}
      />

      {/* Hero Section with Latest News */}
      <HeroSection 
        featuredNews={mockFeaturedNews}
        breakingNews={mockBreakingNews}
        className="py-8 lg:py-12"
      />

      {/* Three Column Layout with Sidebar Content */}
      <div className="py-8">
        <ThreeColumnLayout
          leftColumn={<LeftSidebar />}
          centerColumn={
            <div className="space-y-8">
              {/* Featured Content Area */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Latest African Crypto News
                </h2>
                <div className="grid gap-6">
                  {mockFeaturedNews.map((article) => (
                    <article key={article.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {article.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {article.publishedAt}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>By {article.author}</span>
                            <span>•</span>
                            <span>{article.readTime}</span>
                          </div>
                        </div>
                        {article.imageUrl && (
                          <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                            {/* Placeholder for image */}
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Image</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Load More Button */}
              <div className="text-center">
                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Load More Articles
                </button>
              </div>
            </div>
          }
          rightColumn={<RightSidebar />}
          showAds={true}
          adKeywords={['cryptocurrency', 'bitcoin', 'africa', 'trading']}
        />
      </div>

      {/* Comprehensive Footer */}
      <Footer />
    </div>
  );
}

