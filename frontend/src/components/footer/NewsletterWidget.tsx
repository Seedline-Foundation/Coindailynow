/**
 * CoinDaily Platform - Newsletter Subscription Component
 * Task 55: FR-105 Newsletter subscription widget
 * 
 * Features:
 * - Email validation
 * - Language preference selection
 * - Subscription status feedback
 * - Analytics tracking
 * - GDPR compliance
 */

'use client';

import React, { useState } from 'react';
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { NewsletterStatus, LanguageOption } from './types';

interface NewsletterWidgetProps {
  languages: LanguageOption[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onAnalytics: (event: string, properties?: Record<string, any>) => void;
  className?: string;
  compact?: boolean;
}

const NewsletterWidget: React.FC<NewsletterWidgetProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
  onAnalytics,
  className = '',
  compact = false
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [preferences, setPreferences] = useState<string[]>(['daily_digest']);

  const subscriptionTypes = [
    { 
      id: 'daily_digest', 
      label: 'Daily Digest', 
      description: 'Get the day\'s top crypto news at 8 AM UTC',
      frequency: 'Daily'
    },
    { 
      id: 'breaking_news', 
      label: 'Breaking News', 
      description: 'Instant alerts for major market events',
      frequency: 'As needed'
    },
    { 
      id: 'weekly_summary', 
      label: 'Weekly Summary', 
      description: 'Comprehensive weekly market analysis',
      frequency: 'Weekly'
    },
    { 
      id: 'african_focus', 
      label: 'African Crypto Focus', 
      description: 'News specifically about African crypto markets',
      frequency: 'Daily'
    }
  ];

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !validateEmail(email)) {
      setStatus('error');
      onAnalytics('newsletter_validation_error', { error: 'invalid_email' });
      return;
    }

    if (preferences.length === 0) {
      setStatus('error');
      onAnalytics('newsletter_validation_error', { error: 'no_preferences' });
      return;
    }

    setStatus('loading');
    onAnalytics('newsletter_signup_attempt', { 
      email_domain: email.split('@')[1],
      language: selectedLanguage,
      preferences: preferences,
      source: 'footer_widget'
    });

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          language: selectedLanguage,
          preferences,
          source: 'footer_widget',
          gdprConsent: true,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail('');
        onAnalytics('newsletter_signup_success', { 
          language: selectedLanguage,
          preferences: preferences,
          subscription_id: result.subscriptionId
        });
      } else {
        setStatus('error');
        onAnalytics('newsletter_signup_error', { 
          error: result.error || 'api_error',
          status_code: response.status
        });
      }
    } catch (error) {
      setStatus('error');
      onAnalytics('newsletter_signup_error', { 
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setTimeout(() => setStatus('idle'), 5000);
  };

  const handlePreferenceChange = (preferenceId: string, checked: boolean) => {
    if (checked) {
      setPreferences(prev => [...prev, preferenceId]);
    } else {
      setPreferences(prev => prev.filter(p => p !== preferenceId));
    }
    
    onAnalytics('newsletter_preference_change', { 
      preference: preferenceId,
      checked,
      total_preferences: checked 
        ? preferences.length + 1 
        : preferences.length - 1
    });
  };

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-lg font-semibold flex items-center">
          <EnvelopeIcon className="h-5 w-5 mr-2" />
          Newsletter
        </h4>
        <form onSubmit={handleSubmission} className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
              disabled={status === 'loading'}
              aria-label="Email address for newsletter subscription"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </div>
          
          {status === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              <span>Successfully subscribed!</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span>Failed to subscribe. Please try again.</span>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="text-lg font-semibold flex items-center">
        <EnvelopeIcon className="h-5 w-5 mr-2" />
        Stay Updated with CoinDaily
      </h4>
      
      <p className="text-gray-300 text-sm">
        Get the latest African crypto news, market insights, and exclusive content delivered to your inbox.
      </p>

      <form onSubmit={handleSubmission} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="newsletter-email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={status === 'loading'}
            aria-describedby="email-help"
          />
          <p id="email-help" className="text-xs text-gray-400 mt-1">
            We'll never share your email with third parties.
          </p>
        </div>

        {/* Language Selection */}
        <div>
          <label htmlFor="newsletter-language" className="block text-sm font-medium text-gray-300 mb-2">
            Preferred Language
          </label>
          <select
            id="newsletter-language"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={status === 'loading'}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subscription Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Subscription Preferences
          </label>
          <div className="space-y-3">
            {subscriptionTypes.map((type) => (
              <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.includes(type.id)}
                  onChange={(e) => handlePreferenceChange(type.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-600 bg-gray-800 rounded focus:ring-blue-500 focus:ring-2"
                  disabled={status === 'loading'}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{type.label}</span>
                    <span className="text-xs text-gray-400">{type.frequency}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* GDPR Notice */}
        <div className="text-xs text-gray-400 bg-gray-800 p-3 rounded-md">
          <p>
            By subscribing, you agree to our{' '}
            <a href="/legal/privacy" className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
            </a>{' '}
            and consent to receive marketing emails. You can unsubscribe at any time.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !email || preferences.length === 0}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {status === 'loading' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Subscribing...
            </div>
          ) : (
            'Subscribe to Newsletter'
          )}
        </button>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-center justify-center p-3 bg-green-900/30 border border-green-600/30 rounded-md">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-300 text-sm font-medium">
              Successfully subscribed! Check your email for confirmation.
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center p-3 bg-red-900/30 border border-red-600/30 rounded-md">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-300 text-sm font-medium">
              Failed to subscribe. Please check your email and try again.
            </span>
          </div>
        )}
      </form>

      {/* Subscriber Count */}
      <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-700">
        <p>Join 45,000+ African crypto enthusiasts already subscribed</p>
      </div>
    </div>
  );
};

export default NewsletterWidget;
