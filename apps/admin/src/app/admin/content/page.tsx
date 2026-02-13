/**
 * Admin Content Page
 * Content management for articles, news, and AI-generated content
 */

'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import Link from 'next/link';

// Mock articles data
const mockArticles = [
  { id: '1', title: 'Bitcoin Reaches New All-Time High', author: 'AI + Kwame', status: 'published', category: 'Bitcoin', views: 12450, isAI: true, publishedAt: '2024-01-15' },
  { id: '2', title: 'M-Pesa Crypto Integration Launch', author: 'Amina Hassan', status: 'published', category: 'Mobile Money', views: 8920, isAI: false, publishedAt: '2024-01-14' },
  { id: '3', title: 'Nigerian SEC New Regulations', author: 'AI', status: 'pending_review', category: 'Regulation', views: 0, isAI: true, publishedAt: null },
  { id: '4', title: 'Top 5 Memecoins in Africa', author: 'AI + Editor', status: 'draft', category: 'Memecoin', views: 0, isAI: true, publishedAt: null },
  { id: '5', title: 'Ethereum 2.0 Staking Guide', author: 'Chidi Okonkwo', status: 'published', category: 'Ethereum', views: 5670, isAI: false, publishedAt: '2024-01-12' },
];

export default function AdminContentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-dark-400 mt-1">Manage articles, news, and AI-generated content</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/admin/content/ai-generate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4" />
            AI Generate
          </Link>
          <Link 
            href="/admin/content/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Article
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Articles" value="2,450" icon={<FileText className="w-5 h-5" />} />
        <StatCard title="AI Generated" value="890" icon={<Bot className="w-5 h-5" />} />
        <StatCard title="Pending Review" value="23" icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Total Views" value="1.2M" icon={<Eye className="w-5 h-5" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending_review">Pending Review</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <option value="all">All Categories</option>
          <option value="Bitcoin">Bitcoin</option>
          <option value="Ethereum">Ethereum</option>
          <option value="Memecoin">Memecoin</option>
          <option value="Regulation">Regulation</option>
          <option value="Mobile Money">Mobile Money</option>
        </select>
      </div>

      {/* Articles List */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Article</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase hidden lg:table-cell">Views</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {filteredArticles.map((article) => (
              <tr key={article.id} className="hover:bg-dark-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white line-clamp-1">{article.title}</p>
                      {article.isAI && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-xs rounded">
                          <Bot className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-400 mt-1">By {article.author}</p>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="inline-flex items-center px-2 py-1 bg-dark-700 text-dark-300 text-xs rounded-full">
                    {article.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    article.status === 'published' ? 'bg-green-500/10 text-green-500' :
                    article.status === 'pending_review' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-dark-700 text-dark-400'
                  }`}>
                    {article.status === 'published' ? <Globe className="w-3 h-3" /> :
                     article.status === 'pending_review' ? <Clock className="w-3 h-3" /> :
                     <Edit className="w-3 h-3" />}
                    {article.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell text-sm text-dark-300">
                  {article.views.toLocaleString()}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-dark-400 text-sm">{title}</p>
        <div className="text-red-500">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
