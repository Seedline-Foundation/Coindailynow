'use client';

import { useState } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Code,
  Zap,
  Globe,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  BarChart3,
  Building2,
} from 'lucide-react';

interface ApiTier {
  id: string;
  name: string;
  price: number | null;
  period: string;
  reqPerDay: number | null;
  reqPerMonth: number | null;
  color: string;
  badge?: string;
  features: string[];
  endpoints: string[];
}

interface Licensee {
  id: string;
  company: string;
  tier: string;
  apiKey: string;
  usage: number;
  limit: number;
  revenue: number;
  status: 'active' | 'suspended' | 'trial';
  expiresAt: string;
  createdAt: string;
}

interface ApiEndpoint {
  method: 'GET' | 'WS' | 'POST';
  path: string;
  description: string;
  basic: boolean;
  premium: boolean;
  enterprise: boolean;
  category: string;
}

const TIERS: ApiTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    period: 'Free forever',
    reqPerDay: 100,
    reqPerMonth: 3000,
    color: 'gray',
    features: [
      '100 requests / day',
      'Spot price data',
      'JSON responses',
      'Public endpoints only',
      'Rate limiting enforced',
      'Community support',
    ],
    endpoints: ['prices', 'market-overview'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99,
    period: 'per month',
    reqPerDay: 10000,
    reqPerMonth: 300000,
    color: 'blue',
    badge: 'Popular',
    features: [
      '10,000 requests / day',
      'Historical OHLC data',
      'Stablecoin premium feeds',
      'African exchange data',
      'WebSocket streams (5 symbols)',
      'Email support + SLA 99.5%',
    ],
    endpoints: ['prices', 'historical', 'stablecoin-premiums', 'market-sentiment'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'Custom pricing',
    reqPerDay: null,
    reqPerMonth: null,
    color: 'purple',
    badge: 'Contact Us',
    features: [
      'Unlimited requests',
      'On-chain volume data',
      'Whale tracking feeds',
      'Dedicated WebSocket streams',
      'Private endpoints',
      'Priority support + SLA 99.9%',
      'Custom data pipelines',
    ],
    endpoints: ['all'],
  },
];

const ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/prices/:symbol',
    description: 'Real-time spot price with 24h stats',
    basic: true,
    premium: true,
    enterprise: true,
    category: 'Market',
  },
  {
    method: 'GET',
    path: '/api/v1/market/overview',
    description: 'Global crypto market cap and dominance',
    basic: true,
    premium: true,
    enterprise: true,
    category: 'Market',
  },
  {
    method: 'GET',
    path: '/api/v1/historical/:symbol',
    description: 'OHLCV historical candle data (1m to 1Y)',
    basic: false,
    premium: true,
    enterprise: true,
    category: 'Historical',
  },
  {
    method: 'GET',
    path: '/api/v1/stablecoin/premiums',
    description: 'Stablecoin premium/discount on African exchanges',
    basic: false,
    premium: true,
    enterprise: true,
    category: 'Africa',
  },
  {
    method: 'GET',
    path: '/api/v1/market/sentiment',
    description: 'AI-powered market sentiment score with signals',
    basic: false,
    premium: true,
    enterprise: true,
    category: 'AI',
  },
  {
    method: 'GET',
    path: '/api/v1/onchain/volume/:chain',
    description: 'On-chain transaction volume by network',
    basic: false,
    premium: false,
    enterprise: true,
    category: 'On-chain',
  },
  {
    method: 'GET',
    path: '/api/v1/whale/activity',
    description: 'Large wallet movement and whale alerts',
    basic: false,
    premium: false,
    enterprise: true,
    category: 'On-chain',
  },
  {
    method: 'WS',
    path: '/api/v1/stream/:symbol',
    description: 'Real-time WebSocket price and trade stream',
    basic: false,
    premium: true,
    enterprise: true,
    category: 'Streaming',
  },
];

