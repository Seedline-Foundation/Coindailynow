'use client';

import React from 'react';
import { Flame, Star, Award, ShieldCheck } from 'lucide-react';

interface StreakBannerProps {
  streakDays?: number;
  articlesReadThisWeek?: number;
  userName?: string;
}

export default function StreakBanner({
  streakDays = 3,
  articlesReadThisWeek = 5,
  userName = 'Reader'
}: StreakBannerProps) {
  // Reward unlock message based on streak size
  const getRewardMessage = () => {
    if (streakDays >= 7) {
      return '7-day streak! You\'ve unlocked complete access to this week\'s Premium Reports.';
    }
    if (streakDays >= 3) {
      return '3-day streak! Keep going for 4 more days to unlock a free Premium PDF report.';
    }
    return 'Read an article tomorrow to start your streak rewards program!';
  };

  return (
    <div className="bg-gradient-to-r from-[#1b1212] to-[#12121a] border border-amber-500/20 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 -right-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 pointer-events-none" />

      {/* Stats Block */}
      <div className="flex items-center gap-4 relative">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/5 animate-pulse">
          <Flame className="h-8 w-8 fill-amber-500/30 text-amber-500" />
        </div>
        
        <div className="space-y-1">
          <h3 className="font-extrabold text-base md:text-lg text-white">
            Welcome back, {userName}!
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed max-w-md">
            You are currently on a <span className="text-amber-400 font-extrabold">{streakDays}-day reading streak</span>. {getRewardMessage()}
          </p>
        </div>
      </div>

      {/* Right statistics overview */}
      <div className="flex gap-4 shrink-0 border-t border-[#2a2a3e]/30 md:border-t-0 pt-4 md:pt-0">
        <div className="bg-[#12121a] border border-[#2a2a3e]/60 rounded-xl px-4 py-2.5 flex items-center gap-2.5 min-w-[110px]">
          <Flame className="h-5 w-5 text-amber-500 fill-amber-500/20" />
          <div>
            <span className="block text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Streak</span>
            <span className="text-sm font-black text-white">{streakDays} Days</span>
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3e]/60 rounded-xl px-4 py-2.5 flex items-center gap-2.5 min-w-[110px]">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <div>
            <span className="block text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Read Week</span>
            <span className="text-sm font-black text-white">{articlesReadThisWeek} Posts</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
