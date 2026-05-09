'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

/* ──────────── CONTRIBUTOR TIERS (these double as job positions on /jobs) ──────────── */
const tiers = [
  {
    name: 'Community Writer',
    emoji: '✍️',
    color: 'blue',
    type: 'Content',
    requirements: ['Basic crypto/finance knowledge', 'Good writing skills in any African language', 'Active social media presence', 'Passion for African financial education'],
    perks: ['Published byline on articles', 'CoinDaily author badge', 'Access to community Slack', 'Free CoinDaily Premium', 'AI writing tools access'],
    compensation: 'Per-article pay + Ad revenue share (55/45)',
    slots: 'Open — Apply Now',
  },
  {
    name: 'Regional Expert',
    emoji: '🌍',
    color: 'orange',
    type: 'Content & Analysis',
    requirements: ['Deep local market knowledge', '3+ published articles or equivalent', 'Verified expertise in your region', 'Local language fluency', 'Consistent availability'],
    perks: ['Featured author profile', 'Priority editorial calendar', 'Quarterly bonus pool', 'Event speaker invitations', 'Free CoinDaily Premium', 'Course creation rights'],
    compensation: 'Retainer + Ad revenue share (55/45) + Course sales (80/20)',
    slots: '20 positions',
  },
  {
    name: 'Senior Analyst',
    emoji: '📊',
    color: 'purple',
    type: 'Research & Data',
    requirements: ['Professional finance/crypto background', '10+ published works', 'Demonstrated analytical skills', 'Regular availability', 'Strong data interpretation'],
    perks: ['Premium author page', 'Monthly retainer', 'Revenue share on premium content', 'Conference sponsorship', 'Full AI tools suite', 'Premium podcast hosting'],
    compensation: 'Monthly retainer + Ad revenue share (55/45) + Premium content split',
    slots: '10 positions',
  },
  {
    name: 'Advisory Board',
    emoji: '👑',
    color: 'yellow',
    type: 'Strategy & Leadership',
    requirements: ['Industry leader status', 'Invitation only or outstanding application', 'Public figure or KOL', 'Commitment to quarterly review'],
    perks: ['Top-tier branding', 'Advisory compensation', 'Token allocation', 'Full editorial control', 'Direct line to CEO', 'Board voting rights'],
    compensation: 'Retainer + Token allocation + Revenue share',
    slots: '5 positions',
  },
];

/* ──────────── USER BENEFITS ──────────── */
const benefits = [
  { icon: '🚀', title: 'Lead the Way', desc: 'Position yourself as a thought leader in Africa\'s finance and crypto space.' },
  { icon: '💰', title: 'Ad Revenue Share', desc: 'Earn 55% of ad revenue placed on your content. You=55%, We=45%.' },
  { icon: '🏆', title: 'Get Recognized (Awards)', desc: 'Quarterly awards for top contributors. Build your reputation across Africa.' },
  { icon: '🎤', title: 'Speaking Opportunities', desc: 'Get invited to conferences, panels, and media appearances.' },
  { icon: '📚', title: 'Learn The Finance Rope', desc: 'Access our training resources, AI tools, and mentorship from industry experts.' },
  { icon: '🎓', title: 'Create Courses & Get Paid', desc: 'Build and sell courses on our platform. You=80%, We=20% (incl. processing fee).' },
  { icon: '💝', title: 'Tips & Community Support', desc: 'Receive tips and raise support funds directly from your community.' },
  { icon: '🎙️', title: 'Host Premium Podcasts', desc: 'Launch and monetize your own premium podcast series.' },
  { icon: '🤖', title: 'AI-Powered Monetization', desc: 'Monetize all your efforts with our super custom AI agents.' },
  { icon: '👥', title: 'Build Your Community', desc: 'Grow your audience and benefit from community engagement tools.' },
  { icon: '🆓', title: 'No Fees', desc: 'When you make money, we make money. Zero upfront costs or hidden fees.' },
];

/* ──────────── EXPERT SPOTLIGHT ──────────── */
const expertSpotlight = [
  { name: 'Amara Okafor', country: '🇳🇬', title: 'Nigeria Market Analyst', articles: 47, tier: 'Regional Expert', specialties: ['DeFi', 'P2P Markets', 'CBN Policy'], earnings: '$4,200+', quote: 'CoinDaily gave me a platform to share what I know and earn from it.' },
  { name: 'Wanjiku Kamau', country: '🇰🇪', title: 'Kenya Fintech Reporter', articles: 32, tier: 'Regional Expert', specialties: ['M-Pesa', 'Mobile Money', 'CMA Regulation'], earnings: '$3,100+', quote: 'The AI tools make writing so much faster. I focus on what I know best.' },
  { name: 'Thabo Ndlovu', country: '🇿🇦', title: 'SA Market Correspondent', articles: 28, tier: 'Senior Analyst', specialties: ['FSCA', 'Institutional Crypto', 'Mining'], earnings: '$5,800+', quote: 'The revenue share model is fair. My premium content consistently earns well.' },
  { name: 'Kwame Asante', country: '🇬🇭', title: 'West Africa Desk', articles: 19, tier: 'Community Writer', specialties: ['BoG Policy', 'e-Cedi', 'Remittances'], earnings: '$1,400+', quote: 'Started as a community writer, now building my course on crypto remittances.' },
  { name: 'Fatima Hassan', country: '🇪🇬', title: 'MENA-Africa Bridge', articles: 24, tier: 'Regional Expert', specialties: ['Islamic Finance', 'CBDC', 'Cross-border'], earnings: '$2,900+', quote: 'No other platform covers the MENA-Africa corridor like CoinDaily.' },
  { name: 'Jean-Pierre Nkurunziza', country: '🇷🇼', title: 'East Africa Reporter', articles: 15, tier: 'Community Writer', specialties: ['Innovation Hub', 'Digital Economy', 'BNR Framework'], earnings: '$1,100+', quote: 'I host a weekly podcast that my community loves. The tools make it easy.' },
];

