/**
 * Content SEO Widget - User Dashboard
 * Simplified SEO optimization widget for regular users
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Zap, BarChart3 } from 'lucide-react';

interface UserSEOStats {
  contentCount: number;
  averageScore: number;
  improvementNeeded: number;
  recentOptimizations: {
    contentId: string;
    title: string;
    score: number;
    date: string;
  }[];
}

export const ContentSEOWidget: React.FC<{ userId: string }> = ({ userId }) => {
  const [stats, setStats] = useState<UserSEOStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, [userId]);

  const loadUserStats = async () => {
    try {
      // In a real implementation, this would filter by user's content
      const response = await fetch('/api/content-seo/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      const userStats: UserSEOStats = {
        contentCount: data.optimizations.length,
        averageScore: data.optimizations.length > 0
          ? Math.round(
              data.optimizations.reduce((sum: number, opt: any) => sum + opt.overallScore, 0) / data.optimizations.length
            )
          : 0,
        improvementNeeded: data.optimizations.filter((opt: any) => opt.overallScore < 60).length,
        recentOptimizations: data.optimizations.slice(0, 3).map((opt: any) => ({
          contentId: opt.contentId,
          title: opt.optimizedTitle || opt.contentId,
          score: opt.overallScore,
          date: new Date(opt.lastOptimized).toLocaleDateString(),
        })),
      };

      setStats(userStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user SEO stats:', error);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Zap className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SEO Optimization</h3>
        <BarChart3 className="w-5 h-5 text-blue-600" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.contentCount}</div>
          <div className="text-xs text-gray-500">Content</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.averageScore}
          </div>
          <div className="text-xs text-gray-500">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.improvementNeeded}</div>
          <div className="text-xs text-gray-500">Need Work</div>
        </div>
      </div>

      {/* Recent Optimizations */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Optimizations</h4>
        <div className="space-y-2">
          {stats.recentOptimizations.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getScoreIcon(item.score)}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500">{item.date}</div>
                </div>
              </div>
              <div className={`text-sm font-bold ${getScoreColor(item.score)} ml-2`}>
                {item.score}
              </div>
            </div>
          ))}

          {stats.recentOptimizations.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No optimizations yet
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      {stats.improvementNeeded > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>{stats.improvementNeeded}</strong> content pieces need optimization.
              Focus on improving titles, readability, and internal links.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentSEOWidget;
