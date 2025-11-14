/**
 * Real-time Analytics Dashboard
 * Interactive charts and data visualization for platform metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Eye,
  MousePointerClick,
  Globe,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Smartphone
} from 'lucide-react';

interface AnalyticsData {
  traffic: {
    total: number;
    change: number;
    trend: Array<{ time: string; value: number }>;
  };
  users: {
    total: number;
    active: number;
    new: number;
    returning: number;
    avgSessionDuration: number; // in minutes
    avgTimeOnPlatform: number; // in minutes per user
    bounceRate: number;
    trend: Array<{ time: string; value: number }>;
  };
  content: {
    views: number;
    engagement: number;
    avgTimeOnPage: number;
    shares: number;
    comments: number;
    likes: number;
    trend: Array<{ time: string; value: number }>;
  };
  revenue: {
    total: number;
    mrr: number;
    arr: number;
    change: number;
    subscriptions: number;
    churnRate: number;
    avgRevenuePerUser: number;
    trend: Array<{ time: string; value: number }>;
  };
  performance: {
    avgLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  conversions: {
    signupRate: number;
    premiumConversionRate: number;
    totalConversions: number;
  };
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topArticles: Array<{
    id: string;
    title: string;
    views: number;
    engagement: number;
    avgTimeSpent: number;
  }>;
  geography: Array<{
    country: string;
    users: number;
    percentage: number;
    avgTimeSpent: number;
  }>;
  userBehavior: {
    avgPagesPerSession: number;
    avgSessionsPerUser: number;
    peakHours: Array<{ hour: string; users: number }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`/api/super-admin/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Export analytics data as CSV
    const csv = 'data:text/csv;charset=utf-8,' + 
      'Metric,Value\n' +
      `Total Traffic,${analytics?.traffic.total}\n` +
      `Active Users,${analytics?.users.active}\n` +
      `Avg Time on Platform,${analytics?.users.avgTimeOnPlatform} min\n` +
      `Avg Session Duration,${analytics?.users.avgSessionDuration} min\n` +
      `Total Revenue,$${analytics?.revenue.total}\n` +
      `MRR,$${analytics?.revenue.mrr}\n` +
      `Bounce Rate,${analytics?.users.bounceRate}%\n` +
      `Conversion Rate,${analytics?.conversions.premiumConversionRate}%\n`;
    
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `analytics_${timeRange}_${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <span>Real-time Analytics</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Live platform performance metrics and insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-gray-300 font-medium">Time Range:</span>
          </div>
          <div className="flex items-center space-x-2">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range === '24h' ? 'Last 24 Hours' :
                 range === '7d' ? 'Last 7 Days' :
                 range === '30d' ? 'Last 30 Days' :
                 'Last 90 Days'}
              </button>
            ))}
          </div>
          <label className="flex items-center space-x-2 text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Eye className="h-8 w-8 text-blue-400" />
                <div className={`flex items-center space-x-1 text-sm ${
                  (analytics?.traffic.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(analytics?.traffic.change || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(analytics?.traffic.change || 0)}%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.traffic.total.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Total Page Views</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-green-400" />
                <span className="text-sm text-blue-400">
                  {analytics?.users.new} new
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.users.active.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Active Users</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.users.returning} returning</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-purple-400" />
                <span className="text-sm text-green-400">
                  {analytics?.users.bounceRate}% bounce
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.users.avgTimeOnPlatform.toFixed(1)} min</p>
              <p className="text-sm text-gray-400 mt-1">Avg Time on Platform</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.users.avgSessionDuration.toFixed(1)} min/session</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-yellow-400" />
                <div className={`flex items-center space-x-1 text-sm ${
                  (analytics?.revenue.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(analytics?.revenue.change || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(analytics?.revenue.change || 0)}%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">${analytics?.revenue.total.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Key Metrics - Row 2: Engagement & Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <MousePointerClick className="h-8 w-8 text-orange-400" />
                <span className="text-sm text-green-400">
                  {analytics?.content.engagement}%
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.content.views.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Content Views</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.content.avgTimeOnPage.toFixed(1)} min avg</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-cyan-400" />
                <span className="text-sm text-blue-400">
                  {analytics?.userBehavior.avgPagesPerSession.toFixed(1)} pages/session
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.content.shares.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Social Shares</p>
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                <span>{analytics?.content.comments} comments</span>
                <span>{analytics?.content.likes} likes</span>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-pink-400" />
                <span className="text-sm text-purple-400">
                  {analytics?.conversions.signupRate}% signup
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.conversions.totalConversions.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Total Conversions</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.conversions.premiumConversionRate}% to premium</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-400" />
                <span className="text-sm text-red-400">
                  {analytics?.revenue.churnRate}% churn
                </span>
              </div>
              <p className="text-3xl font-bold text-white">${analytics?.revenue.avgRevenuePerUser.toFixed(2)}</p>
              <p className="text-sm text-gray-400 mt-1">ARPU</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.revenue.subscriptions} subscriptions</p>
            </div>
          </div>

          {/* Key Metrics - Row 3: Performance & Technical */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="h-8 w-8 text-yellow-400" />
                <span className={`text-sm ${
                  (analytics?.performance.avgLoadTime || 0) < 2 ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {(analytics?.performance.avgLoadTime || 0) < 2 ? 'Fast' : 'Moderate'}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.performance.avgLoadTime.toFixed(2)}s</p>
              <p className="text-sm text-gray-400 mt-1">Avg Load Time</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.performance.apiResponseTime}ms API</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-green-400" />
                <span className={`text-sm ${
                  (analytics?.performance.uptime || 0) >= 99.9 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {analytics?.performance.uptime}%
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.performance.uptime.toFixed(2)}%</p>
              <p className="text-sm text-gray-400 mt-1">System Uptime</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.performance.errorRate}% error rate</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Globe className="h-8 w-8 text-indigo-400" />
                <div className="flex items-center space-x-1">
                  <Smartphone className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{analytics?.devices.mobile}%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.devices.desktop}%</p>
              <p className="text-sm text-gray-400 mt-1">Desktop Traffic</p>
              <p className="text-xs text-gray-500 mt-1">{analytics?.devices.tablet}% tablet</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-violet-400" />
                <span className="text-sm text-blue-400">
                  {analytics?.userBehavior.avgSessionsPerUser.toFixed(1)} sessions
                </span>
              </div>
              <p className="text-3xl font-bold text-white">${analytics?.revenue.mrr.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">MRR</p>
              <p className="text-xs text-gray-500 mt-1">${analytics?.revenue.arr.toLocaleString()} ARR</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Trend Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-blue-400" />
                  <span>Traffic Trend</span>
                </h2>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analytics?.traffic.trend.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-600 rounded-t hover:bg-blue-500 transition-colors cursor-pointer"
                      style={{
                        height: `${(point.value / Math.max(...analytics.traffic.trend.map(p => p.value))) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`${point.value.toLocaleString()} views`}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2">{point.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Activity Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  <span>User Activity</span>
                </h2>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analytics?.users.trend.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-green-600 rounded-t hover:bg-green-500 transition-colors cursor-pointer"
                      style={{
                        height: `${(point.value / Math.max(...analytics.users.trend.map(p => p.value))) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`${point.value.toLocaleString()} users`}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2">{point.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-yellow-400" />
                  <span>Revenue Trend</span>
                </h2>
                <div className="text-right">
                  <p className="text-sm text-gray-400">MRR</p>
                  <p className="text-lg font-bold text-white">${analytics?.revenue.mrr.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {analytics?.revenue.trend.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-yellow-600 rounded-t hover:bg-yellow-500 transition-colors cursor-pointer"
                      style={{
                        height: `${(point.value / Math.max(...analytics.revenue.trend.map(p => p.value))) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`$${point.value.toLocaleString()}`}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2">{point.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-purple-400" />
                  <span>Geographic Distribution</span>
                </h2>
              </div>
              <div className="space-y-3">
                {analytics?.geography.map((location, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">{location.country}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500">{location.avgTimeSpent.toFixed(1)} min</span>
                        <span className="text-sm text-gray-400">{location.users.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Articles */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <span>Top Performing Articles</span>
            </h2>
            <div className="space-y-3">
              {analytics?.topArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                      <span className="text-sm font-bold text-white">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{article.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.views.toLocaleString()} views</span>
                        </span>
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <MousePointerClick className="h-3 w-3" />
                          <span>{article.engagement}% engagement</span>
                        </span>
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>{article.avgTimeSpent.toFixed(1)} min avg</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

