/**
 * Swap JY Modal
 * 
 * Exchange tokens via payment widgets:
 * - YellowCard (African users)
 * - ChangeNOW (International users)
 * - Real-time exchange rate calculation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet } from '../../../types/finance';
import { financeApi } from '../../../services/financeApi';
import { ArrowLeftRight, X, AlertCircle, CheckCircle, TrendingUp, ExternalLink } from 'lucide-react';

interface SwapModalProps {
  wallet: Wallet;
  userLocation?: 'AFRICA' | 'OUTSIDE_AFRICA';
  onClose: () => void;
  onSuccess: () => void;
}

type SwapDirection = 'JY_TO_FIAT' | 'FIAT_TO_JY';
type Currency = 'USD' | 'EUR' | 'NGN' | 'KES' | 'ZAR' | 'GHS';

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fee: number;
  estimatedTime: string;
  provider: 'YellowCard' | 'ChangeNOW';
}

export const SwapModal: React.FC<SwapModalProps> = ({
  wallet,
  userLocation,
  onClose,
  onSuccess,
}) => {
  const [swapDirection, setSwapDirection] = useState<SwapDirection>('JY_TO_FIAT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MIN_SWAP_JY = 1;
  const MIN_SWAP_FIAT = 10;

  // Determine provider based on location
  const isAfrican = userLocation === 'AFRICA';
  const provider = isAfrican ? 'YellowCard' : 'ChangeNOW';

  // African currencies supported by YellowCard
  const africanCurrencies: Currency[] = ['NGN', 'KES', 'ZAR', 'GHS'];
  const internationalCurrencies: Currency[] = ['USD', 'EUR'];

  const availableCurrencies = isAfrican ? africanCurrencies : internationalCurrencies;

  // Fetch exchange rate when amounts change
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setExchangeRate(null);
      setToAmount('');
      return;
    }

    const timer = setTimeout(async () => {
      setFetchingRate(true);
      try {
        const rate = await financeApi.getExchangeRate({
          fromCurrency: swapDirection === 'JY_TO_FIAT' ? 'JY' : selectedCurrency,
          toCurrency: swapDirection === 'JY_TO_FIAT' ? selectedCurrency : 'JY',
          amount: parseFloat(fromAmount),
          provider,
        });

        // Cast provider to proper type
        setExchangeRate({
          ...rate,
          provider: rate.provider as 'YellowCard' | 'ChangeNOW'
        });
        setToAmount((parseFloat(fromAmount) * rate.rate).toFixed(2));
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        setError('Failed to fetch exchange rate');
      } finally {
        setFetchingRate(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount, swapDirection, selectedCurrency, provider]);

  const validateSwap = (): boolean => {
    const amount = parseFloat(fromAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (swapDirection === 'JY_TO_FIAT') {
      if (amount < MIN_SWAP_JY) {
        setError(`Minimum swap amount is ${MIN_SWAP_JY} JY`);
        return false;
      }

      if (amount > wallet.joyTokens) {
        setError(`Insufficient JY balance. You have ${wallet.joyTokens} JY`);
        return false;
      }
    } else {
      if (amount < MIN_SWAP_FIAT) {
        setError(`Minimum swap amount is ${MIN_SWAP_FIAT} ${selectedCurrency}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'JY_TO_FIAT' ? 'FIAT_TO_JY' : 'JY_TO_FIAT');
    setFromAmount('');
    setToAmount('');
    setExchangeRate(null);
    setError('');
  };

  const handleSwap = async () => {
    if (!validateSwap() || !exchangeRate) return;

    setLoading(true);
    setError('');

    try {
      // Open payment widget in popup
      const callbackUrl = `${window.location.origin}/api/wallet/swap/callback`;
      const widgetUrl = isAfrican
        ? `https://widget.yellowcard.io/swap?amount=${fromAmount}&from=${swapDirection === 'JY_TO_FIAT' ? 'JY' : selectedCurrency}&to=${swapDirection === 'JY_TO_FIAT' ? selectedCurrency : 'JY'}&callback=${encodeURIComponent(callbackUrl)}&userId=${wallet.userId}`
        : `https://changenow.io/embeds/exchange-widget/v2?amount=${fromAmount}&from=${swapDirection === 'JY_TO_FIAT' ? 'JY' : selectedCurrency}&to=${swapDirection === 'JY_TO_FIAT' ? selectedCurrency : 'JY'}&callback=${encodeURIComponent(callbackUrl)}&userId=${wallet.userId}`;

      const popup = window.open(
        widgetUrl,
        'SwapWidget',
        'width=600,height=800,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setError('Please allow popups to complete the swap');
        setLoading(false);
        return;
      }

      // Wait for callback or popup close
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
          // Check if swap was successful
          financeApi.checkSwapStatus(wallet.id).then((status) => {
            if (status.success) {
              setSuccess(true);
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 2000);
            }
          });
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate swap');
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: Currency): string => {
    const symbols: Record<Currency, string> = {
      USD: '$',
      EUR: '€',
      NGN: '₦',
      KES: 'KSh',
      ZAR: 'R',
      GHS: '₵',
    };
    return symbols[currency];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ArrowLeftRight className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Swap Tokens
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Powered by {provider}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 dark:text-green-300">
                  Swap completed successfully!
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

          {/* Available Balance */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Available JY Balance
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {wallet.joyTokens.toFixed(4)} JY
            </p>
          </div>

          {/* From Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              You Send
            </label>
            <div className="relative">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder={swapDirection === 'JY_TO_FIAT' ? `Min ${MIN_SWAP_JY} JY` : `Min ${MIN_SWAP_FIAT}`}
                className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading || success}
                step="0.01"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {swapDirection === 'JY_TO_FIAT' ? (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">JY</span>
                ) : (
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                    className="text-sm font-medium bg-transparent border-none text-gray-900 dark:text-gray-100"
                    disabled={loading || success}
                  >
                    {availableCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapDirection}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={loading || success}
            >
              <ArrowLeftRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* To Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              You Receive
            </label>
            <div className="relative">
              <input
                type="text"
                value={fetchingRate ? 'Calculating...' : toAmount}
                readOnly
                placeholder="0.00"
                className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {swapDirection === 'FIAT_TO_JY' ? (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">JY</span>
                ) : (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {selectedCurrency}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {exchangeRate && !error && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-300">
                  Exchange Rate
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  1 {exchangeRate.fromCurrency} = {exchangeRate.rate.toFixed(4)} {exchangeRate.toCurrency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Provider Fee:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {exchangeRate.fee.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Estimated Time:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {exchangeRate.estimatedTime}
                </span>
              </div>
            </div>
          )}

          {/* Provider Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Swap will open in {provider} widget
              </span>
            </div>
          </div>
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
            onClick={handleSwap}
            disabled={loading || success || !fromAmount || !toAmount || !!error || fetchingRate}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Opening Widget...' : 'Continue to Swap'}
          </button>
        </div>
      </div>
    </div>
  );
};

