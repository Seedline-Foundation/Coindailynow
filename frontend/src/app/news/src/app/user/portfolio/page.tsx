/**
 * User Portfolio Page
 * Full portfolio management: add wallets, aggregate holdings,
 * track on-chain transactions, set price alerts, rebalance, and
 * get AI-powered buy/sell suggestions.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  PieChart,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  Search,
  X,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

interface WalletEntry {
  id: string;
  label: string;
  address: string;
  chain: string;
  addedAt: string;
}

interface Holding {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
  allocation: number;
  chain: string;
  walletLabel: string;
}

interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'approve' | 'stake' | 'unstake';
  token: string;
  amount: number;
  value: number;
  from: string;
  to: string;
  chain: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
}

interface PriceAlert {
  id: string;
  token: string;
  symbol: string;
  condition: 'above' | 'below';
  price: number;
  currentPrice: number;
  active: boolean;
  createdAt: string;
}

interface TopToken {
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface Suggestion {
  token: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  reason: string;
  confidence: number;
  trending: 'up' | 'down' | 'neutral';
}

/* ═══════════════════════════════════════════════════
   Sample Data
   ═══════════════════════════════════════════════════ */

const CHAINS = ['Ethereum', 'BNB Chain', 'Solana', 'Polygon', 'Arbitrum', 'Base', 'Tron'];

const SAMPLE_WALLETS: WalletEntry[] = [
  { id: 'w1', label: 'Main Wallet', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38', chain: 'Ethereum', addedAt: '2026-01-15' },
  { id: 'w2', label: 'Trading Wallet', address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', chain: 'BNB Chain', addedAt: '2026-02-01' },
];

const SAMPLE_HOLDINGS: Holding[] = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.025, price: 97284, value: 2432.10, change24h: 2.45, allocation: 32.1, chain: 'Ethereum', walletLabel: 'Main Wallet' },
  { symbol: 'ETH', name: 'Ethereum', amount: 0.85, price: 3456.78, value: 2938.26, change24h: 1.23, allocation: 38.8, chain: 'Ethereum', walletLabel: 'Main Wallet' },
  { symbol: 'BNB', name: 'BNB', amount: 2.5, price: 712.45, value: 1781.13, change24h: -0.87, allocation: 23.5, chain: 'BNB Chain', walletLabel: 'Trading Wallet' },
  { symbol: 'SOL', name: 'Solana', amount: 1.2, price: 195.67, value: 234.80, change24h: 3.21, allocation: 3.1, chain: 'Solana', walletLabel: 'Main Wallet' },
  { symbol: 'LINK', name: 'Chainlink', amount: 10, price: 18.45, value: 184.50, change24h: 4.56, allocation: 2.4, chain: 'Ethereum', walletLabel: 'Main Wallet' },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', hash: '0xabc123...def456', type: 'receive', token: 'ETH', amount: 0.5, value: 1728.39, from: '0x999...111', to: '0x742...d38', chain: 'Ethereum', timestamp: '2026-03-03T10:23:00Z', status: 'confirmed' },
  { id: 'tx2', hash: '0xdef789...abc012', type: 'swap', token: 'BNB → USDT', amount: 1.0, value: 712.45, from: '0x1a2...f12', to: 'PancakeSwap', chain: 'BNB Chain', timestamp: '2026-03-02T18:45:00Z', status: 'confirmed' },
  { id: 'tx3', hash: '0x123abc...789def', type: 'send', token: 'SOL', amount: 2.0, value: 391.34, from: '0x742...d38', to: '0x555...aaa', chain: 'Solana', timestamp: '2026-03-02T14:12:00Z', status: 'confirmed' },
  { id: 'tx4', hash: '0x456def...012abc', type: 'receive', token: 'LINK', amount: 25, value: 461.25, from: '0x888...bbb', to: '0x742...d38', chain: 'Ethereum', timestamp: '2026-03-01T09:30:00Z', status: 'confirmed' },
  { id: 'tx5', hash: '0x789abc...345def', type: 'stake', token: 'ETH', amount: 0.35, value: 1209.87, from: '0x742...d38', to: 'Lido', chain: 'Ethereum', timestamp: '2026-02-28T16:20:00Z', status: 'confirmed' },
  { id: 'tx6', hash: '0xaaa111...bbb222', type: 'swap', token: 'USDT → BTC', amount: 500, value: 500.00, from: '0x1a2...f12', to: 'Uniswap', chain: 'Ethereum', timestamp: '2026-02-27T11:05:00Z', status: 'confirmed' },
  { id: 'tx7', hash: '0xccc333...ddd444', type: 'approve', token: 'LINK', amount: 0, value: 0, from: '0x742...d38', to: 'Aave', chain: 'Ethereum', timestamp: '2026-02-26T08:45:00Z', status: 'confirmed' },
  { id: 'tx8', hash: '0xeee555...fff666', type: 'receive', token: 'BNB', amount: 3.5, value: 2493.58, from: '0x777...ccc', to: '0x1a2...f12', chain: 'BNB Chain', timestamp: '2026-02-25T20:10:00Z', status: 'confirmed' },
];

