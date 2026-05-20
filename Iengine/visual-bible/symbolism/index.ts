/**
 * Visual Bible — Symbolism Engine
 * Maintains symbolic consistency across editorial domains.
 */

import { SymbolSet, StoryType } from '../../types';

export const symbolSets: Record<string, SymbolSet> = {
  crypto: {
    category: 'crypto',
    symbols: [
      'holographic coins',
      'blockchain streams',
      'decentralized crowds',
      'glowing validators',
      'digital freedom motifs',
      'floating transaction chains',
      'mining rigs with energy fields',
      'crypto wallet holograms',
    ],
    contexts: [
      'digital marketplaces',
      'decentralized networks',
      'peer-to-peer exchanges',
      'mining operations',
    ],
  },
  ai: {
    category: 'ai',
    symbols: [
      'neural lattices',
      'synthetic eyes',
      'machine consciousness',
      'intelligence spheres',
      'data neural networks',
      'quantum processing cores',
      'algorithmic patterns',
      'digital brain structures',
    ],
    contexts: [
      'research laboratories',
      'data centers',
      'neural processing environments',
      'abstract cognitive spaces',
    ],
  },
  regulation: {
    category: 'regulation',
    symbols: [
      'digital courtrooms',
      'surveillance grids',
      'cyber legislation',
      'institutional barriers',
      'government seals holographic',
      'compliance checkpoints',
      'regulatory frameworks',
      'legal document holograms',
    ],
    contexts: [
      'government buildings',
      'regulatory chambers',
      'compliance offices',
      'institutional corridors',
    ],
  },
  afrofuturism: {
    category: 'afrofuturism',
    symbols: [
      'smart-city Lagos skylines',
      'fintech kiosks',
      'mobile finance',
      'digital markets',
      'youth innovation hubs',
      'mobile payment terminals',
      'pan-African data networks',
      'solar-tech infrastructure',
    ],
    contexts: [
      'Lagos fintech districts',
      'Nairobi startup ecosystems',
      'African smart cities',
      'mobile money corridors',
      'digital marketplace streets',
    ],
  },
  cybercrime: {
    category: 'cybercrime',
    symbols: [
      'corrupted interfaces',
      'glitch artifacts',
      'surveillance terminals',
      'dark web portals',
      'hacked data streams',
      'digital evidence trails',
      'anonymous masks',
      'encrypted communication nodes',
    ],
    contexts: [
      'dark server rooms',
      'surveillance centers',
      'compromised networks',
      'underground digital bazaars',
    ],
  },
  tradfi: {
    category: 'tradfi',
    symbols: [
      'institutional towers',
      'financial dashboards',
      'trading floor terminals',
      'global market maps',
      'bond yield curves',
      'institutional portfolios',
      'executive boardrooms',
      'vault architectures',
    ],
    contexts: [
      'Wall Street corridors',
      'central bank interiors',
      'institutional trading floors',
      'financial district skylines',
    ],
  },
  market: {
    category: 'market-analysis',
    symbols: [
      'candlestick charts holographic',
      'volume bars',
      'trend lines',
      'order book depth visualizations',
      'price action waves',
      'market sentiment gauges',
      'liquidation cascades',
      'whale movement indicators',
    ],
    contexts: [
      'trading dashboards',
      'analytics rooms',
      'market monitoring centers',
      'data visualization spaces',
    ],
  },
};

/**
 * Get symbols relevant to a story type.
 */
export function getSymbols(storyType: StoryType, limit: number = 4): string[] {
  const mapping: Record<string, string> = {
    'breaking-news': 'crypto',
    'premium-feature': 'crypto',
    'market-analysis': 'market',
    cybercrime: 'cybercrime',
    regulation: 'regulation',
    'ai-future': 'ai',
    'startup-vc': 'crypto',
    afrofuturism: 'afrofuturism',
    'thumbnail-fast': 'crypto',
    'social-banner': 'crypto',
  };

  const key = mapping[storyType] || 'crypto';
  const set = symbolSets[key];
  if (!set) return [];

  return set.symbols.slice(0, limit);
}

/**
 * Get context environments for symbols.
 */
export function getSymbolContexts(storyType: StoryType): string[] {
  const mapping: Record<string, string> = {
    'breaking-news': 'crypto',
    'premium-feature': 'crypto',
    'market-analysis': 'market',
    cybercrime: 'cybercrime',
    regulation: 'regulation',
    'ai-future': 'ai',
    'startup-vc': 'crypto',
    afrofuturism: 'afrofuturism',
    'thumbnail-fast': 'crypto',
    'social-banner': 'crypto',
  };

  const key = mapping[storyType] || 'crypto';
  return symbolSets[key]?.contexts || [];
}

export default symbolSets;
