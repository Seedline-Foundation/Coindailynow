'use client';

import React, { useState } from 'react';
import { User, AdminUserControls, WritingToolFeatures } from '../../types/user';

interface WritingToolProps {
  user: User;
  adminControls: AdminUserControls;
  features: WritingToolFeatures;
}

export default function WritingTool({ user, adminControls, features }: WritingToolProps) {
  const [activeEditor, setActiveEditor] = useState<'article' | 'video' | null>(null);
  const [articleData, setArticleData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'followers' | 'premium',
    scheduledPublish: false,
    publishDate: ''
  });
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);

  const isEnabled = adminControls.writingTool.enabled;
  const canCreateArticles = adminControls.writingTool.canCreateArticles;
  const canCreateVideos = adminControls.writingTool.canCreateVideos;
  const canUseAIAssist = adminControls.writingTool.canUseAIAssist;
  const requiresApproval = adminControls.writingTool.requiresApproval;
  const maxArticlesPerDay = adminControls.writingTool.maxArticlesPerDay;

  if (!isEnabled) {
    return <WritingToolRestricted />;
  }

  const handleSaveDraft = () => {
    const draft = {
      id: Date.now().toString(),
      ...articleData,
      savedAt: new Date(),
      type: activeEditor
    };
    setDrafts(prev => [...prev, draft]);
    // Auto-save logic would go here
  };

  const handlePublish = async () => {
    if (requiresApproval) {
      // Submit for approval
      console.log('Submitting for admin approval');
    } else {
      // Publish immediately
      console.log('Publishing article');
    }
  };

  const handleAIAssist = async () => {
    if (!canUseAIAssist) return;
    
    setIsAIAssisting(true);
    try {
      // Mock AI suggestions
      const suggestions = [
        "Consider adding more data-driven insights",
        "Include recent market trends for better context",
        "Add relevant cryptocurrency statistics",
        "Improve SEO with trending keywords"
      ];
      setAISuggestions(suggestions);
    } catch (error) {
      console.error('AI assist error:', error);
    } finally {
      setIsAIAssisting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Writing Tool
          </h1>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-green-800 dark:text-green-400">
                  Writing Access Enabled
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">
                  You can create {maxArticlesPerDay} articles per day
                  {requiresApproval && ' • Content requires admin approval'}
                </div>
              </div>
              <div className="text-2xl text-green-600">✓</div>
            </div>
          </div>
        </div>

        {!activeEditor ? (
          <WritingToolDashboard
            user={user}
            drafts={drafts}
            canCreateArticles={canCreateArticles}
            canCreateVideos={canCreateVideos}
            maxArticlesPerDay={maxArticlesPerDay}
            onStartArticle={() => setActiveEditor('article')}
            onStartVideo={() => setActiveEditor('video')}
          />
        ) : activeEditor === 'article' ? (
          <ArticleEditor
            articleData={articleData}
            setArticleData={setArticleData}
            features={features}
            canUseAIAssist={canUseAIAssist}
            requiresApproval={requiresApproval}
            isAIAssisting={isAIAssisting}
            aiSuggestions={aiSuggestions}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onAIAssist={handleAIAssist}
            onBack={() => setActiveEditor(null)}
          />
        ) : (
          <VideoEditor
            features={features}
            requiresApproval={requiresApproval}
            onBack={() => setActiveEditor(null)}
          />
        )}
      </div>
    </div>
  );
}

// Writing Tool Restricted Component
function WritingToolRestricted() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✏️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Writing Tool Access Restricted
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have access to the writing tool. Contact an administrator to request access.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
          Request Access
        </button>
      </div>
    </div>
  );
}

