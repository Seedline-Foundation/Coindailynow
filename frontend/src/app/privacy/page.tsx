import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CoinDaily Africa Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="prose prose-lg max-w-none bg-white rounded-xl p-8 shadow-sm">
          <h2>1. Information We Collect</h2>
          <p>
            CoinDaily Africa collects information you provide directly, such as your name, email address,
            and account preferences when you create an account. We also collect usage data, device information,
            and cookies as described in our Cookie Policy.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and improve our cryptocurrency news and market data services</li>
            <li>Personalize content for your region and language preferences</li>
            <li>Send newsletters and notifications you have opted into</li>
            <li>Analyze usage patterns to improve the platform</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>

          <h2>3. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share data with trusted service providers
            (analytics, hosting, email delivery) who process data on our behalf under strict agreements.
          </p>

          <h2>4. Your Rights (GDPR / POPIA)</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your data only as long as necessary for the purposes described in this policy.
            Account data is retained while your account is active and for a reasonable period thereafter.
          </p>

          <h2>6. Security</h2>
          <p>
            We implement industry-standard security measures including encryption, access controls,
            and regular security audits to protect your data.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
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
