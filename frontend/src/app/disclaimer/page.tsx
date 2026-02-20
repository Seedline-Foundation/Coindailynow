'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclaimer</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 17, 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-8">
              <p className="text-yellow-800 font-medium">⚠️ Important: CoinDaily Africa is a news and information platform. Nothing on this site constitutes financial advice.</p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">General Disclaimer</h2>
              <p className="text-gray-600 leading-relaxed">The information provided on CoinDaily Africa is for general informational and educational purposes only. All information on the site is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Investment Risk Warning</h2>
              <p className="text-gray-600 leading-relaxed">Cryptocurrency investments carry significant risk. The value of digital assets can fluctuate dramatically and you could lose all of your invested capital. Past performance is not indicative of future results. CoinDaily Africa does not recommend buying, selling, or holding any cryptocurrency. Always do your own research (DYOR) and consult a licensed financial advisor.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">AI-Generated Content</h2>
              <p className="text-gray-600 leading-relaxed">Some content on CoinDaily Africa is generated or assisted by artificial intelligence systems. While we strive for accuracy and employ human review processes, AI-generated content may contain errors or inaccuracies. Always verify critical information from official sources.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Third-Party Links</h2>
              <p className="text-gray-600 leading-relaxed">Our platform may contain links to third-party websites, exchanges, or services. We do not endorse or assume responsibility for the content, privacy policies, or practices of any third-party sites or services. Access third-party links at your own risk.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Regulatory Compliance</h2>
              <p className="text-gray-600 leading-relaxed">Cryptocurrency regulations vary by country and are subject to change. The regulatory information provided on our platform is for informational purposes and should not be relied upon as legal advice. Always consult local authorities and legal professionals for regulatory compliance in your jurisdiction.</p>
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
