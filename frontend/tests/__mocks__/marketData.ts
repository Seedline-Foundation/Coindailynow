/**
 * Market Data Mocks
 * Supporting test data for Task 22 Market Data Dashboard
 */

export const mockWebSocket = {
  readyState: WebSocket.OPEN,
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onError: jest.fn(),
  onMessage: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

export const mockMarketData = {
  symbols: ['BTC', 'ETH', 'ADA', 'SOL'],
  data: [
    {
      symbol: 'BTC',
      price: 43500,
      change24h: 2.3,
      volume24h: 28500000000,
      marketCap: 850000000000,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ETH',
      price: 2650,
      change24h: -1.8,
      volume24h: 12500000000,
      marketCap: 320000000000,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ADA',
      price: 0.48,
      change24h: 5.2,
      volume24h: 850000000,
      marketCap: 17000000000,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'SOL',
      price: 98.5,
      change24h: 3.7,
      volume24h: 2100000000,
      marketCap: 42000000000,
      lastUpdated: new Date().toISOString()
    }
  ]
};

export const mockAfricanExchanges = {
  binanceAfrica: {
    name: 'Binance Africa',
    btcPrice: 43520,
    ethPrice: 2655,
    tradingFee: 0.1,
    depositMethods: ['Bank Transfer', 'M-Pesa', 'MTN Money'],
    supportedCountries: ['NG', 'KE', 'ZA', 'GH']
  },
  luno: {
    name: 'Luno',
    btcPrice: 43480,
    ethPrice: 2645,
    tradingFee: 0.25,
    depositMethods: ['Bank Transfer', 'Debit Card'],
    supportedCountries: ['ZA', 'NG', 'UG', 'ZM']
  },
  quidax: {
    name: 'Quidax',
    btcPrice: 43550,
    ethPrice: 2660,
    tradingFee: 0.5,
    depositMethods: ['Bank Transfer', 'Debit Card', 'USSD'],
    supportedCountries: ['NG']
  },
  valr: {
    name: 'VALR',
    btcPrice: 43490,
    ethPrice: 2648,
    tradingFee: 0.75,
    depositMethods: ['Bank Transfer', 'Instant EFT'],
    supportedCountries: ['ZA']
  }
};

export const mockChartData = {
  '1H': [
    { timestamp: Date.now() - 3600000, open: 43400, high: 43600, low: 43300, close: 43500, volume: 1250000 },
    { timestamp: Date.now() - 3000000, open: 43500, high: 43700, low: 43450, close: 43650, volume: 1180000 },
    { timestamp: Date.now() - 2400000, open: 43650, high: 43750, low: 43580, close: 43700, volume: 1320000 },
    { timestamp: Date.now() - 1800000, open: 43700, high: 43800, low: 43620, close: 43750, volume: 1090000 },
    { timestamp: Date.now() - 1200000, open: 43750, high: 43850, low: 43680, close: 43800, volume: 1440000 },
    { timestamp: Date.now() - 600000, open: 43800, high: 43900, low: 43720, close: 43850, volume: 1270000 },
    { timestamp: Date.now(), open: 43850, high: 43950, low: 43780, close: 43500, volume: 1560000 }
  ],
  '4H': Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() - (24 - i) * 14400000,
    open: 43000 + Math.random() * 1000,
    high: 43200 + Math.random() * 1000,
    low: 42800 + Math.random() * 1000,
    close: 43100 + Math.random() * 1000,
    volume: 1000000 + Math.random() * 2000000
  })),
  '1D': Array.from({ length: 30 }, (_, i) => ({
    timestamp: Date.now() - (30 - i) * 86400000,
    open: 40000 + Math.random() * 6000,
    high: 41000 + Math.random() * 6000,
    low: 39000 + Math.random() * 6000,
    close: 40500 + Math.random() * 6000,
    volume: 20000000 + Math.random() * 40000000
  })),
  '1W': Array.from({ length: 52 }, (_, i) => ({
    timestamp: Date.now() - (52 - i) * 604800000,
    open: 30000 + Math.random() * 20000,
    high: 32000 + Math.random() * 20000,
    low: 28000 + Math.random() * 20000,
    close: 31000 + Math.random() * 20000,
    volume: 100000000 + Math.random() * 200000000
  }))
};

export const mockPortfolioData = {
  totalBalance: 125000,
  totalBalanceUSD: 125000,
  change24h: 3250,
  change24hPercent: 2.67,
  holdings: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 2.5,
      value: 108750,
      change24h: 2500,
      change24hPercent: 2.35,
      allocation: 87
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 5.2,
      value: 13780,
      change24h: -248,
      change24hPercent: -1.77,
      allocation: 11
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      amount: 5000,
      value: 2400,
      change24h: 125,
      change24hPercent: 5.49,
      allocation: 2
    }
  ],
  performance: {
    totalPnL: 25000,
    totalPnLPercent: 25.0,
    bestPerformer: { symbol: 'ADA', change: 5.49 },
    worstPerformer: { symbol: 'ETH', change: -1.77 }
  }
};

export const mockAlerts = [
  {
    id: 'alert-1',
    symbol: 'BTC',
    type: 'price_above',
    value: 45000,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'alert-2',
    symbol: 'ETH',
    type: 'price_below',
    value: 2500,
    isActive: true,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'alert-3',
    symbol: 'SOL',
    type: 'percent_change',
    value: 10,
    isActive: false,
    createdAt: new Date(Date.now() - 259200000).toISOString()
  }
];

export const mockMobileMoneyRates = {
  mpesa: {
    name: 'M-Pesa',
    country: 'Kenya',
    currency: 'KES',
    btcRate: 5697000, // BTC to KES
    usdRate: 130.5, // USD to KES
    lastUpdated: new Date().toISOString()
  },
  orangeMoney: {
    name: 'Orange Money',
    country: 'Ivory Coast',
    currency: 'XOF',
    btcRate: 26950000, // BTC to XOF
    usdRate: 620, // USD to XOF
    lastUpdated: new Date().toISOString()
  },
  mtnMoney: {
    name: 'MTN Money',
    country: 'Ghana',
    currency: 'GHS',
    btcRate: 521250, // BTC to GHS
    usdRate: 12.0, // USD to GHS
    lastUpdated: new Date().toISOString()
  },
  ecocash: {
    name: 'EcoCash',
    country: 'Zimbabwe',
    currency: 'USD',
    btcRate: 43500, // BTC to USD (USD economy)
    usdRate: 1.0, // USD to USD
    lastUpdated: new Date().toISOString()
  }
};

export const mockPortfolio = {
  totalBalance: 15.5,
  totalBalanceUSD: 1250000,
  change24h: 15000,
  change24hPercent: 1.2,
  holdings: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 5.5,
      value: 239250,
      change24h: 5504.5,
      change24hPercent: 2.3,
      allocation: 60.0
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 45.2,
      value: 119780,
      change24hPercent: -1.8,
      change24h: -2156.04,
      allocation: 30.0
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      amount: 2500,
      value: 1200,
      change24hPercent: 5.2,
      change24h: 62.4,
      allocation: 5.0
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      amount: 12,
      value: 1182,
      change24hPercent: 3.7,
      change24h: 43.734,
      allocation: 5.0
    }
  ],
  performance: {
    totalPnL: 125000,
    totalPnLPercent: 11.1,
    bestPerformer: { symbol: 'ADA', change: 5.2 },
    worstPerformer: { symbol: 'ETH', change: -1.8 }
  }
};