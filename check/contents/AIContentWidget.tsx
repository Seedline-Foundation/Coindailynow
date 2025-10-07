'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, Filter, Sparkles } from 'lucide-react';

interface AIContentWidgetProps {
  userId?: string;
  showAdvanced?: boolean;
}

interface PersonalizedContent {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
  readTime: number;
  publishedAt: Date;
  trending: boolean;
  tags: string[];
}

export default function AIContentWidget({ userId, showAdvanced = false }: AIContentWidgetProps) {
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  const loadPersonalizedContent = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use our AI recommendation engine
      const response = await fetch('/api/ai/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId || 'anonymous',
          limit: 6,
          includePersonalization: true 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedContent(data.recommendations || []);
      } else {
        // Fallback to mock data
        setPersonalizedContent(getMockPersonalizedContent());
      }
    } catch (error) {
      console.error('Failed to load personalized content:', error);
      setPersonalizedContent(getMockPersonalizedContent());
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (aiEnabled) {
      loadPersonalizedContent();
    }
  }, [userId, aiEnabled, loadPersonalizedContent]);

  const getMockPersonalizedContent = (): PersonalizedContent[] => [
    {
      id: '1',
      title: 'Bitcoin ETF Approval Sparks Institutional Interest',
      category: 'Breaking News',
      relevanceScore: 0.95,
      readTime: 4,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      trending: true,
      tags: ['bitcoin', 'etf', 'institutional']
    },
    {
      id: '2',
      title: 'Top 5 DeFi Protocols to Watch in 2025',
      category: 'DeFi',
      relevanceScore: 0.87,
      readTime: 6,
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      trending: false,
      tags: ['defi', 'protocols', 'yield']
    },
    {
      id: '3',
      title: 'Memecoin Market Analysis: PEPE vs DOGE',
      category: 'Memecoins',
      relevanceScore: 0.82,
      readTime: 3,
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      trending: true,
      tags: ['memecoins', 'analysis', 'trading']
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
          </div>
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Recommendations
          </h3>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
        
        <div className="flex items-center space-x-2">
          {showAdvanced && (
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`p-1 rounded ${
                aiEnabled 
                  ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20' 
                  : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={loadPersonalizedContent}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {personalizedContent.map((content) => (
          <div
            key={content.id}
            className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                    {content.title}
                  </h4>
                  {content.trending && (
                    <TrendingUp className="w-3 h-3 text-red-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                    {content.category}
                  </span>
                  <span>{content.readTime} min read</span>
                  <span>{formatTimeAgo(content.publishedAt)}</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {(content.relevanceScore * 100).toFixed(0)}% match
                  </span>
                </div>
                
                {showAdvanced && content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded dark:bg-gray-700 dark:text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="ml-2 flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${
                  content.relevanceScore > 0.9 ? 'bg-green-500' :
                  content.relevanceScore > 0.8 ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {showAdvanced && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Powered by AI Content Engine</span>
            <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              Customize →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
