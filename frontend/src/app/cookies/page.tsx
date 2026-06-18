import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'CoinDaily Africa Cookie Policy - How we use cookies and similar technologies.',
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookie Policy | CoinDaily Africa',
    description: 'How we use cookies and similar technologies.',
    url: '/cookies',
    siteName: 'CoinDaily Africa',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Cookie Policy | CoinDaily Africa',
    description: 'How we use cookies and similar technologies.',
    site: '@coindailyafrica',
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-lg max-w-none bg-white rounded-xl p-8 shadow-sm">
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website.
            They help us provide a better experience by remembering your preferences and
            understanding how you use our platform.
          </p>

          <h2>2. Types of Cookies We Use</h2>

          <h3>Essential Cookies</h3>
          <p>
            Required for the website to function. These include session management,
            security tokens, and load balancing. Cannot be disabled.
          </p>

          <h3>Functional Cookies</h3>
          <p>
            Enable personalized features like language preferences, display settings,
            and saved reading lists.
          </p>

          <h3>Analytics Cookies</h3>
          <p>
            Help us understand how visitors interact with our website using services
            like PostHog. Data is anonymized and used to improve our platform.
          </p>

          <h3>Marketing Cookies</h3>
          <p>
            Used for email marketing campaigns and newsletter subscription tracking.
          </p>

          <h2>3. Managing Cookies</h2>
          <p>
            You can manage your cookie preferences using the cookie consent banner
            that appears when you first visit our site, or through your browser settings.
          </p>

          <h2>4. Contact</h2>
          <p>
            For questions about our cookie practices, contact us at{' '}
            <a href="mailto:support@sygn.live">support@sygn.live</a>.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary-500 hover:text-primary-600 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
