'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface PulseItem {
  id: string;
  name: string;
  category: 'Inflation' | 'P2P Premium' | 'AI & Compute';
  value: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
  region?: string;
}

const initialPulses: PulseItem[] = [
  { id: '1', name: 'Nigeria Inflation (CPI)', category: 'Inflation', value: '33.2%', change: '-0.4%', direction: 'down', region: 'NG' },
  { id: '2', name: 'South Africa CPI', category: 'Inflation', value: '5.2%', change: '+0.1%', direction: 'up', region: 'ZA' },
  { id: '3', name: 'Kenya CPI', category: 'Inflation', value: '4.8%', change: '-0.2%', direction: 'down', region: 'KE' },
  { id: '4', name: 'Naira P2P Premium', category: 'P2P Premium', value: '+1.5%', change: '+0.3%', direction: 'up', region: 'NG' },
  { id: '5', name: 'Cedi P2P Premium', category: 'P2P Premium', value: '+2.8%', change: '+0.1%', direction: 'up', region: 'GH' },
  { id: '6', name: 'AI Compute Index (Llama 3)', category: 'AI & Compute', value: '$0.02 / 1M', change: '-12.5%', direction: 'down' },
  { id: '7', name: 'GPT-4o GPU Spot Cost', category: 'AI & Compute', value: '$1.85 / hr', change: '-5.0%', direction: 'down' },
];

export default function MarketPulseRow() {
  const [pulses, setPulses] = useState<PulseItem[]>(initialPulses);

  // Simulate subtle real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setPulses((prev) =>
        prev.map((item) => {
          if (Math.random() > 0.7) {
            const currentVal = parseFloat(item.value.replace(/[^0-9.-]/g, ''));
            const changePercent = parseFloat(item.change.replace(/[^0-9.-]/g, ''));
            const noise = (Math.random() - 0.5) * 0.1;
            const newVal = currentVal + noise;
            const direction = noise >= 0 ? 'up' : 'down';
            const changeSign = noise >= 0 ? '+' : '';
            
            let formattedValue = '';
            if (item.value.includes('%')) {
              formattedValue = `${newVal.toFixed(1)}%`;
            } else if (item.value.includes('/')) {
              formattedValue = item.value.split(' ')[0] + ' ' + item.value.split(' ').slice(1).join(' ');
            } else {
              formattedValue = `${item.value[0]}${newVal.toFixed(2)}`;
            }

            return {
              ...item,
              value: item.value.includes('%') ? `${newVal.toFixed(1)}%` : item.value,
              change: `${changeSign}${noise.toFixed(2)}%`,
              direction,
            };
          }
          return item;
        })
      );
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#1c1917]/95 text-[#fafaf9] rounded-2xl border border-neutral-800 p-5 shadow-soft mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-neutral-400">
            Adaptive Macro Pulse
          </h2>
        </div>
        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
          Live Updates
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {pulses.map((pulse) => (
          <div
            key={pulse.id}
            className="flex flex-col p-3 rounded-xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/50 transition-all duration-300 hover:scale-[1.03] group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tight block truncate">
                {pulse.category}
              </span>
              {pulse.region && (
                <span className="text-[9px] bg-neutral-800 text-neutral-500 px-1 py-0.2 rounded font-semibold uppercase">
                  {pulse.region}
                </span>
              )}
            </div>
            
            <h3 className="text-xs font-semibold text-neutral-300 group-hover:text-primary-400 transition-colors truncate mb-1">
              {pulse.name.replace(/ \(.*\)/, '')}
            </h3>

            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-sm font-bold font-mono text-white">
                {pulse.value}
              </span>
              <span
                className={`text-[9px] font-mono flex items-center gap-0.5 font-bold ${
                  pulse.direction === 'up'
                    ? 'text-emerald-500'
                    : pulse.direction === 'down'
                    ? 'text-red-500'
                    : 'text-neutral-500'
                }`}
              >
                {pulse.direction === 'up' ? (
                  <ArrowTrendingUpIcon className="w-2.5 h-2.5" />
                ) : (
                  <ArrowTrendingDownIcon className="w-2.5 h-2.5" />
                )}
                {pulse.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
