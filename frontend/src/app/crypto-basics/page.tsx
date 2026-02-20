'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const learningPaths = [
  {
    id: 'beginner',
    title: 'Start Here: Crypto Foundations',
    emoji: '🌱',
    color: 'green',
    modules: [
      { title: 'What is Cryptocurrency?', duration: '15 min', lessons: 4, status: 'unlocked' },
      { title: 'Understanding Bitcoin & Blockchain', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'How Crypto Works in Africa', duration: '15 min', lessons: 4, status: 'unlocked' },
      { title: 'Setting Up Your First Wallet', duration: '25 min', lessons: 6, status: 'locked' },
      { title: 'Buying Your First Crypto Safely', duration: '20 min', lessons: 5, status: 'locked' },
    ],
  },
  {
    id: 'p2p',
    title: 'P2P Trading Mastery',
    emoji: '🤝',
    color: 'blue',
    modules: [
      { title: 'Understanding P2P Exchanges', duration: '15 min', lessons: 3, status: 'unlocked' },
      { title: 'Binance P2P & Paxful for Africa', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'Avoiding P2P Scams', duration: '25 min', lessons: 6, status: 'unlocked' },
      { title: 'Using Mobile Money with Crypto', duration: '20 min', lessons: 4, status: 'locked' },
      { title: 'Becoming a P2P Merchant', duration: '30 min', lessons: 7, status: 'locked' },
    ],
  },
  {
    id: 'defi',
    title: 'DeFi for Africa',
    emoji: '🏦',
    color: 'purple',
    modules: [
      { title: 'What is DeFi? African Perspective', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'Stablecoins for Remittances', duration: '15 min', lessons: 4, status: 'unlocked' },
      { title: 'Yield Farming Basics', duration: '25 min', lessons: 6, status: 'locked' },
      { title: 'DEX vs CEX: What to Use', duration: '20 min', lessons: 5, status: 'locked' },
      { title: 'DeFi Safety & Risk Management', duration: '20 min', lessons: 4, status: 'locked' },
    ],
  },
  {
    id: 'regulation',
    title: 'Crypto Regulation Guide',
    emoji: '⚖️',
    color: 'orange',
    modules: [
      { title: 'Is Crypto Legal in My Country?', duration: '15 min', lessons: 3, status: 'unlocked' },
      { title: 'Nigeria: SEC & CBN Rules', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'Kenya: CMA & Digital Asset Rules', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'South Africa: FSCA Licensing', duration: '20 min', lessons: 4, status: 'unlocked' },
      { title: 'Tax Obligations for African Traders', duration: '25 min', lessons: 6, status: 'locked' },
    ],
  },
  {
    id: 'security',
    title: 'Crypto Security & Scam Prevention',
    emoji: '🛡️',
    color: 'red',
    modules: [
      { title: 'Common Crypto Scams in Africa', duration: '20 min', lessons: 5, status: 'unlocked' },
      { title: 'How to Verify Exchanges & Tokens', duration: '15 min', lessons: 4, status: 'unlocked' },
      { title: 'Securing Your Wallet & Keys', duration: '25 min', lessons: 6, status: 'unlocked' },
      { title: 'Social Engineering & Phishing', duration: '20 min', lessons: 5, status: 'locked' },
      { title: 'What to Do If You Get Scammed', duration: '15 min', lessons: 3, status: 'locked' },
    ],
  },
];

const countryGuides = [
  { flag: '🇳🇬', name: 'Nigeria', topics: ['Naira on-ramp', 'SEC compliance', 'Tax guide', 'Local exchanges'], articles: 42 },
  { flag: '🇰🇪', name: 'Kenya', topics: ['M-Pesa to crypto', 'KRA reporting', 'CMA rules', 'Safaricom'], articles: 28 },
  { flag: '🇿🇦', name: 'South Africa', topics: ['FSCA license', 'SARS crypto tax', 'Valr & Luno', 'Travel Rule'], articles: 35 },
  { flag: '🇬🇭', name: 'Ghana', topics: ['BoG policy', 'MoMo + crypto', 'GRA tax', 'e-Cedi'], articles: 18 },
  { flag: '🇪🇹', name: 'Ethiopia', topics: ['NBE regulations', 'Telebirr', 'Banking access', 'AML laws'], articles: 12 },
  { flag: '🇹🇿', name: 'Tanzania', topics: ['BoT stance', 'M-Pesa Tanzania', 'P2P trading', 'Digital policy'], articles: 15 },
  { flag: '🇺🇬', name: 'Uganda', topics: ['BOU advisory', 'MTN MoMo', 'Airtel Money', 'Fintech sandbox'], articles: 11 },
  { flag: '🇷🇼', name: 'Rwanda', topics: ['BNR framework', 'Irembo digital', 'Innovation hub', 'CBDC research'], articles: 8 },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', progress: 100 },
  { code: 'fr', name: 'Français', flag: '🇫🇷', progress: 85 },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿', progress: 70 },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬', progress: 60 },
  { code: 'yo', name: 'Yorùbá', flag: '🇳🇬', progress: 55 },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬', progress: 45 },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', progress: 40 },
  { code: 'zu', name: 'isiZulu', flag: '🇿🇦', progress: 35 },
  { code: 'pt', name: 'Português', flag: '🇲🇿', progress: 50 },
  { code: 'ar', name: 'العربية', flag: '🇪🇬', progress: 45 },
];

