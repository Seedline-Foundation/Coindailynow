/**
 * Recommended Content Widget
 * 
 * Displays personalized AI-powered content recommendations
 * including articles, memecoin alerts, and market insights
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface ContentRecommendation {
  articleId: string;
  title: string;
  excerpt: string;
  category: string;
  topics: string[];
  relevanceScore: number;
  reason: string;
  imageUrl?: string;
  publishedAt: Date;
  readingTime: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface MemecoinAlert {
  symbol: string;
  name: string;
  alertType: 'surge' | 'drop' | 'whale_activity' | 'new_listing';
  relevanceScore: number;
  priceChange24h: number;
  volume24h: number;
  message: string;
  timestamp: Date;
}

interface MarketInsight {
  insightId: string;
  type: 'portfolio' | 'market_trend' | 'sentiment' | 'prediction';
  title: string;
  description: string;
  relevanceScore: number;
  relatedSymbols: string[];
  actionable: boolean;
  confidence: number;
  timestamp: Date;
}

interface RecommendationData {
  recommendations: ContentRecommendation[];
  memecoinAlerts: MemecoinAlert[];
  marketInsights: MarketInsight[];
  lastUpdated: Date;
  cacheHit: boolean;
}

export default function RecommendedContent() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'alerts' | 'insights'>('articles');

  useEffect(() => {
    fetchRecommendations();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRecommendations, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/user/recommendations', {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (articleId: string) => {
    // Track article click
    const startTime = Date.now();
    
    // Navigate to article
    window.location.href = `/articles/${articleId}`;
    
    // Track read event after navigation
    setTimeout(async () => {
      const readDuration = Math.floor((Date.now() - startTime) / 1000);
      try {
        await axios.post(
          '/api/user/track-read',
          {
            articleId,
            readDuration,
            completed: false, // Will be updated when user finishes reading
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      } catch (error) {
        console.error('Error tracking read event:', error);
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchRecommendations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Recommended for You</h2>
            <p className="text-blue-100 text-sm">
              Powered by AI • Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'articles'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Articles ({data.recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition relative ${
              activeTab === 'alerts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alerts ({data.memecoinAlerts.length})
            {data.memecoinAlerts.length > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'insights'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Insights ({data.marketInsights.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'articles' && (
          <div className="space-y-4">
            {data.recommendations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No recommendations yet. Start reading articles to get personalized suggestions!
              </p>
            ) : (
              data.recommendations.map(article => (
                <div
                  key={article.articleId}
                  onClick={() => handleArticleClick(article.articleId)}
                  className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                >
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {article.category}
                      </span>
                      <span className="text-gray-500">
                        {article.readingTime} min read
                      </span>
                      {article.difficulty && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {article.difficulty}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-green-600 ml-auto">
                        <span className="font-medium">
                          {Math.round(article.relevanceScore * 100)}% match
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {article.reason}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {data.memecoinAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No active alerts. We'll notify you when there's significant memecoin activity!
              </p>
            ) : (
              data.memecoinAlerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.alertType === 'surge'
                      ? 'bg-green-50 border-green-500'
                      : alert.alertType === 'drop'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {alert.name} ({alert.symbol})
                        </h3>
                        <span
                          className={`text-sm font-bold ${
                            alert.priceChange24h > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {alert.priceChange24h > 0 ? '+' : ''}
                          {alert.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Volume: ${(alert.volume24h / 1000000).toFixed(2)}M</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-500 mb-1">Relevance</div>
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(alert.relevanceScore * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {data.marketInsights.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No insights available. Add coins to your portfolio to get personalized market analysis!
              </p>
            ) : (
              data.marketInsights.map(insight => (
                <div
                  key={insight.insightId}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          insight.type === 'portfolio'
                            ? 'bg-blue-500'
                            : insight.type === 'market_trend'
                            ? 'bg-purple-500'
                            : insight.type === 'sentiment'
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                        }`}
                      ></span>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    </div>
                    {insight.actionable && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        Actionable
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {insight.relatedSymbols.length > 0 && (
                        <div className="flex gap-1">
                          {insight.relatedSymbols.slice(0, 3).map(symbol => (
                            <span
                              key={symbol}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              {symbol}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span>•</span>
                      <span>{new Date(insight.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {data.cacheHit ? '⚡ Cached' : '🔄 Live'} • Updated {new Date(data.lastUpdated).toLocaleString()}
          </span>
          <a
            href="/dashboard/preferences"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Customize Preferences →
          </a>
        </div>
      </div>
    </div>
  );
}