const TOP10_TOKENS: TopToken[] = [
  { rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 97284.31, change24h: 2.45, marketCap: 1910000000000, volume24h: 42000000000 },
  { rank: 2, name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: 1.23, marketCap: 416000000000, volume24h: 18000000000 },
  { rank: 3, name: 'Tether', symbol: 'USDT', price: 1.0001, change24h: 0.01, marketCap: 140000000000, volume24h: 65000000000 },
  { rank: 4, name: 'XRP', symbol: 'XRP', price: 2.34, change24h: 0.87, marketCap: 134000000000, volume24h: 8900000000 },
  { rank: 5, name: 'BNB', symbol: 'BNB', price: 712.45, change24h: -0.87, marketCap: 106000000000, volume24h: 2100000000 },
  { rank: 6, name: 'Solana', symbol: 'SOL', price: 195.67, change24h: 3.21, marketCap: 92000000000, volume24h: 4500000000 },
  { rank: 7, name: 'Dogecoin', symbol: 'DOGE', price: 0.38, change24h: 5.67, marketCap: 56300000000, volume24h: 5600000000 },
  { rank: 8, name: 'USD Coin', symbol: 'USDC', price: 1.0, change24h: 0.0, marketCap: 52000000000, volume24h: 9000000000 },
  { rank: 9, name: 'Cardano', symbol: 'ADA', price: 1.05, change24h: 2.78, marketCap: 37400000000, volume24h: 1800000000 },
  { rank: 10, name: 'Avalanche', symbol: 'AVAX', price: 41.23, change24h: 1.56, marketCap: 16900000000, volume24h: 890000000 },
];

const SAMPLE_ALERTS: PriceAlert[] = [
  { id: 'a1', token: 'Bitcoin', symbol: 'BTC', condition: 'above', price: 100000, currentPrice: 97284.31, active: true, createdAt: '2026-02-20' },
  { id: 'a2', token: 'Ethereum', symbol: 'ETH', condition: 'below', price: 3000, currentPrice: 3456.78, active: true, createdAt: '2026-02-22' },
];

const SAMPLE_SUGGESTIONS: Suggestion[] = [
  { token: 'Solana', symbol: 'SOL', action: 'buy', reason: 'High whale accumulation detected. 12% increase in large holder addresses over 7 days. Strong DeFi TVL growth on Solana ecosystem.', confidence: 82, trending: 'up' },
  { token: 'Chainlink', symbol: 'LINK', action: 'buy', reason: 'Major partnership announcements incoming. CCIP adoption accelerating across 15+ chains. Undervalued relative to oracle market share.', confidence: 76, trending: 'up' },
  { token: 'Dogecoin', symbol: 'DOGE', action: 'hold', reason: 'Meme momentum strong but risk of correction after 18% weekly gain. Volume declining — wait for pullback before adding.', confidence: 61, trending: 'neutral' },
  { token: 'Cardano', symbol: 'ADA', action: 'buy', reason: 'Popular buy among African traders on Luno & Quidax. Hydra scaling upgrade driving institutional interest in the region.', confidence: 71, trending: 'up' },
  { token: 'BNB', symbol: 'BNB', action: 'sell', reason: 'Regulatory pressure increasing. Position is overweight at 23.5% of portfolio — consider rebalancing to target 15%.', confidence: 65, trending: 'down' },
];

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */
const fmt = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtPrice = (n: number) => {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
};

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const shortenAddr = (addr: string) =>
  addr.length > 16 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const TX_ICONS: Record<string, string> = {
  send: '↗', receive: '↙', swap: '🔄', approve: '✅', stake: '🔒', unstake: '🔓',
};
const TX_COLORS: Record<string, string> = {
  send: 'text-red-400', receive: 'text-green-400', swap: 'text-blue-400',
  approve: 'text-yellow-400', stake: 'text-purple-400', unstake: 'text-purple-300',
};

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */
type Tab = 'overview' | 'transactions' | 'alerts' | 'suggestions';

