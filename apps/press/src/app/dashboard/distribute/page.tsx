'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  ArrowLeft,
  Upload,
  Globe,
  Coins,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  X,
  Loader2,
  Wand2,
  Copy,
  RotateCcw,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  fetchAvailablePartnerSites,
  fetchPublisherProfile,
  createPublisherProfile,
  createPressRelease,
  createDistribution,
} from '@/lib/api';
import type { PressSite } from '@/lib/supabase';

/**
 * Distribution Wizard — /dashboard/distribute
 *
 * Step-by-step flow for publishers to distribute a press release:
 * 1. Write / Upload content with INLINE Ollama3 AI writer + Image generation/upload
 * 2. Select target sites from the partner network
 * 3. Set budget in JOY tokens & review escrow details
 * 4. Review & launch campaign
 *
 * Features:
 * - Inline AI content generation via Ollama3 at ai.coindaily.online
 * - AI image generation + file upload for featured images
 * - 5000 word maximum on content
 * - Real-time word count
 */

const STEPS = ['Content', 'Network', 'Budget', 'Review'];
const MAX_WORDS = 5000;
const OLLAMA_API = 'https://ai.coindaily.online/api/generate';
const OLLAMA_IMAGE_API = 'https://ai.coindaily.online/api/generate-image';

interface PartnerSite {
  id: string;
  name: string;
  reach: string;
  category: string;
  price: number;
}

