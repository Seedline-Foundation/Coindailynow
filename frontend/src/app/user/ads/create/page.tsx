'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

type AdType = 'image' | 'animated_image' | 'html5' | 'rich_media' | 'video' | 'video_preroll' | 'video_outstream' | 'article' | 'post' | 'comment';

type FormState = {
  title: string;
  description: string;
  targetUrl: string;
  adType: AdType;
  totalBudget: number;
  bidAmount: number;
  startDate: string;
  endDate: string;
  rotationStrategy: 'optimized' | 'random' | 'sequential' | 'even' | 'weighted' | 'pacing';
  pacingMode: 'even' | 'asap' | 'dayparting';
  sections: string;
  regions: string;
  languages: string;
  devices: string;
  newsletterAllowed: boolean;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

export default function CreateAdvertiserCampaignPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const nextMonth = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    targetUrl: '',
    adType: 'image',
    totalBudget: 1000,
    bidAmount: 2,
    startDate: today,
    endDate: nextMonth,
    rotationStrategy: 'optimized',
    pacingMode: 'even',
    sections: 'news,markets',
    regions: 'NG,KE,ZA,GH',
    languages: 'en',
    devices: 'mobile,desktop,tablet',
    newsletterAllowed: true,
  });

  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativeUrl, setCreativeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ campaignId: string } | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadCreative = async (): Promise<{ url: string; mimeType?: string; fileSizeBytes?: number } | null> => {
    if (!creativeFile) return null;

    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('creative', creativeFile);
      fd.append('adType', form.adType);

      const res = await fetch(`${apiBase()}/api/ads/creative/upload`, {
        method: 'POST',
        body: fd,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error?.message || 'Creative upload failed');
      }

      const uploadedUrl = payload?.data?.creativeUrl;
      setCreativeUrl(uploadedUrl);
      return {
        url: uploadedUrl,
        mimeType: payload?.data?.mimeType,
        fileSizeBytes: payload?.data?.fileSizeBytes,
      };
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.title || !form.targetUrl) {
      setError('Title and target URL are required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCreativeUrl = creativeUrl;
      let uploadedMeta: { mimeType?: string; fileSizeBytes?: number } = {};

      if (!finalCreativeUrl && creativeFile) {
        const uploaded = await uploadCreative();
        if (!uploaded) throw new Error('Creative upload failed');
        finalCreativeUrl = uploaded.url;
        uploadedMeta = uploaded;
      }

      if (!finalCreativeUrl) {
        throw new Error('Please upload a creative file or provide an existing creative URL.');
      }

      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const advertiserId = parsedUser?.id || parsedUser?.userId || parsedUser?.email || 'demo-advertiser';
      const advertiserName = parsedUser?.name || parsedUser?.fullName || 'CoinDaily Advertiser';

      const campaignPayload = {
        advertiserId,
        advertiserName,
        adType: form.adType,
        creativeUrl: finalCreativeUrl,
        title: form.title,
        description: form.description,
        targetUrl: form.targetUrl,
        totalBudget: Number(form.totalBudget),
        bidAmount: Number(form.bidAmount),
        rotationStrategy: form.rotationStrategy,
        pacingMode: form.pacingMode,
        targeting: {
          sections: form.sections.split(',').map((s) => s.trim()).filter(Boolean),
          regions: form.regions.split(',').map((s) => s.trim()).filter(Boolean),
          languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
          devices: form.devices.split(',').map((s) => s.trim()).filter(Boolean),
          newsletterAllowed: form.newsletterAllowed,
        },
        scheduling: {
          startDate: form.startDate,
          endDate: form.endDate,
          timezone: 'Africa/Lagos',
        },
        creativeSpec: {
          mimeType: uploadedMeta.mimeType,
          fileSizeBytes: uploadedMeta.fileSizeBytes,
          format: uploadedMeta.mimeType?.split('/')[1],
          durationSec: form.adType.includes('video') ? 30 : undefined,
          aspectRatio: form.adType.includes('video') ? '16:9' : undefined,
          skipOffsetSec: form.adType === 'video_preroll' ? 5 : undefined,
          sandboxed: form.adType === 'rich_media' || form.adType === 'html5' ? true : undefined,
        },
      };

      const validateRes = await fetch(`${apiBase()}/api/ads/creative/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload),
      });
      const validatePayload = await validateRes.json();
      if (!validateRes.ok || !validatePayload?.data?.valid) {
        const details = validatePayload?.data?.errors?.join('; ') || validatePayload?.error?.message || 'Creative validation failed';
        throw new Error(details);
      }

      const createRes = await fetch(`${apiBase()}/api/ads/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload),
      });
      const createPayload = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createPayload?.error?.message || 'Campaign creation failed');
      }

      setSuccess({ campaignId: createPayload?.data?.id || 'created' });
    } catch (err: any) {
      setError(err?.message || 'Unable to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/user/ads" className="inline-flex items-center gap-2 text-dark-300 hover:text-white text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Ads Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
          <p className="text-dark-400 text-sm">Upload creative, configure targeting, and submit for admin review.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Campaign submitted successfully: {success.campaignId}. It is now pending admin approval.</span>
        </div>
      )}

      <form onSubmit={submit} className="bg-dark-900 border border-dark-700 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-dark-300">Campaign Title</label>
            <input className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-dark-300">Ad Type</label>
            <select className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.adType} onChange={(e) => update('adType', e.target.value as AdType)}>
              <option value="image">Image</option>
              <option value="animated_image">Animated Image</option>
              <option value="html5">HTML5</option>
              <option value="rich_media">Rich Media</option>
              <option value="video">Video</option>
              <option value="video_preroll">Video Pre-roll</option>
              <option value="video_outstream">Video Outstream</option>
              <option value="article">Article</option>
              <option value="post">Post</option>
              <option value="comment">Comment</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-dark-300">Description</label>
          <textarea className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div>
          <label className="text-sm text-dark-300">Target URL</label>
          <input type="url" className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.targetUrl} onChange={(e) => update('targetUrl', e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-dark-300">Total Budget ($)</label>
            <input type="number" min={1} className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.totalBudget} onChange={(e) => update('totalBudget', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-dark-300">Bid Amount ($ CPM)</label>
            <input type="number" min={0.1} step="0.1" className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.bidAmount} onChange={(e) => update('bidAmount', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-dark-300">Pacing Mode</label>
            <select className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.pacingMode} onChange={(e) => update('pacingMode', e.target.value as FormState['pacingMode'])}>
              <option value="even">Even</option>
              <option value="asap">ASAP</option>
              <option value="dayparting">Dayparting</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-dark-300">Start Date</label>
            <input type="date" className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-dark-300">End Date</label>
            <input type="date" className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-dark-300">Sections (comma-separated)</label>
            <input className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.sections} onChange={(e) => update('sections', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-dark-300">Regions (comma-separated)</label>
            <input className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.regions} onChange={(e) => update('regions', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-dark-300">Languages</label>
            <input className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.languages} onChange={(e) => update('languages', e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-dark-300">Devices</label>
            <input className="mt-1 w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-white" value={form.devices} onChange={(e) => update('devices', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-dark-700 bg-dark-800/50 px-4 py-3">
          <label className="text-sm text-dark-300">Allow Newsletter Placement</label>
          <input type="checkbox" checked={form.newsletterAllowed} onChange={(e) => update('newsletterAllowed', e.target.checked)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-dark-300">Creative Upload</label>
          <div className="flex flex-col md:flex-row gap-3">
            <input type="file" onChange={(e) => setCreativeFile(e.target.files?.[0] || null)} className="w-full text-sm text-dark-300" />
            <button
              type="button"
              onClick={() => uploadCreative()}
              disabled={!creativeFile || uploading}
              className="px-4 py-2 rounded-lg bg-dark-800 border border-dark-600 text-dark-200 hover:text-white disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
          {creativeUrl && <p className="text-xs text-green-400 break-all">Uploaded: {creativeUrl}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit Campaign for Review
          </button>
        </div>
      </form>
    </div>
  );
}
