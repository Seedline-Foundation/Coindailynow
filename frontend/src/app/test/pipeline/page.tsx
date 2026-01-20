/**
 * Content Pipeline Test Page
 * For testing the news generation → community interaction → CE points flow
 */

'use client';

import React, { useState, useEffect } from 'react';
import ArticleComments from '@/components/articles/ArticleComments';
import ArticleReactions from '@/components/articles/ArticleReactions';
import SocialShare from '@/components/SocialShare';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  publishedAt?: string;
  author?: {
    username: string;
  };
}

interface PipelineStatus {
  status: string;
  pipelinesRunning: number;
  articlesInQueue: number;
  lastGenerated?: string;
}

export default function TestPipelinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTopic, setGeneratingTopic] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Simulated user for testing (in production, this comes from auth)
  const testUser = {
    id: 'test-user-123',
    username: 'testuser',
  };

  useEffect(() => {
    fetchArticles();
    fetchPipelineStatus();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetArticles($limit: Int, $status: String) {
              articles(limit: $limit, status: $status) {
                id
                title
                slug
                excerpt
                content
                status
                publishedAt
                author {
                  username
                }
              }
            }
          `,
          variables: { limit: 10, status: 'PUBLISHED' },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }
      setArticles(data.data?.articles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineStatus = async () => {
    try {
      const response = await fetch('/api/content-pipeline/status');
      if (response.ok) {
        const data = await response.json();
        setPipelineStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline status:', err);
    }
  };

  const triggerContentGeneration = async () => {
    if (!generatingTopic.trim()) {
      setError('Please enter a topic');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/content-pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: generatingTopic,
          priority: 'HIGH',
          contentType: 'article',
          targetLanguages: ['en'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger content generation');
      }

      const data = await response.json();
      alert(`Content generation triggered! Task ID: ${data.taskId || 'N/A'}`);
      
      // Refresh status
      await fetchPipelineStatus();
      setGeneratingTopic('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testRewardsAPI = async () => {
    try {
      setError(null);
      
      // Test reward creation
      const response = await fetch('/api/distribution/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.id,
          rewardType: 'SHARE',
          points: 10,
          source: 'test-article-id',
          sourceType: 'ARTICLE',
          description: 'Test reward for sharing',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reward');
      }

      const data = await response.json();
      alert(`Reward created successfully! Points: ${data.data?.points || 10}`);
    } catch (err: any) {
      setError(`Rewards API Test Failed: ${err.message}`);
    }
  };

  const testLeaderboard = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/distribution/leaderboard/WEEKLY');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      alert(`Leaderboard fetched! ${data.data?.length || 0} entries`);
    } catch (err: any) {
      setError(`Leaderboard Test Failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Content Pipeline & Community Test
        </h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Pipeline Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📊 Pipeline Status</h2>
          {pipelineStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {pipelineStatus.status}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {pipelineStatus.pipelinesRunning}
                </div>
                <div className="text-sm text-gray-600">Pipelines Running</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {pipelineStatus.articlesInQueue}
                </div>
                <div className="text-sm text-gray-600">In Queue</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 text-sm">
                  {pipelineStatus.lastGenerated || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Last Generated</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading status...</p>
          )}
        </div>

        {/* Content Generation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🤖 Generate Content</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={generatingTopic}
              onChange={e => setGeneratingTopic(e.target.value)}
              placeholder="Enter topic (e.g., 'Bitcoin price surge in Nigeria')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={triggerContentGeneration}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Article'}
            </button>
          </div>
        </div>

        {/* API Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔧 API Tests</h2>
          <div className="flex gap-4">
            <button
              onClick={testRewardsAPI}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Rewards API
            </button>
            <button
              onClick={testLeaderboard}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Test Leaderboard
            </button>
            <button
              onClick={fetchArticles}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh Articles
            </button>
          </div>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📰 Published Articles</h2>
          {loading ? (
            <p className="text-gray-500">Loading articles...</p>
          ) : articles.length === 0 ? (
            <p className="text-gray-500">No articles found. Generate some content first!</p>
          ) : (
            <div className="space-y-4">
              {articles.map(article => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <h3 className="font-semibold text-lg text-gray-900">{article.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>By: {article.author?.username || 'Unknown'}</span>
                    <span>Status: {article.status}</span>
                    {article.publishedAt && (
                      <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Article with Community Features */}
        {selectedArticle && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h2>
                <p className="text-gray-600 mt-2">{selectedArticle.excerpt}</p>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Article Content */}
            <div className="prose max-w-none mb-8">
              <p>{selectedArticle.content}</p>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
              <ArticleReactions
                articleId={selectedArticle.id}
                userId={testUser.id}
                isAuthenticated={true}
              />
              <SocialShare
                articleId={selectedArticle.id}
                articleTitle={selectedArticle.title}
                articleUrl={`http://localhost:3000/news/${selectedArticle.slug}`}
                userId={testUser.id}
              />
            </div>

            {/* Comments Section */}
            <ArticleComments
              articleId={selectedArticle.id}
              userId={testUser.id}
              isAuthenticated={true}
            />
          </div>
        )}

        {/* CE Points Info */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mt-8 text-white">
          <h2 className="text-xl font-bold mb-2">💰 CE Points Rewards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">10 pts</div>
              <div className="text-sm opacity-80">Social Share</div>
            </div>
            <div>
              <div className="text-2xl font-bold">5 pts</div>
              <div className="text-sm opacity-80">Copy Link</div>
            </div>
            <div>
              <div className="text-2xl font-bold">15 pts</div>
              <div className="text-sm opacity-80">Comment</div>
            </div>
            <div>
              <div className="text-2xl font-bold">3 pts</div>
              <div className="text-sm opacity-80">React/Vote</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
