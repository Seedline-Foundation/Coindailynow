// frontend/src/components/user/EngagementStatsWidget.tsx
// Task 66: User Engagement Stats Widget

'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  Flame,
  BookOpen,
  Share2,
  MessageCircle,
  Target,
  Trophy,
} from 'lucide-react';

interface EngagementStats {
  behavior: {
    articlesRead: number;
    articlesShared: number;
    commentsPosted: number;
    reactionsGiven: number;
    engagementScore: number;
    currentStreak: number;
    longestStreak: number;
    avgReadingTime: number;
    avgScrollDepth: number;
  };
  totalPoints: number;
  recentRewards: Array<{
    id: string;
    rewardType: string;
    pointsEarned: number;
    awardedAt: string;
  }>;
  milestones: Array<{
    id: string;
    type: string;
    threshold: number;
    rewardPoints: number;
    achievedAt: string;
  }>;
}

export default function EngagementStatsWidget() {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/engagement/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-red-600">Failed to load engagement stats</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const { behavior, totalPoints, recentRewards, milestones } = stats;

  return (
    <div className="space-y-4">
      {/* Points & Streak Card */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm font-medium">Total Points</p>
            <p className="text-4xl font-bold">{totalPoints.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-300" />
            <div>
              <p className="text-sm text-purple-100">Current Streak</p>
              <p className="text-xl font-bold">{behavior.currentStreak} days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-purple-100">Best Streak</p>
            <p className="text-xl font-bold">{behavior.longestStreak} days</p>
          </div>
        </div>
      </div>

      {/* Engagement Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-600 text-sm font-medium">Engagement Score</p>
            <p className="text-3xl font-bold text-gray-900">
              {behavior.engagementScore.toFixed(0)}
              <span className="text-lg text-gray-500">/100</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(behavior.engagementScore, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
          label="Articles Read"
          value={behavior.articlesRead}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Share2 className="w-5 h-5 text-green-600" />}
          label="Shared"
          value={behavior.articlesShared}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
          label="Comments"
          value={behavior.commentsPosted}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-orange-600" />}
          label="Reactions"
          value={behavior.reactionsGiven}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Recent Rewards */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-600" />
          Recent Rewards
        </h3>
        <div className="space-y-2">
          {recentRewards.slice(0, 5).map((reward) => (
            <div
              key={reward.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {reward.rewardType.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(reward.awardedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{reward.pointsEarned}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {milestones.slice(0, 4).map((milestone) => (
              <div
                key={milestone.id}
                className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-xs font-medium text-gray-700">
                  {milestone.type.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-600">{milestone.threshold}+</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reading Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Reading Stats</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Avg Reading Time</span>
            <span className="font-bold text-gray-900">
              {Math.floor(behavior.avgReadingTime / 60)}m {behavior.avgReadingTime % 60}s
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Avg Scroll Depth</span>
            <span className="font-bold text-gray-900">
              {behavior.avgScrollDepth.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
}

function StatCard({ icon, label, value, bgColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