const AI_PROMPTS = [
  { label: 'Token Launch', prompt: 'Write a professional press release announcing a new cryptocurrency token launch on the Polygon blockchain' },
  { label: 'Partnership', prompt: 'Write a press release announcing a strategic partnership between two companies in the blockchain/fintech space' },
  { label: 'Product Update', prompt: 'Write a press release about a major product update for a crypto/blockchain platform' },
  { label: 'Market Analysis', prompt: 'Write an analytical press article about current cryptocurrency market trends in Africa' },
  { label: 'Exchange Listing', prompt: 'Write a press release announcing a new token listing on a major exchange' },
  { label: 'Community Event', prompt: 'Write a press release about an upcoming blockchain/crypto community event in Africa' },
];

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function DistributePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [partners, setPartners] = useState<PartnerSite[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');

  // AI Writer State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Image State
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImagePanel, setShowImagePanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(content);
  const isOverLimit = wordCount > MAX_WORDS;

  // ─── Load partner sites from Supabase ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const sites = await fetchAvailablePartnerSites();
        const tierPricing: Record<string, number> = { platinum: 200, gold: 120, silver: 80, bronze: 50 };
        const mapped: PartnerSite[] = sites.map(s => ({
          id: s.id,
          name: s.domain,
          reach: s.traffic_score ? `${(s.traffic_score / 1000).toFixed(0)}K` : `DH ${s.dh_score}`,
          category: s.tier || 'bronze',
          price: tierPricing[s.tier] || 50,
        }));
        setPartners(mapped);
      } catch (err) {
        console.error('Failed to load partners:', err);
      } finally {
        setPartnersLoading(false);
      }
    })();
  }, []);

  const togglePartner = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);

  const totalCost = partners.filter(p => selected.includes(p.id)).reduce((s, p) => s + p.price, 0);

  // ─── AI Content Generation ────────────────────────────────────────
  const generateWithAI = async (prompt: string) => {
    if (!prompt.trim()) return;
    setAiGenerating(true);
    setAiError('');
    try {
      const response = await fetch(OLLAMA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `${prompt}\n\nTitle: ${title || 'Untitled Press Release'}\n\nWrite in a professional press release format with an engaging headline, dateline, body paragraphs, quote from a spokesperson, and a boilerplate section. Keep the tone professional and newsworthy. Target around 800-1200 words. Format with proper paragraphs.`,
          stream: false,
        }),
      });
      if (!response.ok) throw new Error(`AI server responded with ${response.status}`);
      const data = await response.json();
      const generated = data.response || data.text || '';
      if (generated) {
        setContent(prev => prev ? prev + '\n\n' + generated : generated);
        setShowAiPanel(false);
        setAiPrompt('');
      } else {
        throw new Error('No content returned from AI');
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to connect to Ollama3 AI. Make sure ai.coindaily.online is running.');
    } finally {
      setAiGenerating(false);
    }
  };

  // ─── AI Image Generation ──────────────────────────────────────────
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageGenerating(true);
    try {
      const response = await fetch(OLLAMA_IMAGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          title: title || 'Press Release',
        }),
      });
      if (!response.ok) throw new Error(`Image API responded with ${response.status}`);
      const data = await response.json();
      if (data.image_url || data.url || data.image) {
        setFeaturedImage(data.image_url || data.url || data.image);
        setShowImagePanel(false);
        setImagePrompt('');
      }
    } catch {
      // Fallback: create a placeholder gradient image
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#f59e0b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 630);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title || 'SENDPRESS', 600, 290);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#ffffffbb';
        ctx.fillText('Press Release Featured Image', 600, 350);
        setFeaturedImage(canvas.toDataURL('image/png'));
      }
      setShowImagePanel(false);
      setImagePrompt('');
    } finally {
      setImageGenerating(false);
    }
  };

  // ─── File Upload ──────────────────────────────────────────────────
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10 MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFeaturedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleContentFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.doc,.docx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      setContent(prev => prev ? prev + '\n\n' + text : text);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Top bar */}
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5"><Send className="w-4 h-4 text-primary-500" /> New Distribution</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-primary-500 text-dark-950' : 'bg-dark-800 text-dark-500'}`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i <= step ? 'text-white' : 'text-dark-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-primary-500' : 'bg-dark-800'}`} />}
            </div>
          ))}
        </div>

        {/* ════════════ Step 0: Content + AI Writer + Image ════════════ */}
        {step === 0 && (
          <div className="space-y-6">
            {/* Title + Action Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-white">Write Your Press Release</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowImagePanel(!showImagePanel); setShowAiPanel(false); }}
                  className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 hover:border-dark-500 rounded-lg text-sm text-dark-300 hover:text-white transition-colors"
                >
                  <ImageIcon className="w-4 h-4" /> {featuredImage ? 'Change Image' : 'Add Image'}
                </button>
                <button
                  onClick={() => { setShowAiPanel(!showAiPanel); setShowImagePanel(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    showAiPanel
                      ? 'bg-purple-600 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-primary-600 text-white hover:opacity-90'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> AI Writer (Ollama3)
                </button>
              </div>
            </div>

            {/* ─── AI Writer Panel ─── */}
            {showAiPanel && (
              <div className="bg-dark-900 border border-purple-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-semibold">Ollama3 AI Content Writer</h3>
                  <span className="text-xs text-dark-500 ml-auto">Powered by ai.coindaily.online</span>
                </div>

                {/* Quick Prompts */}
                <div>
                  <p className="text-sm text-dark-400 mb-2">Quick templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {AI_PROMPTS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setAiPrompt(p.prompt)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          aiPrompt === p.prompt
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                            : 'border-dark-700 text-dark-400 hover:border-dark-500 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">Describe what you want to write about:</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="E.g. Write a press release about our new DeFi lending platform launching on Polygon, targeting African markets..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:border-purple-500 focus:outline-none resize-none text-sm"
                  />
                </div>

                {aiError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => generateWithAI(aiPrompt)}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Content</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="px-4 py-2.5 text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ─── Image Panel ─── */}
            {showImagePanel && (
              <div className="bg-dark-900 border border-blue-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">Featured Image</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-dark-600 hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-dark-500 group-hover:text-blue-400 mb-2 transition-colors" />
                    <p className="text-dark-400 group-hover:text-white text-sm font-medium transition-colors">Upload Image</p>
                    <p className="text-dark-600 text-xs mt-1">JPG, PNG, GIF, WebP &middot; Max 10 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* AI Generate */}
                  <div className="space-y-3">
                    <textarea
                      rows={2}
                      value={imagePrompt}
                      onChange={e => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want, e.g. 'Modern blockchain infographic with African map'"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:border-blue-500 focus:outline-none resize-none text-sm"
                    />
                    <button
                      onClick={generateImage}
                      disabled={imageGenerating || !imagePrompt.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {imageGenerating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4" /> Generate with AI</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                {featuredImage && (
                  <div className="relative">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg border border-dark-700"
                    />
                    <button
                      onClick={() => { setFeaturedImage(null); setImageFile(null); }}
                      className="absolute top-2 right-2 p-1.5 bg-dark-900/80 rounded-full text-dark-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowImagePanel(false)}
                  className="text-dark-400 hover:text-white text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Featured Image Preview (when panels closed) */}
            {featuredImage && !showImagePanel && (
              <div className="relative">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-40 object-cover rounded-xl border border-dark-700"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setShowImagePanel(true)}
                    className="px-2 py-1 bg-dark-900/80 rounded text-dark-300 hover:text-white text-xs transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => { setFeaturedImage(null); setImageFile(null); }}
                    className="p-1 bg-dark-900/80 rounded text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Title Input */}
            <input
              type="text"
              placeholder="Press Release Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:border-primary-500 focus:outline-none text-lg font-semibold"
            />

            {/* Content Textarea */}
            <div className="relative">
              <textarea
                placeholder="Write your press release content here, or use the AI Writer above to generate professional content..."
                rows={16}
                value={content}
                onChange={e => {
                  const newContent = e.target.value;
                  const newWordCount = countWords(newContent);
                  if (newWordCount <= MAX_WORDS + 50) {
                    setContent(newContent);
                  }
                }}
                className={`w-full bg-dark-800 border rounded-lg px-4 py-3 text-white placeholder-dark-500 focus:outline-none resize-none ${
                  isOverLimit ? 'border-red-500 focus:border-red-500' : 'border-dark-700 focus:border-primary-500'
                }`}
              />
              {/* Bottom bar with word count + upload */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleContentFileUpload}
                    className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded text-dark-400 text-xs hover:text-white hover:border-dark-500 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  {content && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(content); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded text-dark-400 text-xs hover:text-white hover:border-dark-500 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  )}
                  {content && (
                    <button
                      onClick={() => setContent('')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded text-dark-400 text-xs hover:text-red-400 hover:border-dark-500 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>
                <div className={`text-sm font-medium ${isOverLimit ? 'text-red-500' : wordCount > MAX_WORDS * 0.9 ? 'text-yellow-500' : 'text-dark-500'}`}>
                  {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
                  {isOverLimit && <span className="ml-2 text-red-400 text-xs">Over limit!</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ Step 1: Network ════════════ */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Select Partner Sites</h2>
            <p className="text-dark-400 text-sm mb-6">Choose where your press release will be published. Click to add / remove sites.</p>
            {partnersLoading ? (
              <div className="flex items-center justify-center py-12 text-dark-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading partner network…
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-12 text-dark-500">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No verified partner sites available yet.</p>
                <p className="text-xs mt-1">Partners will appear here once they register and get verified.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {partners.map(p => (
                  <button
                    key={p.id}
                    onClick={() => togglePartner(p.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selected.includes(p.id) ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                    }`}
                  >
                    <p className="text-white font-semibold">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{p.reach}</span>
                      <span className="capitalize">{p.category}</span>
                      <span className="text-primary-500 font-semibold">{p.price} JOY</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-sm text-dark-400 mt-4">{selected.length} sites selected — estimated cost: <span className="text-primary-500 font-semibold">{totalCost} JOY</span></p>
          </div>
        )}

        {/* ════════════ Step 2: Budget ════════════ */}
        {step === 2 && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Budget & Escrow</h2>
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Sites selected</span>
                <span className="text-white font-medium">{selected.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Estimated cost</span>
                <span className="text-primary-500 font-semibold">{totalCost} JOY</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-400">Platform fee (5%)</span>
                <span className="text-white">{Math.ceil(totalCost * 0.05)} JOY</span>
              </div>
              <hr className="border-dark-700" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-white">Total to Escrow</span>
                <span className="text-primary-500">{totalCost + Math.ceil(totalCost * 0.05)} JOY</span>
              </div>
            </div>
            <p className="text-xs text-dark-500">JOY tokens are locked in escrow until partners verify publication. Funds are released automatically after 48-hour verification.</p>
            <a href="https://imaswap.online" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-400 text-sm font-semibold">
              <Coins className="w-4 h-4" /> Need more JOY? Buy on ImaSwap DEX
            </a>
          </div>
        )}

        {/* ════════════ Step 3: Review ════════════ */}
        {step === 3 && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Review & Launch</h2>
            <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-3">
              {featuredImage && (
                <img src={featuredImage} alt="Featured" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <div>
                <p className="text-dark-400 text-sm">Title</p>
                <p className="text-white font-semibold">{title || '(No title)'}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Content</p>
                <p className="text-dark-300 text-sm">{wordCount} words</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Sites</p>
                <p className="text-white">{selected.map(id => partners.find(p => p.id === id)?.name || id).join(', ') || 'None selected'}</p>
              </div>
              <hr className="border-dark-700" />
              <div>
                <p className="text-dark-400 text-sm">Total Cost</p>
                <p className="text-primary-500 font-bold text-lg">{totalCost + Math.ceil(totalCost * 0.05)} JOY</p>
              </div>
            </div>
            {launchError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{launchError}</span>
              </div>
            )}
            <button
              disabled={isOverLimit || !title || !content || selected.length === 0 || launching}
              onClick={async () => {
                setLaunching(true);
                setLaunchError('');
                try {
                  // Ensure publisher profile exists
                  let publisherId = '';
                  if (user?.id) {
                    const profile = await fetchPublisherProfile(user.id);
                    if (profile) {
                      publisherId = profile.id;
                    } else {
                      const newProfile = await createPublisherProfile({
                        user_id: user.id,
                        wallet_address: user.wallet_address || '',
                        company_name: user.company_name || undefined,
                        contact_email: user.email || undefined,
                      });
                      publisherId = newProfile.id;
                    }
                  }

                  // Create press release
                  const release = await createPressRelease({
                    publisher_id: publisherId,
                    title,
                    content,
                    word_count: wordCount,
                    status: 'pending',
                    media_meta: featuredImage ? { featured_image: featuredImage } : {},
                  });

                  // Create distribution
                  await createDistribution({
                    pr_id: release.id,
                    publisher_id: publisherId,
                    target_sites: selected,
                    target_tiers: [],
                    credits_locked: totalCost + Math.ceil(totalCost * 0.05),
                    status: 'pending',
                  });

                  window.location.href = '/dashboard/campaigns';
                } catch (err: any) {
                  console.error('Launch failed:', err);
                  setLaunchError(err.message || 'Failed to launch campaign. Please try again.');
                  setLaunching(false);
                }
              }}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launching ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Launching…</>
              ) : (
                <><Send className="w-5 h-5" /> Launch Campaign</>
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-lg border border-dark-700 text-dark-300 hover:text-white hover:border-dark-500 transition-colors text-sm">
              Back
            </button>
          ) : <div />}
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && (!title || !content || isOverLimit)}
              className="px-5 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
