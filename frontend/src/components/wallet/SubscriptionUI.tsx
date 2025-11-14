/**
 * Subscription UI Component for Task 3
 * 
 * Features:
 * - Display available subscription tiers with features comparison
 * - Expiry countdown for current subscriptions
 * - Upgrade/downgrade functionality
 * - Integration with wallet balance for payments
 * - Visual tier comparison with benefits
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { financeApi } from '../../services/financeApi';
import { Wallet, SubscriptionTier, SubscriptionStatus } from '../../types/finance';
import { OTPVerificationModal } from './OTPVerificationModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SubscriptionUIProps {
  wallet: Wallet;
  onSubscriptionChange?: (newTier: SubscriptionTier) => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  duration: number; // days
  features: string[];
  popular?: boolean;
  description: string;
  color: string;
  icon: string;
}

interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt: Date;
  autoRenew: boolean;
}

export const SubscriptionUI: React.FC<SubscriptionUIProps> = ({ 
  wallet, 
  onSubscriptionChange 
}) => {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available subscription plans
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Apostle',
      tier: 'basic' as SubscriptionTier,
      price: 50,
      duration: 30,
      color: 'from-gray-400 to-gray-600',
      icon: '⭐',
      description: 'Perfect for crypto beginners',
      features: [
        'Basic market data access',
        'Weekly newsletter',
        'Community forum access',
        'Mobile app access',
        'Email support'
      ]
    },
    {
      id: 'premium',
      name: 'Evangelist',
      tier: 'premium' as SubscriptionTier,
      price: 150,
      duration: 30,
      color: 'from-blue-500 to-blue-700',
      icon: '🚀',
      description: 'Enhanced features for active traders',
      popular: true,
      features: [
        'Real-time market data',
        'Advanced analytics',
        'Premium newsletter',
        'Priority support',
        'API access',
        'Portfolio tracking',
        'Price alerts'
      ]
    },
    {
      id: 'enterprise',
      name: 'Prophet',
      tier: 'enterprise' as SubscriptionTier,
      price: 300,
      duration: 30,
      color: 'from-purple-500 to-purple-700',
      icon: '👑',
      description: 'Full access for crypto professionals',
      features: [
        'All Premium features',
        'Institutional data',
        'Custom analytics',
        'Dedicated support',
        'White-label options',
        'Advanced API',
        'Custom integrations',
        'Priority feature requests'
      ]
    }
  ];

  // Load user's current subscription
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const subscription = await financeApi.getUserSubscription(user.id);
        setCurrentSubscription(subscription);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user?.id]);

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  // Handle subscription purchase
  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!user?.id || !wallet) return;

    // Check wallet balance
    if (wallet.availableBalance < plan.price) {
      setError(`Insufficient balance. Required: ${plan.price} ${wallet.currency}`);
      return;
    }

    setPendingPurchase(plan);
    setShowOTP(true);
  };

  // Handle OTP verification and complete purchase
  const handleOTPVerify = async (otpCode: string) => {
    if (!pendingPurchase || !user?.id) return;

    try {
      setPurchasing(pendingPurchase.id);
      
      const result = await financeApi.purchaseSubscription({
        userId: user.id,
        walletId: wallet.id,
        tier: pendingPurchase.tier,
        paymentMethod: 'WALLET_BALANCE',
        otpCode
      });

      if (result.success) {
        // Refresh subscription data
        const updatedSubscription = await financeApi.getUserSubscription(user.id);
        setCurrentSubscription(updatedSubscription);
        onSubscriptionChange?.(pendingPurchase.tier);
        setShowOTP(false);
        setPendingPurchase(null);
        setError(null);
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="subscription-ui space-y-6">
      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Plan: {subscriptionPlans.find(p => p.tier === currentSubscription.tier)?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Status: <span className={`font-medium ${
                  currentSubscription.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currentSubscription.status}
                </span>
              </p>
            </div>
            
            {currentSubscription.status === 'ACTIVE' && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getTimeRemaining(currentSubscription.expiresAt)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">remaining</p>
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {currentSubscription.expiresAt.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Auto-renewal status */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-renewal:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentSubscription.autoRenew 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }`}>
              {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Choose Your Plan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentSubscription?.tier === plan.tier;
            const isUpgrade = currentSubscription && 
              subscriptionPlans.findIndex(p => p.tier === currentSubscription.tier) < 
              subscriptionPlans.findIndex(p => p.tier === plan.tier);

            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all ${
                  plan.popular 
                    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                    : isCurrentPlan
                    ? 'border-green-500 dark:border-green-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Current
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${plan.color} rounded-full text-white text-2xl mb-4`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{wallet.currency}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      per {plan.duration} days
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={isCurrentPlan || purchasing === plan.id || wallet.availableBalance < plan.price}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                      isCurrentPlan
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                        : purchasing === plan.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : wallet.availableBalance < plan.price
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : purchasing === plan.id
                      ? 'Processing...'
                      : wallet.availableBalance < plan.price
                      ? 'Insufficient Balance'
                      : isUpgrade
                      ? 'Upgrade'
                      : 'Subscribe'
                    }
                  </button>

                  {/* Balance warning */}
                  {wallet.availableBalance < plan.price && !isCurrentPlan && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                      Need {(plan.price - wallet.availableBalance).toFixed(2)} {wallet.currency} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Security Notice */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-400">
              Secure Payment
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Subscription payments are processed using your wallet balance and require email OTP verification for security.
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTP && pendingPurchase && (
        <OTPVerificationModal
          isOpen={showOTP}
          onClose={() => {
            setShowOTP(false);
            setPendingPurchase(null);
          }}
          onVerify={handleOTPVerify}
          operation={`subscription_purchase_${pendingPurchase.tier}`}
          email={user?.email}
        />
      )}
    </div>
  );
};

export default SubscriptionUI;