const LICENSEES: Licensee[] = [
  {
    id: 'L001',
    company: 'Quidax Analytics',
    tier: 'enterprise',
    apiKey: 'cd_live_qx9a2b3c4d5e6f7g',
    usage: 847200,
    limit: -1,
    revenue: 1200,
    status: 'active',
    expiresAt: '2025-12-31',
    createdAt: '2024-01-15',
  },
  {
    id: 'L002',
    company: 'Luno Research',
    tier: 'premium',
    apiKey: 'cd_live_lr1x2y3z4a5b6c7d',
    usage: 215000,
    limit: 300000,
    revenue: 99,
    status: 'active',
    expiresAt: '2025-06-30',
    createdAt: '2024-03-20',
  },
  {
    id: 'L003',
    company: 'AfriCrypto Media',
    tier: 'premium',
    apiKey: 'cd_live_ac8d9e0f1g2h3i4j',
    usage: 289000,
    limit: 300000,
    revenue: 99,
    status: 'active',
    expiresAt: '2025-07-15',
    createdAt: '2024-02-10',
  },
  {
    id: 'L004',
    company: 'BitSave NG',
    tier: 'basic',
    apiKey: 'cd_free_bs5k6l7m8n9o0p1q',
    usage: 2800,
    limit: 3000,
    revenue: 0,
    status: 'active',
    expiresAt: 'Never',
    createdAt: '2024-05-01',
  },
  {
    id: 'L005',
    company: 'Valr Integrations',
    tier: 'enterprise',
    apiKey: 'cd_live_vl2r3s4t5u6v7w8x',
    usage: 1240000,
    limit: -1,
    revenue: 2500,
    status: 'trial',
    expiresAt: '2025-02-28',
    createdAt: '2025-01-20',
  },
];

const tierColor = (tier: string) => {
  if (tier === 'enterprise') return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  if (tier === 'premium') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
};

const statusColor = (s: string) => {
  if (s === 'active') return 'text-emerald-400 bg-emerald-500/10';
  if (s === 'trial') return 'text-yellow-400 bg-yellow-500/10';
  return 'text-red-400 bg-red-500/10';
};

const methodBadge = (method: string) => {
  if (method === 'WS') return 'bg-purple-500/20 text-purple-300';
  if (method === 'POST') return 'bg-yellow-500/20 text-yellow-300';
  return 'bg-blue-500/20 text-blue-300';
};

