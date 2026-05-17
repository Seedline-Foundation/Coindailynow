'use client';

import { useState } from 'react';
import {
  Coins, ShieldCheck, RefreshCw, Plus, Search,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  XCircle, Flag, Globe, BarChart3, X, Trash2, Eye,
} from 'lucide-react';

interface Token {
  id: string;
  symbol: string;
  name: string;
  category: 'layer1' | 'defi' | 'stablecoin' | 'memecoin' | 'african';
  price: number;
  change24h: number;
  marketCap: number;
  riskScore: number;
  status: 'tracked' | 'flagged' | 'delisted' | 'pending';
  exchange: string;
  contractVerified: boolean;
  addedAt: string;
  flags: string[];
}

const TOKENS: Token[] = [
  { id: 't1', symbol: 'BTC', name: 'Bitcoin', category: 'layer1', price: 67420, change24h: 2.14, marketCap: 1320000000000, riskScore: 5, status: 'tracked', exchange: 'Binance/Luno', contractVerified: true, addedAt: '2024-01-01', flags: [] },
  { id: 't2', symbol: 'ETH', name: 'Ethereum', category: 'layer1', price: 3540, change24h: -0.78, marketCap: 425000000000, riskScore: 8, status: 'tracked', exchange: 'Binance/Quidax', contractVerified: true, addedAt: '2024-01-01', flags: [] },
  { id: 't3', symbol: 'BNB', name: 'BNB', category: 'layer1', price: 598, change24h: 1.22, marketCap: 89000000000, riskScore: 12, status: 'tracked', exchange: 'Binance', contractVerified: true, addedAt: '2024-01-15', flags: [] },
  { id: 't4', symbol: 'USDT', name: 'Tether', category: 'stablecoin', price: 1.001, change24h: 0.01, marketCap: 112000000000, riskScore: 15, status: 'tracked', exchange: 'Multiple', contractVerified: true, addedAt: '2024-01-01', flags: [] },
  { id: 't5', symbol: 'CELO', name: 'Celo', category: 'african', price: 0.84, change24h: 3.45, marketCap: 480000000, riskScore: 28, status: 'tracked', exchange: 'Binance/Valr', contractVerified: true, addedAt: '2024-02-10', flags: [] },
  { id: 't6', symbol: 'EGLD', name: 'MultiversX', category: 'african', price: 37.50, change24h: -2.10, marketCap: 1020000000, riskScore: 32, status: 'tracked', exchange: 'BuyCoins', contractVerified: true, addedAt: '2024-03-01', flags: [] },
  { id: 't7', symbol: 'JY', name: 'Joy Token', category: 'african', price: 0.0042, change24h: 12.5, marketCap: 4200000, riskScore: 58, status: 'tracked', exchange: 'Quidax', contractVerified: true, addedAt: '2025-01-10', flags: ['high-volatility'] },
  { id: 't8', symbol: 'DOGE', name: 'Dogecoin', category: 'memecoin', price: 0.165, change24h: 5.32, marketCap: 24000000000, riskScore: 45, status: 'tracked', exchange: 'Binance/Quidax', contractVerified: false, addedAt: '2024-04-01', flags: [] },
  { id: 't9', symbol: 'RUGPULL', name: 'AfriMoon BSC', category: 'memecoin', price: 0.000001, change24h: -98.5, marketCap: 1200, riskScore: 99, status: 'flagged', exchange: 'PancakeSwap', contractVerified: false, addedAt: '2025-01-20', flags: ['rug-pull', 'low-liquidity', 'unverified-contract'] },
  { id: 't10', symbol: 'UNI', name: 'Uniswap', category: 'defi', price: 11.20, change24h: 0.88, marketCap: 6800000000, riskScore: 18, status: 'tracked', exchange: 'Binance', contractVerified: true, addedAt: '2024-02-15', flags: [] },
];

const catColors: Record<string, string> = {
  layer1: 'bg-blue-500/20 text-blue-300',
  defi: 'bg-purple-500/20 text-purple-300',
  stablecoin: 'bg-green-500/20 text-green-300',
  memecoin: 'bg-yellow-500/20 text-yellow-300',
  african: 'bg-orange-500/20 text-orange-300',
};

const statusCfg: Record<string, { color: string; Icon: React.FC<{ className?: string }> }> = {
  tracked: { color: 'text-emerald-400 bg-emerald-500/10', Icon: CheckCircle },
  flagged: { color: 'text-red-400 bg-red-500/10', Icon: Flag },
  delisted: { color: 'text-gray-400 bg-gray-500/10', Icon: XCircle },
  pending: { color: 'text-yellow-400 bg-yellow-500/10', Icon: Eye },
};

