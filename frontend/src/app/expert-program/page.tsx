'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const tiers = [
  {
    name: 'Community Writer',
    emoji: '✍️',
    color: 'blue',
    requirements: ['Basic crypto knowledge', 'Good writing skills', 'Active social media presence'],
    perks: ['Published byline on articles', 'CoinDaily author badge', 'Access to community slack', 'Free CoinDaily Premium'],
    compensation: '$25–50 per article',
    slots: 'Open',
  },
  {
    name: 'Regional Expert',
    emoji: '🌍',
    color: 'orange',
    requirements: ['Deep local market knowledge', '3+ published articles', 'Verified expertise in region', 'Local language fluency'],
    perks: ['Featured author profile', 'Priority editorial calendar', 'Quarterly bonus pool', 'Event speaker invitations', 'Free CoinDaily Premium'],
    compensation: '$75–150 per article',
    slots: '20 positions',
  },
  {
    name: 'Senior Analyst',
    emoji: '📊',
    color: 'purple',
    requirements: ['Professional finance/crypto background', '10+ published articles', 'Demonstrated analytical skills', 'Regular availability'],
    perks: ['Premium author page', 'Monthly retainer available', 'Revenue share on premium content', 'Conference sponsorship', 'Access to AI tools suite'],
    compensation: '$150–300 per article + retainer',
    slots: '10 positions',
  },
  {
    name: 'Advisory Board',
    emoji: '👑',
    color: 'yellow',
    requirements: ['Industry leader status', 'Invitation only', 'Public figure or KOL', 'Commitment to quarterly review'],
    perks: ['Top-tier branding', 'Advisory compensation', 'Equity participation', 'Full editorial control', 'Direct line to CEO'],
    compensation: 'Retainer + equity',
    slots: '5 positions',
  },
];

const expertSpotlight = [
  { name: 'Amara Okafor', country: '🇳🇬', title: 'Nigeria Market Analyst', articles: 47, tier: 'Regional Expert', specialties: ['DeFi', 'P2P Markets', 'CBN Policy'] },
  { name: 'Wanjiku Kamau', country: '🇰🇪', title: 'Kenya Fintech Reporter', articles: 32, tier: 'Regional Expert', specialties: ['M-Pesa', 'Mobile Money', 'CMA Regulation'] },
  { name: 'Thabo Ndlovu', country: '🇿🇦', title: 'SA Market Correspondent', articles: 28, tier: 'Senior Analyst', specialties: ['FSCA', 'Institutional Crypto', 'Mining'] },
  { name: 'Kwame Asante', country: '🇬🇭', title: 'West Africa Desk', articles: 19, tier: 'Community Writer', specialties: ['BoG Policy', 'e-Cedi', 'Remittances'] },
  { name: 'Fatima Hassan', country: '🇪🇬', title: 'MENA-Africa Bridge', articles: 24, tier: 'Regional Expert', specialties: ['Islamic Finance', 'CBDC', 'Cross-border'] },
  { name: 'Jean-Pierre Nkurunziza', country: '🇷🇼', title: 'East Africa Reporter', articles: 15, tier: 'Community Writer', specialties: ['Innovation Hub', 'Digital Economy', 'BNR Framework'] },
];

const applicationTopics = [
  'Nigeria Market Analysis', 'Kenya Fintech Coverage', 'South Africa Regulation',
  'West Africa P2P', 'East Africa Mobile Money', 'DeFi & Yield Farming',
  'Stablecoin Remittances', 'CBDC Research', 'Memecoin Analysis',
  'Crypto Tax & Compliance', 'Exchange Reviews', 'Educational Content',
];

const faqs = [
  { q: 'How do I get paid?', a: 'We pay via crypto (USDT/USDC on your preferred network), bank transfer, or mobile money. Payments are processed within 7 days of article publication.' },
  { q: 'What languages can I write in?', a: 'We accept content in English, French, Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Portuguese, and Arabic. Our translation team handles multi-language distribution.' },
  { q: 'How many articles per month?', a: 'Community Writers: 2-4 articles/month. Regional Experts: 4-8 articles/month. Senior Analysts: Flexible based on retainer agreement.' },
  { q: 'Do I need prior journalism experience?', a: 'No! We value authentic local expertise over formal journalism training. Good writing skills and deep market knowledge are what matter most.' },
  { q: 'Can I write about my own country only?', a: 'You can focus on your country or cover broader regional topics. We especially value cross-border insights and comparative analysis.' },
  { q: 'What tools and support do you provide?', a: 'AI writing assistants, editorial review, research databases, market data access, and a dedicated editor for each contributor.' },
];

