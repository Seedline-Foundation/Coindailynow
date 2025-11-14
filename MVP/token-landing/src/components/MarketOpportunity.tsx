'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  ChartBarIcon, 
  GlobeAltIcon, 
  BoltIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function MarketOpportunity() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const marketData = [
    {
      icon: GlobeAltIcon,
      stat: '$7.2B',
      label: 'Global PR Distribution Market',
      detail: '2024 valuation, growing at 11.3% CAGR',
      source: 'Grand View Research, 2024'
    },
    {
      icon: ChartBarIcon,
      stat: '$4.2B',
      label: 'Crypto Ad Spend (2024)',
      detail: 'Digital advertising in blockchain sector',
      source: 'Statista, 2024'
    },
    {
      icon: CurrencyDollarIcon,
      stat: '420M',
      label: 'African Internet Users',
      detail: 'Fastest-growing digital market globally',
      source: 'Internet World Stats, 2024'
    },
    {
      icon: ArrowTrendingUpIcon,
      stat: '88%',
      label: 'Africa Crypto Adoption Growth',
      detail: 'YoY increase in crypto transactions (2023)',
      source: 'Chainalysis, 2023'
    }
  ];

  const networkScale = [
    { tier: 'Tier 1', da: '80-100 DA', target: '100,000', description: 'Premium sites • Instant distribution', color: 'from-yellow-500 to-orange-500' },
    { tier: 'Tier 2', da: '60-80 DA', target: '1,000,000', description: 'High-authority sites • Priority access', color: 'from-blue-500 to-cyan-500' },
    { tier: 'Tier 3', da: '40-60 DA', target: '20,000,000', description: 'Quality publishers • Wide reach', color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <section ref={ref} className="py-24 bg-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">$11.4B Market Opportunity</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Joy Token is the exclusive payment currency for the largest PR and ad distribution network 
            in Africa's rapidly expanding Web3 ecosystem.
          </p>
        </motion.div>

        {/* Market Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-7xl mx-auto">
          {marketData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-primary-500 transition-all glow-box"
            >
              <item.icon className="w-10 h-10 text-primary-500 mb-4" />
              <h3 className="text-3xl font-bold gradient-text mb-2">{item.stat}</h3>
              <p className="text-white font-semibold mb-2">{item.label}</p>
              <p className="text-gray-400 text-sm mb-3">{item.detail}</p>
              <p className="text-gray-600 text-xs italic">{item.source}</p>
            </motion.div>
          ))}
        </div>

        {/* Network Infrastructure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 md:p-12 max-w-6xl mx-auto mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Building Africa's <span className="gradient-text">Largest Distribution Network</span>
          </h3>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Our infrastructure targets 21.1 million publisher partnerships across three tiers, 
            creating unprecedented reach for crypto, blockchain, and finance content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {networkScale.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
                className="relative bg-black border border-gray-800 rounded-2xl p-6 hover:border-primary-500 transition-all group"
              >
                <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r ${tier.color}`} />
                <h4 className="text-2xl font-bold text-white mb-2 mt-2">{tier.tier}</h4>
                <p className="text-primary-500 font-semibold mb-4">{tier.da}</p>
                <div className="mb-4">
                  <p className="text-4xl font-bold gradient-text">{tier.target.toLocaleString()}</p>
                  <p className="text-gray-500 text-sm">Target Partnerships</p>
                </div>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Total Network Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-10 text-center bg-gradient-to-r from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-6"
          >
            <p className="text-gray-300 mb-2">Total Network Capacity</p>
            <p className="text-5xl font-bold gradient-text mb-2">21,100,000</p>
            <p className="text-gray-400">Active Publisher Partnerships by Year 5</p>
          </motion.div>
        </motion.div>

        {/* Why This Matters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-center mb-10">
            <span className="text-white">Why </span>
            <span className="gradient-text">Joy Token</span>
            <span className="text-white"> Captures This Value</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <CheckCircleIcon className="w-10 h-10 text-green-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Exclusive Payment Token</h4>
              <p className="text-gray-400">
                Every PR distribution, ad placement, and partnership transaction on our network 
                requires Joy Token. No alternative payment methods—driving mandatory demand.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <BoltIcon className="w-10 h-10 text-primary-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Network Effect Multiplier</h4>
              <p className="text-gray-400">
                As we scale from 10K to 21M partnerships, transaction volume compounds exponentially. 
                More publishers = more distributors = more transactions = higher token velocity and value.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <CurrencyDollarIcon className="w-10 h-10 text-accent-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Real Revenue, Real Yield</h4>
              <p className="text-gray-400">
                Staking rewards come directly from platform transaction fees—not inflation. 
                As network volume grows, so do stakeholder returns. Sustainable up to 70% APR.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <ArrowTrendingUpIcon className="w-10 h-10 text-blue-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Extreme Scarcity Model</h4>
              <p className="text-gray-400">
                Only 5M tokens for a network serving 21M partnerships. Heavy lock-ups (10-year team cliff) 
                and deflationary burns create supply shock as demand scales.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Market Position Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 bg-gradient-to-br from-primary-600/10 via-accent-600/10 to-purple-600/10 border-2 border-primary-500 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
            First-Mover Advantage in Africa's $11.4B Opportunity
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            While global PR distribution platforms charge premium fees in USD, we're building infrastructure-level 
            dominance in the world's fastest-growing crypto market. Joy Token isn't just payment—it's the foundation 
            of a Web3 distribution monopoly.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
              ✓ Blockchain-native infrastructure
            </span>
            <span className="bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
              ✓ AI-powered verification
            </span>
            <span className="bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
              ✓ Instant cross-border payments
            </span>
            <span className="bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
              ✓ Zero intermediary fees
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
