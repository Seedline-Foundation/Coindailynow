/**
 * Content Automation Widget - User Dashboard
 * Task 62: Personalized AI-Generated Content Feed
 */

'use client';

import React, { useState, useEffect } from 'react';

interface AutomatedArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  qualityScore: number;
  publishedAt: string;
  isNew: boolean;
}

export default function AutomatedContentWidget() {
  const [articles, setArticles] = useState<AutomatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'crypto' | 'defi' | 'memecoins'>('all');

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from backend
      const mockArticles: AutomatedArticle[] = [
        {
          id: '1',
          title: 'Bitcoin Surges Past $50K as African Adoption Grows',
          excerpt: 'Bitcoin reaches new heights driven by increasing adoption in Nigeria and Kenya...',
          category: 'CRYPTO',
          qualityScore: 92,
          publishedAt: new Date().toISOString(),
          isNew: true
        },
        {
          id: '2',
          title: 'DeFi Revolution: African Platforms See 300% Growth',
          excerpt: 'Decentralized finance platforms in Africa experience unprecedented growth...',
          category: 'DEFI',
          qualityScore: 88,
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          isNew: true
        },
        {
          id: '3',
          title: 'Top 5 Memecoins to Watch in 2025',
          excerpt: 'Discover the hottest memecoins making waves in the African crypto scene...',
          category: 'MEMECOINS',
          qualityScore: 85,
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          isNew: false
        }
      ];

      const filtered = filter === 'all' 
        ? mockArticles 
        : mockArticles.filter(a => a.category.toLowerCase() === filter);

      setArticles(filtered);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI-Curated Content</h2>
            <p className="text-sm text-gray-600 mt-1">Personalized news powered by AI</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              🤖 AI Powered
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2">
          {['all', 'crypto', 'defi', 'memecoins'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No articles found for this category</p>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {article.isNew && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        NEW
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(article.publishedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {article.title}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Quality:</span>
                      <span className={`font-semibold ${
                        article.qualityScore >= 90 ? 'text-green-600' :
                        article.qualityScore >= 80 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {article.qualityScore}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      🤖 AI-Generated
                    </span>
                  </div>
                </div>

                <button className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Read →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            <span className="font-medium">{articles.length}</span> AI-generated articles today
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>
      </div>
    </div>
  );
}

