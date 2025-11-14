/**
 * Convert CE Points to JY Token Modal
 * 
 * Allows users to convert their Community Engagement Points to JOY Tokens.
 * - Minimum conversion: 100 CE Points
 * - Conversion rate: Configurable (default 100 CE = 1 JY)
 * - Instant conversion (no approval needed)
 */

'use client';

import React, { useState } from 'react';
import { Wallet } from '../../../types/finance';
import { financeApi } from '../../../services/financeApi';
import { RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react';

interface ConvertCEModalProps {
  wallet: Wallet;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConvertCEModal: React.FC<ConvertCEModalProps> = ({
  wallet,
  onClose,
  onSuccess,
}) => {
  const [ceAmount, setCeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Conversion rate: 100 CE = 1 JY
  const CONVERSION_RATE = 100;
  const MIN_CE_POINTS = 100;

  const calculateJYAmount = (ce: number): number => {
    return ce / CONVERSION_RATE;
  };

  const jyAmount = ceAmount ? calculateJYAmount(parseFloat(ceAmount)) : 0;

  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < MIN_CE_POINTS) {
      setError(`Minimum conversion is ${MIN_CE_POINTS} CE Points`);
      return false;
    }

    if (numAmount > (wallet.cePoints || 0)) {
      setError(`Insufficient CE Points. You have ${wallet.cePoints || 0} CE`);
      return false;
    }

    setError('');
    return true;
  };

  const handleConvert = async () => {
    if (!validateAmount(ceAmount)) return;

    setLoading(true);
    setError('');

    try {
      const result = await financeApi.convertCEToJY({
        walletId: wallet.id,
        ceAmount: parseFloat(ceAmount),
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to convert CE Points');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setCeAmount((wallet.cePoints || 0).toString());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Convert CE Points
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 dark:text-green-300">
                  Successfully converted {ceAmount} CE to {jyAmount.toFixed(2)} JY!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Current Balance */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Available CE Points
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(wallet.cePoints || 0).toLocaleString()} CE
            </p>
          </div>

          {/* Conversion Rate Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Conversion Rate:</strong> {CONVERSION_RATE} CE Points = 1 JY Token
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Minimum: {MIN_CE_POINTS} CE Points
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CE Points to Convert
            </label>
            <div className="relative">
              <input
                type="number"
                value={ceAmount}
                onChange={(e) => {
                  setCeAmount(e.target.value);
                  if (e.target.value) validateAmount(e.target.value);
                }}
                placeholder="Enter CE amount"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading || success}
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                disabled={loading || success}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Conversion Preview */}
          {ceAmount && !error && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">You will receive</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {jyAmount.toFixed(4)} JY
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={loading || success}
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={loading || success || !ceAmount || !!error}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Converting...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Converted
              </>
            ) : (
              'Convert Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

