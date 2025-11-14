'use client';

import { motion } from 'framer-motion';

export default function SocialProof() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-black border border-gray-800 rounded-2xl p-8 mb-12"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <p className="text-4xl font-bold gradient-text mb-2">5M</p>
          <p className="text-gray-400">Max Token Supply</p>
        </div>
        <div>
          <p className="text-4xl font-bold gradient-text mb-2">70%</p>
          <p className="text-gray-400">Max Staking APR</p>
        </div>
        <div>
          <p className="text-4xl font-bold gradient-text mb-2">13</p>
          <p className="text-gray-400">African Languages</p>
        </div>
        <div>
          <p className="text-4xl font-bold gradient-text mb-2">13+</p>
          <p className="text-gray-400">Target Countries</p>
        </div>
      </div>
    </motion.div>
  );
}
