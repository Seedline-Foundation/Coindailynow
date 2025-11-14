// frontend/src/components/user/PersonalizedFeed.tsx
// Task 66: User Personalized News Feed Component

'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Award, Filter } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl?: string;
  readingTimeMinutes: number;
  publishedAt: string;
  Category: {
    name: string;
    slug: string;
  };
  User: {
    username: string;
  };
  recommendationScore?: number;
  recommendationId?: string;
}

interface PersonalizedFeedProps {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
}

export default function PersonalizedFeed({
  userId,
  limit = 20,
  showFilters = true,
}: PersonalizedFeedProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'personalized' | 'trending'>('personalized');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, [feedType, userId]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        feedType === 'personalized' && userId
          ? `/api/engagement/recommendations?limit=${limit}`
          : `/api/engagement/trending?limit=${limit}`;

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (userId) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();
      setArticles(data);
    } catch (err: any) {
      console.error('Error fetching feed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: Article) => {
    if (article.recommendationId) {
      // Track recommendation click
      try {
        await fetch(`/api/engagement/track-recommendation-click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            recommendationId: article.recommendationId,
          }),
        });
      } catch (error) {
        console.error('Error tracking click:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchFeed}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {feedType === 'personalized' ? (
            <Sparkles className="w-5 h-5 text-purple-600" />
          ) : (
            <TrendingUp className="w-5 h-5 text-orange-600" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {feedType === 'personalized' ? 'Your Personalized Feed' : 'Trending Now'}
          </h2>
        </div>

        {showFilters && (
          <div className="flex gap-2">
            <button
              onClick={() => setFeedType('personalized')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedType === 'personalized'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              For You
            </button>
            <button
              onClick={() => setFeedType('trending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                feedType === 'trending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Trending
            </button>
          </div>
        )}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            onClick={() => handleArticleClick(article)}
            className="block bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4 group"
          >
            <div className="flex gap-4">
              {/* Image */}
              {article.featuredImageUrl && (
                <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={article.featuredImageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category & Metadata */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {article.Category.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {article.readingTimeMinutes} min read
                  </span>
                  {article.recommendationScore && (
                    <span className="text-sm text-purple-600 font-medium">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {(article.recommendationScore * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {article.excerpt}
                </p>

                {/* Author & Date */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>By {article.User.username}</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More */}
      {articles.length >= limit && (
        <button
          onClick={fetchFeed}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Load More Articles
        </button>
      )}
    </div>
  );
}

