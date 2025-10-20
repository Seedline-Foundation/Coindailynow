/**
 * RAO Performance Tracking & Adaptation Loop Dashboard
 * Task 75: Super Admin RAO Performance Management
 */

'use client';

import React, { useState, useEffect } from 'react';

interface CitationSource {
  source: string;
  count: number;
}

interface PerformanceStats {
  timeframe: string;
  totalContent: number;
  totalCitations: number;
  totalOverviews: number;
  avgCitationsPerContent: number;
  avgOverviewsPerContent: number;
  avgSemanticRelevance: number;
  citationsBySource: CitationSource[];
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topPerformers: Array<{
    contentId: string;
    url: string;
    citations: number;
    overviews: number;
    semanticRelevance: number;
  }>;
}

interface RetrievalPattern {
  contentType: string;
  structureType: string;
  retrievalRate: number;
  avgPosition: number;
  topQueries: string[];
}

interface AuditResult {
  totalContent: number;
  citedContent: number;
  citationRate: number;
  aiOverviewRate: number;
  avgSemanticRelevance: number;
  topPerformers: Array<{
    contentId: string;
    title: string;
    citations: number;
    overviews: number;
    score: number;
  }>;
  recommendations: Array<{
    contentId: string;
    priority: string;
    type: string;
    description: string;
    expectedImpact: number;
    implementationCost: string;
    autoApplicable: boolean;
  }>;
}

