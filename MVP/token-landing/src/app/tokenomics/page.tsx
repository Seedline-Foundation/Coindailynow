'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function TokenomicsPage() {
  const tokenomicsData = [
    { name: 'Ecosystem & Staking', value: 36, color: '#f97316', tokens: '1,800,000' },
    { name: 'Reserve Fund', value: 20, color: '#d946ef', tokens: '1,000,000' },
    { name: 'Public Sale', value: 16, color: '#3b82f6', tokens: '800,000' },
    { name: 'Team & Advisors', value: 13.54, color: '#10b981', tokens: '677,000' },
    { name: 'Seed Investors', value: 10, color: '#f59e0b', tokens: '500,000' },
    { name: 'Liquidity Lock', value: 4.46, color: '#8b5cf6', tokens: '223,000' },
  ];

  const vestingSchedule = [
    { category: 'Public Sale', unlock: '100% unlocked at launch' },
    { category: 'Liquidity Lock', unlock: 'Locked permanently' },
    { category: 'Ecosystem & Staking', unlock: 'Gradually unlocked over 5+ years' },
    { category: 'Team & Advisors', unlock: '1-year cliff, then linear over 3 years' },
    { category: 'Seed Investors', unlock: '6-12 month cliff, then linear over remaining period' },
    { category: 'Reserve Fund', unlock: '2-year cliff, then quarterly unlock controlled by DAO (10 year total)' },
  ];

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Tokenomics</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Designed for long-term sustainability and real value creation
          </p>
        </motion.div>

        {/* Token Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          <div className="bg-gradient-to-br from-primary-600/20 to-primary-400/20 border border-primary-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">5M</div>
            <div className="text-gray-400">Max Supply</div>
            <div className="text-sm text-gray-500 mt-2">Fixed Forever</div>
          </div>
          <div className="bg-gradient-to-br from-accent-600/20 to-accent-400/20 border border-accent-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">ERC-20</div>
            <div className="text-gray-400">Token Standard</div>
            <div className="text-sm text-gray-500 mt-2">Ethereum Compatible</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/20 border border-green-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">70%</div>
            <div className="text-gray-400">Max APR</div>
            <div className="text-sm text-gray-500 mt-2">24-Month Stake</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 border border-blue-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">Real</div>
            <div className="text-gray-400">Yield Model</div>
            <div className="text-sm text-gray-500 mt-2">Platform Revenue</div>
          </div>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Token Distribution</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenomicsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tokenomicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {tokenomicsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-white font-semibold">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{item.value}%</div>
                    <div className="text-sm text-gray-400">{item.tokens} JY</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Vesting Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Vesting Schedule</h2>
          <p className="text-gray-400 text-center mb-8">Designed to prevent dumps and ensure long-term alignment</p>
          <div className="grid md:grid-cols-2 gap-6">
            {vestingSchedule.map((item, index) => (
              <div key={index} className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-primary-400 mb-3">{item.category}</h3>
                <p className="text-gray-300">{item.unlock}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Deflationary Mechanism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/50 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">🔥 Buyback & Burn Model</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-4">�</div>
              <h3 className="text-xl font-bold text-white mb-2">Platform Revenue</h3>
              <p className="text-gray-300">50% of protocol fees collected from operations</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">�</div>
              <h3 className="text-xl font-bold text-white mb-2">Automatic Buyback</h3>
              <p className="text-gray-300">Revenue used to purchase $JY from open market</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">�</div>
              <h3 className="text-xl font-bold text-white mb-2">Permanent Burn</h3>
              <p className="text-gray-300">Purchased tokens sent to burn address forever</p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-black/30 rounded-lg text-center">
            <p className="text-gray-300 text-lg">
              <strong className="text-white">Result:</strong> Creates continuous buy pressure + reduces supply = <strong className="text-primary-400">Price appreciation</strong>
            </p>
          </div>
        </motion.div>

        {/* Value Accrual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">� Staking Tiers & Real Yield</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">24 Months Lock</h3>
                  <span className="text-3xl font-bold text-purple-400">70% APR</span>
                </div>
                <p className="text-gray-300 text-sm">3x governance weight + maximum rewards</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">12 Months Lock</h3>
                  <span className="text-3xl font-bold text-blue-400">30% APR</span>
                </div>
                <p className="text-gray-300 text-sm">2x governance weight + high rewards</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">6 Months Lock</h3>
                  <span className="text-3xl font-bold text-green-400">8% APR</span>
                </div>
                <p className="text-gray-300 text-sm">1.5x governance weight + steady rewards</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">Flexible (7 days)</h3>
                  <span className="text-3xl font-bold text-gray-400">2% APR</span>
                </div>
                <p className="text-gray-300 text-sm">1x governance weight + base rewards</p>
              </div>
            </div>
          </div>
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-6">
            <h4 className="text-xl font-bold text-white mb-4">Real Yield Sources:</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-400 mb-1">Platform Revenue</p>
                <p className="text-gray-400 text-sm">Subscription fees, ads, partnerships</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent-400 mb-1">Protocol Fees</p>
                <p className="text-gray-400 text-sm">Transaction and service fees</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400 mb-1">Ecosystem Fund</p>
                <p className="text-gray-400 text-sm">1.8M JY dedicated pool (36%)</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center"
        >
          <Link
            href="/presale"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-12 py-5 rounded-full text-xl font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
          >
            Join Presale Now →
          </Link>
          <div className="mt-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
