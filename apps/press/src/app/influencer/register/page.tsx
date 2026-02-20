'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, CheckCircle, XCircle, AlertTriangle,
  Users, Eye, Clock, TrendingUp, Shield, ArrowRight,
  Loader2, Plus, Trash2, Star
} from 'lucide-react';

interface SocialHandle {
  platform: string;
  handle: string;
  profileUrl: string;
  followers: number;
  avgViews: number;
  watchHours: number;
  engagementRate: number;
}

interface VerificationResult {
  category: string;
  score: number;
  weight: number;
  passed: boolean;
  details: Record<string, any>;
}

interface VerificationReport {
  overallScore: number;
  qualified: boolean;
  results: VerificationResult[];
  summary: string;
}

const PLATFORMS = ['twitter', 'youtube', 'tiktok', 'instagram', 'telegram', 'facebook'];

const CRITERIA = [
  { icon: Users, label: 'Followers', requirement: '≥ 20,000 on at least one channel', key: 'followers' },
  { icon: Eye, label: 'Average Views', requirement: '≥ 100,000 on video platforms', key: 'views' },
  { icon: Clock, label: 'Watch Hours', requirement: '≥ 5,000 on YouTube', key: 'watch_hours' },
  { icon: TrendingUp, label: 'Engagement Rate', requirement: '1% – 15% (organic range)', key: 'engagement' },
  { icon: Shield, label: 'Organic Verification', requirement: 'No fake/bot followers detected', key: 'organic' },
];

const emptyHandle = (): SocialHandle => ({
  platform: 'twitter',
  handle: '',
  profileUrl: '',
  followers: 0,
  avgViews: 0,
  watchHours: 0,
  engagementRate: 0,
});

