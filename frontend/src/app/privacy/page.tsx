'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: May 12, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-8">
              <p className="text-blue-800 font-medium">
                CoinDaily Africa is committed to protecting your privacy and handling your personal data in compliance with applicable data protection laws, including Nigeria&apos;s NDPA, the EU GDPR, South Africa&apos;s POPIA, and Kenya&apos;s DPA.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Data Controller</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa operates the website coindaily.online and related subdomains. For privacy-related inquiries, contact us at{' '}
                <a href="mailto:privacy@coindaily.online" className="text-blue-600 hover:underline">privacy@coindaily.online</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Data We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We collect the following categories of personal data:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Account data:</strong> email address, username, and password hash when you create an account.</li>
                <li><strong>Profile data:</strong> name, country, language preference, and subscription tier.</li>
                <li><strong>Usage data:</strong> pages viewed, articles read, search queries, and interaction patterns (collected via PostHog analytics).</li>
                <li><strong>Device data:</strong> browser type, operating system, IP address, and device identifiers for security purposes.</li>
                <li><strong>Payment data:</strong> transaction references processed through our payment providers (YellowCard, ChangeNOW). We do not store full payment card numbers.</li>
                <li><strong>Communication data:</strong> newsletter subscription preferences and support correspondence.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Data</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide and maintain our news platform and services.</li>
                <li>To personalize your content experience and language preferences.</li>
                <li>To process subscriptions and payments.</li>
                <li>To send newsletters and service communications you have opted into.</li>
                <li>To detect and prevent fraud, abuse, and security threats.</li>
                <li>To improve our platform through aggregated, anonymized analytics.</li>
                <li>To comply with legal obligations in the jurisdictions where we operate.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Legal Basis for Processing</h2>
              <p className="text-gray-600 leading-relaxed">We process personal data on the following legal bases:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li><strong>Contract:</strong> to provide services you have signed up for (account, subscriptions).</li>
                <li><strong>Consent:</strong> for marketing communications and non-essential cookies.</li>
                <li><strong>Legitimate interest:</strong> for platform security, fraud prevention, and service improvement.</li>
                <li><strong>Legal obligation:</strong> to comply with applicable laws and regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar technologies. You can manage your cookie preferences through the cookie consent banner displayed on your first visit. Categories include:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li><strong>Essential:</strong> required for the platform to function (authentication, security). Cannot be disabled.</li>
                <li><strong>Functional:</strong> remember your preferences (language, theme, layout density).</li>
                <li><strong>Analytics:</strong> help us understand how visitors use our platform (PostHog).</li>
                <li><strong>Marketing:</strong> used to deliver relevant content and measure campaign effectiveness.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Sharing</h2>
              <p className="text-gray-600 leading-relaxed">
                We do not sell your personal data. We share data only with:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
                <li><strong>Payment processors:</strong> YellowCard and ChangeNOW for transaction processing.</li>
                <li><strong>Infrastructure providers:</strong> Contabo (hosting), Cloudflare (CDN/security), Neon (database).</li>
                <li><strong>Analytics:</strong> PostHog (self-hostable, privacy-first analytics).</li>
                <li><strong>Law enforcement:</strong> when required by valid legal process.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. International Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Our servers are located in Europe (Contabo, Germany). If you access our platform from outside the EU, your data may be transferred to and processed in the EU. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal data for as long as your account is active or as needed to provide services. Account data is deleted within 30 days of account deletion request. Analytics data is anonymized after 12 months. Payment records are retained for 7 years as required by financial regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Depending on your jurisdiction, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> request a copy of your personal data.</li>
                <li><strong>Rectification:</strong> correct inaccurate personal data.</li>
                <li><strong>Erasure:</strong> request deletion of your personal data (GDPR Art. 17 / NDPA equivalent).</li>
                <li><strong>Portability:</strong> receive your data in a machine-readable format.</li>
                <li><strong>Objection:</strong> object to processing based on legitimate interest.</li>
                <li><strong>Withdraw consent:</strong> withdraw consent for marketing at any time.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                To exercise any of these rights, email{' '}
                <a href="mailto:privacy@coindaily.online" className="text-blue-600 hover:underline">privacy@coindaily.online</a>.
                We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Children&apos;s Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa is not intended for users under the age of 18. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. AI-Generated Content</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa uses AI systems to generate and translate content. These systems process publicly available information and do not use your personal data for training. AI-generated content is reviewed by human editors before publication.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this privacy policy from time to time. Material changes will be communicated via email to registered users and through a notice on our platform. Continued use of the platform after changes constitutes acceptance.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/disclaimer" className="text-blue-600 hover:underline text-sm">
              Disclaimer &rarr;
            </Link>
            <Link href="/terms" className="text-blue-600 hover:underline text-sm">
              Terms of Service &rarr;
            </Link>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
