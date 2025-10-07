'use client';

import { useState, useEffect } from 'react';

interface MetaTag {
  page: string;
  title: string;
  description: string;
  keywords: string[];
  lastOptimized: string;
  seoScore: number;
}

export default function MetaTagsPage() {
  const [metaTags, setMetaTags] = useState<MetaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<MetaTag | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Simulate fetching meta tags data
    setTimeout(() => {
      setMetaTags([
        {
          page: '/news/bitcoin-surge-2024',
          title: 'Bitcoin Surges to New All-Time High - CoinDaily',
          description: 'Bitcoin reaches unprecedented heights as institutional adoption continues to drive market sentiment.',
          keywords: ['bitcoin', 'cryptocurrency', 'all-time high', 'market'],
          lastOptimized: '2024-01-15',
          seoScore: 95
        },
        {
          page: '/market-insights/defi-trends',
          title: 'DeFi Market Trends and Analysis',
          description: 'Comprehensive analysis of current DeFi market trends and future predictions.',
          keywords: ['defi', 'trends', 'analysis', 'market'],
          lastOptimized: '2024-01-14',
          seoScore: 78
        },
        {
          page: '/about',
          title: 'About CoinDaily - Crypto News Platform',
          description: 'Learn about CoinDaily, Africa\'s largest AI-driven cryptocurrency news platform.',
          keywords: ['about', 'coindaily', 'crypto news', 'platform'],
          lastOptimized: '2024-01-10',
          seoScore: 65
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleOptimize = async () => {
    try {
      const response = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize-headline',
          data: { 
            headline: selectedPage?.title || '',
            keywords: selectedPage?.keywords || []
          }
        })
      });

      if (response.ok) {
        const { optimizedHeadline } = await response.json();
        alert(`Optimized title: ${optimizedHeadline}`);
      }
    } catch (error) {
      console.error('Failed to optimize meta tags:', error);
      alert('Failed to optimize meta tags');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meta Tags Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Bulk Optimize
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Tags List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Page Meta Tags</h2>
          <div className="space-y-4">
            {metaTags.map((metaTag, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPage?.page === metaTag.page ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPage(metaTag)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm text-gray-900 truncate">
                    {metaTag.page}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(metaTag.seoScore)}`}>
                    {metaTag.seoScore}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {metaTag.title}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Last optimized: {metaTag.lastOptimized}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPage(metaTag);
                      handleOptimize();
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Optimize
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meta Tag Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Meta Tags</h2>
            {selectedPage && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {selectedPage ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page URL
                </label>
                <input
                  type="text"
                  value={selectedPage.page}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Tag ({selectedPage.title.length}/60 characters)
                </label>
                <textarea
                  value={selectedPage.title}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                {selectedPage.title.length > 60 && (
                  <p className="text-red-500 text-xs mt-1">Title too long! Recommended: 50-60 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description ({selectedPage.description.length}/160 characters)
                </label>
                <textarea
                  value={selectedPage.description}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                {selectedPage.description.length > 160 && (
                  <p className="text-red-500 text-xs mt-1">Description too long! Recommended: 150-160 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md min-h-[100px]">
                  {selectedPage.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword}
                      {isEditing && (
                        <button className="ml-1 text-blue-600 hover:text-blue-800">
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <input
                      type="text"
                      placeholder="Add keyword..."
                      className="flex-1 min-w-[120px] text-xs border-none outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          // Add keyword logic
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Score
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        selectedPage.seoScore >= 90 ? 'bg-green-500' :
                        selectedPage.seoScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedPage.seoScore}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{selectedPage.seoScore}/100</span>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Save Changes
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Auto-Optimize
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a page to edit its meta tags</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
