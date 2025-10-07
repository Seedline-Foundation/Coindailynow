'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  ExternalLink, 
  RefreshCw,
  Download,
  Globe,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Eye,
  MousePointer,
  Clock
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  position: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
}

interface PageSEOData {
  url: string;
  title: string;
  metaDescription: string;
  status: 'optimized' | 'needs-improvement' | 'critical';
  issues: string[];
  score: number;
  traffic: number;
  keywords: number;
  lastUpdated: string;
}

interface SEOMetrics {
  organicTraffic: number;
  organicChange: number;
  avgPosition: number;
  positionChange: number;
  totalKeywords: number;
  keywordsChange: number;
  clickThroughRate: number;
  ctrChange: number;
  topPages: number;
  indexedPages: number;
  crawlErrors: number;
  backlinks: number;
}

interface SitemapStatus {
  url: string;
  status: 'active' | 'error' | 'pending';
  lastSubmitted: string;
  urlsIndexed: number;
  totalUrls: number;
}

export default function SEOManagementPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'pages' | 'sitemaps'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [pages, setPages] = useState<PageSEOData[]>([]);
  const [sitemaps, setSitemaps] = useState<SitemapStatus[]>([]);

  useEffect(() => {
    loadSEOData();
  }, [timeRange]);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/seo?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load SEO data');

      const data = await response.json();
      setMetrics(data.metrics);
      setKeywords(data.keywords);
      setPages(data.pages);
      setSitemaps(data.sitemaps);
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSEOData();
    setRefreshing(false);
  };

  const exportToCSV = () => {
    let csvContent = '';
    
    if (activeTab === 'keywords') {
      csvContent = 'Keyword,Position,Previous Position,Search Volume,Difficulty,Clicks,Impressions,CTR,URL\n';
      keywords.forEach(kw => {
        csvContent += `"${kw.keyword}",${kw.position},${kw.previousPosition},${kw.searchVolume},${kw.difficulty},${kw.clicks},${kw.impressions},${kw.ctr},"${kw.url}"\n`;
      });
    } else if (activeTab === 'pages') {
      csvContent = 'URL,Title,Status,Score,Traffic,Keywords,Issues,Last Updated\n';
      pages.forEach(page => {
        csvContent += `"${page.url}","${page.title}",${page.status},${page.score},${page.traffic},${page.keywords},"${page.issues.join('; ')}","${page.lastUpdated}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-${activeTab}-${timeRange}.csv`;
    a.click();
  };

  const generateSitemap = async () => {
    try {
      const response = await fetch('/api/super-admin/seo/generate-sitemap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        alert('Sitemap generated successfully!');
        await loadSEOData();
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      alert('Failed to generate sitemap');
    }
  };

  const filteredKeywords = keywords.filter(kw =>
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kw.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPages = pages.filter(page =>
    page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading SEO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">SEO Management</h1>
            <p className="text-gray-400">Monitor and optimize your search engine performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {(activeTab === 'keywords' || activeTab === 'pages') && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'keywords', 'pages', 'sitemaps'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.organicChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.organicChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metrics.organicChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Organic Traffic</h3>
              <p className="text-3xl font-bold text-white">{metrics.organicTraffic.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-blue-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.positionChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.positionChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metrics.positionChange)}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Avg. Position</h3>
              <p className="text-3xl font-bold text-white">{metrics.avgPosition.toFixed(1)}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Search className="w-8 h-8 text-purple-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.keywordsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.keywordsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metrics.keywordsChange)}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total Keywords</h3>
              <p className="text-3xl font-bold text-white">{metrics.totalKeywords}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <MousePointer className="w-8 h-8 text-yellow-500" />
                <span className={`flex items-center gap-1 text-sm ${metrics.ctrChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.ctrChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(metrics.ctrChange)}%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Click-Through Rate</h3>
              <p className="text-3xl font-bold text-white">{metrics.clickThroughRate.toFixed(2)}%</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-400 text-sm">Top Performing Pages</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.topPages}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-400 text-sm">Indexed Pages</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.indexedPages}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-gray-400 text-sm">Crawl Errors</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.crawlErrors}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="w-5 h-5 text-gray-400" />
                <h3 className="text-gray-400 text-sm">Backlinks</h3>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.backlinks.toLocaleString()}</p>
            </div>
          </div>

          {/* Top Performing Keywords */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top 5 Keywords</h2>
            <div className="space-y-3">
              {keywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="text-white font-medium">{keyword.keyword}</p>
                      <p className="text-sm text-gray-400">Position {keyword.position} • {keyword.searchVolume.toLocaleString()} searches/mo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white font-medium">{keyword.clicks} clicks</p>
                      <p className="text-sm text-gray-400">{keyword.ctr.toFixed(2)}% CTR</p>
                    </div>
                    {keyword.position < keyword.previousPosition && (
                      <span className="text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +{keyword.previousPosition - keyword.position}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Keywords Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Keyword</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Clicks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Impressions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredKeywords.map((keyword, index) => (
                    <tr key={index} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-white font-medium">{keyword.keyword}</p>
                          <p className="text-sm text-gray-400 truncate max-w-xs">{keyword.url}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-bold">#{keyword.position}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {keyword.position < keyword.previousPosition ? (
                          <span className="text-green-500 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +{keyword.previousPosition - keyword.position}
                          </span>
                        ) : keyword.position > keyword.previousPosition ? (
                          <span className="text-red-500 flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            -{keyword.position - keyword.previousPosition}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {keyword.searchVolume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          keyword.difficulty < 30 ? 'bg-green-900 text-green-300' :
                          keyword.difficulty < 60 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {keyword.difficulty}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{keyword.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{keyword.impressions.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{keyword.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPages.map((page, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{page.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.status === 'optimized' ? 'bg-green-900 text-green-300' :
                        page.status === 'needs-improvement' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {page.status === 'optimized' ? <CheckCircle className="w-3 h-3 inline mr-1" /> :
                         page.status === 'needs-improvement' ? <AlertCircle className="w-3 h-3 inline mr-1" /> :
                         <XCircle className="w-3 h-3 inline mr-1" />}
                        {page.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{page.url}</p>
                    <p className="text-sm text-gray-300 mb-3">{page.metaDescription}</p>
                    {page.issues.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.issues.map((issue, i) => (
                          <span key={i} className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                            {issue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-white mb-1">{page.score}</div>
                    <div className="text-sm text-gray-400">SEO Score</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Eye className="w-4 h-4" />
                      Traffic
                    </div>
                    <div className="text-white font-semibold">{page.traffic.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Search className="w-4 h-4" />
                      Keywords
                    </div>
                    <div className="text-white font-semibold">{page.keywords}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      Updated
                    </div>
                    <div className="text-white font-semibold">{page.lastUpdated}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sitemaps Tab */}
      {activeTab === 'sitemaps' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={generateSitemap}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generate New Sitemap
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sitemaps.map((sitemap, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div>
                      <h3 className="text-white font-semibold">{sitemap.url}</h3>
                      <p className="text-sm text-gray-400">Last submitted: {sitemap.lastSubmitted}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sitemap.status === 'active' ? 'bg-green-900 text-green-300' :
                    sitemap.status === 'error' ? 'bg-red-900 text-red-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {sitemap.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">URLs Indexed</div>
                    <div className="text-white text-2xl font-bold">{sitemap.urlsIndexed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Total URLs</div>
                    <div className="text-white text-2xl font-bold">{sitemap.totalUrls.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(sitemap.urlsIndexed / sitemap.totalUrls) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {((sitemap.urlsIndexed / sitemap.totalUrls) * 100).toFixed(1)}% indexed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
