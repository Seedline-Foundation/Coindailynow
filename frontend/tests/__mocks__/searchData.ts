/**
 * Mock Search Data for Testing
 * Task 23: Search Interface Components Test Data
 */

export const mockSearchResults = {
  results: [
    {
      id: '1',
      title: 'Bitcoin Price Analysis: African Markets Leading Growth',
      excerpt: 'Deep dive into how African cryptocurrency markets are driving Bitcoin adoption and price movements across the continent.',
      url: '/articles/bitcoin-price-analysis-african-markets',
      type: 'ARTICLE',
      relevanceScore: 0.95,
      isAiGenerated: true,
      isPremium: true,
      publishedAt: new Date().toISOString(),
      author: 'CoinDaily AI',
      readTime: 5,
      category: 'Market Analysis'
    },
    {
      id: '2',
      title: 'Bitcoin Trading in Nigeria: Complete Guide',
      excerpt: 'Everything you need to know about trading Bitcoin in Nigeria, including exchanges, regulations, and mobile money integration.',
      url: '/articles/bitcoin-trading-nigeria-guide',
      type: 'ARTICLE',
      relevanceScore: 0.88,
      isAiGenerated: false,
      isPremium: false,
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      author: 'Adebayo Ogundimu',
      readTime: 8,
      category: 'Trading Guides'
    },
    {
      id: '3',
      title: 'BTC',
      excerpt: 'Bitcoin (BTC) - The first and largest cryptocurrency by market capitalization',
      url: '/tokens/bitcoin',
      type: 'TOKEN',
      relevanceScore: 0.92,
      isAiGenerated: false,
      isPremium: false,
      publishedAt: null,
      currentPrice: 43250.75,
      change24h: 2.45,
      marketCap: 847000000000
    },
    {
      id: '4',
      title: 'Cryptocurrency Trading Community Discussion',
      excerpt: 'Active discussion about Bitcoin price predictions and African market trends',
      url: '/community/post/crypto-trading-discussion',
      type: 'COMMUNITY_POST',
      relevanceScore: 0.76,
      isAiGenerated: false,
      isPremium: false,
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      author: 'KenyaCryptoTrader',
      replies: 23,
      upvotes: 45
    }
  ],
  total: 4,
  searchTime: 0.045,
  searchType: 'AI_POWERED'
};

export const mockSearchSuggestions = [
  {
    query: 'Bitcoin Price Analysis',
    type: 'AUTOCOMPLETE',
    count: 156,
    category: 'Articles'
  },
  {
    query: 'Bitcoin Trading in Nigeria',
    type: 'AUTOCOMPLETE',
    count: 89,
    category: 'Articles'
  },
  {
    query: 'BTC Token Information',
    type: 'AUTOCOMPLETE',
    count: 1,
    category: 'Tokens'
  },
  {
    query: 'Bitcoin halving 2024',
    type: 'TRENDING',
    count: 234,
    category: 'Articles'
  },
  {
    query: 'Ethereum staking Nigeria',
    type: 'TRENDING',
    count: 178,
    category: 'Articles'
  },
  {
    query: 'Binance Africa',
    type: 'TRENDING',
    count: 145,
    category: 'Exchanges'
  },
  {
    query: 'bitcoin price',
    type: 'RECENT',
    count: 0,
    timestamp: Date.now() - 3600000
  },
  {
    query: 'ethereum nigeria',
    type: 'RECENT',
    count: 0,
    timestamp: Date.now() - 7200000
  }
];

export const mockAfricanLanguages = [
  { code: 'sw', name: 'Swahili', countries: ['Kenya', 'Tanzania', 'Uganda'], support: 'full' },
  { code: 'yo', name: 'Yoruba', countries: ['Nigeria', 'Benin', 'Togo'], support: 'full' },
  { code: 'ig', name: 'Igbo', countries: ['Nigeria'], support: 'full' },
  { code: 'ha', name: 'Hausa', countries: ['Nigeria', 'Niger', 'Ghana'], support: 'full' },
  { code: 'am', name: 'Amharic', countries: ['Ethiopia'], support: 'full' },
  { code: 'om', name: 'Oromo', countries: ['Ethiopia'], support: 'partial' },
  { code: 'so', name: 'Somali', countries: ['Somalia', 'Ethiopia', 'Kenya'], support: 'partial' },
  { code: 'af', name: 'Afrikaans', countries: ['South Africa', 'Namibia'], support: 'full' },
  { code: 'zu', name: 'Zulu', countries: ['South Africa'], support: 'full' },
  { code: 'xh', name: 'Xhosa', countries: ['South Africa'], support: 'partial' },
  { code: 'sn', name: 'Shona', countries: ['Zimbabwe'], support: 'partial' },
  { code: 'ak', name: 'Akan', countries: ['Ghana'], support: 'partial' },
  { code: 'lg', name: 'Luganda', countries: ['Uganda'], support: 'partial' },
  { code: 'ki', name: 'Kikuyu', countries: ['Kenya'], support: 'partial' },
  { code: 'ln', name: 'Lingala', countries: ['DRC', 'Congo'], support: 'partial' }
];

export const mockSearchHistory = [
  { query: 'bitcoin price', timestamp: Date.now() - 3600000 },
  { query: 'ethereum nigeria', timestamp: Date.now() - 7200000 },
  { query: 'binance africa', timestamp: Date.now() - 86400000 },
  { query: 'crypto trading guide', timestamp: Date.now() - 172800000 }
];

export const mockSavedSearches = [
  {
    id: '1',
    query: 'bitcoin price africa',
    category: 'Crypto News',
    filters: { contentType: ['ARTICLE'], isPremium: false },
    createdAt: Date.now() - 604800000 // 1 week ago
  },
  {
    id: '2',
    query: 'ethereum staking',
    category: 'Market Analysis',
    filters: { contentType: ['ARTICLE'], categories: ['DeFi'] },
    createdAt: Date.now() - 1209600000 // 2 weeks ago
  },
  {
    id: '3',
    query: 'binance nigeria',
    category: 'African Exchanges',
    filters: { contentType: ['ARTICLE', 'COMMUNITY_POST'] },
    createdAt: Date.now() - 1814400000 // 3 weeks ago
  }
];

export const mockSearchAnalytics = {
  totalSearches: 15623,
  avgResponseTime: 0.342,
  topQueries: [
    { query: 'bitcoin price', count: 1456, trend: 'up' },
    { query: 'ethereum nigeria', count: 987, trend: 'stable' },
    { query: 'binance africa', count: 765, trend: 'up' },
    { query: 'crypto news today', count: 654, trend: 'down' },
    { query: 'dogecoin meme', count: 543, trend: 'up' }
  ],
  languageBreakdown: {
    'en': 78.5,
    'sw': 12.3,
    'yo': 4.2,
    'ha': 3.1,
    'af': 1.9
  },
  filterUsage: {
    'contentType': 45.2,
    'categories': 38.7,
    'dateRange': 23.4,
    'isPremium': 15.8,
    'language': 12.1
  }
};