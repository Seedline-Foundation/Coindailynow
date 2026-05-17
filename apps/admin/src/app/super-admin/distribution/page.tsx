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
  Filter,
  X,
  ChevronDown
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
  const [activeTab, setActiveTab] = useState<'campaigns' | 'social' | 'email' | 'push' | 'rss' | 'settings'>('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [metrics, setMetrics] = useState<DistributionMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  // New Campaign modal
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    type: 'email' as Campaign['type'],
    channels: [] as string[],
    scheduledFor: '',
    recipients: '',
    content: '',
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

  const CHANNEL_OPTIONS: Record<Campaign['type'], string[]> = {
    email: ['email-list', 'mailgun', 'sendgrid'],
    push: ['web-push', 'fcm-android', 'apns-ios'],
    social: ['twitter', 'facebook', 'linkedin', 'instagram'],
    rss: ['rss-feed', 'atom-feed'],
  };

  const toggleChannel = (ch: string) => {
    setCampaignForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCampaign(true);
    try {
      const newCampaign: Campaign = {
        id: `camp_${Date.now()}`,
        title: campaignForm.title,
        type: campaignForm.type,
        status: campaignForm.scheduledFor ? 'scheduled' : 'draft',
        channels: campaignForm.channels.length ? campaignForm.channels : [campaignForm.type],
        scheduledFor: campaignForm.scheduledFor || new Date().toISOString(),
        recipients: parseInt(campaignForm.recipients) || 0,
        opened: 0,
        clicked: 0,
        conversions: 0,
        createdBy: 'Super Admin',
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      setShowNewCampaign(false);
      setCampaignForm({ title: '', type: 'email', channels: [], scheduledFor: '', recipients: '', content: '' });
    } finally {
      setSavingCampaign(false);
    }
  };

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
              onClick={() => setShowNewCampaign(true)}
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
      <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
        {(['campaigns', 'social', 'email', 'push', 'rss', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'settings' ? '⚙ Channel Settings' : tab}
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

      {/* ── Channel Settings Tab ── */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Social — Twitter/X */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Twitter className="w-5 h-5 text-sky-400" />
              <h3 className="text-white font-semibold text-lg">Twitter / X</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300">Connected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Secret</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Access Token Secret</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Facebook className="w-5 h-5 text-blue-500" />
              <h3 className="text-white font-semibold text-lg">Facebook / Meta</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300">Connected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Page Access Token</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Page ID</label>
                <input type="text" defaultValue="coindailyafrica" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">App Secret</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <h3 className="text-white font-semibold text-lg">LinkedIn</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-yellow-900 text-yellow-300">Needs Setup</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client ID</label>
                <input type="text" placeholder="LinkedIn Client ID" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Secret</label>
                <input type="password" placeholder="LinkedIn Client Secret" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Organization URN</label>
                <input type="text" placeholder="urn:li:organization:..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500" />
              </div>
            </div>
          </div>

          {/* Email SMTP */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold text-lg">Email (SMTP)</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300">Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">SMTP Host</label>
                <input type="text" defaultValue="smtp.mailgun.org" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Port</label>
                <input type="number" defaultValue="587" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username / API Key</label>
                <input type="text" defaultValue="postmaster@mg.coindaily.africa" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input type="password" defaultValue="••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">From Name</label>
                <input type="text" defaultValue="CoinDaily Africa" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">From Address</label>
                <input type="email" defaultValue="news@coindaily.africa" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Push Notifications (VAPID / Web Push) */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold text-lg">Push Notifications (Web Push / VAPID)</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300">Active</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">VAPID Public Key</label>
                <input type="text" defaultValue="BLc9CKqJ3Xu5..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">VAPID Private Key</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">FCM Server Key (Android)</label>
                <input type="password" defaultValue="••••••••••••••••" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">APNS Key ID (iOS)</label>
                <input type="text" placeholder="Apple Push Key ID" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500" />
              </div>
            </div>
          </div>

          {/* RSS Feed */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Rss className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold text-lg">RSS / Atom Feed</h3>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300">Active</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Main Feed URL</label>
                  <input type="url" defaultValue="https://coindaily.africa/feed.xml" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Items per Feed</label>
                  <input type="number" defaultValue="20" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ad Material in RSS</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded bg-gray-700 border-gray-600 text-blue-600" />
                  <span className="text-sm text-gray-300">Include sponsored content slots in RSS feed</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ad Injection Frequency</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="5">Every 5th item</option>
                  <option value="10">Every 10th item</option>
                  <option value="none">No ads</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3">
            <button className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Reset to Defaults
            </button>
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              Save Channel Settings
            </button>
          </div>
        </div>
      )}

      {/* ── New Campaign Modal ── */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Create New Campaign
              </h2>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-5">
              {/* Campaign Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Campaign Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignForm.title}
                  onChange={e => setCampaignForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. BTC Halving Breaking News Alert"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Campaign Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['email', 'push', 'social', 'rss'] as Campaign['type'][]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCampaignForm(f => ({ ...f, type: t, channels: [] }))}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium transition-colors ${
                        campaignForm.type === t
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {t === 'email' && <Mail className="w-5 h-5" />}
                      {t === 'push' && <Bell className="w-5 h-5" />}
                      {t === 'social' && <Share2 className="w-5 h-5" />}
                      {t === 'rss' && <Rss className="w-5 h-5" />}
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channels for selected type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Channels / Destinations
                  <span className="text-gray-500 font-normal ml-1">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS[campaignForm.type].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        campaignForm.channels.includes(ch)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {campaignForm.channels.includes(ch) && <CheckCircle className="w-3.5 h-3.5" />}
                      {ch.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content / Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Message / Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={campaignForm.content}
                  onChange={e => setCampaignForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Write your campaign message or subject line here…"
                />
                <p className="text-xs text-gray-500 mt-1">{campaignForm.content.length} / 2000 characters</p>
              </div>

              {/* Estimated Recipients + Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Recipients</label>
                  <input
                    type="number"
                    min="0"
                    value={campaignForm.recipients}
                    onChange={e => setCampaignForm(f => ({ ...f, recipients: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 12000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledFor}
                    onChange={e => setCampaignForm(f => ({ ...f, scheduledFor: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Status preview */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm">
                <span className="text-gray-400">Will be saved as: </span>
                <span className={`font-semibold ${campaignForm.scheduledFor ? 'text-blue-400' : 'text-gray-200'}`}>
                  {campaignForm.scheduledFor ? `Scheduled for ${new Date(campaignForm.scheduledFor).toLocaleString()}` : 'Draft'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewCampaign(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {savingCampaign ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Send className="w-4 h-4" /> {campaignForm.scheduledFor ? 'Schedule Campaign' : 'Save as Draft'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

