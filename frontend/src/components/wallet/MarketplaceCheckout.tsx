/**
 * Marketplace Checkout Component for Task 3
 * 
 * Features:
 * - Integrated marketplace checkout using internal wallet balance
 * - Product payment processing with wallet validation
 * - Multiple payment options (Wallet Balance, CE Points conversion)
 * - OTP verification for purchases
 * - Real-time balance checking and insufficient balance handling
 * - Transaction receipt and confirmation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { financeApi } from '../../services/financeApi';
import { Wallet, PaymentInput, PaymentMethod, PaymentType } from '../../types/finance';
import { OTPVerificationModal } from './OTPVerificationModal';
import { CEConversionUI } from './CEConversionUI';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  seller: {
    id: string;
    name: string;
    rating: number;
  };
  image?: string;
  features: string[];
}

interface MarketplaceCheckoutProps {
  products: MarketplaceProduct[];
  wallet: Wallet;
  cePoints: number;
  onPurchaseComplete?: (transactionId: string, products: MarketplaceProduct[]) => void;
  onClose?: () => void;
}

export const MarketplaceCheckout: React.FC<MarketplaceCheckoutProps> = ({
  products,
  wallet,
  cePoints,
  onPurchaseComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'ce_conversion' | 'mixed'>('wallet');
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showCEConversion, setShowCEConversion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<PaymentInput | null>(null);

  // Calculate totals
  const totalAmount = products.reduce((sum, product) => sum + product.price, 0);
  const canPayWithWallet = wallet.availableBalance >= totalAmount;
  const cePointsNeeded = Math.ceil((totalAmount - wallet.availableBalance) * 100); // Assuming 100 CE = 1 Token
  const canPayWithCE = cePoints >= cePointsNeeded;

  // Handle payment method selection
  const handlePaymentMethodChange = (method: 'wallet' | 'ce_conversion' | 'mixed') => {
    setPaymentMethod(method);
    setError(null);
  };

  // Validate payment
  const validatePayment = (): string | null => {
    switch (paymentMethod) {
      case 'wallet':
        if (!canPayWithWallet) {
          return `Insufficient wallet balance. Required: ${totalAmount.toFixed(2)} ${wallet.currency}`;
        }
        break;
      case 'ce_conversion':
        if (!canPayWithCE) {
          return `Insufficient CE Points. Required: ${cePointsNeeded} CE Points`;
        }
        break;
      case 'mixed':
        if (wallet.availableBalance + (cePoints / 100) < totalAmount) {
          return 'Insufficient combined balance (Wallet + CE Points)';
        }
        break;
    }
    return null;
  };

  // Handle purchase initiation
  const handlePurchase = async () => {
    if (!user?.id) return;

    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Prepare payment input
    const paymentInput: PaymentInput = {
      userId: user.id,
      walletId: wallet.id,
      amount: totalAmount,
      currency: wallet.currency,
      paymentType: PaymentType.PRODUCT,
      paymentMethod: paymentMethod === 'wallet' ? PaymentMethod.WALLET_BALANCE : PaymentMethod.MIXED,
      metadata: {
        products: products.map(p => ({ id: p.id, name: p.name, price: p.price })),
        paymentType: 'marketplace_purchase',
        useConversion: paymentMethod !== 'wallet',
        cePointsUsed: paymentMethod !== 'wallet' ? cePointsNeeded : 0
      }
    };

    setPendingTransaction(paymentInput);
    
    // Show CE conversion if needed
    if (paymentMethod === 'ce_conversion') {
      setShowCEConversion(true);
    } else {
      setShowOTP(true);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (otpCode: string) => {
    if (!pendingTransaction) return;

    setLoading(true);
    setError(null);

    try {
      const result = await financeApi.processPayment({
        ...pendingTransaction,
        metadata: {
          ...pendingTransaction.metadata,
          otpCode
        }
      });

      if (result.success) {
        onPurchaseComplete?.(result.transactionId!, products);
        setShowOTP(false);
        setPendingTransaction(null);
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle CE conversion completion
  const handleCEConversionComplete = (convertedAmount: number) => {
    setShowCEConversion(false);
    // Proceed with regular payment after conversion
    setShowOTP(true);
  };

  return (
    <div className="marketplace-checkout bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Checkout
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Products Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Order Summary
          </h3>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">by {product.seller.name}</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-500">{product.seller.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {product.price.toFixed(2)} {product.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalAmount.toFixed(2)} {wallet.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Your Balance</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {wallet.availableBalance.toFixed(2)} {wallet.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">CE Points</p>
              <p className="font-bold text-purple-600 dark:text-purple-400">
                {cePoints.toLocaleString()} ⭐
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h4>
          <div className="space-y-3">
            {/* Wallet Balance */}
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                disabled={!canPayWithWallet}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Wallet Balance</span>
                  <span className={`text-sm ${canPayWithWallet ? 'text-green-600' : 'text-red-600'}`}>
                    {canPayWithWallet ? '✓ Sufficient' : '✗ Insufficient'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Available: {wallet.availableBalance.toFixed(2)} {wallet.currency}
                </p>
              </div>
            </label>

            {/* CE Points Conversion */}
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="paymentMethod"
                value="ce_conversion"
                checked={paymentMethod === 'ce_conversion'}
                onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                disabled={!canPayWithCE}
                className="w-4 h-4 text-blue-600"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">CE Points Conversion</span>
                  <span className={`text-sm ${canPayWithCE ? 'text-green-600' : 'text-red-600'}`}>
                    {canPayWithCE ? '✓ Sufficient' : '✗ Insufficient'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required: {cePointsNeeded} CE Points (Available: {cePoints.toLocaleString()})
                </p>
              </div>
            </label>

            {/* Mixed Payment */}
            {!canPayWithWallet && wallet.availableBalance > 0 && (
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mixed"
                  checked={paymentMethod === 'mixed'}
                  onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">Mixed Payment</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Wallet ({wallet.availableBalance.toFixed(2)} {wallet.currency}) + CE Points ({Math.ceil((totalAmount - wallet.availableBalance) * 100)} ⭐)
                  </p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handlePurchase}
            disabled={loading || validatePayment() !== null}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Processing...
              </span>
            ) : (
              `Pay ${totalAmount.toFixed(2)} ${wallet.currency}`
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h5 className="font-semibold text-blue-800 dark:text-blue-400 text-sm">
                Secure Payment
              </h5>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                All purchases require email OTP verification. Your payment will be processed securely through your wallet balance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CE Conversion Modal */}
      {showCEConversion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <CEConversionUI
              wallet={wallet}
              cePoints={cePoints}
              onConversionComplete={handleCEConversionComplete}
            />
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOTP && pendingTransaction && (
        <OTPVerificationModal
          isOpen={showOTP}
          onClose={() => {
            setShowOTP(false);
            setPendingTransaction(null);
          }}
          onVerify={handleOTPVerify}
          operation="marketplace_purchase"
          email={user?.email}
        />
      )}
    </div>
  );
};

export default MarketplaceCheckout;
