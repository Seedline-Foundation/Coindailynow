'use client';

import React, { useState } from 'react';

const countries = [
  { code: 'NG', name: 'Nigeria', region: 'WEST_AFRICA', status: 'REGULATED', riskScore: 62, lastUpdated: '2026-05-18' },
  { code: 'KE', name: 'Kenya', region: 'EAST_AFRICA', status: 'REGULATED', riskScore: 68, lastUpdated: '2026-05-19' },
  { code: 'ZA', name: 'South Africa', region: 'SOUTHERN_AFRICA', status: 'REGULATED', riskScore: 78, lastUpdated: '2026-05-17' },
  { code: 'GH', name: 'Ghana', region: 'WEST_AFRICA', status: 'DEVELOPING', riskScore: 55, lastUpdated: '2026-05-15' },
  { code: 'BR', name: 'Brazil', region: 'LATIN_AMERICA', status: 'REGULATED', riskScore: 75, lastUpdated: '2026-05-20' },
  { code: 'SV', name: 'El Salvador', region: 'LATIN_AMERICA', status: 'LEGAL_TENDER', riskScore: 90, lastUpdated: '2026-05-20' },
  { code: 'JM', name: 'Jamaica', region: 'CARIBBEAN', status: 'DEVELOPING', riskScore: 55, lastUpdated: '2026-05-16' },
  { code: 'BS', name: 'Bahamas', region: 'CARIBBEAN', status: 'REGULATED', riskScore: 72, lastUpdated: '2026-05-18' },
  { code: 'AE', name: 'UAE', region: 'MIDDLE_EAST', status: 'REGULATED', riskScore: 92, lastUpdated: '2026-05-20' },
  { code: 'SG', name: 'Singapore', region: 'ASIA_PACIFIC', status: 'REGULATED', riskScore: 90, lastUpdated: '2026-05-19' },
  { code: 'EG', name: 'Egypt', region: 'NORTH_AFRICA', status: 'RESTRICTED', riskScore: 30, lastUpdated: '2026-05-14' },
  { code: 'ET', name: 'Ethiopia', region: 'EAST_AFRICA', status: 'RESTRICTED', riskScore: 25, lastUpdated: '2026-05-10' },
  { code: 'AR', name: 'Argentina', region: 'LATIN_AMERICA', status: 'DEVELOPING', riskScore: 52, lastUpdated: '2026-05-18' },
  { code: 'MX', name: 'Mexico', region: 'LATIN_AMERICA', status: 'REGULATED', riskScore: 70, lastUpdated: '2026-05-17' },
  { code: 'KY', name: 'Cayman Islands', region: 'CARIBBEAN', status: 'REGULATED', riskScore: 85, lastUpdated: '2026-05-19' },
];

const statusColors: Record<string, string> = {
  REGULATED: 'bg-green-100 text-green-700',
  DEVELOPING: 'bg-yellow-100 text-yellow-700',
  RESTRICTED: 'bg-red-100 text-red-700',
  LEGAL_TENDER: 'bg-blue-100 text-blue-700',
  UNREGULATED: 'bg-gray-100 text-gray-700',
};

export default function RegulatoryIntelPage() {
  const [regionFilter, setRegionFilter] = useState('ALL');

  const filtered = regionFilter === 'ALL'
    ? countries
    : countries.filter(c => c.region === regionFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regulatory Intelligence HQ</h1>
          <p className="text-sm text-gray-500">40-country regulatory database — change detection, risk scoring, alerts</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Run Full Scan
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Countries Tracked', value: 40, color: 'text-blue-600' },
          { label: 'Sources Monitored', value: 200, color: 'text-indigo-600' },
          { label: 'Avg Risk Score', value: 58.7, color: 'text-orange-600' },
          { label: 'Material Changes (30d)', value: 12, color: 'text-red-600' },
          { label: 'Pending Alerts', value: 3, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Region Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'WEST_AFRICA', 'EAST_AFRICA', 'SOUTHERN_AFRICA', 'NORTH_AFRICA', 'CARIBBEAN', 'LATIN_AMERICA', 'MIDDLE_EAST', 'ASIA_PACIFIC'].map(r => (
          <button key={r} onClick={() => setRegionFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${regionFilter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Countries Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Country</th>
              <th className="text-left p-3 font-medium text-gray-500">Region</th>
              <th className="text-left p-3 font-medium text-gray-500">Status</th>
              <th className="text-left p-3 font-medium text-gray-500">Risk Score</th>
              <th className="text-left p-3 font-medium text-gray-500">Last Updated</th>
              <th className="text-right p-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => b.riskScore - a.riskScore).map(c => (
              <tr key={c.code} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <span className="font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({c.code})</span>
                </td>
                <td className="p-3 text-gray-600 text-xs">{c.region.replace(/_/g, ' ')}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || statusColors.DEVELOPING}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.riskScore >= 70 ? 'bg-green-500' : c.riskScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${c.riskScore}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{c.riskScore}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500">{c.lastUpdated}</td>
                <td className="p-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline">View Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
