'use client';

/**
 * Merchant Reputation Dashboard
 * Feature 07: On-Chain Reputation & Merchant Scoring System
 * 
 * Displays merchant reputation score, badges, tier, and transaction breakdown
 */

import React, { useState, useEffect } from 'react';

// Types
interface Badge {
  type: number;
  name: string;
  description: string;
  icon: string;
}

interface ReputationData {
  walletAddress: string;
  score: number;
  totalTransactions: number;
  successfulTransactions: number;
  volumeUsd: number;
  disputeCount: number;
  settlementScore: number;
  zkVerified: boolean;
  badges: number[];
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
}

interface TierInfo {
  name: string;
  minScore: number;
  color: string;
  icon: string;
  benefits: string[];
}

// Tier configurations
const TIERS: TierInfo[] = [
  { name: 'DIAMOND', minScore: 900, color: '#b9f2ff', icon: '💎', benefits: ['Priority support', 'Lowest fees', 'Exclusive features'] },
  { name: 'PLATINUM', minScore: 750, color: '#e5e4e2', icon: '🏆', benefits: ['Reduced fees', 'Early access'] },
  { name: 'GOLD', minScore: 500, color: '#ffd700', icon: '🥇', benefits: ['Standard fees', 'Full features'] },
  { name: 'SILVER', minScore: 250, color: '#c0c0c0', icon: '🥈', benefits: ['Standard features'] },
  { name: 'BRONZE', minScore: 0, color: '#cd7f32', icon: '🥉', benefits: ['Basic features'] },
];

// Badge configurations
const BADGE_INFO: Record<number, { name: string; description: string; icon: string }> = {
  1: { name: 'Verified Merchant', description: 'KYC completed, registered business', icon: '✅' },
  2: { name: 'ECO Early Adopter', description: 'Active before ECO official launch', icon: '🌱' },
  3: { name: 'Fast Settler', description: '95%+ same-day settlement rate', icon: '⚡' },
  4: { name: 'High Volume Trader', description: '$10,000+ cumulative trade volume', icon: '📈' },
  5: { name: 'Dispute Free', description: '50+ transactions with zero disputes', icon: '🕊️' },
};

// Score ring component
function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 1000) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 900) return '#b9f2ff';
    if (s >= 750) return '#e5e4e2';
    if (s >= 500) return '#ffd700';
    if (s >= 250) return '#c0c0c0';
    return '#cd7f32';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-sm text-gray-400">/ 1000</span>
      </div>
    </div>
  );
}

// Badge display component
function BadgeDisplay({ badges }: { badges: number[] }) {
  if (badges.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        <p>No badges earned yet</p>
        <p className="text-sm mt-1">Complete transactions to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badgeType) => {
        const info = BADGE_INFO[badgeType];
        if (!info) return null;
        
        return (
          <div
            key={badgeType}
            className="bg-gray-800 rounded-lg p-3 text-center hover:bg-gray-750 transition-colors"
          >
            <div className="text-3xl mb-1">{info.icon}</div>
            <div className="text-sm font-medium text-white">{info.name}</div>
            <div className="text-xs text-gray-400 mt-1">{info.description}</div>
          </div>
        );
      })}
    </div>
  );
}

// Stat card component
function StatCard({ label, value, subValue, icon }: { label: string; value: string | number; subValue?: string; icon: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-sm text-gray-400">{subValue}</div>}
    </div>
  );
}

