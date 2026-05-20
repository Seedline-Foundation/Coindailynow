'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing and using CoinDaily ("the Platform"), operated by CoinDaily Media Ltd, you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you must not use the Platform. These Terms apply to all visitors, users, subscribers, API consumers, and press release submitters.',
  },
  {
    title: '2. Description of Service',
    content:
      'CoinDaily provides cryptocurrency and finance news, real-time market data, analysis tools, AI-generated content, regulatory tracking, tax calculators, exchange-rate tools, remittance calculators, on-ramp aggregation, and community features focused on the African crypto and fintech ecosystem. The Platform also offers a press release distribution service, a Knowledge API for programmatic data access, and premium subscription tiers with enhanced features.',
  },
  {
    title: '3. Not Financial Advice',
    content:
      'IMPORTANT: All content on CoinDaily, including AI-generated articles, market analysis, price data, tax calculations, and editorial commentary, is for informational purposes only and does not constitute financial, investment, tax, or legal advice. Cryptocurrency and digital-asset markets are highly volatile and speculative. Always conduct your own research and consult a licensed financial advisor in your jurisdiction before making investment decisions. CoinDaily is not a broker, exchange, or licensed financial institution.',
  },
  {
    title: '4. User Accounts',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate registration information and update it promptly. You may not share, transfer, or sell your account. We reserve the right to suspend or terminate accounts that violate these Terms, exhibit fraudulent behaviour, or remain inactive for more than 12 consecutive months.',
  },
  {
    title: '5. Subscription Plans & Payments',
    content:
      'CoinDaily offers Free, Pro ($29/month or $276/year), and Enterprise (custom pricing) tiers. Pro subscriptions include a 14-day free trial. You may cancel at any time from your account settings; cancellation takes effect at the end of the current billing period. Refunds are not provided for partial billing periods. Payments are processed via YellowCard (NGN, KES, ZAR, GHS), ChangeNOW (crypto), or standard card payment. Prices are in USD; local-currency equivalents are calculated at the prevailing exchange rate at the time of payment.',
  },
  {
    title: '6. API Usage',
    content:
      'Access to the CoinDaily Knowledge API is governed by your subscription tier: Free (100 requests/day), Pro (10,000 requests/day), Enterprise (unlimited). API keys are personal and non-transferable. You must not share API keys, attempt to circumvent rate limits, or use the API to build a competing product. We reserve the right to revoke API access for misuse. API data is provided "as-is" and must not be redistributed without written permission.',
  },
  {
    title: '7. AI-Generated Content',
    content:
      'CoinDaily uses artificial intelligence to generate, translate, summarise, and augment editorial content. All AI-generated articles pass through an editorial review pipeline before publication. While we strive for accuracy, AI-generated content may contain errors. AI-generated articles are labelled as such. We do not guarantee the accuracy, completeness, or timeliness of any AI-generated content, and you should independently verify critical information.',
  },
  {
    title: '8. Press Release Distribution',
    content:
      'The press release service ("CoinDaily Press") allows organisations to submit press releases for editorial review and distribution. Submission does not guarantee publication. CoinDaily reserves the right to reject, edit, or remove any press release that is inaccurate, misleading, promotes scams, or violates applicable law. Published press releases are labelled as sponsored/press content and are distinct from editorial articles. Fees for press release distribution are non-refundable once the release has been published.',
  },
  {
    title: '9. Content & Intellectual Property',
    content:
      'All content on the Platform, including articles, analyses, tools, data, and AI-generated content, is owned by CoinDaily Media Ltd or its licensors unless otherwise stated. You may not reproduce, distribute, or create derivative works without express written permission. User-submitted content (comments, community posts) grants CoinDaily a non-exclusive, worldwide, royalty-free licence to publish, distribute, and display such content on the Platform.',
  },
  {
    title: '10. Prohibited Conduct',
    content:
      'Users must not: (a) promote scams, pump-and-dump schemes, or fraudulent investment schemes; (b) submit false or misleading information; (c) scrape, crawl, or harvest data without authorisation (authorised AI crawlers are specified in robots.txt); (d) impersonate any person or entity; (e) use the Platform for money laundering, terrorist financing, or any activity illegal under Nigerian, Kenyan, South African, Ghanaian, or applicable international law; (f) attempt to compromise Platform security, including injection attacks, credential stuffing, or denial-of-service; (g) manipulate market data or content rankings.',
  },
  {
    title: '11. Data Protection & Privacy',
    content:
      'We process personal data in accordance with our Privacy Policy (coindaily.online/privacy), the Nigeria Data Protection Act (NDPA), the EU General Data Protection Regulation (GDPR), the South Africa Protection of Personal Information Act (POPIA), and the Kenya Data Protection Act (DPA). You have the right to access, rectify, port, and delete your personal data. Account deletion requests can be submitted from your account settings; personal data will be anonymised within 30 days of the request.',
  },
  {
    title: '12. Cookies',
    content:
      'CoinDaily uses cookies and similar technologies as described in our Privacy Policy. By using the Platform, you consent to our use of essential cookies. Non-essential cookies (analytics, marketing) require your explicit consent via our cookie banner. You may withdraw consent at any time.',
  },
  {
    title: '13. Third-Party Services',
    content:
      'The Platform integrates with third-party services including payment processors (YellowCard, ChangeNOW), market data providers, and translation services. Your use of these services is subject to their respective terms. CoinDaily is not responsible for the availability, accuracy, or security of third-party services.',
  },
  {
    title: '14. Limitation of Liability',
    content:
      'To the maximum extent permitted by law, CoinDaily Media Ltd, its directors, employees, and agents are not liable for any direct, indirect, incidental, special, or consequential damages arising from: (a) your use of, or inability to use, the Platform; (b) reliance on any content, data, or tools; (c) cryptocurrency or financial investment decisions; (d) unauthorised access to your account; (e) interruption or cessation of services. Our total aggregate liability shall not exceed the total fees you paid for subscription services in the 12 months preceding the claim.',
  },
  {
    title: '15. Indemnification',
    content:
      'You agree to indemnify and hold harmless CoinDaily Media Ltd from any claims, damages, losses, or expenses (including legal fees) arising from: (a) your violation of these Terms; (b) your use of the Platform; (c) content you submit; (d) your violation of any law or third-party rights.',
  },
  {
    title: '16. Modifications',
    content:
      'We may modify these Terms at any time. Material changes will be notified via email or a prominent notice on the Platform at least 14 days before taking effect. Your continued use after changes take effect constitutes acceptance. If you disagree with updated Terms, you must stop using the Platform and may request account deletion.',
  },
  {
    title: '17. Governing Law & Dispute Resolution',
    content:
      'These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in Lagos, Nigeria, under the rules of the Lagos Court of Arbitration. For users in the EU/EEA, this clause does not limit mandatory consumer-protection rights under your local law.',
  },
  {
    title: '18. Contact',
    content:
      'For questions about these Terms, contact us at legal@coindaily.online. For data protection inquiries, contact privacy@coindaily.online.',
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: May 13, 2026 | Effective: June 1, 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/disclaimer" className="text-blue-600 hover:underline">
              Disclaimer
            </Link>
            <Link href="/editorial-standards" className="text-blue-600 hover:underline">
              Editorial Standards
            </Link>
            <Link href="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
