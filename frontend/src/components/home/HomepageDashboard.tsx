'use client';

import React, { useState } from 'react';
import MarketPulseRow from './MarketPulseRow';
import IntentNavModule, { IntentId } from './IntentNavModule';
import PersonalizedBriefPanel from './PersonalizedBriefPanel';
import NarrativeGalaxyPreview from './NarrativeGalaxyPreview';
import NarrativeClusterCard, { NarrativeCluster } from './NarrativeClusterCard';
import HorizontalStreams from './HorizontalStreams';
import RightRailCockpit from './RightRailCockpit';
import FloatingAIAssistant from './FloatingAIAssistant';
import CountrySwitcher from '@/components/news/CountrySwitcher';

const mockNarratives: NarrativeCluster[] = [
  {
    id: 'nar-1',
    title: 'Stablecoin Hedging Surges in West Africa Amid Local Currency Adjustments',
    excerpt: 'Across Nigeria and Ghana, retail users and fintech companies are shifting reserves into USDT and USDC. This transition is motivated by recent FX changes and parallel market pressures. Local exchanges report a 25% increase in stablecoin holdings over the past 30 days.',
    category: 'Emerging Markets',
    publishedAt: '28 May 2026',
    author: 'Kwame Osei',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=300&auto=format&fit=crop',
    marketImpact: 'Naira Parallel rate drops 2.5%, stablecoin premium climbs to +1.5%',
    keyCompanies: ['Yellow Card', 'Busha', 'Quidax'],
    relatedStartups: ['Helicarrier', 'Bitlipa', 'Canza Finance'],
    sentiment: 'Bullish',
    sentimentScore: 78,
    opportunities: ['Base Africa Builder Grants open ($10k max)', 'Yellow Card is hiring a remote Senior Rust Developer', 'Airdrop rewards for liquidity pools on local rails'],
  },
  {
    id: 'nar-2',
    title: 'Nairobi Tech Hub Hosts Starknet Builder Cairo Hackathon',
    excerpt: 'Developers in East Africa are gathering for the Cairo workshop, seeking developer grants and technical integration mentorship. Building on Starknet allows local fintech apps to bypass high Ethereum gas fees, providing micro-transaction capability to small businesses.',
    category: 'Builder News',
    publishedAt: '27 May 2026',
    author: 'Amina Hassan',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=300&auto=format&fit=crop',
    marketImpact: 'Celo/Starknet integration volume rises by 8%',
    keyCompanies: ['Starknet Foundation', 'Ethereum Foundation'],
    relatedStartups: ['Bitpesa', 'LipaLater'],
    sentiment: 'Bullish',
    sentimentScore: 85,
    opportunities: ['Cairo Hackathon prizes up to $25k', 'Emerging market builder mentorship openings'],
  },
  {
    id: 'nar-3',
    title: 'South Africa FSCA Unveils Crypto Compliance Guidelines',
    excerpt: 'The Financial Sector Conduct Authority has outlined new rules for local financial advisers seeking to recommend crypto assets to institutional investors. This step is expected to boost local exchange compliance rates.',
    category: 'Regulation',
    publishedAt: '26 May 2026',
    author: 'Thabo Mthembu',
    readTime: '5 min read',
    marketImpact: 'Institutional compliance costs increase, local market trust improves',
    keyCompanies: ['FSCA South Africa'],
    relatedStartups: ['Luno', 'VALR'],
    sentiment: 'Neutral',
    sentimentScore: 60,
    opportunities: ['Compliance consulting opportunities in Cape Town', 'Luno regulatory specialist jobs open'],
  }
];

interface HomepageDashboardProps {
  countryCode: string;
  countrySlug: string;
  languageCode: string;
}

export default function HomepageDashboard({
  countryCode,
  countrySlug,
  languageCode,
}: HomepageDashboardProps) {
  const [activeIntent, setActiveIntent] = useState<IntentId | null>(null);

  // Filter spotlight narratives based on active intention
  const filteredNarratives = mockNarratives.filter((nar) => {
    if (!activeIntent) return true;
    if (activeIntent === 'track_markets') return true; // Markets apply to all
    if (activeIntent === 'explore_africa') return nar.category === 'Emerging Markets' || nar.category === 'Builder News';
    if (activeIntent === 'follow_stablecoins') return nar.id === 'nar-1';
    if (activeIntent === 'discover_startups') return nar.category === 'Builder News' || nar.id === 'nar-1';
    if (activeIntent === 'understand_macro') return nar.category === 'Emerging Markets' || nar.category === 'Regulation';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* 1. Country Switcher & Market Tickers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <CountrySwitcher currentCountryCode={countryCode} />
        <span className="text-xs text-neutral-500 font-medium">
          Language: <span className="font-bold uppercase">{languageCode}</span>
        </span>
      </div>

      {/* 2. Market Pulse Row */}
      <MarketPulseRow />

      {/* 3. Objective Intent Nav */}
      <IntentNavModule 
        activeIntent={activeIntent} 
        onIntentSelect={setActiveIntent} 
      />

      {/* 4. Three-Column Responsive Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personalized Briefing Cockpit (L1 Welcome) */}
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
          <PersonalizedBriefPanel countryCode={countryCode} />
        </aside>

        {/* Center Column: Core Content spotlight */}
        <main className="lg:col-span-6 space-y-8">
          {/* Narrative Galaxy node graph representation */}
          <NarrativeGalaxyPreview />

          {/* Spotlight section header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wide">
                {activeIntent 
                  ? `Spotlight: ${activeIntent.replace('_', ' ').toUpperCase()}` 
                  : 'Narrative Spotlight'}
              </h2>
              <span className="text-xs text-neutral-400 font-semibold font-mono">
                {filteredNarratives.length} narratives found
              </span>
            </div>

            {/* List of cards */}
            <div className="space-y-6">
              {filteredNarratives.map((cluster) => (
                <NarrativeClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          </div>

          {/* Horizontal scroll lanes */}
          <div className="pt-4">
            <h2 className="text-lg font-bold text-neutral-900 uppercase tracking-wide mb-6">
              Intelligence Streams
            </h2>
            <HorizontalStreams />
          </div>
        </main>

        {/* Right Column: Sticky Action Cockpit */}
        <aside className="lg:col-span-3 space-y-6">
          <RightRailCockpit />
        </aside>
      </div>

      {/* Ambient Floating AI assistant overlay */}
      <FloatingAIAssistant />
    </div>
  );
}
