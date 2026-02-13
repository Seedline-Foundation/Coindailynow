/**
 * User Reading History Page
 * Track articles read by the user
 */

'use client';

import React, { useState } from 'react';
import { BookOpen, Clock, Trash2, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';

// Mock reading history
const mockHistory = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High as African Adoption Surges',
    category: 'Bitcoin',
    readAt: '2024-01-15T10:30:00Z',
    readTime: '5 min',
    slug: 'bitcoin-ath-african-adoption',
    progress: 100,
  },
  {
    id: '2',
    title: 'M-Pesa Crypto Integration Goes Live in Kenya',
    category: 'Mobile Money',
    readAt: '2024-01-15T08:15:00Z',
    readTime: '4 min',
    slug: 'mpesa-crypto-integration-kenya',
    progress: 100,
  },
  {
    id: '3',
    title: 'Understanding DeFi: A Beginner Guide for African Investors',
    category: 'Education',
    readAt: '2024-01-14T16:45:00Z',
    readTime: '8 min',
    slug: 'defi-beginner-guide-africa',
    progress: 65,
  },
  {
    id: '4',
    title: 'Top 5 Memecoins Trending in Nigeria This Week',
    category: 'Memecoin',
    readAt: '2024-01-14T12:00:00Z',
    readTime: '3 min',
    slug: 'memecoins-trending-nigeria',
    progress: 100,
  },
];

export default function UserReadingHistoryPage() {
  const [history, setHistory] = useState(mockHistory);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeFromHistory = (id: string) => {
    setHistory(history.filter(h => h.id !== id));
  };

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all reading history?')) {
      setHistory([]);
    }
  };

  // Group by date
  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const date = new Date(item.readAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof mockHistory>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Reading History</h1>
          <p className="text-dark-400 mt-1">{history.length} articles read</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full sm:w-64"
            />
          </div>
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {Object.keys(groupedHistory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-dark-400 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-dark-900 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-0.5 bg-primary-500/10 text-primary-500 text-xs rounded-full">
                            {item.category}
                          </span>
                          <span className="text-dark-500 text-xs">{item.readTime} read</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white line-clamp-1">
                          <Link href={`/news/${item.slug}`} className="hover:text-primary-500">
                            {item.title}
                          </Link>
                        </h3>
                        {item.progress < 100 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                              <span>Reading progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-dark-500 text-xs mt-2">
                          {new Date(item.readAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/news/${item.slug}`}
                          className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => removeFromHistory(item.id)}
                          className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No reading history</h3>
          <p className="text-dark-400 mb-4">
            {searchQuery ? 'Try a different search term.' : 'Articles you read will appear here.'}
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
          >
            Browse News
          </Link>
        </div>
      )}
    </div>
  );
}
