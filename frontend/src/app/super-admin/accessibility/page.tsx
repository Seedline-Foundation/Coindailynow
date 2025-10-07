'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  RefreshCw,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Palette,
  MousePointer,
  Keyboard,
  Volume2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Play,
  Settings as SettingsIcon
} from 'lucide-react';

interface AccessibilityScore {
  overall: number;
  contrast: number;
  keyboard: number;
  screenReader: number;
  semantics: number;
  aria: number;
  multimedia: number;
}

interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  element: string;
  description: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  location: string;
  suggestion: string;
  affectedUsers?: string;
}

interface ContrastCheck {
  id: string;
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  passed: boolean;
  level: 'AA' | 'AAA';
  location: string;
}

interface ARIAAttribute {
  id: string;
  element: string;
  attribute: string;
  value: string;
  valid: boolean;
  issue?: string;
  location: string;
}

export default function AccessibilityPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'contrast' | 'aria' | 'reports'>('overview');
  
  const [score, setScore] = useState<AccessibilityScore | null>(null);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [contrastChecks, setContrastChecks] = useState<ContrastCheck[]>([]);
  const [ariaAttributes, setARIAAttributes] = useState<ARIAAttribute[]>([]);
  
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAccessibilityData();
  }, []);

  const loadAccessibilityData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/accessibility', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load accessibility data');

      const data = await response.json();
      setScore(data.score);
      setIssues(data.issues);
      setContrastChecks(data.contrastChecks);
      setARIAAttributes(data.ariaAttributes);
    } catch (error) {
      console.error('Error loading accessibility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccessibilityData();
    setRefreshing(false);
  };

  const handleScan = async () => {
    setScanning(true);
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    await loadAccessibilityData();
    setScanning(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 text-red-300 border-red-700';
      case 'serious': return 'bg-orange-900 text-orange-300 border-orange-700';
      case 'moderate': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'minor': return 'bg-blue-900 text-blue-300 border-blue-700';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'serious': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'moderate': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'minor': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Poor';
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.element.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
    const matchesType = filterType === 'all' || issue.type === filterType;
    return matchesSearch && matchesSeverity && matchesType;
  });

  if (loading && !score) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading accessibility data...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">WCAG Accessibility Tools</h1>
            <p className="text-gray-400">Web Content Accessibility Guidelines compliance and testing</p>
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
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Scan
                </>
              )}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      {score && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-lg border border-gray-600 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Overall Accessibility Score</h2>
              <div className="flex items-end gap-4">
                <div className={`text-7xl font-bold ${getScoreColor(score.overall)}`}>
                  {score.overall}
                </div>
                <div className="mb-4">
                  <div className="text-2xl text-gray-300">/ 100</div>
                  <div className={`text-lg font-semibold ${getScoreColor(score.overall)}`}>
                    {getScoreGrade(score.overall)}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="w-full bg-gray-600 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      score.overall >= 90 ? 'bg-green-500' :
                      score.overall >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score.overall}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Category Scores</h3>
              {Object.entries(score).filter(([key]) => key !== 'overall').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 90 ? 'bg-green-500' :
                          value >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 text-right ${getScoreColor(value)}`}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'issues', 'contrast', 'aria', 'reports'] as const).map((tab) => (
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Issue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-red-700">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-red-500 font-bold">Critical</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {issues.filter(i => i.severity === 'critical').length}
              </p>
              <p className="text-sm text-gray-400 mt-2">Must fix immediately</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-orange-700">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <span className="text-orange-500 font-bold">Serious</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {issues.filter(i => i.severity === 'serious').length}
              </p>
              <p className="text-sm text-gray-400 mt-2">High priority fixes</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-yellow-700">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <span className="text-yellow-500 font-bold">Moderate</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {issues.filter(i => i.severity === 'moderate').length}
              </p>
              <p className="text-sm text-gray-400 mt-2">Medium priority</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-blue-700">
              <div className="flex items-center justify-between mb-4">
                <Info className="w-8 h-8 text-blue-500" />
                <span className="text-blue-500 font-bold">Minor</span>
              </div>
              <p className="text-4xl font-bold text-white">
                {issues.filter(i => i.severity === 'minor').length}
              </p>
              <p className="text-sm text-gray-400 mt-2">Low priority</p>
            </div>
          </div>

          {/* WCAG Compliance Status */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">WCAG Compliance Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Level A</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-400">Essential compliance</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                  </div>
                  <span className="text-green-500 font-semibold">95%</span>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Level AA</h3>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-400">Enhanced compliance</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                  <span className="text-yellow-500 font-semibold">78%</span>
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Level AAA</h3>
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm text-gray-400">Advanced compliance</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-600 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <span className="text-red-500 font-semibold">45%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <span className="text-gray-400 text-sm">Images</span>
              </div>
              <p className="text-2xl font-bold text-white">234</p>
              <p className="text-xs text-gray-500">12 missing alt text</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <LinkIcon className="w-5 h-5 text-cyan-500" />
                <span className="text-gray-400 text-sm">Links</span>
              </div>
              <p className="text-2xl font-bold text-white">567</p>
              <p className="text-xs text-gray-500">8 without descriptive text</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Code className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">ARIA Attrs</span>
              </div>
              <p className="text-2xl font-bold text-white">89</p>
              <p className="text-xs text-gray-500">3 invalid attributes</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400 text-sm">Contrast</span>
              </div>
              <p className="text-2xl font-bold text-white">45</p>
              <p className="text-xs text-gray-500">5 failing combinations</p>
            </div>
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="serious">Serious</option>
                <option value="moderate">Moderate</option>
                <option value="minor">Minor</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="color-contrast">Color Contrast</option>
                <option value="keyboard">Keyboard Navigation</option>
                <option value="screen-reader">Screen Reader</option>
                <option value="aria">ARIA Attributes</option>
                <option value="semantics">Semantic HTML</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className={`bg-gray-800 rounded-lg border p-5 ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start gap-4">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-semibold">{issue.description}</h3>
                          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {issue.wcagLevel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{issue.type} • {issue.wcagCriterion}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/50 p-3 rounded mb-3">
                      <p className="text-sm text-gray-300 font-mono">{issue.element}</p>
                      <p className="text-xs text-gray-500 mt-1">{issue.location}</p>
                    </div>
                    
                    <div className="flex items-start gap-2 p-3 bg-blue-900/20 rounded border border-blue-700">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-300 font-semibold mb-1">Suggestion:</p>
                        <p className="text-sm text-blue-200">{issue.suggestion}</p>
                      </div>
                    </div>
                    
                    {issue.affectedUsers && (
                      <p className="text-xs text-gray-400 mt-3">
                        Affects: {issue.affectedUsers}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contrast Tab */}
      {activeTab === 'contrast' && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Color Contrast Analysis</h2>
            <p className="text-gray-400 mb-6">
              WCAG requires a contrast ratio of at least 4.5:1 for normal text (AA) and 7:1 for enhanced (AAA)
            </p>
            
            <div className="space-y-3">
              {contrastChecks.map((check) => (
                <div key={check.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-600"
                        style={{ backgroundColor: check.background }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ color: check.foreground }}
                        >
                          Aa
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium">{check.element}</p>
                        <p className="text-sm text-gray-400">{check.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {check.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`font-bold ${check.passed ? 'text-green-500' : 'text-red-500'}`}>
                          {check.ratio.toFixed(2)}:1
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        Level {check.level} {check.passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: check.foreground }} />
                      <span className="text-gray-300">Foreground: {check.foreground}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: check.background }} />
                      <span className="text-gray-300">Background: {check.background}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ARIA Tab */}
      {activeTab === 'aria' && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">ARIA Attribute Validation</h2>
            <p className="text-gray-400 mb-6">
              Accessible Rich Internet Applications (ARIA) attributes help make web content more accessible
            </p>
            
            <div className="space-y-3">
              {ariaAttributes.map((attr) => (
                <div key={attr.id} className={`p-4 rounded-lg ${attr.valid ? 'bg-gray-700' : 'bg-red-900/20 border border-red-700'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {attr.valid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="text-white font-medium">{attr.element}</p>
                          <p className="text-sm text-gray-400">{attr.location}</p>
                        </div>
                      </div>
                      <div className="bg-gray-900/50 p-3 rounded">
                        <code className="text-sm text-blue-300">
                          {attr.attribute}="{attr.value}"
                        </code>
                      </div>
                      {!attr.valid && attr.issue && (
                        <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-700">
                          <p className="text-sm text-red-300">{attr.issue}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Accessibility Reports</h2>
            <p className="text-gray-400 mb-6">
              Generate comprehensive accessibility reports for compliance and documentation
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="text-white font-semibold">WCAG 2.1 Compliance Report</h3>
                  <p className="text-sm text-gray-400">Full compliance audit</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <Palette className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="text-white font-semibold">Color Contrast Report</h3>
                  <p className="text-sm text-gray-400">All contrast checks</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <Keyboard className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-white font-semibold">Keyboard Navigation Report</h3>
                  <p className="text-sm text-gray-400">Tab order and focus</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <Volume2 className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-white font-semibold">Screen Reader Report</h3>
                  <p className="text-sm text-gray-400">ARIA and semantic HTML</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
