// frontend/src/components/user/OptimizationWidget.tsx
// Task 70: User Optimization Stats Widget

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Target,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface OptimizationStats {
  performanceScore: number;
  activeCycles: number;
  runningTests: number;
  recentInsights: number;
  improvements: {
    traffic: number;
    engagement: number;
    rankings: number;
  };
}

export default function OptimizationWidget() {
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/optimization/user-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching optimization stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Platform Optimization</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-red-600 text-sm">Failed to load optimization stats</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Platform Optimization</h3>
          <p className="text-sm text-gray-600">AI-driven performance improvements</p>
        </div>
        <Activity className="w-5 h-5 text-blue-600" />
      </div>

      {/* Performance Score */}
      <div className={`rounded-lg p-4 mb-4 ${getScoreBgColor(stats.performanceScore)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Overall Performance</p>
            <p className={`text-3xl font-bold mt-1 ${getScoreColor(stats.performanceScore)}`}>
              {stats.performanceScore}
              <span className="text-lg">/100</span>
            </p>
          </div>
          <TrendingUp className={`w-8 h-8 ${getScoreColor(stats.performanceScore)}`} />
        </div>
      </div>

      {/* Optimization Metrics */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Active Cycles</p>
              <p className="text-xs text-gray-600">Ongoing optimizations</p>
            </div>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.activeCycles}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Running Tests</p>
              <p className="text-xs text-gray-600">A/B experiments</p>
            </div>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.runningTests}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New Insights</p>
              <p className="text-xs text-gray-600">Optimization opportunities</p>
            </div>
          </div>
          <span className="text-lg font-bold text-gray-900">{stats.recentInsights}</span>
        </div>
      </div>

      {/* Improvements */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Recent Improvements</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Traffic</span>
            <span className={`text-sm font-semibold ${
              stats.improvements.traffic >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.improvements.traffic >= 0 ? '+' : ''}{stats.improvements.traffic}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Engagement</span>
            <span className={`text-sm font-semibold ${
              stats.improvements.engagement >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.improvements.engagement >= 0 ? '+' : ''}{stats.improvements.engagement}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rankings</span>
            <span className={`text-sm font-semibold ${
              stats.improvements.rankings >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.improvements.rankings >= 0 ? '+' : ''}{stats.improvements.rankings}%
            </span>
          </div>
        </div>
      </div>

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/optimization-details'}
          className="w-full flex items-center justify-between text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          <span>View detailed analytics</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">Auto-updates every minute</p>
      </div>
    </div>
  );
}
