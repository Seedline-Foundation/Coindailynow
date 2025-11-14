// Super Admin SEO Dashboard - Task 60
// Comprehensive SEO monitoring and management interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  Settings,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Target,
  Globe,
  Zap,
  Eye,
  Bell,
  Users,
  Activity,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Filter,
} from 'lucide-react';

// ============= INTERFACES =============

interface DashboardStats {
  keywords: {
    total: number;
    tracking: number;
    rankingTop10: number;
    rankingTop3: number;
    averagePosition: number;
    positionImprovement: number;
  };
  pages: {
    total: number;
    analyzed: number;
    averageScore: number;
    needsAttention: number;
  };
  issues: {
    critical: number;
    errors: number;
    warnings: number;
    resolved: number;
    total: number;
  };
  rao: {
    llmCitations: number;
    aiOverviews: number;
    averageRelevance: number;
    contentStructure: number;
  };
  traffic: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    changePercent: number;
  };
  competitors: {
    tracked: number;
    averageAuthority: number;
    keywordGaps: number;
  };
}

interface KeywordData {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  currentPosition: number | null;
  targetPosition: number;
  positionChange: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
  lastChecked: Date;
}

interface PageAnalysisData {
  id: string;
  url: string;
  contentId: string | null;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  mobileScore: number;
  performanceScore: number;
  raoScore: number;
  issues: IssueData[];
  metrics: {
    wordCount: number;
    readabilityScore: number;
    loadTime: number;
    llmCitations: number;
    aiOverviews: number;
  };
  lastAnalyzed: Date;
}

interface IssueData {
  id: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: string;
  type: string;
  message: string;
  recommendation: string;
  isResolved: boolean;
}

interface AlertData {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
}

interface CompetitorData {
  id: string;
  domain: string;
  name: string;
  domainAuthority: number;
  keywords: number;
  traffic: number;
  backlinks: number;
  trend: 'up' | 'down' | 'stable';
}

interface PredictionData {
  keywordId: string;
  keyword: string;
  currentPosition: number;
  predictedPosition: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  targetDate: Date;
  factors: {
    contentQuality: number;
    technicalScore: number;
    backlinks: number;
    competitorStrength: number;
  };
}

// ============= MAIN COMPONENT =============

