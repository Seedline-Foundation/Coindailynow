'use client';

import { useState } from 'react';
import {
  Building, Globe, RefreshCw, Activity, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, ArrowUpDown, Wifi, WifiOff, BarChart3,
  ChevronUp, ChevronDown, Clock,
} from 'lucide-react';

interface Exchange {
  id: string;
  name: string;
  region: 'Africa' | 'Global';
  type: 'CEX' | 'DEX' | 'P2P';
  uptime: number;
  latencyMs: number;
  priority: number;
  status: 'online' | 'degraded' | 'offline';
  pairs: number;
  volume24h: number;
  lastCheck: string;
  connected: boolean;
}

const EXCHANGES: Exchange[] = [
  { id: 'e1', name: 'Binance', region: 'Global', type: 'CEX', uptime: 99.97, latencyMs: 42, priority: 1, status: 'online', pairs: 2400, volume24h: 18500000000, lastCheck: '30s ago', connected: true },
  { id: 'e2', name: 'Luno', region: 'Africa', type: 'CEX', uptime: 99.12, latencyMs: 118, priority: 2, status: 'online', pairs: 18, volume24h: 45000000, lastCheck: '45s ago', connected: true },
  { id: 'e3', name: 'Quidax', region: 'Africa', type: 'CEX', uptime: 98.85, latencyMs: 145, priority: 3, status: 'online', pairs: 32, volume24h: 28000000, lastCheck: '1m ago', connected: true },
  { id: 'e4', name: 'VALR', region: 'Africa', type: 'CEX', uptime: 99.44, latencyMs: 98, priority: 4, status: 'online', pairs: 55, volume24h: 82000000, lastCheck: '30s ago', connected: true },
  { id: 'e5', name: 'BuyCoins', region: 'Africa', type: 'P2P', uptime: 97.60, latencyMs: 210, priority: 5, status: 'degraded', pairs: 8, volume24h: 12000000, lastCheck: '2m ago', connected: true },
  { id: 'e6', name: 'Ice3X', region: 'Africa', type: 'CEX', uptime: 94.20, latencyMs: 320, priority: 6, status: 'degraded', pairs: 12, volume24h: 5000000, lastCheck: '5m ago', connected: false },
  { id: 'e7', name: 'KuCoin', region: 'Global', type: 'CEX', uptime: 99.80, latencyMs: 55, priority: 7, status: 'online', pairs: 920, volume24h: 1200000000, lastCheck: '30s ago', connected: true },
  { id: 'e8', name: 'Uniswap V3', region: 'Global', type: 'DEX', uptime: 99.99, latencyMs: 28, priority: 8, status: 'online', pairs: 5800, volume24h: 820000000, lastCheck: '15s ago', connected: true },
];

const statusCfg = {
  online: { color: 'text-emerald-400 bg-emerald-500/10', label: 'Online', Icon: CheckCircle },
  degraded: { color: 'text-yellow-400 bg-yellow-500/10', label: 'Degraded', Icon: AlertTriangle },
  offline: { color: 'text-red-400 bg-red-500/10', label: 'Offline', Icon: XCircle },
};

const fmtVol = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

