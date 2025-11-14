'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function StakingStrategy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stakingTiers = [
    {
      period: 'Flexible',
      lockup: '7 days notice',
      apr: '2%',
      multiplier: '1x',
      color: 'from-gray-600 to-gray-700',
      description: 'Unstake anytime with 7-day cooldown',
    },
    {
      period: '6 Months',
      lockup: '6 months cliff',
      apr: '8%',
      multiplier: '1.5x',
      color: 'from-blue-600 to-blue-700',
      description: 'Medium-term commitment, decent rewards',
    },
    {
      period: '12 Months',
      lockup: '12 months cliff',
      apr: '30%',
      multiplier: '2x',
      color: 'from-primary-600 to-primary-700',
      description: 'Long-term holder, excellent returns',
      popular: true,
    },
    {
      period: '24 Months',
      lockup: '24 months cliff',
      apr: '70%',
      multiplier: '3x',
      color: 'from-accent-600 to-accent-700',
      description: 'Maximum commitment, maximum rewards',
      popular: true,
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
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real yield rewards from protocol revenue. Choose your commitment level.
          </p>
        </motion.div>

        {/* Staking Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {stakingTiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-gray-900 border ${
                tier.popular ? 'border-primary-500' : 'border-gray-800'
              } rounded-2xl p-6 hover:scale-105 transition-all glow-box`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                    POPULAR
                  </span>
                </div>
              )}
              
              <div className={`bg-gradient-to-br ${tier.color} rounded-xl p-4 mb-4`}>
                <p className="text-white text-2xl font-bold mb-1">{tier.period}</p>
                <p className="text-white/80 text-sm">{tier.lockup}</p>
              </div>

              <div className="mb-4">
                <p className="text-5xl font-bold gradient-text mb-2">{tier.apr}</p>
                <p className="text-gray-400 text-sm">Annual APR</p>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-800">
                <p className="text-white font-semibold mb-1">Governance Power</p>
                <p className="text-primary-500 text-xl font-bold">{tier.multiplier}</p>
              </div>

              <p className="text-gray-400 text-sm">{tier.description}</p>
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
