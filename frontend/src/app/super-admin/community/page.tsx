/**
 * Community Management Dashboard
 * Moderation, reports, flagging, banning, and community analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Flag,
  Ban,
  UserX,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface ModerationItem {
  id: string;
  type: 'comment' | 'post' | 'user';
  content: string;
  author: string;
  authorId: string;
  reports: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  flaggedAt: string;
}

interface BannedUser {
  id: string;
  username: string;
  email: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
  permanent: boolean;
  violationCount: number;
}

interface CommunityAnalytics {
  totalComments: number;
  totalReports: number;
  totalBans: number;
  activeUsers: number;
  moderationRate: number;
  responseTime: number;
  topReasons: Array<{ reason: string; count: number }>;
  trend: Array<{ date: string; reports: number; bans: number }>;
}

export default function CommunityManagementPage() {
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'banned' | 'analytics'>('queue');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommunityData();
    const interval = setInterval(fetchCommunityData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCommunityData = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      
      const [queueRes, bannedRes, analyticsRes] = await Promise.all([
        fetch('/api/super-admin/community/moderation', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/super-admin/community/banned', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/super-admin/community/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (queueRes.ok && bannedRes.ok && analyticsRes.ok) {
        const queueData = await queueRes.json();
        const bannedData = await bannedRes.json();
        const analyticsData = await analyticsRes.json();
        
        setModerationQueue(queueData.items || []);
        setBannedUsers(bannedData.users || []);
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch('/api/super-admin/community/moderate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, action })
      });

      if (response.ok) {
        fetchCommunityData();
      }
    } catch (error) {
      console.error('Error moderating item:', error);
    }
  };

  const handleBan = async (userId: string, reason: string, duration?: number) => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch('/api/super-admin/community/ban', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, reason, duration })
      });

      if (response.ok) {
        fetchCommunityData();
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch('/api/super-admin/community/unban', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        fetchCommunityData();
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const filteredQueue = moderationQueue.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <span>Community Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Moderation, reports, flagging, banning, and analytics
          </p>
        </div>
        <button
          onClick={fetchCommunityData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-8 w-8 text-blue-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics?.totalComments.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Comments</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Flag className="h-8 w-8 text-yellow-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics?.totalReports}</p>
              <p className="text-sm text-gray-400">Total Reports</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-yellow-400">
            <Clock className="h-4 w-4" />
            <span>{moderationQueue.filter(i => i.status === 'pending').length} pending</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Ban className="h-8 w-8 text-red-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics?.totalBans}</p>
              <p className="text-sm text-gray-400">Total Bans</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-red-400">
            <UserX className="h-4 w-4" />
            <span>{bannedUsers.length} active</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{analytics?.moderationRate}%</p>
              <p className="text-sm text-gray-400">Moderation Rate</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{analytics?.responseTime}min avg response</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Moderation Queue</span>
            {moderationQueue.filter(i => i.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                {moderationQueue.filter(i => i.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('banned')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'banned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Ban className="h-4 w-4" />
            <span>Banned Users</span>
            {bannedUsers.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full">
                {bannedUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading community data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Moderation Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search content or author..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          filterStatus === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Moderation Items */}
              <div className="space-y-3">
                {filteredQueue.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-400">No items in moderation queue</p>
                  </div>
                ) : (
                  filteredQueue.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-3 rounded-lg ${
                            item.type === 'comment' ? 'bg-blue-500/20' :
                            item.type === 'post' ? 'bg-purple-500/20' :
                            'bg-red-500/20'
                          }`}>
                            {item.type === 'comment' ? (
                              <MessageSquare className="h-6 w-6 text-blue-400" />
                            ) : item.type === 'post' ? (
                              <Flag className="h-6 w-6 text-purple-400" />
                            ) : (
                              <Users className="h-6 w-6 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-white">{item.author}</span>
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-700 text-gray-300">
                                {item.type}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-3">{item.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span className="flex items-center space-x-1">
                                <Flag className="h-4 w-4" />
                                <span>{item.reports} reports</span>
                              </span>
                              <span>Reason: {item.reason}</span>
                              <span>{new Date(item.flaggedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {item.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleModerate(item.id, 'approve')}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleModerate(item.id, 'reject')}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleBan(item.authorId, item.reason)}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Banned Users Tab */}
          {activeTab === 'banned' && (
            <div className="space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Banned Users</h2>
                </div>
                <div className="p-6">
                  {bannedUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-400">No banned users</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bannedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-red-900/20 border border-red-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <UserX className="h-5 w-5 text-red-400" />
                                <div>
                                  <h3 className="text-sm font-semibold text-white">{user.username}</h3>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="text-gray-300">
                                  <span className="text-gray-400">Reason:</span> {user.reason}
                                </p>
                                <p className="text-gray-300">
                                  <span className="text-gray-400">Banned by:</span> {user.bannedBy}
                                </p>
                                <p className="text-gray-300">
                                  <span className="text-gray-400">Date:</span> {new Date(user.bannedAt).toLocaleString()}
                                </p>
                                <p className="text-gray-300">
                                  <span className="text-gray-400">Violations:</span> {user.violationCount}
                                </p>
                                {user.permanent ? (
                                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white">
                                    Permanent Ban
                                  </span>
                                ) : user.expiresAt && (
                                  <p className="text-gray-300">
                                    <span className="text-gray-400">Expires:</span> {new Date(user.expiresAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnban(user.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Unban
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Top Violation Reasons */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-6">Top Violation Reasons</h2>
                <div className="space-y-3">
                  {analytics.topReasons.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300">{item.reason}</span>
                        <span className="text-sm text-gray-400">{item.count} reports</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(item.count / analytics.topReasons[0].count) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation Trend */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-6">Moderation Trend</h2>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {analytics.trend.map((point, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                      <div className="w-full flex flex-col items-center space-y-1">
                        <div
                          className="w-full bg-red-600 rounded-t hover:bg-red-500 transition-colors cursor-pointer"
                          style={{
                            height: `${(point.bans / Math.max(...analytics.trend.map(p => p.bans))) * 50}%`,
                            minHeight: '4px'
                          }}
                          title={`${point.bans} bans`}
                        ></div>
                        <div
                          className="w-full bg-yellow-600 rounded-t hover:bg-yellow-500 transition-colors cursor-pointer"
                          style={{
                            height: `${(point.reports / Math.max(...analytics.trend.map(p => p.reports))) * 50}%`,
                            minHeight: '4px'
                          }}
                          title={`${point.reports} reports`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 mt-2">{point.date}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span className="text-sm text-gray-400">Bans</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                    <span className="text-sm text-gray-400">Reports</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

