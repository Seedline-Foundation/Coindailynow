'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const stats = [
    { value: '21.1M', label: 'Publisher Partnerships', trend: 'Target by Year 5' },
    { value: '$11.4B', label: 'Market Opportunity', trend: 'PR + Crypto Ads' },
    { value: '6M', label: 'Fixed Token Supply', trend: 'Never increases' },
    { value: '90%', label: 'Max Staking APR', trend: 'Real yield model' },
  ];

  return (
    <section ref={ref} className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center hover:border-primary-500 transition-all glow-box"
            >
              <motion.p
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                className="text-3xl md:text-4xl font-bold gradient-text mb-2"
              >
                {stat.value}
              </motion.p>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-primary-500 text-xs font-semibold">{stat.trend}</p>
            </motion.div>
          ))}
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-xl text-gray-300 mb-2">
            <span className="text-primary-500 font-bold">🎯 The Opportunity:</span> Exclusive payment token for Africa's largest Web3 distribution network
          </p>
          <p className="text-lg text-gray-400">
            Presale at <span className="text-accent-500 font-bold">$0.29</span> • Estimated launch at <span className="text-green-500 font-bold">$0.97</span> • Network effects compound value as partnerships scale
          </p>
        </motion.div>
      </div>
    </section>
  );
}
