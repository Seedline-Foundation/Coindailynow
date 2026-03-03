'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

// ─── Types ──────────────────────────────────────────────────────────
interface RegulatoryContact {
  name: string;
  role: string;
  email?: string;
}

interface CBDC {
  name: string;
  status: string;
  phase: string;
  details: string;
}

interface TaxFramework {
  capitalGainsTax: string;
  tradingTax: string;
  miningTax: string;
  reportingThreshold: string;
  details: string;
}

interface Licensing {
  required: boolean;
  types: string[];
  applicationProcess: string;
  timelineWeeks: number;
  fees: string;
  renewalPeriod: string;
}

interface AmlKyc {
  amlRequired: boolean;
  kycRequired: boolean;
  travelRuleCompliant: boolean;
  reportingEntity: string;
  details: string;
}

interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  description: string;
  impactScore: number;
  source: string;
}

interface UpcomingPolicy {
  title: string;
  expectedDate: string;
  status: string;
  description: string;
  impactLevel: string;
}

interface EditorialAnalysis {
  outlook: string;
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendation: string;
  analystName: string;
  publishedDate: string;
}

interface MarketContext {
  estimatedCryptoUsers: string;
  p2pVolume24h: string;
  dominantPlatforms: string[];
  mobileMoneyIntegration: string;
  internetPenetration: string;
}

interface PremiumCountry {
  code: string;
  name: string;
  flag: string;
  region: string;
  status: string;
  lastUpdate: string;
  summary: string;
  exchanges: string[];
  keyDocs: string[];
  riskScore: number;
  riskLevel: string;
  complianceRating: string;
  regulatoryBody: string;
  regulatoryContacts: RegulatoryContact[];
  cbdc: CBDC;
  taxFramework: TaxFramework;
  licensing: Licensing;
  amlKyc: AmlKyc;
  timeline: TimelineEvent[];
  upcomingPolicies: UpcomingPolicy[];
  editorialAnalysis: EditorialAnalysis;
  marketContext: MarketContext;
}

interface Stats {
  total: number;
  regulated: number;
  evolving: number;
  restricted: number;
  unregulated: number;
  avgRiskScore: number;
  countriesWithCBDC: number;
  countriesWithLicensing: number;
  totalUpcomingPolicies: number;
  totalTimelineEvents: number;
}

// ─── Helpers ────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  Regulated: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Evolving: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Restricted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Favorable: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'Partially Regulated': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Unregulated: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'WAEMU Rules': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const riskColor = (score: number) => {
  if (score <= 25) return 'text-green-600 dark:text-green-400';
  if (score <= 50) return 'text-yellow-600 dark:text-yellow-400';
  if (score <= 75) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const riskBg = (score: number) => {
  if (score <= 25) return 'bg-green-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 75) return 'bg-orange-500';
  return 'bg-red-500';
};

const outlookColors: Record<string, string> = {
  Bullish: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  Neutral: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  Bearish: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  Uncertain: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30',
};

const outlookEmoji: Record<string, string> = {
  Bullish: '🟢', Neutral: '🔵', Bearish: '🔴', Uncertain: '⚪',
};

const impactColor = (level: string) => {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return map[level] || map.medium;
};

const eventTypeIcon: Record<string, string> = {
  new_regulation: '📜',
  amendment: '✏️',
  enforcement: '⚖️',
  cbdc_update: '🏦',
  announcement: '📢',
  consultation: '💬',
  sandbox: '🧪',
  warning: '⚠️',
};

