'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function Roadmap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const milestones = [
    { quarter: 'Q4 2025', title: 'Foundation', items: ['Token Launch', 'Presale Completion', 'DEX Listing', 'Staking Live'], status: 'active' },
    { quarter: 'Q1 2026', title: 'Expansion', items: ['CEX Listings', 'Mobile App', 'Governance Launch', 'Partnership Deals'], status: 'upcoming' },
    { quarter: 'Q2 2026', title: 'Growth', items: ['1M Users', 'Africa Expansion', 'New Features', 'Strategic Investments'], status: 'upcoming' },
    { quarter: 'Q3 2026', title: 'Maturity', items: ['Revenue Sharing', 'Global Reach', 'Ecosystem Fund', 'Major Partnerships'], status: 'upcoming' },
  ];

  return (
    <section ref={ref} className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our journey to becoming Africa's leading crypto ecosystem
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className={`relative border ${
                  milestone.status === 'active' ? 'border-primary-500' : 'border-gray-800'
                } bg-gray-900 rounded-2xl p-6`}
              >
                {milestone.status === 'active' && (
                  <div className="absolute -top-3 right-6">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      CURRENT
                    </span>
                  </div>
                )}
                
                <p className="text-primary-500 font-bold mb-2">{milestone.quarter}</p>
                <h3 className="text-2xl font-bold text-white mb-4">{milestone.title}</h3>
                <ul className="space-y-2">
                  {milestone.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-400">
                      <span className="text-primary-500 mt-1">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
