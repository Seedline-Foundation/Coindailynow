'use client';

import React from 'react';
import { ExternalLink, ShieldCheck, Cpu, Info } from 'lucide-react';

interface SourceBadgeProps {
  sourceUrl?: string;
  sourceName?: string;
  txHash?: string;
  txNetwork?: string;
  aiAssisted?: boolean;
  confidenceScore?: number; // 0 to 100
}

export default function SourceBadge({
  sourceUrl,
  sourceName = 'Primary Source',
  txHash,
  txNetwork = 'Solana',
  aiAssisted = true,
  confidenceScore = 94
}: SourceBadgeProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 70) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      {/* Confidence Score */}
      <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1 font-bold ${getScoreColor(confidenceScore)}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Trust Score: {confidenceScore}%</span>
      </div>

      {/* AI Disclosure */}
      {aiAssisted && (
        <div className="px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 flex items-center gap-1 font-bold">
          <Cpu className="h-3.5 w-3.5" />
          <span>AI-Assisted Fact Check</span>
        </div>
      )}

      {/* External Reference */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-full border border-[#2a2a3e] bg-[#12121a] text-gray-300 hover:text-white hover:border-gray-500 flex items-center gap-1.5 font-bold transition-all"
        >
          <span>Source: {sourceName}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {/* On-Chain Reference */}
      {txHash && (
        <a
          href={`https://explorer.solana.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:border-purple-500/50 flex items-center gap-1.5 font-bold transition-all"
        >
          <span>On-Chain Audit ({txNetwork})</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
