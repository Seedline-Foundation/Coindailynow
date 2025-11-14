'use client';

import { motion } from 'framer-motion';

export default function PresalePhases() {
  const phases = [
    { phase: 'Round 1', price: '$0.25', tokens: '200,000', status: 'completed', progress: 100, bonus: '20%' },
    { phase: 'Round 2', price: '$0.40', tokens: '400,000', status: 'active', progress: 45, bonus: '10%' },
    { phase: 'Round 3', price: '$0.78', tokens: '200,000', status: 'upcoming', progress: 0, bonus: '5%' },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-12">
      <h3 className="text-3xl font-bold text-white mb-2 text-center">Presale Rounds</h3>
      <p className="text-gray-400 text-center mb-8">CEX Listing Price: <span className="text-primary-400 font-bold">$0.9</span></p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map((phase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative border ${
              phase.status === 'active' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-800 bg-black'
            } rounded-xl p-6`}
          >
            {phase.status === 'active' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                  ACTIVE NOW
                </span>
              </div>
            )}
            
            <p className="text-gray-400 text-sm mb-2">{phase.phase}</p>
            <p className="text-3xl font-bold gradient-text mb-1">{phase.price}</p>
            <p className="text-sm text-accent-400 font-semibold mb-3">+{phase.bonus} Bonus</p>
            <p className="text-gray-400 text-sm mb-4">{phase.tokens} JY tokens</p>
            
            {phase.status === 'completed' && (
              <p className="text-green-500 font-bold text-sm">✓ SOLD OUT</p>
            )}
            {phase.status === 'active' && (
              <div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${phase.progress}%` }} />
                </div>
                <p className="text-primary-500 text-sm font-bold">{phase.progress}% Sold</p>
              </div>
            )}
            {phase.status === 'upcoming' && (
              <p className="text-gray-500 text-sm">Coming Soon</p>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl text-center">
        <p className="text-gray-300">
          <span className="font-bold text-white">Public CEX Listing:</span> $0.9 per token
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Round 1 buyers get <span className="text-green-400 font-bold">260% profit</span> at listing!
        </p>
      </div>
    </div>
  );
}
