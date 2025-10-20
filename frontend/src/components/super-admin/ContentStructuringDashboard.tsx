/**
 * RAO Content Structuring Dashboard
 * Task 71: Super Admin Interface for Content Structuring & Chunking
 */

'use client';

import React, { useState, useEffect } from 'react';

interface StructuredContent {
  id: string;
  articleId: string;
  chunkCount: number;
  faqCount: number;
  glossaryCount: number;
  canonicalAnswerCount: number;
  overallQualityScore: number;
  llmReadabilityScore: number;
  semanticCoherence: number;
  entityDensity: number;
  factDensity: number;
  status: string;
  lastProcessedAt: string;
  processingTimeMs: number;
}

interface ContentChunk {
  id: string;
  chunkIndex: number;
  chunkType: string;
  content: string;
  wordCount: number;
  semanticScore: number;
  entities: string;
  keywords: string;
}

interface CanonicalAnswer {
  id: string;
  question: string;
  answer: string;
  answerType: string;
  confidence: number;
  isVerified: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  questionType: string;
  relevanceScore: number;
  isHumanReviewed: boolean;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  complexity: string;
  usageCount: number;
  isVerified: boolean;
}

interface DashboardStats {
  totalStructured: number;
  completedCount: number;
  processingCount: number;
  failedCount: number;
  avgQualityScore: number;
  totalChunks: number;
  totalFAQs: number;
  totalGlossaryTerms: number;
}

const ContentStructuringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chunks' | 'answers' | 'faqs' | 'glossary'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [structuredContent, setStructuredContent] = useState<StructuredContent | null>(null);
  const [chunks, setChunks] = useState<ContentChunk[]>([]);
  const [answers, setAnswers] = useState<CanonicalAnswer[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (): Promise<void> => {
    try {
      const response = await fetch('/api/content-structuring/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const processArticle = async (): Promise<void> => {
    if (!selectedArticleId.trim()) {
      setMessage('Please enter an article ID');
      return;
    }

    setProcessing(true);
    setMessage('Processing article for RAO structuring...');

    try {
      const response = await fetch('/api/content-structuring/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: selectedArticleId })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ Processing complete: ${result.chunks} chunks, ${result.canonicalAnswers} answers, ${result.faqs} FAQs, ${result.glossary} terms`);
        await loadArticleData(selectedArticleId);
        await loadStats();
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const loadArticleData = async (articleId: string): Promise<void> => {
    try {
      const [structuredRes, chunksRes, answersRes, faqsRes, glossaryRes] = await Promise.all([
        fetch(`/api/content-structuring/structured/${articleId}`),
        fetch(`/api/content-structuring/chunks/${articleId}`),
        fetch(`/api/content-structuring/canonical-answers/${articleId}`),
        fetch(`/api/content-structuring/faqs/${articleId}`),
        fetch(`/api/content-structuring/glossary/${articleId}`)
      ]);

      if (structuredRes.ok) setStructuredContent(await structuredRes.json());
      if (chunksRes.ok) setChunks(await chunksRes.json());
      if (answersRes.ok) setAnswers(await answersRes.json());
      if (faqsRes.ok) setFaqs(await faqsRes.json());
      if (glossaryRes.ok) setGlossary(await glossaryRes.json());
    } catch (error) {
      console.error('Load article data error:', error);
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">RAO Content Structuring Dashboard</h1>
        <p className="text-gray-600 mt-2">LLM Retrieval Optimization & Semantic Chunking System</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Structured</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalStructured}</div>
            <div className="text-green-600 text-xs mt-1">
              {stats.completedCount} completed
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Avg Quality Score</div>
            <div className={`text-2xl font-bold ${getQualityColor(stats.avgQualityScore)}`}>
              {stats.avgQualityScore}
            </div>
            <div className="text-gray-500 text-xs mt-1">Out of 100</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Chunks</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalChunks.toLocaleString()}</div>
            <div className="text-blue-600 text-xs mt-1">Semantic blocks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Content Elements</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalFAQs + stats.totalGlossaryTerms}
            </div>
            <div className="text-purple-600 text-xs mt-1">
              {stats.totalFAQs} FAQs, {stats.totalGlossaryTerms} terms
            </div>
          </div>
        </div>
      )}

      {/* Process Article Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Process Article</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Article ID"
            value={selectedArticleId}
            onChange={(e) => setSelectedArticleId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={processArticle}
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Process Article'}
          </button>
          {structuredContent && (
            <button
              onClick={() => loadArticleData(selectedArticleId)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Load Data
            </button>
          )}
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Structured Content Info */}
      {structuredContent && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Structured Content Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-600 text-sm">Status</div>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusColor(structuredContent.status)}`}>
                {structuredContent.status}
              </span>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Quality Score</div>
              <div className={`text-xl font-bold ${getQualityColor(structuredContent.overallQualityScore)}`}>
                {structuredContent.overallQualityScore}/100
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">LLM Readability</div>
              <div className={`text-xl font-bold ${getQualityColor(structuredContent.llmReadabilityScore)}`}>
                {structuredContent.llmReadabilityScore}/100
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Semantic Coherence</div>
              <div className={`text-xl font-bold ${getQualityColor(structuredContent.semanticCoherence)}`}>
                {structuredContent.semanticCoherence}/100
              </div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Chunks</div>
              <div className="text-xl font-bold text-blue-600">{structuredContent.chunkCount}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Canonical Answers</div>
              <div className="text-xl font-bold text-purple-600">{structuredContent.canonicalAnswerCount}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">FAQs</div>
              <div className="text-xl font-bold text-green-600">{structuredContent.faqCount}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Glossary Terms</div>
              <div className="text-xl font-bold text-orange-600">{structuredContent.glossaryCount}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-600 text-sm">Entity Density</div>
              <div className="text-lg font-medium">{structuredContent.entityDensity} per 100 words</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Fact Density</div>
              <div className="text-lg font-medium">{structuredContent.factDensity} per 100 words</div>
            </div>
          </div>
          <div className="mt-4 text-gray-600 text-sm">
            Processing Time: {structuredContent.processingTimeMs}ms • 
            Last Processed: {new Date(structuredContent.lastProcessedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'chunks', 'answers', 'faqs', 'glossary'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Content Structure Overview</h3>
              {structuredContent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Semantic Chunks</div>
                      <div className="text-sm text-gray-600">200-400 word context blocks</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{structuredContent.chunkCount}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <div className="font-medium">Canonical Answers</div>
                      <div className="text-sm text-gray-600">LLM-optimized responses</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{structuredContent.canonicalAnswerCount}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">FAQ Blocks</div>
                      <div className="text-sm text-gray-600">Structured Q&A pairs</div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{structuredContent.faqCount}</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <div className="font-medium">Glossary Terms</div>
                      <div className="text-sm text-gray-600">Crypto definitions</div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{structuredContent.glossaryCount}</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Process an article to see content structure</p>
              )}
            </div>
          )}

          {/* Chunks Tab */}
          {activeTab === 'chunks' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Content Chunks ({chunks.length})</h3>
              {chunks.length > 0 ? (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Chunk #{chunk.chunkIndex}</span>
                          <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {chunk.chunkType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {chunk.wordCount} words • Score: {chunk.semanticScore}/100
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{chunk.content.substring(0, 200)}...</p>
                      {chunk.entities && JSON.parse(chunk.entities).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-gray-600">Entities:</span>
                          {JSON.parse(chunk.entities).map((entity: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {entity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No chunks available. Process an article first.</p>
              )}
            </div>
          )}

          {/* Canonical Answers Tab */}
          {activeTab === 'answers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Canonical Answers ({answers.length})</h3>
              {answers.length > 0 ? (
                <div className="space-y-4">
                  {answers.map((answer) => (
                    <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{answer.question}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {answer.answerType}
                          </span>
                          {answer.isVerified && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{answer.answer}</p>
                      <div className="text-xs text-gray-500">
                        Confidence: {answer.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No canonical answers available.</p>
              )}
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">FAQ Blocks ({faqs.length})</h3>
              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{faq.question}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {faq.questionType}
                          </span>
                          {faq.isHumanReviewed && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{faq.answer}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Relevance: {Math.round(faq.relevanceScore)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No FAQs available.</p>
              )}
            </div>
          )}

          {/* Glossary Tab */}
          {activeTab === 'glossary' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Glossary Terms ({glossary.length})</h3>
              {glossary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {glossary.map((term) => (
                    <div key={term.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{term.term}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            {term.category}
                          </span>
                          {term.isVerified && (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{term.definition}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Complexity: {term.complexity}</span>
                        <span>•</span>
                        <span>Used {term.usageCount}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No glossary terms available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentStructuringDashboard;
