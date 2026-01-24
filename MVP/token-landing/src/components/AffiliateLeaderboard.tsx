'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon,
  FireIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface LeaderboardEntry {
  rank: number;
  affiliateCode: string;
  name: string;
  totalReferrals: number;
  totalConversions: number;
  totalTokensEarned: number;
  totalClicks: number;
  conversionRate: number;
}

interface LeaderboardProps {
  isPublic?: boolean;
  limit?: number;
}

export default function AffiliateLeaderboard({ isPublic = true, limit = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [isPublic, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/affiliate/leaderboard?public=${isPublic}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <TrophyIcon className="w-6 h-6 text-gray-400" />;
      case 3:
        return <TrophyIcon className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-600 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-700 to-orange-500 text-white';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 text-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <FireIcon className="w-8 h-8 text-accent-400" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white">Top Affiliates</h3>
          <p className="text-sm text-gray-400">Earn 5% of tokens from each referral's purchase</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No affiliates yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.affiliateCode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`${getRankBadge(entry.rank)} rounded-xl p-4 flex items-center gap-4`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              {/* Affiliate Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{entry.name}</p>
                <p className="text-xs text-gray-300 opacity-75">Code: {entry.affiliateCode}</p>
              </div>

              {/* Referrals */}
              <div className="text-right">
                <p className="text-xl font-bold text-white">{entry.totalReferrals}</p>
                <p className="text-xs text-gray-300 opacity-75">Referrals</p>
              </div>

              {/* Conversions */}
              <div className="text-right hidden sm:block">
                <p className="text-xl font-bold text-green-400">{entry.totalConversions}</p>
                <p className="text-xs text-gray-300 opacity-75">Conversions</p>
              </div>

              {/* Earnings */}
              <div className="text-right hidden md:block">
                <p className="text-lg font-bold text-yellow-400">{entry.totalTokensEarned.toLocaleString()} JY</p>
                <p className="text-xs text-gray-300 opacity-75">Earned</p>
              </div>

              {/* Conversion Rate */}
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-white">{entry.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-300 opacity-75">Conv. Rate</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Showing top {leaderboard.length} affiliates
          </p>
        </div>
      )}
    </div>
  );
}
