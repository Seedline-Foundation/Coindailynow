'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountdownTimer from '@/components/CountdownTimer';
import PresalePhases from '@/components/PresalePhases';
import SocialProof from '@/components/SocialProof';
import EmailCapture from '@/components/EmailCapture';

export default function PresalePage() {
  const [mounted, setMounted] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0);
  const presaleTarget = 917500; // ~$917.5k USDC target (3 phases combined)

  useEffect(() => {
    setMounted(true);
    // Simulate live updates (replace with real API)
    const interval = setInterval(() => {
      setTotalRaised((prev) => {
        const increment = Math.random() * 2000;
        return Math.min(prev + increment, presaleTarget);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [presaleTarget]);

  if (!mounted) return null;

  const progress = (totalRaised / presaleTarget) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-20 relative overflow-hidden">
      {/* Animated Background - Mining Treasury */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Treasury Bag - Center - More Visible */}
          <g className="animate-pulse-slow">
            <ellipse cx="600" cy="450" rx="130" ry="150" fill="url(#bagGradient)" opacity="0.6" />
            <path
              d="M 540 360 Q 600 320 660 360 L 660 480 Q 600 520 540 480 Z"
              fill="url(#bagGradient)"
              opacity="0.7"
              stroke="#FCD34D"
              strokeWidth="2"
            />
            <circle cx="600" cy="380" r="8" fill="#D97706" opacity="0.5" />
            <circle cx="580" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <circle cx="620" cy="395" r="6" fill="#D97706" opacity="0.5" />
            <text x="600" y="450" textAnchor="middle" fill="#FCD34D" fontSize="42" fontWeight="bold" opacity="0.8">
              JY
            </text>
          </g>

          {/* Token from TOP - falling down to bag */}
          <g className="token-from-top">
            <circle cx="600" cy="50" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 400; 0 400"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Token from LEFT - moving right to bag */}
          <g className="token-from-left">
            <circle cx="50" cy="450" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
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

          {/* Token from RIGHT - moving left to bag */}
          <g className="token-from-right">
            <circle cx="1150" cy="450" r="18" fill="#FCD34D" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
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

          {/* Token from BOTTOM - rising up to bag */}
          <g className="token-from-bottom">
            <circle cx="600" cy="750" r="18" fill="#FBBF24" opacity="0.7" stroke="#F59E0B" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -300; 0 -300"
                dur="4.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.7;0.9;0" dur="4.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Additional Token from TOP-LEFT diagonal */}
          <g className="token-diagonal-1">
            <circle cx="200" cy="100" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 400 350; 400 350"
                dur="4.8s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Additional Token from TOP-RIGHT diagonal */}
          <g className="token-diagonal-2">
            <circle cx="1000" cy="100" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -400 350; -400 350"
                dur="5.2s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Additional Token from BOTTOM-LEFT diagonal */}
          <g className="token-diagonal-3">
            <circle cx="250" cy="700" r="15" fill="#FCD34D" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 350 -250; 350 -250"
                dur="4.6s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="4.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Additional Token from BOTTOM-RIGHT diagonal */}
          <g className="token-diagonal-4">
            <circle cx="950" cy="700" r="15" fill="#FBBF24" opacity="0.6" stroke="#F59E0B" strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -350 -250; -350 -250"
                dur="5.4s"
                repeatCount="indefinite"
              />
              <animate attributeName="opacity" values="0.6;0.8;0" dur="5.4s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Left Hand - More Visible - Packing tokens */}
          <g className="animate-bounce-slow">
            <ellipse cx="400" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path
              d="M 370 450 Q 365 470 380 485 L 420 480 Q 425 465 410 450 Z"
              fill="url(#handGradient)"
              opacity="0.7"
              stroke="#FBBF24"
              strokeWidth="1.5"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 30 -15; 0 0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            {/* Fingers */}
            <rect x="415" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="405" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          {/* Right Hand - More Visible - Packing tokens */}
          <g className="animate-bounce-slow">
            <ellipse cx="800" cy="470" rx="35" ry="25" fill="url(#handGradient)" opacity="0.6" />
            <path
              d="M 830 450 Q 835 470 820 485 L 780 480 Q 775 465 790 450 Z"
              fill="url(#handGradient)"
              opacity="0.7"
              stroke="#FBBF24"
              strokeWidth="1.5"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -30 -15; 0 0"
                dur="2.3s"
                repeatCount="indefinite"
              />
            </path>
            {/* Fingers */}
            <rect x="777" y="450" width="8" height="20" rx="4" fill="#FCD34D" opacity="0.5" />
            <rect x="787" y="455" width="8" height="18" rx="4" fill="#FCD34D" opacity="0.5" />
          </g>

          {/* Gradients - Enhanced */}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-full">
            <span className="text-white font-bold text-sm">⚡ THE 45-DAY ASCENSION: FROM SEED TO CEX ⚡</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">JY Token Presale</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Funded by the people. Built for the OGs. <span className="text-primary-500 font-bold">No VCs. No middlemen.</span>
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Every dollar raised funds a verifiable milestone. Watch us build in real-time. 
            <span className="text-accent-500 font-bold"> Only 1.7M tokens available.</span>
          </p>
        </motion.div>

        {/* MEGA AIRDROP - EXCLUSIVE FOR FIRST MOVERS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="bg-gradient-to-br from-yellow-600/30 via-orange-600/30 to-red-600/30 border-4 border-yellow-500 rounded-3xl p-10 mb-12 relative overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse"></div>
          
          <div className="relative z-10">
            {/* Attention Grabber */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-full font-black text-lg mb-4 animate-bounce">
                <span>🚨 INSANE OPPORTUNITY 🚨</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                150,000 JY MEGA AIRDROP
              </h2>
              <p className="text-2xl font-bold text-yellow-300 mb-2">
                + LIFETIME ZERO FEES 💎
              </p>
              <p className="text-lg text-gray-200">
                Reserved EXCLUSIVELY for the first 30 speed demons who hit these milestones!
              </p>
            </div>

            {/* Phase Milestones */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Phase 1 */}
              <div className="bg-black/60 border-2 border-yellow-500 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-center mb-4">
                  <div className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-full font-bold text-sm mb-3">
                    🥇 PHASE 1 - LEGENDARY
                  </div>
                  <p className="text-gray-300 text-sm mb-4">First 10 Wallets</p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-5xl font-black text-yellow-400 mb-2">34K</p>
                  <p className="text-gray-300 font-semibold">JY Tokens to Buy</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/50">
                  <p className="text-center text-white font-bold mb-1">YOUR REWARD</p>
                  <p className="text-center text-2xl font-black text-yellow-300">5,000 JY</p>
                  <p className="text-center text-xs text-gray-400 mt-2">*From <strong>50K Treasury Pool</strong></p>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="bg-black/60 border-2 border-orange-500 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-center mb-4">
                  <div className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-black px-4 py-2 rounded-full font-bold text-sm mb-3">
                    🥈 PHASE 2 - ELITE
                  </div>
                  <p className="text-gray-300 text-sm mb-4">First 10 Wallets</p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-5xl font-black text-orange-400 mb-2">21K</p>
                  <p className="text-gray-300 font-semibold">JY Tokens to Buy</p>
                </div>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/50">
                  <p className="text-center text-white font-bold mb-1">YOUR REWARD</p>
                  <p className="text-center text-2xl font-black text-orange-300">5,000 JY</p>
                  <p className="text-center text-xs text-gray-400 mt-2">*From <strong>50K Treasury Pool</strong></p>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="bg-black/60 border-2 border-red-500 rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-center mb-4">
                  <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-bold text-sm mb-3">
                    🥉 PHASE 3 - CHAMPION
                  </div>
                  <p className="text-gray-300 text-sm mb-4">First 10 Wallets</p>
                </div>
                <div className="text-center mb-4">
                  <p className="text-5xl font-black text-red-400 mb-2">12K</p>
                  <p className="text-gray-300 font-semibold">JY Tokens to Buy</p>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg p-4 border border-red-500/50">
                  <p className="text-center text-white font-bold mb-1">YOUR REWARD</p>
                  <p className="text-center text-2xl font-black text-red-300">5,000 JY</p>
                  <p className="text-center text-xs text-gray-400 mt-2">*From <strong>50K Treasury Pool</strong></p>
                </div>
              </div>
            </div>

            {/* Total Value Breakdown */}
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500 rounded-2xl p-8 mb-6">
              <h3 className="text-2xl font-bold text-white text-center mb-6">💰 DO THE MATH - YOU'RE BASICALLY PRINTING MONEY 💰</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-gray-300 mb-2">Total Airdrop Pool</p>
                  <p className="text-5xl font-black gradient-text">150K JY</p>
                  <p className="text-xs text-gray-400 mt-2">*From <strong>Treasury Pool</strong>, distributed after 1.1M staked JY is released</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 mb-2">Lifetime Zero Fees</p>
                  <p className="text-5xl font-black text-green-400">PRICELESS</p>
                  <p className="text-sm text-gray-400 mt-2">Save $1000s Forever</p>
                </div>
              </div>
            </div>

            {/* Urgency Message */}
            <div className="text-center bg-red-600/20 border-2 border-red-500 rounded-xl p-6">
              <p className="text-xl font-bold text-white mb-3">
                ⚡ ONLY 30 TOTAL SPOTS ACROSS ALL PHASES ⚡
              </p>
              <p className="text-gray-200 mb-4">
                Once these 30 wallets claim their spots, this offer VANISHES FOREVER!
              </p>
              <p className="text-sm text-yellow-300 font-semibold">
                ⏰ First come, first served. No exceptions. No second chances. Move FAST! ⏰
              </p>
            </div>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mb-12"
        >
          
          {/* Urgency Badge */}
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full animate-pulse-slow">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-bold">PHASE 1 LIVE NOW • PRICE INCREASES 62% IN PHASE 2</span>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <CountdownTimer targetDate={process.env.NEXT_PUBLIC_PRESALE_END_DATE || '2026-02-15T00:00:00Z'} />
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 bg-gray-800 rounded-2xl p-8 glow-box"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-400 mb-1">Community Raised</p>
              <p className="text-3xl font-bold text-primary-500">
                ${totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 })} USDC
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 mb-1">Total Target</p>
              <p className="text-3xl font-bold text-white">
                ${presaleTarget.toLocaleString('en-US')} USDC
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {progress.toFixed(1)}% Funded by OGs
              </span>
            </div>
          </div>

          {/* Scarcity Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-500">
                ${((presaleTarget - totalRaised) / 1000).toFixed(0)}K
              </p>
              <p className="text-gray-300 text-sm">Remaining Before Sellout</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent-500">6,000,000</p>
              <p className="text-gray-300 text-sm">Max Supply (Fixed Forever)</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-500">4,000,000</p>
              <p className="text-gray-300 text-sm">Will EVER Circulate</p>
            </div>
          </div>
        </motion.div>

        {/* Why This Structure Is Bullish */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8"
        >
          <h2 className="text-3xl font-bold text-center mb-6 text-white">
            🔥 Why OGs Are Loading Up
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-white">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-bold mb-1">Every Phase = Higher ROI</h3>
                <p className="text-gray-300 text-sm">Phase 1: +234% to listing. Phase 2: +106%. Phase 3: +23%. Early entry = maximum gains.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-bold mb-1">Milestone-Gated Transparency</h3>
                <p className="text-gray-300 text-sm">Watch funds flow in real-time. Every unlock triggers a verifiable deliverable—CEX listings, audits, liquidity locks.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-bold mb-1">100% Community-Funded</h3>
                <p className="text-gray-300 text-sm">Zero VCs. Zero middlemen. Pure execution. 40% of funds locked as permanent liquidity to protect your investment.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-bold mb-1">Real Business Model</h3>
                <p className="text-gray-300 text-sm">Connecting Web3 projects with premium African publishers. Revenue from day 1. Not a meme—real utility.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Presale Phases */}
        <PresalePhases />

        {/* Social Proof */}
        <SocialProof />

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-8 md:p-12 text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join the Whitelist Now
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Early access • Bonus tokens • Priority allocation
          </p>
          <a
            href="#email-capture"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Get Whitelisted →
          </a>
        </motion.div>

        {/* Email Capture */}
        <div id="email-capture">
          <EmailCapture variant="presale" />
        </div>
      </div>
    </div>
  );
}