export default function ApiLicensingPage() {
  const { user } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState<'tiers' | 'endpoints' | 'licensees' | 'revenue'>('tiers');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAddLicensee, setShowAddLicensee] = useState(false);
  const [licensees] = useState<Licensee[]>(LICENSEES);

  const totalRevenue = licensees.reduce((s, l) => s + l.revenue, 0);
  const activeLicensees = licensees.filter(l => l.status === 'active' || l.status === 'trial').length;
  const enterpriseCount = licensees.filter(l => l.tier === 'enterprise').length;
  const premiumCount = licensees.filter(l => l.tier === 'premium').length;

  const categories = ['All', ...Array.from(new Set(ENDPOINTS.map(e => e.category)))];
  const filteredEndpoints = filterCategory === 'All' ? ENDPOINTS : ENDPOINTS.filter(e => e.category === filterCategory);

  const toggleReveal = (id: string) =>
    setRevealedKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => key.slice(0, 10) + '••••••••••••••••';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key className="w-8 h-8 text-emerald-400" />
            API Licensing & Data Access
          </h1>
          <p className="text-gray-400 mt-1">Manage API product tiers, endpoint access, and licensee accounts</p>
        </div>
        <button
          onClick={() => setShowAddLicensee(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Issue API Key
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', sub: '+12% MoM' },
          { label: 'Active Licensees', value: activeLicensees, icon: Users, color: 'text-blue-400', sub: `${enterpriseCount} enterprise` },
          { label: 'API Endpoints', value: ENDPOINTS.length, icon: Code, color: 'text-purple-400', sub: 'across 5 categories' },
          { label: 'Avg Uptime', value: '99.8%', icon: Activity, color: 'text-yellow-400', sub: 'last 30 days' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1.5">
        {(['tiers', 'endpoints', 'licensees', 'revenue'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab === 'tiers' ? 'API Tiers' : tab === 'endpoints' ? 'Endpoint Catalog' : tab === 'licensees' ? 'Licensees' : 'Revenue'}
          </button>
        ))}
      </div>

      {/* ── API Tiers Tab ── */}
      {activeTab === 'tiers' && (
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className={`bg-gray-800 border rounded-xl p-6 flex flex-col gap-4 ${
                tier.id === 'premium' ? 'border-blue-500/50 ring-1 ring-blue-500/20' :
                tier.id === 'enterprise' ? 'border-purple-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    {tier.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        tier.id === 'premium' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                      }`}>{tier.badge}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    {tier.price === null ? (
                      <span className="text-2xl font-bold text-purple-400">Custom</span>
                    ) : tier.price === 0 ? (
                      <span className="text-2xl font-bold text-gray-300">Free</span>
                    ) : (
                      <span className="text-2xl font-bold text-white">${tier.price}<span className="text-sm font-normal text-gray-400">/{tier.period.split(' ')[1]}</span></span>
                    )}
                    <div className="text-xs text-gray-500">{tier.period}</div>
                  </div>
                </div>
                <Key className={`w-7 h-7 ${
                  tier.id === 'enterprise' ? 'text-purple-400' :
                  tier.id === 'premium' ? 'text-blue-400' : 'text-gray-400'
                }`} />
              </div>

              {/* Limits */}
              <div className="bg-gray-700/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily limit</span>
                  <span className="text-white font-medium">{tier.reqPerDay === null ? 'Unlimited' : tier.reqPerDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly limit</span>
                  <span className="text-white font-medium">{tier.reqPerMonth === null ? 'Unlimited' : tier.reqPerMonth.toLocaleString()}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-2.5 rounded-lg font-medium transition-colors text-sm ${
                tier.id === 'premium'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : tier.id === 'enterprise'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}>
                {tier.id === 'enterprise' ? 'Contact Sales' : tier.price === 0 ? 'Issue Free Key' : 'Create Subscription'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Endpoint Catalog Tab ── */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tier access header */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-0 bg-gray-700/50 px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <div>Endpoint</div>
              <div className="text-center">Basic</div>
              <div className="text-center">Premium</div>
              <div className="text-center">Enterprise</div>
            </div>
            <div className="divide-y divide-gray-700/50">
              {filteredEndpoints.map(ep => (
                <div key={ep.path} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-0 px-4 py-3 hover:bg-gray-700/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${methodBadge(ep.method)}`}>{ep.method}</span>
                      <code className="text-sm text-emerald-300 font-mono">{ep.path}</code>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-14">{ep.description}</p>
                    <span className="inline-block mt-1 ml-14 text-xs text-gray-600 bg-gray-700 px-2 py-0.5 rounded">{ep.category}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    {ep.basic ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex items-center justify-center">
                    {ep.premium ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex items-center justify-center">
                    {ep.enterprise ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-gray-600" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example code snippet */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Code className="w-4 h-4 text-emerald-400" /> Quick Start Example</h3>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">JavaScript / Node.js</span>
            </div>
            <pre className="text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">{`const response = await fetch(
  'https://api.coindaily.africa/api/v1/prices/BTC',
  { headers: { 'Authorization': 'Bearer cd_live_YOUR_API_KEY' } }
);
const { price, change_24h, volume } = await response.json();
console.log(\`BTC: $\${price} (\${change_24h > 0 ? '+' : ''}\${change_24h}%)\`);`}</pre>
          </div>
        </div>
      )}

      {/* ── Licensees Tab ── */}
      {activeTab === 'licensees' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Enterprise', count: enterpriseCount, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
              { label: 'Premium', count: premiumCount, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
              { label: 'Basic', count: licensees.filter(l => l.tier === 'basic').length, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
            ].map(s => (
              <span key={s.label} className={`text-sm px-3 py-1.5 rounded-lg border ${s.color}`}>
                {s.count} {s.label}
              </span>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">API Key</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {licensees.map(l => {
                    const usagePct = l.limit === -1 ? null : Math.round((l.usage / l.limit) * 100);
                    return (
                      <tr key={l.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-white font-medium">{l.company}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${tierColor(l.tier)}`}>
                            {l.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-300 font-mono">
                              {revealedKeys.has(l.id) ? l.apiKey : maskKey(l.apiKey)}
                            </code>
                            <button onClick={() => toggleReveal(l.id)} className="text-gray-500 hover:text-gray-300">
                              {revealedKeys.has(l.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => copyKey(l.apiKey, l.id)} className="text-gray-500 hover:text-emerald-400">
                              {copiedKey === l.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-300">{l.usage.toLocaleString()} req</div>
                          {usagePct !== null && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-gray-700 rounded-full w-20">
                                <div
                                  className={`h-1.5 rounded-full ${usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{usagePct}%</span>
                            </div>
                          )}
                          {usagePct === null && <div className="text-xs text-gray-600">Unlimited</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-400 font-medium">${l.revenue > 0 ? l.revenue.toLocaleString() : '—'}</span>
                          {l.revenue > 0 && <div className="text-xs text-gray-500">/month</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor(l.status)}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{l.expiresAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue Tab ── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'MRR from API', value: `$${totalRevenue.toLocaleString()}`, sub: 'Monthly Recurring Revenue', color: 'text-emerald-400', icon: DollarSign },
              { label: 'ARR Projection', value: `$${(totalRevenue * 12).toLocaleString()}`, sub: 'Annualized run rate', color: 'text-blue-400', icon: TrendingUp },
              { label: 'Avg Revenue / Key', value: `$${Math.round(totalRevenue / activeLicensees)}`, sub: `across ${activeLicensees} licensees`, color: 'text-purple-400', icon: BarChart3 },
            ].map(card => (
              <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{card.label}</span>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Revenue breakdown by tier */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" /> Revenue by Tier
            </h3>
            <div className="space-y-3">
              {[
                { tier: 'Enterprise', rev: licensees.filter(l => l.tier === 'enterprise').reduce((s, l) => s + l.revenue, 0), color: 'bg-purple-500' },
                { tier: 'Premium', rev: licensees.filter(l => l.tier === 'premium').reduce((s, l) => s + l.revenue, 0), color: 'bg-blue-500' },
                { tier: 'Basic', rev: 0, color: 'bg-gray-500' },
              ].map(row => {
                const pct = totalRevenue > 0 ? Math.round((row.rev / totalRevenue) * 100) : 0;
                return (
                  <div key={row.tier}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{row.tier}</span>
                      <span className="text-white font-medium">${row.rev.toLocaleString()} <span className="text-gray-500">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-700 rounded-full">
                      <div className={`h-2.5 rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth targets */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Q2 2025 Growth Targets
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {[
                { goal: '5 Enterprise Clients', current: `${enterpriseCount} / 5`, pct: Math.round((enterpriseCount / 5) * 100), color: 'bg-purple-500' },
                { goal: '20 Premium Keys', current: `${premiumCount} / 20`, pct: Math.round((premiumCount / 20) * 100), color: 'bg-blue-500' },
                { goal: '$10,000 MRR', current: `$${totalRevenue} / $10,000`, pct: Math.round((totalRevenue / 10000) * 100), color: 'bg-emerald-500' },
              ].map(t => (
                <div key={t.goal} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-300 font-medium mb-1">{t.goal}</div>
                  <div className="text-white text-lg font-bold mb-2">{t.current}</div>
                  <div className="h-2 bg-gray-600 rounded-full">
                    <div className={`h-2 rounded-full ${t.color}`} style={{ width: `${Math.min(t.pct, 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t.pct}% of target</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Licensee placeholder modal */}
      {showAddLicensee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Key className="w-5 h-5 text-emerald-400" /> Issue New API Key</h2>
              <button onClick={() => setShowAddLicensee(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Company / Client Name</label>
                <input type="text" className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="e.g. Binance Africa" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tier</label>
                <select className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                  <option value="basic">Basic (Free)</option>
                  <option value="premium">Premium ($99/mo)</option>
                  <option value="enterprise">Enterprise (Custom)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact Email</label>
                <input type="email" className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="dev@company.com" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddLicensee(false)} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
                <button onClick={() => setShowAddLicensee(false)} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" /> Generate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
