'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch(`/api/affiliate/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/affiliate/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
              <p className="text-purple-200">Please wait while we verify your email address</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-purple-200 mb-6">{message}</p>
              <p className="text-sm text-purple-300">Redirecting to login page...</p>
              <Link 
                href="/affiliate/login"
                className="mt-6 inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-purple-200 mb-6">{message}</p>
              <div className="space-y-3">
                <Link 
                  href="/affiliate/register"
                  className="block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all"
                >
                  Register Again
                </Link>
                <Link 
                  href="/affiliate/login"
                  className="block bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