// Tier progress component  
function TierProgress({ currentScore, currentTier }: { currentScore: number; currentTier: string }) {
  const currentTierInfo = TIERS.find(t => t.name === currentTier) || TIERS[4];
  const nextTierIndex = TIERS.findIndex(t => t.name === currentTier) - 1;
  const nextTier = nextTierIndex >= 0 ? TIERS[nextTierIndex] : null;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentTierInfo.icon}</span>
          <span className="text-lg font-semibold text-white">{currentTierInfo.name}</span>
        </div>
        {nextTier && (
          <div className="text-sm text-gray-400">
            Next: {nextTier.icon} {nextTier.name}
          </div>
        )}
      </div>
      
      {nextTier && (
        <>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((currentScore - currentTierInfo.minScore) / (nextTier.minScore - currentTierInfo.minScore)) * 100)}%`,
                backgroundColor: currentTierInfo.color,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{currentScore} pts</span>
            <span>{nextTier.minScore - currentScore} pts to {nextTier.name}</span>
          </div>
        </>
      )}
      
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">Tier Benefits:</div>
        <ul className="space-y-1">
          {currentTierInfo.benefits.map((benefit, i) => (
            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-green-500">✓</span> {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Main dashboard component
export default function MerchantReputationDashboard({ walletAddress }: { walletAddress?: string }) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const fetchReputation = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/reputation/${address}`);
      
      if (res.status === 404) {
        setReputation(null);
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch reputation');
      }
      
      const { data } = await res.json();
      setReputation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initializeReputation = async () => {
    if (!walletAddress) return;
    
    try {
      setInitializing(true);
      setError(null);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/reputation/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to initialize reputation');
      }
      
      const { data } = await res.json();
      setReputation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchReputation(walletAddress);
    } else {
      setLoading(false);
    }
  }, [walletAddress]);

  // No wallet connected
  if (!walletAddress) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          Connect your wallet to view and build your merchant reputation
        </p>
        <button
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          onClick={() => {/* Trigger wallet connection */}}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
        <p className="text-center text-gray-400 mt-4">Loading reputation data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Reputation</h2>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
          onClick={() => fetchReputation(walletAddress)}
        >
          Retry
        </button>
      </div>
    );
  }

  // No reputation yet - offer to initialize
  if (!reputation) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🆕</div>
        <h2 className="text-2xl font-bold text-white mb-2">Start Building Your Reputation</h2>
        <p className="text-gray-400 mb-6">
          Initialize your on-chain reputation to unlock merchant features
        </p>
        <button
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          onClick={initializeReputation}
          disabled={initializing}
        >
          {initializing ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Initializing...
            </>
          ) : (
            'Initialize Reputation'
          )}
        </button>
        <p className="text-xs text-gray-500 mt-4">
          This will mint a non-transferable Soulbound Token on Polygon
        </p>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">Merchant Reputation</h2>
          <p className="text-gray-400 text-sm">
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          {reputation.zkVerified && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
              <span>🔐</span> ZK Verified
            </span>
          )}
        </div>
        <ScoreRing score={reputation.score} />
      </div>

      {/* Tier Progress */}
      <TierProgress currentScore={reputation.score} currentTier={reputation.tier} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Volume"
          value={`$${reputation.volumeUsd.toLocaleString()}`}
          icon="💰"
        />
        <StatCard
          label="Transactions"
          value={reputation.totalTransactions}
          subValue={`${reputation.successfulTransactions} successful`}
          icon="🔄"
        />
        <StatCard
          label="Settlement Rate"
          value={`${reputation.settlementScore}%`}
          subValue="Same-day"
          icon="⚡"
        />
        <StatCard
          label="Disputes"
          value={reputation.disputeCount}
          subValue={reputation.disputeCount === 0 ? 'Clean record!' : ''}
          icon={reputation.disputeCount === 0 ? '✅' : '⚠️'}
        />
      </div>

      {/* Badges Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Earned Badges</h3>
        <BadgeDisplay badges={reputation.badges} />
      </div>

      {/* Badge Progress (available badges) */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Available Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(BADGE_INFO).map(([typeStr, info]) => {
            const type = parseInt(typeStr);
            const earned = reputation.badges.includes(type);
            
            return (
              <div
                key={type}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  earned ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800/50'
                }`}
              >
                <div className={`text-2xl ${earned ? '' : 'opacity-30 grayscale'}`}>
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${earned ? 'text-green-400' : 'text-gray-500'}`}>
                    {info.name}
                  </div>
                  <div className="text-xs text-gray-500">{info.description}</div>
                </div>
                {earned && <span className="text-green-500">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Score Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Success Rate (max 300)</span>
            <span className="text-white">
              +{Math.round((reputation.successfulTransactions / Math.max(reputation.totalTransactions, 1)) * 300)}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Volume Score (max 500)</span>
            <span className="text-white">+{Math.min(500, Math.round(reputation.volumeUsd / 20))}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>ZK Verification Bonus</span>
            <span className="text-white">{reputation.zkVerified ? '+100' : '0'}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Dispute Penalty</span>
            <span className="text-red-400">-{reputation.disputeCount * 50}</span>
          </div>
          <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between font-bold">
            <span className="text-white">Total Score</span>
            <span className="text-blue-400">{reputation.score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
