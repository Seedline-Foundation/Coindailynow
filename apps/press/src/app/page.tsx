'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  BarChart3,
  Globe,
  Zap,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Coins,
  Shield,
  ShieldCheck,
  FileText,
  DollarSign,
  Lock,
  Eye,
  Bot,
  Layers,
  Star,
  ExternalLink,
  Target,
  Rocket,
  Award,
  LifeBuoy,
} from 'lucide-react';

/**
 * SENDPRESS Landing Page - press.coindaily.online
 *
 * Two audiences:
 *   1. Site Owners (Partners) — submit their site, earn JOY
 *   2. Media Buyers (Publishers) — distribute PR, buy placements
 *
 * Sections: Hero → Stats → Trusted Logos → For Partners → For Buyers →
 *   Why Choose → How It Works → Pricing → Case Study → CTA → Footer
 */

/* ── Top-tier partner logos (scrolling marquee) ── */
const PARTNER_LOGOS = [
  { name: 'Punch', color: 'text-red-400' },
  { name: 'ThisDay', color: 'text-blue-400' },
  { name: 'The Guardian', color: 'text-blue-300' },
  { name: 'New York Times', color: 'text-white' },
  { name: 'Bloomberg', color: 'text-purple-400' },
  { name: 'CoinDesk', color: 'text-cyan-400' },
  { name: 'TechCrunch', color: 'text-green-400' },
  { name: 'Reuters', color: 'text-orange-400' },
  { name: 'Vanguard', color: 'text-yellow-400' },
  { name: 'The Nation', color: 'text-emerald-400' },
];

const STATS = [
  { value: '5,000+', label: 'Media Partners' },
  { value: '10M+', label: 'Monthly Reach' },
  { value: '3,500+', label: 'Campaigns Run' },
  { value: '98%', label: 'Client Satisfaction' },
];

const PARTNER_BENEFITS = [
  {
    icon: DollarSign,
    title: 'Earn JOY Tokens Passively',
    description: 'Earn 5–500 JOY per placement based on your DH score tier. Average partner earns 1,240 JOY/month with just 3 positions.',
  },
  {
    icon: TrendingUp,
    title: 'SEO Authority Boost',
    description: 'Every press release published on your site includes high-quality, topically relevant backlinks — boosting your Domain Authority by an average of 12 points in 90 days.',
  },
  {
    icon: ShieldCheck,
    title: '24/7/365 Virus Scanning Engine',
    description: 'Our proprietary Virus Agent scans every piece of content before it touches your site. Malicious links, spam, and phishing attempts are blocked in real time — protecting your reputation.',
  },
  {
    icon: Bot,
    title: 'AI-Curated Content Only',
    description: 'Our Ollama3 AI model reviews every press release for quality, factual accuracy, and relevance. Only high-quality content passes — your editorial standards stay intact.',
  },
  {
    icon: Lock,
    title: 'Escrow-Protected Payments',
    description: 'Publisher funds are locked in a smart contract escrow. You get paid only after AI verification confirms correct placement — zero risk of non-payment.',
  },
  {
    icon: Target,
    title: 'Full Control Over Placements',
    description: 'You decide which positions on your site to open (sidebar, feed, sponsored page) and set your own JOY price within your tier range. Pause or remove anytime.',
  },
];

const BUYER_FEATURES = [
  {
    icon: Globe,
    title: 'Access 5,000+ Verified Websites',
    description: 'From Tier-1 outlets like Punch, Guardian & Bloomberg to niche crypto blogs — choose exactly where your PR appears.',
  },
  {
    icon: Bot,
    title: 'AI-Written Press Releases',
    description: 'Don\'t have a press release? Our Ollama3 AI (at ai.coindaily.online) writes professional, SEO-optimized PRs in minutes. Just provide your project details.',
  },
  {
    icon: Eye,
    title: 'Real-Time Verification',
    description: 'Our AI crawls every partner site to verify your PR is live, visible, and correctly placed. See verification status in real time on your dashboard.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track impressions, CTR, engagement, geographic reach and conversion data for every single placement across all partner sites.',
  },
  {
    icon: Layers,
    title: 'Tier-Based Targeting',
    description: 'Choose Bronze (5–20 JOY), Silver (15–50 JOY), Gold (40–150 JOY) or Platinum (100–500 JOY) tier sites based on Domain Health score.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Your JOY tokens stay in escrow until AI verification confirms every placement is live. No results = no payment. 100% protected.',
  },
];

