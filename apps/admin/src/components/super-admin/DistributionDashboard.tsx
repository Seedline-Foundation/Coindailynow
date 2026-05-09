/**
 * Distribution & Viral Growth Dashboard
 * Task 64: Super Admin Management Interface
 * 
 * Features:
 * - Distribution campaign management
 * - Auto-sharing analytics
 * - Referral program tracking
 * - Partner syndication monitoring
 * - Newsletter campaign management
 * - Leaderboard insights
 * - Real-time stats and charts
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ShareIcon,
  UserGroupIcon,
  TrophyIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  campaigns: {
    total: number;
    articlesShared: number;
    totalReach: number;
    totalEngagement: number;
    totalRewards: number;
  };
  distributions: Record<string, number>;
  referrals: Record<string, number>;
  rewards: {
    total: number;
    totalPoints: number;
  };
  partners: {
    total: number;
    totalRequests: number;
    articlesShared: number;
  };
  newsletters: {
    total: number;
    totalRecipients: number;
    sentCount: number;
    openCount: number;
    clickCount: number;
    openRate: number;
    clickRate: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  targetPlatforms?: string;
  articlesShared: number;
  totalReach: number;
  totalEngagement: number;
  totalRewards: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  referrerReward: number;
  refereeReward: number;
  status: string;
  totalReferrals: number;
  totalRewards: number;
  validFrom: string;
  validUntil?: string;
}

interface Partner {
  id: string;
  partnerName: string;
  partnerDomain: string;
  tier: string;
  status: string;
  articlesShared: number;
  totalRequests: number;
  lastAccessAt?: string;
}

export default function DistributionDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'referrals' | 'partners' | 'newsletters'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        fetch('/api/distribution/dashboard/stats'),
        fetch('/api/distribution/campaigns?limit=10'),
      ]);

      const statsData = await statsRes.json();
      const campaignsData = await campaignsRes.json();

      setStats(statsData.data);
      setCampaigns(campaignsData.data.campaigns);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignStatusToggle = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await fetch(`/api/distribution/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadDashboardData();
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading Distribution Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Distribution & Viral Growth</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage campaigns, referrals, partnerships, and viral growth mechanics
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'campaigns', label: 'Campaigns', icon: ShareIcon },
              { id: 'referrals', label: 'Referrals', icon: UserGroupIcon },
              { id: 'partners', label: 'Partners', icon: GlobeAltIcon },
              { id: 'newsletters', label: 'Newsletters', icon: EnvelopeIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Campaigns Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <ShareIcon className="h-8 w-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.campaigns.total}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">Active Campaigns</p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.campaigns.articlesShared} articles shared
                </p>
              </div>

              {/* Reach Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <UserGroupIcon className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {(stats.campaigns.totalReach / 1000).toFixed(1)}K
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">Total Reach</p>
                <p className="mt-1 text-xs text-gray-500">
                  {(stats.campaigns.totalEngagement / 1000).toFixed(1)}K engagements
                </p>
              </div>

              {/* Rewards Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <TrophyIcon className="h-8 w-8 text-yellow-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {(stats.rewards.totalPoints / 1000).toFixed(1)}K
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">Points Distributed</p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.rewards.total} reward transactions
                </p>
              </div>

              {/* Partners Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <GlobeAltIcon className="h-8 w-8 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.partners.total}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">Active Partners</p>
                <p className="mt-1 text-xs text-gray-500">
                  {(stats.partners.totalRequests / 1000).toFixed(1)}K API requests
                </p>
              </div>
            </div>

            {/* Distribution Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.distributions).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Program</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.referrals).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Newsletter Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newsletters.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.newsletters.totalRecipients / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(stats.newsletters.sentCount / 1000).toFixed(1)}K
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.newsletters.openRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.newsletters.clickRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rewards
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {campaign.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.articlesShared}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(campaign.totalReach / 1000).toFixed(1)}K
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(campaign.totalRewards / 1000).toFixed(1)}K pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCampaignStatusToggle(campaign.id, campaign.status)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {campaign.status === 'ACTIVE' ? (
                            <PauseIcon className="h-5 w-5 inline" />
                          ) : (
                            <PlayIcon className="h-5 w-5 inline" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder for Other Tabs */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Programs</h3>
            <p className="text-gray-600">Referral program management interface...</p>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Syndication</h3>
            <p className="text-gray-600">Partner management and API monitoring...</p>
          </div>
        )}

        {activeTab === 'newsletters' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Newsletter Campaigns</h3>
            <p className="text-gray-600">Email campaign management and analytics...</p>
          </div>
        )}
      </div>
    </div>
  );
}

