/**
 * RAO Performance Widget - User Dashboard
 * Task 75: Optimized for AI Discovery Status
 */

'use client';

import React, { useState, useEffect } from 'react';

interface PerformanceStats {
  totalCitations: number;
  totalOverviews: number;
  avgSemanticRelevance: number;
  citationsBySource: Array<{ source: string; count: number }>;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export default function RAOPerformanceWidget() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rao-performance-proxy/statistics?timeframe=${timeframe}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching RAO stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>Unable to load RAO performance data</p>
        </div>
      </div>
    );
  }

  // Calculate overall score
  const totalContent = stats.distribution.excellent + stats.distribution.good + 
                       stats.distribution.fair + stats.distribution.poor;
  const score = totalContent > 0 
    ? ((stats.distribution.excellent * 100 + stats.distribution.good * 75 + 
        stats.distribution.fair * 50 + stats.distribution.poor * 25) / totalContent)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">AI Discovery Status</h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">24h</option>
            <option value="week">7d</option>
            <option value="month">30d</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Overall Score */}
        <div className={`${getScoreBackground(score)} p-4 rounded-lg text-center`}>
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">
            RAO Performance Score
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCitations}</div>
            <div className="text-xs text-gray-600">LLM Citations</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalOverviews}</div>
            <div className="text-xs text-gray-600">AI Overviews</div>
          </div>
        </div>

        {/* Semantic Relevance */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Semantic Relevance</span>
            <span className="font-semibold text-gray-800">
              {(stats.avgSemanticRelevance * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.avgSemanticRelevance * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content Distribution */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Content Performance</div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.distribution.excellent}</div>
              <div className="text-xs text-gray-500">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.distribution.good}</div>
              <div className="text-xs text-gray-500">Good</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.distribution.fair}</div>
              <div className="text-xs text-gray-500">Fair</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.distribution.poor}</div>
              <div className="text-xs text-gray-500">Poor</div>
            </div>
          </div>
        </div>

        {/* Top AI Sources */}
        {stats.citationsBySource.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Top AI Sources</div>
            <div className="space-y-2">
              {stats.citationsBySource.slice(0, 5).map(source => (
                <div key={source.source} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate">{source.source}</span>
                  <span className="font-semibold text-gray-800">{source.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              stats.totalCitations > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {stats.totalCitations > 0 ? 'Being cited by AI systems' : 'Not yet cited'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              stats.totalOverviews > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {stats.totalOverviews > 0 ? 'Appearing in AI overviews' : 'Not in AI overviews'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              stats.avgSemanticRelevance >= 0.7 ? 'bg-green-500' : 
              stats.avgSemanticRelevance >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
              {stats.avgSemanticRelevance >= 0.7 ? 'Excellent semantic optimization' :
               stats.avgSemanticRelevance >= 0.5 ? 'Good semantic optimization' :
               'Needs semantic improvement'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
