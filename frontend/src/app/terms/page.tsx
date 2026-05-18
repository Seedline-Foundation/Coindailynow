import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'CoinDaily Africa Terms of Service - Rules and guidelines for using our platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-lg max-w-none bg-white rounded-xl p-8 shadow-sm">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using CoinDaily Africa, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use our platform.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            CoinDaily Africa provides cryptocurrency news, market data, educational content,
            and community features focused on African markets.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account credentials.
            You must provide accurate information and keep it up to date.
          </p>

          <h2>4. Content and Intellectual Property</h2>
          <p>
            All content on CoinDaily Africa is protected by copyright. You may not reproduce,
            distribute, or create derivative works without written permission.
          </p>

          <h2>5. Disclaimer</h2>
          <p>
            CoinDaily Africa provides news and market data for informational purposes only.
            Nothing on this platform constitutes financial advice. Cryptocurrency investments
            carry significant risk. Always do your own research.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            CoinDaily Africa is not liable for any losses arising from the use of our platform,
            including but not limited to investment decisions made based on our content.
          </p>

          <h2>7. Modifications</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the
            platform constitutes acceptance of the updated terms.
          </p>

          <h2>8. Contact</h2>
          <p>
            Questions about these terms? Contact us at{' '}
            <a href="mailto:support@coindaily.online">support@coindaily.online</a>.
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
