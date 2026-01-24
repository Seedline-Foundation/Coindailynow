'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import EmailCapture from '@/components/EmailCapture';
import { 
  TrophyIcon, 
  FireIcon, 
  BoltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function AmbassadorPage() {
  const ogBenefits = [
    { 
      icon: FireIcon,
      title: 'Priority Presale Access', 
      description: 'Exclusive early entry to all presale phases before public launch',
      tier: 'ELITE'
    },
    { 
      icon: ChartBarIcon,
      title: 'High-Yield Staking Perks', 
      description: 'Up to 90% APR after 9 months + 2.5x governance multipliers',
      tier: 'ELITE'
    },
    { 
      icon: TrophyIcon,
      title: 'OG Bounty Program', 
      description: 'Earn 500–20,000 JY tokens per contribution across 6 bounty categories',
      tier: 'ELITE'
    },
    { 
      icon: SparklesIcon,
      title: 'Quarterly Airdrops', 
      description: 'Automatic token distributions based on engagement and holdings',
      tier: 'VIP'
    },
    { 
      icon: CurrencyDollarIcon,
      title: 'Zero Transaction Fees', 
      description: 'Lifetime fee waivers on all platform transactions (70% discount minimum)',
      tier: 'VIP'
    },
    { 
      icon: ShieldCheckIcon,
      title: 'DAO Governance Rights', 
      description: 'Weighted voting power on platform decisions and fund allocation',
      tier: 'VIP'
    },
    { 
      icon: BoltIcon,
      title: 'Beta Features First', 
      description: 'Test and influence development of new platform capabilities',
      tier: 'PREMIUM'
    },
    { 
      icon: UserGroupIcon,
      title: 'Private Community Access', 
      description: 'Exclusive Discord/Telegram channels with founders and core team',
      tier: 'PREMIUM'
    },
    { 
      icon: SparklesIcon,
      title: 'Revenue Share Pool', 
      description: 'Proportional distribution from platform profits to OG stakers',
      tier: 'PREMIUM'
    }
  ];

  const requirements = [
    'Active presence on social media (Twitter, Telegram, Discord)',
    'Passion for cryptocurrency and blockchain technology',
    'Based in or familiar with African crypto markets',
    'Strong communication skills in English (+ local languages bonus)',
    'Committed to promoting JY Token and CoinDaily ethically',
    'Presale participant OR 15,000+ JY tokens staked for 4+ months',
  ];

  return (
    <div className="min-h-screen bg-black py-20 relative overflow-hidden">
      {/* Animated Background - Mining Treasury */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <svg className="absolute w-full h-full" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <g className="animate-pulse-slow">
            <ellipse cx="600" cy="450" rx="130" ry="150" fill="url(#bagGradient)" opacity="0.6" />
            <path d="M 540 360 Q 600 320 660 360 L 660 480 Q 600 520 540 480 Z" fill="url(#bagGradient)" opacity="0.7" stroke="#FCD34D" strokeWidth="2" />
            <circle cx="600" cy="380" r="8" fill="#D97706" opacity="0.5" />
            <circle cx="580" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <circle cx="620" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <text x="600" y="450" textAnchor="middle" fill="#FCD34D" fontSize="42" fontWeight="bold" opacity="0.8">JY</text>
          </g>
          <g className="token-from-top"><circle cx="600" cy="50" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 0 400; 0 400" dur="4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-left"><circle cx="50" cy="450" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 550 0; 550 0" dur="4.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4.5s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-right"><circle cx="1150" cy="450" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; -550 0; -550 0" dur="5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="5s" repeatCount="indefinite" /></circle></g>
          <g className="token-from-bottom"><circle cx="600" cy="750" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2"><animateTransform attributeName="transform" type="translate" values="0 0; 0 -300; 0 -300" dur="4.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;0.9;0" dur="4.2s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-1"><circle cx="200" cy="100" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 400 350; 400 350" dur="4.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="4.8s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-2"><circle cx="1000" cy="100" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -400 350; -400 350" dur="5.2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="5.2s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-3"><circle cx="250" cy="700" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 350 -250; 350 -250" dur="4.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="4.6s" repeatCount="indefinite" /></circle></g>
          <g className="token-diagonal-4"><circle cx="950" cy="700" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -350 -250; -350 -250" dur="5.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.8;0" dur="5.4s" repeatCount="indefinite" /></circle></g>
          <g className="animate-bounce-slow">
            <ellipse cx="400" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 370 450 Q 365 470 380 485 L 420 480 Q 425 465 410 450 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; 30 -15; 0 0" dur="2s" repeatCount="indefinite" /></path>
            <rect x="415" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="405" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>
          <g className="animate-bounce-slow">
            <ellipse cx="800" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path d="M 830 450 Q 835 470 820 485 L 780 480 Q 775 465 790 450 Z" fill="url(#handGradient)" opacity="0.7" stroke="#FBBF24" strokeWidth="1.5"><animateTransform attributeName="transform" type="translate" values="0 0; -30 -15; 0 0" dur="2.3s" repeatCount="indefinite" /></path>
            <rect x="777" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="787" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
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

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm tracking-wide">
              👑 EXCLUSIVE STATUS
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">OG Champs Program</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Join Africa's Elite Circle of Crypto Leaders
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            OG Champs are early believers, community builders, and strategic partners who receive 
            <span className="text-primary-500 font-bold"> lifetime benefits</span> and governance rights.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-xl p-6 text-center">
            <TrophyIcon className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-4xl font-bold text-white mb-2">90%</p>
            <p className="text-gray-300">Maximum APR</p>
          </div>
          <div className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-xl p-6 text-center">
            <FireIcon className="w-12 h-12 text-primary-400 mx-auto mb-3" />
            <p className="text-4xl font-bold text-white mb-2">2.5x</p>
            <p className="text-gray-300">Governance Multiplier</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-xl p-6 text-center">
            <SparklesIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-4xl font-bold text-white mb-2">0%</p>
            <p className="text-gray-300">Transaction Fees</p>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Exclusive OG Champ Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ogBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const tierColor = 
                benefit.tier === 'ELITE' ? 'from-yellow-500 to-orange-500' :
                benefit.tier === 'VIP' ? 'from-primary-500 to-accent-500' :
                'from-purple-500 to-pink-500';
              
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + (index * 0.05) }}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-primary-500 transition-all group"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${tierColor} bg-opacity-20`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-bold bg-gradient-to-r ${tierColor} bg-clip-text text-transparent`}>
                        {benefit.tier}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How to Become an OG Champ</h2>
          <ul className="space-y-4 max-w-3xl mx-auto">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300">
                <span className="text-primary-500 font-bold mt-1">✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Perks Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What Makes OG Champs Special</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-2xl p-8">
              <TrophyIcon className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Financial Benefits</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Up to 90% APR on 24-month staking after 9-month vesting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Earn 500–20,000 JY per bounty across 6 categories</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Quarterly airdrops based on engagement metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Proportional share from revenue distribution pool</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>Lifetime zero transaction fees on platform</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8">
              <ShieldCheckIcon className="w-12 h-12 text-primary-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Governance Power</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>2.5x voting multiplier on all DAO proposals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Priority input on treasury fund allocation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Influence platform feature development roadmap</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Exclusive access to founder strategy sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500">•</span>
                  <span>Beta testing rights for all new platform features</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Application Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Join the OG Circle</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold text-white mb-2">Participate in Presale</h3>
              <p className="text-gray-300">Join any presale phase OR stake 15,000+ JY tokens</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold text-white mb-2">Complete Application</h3>
              <p className="text-gray-300">Fill out OG Champ verification form</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold text-white mb-2">Get Verified</h3>
              <p className="text-gray-300">Receive OG status and lifetime benefits</p>
            </div>
          </div>
        </motion.div>

        {/* Application Form */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Join the Elite?</h3>
            <p className="text-gray-400">Subscribe to receive your OG Champ application form</p>
          </div>
          <EmailCapture variant="presale" />
          <p className="text-center text-gray-400 mt-6">
            After subscribing, you'll receive the OG Champ verification form via email.
          </p>
        </div>

        {/* Limited OG Champ Slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-gradient-to-br from-primary-600/20 to-accent-600/20 border-2 border-primary-500 rounded-2xl p-8 mb-12"
        >
          <div className="text-center mb-6">
            <FireIcon className="w-20 h-20 text-orange-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-bold text-white mb-4">🔒 Limited OG Champ Slots 🔒</h3>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-black/40 border border-primary-500/50 rounded-xl p-6">
              <p className="text-xl text-gray-200 text-center mb-4">
                Only the first <span className="text-yellow-400 font-black text-2xl">50 presale participants</span> and 
                <span className="text-yellow-400 font-black text-2xl"> top 50 community contributors</span> will receive permanent OG Champ status.
              </p>
              <div className="bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-lg p-4 border border-red-500/50 text-center">
                <p className="text-lg font-bold text-white mb-2">
                  ⚠️ ZERO TRANSACTION FEES RESERVED EXCLUSIVELY FOR THEM ⚠️
                </p>
                <p className="text-gray-300">
                  This perk alone will save you <span className="text-green-400 font-bold">$1000s</span> over your lifetime on the platform!
                </p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6 text-center">
              <p className="text-gray-300 text-lg">
                Once slots are filled, new members can only qualify through 
                <span className="text-yellow-400 font-bold"> extraordinary community contributions</span> approved by DAO vote.
              </p>
              <p className="text-red-400 font-bold text-xl mt-4">
                🚨 MISS THIS = MISS EVERYTHING 🚨
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center flex gap-4 justify-center flex-wrap">
          <Link 
            href="/presale" 
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all transform hover:scale-105"
          >
            Join Presale Now
          </Link>
          <Link 
            href="/bounty" 
            className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
          >
            Browse Bounties
          </Link>
          <Link 
            href="/" 
            className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
