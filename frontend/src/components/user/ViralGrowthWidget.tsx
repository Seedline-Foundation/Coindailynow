/**
 * Rewards & Engagement Widget
 * Task 64: User Dashboard Component
 * 
 * Features:
 * - User reward points display
 * - Referral tracking
 * - Leaderboard position
 * - Share & earn mechanics
 * - Recent rewards activity
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  ShareIcon,
  UserGroupIcon,
  ChartBarIcon,
  GiftIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface UserRewards {
  totalPoints: number;
  rewards: Array<{
    id: string;
    rewardType: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalClicks: number;
  totalRewardsEarned: number;
  referrals: Array<{
    id: string;
    referralCode: string;
    status: string;
    clickCount: number;
    createdAt: string;
  }>;
}

interface LeaderboardPosition {
  entry: {
    rank: number;
    totalPoints: number;
    sharesCount: number;
    referralsCount: number;
  } | null;
  totalEntries: number;
  percentile: number;
}

interface ViralGrowthWidgetProps {
  userId: string;
}

export default function ViralGrowthWidget({ userId }: ViralGrowthWidgetProps) {
  const [activeTab, setActiveTab] = useState<'rewards' | 'referrals' | 'leaderboard'>('rewards');
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [rewardsRes, referralsRes, leaderboardRes] = await Promise.all([
        fetch(`/api/distribution/rewards/user/${userId}?limit=10`),
        fetch(`/api/distribution/referrals/user/${userId}/stats`),
        fetch(`/api/distribution/leaderboard/monthly/user/${userId}`),
      ]);

      const rewardsData = await rewardsRes.json();
      const referralsData = await referralsRes.json();
      const leaderboardData = await leaderboardRes.json();

      setRewards(rewardsData.data);
      setReferralStats(referralsData.data.stats);
      setLeaderboard(leaderboardData.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    try {
      // Get active referral program (simplified - in production, fetch program ID)
      const response = await fetch('/api/distribution/referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: 'default-program-id', // Replace with actual program ID
          referrerId: userId,
        }),
      });

      const data = await response.json();
      setReferralCode(data.data.referralCode);
      setShowShareModal(true);
    } catch (error) {
      console.error('Failed to generate referral code:', error);
    }
  };

  const handleCopyReferralLink = () => {
    if (referralCode) {
      const link = `${window.location.origin}?ref=${referralCode}`;
      navigator.clipboard.writeText(link);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {rewards?.totalPoints.toLocaleString() || 0} Points
            </h3>
            <p className="text-blue-100 text-sm mt-1">Your reward balance</p>
          </div>
          <TrophyIcon className="h-12 w-12 text-yellow-300" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{referralStats?.completedReferrals || 0}</p>
            <p className="text-xs text-blue-100">Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {leaderboard?.entry?.rank ? `#${leaderboard.entry.rank}` : '-'}
            </p>
            <p className="text-xs text-blue-100">Rank</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {leaderboard?.percentile ? `${leaderboard.percentile.toFixed(0)}%` : '-'}
            </p>
            <p className="text-xs text-blue-100">Top</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'rewards', label: 'Rewards', icon: GiftIcon },
            { id: 'referrals', label: 'Referrals', icon: UserGroupIcon },
            { id: 'leaderboard', label: 'Leaderboard', icon: ChartBarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Rewards Tab */}
        {activeTab === 'rewards' && rewards && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Recent Rewards</h4>
              <span className="text-sm text-gray-600">
                {rewards.rewards.length} transactions
              </span>
            </div>

            {rewards.rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GiftIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No rewards yet. Start earning by sharing content!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.rewards.slice(0, 5).map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {reward.description || reward.rewardType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(reward.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      +{reward.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && referralStats && (
          <div className="space-y-4">
            <button
              onClick={handleGenerateReferralCode}
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Generate Referral Link
            </button>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats.completedReferrals}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats.totalClicks}
                </p>
                <p className="text-sm text-gray-600">Total Clicks</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {referralStats.pendingReferrals}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {referralStats.totalRewardsEarned}
                </p>
                <p className="text-sm text-gray-600">Points Earned</p>
              </div>
            </div>

            {referralStats.totalReferrals > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  🎉 You've earned {referralStats.totalRewardsEarned} points from referrals!
                  Keep sharing to earn more rewards.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && leaderboard && (
          <div className="space-y-4">
            {leaderboard.entry ? (
              <>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-200">
                  <div className="text-center">
                    <TrophyIcon className="h-16 w-16 mx-auto text-yellow-500 mb-3" />
                    <h4 className="text-3xl font-bold text-gray-900">
                      Rank #{leaderboard.entry.rank}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Out of {leaderboard.totalEntries} participants
                    </p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-semibold">
                        Top {leaderboard.percentile.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {leaderboard.entry.totalPoints}
                    </p>
                    <p className="text-xs text-gray-600">Total Points</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {leaderboard.entry.sharesCount}
                    </p>
                    <p className="text-xs text-gray-600">Shares</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {leaderboard.entry.referralsCount}
                    </p>
                    <p className="text-xs text-gray-600">Referrals</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Start earning points to appear on the leaderboard!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Referral Share Modal */}
      {showShareModal && referralCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Your Referral Link</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">Your referral code:</p>
              <p className="text-xl font-mono font-bold text-blue-600">{referralCode}</p>
            </div>
            <button
              onClick={handleCopyReferralLink}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-2"
            >
              Copy Referral Link
            </button>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

