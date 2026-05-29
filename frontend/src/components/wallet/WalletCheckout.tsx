/**
 * Wallet Payment Integration for Marketplace
 * 
 * Features:
 * - Wallet balance checkout
 * - Payment method selection
 * - Balance validation
 * - OTP verification for purchases
 * - Transaction receipt
 * - Order confirmation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, PaymentInput, PaymentMethod, PaymentType } from '../../types/finance';
import { financeApi } from '../../services/financeApi';
import { useAuth } from '../../hooks/useAuth';
import { OTPVerificationModal } from './OTPVerificationModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  category: string;
}

interface CheckoutItem {
  product: Product;
  quantity: number;
}

interface WalletCheckoutProps {
  items: CheckoutItem[];
  wallet: Wallet;
  onPaymentComplete?: (transactionId: string) => void;
  onCancel?: () => void;
}

export const WalletCheckout: React.FC<WalletCheckoutProps> = ({
  items,
  wallet,
  onPaymentComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WALLET_BALANCE);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Check if wallet has sufficient balance
  const hasSufficientBalance = wallet.availableBalance >= total;

  const handlePayment = async () => {
    if (!user || !hasSufficientBalance) return;

    setLoading(true);
    setError(null);

    try {
      // Create payment for each item (or single payment with metadata)
      const paymentInput: PaymentInput = {
        userId: user.id,
        walletId: wallet.id,
        amount: total,
        currency: wallet.currency,
        paymentType: PaymentType.PRODUCT,
        paymentMethod,
        metadata: {
          items: items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          subtotal,
          tax,
          total
        }
      };

      const result = await financeApi.makePayment(paymentInput);

      if (result.requiresOTP) {
        setPendingTransactionId(result.transactionId || null);
        setShowOTP(true);
      } else if (result.success) {
        setCompletedTransactionId(result.transactionId || null);
        setShowReceipt(true);
        onPaymentComplete?.(result.transactionId || '');
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otpCode: string) => {
    setShowOTP(false);
    setCompletedTransactionId(pendingTransactionId);
    setShowReceipt(true);
    onPaymentComplete?.(pendingTransactionId || '');
  };

  // Payment Receipt View
  if (showReceipt) {
    return (
      <div className="wallet-checkout bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your order has been confirmed
          </p>
        </div>

        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {completedTransactionId?.slice(0, 12)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {total.toFixed(2)} {wallet.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Wallet Balance
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Order Items</h3>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {item.product.name} x{item.quantity}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(item.product.price * item.quantity).toFixed(2)} {wallet.currency}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.location.href = '/marketplace'}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // Checkout View
  return (
    <div className="wallet-checkout bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Complete Your Purchase
      </h2>

      {/* Order Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Order Summary
        </h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {item.product.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.product.category}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.product.price} {item.product.currency}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Qty: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} {wallet.currency}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Tax (10%)</span>
            <span>{tax.toFixed(2)} {wallet.currency}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>{total.toFixed(2)} {wallet.currency}</span>
          </div>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Wallet Balance
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {wallet.availableBalance.toFixed(2)} {wallet.currency}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full ${
            hasSufficientBalance
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {hasSufficientBalance ? 'Sufficient' : 'Insufficient'}
          </div>
        </div>

        {!hasSufficientBalance && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              You need {(total - wallet.availableBalance).toFixed(2)} {wallet.currency} more to complete this purchase.
            </p>
            <button
              onClick={() => window.location.href = '/wallet?action=deposit'}
              className="mt-2 text-sm text-red-700 font-semibold underline"
            >
              Add funds to wallet
            </button>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Method
        </h3>
        <div className="space-y-3">
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            paymentMethod === PaymentMethod.WALLET_BALANCE
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value={PaymentMethod.WALLET_BALANCE}
              checked={paymentMethod === PaymentMethod.WALLET_BALANCE}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mr-3"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                Pay with Wallet Balance
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant payment using your available balance
              </p>
            </div>
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </label>

          <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
            <input
              type="radio"
              name="paymentMethod"
              disabled
              className="mr-3"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                Credit/Debit Card
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Coming soon
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </label>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Secure Payment</p>
            <p className="text-xs text-yellow-700 mt-1">
              You will receive an OTP to your email to verify this transaction.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={loading || !hasSufficientBalance}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <LoadingSpinner size="sm" /> : `Pay ${total.toFixed(2)} ${wallet.currency}`}
        </button>
      </div>

      {/* OTP Modal */}
      {showOTP && (
        <OTPVerificationModal
          isOpen={true}
          onClose={() => setShowOTP(false)}
          onVerify={handleOTPVerify}
          operation="Product Purchase"
          transactionId={pendingTransactionId || undefined}
          email={user?.email}
        />
      )}
    </div>
  );
};

// Marketplace Cart Integration Component
interface MarketplaceCartProps {
  cartItems: CheckoutItem[];
  onCheckout: () => void;
}

export const MarketplaceCart: React.FC<MarketplaceCartProps> = ({ cartItems, onCheckout }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWalletCheckout, setShowWalletCheckout] = useState(false);

  useEffect(() => {
    loadWallet();
  }, [user?.id]);

  const loadWallet = async () => {
    if (!user) return;
    
    try {
      const userWallet = await financeApi.getWallet(user.id);
      setWallet(userWallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (showWalletCheckout && wallet) {
    return (
      <WalletCheckout
        items={cartItems}
        wallet={wallet}
        onPaymentComplete={(transactionId) => {
          console.log('Payment complete:', transactionId);
          onCheckout();
        }}
        onCancel={() => setShowWalletCheckout(false)}
      />
    );
  }

  return (
    <div className="marketplace-cart">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
      
      {/* Cart items list */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.name}</h3>
              <p className="text-sm text-gray-600">{item.product.price} x {item.quantity}</p>
            </div>
            <p className="font-bold">{(item.product.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>{total.toFixed(2)} {wallet?.currency || 'JY'}</span>
        </div>
      </div>

      <button
        onClick={() => setShowWalletCheckout(true)}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default WalletCheckout;

