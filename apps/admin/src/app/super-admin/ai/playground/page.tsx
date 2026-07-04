'use client';

/**
 * /super-admin/ai/playground — live test surface for self-hosted models.
 *
 * Status cards (6): Ollama (DeepSeek R1) / SDXL / NLLB-200 / Coqui / Iengine / fal.ai
 * Tabs (5): LLM / SDXL Image / Translation / Iengine Image / Voice
 *
 * Every endpoint calls the same code path the production agents use, so
 * green here = production works.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, XCircle, RefreshCw,
  Brain, ImageIcon, Mic2, Play, Activity, Languages, Wand2,
} from 'lucide-react';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Tab = 'llm' | 'sdxl' | 'translate' | 'iengine' | 'voice';

interface ServiceStatus {
  name?: string;
  ok: boolean;
  status?: number;
  latencyMs: number;
  error?: string;
  hint?: string;
  code?: string;
  url?: string;
  defaultModel?: string;
  installedModels?: string[];
  configured?: boolean;
}

interface StatusPayload {
  services: {
    ollama: ServiceStatus;
    sdxl: ServiceStatus;
    nllb: ServiceStatus;
    coqui: ServiceStatus;
    iengine: ServiceStatus;
    fal: ServiceStatus;
  };
  env: Record<string, string>;
}

export default function AIPlaygroundPage() {
  const [tab, setTab] = useState<Tab>('llm');
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const headers = useMemo<Record<string, string>>(() => {
    const t = getAccessToken();
    const h: Record<string, string> = {};
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  }, []);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/status`, { headers });
      if (r.ok) setStatus(await r.json());
    } finally {
      setStatusLoading(false);
    }
  }, [headers]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  return (
    <div className="p-6 space-y-4 text-gray-100">
      <Link href="/super-admin" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-400">
        <ChevronLeft className="h-4 w-4" /> Super Admin
      </Link>

      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-400" /> AI Playground
          </h1>
          <p className="text-sm text-gray-400">
            Live test surface for the self-hosted stack. Every call uses the same code paths the production agents use.
          </p>
        </div>
        <button
          onClick={refreshStatus}
          disabled={statusLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          {statusLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh status
        </button>
      </header>

      {/* Status row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatusCard label="Ollama (DeepSeek R1)" svc={status?.services.ollama} extra={status?.services.ollama?.defaultModel} />
        <StatusCard label="SDXL (port 7860)" svc={status?.services.sdxl} extra="custom FastAPI" />
        <StatusCard label="NLLB-200 (Translate)" svc={status?.services.nllb} extra="port 8080" />
        <StatusCard label="Coqui XTTS (Voice)" svc={status?.services.coqui} extra="port 5002" />
        <StatusCard label="Iengine (Image bridge)" svc={status?.services.iengine} />
        <StatusCard label="fal.ai (Cloud video)" svc={status?.services.fal} extra={status?.services.fal?.configured ? 'API key set' : 'no API key'} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-gray-700">
        {([
          { id: 'llm', label: 'LLM (DeepSeek R1)', icon: Brain },
          { id: 'sdxl', label: 'SDXL', icon: Wand2 },
          { id: 'translate', label: 'Translate (NLLB)', icon: Languages },
          { id: 'iengine', label: 'Iengine', icon: ImageIcon },
          { id: 'voice', label: 'Voice (Coqui)', icon: Mic2 },
        ] as { id: Tab; label: string; icon: any }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </nav>

      {tab === 'llm' && <OllamaTab headers={headers} installedModels={status?.services.ollama?.installedModels || []} defaultModel={status?.services.ollama?.defaultModel || 'deepseek-r1:8b'} />}
      {tab === 'sdxl' && <SDXLTab headers={headers} />}
      {tab === 'translate' && <NLLBTab headers={headers} />}
      {tab === 'iengine' && <IengineTab headers={headers} />}
      {tab === 'voice' && <VoiceTab headers={headers} />}
    </div>
  );
}

function StatusCard({ label, svc, extra }: { label: string; svc?: ServiceStatus; extra?: string }) {
  if (!svc) return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-sm text-gray-500 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> checking…</div>
    </div>
  );
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-gray-400 truncate" title={label}>{label}</div>
        {svc.ok ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
      </div>
      <div className="mt-1 text-sm font-medium">
        <span className={svc.ok ? 'text-green-300' : 'text-red-300'}>{svc.ok ? 'Online' : 'Offline'}</span>
        <span className="ml-2 text-xs text-gray-500">{svc.latencyMs}ms</span>
      </div>
      {extra && <div className="mt-1 text-[11px] text-gray-500 truncate" title={extra}>{extra}</div>}
      {svc.error && <div className="mt-1 text-[11px] text-red-400" title={svc.error}>{svc.code ? <span className="font-mono mr-1">[{svc.code}]</span> : null}{svc.error}</div>}
      {svc.hint && <div className="mt-0.5 text-[10px] text-amber-300">{svc.hint}</div>}
      {svc.url && <div className="mt-1 text-[10px] font-mono text-gray-600 truncate" title={svc.url}>{svc.url}</div>}
    </div>
  );
}

// ─── Ollama / DeepSeek R1 tab ────────────────────────────────────────────

function OllamaTab({ headers, installedModels, defaultModel }: { headers: Record<string, string>; installedModels: string[]; defaultModel: string }) {
  const [prompt, setPrompt] = useState('Write a 30-word teaser for an article about Nigerian crypto regulation.');
  const [model, setModel] = useState(defaultModel);
  const [temperature, setTemperature] = useState(0.4);
  const [result, setResult] = useState<{ response: string; durationMs: number; tokens?: { prompt?: number; output?: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setModel(defaultModel), [defaultModel]);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/ollama/chat`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, temperature }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.hint ? `${j.error} — ${j.hint}` : (j.error || `HTTP ${r.status}`));
      setResult(j);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-400">Hosted on Contabo via Ollama (port 11434). Default model: <span className="font-mono text-indigo-300">{defaultModel}</span>.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="block text-xs text-gray-400">
          Model
          <select value={model} onChange={e => setModel(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            <option value={defaultModel}>{defaultModel} (default)</option>
            {installedModels.filter(m => m !== defaultModel).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-400">
          Temperature: <span className="font-mono">{temperature.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.05} value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="mt-1 w-full" />
        </label>
        <button onClick={run} disabled={loading || !prompt.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
        </button>
      </div>
      <label className="block text-xs text-gray-400">
        Prompt
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-mono text-gray-200" />
      </label>

      {error && <div className="rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300"><AlertCircle className="inline h-4 w-4 mr-1" /> {error}</div>}

      {result && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {result.durationMs}ms</span>
            {result.tokens && <span className="font-mono">in: {result.tokens.prompt ?? '?'} · out: {result.tokens.output ?? '?'}</span>}
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-200">{result.response}</pre>
        </div>
      )}
    </section>
  );
}

// ─── SDXL tab ────────────────────────────────────────────────────────────

function SDXLTab({ headers }: { headers: Record<string, string> }) {
  const [prompt, setPrompt] = useState('Editorial photo of Lagos financial district at dawn, dramatic lighting, photojournalism, ultra detailed');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted');
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(768);
  const [steps, setSteps] = useState(25);
  const [guidanceScale, setGuidanceScale] = useState(7);
  const [result, setResult] = useState<{ url: string; durationMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Live elapsed counter while generating, so users know it's not stuck
  useEffect(() => {
    if (!loading) { setElapsedSec(0); return; }
    const start = Date.now();
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/sdxl/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, negativePrompt, width, height, steps, guidanceScale }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.hint ? `${j.error} — ${j.hint}` : (j.error || `HTTP ${r.status}`));
      setResult(j);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-400">Base SDXL (stabilityai/stable-diffusion-xl-base-1.0) — slow on CPU. Expect <span className="text-amber-300">30-120s per image at 768×768</span>. Tunneled response can be 1-3 MB.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <label className="block text-xs text-gray-400">
          Width
          <select value={width} onChange={e => setWidth(parseInt(e.target.value, 10))} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {[512, 768, 1024, 1152, 1280, 1536].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-400">
          Height
          <select value={height} onChange={e => setHeight(parseInt(e.target.value, 10))} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {[512, 768, 1024, 1152, 1280, 1536].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-400">
          Steps: <span className="font-mono">{steps}</span>
          <input type="range" min={1} max={50} value={steps} onChange={e => setSteps(parseInt(e.target.value, 10))} className="mt-1 w-full" />
        </label>
        <label className="block text-xs text-gray-400">
          Guidance: <span className="font-mono">{guidanceScale.toFixed(1)}</span>
          <input type="range" min={0} max={15} step={0.5} value={guidanceScale} onChange={e => setGuidanceScale(parseFloat(e.target.value))} className="mt-1 w-full" />
        </label>
      </div>
      <div className="flex items-center justify-end gap-3">
        {loading && (
          <span className="text-xs text-gray-400 inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Generating… <span className="font-mono text-gray-300">{elapsedSec}s</span> elapsed (timeout 300s)
          </span>
        )}
        <button onClick={run} disabled={loading || !prompt.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Generate
        </button>
      </div>
      <label className="block text-xs text-gray-400">
        Prompt
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-mono text-gray-200" />
      </label>
      <label className="block text-xs text-gray-400">
        Negative prompt
        <input type="text" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm font-mono text-gray-200" />
      </label>

      {error && <div className="rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300"><AlertCircle className="inline h-4 w-4 mr-1" /> {error}</div>}

      {result && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-2">
          <div className="text-xs text-gray-500 inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {result.durationMs}ms</span>
            <span>{width}×{height} · {steps} steps · guidance {guidanceScale}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="SDXL" className="max-h-[600px] w-auto rounded mx-auto" />
        </div>
      )}
    </section>
  );
}

// ─── NLLB translation tab ────────────────────────────────────────────────

const NLLB_LANGS: { code: string; label: string }[] = [
  { code: 'eng_Latn', label: 'English' },
  { code: 'fra_Latn', label: 'French' },
  { code: 'spa_Latn', label: 'Spanish' },
  { code: 'por_Latn', label: 'Portuguese' },
  { code: 'arb_Arab', label: 'Arabic (Standard)' },
  { code: 'swh_Latn', label: 'Swahili' },
  { code: 'hau_Latn', label: 'Hausa' },
  { code: 'yor_Latn', label: 'Yoruba' },
  { code: 'ibo_Latn', label: 'Igbo' },
  { code: 'zul_Latn', label: 'Zulu' },
  { code: 'afr_Latn', label: 'Afrikaans' },
  { code: 'amh_Ethi', label: 'Amharic' },
  { code: 'som_Latn', label: 'Somali' },
  { code: 'kin_Latn', label: 'Kinyarwanda' },
  { code: 'hat_Latn', label: 'Haitian Creole' },
];

function NLLBTab({ headers }: { headers: Record<string, string> }) {
  const [text, setText] = useState('Nigeria’s SEC announced a new framework for stablecoin issuers, raising compliance costs for offshore wallets.');
  const [sourceLang, setSourceLang] = useState('eng_Latn');
  const [targetLang, setTargetLang] = useState('fra_Latn');
  const [result, setResult] = useState<{ translation: string; durationMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/nllb/translate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLang, targetLang }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.hint ? `${j.error} — ${j.hint}` : (j.error || `HTTP ${r.status}`));
      setResult(j);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-400">NLLB-200 (No Language Left Behind, 200+ langs). Used by the translation agent. Hosted on Contabo port 8080.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="block text-xs text-gray-400">
          Source language
          <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {NLLB_LANGS.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-400">
          Target language
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {NLLB_LANGS.map(l => <option key={l.code} value={l.code}>{l.label} ({l.code})</option>)}
          </select>
        </label>
        <button onClick={run} disabled={loading || !text.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Translate
        </button>
      </div>
      <label className="block text-xs text-gray-400">
        Source text
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200" />
      </label>

      {error && <div className="rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300"><AlertCircle className="inline h-4 w-4 mr-1" /> {error}</div>}

      {result && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-2">
          <div className="text-xs text-gray-500 inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {result.durationMs}ms</div>
          <div className="rounded bg-gray-800 p-3 text-sm text-gray-100 whitespace-pre-wrap">{result.translation}</div>
        </div>
      )}
    </section>
  );
}

// ─── Iengine image tab (bridge layer) ────────────────────────────────────

function IengineTab({ headers }: { headers: Record<string, string> }) {
  const [prompt, setPrompt] = useState('Aerial photo of Lagos skyline at sunrise, financial district, photorealistic');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [result, setResult] = useState<{ url: string; durationMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/iengine/generate`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, aspectRatio }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.hint ? `${j.error} — ${j.hint}` : (j.error || `HTTP ${r.status}`));
      setResult(j);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-400">Iengine bridge — wraps SDXL plus style preset / CDN upload. Use SDXL tab for raw control.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="block text-xs text-gray-400">
          Style
          <select value={style} onChange={e => setStyle(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {['photorealistic', 'editorial', 'illustration', 'cinematic', 'abstract'].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-xs text-gray-400">
          Aspect ratio
          <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            <option value="16:9">16:9 (landscape)</option>
            <option value="9:16">9:16 (portrait / short)</option>
            <option value="1:1">1:1 (square)</option>
          </select>
        </label>
        <button onClick={run} disabled={loading || !prompt.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Generate
        </button>
      </div>
      <label className="block text-xs text-gray-400">
        Prompt
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-mono text-gray-200" />
      </label>

      {error && <div className="rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300"><AlertCircle className="inline h-4 w-4 mr-1" /> {error}</div>}

      {result && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-2">
          <div className="text-xs text-gray-500 inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {result.durationMs}ms</div>
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.url} alt="Generated" className="max-h-96 w-auto rounded" />
          </a>
          <div className="text-[11px] font-mono text-gray-500 break-all">{result.url}</div>
        </div>
      )}
    </section>
  );
}

// ─── Voice tab (Coqui XTTS) ──────────────────────────────────────────────

function VoiceTab({ headers }: { headers: Record<string, string> }) {
  const [text, setText] = useState('Today on Sygn: Nigeria’s SEC announced a new framework for stablecoin issuers, raising compliance costs for offshore wallets.');
  const [language, setLanguage] = useState('en');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setError(null); setAudioUrl(null); setDuration(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/ai-playground/coqui/tts`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
        throw new Error(j.error);
      }
      const blob = await r.blob();
      setAudioUrl(URL.createObjectURL(blob));
      const d = r.headers.get('x-duration-ms');
      if (d) setDuration(parseInt(d, 10));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-800 p-4 space-y-3">
      <p className="text-xs text-gray-400">Coqui XTTS self-hosted on Contabo (port 5002). Used by the video pipeline voiceover step.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <label className="block text-xs text-gray-400">
          Language
          <select value={language} onChange={e => setLanguage(e.target.value)} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-gray-200">
            {[
              ['en', 'English'], ['fr', 'Français'], ['pt', 'Português'], ['es', 'Español'], ['ar', 'العربية'],
              ['sw', 'Kiswahili'], ['ha', 'Hausa'], ['yo', 'Yorùbá'], ['ig', 'Igbo'], ['zu', 'isiZulu'],
            ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <div />
        <button onClick={run} disabled={loading || !text.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Render
        </button>
      </div>
      <label className="block text-xs text-gray-400">
        Text
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200" />
      </label>

      {error && <div className="rounded border border-red-700 bg-red-900/30 p-3 text-sm text-red-300"><AlertCircle className="inline h-4 w-4 mr-1" /> {error}</div>}

      {audioUrl && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 space-y-2">
          {duration && <div className="text-xs text-gray-500 inline-flex items-center gap-1"><Activity className="h-3 w-3" /> {duration}ms</div>}
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </section>
  );
}
