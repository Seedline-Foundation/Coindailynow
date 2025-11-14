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
  const presaleTarget = 350000; // $350k USDC target

  useEffect(() => {
    setMounted(true);
    // Simulate live updates (replace with real API)
    const interval = setInterval(() => {
      setTotalRaised((prev) => {
        const increment = Math.random() * 1000;
        return Math.min(prev + increment, presaleTarget);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [presaleTarget]);

  if (!mounted) return null;

  const progress = (totalRaised / presaleTarget) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Joy Token Presale</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Don't miss your chance to join Africa's crypto revolution
          </p>
          
          {/* Urgency Badge */}
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full animate-pulse-slow">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-bold">PRESALE LIVE NOW</span>
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
              <p className="text-gray-400 mb-1">Raised</p>
              <p className="text-3xl font-bold text-primary-500">
                ${totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 })} USDC
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 mb-1">Target</p>
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
                {progress.toFixed(1)}% Completed
              </span>
            </div>
          </div>

          {/* Scarcity Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary-500">
                {((presaleTarget - totalRaised) / presaleTarget * 100).toFixed(0)}%
              </p>
              <p className="text-gray-300 text-sm">Remaining</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-accent-500">5,000,000</p>
              <p className="text-gray-300 text-sm">Max Supply (Forever)</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-500">800,000</p>
              <p className="text-gray-300 text-sm">Presale Allocation</p>
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
