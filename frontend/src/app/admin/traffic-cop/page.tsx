'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/* ── Types ───────────────────────────────────────────────────────────── */
type DayStats = { day: string; total: number; ivt: number; ivtPct: number };
type TrafficEvent = {
  ts: string; ip: string; ua: string; fp: string | null;
  path: string | null; ref: string | null; ivtScore: number; categories: string[];
};
type Alert = { level: 'warning' | 'critical'; message: string; day: string };

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function authHeaders(): Record<string, string> {
  const token = getCookie('token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

/* ── Mini bar chart ──────────────────────────────────────────────────── */
function BarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 text-gray-400 text-xs truncate">{d.label}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }} />
          </div>
          <span className="text-xs font-mono text-gray-300 w-12 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function TrafficCopDashboard() {
  const [todayStats, setTodayStats] = useState<DayStats | null>(null);
  const [rangeStats, setRangeStats] = useState<DayStats[]>([]);
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const headers = authHeaders();
    try {
      const [statsRes, rangeRes, eventsRes, alertsRes] = await Promise.all([
        fetch(`${apiBase()}/api/v1/traffic/stats?day=${todayKey()}`, { headers }),
        fetch(`${apiBase()}/api/v1/traffic/stats/range?from=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)}&to=${todayKey()}`, { headers }),
        fetch(`${apiBase()}/api/v1/traffic/events?day=${todayKey()}&limit=50`, { headers }),
        fetch(`${apiBase()}/api/v1/traffic/alerts`, { headers }),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setTodayStats({ day: s.day, total: s.total, ivt: s.ivt, ivtPct: s.ivtPct });
        setCategories(s.categories || {});
      }
      if (rangeRes.ok) { const r = await rangeRes.json(); setRangeStats(r.data || []); }
      if (eventsRes.ok) { const e = await eventsRes.json(); setEvents(e.data || []); }
      if (alertsRes.ok) { const a = await alertsRes.json(); setAlerts(a.data || []); }
    } catch { /* endpoint may require auth */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 60_000); return () => clearInterval(t); }, [fetchAll]);

  const ivtPct = todayStats ? todayStats.ivtPct : 0;
  const savedAdSpend = todayStats ? Math.round(todayStats.ivt * 0.045 * 100) / 100 : 0; // est $0.045/impression

  const catBarData = Object.entries(categories).map(([k, v]) => ({
    label: k.replace(/_/g, ' '),
    value: v,
    color: k.includes('headless') || k.includes('automation') ? 'bg-red-500' : k.includes('datacenter') ? 'bg-orange-500' : 'bg-yellow-500',
  })).sort((a, b) => b.value - a.value);
  const catMax = catBarData.length > 0 ? Math.max(...catBarData.map(d => d.value)) : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <nav className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-yellow-500">Home</Link> <span className="mx-1">/</span>
        <Link href="/admin" className="hover:text-yellow-500">Admin</Link> <span className="mx-1">/</span>
        <span className="text-white">Traffic Cop</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Traffic Cop — Bot Detection & Ad Fraud Protection</h1>

      {loading && <p className="text-gray-500">Loading traffic data...</p>}

      {/* ── Alerts banner ────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`px-4 py-3 rounded-lg text-sm font-medium ${a.level === 'critical' ? 'bg-red-900/40 border border-red-700 text-red-300' : 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'}`}>
              {a.level === 'critical' ? '🚨' : '⚠️'} {a.message}
            </div>
          ))}
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase">Total Impressions</p>
          <p className="text-3xl font-bold mt-1">{todayStats?.total?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Today</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase">Invalid Traffic (IVT)</p>
          <p className={`text-3xl font-bold mt-1 ${ivtPct > 15 ? 'text-red-400' : ivtPct > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
            {ivtPct.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{todayStats?.ivt?.toLocaleString() || 0} bot impressions</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase">Ad Spend Saved</p>
          <p className="text-3xl font-bold mt-1 text-green-400">${savedAdSpend.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Blocked bot ad impressions</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase">Detection Categories</p>
          <p className="text-3xl font-bold mt-1">{Object.keys(categories).length}</p>
          <p className="text-xs text-gray-500 mt-1">Active bot signatures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ── 7-day trend ────────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">7-Day Traffic Trend</h3>
          {rangeStats.length > 0 ? (
            <div className="space-y-2">
              {rangeStats.map(d => (
                <div key={d.day} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-gray-500 text-xs">{d.day.slice(5)}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden relative">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${d.total > 0 ? 100 : 0}%` }} />
                    <div className="h-full bg-red-500 rounded-full absolute top-0 left-0" style={{ width: `${d.ivtPct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-300 w-16 text-right">{d.total}</span>
                  <span className={`text-xs font-mono w-14 text-right ${d.ivtPct > 15 ? 'text-red-400' : d.ivtPct > 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {d.ivtPct.toFixed(1)}%
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600" /> Total</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" /> IVT</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No data yet. Traffic telemetry will appear here.</p>
          )}
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Bot Category Breakdown</h3>
          {catBarData.length > 0 ? (
            <BarChart data={catBarData} maxVal={catMax} />
          ) : (
            <p className="text-gray-600 text-sm">No bot categories detected today.</p>
          )}
        </div>
      </div>

      {/* ── Recent IVT events ────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Recent Bot Events</h3>
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="py-2 px-3 text-left">Time</th>
                  <th className="py-2 px-3 text-left">IP</th>
                  <th className="py-2 px-3 text-left">Path</th>
                  <th className="py-2 px-3 text-left">Score</th>
                  <th className="py-2 px-3 text-left">Categories</th>
                  <th className="py-2 px-3 text-left">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {events.filter(e => e.ivtScore >= 30).slice(0, 30).map((e, i) => (
                  <tr key={i} className="hover:bg-gray-800/50">
                    <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{new Date(e.ts).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 font-mono">{e.ip}</td>
                    <td className="py-2 px-3 text-gray-400 max-w-[150px] truncate">{e.path || '/'}</td>
                    <td className="py-2 px-3">
                      <span className={`font-bold ${e.ivtScore >= 70 ? 'text-red-400' : e.ivtScore >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>{e.ivtScore}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {e.categories.map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px]">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-500 max-w-[200px] truncate">{e.ua}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No bot events recorded today.</p>
        )}
      </div>
    </div>
  );
}
