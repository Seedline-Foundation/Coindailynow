'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AffiliateLinkCard from '@/components/AffiliateLinkCard';
import AffiliateLeaderboard from '@/components/AffiliateLeaderboard';
import { 
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  UsersIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  completedDate?: string;
  category: string;
}

interface BountySubmission {
  id: string;
  bountyTitle: string;
  submitter: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reward: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'bounties' | 'affiliate'>('overview');
  const [isAffiliate, setIsAffiliate] = useState(true);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [affiliateLink, setAffiliateLink] = useState<string>('');

  useEffect(() => {
    // Check if user is logged in as affiliate
    const token = localStorage.getItem('affiliateToken');
    const storedData = localStorage.getItem('affiliateData');
    
    if (token && storedData) {
      setIsAffiliate(true);
      setAffiliateData(JSON.parse(storedData));
      fetchAffiliateStats(token);
      fetchAffiliateLink(token);
    }

    // Check URL params for affiliate tab
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'affiliate') {
      setActiveTab('affiliate');
    }
  }, []);

  const fetchAffiliateStats = async (token: string) => {
    try {
      const response = await fetch('/api/affiliate/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
    }
  };

  const fetchAffiliateLink = async (token: string) => {
    try {
      const response = await fetch('/api/affiliate/link', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAffiliateLink(data.affiliateLink);
      }
    } catch (error) {
      console.error('Failed to fetch affiliate link:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('affiliateToken');
    localStorage.removeItem('affiliateData');
    setIsAffiliate(false);
    setAffiliateData(null);
    setAffiliateStats(null);
    setActiveTab('overview');
  };

  // Project milestones for investors
  const projectMilestones: ProjectMilestone[] = [
    {
      id: 'm1',
      title: 'MVP Platform Launch',
      description: 'Core news platform with AI content generation deployed',
      status: 'completed',
      completedDate: 'November 2025',
      category: 'Product'
    },
    {
      id: 'm2',
      title: 'Token Smart Contract Deployment',
      description: 'JY Token contract audited and deployed on mainnet',
      status: 'completed',
      completedDate: 'November 2025',
      category: 'Blockchain'
    },
    {
      id: 'm3',
      title: 'Presale Phase 1',
      description: 'First presale round with OG Champ benefits',
      status: 'in-progress',
      completedDate: undefined,
      category: 'Fundraising'
    },
    {
      id: 'm4',
      title: 'OG Bounty Program Launch',
      description: '600K JY bounty pool activated for community',
      status: 'in-progress',
      completedDate: undefined,
      category: 'Community'
    },
    {
      id: 'm5',
      title: 'CEX Listings (MEXC, Bybit)',
      description: 'Negotiations ongoing for tier-1 exchange listings',
      status: 'in-progress',
      completedDate: undefined,
      category: 'Partnerships'
    },
    {
      id: 'm6',
      title: 'Liquidity Pool Launch',
      description: 'DEX liquidity pools with 2-year lock incentives',
      status: 'planned',
      completedDate: undefined,
      category: 'DeFi'
    },
    {
      id: 'm7',
      title: 'Multi-Language Support',
      description: '15 African languages with AI translation',
      status: 'planned',
      completedDate: undefined,
      category: 'Product'
    },
    {
      id: 'm8',
      title: 'Mobile App Release',
      description: 'iOS and Android apps with PWA support',
      status: 'planned',
      completedDate: undefined,
      category: 'Product'
    }
  ];

  // Sample bounty submissions (in production, this would come from backend)
  const recentSubmissions: BountySubmission[] = [
    { id: 's1', bountyTitle: 'Content Creation', submitter: 'User #47', submittedAt: 'Nov 12, 2025', status: 'approved', reward: '5,000 JY' },
    { id: 's2', bountyTitle: 'Meme Marketing', submitter: 'User #89', submittedAt: 'Nov 12, 2025', status: 'approved', reward: '1,500 JY' },
    { id: 's3', bountyTitle: 'Community AMA', submitter: 'User #23', submittedAt: 'Nov 11, 2025', status: 'pending', reward: '3,000 JY' },
    { id: 's4', bountyTitle: 'Bug Hunt', submitter: 'User #156', submittedAt: 'Nov 11, 2025', status: 'pending', reward: '8,000 JY' },
    { id: 's5', bountyTitle: 'Partnership', submitter: 'User #34', submittedAt: 'Nov 10, 2025', status: 'approved', reward: '3,000 JY' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'in-progress':
      case 'pending': return 'text-yellow-500';
      case 'planned': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-500 border-green-500/50',
      'in-progress': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      planned: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
      approved: 'bg-green-500/20 text-green-500 border-green-500/50',
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      rejected: 'bg-red-500/20 text-red-500 border-red-500/50',
    };
    
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
  const totalMilestones = projectMilestones.length;
  const approvedBounties = recentSubmissions.filter(s => s.status === 'approved').length;
  const pendingBounties = recentSubmissions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="gradient-text">Project Dashboard</span>
          </h1>
          <p className="text-xl text-gray-300">Real-time updates on CoinDaily and JY Token development</p>
          <p className="text-sm text-gray-500 mt-2">Last updated: November 14, 2025 • Weekly admin updates</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <RocketLaunchIcon className="w-6 h-6 text-primary-400" />
              <p className="text-sm text-gray-400">Milestones</p>
            </div>
            <p className="text-4xl font-bold text-white">{completedMilestones}/{totalMilestones}</p>
            <p className="text-sm text-gray-400 mt-1">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
              <p className="text-sm text-gray-400">Bounties Approved</p>
            </div>
            <p className="text-4xl font-bold text-white">{approvedBounties}</p>
            <p className="text-sm text-gray-400 mt-1">This Week</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ClockIcon className="w-6 h-6 text-yellow-400" />
              <p className="text-sm text-gray-400">In Review</p>
            </div>
            <p className="text-4xl font-bold text-white">{pendingBounties}</p>
            <p className="text-sm text-gray-400 mt-1">Pending Submissions</p>
          </div>

          <div className="bg-gradient-to-br from-accent-600/20 to-accent-800/20 border border-accent-500/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <FireIcon className="w-6 h-6 text-accent-400" />
              <p className="text-sm text-gray-400">Bounty Pool</p>
            </div>
            <p className="text-4xl font-bold text-white">600K</p>
            <p className="text-sm text-gray-400 mt-1">JY Tokens</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
              activeTab === 'bounties'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bounty Activity
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
              activeTab === 'affiliate'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Affiliate Dashboard
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Progress Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Development Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Overall Completion</span>
                      <span>{Math.round((completedMilestones / totalMilestones) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all"
                        style={{ width: `${(completedMilestones / totalMilestones) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-black/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-green-500">{completedMilestones}</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {projectMilestones.filter(m => m.status === 'in-progress').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div className="flex-1">
                        <p className="text-white font-medium">{submission.bountyTitle}</p>
                        <p className="text-xs text-gray-400">{submission.submitter} • {submission.submittedAt}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Key Metrics (Updated Weekly)</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Community Growth</p>
                  <p className="text-3xl font-bold text-white mb-1">2,547</p>
                  <p className="text-sm text-green-400">+23% this week</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Total Submissions</p>
                  <p className="text-3xl font-bold text-white mb-1">234</p>
                  <p className="text-sm text-green-400">+18% this week</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Rewards Distributed</p>
                  <p className="text-3xl font-bold text-white mb-1">47,500 JY</p>
                  <p className="text-sm text-gray-400">~8% of pool</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {projectMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`border rounded-xl p-6 ${
                  milestone.status === 'completed'
                    ? 'border-green-500 bg-green-900/10'
                    : milestone.status === 'in-progress'
                    ? 'border-yellow-500 bg-yellow-900/10'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusBadge(milestone.status)}`}>
                      {milestone.category}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2 mb-1">{milestone.title}</h3>
                    <p className="text-sm text-gray-400">{milestone.description}</p>
                  </div>
                  {milestone.status === 'completed' && (
                    <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
                  )}
                  {milestone.status === 'in-progress' && (
                    <ClockIcon className="w-8 h-8 text-yellow-500 flex-shrink-0 animate-pulse" />
                  )}
                </div>

                {milestone.completedDate && (
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-gray-500">Completed: {milestone.completedDate}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bounty Activity Tab */}
        {activeTab === 'bounties' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-4">
              {recentSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
                >
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{submission.bountyTitle}</h3>
                        <span className={`text-xs px-3 py-1 rounded border font-bold ${getStatusBadge(submission.status)}`}>
                          {submission.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Submitted by {submission.submitter}</span>
                        <span>•</span>
                        <span>{submission.submittedAt}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">Reward</p>
                      <p className="text-2xl font-bold gradient-text">{submission.reward}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 text-center">
              <TrophyIcon className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Want to Contribute?</h3>
              <p className="text-gray-300 mb-6">Join our OG Bounty Program and earn up to 20,000 JY tokens</p>
              <Link
                href="/bounty"
                className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
              >
                Browse Bounties
              </Link>
            </div>
          </motion.div>
        )}

        {/* Affiliate Dashboard Tab */}
        {activeTab === 'affiliate' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {affiliateData && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Welcome, {affiliateData.name || affiliateData.email}!</h2>
                    <p className="text-gray-400">Affiliate Code: <span className="text-primary-400 font-mono">{affiliateData.affiliateCode}</span></p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Affiliate Stats Grid */}
            {affiliateStats && (
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <UsersIcon className="w-6 h-6 text-blue-400" />
                    <p className="text-sm text-gray-400">Total Clicks</p>
                  </div>
                  <p className="text-4xl font-bold text-white">{affiliateStats.stats.totalClicks}</p>
                  <p className="text-sm text-gray-400 mt-1">Link visits</p>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircleIcon className="w-6 h-6 text-green-400" />
                    <p className="text-sm text-gray-400">Total Referrals</p>
                  </div>
                  <p className="text-4xl font-bold text-white">{affiliateStats.stats.totalReferrals}</p>
                  <p className="text-sm text-gray-400 mt-1">Sign-ups</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <ChartBarIcon className="w-6 h-6 text-yellow-400" />
                    <p className="text-sm text-gray-400">Conversion Rate</p>
                  </div>
                  <p className="text-4xl font-bold text-white">{affiliateStats.stats.conversionRate}%</p>
                  <p className="text-sm text-gray-400 mt-1">Click to sign-up</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrophyIcon className="w-6 h-6 text-purple-400" />
                    <p className="text-sm text-gray-400">Approved</p>
                  </div>
                  <p className="text-4xl font-bold text-white">{affiliateStats.stats.approvedReferrals}</p>
                  <p className="text-sm text-gray-400 mt-1">Verified buyers</p>
                </div>
              </div>
            )}

            {/* Affiliate Link Card */}
            {affiliateLink && affiliateData && (
              <div className="mb-8">
                <AffiliateLinkCard 
                  affiliateCode={affiliateData.affiliateCode}
                  affiliateLink={affiliateLink}
                />
              </div>
            )}

            {/* Recent Referrals */}
            {affiliateStats && affiliateStats.recentReferrals && affiliateStats.recentReferrals.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Recent Referrals</h3>
                <div className="space-y-3">
                  {affiliateStats.recentReferrals.map((referral: any) => (
                    <div key={referral.id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                      <div className="flex-1">
                        <p className="text-white font-medium">{referral.email}</p>
                        {referral.name && <p className="text-sm text-gray-400">{referral.name}</p>}
                        <p className="text-xs text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        referral.status === 'APPROVED' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : referral.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                          : 'bg-red-500/20 text-red-400 border border-red-500/50'
                      }`}>
                        {referral.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div className="mb-8">
              <AffiliateLeaderboard isPublic={false} limit={10} />
            </div>

            {/* Call to Action */}
            {!isAffiliate && (
              <div className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Become an Affiliate</h3>
                <p className="text-gray-300 mb-6">Earn rewards by promoting JY Token presale</p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/affiliate/register"
                    className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-primary-500/50 transition-all"
                  >
                    Register Now
                  </Link>
                  <Link
                    href="/affiliate/login"
                    className="inline-block border border-gray-700 text-white px-8 py-4 rounded-full font-bold hover:bg-gray-900 transition-all"
                  >
                    Login
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

