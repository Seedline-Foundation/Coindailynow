'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  ExclamationCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/affiliate/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a verification error
        if (data.requiresVerification) {
          setErrors({ 
            general: (
              <span>
                {data.error}{' '}
                <button
                  onClick={handleResendVerification}
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  Resend verification email
                </button>
              </span>
            ) as any
          });
        } else {
          setErrors({ general: data.error || 'Login failed' });
        }
        return;
      }

      // Store token in localStorage
      localStorage.setItem('affiliateToken', data.token);
      localStorage.setItem('affiliateData', JSON.stringify(data.affiliate));

      // Redirect to dashboard
      router.push('/dashboard?tab=affiliate');
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Affiliate Login</span>
          </h1>
          <p className="text-xl text-gray-300">
            Access your affiliate dashboard
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <ArrowRightOnRectangleIcon className="w-8 h-8 text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Login to Your Account</h2>
          </div>

          {resendSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✓ Verification email sent! Check your inbox.
              </p>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
              <ExclamationCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg px-12 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg px-12 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link href="/affiliate/register" className="text-primary-400 hover:text-primary-300 font-bold">
                Register here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