export default function ExpertProgramPage() {
  const [tab, setTab] = useState<'overview' | 'apply' | 'faq'>('overview');
  const [formData, setFormData] = useState({ name: '', email: '', country: '', expertise: '', portfolio: '', why: '', topics: [] as string[] });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300' },
  };

  const toggleTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter(t => t !== topic) : [...prev.topics, topic],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 Local Expert Contributor Program
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Share your African crypto expertise with millions. Get paid, get recognized, and help build Africa&apos;s crypto knowledge base.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-orange-600">48</p>
              <p className="text-xs text-gray-500">Active Experts</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-green-600">13</p>
              <p className="text-xs text-gray-500">Countries</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-blue-600">850+</p>
              <p className="text-xs text-gray-500">Articles Published</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-purple-600">$42K</p>
              <p className="text-xs text-gray-500">Paid Out</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          {[
            { key: 'overview', label: '📋 Program Overview' },
            { key: 'apply', label: '📝 Apply Now' },
            { key: 'faq', label: '❓ FAQ' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${tab === t.key ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
            {/* Tiers */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contributor Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {tiers.map(t => (
                <div key={t.name} className={`rounded-2xl shadow-lg p-6 border-2 ${colorMap[t.color].bg} ${colorMap[t.color].border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{t.emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.name}</h3>
                      <p className={`text-sm font-semibold ${colorMap[t.color].text}`}>{t.compensation}</p>
                    </div>
                    <span className="ml-auto text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 font-semibold">{t.slots}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {t.requirements.map(r => <li key={r} className="text-sm text-gray-600 dark:text-gray-300">• {r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Perks</h4>
                      <ul className="space-y-1">
                        {t.perks.map(p => <li key={p} className="text-sm text-gray-600 dark:text-gray-300">✓ {p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expert Spotlight */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Expert Spotlight</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {expertSpotlight.map(e => (
                <div key={e.name} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-lg font-bold text-orange-600">{e.name[0]}</div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{e.name} {e.country}</p>
                      <p className="text-xs text-gray-500">{e.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-2 py-0.5 rounded-full font-semibold">{e.tier}</span>
                    <span className="text-xs text-gray-500">{e.articles} articles</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.specialties.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { step: 1, title: 'Apply', desc: 'Submit your application with expertise and writing samples' },
                  { step: 2, title: 'Review', desc: 'Our editorial team reviews within 48 hours' },
                  { step: 3, title: 'Onboard', desc: 'Access tools, guidelines, and editorial calendar' },
                  { step: 4, title: 'Write', desc: 'Submit articles using our AI-assisted CMS' },
                  { step: 5, title: 'Get Paid', desc: 'Receive payment within 7 days of publication' },
                ].map(s => (
                  <div key={s.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold mx-auto mb-3">{s.step}</div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{s.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Apply Tab */}
        {tab === 'apply' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Apply to the Expert Program</h2>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country *</label>
                <select value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  <option value="">Select your country</option>
                  <option value="NG">🇳🇬 Nigeria</option>
                  <option value="KE">🇰🇪 Kenya</option>
                  <option value="ZA">🇿🇦 South Africa</option>
                  <option value="GH">🇬🇭 Ghana</option>
                  <option value="ET">🇪🇹 Ethiopia</option>
                  <option value="TZ">🇹🇿 Tanzania</option>
                  <option value="UG">🇺🇬 Uganda</option>
                  <option value="RW">🇷🇼 Rwanda</option>
                  <option value="EG">🇪🇬 Egypt</option>
                  <option value="MA">🇲🇦 Morocco</option>
                  <option value="CM">🇨🇲 Cameroon</option>
                  <option value="SN">🇸🇳 Senegal</option>
                  <option value="other">Other African Country</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area of Expertise *</label>
                <input type="text" value={formData.expertise} onChange={e => setFormData(p => ({ ...p, expertise: e.target.value }))}
                  placeholder="e.g., DeFi, P2P Trading, Regulation, Market Analysis"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topics You&apos;d Like to Cover</label>
                <div className="flex flex-wrap gap-2">
                  {applicationTopics.map(t => (
                    <button key={t} type="button" onClick={() => toggleTopic(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${formData.topics.includes(t) ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio / Writing Samples</label>
                <input type="url" value={formData.portfolio} onChange={e => setFormData(p => ({ ...p, portfolio: e.target.value }))}
                  placeholder="Link to your blog, Medium, or published work"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Why do you want to join? *</label>
                <textarea value={formData.why} onChange={e => setFormData(p => ({ ...p, why: e.target.value }))} rows={4}
                  placeholder="Tell us about your background, what makes you an expert, and how you'd contribute..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>

              <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700">
                Submit Application 🚀
              </button>
              <p className="text-xs text-gray-500 text-center">We review applications within 48 hours. You&apos;ll receive an email with next steps.</p>
            </form>
          </div>
        )}

        {/* FAQ Tab */}
        {tab === 'faq' && (
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">{f.q}</h3>
                    <span className="text-gray-400 text-xl">{expandedFaq === i ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 dark:text-gray-300">{f.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
