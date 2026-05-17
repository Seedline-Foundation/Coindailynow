'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const experts = [
  { id: 1, name: 'Dr. Amina Ibrahim', role: 'Blockchain Researcher', country: 'Nigeria', flag: '🇳🇬', bio: 'PhD in Computer Science from University of Lagos. 8+ years in blockchain research. Published 20+ papers on DeFi and tokenomics.', topics: ['DeFi', 'Tokenomics', 'Research'], verified: true, articles: 24, rating: 4.9, image: '/images/experts/amina.jpg', sameAs: ['https://twitter.com/aminaibrahim', 'https://linkedin.com/in/aminaibrahim'] },
  { id: 2, name: 'Kwame Asante', role: 'Crypto Lawyer & Compliance', country: 'Ghana', flag: '🇬🇭', bio: 'Partner at Asante & Co Legal. Specializes in cryptocurrency regulation, AML compliance, and fintech law across West Africa.', topics: ['Regulation', 'Compliance', 'Legal'], verified: true, articles: 18, rating: 4.8, image: '/images/experts/kwame.jpg', sameAs: [] },
  { id: 3, name: 'Naledi Mokoena', role: 'DeFi Analyst', country: 'South Africa', flag: '🇿🇦', bio: 'Former Goldman Sachs analyst. Now runs DegenAfrica, a DeFi analytics platform serving 15,000+ African crypto users.', topics: ['DeFi', 'Trading', 'Analytics'], verified: true, articles: 31, rating: 4.7, image: '/images/experts/naledi.jpg', sameAs: [] },
  { id: 4, name: 'Hassan Mwangi', role: 'Exchange CEO', country: 'Kenya', flag: '🇰🇪', bio: 'CEO of KryptoKenya exchange. 12 years in fintech. Pioneered M-Pesa crypto integration.', topics: ['Exchanges', 'Mobile Money', 'Payments'], verified: true, articles: 15, rating: 4.6, image: '/images/experts/hassan.jpg', sameAs: [] },
  { id: 5, name: 'Fatima El-Sayed', role: 'Blockchain Developer', country: 'Egypt', flag: '🇪🇬', bio: 'Senior Solidity developer. Built 15+ smart contracts for African DeFi protocols. Contributor to OpenZeppelin.', topics: ['Development', 'Smart Contracts', 'Security'], verified: true, articles: 12, rating: 4.9, image: '/images/experts/fatima.jpg', sameAs: [] },
];

const editorialWorkflow = [
  { step: 1, name: 'Draft', description: 'Author submits initial article draft', icon: '✍️' },
  { step: 2, name: 'Fact-Check', description: 'Claims, data, and sources verified by editor', icon: '🔍' },
  { step: 3, name: 'Legal Review', description: 'Checked for regulatory/legal compliance (optional)', icon: '⚖️' },
  { step: 4, name: 'SEO Check', description: 'Keywords, schema, meta tags, and internal links optimized', icon: '🔎' },
  { step: 5, name: 'Publish', description: 'Article goes live with full schema markup', icon: '🚀' },
];

export default function AuthorGraphPage() {
  const [selectedExpert, setSelectedExpert] = useState<number | null>(null);
  const selected = experts.find(e => e.id === selectedExpert);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            👥 Author Profiles & Editorial Standards
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Meet our verified expert authors. Every article on CoinDaily goes through a rigorous editorial workflow to ensure accuracy, trustworthiness, and expertise — aligned with E-E-A-T standards.
          </p>
        </div>

        {/* Editorial Workflow */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">📋 Our Editorial Workflow</h2>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {editorialWorkflow.map((step, i) => (
              <React.Fragment key={step.step}>
                <div className="text-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-2xl mx-auto mb-2">
                    {step.icon}
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{step.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[150px] mx-auto">{step.description}</p>
                </div>
                {i < editorialWorkflow.length - 1 && (
                  <div className="hidden md:block text-gray-400 text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Expert Profiles Grid */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🏆 Verified Expert Authors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {experts.map(expert => (
            <div
              key={expert.id}
              onClick={() => setSelectedExpert(expert.id === selectedExpert ? null : expert.id)}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${selectedExpert === expert.id ? 'border-orange-500' : 'border-transparent'}`}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                  {expert.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    {expert.name}
                    {expert.verified && <span className="ml-2 text-blue-500" title="Verified Expert">✓</span>}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{expert.role}</p>
                  <p className="text-xs text-gray-400">{expert.flag} {expert.country}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{expert.bio}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {expert.topics.map(t => (
                  <span key={t} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>📄 {expert.articles} articles</span>
                <span>⭐ {expert.rating}/5.0</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Expert Detail */}
        {selected && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                {selected.name[0]}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  {selected.name}
                  {selected.verified && <span className="ml-2 text-blue-500 text-lg">✓ Verified</span>}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{selected.role} — {selected.flag} {selected.country}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{selected.bio}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selected.articles}</p>
                    <p className="text-xs text-gray-500">Articles</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selected.rating}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selected.topics.length}</p>
                    <p className="text-xs text-gray-500">Topics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schema CI Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🔧 Schema CI Pipeline</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Every article published on CoinDaily passes through our automated Schema CI pipeline to ensure:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { check: 'NewsArticle schema', status: 'required', icon: '📰' },
              { check: 'Person schema (author)', status: 'required', icon: '👤' },
              { check: 'Image ≥ 1200px', status: 'required', icon: '🖼️' },
              { check: 'Meta completeness', status: 'required', icon: '🏷️' },
            ].map(item => (
              <div key={item.check} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.check}</p>
                  <p className="text-xs text-green-600">✓ {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'ItemList',
          name: 'CoinDaily Expert Authors',
          itemListElement: experts.map((e, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: { '@type': 'Person', name: e.name, jobTitle: e.role, sameAs: e.sameAs }
          }))
        })}} />
      </main>
      <Footer />
    </div>
  );
}
