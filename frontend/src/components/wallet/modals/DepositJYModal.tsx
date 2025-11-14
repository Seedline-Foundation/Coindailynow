/**
 * Deposit JY Token Modal
 * 
 * Allows users to deposit JY tokens from:
 * 1. Whitelisted external wallets
 * 2. Payment widgets (YellowCard/ChangeNOW) for buying JY
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet } from '../../../types/finance';
import { financeApi } from '../../../services/financeApi';
import { ArrowDownLeft, X, AlertCircle, CheckCircle, Wallet as WalletIcon, CreditCard } from 'lucide-react';

interface DepositJYModalProps {
  wallet: Wallet;
  userLocation?: 'AFRICA' | 'OUTSIDE_AFRICA';
  onClose: () => void;
  onSuccess: () => void;
}

type DepositMethod = 'WALLET' | 'BUY';

export const DepositJYModal: React.FC<DepositJYModalProps> = ({
  wallet,
  userLocation,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState<DepositMethod>('WALLET');
  const [amount, setAmount] = useState('');
  const [sourceWallet, setSourceWallet] = useState('');
  const [whitelistedWallets, setWhitelistedWallets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MIN_DEPOSIT = 0.01;
  const paymentWidget = userLocation === 'AFRICA' ? 'YellowCard' : 'ChangeNOW';

  // Load whitelisted wallets
  useEffect(() => {
    const loadWallets = async () => {
      try {
        const wallets = await financeApi.getWhitelistedWallets(wallet.userId!);
        setWhitelistedWallets(wallets);
      } catch (err) {
        console.error('Failed to load whitelisted wallets:', err);
      }
    };
    loadWallets();
  }, [wallet.userId]);

  const validateAmount = (amt: string): boolean => {
    const numAmount = parseFloat(amt);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ${MIN_DEPOSIT} JY`);
      return false;
    }

    setError('');
    return true;
  };

  const handleWalletDeposit = async () => {
    if (!validateAmount(amount)) return;
    if (!sourceWallet) {
      setError('Please select a source wallet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await financeApi.depositFromWallet({
        walletId: wallet.id,
        sourceAddress: sourceWallet,
        amount: parseFloat(amount),
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Deposit failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deposit JY tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyWithWidget = () => {
    // Open payment widget
    if (userLocation === 'AFRICA') {
      // YellowCard widget integration
      window.open(`https://yellowcard.io/buy?amount=${amount}&currency=JY&callback=${encodeURIComponent(window.location.origin + '/wallet/deposit/callback')}`, 'YellowCard', 'width=500,height=700');
    } else {
      // ChangeNOW widget integration
      window.open(`https://changenow.io/exchange?amount=${amount}&from=usd&to=JY&callback=${encodeURIComponent(window.location.origin + '/wallet/deposit/callback')}`, 'ChangeNOW', 'width=500,height=700');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Deposit JY Tokens
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
                  Deposit initiated successfully! Tokens will arrive shortly.
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

          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Deposit Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod('WALLET')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'WALLET'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                }`}
              >
                <WalletIcon className={`w-6 h-6 mx-auto mb-2 ${
                  method === 'WALLET' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  From Wallet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Transfer from whitelisted wallet
                </p>
              </button>

              <button
                onClick={() => setMethod('BUY')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'BUY'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                  method === 'BUY' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Buy JY
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  via {paymentWidget}
                </p>
              </button>
            </div>
          </div>

          {/* Wallet Deposit Form */}
          {method === 'WALLET' && (
            <>
              {/* Source Wallet Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Wallet
                </label>
                {whitelistedWallets.length > 0 ? (
                  <select
                    value={sourceWallet}
                    onChange={(e) => setSourceWallet(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={loading || success}
                  >
                    <option value="">Select whitelisted wallet</option>
                    {whitelistedWallets.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr.slice(0, 10)}...{addr.slice(-8)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      No whitelisted wallets found. Please add a wallet address to your whitelist first.
                    </p>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (JY)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (e.target.value) validateAmount(e.target.value);
                  }}
                  placeholder={`Min ${MIN_DEPOSIT} JY`}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={loading || success}
                  step="0.01"
                />
              </div>
            </>
          )}

          {/* Buy with Widget */}
          {method === 'BUY' && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You will be redirected to <strong>{paymentWidget}</strong> to purchase JY tokens.
                  Tokens will be automatically deposited to your wallet after payment confirmation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Buy (JY)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  step="0.01"
                />
              </div>
            </>
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
            onClick={method === 'WALLET' ? handleWalletDeposit : handleBuyWithWidget}
            disabled={loading || success || !amount || (method === 'WALLET' && !sourceWallet)}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {method === 'WALLET' ? 'Deposit' : `Buy with ${paymentWidget}`}
          </button>
        </div>
      </div>
    </div>
  );
};