const glossaryTerms = [
  { term: 'HODL', def: 'Hold On for Dear Life — holding crypto long-term instead of selling' },
  { term: 'P2P', def: 'Peer-to-Peer — direct trading between users without intermediary' },
  { term: 'DeFi', def: 'Decentralized Finance — financial services on blockchain without banks' },
  { term: 'DYOR', def: 'Do Your Own Research — always verify before investing' },
  { term: 'KYC', def: 'Know Your Customer — identity verification required by exchanges' },
  { term: 'Gas Fee', def: 'Transaction fee paid to process blockchain operations' },
  { term: 'Stablecoin', def: 'Crypto pegged to a stable asset like USD (e.g., USDT, USDC)' },
  { term: 'Seed Phrase', def: '12-24 word backup code for your crypto wallet — NEVER share it' },
  { term: 'Rug Pull', def: 'Scam where project creators disappear with investors\' money' },
  { term: 'Whale', def: 'Person or entity holding very large amounts of cryptocurrency' },
];

export default function CryptoBasicsPage() {
  const [activeTab, setActiveTab] = useState<'paths' | 'countries' | 'glossary'>('paths');
  const [activePath, setActivePath] = useState('beginner');
  const [searchGlossary, setSearchGlossary] = useState('');
  const [language, setLanguage] = useState('en');

  const colorMap: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
  };

  const filteredTerms = glossaryTerms.filter(t =>
    t.term.toLowerCase().includes(searchGlossary.toLowerCase()) ||
    t.def.toLowerCase().includes(searchGlossary.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📚 Crypto Basics for Africa
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Free educational hub designed for African crypto beginners. Learn at your pace, in your language, with country-specific guides.
          </p>
          {/* Language Selector */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {languages.slice(0, 6).map(l => (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                className={`px-3 py-1.5 rounded-lg text-sm ${language === l.code ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          {[
            { key: 'paths', label: '🎓 Learning Paths', },
            { key: 'countries', label: '🌍 Country Guides' },
            { key: 'glossary', label: '📖 Crypto Glossary' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${activeTab === t.key ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Learning Paths Tab */}
        {activeTab === 'paths' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Path Sidebar */}
            <div className="space-y-2">
              {learningPaths.map(p => (
                <button key={p.id} onClick={() => setActivePath(p.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 ${activePath === p.id ? `${colorMap[p.color]} border-2` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                  <span className="text-xl mr-2">{p.emoji}</span>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{p.title}</span>
                  <p className="text-xs text-gray-500 mt-1">{p.modules.length} modules</p>
                </button>
              ))}
            </div>

            {/* Path Content */}
            <div className="lg:col-span-3">
              {(() => {
                const path = learningPaths.find(p => p.id === activePath)!;
                return (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {path.emoji} {path.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                      <span>{path.modules.length} modules</span>
                      <span>•</span>
                      <span>{path.modules.reduce((acc, m) => acc + m.lessons, 0)} lessons</span>
                      <span>•</span>
                      <span>~{path.modules.reduce((acc, m) => acc + parseInt(m.duration), 0)} min total</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
                        <span className="text-sm text-gray-500">0%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {path.modules.map((m, i) => (
                        <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${m.status === 'unlocked' ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${m.status === 'unlocked' ? 'bg-orange-500' : 'bg-gray-400'}`}>
                            {m.status === 'unlocked' ? i + 1 : '🔒'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{m.title}</p>
                            <p className="text-xs text-gray-500">{m.lessons} lessons • {m.duration}</p>
                          </div>
                          {m.status === 'unlocked' && (
                            <span className="text-sm text-orange-600 font-semibold">Start →</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Quiz Callout */}
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="font-bold text-blue-800 dark:text-blue-200">🏆 Knowledge Check</p>
                      <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                        Complete all modules to unlock the quiz and earn your CoinDaily certificate. Share it on social media!
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Country Guides Tab */}
        {activeTab === 'countries' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {countryGuides.map(c => (
              <div key={c.name} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{c.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.articles} articles available</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {c.topics.map(t => (
                    <span key={t} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">{t}</span>
                  ))}
                </div>
                <button className="w-full py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700">
                  Explore {c.name} Guide →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Glossary Tab */}
        {activeTab === 'glossary' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <input type="text" value={searchGlossary} onChange={e => setSearchGlossary(e.target.value)}
                placeholder="Search crypto terms..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              {filteredTerms.map((t, i) => (
                <div key={t.term} className={`p-4 ${i > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
                  <h4 className="font-bold text-orange-600 text-lg">{t.term}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t.def}</p>
                </div>
              ))}
            </div>

            {/* Crypto Lingo Callout */}
            <div className="mt-8 p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-white">
              <h3 className="text-xl font-bold mb-2">🗣️ African Crypto Lingo</h3>
              <p className="text-sm text-orange-100 mb-4">The African crypto community has its own unique terms and expressions!</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="font-bold text-sm">&quot;Japa&quot; (Nigeria)</p>
                  <p className="text-xs text-orange-100">Moving crypto to safety offshore</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="font-bold text-sm">&quot;Chama&quot; (Kenya)</p>
                  <p className="text-xs text-orange-100">Crypto investment group/club</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="font-bold text-sm">&quot;Stokvel&quot; (SA)</p>
                  <p className="text-xs text-orange-100">Savings club now using crypto</p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="font-bold text-sm">&quot;Susu&quot; (Ghana)</p>
                  <p className="text-xs text-orange-100">Traditional savings gone digital</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language Coverage */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🌍 Language Coverage</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {languages.map(l => (
              <div key={l.code} className="text-center">
                <span className="text-2xl">{l.flag}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{l.name}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: `${l.progress}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{l.progress}% translated</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
