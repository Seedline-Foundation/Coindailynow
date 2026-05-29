'use client';

import React, { useState } from 'react';

export interface TermDefinition {
  title: string;
  definition: string;
  regionalTips?: Record<string, string>; // Country code to specific tip
}

export const TERMS_DATABASE: Record<string, TermDefinition> = {
  mev: {
    title: 'MEV (Maximal Extractable Value)',
    definition: 'The maximum value a block producer (miner or validator) can extract by inserting, omitting, or reordering transactions within blocks they produce.',
    regionalTips: {
      NG: 'In Nigeria, high MEV activity can occasionally increase slippage on decentralized exchange P2P swaps.',
      KE: 'KE validators are increasingly participating in MEV-Boost to maximize staking rewards.'
    }
  },
  defi: {
    title: 'DeFi (Decentralized Finance)',
    definition: 'An umbrella term for financial applications in cryptocurrency or blockchain geared toward disrupting traditional financial intermediaries.',
    regionalTips: {
      NG: 'DeFi platforms like Uniswap are actively used in Nigeria to earn yield on dollar-pegged stablecoins.',
      KE: 'Kenyan freelancers use DeFi lending pools to borrow cash using crypto assets as collateral.'
    }
  },
  stablecoin: {
    title: 'Stablecoin',
    definition: 'A cryptocurrency whose value is pegged to another asset, usually a fiat currency like the US Dollar (e.g., USDT, USDC).',
    regionalTips: {
      NG: 'Stablecoins are heavily traded in Nigeria as an alternative savings mechanism to mitigate Naira inflation.',
      KE: 'Stablecoins can be directly converted into Kenyan Shillings via M-Pesa agent networks.',
      BR: 'In Brazil, stablecoins like USDT are frequently transferred instantly using PIX via local crypto desks.'
    }
  },
  p2p: {
    title: 'P2P (Peer-to-Peer) Trading',
    definition: 'Direct exchange of cryptocurrencies between buyers and sellers, where payment is made directly between bank accounts or mobile wallets without a central broker.',
    regionalTips: {
      NG: 'P2P trading remains the primary method for Nigerians to buy/sell crypto following prior banking guidelines.',
      KE: 'P2P markets in Kenya rely heavily on M-Pesa transfers, with escrow services securing transactions.',
      BR: 'P2P desks in Brazil are increasingly moving transactions via PIX keys for instantaneous fiat settlement.'
    }
  },
  cpi: {
    title: 'CPI (Consumer Price Index)',
    definition: 'A measure of the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services, indicating inflation levels.',
    regionalTips: {
      NG: 'High CPI inflation in Nigeria makes holding local currency volatile, driving capital flows into stablecoins.',
      AR: 'Severe CPI increases in Argentina make holding stablecoins like USDC a necessity for daily savings preservation.'
    }
  },
  etf: {
    title: 'ETF (Exchange-Traded Fund)',
    definition: 'An investment fund traded on stock exchanges, much like stocks. Crypto ETFs track spot or futures pricing of assets like Bitcoin or Ethereum.',
    regionalTips: {
      ZA: 'South Africa has licensed some crypto indexes, although retail access to spot US ETFs is restricted by exchange control regulations.'
    }
  }
};

interface InlineExplainCardProps {
  termKey: string;
  children: React.ReactNode;
  userCountry?: string;
}

export default function InlineExplainCard({ termKey, children, userCountry = 'NG' }: InlineExplainCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const term = TERMS_DATABASE[termKey.toLowerCase()];

  if (!term) return <>{children}</>;

  const regionalTip = term.regionalTips?.[userCountry.toUpperCase()];

  return (
    <span
      className="relative inline-block cursor-help border-b border-dashed border-amber-500 text-amber-400 font-medium"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      
      {isOpen && (
        <span className="absolute z-50 left-1/2 bottom-full mb-2 w-64 -translate-x-1/2 rounded-xl bg-[#12121a] border border-[#2a2a3e] p-4 text-xs text-white shadow-2xl animate-fadeIn pointer-events-none block font-normal leading-relaxed">
          <span className="font-bold text-amber-400 block mb-1.5">{term.title}</span>
          <span className="text-gray-300 block">{term.definition}</span>
          {regionalTip && (
            <span className="mt-2.5 pt-2 border-t border-[#2a2a3e]/40 block text-gray-400">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-500 block mb-0.5">Local Impact Hint:</span>
              {regionalTip}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
