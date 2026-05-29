'use client';

import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  BriefcaseIcon, 
  BuildingOfficeIcon, 
  PresentationChartLineIcon, 
  CpuChipIcon, 
  CurrencyDollarIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

export interface NarrativeCluster {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  author: string;
  readTime: string;
  imageUrl?: string;
  marketImpact: string;
  keyCompanies: string[];
  relatedStartups: string[];
  sentiment: 'Bullish' | 'Neutral' | 'Bearish';
  sentimentScore: number; // 0-100
  opportunities: string[];
  sourceUrl?: string;
}

interface NarrativeClusterCardProps {
  cluster: NarrativeCluster;
}

export default function NarrativeClusterCard({ cluster }: NarrativeClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSentimentColor = (sentiment: NarrativeCluster['sentiment']) => {
    switch (sentiment) {
      case 'Bullish': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Bearish': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getSentimentIcon = (sentiment: NarrativeCluster['sentiment']) => {
    switch (sentiment) {
      case 'Bullish': return <FaceSmileIcon className="w-4 h-4" />;
      case 'Bearish': return <FaceFrownIcon className="w-4 h-4" />;
      default: return <EllipsisHorizontalIcon className="w-4 h-4" />;
    }
  };

  return (
    <article className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-soft transition-all duration-300 hover:shadow-medium hover:border-neutral-300 flex flex-col gap-4">
      {/* Top Header with Author + Meta */}
      <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
        <div className="flex items-center gap-2">
          <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
            {cluster.category}
          </span>
          <span>•</span>
          <span>{cluster.readTime}</span>
        </div>
        <span>{cluster.publishedAt}</span>
      </div>

      {/* Main Core content */}
      <div className="flex gap-4 items-start">
        {cluster.imageUrl && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 hidden sm:block">
            <img 
              src={cluster.imageUrl} 
              alt={cluster.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-primary-600 leading-tight mb-2">
            {cluster.title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3 leading-relaxed">
            {cluster.excerpt}
          </p>
        </div>
      </div>

      {/* Structured Fields Grid Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-b border-neutral-100 py-3 mt-1">
        {/* Sentiment Indicator */}
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
            Sentiment
          </span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold w-fit ${getSentimentColor(cluster.sentiment)}`}>
            {getSentimentIcon(cluster.sentiment)}
            <span>{cluster.sentiment} ({cluster.sentimentScore}%)</span>
          </div>
        </div>

        {/* Market Impact */}
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
            Market Impact
          </span>
          <div className="flex items-center gap-1.5 text-neutral-800 text-xs font-semibold mt-1">
            <PresentationChartLineIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="truncate">{cluster.marketImpact}</span>
          </div>
        </div>

        {/* Key Companies */}
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
            Key Companies
          </span>
          <div className="flex items-center gap-1.5 text-neutral-800 text-xs font-medium mt-1">
            <BuildingOfficeIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <span className="truncate">{cluster.keyCompanies.join(', ')}</span>
          </div>
        </div>

        {/* Opportunities */}
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider mb-1">
            Opportunities
          </span>
          <div className="flex items-center gap-1.5 text-neutral-800 text-xs font-semibold mt-1">
            <BriefcaseIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="truncate text-emerald-700 font-bold">{cluster.opportunities[0] || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      {isExpanded && (
        <div className="space-y-4 pt-2 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Related Startups */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CpuChipIcon className="w-4 h-4 text-indigo-500" />
                Related Startups
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {cluster.relatedStartups.map((startup, idx) => (
                  <span key={idx} className="bg-white border text-[11px] px-2 py-0.5 rounded-full font-medium text-neutral-700">
                    {startup}
                  </span>
                ))}
              </div>
            </div>

            {/* Complete Opportunities list */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CurrencyDollarIcon className="w-4 h-4 text-emerald-500" />
                Actionable Opportunities
              </h4>
              <ul className="text-xs text-neutral-700 space-y-1 pl-4 list-disc font-sans">
                {cluster.opportunities.map((opp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-xs text-neutral-500 italic mt-2">
            Published by {cluster.author} under CoinDaily Narrative Analysis guidelines.
          </p>
        </div>
      )}

      {/* Expand/Collapse Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-1 py-1.5 border border-neutral-100 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600 transition"
      >
        <span>{isExpanded ? 'Collapse Analysis' : 'Expand Intelligence Map'}</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </article>
  );
}
