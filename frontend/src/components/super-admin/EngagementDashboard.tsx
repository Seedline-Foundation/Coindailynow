// frontend/src/components/super-admin/EngagementDashboard.tsx
// Task 66: Super Admin Engagement Analytics Dashboard

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Award,
  Bell,
  Smartphone,
  Headphones,
  Activity,
  Star,
  Target,
  Calendar,
} from 'lucide-react';

interface EngagementAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    avgEngagementScore: number;
    pwaInstalls: number;
    pushSubscriptions: number;
    voiceArticles: number;
  };
  rewards: {
    total: number;
    count: number;
  };
  topUsers: Array<{
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    engagementScore: number;
    articlesRead: number;
    currentStreak: number;
  }>;
  recentMilestones: Array<{
    id: string;
    type: string;
    threshold: number;
    rewardPoints: number;
    achievedAt: string;
    User?: {
      username: string;
      avatarUrl?: string;
    };
  }>;
}

export default function EngagementDashboard() {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const to = new Date();
      const from = new Date();
      
      switch (dateRange) {
        case '7d':
          from.setDate(from.getDate() - 7);
          break;
        case '30d':
          from.setDate(from.getDate() - 30);
          break;
        case '90d':
          from.setDate(from.getDate() - 90);
          break;
      }

      const response = await fetch(
        `/api/engagement/analytics?from=${from.toISOString()}&to=${to.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {error || 'Failed to load analytics data'}
          </p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, rewards, topUsers, recentMilestones } = analytics;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Engagement & Personalization
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor user engagement, rewards, and platform adoption
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Total Users"
          value={overview.totalUsers.toLocaleString()}
          bgColor="bg-blue-50"
        />

        <StatCard
          icon={<Activity className="w-6 h-6 text-green-600" />}
          label="Active Users"
          value={overview.activeUsers.toLocaleString()}
          bgColor="bg-green-50"
          subtitle={`${((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}%`}
        />

        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          label="Avg Engagement"
          value={overview.avgEngagementScore.toFixed(1)}
          bgColor="bg-purple-50"
          subtitle="Score"
        />

        <StatCard
          icon={<Smartphone className="w-6 h-6 text-indigo-600" />}
          label="PWA Installs"
          value={overview.pwaInstalls.toLocaleString()}
          bgColor="bg-indigo-50"
        />

        <StatCard
          icon={<Bell className="w-6 h-6 text-yellow-600" />}
          label="Push Subscribers"
          value={overview.pushSubscriptions.toLocaleString()}
          bgColor="bg-yellow-50"
        />

        <StatCard
          icon={<Headphones className="w-6 h-6 text-pink-600" />}
          label="Voice Articles"
          value={overview.voiceArticles.toLocaleString()}
          bgColor="bg-pink-50"
        />
      </div>

      {/* Rewards Overview */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Gamification Rewards
              </h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {rewards.total.toLocaleString()} Points
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {rewards.count.toLocaleString()} rewards distributed
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Average per reward</p>
            <p className="text-2xl font-bold text-gray-900">
              {(rewards.total / Math.max(rewards.count, 1)).toFixed(0)} pts
            </p>
          </div>
        </div>
      </div>

      {/* Top Engaged Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Top Engaged Users
          </h3>
        </div>

        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                {index + 1}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.username.substring(0, 2).toUpperCase()}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.username}
                </p>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900">
                    {user.engagementScore.toFixed(0)}
                  </p>
                  <p className="text-gray-600">Score</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{user.articlesRead}</p>
                  <p className="text-gray-600">Articles</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{user.currentStreak}</p>
                  <p className="text-gray-600">Streak</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Milestones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Milestones
          </h3>
        </div>

        <div className="space-y-2">
          {recentMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {milestone.User?.username || 'User'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {milestone.type.replace('_', ' ')} - {milestone.threshold}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{milestone.rewardPoints} pts
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(milestone.achievedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={fetchAnalytics}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>

        <button
          onClick={() => window.location.href = '/super-admin/engagement/settings'}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Engagement Settings
        </button>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  subtitle?: string;
}

function StatCard({ icon, label, value, bgColor, subtitle }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

