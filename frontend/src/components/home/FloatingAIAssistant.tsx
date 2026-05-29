'use client';

import React, { useState } from 'react';
import { SparklesIcon, XMarkIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (type: string) => {
    setIsLoading(true);
    setResponse('');
    
    let answer = '';
    if (type === 'brief') {
      answer = 'Today in Africa: Stablecoins remain the core hedge against local currency inflation. High-volume developer activity centered in Lagos is focused on Cairo/Starknet tooling. Jobs board displays 15 remote Rust roles.';
    } else if (type === 'opportunities') {
      answer = 'Found opportunities: Base Africa Builder Grants are open ($10k max). Senior Rust Developer position is open at Yellow Card (remote). Starknet developer bootcamp starts in Nairobi next week.';
    } else {
      answer = 'Watchlist Assets are active. BTC is up 1.8% ($104,250), ETH is down 0.6% ($2,485), USD/NGN parallel market remains steady at ₦1,595.';
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < answer.length) {
        setResponse((prev) => prev + answer.charAt(i));
        i += 2;
      } else {
        clearInterval(timer);
        setIsLoading(false);
      }
    }, 15);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setResponse('');
    
    const text = `Processing "${query}"... Our index shows strong stablecoin liquidity correlation with inflation pulses in Nigeria and Ghana. No major regulatory changes in South Africa in the last 6 hours.`;
    
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setResponse((prev) => prev + text.charAt(i));
        i += 2;
      } else {
        clearInterval(timer);
        setIsLoading(false);
        setQuery('');
      }
    }, 15);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-hard hover:scale-105 transition duration-300 animate-bounce-subtle"
          aria-label="Open AI Assistant"
        >
          <SparklesIcon className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Assistant Modal popup */}
      {isOpen && (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-hard w-80 max-w-[90vw] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-[#1c1917] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Ambient Assistant
                </h3>
                <p className="text-[9px] text-neutral-400">
                  Always-on contextual AI partner
                </p>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); setResponse(''); }}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition"
              aria-label="Close Assistant"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {response ? (
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-xs text-neutral-700 leading-relaxed font-sans max-h-32 overflow-y-auto scrollbar-thin">
                <span className="font-semibold text-primary-600">Assistant:</span> {response}
              </div>
            ) : (
              <div className="text-xs text-neutral-500 italic text-center py-2 font-sans">
                Select a preset action below or ask a custom question
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('brief')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition text-center"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-primary-500 mb-1" />
                <span className="text-[9px] font-semibold text-neutral-700">Quick Brief</span>
              </button>
              <button
                onClick={() => handleAction('opportunities')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition text-center"
              >
                <SparklesIcon className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[9px] font-semibold text-neutral-700">Scan Opportunities</span>
              </button>
              <button
                onClick={() => handleAction('watchlist')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-neutral-100 transition text-center"
              >
                <SparklesIcon className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-[9px] font-semibold text-neutral-700">Watchlist status</span>
              </button>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleQuerySubmit} className="flex gap-2 border-t border-neutral-100 pt-3">
              <input
                type="text"
                placeholder="Ask something else..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-300"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-500 text-white p-2 rounded-xl hover:bg-primary-600 transition flex items-center justify-center"
                aria-label="Send Query"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