export default function SuperAdminMarketExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>(EXCHANGES);
  const [activeTab, setActiveTab] = useState<'list' | 'routing' | 'metrics'>('list');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filtered = exchanges.filter(e =>
    (filterRegion === 'all' || e.region === filterRegion) &&
    (filterType === 'all' || e.type === filterType)
  );

  const toggleConnected = (id: string) =>
    setExchanges(p => p.map(e => e.id === id ? { ...e, connected: !e.connected, status: (!e.connected ? 'online' : 'offline') as Exchange['status'] } : e));

  const movePriority = (id: string, dir: 1 | -1) => {
    setExchanges(prev => {
      const idx = prev.findIndex(e => e.id === id);
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((e, i) => ({ ...e, priority: i + 1 }));
    });
  };

  const onlineCount = exchanges.filter(e => e.status === 'online').length;
  const africaCount = exchanges.filter(e => e.region === 'Africa').length;
  const degraded = exchanges.filter(e => e.status === 'degraded' || e.status === 'offline').length;
  const avgLatency = Math.round(exchanges.filter(e => e.connected).reduce((s, e) => s + e.latencyMs, 0) / exchanges.filter(e => e.connected).length);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Building className="w-8 h-8 text-purple-400" /> Exchange Management</h1>
          <p className="text-gray-400 mt-1">Manage exchange connectivity, uptime, and routing priority</p>
        </div>
        <button onClick={() => setExchanges([...EXCHANGES])} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Online Exchanges',value:onlineCount,Icon:CheckCircle,color:'text-emerald-400'},
          {label:'African Exchanges',value:africaCount,Icon:Globe,color:'text-orange-400'},
          {label:'Issues (Degraded)',value:degraded,Icon:AlertTriangle,color:'text-yellow-400'},
          {label:'Avg Latency',value:`${avgLatency}ms`,Icon:Activity,color:'text-blue-400'}].map(k => (
          <div key={k.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">{k.label}</span><k.Icon className={`w-5 h-5 ${k.color}`} /></div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1.5">
        {(['list','routing','metrics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {tab === 'list' ? 'Exchange List' : tab === 'routing' ? 'Routing Priority' : 'Uptime Metrics'}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Regions</option>
              <option value="Africa">Africa</option>
              <option value="Global">Global</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Types</option>
              <option value="CEX">CEX</option>
              <option value="DEX">DEX</option>
              <option value="P2P">P2P</option>
            </select>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-700 bg-gray-700/40">{['Priority','Exchange','Region','Type','Uptime','Latency','24h Volume','Status','Connected'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filtered.map(ex => {
                    const S = statusCfg[ex.status];
                    return (
                      <tr key={ex.id} className="hover:bg-gray-700/20">
                        <td className="px-4 py-3"><span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center">{ex.priority}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-bold text-white">{ex.name.slice(0,2)}</div>
                            <span className="font-semibold text-white">{ex.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ex.region === 'Africa' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{ex.region}</span></td>
                        <td className="px-4 py-3"><span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{ex.type}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-700 rounded-full"><div className={`h-1.5 rounded-full ${ex.uptime >= 99 ? 'bg-emerald-500' : ex.uptime >= 97 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width:`${ex.uptime}%`}} /></div>
                            <span className="text-xs text-gray-300">{ex.uptime}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs font-mono font-medium ${ex.latencyMs < 100 ? 'text-emerald-400' : ex.latencyMs < 200 ? 'text-yellow-400' : 'text-red-400'}`}>{ex.latencyMs}ms</span></td>
                        <td className="px-4 py-3 text-xs text-gray-300 font-mono">{fmtVol(ex.volume24h)}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${S.color}`}><S.Icon className="w-3 h-3" />{S.label}</span></td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleConnected(ex.id)} className={`relative w-10 h-5 rounded-full transition-colors ${ex.connected ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ex.connected ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-purple-400" /> Routing Priority Order</h3>
            <p className="text-sm text-gray-400 mb-4">Drag or use arrows to reorder. The system routes price queries in priority order, falling back to the next exchange on failure.</p>
            <div className="space-y-2">
              {exchanges.map((ex, idx) => (
                <div key={ex.id} className="flex items-center gap-3 bg-gray-700/50 border border-gray-600 rounded-xl p-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => movePriority(ex.id, -1)} disabled={idx === 0} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => movePriority(ex.id, 1)} disabled={idx === exchanges.length - 1} className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center shrink-0">{ex.priority}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{ex.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ex.region === 'Africa' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{ex.region}</span>
                      <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">{ex.type}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{ex.latencyMs}ms · {ex.uptime}% uptime · {ex.pairs.toLocaleString()} pairs</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${ex.status === 'online' ? 'bg-emerald-400' : ex.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            {exchanges.map(ex => (
              <div key={ex.id} className={`bg-gray-800 border rounded-xl p-4 ${ex.status === 'degraded' ? 'border-yellow-500/40' : ex.status === 'offline' ? 'border-red-500/40' : 'border-gray-700'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{ex.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${ex.region === 'Africa' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{ex.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {ex.connected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                    <Clock className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500">{ex.lastCheck}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className={`text-lg font-bold ${ex.uptime >= 99 ? 'text-emerald-400' : ex.uptime >= 97 ? 'text-yellow-400' : 'text-red-400'}`}>{ex.uptime}%</div>
                    <div className="text-xs text-gray-500">Uptime</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className={`text-lg font-bold ${ex.latencyMs < 100 ? 'text-emerald-400' : ex.latencyMs < 200 ? 'text-yellow-400' : 'text-red-400'}`}>{ex.latencyMs}ms</div>
                    <div className="text-xs text-gray-500">Latency</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="text-lg font-bold text-blue-400">{fmtVol(ex.volume24h)}</div>
                    <div className="text-xs text-gray-500">24h Vol</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
