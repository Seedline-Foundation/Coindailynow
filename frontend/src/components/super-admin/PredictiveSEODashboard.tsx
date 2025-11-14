// Predictive SEO Intelligence Dashboard - Task 68
// Super Admin dashboard for E-E-A-T, competitor analysis, forecasting, and predictions

'use client';

import React, { useState, useEffect } from 'react';

interface EEATData {
  contentId: string;
  contentType: string;
  scores: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
    overall: number;
  };
}

interface CompetitorData {
  competitorId: string;
  domain: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  gaps: {
    keywords: string[];
    content: string[];
    backlinks: string[];
  };
  insights: string[];
  impact: number;
}

interface ForecastData {
  keyword: string;
  forecasts: {
    days30: { position: number; volume: number; clicks: number };
    days60: { position: number; volume: number; clicks: number };
    days90: { position: number; volume: number; clicks: number };
  };
  trend: {
    direction: string;
    strength: number;
    volatility: number;
  };
  confidence: number;
}

interface DashboardData {
  eeat: {
    avgScore: number;
    analyzed: number;
    improvements: number;
    topContent: any[];
  };
  competitors: {
    tracked: number;
    opportunities: number;
    gaps: number;
    insights: any[];
  };
  forecasts: {
    accuracy: number;
    keywordsTracked: number;
    trafficPredicted: number;
    trends: any[];
  };
  predictions: {
    accuracy: number;
    generated: number;
    top10: number;
    top3: number;
  };
}

