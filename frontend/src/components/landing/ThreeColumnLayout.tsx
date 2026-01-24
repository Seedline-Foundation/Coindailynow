'use client';

import React from 'react';
import AdBanner from './AdBanner';

interface ColumnLayoutProps {
  leftColumn?: React.ReactNode;
  centerColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  className?: string;
  showAds?: boolean;
  adKeywords?: string[];
}

const ThreeColumnLayout: React.FC<ColumnLayoutProps> = ({
  leftColumn,
  centerColumn,
  rightColumn,
  className = '',
  showAds = true,
  adKeywords = [],
}) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {/* Full Width Ad Banner */}
      {showAds && (
        <div className="mb-8">
          <AdBanner
            position="header"
            size="full-width"
            keywords={adKeywords}
            showLabel={true}
            allowClose={false}
          />
        </div>
      )}

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        {leftColumn && (
          <aside className="lg:col-span-3 space-y-6">
            {leftColumn}
            
            {/* Sidebar Ad */}
            {showAds && (
              <div className="sticky top-8">
                <AdBanner
                  position="sidebar"
                  size="medium"
                  keywords={adKeywords}
                  showLabel={true}
                  allowClose={true}
                />
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className={`${leftColumn && rightColumn ? 'lg:col-span-6' : leftColumn || rightColumn ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
          {centerColumn}
        </main>

        {/* Right Sidebar */}
        {rightColumn && (
          <aside className="lg:col-span-3 space-y-6">
            {rightColumn}
            
            {/* Sidebar Ad */}
            {showAds && (
              <div className="sticky top-8">
                <AdBanner
                  position="sidebar"
                  size="medium"
                  keywords={adKeywords}
                  showLabel={true}
                  allowClose={true}
                />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

// Left Sidebar Content Component
interface LeftSidebarProps {
  className?: string;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '' }) => {
  const quickLinks = [
    { label: 'Bitcoin News', href: '/category/bitcoin', count: 15 },
    { label: 'Ethereum Updates', href: '/category/ethereum', count: 8 },
    { label: 'DeFi Protocols', href: '/category/defi', count: 12 },
    { label: 'African Exchanges', href: '/category/exchanges', count: 6 },
    { label: 'Regulatory News', href: '/category/regulation', count: 9 },
  ];

  const trendingTopics = [
    '#BitcoinETF',
    '#EthereumMerge',
    '#AfricaCrypto',
    '#CBDCNigeria',
    '#MPesaCrypto',
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Navigation</h3>
        <nav className="space-y-2">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-between py-2 px-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <span>{link.label}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {link.count}
              </span>
            </a>
          ))}
        </nav>
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Trending Topics</h3>
        <div className="flex flex-wrap gap-2">
          {trendingTopics.map((topic) => (
            <a
              key={topic}
              href={`/search?q=${encodeURIComponent(topic)}`}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
            >
              {topic}
            </a>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Daily Newsletter</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get the latest African crypto news delivered to your inbox every morning.
        </p>
        <form className="space-y-3">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
};

// Right Sidebar Content Component
interface RightSidebarProps {
  className?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ className = '' }) => {
  const marketData = [
    { symbol: 'BTC', price: 43250, change: 2.5 },
    { symbol: 'ETH', price: 2650, change: -1.2 },
    { symbol: 'BNB', price: 315, change: 0.8 },
    { symbol: 'ADA', price: 0.52, change: 3.1 },
    { symbol: 'SOL', price: 98, change: -0.5 },
  ];

  const upcomingEvents = [
    {
      date: '2025-10-15',
      title: 'Bitcoin Conference Lagos',
      type: 'Conference',
    },
    {
      date: '2025-10-20',
      title: 'Ethereum Nairobi Meetup',
      type: 'Meetup',
    },
    {
      date: '2025-10-25',
      title: 'DeFi Workshop Accra',
      type: 'Workshop',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Market Overview</h3>
        <div className="space-y-3">
          {marketData.map((coin) => (
            <div key={coin.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                  {coin.symbol}
                </div>
                <span className="font-medium text-sm">{coin.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  ${coin.price.toLocaleString()}
                </div>
                <div className={`text-xs ${
                  coin.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {coin.change >= 0 ? '+' : ''}{coin.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <a
          href="/market"
          className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
        >
          View Full Market →
        </a>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="border-l-2 border-blue-200 pl-3">
              <div className="text-xs text-gray-500 mb-1">
                {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {event.title}
              </div>
              <div className="text-xs text-blue-600">
                {event.type}
              </div>
            </div>
          ))}
        </div>
        <a
          href="/events"
          className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800"
        >
          View All Events →
        </a>
      </div>

      {/* Popular Authors */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Popular Authors</h3>
        <div className="space-y-3">
          {[
            { name: 'Kwame Osei', articles: 45, avatar: '👨🏿‍💼' },
            { name: 'Amina Hassan', articles: 38, avatar: '👩🏿‍💼' },
            { name: 'Thabo Mthembu', articles: 32, avatar: '👨🏿‍💻' },
          ].map((author) => (
            <div key={author.name} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                {author.avatar}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {author.name}
                </div>
                <div className="text-xs text-gray-500">
                  {author.articles} articles
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
