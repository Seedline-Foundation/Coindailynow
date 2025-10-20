'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Search,
  Server,
  Shield,
  Smartphone,
  TrendingUp,
  Zap,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';

/**
 * Technical SEO Dashboard Component
 * Task 79: Technical SEO Audit & Implementation
 * Comprehensive technical SEO monitoring and management
 */

interface AuditScore {
  overall: number;
  speed: number;
  mobile: number;
  crawlability: number;
  security: number;
  indexability: number;
}

interface AuditIssues {
  critical: number;
  warning: number;
  info: number;
}

interface PerformanceStats {
  current: any;
  trend: any[];
  latestAudit: any;
  vitals: any[];
}

const TechnicalSEODashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [scores, setScores] = useState<AuditScore | null>(null);
  const [issues, setIssues] = useState<AuditIssues | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAudit, setRunningAudit] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/technical-seo/statistics'),
        fetch('/api/technical-seo/audits?limit=10'),
      ]);

      const statsData = await statsRes.json();
      const historyData = await historyRes.json();

      if (statsData.success) {
        setPerformanceStats(statsData);
        
        if (statsData.latestAudit) {
          setScores({
            overall: statsData.latestAudit.overallScore,
            speed: statsData.latestAudit.speedScore,
            mobile: statsData.latestAudit.mobileScore,
            crawlability: statsData.latestAudit.crawlabilityScore,
            security: statsData.latestAudit.securityScore,
            indexability: statsData.latestAudit.indexabilityScore,
          });
          
          setIssues({
            critical: statsData.latestAudit.criticalIssues,
            warning: statsData.latestAudit.warningIssues,
            info: statsData.latestAudit.infoIssues,
          });
        }
      }

      if (historyData.success) {
        setAuditHistory(historyData.audits || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching technical SEO data:', error);
      setLoading(false);
    }
  };

  const runFullAudit = async () => {
    setRunningAudit(true);
    try {
      const response = await fetch('/api/technical-seo/audit/full', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScores(data.scores);
        setIssues(data.issues);
        await fetchData(); // Refresh all data
      }
    } catch (error) {
      console.error('Error running audit:', error);
    } finally {
      setRunningAudit(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'speed', label: 'Speed & Vitals', icon: Zap },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'crawlability', label: 'Crawlability', icon: Search },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'indexability', label: 'Indexability', icon: Globe },
    { id: 'history', label: 'Audit History', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Technical SEO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Technical SEO Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor and optimize technical SEO performance
              </p>
            </div>
            <button
              onClick={runFullAudit}
              disabled={runningAudit}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${runningAudit ? 'animate-spin' : ''}`} />
              {runningAudit ? 'Running Audit...' : 'Run Full Audit'}
            </button>
          </div>

          {/* Overall Score Card */}
          {scores && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-medium text-blue-200 mb-2">
                    Overall SEO Health Score
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold">{scores.overall.toFixed(0)}</span>
                    <span className="text-2xl">/100</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {scores.overall >= 90 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-300" />
                    )}
                    <span className="text-sm text-blue-100">
                      {scores.overall >= 90
                        ? 'Excellent technical performance'
                        : scores.overall >= 70
                        ? 'Good, but improvements available'
                        : 'Critical issues require attention'}
                    </span>
                  </div>
                </div>

                {issues && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-5 h-5 text-red-300" />
                        <span className="text-2xl font-bold">{issues.critical}</span>
                      </div>
                      <div className="text-xs text-blue-200">Critical Issues</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-300" />
                        <span className="text-2xl font-bold">{issues.warning}</span>
                      </div>
                      <div className="text-xs text-blue-200">Warnings</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Info className="w-5 h-5 text-blue-300" />
                        <span className="text-2xl font-bold">{issues.info}</span>
                      </div>
                      <div className="text-xs text-blue-200">Info Items</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && scores && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Technical SEO Overview
              </h2>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-gray-900">Speed & Vitals</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.speed)}`}>
                      {scores.speed.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.speed)}`}
                      style={{ width: `${scores.speed}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Core Web Vitals performance
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Mobile</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.mobile)}`}>
                      {scores.mobile.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.mobile)}`}
                      style={{ width: `${scores.mobile}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Mobile optimization score
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Crawlability</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.crawlability)}`}>
                      {scores.crawlability.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.crawlability)}`}
                      style={{ width: `${scores.crawlability}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Robots and sitemap health
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-gray-900">Security</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.security)}`}>
                      {scores.security.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.security)}`}
                      style={{ width: `${scores.security}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    HTTPS and security headers
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-900">Indexability</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.indexability)}`}>
                      {scores.indexability.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.indexability)}`}
                      style={{ width: `${scores.indexability}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Meta tags and structured data
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-gray-900">Overall Health</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(scores.overall)}`}>
                      {scores.overall.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(scores.overall)}`}
                      style={{ width: `${scores.overall}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Combined technical score
                  </p>
                </div>
              </div>

              {/* Core Web Vitals */}
              {performanceStats?.vitals && performanceStats.vitals.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Core Web Vitals
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">URL</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">LCP</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">FID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">CLS</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Measured</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {performanceStats.vitals.slice(0, 5).map((vital: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-xs">{vital.url}</td>
                            <td className="py-3 px-4">
                              <span className={vital.lcpRating === 'GOOD' ? 'text-green-600' : 'text-red-600'}>
                                {vital.lcp.toFixed(0)}ms
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={vital.fidRating === 'GOOD' ? 'text-green-600' : 'text-red-600'}>
                                {vital.fid.toFixed(0)}ms
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={vital.clsRating === 'GOOD' ? 'text-green-600' : 'text-red-600'}>
                                {vital.cls.toFixed(3)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${getScoreColor(vital.performanceScore)}`}>
                                {vital.performanceScore.toFixed(0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(vital.measuredAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Audit History
              </h2>

              {auditHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No audit history available</p>
                  <p className="text-sm mt-2">Run your first audit to see results here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditHistory.map((audit) => (
                    <div key={audit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {audit.type} Audit
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(audit.completedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                            {audit.overallScore.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {(audit.duration / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Speed</div>
                          <div className={`font-semibold ${getScoreColor(audit.scores.speed)}`}>
                            {audit.scores.speed.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Mobile</div>
                          <div className={`font-semibold ${getScoreColor(audit.scores.mobile)}`}>
                            {audit.scores.mobile.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Crawl</div>
                          <div className={`font-semibold ${getScoreColor(audit.scores.crawlability)}`}>
                            {audit.scores.crawlability.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Security</div>
                          <div className={`font-semibold ${getScoreColor(audit.scores.security)}`}>
                            {audit.scores.security.toFixed(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Index</div>
                          <div className={`font-semibold ${getScoreColor(audit.scores.indexability)}`}>
                            {audit.scores.indexability.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {audit.issues.critical} Critical
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          {audit.issues.warning} Warning
                        </span>
                        <span className="flex items-center gap-1">
                          <Info className="w-4 h-4 text-blue-600" />
                          {audit.issues.info} Info
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other tabs content placeholders */}
          {['speed', 'mobile', 'crawlability', 'security', 'indexability'].includes(activeTab) && (
            <div className="text-center py-12 text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Detailed {activeTab} metrics coming soon</p>
              <p className="text-sm mt-2">Check the Overview tab for current scores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalSEODashboard;
