/**
 * Withdraw Modal Component
 * 
 * Features:
 * - Minimum withdrawal: 0.05 JY
 * - Maximum cooldown: 48 hours
 * - Only to whitelisted wallets
 * - Wednesday & Friday only (12 AM - 11 PM)
 * - Creates withdrawal request for admin approval
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet } from '../../../types/finance';
import { financeApi } from '../../../services/financeApi';
import { 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Shield,
  Loader
} from 'lucide-react';

interface WithdrawModalProps {
  wallet: Wallet;
  onClose: () => void;
  onSuccess: () => void;
}

interface WhitelistedWallet {
  address: string;
  label: string;
  addedAt: Date;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  wallet,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [whitelistedWallets, setWhitelistedWallets] = useState<WhitelistedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastWithdrawal, setLastWithdrawal] = useState<Date | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const MIN_WITHDRAWAL = 0.05;
  const COOLDOWN_HOURS = 48;

  // Load whitelisted wallets and last withdrawal
  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Implement these API methods in financeApi
        // Load whitelisted wallets
        // const wallets = await financeApi.getWhitelistedWallets(wallet.userId);
        // setWhitelistedWallets(wallets);

        // Load last withdrawal timestamp
        // const lastWithdrawalData = await financeApi.getLastWithdrawal(wallet.id);
        // if (lastWithdrawalData) {
        //   setLastWithdrawal(new Date(lastWithdrawalData.timestamp));
        //   
        //   // Calculate cooldown remaining
        //   const hoursSinceLastWithdrawal = 
        //     (Date.now() - new Date(lastWithdrawalData.timestamp).getTime()) / (1000 * 60 * 60);
        //   const remaining = Math.max(0, COOLDOWN_HOURS - hoursSinceLastWithdrawal);
        //   setCooldownRemaining(remaining);
        // }
        
        // Temporary mock data
        setWhitelistedWallets([]);
      } catch (err) {
        console.error('Failed to load withdrawal data:', err);
      }
    };
    loadData();
  }, [wallet.id, wallet.userId]);

  // Check if in cooldown
  const isInCooldown = cooldownRemaining > 0;

  // Validate amount
  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (numValue < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${MIN_WITHDRAWAL} JY`);
      return false;
    }
    if (numValue > wallet.joyTokens) {
      setError(`Insufficient balance. Available: ${wallet.joyTokens} JY`);
      return false;
    }
    setError('');
    return true;
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError('');
    }
  };

  // Submit withdrawal request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAmount(amount)) return;
    if (!selectedWallet) {
      setError('Please select a whitelisted wallet');
      return;
    }
    if (isInCooldown) {
      setError(`Please wait ${Math.ceil(cooldownRemaining)} hours before next withdrawal`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Implement createWithdrawalRequest in financeApi
      // const result = await financeApi.createWithdrawalRequest({
      //   walletId: wallet.id,
      //   amount: parseFloat(amount),
      //   destinationAddress: selectedWallet,
      //   currency: 'JY'
      // });

      // Temporary mock response
      const result = { 
        success: false, 
        error: 'Withdrawal request API not yet implemented. Please complete the backend implementation first.' 
      };

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to create withdrawal request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  // Format cooldown time
  const formatCooldown = (hours: number): string => {
    if (hours < 1) {
      return `${Math.ceil(hours * 60)} minutes`;
    }
    return `${Math.ceil(hours)} hours`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Withdraw JY Token
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Submit withdrawal request to admin
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cooldown Notice */}
          {isInCooldown && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Cooldown Period Active
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You can make your next withdrawal in {formatCooldown(cooldownRemaining)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Withdrawal Info */}
          {lastWithdrawal && !isInCooldown && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Ready to Withdraw
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Last withdrawal: {lastWithdrawal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Available Balance */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Available Balance
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {wallet.joyTokens.toFixed(4)} JY
              </span>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Withdrawal Amount (JY)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Min: ${MIN_WITHDRAWAL} JY`}
                step="0.01"
                min={MIN_WITHDRAWAL}
                max={wallet.joyTokens}
                disabled={isInCooldown}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => handleAmountChange(wallet.joyTokens.toString())}
                disabled={isInCooldown}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum withdrawal: {MIN_WITHDRAWAL} JY
            </p>
          </div>

          {/* Select Whitelisted Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination Wallet (Whitelisted Only)
            </label>
            {whitelistedWallets.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  No whitelisted wallets found. Please add a wallet address in your security settings.
                </p>
              </div>
            ) : (
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                disabled={isInCooldown}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select wallet address...</option>
                {whitelistedWallets.map((w) => (
                  <option key={w.address} value={w.address}>
                    {w.label} - {w.address.slice(0, 10)}...{w.address.slice(-8)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Important Notes */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Important Information
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Maximum processing time: 48 hours</li>
                  <li>• Admin verification required before processing</li>
                  <li>• Withdrawals are final and cannot be cancelled</li>
                  <li>• Network fees may apply</li>
                  <li>• You can only change whitelisted wallet 3 times per year</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInCooldown || whitelistedWallets.length === 0}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Withdrawal Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

