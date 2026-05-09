/**
 * Transfer JY Modal
 * 
 * Internal platform transfers:
 * - Pay for premium content
 * - Pay for platform services
 * - Transfer to other users
 */

'use client';

import React, { useState } from 'react';
import { Wallet } from '../../../types/finance';
import { financeApi } from '../../../services/financeApi';
import { DollarSign, X, AlertCircle, CheckCircle, Search } from 'lucide-react';

interface TransferModalProps {
  wallet: Wallet;
  onClose: () => void;
  onSuccess: () => void;
}

type TransferType = 'USER' | 'SERVICE' | 'CONTENT';

export const TransferModal: React.FC<TransferModalProps> = ({
  wallet,
  onClose,
  onSuccess,
}) => {
  const [transferType, setTransferType] = useState<TransferType>('USER');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const MIN_TRANSFER = 0.01;

  const validateAmount = (amt: string): boolean => {
    const numAmount = parseFloat(amt);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < MIN_TRANSFER) {
      setError(`Minimum transfer is ${MIN_TRANSFER} JY`);
      return false;
    }

    if (numAmount > wallet.joyTokens) {
      setError(`Insufficient balance. You have ${wallet.joyTokens} JY`);
      return false;
    }

    setError('');
    return true;
  };

  const handleTransfer = async () => {
    if (!validateAmount(amount)) return;
    if (!recipient) {
      setError('Please specify a recipient');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await financeApi.createTransfer({
        fromWalletId: wallet.id,
        toIdentifier: recipient,
        amount: parseFloat(amount),
        transferType,
        note,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = parseFloat(amount) * 0.01; // 1% platform fee
  const recipientAmount = parseFloat(amount) - platformFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Transfer JY Tokens
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
                  Transfer completed successfully!
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
              Available Balance
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {wallet.joyTokens.toFixed(4)} JY
            </p>
          </div>

          {/* Transfer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Transfer Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTransferType('USER')}
                className={`p-3 border-2 rounded-lg transition-all text-sm ${
                  transferType === 'USER'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                To User
              </button>
              <button
                onClick={() => setTransferType('SERVICE')}
                className={`p-3 border-2 rounded-lg transition-all text-sm ${
                  transferType === 'SERVICE'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                Service
              </button>
              <button
                onClick={() => setTransferType('CONTENT')}
                className={`p-3 border-2 rounded-lg transition-all text-sm ${
                  transferType === 'CONTENT'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                Content
              </button>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {transferType === 'USER' ? 'Recipient Username/Email' : 'Service/Content ID'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  transferType === 'USER'
                    ? 'Enter username or email'
                    : 'Enter service/content ID'
                }
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading || success}
              />
              {transferType === 'USER' && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
            </div>
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
              placeholder={`Min ${MIN_TRANSFER} JY`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading || success}
              step="0.01"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this transfer"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              disabled={loading || success}
              maxLength={200}
            />
          </div>

          {/* Fee Preview */}
          {amount && !error && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transfer Amount:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {parseFloat(amount).toFixed(4)} JY
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee (1%):</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {platformFee.toFixed(4)} JY
                </span>
              </div>
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">
                    Recipient Receives:
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {recipientAmount.toFixed(4)} JY
                  </span>
                </div>
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
            onClick={handleTransfer}
            disabled={loading || success || !amount || !recipient || !!error}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

