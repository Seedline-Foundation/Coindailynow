/**
 * CMS Demo Page - Task 24: Content Management Interface
 * Demonstrates all CMS features and components
 */

'use client';

import React, { useState } from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { Toaster } from 'react-hot-toast';
import { ContentManagementInterface } from '../components/cms';
import { 
  CREATE_ARTICLE_MUTATION,
  GET_CATEGORIES,
  GET_WORKFLOWS,
  SUPPORTED_LANGUAGES
} from '../services/cmsService';

// Mock user
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'EDITOR'
};

// Mock GraphQL responses
const mockCategories = {
  request: {
    query: GET_CATEGORIES
  },
  result: {
    data: {
      categories: [
        { 
          id: 'cat1', 
          name: 'Market Analysis', 
          slug: 'market-analysis',
          description: 'In-depth analysis of cryptocurrency markets',
          articlesCount: 42
        },
        { 
          id: 'cat2', 
          name: 'Breaking News', 
          slug: 'breaking-news',
          description: 'Latest cryptocurrency news and updates',
          articlesCount: 128
        },
        { 
          id: 'cat3', 
          name: 'African Markets', 
          slug: 'african-markets',
          description: 'Focus on African cryptocurrency exchanges and developments',
          articlesCount: 67
        },
        { 
          id: 'cat4', 
          name: 'Memecoin Watch', 
          slug: 'memecoin-watch',
          description: 'Tracking memecoin trends and developments',
          articlesCount: 89
        }
      ]
    }
  }
};

const mockWorkflows = {
  request: {
    query: GET_WORKFLOWS,
    variables: { filter: { authorId: '1' } }
  },
  result: {
    data: {
      workflows: [
        {
          id: 'wf1',
          articleId: 'art1',
          workflowType: 'EDITORIAL',
          currentState: 'IN_REVIEW',
          previousState: 'DRAFT',
          priority: 'HIGH',
          assignedReviewerId: 'reviewer1',
          completionPercentage: 60,
          estimatedCompletionAt: new Date(Date.now() + 86400000).toISOString(),
          actualCompletionAt: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          article: {
            id: 'art1',
            title: 'Bitcoin Adoption Surges in Nigeria: M-Pesa Integration Analysis',
            status: 'IN_REVIEW',
            author: {
              id: '1',
              name: 'John Doe'
            }
          },
          assignedReviewer: {
            id: 'reviewer1',
            name: 'Jane Smith'
          },
          steps: [
            {
              id: 'step1',
              stepName: 'Content Creation',
              stepOrder: 1,
              status: 'COMPLETED',
              assigneeId: '1',
              startedAt: new Date(Date.now() - 3600000).toISOString(),
              completedAt: new Date(Date.now() - 2700000).toISOString(),
              estimatedDurationMs: 3600000,
              actualDurationMs: 2700000,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step2',
              stepName: 'Editorial Review',
              stepOrder: 2,
              status: 'IN_PROGRESS',
              assigneeId: 'reviewer1',
              startedAt: new Date(Date.now() - 1800000).toISOString(),
              completedAt: null,
              estimatedDurationMs: 1800000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step3',
              stepName: 'AI Quality Check',
              stepOrder: 3,
              status: 'PENDING',
              assigneeId: null,
              startedAt: null,
              completedAt: null,
              estimatedDurationMs: 300000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step4',
              stepName: 'Publication',
              stepOrder: 4,
              status: 'PENDING',
              assigneeId: null,
              startedAt: null,
              completedAt: null,
              estimatedDurationMs: 60000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            }
          ]
        },
        {
          id: 'wf2',
          articleId: 'art2',
          workflowType: 'EDITORIAL',
          currentState: 'DRAFT',
          previousState: null,
          priority: 'MEDIUM',
          assignedReviewerId: null,
          completionPercentage: 25,
          estimatedCompletionAt: new Date(Date.now() + 172800000).toISOString(),
          actualCompletionAt: null,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 900000).toISOString(),
          article: {
            id: 'art2',
            title: 'Dogecoin Price Surge: African Memecoin Community Reacts',
            status: 'DRAFT',
            author: {
              id: '1',
              name: 'John Doe'
            }
          },
          assignedReviewer: null,
          steps: [
            {
              id: 'step5',
              stepName: 'Content Creation',
              stepOrder: 1,
              status: 'IN_PROGRESS',
              assigneeId: '1',
              startedAt: new Date(Date.now() - 1800000).toISOString(),
              completedAt: null,
              estimatedDurationMs: 3600000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step6',
              stepName: 'Editorial Review',
              stepOrder: 2,
              status: 'PENDING',
              assigneeId: null,
              startedAt: null,
              completedAt: null,
              estimatedDurationMs: 1800000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step7',
              stepName: 'AI Quality Check',
              stepOrder: 3,
              status: 'PENDING',
              assigneeId: null,
              startedAt: null,
              completedAt: null,
              estimatedDurationMs: 300000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            },
            {
              id: 'step8',
              stepName: 'Publication',
              stepOrder: 4,
              status: 'PENDING',
              assigneeId: null,
              startedAt: null,
              completedAt: null,
              estimatedDurationMs: 60000,
              actualDurationMs: null,
              errorMessage: null,
              metadata: null
            }
          ]
        }
      ]
    }
  }
};

