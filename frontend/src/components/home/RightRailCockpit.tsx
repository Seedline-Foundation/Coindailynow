'use client';

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  TrashIcon, 
  PlusIcon,
  BookmarkIcon,
  BellIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface WatchlistItem {
  symbol: string;
  price: string;
  change: string;
  isUp: boolean;
}

const defaultAssets = [
  { symbol: 'BTC', price: '$104,250', change: '+1.8%', isUp: true },
  { symbol: 'ETH', price: '$2,485', change: '-0.6%', isUp: false },
  { symbol: 'USDT/NGN', price: '₦1,595', change: '+0.1%', isUp: true },
  { symbol: 'USD/ZAR', price: 'R18.25', change: '-0.4%', isUp: false },
];

export default function RightRailCockpit() {
  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newAssetSymbol, setNewAssetSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // AI Assistant state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load watchlist
  useEffect(() => {
    const saved = localStorage.getItem('coindaily_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch {
        setWatchlist(defaultAssets);
      }
    } else {
      setWatchlist(defaultAssets);
    }
  }, []);

  const saveWatchlist = (list: WatchlistItem[]) => {
    setWatchlist(list);
    localStorage.setItem('coindaily_watchlist', JSON.stringify(list));
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetSymbol.trim()) return;
    
    const symbol = newAssetSymbol.trim().toUpperCase();
    if (watchlist.some(item => item.symbol === symbol)) {
      setNewAssetSymbol('');
      setIsAdding(false);
      return;
    }

    const price = Math.random() > 0.5 ? `$${(Math.random() * 100).toFixed(2)}` : `₦${(Math.random() * 1000).toFixed(0)}`;
    const changePct = (Math.random() * 4 - 2).toFixed(2);
    const change = (parseFloat(changePct) >= 0 ? '+' : '') + changePct + '%';
    const isUp = parseFloat(changePct) >= 0;

    const updated = [...watchlist, { symbol, price, change, isUp }];
    saveWatchlist(updated);
    setNewAssetSymbol('');
    setIsAdding(false);
  };

  const handleRemoveAsset = (symbol: string) => {
    const updated = watchlist.filter(item => item.symbol !== symbol);
    saveWatchlist(updated);
  };

  // AI Assistant Actions
  const handleAiAsk = (queryStr: string) => {
    if (!queryStr.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    
    // Simulate streaming SSE response
    const mockResponses: Record<string, string> = {
      'what happened with ngn?': 'Over the last 24 hours, the NGN parallel market rate stabilized at around ₦1,580/$, following steady inflows and stablecoin off-ramp activities. Local liquidity is up 4%.',
      'latest ai startup funding?': 'A Lagos-based AI platform specializing in automated legal audit software raised $1.2M in seed capital from local and international syndicates to expand in West Africa.',
      'explain macro impact in simple english': 'Higher inflation in Nigeria (33.2%) and Ghana (25%) is driving consumers toward stablecoins (USDT/USDC) as currency hedges. P2P premium rates are slightly elevated to match this demand.'
    };

    const normalizedQuery = queryStr.toLowerCase().trim();
    let text = mockResponses[normalizedQuery] || 'Analyzing current CoinDaily feed... Based on latest market indicators, stablecoin volume in East Africa has increased by 8% and compute cost index remains flat.';
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < text.length) {
        setAiResponse((prev) => prev + text.charAt(currentIdx));
        currentIdx += 2; // Stream 2 chars at a time
      } else {
        clearInterval(interval);
        setIsAiLoading(false);
      }
    }, 15);
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* 1. AI Assistant Cockpit */}
      <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-slate-100 rounded-2xl p-5 shadow-soft border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Intelligence AI Copilot
          </h3>
        </div>
        
        <div className="space-y-3">
          {aiResponse && (
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs leading-relaxed max-h-36 overflow-y-auto font-sans scrollbar-thin">
              <span className="font-semibold text-amber-400">Copilot:</span> {aiResponse}
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleAiAsk(aiQuery); }} className="relative">
            <input 
              type="text" 
              placeholder="Ask Copilot about markets..." 
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition"
            />
            <button 
              type="submit" 
              disabled={isAiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-400 disabled:opacity-50"
            >
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex flex-col gap-1.5 pt-1">
            <button 
              onClick={() => { setAiQuery('what happened with NGN?'); handleAiAsk('what happened with NGN?'); }}
              className="text-left text-[10px] text-slate-400 hover:text-white truncate font-sans hover:underline"
            >
              ✦ What happened with NGN parallel market?
            </button>
            <button 
              onClick={() => { setAiQuery('explain macro impact in simple English'); handleAiAsk('explain macro impact in simple English'); }}
              className="text-left text-[10px] text-slate-400 hover:text-white truncate font-sans hover:underline"
            >
              ✦ Explain macro inflation impact simply
            </button>
          </div>
        </div>
      </div>

      {/* 2. Watchlist Panel */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-primary-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-800">
              Personal Watchlist
            </h3>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 hover:bg-neutral-50 rounded text-neutral-500 hover:text-primary-500 transition"
            aria-label="Add asset to watchlist"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddAsset} className="flex gap-2 mb-3">
            <input 
              type="text" 
              placeholder="e.g. BTC, NGN" 
              value={newAssetSymbol}
              onChange={(e) => setNewAssetSymbol(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-neutral-300"
            />
            <button 
              type="submit" 
              className="bg-primary-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-primary-600 transition"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-3">
          {watchlist.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between border-b border-neutral-50 pb-2 last:border-0 last:pb-0">
              <div>
                <span className="text-xs font-bold text-neutral-800">{item.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-neutral-900">{item.price}</div>
                  <div className={`text-[10px] font-mono font-semibold ${item.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.change}
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveAsset(item.symbol)}
                  className="p-1 text-neutral-300 hover:text-rose-600 rounded transition"
                  aria-label={`Remove ${item.symbol}`}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bookmarks & Reading History */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <BookmarkIcon className="w-5 h-5 text-sky-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-800">
            Continue Reading
          </h3>
        </div>
        <div className="space-y-2 text-xs">
          <a href="#" className="block py-1 hover:text-primary-500 truncate transition font-sans">
            📄 South Africa FSCA VASP requirements checklist
          </a>
          <a href="#" className="block py-1 hover:text-primary-500 truncate transition font-sans">
            📄 Understanding the Celo transition to Layer 2
          </a>
        </div>
      </div>
    </div>
  );
}
