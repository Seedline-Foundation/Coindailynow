'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PanelMetric {
  label: string;
  value: string | number;
}

interface PanelHighlight {
  label: string;
  value: string;
}

interface PanelData {
  title: string;
  description: string;
  metrics: PanelMetric[];
  highlights: PanelHighlight[];
  updatedAt: string;
}

interface FunctionalPanelPageProps {
  section: string;
  page: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass?: string;
}

export default function FunctionalPanelPage({
  section,
  page,
  title,
  description,
  icon: Icon,
  accentClass = 'text-blue-400',
}: FunctionalPanelPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<PanelData | null>(null);

  const endpoint = useMemo(() => `/api/super-admin/panel-data/${section}/${page}`, [section, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to fetch panel data');
      }

      const payload = await response.json();
      setPanelData(payload.data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load panel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icon className={`h-8 w-8 ${accentClass}`} />
            <span>{title}</span>
          </h1>
          <p className="text-gray-400 mt-1">{description}</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-gray-300">Loading panel data...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-red-300">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(panelData?.metrics || []).map((metric, index) => (
              <div key={`${metric.label}-${index}`} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                <p className="text-sm text-gray-400">{metric.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Live Insights</h2>
            {(panelData?.highlights || []).length === 0 ? (
              <p className="text-gray-400">No additional highlights available for this panel.</p>
            ) : (
              <div className="space-y-2">
                {panelData?.highlights.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex items-start justify-between gap-3 py-2 border-b border-gray-700 last:border-b-0">
                    <p className="text-gray-200">{item.label}</p>
                    <p className="text-gray-400 text-sm text-right">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">Updated: {panelData?.updatedAt ? new Date(panelData.updatedAt).toLocaleString() : 'N/A'}</p>
        </>
      )}
    </div>
  );
}