export default function SEODashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [pages, setPages] = useState<PageAnalysisData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'top3' | 'top10' | 'top20'>('all');
  const [trendFilter, setTrendFilter] = useState<'all' | 'up' | 'down' | 'stable'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadKeywords(),
        loadPages(),
        loadAlerts(),
        loadCompetitors(),
        loadPredictions(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/seo/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadKeywords = async () => {
    try {
      const params = new URLSearchParams();
      if (keywordFilter !== 'all') params.append('position', keywordFilter);
      if (trendFilter !== 'all') params.append('trend', trendFilter);

      const response = await fetch(`/api/seo/keywords?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKeywords(data.data);
      }
    } catch (error) {
      console.error('Error loading keywords:', error);
    }
  };

  const loadPages = async () => {
    try {
      const response = await fetch('/api/seo/pages?hasIssues=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data.data);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/seo/alerts?isResolved=false', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadCompetitors = async () => {
    try {
      const response = await fetch('/api/seo/competitors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitors(data.data);
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/seo/predictions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data.data);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const analyzePage = async (url: string) => {
    try {
      const response = await fetch('/api/seo/pages/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        await loadPages();
        alert('Page analyzed successfully');
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
      alert('Failed to analyze page');
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/seo/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/seo/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading SEO Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Dashboard & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring, keyword tracking, and RAO performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keywords Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Keywords Tracking
              </CardTitle>
              <Target className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.keywords.total}</div>
              <div className="flex items-center mt-2 text-sm">
                <Badge variant="secondary" className="mr-2">
                  Top 10: {stats.keywords.rankingTop10}
                </Badge>
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stats.keywords.positionImprovement > 0 ? '+' : ''}
                  {stats.keywords.positionImprovement}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Avg Position: #{stats.keywords.averagePosition}
              </p>
            </CardContent>
          </Card>

          {/* Pages Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Page Health
              </CardTitle>
              <Activity className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pages.averageScore}/100</div>
              <Progress value={stats.pages.averageScore} className="mt-2" />
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-600">
                  {stats.pages.analyzed} analyzed
                </span>
                {stats.pages.needsAttention > 0 && (
                  <Badge variant="destructive">
                    {stats.pages.needsAttention} need attention
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Issues Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                SEO Issues
              </CardTitle>
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.issues.total - stats.issues.resolved}</div>
              <div className="space-y-1 mt-2">
                {stats.issues.critical > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-red-600">Critical</span>
                    <Badge variant="destructive">{stats.issues.critical}</Badge>
                  </div>
                )}
                {stats.issues.errors > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-600">Errors</span>
                    <Badge variant="destructive">{stats.issues.errors}</Badge>
                  </div>
                )}
                {stats.issues.warnings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-600">Warnings</span>
                    <Badge variant="default">{stats.issues.warnings}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RAO Performance Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                RAO Performance
              </CardTitle>
              <Zap className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rao.llmCitations}</div>
              <p className="text-xs text-gray-600 mt-1">LLM Citations</p>
              <div className="space-y-1 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">AI Overviews</span>
                  <Badge variant="secondary">{stats.rao.aiOverviews}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Relevance</span>
                  <Badge variant="secondary">{stats.rao.averageRelevance}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Search Traffic
              </CardTitle>
              <Users className="w-5 h-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.traffic.totalClicks.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Total Clicks (30d)</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">
                  CTR: {stats.traffic.averageCtr}%
                </span>
                <span className={`text-sm flex items-center ${stats.traffic.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.traffic.changePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(stats.traffic.changePercent)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Competitors Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Competitors
              </CardTitle>
              <Globe className="w-5 h-5 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.competitors.tracked}</div>
              <p className="text-xs text-gray-600 mt-1">Tracked Competitors</p>
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Avg Authority</span>
                  <Badge variant="secondary">{stats.competitors.averageAuthority}/100</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Recent Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active alerts</p>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                          <h4 className="font-medium">{alert.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Top Performing Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.slice(0, 5).map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{keyword.currentPosition || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(keyword.trend)}
                          {keyword.positionChange !== null && (
                            <span className={keyword.positionChange < 0 ? 'text-green-600' : 'text-red-600'}>
                              {keyword.positionChange > 0 ? '+' : ''}{keyword.positionChange}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{keyword.searchVolume.toLocaleString()}</TableCell>
                      <TableCell>{keyword.clicks.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Keyword Tracking</CardTitle>
                <div className="flex gap-2">
                  <select
                    value={keywordFilter}
                    onChange={(e) => setKeywordFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Positions</option>
                    <option value="top3">Top 3</option>
                    <option value="top10">Top 10</option>
                    <option value="top20">Top 20</option>
                  </select>
                  <select
                    value={trendFilter}
                    onChange={(e) => setTrendFilter(e.target.value as any)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Trends</option>
                    <option value="up">Improving</option>
                    <option value="down">Declining</option>
                    <option value="stable">Stable</option>
                  </select>
                  <Button onClick={loadKeywords}>
                    <Filter className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Last Check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{keyword.currentPosition || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(keyword.trend)}
                          {keyword.positionChange !== null && (
                            <span className={keyword.positionChange < 0 ? 'text-green-600' : 'text-red-600'}>
                              {keyword.positionChange > 0 ? '+' : ''}{keyword.positionChange}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{keyword.searchVolume.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={keyword.difficulty > 70 ? 'destructive' : keyword.difficulty > 40 ? 'default' : 'secondary'}>
                          {keyword.difficulty}/100
                        </Badge>
                      </TableCell>
                      <TableCell>{keyword.clicks.toLocaleString()}</TableCell>
                      <TableCell>{keyword.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(keyword.lastChecked).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Page Analysis</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter URL to analyze..."
                    className="w-96"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        analyzePage((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <Button>Analyze</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pages.map((page) => (
                  <Card key={page.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{page.url}</CardTitle>
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Overall: <strong>{page.overallScore}/100</strong>
                            </span>
                            <span className="text-gray-600">
                              Technical: <strong>{page.technicalScore}/100</strong>
                            </span>
                            <span className="text-gray-600">
                              Content: <strong>{page.contentScore}/100</strong>
                            </span>
                            <span className="text-gray-600">
                              RAO: <strong>{page.raoScore}/100</strong>
                            </span>
                          </div>
                        </div>
                        <Badge variant={page.overallScore >= 80 ? 'default' : page.overallScore >= 60 ? 'default' : 'destructive'}>
                          {page.overallScore >= 80 ? 'Excellent' : page.overallScore >= 60 ? 'Good' : 'Needs Work'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Issues */}
                      {page.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Issues ({page.issues.length})</h4>
                          <div className="space-y-2">
                            {page.issues.map((issue) => (
                              <div key={issue.id} className="flex items-start gap-2 p-2 border rounded">
                                <Badge variant={getSeverityColor(issue.severity) as any}>
                                  {issue.severity}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{issue.message}</p>
                                  <p className="text-xs text-gray-600 mt-1">{issue.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-600">Words</p>
                          <p className="font-medium">{page.metrics.wordCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Readability</p>
                          <p className="font-medium">{page.metrics.readabilityScore}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Load Time</p>
                          <p className="font-medium">{page.metrics.loadTime.toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">LLM Citations</p>
                          <p className="font-medium">{page.metrics.llmCitations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">AI Overviews</p>
                          <p className="font-medium">{page.metrics.aiOverviews}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.type}</Badge>
                        <h4 className="font-medium">{alert.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAlertAsRead(alert.id)}
                      >
                        Mark as Read
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Authority</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Backlinks</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor) => (
                    <TableRow key={competitor.id}>
                      <TableCell className="font-medium">{competitor.domain}</TableCell>
                      <TableCell>{competitor.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{competitor.domainAuthority}/100</Badge>
                      </TableCell>
                      <TableCell>{competitor.keywords.toLocaleString()}</TableCell>
                      <TableCell>{competitor.traffic.toLocaleString()}</TableCell>
                      <TableCell>{competitor.backlinks.toLocaleString()}</TableCell>
                      <TableCell>
                        {getTrendIcon(competitor.trend)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Predictions (30-Day Forecast)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Predicted</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Factors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow key={prediction.keywordId}>
                      <TableCell className="font-medium">{prediction.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">#{prediction.currentPosition}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">#{prediction.predictedPosition}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(prediction.trend)}
                          <span className={prediction.predictedPosition < prediction.currentPosition ? 'text-green-600' : 'text-red-600'}>
                            {prediction.predictedPosition - prediction.currentPosition > 0 ? '+' : ''}
                            {prediction.predictedPosition - prediction.currentPosition}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={prediction.confidence > 0.7 ? 'default' : 'secondary'}>
                          {Math.round(prediction.confidence * 100)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>Content: {Math.round(prediction.factors.contentQuality * 100)}%</div>
                          <div>Technical: {Math.round(prediction.factors.technicalScore * 100)}%</div>
                          <div>Backlinks: {prediction.factors.backlinks}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

