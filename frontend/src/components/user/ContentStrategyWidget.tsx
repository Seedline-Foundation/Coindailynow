/**
 * Content Strategy Widget - Task 76
 * User dashboard widget for viewing personalized content strategy insights
 */

import React, { useState, useEffect } from 'react';

interface StrategyStats {
  keywords: {
    active: number;
  };
  topicClusters: {
    active: number;
  };
  contentCalendar: {
    planned: number;
    published: number;
  };
  trends: {
    active: number;
  };
}

export const ContentStrategyWidget: React.FC = () => {
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendingKeywords, setTrendingKeywords] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch statistics
      const statsRes = await fetch('/api/content-strategy/statistics');
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData);
      }

      // Fetch trending keywords
      const keywordsRes = await fetch('/api/content-strategy/keywords?priority=HIGH&limit=5');
      const keywordsData = await keywordsRes.json();
      
      if (keywordsData.success) {
        setTrendingKeywords(keywordsData.keywords.filter((k: any) => k.trend === 'RISING' || k.trend === 'VIRAL'));
      }
    } catch (error) {
      console.error('Failed to fetch content strategy data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Unable to load content strategy data</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">📊 Content Strategy</h3>
          <p className="text-sm text-gray-600">Strategic insights & trending topics</p>
        </div>
        <div className="text-3xl">🎯</div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Active Keywords</div>
          <div className="text-2xl font-bold text-blue-600">{stats.keywords.active}</div>
          <div className="text-xs text-gray-400 mt-1">Targeting opportunities</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Viral Trends</div>
          <div className="text-2xl font-bold text-orange-600">{stats.trends.active}</div>
          <div className="text-xs text-gray-400 mt-1">Hot topics now</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Planned Content</div>
          <div className="text-2xl font-bold text-green-600">{stats.contentCalendar.planned}</div>
          <div className="text-xs text-gray-400 mt-1">Articles scheduled</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">Published</div>
          <div className="text-2xl font-bold text-purple-600">{stats.contentCalendar.published}</div>
          <div className="text-xs text-gray-400 mt-1">Recent articles</div>
        </div>
      </div>

      {/* Trending Keywords */}
      {trendingKeywords.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-gray-900">🔥 Trending Keywords</h4>
            <span className="text-xs text-gray-500">{trendingKeywords.length} active</span>
          </div>
          
          <div className="space-y-2">
            {trendingKeywords.slice(0, 5).map((keyword) => (
              <div key={keyword.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{keyword.keyword}</div>
                  <div className="text-xs text-gray-500">
                    {keyword.region} • {keyword.category}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    keyword.trend === 'VIRAL' ? 'bg-purple-100 text-purple-800' :
                    keyword.trend === 'RISING' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {keyword.trend}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(keyword.searchVolume / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Insights */}
      <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Strategic Insights</h4>
            <p className="text-sm text-blue-50">
              {stats.trends.active > 10 
                ? `${stats.trends.active} viral trends detected! Perfect time to create trending content.`
                : stats.contentCalendar.planned > 50
                ? `${stats.contentCalendar.planned} articles scheduled. Excellent planning ahead!`
                : `${stats.keywords.active} keywords active. Consider expanding your keyword portfolio.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>📚 {stats.topicClusters.active} Clusters</span>
            <span>🎯 African + Global Focus</span>
          </div>
          <button
            onClick={fetchData}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentStrategyWidget;
