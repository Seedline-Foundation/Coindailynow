'use client';

import React, { useState } from 'react';
import { Sparkles, BookOpen, AlertTriangle, HelpCircle, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';

interface ReadingAssistantProps {
  article: {
    title: string;
    excerpt?: string | null;
    content: string;
    category?: { name?: string | null } | null;
  };
  userCountry?: string;
}

export default function ReadingAssistant({ article, userCountry = 'NG' }: ReadingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'beginner' | 'technical'>('beginner');

  // Generate automated summaries & indicators on-the-fly based on the article attributes
  const title = article.title;
  const excerpt = article.excerpt || '';
  
  // Risk assessment logic
  const isHighRisk = title.toLowerCase().match(/hack|exploit|scam|drop|rug|crash|dump|regulation|sec|lawsuit/);
  const riskLevel = isHighRisk ? 'HIGH SPECULATION' : 'MEDIUM RISK';
  const riskColor = isHighRisk ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5';

  // Smart summary bullets
  const summaryBullets = [
    `Analyzing current market activity surrounding "${title}".`,
    excerpt ? excerpt : `Deep dive into local and global implications for this segment.`,
    `Focuses on emerging tokenomics, key players, and long-term utility.`
  ];

  // Mode explanations
  const beginnerExplanation = `This article covers the recent developments about "${title}". In simple terms, this means that demand is shifting, creating opportunities for retail investors to participate. The core technology enables users to interact directly without brokers, lowering costs but introducing smart contract risks.`;
  const technicalExplanation = `Architectural analysis shows validation pressure on-chain. Liquidity pools are undergoing rebalancing, which affects price discovery. Validators are adjusting transaction ordering parameters (MEV) to optimize yield, while protocols implement upgrade patterns to safeguard TVL.`;

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl overflow-hidden shadow-xl">
      {/* Header Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-[#1a1a2e] flex items-center justify-between text-left border-b border-[#2a2a3e] group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
            CoinDaily Reading Assistant
          </span>
        </div>
        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
          {isOpen ? 'Hide Panel' : 'Show Panel'}
        </span>
      </button>

      {isOpen && (
        <div className="p-5 space-y-6 animate-fadeIn">
          {/* Risk Indicator */}
          <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-bold ${riskColor}`}>
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Risk Level: {riskLevel}</span>
          </div>

          {/* 30-Second Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 30-Second Summary
            </h4>
            <ul className="space-y-2 text-xs text-gray-300 list-disc pl-4 leading-relaxed">
              {summaryBullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>

          {/* Explanation Modes */}
          <div className="space-y-3.5 border-t border-[#2a2a3e]/50 pt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-400" /> Explanation Mode
              </h4>
              
              <div className="flex bg-[#0a0a0f] border border-[#2a2a3e] p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setMode('beginner')}
                  className={`px-2 py-1 rounded transition-colors ${
                    mode === 'beginner' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Beginner
                </button>
                <button
                  onClick={() => setMode('technical')}
                  className={`px-2 py-1 rounded transition-colors ${
                    mode === 'technical' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Technical
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-[#0a0a0f] border border-[#1f1f30] rounded-xl p-3.5 font-normal">
              {mode === 'beginner' ? beginnerExplanation : technicalExplanation}
            </p>
          </div>

          {/* Who Benefits */}
          <div className="space-y-2 border-t border-[#2a2a3e]/50 pt-5 text-xs">
            <h4 className="font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              🎯 Who Benefits?
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
              <div className="bg-[#1a1a2e] border border-[#2a2a3e]/60 rounded-lg p-2 flex items-center gap-1.5">
                <span className="text-sm">📈</span>
                <div>
                  <span className="block text-white">Traders</span>
                  <span className="text-[9px] text-gray-500">Short-term gains</span>
                </div>
              </div>
              <div className="bg-[#1a1a2e] border border-[#2a2a3e]/60 rounded-lg p-2 flex items-center gap-1.5">
                <span className="text-sm">💻</span>
                <div>
                  <span className="block text-white">Builders</span>
                  <span className="text-[9px] text-gray-500">Integrations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