/* ──────────── HOW IT WORKS ──────────── */
const howItWorks = [
  { step: 1, title: 'Apply', desc: 'Submit your application with your expertise and writing samples. Takes 2 minutes.' },
  { step: 2, title: 'Get Reviewed', desc: 'Our editorial team reviews your application within 48 hours.' },
  { step: 3, title: 'Onboard & Learn', desc: 'Access tools, AI assistants, editorial guidelines, and the contributor dashboard.' },
  { step: 4, title: 'Create & Publish', desc: 'Write articles, create courses, host podcasts — use our AI-powered CMS.' },
  { step: 5, title: 'Earn & Grow', desc: 'Get paid in CoinDaily Token. Earn from ads, courses, tips, podcasts, and more.' },
];

/* ──────────── APPLICATION TOPICS ──────────── */
const applicationTopics = [
  'Nigeria Market Analysis', 'Kenya Fintech Coverage', 'South Africa Regulation',
  'West Africa P2P', 'East Africa Mobile Money', 'DeFi & Yield Farming',
  'Stablecoin Remittances', 'CBDC Research', 'Memecoin Analysis',
  'Crypto Tax & Compliance', 'Exchange Reviews', 'Educational Content',
  'Podcast Hosting', 'Video Content', 'Course Creation',
];

/* ──────────── FAQ ──────────── */
const faqs = [
  { q: 'How do I get paid?', a: 'ALL payments are made in the official CoinDaily Token (to be launched). You can swap tokens on imaswap.online or stake them at stake.imaswap.online for additional yield.' },
  { q: 'What is the revenue share model?', a: 'For ad revenue on your content: You=55%, We=45%. For courses you create: You=80%, We=20% (including processing fees). For premium podcasts: similar split based on your tier.' },
  { q: 'What languages can I write in?', a: 'We accept content in English, French, Swahili, Hausa, Yoruba, Igbo, Amharic, Zulu, Pidgin, Portuguese, Arabic, and more. Our AI translation team handles multi-language distribution.' },
  { q: 'How many articles per month?', a: 'Community Writers: 2-4 articles/month. Regional Experts: 4-8 articles/month. Senior Analysts: Flexible based on retainer agreement.' },
  { q: 'Do I need prior journalism experience?', a: 'No! We value authentic local expertise over formal journalism training. Good writing skills and deep market knowledge are what matter most.' },
  { q: 'What tools and support do you provide?', a: 'AI writing assistants, editorial review, research databases, market data access, course builder, podcast studio, community management tools, and a dedicated editor.' },
  { q: 'Are there any fees to join?', a: 'Zero. No fees when you join. When you make money, we make money. That\'s our business model.' },
  { q: 'Can I view open positions?', a: 'Yes! Visit our Jobs page to see all open positions based on contributor tiers, including technical roles.' },
];

