/**
 * Content Strategy Dashboard - Task 76
 * Super Admin interface for strategic content management
 */

import React, { useState, useEffect } from 'react';

interface StrategyStats {
  keywords: {
    total: number;
    active: number;
    byRegion: Array<{ region: string; _count: number }>;
    byPriority: Array<{ priority: string; _count: number }>;
  };
  topicClusters: {
    total: number;
    active: number;
  };
  contentCalendar: {
    planned: number;
    published: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  competitors: {
    tracked: number;
    byThreat: Array<{ threatLevel: string; _count: number }>;
  };
  trends: {
    active: number;
    byVelocity: Array<{ velocity: string; _count: number }>;
    actioned: number;
  };
}

export const ContentStrategyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'calendar' | 'competitors' | 'trends'>('overview');
  const [stats, setStats] = useState<StrategyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keyword Research State
  const [seedKeywords, setSeedKeywords] = useState('');
  const [keywordRegion, setKeywordRegion] = useState('GLOBAL');
  const [keywordCategory, setKeywordCategory] = useState('CRYPTO');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [researchingKeywords, setResearchingKeywords] = useState(false);

  // Content Calendar State
  const [calendarDuration, setCalendarDuration] = useState(90);
  const [calendarRegion, setCalendarRegion] = useState('GLOBAL');
  const [calendarCategory, setCalendarCategory] = useState('CRYPTO');
  const [articlesPerWeek, setArticlesPerWeek] = useState(5);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);

  // Competitor Analysis State
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [competitorRegion, setCompetitorRegion] = useState('GLOBAL');
  const [competitorCategory, setCompetitorCategory] = useState('NEWS');
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState(false);

  // Trend Monitoring State
  const [trendRegion, setTrendRegion] = useState('GLOBAL');
  const [trendCategory, setTrendCategory] = useState('CRYPTO');
  const [trends, setTrends] = useState<any[]>([]);
  const [monitoringTrends, setMonitoringTrends] = useState(false);

  // Topic Cluster State
  const [pillarTopic, setPillarTopic] = useState('');
  const [clusterKeywords, setClusterKeywords] = useState('');
  const [clusters, setClusters] = useState<any[]>([]);
  const [creatingCluster, setCreatingCluster] = useState(false);

  // Fetch statistics
  useEffect(() => {
    fetchStatistics();
    const interval = setInterval(fetchStatistics, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/content-strategy/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Keyword Research
  const handleKeywordResearch = async () => {
    if (!seedKeywords.trim()) {
      alert('Please enter seed keywords');
      return;
    }

    setResearchingKeywords(true);
    setError(null);

    try {
      const response = await fetch('/api/content-strategy/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedKeywords: seedKeywords.split(',').map(k => k.trim()),
          region: keywordRegion,
          category: keywordCategory,
          includeGlobal: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setKeywords(data.keywords);
        alert(`✅ Researched ${data.count} keywords in ${(data.processingTime / 1000).toFixed(1)}s`);
        fetchStatistics();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResearchingKeywords(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const response = await fetch(`/api/content-strategy/keywords?region=${keywordRegion}&category=${keywordCategory}&limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setKeywords(data.keywords);
      }
    } catch (err: any) {
      console.error('Failed to fetch keywords:', err);
    }
  };

  // Content Calendar Generation
  const handleGenerateCalendar = async () => {
    setGeneratingCalendar(true);
    setError(null);

    try {
      const response = await fetch('/api/content-strategy/calendar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: calendarDuration,
          region: calendarRegion,
          category: calendarCategory,
          articlesPerWeek,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCalendarItems(data.items);
        alert(`✅ Generated ${data.count} calendar items for ${data.duration} days (${data.articlesPerWeek} articles/week)`);
        fetchStatistics();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const fetchCalendar = async () => {
    try {
      const response = await fetch(`/api/content-strategy/calendar?region=${calendarRegion}&category=${calendarCategory}`);
      const data = await response.json();
      
      if (data.success) {
        setCalendarItems(data.items);
      }
    } catch (err: any) {
      console.error('Failed to fetch calendar:', err);
    }
  };

  // Competitor Analysis
  const handleAnalyzeCompetitor = async () => {
    if (!competitorDomain.trim()) {
      alert('Please enter competitor domain');
      return;
    }

    setAnalyzingCompetitor(true);
    setError(null);

    try {
      const response = await fetch('/api/content-strategy/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: competitorDomain,
          region: competitorRegion,
          category: competitorCategory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Analyzed ${competitorDomain} in ${(data.processingTime / 1000).toFixed(1)}s`);
        fetchCompetitorGaps();
        fetchStatistics();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzingCompetitor(false);
    }
  };

  const fetchCompetitorGaps = async () => {
    try {
      const response = await fetch('/api/content-strategy/competitors/gaps');
      const data = await response.json();
      
      if (data.success) {
        setCompetitors(data.allCompetitors || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch competitor gaps:', err);
    }
  };

  // Trend Monitoring
  const handleMonitorTrends = async () => {
    setMonitoringTrends(true);
    setError(null);

    try {
      const response = await fetch('/api/content-strategy/trends/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: trendRegion,
          category: trendCategory,
          sources: ['AI_DETECTION'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTrends(data.trends);
        alert(`✅ Identified ${data.count} viral trends in ${(data.processingTime / 1000).toFixed(1)}s`);
        fetchStatistics();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMonitoringTrends(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await fetch(`/api/content-strategy/trends?region=${trendRegion}&category=${trendCategory}`);
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.trends);
      }
    } catch (err: any) {
      console.error('Failed to fetch trends:', err);
    }
  };

  // Topic Cluster Creation
  const handleCreateCluster = async () => {
    if (!pillarTopic.trim() || !clusterKeywords.trim()) {
      alert('Please enter pillar topic and keywords');
      return;
    }

    setCreatingCluster(true);
    setError(null);

    try {
      const response = await fetch('/api/content-strategy/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillarTopic,
          region: keywordRegion,
          category: keywordCategory,
          keywords: clusterKeywords.split(',').map(k => k.trim()),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Created topic cluster: ${pillarTopic}`);
        fetchClusters();
        fetchStatistics();
        setPillarTopic('');
        setClusterKeywords('');
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingCluster(false);
    }
  };

  const fetchClusters = async () => {
    try {
      const response = await fetch(`/api/content-strategy/clusters?region=${keywordRegion}&category=${keywordCategory}`);
      const data = await response.json();
      
      if (data.success) {
        setClusters(data.clusters);
      }
    } catch (err: any) {
      console.error('Failed to fetch clusters:', err);
    }
  };

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'keywords') fetchKeywords();
    if (activeTab === 'calendar') fetchCalendar();
    if (activeTab === 'competitors') fetchCompetitorGaps();
    if (activeTab === 'trends') fetchTrends();
  }, [activeTab, keywordRegion, keywordCategory, calendarRegion, calendarCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading strategy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Content Strategy Dashboard
        </h1>
        <p className="text-gray-600">
          Strategic content planning for African + Global crypto markets
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">❌ {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📈' },
            { id: 'keywords', label: 'Keyword Research', icon: '🔍' },
            { id: 'calendar', label: 'Content Calendar', icon: '📅' },
            { id: 'competitors', label: 'Competitors', icon: '🎯' },
            { id: 'trends', label: 'Viral Trends', icon: '🔥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Keywords Card */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🔍 Keywords</h3>
                  <span className="text-2xl font-bold text-blue-600">{stats.keywords.active}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Active: {stats.keywords.active} / {stats.keywords.total}</p>
                <div className="text-xs text-gray-500">
                  {stats.keywords.byPriority.map((p: any) => (
                    <div key={p.priority}>{p.priority}: {p._count}</div>
                  ))}
                </div>
              </div>

              {/* Topic Clusters Card */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📚 Topic Clusters</h3>
                  <span className="text-2xl font-bold text-purple-600">{stats.topicClusters.active}</span>
                </div>
                <p className="text-sm text-gray-600">Active: {stats.topicClusters.active} / {stats.topicClusters.total}</p>
              </div>

              {/* Content Calendar Card */}
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📅 Content Calendar</h3>
                  <span className="text-2xl font-bold text-green-600">{stats.contentCalendar.planned}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Planned: {stats.contentCalendar.planned}</p>
                <p className="text-sm text-gray-600">Published: {stats.contentCalendar.published}</p>
              </div>

              {/* Competitors Card */}
              <div className="bg-red-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Competitors</h3>
                  <span className="text-2xl font-bold text-red-600">{stats.competitors.tracked}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {stats.competitors.byThreat.map((t: any) => (
                    <div key={t.threatLevel}>{t.threatLevel}: {t._count}</div>
                  ))}
                </div>
              </div>

              {/* Trends Card */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🔥 Viral Trends</h3>
                  <span className="text-2xl font-bold text-orange-600">{stats.trends.active}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Active: {stats.trends.active}</p>
                <p className="text-sm text-gray-600">Actioned: {stats.trends.actioned}</p>
              </div>

              {/* Regional Distribution */}
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Regional Distribution</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  {stats.keywords.byRegion.map((r: any) => (
                    <div key={r.region} className="flex justify-between">
                      <span>{r.region}</span>
                      <span className="font-semibold">{r._count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('keywords')}
                  className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Research Keywords
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Generate Calendar
                </button>
                <button
                  onClick={() => setActiveTab('competitors')}
                  className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Analyze Competitor
                </button>
                <button
                  onClick={() => setActiveTab('trends')}
                  className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Monitor Trends
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">🔍 Keyword Research</h2>
            
            {/* Research Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={keywordRegion}
                    onChange={(e) => setKeywordRegion(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="NIGERIA">Nigeria</option>
                    <option value="KENYA">Kenya</option>
                    <option value="SOUTH_AFRICA">South Africa</option>
                    <option value="GHANA">Ghana</option>
                    <option value="ETHIOPIA">Ethiopia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={keywordCategory}
                    onChange={(e) => setKeywordCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="CRYPTO">Cryptocurrency</option>
                    <option value="BLOCKCHAIN">Blockchain</option>
                    <option value="DEFI">DeFi</option>
                    <option value="MEMECOINS">Memecoins</option>
                    <option value="BITCOIN">Bitcoin</option>
                    <option value="ETHEREUM">Ethereum</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seed Keywords (comma-separated)
                </label>
                <textarea
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                  placeholder="e.g., bitcoin price, crypto news nigeria, ethereum trading"
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                />
              </div>

              <button
                onClick={handleKeywordResearch}
                disabled={researchingKeywords}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {researchingKeywords ? '🔄 Researching...' : '🚀 Research Keywords'}
              </button>
            </div>

            {/* Topic Cluster Creation */}
            <div className="bg-purple-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">📚 Create Topic Cluster</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={pillarTopic}
                  onChange={(e) => setPillarTopic(e.target.value)}
                  placeholder="Pillar topic (e.g., Bitcoin Trading)"
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  value={clusterKeywords}
                  onChange={(e) => setClusterKeywords(e.target.value)}
                  placeholder="Keywords (comma-separated)"
                  className="p-2 border rounded"
                />
              </div>
              <button
                onClick={handleCreateCluster}
                disabled={creatingCluster}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {creatingCluster ? 'Creating...' : 'Create Cluster'}
              </button>
            </div>

            {/* Keywords List */}
            {keywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">📋 Keywords ({keywords.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Keyword</th>
                        <th className="p-3 text-left">Region</th>
                        <th className="p-3 text-left">Priority</th>
                        <th className="p-3 text-left">Trend</th>
                        <th className="p-3 text-left">Volume</th>
                        <th className="p-3 text-left">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.slice(0, 50).map((kw) => (
                        <tr key={kw.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{kw.keyword}</td>
                          <td className="p-3">{kw.region}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              kw.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              kw.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              kw.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {kw.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              kw.trend === 'VIRAL' ? 'bg-purple-100 text-purple-800' :
                              kw.trend === 'RISING' ? 'bg-green-100 text-green-800' :
                              kw.trend === 'FALLING' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {kw.trend}
                            </span>
                          </td>
                          <td className="p-3">{kw.searchVolume.toLocaleString()}</td>
                          <td className="p-3">{kw.difficulty}/100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Clusters List */}
            {clusters.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">📚 Topic Clusters ({clusters.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clusters.map((cluster) => (
                    <div key={cluster.id} className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">{cluster.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{cluster.description}</p>
                      <div className="text-xs text-gray-500">
                        <div>Score: {cluster.clusterScore}/100</div>
                        <div>Content: {cluster.contentCount} items</div>
                        <div>Published: {cluster.publishedCount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">📅 90-Day Content Calendar</h2>
            
            {/* Generation Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    value={calendarDuration}
                    onChange={(e) => setCalendarDuration(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="30"
                    max="180"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Articles/Week</label>
                  <input
                    type="number"
                    value={articlesPerWeek}
                    onChange={(e) => setArticlesPerWeek(parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    min="1"
                    max="14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={calendarRegion}
                    onChange={(e) => setCalendarRegion(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="NIGERIA">Nigeria</option>
                    <option value="KENYA">Kenya</option>
                    <option value="SOUTH_AFRICA">South Africa</option>
                    <option value="GHANA">Ghana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={calendarCategory}
                    onChange={(e) => setCalendarCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="CRYPTO">Cryptocurrency</option>
                    <option value="BLOCKCHAIN">Blockchain</option>
                    <option value="DEFI">DeFi</option>
                    <option value="MEMECOINS">Memecoins</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateCalendar}
                disabled={generatingCalendar}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {generatingCalendar ? '⏳ Generating Calendar...' : '🚀 Generate 90-Day Calendar'}
              </button>
            </div>

            {/* Calendar Items */}
            {calendarItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">📋 Scheduled Content ({calendarItems.length} items)</h3>
                <div className="space-y-4">
                  {calendarItems.slice(0, 30).map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          item.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        📅 {new Date(item.scheduledDate).toLocaleDateString()} | 
                        📝 {item.wordCount} words ({item.estimatedReadTime} min read) |
                        🎯 {item.priority}
                      </p>
                      <div className="text-xs text-gray-500">
                        Region: {item.region} | Category: {item.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">🎯 Competitor Analysis</h2>
            
            {/* Analysis Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  placeholder="Competitor domain (e.g., competitor.com)"
                  className="p-2 border rounded"
                />
                <select
                  value={competitorRegion}
                  onChange={(e) => setCompetitorRegion(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="GLOBAL">Global</option>
                  <option value="NIGERIA">Nigeria</option>
                  <option value="KENYA">Kenya</option>
                  <option value="SOUTH_AFRICA">South Africa</option>
                </select>
                <select
                  value={competitorCategory}
                  onChange={(e) => setCompetitorCategory(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="NEWS">News</option>
                  <option value="ANALYSIS">Analysis</option>
                  <option value="EXCHANGE">Exchange</option>
                  <option value="INFLUENCER">Influencer</option>
                </select>
              </div>

              <button
                onClick={handleAnalyzeCompetitor}
                disabled={analyzingCompetitor}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {analyzingCompetitor ? '🔍 Analyzing...' : '🚀 Analyze Competitor'}
              </button>
            </div>

            {/* Competitors List */}
            {competitors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">📊 Tracked Competitors ({competitors.length})</h3>
                <div className="space-y-4">
                  {competitors.map((comp) => (
                    <div key={comp.id} className="bg-white border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-xl">{comp.competitorName}</h4>
                          <p className="text-gray-600">{comp.domain}</p>
                        </div>
                        <span className={`px-3 py-1 rounded ${
                          comp.threatLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          comp.threatLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          comp.threatLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {comp.threatLevel} THREAT
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-xs text-gray-600">Domain Authority</div>
                          <div className="text-2xl font-bold text-blue-600">{comp.domainAuthority}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-xs text-gray-600">Monthly Traffic</div>
                          <div className="text-2xl font-bold text-green-600">
                            {(comp.monthlyTraffic / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="text-xs text-gray-600">Backlinks</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {(comp.backlinks / 1000).toFixed(1)}K
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <div className="text-xs text-gray-600">Org. Keywords</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {(comp.organicKeywords / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p><strong>SWOT:</strong> {comp.swotAnalysis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">🔥 Viral Trend Monitoring</h2>
            
            {/* Monitoring Form */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select
                  value={trendRegion}
                  onChange={(e) => setTrendRegion(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="GLOBAL">Global</option>
                  <option value="NIGERIA">Nigeria</option>
                  <option value="KENYA">Kenya</option>
                  <option value="SOUTH_AFRICA">South Africa</option>
                </select>
                <select
                  value={trendCategory}
                  onChange={(e) => setTrendCategory(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="CRYPTO">Cryptocurrency</option>
                  <option value="BLOCKCHAIN">Blockchain</option>
                  <option value="DEFI">DeFi</option>
                  <option value="MEMECOINS">Memecoins</option>
                </select>
              </div>

              <button
                onClick={handleMonitorTrends}
                disabled={monitoringTrends}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
              >
                {monitoringTrends ? '🔍 Detecting Trends...' : '🚀 Monitor Viral Trends'}
              </button>
            </div>

            {/* Trends List */}
            {trends.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">🔥 Active Trends ({trends.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trends.map((trend) => (
                    <div key={trend.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{trend.trendName}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trend.velocity === 'EXPLODING' ? 'bg-red-100 text-red-800' :
                          trend.velocity === 'RISING' ? 'bg-orange-100 text-orange-800' :
                          trend.velocity === 'STABLE' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trend.velocity}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Type:</span> {trend.trendType} |
                        <span className="font-medium ml-2">Score:</span> {trend.trendScore}/100
                      </div>

                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <div className="text-xs text-gray-500 mb-1">Content Opportunities:</div>
                        <div className="text-sm">
                          {trend.contentOpportunity && JSON.parse(trend.contentOpportunity).slice(0, 3).map((opp: string, idx: number) => (
                            <div key={idx}>• {opp}</div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Search: {trend.searchVolume.toLocaleString()}</span>
                        <span>Expires: {new Date(trend.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentStrategyDashboard;