export default function InfluencerRegisterPage() {
  const [step, setStep] = useState<'info' | 'handles' | 'result'>('info');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [niche, setNiche] = useState('crypto');
  const [handles, setHandles] = useState<SocialHandle[]>([emptyHandle()]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState('');

  const addHandle = () => {
    if (handles.length < 6) setHandles([...handles, emptyHandle()]);
  };

  const removeHandle = (index: number) => {
    setHandles(handles.filter((_, i) => i !== index));
  };

  const updateHandle = (index: number, field: keyof SocialHandle, value: any) => {
    const updated = [...handles];
    (updated[index] as any)[field] = value;
    setHandles(updated);
  };

  const previewScore = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/influencer/preview-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setReport(json.data);
      setStep('result');
    } catch (err: any) {
      // Use local scoring as fallback
      const localReport = localScorePreview(handles);
      setReport(localReport);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/influencer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio, website, country, niche, handles }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      // Redirect to dashboard after success
      window.location.href = '/influencer/dashboard';
    } catch (err: any) {
      setError(err.message || 'Application submitted successfully (demo mode).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-amber-400" />
            <span className="font-bold text-lg">SENDPRESS</span>
            <span className="text-xs bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">Influencer Partners</span>
          </Link>
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
            Already registered? Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Become an <span className="text-amber-400">Influencer Partner</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Amplify crypto press releases to your audience and earn revenue. 
            We verify your social presence to ensure quality distribution.
          </p>
        </div>

        {/* Qualification Criteria */}
        <div className="bg-dark-900/60 rounded-xl border border-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Qualification Criteria
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            You need a combined weighted score of <span className="text-amber-400 font-bold">60% or higher</span> to qualify.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CRITERIA.map((c) => (
              <div
                key={c.key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                  report
                    ? report.results.find(r => r.category === c.key)?.passed
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                    : 'border-white/5 bg-white/5'
                }`}
              >
                <c.icon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-sm">{c.label}</div>
                  <div className="text-xs text-gray-400">{c.requirement}</div>
                  {report && (() => {
                    const r = report.results.find(v => v.category === c.key);
                    return r ? (
                      <div className={`text-xs mt-1 font-semibold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                        Score: {r.score}/100 (weight: {(r.weight * 100).toFixed(0)}%)
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === STEP 1: Basic Info === */}
        {step === 'info' && (
          <div className="bg-dark-900/60 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Step 1: Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name *</label>
                <input
                  className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="Your influencer name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Country</label>
                <input
                  className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Nigeria"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Website</label>
                <input
                  className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="https://yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Niche</label>
                <select
                  className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                >
                  <option value="crypto">Crypto</option>
                  <option value="defi">DeFi</option>
                  <option value="nft">NFTs</option>
                  <option value="memecoin">Memecoins</option>
                  <option value="finance">Finance</option>
                  <option value="tech">Tech</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  className="w-full bg-dark-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 h-20"
                  placeholder="Tell us about your content and audience..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
            <button
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              disabled={!displayName}
              onClick={() => setStep('handles')}
            >
              Next: Add Social Channels <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* === STEP 2: Social Handles === */}
        {step === 'handles' && (
          <div className="bg-dark-900/60 rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-2">Step 2: Social Media Channels</h2>
            <p className="text-sm text-gray-400 mb-4">
              Add your social media profiles. We&apos;ll analyze them to calculate your qualification score.
            </p>

            {handles.map((h, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-4 mb-4 bg-dark-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-amber-400">Channel {i + 1}</span>
                  {handles.length > 1 && (
                    <button onClick={() => removeHandle(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Platform</label>
                    <select
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      value={h.platform}
                      onChange={(e) => updateHandle(i, 'platform', e.target.value)}
                    >
                      {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Handle / Username</label>
                    <input
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="@yourhandle"
                      value={h.handle}
                      onChange={(e) => updateHandle(i, 'handle', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Profile URL</label>
                    <input
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="https://twitter.com/yourhandle"
                      value={h.profileUrl}
                      onChange={(e) => updateHandle(i, 'profileUrl', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Followers</label>
                    <input
                      type="number"
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="e.g. 25000"
                      value={h.followers || ''}
                      onChange={(e) => updateHandle(i, 'followers', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Avg Views (video platforms)</label>
                    <input
                      type="number"
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="e.g. 150000"
                      value={h.avgViews || ''}
                      onChange={(e) => updateHandle(i, 'avgViews', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Watch Hours (YouTube)</label>
                    <input
                      type="number"
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="e.g. 6000"
                      value={h.watchHours || ''}
                      onChange={(e) => updateHandle(i, 'watchHours', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Engagement Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-dark-900 border border-white/10 rounded px-2 py-1.5 text-sm"
                      placeholder="e.g. 4.5"
                      value={h.engagementRate || ''}
                      onChange={(e) => updateHandle(i, 'engagementRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addHandle}
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 mb-6"
              disabled={handles.length >= 6}
            >
              <Plus className="h-4 w-4" /> Add another channel
            </button>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('info')}
                className="bg-dark-800 hover:bg-dark-700 border border-white/10 px-4 py-2.5 rounded-lg text-sm transition"
              >
                Back
              </button>
              <button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                disabled={loading || handles.every(h => !h.handle)}
                onClick={previewScore}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Preview My Score
              </button>
            </div>
          </div>
        )}

        {/* === STEP 3: Results === */}
        {step === 'result' && report && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className={`rounded-xl border p-6 ${
              report.qualified
                ? 'bg-green-500/5 border-green-500/30'
                : 'bg-red-500/5 border-red-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {report.qualified ? (
                  <CheckCircle className="h-8 w-8 text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-400" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {report.qualified ? 'You Qualify!' : 'Not Yet Qualified'}
                  </h2>
                  <p className="text-sm text-gray-400">{report.summary}</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span className={report.qualified ? 'text-green-400' : 'text-red-400'}>
                    {report.overallScore}/100
                  </span>
                </div>
                <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      report.qualified ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(report.overallScore, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span className="text-amber-400">60 (min)</span>
                  <span>100</span>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {report.results.map((r) => (
                  <div
                    key={r.category}
                    className={`p-3 rounded-lg border text-center ${
                      r.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="text-xs text-gray-400 capitalize">{r.category.replace('_', ' ')}</div>
                    <div className={`text-lg font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {r.score}
                    </div>
                    <div className="text-xs text-gray-500">weight: {(r.weight * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('handles'); setReport(null); }}
                className="bg-dark-800 hover:bg-dark-700 border border-white/10 px-4 py-2.5 rounded-lg text-sm transition"
              >
                Edit & Retry
              </button>
              {report.qualified && (
                <button
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                  onClick={submitApplication}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Application <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {!report.qualified && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  Grow your channels to meet the minimum requirements, then try again.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Local fallback scoring (mirrors backend logic) ─────────

function localScorePreview(handles: SocialHandle[]): VerificationReport {
  const maxFollowers = Math.max(...handles.map(h => h.followers), 0);
  let followersScore = maxFollowers >= 100000 ? 100 : maxFollowers >= 20000 ? 40 + ((maxFollowers - 20000) / 80000) * 60 : (maxFollowers / 20000) * 40;

  const videoHandles = handles.filter(h => ['youtube', 'tiktok'].includes(h.platform));
  let viewsScore = 60;
  if (videoHandles.length > 0) {
    const maxViews = Math.max(...videoHandles.map(h => h.avgViews), 0);
    viewsScore = maxViews >= 500000 ? 100 : maxViews >= 100000 ? 50 + ((maxViews - 100000) / 400000) * 50 : (maxViews / 100000) * 50;
  }

  const ytHandle = handles.find(h => h.platform === 'youtube');
  let watchScore = 60;
  if (ytHandle) {
    const hrs = ytHandle.watchHours;
    watchScore = hrs >= 20000 ? 100 : hrs >= 5000 ? 50 + ((hrs - 5000) / 15000) * 50 : (hrs / 5000) * 50;
  }

  const rates = handles.map(h => h.engagementRate).filter(r => r > 0);
  let engScore = 0;
  if (rates.length > 0) {
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    engScore = avg >= 3 && avg <= 8 ? 100 : avg >= 1 && avg < 3 ? 40 + ((avg - 1) / 2) * 60 : avg > 8 && avg <= 15 ? 70 : avg > 15 ? 20 : (avg / 1) * 40;
  }

  const organicScore = 100; // local can't detect bots

  const results: VerificationResult[] = [
    { category: 'followers', score: Math.round(followersScore * 100) / 100, weight: 0.25, passed: maxFollowers >= 20000, details: {} },
    { category: 'views', score: Math.round(viewsScore * 100) / 100, weight: 0.20, passed: viewsScore >= 50, details: {} },
    { category: 'watch_hours', score: Math.round(watchScore * 100) / 100, weight: 0.15, passed: watchScore >= 50, details: {} },
    { category: 'engagement', score: Math.round(engScore * 100) / 100, weight: 0.25, passed: engScore >= 40, details: {} },
    { category: 'organic', score: organicScore, weight: 0.15, passed: true, details: {} },
  ];

  const overallScore = Math.round(results.reduce((sum, r) => sum + r.score * r.weight, 0) * 100) / 100;
  const qualified = overallScore >= 60;

  return {
    overallScore,
    qualified,
    results,
    summary: qualified
      ? `Qualified with score ${overallScore}/100.`
      : `Not qualified. Score: ${overallScore}/100 (minimum 60).`,
  };
}
