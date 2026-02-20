'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About CoinDaily Africa</h1>

          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-lg text-gray-600 leading-relaxed">CoinDaily Africa is the continent&apos;s premier cryptocurrency news and intelligence platform, uniquely built for the African market. We combine AI-driven journalism with deep regional expertise to deliver accurate, timely coverage of crypto markets, regulations, and innovations across the continent.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">15+</div>
                <div className="text-sm text-gray-600 mt-1">African Languages</div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600">12</div>
                <div className="text-sm text-gray-600 mt-1">Countries Covered</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600 mt-1">Market Monitoring</div>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">To empower Africans with trusted, accessible crypto knowledge — bridging the information gap between global markets and local communities, from Lagos to Nairobi to Johannesburg.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What We Offer</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Real-time news and analysis from African crypto markets</li>
                <li>AI-powered content generation with human editorial oversight</li>
                <li>Regulation tracker covering 12+ African countries</li>
                <li>P2P premium index and exchange rate tools</li>
                <li>Scam watch and consumer protection alerts</li>
                <li>Multi-language support for African languages</li>
                <li>Expert community and educational resources</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Email: <a href="mailto:contact@coindaily.africa" className="text-blue-600 hover:underline">contact@coindaily.africa</a><br />
                Lagos, Nigeria | Cape Town, South Africa
              </p>
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
