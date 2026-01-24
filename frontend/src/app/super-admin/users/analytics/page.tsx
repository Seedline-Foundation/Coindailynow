/**
 * User Analytics Page
 * Advanced analytics and insights about user behavior
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  MousePointer,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  avgSessionDuration: number;
  pageViewsPerSession: number;
  bounceRate: number;
  conversionRate: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topCountries: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
}

export default function UserAnalyticsPage() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'engagement' | 'retention'>('users');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const response = await fetch(`/api/super-admin/users/analytics?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-white">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <span>User Analytics</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Comprehensive insights into user behavior and engagement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-400" />
            <span className="text-sm text-green-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12%
            </span>
          </div>
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-3xl font-bold text-white">{analytics.totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-green-400" />
            <span className="text-sm text-green-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8%
            </span>
          </div>
          <p className="text-sm text-gray-400">Active Users</p>
          <p className="text-3xl font-bold text-white">{analytics.activeUsers.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-purple-400" />
            <span className="text-sm text-green-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +25%
            </span>
          </div>
          <p className="text-sm text-gray-400">New Users</p>
          <p className="text-3xl font-bold text-white">{analytics.newUsers.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-yellow-400" />
            <span className="text-sm text-green-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +3%
            </span>
          </div>
          <p className="text-sm text-gray-400">Retention Rate</p>
          <p className="text-3xl font-bold text-white">{analytics.retentionRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-400" />
            Session Duration
          </h3>
          <p className="text-3xl font-bold text-white">{Math.floor(analytics.avgSessionDuration / 60)}m {analytics.avgSessionDuration % 60}s</p>
          <p className="text-sm text-gray-400 mt-2">Average time per session</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-green-400" />
            Page Views
          </h3>
          <p className="text-3xl font-bold text-white">{analytics.pageViewsPerSession.toFixed(1)}</p>
          <p className="text-sm text-gray-400 mt-2">Pages per session</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MousePointer className="h-5 w-5 mr-2 text-purple-400" />
            Bounce Rate
          </h3>
          <p className="text-3xl font-bold text-white">{analytics.bounceRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-2">Single page visits</p>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Monitor className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-gray-300">Desktop</span>
                </div>
                <span className="text-white font-semibold">{analytics.deviceBreakdown.desktop}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.deviceBreakdown.desktop}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-gray-300">Mobile</span>
                </div>
                <span className="text-white font-semibold">{analytics.deviceBreakdown.mobile}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.deviceBreakdown.mobile}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Monitor className="h-5 w-5 text-purple-400 mr-2" />
                  <span className="text-gray-300">Tablet</span>
                </div>
                <span className="text-white font-semibold">{analytics.deviceBreakdown.tablet}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${analytics.deviceBreakdown.tablet}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-400" />
            Top Countries
          </h3>
          <div className="space-y-3">
            {analytics.topCountries.slice(0, 5).map((country, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm text-gray-300 w-32">{country.country}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-sm text-white font-semibold w-20 text-right">
                  {country.users.toLocaleString()} ({country.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Activity */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Daily Active Users</p>
            <p className="text-2xl font-bold text-white mt-2">
              {analytics.engagementMetrics.dailyActiveUsers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Weekly Active Users</p>
            <p className="text-2xl font-bold text-white mt-2">
              {analytics.engagementMetrics.weeklyActiveUsers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">Monthly Active Users</p>
            <p className="text-2xl font-bold text-white mt-2">
              {analytics.engagementMetrics.monthlyActiveUsers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
        </div>
      </div>

      {/* User Growth Chart Placeholder */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Growth Trend</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500">Chart visualization would appear here</p>
            <p className="text-sm text-gray-600 mt-1">Integrate with Chart.js or Recharts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
