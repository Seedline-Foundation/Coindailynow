/**
 * Staking Page
 * Displays staking plans and manages user stakes
 */

import React, { useState, useEffect } from 'react';
import { StakingDashboard } from '../components/wallet';
import { financeApi } from '../services/financeApi';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Wallet } from '../types/finance';

export default function StakingPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, [user?.id]);

  const loadWallet = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userWallet = await financeApi.getWallet(user.id);
      setWallet(userWallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Failed to load wallet. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Staking & Rewards
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stake your tokens and earn passive rewards
        </p>
      </div>

      <StakingDashboard
        wallet={wallet}
        onStakingChange={loadWallet}
      />
    </div>
  );
}

