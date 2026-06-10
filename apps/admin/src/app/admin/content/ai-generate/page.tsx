/**
 * Admin AI Content Generation Page
 * Configure and queue automated article generation using local LLM agents
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { fetchArticles, generateAIArticle } from '@/lib/api';

export default function AIGeneratePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  // Form states
  const [topic, setTopic] = useState('');
  const [categoryName, setCategoryName] = useState('General');
  const [tone, setTone] = useState('informative');
  const [targetLength, setTargetLength] = useState(800);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchArticles({ limit: 1 });
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Topic is required for generating an AI article.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await generateAIArticle({
        topic: topic.trim(),
        category: categoryName,
        tone,
        targetLength: Number(targetLength),
        language,
      });

      setSuccess(res);
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue AI article generation');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/content" className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors border border-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-500" />
            AI Content Generator
          </h1>
          <p className="text-gray-400 mt-1">Configure and queue automated AI article generation</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      {success ? (
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Generation Queued!</h2>
            <p className="text-gray-400 mt-1 text-sm max-w-md mx-auto">
              Your article about &ldquo;{topic}&rdquo; is currently being compiled by the AI content writer agent.
            </p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-750 rounded-lg p-4 max-w-sm mx-auto text-left text-xs font-mono space-y-1.5 text-gray-300">
            <div><span className="text-purple-400">Task ID:</span> {success.data?.taskId || 'Pending'}</div>
            <div><span className="text-purple-400">Article ID:</span> {success.data?.articleId || 'Pending'}</div>
            <div><span className="text-purple-400">Status:</span> QUEUED</div>
            <div><span className="text-purple-400">Engine:</span> llama-3.1-8b</div>
          </div>

          <div className="flex gap-3 justify-center pt-2 max-w-xs mx-auto">
            <button 
              onClick={() => {
                setSuccess(null);
                setTopic('');
              }} 
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm border border-gray-700"
            >
              Generate Another
            </button>
            <Link 
              href="/admin/content" 
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg text-sm text-center"
            >
              Back to Articles
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Article Topic or Prompt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Ethereum Pectra Upgrade Details and Expected Impacts"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-shadow"
              />
              <p className="text-xs text-gray-500 mt-1">Be specific to get a more structured and coherent article draft.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                </label>
                {loadingCategories ? (
                  <div className="flex items-center text-sm text-gray-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading categories...
                  </div>
                ) : (
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="General">General</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tone of Voice
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="informative">Informative / Educational</option>
                  <option value="professional">Professional / Editorial</option>
                  <option value="analytical">Analytical / Technical</option>
                  <option value="casual">Casual / Conversational</option>
                  <option value="bullish">Bullish / Optimistic</option>
                  <option value="bearish">Bearish / Cautious</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Target Word Count
                </label>
                <input
                  type="number"
                  min={200}
                  max={3000}
                  step={50}
                  value={targetLength}
                  onChange={(e) => setTargetLength(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                  <option value="pt">Portuguese (pt)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Link href="/admin/content" className="flex-1 px-4 py-2.5 border border-gray-700 hover:bg-gray-800 text-gray-300 font-semibold rounded-lg text-center transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Queue AI Generation
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
