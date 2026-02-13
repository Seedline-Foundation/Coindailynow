'use client';

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
  Coins
} from 'lucide-react';

/**
 * PR System Landing Page - press.coindaily.online
 * 
 * Public landing page for the PR & Ad Distribution Network.
 * Showcases the platform and directs operators to login/register.
 */

const FEATURES = [
  {
    icon: Globe,
    title: 'Global Distribution',
    description: 'Reach millions across 200+ crypto news outlets, social channels, and Web3 communities.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Targeting',
    description: 'Our AI analyzes your content and matches it with the perfect audience segments.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track impressions, engagement, and conversions in real-time with detailed reports.',
  },
  {
    icon: Coins,
    title: '$COIN Powered',
    description: 'Pay with $COIN tokens for discounts and earn rewards for successful campaigns.',
  },
];

const STATS = [
  { value: '500+', label: 'Media Partners' },
  { value: '10M+', label: 'Monthly Reach' },
  { value: '2,500+', label: 'Campaigns Run' },
  { value: '98%', label: 'Client Satisfaction' },
];

export default function PressLandingPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-xl text-white">CoinDaily Press</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-dark-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/partners" className="text-dark-300 hover:text-white transition-colors">
              Partners
            </Link>
            <Link href="/case-studies" className="text-dark-300 hover:text-white transition-colors">
              Case Studies
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-dark-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full mb-6">
            <Coins className="w-4 h-4 text-primary-500" />
            <span className="text-primary-500 text-sm font-medium">Powered by $COIN Token</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
            Web3 PR & Advertising
            <br />
            <span className="text-primary-500">Distribution Network</span>
          </h1>

          <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
            Amplify your crypto project with our AI-powered PR distribution network. 
            Reach millions of investors, enthusiasts, and decision-makers instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
            >
              Start Your Campaign
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 border border-dark-600 hover:border-dark-500 text-white rounded-lg transition-colors"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-dark-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-dark-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Why Choose CoinDaily Press?
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              The most powerful PR distribution platform built specifically for the crypto ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="bg-dark-900 border border-dark-700 rounded-xl p-6 hover:border-primary-500/50 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-primary-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-dark-400 text-lg">
              Launch your PR campaign in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-500">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create Campaign</h3>
              <p className="text-dark-400">
                Upload your press release, select target audiences, and set your budget.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-500">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Optimization</h3>
              <p className="text-dark-400">
                Our AI analyzes and optimizes your content for maximum engagement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-500">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Global Distribution</h3>
              <p className="text-dark-400">
                Your content is distributed across our network of 500+ media partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Amplify Your Message?
          </h2>
          <p className="text-dark-400 text-lg mb-8">
            Join 2,500+ crypto projects that have successfully launched their PR campaigns with us.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary-500" />
              <span className="font-display font-bold text-white">CoinDaily Press</span>
            </div>
            <p className="text-dark-500 text-sm">
              © {new Date().getFullYear()} CoinDaily. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
