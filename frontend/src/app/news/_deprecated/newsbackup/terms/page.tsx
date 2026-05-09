'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">By accessing and using CoinDaily Africa ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Platform. These terms apply to all visitors, users, and contributors.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
              <p className="text-gray-600 leading-relaxed">CoinDaily Africa provides cryptocurrency news, market data, analysis tools, educational content, and community features focused on the African crypto ecosystem. Our services include AI-generated content summaries, market analysis tools, tax calculators, and community features.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Not Financial Advice</h2>
              <p className="text-gray-600 leading-relaxed"><strong>IMPORTANT:</strong> Content on CoinDaily Africa is for informational purposes only and does not constitute financial, investment, tax, or legal advice. Cryptocurrency markets are highly volatile and speculative. Always conduct your own research and consult licensed financial advisors before making investment decisions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information and promptly update any changes. We reserve the right to suspend accounts that violate these terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Content & Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">All content on the Platform, including articles, analyses, tools, and AI-generated content, is owned by CoinDaily Africa or its licensors. You may not reproduce, distribute, or create derivative works without express written permission. User-submitted content grants us a non-exclusive license to publish and distribute.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Prohibited Conduct</h2>
              <p className="text-gray-600 leading-relaxed">Users must not: promote scams or fraudulent schemes, manipulate markets, submit false information, scrape or harvest data without authorization, impersonate others, or use the platform for money laundering or illegal activities.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">CoinDaily Africa is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the Platform, reliance on any content, or cryptocurrency investment decisions. Our total liability shall not exceed the amount you paid for premium services in the preceding 12 months.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through arbitration in Lagos, Nigeria, under the rules of the Lagos Court of Arbitration.</p>
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
