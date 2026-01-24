/**
 * Enhanced Staking Dashboard Component for Task 3
 * 
 * Features:
 * - Simple stake/unstake controls with improved UX
 * - CE Points to Token conversion with backend validation
 * - Real-time APR calculations and reward tracking
 * - Multiple staking plans with lock periods
 * - Enhanced security with OTP verification
 * - Visual progress indicators and countdown timers
 * - Comprehensive conversion rate display
 * - Integration with wallet balance validation
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Staking, StakingInput, UnstakingInput, CEConversionInput, ConversionInput } from '../../types/finance';
import { financeApi } from '../../services/financeApi';
import { useAuth } from '../../hooks/useAuth';
import { OTPVerificationModal } from './OTPVerificationModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface StakingDashboardProps {
  wallet: Wallet;
  onStakingChange?: () => void;
}

interface StakingPlan {
  id: string;
  name: string;
  apr: number; // Annual Percentage Rate
  lockPeriod: number; // in days
  minAmount: number;
  maxAmount: number;
  color: string;
  description: string;
}

const STAKING_PLANS: StakingPlan[] = [
  {
    id: 'flexible',
    name: 'Flexible Staking',
    apr: 5,
    lockPeriod: 0,
    minAmount: 10,
    maxAmount: 10000,
    color: 'blue',
    description: 'Unstake anytime with no lock period. Lower APR but maximum flexibility.'
  },
  {
    id: 'short',
    name: '30-Day Lock',
    apr: 12,
    lockPeriod: 30,
    minAmount: 100,
    maxAmount: 50000,
    color: 'green',
    description: 'Lock for 30 days to earn higher rewards. Best for short-term investors.'
  },
  {
    id: 'medium',
    name: '90-Day Lock',
    apr: 20,
    lockPeriod: 90,
    minAmount: 500,
    maxAmount: 100000,
    color: 'purple',
    description: 'Lock for 90 days to maximize returns. Recommended for committed stakers.'
  },
  {
    id: 'long',
    name: '180-Day Lock',
    apr: 35,
    lockPeriod: 180,
    minAmount: 1000,
    maxAmount: 500000,
    color: 'amber',
    description: 'Long-term staking with highest APR. For serious investors only.'
  }
];

const CE_CONVERSION_RATE = 100; // 100 CE Points = 1 JY Token

export const StakingDashboard: React.FC<StakingDashboardProps> = ({
  wallet,
  onStakingChange
}) => {
  const { user } = useAuth();
  const [activeStakes, setActiveStakes] = useState<Staking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stake Modal State
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StakingPlan | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  
  // Unstake Modal State
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [selectedStake, setSelectedStake] = useState<Staking | null>(null);
  
  // CE Conversion State
  const [showCEConversion, setShowCEConversion] = useState(false);
  const [cePoints, setCEPoints] = useState('');
  
  // OTP State
  const [showOTP, setShowOTP] = useState(false);
  const [otpOperation, setOTPOperation] = useState<'stake' | 'unstake' | 'convert'>('stake');
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  // Load active stakes
  useEffect(() => {
    loadActiveStakes();
  }, [user?.id]);

  const loadActiveStakes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const stakes = await financeApi.getUserStakings(user.id);
      // Filter for active stakes on client side
      setActiveStakes(stakes.filter(s => s.status === 'ACTIVE'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total staked, rewards earned, and projected earnings
  const stakingStats = useMemo(() => {
    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);
    const totalRewards = activeStakes.reduce((sum, stake) => sum + (stake.rewardsEarned || 0), 0);
    
    // Calculate projected annual rewards
    const projectedAnnualRewards = activeStakes.reduce((sum, stake) => {
      const plan = STAKING_PLANS.find(p => p.lockPeriod === getLockPeriodFromStake(stake));
      const apr = plan?.apr || 5;
      return sum + (stake.amount * apr / 100);
    }, 0);

    return { totalStaked, totalRewards, projectedAnnualRewards };
  }, [activeStakes]);

  // Get lock period from stake (helper function)
  const getLockPeriodFromStake = (stake: Staking): number => {
    const start = new Date(stake.stakingDate);
    const end = new Date(stake.expectedUnstakingDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  // Calculate time remaining for locked stakes
  const getTimeRemaining = (stake: Staking): string => {
    const now = new Date();
    const unlockDate = new Date(stake.expectedUnstakingDate);
    const diffMs = unlockDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Unlocked';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Calculate current APR for a stake
  const calculateAPR = (stake: Staking): number => {
    const plan = STAKING_PLANS.find(p => p.lockPeriod === getLockPeriodFromStake(stake));
    return plan?.apr || 5;
  };

  // Calculate daily rewards
  const calculateDailyRewards = (amount: number, apr: number): number => {
    return (amount * apr) / 100 / 365;
  };

  // Handle stake submission
  const handleStake = async () => {
    if (!user || !selectedPlan || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      setError(`Amount must be between ${selectedPlan.minAmount} and ${selectedPlan.maxAmount}`);
      return;
    }

    if (amount > wallet.availableBalance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stakingInput: StakingInput = {
        userId: user.id,
        walletId: wallet.id,
        amount,
        currency: wallet.currency,
        duration: selectedPlan.lockPeriod,
        aprRate: selectedPlan.apr
      };

      const result = await financeApi.stakeTokens(stakingInput);

      if (result.requiresOTP) {
        setPendingTransactionId(result.transactionId || null);
        setOTPOperation('stake');
        setShowOTP(true);
      } else if (result.success) {
        setShowStakeModal(false);
        setStakeAmount('');
        loadActiveStakes();
        onStakingChange?.();
      } else {
        setError(result.error || 'Staking failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle unstake submission
  const handleUnstake = async () => {
    if (!user || !selectedStake) return;

    // Check if lock period is complete
    const now = new Date();
    const unlockDate = new Date(selectedStake.expectedUnstakingDate);
    
    if (now < unlockDate) {
      setError('Cannot unstake before lock period ends');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unstakingInput: UnstakingInput = {
        stakingId: selectedStake.id,
        userId: user.id,
        walletId: wallet.id
      };

      const result = await financeApi.unstakeTokens(unstakingInput);

      if (result.requiresOTP) {
        setPendingTransactionId(result.transactionId || null);
        setOTPOperation('unstake');
        setShowOTP(true);
      } else if (result.success) {
        setShowUnstakeModal(false);
        setSelectedStake(null);
        loadActiveStakes();
        onStakingChange?.();
      } else {
        setError(result.error || 'Unstaking failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle CE Points conversion
  const handleCEConversion = async () => {
    if (!user || !cePoints) return;

    const points = parseFloat(cePoints);
    if (isNaN(points) || points < CE_CONVERSION_RATE) {
      setError(`Minimum ${CE_CONVERSION_RATE} CE Points required`);
      return;
    }

    if (points > wallet.cePoints) {
      setError('Insufficient CE Points');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conversionInput: ConversionInput = {
        userId: user.id,
        walletId: wallet.id,
        fromCurrency: 'CE_POINTS',
        toCurrency: wallet.currency,
        amount: points / CE_CONVERSION_RATE,
        conversionRate: CE_CONVERSION_RATE,
        metadata: {
          cePoints: points,
          targetCurrency: wallet.currency
        }
      };

      const result = await financeApi.convertCEToTokens(conversionInput);

      if (result.requiresOTP) {
        setPendingTransactionId(result.transactionId || null);
        setOTPOperation('convert');
        setShowOTP(true);
      } else if (result.success) {
        setShowCEConversion(false);
        setCEPoints('');
        onStakingChange?.();
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    setShowOTP(false);
    
    // Refresh data after OTP verification
    loadActiveStakes();
    onStakingChange?.();
    
    // Close modals
    setShowStakeModal(false);
    setShowUnstakeModal(false);
    setShowCEConversion(false);
  };

  if (loading && activeStakes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="staking-dashboard space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Total Staked</p>
          <p className="text-3xl font-bold">{stakingStats.totalStaked.toFixed(2)}</p>
          <p className="text-sm opacity-80">{wallet.currency}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Rewards Earned</p>
          <p className="text-3xl font-bold">{stakingStats.totalRewards.toFixed(4)}</p>
          <p className="text-sm opacity-80">{wallet.currency}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Est. Annual Rewards</p>
          <p className="text-3xl font-bold">{stakingStats.projectedAnnualRewards.toFixed(2)}</p>
          <p className="text-sm opacity-80">{wallet.currency}</p>
        </div>
      </div>

      {/* Staking Plans */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Staking Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAKING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
            >
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {plan.apr}%
                <span className="text-sm font-normal text-gray-500"> APR</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {plan.description}
              </p>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                <div className="flex justify-between">
                  <span>Lock Period:</span>
                  <span className="font-semibold">{plan.lockPeriod === 0 ? 'None' : `${plan.lockPeriod} days`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Amount:</span>
                  <span className="font-semibold">{plan.minAmount} {wallet.currency}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowStakeModal(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Stake Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CE Points Conversion */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Convert CE Points</h3>
            <p className="text-sm opacity-90">
              You have <span className="font-bold">{wallet.cePoints}</span> CE Points
            </p>
            <p className="text-xs opacity-80 mt-1">
              {CE_CONVERSION_RATE} CE Points = 1 {wallet.currency}
            </p>
          </div>
          <button
            onClick={() => setShowCEConversion(true)}
            className="px-6 py-3 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
          >
            Convert Now
          </button>
        </div>
      </div>

      {/* Active Stakes */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Active Stakes ({activeStakes.length})
        </h3>

        {activeStakes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You have no active stakes
            </p>
            <button
              onClick={() => setShowStakeModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start Staking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeStakes.map((stake) => {
              const apr = calculateAPR(stake);
              const dailyRewards = calculateDailyRewards(stake.amount, apr);
              const timeRemaining = getTimeRemaining(stake);
              const isUnlocked = timeRemaining === 'Unlocked';

              return (
                <div
                  key={stake.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Staked Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {stake.amount} {stake.currency}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">APR</p>
                      <p className="text-xl font-bold text-green-600">
                        {apr}%
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rewards Earned</p>
                      <p className="text-xl font-bold text-purple-600">
                        {(stake.rewardsEarned || 0).toFixed(4)} {stake.currency}
                      </p>
                      <p className="text-xs text-gray-500">
                        +{dailyRewards.toFixed(4)}/day
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lock Period</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {timeRemaining}
                      </p>
                      <p className="text-xs text-gray-500">
                        Until {new Date(stake.expectedUnstakingDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setSelectedStake(stake);
                          setShowUnstakeModal(true);
                        }}
                        disabled={!isUnlocked}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                          isUnlocked
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isUnlocked ? 'Unstake' : 'Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stake Modal */}
      {showStakeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Stake Tokens - {selectedPlan.name}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">APR</span>
                  <span className="font-bold text-blue-600">{selectedPlan.apr}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Lock Period</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedPlan.lockPeriod === 0 ? 'None' : `${selectedPlan.lockPeriod} days`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${selectedPlan.minAmount} ${wallet.currency}`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {wallet.availableBalance} {wallet.currency}
                </p>
              </div>

              {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Estimated Daily Rewards
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {calculateDailyRewards(parseFloat(stakeAmount), selectedPlan.apr).toFixed(4)} {wallet.currency}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStakeModal(false);
                  setStakeAmount('');
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStake}
                disabled={loading || !stakeAmount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Stake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unstake Modal */}
      {showUnstakeModal && selectedStake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Unstake Tokens
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Staked Amount</p>
                <p className="font-bold text-gray-900 dark:text-white text-xl">
                  {selectedStake.amount} {selectedStake.currency}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Rewards Earned</p>
                <p className="font-bold text-green-600 text-xl">
                  {(selectedStake.rewardsEarned || 0).toFixed(4)} {selectedStake.currency}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">You will receive</p>
                <p className="font-bold text-blue-600 text-xl">
                  {(selectedStake.amount + (selectedStake.rewardsEarned || 0)).toFixed(4)} {selectedStake.currency}
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
                  setShowUnstakeModal(false);
                  setSelectedStake(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUnstake}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Confirm Unstake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CE Conversion Modal */}
      {showCEConversion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Convert CE Points
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Available CE Points</p>
                <p className="font-bold text-amber-600 text-2xl">{wallet.cePoints}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CE Points to Convert
                </label>
                <input
                  type="number"
                  value={cePoints}
                  onChange={(e) => setCEPoints(e.target.value)}
                  placeholder={`Min: ${CE_CONVERSION_RATE}`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Conversion rate: {CE_CONVERSION_RATE} CE = 1 {wallet.currency}
                </p>
              </div>

              {cePoints && !isNaN(parseFloat(cePoints)) && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    You will receive
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {(parseFloat(cePoints) / CE_CONVERSION_RATE).toFixed(4)} {wallet.currency}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCEConversion(false);
                  setCEPoints('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCEConversion}
                disabled={loading || !cePoints}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Convert'}
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
          operation={
            otpOperation === 'stake' ? 'Token Staking' :
            otpOperation === 'unstake' ? 'Token Unstaking' :
            'CE Points Conversion'
          }
          transactionId={pendingTransactionId || undefined}
          email={user?.email}
        />
      )}
    </div>
  );
};

export default StakingDashboard;

