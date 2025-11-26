'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  UserPlusIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  ExclamationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface FormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function AffiliateRegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || undefined,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Registration failed' });
        return;
      }

      setSuccess(true);
      setAffiliateCode(data.affiliate.affiliateCode);
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
    // Clear error for this field
    if (errors[e.target.name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined,
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/50 rounded-2xl p-8 text-center"
          >
            <CheckCircleIcon className="w-20 h-20 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Registration Successful!</h1>
            <p className="text-gray-300 mb-6">
              Your affiliate account has been created. Please check your email to verify your account.
            </p>
            
            <div className="bg-black/50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-400 mb-2">Your Affiliate Code</p>
              <p className="text-2xl font-bold gradient-text">{affiliateCode}</p>
            </div>

            <div className="space-y-3">
              <Link
                href="/affiliate/login"
                className="block w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-full font-bold hover:shadow-2xl hover:shadow-primary-500/50 transition-all"
              >
                Go to Login
              </Link>
              <Link
                href="/"
                className="block w-full border border-gray-700 text-white px-6 py-3 rounded-full font-bold hover:bg-gray-900 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Become an Affiliate</span>
          </h1>
          <p className="text-xl text-gray-300">
            Earn rewards by promoting JY Token presale
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <UserPlusIcon className="w-8 h-8 text-primary-400" />
            <h2 className="text-2xl font-bold text-white">Create Affiliate Account</h2>
          </div>

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
                Email Address *
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

            {/* Name Field (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name (Optional)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-black border border-gray-700 rounded-lg px-12 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
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
                  placeholder="Minimum 8 characters"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-black border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg px-12 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors`}
                  placeholder="Re-enter your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-4 rounded-full font-bold hover:shadow-2xl hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Affiliate Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/affiliate/login" className="text-primary-400 hover:text-primary-300 font-bold">
                Login here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
