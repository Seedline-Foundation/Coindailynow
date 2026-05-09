/**
 * Crypto Policies Dashboard
 * Africa Crypto Regulation & Policy Monitoring Center
 * Tracks: Current policies, Upcoming policies, New releases, Country details
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, Shield, AlertTriangle, FileText, Calendar, TrendingUp,
  Search, ChevronRight, ChevronDown, ExternalLink, Clock, Filter,
  MapPin, Scale, Landmark, Building2, ArrowUpRight, Info, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Eye
} from 'lucide-react';

// ━━━━ Types ━━━━

interface CountryPolicy {
  code: string;
  name: string;
  flag: string;
  region: string;
  status: string;
  lastUpdate: string;
  summary: string;
  exchanges: string[];
  keyDocs: string[];
  cbdc: string | null;
  regulatoryBody: string;
  taxRegime: string;
  licensingRequired: boolean;
  events: PolicyEvent[];
  upcomingPolicies: UpcomingPolicy[];
}

interface PolicyEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  impactScore: number;
  source: string;
}

interface UpcomingPolicy {
  id: string;
  country: string;
  countryCode: string;
  title: string;
  expectedDate: string;
  status: string;
  description: string;
  impactLevel: string;
}

interface PolicyStats {
  totalCountries: number;
  regulated: number;
  evolving: number;
  cautious: number;
  restricted: number;
  unregulated: number;
  waemu: number;
  totalEvents: number;
  recentEvents: number;
  upcomingPolicies: number;
  newReleasesThisMonth: number;
}

type Tab = 'overview' | 'current' | 'upcoming' | 'new-releases' | 'country-detail';

// ━━━━ Helpers ━━━━

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Regulated': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Evolving': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Cautious': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Restricted': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Unregulated': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  'WAEMU Rules': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Banned': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-700' },
};

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'new_regulation': { label: 'New Regulation', color: 'bg-green-100 text-green-800', icon: <Scale className="w-4 h-4" /> },
  'amendment': { label: 'Amendment', color: 'bg-blue-100 text-blue-800', icon: <FileText className="w-4 h-4" /> },
  'announcement': { label: 'Announcement', color: 'bg-purple-100 text-purple-800', icon: <Info className="w-4 h-4" /> },
  'enforcement': { label: 'Enforcement', color: 'bg-red-100 text-red-800', icon: <Shield className="w-4 h-4" /> },
  'consultation': { label: 'Consultation', color: 'bg-yellow-100 text-yellow-800', icon: <Eye className="w-4 h-4" /> },
  'cbdc_update': { label: 'CBDC Update', color: 'bg-cyan-100 text-cyan-800', icon: <Landmark className="w-4 h-4" /> },
};

const IMPACT_COLORS: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-700',
  'medium': 'bg-yellow-100 text-yellow-700',
  'high': 'bg-orange-100 text-orange-700',
  'critical': 'bg-red-100 text-red-700',
};

const UPCOMING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'proposed': { label: 'Proposed', color: 'bg-gray-100 text-gray-700' },
  'draft': { label: 'Draft', color: 'bg-blue-100 text-blue-700' },
  'consultation': { label: 'Public Consultation', color: 'bg-yellow-100 text-yellow-700' },
  'pending_approval': { label: 'Pending Approval', color: 'bg-orange-100 text-orange-700' },
  'scheduled': { label: 'Scheduled', color: 'bg-green-100 text-green-700' },
};

function formatDate(dateStr: string): string {
  if (dateStr.includes('Q')) return dateStr; // e.g. "2026-Q2"
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

// ━━━━ Dashboard Component ━━━━

export default function CryptoPoliciesDashboard() {
  const [data, setData] = useState<{
    stats: PolicyStats;
    countries: CountryPolicy[];
    newReleases: PolicyEvent[];
    source: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedCountry, setSelectedCountry] = useState<CountryPolicy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/crypto-policies');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load policy data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCountryDetail = (country: CountryPolicy) => {
    setSelectedCountry(country);
    setActiveTab('country-detail');
  };

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (!data) return [];
    return data.countries.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesRegion = regionFilter === 'all' || c.region === regionFilter;
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [data, searchQuery, statusFilter, regionFilter]);

  // All upcoming policies across countries
  const allUpcoming = useMemo(() => {
    if (!data) return [];
    return data.countries
      .flatMap(c => c.upcomingPolicies)
      .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  }, [data]);

  // Unique regions for filter
  const regions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.countries.map(c => c.region))].sort();
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>Failed to load policy data. Please try again.</p>
        <button onClick={handleRefresh} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Retry
        </button>
      </div>
    );
  }

  const { stats, newReleases } = data;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Globe className="w-4 h-4" /> },
    { id: 'current', label: 'Current Policies', icon: <Shield className="w-4 h-4" />, count: stats.totalCountries },
    { id: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" />, count: stats.upcomingPolicies },
    { id: 'new-releases', label: 'New Releases', icon: <TrendingUp className="w-4 h-4" />, count: newReleases.length },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-purple-600" />
            Africa Crypto Policies & Regulations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor crypto regulations across {stats.totalCountries} African countries
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
              Source: {data.source}
            </span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedCountry(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} countries={data.countries} newReleases={newReleases} onViewCountry={openCountryDetail} />}
      {activeTab === 'current' && (
        <CurrentPoliciesTab
          countries={filteredCountries}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          regions={regions}
          onViewCountry={openCountryDetail}
        />
      )}
      {activeTab === 'upcoming' && <UpcomingTab upcoming={allUpcoming} countries={data.countries} onViewCountry={openCountryDetail} />}
      {activeTab === 'new-releases' && <NewReleasesTab releases={newReleases} />}
      {activeTab === 'country-detail' && selectedCountry && (
        <CountryDetailTab country={selectedCountry} onBack={() => setActiveTab('current')} />
      )}
    </div>
  );
}

// ━━━━ Overview Tab ━━━━

function OverviewTab({
  stats, countries, newReleases, onViewCountry,
}: {
  stats: PolicyStats;
  countries: CountryPolicy[];
  newReleases: PolicyEvent[];
  onViewCountry: (c: CountryPolicy) => void;
}) {
  const statCards = [
    { label: 'Countries Tracked', value: stats.totalCountries, icon: <Globe className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700', iconBg: 'bg-purple-100' },
    { label: 'Fully Regulated', value: stats.regulated, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-green-50 text-green-700', iconBg: 'bg-green-100' },
    { label: 'Evolving / Cautious', value: stats.evolving + stats.cautious, icon: <AlertCircle className="w-5 h-5" />, color: 'bg-yellow-50 text-yellow-700', iconBg: 'bg-yellow-100' },
    { label: 'Restricted / Unregulated', value: stats.restricted + stats.unregulated, icon: <XCircle className="w-5 h-5" />, color: 'bg-red-50 text-red-700', iconBg: 'bg-red-100' },
    { label: 'Upcoming Policies', value: stats.upcomingPolicies, icon: <Clock className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700', iconBg: 'bg-blue-100' },
    { label: 'Recent Events (30d)', value: stats.recentEvents, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-700', iconBg: 'bg-indigo-100' },
    { label: 'New This Month', value: stats.newReleasesThisMonth, icon: <FileText className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-700', iconBg: 'bg-cyan-100' },
    { label: 'WAEMU Zone', value: stats.waemu, icon: <Landmark className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700', iconBg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.color} rounded-xl p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`${card.iconBg} p-2 rounded-lg`}>{card.icon}</div>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm opacity-75">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regulation Status Map */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Regulation Status by Country
          </h3>
          <div className="space-y-2">
            {countries.sort((a, b) => a.name.localeCompare(b.name)).map(country => {
              const colors = STATUS_COLORS[country.status] || STATUS_COLORS['Unregulated'];
              return (
                <button
                  key={country.code}
                  onClick={() => onViewCountry(country)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium text-gray-900">{country.name}</span>
                    <span className="text-xs text-gray-400">{country.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {country.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Policy Events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Latest Policy Events
          </h3>
          <div className="space-y-3">
            {newReleases.slice(0, 7).map(event => {
              const typeInfo = EVENT_TYPE_LABELS[event.type] || EVENT_TYPE_LABELS['announcement'];
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{event.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{event.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                      <span className="text-xs text-gray-400">Impact: {event.impactScore}/10</span>
                      <span className="text-xs text-purple-600">{event.source}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Policies Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Upcoming Policy Changes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.flatMap(c => c.upcomingPolicies).slice(0, 6).map(policy => {
            const impactColor = IMPACT_COLORS[policy.impactLevel] || IMPACT_COLORS['medium'];
            const statusInfo = UPCOMING_STATUS_LABELS[policy.status] || UPCOMING_STATUS_LABELS['proposed'];
            const country = countries.find(c => c.code === policy.countryCode);
            return (
              <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{country?.flag}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColor}`}>
                    {policy.impactLevel}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{policy.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{policy.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {policy.expectedDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━ Current Policies Tab ━━━━

function CurrentPoliciesTab({
  countries, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  regionFilter, setRegionFilter, regions, onViewCountry,
}: {
  countries: CountryPolicy[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  regionFilter: string;
  setRegionFilter: (r: string) => void;
  regions: string[];
  onViewCountry: (c: CountryPolicy) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search countries, policies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Statuses</option>
          <option value="Regulated">Regulated</option>
          <option value="Evolving">Evolving</option>
          <option value="Cautious">Cautious</option>
          <option value="Restricted">Restricted</option>
          <option value="Unregulated">Unregulated</option>
          <option value="WAEMU Rules">WAEMU Rules</option>
        </select>
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Regions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="text-sm text-gray-500">{countries.length} countries</span>
      </div>

      {/* Country Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countries.map(country => {
          const colors = STATUS_COLORS[country.status] || STATUS_COLORS['Unregulated'];
          return (
            <div
              key={country.code}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onViewCountry(country)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flag}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{country.name}</h3>
                    <p className="text-xs text-gray-500">{country.region} &bull; {country.code}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                  {country.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{country.summary}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Regulatory Body</span>
                  <span className="font-medium text-gray-900">{country.regulatoryBody}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Tax Regime</span>
                  <span className="font-medium text-gray-900">{country.taxRegime}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Licensing Required</span>
                  <span className={`font-medium ${country.licensingRequired ? 'text-green-700' : 'text-gray-500'}`}>
                    {country.licensingRequired ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">CBDC</span>
                  <span className="font-medium text-gray-900">{country.cbdc || 'None'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Updated {daysAgo(country.lastUpdate)}
                  </span>
                  <span>{country.events.length} events</span>
                  <span>{country.upcomingPolicies.length} upcoming</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          );
        })}
      </div>

      {countries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No countries match your filters</p>
        </div>
      )}
    </div>
  );
}

// ━━━━ Upcoming Tab ━━━━

function UpcomingTab({
  upcoming, countries, onViewCountry,
}: {
  upcoming: UpcomingPolicy[];
  countries: CountryPolicy[];
  onViewCountry: (c: CountryPolicy) => void;
}) {
  const grouped = useMemo(() => {
    const groups: Record<string, UpcomingPolicy[]> = {};
    for (const p of upcoming) {
      const key = p.impactLevel;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [upcoming]);

  const order = ['critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-800 font-semibold mb-1">
          <Clock className="w-5 h-5" />
          {upcoming.length} Upcoming Policy Changes
        </div>
        <p className="text-sm text-purple-700">
          Policies that are proposed, in draft, under public consultation, or pending approval across covered countries.
        </p>
      </div>

      {order.map(level => {
        const policies = grouped[level];
        if (!policies || policies.length === 0) return null;
        const impactColor = IMPACT_COLORS[level] || IMPACT_COLORS['medium'];
        return (
          <div key={level}>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 capitalize">
              <span className={`w-3 h-3 rounded-full ${
                level === 'critical' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></span>
              {level} Impact ({policies.length})
            </h3>
            <div className="space-y-3">
              {policies.map(policy => {
                const statusInfo = UPCOMING_STATUS_LABELS[policy.status] || UPCOMING_STATUS_LABELS['proposed'];
                const country = countries.find(c => c.code === policy.countryCode);
                return (
                  <div key={policy.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{country?.flag}</span>
                        <button
                          onClick={() => country && onViewCountry(country)}
                          className="text-sm font-medium text-purple-700 hover:text-purple-900"
                        >
                          {policy.country}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColor}`}>
                          {level}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{policy.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Expected: {policy.expectedDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {upcoming.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No upcoming policy changes tracked</p>
        </div>
      )}
    </div>
  );
}

// ━━━━ New Releases Tab ━━━━

function NewReleasesTab({ releases }: { releases: PolicyEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
          <TrendingUp className="w-5 h-5" />
          {releases.length} New Policy Releases
        </div>
        <p className="text-sm text-green-700">
          Recently enacted, announced, or enforced crypto policies and regulations across Africa.
        </p>
      </div>

      <div className="space-y-3">
        {releases.map(event => {
          const typeInfo = EVENT_TYPE_LABELS[event.type] || EVENT_TYPE_LABELS['announcement'];
          return (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${typeInfo.color} flex-shrink-0`}>
                  {typeInfo.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-1 ml-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < event.impactScore
                              ? event.impactScore >= 8 ? 'bg-red-500' : event.impactScore >= 6 ? 'bg-orange-500' : 'bg-yellow-500'
                              : 'bg-gray-200'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="text-gray-400">{formatDate(event.date)} ({daysAgo(event.date)})</span>
                    <span className="text-purple-600 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      {event.source}
                    </span>
                    <span className="text-gray-400">Impact: {event.impactScore}/10</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ━━━━ Country Detail Tab ━━━━

function CountryDetailTab({ country, onBack }: { country: CountryPolicy; onBack: () => void }) {
  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const colors = STATUS_COLORS[country.status] || STATUS_COLORS['Unregulated'];

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
          ← Back to Countries
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{country.flag}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{country.name}</h2>
              <p className="text-sm text-gray-500">{country.region} &bull; {country.code}</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
                {country.status}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>Last Updated</p>
            <p className="font-medium text-gray-900">{formatDate(country.lastUpdate)}</p>
          </div>
        </div>
        <p className="mt-4 text-gray-700">{country.summary}</p>
      </div>

      {/* Quick Facts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs">Regulatory Body</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{country.regulatoryBody}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-xs">Tax Regime</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{country.taxRegime}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Licensing</span>
          </div>
          <p className={`font-semibold text-sm ${country.licensingRequired ? 'text-green-700' : 'text-gray-500'}`}>
            {country.licensingRequired ? 'Required' : 'Not Required'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Landmark className="w-4 h-4" />
            <span className="text-xs">CBDC Status</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{country.cbdc || 'None'}</p>
        </div>
      </div>

      {/* Exchanges */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Active Exchanges
        </h3>
        <div className="flex flex-wrap gap-2">
          {country.exchanges.map(ex => (
            <span key={ex} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
              {ex}
            </span>
          ))}
        </div>
      </div>

      {/* Key Documents */}
      {country.keyDocs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Key Regulatory Documents
          </h3>
          <div className="space-y-2">
            {country.keyDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Events Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Policy Events Timeline ({country.events.length})
        </h3>
        {country.events.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              {country.events.map(event => {
                const typeInfo = EVENT_TYPE_LABELS[event.type] || EVENT_TYPE_LABELS['announcement'];
                return (
                  <div key={event.id} className="relative pl-10">
                    <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                      <div className="w-2.5 h-2.5 rounded-full bg-current"></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.color} flex-shrink-0 ml-2`}>{typeInfo.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatDate(event.date)}</span>
                        <span>Impact: {event.impactScore}/10</span>
                        <span className="text-purple-600">{event.source}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No policy events recorded for this country</p>
        )}
      </div>

      {/* Upcoming Policies */}
      {country.upcomingPolicies.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Upcoming Policies ({country.upcomingPolicies.length})
          </h3>
          <div className="space-y-3">
            {country.upcomingPolicies.map(policy => {
              const impactColor = IMPACT_COLORS[policy.impactLevel] || IMPACT_COLORS['medium'];
              const statusInfo = UPCOMING_STATUS_LABELS[policy.status] || UPCOMING_STATUS_LABELS['proposed'];
              return (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColor}`}>
                      {policy.impactLevel} impact
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{policy.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Expected: {policy.expectedDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
