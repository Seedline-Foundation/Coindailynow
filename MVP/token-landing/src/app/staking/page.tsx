'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function StakingPage() {
  const stakingTiers = [
    { 
      name: '7 Days (Flexible)', 
      apr: '1%', 
      lockPeriod: 'Flexible unlock', 
      multiplier: '0x',
      description: 'Test the waters - Low commitment, low rewards'
    },
    { 
      name: '6 Months (Steady)', 
      apr: '10%', 
      lockPeriod: '6 months cliff', 
      multiplier: '1.2x',
      description: 'Medium commitment - Steady returns'
    },
    { 
      name: '9 Months (Whale Prison)', 
      apr: '70%', 
      lockPeriod: '9 months cliff', 
      multiplier: '1.5x',
      description: 'Whale Prison - Earn 70% APR from 9 months',
      highlight: true
    },
    { 
      name: '24 Months (Diamond Hands)', 
      apr: '90%', 
      lockPeriod: '24 months cliff', 
      multiplier: '2.5x',
      description: 'Diamond Hands - 90% APR after 16th month',
      highlight: true
    },
  ];

  const benefits = [
    'Real yield from platform revenue (not inflation)',
    'Automatic compounding of rewards',
    'Governance voting power (multiplied by tier)',
    'No early unstaking allowed (maintains scarcity)',
    '7-day cooldown after lock expires (security measure)',
    'Rewards paid in $JY + protocol revenue in USDC',
    'OG perks: 2.5x APY multipliers for early stakers',
    'Whale Laddering: Top 12 wallets earn 120K bonus JY',
  ];

  return (
    <div className="min-h-screen bg-black py-20 relative overflow-hidden">
      {/* Animated Background - Mining Treasury */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <svg className="absolute w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <g className="animate-pulse-slow">
            <ellipse cx="600" cy="450" rx="130" ry="150" fill="url(#bagGradient)" opacity="0.6" />
            <path d="M 540 360 Q 600 320 660 360 L 660 480 Q 600 520 540 480 Z" fill="url(#bagGradient)" opacity="0.7" stroke="#FCD34D" strokeWidth="2" />
            <circle cx="600" cy="380" r="8" fill="#D97706" opacity="0.5" />
            <circle cx="580" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <circle cx="620" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <text x="600" y="450" textAnchor="middle" fill="#FCD34D" fontSize="42" fontWeight="bold" opacity="0.8">JY</text>
          </g>
          <g className="token-from-top"><circle cx="600" cy="50" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 0 400; 0 400" dur="4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-left"><circle cx="50" cy="450" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 550 0; 550 0" dur="4.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4.5s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-right"><circle cx="1150" cy="450" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; -550 0; -550 0" dur="5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="5s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-bottom"><circle cx="600" cy="750" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 0 -300; 0 -300" dur="4.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4.2s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-1"><circle cx="200" cy="100" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 400 350; 400 350" dur="4.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="4.8s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-2"><circle cx="1000" cy="100" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -400 350; -400 350" dur="5.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="5.2s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-3"><circle cx="250" cy="700" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 350 -250; 350 -250" dur="4.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="4.6s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-4"><circle cx="950" cy="700" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -350 -250; -350 -250" dur="5.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="5.4s" repeatCount="indefinite" /></circle></g>
          <g className="animate-bounce-slow">
            <ellipse cx="400" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 370 450 Q 365 470 380 485 L 420 480 Q 425 465 410 450 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 30 -15; 0 0" dur="2s" repeatCount="indefinite" /></path>
            <rect x="415" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="405" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>
          <g className="animate-bounce-slow">
            <ellipse cx="800" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 830 450 Q 835 470 820 485 L 780 480 Q 775 465 790 450 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -30 -15; 0 0" dur="2.3s" repeatCount="indefinite" /></path>
            <rect x="777" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="787" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>
          <defs>
            <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
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
            Earn up to 90% APR by staking $JY tokens
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            70% APR for 9 months, then 90% APR for 24-month Diamond Hands. Real yield backed by platform revenue.
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
            <div className="text-5xl font-bold gradient-text mb-3">90%</div>
            <div className="text-xl text-white mb-2">Max APR</div>
            <div className="text-sm text-gray-400">After 9th month for 24-month stakers</div>
          </div>
          <div className="bg-gradient-to-br from-accent-600/20 to-accent-400/20 border border-accent-500/50 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold gradient-text mb-3">1.1M</div>
            <div className="text-xl text-white mb-2">Ecosystem Pool</div>
            <div className="text-sm text-gray-400">18.3% of supply (48 months)</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/20 border border-green-500/50 rounded-2xl p-8 text-center">
            <div className="text-5xl font-bold text-green-400 mb-3">2.5x</div>
            <div className="text-xl text-white mb-2">Voting Power</div>
            <div className="text-sm text-gray-400">Diamond Hands stakers</div>
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
          <p className="text-gray-400 text-center mb-8">Rewards funded by actual revenue, not token inflation:</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-accent-400 mb-3">Ecosystem Fund</h3>
              <p className="text-gray-300 mb-2">1.1M $JY dedicated reward pool</p>
              <p className="text-sm text-gray-400">Vested over 48 months</p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-primary-400 mb-3">Protocol Revenue</h3>
              <p className="text-gray-300 mb-2">Platform fees & transaction revenue</p>
              <p className="text-sm text-gray-400">Paid in USDC</p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-lg text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-green-400 mb-3">Buyback Revenue</h3>
              <p className="text-gray-300 mb-2">25% of platform revenue</p>
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
              <h3 className="text-xl font-bold text-green-400 mb-3">🔐 Cyberscope Audited</h3>
              <p className="text-gray-300">Smart contracts to be audited by Cyberscope, industry-leading blockchain security firm.</p>
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