// Writing Tool Dashboard
function WritingToolDashboard({
  user,
  drafts,
  canCreateArticles,
  canCreateVideos,
  maxArticlesPerDay,
  onStartArticle,
  onStartVideo
}: {
  user: User;
  drafts: any[];
  canCreateArticles: boolean;
  canCreateVideos: boolean;
  maxArticlesPerDay: number;
  onStartArticle: () => void;
  onStartVideo: () => void;
}) {
  const articlesToday = 0; // This would come from API

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canCreateArticles && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Write Article
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create crypto news articles
                </p>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Articles today: {articlesToday} / {maxArticlesPerDay}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(articlesToday / maxArticlesPerDay) * 100}%` }}
                ></div>
              </div>
            </div>
            <button
              onClick={onStartArticle}
              disabled={articlesToday >= maxArticlesPerDay}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
            >
              {articlesToday >= maxArticlesPerDay ? 'Daily Limit Reached' : 'Start Writing'}
            </button>
          </div>
        )}

        {canCreateVideos && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Create Video
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload and edit video content
                </p>
              </div>
            </div>
            <button
              onClick={onStartVideo}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              Create Video
            </button>
          </div>
        )}
      </div>

      {/* Drafts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Drafts
        </h3>
        {drafts.length > 0 ? (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div key={draft.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {draft.title || 'Untitled Draft'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Saved {new Date(draft.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-4xl mb-4 block">📄</span>
            <p>No drafts yet. Start writing to save your work automatically.</p>
          </div>
        )}
      </div>

      {/* Published Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Published Articles
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <span className="text-4xl mb-4 block">📰</span>
          <p>No published articles yet. Create your first article to get started.</p>
        </div>
      </div>
    </div>
  );
}

// Article Editor Component
function ArticleEditor({
  articleData,
  setArticleData,
  features,
  canUseAIAssist,
  requiresApproval,
  isAIAssisting,
  aiSuggestions,
  onSaveDraft,
  onPublish,
  onAIAssist,
  onBack
}: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Editor Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            {canUseAIAssist && (
              <button
                onClick={onAIAssist}
                disabled={isAIAssisting}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm"
              >
                {isAIAssisting ? '🤖 AI Thinking...' : '🤖 AI Assist'}
              </button>
            )}
            <button
              onClick={onSaveDraft}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Save Draft
            </button>
            <button
              onClick={onPublish}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              {requiresApproval ? 'Submit for Approval' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* Main Editor */}
        <div className="lg:col-span-3 space-y-4">
          <input
            type="text"
            placeholder="Article Title..."
            value={articleData.title}
            onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
            className="w-full text-2xl font-bold border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
          
          <textarea
            placeholder="Start writing your article..."
            value={articleData.content}
            onChange={(e) => setArticleData({ ...articleData, content: e.target.value })}
            className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">
                🤖 AI Suggestions
              </h4>
              <ul className="space-y-1">
                {aiSuggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-sm text-purple-700 dark:text-purple-300">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Publishing Options */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Publishing</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  value={articleData.visibility}
                  onChange={(e) => setArticleData({ ...articleData, visibility: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="premium">Premium Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={articleData.category}
                  onChange={(e) => setArticleData({ ...articleData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
                >
                  <option value="">Select Category</option>
                  <option value="bitcoin">Bitcoin</option>
                  <option value="altcoins">Altcoins</option>
                  <option value="defi">DeFi</option>
                  <option value="nft">NFT</option>
                  <option value="trading">Trading</option>
                </select>
              </div>

              {features.publishing.schedulePublish && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scheduled"
                    checked={articleData.scheduledPublish}
                    onChange={(e) => setArticleData({ ...articleData, scheduledPublish: e.target.checked })}
                  />
                  <label htmlFor="scheduled" className="text-sm text-gray-700 dark:text-gray-300">
                    Schedule for later
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* SEO */}
          {features.articleEditor.seoOptimization && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">SEO</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>Title length: {articleData.title.length}/60</div>
                <div>Content length: {articleData.content.length} words</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Video Editor Component
function VideoEditor({ features, requiresApproval, onBack }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Video Editor</h2>
      </div>

      <div className="text-center py-12">
        <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🎥</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Video Editor Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload and edit video content with our advanced video editor.
        </p>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
          Upload Video
        </button>
      </div>
    </div>
  );
}
