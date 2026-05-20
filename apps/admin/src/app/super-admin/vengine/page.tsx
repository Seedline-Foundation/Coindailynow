'use client';

import React, { useState } from 'react';

const mockVideoJobs = [
  { id: '1', title: 'BTC & Nigeria CBN Q3 2026', jobType: 'SHORT', status: 'PUBLISHED', provider: 'WAN21', duration: 60, views: 12400, likes: 890, date: '2026-05-18' },
  { id: '2', title: 'Kenya VASP: 6 Month Report', jobType: 'LONG', status: 'REVIEW', provider: 'WAN21', duration: 180, views: 0, likes: 0, date: '2026-05-19' },
  { id: '3', title: 'Jamaica Stablecoin Guide', jobType: 'SHORT', status: 'GENERATING', provider: 'COGVIDEOX', duration: 60, views: 0, likes: 0, date: '2026-05-20' },
  { id: '4', title: 'Brazil DeFi TVL Analysis', jobType: 'SOCIAL_CLIP', status: 'SCRIPTING', provider: 'WAN21', duration: 30, views: 0, likes: 0, date: '2026-05-20' },
  { id: '5', title: 'CHIMA EMAI Index Explainer', jobType: 'EXPLAINER', status: 'PENDING', provider: null, duration: 120, views: 0, likes: 0, date: '2026-05-20' },
];

const mockStats = {
  totalVideos: 234,
  publishedVideos: 198,
  totalViews: 456_000,
  totalLikes: 32_400,
  avgEngagement: 7.1,
  generationCost: 42.80,
  queueDepth: 3,
};

const providers = [
  { id: 'WAN21', name: 'Wan2.1', status: 'Active', type: 'Self-hosted', cost: 'Free', maxDuration: '15s' },
  { id: 'COGVIDEOX', name: 'CogVideoX', status: 'Active', type: 'Self-hosted', cost: 'Free', maxDuration: '10s' },
  { id: 'KLING', name: 'Kling AI', status: 'Not Configured', type: 'Cloud API', cost: '$0.05/s', maxDuration: '60s' },
  { id: 'RUNWAY', name: 'Runway ML', status: 'Not Configured', type: 'Cloud API', cost: '$0.10/s', maxDuration: '30s' },
];

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  SCRIPTING: 'bg-blue-100 text-blue-700',
  GENERATING: 'bg-yellow-100 text-yellow-700',
  COMPOSING: 'bg-purple-100 text-purple-700',
  REVIEW: 'bg-orange-100 text-orange-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function VengineDashboard() {
  const [tab, setTab] = useState<'jobs' | 'providers' | 'distribution'>('jobs');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vengine — Video Generation Pipeline</h1>
          <p className="text-sm text-gray-500">AI-powered video generation from articles — Script, Generate, Distribute</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          Generate Video
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Total Videos', value: mockStats.totalVideos, color: 'text-indigo-600' },
          { label: 'Published', value: mockStats.publishedVideos, color: 'text-green-600' },
          { label: 'Total Views', value: `${(mockStats.totalViews / 1000).toFixed(0)}K`, color: 'text-blue-600' },
          { label: 'Total Likes', value: `${(mockStats.totalLikes / 1000).toFixed(1)}K`, color: 'text-red-500' },
          { label: 'Engagement', value: `${mockStats.avgEngagement}%`, color: 'text-orange-600' },
          { label: 'Gen Cost (MTD)', value: `$${mockStats.generationCost}`, color: 'text-purple-600' },
          { label: 'Queue', value: mockStats.queueDepth, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'jobs', label: 'Video Jobs' },
          { key: 'providers', label: 'Providers' },
          { key: 'distribution', label: 'Distribution' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Video</th>
                <th className="text-left p-3 font-medium text-gray-500">Type</th>
                <th className="text-left p-3 font-medium text-gray-500">Status</th>
                <th className="text-left p-3 font-medium text-gray-500">Provider</th>
                <th className="text-right p-3 font-medium text-gray-500">Duration</th>
                <th className="text-right p-3 font-medium text-gray-500">Views</th>
                <th className="text-right p-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockVideoJobs.map(job => (
                <tr key={job.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{job.title}</td>
                  <td className="p-3 text-gray-600">{job.jobType}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>{job.status}</span>
                  </td>
                  <td className="p-3 text-gray-600">{job.provider || '—'}</td>
                  <td className="p-3 text-right text-gray-600">{job.duration}s</td>
                  <td className="p-3 text-right text-gray-600">{job.views > 0 ? job.views.toLocaleString() : '—'}</td>
                  <td className="p-3 text-right text-gray-500">{job.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border-2 p-5 ${p.status === 'Active' ? 'border-green-200' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.type}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-gray-600">
                <span>Cost: {p.cost}</span>
                <span>Max: {p.maxDuration}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { platform: 'YouTube', videos: 198, views: 234000, enabled: true },
            { platform: 'TikTok', videos: 198, views: 156000, enabled: true },
            { platform: 'Instagram Reels', videos: 150, views: 45000, enabled: true },
            { platform: 'Twitter/X', videos: 120, views: 21000, enabled: true },
          ].map(p => (
            <div key={p.platform} className="bg-white rounded-xl border p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900">{p.platform}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{p.videos} videos published</p>
                <p className="text-sm text-gray-600">{(p.views / 1000).toFixed(0)}K total views</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
