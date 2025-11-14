/**
 * Categories Management Page
 * Manage content categories and taxonomy
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  FolderTree,
  Tag,
  FileText,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronDown,
  Save,
  X
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  parentName?: string;
  isActive: boolean;
  articleCount: number;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalArticles: 0,
    avgArticlesPerCategory: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  useEffect(() => {
    fetchCategories();
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/super-admin/content/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: '',
      isActive: true,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setShowAddModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId || '',
      isActive: category.isActive,
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
      seoKeywords: category.seoKeywords?.join(', ') || '',
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('super_admin_token');
      const isEdit = showEditModal && selectedCategory;
      const url = isEdit 
        ? `/api/super-admin/content/categories/${selectedCategory.id}`
        : '/api/super-admin/content/categories';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedCategory(null);
        fetchCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`/api/super-admin/content/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-700/30 transition-colors">
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <span className="w-4" />}
              <Folder className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">{category.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-400">
            {category.slug}
          </td>
          <td className="px-6 py-4 text-sm text-gray-300">
            {category.parentName || '-'}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-white">{category.articleCount}</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              category.isActive 
                ? 'bg-green-500/20 text-green-400 border border-green-500' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500'
            }`}>
              {category.isActive ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Inactive
                </>
              )}
            </span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && category.children?.map(child => 
          renderCategoryRow(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FolderTree className="h-8 w-8 text-blue-400" />
            <span>Categories</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage content categories and taxonomy
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCategories}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleAddCategory}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Categories</p>
              <p className="text-2xl font-bold text-white">{stats.totalCategories}</p>
            </div>
            <Folder className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Categories</p>
              <p className="text-2xl font-bold text-white">{stats.activeCategories}</p>
            </div>
            <Eye className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Articles</p>
              <p className="text-2xl font-bold text-white">{stats.totalArticles}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Articles/Category</p>
              <p className="text-2xl font-bold text-white">{stats.avgArticlesPerCategory.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {categories.filter(c => !c.parentId).map(category => 
                  renderCategoryRow(category)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {showAddModal ? 'Add New Category' : 'Edit Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Bitcoin News"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., bitcoin-news"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Category description..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Parent Category</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => !c.parentId).map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>SEO Settings</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="SEO optimized title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">SEO Description</label>
                      <textarea
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        rows={2}
                        placeholder="SEO meta description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">SEO Keywords (comma separated)</label>
                      <input
                        type="text"
                        value={formData.seoKeywords}
                        onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{showAddModal ? 'Create' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
