'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

// ─── Industry-researched ad rates for crypto/fintech African media ───
// Based on CoinDesk, CoinTelegraph, Bitcoin.com, The Block, and African tech media (TechCabal, Disrupt Africa)
// Rates adjusted 40-60% lower than global crypto media to match African market purchasing power

const adFormats = [
  {
    id: 'banner-leaderboard',
    name: 'Leaderboard Banner',
    placement: 'Top of page (above the fold)',
    dimensions: '728 × 90 px',
    cpm: 12,
    cpc: 0.45,
    monthlyFlat: 1200,
    impressions: '~100K/month',
    ctr: '0.8–1.2%',
    bestFor: 'Brand awareness, exchange launches',
    popular: false,
  },
  {
    id: 'banner-sidebar',
    name: 'Sidebar Rectangle',
    placement: 'Right sidebar (sticky on scroll)',
    dimensions: '300 × 250 px',
    cpm: 8,
    cpc: 0.35,
    monthlyFlat: 800,
    impressions: '~100K/month',
    ctr: '0.5–0.9%',
    bestFor: 'Product promotion, DeFi platforms',
    popular: false,
  },
  {
    id: 'banner-inline',
    name: 'In-Article Banner',
    placement: 'Between article paragraphs',
    dimensions: '728 × 90 or 300 × 250 px',
    cpm: 15,
    cpc: 0.55,
    monthlyFlat: 1500,
    impressions: '~100K/month',
    ctr: '1.0–1.8%',
    bestFor: 'Highest engagement, token launches',
    popular: true,
  },
  {
    id: 'native-article',
    name: 'Sponsored Article',
    placement: 'Published as editorial (marked "Sponsored")',
    dimensions: '1,000–2,000 words with images',
    cpm: null,
    cpc: null,
    monthlyFlat: null,
    perUnit: 500,
    impressions: '~5K–15K reads',
    ctr: '3–8% (to CTA link)',
    bestFor: 'Thought leadership, exchange launches, token education',
    popular: true,
  },
  {
    id: 'newsletter-banner',
    name: 'Newsletter Sponsorship',
    placement: 'Top banner in daily/weekly email newsletter',
    dimensions: '600 × 100 px banner + 50-word blurb',
    cpm: 25,
    cpc: 1.20,
    monthlyFlat: null,
    perUnit: 300,
    impressions: '~45K subscribers',
    ctr: '2.5–5%',
    bestFor: 'Direct engagement, high-intent audience',
    popular: true,
  },
  {
    id: 'homepage-takeover',
    name: 'Homepage Takeover',
    placement: 'Full homepage branding (24 hours)',
    dimensions: 'Custom hero banner + sidebar + in-feed',
    cpm: null,
    cpc: null,
    monthlyFlat: null,
    perUnit: 2500,
    impressions: '~50K–80K in 24h',
    ctr: '1.5–3%',
    bestFor: 'Major launches, exchange openings, token sales',
    popular: false,
  },
  {
    id: 'popup-interstitial',
    name: 'Exit-Intent Popup',
    placement: 'Full-screen popup on exit intent',
    dimensions: '600 × 400 px or responsive',
    cpm: 20,
    cpc: 0.80,
    monthlyFlat: 900,
    impressions: '~60K triggers/month',
    ctr: '1.5–3%',
    bestFor: 'Signups, app downloads, limited-time offers',
    popular: false,
  },
];

