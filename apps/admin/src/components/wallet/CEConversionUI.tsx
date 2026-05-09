/**
 * CE Points to Tokens Conversion Component for Task 3
 * 
 * Features:
 * - Simple CE Points to JOY Tokens conversion interface
 * - Real-time conversion rate display and calculations
 * - Backend validation for conversion limits and availability
 * - Integration with OTP verification for security
 * - Visual conversion preview and confirmation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { financeApi } from '../../services/financeApi';
import { Wallet, CEConversionInput } from '../../types/finance';
import { OTPVerificationModal } from './OTPVerificationModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface CEConversionUIProps {
  wallet: Wallet;
  cePoints: number;
  onConversionComplete?: (convertedAmount: number) => void;
}

interface ConversionRates {
  ceToJoy: number; // How many CE Points = 1 JOY Token
  minimumConversion: number; // Minimum CE Points required
  maximumConversion: number; // Maximum CE Points per day
  dailyUsed: number; // CE Points already converted today
}

export const CEConversionUI: React.FC<CEConversionUIProps> = ({
  wallet,
  cePoints,
  onConversionComplete
}) => {
  const { user } = useAuth();
  const [conversionAmount, setConversionAmount] = useState('');
  const [rates, setRates] = useState<ConversionRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConversion, setPendingConversion] = useState<number>(0);

  // Load conversion rates on mount
  useEffect(() => {
    const loadRates = async () => {
      try {
        // TODO: Replace with actual API call
        const ratesData: ConversionRates = {
          ceToJoy: 100, // 100 CE Points = 1 JOY Token
          minimumConversion: 100,
          maximumConversion: 10000,
          dailyUsed: 0 // This would come from backend
        };
        setRates(ratesData);
      } catch (err: any) {
        setError('Failed to load conversion rates');
      }
    };

    loadRates();
  }, []);

  // Calculate conversion preview
  const calculateConversion = (ceAmount: number): { joyTokens: number; remaining: number } => {
    if (!rates) return { joyTokens: 0, remaining: ceAmount };
    
    const joyTokens = ceAmount / rates.ceToJoy;
    const remaining = ceAmount % rates.ceToJoy;
    
    return { joyTokens, remaining };
  };

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    const numValue = value.replace(/[^\d]/g, '');
    setConversionAmount(numValue);
    setError(null);
    
    if (numValue) {
      const amount = parseInt(numValue);
      if (amount >= (rates?.minimumConversion || 100)) {
        setShowPreview(true);
      } else {
        setShowPreview(false);
      }
    } else {
      setShowPreview(false);
    }
  };

  // Validate conversion
  const validateConversion = (amount: number): string | null => {
    if (!rates) return 'Conversion rates not loaded';
    if (amount < rates.minimumConversion) return `Minimum conversion is ${rates.minimumConversion} CE Points`;
    if (amount > cePoints) return 'Insufficient CE Points';
    if (rates.dailyUsed + amount > rates.maximumConversion) {
      return `Daily limit exceeded. Available: ${rates.maximumConversion - rates.dailyUsed} CE Points`;
    }
    return null;
  };

  // Handle conversion initiation
  const handleConvertInitiate = () => {
    const amount = parseInt(conversionAmount);
    const validationError = validateConversion(amount);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setPendingConversion(amount);
    setShowOTP(true);
  };

  // Handle OTP verification and complete conversion
  const handleOTPVerify = async (otpCode: string) => {
    if (!user?.id || !pendingConversion || !rates) return;

    setLoading(true);
    setError(null);

    try {
      const conversionInput: CEConversionInput = {
        userId: user.id,
        walletId: wallet.id,
        cePoints: pendingConversion,
        targetCurrency: wallet.currency,
        otpCode
      };

      const result = await financeApi.convertCEPoints(conversionInput);

      if (result.success) {
        const { joyTokens } = calculateConversion(pendingConversion);
        onConversionComplete?.(joyTokens);
        setConversionAmount('');
        setShowPreview(false);
        setShowOTP(false);
        setPendingConversion(0);
        
        // Update daily used amount
        setRates(prev => prev ? { ...prev, dailyUsed: prev.dailyUsed + pendingConversion } : null);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  if (!rates) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const conversionPreview = conversionAmount ? calculateConversion(parseInt(conversionAmount)) : null;
  const remainingDaily = rates.maximumConversion - rates.dailyUsed;

  return (
    <div className="ce-conversion-ui bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Convert CE Points
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Convert Community Engagement Points to JOY Tokens
          </p>
        </div>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 dark:text-purple-400">⭐</span>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">CE Points</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {cePoints.toLocaleString()}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 dark:text-yellow-400">🪙</span>
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">JOY Tokens</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
            {wallet.availableBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Conversion Rate Display */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Conversion Rate</p>
          <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <span className="flex items-center gap-1">
              <span className="text-purple-600">⭐</span>
              {rates.ceToJoy}
            </span>
            <span className="text-gray-400">=</span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-600">🪙</span>
              1
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {rates.ceToJoy} CE Points = 1 JOY Token
          </p>
        </div>
      </div>

      {/* Daily Limits */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Conversion Limit</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {remainingDaily.toLocaleString()} / {rates.maximumConversion.toLocaleString()} CE Points
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${(rates.dailyUsed / rates.maximumConversion) * 100}%` }}
          />
        </div>
      </div>

      {/* Conversion Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CE Points to Convert
          </label>
          <div className="relative">
            <input
              type="text"
              value={conversionAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={`Minimum ${rates.minimumConversion} CE Points`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-purple-600 dark:text-purple-400">⭐</span>
            </div>
          </div>
        </div>

        {/* Conversion Preview */}
        {showPreview && conversionPreview && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">Conversion Preview</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">CE Points to Convert:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {parseInt(conversionAmount).toLocaleString()} ⭐
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">JOY Tokens to Receive:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">
                  {conversionPreview.joyTokens.toFixed(4)} 🪙
                </span>
              </div>

              {conversionPreview.remaining > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Remaining CE Points:</span>
                  <span className="text-sm text-gray-500">
                    {conversionPreview.remaining} ⭐ (not converted)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleConvertInitiate}
          disabled={!conversionAmount || loading || parseInt(conversionAmount) < rates.minimumConversion}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Converting...
            </span>
          ) : (
            'Convert CE Points'
          )}
        </button>
      </div>

      {/* Important Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="font-semibold text-blue-800 dark:text-blue-400 text-sm">
              Important Information
            </h5>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Conversions require email OTP verification</li>
              <li>• Daily conversion limits apply</li>
              <li>• Converted tokens are added to your wallet immediately</li>
              <li>• Conversion rates may change based on platform activity</li>
            </ul>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTP && (
        <OTPVerificationModal
          isOpen={showOTP}
          onClose={() => {
            setShowOTP(false);
            setPendingConversion(0);
          }}
          onVerify={handleOTPVerify}
          operation="ce_points_conversion"
          email={user?.email}
        />
      )}
    </div>
  );
};

export default CEConversionUI;