const mockCreateArticle = {
  request: {
    query: CREATE_ARTICLE_MUTATION,
    variables: {
      input: {
        title: 'Test Article: African Crypto Market Update',
        excerpt: 'A comprehensive overview of the latest developments in African cryptocurrency markets, including exchange updates, regulatory changes, and community growth.',
        content: 'This is test content for the demo article. The African cryptocurrency market continues to show remarkable growth...',
        categoryId: 'cat3',
        tags: ['africa', 'cryptocurrency', 'markets', 'binance', 'luno'],
        isPremium: false
      }
    }
  },
  result: {
    data: {
      createArticle: {
        id: 'art3',
        slug: 'test-article-african-crypto-market-update',
        title: 'Test Article: African Crypto Market Update',
        excerpt: 'A comprehensive overview of the latest developments in African cryptocurrency markets, including exchange updates, regulatory changes, and community growth.',
        content: 'This is test content for the demo article. The African cryptocurrency market continues to show remarkable growth...',
        status: 'DRAFT',
        isPremium: false,
        featuredImageUrl: null,
        readingTimeMinutes: 3,
        tags: ['africa', 'cryptocurrency', 'markets', 'binance', 'luno'],
        category: {
          id: 'cat3',
          name: 'African Markets'
        },
        author: {
          id: '1',
          name: 'John Doe'
        },
        workflowStatus: {
          currentStep: 'DRAFT',
          assignedReviewer: null,
          lastAction: 'CREATED',
          actionDate: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  }
};

export default function CMSDemo() {
  const [mode, setMode] = useState<'create' | 'edit' | 'dashboard'>('create');
  const [currentArticleId, setCurrentArticleId] = useState<string>('');

  // Mock collaborators
  const mockCollaborators = [
    {
      id: '2',
      name: 'Jane Smith',
      lastSeen: new Date(Date.now() - 120000) // 2 minutes ago
    },
    {
      id: '3',
      name: 'Bob Johnson', 
      lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: '4',
      name: 'Alice Brown',
      lastSeen: new Date(Date.now() - 1800000) // 30 minutes ago
    }
  ];

  const handleAutoSave = (data: any) => {
    console.log('Auto-saved draft:', data);
    // Show a simple alert instead of toast
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.textContent = 'Auto-saved draft';
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md z-50';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 2000);
    }
  };

  const handleRequestTranslation = (languages: string[]) => {
    console.log('Translation requested for languages:', languages);
    // Show a simple alert instead of toast
    if (typeof window !== 'undefined') {
      const notification = document.createElement('div');
      notification.textContent = `Translation requested for ${languages.length} languages`;
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Demo Controls */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                CMS Demo - Task 24
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Content Management Interface with workflow management, multi-language support, and collaboration features
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
              >
                <option value="create">Create Article</option>
                <option value="edit">Edit Article</option>
                <option value="dashboard">Dashboard</option>
              </select>

              {mode === 'edit' && (
                <input
                  type="text"
                  placeholder="Article ID"
                  value={currentArticleId}
                  onChange={(e) => setCurrentArticleId(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Features */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
              Article Creation & Editing
            </h3>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Rich text editor with markdown support</li>
              <li>• Auto-save functionality</li>
              <li>• Media upload and management</li>
              <li>• Form validation and error handling</li>
              <li>• Reading time calculation</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
              Workflow Management
            </h3>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Status tracking and progress indicators</li>
              <li>• Review assignment and approval</li>
              <li>• Multi-step workflow automation</li>
              <li>• Priority management</li>
              <li>• Error handling and retry logic</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">
              Collaboration & Translation
            </h3>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Real-time collaboration indicators</li>
              <li>• Comment threads and resolution</li>
              <li>• 15+ African languages support</li>
              <li>• AI-powered translation requests</li>
              <li>• Cultural adaptation features</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CMS Interface */}
      <MockedProvider 
        mocks={[mockCategories, mockWorkflows, mockCreateArticle]} 
        addTypename={false}
      >
        <Toaster position="top-right" />
        <ContentManagementInterface
          user={mockUser}
          mode={mode}
          {...(mode === 'edit' && currentArticleId ? { articleId: currentArticleId } : {})}
          onAutoSave={handleAutoSave}
          onRequestTranslation={handleRequestTranslation}
          collaborators={mockCollaborators}
          enableRealTimeCollaboration={true}
        />
      </MockedProvider>

      {/* Demo Info Footer */}
      <div className="bg-gradient-to-r from-orange-50 to-secondary-50 dark:from-orange-900/20 dark:to-secondary-900/20 border-t border-orange-200 dark:border-orange-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              🚀 Task 24: Content Management Interface - Complete!
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">
              Professional CMS with African-focused features, workflow management, and collaboration tools.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
                <span className="text-neutral-600 dark:text-neutral-400">Article Editor</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span className="text-neutral-600 dark:text-neutral-400">Workflow Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-secondary-500 rounded-full"></div>
                <span className="text-neutral-600 dark:text-neutral-400">Multi-Language Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-neutral-600 dark:text-neutral-400">Collaboration Features</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}