export default function PredictiveSEODashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'eeat' | 'competitors' | 'forecasts' | 'predictions'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // E-E-A-T Analysis Form
  const [eeatContentId, setEEATContentId] = useState('');
  const [eeatResult, setEEATResult] = useState<EEATData | null>(null);

  // Competitor Analysis Form
  const [competitorId, setCompetitorId] = useState('');
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [competitorResult, setCompetitorResult] = useState<CompetitorData | null>(null);

  // Forecast Form
  const [forecastKeywordId, setForecastKeywordId] = useState('');
  const [forecastKeyword, setForecastKeyword] = useState('');
  const [forecastResult, setForecastResult] = useState<ForecastData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/predictive-seo/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEEAT = async () => {
    if (!eeatContentId) {
      alert('Please enter a content ID');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await fetch('/api/predictive-seo/eeat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: eeatContentId }),
      });
      const data = await response.json();
      setEEATResult(data);
      loadDashboard();
    } catch (error) {
      console.error('Error analyzing E-E-A-T:', error);
      alert('Error analyzing content');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeCompetitor = async () => {
    if (!competitorId || !competitorDomain) {
      alert('Please enter competitor ID and domain');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await fetch('/api/predictive-seo/competitor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorId, domain: competitorDomain }),
      });
      const data = await response.json();
      setCompetitorResult(data);
      loadDashboard();
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      alert('Error analyzing competitor');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateForecast = async () => {
    if (!forecastKeywordId || !forecastKeyword) {
      alert('Please enter keyword ID and keyword');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await fetch('/api/predictive-seo/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywordId: forecastKeywordId, keyword: forecastKeyword }),
      });
      const data = await response.json();
      setForecastResult(data);
      loadDashboard();
    } catch (error) {
      console.error('Error generating forecast:', error);
      alert('Error generating forecast');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAllForecasts = async () => {
    if (!confirm('Generate forecasts for all active keywords? This may take a while.')) {
      return;
    }

    try {
      setAnalyzing(true);
      await fetch('/api/predictive-seo/forecast/generate-all', {
        method: 'POST',
      });
      alert('All forecasts generated successfully');
      loadDashboard();
    } catch (error) {
      console.error('Error generating all forecasts:', error);
      alert('Error generating forecasts');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Predictive SEO Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔮 Predictive SEO Intelligence Dashboard
        </h1>
        <p className="text-gray-600">
          E-E-A-T evaluation, competitor analysis, search forecasting, and ranking predictions
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'eeat', 'competitors', 'forecasts', 'predictions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* E-E-A-T Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Avg E-E-A-T Score</h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(dashboardData.eeat.avgScore)}`}>
                {dashboardData.eeat.avgScore}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboardData.eeat.analyzed} analyzed
              </div>
            </div>

            {/* Competitor Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Opportunities</h3>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {dashboardData.competitors.opportunities}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboardData.competitors.tracked} competitors tracked
              </div>
            </div>

            {/* Forecast Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Forecast Accuracy</h3>
                <span className="text-2xl">🔮</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {dashboardData.forecasts.accuracy}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboardData.forecasts.keywordsTracked} keywords tracked
              </div>
            </div>

            {/* Prediction Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Top 10 Predictions</h3>
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {dashboardData.predictions.top10}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dashboardData.predictions.generated} total predictions
              </div>
            </div>
          </div>

          {/* Top Content & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top E-E-A-T Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🌟 Top E-E-A-T Content</h3>
              <div className="space-y-3">
                {dashboardData.eeat.topContent.map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{content.contentId.slice(0, 12)}...</span>
                    <span className={`font-semibold ${getScoreColor(content.score)}`}>
                      {content.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Forecasts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Trending Keywords</h3>
              <div className="space-y-3">
                {dashboardData.forecasts.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span>{getTrendIcon(trend.direction)}</span>
                      <span className="text-sm text-gray-700">{trend.keyword}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {Math.round(trend.confidence * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-E-A-T Tab */}
      {activeTab === 'eeat' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📊 E-E-A-T Content Analysis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content ID
                </label>
                <input
                  type="text"
                  value={eeatContentId}
                  onChange={(e) => setEEATContentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content ID to analyze"
                />
              </div>
              <button
                onClick={analyzeEEAT}
                disabled={analyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {analyzing ? 'Analyzing...' : 'Analyze E-E-A-T'}
              </button>
            </div>

            {eeatResult && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">E-E-A-T Scores</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className={`text-2xl font-bold ${getScoreColor(eeatResult.scores.experience)}`}>
                      {eeatResult.scores.experience}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expertise</div>
                    <div className={`text-2xl font-bold ${getScoreColor(eeatResult.scores.expertise)}`}>
                      {eeatResult.scores.expertise}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Authoritativeness</div>
                    <div className={`text-2xl font-bold ${getScoreColor(eeatResult.scores.authoritativeness)}`}>
                      {eeatResult.scores.authoritativeness}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Trustworthiness</div>
                    <div className={`text-2xl font-bold ${getScoreColor(eeatResult.scores.trustworthiness)}`}>
                      {eeatResult.scores.trustworthiness}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Overall</div>
                    <div className={`text-2xl font-bold ${getScoreColor(eeatResult.scores.overall)}`}>
                      {eeatResult.scores.overall}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Competitor Intelligence</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor ID
                </label>
                <input
                  type="text"
                  value={competitorId}
                  onChange={(e) => setCompetitorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter competitor ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="competitor.com"
                />
              </div>
              <button
                onClick={analyzeCompetitor}
                disabled={analyzing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Competitor'}
              </button>
            </div>

            {competitorResult && (
              <div className="mt-6 space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">SWOT Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-2">Strengths</div>
                      <ul className="text-sm space-y-1">
                        {competitorResult.swot.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-2">Weaknesses</div>
                      <ul className="text-sm space-y-1">
                        {competitorResult.swot.weaknesses.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3">Actionable Insights</h4>
                  <ul className="text-sm space-y-2">
                    {competitorResult.insights.map((insight, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-600 mr-2">💡</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forecasts Tab */}
      {activeTab === 'forecasts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔮 Search Trend Forecasting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword ID
                </label>
                <input
                  type="text"
                  value={forecastKeywordId}
                  onChange={(e) => setForecastKeywordId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter keyword ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keyword
                </label>
                <input
                  type="text"
                  value={forecastKeyword}
                  onChange={(e) => setForecastKeyword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="bitcoin price"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={generateForecast}
                  disabled={analyzing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {analyzing ? 'Generating...' : 'Generate Forecast'}
                </button>
                <button
                  onClick={generateAllForecasts}
                  disabled={analyzing}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Generate All Forecasts
                </button>
              </div>
            </div>

            {forecastResult && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-4">Forecast for "{forecastResult.keyword}"</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">30 Days</div>
                    <div className="space-y-1 text-sm">
                      <div>Position: <span className="font-semibold">{forecastResult.forecasts.days30.position}</span></div>
                      <div>Volume: <span className="font-semibold">{forecastResult.forecasts.days30.volume.toLocaleString()}</span></div>
                      <div>Clicks: <span className="font-semibold">{forecastResult.forecasts.days30.clicks.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">60 Days</div>
                    <div className="space-y-1 text-sm">
                      <div>Position: <span className="font-semibold">{forecastResult.forecasts.days60.position}</span></div>
                      <div>Volume: <span className="font-semibold">{forecastResult.forecasts.days60.volume.toLocaleString()}</span></div>
                      <div>Clicks: <span className="font-semibold">{forecastResult.forecasts.days60.clicks.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">90 Days</div>
                    <div className="space-y-1 text-sm">
                      <div>Position: <span className="font-semibold">{forecastResult.forecasts.days90.position}</span></div>
                      <div>Volume: <span className="font-semibold">{forecastResult.forecasts.days90.volume.toLocaleString()}</span></div>
                      <div>Clicks: <span className="font-semibold">{forecastResult.forecasts.days90.clicks.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">Trend:</span> {getTrendIcon(forecastResult.trend.direction)} {forecastResult.trend.direction} 
                    <span className="ml-4 font-medium">Confidence:</span> {Math.round(forecastResult.confidence * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🏆 Ranking Predictions</h3>
            <p className="text-gray-600 mb-4">
              Generate ranking predictions by analyzing content quality, technical SEO, backlinks, and competitive factors.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Use the API endpoint <code className="bg-blue-100 px-2 py-1 rounded">/api/predictive-seo/prediction/generate</code> to generate predictions for specific content and keywords.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

