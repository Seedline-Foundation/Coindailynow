'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Globe,
  Tag,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/**
 * Submit Press Release — /dashboard/submit
 *
 * Standalone form that POSTs to the backend's /api/v1/press/releases endpoint.
 * After submission the release enters 'pending_review' status and the user is
 * redirected to /dashboard/status to track progress.
 *
 * Flow: submit → pay → approve → publish → distribute
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const CATEGORIES = [
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFTs' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'memecoin', label: 'Memecoin / Token' },
  { value: 'general', label: 'General' },
];

const REGIONS = [
  { value: '', label: 'Global' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'ghana', label: 'Ghana' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'africa', label: 'Africa (General)' },
];

const PACKAGES = [
  { id: 'starter', name: 'Starter', price: 199, sites: 50 },
  { id: 'professional', name: 'Professional', price: 499, sites: 200 },
  { id: 'enterprise', name: 'Enterprise', price: 999, sites: 500 },
];

export default function SubmitPressReleasePage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'general',
    region: '',
    tags: '',
    packageId: 'starter',
    boostLevel: 'standard',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.summary || !form.body) {
      setError('Title, summary, and body are required.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const token = session?.access_token || '';
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Step 1: Create the release
      const createRes = await fetch(`${API_URL}/api/v1/press/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          body: form.body,
          category: form.category,
          region: form.region || null,
          tags,
          packageId: form.packageId,
          boostLevel: form.boostLevel,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(
          err.error?.message || `Server responded with ${createRes.status}`
        );
      }

      const { data: release } = await createRes.json();

      // Step 2: Submit for review
      const submitRes = await fetch(
        `${API_URL}/api/v1/press/releases/${release.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(
          err.error?.message || 'Failed to submit for review'
        );
      }

      // Step 3: Redirect to checkout for the selected package
      router.push(`/dashboard/checkout/${release.id}?package=${form.packageId}`);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPkg = PACKAGES.find((p) => p.id === form.packageId) || PACKAGES[0];

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="border-b border-dark-800 bg-dark-900">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-dark-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-dark-600">/</span>
          <span className="text-white font-semibold text-sm flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-500" /> Submit Press
            Release
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Submit a Press Release
          </h1>
          <p className="text-dark-400 text-sm">
            Fill in your press release details below. After submission it will be
            reviewed by our team before distribution.
          </p>
        </div>

        {/* Flow indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { label: 'Submit', active: true },
            { label: 'Pay', active: false },
            { label: 'Review', active: false },
            { label: 'Publish', active: false },
            { label: 'Distribute', active: false },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.active
                    ? 'bg-primary-500 text-dark-950'
                    : 'bg-dark-800 text-dark-500'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs ${
                  step.active ? 'text-white' : 'text-dark-500'
                }`}
              >
                {step.label}
              </span>
              {i < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    step.active ? 'bg-primary-500' : 'bg-dark-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              Headline / Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. FinBridge Launches DeFi Lending on Polygon"
              required
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-lg font-semibold"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              Summary / Lede *
            </label>
            <textarea
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="One-paragraph summary that appears in the wire feed..."
              required
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              Full Body *
            </label>
            <textarea
              rows={12}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Full press release content..."
              required
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            />
            <p className="text-dark-500 text-xs mt-1">
              {form.body.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Category + Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Region
              </label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-dark-300 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. defi, polygon, lending, africa"
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>

          {/* Distribution Package */}
          <div>
            <label className="block text-sm text-dark-300 mb-2">
              Distribution Package
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setForm({ ...form, packageId: pkg.id })}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    form.packageId === pkg.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 bg-dark-900 hover:border-dark-600'
                  }`}
                >
                  <p className="text-white font-semibold">{pkg.name}</p>
                  <p className="text-primary-500 font-bold text-lg mt-1">
                    ${pkg.price}
                  </p>
                  <p className="text-dark-500 text-xs mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {pkg.sites}+ sites
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-2">
            <h3 className="text-white font-semibold mb-3">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Package</span>
              <span className="text-white font-medium">{selectedPkg.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Distribution Sites</span>
              <span className="text-white">{selectedPkg.sites}+</span>
            </div>
            <hr className="border-dark-700" />
            <div className="flex justify-between text-base font-bold">
              <span className="text-white">Total</span>
              <span className="text-primary-500">${selectedPkg.price} USD</span>
            </div>
            <p className="text-dark-500 text-xs">
              Payment via YellowCard (fiat) or JOY tokens on Polygon.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.title || !form.summary || !form.body}
            className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-dark-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Submit & Proceed to Payment
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
