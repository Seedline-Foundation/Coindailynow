'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import EmailCapture from '@/components/EmailCapture';

export default function AmbassadorPage() {
  const benefits = [
    { title: 'Exclusive Token Allocation', description: 'Receive bonus JY tokens for reaching milestones' },
    { title: 'Monthly Rewards', description: 'Earn commission on referrals and community growth' },
    { title: 'VIP Access', description: 'Early access to new features and platform updates' },
    { title: 'Leadership Recognition', description: 'Featured on our website and social media' },
    { title: 'Training & Support', description: 'Access to exclusive educational content and resources' },
    { title: 'Network Growth', description: 'Build your personal brand in African crypto space' },
  ];

  const requirements = [
    'Active presence on social media (Twitter, Telegram, Discord)',
    'Passion for cryptocurrency and blockchain technology',
    'Based in or familiar with African crypto markets',
    'Strong communication skills in English (+ local languages bonus)',
    'Committed to promoting Joy Token and CoinDaily ethically',
    'Minimum 500 followers on primary social platform',
  ];

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Ambassador Program</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Become a leader in Africa's crypto revolution. Earn rewards while building the future.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Ambassador Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-primary-500 transition-all">
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Requirements</h2>
          <ul className="space-y-4 max-w-3xl mx-auto">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300">
                <span className="text-primary-500 font-bold mt-1">✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Application Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How to Apply</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold text-white mb-2">Join Whitelist</h3>
              <p className="text-gray-300">Subscribe with your email below</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold text-white mb-2">Complete Form</h3>
              <p className="text-gray-300">Fill out detailed ambassador application</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold text-white mb-2">Get Approved</h3>
              <p className="text-gray-300">Team review and onboarding process</p>
            </div>
          </div>
        </motion.div>

        {/* Application Form */}
        <div className="mb-16">
          <EmailCapture variant="presale" />
          <p className="text-center text-gray-400 mt-6">
            After subscribing, you'll receive the full ambassador application form via email.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold transition-all">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
