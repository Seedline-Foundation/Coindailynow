'use client';

import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, CloudIcon, BoltIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface PersonalizedBriefPanelProps {
  countryCode: string;
}

export default function PersonalizedBriefPanel({ countryCode = 'NG' }: PersonalizedBriefPanelProps) {
  const { t } = useLanguage();
  const [greeting, setGreeting] = useState('Good Day');
  const [timeIcon, setTimeIcon] = useState(<SunIcon className="w-5 h-5 text-amber-500 animate-spin-slow" />);
  const [isLoading, setIsLoading] = useState(false);

  const countryNames: Record<string, string> = {
    NG: 'Nigeria',
    ZA: 'South Africa',
    KE: 'Kenya',
    GH: 'Ghana',
    EG: 'Egypt',
  };
  const countryName = countryNames[countryCode.toUpperCase()] || 'Africa';

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting('Good Morning');
      setTimeIcon(<SunIcon className="w-6 h-6 text-amber-500 animate-pulse" />);
    } else if (hours < 17) {
      setGreeting('Good Afternoon');
      setTimeIcon(<CloudIcon className="w-6 h-6 text-sky-400" />);
    } else {
      setGreeting('Good Evening');
      setTimeIcon(<MoonIcon className="w-6 h-6 text-indigo-400" />);
    }
  }, []);

  const handleRefreshBrief = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const deltaUpdates = [
    { id: '1', text: 'Binance NGN P2P volume surged 12% in the past 12 hrs.' },
    { id: '2', text: '3 Web3 startups in Lagos announced fresh seed funding.' },
    { id: '3', text: 'South Africa FSCA announced 4 additional exchange approvals.' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-soft p-5 space-y-6">
      {/* Header section with Greeting */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-50 rounded-xl">
            {timeIcon}
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 leading-tight">
              {greeting}, {countryName}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Welcome back to your cockpit
            </p>
          </div>
        </div>
        <button 
          onClick={handleRefreshBrief}
          disabled={isLoading}
          className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-neutral-50 rounded-lg transition-all"
          aria-label="Refresh intelligence brief"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Brief Summary Box */}
      <div className="bg-gradient-to-br from-primary-50/50 to-secondary-50/30 border border-primary-100/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BoltIcon className="w-4 h-4 text-primary-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-800">
            Intelligence Briefing
          </h3>
        </div>
        <p className="text-xs text-neutral-700 leading-relaxed font-sans">
          The macro environment remains dynamic. Stablecoin P2P indices in {countryName} show slightly increased premium rates (+1.5%). High-liquidity volume has moved to stable arbitrage rails, while local blockchain startup integrations have picked up pace.
        </p>
      </div>

      {/* Delta Updates (What Changed) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Since your last session
        </h4>
        <div className="space-y-3">
          {deltaUpdates.map((update) => (
            <div key={update.id} className="flex gap-2.5 items-start">
              <CheckCircleIcon className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-neutral-600 leading-normal font-sans">
                {update.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Shortcut widgets */}
      <div className="border-t border-neutral-100 pt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
          <span>Quick Context</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/70 transition cursor-pointer">
            <div className="font-mono font-bold text-neutral-900">42 ms</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Solana Ping</div>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/70 transition cursor-pointer">
            <div className="font-mono font-bold text-neutral-900">8 Gwei</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Gas Price</div>
          </div>
        </div>
      </div>
    </div>
  );
}
