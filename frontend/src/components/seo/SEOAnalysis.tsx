// SEO Analysis Component
// Comprehensive SEO analysis tool for content optimization

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Save,
  Eye,
  TrendingUp,
  Target,
  Search,
  BarChart3,
} from 'lucide-react';

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'content' | 'technical' | 'social';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}

interface SEOSuggestion {
  type: 'title' | 'description' | 'keywords' | 'content' | 'technical';
  suggestion: string;
  expectedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

interface SEOAnalysisResult {
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
  metadata: any;
  raometa: any;
}

interface SEOAnalysisProps {
  contentId?: string;
  contentType?: string;
  initialContent?: string;
  initialTitle?: string;
  initialDescription?: string;
  onMetadataGenerated?: (metadata: any) => void;
}

export default function SEOAnalysis({
  contentId,
  contentType = 'article',
  initialContent = '',
  initialTitle = '',
  initialDescription = '',
  onMetadataGenerated,
}: SEOAnalysisProps) {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [currentContentType, setCurrentContentType] = useState(contentType);

  const [analysis, setAnalysis] = useState<SEOAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedMetadata, setGeneratedMetadata] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Auto-analyze when content changes
  useEffect(() => {
    if (content && content.length > 100) {
      const timeoutId = setTimeout(() => {
        performAnalysis();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [content, title, description]);

  const performAnalysis = async () => {
    if (!url || !content) {
      setError('URL and content are required for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          url,
          content,
          title,
          description,
          keywords,
          targetAudience,
          contentType: currentContentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setAnalysis(data.data);
      setGeneratedMetadata(data.data.metadata);

      if (onMetadataGenerated) {
        onMetadataGenerated(data.data.metadata);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const saveMetadata = async () => {
    if (!generatedMetadata || !contentId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/seo/metadata/${contentId}/${currentContentType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(generatedMetadata),
      });

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      alert('SEO metadata saved successfully!');
    } catch (err) {
      alert('Failed to save metadata: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Analysis Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://coindaily.africa/article/example"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                value={currentContentType}
                onChange={(e) => setCurrentContentType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="article">Article</option>
                <option value="page">Page</option>
                <option value="category">Category</option>
                <option value="author">Author</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the page title"
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/60 characters (recommended)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter the meta description"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/160 characters (recommended)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or enter the main content for analysis"
              rows={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Keywords (comma-separated)</label>
            <Input
              value={keywords.join(', ')}
              onChange={(e) => setKeywords(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
              placeholder="bitcoin, cryptocurrency, blockchain"
            />
          </div>

          <Button
            onClick={performAnalysis}
            disabled={loading || !url || !content}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze SEO
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues ({analysis.issues.length})</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions ({analysis.suggestions.length})</TabsTrigger>
            <TabsTrigger value="metadata">Generated Metadata</TabsTrigger>
            <TabsTrigger value="rao">RAO Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  SEO Score Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Overall Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}/100
                  </span>
                </div>
                <Progress value={analysis.score} className="w-full" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.issues.filter(i => i.type === 'error').length}
                    </div>
                    <div className="text-sm text-green-600">Errors Fixed</div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {analysis.issues.filter(i => i.type === 'warning').length}
                    </div>
                    <div className="text-sm text-yellow-600">Warnings</div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.suggestions.length}
                    </div>
                    <div className="text-sm text-blue-600">Suggestions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>SEO Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.message}</span>
                          <Badge variant="outline" className={getImpactColor(issue.impact)}>
                            {issue.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.category}</p>
                        {issue.fix && (
                          <p className="text-sm text-blue-600 mt-1">
                            <strong>Fix:</strong> {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>SEO Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority} priority
                        </Badge>
                        <span className="text-sm text-green-600">
                          +{suggestion.expectedImprovement}% improvement
                        </span>
                      </div>
                      <p className="font-medium">{suggestion.suggestion}</p>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated SEO Metadata
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    {contentId && (
                      <Button
                        onClick={saveMetadata}
                        disabled={saving}
                        size="sm"
                      >
                        {saving ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save Metadata
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(generatedMetadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rao">
            <Card>
              <CardHeader>
                <CardTitle>RAO Analysis (Retrieval-Augmented Optimization)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Canonical Answer</h4>
                    <p className="text-sm text-gray-600">
                      {analysis.raometa.canonicalAnswer || 'No canonical answer generated'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">AI Confidence</h4>
                    <div className="flex items-center gap-2">
                      <Progress value={analysis.raometa.confidence * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {(analysis.raometa.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Entity Mentions</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.raometa.entityMentions.map((entity: string, index: number) => (
                      <Badge key={index} variant="secondary">{entity}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fact Claims</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {analysis.raometa.factClaims.map((fact: string, index: number) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}