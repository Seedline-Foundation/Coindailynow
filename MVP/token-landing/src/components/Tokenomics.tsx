'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Tokenomics() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const allocationData = [
    { name: 'Ecosystem & Staking', value: 36, amount: '1,800,000', color: '#f97316' },
    { name: 'Reserve Fund', value: 20, amount: '1,000,000', color: '#d946ef' },
    { name: 'Public Sale', value: 16, amount: '800,000', color: '#3b82f6' },
    { name: 'Team & Advisors', value: 13.54, amount: '677,000', color: '#10b981' },
    { name: 'Seed Investors', value: 10, amount: '500,000', color: '#f59e0b' },
    { name: 'Liquidity Lock', value: 4.46, amount: '223,000', color: '#8b5cf6' },
  ];

  const vestingSchedule = [
    { category: 'Public Sale', vesting: '100% unlocked at launch', cliff: 'None' },
    { category: 'Liquidity Lock', vesting: 'Locked permanently', cliff: 'Permanent' },
    { category: 'Ecosystem & Staking', vesting: '5+ years linear', cliff: 'None' },
    { category: 'Team & Advisors', vesting: '3 years linear', cliff: '1 year' },
    { category: 'Seed Investors', vesting: 'Linear over remaining period', cliff: '6-12 months' },
    { category: 'Reserve Fund', vesting: '10 years quarterly (DAO controlled)', cliff: '2 years' },
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
            <p className="text-5xl font-bold gradient-text mb-2">5,000,000</p>
            <p className="text-gray-400 mb-2">Total Max Supply</p>
            <p className="text-sm text-primary-500 font-semibold">No More Can Ever Be Minted</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-5xl font-bold gradient-text mb-2">800,000</p>
            <p className="text-gray-400 mb-2">Public Sale Allocation</p>
            <p className="text-sm text-accent-500 font-semibold">16% of Total Supply</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-5xl font-bold gradient-text mb-2">$350K</p>
            <p className="text-gray-400 mb-2">Fundraising Target</p>
            <p className="text-sm text-green-500 font-semibold">All Allocated to Growth</p>
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
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Use of Funds ($350K USDC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-2xl font-bold">57%</div>
              <div>
                <p className="text-white font-bold">Liquidity Locking</p>
                <p className="text-gray-400 text-sm">$200,000 USDC permanently locked</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center text-2xl font-bold">14%</div>
              <div>
                <p className="text-white font-bold">Legal & Compliance</p>
                <p className="text-gray-400 text-sm">$50,000 USDC for regulatory setup</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">14%</div>
              <div>
                <p className="text-white font-bold">MVP Development</p>
                <p className="text-gray-400 text-sm">$50,000 USDC for platform features</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-2xl font-bold">14%</div>
              <div>
                <p className="text-white font-bold">Marketing & Growth</p>
                <p className="text-gray-400 text-sm">$50,000 USDC for user acquisition</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