const riskClr = (n: number) => n >= 70 ? 'text-red-400' : n >= 40 ? 'text-yellow-400' : 'text-emerald-400';
const riskBg = (n: number) => n >= 70 ? 'bg-red-500' : n >= 40 ? 'bg-yellow-500' : 'bg-emerald-500';
const fmt = (n: number) => n >= 1e12 ? `$${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

export default function SuperAdminMarketTokensPage() {
  const [tokens, setTokens] = useState<Token[]>(TOKENS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [activeTab, setActiveTab] = useState<'tokens' | 'risks' | 'african'>('tokens');
  const [showAdd, setShowAdd] = useState(false);
  const [newSym, setNewSym] = useState('');
  const [newName, setNewName] = useState('');

  const filtered = tokens.filter(t =>
    (t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterCat === 'all' || t.category === filterCat)
  );

  const flagToken = (id: string) => setTokens(p => p.map(t => t.id === id ? { ...t, status: (t.status === 'flagged' ? 'tracked' : 'flagged') as Token['status'] } : t));
  const delistToken = (id: string) => setTokens(p => p.map(t => t.id === id ? { ...t, status: 'delisted' as Token['status'] } : t));
  const handleAdd = () => {
    if (!newSym || !newName) return;
    setTokens(p => [{ id: `t${Date.now()}`, symbol: newSym.toUpperCase(), name: newName, category: 'layer1', price: 0, change24h: 0, marketCap: 0, riskScore: 50, status: 'pending', exchange: 'Unknown', contractVerified: false, addedAt: new Date().toISOString().split('T')[0], flags: ['unverified-contract'] }, ...p]);
    setNewSym(''); setNewName(''); setShowAdd(false);
  };

  const tracked = tokens.filter(t => t.status === 'tracked').length;
  const flagged = tokens.filter(t => t.status === 'flagged').length;
  const african = tokens.filter(t => t.category === 'african').length;
  const highRisk = tokens.filter(t => t.riskScore >= 60).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Coins className="w-8 h-8 text-yellow-400" /> Crypto Token Management</h1>
          <p className="text-gray-400 mt-1">Control tracked tokens, listings, and risk visibility</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium">
          <Plus className="w-4 h-4" /> Add Token
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'Tracked Tokens', value: tracked, Icon: Coins, color: 'text-yellow-400' },
          { label: 'African Tokens', value: african, Icon: Globe, color: 'text-orange-400' },
          { label: 'Flagged', value: flagged, Icon: Flag, color: 'text-red-400' },
          { label: 'High Risk (≥60)', value: highRisk, Icon: AlertTriangle, color: 'text-red-500' }].map(k => (
          <div key={k.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">{k.label}</span><k.Icon className={`w-5 h-5 ${k.color}`} /></div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1.5">
        {(['tokens', 'risks', 'african'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${ activeTab === tab ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {tab === 'tokens' ? 'All Tokens' : tab === 'risks' ? 'Risk Flags' : 'African Spotlight'}
          </button>
        ))}
      </div>

      {activeTab === 'tokens' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search symbol or name…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Status</option>
              <option value="tracked">Tracked</option>
              <option value="flagged">Flagged</option>
              <option value="delisted">Delisted</option>
              <option value="pending">Pending</option>
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Categories</option>
              <option value="layer1">Layer 1</option>
              <option value="defi">DeFi</option>
              <option value="stablecoin">Stablecoin</option>
              <option value="memecoin">Memecoin</option>
              <option value="african">African</option>
            </select>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-700 bg-gray-700/40">{['Token','Category','Price','24h','Mkt Cap','Risk','Exchange','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filtered.map(t => {
                    const S = statusCfg[t.status];
                    return (
                      <tr key={t.id} className={`hover:bg-gray-700/20 ${t.status === 'delisted' ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.contractVerified ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                            <div><div className="font-bold text-white">{t.symbol}</div><div className="text-xs text-gray-500">{t.name}</div></div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${catColors[t.category] ?? ''}`}>{t.category}</span></td>
                        <td className="px-4 py-3 text-white font-mono">{t.price >= 1 ? `$${t.price.toLocaleString()}` : `$${t.price.toFixed(6)}`}</td>
                        <td className="px-4 py-3"><span className={`flex items-center gap-1 text-sm font-medium ${t.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{t.change24h > 0 ? '+' : ''}{t.change24h.toFixed(2)}%</span></td>
                        <td className="px-4 py-3 text-gray-300 text-xs font-mono">{fmt(t.marketCap)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full"><div className={`h-1.5 rounded-full ${riskBg(t.riskScore)}`} style={{width:`${t.riskScore}%`}} /></div>
                            <span className={`text-xs font-bold ${riskClr(t.riskScore)}`}>{t.riskScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{t.exchange}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium capitalize flex items-center gap-1 w-fit ${S.color}`}><S.Icon className="w-3 h-3" />{t.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => flagToken(t.id)} className={`p-1.5 rounded hover:bg-gray-600 ${t.status === 'flagged' ? 'text-red-400' : 'text-gray-500 hover:text-yellow-400'}`}><Flag className="w-3.5 h-3.5" /></button>
                            <button onClick={() => delistToken(t.id)} disabled={t.status === 'delisted'} className="p-1.5 rounded hover:bg-gray-600 text-gray-500 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No tokens match the current filters.</div>}
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> High Risk & Flagged Tokens</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {tokens.filter(t => t.riskScore >= 45 || t.status === 'flagged').map(t => (
                <div key={t.id} className={`bg-gray-800 border rounded-xl p-4 ${t.status === 'flagged' ? 'border-red-500/50' : 'border-yellow-500/30'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2"><span className="font-bold text-white">{t.symbol}</span><span className="text-xs text-gray-400">{t.name}</span></div>
                    <span className={`text-sm font-bold ${riskClr(t.riskScore)}`}>Risk {t.riskScore}/100</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full"><div className={`h-2 rounded-full ${riskBg(t.riskScore)}`} style={{width:`${t.riskScore}%`}} /></div>
                  {t.flags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{t.flags.map(f => <span key={f} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">{f}</span>)}</div>}
                  {!t.contractVerified && <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400"><AlertTriangle className="w-3.5 h-3.5" /> Unverified smart contract</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Risk Scoring Guide</h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              {[{range:'0–39',label:'Low Risk',color:'text-emerald-400',bg:'bg-emerald-500/10 border-emerald-500/30',desc:'Major tokens with high liquidity. Tracked by default.'},
                {range:'40–69',label:'Medium Risk',color:'text-yellow-400',bg:'bg-yellow-500/10 border-yellow-500/30',desc:'Volatile or smaller-cap tokens. Require periodic review.'},
                {range:'70–100',label:'High Risk',color:'text-red-400',bg:'bg-red-500/10 border-red-500/30',desc:'Suspicious activity or unverified contracts. Auto-flagged.'}].map(r => (
                <div key={r.range} className={`rounded-lg p-3 border ${r.bg}`}>
                  <div className={`font-bold ${r.color}`}>Score {r.range}</div>
                  <div className="font-medium text-white text-sm mt-0.5">{r.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'african' && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-orange-400" /> African & Africa-Focused Tokens</h3>
              <div className="space-y-2">
                {tokens.filter(t => t.category === 'african').map(t => (
                  <div key={t.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-300 font-bold text-sm">{t.symbol.slice(0,2)}</div>
                      <div><div className="font-semibold text-white">{t.symbol}</div><div className="text-xs text-gray-400">{t.name} · {t.exchange}</div></div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-mono text-sm">{t.price >= 1 ? `$${t.price}` : `$${t.price.toFixed(4)}`}</div>
                      <div className={`text-xs font-medium ${t.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.change24h > 0 ? '+' : ''}{t.change24h.toFixed(2)}% 24h</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Stablecoin Coverage — Africa</h3>
              <div className="space-y-2">
                {[{token:'USDT',premium:'+2.8%',exchange:'Quidax (NGN)',note:'NGN premium above peg'},
                  {token:'USDT',premium:'+1.4%',exchange:'Luno (KES)',note:'KES mild premium'},
                  {token:'USDC',premium:'+3.1%',exchange:'VALR (ZAR)',note:'ZAR forex pressure'},
                  {token:'USDT',premium:'-0.2%',exchange:'BuyCoins (NGN)',note:'Near peg'}].map((s,i) => (
                  <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between"><div><span className="font-semibold text-white">{s.token}</span><span className="ml-2 text-xs text-gray-400">{s.exchange}</span></div><span className={`font-bold text-sm ${parseFloat(s.premium) > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>{s.premium}</span></div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-400" /> Add New Token</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Symbol</label><input value={newSym} onChange={e => setNewSym(e.target.value)} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500" placeholder="e.g. BTC" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Full Name</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500" placeholder="e.g. Bitcoin" /></div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">New tokens are added as &quot;Pending&quot; with risk score 50 until reviewed.</div>
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                <button onClick={handleAdd} className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Token</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
