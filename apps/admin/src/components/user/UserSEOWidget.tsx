// User SEO Dashboard Widget - Task 60
// Simplified SEO stats for user dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  Eye,
  BarChart3,
} from 'lucide-react';

interface UserSEOStats {
  overallHealth: number;
  keywordsTracking: number;
  topRankings: number;
  issuesDetected: number;
  raoPerformance: {
    citations: number;
    aiOverviews: number;
  };
}

export default function UserSEOWidget() {
  const [stats, setStats] = useState<UserSEOStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/seo/user/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading SEO stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse text-center text-gray-400">
            Loading SEO stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="w-5 h-5 mr-2" />
          SEO Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Health</span>
            <span className={`text-2xl font-bold ${getHealthColor(stats.overallHealth)}`}>
              {stats.overallHealth}/100
            </span>
          </div>
          <Progress value={stats.overallHealth} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">{getHealthLabel(stats.overallHealth)}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Keywords Tracking */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-900">{stats.keywordsTracking}</span>
            </div>
            <p className="text-xs text-blue-700">Keywords Tracked</p>
          </div>

          {/* Top Rankings */}
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-green-900">{stats.topRankings}</span>
            </div>
            <p className="text-xs text-green-700">Top 10 Rankings</p>
          </div>

          {/* Issues Detected */}
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-lg font-bold text-orange-900">{stats.issuesDetected}</span>
            </div>
            <p className="text-xs text-orange-700">Active Issues</p>
          </div>

          {/* RAO Performance */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-lg font-bold text-purple-900">
                {stats.raoPerformance.citations + stats.raoPerformance.aiOverviews}
              </span>
            </div>
            <p className="text-xs text-purple-700">AI Mentions</p>
          </div>
        </div>

        {/* RAO Details */}
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-gray-700 mb-2">AI Discovery Performance</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">LLM Citations</span>
              <Badge variant="secondary">{stats.raoPerformance.citations}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI Overviews</span>
              <Badge variant="secondary">{stats.raoPerformance.aiOverviews}</Badge>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.location.href = '/super-admin/seo'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Eye className="w-4 h-4 inline mr-2" />
          View Full Dashboard
        </button>
      </CardContent>
    </Card>
  );
}