const WHY_CHOOSE = [
  { icon: Shield, title: 'AI-Powered Quality Assurance', desc: 'Every press release passes through multi-layer AI review (Ollama3 + Gemini) for accuracy, quality, and compliance before distribution.' },
  { icon: Zap, title: 'Instant Blockchain Settlements', desc: 'JOY token on Polygon means instant, low-gas-fee settlements. No invoicing, no bank delays, no chargebacks.' },
  { icon: Globe, title: 'Africa-First, Globally Connected', desc: 'Built for African markets with support for 15+ African languages, local exchanges (Luno, Quidax, Valr), and mobile money correlation.' },
  { icon: ShieldCheck, title: '24/7 Anti-Malware Protection', desc: 'Continuous virus scanning, phishing detection, and bad-content filtering protect all partner sites around the clock.' },
  { icon: Users, title: 'Transparent Partner Network', desc: 'Every partner site is scored with a Domain Health (DH) metric. Buyers see real stats — no fake traffic, no inflated numbers.' },
  { icon: Award, title: 'Built by CoinDaily', desc: 'Backed by Africa\'s premier crypto media platform with 2M+ monthly readers, established in 2023. Trusted by top-tier publishers worldwide.' },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '500 JOY',
    period: 'per campaign',
    description: 'Perfect for small projects and first-time PR campaigns.',
    features: ['Up to 5 partner sites', 'Bronze tier sites', 'AI press release writer', 'Basic analytics', '48-hour distribution', 'Email support'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '2,000 JOY',
    period: 'per campaign',
    description: 'For growing projects that need serious reach and visibility.',
    features: ['Up to 25 partner sites', 'Bronze + Silver tiers', 'AI press release writer', 'Advanced analytics & CTR tracking', '24-hour distribution', 'Priority support', 'Social media amplification'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '10,000 JOY',
    period: 'per campaign',
    description: 'Maximum reach across all tiers including Platinum outlets.',
    features: ['Unlimited partner sites', 'All tiers including Platinum', 'AI press release + editing', 'Real-time analytics dashboard', 'Instant distribution', 'Dedicated account manager', 'Custom reporting', 'Multi-language distribution'],
    highlighted: false,
  },
];

export default function PressLandingPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-md border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-xl text-white">SENDPRESS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#pricing" className="text-dark-300 hover:text-white transition-colors">Pricing</a>
            <a href="#partners" className="text-dark-300 hover:text-white transition-colors">For Partners</a>
            <a href="#case-study" className="text-dark-300 hover:text-white transition-colors">Case Study</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-dark-300 hover:text-white transition-colors">Sign In</Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero Section ───── */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-6">
            <Coins className="w-4 h-4 text-primary-500" />
            <span className="text-primary-500 text-sm font-medium">Powered by $JOY Token on Polygon</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight">
            The AI-Powered PR
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Distribution Network</span>
          </h1>

          <p className="text-lg md:text-xl text-dark-300 mb-4 max-w-3xl mx-auto">
            SENDPRESS connects <strong className="text-white">media buyers</strong> with <strong className="text-white">5,000+ verified websites</strong> worldwide.
            Distribute press releases across AI, finance, crypto, and tech publications — with instant blockchain-verified settlements.
          </p>
          <p className="text-md text-dark-400 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a <strong className="text-primary-400">site owner</strong> looking to monetize your traffic or a <strong className="text-primary-400">media buyer</strong> seeking top-tier placements — SENDPRESS has you covered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-lg transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
            >
              <Rocket className="w-5 h-5" />
              Start Your Campaign
            </Link>
            <a
              href="#demo"
              className="px-8 py-3.5 border border-dark-600 hover:border-primary-500/50 text-white rounded-lg transition-all hover:bg-dark-900"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* ───── Stats Section ───── */}
      <section className="py-16 border-y border-dark-800 bg-dark-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-dark-400 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Scrolling Partner Logos ───── */}
      <section className="py-10 border-b border-dark-800 overflow-hidden">
        <p className="text-center text-dark-500 text-sm uppercase tracking-widest mb-6">Trusted by publishers worldwide</p>
        <div className="relative">
          <div className="flex marquee-scroll whitespace-nowrap">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="mx-8 flex items-center gap-2 shrink-0">
                <Globe className={`w-5 h-5 ${logo.color}`} />
                <span className={`text-lg font-bold ${logo.color} opacity-70`}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── For Site Owners (Partners) ───── */}
      <section id="partners" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
              For Site Owners
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Monetize Your Website With Premium PR Content
            </h2>
            <p className="text-dark-400 text-lg max-w-3xl mx-auto">
              Join 5,000+ publishers earning JOY tokens by hosting AI-verified press releases.
              Zero risk. Full control. Passive income from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {PARTNER_BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-dark-900 border border-dark-700 rounded-xl p-6 hover:border-green-500/40 transition-all group"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Partner CTA */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8">
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-1">Ready to Partner With SENDPRESS?</h3>
                <p className="text-dark-400 text-sm">Submit your site for review. Approval within 24 hours. Start earning immediately.</p>
              </div>
              <Link
                href="/register"
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-dark-950 font-bold rounded-lg transition-colors"
              >
                Submit Your Site <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── For Media Buyers ───── */}
      <section className="py-24 px-4 bg-dark-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-400 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
              For Media Buyers
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Distribute Your PR to Top-Tier Publications
            </h2>
            <p className="text-dark-400 text-lg max-w-3xl mx-auto">
              Get your press release published on verified, high-authority websites. AI-written content, escrow-protected payments, and real-time verification — all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUYER_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-dark-950 border border-dark-700 rounded-xl p-6 hover:border-primary-500/40 transition-all group"
              >
                <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Why Choose SENDPRESS ───── */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Why Choose SENDPRESS?
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Built by CoinDaily — Africa&apos;s largest crypto media platform. Trusted by 5,000+ publishers and 3,500+ media buyers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl border border-dark-800 hover:border-dark-600 transition-colors">
                <div className="shrink-0">
                  <item.icon className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="py-24 px-4 bg-dark-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">How It Works</h2>
            <p className="text-dark-400 text-lg">Launch your PR campaign in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create Campaign',
                desc: 'Let our Ollama3 AI write your press release or upload your own. Select target audiences, choose partner websites by tier, and set your JOY budget.',
              },
              {
                step: '2',
                title: 'AI Review & Distribution',
                desc: 'Our AI reviews content for quality and compliance, then distributes across your selected partner network. Funds are locked in escrow automatically.',
              },
              {
                step: '3',
                title: 'Verified & Paid',
                desc: 'Our AI crawler verifies each placement is live and correctly displayed. Once verified, JOY is released from escrow to the partner. You get real-time reports.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-500">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              All plans include AI press release writing, escrow protection, and real-time verification. Pay in JOY tokens on Polygon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 border ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-primary-500/10 to-dark-900 border-primary-500/40 ring-1 ring-primary-500/20 relative'
                    : 'bg-dark-900 border-dark-700'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 text-dark-950 text-xs font-bold rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-dark-400 text-sm mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-dark-500 text-sm ml-2">/ {tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-dark-300">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-primary-500 hover:bg-primary-600 text-dark-950'
                      : 'border border-dark-600 hover:border-primary-500/50 text-white hover:bg-dark-800'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Case Study ───── */}
      <section id="case-study" className="py-24 px-4 bg-dark-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
              Case Study
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
              How FinBridge Reached 2.4M Readers in 72 Hours
            </h2>
          </div>

          <div className="bg-dark-950 border border-dark-700 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-primary-400 font-semibold uppercase text-sm tracking-wider mb-3">The Challenge</h3>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  FinBridge, a DeFi lending protocol launching on Polygon, needed to reach African and global crypto audiences before their token launch.
                  Traditional PR agencies quoted $15,000+ with 2-week timelines and no performance guarantees.
                </p>

                <h3 className="text-primary-400 font-semibold uppercase text-sm tracking-wider mb-3">The Solution</h3>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  Using SENDPRESS, FinBridge&apos;s team used our Ollama3 AI to generate a professional press release in 8 minutes.
                  They selected 22 Gold and Platinum tier partner sites across Nigeria, Kenya, South Africa, and the US, with a total budget of 4,200 JOY tokens.
                </p>

                <h3 className="text-primary-400 font-semibold uppercase text-sm tracking-wider mb-3">The Process</h3>
                <ul className="space-y-2 text-dark-300 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> AI wrote and formatted the press release</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> JOY tokens locked in CreditsEscrow contract</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Content distributed to 22 sites within 6 hours</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> AI verification confirmed 21/22 placements (1 site was paused)</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Escrow released JOY to verified partners automatically</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-400 font-semibold uppercase text-sm tracking-wider mb-3">The Results</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { val: '2.4M', label: 'Total Impressions' },
                    { val: '72hrs', label: 'Time to Full Distribution' },
                    { val: '5.2%', label: 'Average CTR' },
                    { val: '4,200 JOY', label: 'Total Cost' },
                    { val: '21', label: 'Verified Placements' },
                    { val: '8 min', label: 'AI PR Writing Time' },
                  ].map((r) => (
                    <div key={r.label} className="bg-dark-900 border border-dark-700 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary-400">{r.val}</p>
                      <p className="text-dark-500 text-xs mt-1">{r.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-5">
                  <p className="text-dark-300 text-sm italic leading-relaxed">
                    &ldquo;SENDPRESS did in 72 hours what our previous PR agency couldn&apos;t do in 3 weeks.
                    The AI wrote a better press release than our marketing team, and the escrow system meant we only paid for verified placements.
                    We saved over $10,000 compared to traditional PR.&rdquo;
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">AD</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Amara Diallo</p>
                      <p className="text-dark-500 text-xs">Head of Marketing, FinBridge Protocol</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Demo Video Placeholder ───── */}
      <section id="demo" className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">See SENDPRESS in Action</h2>
            <p className="text-dark-400">Watch how easy it is to distribute your press release to thousands of websites.</p>
          </div>
          <div className="aspect-video bg-dark-900 border border-dark-700 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-0 h-0 border-l-[20px] border-l-primary-500 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
              </div>
              <p className="text-dark-400">Demo video coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-24 px-4 bg-gradient-to-b from-dark-900/50 to-dark-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-dark-400 text-lg mb-8 max-w-2xl mx-auto">
            Join 3,500+ projects that have successfully launched PR campaigns with SENDPRESS.
            Or submit your site and start earning JOY tokens today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-lg transition-all shadow-lg shadow-primary-500/20"
            >
              <Rocket className="w-5 h-5" />
              Start Your Campaign
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-4 border border-green-500/50 hover:border-green-500 text-green-400 hover:text-green-300 rounded-lg transition-all"
            >
              <Globe className="w-5 h-5" />
              Submit Your Site
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="py-16 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-7 h-7 text-primary-500" />
                <span className="font-display font-bold text-lg text-white">SENDPRESS</span>
              </div>
              <p className="text-dark-400 text-sm leading-relaxed mb-4">
                Africa&apos;s largest AI-powered PR distribution network. Built by CoinDaily.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://discord.gg/coindaily"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center transition-colors"
                  title="Discord"
                >
                  <LifeBuoy className="w-4 h-4 text-dark-400" />
                </a>
                <a
                  href="https://x.com/coindaily"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-dark-800 hover:bg-dark-700 rounded-lg flex items-center justify-center transition-colors"
                  title="X / Twitter"
                >
                  <ExternalLink className="w-4 h-4 text-dark-400" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#pricing" className="text-dark-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#partners" className="text-dark-400 hover:text-white transition-colors">For Site Owners</a></li>
                <li><a href="#case-study" className="text-dark-400 hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#demo" className="text-dark-400 hover:text-white transition-colors">Watch Demo</a></li>
                <li><Link href="/dashboard" className="text-dark-400 hover:text-white transition-colors">Publisher Dashboard</Link></li>
                <li><Link href="/partner" className="text-dark-400 hover:text-white transition-colors">Partner Dashboard</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/terms" className="text-dark-400 hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="text-dark-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-dark-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="https://discord.gg/coindaily" target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-white transition-colors flex items-center gap-1.5">
                    Help Center (Discord) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li><a href="mailto:press@coindaily.online" className="text-dark-400 hover:text-white transition-colors">press@coindaily.online</a></li>
                <li>
                  <a href="https://imaswap.online" target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-white transition-colors flex items-center gap-1.5">
                    Buy JOY Token <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-dark-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-dark-500 text-sm">
              &copy; {new Date().getFullYear()} CoinDaily Technologies Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-dark-500 hover:text-dark-300 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-dark-500 hover:text-dark-300 transition-colors">Privacy</Link>
              <a href="https://discord.gg/coindaily" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-dark-300 transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
