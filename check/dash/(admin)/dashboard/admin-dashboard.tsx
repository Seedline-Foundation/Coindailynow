'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

// Mock data - replace with real API calls
const mockDashboardData = {
  stats: {
    totalArticles: 1247,
    pendingApproval: 12,
    totalUsers: 18429,
    activeUsers: 8429,
    totalRevenue: 84729,
    todayRevenue: 2847,
    aiProcessingStatus: 94,
    forumThreads: 324
  },
  recentActivity: [
    { id: 1, type: 'article', title: 'Bitcoin breaks $50k resistance', author: 'John Doe', time: '5 min ago' },
    { id: 2, type: 'user', title: 'New premium subscription', author: 'Jane Smith', time: '12 min ago' },
    { id: 3, type: 'forum', title: 'Hot discussion in Trading Strategies', author: 'Mike Wilson', time: '18 min ago' },
    { id: 4, type: 'revenue', title: 'Ad revenue milestone reached', author: 'System', time: '1 hour ago' }
  ],
  pendingApprovals: [
    { id: 1, title: 'Ethereum 2.0 Update: What Investors Need to Know', author: 'Sarah Johnson', submitted: '2 hours ago', category: 'crypto-news' },
    { id: 2, title: 'Top 5 Memecoins to Watch This Week', author: 'Alex Chen', submitted: '3 hours ago', category: 'market-analysis' },
    { id: 3, title: 'DeFi Protocol Hack: $10M Stolen', author: 'Breaking News Bot', submitted: '4 hours ago', category: 'breaking-news' }
  ],
  performanceMetrics: {
    pageViews: { current: 145234, change: 12.5 },
    bounceRate: { current: 32.1, change: -5.2 },
    avgSessionDuration: { current: 245, change: 8.7 },
    conversionRate: { current: 2.8, change: 15.3 }
  }
};

export default function AdminDashboard() {
  const [data] = useState(mockDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to CoinDaily&apos;s comprehensive admin panel</p>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.totalArticles.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.pendingApproval}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content grid - left and right columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left column - spans 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pending Approvals */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">News Queued for Approval</h2>
                  <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-sm font-medium">
                    {data.stats.pendingApproval} pending
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.pendingApprovals.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          By {item.author} • {item.submitted}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {item.category}
                        </span>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    View all pending articles →
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.performanceMetrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {key === 'avgSessionDuration' ? `${value.current}s` : 
                         key === 'bounceRate' || key === 'conversionRate' ? `${value.current}%` : 
                         value.current.toLocaleString()}
                      </p>
                      <p className={`text-sm ${value.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {value.change > 0 ? '+' : ''}{value.change}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 text-center group">
                  <div className="text-blue-600 dark:text-blue-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Create Article
                  </span>
                </button>

                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 text-center group">
                  <div className="text-green-600 dark:text-green-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                    Manage Users
                  </span>
                </button>

                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 text-center group">
                  <div className="text-purple-600 dark:text-purple-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    View Analytics
                  </span>
                </button>

                <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-400 text-center group">
                  <div className="text-yellow-600 dark:text-yellow-400 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                    System Settings
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right column - sidebar */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'article' ? 'bg-blue-500' :
                        activity.type === 'user' ? 'bg-green-500' :
                        activity.type === 'forum' ? 'bg-purple-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.author} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Processing</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{data.stats.aiProcessingStatus}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">CDN</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Degraded</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today&apos;s Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">${data.stats.todayRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Articles Published</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
