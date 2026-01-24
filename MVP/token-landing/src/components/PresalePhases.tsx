'use client';

import { motion } from 'framer-motion';

export default function PresalePhases() {
  const phases = [
    { 
      phase: 'Phase 1: Foundation Forge', 
      price: '$0.29', 
      tokens: '450,000', 
      raise: '$130,500',
      status: 'active', 
      progress: 35, 
      duration: '15 days',
      milestones: [
        'Smart Contract Audit & KYC (25% sold)',
        'Liquidity Pool Locked ($270K USDC, 4 years)',
        'Initial Marketing Blitz'
      ],
      roi: '+234%'
    },
    { 
      phase: 'Phase 2: Growth Engine', 
      price: '$0.47', 
      tokens: '750,000', 
      raise: '$352,500',
      status: 'upcoming', 
      progress: 0, 
      duration: '15 days',
      milestones: [
        'CEX Listing Agreements Secured (MEXC, Bybit)',
        'Tier 1 Marketing Activation',
        'OG Contributor Program Launch'
      ],
      roi: '+106%'
    },
    { 
      phase: 'Phase 3: Launchpad', 
      price: '$0.79', 
      tokens: '550,000', 
      raise: '$434,500',
      status: 'upcoming', 
      progress: 0, 
      duration: '15 days',
      milestones: [
        '12-Month Runway Secured',
        'Final Pre-Launch Sequence',
        'Team Staking Mechanism Activated'
      ],
      roi: '+23%'
    },
  ];

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          The 45-Day Ascension Structure
        </h2>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Three phases. Three price points. Every phase unlocks verified milestones. 
          <span className="text-primary-500 font-bold"> Every milestone increases trust and value.</span>
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {phases.map((phase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative border ${
              phase.status === 'active' 
                ? 'border-primary-500 bg-gradient-to-br from-primary-500/20 to-accent-500/20 shadow-lg shadow-primary-500/30' 
                : 'border-gray-800 bg-gray-900'
            } rounded-xl p-6 transition-all hover:border-primary-500/50`}
          >
            {phase.status === 'active' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                  🔥 LIVE NOW
                </span>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-primary-400 text-sm font-semibold mb-1">{phase.phase}</p>
              <p className="text-4xl font-bold gradient-text mb-1">{phase.price}</p>
              <p className="text-sm text-gray-400 mb-2">{phase.duration}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{phase.tokens} JY</span>
                <span className="text-accent-400 font-bold">Target: {phase.raise}</span>
              </div>
            </div>
            
            {phase.status === 'active' && (
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${phase.progress}%` }}
                    transition={{ duration: 1 }}
                    className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full"
                  />
                </div>
                <p className="text-primary-500 text-sm font-bold">{phase.progress}% Filled • Next phase unlocks at 100%</p>
              </div>
            )}
            
            <div className="border-t border-gray-800 pt-4 mt-4">
              <p className="text-white font-bold text-sm mb-3">Milestone Unlocks:</p>
              <ul className="space-y-2">
                {phase.milestones.map((milestone, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-primary-500 flex-shrink-0">✓</span>
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">ROI at $0.97 listing:</span>
                <span className="text-green-400 font-bold text-lg">{phase.roi}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="p-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl text-center"
      >
        <p className="text-2xl font-bold text-white mb-2">
          CEX Listing Price: <span className="text-green-400">$0.97</span>
        </p>
        <p className="text-gray-300 mb-4">
          Phase 1 OGs lock in the <span className="font-bold text-primary-400">absolute floor price</span> before audits, listings, and global hype
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-black/50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-green-400">+234%</p>
            <p className="text-sm text-gray-400">Phase 1 Gains</p>
          </div>
          <div className="bg-black/50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-blue-400">+106%</p>
            <p className="text-sm text-gray-400">Phase 2 Gains</p>
          </div>
          <div className="bg-black/50 p-4 rounded-lg">
            <p className="text-3xl font-bold text-accent-400">+23%</p>
            <p className="text-sm text-gray-400">Phase 3 Gains</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