const gradeColor = (grade: string) => {
  if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
  if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
  if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

type DetailTab = 'overview' | 'analysis' | 'tax' | 'licensing' | 'timeline' | 'market';

// ─── Component ──────────────────────────────────────────────────────
export default function PremiumRegulationPage() {
  const [countries, setCountries] = useState<PremiumCountry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PremiumCountry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'compliance'>('name');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/regulation/premium');
        const data = await res.json();
        setCountries(data.countries || []);
        setStats(data.stats || null);
      } catch {
        // leave empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const regions = ['All', ...Array.from(new Set(countries.map(c => c.region)))];

  const filtered = countries
    .filter(c =>
      (regionFilter === 'All' || c.region === regionFilter) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'risk') return a.riskScore - b.riskScore;
      if (sortBy === 'compliance') return a.complianceRating.localeCompare(b.complianceRating);
      return a.name.localeCompare(b.name);
    });

  // ─── Sub-components ─────────────────────────────────────────────
  const RiskGauge = ({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) => {
    const w = size === 'lg' ? 120 : 60;
    const stroke = size === 'lg' ? 10 : 6;
    const r = (w - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = score / 100;
    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: w, height: w }}>
        <svg width={w} height={w} className="-rotate-90">
          <circle cx={w/2} cy={w/2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-200 dark:text-gray-700" />
          <circle cx={w/2} cy={w/2} r={r} fill="none" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className={riskBg(score)} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <span className={`absolute font-bold ${size === 'lg' ? 'text-2xl' : 'text-sm'} ${riskColor(score)}`}>{score}</span>
      </div>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Loading premium regulatory intelligence...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Detail View ────────────────────────────────────────────────
  if (selected) {
    const c = selected;
    const tabs: { key: DetailTab; label: string; icon: string }[] = [
      { key: 'overview', label: 'Overview', icon: '📋' },
      { key: 'analysis', label: 'Expert Analysis', icon: '🧠' },
      { key: 'tax', label: 'Tax & Licensing', icon: '💰' },
      { key: 'licensing', label: 'AML / KYC', icon: '🔒' },
      { key: 'timeline', label: 'Timeline', icon: '📅' },
      { key: 'market', label: 'Market Context', icon: '📊' },
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button onClick={() => { setSelected(null); setDetailTab('overview'); }} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-medium">
            ← Back to All Countries
          </button>

          {/* Country Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-5xl">{c.flag}</span>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{c.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{c.region} • {c.regulatoryBody}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>{c.status}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColor(c.complianceRating)} bg-gray-100 dark:bg-gray-700`}>Grade: {c.complianceRating}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Updated {c.lastUpdate}</span>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <RiskGauge score={c.riskScore} />
                  <p className={`text-sm font-semibold mt-1 ${riskColor(c.riskScore)}`}>{c.riskLevel} Risk</p>
                </div>
                <div className={`px-5 py-3 rounded-xl text-center ${outlookColors[c.editorialAnalysis.outlook] || 'bg-gray-50'}`}>
                  <p className="text-2xl mb-1">{outlookEmoji[c.editorialAnalysis.outlook] || '⚪'}</p>
                  <p className="font-bold text-lg">{c.editorialAnalysis.outlook}</p>
                  <p className="text-xs opacity-70">CoinDaily Outlook</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setDetailTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${detailTab === t.key ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'}`}
              >
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">

            {/* ── Overview Tab ───────────────────────────────── */}
            {detailTab === 'overview' && (
              <>
                {/* Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">📋 Regulatory Summary</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{c.summary}</p>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow text-center">
                    <p className="text-3xl font-bold text-orange-600">{c.exchanges.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Licensed Exchanges</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow text-center">
                    <p className="text-3xl font-bold text-blue-600">{c.timeline.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Regulatory Events</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow text-center">
                    <p className="text-3xl font-bold text-purple-600">{c.upcomingPolicies.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Upcoming Policies</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow text-center">
                    <p className="text-3xl font-bold text-green-600">{c.cbdc.status === 'Active' ? '✓' : c.cbdc.status}</p>
                    <p className="text-sm text-gray-500 mt-1">CBDC</p>
                  </div>
                </div>

                {/* Exchanges & Key Docs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏛️ Licensed & Active Exchanges</h3>
                    <div className="flex flex-wrap gap-2">
                      {c.exchanges.map(ex => (
                        <span key={ex} className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium">{ex}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📄 Key Regulatory Documents</h3>
                    <ul className="space-y-2">
                      {c.keyDocs.map((doc, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-300 text-sm">
                          <span className="text-orange-500 mt-0.5">📎</span>{doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Regulatory Contacts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📞 Regulatory Contacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.regulatoryContacts.map((contact, i) => (
                      <div key={i} className="border dark:border-gray-700 rounded-xl p-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{contact.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{contact.role}</p>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-sm text-orange-600 hover:underline mt-1 block">{contact.email}</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CBDC */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏦 CBDC — {c.cbdc.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">{c.cbdc.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phase</p>
                      <p className="font-bold text-purple-700 dark:text-purple-300">{c.cbdc.phase}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">{c.lastUpdate}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.cbdc.details}</p>
                </div>
              </>
            )}

            {/* ── Expert Analysis Tab ────────────────────────── */}
            {detailTab === 'analysis' && (
              <>
                {/* Outlook Banner */}
                <div className={`rounded-2xl shadow p-8 ${outlookColors[c.editorialAnalysis.outlook] || 'bg-gray-50'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl">{outlookEmoji[c.editorialAnalysis.outlook]}</span>
                    <div>
                      <h2 className="text-2xl font-bold">CoinDaily Outlook: {c.editorialAnalysis.outlook}</h2>
                      <p className="text-sm opacity-70">by {c.editorialAnalysis.analystName} — Published {c.editorialAnalysis.publishedDate}</p>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed">{c.editorialAnalysis.summary}</p>
                </div>

                {/* Recommendation */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-bold mb-3">💡 CoinDaily Recommendation</h3>
                  <p className="text-lg leading-relaxed">{c.editorialAnalysis.recommendation}</p>
                </div>

                {/* Opportunities & Risks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                    <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-4">✅ Opportunities</h3>
                    <ul className="space-y-3">
                      {c.editorialAnalysis.opportunities.map((opp, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300">{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4">⚠️ Risks</h3>
                    <ul className="space-y-3">
                      {c.editorialAnalysis.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Risk & Compliance Scores */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">📊 Risk & Compliance Scorecard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="text-center">
                      <RiskGauge score={c.riskScore} />
                      <p className={`font-bold mt-2 ${riskColor(c.riskScore)}`}>{c.riskLevel} Risk</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = Lowest, 100 = Highest</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-6xl font-black ${gradeColor(c.complianceRating)}`}>{c.complianceRating}</div>
                      <p className="font-bold text-gray-700 dark:text-gray-300 mt-2">Compliance Rating</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A+ = Best, F = Worst</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">AML Compliance</span>
                        <span className={`font-bold ${c.amlKyc.amlRequired ? 'text-green-600' : 'text-red-600'}`}>{c.amlKyc.amlRequired ? '✓ Required' : '✗ None'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">KYC Compliance</span>
                        <span className={`font-bold ${c.amlKyc.kycRequired ? 'text-green-600' : 'text-red-600'}`}>{c.amlKyc.kycRequired ? '✓ Required' : '✗ None'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Travel Rule</span>
                        <span className={`font-bold ${c.amlKyc.travelRuleCompliant ? 'text-green-600' : 'text-yellow-600'}`}>{c.amlKyc.travelRuleCompliant ? '✓ Compliant' : '⏳ Pending'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Licensing Required</span>
                        <span className={`font-bold ${c.licensing.required ? 'text-green-600' : 'text-yellow-600'}`}>{c.licensing.required ? '✓ Yes' : '✗ No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tax & Licensing Tab ─────────────────────────── */}
            {detailTab === 'tax' && (
              <>
                {/* Tax Framework */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">💰 Tax Framework</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {[
                      { label: 'Capital Gains Tax', value: c.taxFramework.capitalGainsTax, icon: '📈' },
                      { label: 'Trading Tax', value: c.taxFramework.tradingTax, icon: '🔄' },
                      { label: 'Mining Tax', value: c.taxFramework.miningTax, icon: '⛏️' },
                      { label: 'Reporting Threshold', value: c.taxFramework.reportingThreshold, icon: '📊' },
                    ].map(item => (
                      <div key={item.label} className="border dark:border-gray-700 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{item.icon}</span>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📝 Detailed Tax Notes</h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.taxFramework.details}</p>
                  </div>
                </div>

                {/* Licensing */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📜 Licensing Requirements</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 border dark:border-gray-700 rounded-xl">
                      <p className={`text-2xl font-bold ${c.licensing.required ? 'text-green-600' : 'text-yellow-600'}`}>{c.licensing.required ? 'Required' : 'Optional'}</p>
                      <p className="text-xs text-gray-500 mt-1">License Status</p>
                    </div>
                    <div className="text-center p-4 border dark:border-gray-700 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">{c.licensing.timelineWeeks}w</p>
                      <p className="text-xs text-gray-500 mt-1">Avg Timeline</p>
                    </div>
                    <div className="text-center p-4 border dark:border-gray-700 rounded-xl">
                      <p className="text-2xl font-bold text-purple-600">{c.licensing.types.length}</p>
                      <p className="text-xs text-gray-500 mt-1">License Types</p>
                    </div>
                    <div className="text-center p-4 border dark:border-gray-700 rounded-xl">
                      <p className="text-2xl font-bold text-orange-600">{c.licensing.renewalPeriod}</p>
                      <p className="text-xs text-gray-500 mt-1">Renewal</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">License Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.licensing.types.map(t => (
                          <span key={t} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Application Process</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.licensing.applicationProcess}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">💵 Fees</h4>
                      <p className="text-orange-700 dark:text-orange-200 font-medium">{c.licensing.fees}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── AML / KYC Tab ───────────────────────────────── */}
            {detailTab === 'licensing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🔒 AML / KYC Compliance</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'AML Required', value: c.amlKyc.amlRequired, icon: '🛡️' },
                    { label: 'KYC Required', value: c.amlKyc.kycRequired, icon: '🪪' },
                    { label: 'Travel Rule', value: c.amlKyc.travelRuleCompliant, icon: '✈️' },
                    { label: 'Licensing Required', value: c.licensing.required, icon: '📜' },
                  ].map(item => (
                    <div key={item.label} className={`text-center p-5 rounded-xl border-2 ${item.value ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'}`}>
                      <p className="text-3xl mb-2">{item.icon}</p>
                      <p className={`font-bold ${item.value ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{item.value ? 'Yes' : 'No'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="border dark:border-gray-700 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reporting Entity</h4>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{c.amlKyc.reportingEntity}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Compliance Details</h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.amlKyc.details}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Timeline Tab ────────────────────────────────── */}
            {detailTab === 'timeline' && (
              <>
                {/* Upcoming Policies */}
                {c.upcomingPolicies.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🔮 Upcoming Policies</h2>
                    <div className="space-y-4">
                      {c.upcomingPolicies.map((policy, i) => (
                        <div key={i} className="border dark:border-gray-700 rounded-xl p-5">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">{policy.title}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${impactColor(policy.impactLevel)}`}>{policy.impactLevel.toUpperCase()}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{policy.status}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{policy.expectedDate}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{policy.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📅 Regulatory Timeline</h2>
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-8">
                      {c.timeline.map((event, i) => (
                        <div key={i} className="relative pl-14">
                          <div className="absolute left-4 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-2 border-orange-500 flex items-center justify-center text-xs">
                            {eventTypeIcon[event.type] || '📌'}
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{event.date}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">{event.type.replace('_', ' ')}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Impact: {event.impactScore}/10</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{event.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{event.description}</p>
                            <p className="text-xs text-gray-400 mt-2">Source: {event.source}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Market Context Tab ──────────────────────────── */}
            {detailTab === 'market' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Market Context</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                      <p className="text-3xl font-black text-orange-600">{c.marketContext.estimatedCryptoUsers}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Est. Crypto Users</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                      <p className="text-3xl font-black text-green-600">{c.marketContext.p2pVolume24h}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">24h P2P Volume</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                      <p className="text-3xl font-black text-blue-600">{c.marketContext.internetPenetration}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Internet Penetration</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border dark:border-gray-700 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🏪 Dominant Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        {c.marketContext.dominantPlatforms.map(p => (
                          <span key={p} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="border dark:border-gray-700 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📱 Mobile Money Integration</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.marketContext.mobileMoneyIntegration}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Country List View ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium mb-4">
            👑 Premium Member Access
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Africa Regulatory Intelligence
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Deep-dive analysis with risk scores, compliance ratings, tax frameworks, licensing guides,
            CBDC tracking, and expert editorial views across 14 African countries.
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Countries', value: stats.total, color: 'text-orange-600' },
              { label: 'Avg Risk Score', value: stats.avgRiskScore, color: riskColor(stats.avgRiskScore) },
              { label: 'With CBDC', value: stats.countriesWithCBDC, color: 'text-purple-600' },
              { label: 'License Required', value: stats.countriesWithLicensing, color: 'text-blue-600' },
              { label: 'Upcoming Policies', value: stats.totalUpcomingPolicies, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="name">Sort: Name</option>
            <option value="risk">Sort: Risk (Low→High)</option>
            <option value="compliance">Sort: Compliance Grade</option>
          </select>
        </div>

        {/* Country Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filtered.map(country => (
            <div
              key={country.code}
              onClick={() => setSelected(country)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all p-6 cursor-pointer border-2 border-transparent hover:border-orange-500 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">{country.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{country.region}</p>
                  </div>
                </div>
                <RiskGauge score={country.riskScore} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[country.status] || 'bg-gray-100 text-gray-800'}`}>{country.status}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor(country.complianceRating)}`}>{country.complianceRating}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${outlookColors[country.editorialAnalysis.outlook] || ''}`}>
                  {outlookEmoji[country.editorialAnalysis.outlook]} {country.editorialAnalysis.outlook}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{country.summary}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-3 border-t dark:border-gray-700">
                <span>{country.exchanges.length} exchanges</span>
                <span>{country.upcomingPolicies.length} upcoming policies</span>
                <span>{country.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No countries match your search.</p>
          </div>
        )}

        {/* Back to Free + Membership CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/regulation" className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-300 dark:border-gray-600 hover:border-orange-500 transition-colors font-medium">
            ← Free Regulation Tracker
          </Link>
          <Link href="/membership" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 shadow-lg">
            Manage Membership →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