export default function UserPortfolioPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [wallets, setWallets] = useState<WalletEntry[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [suggestions] = useState<Suggestion[]>(SAMPLE_SUGGESTIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  // Add wallet modal
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletChain, setNewWalletChain] = useState('Ethereum');

  // Add alert modal
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertToken, setAlertToken] = useState('BTC');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertPrice, setAlertPrice] = useState('');

  // Tx filter
  const [txFilter, setTxFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedWallets = localStorage.getItem('coindaily_wallets');
      const savedAlerts = localStorage.getItem('coindaily_alerts');
      if (savedWallets) setWallets(JSON.parse(savedWallets));
      else setWallets(SAMPLE_WALLETS);
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
      else setAlerts(SAMPLE_ALERTS);
    } catch {
      setWallets(SAMPLE_WALLETS);
      setAlerts(SAMPLE_ALERTS);
    }
    setHoldings(SAMPLE_HOLDINGS);
    setTransactions(SAMPLE_TRANSACTIONS);
  }, []);

  // Persist wallets & alerts
  useEffect(() => {
    if (wallets.length) localStorage.setItem('coindaily_wallets', JSON.stringify(wallets));
  }, [wallets]);
  useEffect(() => {
    if (alerts.length) localStorage.setItem('coindaily_alerts', JSON.stringify(alerts));
  }, [alerts]);

  /* ── Wallet management ── */
  const addWallet = () => {
    if (!newWalletAddress.trim() || !newWalletLabel.trim()) return;
    const entry: WalletEntry = {
      id: `w-${Date.now()}`,
      label: newWalletLabel.trim(),
      address: newWalletAddress.trim(),
      chain: newWalletChain,
      addedAt: new Date().toISOString().split('T')[0],
    };
    setWallets(prev => [...prev, entry]);
    setNewWalletLabel('');
    setNewWalletAddress('');
    setShowAddWallet(false);
  };

  const removeWallet = (id: string) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  };

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
  };

  /* ── Alert management ── */
  const addAlert = () => {
    if (!alertPrice) return;
    const tokenInfo = TOP10_TOKENS.find(t => t.symbol === alertToken);
    const entry: PriceAlert = {
      id: `a-${Date.now()}`,
      token: tokenInfo?.name || alertToken,
      symbol: alertToken,
      condition: alertCondition,
      price: parseFloat(alertPrice),
      currentPrice: tokenInfo?.price || 0,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAlerts(prev => [...prev, entry]);
    setAlertPrice('');
    setShowAddAlert(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  /* ── Portfolio stats ── */
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const totalChange = holdings.reduce((s, h) => s + h.value * (h.change24h / 100), 0);
  const totalChangePct = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

  /* ── Filtered transactions ── */
  const filteredTx = useMemo(() => {
    let list = [...transactions];
    if (txFilter !== 'all') list = list.filter(t => t.type === txFilter);
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      list = list.filter(t =>
        t.token.toLowerCase().includes(q) ||
        t.hash.toLowerCase().includes(q) ||
        t.chain.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, txFilter, txSearch]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  /* ── Rebalance suggestions ── */
  const rebalance = useMemo(() => {
    const target: Record<string, number> = { BTC: 35, ETH: 30, BNB: 15, SOL: 10, LINK: 10 };
    return holdings.map(h => {
      const tgt = target[h.symbol] || 0;
      const diff = tgt - h.allocation;
      return { ...h, target: tgt, diff };
    });
  }, [holdings]);

  /* ═══════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Portfolio</h1>
          <p className="text-dark-400 mt-1 text-sm">
            Manage wallets, track holdings, set alerts &amp; get AI suggestions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalances(h => !h)}
            className="p-2 rounded-lg border border-dark-700 bg-dark-800 text-dark-400 hover:text-white transition-colors"
            title={hideBalances ? 'Show balances' : 'Hide balances'}
          >
            {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-dark-700 bg-dark-800 text-dark-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* ── Total Value Banner ── */}
      <div className="bg-gradient-to-r from-primary-500/10 via-dark-900 to-dark-900 border border-dark-700 rounded-xl p-6">
        <p className="text-xs text-dark-400 uppercase tracking-wider">Total Portfolio Value</p>
        <div className="flex items-end gap-3 mt-1">
          <span className="text-3xl font-bold text-white">
            {hideBalances ? '••••••' : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          <span className={`text-sm font-medium pb-0.5 ${totalChangePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalChangePct >= 0 ? '↑' : '↓'} {hideBalances ? '••' : `${Math.abs(totalChangePct).toFixed(2)}%`}
            <span className="text-dark-500 ml-1">24h</span>
          </span>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
          <span>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</span>
          <span>•</span>
          <span>{holdings.length} assets</span>
          <span>•</span>
          <span>{alerts.filter(a => a.active).length} active alert{alerts.filter(a => a.active).length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-dark-800/60 p-1 rounded-lg overflow-x-auto">
        {([
          { key: 'overview' as Tab, label: 'Overview', icon: PieChart },
          { key: 'transactions' as Tab, label: 'Transactions', icon: ArrowRightLeft },
          { key: 'alerts' as Tab, label: 'Alerts', icon: Bell },
          { key: 'suggestions' as Tab, label: 'AI Suggestions', icon: Sparkles },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-dark-700 text-white shadow'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═════════ OVERVIEW TAB ═════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Connected Wallets */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary-500" />
                Connected Wallets
              </h2>
              <button
                onClick={() => setShowAddWallet(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Wallet
              </button>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-10 h-10 text-dark-600 mx-auto mb-3" />
                <p className="text-sm text-dark-400">No wallets connected yet.</p>
                <p className="text-xs text-dark-500 mt-1">Add your first wallet to start tracking your portfolio automatically.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {wallets.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-primary-400 shrink-0">
                        {w.chain.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{w.label}</p>
                        <div className="flex items-center gap-2 text-[10px] text-dark-500">
                          <span className="font-mono">{shortenAddr(w.address)}</span>
                          <button onClick={() => copyAddr(w.address)} className="hover:text-dark-300" title="Copy">
                            <Copy className="w-3 h-3" />
                          </button>
                          <span className="bg-dark-700 px-1.5 py-0.5 rounded text-dark-400">{w.chain}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeWallet(w.id)}
                      className="p-1.5 text-dark-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove wallet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Wallet Modal */}
          {showAddWallet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Add Wallet</h3>
                  <button onClick={() => setShowAddWallet(false)} className="text-dark-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-dark-400 block mb-1">Label</label>
                  <input
                    value={newWalletLabel}
                    onChange={e => setNewWalletLabel(e.target.value)}
                    placeholder="e.g. My DeFi Wallet"
                    className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 block mb-1">Wallet Address</label>
                  <input
                    value={newWalletAddress}
                    onChange={e => setNewWalletAddress(e.target.value)}
                    placeholder="0x... or wallet address"
                    className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 block mb-1">Chain</label>
                  <select
                    value={newWalletChain}
                    onChange={e => setNewWalletChain(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                  >
                    {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddWallet(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-dark-700 text-dark-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addWallet}
                    disabled={!newWalletLabel.trim() || !newWalletAddress.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-dark-950 hover:bg-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Holdings + Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Holdings Table */}
            <div className="lg:col-span-2 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-700">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                  Holdings
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px]">
                  <thead className="bg-dark-800/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-500 uppercase">Asset</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Balance</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Price</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Value</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">24h</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Alloc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {holdings.map(h => (
                      <tr key={h.symbol} className="hover:bg-dark-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-[10px] font-bold text-dark-300">
                              {h.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{h.name}</p>
                              <p className="text-[10px] text-dark-500">{h.symbol} • {h.chain}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-dark-300">
                          {hideBalances ? '••••' : h.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-dark-300">{fmtPrice(h.price)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-white">
                          {hideBalances ? '••••' : `$${h.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-medium ${h.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {h.change24h >= 0 ? '+' : ''}{h.change24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${h.allocation}%` }} />
                            </div>
                            <span className="text-[10px] text-dark-400 w-8 text-right">{h.allocation.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Allocation + Rebalance */}
            <div className="space-y-4">
              {/* Allocation chart */}
              <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <PieChart className="w-3.5 h-3.5 text-primary-500" />
                  Allocation
                </h3>
                <div className="space-y-2">
                  {holdings.map(h => (
                    <div key={h.symbol} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        h.symbol === 'BTC' ? 'bg-orange-500' :
                        h.symbol === 'ETH' ? 'bg-blue-500' :
                        h.symbol === 'BNB' ? 'bg-yellow-500' :
                        h.symbol === 'SOL' ? 'bg-purple-500' :
                        'bg-cyan-500'
                      }`} />
                      <span className="text-xs text-dark-300 flex-1">{h.symbol}</span>
                      <span className="text-xs font-medium text-white">{h.allocation.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rebalance Suggestions */}
              <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary-500" />
                  Rebalance
                </h3>
                <div className="space-y-2">
                  {rebalance.map(r => (
                    <div key={r.symbol} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-dark-300">{r.symbol}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-dark-500">{r.allocation.toFixed(1)}%</span>
                        <span className="text-dark-600">→</span>
                        <span className="text-white">{r.target}%</span>
                        <span className={`font-medium ${r.diff > 0 ? 'text-green-400' : r.diff < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                          {r.diff > 0 ? '+' : ''}{r.diff.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 px-3 py-2 text-xs font-medium rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors">
                  Auto-Rebalance Portfolio
                </button>
              </div>
            </div>
          </div>

          {/* Top 10 Token Prices */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                Top 10 Tokens by Market Cap
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="px-4 py-2.5 text-center text-[10px] font-medium text-dark-500 uppercase w-10">#</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-medium text-dark-500 uppercase">Token</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Price</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">24h Change</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Market Cap</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-medium text-dark-500 uppercase">Volume (24h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {TOP10_TOKENS.map(t => (
                    <tr key={t.symbol} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-center text-xs text-dark-500">{t.rank}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-[9px] font-bold text-dark-300">
                            {t.symbol.slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-white">{t.name}</span>
                          <span className="text-[10px] text-dark-500">{t.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-white">{fmtPrice(t.price)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-xs font-medium ${t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-dark-300">{fmt(t.marketCap)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-dark-300">{fmt(t.volume24h)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ TRANSACTIONS TAB ═════════ */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Search by token, hash, or chain..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div className="flex gap-1 bg-dark-800 p-1 rounded-lg">
              {['all', 'send', 'receive', 'swap', 'stake'].map(f => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    txFilter === f ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-dark-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                On-Chain Transactions
              </h2>
              <span className="text-[10px] text-dark-500">{filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}</span>
            </div>

            {filteredTx.length === 0 ? (
              <div className="py-12 text-center">
                <ArrowRightLeft className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                <p className="text-sm text-dark-400">No transactions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {filteredTx.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-dark-800/50 transition-colors">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full bg-dark-800 flex items-center justify-center text-base shrink-0 ${TX_COLORS[tx.type]}`}>
                      {TX_ICONS[tx.type]}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">{tx.type}</span>
                        <span className="text-xs text-dark-500">{tx.token}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-dark-500 mt-0.5">
                        <span className="font-mono">{tx.hash}</span>
                        <span className="bg-dark-700 px-1.5 py-0.5 rounded">{tx.chain}</span>
                        <span>{timeAgo(tx.timestamp)}</span>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-medium ${tx.type === 'receive' ? 'text-green-400' : tx.type === 'send' ? 'text-red-400' : 'text-white'}`}>
                        {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{hideBalances ? '••••' : tx.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                      </p>
                      <p className="text-[10px] text-dark-500">{hideBalances ? '••••' : `$${tx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</p>
                    </div>
                    {/* Status */}
                    <div className="shrink-0">
                      {tx.status === 'confirmed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {tx.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />}
                      {tx.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════ ALERTS TAB ═════════ */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400">Get notified when token prices reach your target.</p>
            <button
              onClick={() => setShowAddAlert(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Alert
            </button>
          </div>

          {/* Add Alert Modal */}
          {showAddAlert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-dark-900 border border-dark-700 rounded-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">New Price Alert</h3>
                  <button onClick={() => setShowAddAlert(false)} className="text-dark-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-dark-400 block mb-1">Token</label>
                  <select
                    value={alertToken}
                    onChange={e => setAlertToken(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                  >
                    {TOP10_TOKENS.map(t => (
                      <option key={t.symbol} value={t.symbol}>{t.name} ({t.symbol}) — {fmtPrice(t.price)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Condition</label>
                    <select
                      value={alertCondition}
                      onChange={e => setAlertCondition(e.target.value as 'above' | 'below')}
                      className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="above">Price goes above</option>
                      <option value="below">Price drops below</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 block mb-1">Target Price ($)</label>
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={e => setAlertPrice(e.target.value)}
                      placeholder="0.00"
                      step="any"
                      className="w-full px-3 py-2 text-sm bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddAlert(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-dark-700 text-dark-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addAlert}
                    disabled={!alertPrice}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-dark-950 hover:bg-primary-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts List */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-500" />
                Price Alerts
              </h2>
            </div>
            {alerts.length === 0 ? (
              <div className="py-12 text-center">
                <BellOff className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                <p className="text-sm text-dark-400">No alerts set yet.</p>
                <p className="text-xs text-dark-500 mt-1">Create an alert to get notified when prices hit your target.</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-800">
                {alerts.map(a => {
                  const distance = a.condition === 'above'
                    ? ((a.price - a.currentPrice) / a.currentPrice * 100)
                    : ((a.currentPrice - a.price) / a.currentPrice * 100);
                  const isClose = Math.abs(distance) < 5;

                  return (
                    <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-dark-800/50 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${
                        a.active ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-600'
                      }`}>
                        {a.condition === 'above' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{a.token}</span>
                          <span className="text-[10px] text-dark-500">{a.symbol}</span>
                          {isClose && a.active && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">Close!</span>
                          )}
                        </div>
                        <p className="text-[10px] text-dark-500 mt-0.5">
                          Notify when price goes {a.condition} {fmtPrice(a.price)} • Currently {fmtPrice(a.currentPrice)} • {Math.abs(distance).toFixed(1)}% away
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleAlert(a.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            a.active
                              ? 'text-primary-400 hover:bg-primary-500/20'
                              : 'text-dark-600 hover:text-dark-400'
                          }`}
                          title={a.active ? 'Disable' : 'Enable'}
                        >
                          {a.active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeAlert(a.id)}
                          className="p-1.5 text-dark-600 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════ AI SUGGESTIONS TAB ═════════ */}
      {tab === 'suggestions' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary-500/10 to-dark-900 border border-primary-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">AI-Powered Suggestions</p>
                <p className="text-xs text-dark-400 mt-1">
                  Based on your portfolio allocation, on-chain activity, whale movements, and popular trades across African exchanges (Luno, Quidax, Valr).
                  These are not financial advice.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      s.action === 'buy' ? 'bg-green-500/20 text-green-400' :
                      s.action === 'sell' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {s.action === 'buy' ? <TrendingUp className="w-5 h-5" /> :
                       s.action === 'sell' ? <TrendingDown className="w-5 h-5" /> :
                       <ArrowRightLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{s.token}</span>
                        <span className="text-[10px] text-dark-500">{s.symbol}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          s.action === 'buy' ? 'bg-green-500/20 text-green-400' :
                          s.action === 'sell' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {s.action}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400 mt-1.5 leading-relaxed max-w-xl">{s.reason}</p>
                    </div>
                  </div>
                  {/* Confidence meter */}
                  <div className="text-center shrink-0">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" className="text-dark-700" strokeWidth="3" />
                        <circle
                          cx="24" cy="24" r="20" fill="none"
                          stroke="currentColor"
                          className={s.confidence >= 70 ? 'text-green-400' : s.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'}
                          strokeWidth="3"
                          strokeDasharray={`${(s.confidence / 100) * 125.6} 125.6`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                        {s.confidence}%
                      </span>
                    </div>
                    <p className="text-[9px] text-dark-500 mt-1">Confidence</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Popular on African Exchanges */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-500" />
              Trending on African Exchanges
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { exchange: 'Luno', tokens: ['BTC', 'ETH', 'XRP'], region: 'South Africa', trend: 'BTC +4.2%' },
                { exchange: 'Quidax', tokens: ['BTC', 'USDT', 'BNB'], region: 'Nigeria', trend: 'USDT Vol +15%' },
                { exchange: 'Valr', tokens: ['SOL', 'ADA', 'DOT'], region: 'South Africa', trend: 'SOL +8.1%' },
                { exchange: 'BuyCoins', tokens: ['BTC', 'ETH', 'USDC'], region: 'Nigeria', trend: 'ETH +3.5%' },
                { exchange: 'Binance Africa', tokens: ['DOGE', 'PEPE', 'SHIB'], region: 'Pan-Africa', trend: 'DOGE +12.3%' },
                { exchange: 'Ice3X', tokens: ['BTC', 'LTC', 'ETH'], region: 'South Africa', trend: 'LTC +5.7%' },
              ].map(ex => (
                <div key={ex.exchange} className="p-3 bg-dark-800 border border-dark-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">{ex.exchange}</span>
                    <span className="text-[10px] text-dark-500">{ex.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {ex.tokens.map(t => (
                      <span key={t} className="text-[10px] bg-dark-700 text-dark-300 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-green-400">{ex.trend}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
