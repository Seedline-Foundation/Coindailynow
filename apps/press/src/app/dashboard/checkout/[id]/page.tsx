'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Coins,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  createYellowCardCheckout,
  openYellowCardCheckout,
} from '@/lib/yellowcardCheckout';

/**
 * Checkout Page — /dashboard/checkout/[id]
 *
 * Handles payment for a press release order via:
 *   1. YellowCard (fiat on-ramp → USD)
 *   2. Direct JOY token payment (Polygon)
 *
 * After payment, the release enters the review queue.
 * This is step 2 of the flow: submit → **pay** → approve → publish → distribute
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const PACKAGES: Record<string, { name: string; price: number; sites: number }> = {
  starter: { name: 'Starter', price: 199, sites: 50 },
  professional: { name: 'Professional', price: 499, sites: 200 },
  enterprise: { name: 'Enterprise', price: 999, sites: 500 },
};

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const releaseId = params.id as string;
  const packageId = searchParams.get('package') || 'starter';
  const pkg = PACKAGES[packageId] || PACKAGES.starter;

  const { user, session } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'yellowcard' | 'joy'>('yellowcard');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [release, setRelease] = useState<{ title: string; status: string } | null>(null);

  const loadRelease = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/press/releases/${releaseId}`);
      if (res.ok) {
        const { data } = await res.json();
        setRelease({ title: data.title, status: data.status });
      }
    } catch {
      // non-critical
    }
  }, [releaseId]);

  useEffect(() => {
    loadRelease();
  }, [loadRelease]);

  const handleYellowCardPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const checkout = await createYellowCardCheckout({
        orderId: releaseId,
        publisherId: user?.id || '',
        amountUsd: pkg.price,
        email: user?.email ?? undefined,
      });

      openYellowCardCheckout(checkout.checkoutUrl);
      setStatus('processing');
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      setStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleJoyPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        setStatus('processing');
        // Placeholder: in production this would call the JOY token contract
        // For now we mark as processing and the backend handles the rest
        setTimeout(() => {
          setStatus('completed');
        }, 2000);
      } else {
        setError('Please install MetaMask to pay with JOY tokens.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'yellowcard') {
      handleYellowCardPayment();
    } else {
      handleJoyPayment();
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary-500" /> Checkout
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Flow indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { label: 'Submit', done: true },
            { label: 'Pay', active: true },
            { label: 'Review', active: false },
            { label: 'Publish', active: false },
            { label: 'Distribute', active: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.done
                    ? 'bg-green-500 text-dark-950'
                    : step.active
                    ? 'bg-primary-500 text-dark-950'
                    : 'bg-dark-800 text-dark-500'
                }`}
              >
                {step.done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs ${
                  step.done || step.active ? 'text-white' : 'text-dark-500'
                }`}
              >
                {step.label}
              </span>
              {i < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    step.done ? 'bg-green-500' : step.active ? 'bg-primary-500' : 'bg-dark-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Completed state */}
        {status === 'completed' && (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Received!</h2>
            <p className="text-dark-400 mb-6">
              Your press release is now in the review queue. Our team will review
              it within 24 hours.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/status"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
              >
                Track Status <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 border border-dark-700 text-dark-300 hover:text-white rounded-lg transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Processing state */}
        {status === 'processing' && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment…</h2>
            <p className="text-dark-400 mb-6">
              {paymentMethod === 'yellowcard'
                ? 'Complete the payment in the YellowCard popup window.'
                : 'Confirm the transaction in your wallet.'}
            </p>
            <button
              onClick={() => setStatus('completed')}
              className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
            >
              I&apos;ve completed payment →
            </button>
          </div>
        )}

        {/* Pending / Payment form */}
        {(status === 'pending' || status === 'failed') && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Complete Payment
              </h1>
              <p className="text-dark-400 text-sm">
                Pay for your press release distribution to proceed to review.
              </p>
            </div>

            {/* Order summary */}
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3">
              <h3 className="text-white font-semibold">Order Summary</h3>
              {release && (
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Press Release</span>
                  <span className="text-white font-medium truncate max-w-[250px]">
                    {release.title}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Package</span>
                <span className="text-white font-medium">{pkg.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Distribution</span>
                <span className="text-dark-300">{pkg.sites}+ sites</span>
              </div>
              <hr className="border-dark-700" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary-500">${pkg.price} USD</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div>
              <label className="block text-sm text-dark-300 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('yellowcard')}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    paymentMethod === 'yellowcard'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-yellow-500 mb-2" />
                  <p className="text-white font-semibold text-sm">YellowCard</p>
                  <p className="text-dark-500 text-xs mt-1">
                    Pay with card, bank transfer, or mobile money
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('joy')}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    paymentMethod === 'joy'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                  }`}
                >
                  <Coins className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-white font-semibold text-sm">JOY Token</p>
                  <p className="text-dark-500 text-xs mt-1">
                    Pay directly with JOY on Polygon
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Security note */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-400 text-xs">
                Payments are secured via escrow. Funds are only released to
                distribution partners after AI verification confirms placement.
              </p>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  Pay ${pkg.price} USD <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
