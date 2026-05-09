'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

/* ── Types ───────────────────────────────────────────────────────────── */
type RegCountry = {
  code: string;
  name: string;
  status: string;
  lastUpdate: string;
  summary: string;
  exchanges?: string[];
  keyDocs?: string[];
};

type RegEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventType: string;
  impactScore: number;
  details: string;
};

/* ── Status colour helpers ───────────────────────────────────────────── */
const statusColors: Record<string, { bg: string; text: string; fill: string }> = {
  Regulated:    { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  fill: '#22c55e' },
  Evolving:     { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', fill: '#eab308' },
  Cautious:     { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', fill: '#f97316' },
  Restricted:   { bg: 'bg-red-100 dark:bg-red-900/40',     text: 'text-red-700 dark:text-red-300',     fill: '#ef4444' },
  Unregulated:  { bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-600 dark:text-gray-400',   fill: '#9ca3af' },
  'WAEMU Rules':{ bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   fill: '#3b82f6' },
};

function statusStyle(s: string) {
  return statusColors[s] || statusColors['Unregulated'];
}

/* ── SVG map coordinates (simplified centroids for African countries) ─ */
const countryPositions: Record<string, { cx: number; cy: number }> = {
  MA: { cx: 140, cy: 115 }, EG: { cx: 310, cy: 120 },
  SN: { cx: 80, cy: 205 },  CI: { cx: 120, cy: 235 },
  GH: { cx: 145, cy: 230 }, NG: { cx: 185, cy: 225 },
  AO: { cx: 215, cy: 340 }, UG: { cx: 315, cy: 265 },
  KE: { cx: 340, cy: 270 }, TZ: { cx: 325, cy: 305 },
  MZ: { cx: 325, cy: 370 }, ZA: { cx: 275, cy: 415 },
};

/* ── API helper ──────────────────────────────────────────────────────── */
function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

/* ── Page Component ──────────────────────────────────────────────────── */
export default function RegulatoryMapPage() {
  const [countries, setCountries] = useState<RegCountry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents] = useState<RegEvent[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitForm, setSubmitForm] = useState({ title: '', details: '', sourceUrl: '' });
  const [submitMsg, setSubmitMsg] = useState('');

  /* ── Fetch countries ───────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/regulations/countries`);
        const json = await res.json();
        setCountries(json.data || []);
      } catch {
        setCountries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Fetch events when a country is selected ───────────────────────── */
  useEffect(() => {
    if (!selected) { setEvents([]); return; }
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/regulations/${selected}/events`);
        const json = await res.json();
        setEvents(json.data || []);
      } catch {
        setEvents([]);
      }
    })();
  }, [selected]);

  const filteredCountries = useMemo(() => {
    if (filter === 'All') return countries;
    return countries.filter(c => c.status === filter);
  }, [countries, filter]);

  const selectedCountry = countries.find(c => c.code === selected);

  /* ── Submit regulatory update ──────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!selected || !submitForm.title || !submitForm.details) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/regulations/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: selected, ...submitForm }),
      });
      if (res.ok) { setSubmitMsg('Submission received — under review.'); setSubmitForm({ title: '', details: '', sourceUrl: '' }); }
      else { const j = await res.json().catch(() => null); setSubmitMsg(j?.error?.message || 'Submission failed.'); }
    } catch { setSubmitMsg('Network error.'); }
    finally { setSubmitting(false); }
  };

  /* ── Status legend entries ─────────────────────────────────────────── */
  const statuses = ['All', 'Regulated', 'Evolving', 'Cautious', 'Restricted', 'Unregulated', 'WAEMU Rules'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/" className="hover:text-yellow-500">Home</Link> <span className="mx-1">/</span>
            <Link href="/tools" className="hover:text-yellow-500">Tools</Link> <span className="mx-1">/</span>
            <span className="text-gray-900 dark:text-white">Regulatory Map</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Africa Crypto Regulatory Passport</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Interactive map of cryptocurrency regulation across Africa. Click a country to view details, events, and licensing requirements.</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === s ? 'bg-yellow-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}>
              {s !== 'All' && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: statusStyle(s).fill }} />}
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── SVG Map ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regulatory Status Map</h2>
            <svg viewBox="0 0 450 480" className="w-full" role="img" aria-label="Africa crypto regulation map">
              {/* Simplified Africa outline */}
              <path d="M140,50 Q200,20 310,70 Q360,100 370,160 Q380,220 350,250 Q340,290 350,330 Q340,400 300,440 Q270,470 250,460 Q230,440 210,390 Q200,370 190,350 Q170,300 160,260 Q140,230 100,220 Q70,210 60,190 Q50,170 60,140 Q80,90 140,50 Z" fill="none" stroke="#e5e7eb" strokeWidth="1.5" className="dark:stroke-gray-700" />

              {filteredCountries.map(c => {
                const pos = countryPositions[c.code];
                if (!pos) return null;
                const style = statusStyle(c.status);
                const isSelected = selected === c.code;
                return (
                  <g key={c.code} onClick={() => setSelected(c.code)} className="cursor-pointer">
                    <circle cx={pos.cx} cy={pos.cy} r={isSelected ? 18 : 14} fill={style.fill} opacity={isSelected ? 0.95 : 0.75}
                      stroke={isSelected ? '#fff' : 'transparent'} strokeWidth={isSelected ? 3 : 0}
                      className="transition-all duration-200 hover:opacity-100" />
                    <text x={pos.cx} y={pos.cy + 1} textAnchor="middle" dominantBaseline="middle"
                      className="text-[10px] font-bold fill-white pointer-events-none select-none">{c.code}</text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-600 dark:text-gray-400">
              {Object.entries(statusColors).map(([label, s]) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Country detail panel ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 max-h-[700px] overflow-y-auto">
            {!selectedCountry ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                <p className="font-medium">Select a Country</p>
                <p className="text-sm mt-1">Click on the map or use the list below.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCountry.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(selectedCountry.status).bg} ${statusStyle(selectedCountry.status).text}`}>{selectedCountry.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedCountry.summary}</p>
                <p className="text-xs text-gray-400 mb-4">Last updated: {selectedCountry.lastUpdate}</p>

                {/* Exchanges */}
                {selectedCountry.exchanges && selectedCountry.exchanges.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Available Exchanges</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCountry.exchanges.map(e => (
                        <span key={e} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Documents */}
                {selectedCountry.keyDocs && selectedCountry.keyDocs.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Documents</h4>
                    <ul className="space-y-1">
                      {selectedCountry.keyDocs.map(d => (
                        <li key={d} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timeline / Events */}
                {events.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Regulatory Events</h4>
                    <div className="space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                      {events.slice(0, 10).map(ev => (
                        <div key={ev.id} className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <p className="text-xs text-gray-400">{new Date(ev.eventDate).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.title || ev.eventType}</p>
                          {ev.details && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ev.details}</p>}
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${ev.impactScore >= 7 ? 'bg-red-100 text-red-700' : ev.impactScore >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>Impact: {ev.impactScore}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit update button */}
                <button onClick={() => setShowSubmit(!showSubmit)}
                  className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                  {showSubmit ? 'Cancel' : '📝 Submit a Regulatory Update'}
                </button>

                {showSubmit && (
                  <div className="mt-3 space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <input type="text" placeholder="Title (min 5 chars)" value={submitForm.title}
                      onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <textarea placeholder="Details (min 20 chars)" rows={3} value={submitForm.details}
                      onChange={e => setSubmitForm(f => ({ ...f, details: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <input type="url" placeholder="Source URL (optional)" value={submitForm.sourceUrl}
                      onChange={e => setSubmitForm(f => ({ ...f, sourceUrl: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    <button onClick={handleSubmit} disabled={submitting}
                      className="px-4 py-2 bg-yellow-500 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-yellow-600">
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    {submitMsg && <p className="text-xs text-green-600 dark:text-green-400">{submitMsg}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Country list table ──────────────────────────────────────────── */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Countries</h2>
            <a href={`${apiBase()}/api/v1/regulations/export.csv`} target="_blank" rel="noopener"
              className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </a>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">Loading regulatory data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Country</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Last Updated</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Exchanges</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCountries.map(c => (
                    <tr key={c.code} onClick={() => setSelected(c.code)}
                      className={`cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 ${selected === c.code ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{c.name} <span className="text-xs text-gray-400">({c.code})</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle(c.status).bg} ${statusStyle(c.status).text}`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{c.lastUpdate}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{c.exchanges?.join(', ') || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{c.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Comparison cards ────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Most Regulated</h3>
            <div className="mt-2 space-y-2">
              {countries.filter(c => c.status === 'Regulated').slice(0, 3).map(c => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Evolving / Cautious</h3>
            <div className="mt-2 space-y-2">
              {countries.filter(c => ['Evolving', 'Cautious'].includes(c.status)).slice(0, 4).map(c => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Restricted / Unregulated</h3>
            <div className="mt-2 space-y-2">
              {countries.filter(c => ['Restricted', 'Unregulated'].includes(c.status)).slice(0, 4).map(c => (
                <div key={c.code} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusStyle(c.status).fill }} />
                  <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
