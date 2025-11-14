/**
 * Social Media & Community Engagement Dashboard (Task 78)
 * 
 * Super Admin dashboard for comprehensive social media management:
 * - Platform accounts overview
 * - Post scheduling and performance
 * - Community group management
 * - Influencer partnerships
 * - Campaign tracking
 * - Engagement automation
 * - Analytics and insights
 * 
 * Target: 10K+ followers in 60 days, 5%+ daily engagement rate
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  Globe,
  Calendar,
  BarChart3,
  UserPlus,
  Heart,
  Share2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Activity,
  Settings,
} from 'lucide-react';

interface SocialMediaStats {
  overview: {
    totalAccounts: number;
    totalPosts: number;
    totalFollowers: number;
    avgEngagementRate: number;
    totalCommunityGroups: number;
    totalCommunityMembers: number;
    totalInfluencers: number;
    partnerInfluencers: number;
    activeCollaborations: number;
    totalCampaigns: number;
    activeAutomations: number;
  };
  recentPerformance: {
    period: string;
    postsPublished: number;
    totalEngagements: number;
    totalReach: number;
    avgEngagementPerPost: number;
  };
  topPosts: any[];
  platformBreakdown: any[];
}

export default function SocialMediaDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'posts' | 'communities' | 'influencers' | 'campaigns' | 'automations'>('overview');
  const [stats, setStats] = useState<SocialMediaStats | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch based on active tab
      switch (activeTab) {
        case 'overview':
          await fetchStatistics();
          break;
        case 'accounts':
          await fetchAccounts();
          break;
        case 'posts':
          await fetchPosts();
          break;
        case 'communities':
          await fetchCommunities();
          break;
        case 'influencers':
          await fetchInfluencers();
          break;
        case 'campaigns':
          await fetchCampaigns();
          break;
        case 'automations':
          await fetchAutomations();
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    const response = await fetch('/api/social-media/statistics');
    const data = await response.json();
    if (data.success) {
      setStats(data.statistics);
    }
  };

  const fetchAccounts = async () => {
    const response = await fetch('/api/social-media/accounts');
    const data = await response.json();
    if (data.success) {
      setAccounts(data.accounts);
    }
  };

  const fetchPosts = async () => {
    const response = await fetch('/api/social-media/posts?limit=100');
    const data = await response.json();
    if (data.success) {
      setPosts(data.posts);
    }
  };

  const fetchCommunities = async () => {
    const response = await fetch('/api/social-media/communities');
    const data = await response.json();
    if (data.success) {
      setCommunities(data.groups);
    }
  };

  const fetchInfluencers = async () => {
    const response = await fetch('/api/social-media/influencers');
    const data = await response.json();
    if (data.success) {
      setInfluencers(data.influencers);
    }
  };

  const fetchCampaigns = async () => {
    const response = await fetch('/api/social-media/campaigns');
    const data = await response.json();
    if (data.success) {
      setCampaigns(data.campaigns);
    }
  };

  const fetchAutomations = async () => {
    const response = await fetch('/api/social-media/automations');
    const data = await response.json();
    if (data.success) {
      setAutomations(data.automations);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: any = {
      TWITTER: '𝕏',
      LINKEDIN: 'in',
      TELEGRAM: '✈',
      YOUTUBE: '▶',
      INSTAGRAM: '📷',
      TIKTOK: '♪',
      DISCORD: '🎮',
      WHATSAPP: '💬',
      REDDIT: '🤖',
    };
    return icons[platform] || '🌐';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      PROPOSED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Social Media & Community Engagement
            </h1>
            <p className="mt-2 text-gray-600">
              Manage social media accounts, communities, and influencer partnerships
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'accounts', label: 'Accounts', icon: Globe },
              { id: 'posts', label: 'Posts', icon: MessageSquare },
              { id: 'communities', label: 'Communities', icon: Users },
              { id: 'influencers', label: 'Influencers', icon: Star },
              { id: 'campaigns', label: 'Campaigns', icon: Target },
              { id: 'automations', label: 'Automation', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && !accounts.length ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading social media data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Followers</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatNumber(stats.overview.totalFollowers)}
                      </p>
                    </div>
                    <UserPlus className="w-12 h-12 text-blue-600 opacity-20" />
                  </div>
                  <div className="mt-4 text-sm">
                    <span className="text-green-600">Target: 10K in 60 days</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Avg Engagement</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.overview.avgEngagementRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
                  </div>
                  <div className="mt-4 text-sm">
                    <span className={stats.overview.avgEngagementRate >= 5 ? 'text-green-600' : 'text-orange-600'}>
                      {stats.overview.avgEngagementRate >= 5 ? '✓ Target met (5%)' : 'Target: 5%'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Accounts</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stats.overview.totalAccounts}
                      </p>
                    </div>
                    <Globe className="w-12 h-12 text-purple-600 opacity-20" />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {stats.overview.totalPosts} posts published
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Community Members</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatNumber(stats.overview.totalCommunityMembers)}
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-indigo-600 opacity-20" />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {stats.overview.totalCommunityGroups} groups
                  </div>
                </div>
              </div>

              {/* Recent Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Performance (Last {stats.recentPerformance.period})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm">Posts Published</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.recentPerformance.postsPublished}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Engagements</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(stats.recentPerformance.totalEngagements)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Total Reach</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatNumber(stats.recentPerformance.totalReach)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Avg Per Post</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.recentPerformance.avgEngagementPerPost}
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
                <div className="space-y-4">
                  {stats.platformBreakdown.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{getPlatformIcon(platform.platform)}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{platform.platform}</p>
                          <p className="text-sm text-gray-600">@{platform.accountHandle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Followers</p>
                          <p className="font-semibold text-gray-900">{formatNumber(platform.followers)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Engagement</p>
                          <p className="font-semibold text-gray-900">{platform.engagementRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Posts</p>
                          <p className="font-semibold text-gray-900">{platform.postCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Posts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Posts
                </h3>
                <div className="space-y-3">
                  {stats.topPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                            <span className="text-sm text-gray-600">@{post.accountHandle}</span>
                            <span className="text-sm text-gray-400">
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-900">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" /> {formatNumber(post.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" /> {formatNumber(post.comments)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" /> {formatNumber(post.shares)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" /> {formatNumber(post.impressions)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {post.performanceScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-600">Score</div>
                          <div className="mt-2 text-sm text-gray-600">
                            {post.engagementRate.toFixed(1)}% ER
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Influencer & Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Influencer Network
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Influencers</span>
                      <span className="font-semibold text-gray-900">{stats.overview.totalInfluencers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Partners</span>
                      <span className="font-semibold text-green-600">{stats.overview.partnerInfluencers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Collaborations</span>
                      <span className="font-semibold text-blue-600">{stats.overview.activeCollaborations}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Campaigns & Automation
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Campaigns</span>
                      <span className="font-semibold text-green-600">{stats.overview.totalCampaigns}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Automations</span>
                      <span className="font-semibold text-blue-600">{stats.overview.activeAutomations}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Community Groups</span>
                      <span className="font-semibold text-gray-900">{stats.overview.totalCommunityGroups}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Social Media Accounts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Synced</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{account.displayName}</div>
                            <div className="text-sm text-gray-500">@{account.accountHandle}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(account.followerCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.engagementRate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.postCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.lastSyncedAt ? new Date(account.lastSyncedAt).toLocaleString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
              </div>
              <div className="p-6 space-y-4">
                {posts.slice(0, 20).map((post) => (
                  <div key={post.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                          <span className="text-sm font-medium text-gray-900">{post.Account.displayName}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-gray-900 mb-3">{post.content}</p>
                        {post.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" /> {formatNumber(post.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" /> {formatNumber(post.comments)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="w-4 h-4" /> {formatNumber(post.shares)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" /> {formatNumber(post.impressions)}
                            </span>
                            <span className="text-green-600">
                              {post.engagementRate.toFixed(1)}% ER
                            </span>
                          </div>
                        )}
                        {post.scheduledAt && post.status === 'SCHEDULED' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {post.status === 'PUBLISHED' && (
                        <div className="ml-4 text-right">
                          <div className="text-xl font-bold text-green-600">
                            {post.performanceScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Community Groups</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {communities.map((group) => (
                      <tr key={group.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{group.name}</div>
                            {group.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{group.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl">{getPlatformIcon(group.platform)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(group.memberCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.region || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.engagementScore.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {group.influenceScore.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {group.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Influencers Tab */}
          {activeTab === 'influencers' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Influencer Network</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niche</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partnership</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collaborations</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {influencers.map((influencer) => (
                      <tr key={influencer.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{influencer.displayName || influencer.username}</div>
                            <div className="text-sm text-gray-500">@{influencer.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl">{getPlatformIcon(influencer.platform)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNumber(influencer.followerCount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{influencer.influenceScore.toFixed(0)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {influencer.engagementRate.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {influencer.niche || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(influencer.partnershipStatus)}`}>
                            {influencer.partnershipStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {influencer._count?.Collaborations || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Social Media Campaigns</h3>
              </div>
              <div className="p-6 space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        {campaign.description && (
                          <p className="text-gray-600 mb-3">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{campaign.objective}</span>
                          <span>•</span>
                          <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {campaign.performanceScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-600">Performance</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Followers Gained</p>
                        <p className="text-xl font-semibold text-gray-900">{formatNumber(campaign.followersGained)}</p>
                        {campaign.followerGoal && (
                          <p className="text-xs text-gray-500">Goal: {formatNumber(campaign.followerGoal)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engagements</p>
                        <p className="text-xl font-semibold text-gray-900">{formatNumber(campaign.totalEngagements)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reach</p>
                        <p className="text-xl font-semibold text-gray-900">{formatNumber(campaign.totalReach)}</p>
                        {campaign.reachGoal && (
                          <p className="text-xs text-gray-500">Goal: {formatNumber(campaign.reachGoal)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Engagement Rate</p>
                        <p className="text-xl font-semibold text-gray-900">{campaign.avgEngagementRate.toFixed(1)}%</p>
                        {campaign.engagementGoal && (
                          <p className="text-xs text-gray-500">Goal: {campaign.engagementGoal}%</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automations Tab */}
          {activeTab === 'automations' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Engagement Automations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Limit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {automations.map((automation) => (
                      <tr key={automation.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{automation.name}</div>
                            {automation.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{automation.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {automation.automationType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-2xl">{getPlatformIcon(automation.platform)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{automation.priority}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {automation.totalTriggers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {automation.totalActions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-green-600">
                            {automation.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {automation.dailyUsed} / {automation.dailyLimit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${automation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {automation.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

