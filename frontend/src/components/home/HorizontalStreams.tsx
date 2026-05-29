'use client';

import React, { useState } from 'react';
import { 
  ArrowPathIcon, 
  BoltIcon, 
  EyeIcon, 
  CpuChipIcon, 
  MapIcon, 
  BriefcaseIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface LaneItem {
  id: string;
  title: string;
  meta: string;
  desc?: string;
  badge?: string;
  badgeColor?: string;
}

interface LaneConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  iconColor: string;
  items: LaneItem[];
}

const initialLanes: LaneConfig[] = [
  {
    id: 'fast',
    name: 'Fast Lane',
    icon: BoltIcon,
    iconColor: 'text-amber-500',
    items: [
      { id: 'f1', title: 'Naira Parallel rate bounces back to ₦1,560/$', meta: '10m ago', badge: 'FX MOVE', badgeColor: 'bg-amber-100 text-amber-800' },
      { id: 'f2', title: 'Solana Network transactions hit all-time high', meta: '32m ago', badge: 'SPEED', badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'f3', title: 'Nigeria SEC releases amended VASP regulatory guide', meta: '1h ago', badge: 'REGULATION', badgeColor: 'bg-blue-100 text-blue-800' },
      { id: 'f4', title: 'USDT liquidity in Kenya parallel market swells', meta: '3h ago', badge: 'LIQUIDITY', badgeColor: 'bg-emerald-100 text-emerald-800' },
    ],
  },
  {
    id: 'smart_money',
    name: 'Smart Money Lane',
    icon: EyeIcon,
    iconColor: 'text-pink-500',
    items: [
      { id: 's1', title: 'Whale moves $84M USDT to Africa-based exchange wallets', meta: '2h ago', badge: 'WHALE', badgeColor: 'bg-pink-100 text-pink-800' },
      { id: 's2', title: 'Pan-African VC fund launches $25M crypto accelerator', meta: '5h ago', badge: 'FUNDING', badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 's3', title: 'Yellow Card processes record volume of B2B transactions', meta: '8h ago', badge: 'VOLUME', badgeColor: 'bg-indigo-100 text-indigo-800' },
    ],
  },
  {
    id: 'builder',
    name: 'Builder Lane',
    icon: CpuChipIcon,
    iconColor: 'text-purple-500',
    items: [
      { id: 'b1', title: 'Valora wallet integrates Celo P2P stablecoin off-ramp', meta: 'Yesterday', badge: 'INTEGRATION', badgeColor: 'bg-indigo-100 text-indigo-800' },
      { id: 'b2', title: 'Lagos devs build AI-powered smart contract auditor', meta: '2 days ago', badge: 'AI LAUNCH', badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'b3', title: 'Starknet local hub hosts Cairo boot camp in Nairobi', meta: '3 days ago', badge: 'DEV MEET', badgeColor: 'bg-rose-100 text-rose-800' },
    ],
  },
  {
    id: 'emerging',
    name: 'Emerging Markets',
    icon: MapIcon,
    iconColor: 'text-emerald-500',
    items: [
      { id: 'e1', title: 'South Africa leads continent in institutional crypto volume', meta: '1 day ago', badge: 'REPORT', badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'e2', title: 'Ghana eCedi pilot achieves offline payment milestone', meta: '3 days ago', badge: 'CBDC', badgeColor: 'bg-teal-100 text-teal-800' },
      { id: 'e3', title: 'Caribbean stablecoin regulatory framework drafts finalised', meta: '4 days ago', badge: 'REGULATION', badgeColor: 'bg-blue-100 text-blue-800' },
    ],
  },
  {
    id: 'opportunity',
    name: 'Opportunity Lane',
    icon: BriefcaseIcon,
    iconColor: 'text-cyan-500',
    items: [
      { id: 'o1', title: 'Senior Rust Developer Needed - Remote (Lagos/Nairobi preference)', meta: '$90k - $120k', badge: 'JOB', badgeColor: 'bg-emerald-100 text-emerald-800' },
      { id: 'o2', title: 'Base Africa Builder Grant - Application window open', meta: 'Ends in 14 days', badge: 'GRANT', badgeColor: 'bg-purple-100 text-purple-800' },
      { id: 'o3', title: 'Ethereum Foundation Africa ecosystem grants announced', meta: '$10k - $50k', badge: 'FUND', badgeColor: 'bg-blue-100 text-blue-800' },
    ],
  },
];

export default function HorizontalStreams() {
  const [lanes, setLanes] = useState<LaneConfig[]>(initialLanes);
  const [loadingLane, setLoadingLane] = useState<string | null>(null);

  const handleRefreshLane = (laneId: string) => {
    setLoadingLane(laneId);
    setTimeout(() => {
      // Simulate refreshing data by slightly modifying titles
      setLanes((prev) =>
        prev.map((lane) => {
          if (lane.id === laneId) {
            return {
              ...lane,
              items: lane.items.map((item) => ({
                ...item,
                meta: 'Just now',
              })),
            };
          }
          return lane;
        })
      );
      setLoadingLane(null);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {lanes.map((lane) => {
        const Icon = lane.icon;
        const isLoading = loadingLane === lane.id;

        return (
          <section key={lane.id} className="space-y-4">
            {/* Lane Title & Controller */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${lane.iconColor}`} />
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                  {lane.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRefreshLane(lane.id)}
                  disabled={isLoading}
                  className="p-1 text-neutral-400 hover:text-primary-500 rounded transition"
                  aria-label={`Refresh ${lane.name}`}
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <ChevronRightIcon className="w-4 h-4 text-neutral-400" />
              </div>
            </div>

            {/* Horizontal Scroll wrapper */}
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
              {lane.items.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-72 bg-white border border-neutral-200/80 rounded-xl p-4 shadow-sm hover:border-neutral-300 transition duration-200 snap-start flex flex-col justify-between"
                  style={{ minHeight: '120px' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {item.badge && (
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-tight ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-neutral-400">
                      {item.meta}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-800 line-clamp-3 leading-snug">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
