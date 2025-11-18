'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('No verification token provided.');
      return;
    }

    // Call the verification API
    fetch(`/api/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        console.error('Verification error:', err);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Verifying Your Email...
            </h1>
            <p className="text-gray-400 text-lg">
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-green-500/30 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              ✅ Email Verified Successfully!
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              {message}
            </p>

            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">
                📬 Check Your Email
              </h2>
              <p className="text-gray-300 leading-relaxed">
                We've sent you a welcome email with your whitelist application link. 
                You'll also receive a 9-day educational series about Joy Token and the CoinDaily ecosystem.
              </p>
            </div>

            <div className="space-y-4">
              <Link 
                href="/"
                className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                🏠 Return to Homepage
              </Link>
              
              <Link 
                href="/whitelist"
                className="inline-block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                📝 Complete Whitelist Application
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Questions? Email us at{' '}
                <a href="mailto:support@coindaily.online" className="text-indigo-400 hover:text-indigo-300">
                  support@coindaily.online
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-red-500/30 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              ❌ Verification Failed
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              {message}
            </p>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-yellow-400 mb-3">
                🔄 What to do next:
              </h2>
              <ul className="text-gray-300 text-left space-y-2">
                <li>• Check if the link has expired (valid for 24 hours)</li>
                <li>• Request a new verification email</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link 
                href="/"
                className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                🏠 Return to Homepage
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        )}

        {/* Invalid Token State */}
        {status === 'invalid' && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              Invalid Verification Link
            </h1>
            
            <p className="text-gray-300 text-lg mb-8">
              {message}
            </p>

            <Link 
              href="/"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
              🏠 Return to Homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
