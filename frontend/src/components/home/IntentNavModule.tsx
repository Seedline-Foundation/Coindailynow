'use client';

import React from 'react';
import { 
  ChartBarIcon, 
  CpuChipIcon, 
  LightBulbIcon, 
  GlobeAltIcon, 
  RocketLaunchIcon, 
  CurrencyDollarIcon, 
  EyeIcon, 
  MapIcon, 
  ClockIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline';

export const INTENTS = [
  { id: 'track_markets', label: 'Track Markets', icon: ChartBarIcon, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'learn_ai', label: 'Learn AI', icon: CpuChipIcon, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'find_alpha', label: 'Find Alpha', icon: LightBulbIcon, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'understand_macro', label: 'Understand Macro', icon: GlobeAltIcon, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'discover_startups', label: 'Discover Startups', icon: RocketLaunchIcon, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'follow_stablecoins', label: 'Follow Stablecoins', icon: CurrencyDollarIcon, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'watch_smart_money', label: 'Watch Smart Money', icon: EyeIcon, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { id: 'explore_africa', label: 'Explore Africa Tech', icon: MapIcon, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { id: 'read_fast', label: 'Read Fast', icon: ClockIcon, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { id: 'go_deep', label: 'Go Deep', icon: BookOpenIcon, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
] as const;

export type IntentId = typeof INTENTS[number]['id'];

interface IntentNavModuleProps {
  activeIntent: IntentId | null;
  onIntentSelect: (intent: IntentId | null) => void;
}

export default function IntentNavModule({ activeIntent, onIntentSelect }: IntentNavModuleProps) {
  return (
    <div className="w-full space-y-3 mb-8">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-neutral-400">
          What is your objective today?
        </h3>
        {activeIntent && (
          <button
            onClick={() => onIntentSelect(null)}
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
          >
            Clear Intention
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {INTENTS.map((intent) => {
          const Icon = intent.icon;
          const isActive = activeIntent === intent.id;
          return (
            <button
              key={intent.id}
              onClick={() => onIntentSelect(isActive ? null : intent.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-300 ${
                isActive
                  ? 'border-primary-500 bg-primary-500/5 ring-1 ring-primary-500 font-bold scale-[1.02]'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:scale-[1.01]'
              }`}
            >
              <div className={`p-1.5 rounded-lg border ${intent.color}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
              </div>
              <span className="text-xs font-semibold text-neutral-800 leading-tight">
                {intent.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
