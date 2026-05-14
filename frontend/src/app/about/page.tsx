'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About CoinDaily Africa</h1>
          <p className="text-lg text-gray-600 mb-8">
            Africa's independent source for cryptocurrency, blockchain, and financial market intelligence.
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa delivers timely, accurate, and actionable financial news and market data to readers across Africa and the global diaspora. We cover cryptocurrency markets, blockchain technology, traditional finance, regulatory developments, and the intersection of fintech and emerging markets.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                Every story is framed through an Africa-first lens. When we cover a Federal Reserve decision or a Bitcoin rally, we explain what it means for Lagos, Nairobi, Johannesburg, and Accra.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">What We Cover</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Cryptocurrency markets</strong> — real-time coverage of Bitcoin, Ethereum, and the digital asset ecosystem with a focus on African exchanges and liquidity.</li>
                <li><strong>Blockchain and Web3</strong> — protocol developments, DeFi, tokenization, and infrastructure projects relevant to emerging markets.</li>
                <li><strong>African financial markets</strong> — equities, FX, commodities, and macroeconomic analysis across Nigeria, Kenya, South Africa, Ghana, and beyond.</li>
                <li><strong>Regulation and policy</strong> — central bank directives, securities commission rulings, and legislative activity affecting digital assets in Africa.</li>
                <li><strong>Fintech and payments</strong> — mobile money, remittances, cross-border payments, and the platforms connecting African consumers to global finance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Our Approach</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa combines human editorial judgment with AI-assisted content production. Our AI systems accelerate research and drafting, but every piece of market-moving content is reviewed by human editors before publication. We maintain a strict editorial firewall between advertising, sponsored content, and editorial.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                We do not use hype language. You will not find words like "moon," "rocket," or "crash" in our coverage. Our tone is confident, neutral, and data-driven, modeled on institutional financial news services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Markets We Serve</h2>
              <p className="text-gray-600 leading-relaxed">
                CoinDaily Africa is built for readers in Nigeria, Kenya, South Africa, Ghana, Tanzania, Ethiopia, and across the African continent. We also serve the African diaspora in Europe, North America, the Caribbean, and Latin America.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For press inquiries, corrections, or partnership opportunities, contact us at{' '}
                <a href="mailto:editorial@coindaily.online" className="text-blue-600 hover:underline">
                  editorial@coindaily.online
                </a>.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4">
            <Link href="/editorial-standards" className="text-blue-600 hover:underline text-sm">
              Editorial Standards &rarr;
            </Link>
            <Link href="/disclaimer" className="text-blue-600 hover:underline text-sm">
              Disclaimer &rarr;
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
