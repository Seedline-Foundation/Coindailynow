'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Basic access to Africa crypto regulation data',
    cta: 'Current Plan',
    ctaDisabled: true,
    popular: false,
    features: [
      { text: '12 country overviews', included: true },
      { text: 'Basic regulation status', included: true },
      { text: 'Exchange listings', included: true },
      { text: 'Country comparison (3 max)', included: true },
      { text: 'Weekly email digest', included: true },
      { text: 'Full analysis & risk scores', included: false },
      { text: 'Regulatory event timeline', included: false },
      { text: 'Tax framework details', included: false },
      { text: 'CBDC progress tracking', included: false },
      { text: 'Expert editorial views', included: false },
      { text: 'API access', included: false },
      { text: 'CSV data export', included: false },
      { text: 'Real-time regulatory alerts', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    originalPrice: 49,
    interval: 'month',
    description: 'Full regulatory intelligence for professionals',
    cta: 'Start 7-Day Free Trial',
    ctaDisabled: false,
    popular: true,
    features: [
      { text: '14+ country deep analysis', included: true },
      { text: 'Full regulation details & history', included: true },
      { text: 'Exchange listings & licensing info', included: true },
      { text: 'Unlimited country comparison', included: true },
      { text: 'Daily email digest + alerts', included: true },
      { text: 'Risk scores & compliance ratings', included: true },
      { text: 'Full regulatory event timeline', included: true },
      { text: 'Tax framework & capital gains details', included: true },
      { text: 'CBDC progress tracking', included: true },
      { text: 'Expert editorial views & analysis', included: true },
      { text: 'API access (1,000 req/day)', included: true },
      { text: 'CSV & PDF data export', included: true },
      { text: 'Real-time regulatory alerts', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'For exchanges, funds, and compliance teams',
    cta: 'Contact Sales',
    ctaDisabled: false,
    popular: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Custom country coverage', included: true },
      { text: 'White-label regulatory data', included: true },
      { text: 'Unlimited API access', included: true },
      { text: 'Dedicated compliance dashboard', included: true },
      { text: 'Priority regulatory alerts', included: true },
      { text: 'Custom reports & analysis', included: true },
      { text: 'Regulatory body contact directory', included: true },
      { text: 'Policy impact assessments', included: true },
      { text: 'Direct analyst access', included: true },
      { text: 'SLA-backed uptime', included: true },
      { text: 'Multi-seat team access', included: true },
      { text: 'Quarterly strategy briefings', included: true },
    ],
  },
];

const testimonials = [
  { name: 'Adebayo O.', role: 'Compliance Officer, Quidax', text: 'CoinDaily Pro saved our compliance team 20+ hours per month tracking regulatory changes across Africa.', avatar: '🧑🏾‍💼' },
  { name: 'Fatima K.', role: 'Fund Manager, Cape Town', text: 'The expert analysis and risk scores are invaluable for our African crypto fund. Worth every cent.', avatar: '👩🏽‍💼' },
  { name: 'Samuel M.', role: 'Fintech Founder, Nairobi', text: 'The API access lets us embed regulation data directly into our app. Our users love it.', avatar: '👨🏿‍💻' },
];

const faqs = [
  { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, M-Pesa, bank transfer, and cryptocurrency (BTC, ETH, USDT). All payments are processed securely.' },
  { q: 'Can I cancel at any time?', a: 'Yes, you can cancel your subscription at any time. Your access continues until the end of your billing period.' },
  { q: 'Is there a free trial?', a: 'Yes! Pro plans include a 7-day free trial with full access. No charge until the trial ends.' },
  { q: 'How often is regulatory data updated?', a: 'Our team monitors regulatory changes daily. Pro members receive real-time alerts within hours of policy announcements.' },
  { q: 'Do you cover all African countries?', a: 'We currently cover 14 countries in depth, with basic data for 20+ more. Enterprise customers can request custom country coverage.' },
  { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan at any time. Upgrades take effect immediately; downgrades apply at the next billing cycle.' },
];

export default function MembershipPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price === 0) return 0;
    return billingCycle === 'annual' ? Math.round(plan.price * 0.8) : plan.price;
  };

  const handleSubscribe = async (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@coindaily.africa?subject=Enterprise%20Membership%20Inquiry';
      return;
    }
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);

    // Store membership status
    if (typeof window !== 'undefined') {
      localStorage.setItem('membership_tier', selectedPlan || 'pro');
      localStorage.setItem('membership_active', 'true');
      localStorage.setItem('membership_started', new Date().toISOString());
    }

    // Redirect to premium regulation page after 2 seconds
    setTimeout(() => {
      window.location.href = '/regulation/premium';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            👑 CoinDaily Premium Membership
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Africa's #1 Crypto Regulatory Intelligence
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Deep-dive analysis, risk scores, tax frameworks, CBDC tracking, and expert editorial views
            on cryptocurrency regulations across Africa. Built for compliance teams, fund managers, and fintech founders.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-xl p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${billingCycle === 'annual' ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Annual <span className="text-xs text-green-500 font-bold ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col ${plan.popular ? 'ring-2 ring-orange-500 scale-[1.02]' : 'border border-gray-200 dark:border-gray-700'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>

              <div className="mb-6">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                ) : (
                  <div className="flex items-baseline gap-2">
                    {plan.originalPrice && billingCycle === 'monthly' && (
                      <span className="text-lg text-gray-400 line-through">${plan.originalPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">${getPrice(plan)}</span>
                    <span className="text-gray-500 dark:text-gray-400">/{billingCycle === 'annual' ? 'mo' : plan.interval}</span>
                  </div>
                )}
                {billingCycle === 'annual' && plan.price > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Billed ${getPrice(plan) * 12}/year
                  </p>
                )}
              </div>

              <button
                onClick={() => !plan.ctaDisabled && handleSubscribe(plan.id)}
                disabled={plan.ctaDisabled}
                className={`w-full py-3 rounded-xl font-semibold text-center transition-colors mb-6 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg'
                    : plan.ctaDisabled
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {f.included ? (
                      <span className="text-green-500 mt-0.5">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 mt-0.5">✗</span>
                    )}
                    <span className={f.included ? 'text-gray-700 dark:text-gray-300 text-sm' : 'text-gray-400 dark:text-gray-600 text-sm'}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Trusted by Africa's Crypto Leaders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{faq.q}</span>
                  <span className="text-gray-400 text-xl">{expandedFaq === i ? '−' : '+'}</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-center text-white mb-8">
          <h2 className="text-3xl font-bold mb-3">Ready to Stay Ahead of Africa's Crypto Regulations?</h2>
          <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
            Join 2,500+ compliance professionals, fund managers, and fintech founders using CoinDaily Pro.
          </p>
          <button
            onClick={() => handleSubscribe('pro')}
            className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-lg text-lg"
          >
            Start Your 7-Day Free Trial →
          </button>
        </div>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
            {success ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Pro!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your membership is now active. Redirecting to your premium regulation dashboard...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Enterprise'}
                  </h3>
                  <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPlan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                    </span>
                    <span className="font-bold text-orange-600">
                      ${selectedPlan === 'pro' ? (billingCycle === 'annual' ? '23' : '29') : '199'}/{billingCycle === 'annual' ? 'mo' : 'mo'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">7-day free trial included • Cancel anytime</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Your Company"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'card', label: '💳 Card', desc: 'Visa / Mastercard' },
                      { id: 'mpesa', label: '📱 M-Pesa', desc: 'Mobile Money' },
                      { id: 'crypto', label: '₿ Crypto', desc: 'BTC / ETH / USDT' },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-lg border text-center text-sm transition-colors ${
                          paymentMethod === m.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{m.label}</div>
                        <div className="text-xs text-gray-500">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3 mb-6">
                    <input type="text" placeholder="Card Number" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM/YY" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      <input type="text" placeholder="CVC" className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                )}
                {paymentMethod === 'mpesa' && (
                  <div className="mb-6">
                    <input type="tel" placeholder="M-Pesa Phone Number" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <p className="text-xs text-gray-500 mt-1">You'll receive an M-Pesa payment prompt on your phone</p>
                  </div>
                )}
                {paymentMethod === 'crypto' && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Send payment to:</p>
                    <p className="font-mono text-xs text-gray-800 dark:text-gray-200 mt-1 break-all bg-white dark:bg-gray-600 p-2 rounded">0x1a2b3c4d5e6f7890abcdef1234567890abcdef12</p>
                    <p className="text-xs text-gray-500 mt-2">Supports BTC, ETH, USDT (ERC-20). Payment confirmed within 10 minutes.</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    'Start Free Trial'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  🔒 Secured by SSL encryption. By subscribing you agree to our Terms of Service.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
