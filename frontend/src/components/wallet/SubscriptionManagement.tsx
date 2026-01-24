/**
 * Subscription Management Component
 * 
 * Features:
 * - Display available subscription tiers
 * - Feature comparison table
 * - Active subscription status with expiry countdown
 * - Purchase/Upgrade flow
 * - Auto-renew toggle
 * - Payment via wallet balance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, PaymentInput, Subscription, PaymentType } from '../../types/finance';
import { financeApi } from '../../services/financeApi';
import { useAuth } from '../../hooks/useAuth';
import { OTPVerificationModal } from './OTPVerificationModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
  currency: string;
  features: string[];
  popular?: boolean;
  color: string;
}

interface SubscriptionManagementProps {
  wallet: Wallet;
  currentSubscription?: Subscription | null;
  onSubscriptionChange?: () => void;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    duration: 30,
    currency: 'JY',
    color: 'blue',
    features: [
      'Access to premium articles',
      'Ad-free reading experience',
      'Basic market alerts',
      'Email newsletter',
      'Community access'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 24.99,
    duration: 30,
    currency: 'JY',
    color: 'purple',
    popular: true,
    features: [
      'All Basic features',
      'Advanced market analytics',
      'Real-time price alerts',
      'Exclusive research reports',
      'Priority customer support',
      'Early access to new features',
      'Portfolio tracking tools'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49.99,
    duration: 30,
    currency: 'JY',
    color: 'amber',
    features: [
      'All Pro features',
      'AI-powered insights',
      'One-on-one consulting sessions',
      'Custom alerts & notifications',
      'API access',
      'White-label reports',
      'Dedicated account manager',
      'VIP event access'
    ]
  }
];

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  wallet,
  currentSubscription,
  onSubscriptionChange
}) => {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate time remaining for current subscription
  const getTimeRemaining = () => {
    if (!currentSubscription || currentSubscription.status !== 'ACTIVE') return null;

    const now = new Date();
    const endDate = new Date(currentSubscription.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  // Handle subscription purchase
  const handleSubscribe = (tier: SubscriptionTier) => {
    if (wallet.availableBalance < tier.price) {
      setError('Insufficient balance. Please add funds to your wallet.');
      return;
    }

    setSelectedTier(tier);
    setShowConfirmation(true);
  };

  const confirmSubscription = async () => {
    if (!user || !selectedTier) return;

    setLoading(true);
    setError(null);

    try {
      const paymentInput: PaymentInput = {
        userId: user.id,
        walletId: wallet.id,
        amount: selectedTier.price,
        currency: selectedTier.currency,
        paymentType: PaymentType.SUBSCRIPTION,
        referenceId: selectedTier.id,
        metadata: {
          tierName: selectedTier.name,
          duration: selectedTier.duration
        }
      };

      const result = await financeApi.makePayment(paymentInput);

      if (result.requiresOTP) {
        setPendingTransactionId(result.transactionId || null);
        setShowOTP(true);
      } else if (result.success) {
        setShowConfirmation(false);
        onSubscriptionChange?.();
      } else {
        setError(result.error || 'Subscription purchase failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to purchase subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    // OTP verification completes the subscription
    setShowOTP(false);
    setShowConfirmation(false);
    onSubscriptionChange?.();
  };

  const getTierColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      amber: 'from-amber-500 to-amber-600'
    };
    return colors[color] || colors.blue;
  };

  const getBorderColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      amber: 'border-amber-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="subscription-management space-y-8">
      {/* Current Subscription Status */}
      {currentSubscription && currentSubscription.status === 'ACTIVE' && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-1">Active Subscription</h3>
              <p className="text-green-100">
                {currentSubscription.tier} Plan - {getTimeRemaining()}
              </p>
              <p className="text-sm text-green-100 mt-2">
                Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Auto-Renew</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentSubscription.autoRenew ? 'bg-white' : 'bg-green-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-green-600 transition-transform ${
                      currentSubscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                {currentSubscription.amount} {currentSubscription.currency}/month
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Plan
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock premium features and exclusive content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 ${
                tier.popular ? getBorderColor(tier.color) : 'border-gray-200 dark:border-gray-700'
              } transition-transform hover:scale-105`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className={`absolute top-0 right-0 bg-gradient-to-r ${getTierColor(tier.color)} text-white px-4 py-1 text-xs font-semibold`}>
                  MOST POPULAR
                </div>
              )}

              {/* Tier Header */}
              <div className={`bg-gradient-to-r ${getTierColor(tier.color)} text-white p-6`}>
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-lg">{tier.currency}</span>
                  <span className="text-sm opacity-80">/month</span>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={currentSubscription?.tier === tier.name}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentSubscription?.tier === tier.name
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : `bg-gradient-to-r ${getTierColor(tier.color)} text-white hover:opacity-90`
                  }`}
                >
                  {currentSubscription?.tier === tier.name ? 'Current Plan' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Compare Plans
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Feature</th>
              {SUBSCRIPTION_TIERS.map((tier) => (
                <th key={tier.id} className="text-center p-3 font-semibold text-gray-900 dark:text-white">
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 text-gray-700 dark:text-gray-300">Premium Articles</td>
              <td className="text-center p-3">✓</td>
              <td className="text-center p-3">✓</td>
              <td className="text-center p-3">✓</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 text-gray-700 dark:text-gray-300">Ad-free Experience</td>
              <td className="text-center p-3">✓</td>
              <td className="text-center p-3">✓</td>
              <td className="text-center p-3">✓</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 text-gray-700 dark:text-gray-300">Advanced Analytics</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">✓</td>
              <td className="text-center p-3">✓</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 text-gray-700 dark:text-gray-300">AI Insights</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">✓</td>
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="p-3 text-gray-700 dark:text-gray-300">API Access</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">✓</td>
            </tr>
            <tr>
              <td className="p-3 text-gray-700 dark:text-gray-300">Dedicated Support</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">-</td>
              <td className="text-center p-3">✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Subscription
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedTier.name}</p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedTier.price} {selectedTier.currency}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {wallet.availableBalance} {wallet.currency}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedTier(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubscription}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTP && (
        <OTPVerificationModal
          isOpen={true}
          onClose={() => setShowOTP(false)}
          onVerify={handleOTPVerify}
          operation="Subscription Purchase"
          transactionId={pendingTransactionId || undefined}
          email={user?.email}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;

