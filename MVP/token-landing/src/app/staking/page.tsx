'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function StakingPage() {
  const stakingTiers = [
    { 
      name: 'Flexible', 
      apr: '2%', 
      lockPeriod: '7 days notice', 
      multiplier: '1x',
      description: 'Unstake anytime with 7-day cooldown'
    },
    { 
      name: '6 Months', 
      apr: '8%', 
      lockPeriod: '6 months', 
      multiplier: '1.5x',
      description: 'Medium-term commitment'
    },
    { 
      name: '12 Months', 
      apr: '30%', 
      lockPeriod: '12 months', 
      multiplier: '2x',
      description: 'Long-term holder rewards',
      highlight: true
    },
    { 
      name: '24 Months', 
      apr: '70%', 
      lockPeriod: '24 months', 
      multiplier: '3x',
      description: 'Maximum rewards & governance',
      highlight: true
    },
  ];

  const benefits = [
    'Real yield from platform revenue (not inflation)',
    'Automatic compounding of rewards',
    'Governance voting power (multiplied by tier)',
    'No early unstaking allowed (maintains scarcity)',
    '7-day cooldown after lock expires (security measure)',
    'Rewards paid in $JY + protocol revenue (USDC/ETH)',
  ];

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Staking Rewards</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Earn up to 70% APR by staking $JY tokens
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Real yield backed by platform revenue, not inflation
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-gradient-to-br from-primary-600/20 to-primary-400/20 border border-primary-500/50 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold gradient-text mb-3">70%</div>
            <div className="text-xl text-white mb-2">Max APR</div>
            <div className="text-sm text-gray-400">24-month lock</div>
          </div>
          <div className="bg-gradient-to-br from-accent-600/20 to-accent-400/20 border border-accent-500/50 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold gradient-text mb-3">1.8M</div>
            <div className="text-xl text-white mb-2">Reward Pool</div>
            <div className="text-sm text-gray-400">36% of supply (5 years)</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/20 border border-green-500/50 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-green-400 mb-3">3x</div>
            <div className="text-xl text-white mb-2">Voting Power</div>
            <div className="text-sm text-gray-400">Top tier stakers</div>
          </div>
        </motion.div>

        {/* Staking Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Staking Tiers</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stakingTiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-gray-900 border-2 rounded-2xl p-6 hover:scale-105 transition-transform ${
                  tier.highlight ? 'border-primary-500 bg-gradient-to-br from-primary-500/10 to-transparent' : 'border-gray-800'
                }`}
              >
                {tier.highlight && (
                  <div className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    BEST VALUE
                  </div>
                )}
                <div className="text-3xl font-bold gradient-text mb-2">{tier.apr}</div>
                <div className="text-xl text-white mb-2">{tier.name}</div>
                <div className="text-sm text-gray-400 mb-4">{tier.description}</div>
                <div className="space-y-2 text-sm text-gray-400 border-t border-gray-800 pt-4">
                  <div className="flex justify-between">
                    <span>Lock Period:</span>
                    <span className="text-white">{tier.lockPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vote Power:</span>
                    <span className="text-primary-400 font-bold">{tier.multiplier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How Staking Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                1️⃣
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Choose Tier</h3>
              <p className="text-gray-400">Select lock period (flexible to 24 months)</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                2️⃣
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lock Tokens</h3>
              <p className="text-gray-400">Tokens locked in audited smart contract</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                3️⃣
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Earn Rewards</h3>
              <p className="text-gray-400">Auto-compound from real yield sources</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                4️⃣
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Claim & Unstake</h3>
              <p className="text-gray-400">After cliff + 7-day cooldown period</p>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Staker Benefits</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-primary-400 flex-shrink-0 mt-1" />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reward Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Real Yield Sources</h2>
          <p className="text-gray-400 text-center mb-8">Rewards funded by actual revenue, not token inflation</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-primary-400 mb-3">Protocol Revenue</h3>
              <p className="text-gray-300 mb-2">Platform fees & transaction revenue</p>
              <p className="text-sm text-gray-400">Paid in USDC/ETH</p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-accent-400 mb-3">Ecosystem Fund</h3>
              <p className="text-gray-300 mb-2">1.8M $JY dedicated reward pool</p>
              <p className="text-sm text-gray-400">Vested over 5+ years</p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">�</div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Buyback Revenue</h3>
              <p className="text-gray-300 mb-2">50% of platform revenue</p>
              <p className="text-sm text-gray-400">Used for buyback & distribution</p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-center text-gray-300">
              <strong className="text-white">Reward Compounding:</strong> All rewards automatically re-staked into your chosen pool to maximize returns
            </p>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">🔒 Security & Anti-Dump Measures</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-6 bg-black/30 rounded-lg">
              <h3 className="text-xl font-bold text-primary-400 mb-3">✅ No Early Unstaking</h3>
              <p className="text-gray-300">Smart contract prevents withdrawal until lock period expires. Maintains scarcity and long-term alignment.</p>
            </div>
            <div className="p-6 bg-black/30 rounded-lg">
              <h3 className="text-xl font-bold text-accent-400 mb-3">⏰ 7-Day Cooldown</h3>
              <p className="text-gray-300">After lock expires, mandatory 7-day unstaking period prevents rapid market exits.</p>
            </div>
            <div className="p-6 bg-black/30 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-3">🔐 CertiK Audited</h3>
              <p className="text-gray-300">Smart contracts audited by CertiK, industry-leading blockchain security firm.</p>
            </div>
            <div className="p-6 bg-black/30 rounded-lg">
              <h3 className="text-xl font-bold text-blue-400 mb-3">📊 100% Transparent</h3>
              <p className="text-gray-300">All staking data verifiable on-chain. Open source code published on GitHub.</p>
            </div>
          </div>
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-center text-gray-300">
              <strong className="text-red-400">Important:</strong> Penalties for malicious governance behavior result in staked $JY being burned, further enhancing deflationary nature
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="text-center"
        >
          <Link
            href="/presale"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-12 py-5 rounded-full text-xl font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all mb-6"
          >
            Start Staking After Presale →
          </Link>
          <div>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
