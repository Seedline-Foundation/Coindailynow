'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  GlobeAltIcon,
  BoltIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';

export default function WhyJoyToken() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Exclusive Infrastructure Token',
      description: 'The only accepted payment for 21.1M publisher partnerships. Every PR distribution, ad placement, and transaction requires Joy Token—creating mandatory, sustained demand.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Real Yield from Network Fees',
      description: 'Earn up to 70% APR from actual platform transaction fees, not inflation. As distribution volume scales to millions of PRs monthly, so do stakeholder returns.',
    },
    {
      icon: ChartBarIcon,
      title: 'Network Effect Economics',
      description: 'Metcalfe\'s Law in action: value grows exponentially as network scales. 21M partnerships × transaction velocity = compounding token demand against 5M fixed supply.',
    },
    {
      icon: GlobeAltIcon,
      title: 'Africa\'s Web3 Boom',
      description: '88% YoY crypto adoption growth. 420M internet users. We\'re capturing the world\'s fastest-growing digital market with blockchain-native infrastructure.',
    },
    {
      icon: BoltIcon,
      title: 'Deflationary Pressure',
      description: '10-year team cliff on 1M tokens. Automated burn mechanisms. Heavy staking lock-ups. Supply continuously tightens as demand from network growth accelerates.',
    },
    {
      icon: UsersIcon,
      title: 'First-Mover Monopoly',
      description: 'No competitor has our scale or Africa-first focus. We\'re building infrastructure dominance in an $11.4B market, making Joy Token the Web3 distribution standard.',
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Why <span className="gradient-text">Joy Token</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Not just another token. A deflationary asset with real utility, 
            backed by Africa's premier crypto platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-black border border-gray-800 rounded-2xl p-8 hover:border-primary-500 transition-all glow-box group"
            >
              <feature.icon className="w-12 h-12 text-primary-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            Infrastructure Token for an $11.4B Market
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <p className="mb-4">
                <span className="text-primary-500 font-bold">→</span> Global PR distribution market: $7.2B (2024), 
                growing 11.3% annually. Crypto ad spend: $4.2B and accelerating.
              </p>
              <p className="mb-4">
                <span className="text-primary-500 font-bold">→</span> Our network targets 21.1M partnerships 
                (100K Tier 1, 1M Tier 2, 20M Tier 3) across Africa's 420M internet users.
              </p>
            </div>
            <div>
              <p className="mb-4">
                <span className="text-accent-500 font-bold">→</span> Joy Token is the exclusive payment method—
                no fiat, no alternatives. Every transaction flows through our 5M token supply.
              </p>
              <p>
                <span className="text-accent-500 font-bold">→</span> Early holders capture exponential value: 
                as network scales from MVP to 21M partnerships, token demand compounds while supply stays fixed.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
