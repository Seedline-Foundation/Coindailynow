/**
 * Subscription Page
 * Displays subscription tiers and manages user subscriptions
 */

import React, { useState, useEffect } from 'react';
import { SubscriptionManagement } from '../components/wallet';
import { financeApi } from '../services/financeApi';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Wallet, Subscription } from '../types/finance';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [userWallet, userSubscriptions] = await Promise.all([
        financeApi.getWallet(user.id),
        financeApi.getUserSubscriptions(user.id, { status: 'ACTIVE' })
      ]);
      
      setWallet(userWallet);
      setSubscription(userSubscriptions[0] || null);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
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
          Premium Subscriptions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get access to exclusive content and premium features
        </p>
      </div>

      <SubscriptionManagement
        wallet={wallet}
        currentSubscription={subscription}
        onSubscriptionChange={loadData}
      />
    </div>
  );
}

