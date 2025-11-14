'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface EmailCaptureProps {
  variant?: 'default' | 'presale';
}

export default function EmailCapture({ variant = 'default' }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Replace with your Brevo API endpoint
      const response = await axios.post('/api/subscribe', {
        email,
        listId: process.env.NEXT_PUBLIC_BREVO_LIST_ID,
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail('');
        
        // Reset after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500 rounded-2xl p-8 text-center max-w-2xl mx-auto"
      >
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
        <p className="text-gray-300">
          Check your email for whitelist confirmation and next steps.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`${
        variant === 'presale'
          ? 'bg-gray-900 border border-gray-800'
          : 'bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50'
      } rounded-2xl p-8 max-w-2xl mx-auto`}
    >
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold text-white mb-3">
          {variant === 'presale' ? 'Join the Whitelist' : 'Get Early Access'}
        </h3>
        <p className="text-gray-300">
          {variant === 'presale'
            ? 'Be first to know when presale goes live. Exclusive bonuses for early supporters.'
            : 'Subscribe for presale alerts, exclusive updates, and bonus allocation.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-full focus:outline-none focus:border-primary-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Subscribing...' : 'Get Whitelisted →'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </form>

      <div className="mt-6 flex items-center justify-center gap-6 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>No spam, ever</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Unsubscribe anytime</span>
        </div>
      </div>
    </motion.div>
  );
}
