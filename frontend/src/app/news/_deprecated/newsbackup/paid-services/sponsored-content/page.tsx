'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const contentPackages = [
  {
    name: 'Press Release',
    price: 350,
    description: 'Get your announcement in front of Africa\'s crypto audience',
    turnaround: '24–48 hours',
    features: [
      'Published on CoinDaily.africa',
      '500–1,500 word article',
      'Indexed on Google News',
      'Shared to 45K newsletter subscribers',
      'Social media push (X + Telegram)',
      '3 embedded links',
      'Permanent article (no expiry)',
      'Basic performance report',
    ],
    icon: '📰',
    popular: false,
  },
  {
    name: 'Sponsored Article',
    price: 500,
    description: 'In-depth editorial-style content with expert positioning',
    turnaround: '3–5 business days',
    features: [
      'Everything in Press Release',
      '1,000–2,500 word deep-dive',
      'Written by CoinDaily editors',
      'Expert quotes and analysis',
      'Custom graphics / infographics',
      '5 embedded links (do-follow)',
      'Featured on homepage (48h)',
      'Promoted in newsletter (top slot)',
      'Full analytics report',
    ],
    icon: '✍️',
    popular: true,
  },
  {
    name: 'Thought Leadership Package',
    price: 1200,
    description: 'Multi-format campaign for maximum brand authority',
    turnaround: '5–7 business days',
    features: [
      'Everything in Sponsored Article',
      '3 articles over 30 days',
      'Author profile / expert page',
      'Podcast/Twitter Space mention',
      'Permanent "Featured Expert" badge',
      'Custom landing page on CoinDaily',
      'Translated to 3 African languages',
      'Homepage banner (1 week)',
      'Priority placement for all content',
      'Monthly performance dashboard',
    ],
    icon: '🏆',
    popular: false,
  },
];

const addOns = [
  { name: 'Translation (per language)', price: 75, description: 'Translate your content into any of our 15 African languages' },
  { name: 'Social Media Boost', price: 150, description: 'Extra promotion across X, Telegram, Facebook, LinkedIn (48h campaign)' },
  { name: 'Newsletter Top Spot', price: 200, description: 'Premium placement at the top of our daily newsletter for one send' },
  { name: 'Infographic Design', price: 100, description: 'Custom infographic created by our design team to accompany your content' },
  { name: 'Video Summary', price: 250, description: '60-second animated video summary of your article for social sharing' },
  { name: 'Extended Homepage Feature', price: 300, description: 'Keep your article featured on homepage for 7 days (instead of 48h)' },
];

const process_steps = [
  { step: 1, title: 'Submit Brief', description: 'Share your key messages, target audience, and goals. Include any assets, links, or quotes.', icon: '📋' },
  { step: 2, title: 'Editorial Review', description: 'Our editors review and draft content that aligns with CoinDaily\'s editorial standards and your brand voice.', icon: '✏️' },
  { step: 3, title: 'Your Approval', description: 'Review the draft. Request up to 2 rounds of revisions to ensure it\'s perfect.', icon: '✅' },
  { step: 4, title: 'Publish & Promote', description: 'Content goes live, gets pushed to newsletter and social channels. Track performance in real-time.', icon: '🚀' },
];

export default function SponsoredContentPage() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', packageType: '', brief: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowContactForm(false); }, 3000);
  };

  const openForm = (pkg?: string) => {
    if (pkg) setFormData(prev => ({ ...prev, packageType: pkg }));
    setShowContactForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
            ✍️ Sponsored Content &amp; Press Releases
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Tell Your Story to Africa&apos;s Crypto Community
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Get featured on Africa&apos;s leading crypto news platform. Our editorial team crafts compelling content
            that resonates with 1.2M+ monthly readers across 40+ countries.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => openForm()} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg transition-all">
              Submit a Brief →
            </button>
            <Link href="/paid-services" className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:border-purple-500 transition-all">
              ← All Paid Services
            </Link>
          </div>
        </div>

        {/* Process */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process_steps.map(s => (
              <div key={s.step} className="text-center relative">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">{s.icon}</div>
                <div className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">{s.step}</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Content Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {contentPackages.map(pkg => (
            <div key={pkg.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${pkg.popular ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800' : 'border-transparent'} relative flex flex-col`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">{pkg.icon}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-1 my-2">
                  <span className="text-4xl font-black text-purple-600">${pkg.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">per piece</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Turnaround: {pkg.turnaround}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">{pkg.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openForm(pkg.name)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${pkg.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                Get Started →
              </button>
            </div>
          ))}
        </div>

        {/* Add-Ons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">📦 Add-Ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {addOns.map(addon => (
              <div key={addon.name} className="border dark:border-gray-700 rounded-xl p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{addon.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{addon.description}</p>
                </div>
                <span className="text-lg font-black text-purple-600 ml-4">${addon.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Typical Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { metric: '5K–15K', label: 'Article Views', sub: 'avg per sponsored article' },
              { metric: '3–8%', label: 'Click-Through Rate', sub: 'to your CTA link' },
              { metric: '45K+', label: 'Newsletter Reach', sub: 'engaged subscribers' },
              { metric: '100K+', label: 'Social Impressions', sub: 'across all channels' },
            ].map(r => (
              <div key={r.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-3xl font-black">{r.metric}</p>
                <p className="text-sm font-medium mt-1">{r.label}</p>
                <p className="text-xs text-white/60">{r.sub}</p>
              </div>
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
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Brief Received!</h3>
                  <p className="text-gray-600 dark:text-gray-300">Our editorial team will review and respond within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit Content Brief</h3>
                  <div className="space-y-4">
                    <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="text" placeholder="Company / Project" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <select value={formData.packageType} onChange={e => setFormData({ ...formData, packageType: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select Package</option>
                      <option value="Press Release">Press Release ($350)</option>
                      <option value="Sponsored Article">Sponsored Article ($500)</option>
                      <option value="Thought Leadership Package">Thought Leadership ($1,200)</option>
                      <option value="Custom">Custom Campaign</option>
                    </select>
                    <textarea rows={4} required placeholder="Brief: What do you want to communicate? Key messages, target audience, links to include..." value={formData.brief} onChange={e => setFormData({ ...formData, brief: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="submit" className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Submit Brief</button>
                    <button type="button" onClick={() => setShowContactForm(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
