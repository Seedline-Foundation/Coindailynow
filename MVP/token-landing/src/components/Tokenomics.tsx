'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Tokenomics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const allocationData = [
    { name: 'Public Sale', value: 28.3, amount: '1,700,000', color: '#3b82f6' },
    { name: 'Treasury', value: 23.3, amount: '1,400,000', color: '#d946ef' },
    { name: 'Ecosystem', value: 18.3, amount: '1,100,000', color: '#f97316' },
    { name: 'Team', value: 11.7, amount: '700,000', color: '#10b981' },
    { name: 'Legal', value: 8.3, amount: '500,000', color: '#f59e0b' },
    { name: 'Liquidity', value: 5, amount: '300,000', color: '#8b5cf6' },
    { name: 'Seed', value: 5, amount: '300,000', color: '#06b6d4' },
  ];

  const vestingSchedule = [
    { category: 'Public Sale', vesting: '9-month cliff, 24-month linear', cliff: '9 months' },
    { category: 'Liquidity', vesting: 'Locked permanently', cliff: 'Permanent' },
    { category: 'Ecosystem', vesting: '48-month linear (60% in 10-year sinkhole)', cliff: 'None' },
    { category: 'Team', vesting: '4-year linear', cliff: '24 months' },
    { category: 'Seed', vesting: '12-month linear', cliff: '9 months' },
    { category: 'Treasury', vesting: '10-year sinkhole (2-year start)', cliff: '2 years' },
    { category: 'Legal', vesting: 'Monthly (6-month start) + quarterly (12-month start)', cliff: '6-12 months' },
  ];

  return (
    <section id="tokenomics" ref={ref} className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Tokenomics</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Designed for extreme scarcity and long-term value accrual
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-5xl font-bold gradient-text mb-2">6,000,000</p>
            <p className="text-gray-400 mb-2">Total Max Supply</p>
            <p className="text-sm text-primary-500 font-semibold">Only 4M Will Ever Circulate</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-5xl font-bold gradient-text mb-2">1,700,000</p>
            <p className="text-gray-400 mb-2">Public Sale Allocation</p>
            <p className="text-sm text-accent-500 font-semibold">28.3% of Total Supply</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-5xl font-bold gradient-text mb-2">$917K</p>
            <p className="text-gray-400 mb-2">Presale Target</p>
            <p className="text-sm text-green-500 font-semibold">100% Community-Funded</p>
          </div>
        </motion.div>

        {/* Allocation Chart and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto mb-16">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Token Allocation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Allocation Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Allocation Breakdown</h3>
            <div className="space-y-4">
              {allocationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{item.value}%</p>
                    <p className="text-gray-500 text-sm">{item.amount} JY</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Vesting Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-5xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Vesting Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Category</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Vesting Period</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Cliff</th>
                </tr>
              </thead>
              <tbody>
                {vestingSchedule.map((item, index) => (
                  <tr key={index} className="border-b border-gray-800 last:border-0">
                    <td className="py-4 px-4 text-white">{item.category}</td>
                    <td className="py-4 px-4 text-gray-300">{item.vesting}</td>
                    <td className="py-4 px-4 text-gray-300">{item.cliff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Use of Funds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-12 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 max-w-5xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Use of Funds ($917.5K USDC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-lg font-bold">29%</div>
              <div>
                <p className="text-white font-bold">Liquidity Locking</p>
                <p className="text-gray-400 text-sm">$270K permanently locked</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center text-lg font-bold">33%</div>
              <div>
                <p className="text-white font-bold">CEX Listings</p>
                <p className="text-gray-400 text-sm">$300K MEXC + Bybit</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold">13%</div>
              <div>
                <p className="text-white font-bold">12-Month Runway</p>
                <p className="text-gray-400 text-sm">$120K operations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-lg font-bold">11%</div>
              <div>
                <p className="text-white font-bold">Marketing</p>
                <p className="text-gray-400 text-sm">$100K growth campaigns</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-lg font-bold">5%</div>
              <div>
                <p className="text-white font-bold">Legal & Compliance</p>
                <p className="text-gray-400 text-sm">$50K regulatory setup</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-lg font-bold">8%</div>
              <div>
                <p className="text-white font-bold">Contingencies</p>
                <p className="text-gray-400 text-sm">$77.5K buffer</p>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            100% community-funded • No VC backing • Full transparency
          </p>
        </motion.div>
      </div>
    </section>
  );
}
