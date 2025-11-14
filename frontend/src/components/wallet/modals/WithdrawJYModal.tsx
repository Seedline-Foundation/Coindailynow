/**
 * Withdraw JY Modal Component
 * 
 * Features:
 * - Amount input with validation (min 0.05 JY)
 * - Whitelisted address selection
 * - Cooldown timer display
 * - Next available date display
 * - Withdrawal history
 * - Success/error messaging
 */

'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import financeApi from '@/services/financeApi';

interface WithdrawJYModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: {
    id: string;
    joyTokens: number;
    whitelistedAddresses?: string[];
  };
  onSuccess?: () => void;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  destinationAddress: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
  transactionHash?: string;
}

const WithdrawJYModal: React.FC<WithdrawJYModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<{
    hoursUntilNext?: number;
    nextAvailableDate?: string;
  } | null>(null);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const MIN_WITHDRAWAL = 0.05;
  const whitelistedAddresses = wallet.whitelistedAddresses || [];

  // Load withdrawal history
  useEffect(() => {
    if (isOpen) {
      loadWithdrawalHistory();
    }
  }, [isOpen]);

  const loadWithdrawalHistory = async () => {
    try {
      const requests = await (financeApi as any).getUserWithdrawalRequests(undefined, 10);
      setHistory(requests);
    } catch (error) {
      console.error('Failed to load withdrawal history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setCooldownInfo(null);

    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL} JY`);
      return;
    }

    if (amountNum > wallet.joyTokens) {
      setError('Insufficient JY token balance');
      return;
    }

    if (!selectedAddress) {
      setError('Please select a destination address');
      return;
    }

    setLoading(true);

    try {
      const result = await (financeApi as any).createWithdrawalRequest({
        walletId: wallet.id,
        amount: amountNum,
        destinationAddress: selectedAddress,
        notes: notes || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setAmount('');
        setNotes('');
        loadWithdrawalHistory();
        
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 3000);
      } else {
        // Check for cooldown or scheduling issues
        if (result.hoursUntilNextRequest !== undefined) {
          setCooldownInfo({
            hoursUntilNext: result.hoursUntilNextRequest,
            nextAvailableDate: result.nextAvailableDate,
          });
        }
        setError(result.message || 'Failed to create withdrawal request');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Withdraw JY Tokens
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Balance Display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                {wallet.joyTokens.toFixed(4)} JY
              </div>
            </div>

            {/* Important Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Withdrawal Policy:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Minimum withdrawal: {MIN_WITHDRAWAL} JY</li>
                    <li>48-hour cooldown between requests</li>
                    <li>Processed on Wednesdays and Fridays only</li>
                    <li>Must use whitelisted addresses</li>
                    <li>Requires admin approval</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div className="text-sm text-green-800">
                    Withdrawal request submitted successfully! It will be reviewed by an admin.
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            {/* Cooldown Info */}
            {cooldownInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    {cooldownInfo.hoursUntilNext !== undefined && (
                      <p className="mb-1">
                        <strong>Cooldown Active:</strong> {cooldownInfo.hoursUntilNext.toFixed(1)} hours remaining
                      </p>
                    )}
                    {cooldownInfo.nextAvailableDate && (
                      <p>
                        <strong>Next Available:</strong>{' '}
                        {formatDate(cooldownInfo.nextAvailableDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (JY) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={MIN_WITHDRAWAL}
                  max={wallet.joyTokens}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Min: ${MIN_WITHDRAWAL} JY`}
                  required
                  disabled={loading}
                />
              </div>

              {/* Address Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Address *
                </label>
                {whitelistedAddresses.length > 0 ? (
                  <select
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    <option value="">Select an address...</option>
                    {whitelistedAddresses.map((address, index) => (
                      <option key={index} value={address}>
                        {address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-red-600">
                    No whitelisted addresses found. Please add addresses in your wallet settings.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add any additional information..."
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || whitelistedAddresses.length === 0}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Submitting Request...' : 'Submit Withdrawal Request'}
              </button>
            </form>

            {/* Withdrawal History */}
            <div className="mt-8 border-t pt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Withdrawals
                </h3>
                <span className="text-sm text-gray-500">
                  {showHistory ? 'Hide' : 'Show'}
                </span>
              </button>

              {showHistory && (
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.map((request) => (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {request.amount} JY
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(request.requestedAt)}
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-xs text-gray-600 mb-1">
                          To: {request.destinationAddress.substring(0, 20)}...
                        </div>
                        {request.adminNotes && (
                          <div className="text-xs text-gray-600 italic">
                            Note: {request.adminNotes}
                          </div>
                        )}
                        {request.transactionHash && (
                          <div className="text-xs text-blue-600 mt-1">
                            TX: {request.transactionHash.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No withdrawal history
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawJYModal;

