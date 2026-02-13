/**
 * User Bookmarks Page
 * Saved articles and content
 */

'use client';

import React, { useState } from 'react';
import { Star, Trash2, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';

// Mock bookmarks data
const mockBookmarks = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High as African Adoption Surges',
    excerpt: 'Bitcoin has hit a new record high of $43,250 as adoption across African countries continues to accelerate.',
    category: 'Bitcoin',
    savedAt: '2024-01-15T10:30:00Z',
    slug: 'bitcoin-ath-african-adoption',
    imageUrl: '/images/news/bitcoin.jpg',
  },
  {
    id: '2',
    title: 'M-Pesa Crypto Integration Goes Live in Kenya',
    excerpt: 'Safaricom launches crypto buying and selling directly through M-Pesa.',
    category: 'Mobile Money',
    savedAt: '2024-01-14T15:45:00Z',
    slug: 'mpesa-crypto-integration-kenya',
    imageUrl: '/images/news/mpesa.jpg',
  },
  {
    id: '3',
    title: 'Nigerian SEC Announces New Crypto Regulations',
    excerpt: 'New regulatory framework aims to protect investors while encouraging innovation.',
    category: 'Regulation',
    savedAt: '2024-01-13T08:20:00Z',
    slug: 'nigeria-sec-crypto-regulations',
    imageUrl: '/images/news/regulation.jpg',
  },
];

export default function UserBookmarksPage() {
  const [bookmarks, setBookmarks] = useState(mockBookmarks);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bookmark.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Bookmarks</h1>
          <p className="text-dark-400 mt-1">{bookmarks.length} saved articles</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full sm:w-64"
          />
        </div>
      </div>

      {filteredBookmarks.length > 0 ? (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-dark-900 border border-dark-700 rounded-xl p-4 flex gap-4 hover:border-dark-600 transition-colors"
            >
              <div className="w-24 h-24 rounded-lg bg-dark-800 flex-shrink-0 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-primary-500/50" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-primary-500/10 text-primary-500 text-xs rounded-full mb-2">
                      {bookmark.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white line-clamp-1">
                      <Link href={`/news/${bookmark.slug}`} className="hover:text-primary-500">
                        {bookmark.title}
                      </Link>
                    </h3>
                    <p className="text-dark-400 text-sm line-clamp-2 mt-1">{bookmark.excerpt}</p>
                    <p className="text-dark-500 text-xs mt-2">
                      Saved on {new Date(bookmark.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/news/${bookmark.slug}`}
                      className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
          <Star className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No bookmarks found</h3>
          <p className="text-dark-400 mb-4">
            {searchQuery ? 'Try a different search term.' : 'Start saving articles you want to read later.'}
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
