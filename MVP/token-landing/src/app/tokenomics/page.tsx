'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function TokenomicsPage() {
  const tokenomicsData = [
    { name: 'Public Sale', value: 28.3, color: '#3b82f6', tokens: '1,700,000' },
    { name: 'Treasury', value: 23.3, color: '#d946ef', tokens: '1,400,000' },
    { name: 'Ecosystem', value: 18.3, color: '#f97316', tokens: '1,100,000' },
    { name: 'Team', value: 11.7, color: '#10b981', tokens: '700,000' },
    { name: 'Legal', value: 8.3, color: '#f59e0b', tokens: '500,000' },
    { name: 'Liquidity', value: 5, color: '#8b5cf6', tokens: '300,000' },
    { name: 'Seed', value: 5, color: '#06b6d4', tokens: '300,000' },
  ];

  const vestingSchedule = [
    { category: 'Public Sale', unlock: '9-month cliff, then 24-month linear vesting' },
    { category: 'Liquidity', unlock: 'Locked permanently (paired with $270K USDC)' },
    { category: 'Ecosystem', unlock: '48-month linear (60% committed to 10-year sinkhole)' },
    { category: 'Team', unlock: '24-month cliff, then 4-year linear vesting' },
    { category: 'Seed', unlock: '9-month cliff, then 12-month linear vesting' },
    { category: 'Treasury', unlock: '1M in 10-year sinkhole (2-year start), 400K for runway (6-month start)' },
    { category: 'Legal', unlock: '100K monthly after 6 months, 400K quarterly after 12 months' },
  ];

  return (
    <div className="min-h-screen bg-black py-20 relative overflow-hidden">
      {/* Animated Background - Mining Treasury */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Treasury Bag - Center */}
          <g className="animate-pulse-slow">
            <ellipse cx="600" cy="400" rx="130" ry="150" fill="url(#bagGradient)" opacity="0.6" />
            <path
              d="M 540 310 Q 600 270 660 310 L 660 430 Q 600 470 540 430 Z"
              fill="url(#bagGradient)"
              opacity="0.7"
              stroke="#FCD34D"
              strokeWidth="2"
            />
            <circle cx="600" cy="330" r="8" fill="#D97706" opacity="0.5" />
            <circle cx="580" cy="345" r="6" fill="#D97706" opacity="0.5" />
            <circle cx="620" cy="345" r="6" fill="#D97706" opacity="0.5" />
            <text x="600" y="400" textAnchor="middle" fill="#FCD34D" fontSize="42" fontWeight="bold" opacity="0.8">
              JY
            </text>
          </g>

          {/* Token from TOP */}
          <g>
            <circle cx="600" cy="50" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 350; 0 350"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from LEFT */}
          <g>
            <circle cx="50" cy="400" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 550 0; 550 0"
                dur="4.5s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4.5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from RIGHT */}
          <g>
            <circle cx="1150" cy="400" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -550 0; -550 0"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="5s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from BOTTOM */}
          <g>
            <circle cx="600" cy="750" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -350; 0 -350"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from TOP-LEFT */}
          <g>
            <circle cx="150" cy="100" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 450 300; 450 300"
                dur="4.8s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from TOP-RIGHT */}
          <g>
            <circle cx="1050" cy="100" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -450 300; -450 300"
                dur="5.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from BOTTOM-LEFT */}
          <g>
            <circle cx="150" cy="700" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 450 -300; 450 -300"
                dur="4.6s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Diagonal token from BOTTOM-RIGHT */}
          <g>
            <circle cx="1050" cy="700" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -450 -300; -450 -300"
                dur="5.4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Left Hand */}
          <g className="animate-bounce-slow">
            <ellipse cx="420" cy="420" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 390 400 Q 385 420 400 435 L 440 430 Q 445 415 430 400 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 30 -15; 0 0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            <rect x="435" y="400" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="425" y="405" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          {/* Right Hand */}
          <g className="animate-bounce-slow">
            <ellipse cx="780" cy="420" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 810 400 Q 815 420 800 435 L 760 430 Q 755 415 770 400 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -30 -15; 0 0"
                dur="2.3s"
                repeatCount="indefinite"
              />
            </path>
            <rect x="757" y="400" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="767" y="405" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          <defs>
            <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
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
            Only 4M tokens will ever circulate. The rest: staked, locked, or burned.
          </p>
        </motion.div>

        {/* Key Principle Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-4xl mx-auto mb-16 bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/50 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            🔒 Extreme Scarcity By Design
          </h3>
          <p className="text-gray-300 text-lg">
            "Only 4M tokens will <span className="text-primary-400 font-bold">ever</span> circulate. 
            The rest are staked, locked, or burned. Every transaction feeds liquidity, burns supply, or rewards holders. 
            <span className="text-accent-400 font-bold"> No mercenary capital—only believers.</span>"
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
            <div className="text-4xl font-bold gradient-text mb-2">6M</div>
            <div className="text-gray-400">Total Supply</div>
            <div className="text-sm text-gray-500 mt-2">Fixed Forever</div>
          </div>
          <div className="bg-gradient-to-br from-accent-600/20 to-accent-400/20 border border-accent-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">4M</div>
            <div className="text-gray-400">Ever Circulating</div>
            <div className="text-sm text-gray-500 mt-2">Max Liquid Supply</div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-400/20 border border-green-500/50 rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">90%</div>
            <div className="text-gray-400">Max APR</div>
            <div className="text-sm text-gray-500 mt-2">After 9th Month</div>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
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
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">Platform Revenue</h3>
              <p className="text-gray-300">50% of protocol fees collected from operations</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">Automatic Buyback</h3>
              <p className="text-gray-300">Revenue used to purchase $JY from open market</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔥</div>
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
          <h2 className="text-3xl font-bold text-white mb-6 text-center">💎 Staking Tiers & Real Yield</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">24 Months Lock</h3>
                  <span className="text-3xl font-bold text-purple-400">90% APR</span>
                </div>
                <p className="text-gray-300 text-sm">2.5x governance weight + Diamond Hands rewards (90% APR after 9th month)</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">9 Months Lock</h3>
                  <span className="text-3xl font-bold text-blue-400">70% APR</span>
                </div>
                <p className="text-gray-300 text-sm">1.5x governance weight + Whale Prison rewards</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">6 Months Lock</h3>
                  <span className="text-3xl font-bold text-green-400">10% APR</span>
                </div>
                <p className="text-gray-300 text-sm">1.2x governance weight + steady rewards</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">Flexible (7 days)</h3>
                  <span className="text-3xl font-bold text-gray-400">1% APR</span>
                </div>
                <p className="text-gray-300 text-sm">0x governance weight + minimal rewards</p>
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
                <p className="text-gray-400 text-sm">1.1M JY dedicated pool (18.3%)</p>
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
