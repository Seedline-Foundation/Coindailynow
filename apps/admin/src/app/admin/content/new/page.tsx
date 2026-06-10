/**
 * Admin New Article Page
 * Create custom articles for the CoinDaily platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Save, FileText } from 'lucide-react';
import Link from 'next/link';
import { fetchArticles, createArticle } from '@/lib/api';

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [publishScheduledAt, setPublishScheduledAt] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchArticles({ limit: 1 });
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
          setCategoryId(res.categories[0].id); // Default to first category
        }
      } catch (err) {
        console.error('Failed to load categories', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim() || !content.trim() || !categoryId) {
      setError('Please fill in all required fields (Title, Excerpt, Content, and Category).');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Process tags (comma-separated list)
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      await createArticle({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        categoryId,
        tags,
        isPremium,
        featuredImageUrl: featuredImageUrl.trim() || undefined,
        publishScheduledAt: publishScheduledAt ? new Date(publishScheduledAt).toISOString() : undefined,
      });

      router.push('/admin/content');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/content" className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Article</h1>
          <p className="text-gray-400 mt-1">Compose and publish standard editorial content</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter article title..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Excerpt / Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Provide a brief summary of the article..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-shadow resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Content (HTML Supported) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={15}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write article content here..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-shadow resize-y"
                />
              </div>
            </div>
          </div>

          {/* Sidebar controls */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <FileText className="w-5 h-5 text-red-500" />
                Settings
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                {loadingCategories ? (
                  <div className="flex items-center text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading categories...
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Bitcoin, Regulation, DeFi"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Schedule Publishing
                </label>
                <input
                  type="datetime-local"
                  value={publishScheduledAt}
                  onChange={(e) => setPublishScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-red-500/50 focus:ring-offset-gray-900 focus:ring-2 focus:ring-offset-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Premium Content</p>
                    <p className="text-xs text-gray-500">Requires subscription to access</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/content" className="flex-1 px-4 py-2.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg text-center transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || loadingCategories}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
