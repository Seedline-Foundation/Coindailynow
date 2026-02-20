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
          <p className="text-sm text-gray-500 mb-8">Last updated: February 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed">CoinDaily Africa collects information you provide directly, such as your name, email address, and preferences when you create an account, subscribe to our newsletter, or interact with our platform. We also automatically collect technical data including IP address, browser type, device information, and usage analytics to improve our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed">We use collected information to provide and personalize our cryptocurrency news content, send relevant market updates and newsletters, improve platform performance, and ensure security. We also use aggregated, anonymized data for analytics and to understand African crypto market trends.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Data Sharing & Third Parties</h2>
              <p className="text-gray-600 leading-relaxed">We do not sell your personal data. We may share anonymized analytics with partners and use third-party services (hosting, analytics, payment processing) that process data on our behalf under strict confidentiality agreements. We comply with applicable data protection laws in Nigeria (NDPR), Kenya (DPA 2019), South Africa (POPIA), and the EU (GDPR).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Cookies & Tracking</h2>
              <p className="text-gray-600 leading-relaxed">We use essential cookies for site functionality, analytics cookies to understand usage patterns, and preference cookies to remember your language and display settings. You can manage cookie preferences through your browser settings or our cookie consent banner.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed">You have the right to access, correct, delete, or export your personal data. You may also opt out of marketing communications at any time. To exercise these rights, contact us at privacy@coindaily.africa.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">We implement industry-standard security measures including encryption (TLS/SSL), access controls, and regular security audits. While no system is completely secure, we are committed to protecting your data with the best available technologies.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@coindaily.africa" className="text-blue-600 hover:underline">privacy@coindaily.africa</a> or write to: CoinDaily Africa, Lagos, Nigeria.</p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
