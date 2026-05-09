/**
 * Send Modal - Transfer funds to another user
 */

'use client';

import React, { useState } from 'react';
import { Wallet, TransferInput } from '../../../types/finance';
import { financeApi, financeRestApi } from '../../../services/financeApi';
import { OTPVerificationModal } from '../OTPVerificationModal';
import { useAuth } from '../../../hooks/useAuth';

interface SendModalProps {
  wallet: Wallet;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

export const SendModal: React.FC<SendModalProps> = ({ wallet, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'confirm' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    recipientUserId: '',
    recipientWalletId: '',
    amount: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > wallet.availableBalance) {
      setError('Insufficient balance');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const input: TransferInput = {
        fromUserId: user.id,
        fromWalletId: wallet.id,
        toUserId: formData.recipientUserId,
        toWalletId: formData.recipientWalletId,
        amount: parseFloat(formData.amount),
        currency: wallet.currency,
        description: formData.description
      };

      const result = await financeApi.transferBetweenUsers(input);

      if (result.requiresOTP) {
        await financeRestApi.requestOTP('Send Transfer', result.transactionId);
        setPendingTransactionId(result.transactionId || null);
        setStep('otp');
      } else if (result.success) {
        onSuccess(result.transactionId!);
        onClose();
      } else {
        setError(result.error || 'Transaction failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    // OTP verification logic here
    if (pendingTransactionId) {
      onSuccess(pendingTransactionId);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Funds</h2>
            
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Recipient User ID</label>
                  <input
                    type="text"
                    value={formData.recipientUserId}
                    onChange={(e) => setFormData({ ...formData, recipientUserId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {wallet.availableBalance} {wallet.currency}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm">Amount: {formData.amount} {wallet.currency}</p>
                  <p className="text-sm">To: {formData.recipientUserId}</p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-4 py-2 border rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {step === 'otp' && (
        <OTPVerificationModal
          isOpen={true}
          onClose={() => setStep('form')}
          onVerify={handleOTPVerify}
          operation="Send Transfer"
          transactionId={pendingTransactionId || undefined}
          email={user?.email}
        />
      )}
    </>
  );
};

