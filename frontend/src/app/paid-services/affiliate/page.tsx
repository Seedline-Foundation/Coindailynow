'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const commissionTiers = [
  {
    name: 'Bronze',
    requirement: '0–10 referrals/month',
    commissions: [
      { product: 'Pro Membership ($29/mo)', rate: '20%', payout: '$5.80/sale' },
      { product: 'Enterprise Membership ($199/mo)', rate: '15%', payout: '$29.85/sale' },
      { product: 'API Developer ($49/mo)', rate: '15%', payout: '$7.35/sale' },
      { product: 'Marketplace Products', rate: '10%', payout: 'Varies' },
    ],
    extras: ['30-day cookie window', 'Monthly payouts', 'Basic analytics dashboard'],
    color: 'bg-amber-700',
  },
  {
    name: 'Silver',
    requirement: '11–50 referrals/month',
    commissions: [
      { product: 'Pro Membership ($29/mo)', rate: '25%', payout: '$7.25/sale' },
      { product: 'Enterprise Membership ($199/mo)', rate: '20%', payout: '$39.80/sale' },
      { product: 'API Developer ($49/mo)', rate: '20%', payout: '$9.80/sale' },
      { product: 'Marketplace Products', rate: '15%', payout: 'Varies' },
    ],
    extras: ['60-day cookie window', 'Bi-weekly payouts', 'Advanced analytics', 'Custom referral links'],
    color: 'bg-gray-400',
  },
  {
    name: 'Gold',
    requirement: '51+ referrals/month',
    commissions: [
      { product: 'Pro Membership ($29/mo)', rate: '30%', payout: '$8.70/sale' },
      { product: 'Enterprise Membership ($199/mo)', rate: '25%', payout: '$49.75/sale' },
      { product: 'API Developer ($49/mo)', rate: '25%', payout: '$12.25/sale' },
      { product: 'Marketplace Products', rate: '20%', payout: 'Varies' },
    ],
    extras: ['90-day cookie window', 'Weekly payouts', 'Dedicated affiliate manager', 'Custom landing pages', 'Priority support', 'Co-branded content'],
    color: 'bg-yellow-500',
  },
];

const payoutMethods = [
  { method: 'USDT (TRC-20)', min: '$20', timing: 'Within 48h', icon: '₮' },
  { method: 'Bitcoin (BTC)', min: '$50', timing: 'Within 48h', icon: '₿' },
  { method: 'M-Pesa', min: '$10', timing: 'Instant (Kenya)', icon: '📱' },
  { method: 'Bank Transfer', min: '$50', timing: '3–5 business days', icon: '🏦' },
  { method: 'PayPal', min: '$25', timing: 'Within 24h', icon: '💳' },
];

const steps = [
  { step: 1, title: 'Sign Up', description: 'Create your free affiliate account in under 2 minutes. No approval wait — start immediately.', icon: '📝' },
  { step: 2, title: 'Share Your Link', description: 'Get your unique referral link and share it via your blog, social media, YouTube, Telegram group, or email.', icon: '🔗' },
  { step: 3, title: 'Earn Commissions', description: 'Earn commission every time someone subscribes through your link. Recurring commissions for subscriptions!', icon: '💰' },
  { step: 4, title: 'Get Paid', description: 'Withdraw earnings via crypto, M-Pesa, PayPal, or bank transfer. Low minimums, fast payouts.', icon: '🏧' },
];

