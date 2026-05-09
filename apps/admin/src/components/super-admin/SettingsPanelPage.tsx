'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, CheckCircle } from 'lucide-react';

// ─── Field definitions per settings page ─────────────────────────────────────
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'toggle' | 'select';
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

const PAGE_FIELDS: Record<string, FieldDef[]> = {
  general: [
    { key: 'platformName', label: 'Platform Name', type: 'text', placeholder: 'CoinDaily', helpText: 'The display name of the platform.' },
    { key: 'platformDescription', label: 'Platform Description', type: 'textarea', placeholder: "Africa's premier crypto news platform", helpText: 'Short description shown in meta tags and footers.' },
    { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle', helpText: 'Put the site into read-only maintenance mode.' },
    { key: 'itemsPerPage', label: 'Items Per Page (default)', type: 'number', placeholder: '20', helpText: 'Default pagination size for lists.' },
  ],
  security: [
    { key: 'sessionTimeout', label: 'Session Timeout (minutes)', type: 'number', placeholder: '60', helpText: 'Idle minutes before the session expires.' },
    { key: 'maxLoginAttempts', label: 'Max Login Attempts', type: 'number', placeholder: '5', helpText: 'Failed attempts before temporary lock-out.' },
    { key: 'enforce2FA', label: 'Enforce 2FA for All Admins', type: 'toggle', helpText: 'Require two-factor auth for every admin account.' },
    { key: 'passwordMinLength', label: 'Minimum Password Length', type: 'number', placeholder: '8', helpText: 'Characters required for new passwords.' },
  ],
  api: [
    { key: 'backendUrl', label: 'Backend URL', type: 'text', placeholder: 'http://localhost:4000', helpText: 'Base URL that the frontend proxies to.' },
    { key: 'rateLimitPerMinute', label: 'Global Rate Limit (req/min)', type: 'number', placeholder: '100', helpText: 'Max API requests per IP per minute.' },
    { key: 'allowedOrigins', label: 'Allowed CORS Origins', type: 'textarea', placeholder: 'https://coindaily.africa\nhttps://app.coindaily.africa', helpText: 'One origin per line. Empty = all origins allowed.' },
    { key: 'apiVersion', label: 'API Version', type: 'text', placeholder: 'v1', helpText: 'Current API version identifier.' },
  ],
  localization: [
    {
      key: 'defaultLanguage', label: 'Default Language', type: 'select',
      options: ['en', 'fr', 'sw', 'yo', 'ha', 'ig', 'zu', 'ar'],
      helpText: 'Fallback language when user preference is unknown.',
    },
    { key: 'timezone', label: 'Server Timezone', type: 'text', placeholder: 'Africa/Lagos', helpText: 'IANA timezone used for timestamps.' },
    {
      key: 'dateFormat', label: 'Date Format', type: 'select',
      options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      helpText: 'Display format for dates across the UI.',
    },
    { key: 'currency', label: 'Default Currency', type: 'text', placeholder: 'NGN', helpText: 'ISO 4217 currency code used as default.' },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PanelMetric { label: string; value: string | number; }
interface PanelData { metrics: PanelMetric[]; updatedAt: string; }

interface SettingsPanelPageProps {
  page: 'general' | 'security' | 'api' | 'localization';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SettingsPanelPage({
  page,
  title,
  description,
  icon: Icon,
  accentClass = 'text-blue-400',
}: SettingsPanelPageProps) {
  const [panelData, setPanelData] = useState<PanelData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const fields = useMemo(() => PAGE_FIELDS[page] ?? [], [page]);

  const token = () =>
    typeof window !== 'undefined' ? localStorage.getItem('super_admin_token') || '' : '';

  // Load live stats (metrics)
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const res = await fetch(`/api/super-admin/panel-data/settings/${page}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
      const json = await res.json();
      setPanelData(json.data);
    } catch (err: any) {
      setStatsError(err?.message || 'Unable to load stats');
    } finally {
      setLoadingStats(false);
    }
  };

  // Load saved settings from DB
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch(`/api/super-admin/panel-settings/${page}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) return; // silently keep defaults
      const json = await res.json();
      if (json.success && json.saved) {
        setFormValues(prev => ({ ...prev, ...json.saved }));
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, [page]);

  const handleChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/super-admin/panel-settings/${page}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(formValues),
      });
      const json = await res.json();
      if (json.success) {
        setSaveStatus('success');
        setSaveMessage(json.message || 'Settings saved');
      } else {
        setSaveStatus('error');
        setSaveMessage(json.error || 'Save failed');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err?.message || 'Network error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const renderField = (field: FieldDef) => {
    const value = formValues[field.key] ?? '';

    if (field.type === 'toggle') {
      const isOn = value === 'true';
      return (
        <button
          type="button"
          onClick={() => handleChange(field.key, isOn ? 'false' : 'true')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isOn ? 'bg-blue-600' : 'bg-gray-600'
          }`}
          aria-pressed={isOn}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      );
    }

    if (field.type === 'select') {
      return (
        <select
          value={value}
          onChange={e => handleChange(field.key, e.target.value)}
          className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— select —</option>
          {(field.options ?? []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={e => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
        />
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={e => handleChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icon className={`h-8 w-8 ${accentClass}`} />
            <span>{title}</span>
          </h1>
          <p className="text-gray-400 mt-1">{description}</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchSettings(); }}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Live Stats */}
      {statsError ? (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{statsError}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loadingStats
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-5 animate-pulse h-20" />
              ))
            : (panelData?.metrics ?? []).map((m, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                  <p className="text-sm text-gray-400">{m.label}</p>
                  <p className="text-xl font-bold text-white mt-1 truncate">{m.value}</p>
                </div>
              ))}
        </div>
      )}

      {/* Editable Settings Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full bg-current ${accentClass}`} />
          Configure {title}
        </h2>

        {loadingSettings ? (
          <div className="space-y-4">
            {fields.map(f => (
              <div key={f.key} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
                <div className="h-10 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {fields.map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-200">{field.label}</label>
                  {field.type === 'toggle' && (
                    <span className={`text-xs ${formValues[field.key] === 'true' ? 'text-green-400' : 'text-gray-500'}`}>
                      {formValues[field.key] === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
                {renderField(field)}
                {field.helpText && (
                  <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save Button + Status */}
        <div className="mt-7 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || loadingSettings}
            className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
              saving
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>

          {saveStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              {saveMessage}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400 text-sm">{saveMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
