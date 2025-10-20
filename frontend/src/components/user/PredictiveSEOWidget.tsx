// Predictive SEO User Widget - Task 68
// Simplified widget showing SEO intelligence insights for regular users

'use client';

import React, { useState, useEffect } from 'react';

interface UserSEOIntelligence {
  eeatScore: number;
  predictedTraffic: number;
  topKeywords: Array<{ keyword: string; trend: string }>;
  opportunities: number;
}

export default function PredictiveSEOWidget() {
  const [data, setData] = useState<UserSEOIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/predictive-seo/dashboard');
      const dashboardData = await response.json();
      
      setData({
        eeatScore: dashboardData.eeat?.avgScore || 0,
        predictedTraffic: dashboardData.forecasts?.trafficPredicted || 0,
        topKeywords: dashboardData.forecasts?.trends?.slice(0, 3) || [],
        opportunities: dashboardData.competitors?.opportunities || 0,
      });
    } catch (error) {
      console.error('Error loading SEO intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500 text-sm">SEO intelligence unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🔮 SEO Intelligence
        </h3>
        <button
          onClick={loadData}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* E-E-A-T Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Content Quality Score</span>
          <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(data.eeatScore)}`}>
            {data.eeatScore}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              data.eeatScore >= 80 ? 'bg-green-600' : 
              data.eeatScore >= 60 ? 'bg-yellow-600' : 
              'bg-red-600'
            }`}
            style={{ width: `${data.eeatScore}%` }}
          ></div>
        </div>
      </div>

      {/* Predicted Traffic */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Predicted Traffic (30d)</div>
            <div className="text-2xl font-bold text-blue-600">
              {data.predictedTraffic.toLocaleString()}
            </div>
          </div>
          <div className="text-4xl">📈</div>
        </div>
      </div>

      {/* Top Keywords */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">🎯 Trending Keywords</h4>
        <div className="space-y-2">
          {data.topKeywords.map((keyword, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">{keyword.keyword}</span>
              <span className="text-lg">{getTrendIcon(keyword.trend)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">SEO Opportunities</div>
            <div className="text-2xl font-bold text-purple-600">
              {data.opportunities}
            </div>
          </div>
          <div className="text-4xl">💡</div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Competitive gaps and ranking opportunities identified
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-blue-50 border-l-4 border-blue-600">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Higher E-E-A-T scores lead to better rankings. Focus on experience, expertise, authoritativeness, and trustworthiness.
        </p>
      </div>
    </div>
  );
}
