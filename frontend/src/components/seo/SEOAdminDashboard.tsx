// Super Admin SEO Dashboard
// Comprehensive SEO management interface for administrators

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
  Upload,
  Eye,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle,
  Target,
  Globe,
  Zap,
} from 'lucide-react';
import SEOAnalysis from './SEOAnalysis';

interface SEOAnalytics {
  totalPages: number;
  averageScore: number;
  topIssues: Array<{
    type: string;
    count: number;
  }>;
  improvement: {
    lastMonth: number;
    trendingUp: boolean;
  };
  raometa: {
    indexedPages: number;
    averageConfidence: number;
  };
}

interface SEOMetadataRecord {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  score: number;
  lastUpdated: string;
  status: 'active' | 'inactive';
}

export default function SEOAdminDashboard() {
  const [analytics, setAnalytics] = useState<SEOAnalytics | null>(null);
  const [metadataRecords, setMetadataRecords] = useState<SEOMetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<{
    id: string;
    type: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadAnalytics();
    loadMetadataRecords();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/seo/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load SEO analytics:', error);
    }
  };

  const loadMetadataRecords = async () => {
    // This would typically fetch from an API endpoint that lists all SEO metadata records
    // For now, we'll simulate with mock data
    setMetadataRecords([
      {
        id: '1',
        contentId: 'article-1',
        contentType: 'article',
        title: 'Bitcoin Price Analysis 2025',
        score: 85,
        lastUpdated: '2025-01-08T10:00:00Z',
        status: 'active',
      },
      {
        id: '2',
        contentId: 'article-2',
        contentType: 'article',
        title: 'Ethereum 2.0 Upgrade Complete',
        score: 78,
        lastUpdated: '2025-01-07T15:30:00Z',
        status: 'active',
      },
      {
        id: '3',
        contentId: 'page-about',
        contentType: 'page',
        title: 'About CoinDaily',
        score: 92,
        lastUpdated: '2025-01-06T09:15:00Z',
        status: 'active',
      },
    ]);
    setLoading(false);
  };

  const exportSEOData = async () => {
    try {
      const response = await fetch('/api/seo/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seo-data-export.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export SEO data:', error);
    }
  };

  const bulkOptimize = async () => {
    // Implement bulk optimization logic
    alert('Bulk optimization feature coming soon!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Management Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize your site's search engine performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSEOData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={bulkOptimize}>
            <Zap className="h-4 w-4 mr-2" />
            Bulk Optimize
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold">{analytics.totalPages.toLocaleString()}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                    {analytics.averageScore}/100
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Improvement</p>
                  <p className={`text-2xl font-bold flex items-center ${
                    analytics.improvement.trendingUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.improvement.trendingUp ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {analytics.improvement.lastMonth}%
                  </p>
                </div>
                {analytics.improvement.trendingUp ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RAO Indexed</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.raometa.indexedPages}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
          <TabsTrigger value="analysis">SEO Analysis</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Top SEO Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.topIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{issue.type}</span>
                      <Badge variant="destructive">{issue.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* RAO Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  RAO Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Indexed Pages</span>
                      <span>{analytics?.raometa.indexedPages || 0}</span>
                    </div>
                    <Progress value={75} className="w-full" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>AI Confidence</span>
                      <span>{((analytics?.raometa.averageConfidence || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(analytics?.raometa.averageConfidence || 0) * 100} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>SEO Metadata Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>SEO Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadataRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.contentType}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getScoreColor(record.score)}`}>
                          {record.score}/100
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {new Date(record.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedContent({
                              id: record.contentId,
                              type: record.contentType,
                              title: record.title,
                            })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          {selectedContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Analyzing: {selectedContent.title}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedContent(null)}
                >
                  Back to List
                </Button>
              </div>
              <SEOAnalysis
                contentId={selectedContent.id}
                contentType={selectedContent.type}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select Content to Analyze</h3>
                <p className="text-gray-600">
                  Choose a piece of content from the Content Management tab to perform detailed SEO analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Default Meta Description Length
                  </label>
                  <Input type="number" defaultValue="160" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title Length Limit
                  </label>
                  <Input type="number" defaultValue="60" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    AI Optimization Enabled
                  </label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    A/B Testing Enabled
                  </label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}