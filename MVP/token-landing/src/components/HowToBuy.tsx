'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function HowToBuy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    { step: '1', title: 'Join Whitelist', description: 'Enter your email to get whitelist access and presale notifications.' },
    { step: '2', title: 'Prepare Wallet', description: 'Set up MetaMask or compatible Web3 wallet with USDC or ETH.' },
    { step: '3', title: 'Visit PinkSale', description: 'Click the PinkSale link when presale goes live.' },
    { step: '4', title: 'Buy JY Tokens', description: 'Connect wallet, enter amount, confirm transaction, and receive tokens.' },
  ];

  return (
    <section id="how-to-buy" ref={ref} className="py-24 bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">How to Buy</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Simple 4-step process to join the Joy Token presale
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-black border border-gray-800 rounded-2xl p-8 hover:border-primary-500 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <a
            href={process.env.NEXT_PUBLIC_PINKSALE_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-12 py-5 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            Buy on PinkSale →
          </a>
          <p className="text-gray-400 mt-4">
            Need help? Visit{' '}
            <a href="https://coindaily.online" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">
              CoinDaily.online
            </a>{' '}
            for guides
          </p>
        </motion.div>
      </div>
    </section>
  );
}
