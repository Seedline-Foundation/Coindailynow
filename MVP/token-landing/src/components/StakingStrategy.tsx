'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function StakingStrategy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stakingTiers = [
    {
      period: '7 Days',
      lockup: 'Flexible unlock',
      apr: '1%',
      multiplier: '0x',
      color: 'from-gray-600 to-gray-700',
      description: 'Test the waters - Low commitment, low rewards',
      badge: 'FLEXIBLE',
    },
    {
      period: '6 Months',
      lockup: '6 months cliff',
      apr: '10%',
      multiplier: '1.2x',
      color: 'from-green-600 to-green-700',
      description: 'Medium commitment - Steady returns',
      badge: 'STEADY',
    },
    {
      period: '9 Months',
      lockup: '9 months cliff',
      apr: '70%',
      multiplier: '1.5x',
      color: 'from-blue-600 to-blue-700',
      description: 'Whale Prison - Earn 70% APR for 9 months',
      badge: 'WHALE PRISON',
    },
    {
      period: '24 Months',
      lockup: '24 months cliff',
      apr: '90%',
      multiplier: '2.5x',
      color: 'from-accent-600 to-accent-700',
      description: 'Diamond Hands - 90% APR after 9th month',
      popular: true,
      badge: 'DIAMOND HANDS',
    },
  ];

  return (
    <section id="staking" ref={ref} className="py-24 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Staking Strategy</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-4">
            Real yield rewards from protocol revenue. Choose your commitment level.
          </p>
          <p className="text-lg text-primary-400 max-w-2xl mx-auto">
            <span className="font-bold">Flexible Options:</span> From 7 days at 1% to 24 months at 90% APR. Higher commitment, higher rewards.
          </p>
        </motion.div>

        {/* Staking Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stakingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-gray-900 border ${
                tier.popular ? 'border-primary-500' : 'border-gray-800'
              } rounded-2xl p-8 hover:scale-105 transition-all glow-box`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`${
                    tier.popular ? 'bg-gradient-to-r from-primary-500 to-accent-500' : 'bg-blue-600'
                  } text-white px-4 py-1 rounded-full text-xs font-bold`}>
                    {tier.badge}
                  </span>
                </div>
              )}
              
              <div className={`bg-gradient-to-br ${tier.color} rounded-xl p-6 mb-6`}>
                <p className="text-white text-3xl font-bold mb-2">{tier.period}</p>
                <p className="text-white/80 text-sm">{tier.lockup}</p>
              </div>

              <div className="mb-6">
                <p className="text-6xl font-bold gradient-text mb-2">{tier.apr}</p>
                <p className="text-gray-400">Annual APR</p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-800">
                <p className="text-white font-semibold mb-1">Governance Power</p>
                <p className="text-primary-500 text-2xl font-bold">{tier.multiplier}</p>
              </div>

              <p className="text-gray-300 mb-4">{tier.description}</p>
              
              {tier.popular && (
                <p className="text-sm text-accent-400 font-semibold">
                  ✨ Most popular choice for OG Champs
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* How Staking Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-5xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">How Staking Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-bold text-primary-500 mb-4">Real Yield Rewards</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Rewards paid from actual protocol revenue (not inflation)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Distributed in JY tokens + stablecoins (USDC/ETH)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Automatic compounding for maximum returns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Claim rewards anytime without unstaking</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xl font-bold text-accent-500 mb-4">Lock-up & Security</h4>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-accent-500 font-bold">•</span>
                  <span>Strict cliff periods - no early unstaking allowed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-500 font-bold">•</span>
                  <span>7-day cooldown period after cliff expires</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-500 font-bold">•</span>
                  <span>Audited smart contracts for maximum security</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-500 font-bold">•</span>
                  <span>Longer stakes = higher governance voting power</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Calculator Preview */}
          <div className="mt-8 bg-black border border-gray-800 rounded-xl p-6">
            <h4 className="text-lg font-bold text-white mb-4 text-center">
              Potential Returns Calculator
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-1">Stake 10,000 JY @ 12 months</p>
                <p className="text-2xl font-bold text-primary-500">13,000 JY</p>
                <p className="text-green-500 text-sm">+30% APR</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Stake 10,000 JY @ 24 months</p>
                <p className="text-2xl font-bold text-accent-500">17,000 JY</p>
                <p className="text-green-500 text-sm">+70% APR</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Plus USDC rewards</p>
                <p className="text-2xl font-bold text-blue-500">$XXX</p>
                <p className="text-gray-500 text-sm">From protocol fees</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
