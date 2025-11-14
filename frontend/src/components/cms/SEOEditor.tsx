/**
 * Real-time SEO Editor Component
 * Integrated with CMS for live content optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Eye,
  Link,
  FileText,
  Zap,
  RefreshCw,
} from 'lucide-react';
import debounce from 'lodash/debounce';

interface SEOScore {
  overall: number;
  title: number;
  description: number;
  keywords: number;
  readability: number;
  technical: number;
  issues: any[];
  recommendations: any[];
}

interface HeadlineAnalysis {
  score: number;
  emotionalScore: number;
  powerWords: string[];
  lengthScore: number;
  clarityScore: number;
  predictedCTR: number;
  suggestions: string[];
}

interface ReadabilityMetrics {
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  wordCount: number;
  sentenceCount: number;
  gradeLevel: string;
  targetAudience: string;
}

interface InternalLinkSuggestion {
  targetUrl: string;
  targetTitle: string;
  anchorText: string;
  contextSentence: string;
  relevanceScore: number;
}

interface SEOEditorProps {
  contentId: string;
  contentType: 'article' | 'page' | 'blog';
  title: string;
  content: string;
  keywords?: string[];
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
}

export const SEOEditor: React.FC<SEOEditorProps> = ({
  contentId,
  contentType,
  title,
  content,
  keywords = [],
  onTitleChange,
  onContentChange,
}) => {
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);
  const [headlineAnalysis, setHeadlineAnalysis] = useState<HeadlineAnalysis | null>(null);
  const [readability, setReadability] = useState<ReadabilityMetrics | null>(null);
  const [internalLinks, setInternalLinks] = useState<InternalLinkSuggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced analysis function
  const analyzeContent = useCallback(
    debounce(async (currentTitle: string, currentContent: string) => {
      if (!currentTitle || !currentContent) return;

      setAnalyzing(true);
      try {
        // Parallel API calls for performance
        const [headlineRes, readabilityRes] = await Promise.all([
          fetch('/api/content-seo/analyze-headline', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ headline: currentTitle }),
          }),
          fetch('/api/content-seo/analyze-readability', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ content: currentContent }),
          }),
        ]);

        const headlineData = await headlineRes.json();
        const readabilityData = await readabilityRes.json();

        setHeadlineAnalysis(headlineData);
        setReadability(readabilityData);

        // Calculate SEO score
        const calculatedScore: SEOScore = {
          overall: Math.round((headlineData.score + readabilityData.fleschReadingEase + 60) / 3),
          title: headlineData.score,
          description: 70,
          keywords: keywords.length > 0 ? 75 : 50,
          readability: Math.round(readabilityData.fleschReadingEase),
          technical: 80,
          issues: [],
          recommendations: [],
        };

        setSeoScore(calculatedScore);
      } catch (error) {
        console.error('SEO analysis error:', error);
      } finally {
        setAnalyzing(false);
      }
    }, 1000),
    [keywords]
  );

  useEffect(() => {
    analyzeContent(title, content);
  }, [title, content, analyzeContent]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const applyHeadlineSuggestion = (suggestion: string) => {
    if (onTitleChange) {
      onTitleChange(suggestion);
    }
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SEO Score</h3>
          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </div>
          )}
        </div>

        {seoScore && (
          <div>
            {/* Overall Score */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      seoScore.overall >= 80
                        ? '#10b981'
                        : seoScore.overall >= 60
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(seoScore.overall / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(seoScore.overall)}`}>
                      {seoScore.overall}
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded-lg ${getScoreBgColor(seoScore.title)}`}>
                <div className="text-xs text-gray-600 mb-1">Title</div>
                <div className={`text-xl font-bold ${getScoreColor(seoScore.title)}`}>
                  {seoScore.title}/100
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(seoScore.readability)}`}>
                <div className="text-xs text-gray-600 mb-1">Readability</div>
                <div className={`text-xl font-bold ${getScoreColor(seoScore.readability)}`}>
                  {seoScore.readability}/100
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(seoScore.keywords)}`}>
                <div className="text-xs text-gray-600 mb-1">Keywords</div>
                <div className={`text-xl font-bold ${getScoreColor(seoScore.keywords)}`}>
                  {seoScore.keywords}/100
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(seoScore.description)}`}>
                <div className="text-xs text-gray-600 mb-1">Description</div>
                <div className={`text-xl font-bold ${getScoreColor(seoScore.description)}`}>
                  {seoScore.description}/100
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getScoreBgColor(seoScore.technical)}`}>
                <div className="text-xs text-gray-600 mb-1">Technical</div>
                <div className={`text-xl font-bold ${getScoreColor(seoScore.technical)}`}>
                  {seoScore.technical}/100
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Headline Suggestions */}
      {headlineAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Headline Optimization</h3>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Emotional</div>
              <div className="text-lg font-bold text-gray-900">
                {headlineAnalysis.emotionalScore}/100
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Length</div>
              <div className="text-lg font-bold text-gray-900">
                {headlineAnalysis.lengthScore}/100
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Clarity</div>
              <div className="text-lg font-bold text-gray-900">
                {headlineAnalysis.clarityScore}/100
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Predicted CTR</div>
              <div className="text-lg font-bold text-green-600">
                {headlineAnalysis.predictedCTR.toFixed(1)}%
              </div>
            </div>
          </div>

          {headlineAnalysis.powerWords.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Power Words:</div>
              <div className="flex flex-wrap gap-2">
                {headlineAnalysis.powerWords.map((word, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && headlineAnalysis.suggestions.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">AI Suggestions:</div>
              <div className="space-y-2">
                {headlineAnalysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex-1 text-sm text-gray-900">{suggestion}</div>
                    <button
                      onClick={() => applyHeadlineSuggestion(suggestion)}
                      className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Readability Analysis */}
      {readability && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Readability Analysis</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Reading Ease</div>
              <div className={`text-2xl font-bold ${getScoreColor(readability.fleschReadingEase)}`}>
                {readability.fleschReadingEase.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Grade Level</div>
              <div className="text-2xl font-bold text-gray-900">
                {readability.fleschKincaidGrade.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Word Count</div>
              <div className="text-2xl font-bold text-gray-900">{readability.wordCount}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Sentences</div>
              <div className="text-2xl font-bold text-gray-900">{readability.sentenceCount}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Target</div>
              <div className="text-lg font-bold text-gray-900">{readability.targetAudience}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Grade</div>
              <div className="text-lg font-bold text-gray-900">{readability.gradeLevel}</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-900">
              <strong>Tip:</strong> Aim for a Flesch Reading Ease score between 60-70 for general audiences.
              Current target audience: <strong>{readability.targetAudience}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Optimization Tips</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              Keep titles between 50-60 characters for optimal SEO
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              Use power words to increase emotional engagement
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              Include numbers in headlines for better CTR
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              Target 1500+ words for comprehensive SEO coverage
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              Add internal links to boost site authority
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOEditor;