export default function AffiliatePage() {
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', country: '', audience: '', promotion: '', reason: '' });
  const [sites, setSites] = useState([{ url: '', type: 'website' }]);
  const [submitted, setSubmitted] = useState(false);

  const addSite = () => { if (sites.length < 10) setSites([...sites, { url: '', type: 'website' }]); };
  const removeSite = (i: number) => setSites(sites.filter((_, idx) => idx !== i));
  const updateSite = (i: number, field: 'url' | 'type', value: string) => {
    const updated = [...sites]; updated[i] = { ...updated[i], [field]: value }; setSites(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowApply(false); }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
            🤝 Affiliate &amp; Referral Program
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Earn Up to 30% Recurring Commission
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Join CoinDaily&apos;s affiliate program and earn recurring commissions by referring crypto enthusiasts,
            traders, and businesses to Africa&apos;s leading crypto intelligence platform.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowApply(true)} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg transition-all">
              Join Affiliate Program →
            </button>
            <Link href="/paid-services" className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:border-green-500 transition-all">
              ← All Paid Services
            </Link>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Max Commission', value: '30%', icon: '💰' },
            { label: 'Cookie Duration', value: '90 days', icon: '🍪' },
            { label: 'Payout Minimum', value: '$10', icon: '💵' },
            { label: 'Recurring Revenue', value: '✓ Yes', icon: '🔄' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-green-600">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map(s => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{s.icon}</div>
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">{s.step}</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{s.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Tiers */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Commission Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {commissionTiers.map(tier => (
            <div key={tier.name} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-t-4 ${tier.name === 'Gold' ? 'border-yellow-500' : tier.name === 'Silver' ? 'border-gray-400' : 'border-amber-700'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${tier.color} rounded-full flex items-center justify-center text-white text-xl`}>
                  {tier.name === 'Gold' ? '🥇' : tier.name === 'Silver' ? '🥈' : '🥉'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                  <p className="text-xs text-gray-500">{tier.requirement}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {tier.commissions.map(c => (
                  <div key={c.product} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex-1">{c.product}</span>
                    <span className="font-bold text-green-600 w-12 text-right">{c.rate}</span>
                  </div>
                ))}
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Includes</p>
                <ul className="space-y-1">
                  {tier.extras.map(e => (
                    <li key={e} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-green-500">✓</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Payout Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Payout Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {payoutMethods.map(pm => (
              <div key={pm.method} className="text-center p-4 border dark:border-gray-700 rounded-xl">
                <p className="text-3xl mb-2">{pm.icon}</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{pm.method}</p>
                <p className="text-xs text-gray-500 mt-1">Min: {pm.min}</p>
                <p className="text-xs text-green-600 mt-1">{pm.timing}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earning Calculator */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">💰 Earnings Example</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <p className="text-4xl font-black">$174</p>
              <p className="text-sm mt-2 text-white/80">10 Pro referrals/mo @ 30%</p>
              <p className="text-xs text-white/60">$8.70 × 10 recurring</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <p className="text-4xl font-black">$870</p>
              <p className="text-sm mt-2 text-white/80">50 Pro referrals/mo @ 30%</p>
              <p className="text-xs text-white/60">$8.70 × 50 recurring + bonuses</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <p className="text-4xl font-black">$2,485</p>
              <p className="text-sm mt-2 text-white/80">50 Enterprise referrals/mo</p>
              <p className="text-xs text-white/60">$49.75 × 50 recurring</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <button onClick={() => setShowApply(true)} className="px-10 py-4 bg-green-600 text-white text-lg font-bold rounded-xl hover:bg-green-700 shadow-lg transition-all">
            Start Earning Today — Join Free →
          </button>
          <p className="text-sm text-gray-500 mt-3">No approval wait. Instant access. Recurring commissions.</p>
        </div>

        {/* Application Modal */}
        {showApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApply(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              {submitted ? (
                <div className="text-center py-8">
                  <p className="text-5xl mb-4">🎉</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the Program!</h3>
                  <p className="text-gray-600 dark:text-gray-300">Check your email for your affiliate dashboard login.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Join Affiliate Program</h3>
                  <div className="space-y-4">
                    <input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <select value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select Country</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Kenya">Kenya</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Ethiopia">Ethiopia</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Cameroon">Cameroon</option>
                      <option value="Senegal">Senegal</option>
                      <option value="Other">Other</option>
                    </select>
                    <select value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Total Audience Size (across all platforms)</option>
                      <option value="<1000">Under 1,000</option>
                      <option value="1000-10000">1,000 – 10,000</option>
                      <option value="10000-50000">10,000 – 50,000</option>
                      <option value="50000+">50,000+</option>
                    </select>
                    <select value={formData.promotion} onChange={e => setFormData({ ...formData, promotion: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Primary Promotion Method</option>
                      <option value="blog">Blog / Website</option>
                      <option value="youtube">YouTube</option>
                      <option value="twitter">X (Twitter)</option>
                      <option value="telegram">Telegram Group</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                      <option value="email">Email Newsletter</option>
                      <option value="podcast">Podcast</option>
                      <option value="other">Other</option>
                    </select>

                    {/* Sites / Platforms where link will be displayed */}
                    <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">Sites &amp; Platforms</p>
                          <p className="text-xs text-gray-500">List the websites, channels, or pages where you&apos;ll display your affiliate link</p>
                        </div>
                        {sites.length < 10 && (
                          <button type="button" onClick={addSite} className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all">
                            + Add Site
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {sites.map((site, i) => (
                          <div key={i} className="flex gap-2">
                            <select value={site.type} onChange={e => updateSite(i, 'type', e.target.value)} className="w-36 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                              <option value="website">Website</option>
                              <option value="blog">Blog</option>
                              <option value="youtube">YouTube</option>
                              <option value="twitter">X / Twitter</option>
                              <option value="telegram">Telegram</option>
                              <option value="tiktok">TikTok</option>
                              <option value="instagram">Instagram</option>
                              <option value="facebook">Facebook</option>
                              <option value="newsletter">Newsletter</option>
                              <option value="podcast">Podcast</option>
                              <option value="other">Other</option>
                            </select>
                            <input type="url" required placeholder="https://..." value={site.url} onChange={e => updateSite(i, 'url', e.target.value)}
                              className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                            {sites.length > 1 && (
                              <button type="button" onClick={() => removeSite(i)} className="px-2 text-red-400 hover:text-red-600 text-lg font-bold">&times;</button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{sites.length}/10 sites added</p>
                    </div>

                    <textarea placeholder="Why do you want to join? Tell us about your experience with crypto content... (optional)" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
                  </div>
                  <div className="flex gap-3 mt-6 sticky bottom-0 bg-white dark:bg-gray-800 pt-2 pb-1">
                    <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">Submit Application</button>
                    <button type="button" onClick={() => setShowApply(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">Cancel</button>
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