export default function RAOPerformanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'audit' | 'content' | 'adaptations'>('overview');
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [patterns, setPatterns] = useState<RetrievalPattern[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [contentPerformance, setContentPerformance] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/rao-performance-proxy/statistics?timeframe=${timeframe}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch retrieval patterns
  const fetchPatterns = async () => {
    try {
      const response = await fetch(`/api/rao-performance-proxy/retrieval-patterns?timeframe=${timeframe}`);
      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (error) {
      console.error('Error fetching patterns:', error);
    }
  };

  // Run audit
  const runAudit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rao-performance-proxy/audit', {
        method: 'POST'
      });
      const data = await response.json();
      setAuditResult(data);
    } catch (error) {
      console.error('Error running audit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch content performance
  const fetchContentPerformance = async (contentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rao-performance-proxy/content/${contentId}`);
      const data = await response.json();
      setContentPerformance(data);
    } catch (error) {
      console.error('Error fetching content performance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply automatic adaptations
  const applyAdaptations = async () => {
    if (!auditResult?.recommendations) return;

    const autoApplicable = auditResult.recommendations.filter(r => r.autoApplicable);
    if (autoApplicable.length === 0) {
      alert('No auto-applicable recommendations found');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/rao-performance-proxy/apply-adaptations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendations: autoApplicable })
      });
      const data = await response.json();
      alert(`Applied ${data.applied} adaptations, ${data.failed} failed`);
      await runAudit(); // Refresh audit
    } catch (error) {
      console.error('Error applying adaptations:', error);
      alert('Failed to apply adaptations');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchStatistics();
    const interval = autoRefresh ? setInterval(fetchStatistics, 30000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeframe, autoRefresh]);

  useEffect(() => {
    if (activeTab === 'patterns') {
      fetchPatterns();
    }
  }, [activeTab, timeframe]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RAO Performance Tracking & Adaptation
          </h1>
          <p className="text-gray-600">
            Monitor AI citations, analyze retrieval patterns, and optimize for LLM discovery
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div className="flex gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
            </label>
          </div>

          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'patterns', label: 'Retrieval Patterns' },
                { id: 'audit', label: 'Monthly Audit' },
                { id: 'content', label: 'Content Analysis' },
                { id: 'adaptations', label: 'Auto-Adaptations' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalContent}</div>
                    <div className="text-sm text-gray-600">Total Content</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.totalCitations}</div>
                    <div className="text-sm text-gray-600">LLM Citations</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalOverviews}</div>
                    <div className="text-sm text-gray-600">AI Overview Appearances</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.avgSemanticRelevance.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Semantic Relevance</div>
                  </div>
                </div>

                {/* Average Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-xl font-semibold text-gray-800">
                      {stats.avgCitationsPerContent.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Citations per Content</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-xl font-semibold text-gray-800">
                      {stats.avgOverviewsPerContent.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Overviews per Content</div>
                  </div>
                </div>

                {/* Distribution */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Distribution</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.distribution.excellent}</div>
                      <div className="text-sm text-gray-600">Excellent</div>
                      <div className="text-xs text-gray-500">10+ citations or 5+ overviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.distribution.good}</div>
                      <div className="text-sm text-gray-600">Good</div>
                      <div className="text-xs text-gray-500">5-9 citations or 2-4 overviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{stats.distribution.fair}</div>
                      <div className="text-sm text-gray-600">Fair</div>
                      <div className="text-xs text-gray-500">1-4 citations or 1 overview</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.distribution.poor}</div>
                      <div className="text-sm text-gray-600">Poor</div>
                      <div className="text-xs text-gray-500">0 citations and 0 overviews</div>
                    </div>
                  </div>
                </div>

                {/* Citations by Source */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Citations by AI Source</h3>
                  <div className="space-y-2">
                    {stats.citationsBySource.slice(0, 10).map(source => (
                      <div key={source.source} className="flex justify-between items-center">
                        <span className="text-gray-700">{source.source}</span>
                        <span className="font-semibold text-gray-900">{source.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Content</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Content</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Citations</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Overviews</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Relevance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stats.topPerformers.map(perf => (
                          <tr key={perf.contentId} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-blue-600 hover:underline cursor-pointer truncate max-w-xs"
                                onClick={() => {
                                  setSelectedContent(perf.contentId);
                                  setActiveTab('content');
                                  fetchContentPerformance(perf.contentId);
                                }}>
                              {perf.url}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{perf.citations}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{perf.overviews}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{perf.semanticRelevance.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Patterns Tab */}
            {activeTab === 'patterns' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Retrieval Patterns Analysis</h3>
                  <button
                    onClick={fetchPatterns}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh Patterns
                  </button>
                </div>

                {patterns.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No retrieval patterns found for the selected timeframe
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {patterns.map((pattern, index) => (
                      <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">{pattern.contentType}</h4>
                            <p className="text-sm text-gray-600">Structure: {pattern.structureType}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">
                              {pattern.retrievalRate.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Retrieval Rate</div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">Avg Position: </span>
                          <span className="font-semibold text-gray-800">{pattern.avgPosition.toFixed(1)}</span>
                        </div>
                        {pattern.topQueries.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-600 mb-2">Top Queries:</div>
                            <div className="flex flex-wrap gap-2">
                              {pattern.topQueries.map((query, qIndex) => (
                                <span key={qIndex} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                                  {query}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Monthly RAO Audit</h3>
                  <button
                    onClick={runAudit}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Running Audit...' : 'Run Audit'}
                  </button>
                </div>

                {auditResult && (
                  <div className="space-y-6">
                    {/* Audit Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(auditResult.citationRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Citation Rate</div>
                        <div className="text-xs text-gray-500">{auditResult.citedContent}/{auditResult.totalContent} content</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(auditResult.aiOverviewRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">AI Overview Rate</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {auditResult.avgSemanticRelevance.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Semantic Relevance</div>
                      </div>
                    </div>

                    {/* Top Performers */}
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-4">Top Performers</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Citations</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Overviews</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {auditResult.topPerformers.map(perf => (
                              <tr key={perf.contentId} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{perf.title}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{perf.citations}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{perf.overviews}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{perf.score.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">
                          Adaptation Recommendations ({auditResult.recommendations.length})
                        </h4>
                        <button
                          onClick={applyAdaptations}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Apply Auto-Adaptations
                        </button>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {auditResult.recommendations.map((rec, index) => (
                          <div key={index} className="border border-gray-200 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  rec.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {rec.priority.toUpperCase()}
                                </span>
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {rec.type}
                                </span>
                                {rec.autoApplicable && (
                                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    AUTO
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  +{rec.expectedImpact}% impact
                                </div>
                                <div className="text-xs text-gray-500">{rec.implementationCost} cost</div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{rec.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!auditResult && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    Click "Run Audit" to start a comprehensive RAO performance audit
                  </div>
                )}
              </div>
            )}

            {/* Content Analysis Tab */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={selectedContent}
                    onChange={(e) => setSelectedContent(e.target.value)}
                    placeholder="Enter content ID..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => fetchContentPerformance(selectedContent)}
                    disabled={!selectedContent || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Analyze
                  </button>
                </div>

                {contentPerformance && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Content Details</h4>
                      <div className="text-sm text-gray-600">
                        <p><strong>ID:</strong> {contentPerformance.contentId}</p>
                        <p><strong>Type:</strong> {contentPerformance.contentType}</p>
                        <p><strong>URL:</strong> <a href={contentPerformance.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{contentPerformance.url}</a></p>
                        <p><strong>Last Tracked:</strong> {new Date(contentPerformance.lastTracked).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{contentPerformance.metrics.llmCitations}</div>
                        <div className="text-sm text-gray-600">LLM Citations</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{contentPerformance.metrics.aiOverviews}</div>
                        <div className="text-sm text-gray-600">AI Overviews</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(contentPerformance.metrics.semanticRelevance * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Semantic Relevance</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-800">{contentPerformance.metrics.contentStructure}</div>
                        <div className="text-xs text-gray-600">Structure</div>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-800">{contentPerformance.metrics.factualAccuracy}</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-800">{contentPerformance.metrics.sourceAuthority}</div>
                        <div className="text-xs text-gray-600">Authority</div>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-800">
                          {(contentPerformance.metrics.topicCoverage * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Coverage</div>
                      </div>
                    </div>

                    {contentPerformance.citationSources.length > 0 && (
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Citation Sources</h4>
                        <div className="space-y-2">
                          {contentPerformance.citationSources.map((source: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-gray-700">{source.source}</span>
                              <span className="font-semibold text-gray-900">{source.count} citations</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!contentPerformance && !loading && (
                  <div className="text-center py-12 text-gray-500">
                    Enter a content ID to analyze its RAO performance
                  </div>
                )}
              </div>
            )}

            {/* Adaptations Tab */}
            {activeTab === 'adaptations' && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Automatic Adaptation System</h3>
                  <p className="text-gray-600 mb-4">
                    The system can automatically apply approved optimizations to improve RAO performance.
                  </p>
                  <div className="space-y-3">
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800 mb-2">Supported Adaptations:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li><strong>Structure Optimization:</strong> Re-chunk content for better retrieval</li>
                        <li><strong>Metadata Enhancement:</strong> Improve LLM-friendly metadata</li>
                        <li><strong>Schema Regeneration:</strong> Update schema markup for better citations</li>
                        <li><strong>Semantic Analysis:</strong> Refresh semantic relevance scores</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-left">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Run a monthly audit to get personalized recommendations. 
                        The system will identify underperforming content and suggest specific improvements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
