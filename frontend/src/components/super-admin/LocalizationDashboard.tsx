/**
 * Localization Management Dashboard - Task 65
 * Super Admin interface for African localization system
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  TrendingUp,
  Code,
  Map,
  BarChart3,
  Languages,
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Target,
  Megaphone
} from 'lucide-react';

interface Region {
  countryCode: string;
  countryName: string;
  region: string;
  subdomain: string;
  primaryLanguage: string;
  supportedLanguages: string[];
  currency: string;
  timezone: string;
  isActive: boolean;
}

interface Influencer {
  id: string;
  name: string;
  platform: string;
  profileUrl: string;
  countryCode?: string;
  followersCount: number;
  engagementRate: number;
  partnershipStatus: string;
  partnershipType?: string;
}

interface AfricanIndex {
  id: string;
  name: string;
  symbol: string;
  region?: string;
  currentValue: number;
  changePercent24h: number;
  isActive: boolean;
  isPublished: boolean;
}

interface Widget {
  id: string;
  name: string;
  widgetType: string;
  targetCountries: string[];
  embedCode: string;
  apiKey: string;
  status: string;
  totalRequests: number;
}

interface LocalizationStats {
  totalLocalizations: number;
  byCountry: Record<string, number>;
  byLanguage: Record<string, number>;
  byStatus: Record<string, number>;
  averageQualityScore: number;
  influencers: {
    total: number;
    active: number;
    byRegion: Record<string, number>;
  };
  indexes: {
    total: number;
    active: number;
  };
  widgets: {
    total: number;
    active: number;
    totalRequests: number;
  };
}

export default function LocalizationDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'regions' | 'influencers' | 'indexes' | 'widgets'>('overview');
  const [stats, setStats] = useState<LocalizationStats | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [indexes, setIndexes] = useState<AfricanIndex[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [statsRes, regionsRes, influencersRes, indexesRes] = await Promise.all([
        fetch('/api/localization/stats'),
        fetch('/api/localization/regions'),
        fetch('/api/localization/influencers'),
        fetch('/api/localization/indexes')
      ]);

      const [statsData, regionsData, influencersData, indexesData] = await Promise.all([
        statsRes.json(),
        regionsRes.json(),
        influencersRes.json(),
        indexesRes.json()
      ]);

      setStats(statsData.data);
      setRegions(regionsData.data);
      setInfluencers(influencersData.data);
      setIndexes(indexesData.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeRegions = async () => {
    try {
      const response = await fetch('/api/localization/regions/initialize', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`Initialized ${data.data.length} regions successfully`);
        loadData();
      }
    } catch (error) {
      console.error('Failed to initialize regions:', error);
      alert('Failed to initialize regions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  African Localization Management
                </h1>
                <p className="text-sm text-gray-500">
                  Global expansion and regional dominance system
                </p>
              </div>
            </div>

            <button
              onClick={initializeRegions}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Initialize Regions</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'regions', label: 'Regions', icon: Map },
              { id: 'influencers', label: 'Influencers', icon: Users },
              { id: 'indexes', label: 'Indexes', icon: TrendingUp },
              { id: 'widgets', label: 'Widgets', icon: Code }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && stats && (
          <OverviewTab stats={stats} />
        )}

        {activeTab === 'regions' && (
          <RegionsTab
            regions={regions}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {activeTab === 'influencers' && (
          <InfluencersTab
            influencers={influencers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCountry={filterCountry}
            setFilterCountry={setFilterCountry}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}

        {activeTab === 'indexes' && (
          <IndexesTab indexes={indexes} />
        )}

        {activeTab === 'widgets' && (
          <WidgetsTab widgets={widgets} />
        )}
      </main>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({ stats }: { stats: LocalizationStats }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Localizations"
          value={stats.totalLocalizations}
          icon={Languages}
          color="blue"
        />
        <MetricCard
          title="Active Influencers"
          value={stats.influencers.active}
          subtitle={`of ${stats.influencers.total} total`}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Active Indexes"
          value={stats.indexes.active}
          subtitle={`of ${stats.indexes.total} total`}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Widget Requests"
          value={stats.widgets.totalRequests}
          subtitle={`${stats.widgets.active} active widgets`}
          icon={Code}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Localizations by Country */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Localizations by Country
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byCountry)
              .sort(([, a], [, b]) => b - a)
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{country}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(stats.byCountry))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Localizations by Language */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Localizations by Language
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byLanguage)
              .sort(([, a], [, b]) => b - a)
              .map(([language, count]) => (
                <div key={language} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{language}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(stats.byLanguage))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quality Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Quality Score
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all"
                style={{ width: `${stats.averageQualityScore}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            {stats.averageQualityScore.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REGIONS TAB
// ============================================

function RegionsTab({
  regions,
  searchTerm,
  setSearchTerm
}: {
  regions: Region[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}) {
  const filteredRegions = regions.filter(region =>
    region.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.countryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    region.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search regions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegions.map(region => (
          <div
            key={region.countryCode}
            className="bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {region.countryName}
                </h3>
                <p className="text-sm text-gray-500">{region.region.replace('_', ' ')}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  region.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {region.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Code:</span>
                <span className="font-medium text-gray-900">{region.countryCode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subdomain:</span>
                <span className="font-medium text-blue-600">{region.subdomain}.coindaily.africa</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Currency:</span>
                <span className="font-medium text-gray-900">{region.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Languages:</span>
                <span className="font-medium text-gray-900">{region.supportedLanguages.length}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-1">
                {region.supportedLanguages.map(lang => (
                  <span
                    key={lang}
                    className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                Configure
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// INFLUENCERS TAB
// ============================================

function InfluencersTab({
  influencers,
  searchTerm,
  setSearchTerm,
  filterCountry,
  setFilterCountry,
  filterStatus,
  setFilterStatus
}: {
  influencers: Influencer[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCountry: string;
  setFilterCountry: (country: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}) {
  const filteredInfluencers = influencers.filter(influencer => {
    const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !filterCountry || influencer.countryCode === filterCountry;
    const matchesStatus = !filterStatus || influencer.partnershipStatus === filterStatus;
    return matchesSearch && matchesCountry && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search influencers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Countries</option>
          <option value="NG">Nigeria</option>
          <option value="KE">Kenya</option>
          <option value="ZA">South Africa</option>
          <option value="GH">Ghana</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PROSPECTIVE">Prospective</option>
          <option value="CONTACTED">Contacted</option>
          <option value="NEGOTIATING">Negotiating</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Influencers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Influencer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Followers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInfluencers.map(influencer => (
              <tr key={influencer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{influencer.name}</div>
                    <div className="text-sm text-gray-500">{influencer.countryCode || 'Global'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {influencer.platform}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {influencer.followersCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {influencer.engagementRate.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      influencer.partnershipStatus === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : influencer.partnershipStatus === 'NEGOTIATING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {influencer.partnershipStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// INDEXES TAB
// ============================================

function IndexesTab({ indexes }: { indexes: AfricanIndex[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indexes.map(index => (
          <div
            key={index.id}
            className="bg-white rounded-lg shadow p-6 border-2 border-transparent hover:border-blue-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{index.name}</h3>
                <p className="text-sm text-gray-500">{index.symbol}</p>
              </div>
              <div className="flex items-center space-x-2">
                {index.isPublished && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Published
                  </span>
                )}
                {index.isActive && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {index.currentValue.toFixed(2)}
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    index.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {index.changePercent24h >= 0 ? '+' : ''}
                  {index.changePercent24h.toFixed(2)}%
                </div>
              </div>

              {index.region && (
                <div className="text-sm text-gray-600">
                  Region: {index.region.replace('_', ' ')}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
                View Details
              </button>
              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// WIDGETS TAB
// ============================================

function WidgetsTab({ widgets }: { widgets: Widget[] }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Countries</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {widgets.map(widget => (
              <tr key={widget.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {widget.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {widget.widgetType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {widget.targetCountries.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {widget.totalRequests.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      widget.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {widget.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-800">View Code</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// METRIC CARD COMPONENT
// ============================================

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
