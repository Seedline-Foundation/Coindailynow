'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Send,
  Mail,
  Bell,
  Share2,
  Calendar,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  MessageSquare,
  Rss,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Search,
  Filter
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  type: 'email' | 'push' | 'social' | 'rss';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  channels: string[];
  scheduledFor: string;
  sentAt?: string;
  recipients: number;
  opened: number;
  clicked: number;
  conversions: number;
  createdBy: string;
}

interface SocialPost {
  id: string;
  content: string;
  platforms: ('facebook' | 'twitter' | 'linkedin' | 'instagram')[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  publishedAt?: string;
  reach: number;
  engagement: number;
  clicks: number;
  media?: string[];
}

interface DistributionMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRecipients: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgConversionRate: number;
  emailsSent: number;
  pushSent: number;
  socialPosts: number;
  rssSubscribers: number;
}

export default function DistributionPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'social' | 'email' | 'push' | 'rss'>('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [metrics, setMetrics] = useState<DistributionMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    loadDistributionData();
  }, []);

  const loadDistributionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/distribution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load distribution data');

      const data = await response.json();
      setMetrics(data.metrics);
      setCampaigns(data.campaigns);
      setSocialPosts(data.socialPosts);
    } catch (error) {
      console.error('Error loading distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDistributionData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'sent':
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-700 text-gray-300';
      case 'scheduled': return 'bg-blue-900 text-blue-300';
      case 'sent':
      case 'published': return 'bg-green-900 text-green-300';
      case 'failed': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredSocialPosts = socialPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading distribution data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Multi-channel Distribution</h1>
            <p className="text-gray-400">Manage campaigns across email, push, social media, and RSS</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Send className="w-8 h-8 text-blue-500" />
              <span className="text-green-500 text-sm">Active</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Campaigns</h3>
            <p className="text-3xl font-bold text-white">{metrics.totalCampaigns}</p>
            <p className="text-sm text-gray-400 mt-2">{metrics.activeCampaigns} active</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-500" />
              <span className="text-green-500 flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4" />
                {metrics.avgOpenRate.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Recipients</h3>
            <p className="text-3xl font-bold text-white">{metrics.totalRecipients.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-2">Avg. open rate</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-green-500" />
              <span className="text-green-500 flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4" />
                {metrics.avgClickRate.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Click Rate</h3>
            <p className="text-3xl font-bold text-white">{metrics.avgClickRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-2">Average across all channels</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-yellow-500" />
              <span className="text-green-500 flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4" />
                {metrics.avgConversionRate.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Conversion Rate</h3>
            <p className="text-3xl font-bold text-white">{metrics.avgConversionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-400 mt-2">Campaign goal conversions</p>
          </div>
        </div>
      )}

      {/* Channel Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-gray-400 text-sm">Email Campaigns</h3>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.emailsSent.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-gray-400 text-sm">Push Notifications</h3>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.pushSent.toLocaleString()}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-5 h-5 text-green-400" />
              <h3 className="text-gray-400 text-sm">Social Posts</h3>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.socialPosts}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Rss className="w-5 h-5 text-yellow-400" />
              <h3 className="text-gray-400 text-sm">RSS Subscribers</h3>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.rssSubscribers.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['campaigns', 'social', 'email', 'push', 'rss'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'scheduled', 'sent', 'published'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-semibold text-lg">{campaign.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status}
                    </span>
                    <span className="px-2 py-1 bg-purple-900 text-purple-300 text-xs rounded">
                      {campaign.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.recipients.toLocaleString()} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {campaign.scheduledFor}
                    </span>
                    <span>By {campaign.createdBy}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.channels.map((channel, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1">
                        {getPlatformIcon(channel)}
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {campaign.status === 'sent' && (
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Opened</div>
                    <div className="text-white font-semibold">
                      {campaign.opened.toLocaleString()} ({((campaign.opened / campaign.recipients) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Clicked</div>
                    <div className="text-white font-semibold">
                      {campaign.clicked.toLocaleString()} ({((campaign.clicked / campaign.recipients) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Conversions</div>
                    <div className="text-white font-semibold">
                      {campaign.conversions} ({((campaign.conversions / campaign.recipients) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Sent At</div>
                    <div className="text-white font-semibold">{campaign.sentAt}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredSocialPosts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(post.status)}`}>
                      {getStatusIcon(post.status)}
                      {post.status}
                    </span>
                    {post.scheduledFor && (
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.scheduledFor}
                      </span>
                    )}
                  </div>
                  <p className="text-white mb-3">{post.content}</p>
                  <div className="flex gap-2">
                    {post.platforms.map((platform, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded flex items-center gap-1">
                        {getPlatformIcon(platform)}
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {post.status === 'published' && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Reach</div>
                    <div className="text-white font-semibold">{post.reach.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Engagement</div>
                    <div className="text-white font-semibold">{post.engagement.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Clicks</div>
                    <div className="text-white font-semibold">{post.clicks}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Email/Push/RSS Tabs - Coming Soon */}
      {(activeTab === 'email' || activeTab === 'push' || activeTab === 'rss') && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              {activeTab === 'email' && <Mail className="w-16 h-16 mx-auto text-blue-500" />}
              {activeTab === 'push' && <Bell className="w-16 h-16 mx-auto text-purple-500" />}
              {activeTab === 'rss' && <Rss className="w-16 h-16 mx-auto text-yellow-500" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 capitalize">{activeTab} Management</h2>
            <p className="text-gray-400 mb-6">
              Dedicated {activeTab} management interface coming soon. For now, manage these through the Campaigns tab.
            </p>
            <button
              onClick={() => setActiveTab('campaigns')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Campaigns
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