const packages = [
  {
    name: 'Starter',
    price: 499,
    period: '/month',
    description: 'Perfect for startups and small exchanges entering the African market',
    features: [
      '1 Sidebar Rectangle (300×250)',
      '50K impressions guaranteed',
      'Basic targeting (country)',
      'Monthly performance report',
      'Self-serve dashboard access',
    ],
    highlight: false,
  },
  {
    name: 'Growth',
    price: 1499,
    period: '/month',
    description: 'For exchanges and DeFi platforms scaling across Africa',
    features: [
      '1 Leaderboard Banner (728×90)',
      '1 In-Article Banner',
      '200K impressions guaranteed',
      'Advanced targeting (country + topic)',
      '2 Sponsored Articles per month',
      'Weekly performance reports',
      'A/B testing (2 creatives)',
      'Dedicated account manager',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 3999,
    period: '/month',
    description: 'Full-scale campaigns for major exchanges and institutional clients',
    features: [
      'All ad placements included',
      '500K+ impressions guaranteed',
      'Granular targeting (country + topic + device)',
      '4 Sponsored Articles per month',
      '2 Newsletter Sponsorships per month',
      '1 Homepage Takeover per quarter',
      'Real-time analytics dashboard',
      'Custom creative support',
      'Priority placement guarantee',
      'Quarterly strategy reviews',
    ],
    highlight: false,
  },
];

const audienceStats = [
  { label: 'Monthly Visitors', value: '1.2M+', icon: '👥' },
  { label: 'Newsletter Subscribers', value: '45K+', icon: '📧' },
  { label: 'Avg. Session Duration', value: '4m 32s', icon: '⏱️' },
  { label: 'African Audience', value: '78%', icon: '🌍' },
  { label: 'Mobile Traffic', value: '65%', icon: '📱' },
  { label: 'Crypto-Active Users', value: '82%', icon: '₿' },
];

const topCountries = [
  { country: 'Nigeria', flag: '🇳🇬', pct: 35 },
  { country: 'Kenya', flag: '🇰🇪', pct: 18 },
  { country: 'South Africa', flag: '🇿🇦', pct: 14 },
  { country: 'Ghana', flag: '🇬🇭', pct: 9 },
  { country: 'Tanzania', flag: '🇹🇿', pct: 6 },
  { country: 'Uganda', flag: '🇺🇬', pct: 5 },
  { country: 'Others', flag: '🌍', pct: 13 },
];

export default function AdvertisePage() {
  const [selectedTab, setSelectedTab] = useState<'formats' | 'packages'>('packages');
  const [showContactForm, setShowContactForm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', budget: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowContactForm(false); }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            📢 Advertising &amp; Sponsored Content
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Reach Africa&apos;s Crypto Audience
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            CoinDaily is Africa&apos;s leading cryptocurrency news platform with 1.2M+ monthly visitors across 40+ countries.
            Put your brand in front of the most engaged crypto audience on the continent.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowContactForm(true)}
              className="px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg transition-all"
            >
              Get a Custom Quote
            </button>
            <Link href="/paid-services" className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:border-orange-500 transition-all">
              ← All Paid Services
            </Link>
          </div>
        </div>

        {/* Audience Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {audienceStats.map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Audience Geography */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🌍 Audience by Country</h2>
          <div className="space-y-3">
            {topCountries.map(c => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-lg w-8">{c.flag}</span>
                <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">{c.country}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex justify-center gap-3 mb-8">
          <button onClick={() => setSelectedTab('packages')} className={`px-6 py-3 rounded-xl font-medium transition-all ${selectedTab === 'packages' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
            📦 Packages
          </button>
          <button onClick={() => setSelectedTab('formats')} className={`px-6 py-3 rounded-xl font-medium transition-all ${selectedTab === 'formats' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
            🎨 Ad Formats &amp; Rates
          </button>
        </div>

        {/* ── Packages Tab ───────────────────────────── */}
        {selectedTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {packages.map(pkg => (
              <div key={pkg.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${pkg.highlight ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-800' : 'border-transparent'} relative`}>
                {pkg.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-orange-600">${pkg.price.toLocaleString()}</span>
                  <span className="text-gray-500 dark:text-gray-400">{pkg.period}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{pkg.description}</p>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-green-500 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowContactForm(true)}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.highlight ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'}`}
                >
                  Get Started →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Ad Formats Tab ─────────────────────────── */}
        {selectedTab === 'formats' && (
          <div className="space-y-4 mb-12">
            {adFormats.map(format => (
              <div key={format.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border-2 ${format.popular ? 'border-orange-300 dark:border-orange-700' : 'border-transparent'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{format.name}</h3>
                      {format.popular && <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-full">Popular</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{format.placement}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>📐 {format.dimensions}</span>
                      <span>👁️ {format.impressions}</span>
                      <span>📈 CTR: {format.ctr}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Best for: {format.bestFor}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {format.cpm && (
                      <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${format.cpm}</p>
                        <p className="text-xs text-gray-500">CPM</p>
                      </div>
                    )}
                    {format.cpc && (
                      <div className="text-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">${format.cpc}</p>
                        <p className="text-xs text-gray-500">CPC</p>
                      </div>
                    )}
                    {format.monthlyFlat && (
                      <div className="text-center px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-lg font-bold text-orange-600">${format.monthlyFlat.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Flat/month</p>
                      </div>
                    )}
                    {(format as any).perUnit && (
                      <div className="text-center px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-lg font-bold text-orange-600">${(format as any).perUnit.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Per unit</p>
                      </div>
                    )}
                    <button onClick={() => setShowContactForm(true)} className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust Badges */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-12">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">Trusted By Africa&apos;s Leading Crypto Brands</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 dark:text-gray-500 text-sm font-medium">
            {['Binance Africa', 'Luno', 'Quidax', 'Yellow Card', 'VALR', 'Chipper Cash', 'Bundle Africa', 'Paxful'].map(brand => (
              <span key={brand} className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{brand}</span>
            ))}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowContactForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              {submitted ? (
                <div className="text-center py-8">
                  <p className="text-5xl mb-4">✅</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Received!</h3>
                  <p className="text-gray-600 dark:text-gray-300">Our advertising team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Request Advertising Quote</h3>
                  <div className="space-y-4">
                    <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="text" required placeholder="Company / Project" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <select value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select Budget Range</option>
                      <option value="<500">Under $500/month</option>
                      <option value="500-1500">$500 – $1,500/month</option>
                      <option value="1500-4000">$1,500 – $4,000/month</option>
                      <option value="4000+">$4,000+/month</option>
                    </select>
                    <textarea rows={3} placeholder="Tell us about your campaign goals..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="submit" className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700">Send Request</button>
                    <button type="button" onClick={() => setShowContactForm(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              { q: 'What file formats do you accept for ads?', a: 'We accept PNG, JPG, GIF, and HTML5 for display ads. For sponsored content, we handle writing and design in-house or can publish your draft.' },
              { q: 'Do you offer geo-targeting?', a: 'Yes. We can target by country (Nigeria, Kenya, South Africa, Ghana, etc.), device type, and content category (DeFi, exchanges, regulation, etc.).' },
              { q: 'What is your payment policy?', a: 'Packages are billed monthly in advance. Individual ad formats can be billed per campaign. We accept wire transfer, crypto (BTC/ETH/USDT), and M-Pesa.' },
              { q: 'Can I see campaign performance in real-time?', a: 'Growth and Enterprise package advertisers get access to a real-time analytics dashboard showing impressions, clicks, CTR, and conversions.' },
              { q: 'Do you offer discounts for long-term commitments?', a: 'Yes. 3-month commitments get 10% off, 6-month get 15% off, and annual contracts get 20% off listed rates.' },
              { q: 'Can I run crypto token or ICO/IDO ads?', a: 'We review all crypto token ads for compliance. Legitimate projects with verifiable teams and audited contracts are accepted. Scams and unverified tokens are rejected.' },
            ].map((faq, i) => (
              <div key={i} className="border dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex justify-between items-center px-5 py-4 text-left">
                  <span className="font-medium text-gray-900 dark:text-white">{faq.q}</span>
                  <span className="text-gray-400">{expandedFaq === i ? '−' : '+'}</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