export default function ExpertProgramPage() {
  const [tab, setTab] = useState<'overview' | 'apply' | 'faq'>('overview');
  const [formData, setFormData] = useState({ name: '', email: '', country: '', expertise: '', portfolio: '', why: '', topics: [] as string[] });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' },
  };

  const toggleTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) ? prev.topics.filter(t => t !== topic) : [...prev.topics, topic],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            🤝 Become A Partner
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Local Expert Contributor Program
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2">
            Share your African Crypto and Finance Expertise with Millions. Get Paid, Get Recognized.
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Help us build Africa&apos;s Crypto Knowledge Base and recreate the Africa money future we all desire.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full text-sm font-bold mb-6">
            💎 ALL payments are made in official CoinDaily Token
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-3 shadow">
              <p className="text-2xl font-bold text-orange-600">48</p>
              <p className="text-xs text-gray-500">Active Contributors</p>
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
              <p className="text-2xl font-bold text-purple-600">$42K+</p>
              <p className="text-xs text-gray-500">Paid to Contributors</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {[
            { key: 'overview', label: '📋 Program Overview' },
            { key: 'apply', label: '📝 Apply Now' },
            { key: 'faq', label: '❓ FAQ' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-orange-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border hover:bg-orange-50 dark:hover:bg-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
            {/* Benefits Section */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">Why Become A Partner?</h2>
              <p className="text-gray-500 text-center mb-8">Everything you gain when you join our contributor program</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map(b => (
                  <div key={b.title} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{b.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{b.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Split Highlight */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-8 mb-16 text-white text-center">
              <h3 className="text-2xl font-bold mb-6">Transparent Revenue Sharing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/20 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-4xl font-black mb-2">55%</p>
                  <p className="font-bold">Ad Revenue</p>
                  <p className="text-sm opacity-90">You earn 55% of all ads placed on your content</p>
                </div>
                <div className="bg-white/20 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-4xl font-black mb-2">80%</p>
                  <p className="font-bold">Course Sales</p>
                  <p className="text-sm opacity-90">Create courses, keep 80% (We get 20% incl. fees)</p>
                </div>
                <div className="bg-white/20 rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-4xl font-black mb-2">0%</p>
                  <p className="font-bold">Fees</p>
                  <p className="text-sm opacity-90">No upfront costs. When you earn, we earn</p>
                </div>
              </div>
            </div>

            {/* Contributor Tiers */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contributor Tiers</h2>
            <p className="text-gray-500 mb-6">Each tier is also an open position — <Link href="/jobs" className="text-orange-600 hover:underline font-semibold">view all vacancies →</Link></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {tiers.map(t => (
                <div key={t.name} className={`rounded-2xl shadow-lg p-6 border-2 ${colorMap[t.color].bg} ${colorMap[t.color].border}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{t.emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.name}</h3>
                      <p className={`text-xs font-medium ${colorMap[t.color].text}`}>{t.type}</p>
                    </div>
                    <span className="text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 font-semibold">{t.slots}</span>
                  </div>
                  <p className={`text-sm font-bold mb-4 ${colorMap[t.color].text}`}>{t.compensation}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {t.requirements.map(r => <li key={r} className="text-xs text-gray-600 dark:text-gray-300">• {r}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Perks</h4>
                      <ul className="space-y-1">
                        {t.perks.map(p => <li key={p} className="text-xs text-gray-600 dark:text-gray-300">✓ {p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expert Spotlight */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Expert Spotlight</h2>
            <p className="text-gray-500 mb-6">Meet some of our top contributors shaping Africa&apos;s crypto narrative</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {expertSpotlight.map(e => (
                <div key={e.name} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-lg font-bold text-orange-600">{e.name[0]}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{e.name} {e.country}</p>
                      <p className="text-xs text-gray-500">{e.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-2 py-0.5 rounded-full font-semibold">{e.tier}</span>
                    <span className="text-xs text-gray-500">{e.articles} articles</span>
                    <span className="text-xs text-green-600 font-bold ml-auto">{e.earnings} earned</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-3">&ldquo;{e.quote}&rdquo;</p>
                  <div className="flex flex-wrap gap-1">
                    {e.specialties.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">How It Works</h2>
              <p className="text-gray-500 text-center mb-8">From application to earning — your journey</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {howItWorks.map(s => (
                  <div key={s.step} className="text-center relative">
                    <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-3">{s.step}</div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h4>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                    {s.step < 5 && <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] border-t-2 border-dashed border-orange-300 dark:border-orange-700" />}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-gray-900 dark:bg-gray-800 rounded-2xl p-10 mb-8">
              <h3 className="text-2xl font-bold text-white mb-3">Ready to Share Your Expertise?</h3>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">Join 48+ contributors from 13 African countries already earning and building their reputation on CoinDaily.</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button onClick={() => setTab('apply')} className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg">
                  Apply Now 🚀
                </button>
                <Link href="/jobs" className="px-8 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all">
                  View Open Positions 💼
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Apply Tab */}
        {tab === 'apply' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            {submitted ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">🎉</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Application Submitted!</h2>
                <p className="text-gray-500 mb-6">We review applications within 48 hours. You&apos;ll receive an email with next steps.</p>
                <p className="text-sm text-gray-400">Remember: All payments will be made in CoinDaily Token.</p>
                <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', country: '', expertise: '', portfolio: '', why: '', topics: [] }); }}
                  className="mt-6 px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300">
                  Submit Another Application
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apply to the Expert Program</h2>
                <p className="text-sm text-gray-500 mb-6">All payments are made in CoinDaily Token • No fees to join</p>
                <form className="space-y-5" onSubmit={handleSubmit}>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formData.topics.includes(t) ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-600'}`}>
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
                      placeholder="Tell us about your background, what makes you an expert, and how you'd contribute to Africa's crypto knowledge base..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                  </div>

                  <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition-all shadow-lg">
                    Submit Application 🚀
                  </button>
                  <p className="text-xs text-gray-500 text-center">We review applications within 48 hours. All payments in CoinDaily Token.</p>
                </form>
              </>
            )}
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
                    <span className="text-gray-400 text-xl ml-4">{expandedFaq === i ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{f.a}</p>
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
