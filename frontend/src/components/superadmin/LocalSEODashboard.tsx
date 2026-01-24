/**
 * Local SEO & Google My Business Dashboard
 * Task 80: Super Admin comprehensive local SEO management
 * 
 * Features:
 * - GMB Profile Management (6 tabs)
 * - Local Keyword Tracking
 * - Citation Building & NAP Consistency
 * - Review Management & Reputation
 * - Local Content Optimization
 * - Real-time Analytics
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GMBProfile {
  id: string;
  businessName: string;
  city: string;
  country: string;
  completionScore: number;
  profileStatus: string;
  isVerified: boolean;
  localSearchRanking?: number;
  avgRating?: number;
  reviewCount: number;
  keywords: LocalKeyword[];
  citations: Citation[];
  reviews: Review[];
}

interface LocalKeyword {
  id: string;
  keyword: string;
  keywordType: string;
  targetCity: string;
  currentRanking?: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

interface Citation {
  id: string;
  directoryName: string;
  directoryType: string;
  citationStatus: string;
  napConsistent: boolean;
  domainAuthority: number;
  isVerified: boolean;
  isClaimed: boolean;
}

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  platform: string;
  sentiment?: string;
  hasResponse: boolean;
  reviewDate: string;
}

interface LocalContent {
  id: string;
  title: string;
  targetCity: string;
  targetCountry: string;
  contentType: string;
  localSearchRanking?: number;
  localViews: number;
  optimizationScore: number;
  isOptimized: boolean;
}

interface Statistics {
  metrics: any;
  gmbs: {
    total: number;
    verified: number;
    optimized: number;
    avgCompletionScore: number;
  };
  keywords: {
    total: number;
    top3: number;
    top10: number;
  };
  citations: {
    total: number;
    verified: number;
    claimed: number;
  };
  reviews: {
    total: number;
    avgRating: number;
    positiveCount: number;
  };
  content: {
    total: number;
    optimized: number;
    avgScore: number;
  };
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function LocalSEODashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'gmb' | 'keywords' | 'citations' | 'reviews' | 'content'>('overview');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [gmbs, setGmbs] = useState<GMBProfile[]>([]);
  const [selectedGmb, setSelectedGmb] = useState<GMBProfile | null>(null);
  const [localContent, setLocalContent] = useState<LocalContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadStatistics();
    const interval = setInterval(loadStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'gmb') {
      loadGMBProfiles();
    } else if (activeTab === 'content') {
      loadLocalContent();
    }
  }, [activeTab]);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/local-seo/statistics');
      const data = await response.json();
      setStatistics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setLoading(false);
    }
  };

  const loadGMBProfiles = async () => {
    try {
      const response = await fetch('/api/local-seo/gmb');
      const data = await response.json();
      setGmbs(data);
    } catch (error) {
      console.error('Failed to load GMB profiles:', error);
    }
  };

  const loadLocalContent = async () => {
    try {
      const response = await fetch('/api/local-seo/content');
      const data = await response.json();
      setLocalContent(data);
    } catch (error) {
      console.error('Failed to load local content:', error);
    }
  };

  const selectGmb = async (gmbId: string) => {
    try {
      const response = await fetch(`/api/local-seo/gmb/${gmbId}`);
      const data = await response.json();
      setSelectedGmb(data);
    } catch (error) {
      console.error('Failed to load GMB profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Local SEO Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Local SEO & Google My Business</h1>
        <p className="text-gray-600">
          Manage local search optimization, GMB profiles, and African city targeting
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'gmb', label: 'GMB Profiles', icon: '🏢' },
          { id: 'keywords', label: 'Keywords', icon: '🔑' },
          { id: 'citations', label: 'Citations', icon: '📝' },
          { id: 'reviews', label: 'Reviews', icon: '⭐' },
          { id: 'content', label: 'Local Content', icon: '📄' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab statistics={statistics} />
      )}

      {activeTab === 'gmb' && (
        <GMBTab gmbs={gmbs} selectedGmb={selectedGmb} onSelectGmb={selectGmb} onRefresh={loadGMBProfiles} />
      )}

      {activeTab === 'keywords' && (
        <KeywordsTab selectedGmb={selectedGmb} />
      )}

      {activeTab === 'citations' && (
        <CitationsTab selectedGmb={selectedGmb} />
      )}

      {activeTab === 'reviews' && (
        <ReviewsTab selectedGmb={selectedGmb} />
      )}

      {activeTab === 'content' && (
        <LocalContentTab content={localContent} onRefresh={loadLocalContent} />
      )}
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ statistics }: { statistics: Statistics | null }) {
  if (!statistics) return <div>No data available</div>;

  const localSEOScore = statistics.metrics?.localSEOScore || 0;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Local SEO Score</h2>
            <p className="text-blue-100">Overall local search optimization health</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{localSEOScore.toFixed(0)}</div>
            <div className="text-blue-100">out of 100</div>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${localSEOScore}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* GMB Profiles */}
        <MetricCard
          title="GMB Profiles"
          value={statistics.gmbs.verified}
          total={statistics.gmbs.total}
          subtitle={`${statistics.gmbs.optimized} optimized`}
          icon="🏢"
          color="blue"
          percentage={statistics.gmbs.avgCompletionScore}
        />

        {/* Local Keywords */}
        <MetricCard
          title="Local Keywords"
          value={statistics.keywords.top3}
          total={statistics.keywords.total}
          subtitle={`${statistics.keywords.top10} in top 10`}
          icon="🔑"
          color="green"
          percentage={(statistics.keywords.top3 / statistics.keywords.total) * 100}
        />

        {/* Citations */}
        <MetricCard
          title="Citations"
          value={statistics.citations.verified}
          total={statistics.citations.total}
          subtitle={`${statistics.citations.claimed} claimed`}
          icon="📝"
          color="purple"
          percentage={(statistics.citations.verified / statistics.citations.total) * 100}
        />

        {/* Reviews */}
        <MetricCard
          title="Reviews"
          value={statistics.reviews.avgRating?.toFixed(1) || '0'}
          total="5.0"
          subtitle={`${statistics.reviews.total} total reviews`}
          icon="⭐"
          color="yellow"
          percentage={(statistics.reviews.avgRating / 5) * 100}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Search Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">📍 Local Search Performance</h3>
          <div className="space-y-3">
            <MetricRow
              label="Map Pack Appearances"
              value={statistics.metrics?.mapPackAppearances || 0}
              color="green"
            />
            <MetricRow
              label="Average Local Ranking"
              value={statistics.metrics?.avgLocalRanking?.toFixed(1) || 'N/A'}
              color="blue"
            />
            <MetricRow
              label="Local Search Views"
              value={statistics.metrics?.localSearchViews || 0}
              color="purple"
            />
            <MetricRow
              label="Directions Clicked"
              value={statistics.metrics?.directionsClicked || 0}
              color="orange"
            />
          </div>
        </div>

        {/* Content & Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">📄 Local Content & Engagement</h3>
          <div className="space-y-3">
            <MetricRow
              label="Local Content Pieces"
              value={statistics.content.total}
              color="blue"
            />
            <MetricRow
              label="Optimized Content"
              value={`${statistics.content.optimized} (${((statistics.content.optimized / statistics.content.total) * 100).toFixed(0)}%)`}
              color="green"
            />
            <MetricRow
              label="Avg Content Score"
              value={`${statistics.content.avgScore.toFixed(0)}/100`}
              color="purple"
            />
            <MetricRow
              label="Positive Reviews"
              value={`${statistics.reviews.positiveCount} (${((statistics.reviews.positiveCount / statistics.reviews.total) * 100).toFixed(0)}%)`}
              color="yellow"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GMB Tab
// ============================================================================

function GMBTab({
  gmbs,
  selectedGmb,
  onSelectGmb,
  onRefresh,
}: {
  gmbs: GMBProfile[];
  selectedGmb: GMBProfile | null;
  onSelectGmb: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* GMB List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">GMB Profiles ({gmbs.length})</h3>
            <button
              onClick={onRefresh}
              className="text-blue-600 hover:text-blue-800"
            >
              🔄
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {gmbs.map((gmb) => (
              <div
                key={gmb.id}
                onClick={() => onSelectGmb(gmb.id)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedGmb?.id === gmb.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{gmb.businessName}</div>
                    <div className="text-sm text-gray-600">
                      {gmb.city}, {gmb.country}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          gmb.profileStatus === 'OPTIMIZED'
                            ? 'bg-green-100 text-green-700'
                            : gmb.profileStatus === 'VERIFIED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {gmb.profileStatus}
                      </span>
                      {gmb.isVerified && <span className="text-xs">✅</span>}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-lg font-bold">{gmb.completionScore}</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GMB Details */}
      <div className="lg:col-span-2">
        {selectedGmb ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedGmb.businessName}</h2>
                  <p className="text-gray-600">
                    {selectedGmb.city}, {selectedGmb.country}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{selectedGmb.completionScore}</div>
                  <div className="text-sm text-gray-500">Completion</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{selectedGmb.localSearchRanking || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Local Ranking</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{selectedGmb.avgRating?.toFixed(1) || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Avg Rating</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{selectedGmb.reviewCount}</div>
                  <div className="text-xs text-gray-600">Reviews</div>
                </div>
              </div>
            </div>

            {/* Keywords, Citations, Reviews Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-bold mb-3">🔑 Keywords</h4>
                <div className="text-2xl font-bold mb-1">{selectedGmb.keywords.length}</div>
                <div className="text-sm text-gray-600">
                  {selectedGmb.keywords.filter(k => k.currentRanking && k.currentRanking <= 3).length} in top 3
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-bold mb-3">📝 Citations</h4>
                <div className="text-2xl font-bold mb-1">{selectedGmb.citations.length}</div>
                <div className="text-sm text-gray-600">
                  {selectedGmb.citations.filter(c => c.isVerified).length} verified
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-bold mb-3">⭐ Reviews</h4>
                <div className="text-2xl font-bold mb-1">{selectedGmb.reviews.length}</div>
                <div className="text-sm text-gray-600">
                  {selectedGmb.reviews.filter(r => r.hasResponse).length} responded
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Select a GMB profile to view details
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Keywords Tab
// ============================================================================

function KeywordsTab({ selectedGmb }: { selectedGmb: GMBProfile | null }) {
  if (!selectedGmb) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a GMB profile to view keywords
      </div>
    );
  }

  const keywords = selectedGmb.keywords;
  const top3 = keywords.filter(k => k.currentRanking && k.currentRanking <= 3);
  const top10 = keywords.filter(k => k.currentRanking && k.currentRanking <= 10);

  return (
    <div className="space-y-6">
      {/* Keyword Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold">{keywords.length}</div>
          <div className="text-sm text-gray-600">Total Keywords</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{top3.length}</div>
          <div className="text-sm text-gray-600">Top 3 Rankings</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{top10.length}</div>
          <div className="text-sm text-gray-600">Top 10 Rankings</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {keywords.reduce((sum, k) => sum + k.clicks, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ranking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {keywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{keyword.keyword}</div>
                    <div className="text-xs text-gray-500">{keyword.targetCity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {keyword.keywordType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {keyword.currentRanking ? (
                      <span
                        className={`px-2 py-1 rounded text-sm font-bold ${
                          keyword.currentRanking <= 3
                            ? 'bg-green-100 text-green-700'
                            : keyword.currentRanking <= 10
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        #{keyword.currentRanking}
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {keyword.searchVolume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {keyword.difficulty.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {keyword.clicks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {keyword.ctr.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Citations Tab
// ============================================================================

function CitationsTab({ selectedGmb }: { selectedGmb: GMBProfile | null }) {
  if (!selectedGmb) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a GMB profile to view citations
      </div>
    );
  }

  const citations = selectedGmb.citations;

  return (
    <div className="space-y-6">
      {/* Citation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold">{citations.length}</div>
          <div className="text-sm text-gray-600">Total Citations</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {citations.filter(c => c.isVerified).length}
          </div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {citations.filter(c => c.isClaimed).length}
          </div>
          <div className="text-sm text-gray-600">Claimed</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {((citations.filter(c => c.napConsistent).length / citations.length) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">NAP Consistent</div>
        </div>
      </div>

      {/* Citations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Directory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {citations.map((citation) => (
                <tr key={citation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {citation.directoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {citation.directoryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        citation.citationStatus === 'VERIFIED'
                          ? 'bg-green-100 text-green-700'
                          : citation.citationStatus === 'CLAIMED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {citation.citationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {citation.napConsistent ? (
                      <span className="text-green-600">✓ Consistent</span>
                    ) : (
                      <span className="text-red-600">✗ Inconsistent</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold">{citation.domainAuthority.toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {!citation.isVerified && (
                        <button className="text-blue-600 hover:text-blue-800">Verify</button>
                      )}
                      {!citation.isClaimed && (
                        <button className="text-green-600 hover:text-green-800">Claim</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Reviews Tab
// ============================================================================

function ReviewsTab({ selectedGmb }: { selectedGmb: GMBProfile | null }) {
  if (!selectedGmb) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a GMB profile to view reviews
      </div>
    );
  }

  const reviews = selectedGmb.reviews;

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold">{reviews.length}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {selectedGmb.avgRating?.toFixed(1) || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {reviews.filter(r => r.sentiment === 'POSITIVE').length}
          </div>
          <div className="text-sm text-gray-600">Positive</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {((reviews.filter(r => r.hasResponse).length / reviews.length) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Response Rate</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <div className="font-medium">{review.reviewerName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded bg-gray-100">
                  {review.platform}
                </span>
                <div className="text-yellow-500">
                  {'⭐'.repeat(Math.floor(review.rating))}
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-2">{review.reviewText}</p>
            {review.sentiment && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  review.sentiment === 'POSITIVE'
                    ? 'bg-green-100 text-green-700'
                    : review.sentiment === 'NEGATIVE'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {review.sentiment}
              </span>
            )}
            {!review.hasResponse && (
              <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                Respond to review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Local Content Tab
// ============================================================================

function LocalContentTab({
  content,
  onRefresh,
}: {
  content: LocalContent[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold">{content.length}</div>
          <div className="text-sm text-gray-600">Total Content</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {content.filter(c => c.isOptimized).length}
          </div>
          <div className="text-sm text-gray-600">Optimized</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {content.reduce((sum, c) => sum + c.localViews, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Views</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {(content.reduce((sum, c) => sum + c.optimizationScore, 0) / content.length).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Avg Score</div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ranking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{item.targetCity}</div>
                    <div className="text-xs text-gray-500">{item.targetCountry}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {item.contentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.localSearchRanking ? (
                      <span className="font-bold">#{item.localSearchRanking}</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.localViews.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{item.optimizationScore.toFixed(0)}</span>
                      {item.isOptimized && <span className="text-green-600">✓</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({
  title,
  value,
  total,
  subtitle,
  icon,
  color,
  percentage,
}: {
  title: string;
  value: string | number;
  total: string | number;
  subtitle: string;
  icon: string;
  color: string;
  percentage?: number;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-4 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-80">of {total}</div>
        </div>
      </div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs opacity-80">{subtitle}</div>
      {percentage !== undefined && (
        <div className="mt-2 bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-700">{label}</span>
      <span className={`font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </span>
    </div>
  );
}

