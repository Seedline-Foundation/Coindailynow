/**
 * Social Media Engagement Widget (Task 78)
 * 
 * User-facing widget displaying:
 * - Social media statistics
 * - Recent posts and engagement
 * - Community highlights
 * - Influencer features
 * 
 * Simplified view for regular users
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  Star,
  Activity,
} from 'lucide-react';

interface SocialMediaStats {
  totalFollowers: number;
  avgEngagementRate: number;
  recentPosts: number;
  totalReach: number;
  communityMembers: number;
}

export default function SocialMediaWidget() {
  const [stats, setStats] = useState<SocialMediaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/social-media/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalFollowers: data.statistics.overview.totalFollowers,
          avgEngagementRate: data.statistics.overview.avgEngagementRate,
          recentPosts: data.statistics.recentPerformance.postsPublished,
          totalReach: data.statistics.recentPerformance.totalReach,
          communityMembers: data.statistics.overview.totalCommunityMembers,
        });
      }
    } catch (error) {
      console.error('Failed to fetch social media stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-48">
          <Activity className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const isEngagementGood = stats.avgEngagementRate >= 5;
  const isFollowersGood = stats.totalFollowers >= 10000;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Social Media</h3>
            <p className="text-sm text-gray-600">Community Engagement</p>
          </div>
        </div>
        <Activity className="w-5 h-5 text-green-600" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className={`text-xs font-medium ${isFollowersGood ? 'text-green-600' : 'text-orange-600'}`}>
              {isFollowersGood ? '✓ Target' : 'Growing'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalFollowers)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Followers</div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className={`text-xs font-medium ${isEngagementGood ? 'text-green-600' : 'text-orange-600'}`}>
              {isEngagementGood ? '✓ Target' : 'Growing'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avgEngagementRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-600 mt-1">Engagement Rate</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">Recent Posts (7d)</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.recentPosts}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-gray-600">Total Reach (7d)</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{formatNumber(stats.totalReach)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-pink-600" />
            <span className="text-sm text-gray-600">Community Members</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{formatNumber(stats.communityMembers)}</span>
        </div>
      </div>

      {/* Growth Targets */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Growth Targets</h4>
            <div className="space-y-2 text-xs text-blue-800">
              <div className="flex items-center justify-between">
                <span>10K+ Followers in 60 days</span>
                <span className={isFollowersGood ? 'text-green-600 font-semibold' : 'text-blue-600'}>
                  {isFollowersGood ? '✓ Achieved' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>5%+ Daily Engagement Rate</span>
                <span className={isEngagementGood ? 'text-green-600 font-semibold' : 'text-blue-600'}>
                  {isEngagementGood ? '✓ Achieved' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>African Market Dominance</span>
                <span className="text-blue-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Platforms */}
      <div className="mt-6">
        <div className="text-xs text-gray-600 mb-3">Active Platforms</div>
        <div className="flex items-center justify-center gap-4">
          <span className="text-2xl" title="Twitter/X">𝕏</span>
          <span className="text-2xl" title="LinkedIn">in</span>
          <span className="text-2xl" title="Telegram">✈</span>
          <span className="text-2xl" title="YouTube">▶</span>
          <span className="text-2xl" title="Instagram">📷</span>
          <span className="text-2xl" title="TikTok">♪</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-green-600" />
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

