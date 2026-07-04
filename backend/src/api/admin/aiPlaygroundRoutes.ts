/**
 * AI Playground Routes — live test surface for self-hosted models.
 *
 * Self-hosted on Contabo (or local dev when ports tunneled):
 *   Ollama (DeepSeek R1)        port 11434  /api/generate
 *   SDXL  (Stable Diffusion XL) port 7860   /sdapi/v1/txt2img
 *   NLLB-200 (translation)      port 8080   /translate  (Flask wrapper)
 *   Coqui XTTS (voice)          port 5002   /api/tts
 *   Iengine (image bridge)      port 5500
 * Cloud:
 *   fal.ai                      uses FAL_API_KEY
 *
 * GET  /status                — health for all six
 * POST /ollama/chat           — { prompt, model? } -> { response, ... }
 * POST /sdxl/generate         — { prompt, width?, height?, steps? } -> { url (data URI) }
 * POST /nllb/translate        — { text, sourceLang, targetLang } -> { translation }
 * POST /iengine/generate      — { prompt, style?, aspectRatio? } -> { url }
 * POST /coqui/tts             — { text, language? } -> audio/mpeg
 */

import { Router, Request, Response } from 'express';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authMiddleware as any);
router.use(requireCapability('ARTICLE_APPROVE') as any);

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const DEFAULT_LLM_MODEL = process.env.DEEPSEEK_MODEL || process.env.LLAMA_MODEL || 'deepseek-r1:8b';
const COQUI_URL = process.env.COQUI_TTS_URL || 'http://localhost:5002';
const IENGINE_URL = process.env.IENGINE_URL || 'http://localhost:5500';
const SDXL_URL = process.env.SDXL_API_URL || 'http://localhost:7860';
const SDXL_CHECKPOINT = process.env.SDXL_CHECKPOINT_NAME || 'sd_xl_base_1.0.safetensors';
const NLLB_URL = process.env.NLLB_API_URL || 'http://localhost:8080';
const FAL_API_KEY = process.env.FAL_API_KEY || '';

// ─── Status ─────────────────────────────────────────────────────────────

/**
 * Extract a useful failure reason from a fetch() exception. Node 18+ undici
 * throws bare `TypeError: fetch failed` and stuffs the real network error in
 * `e.cause`. We surface the cause code + a one-line hint so the playground
 * status cards tell you WHY it failed, not just THAT it failed.
 */
function describeFetchError(e: any, url: string): { error: string; hint?: string; code?: string } {
  const cause = e?.cause;
  const code = cause?.code as string | undefined;
  const host = (() => { try { return new URL(url).host; } catch { return url; } })();
  if (code === 'ECONNREFUSED') return { code, error: `Connection refused to ${host}`, hint: 'service is not running on that port, or the env URL points to the wrong host. SSH-tunnel if model lives on Contabo.' };
  if (code === 'ENOTFOUND')    return { code, error: `Cannot resolve host ${host}`, hint: 'DNS failed — check the URL, or the env var has a typo.' };
  if (code === 'ETIMEDOUT')    return { code, error: `Timeout connecting to ${host}`, hint: 'firewall blocking, host unreachable, or service hung. Try ssh tunnel.' };
  if (code === 'EHOSTUNREACH') return { code, error: `Host ${host} unreachable`, hint: 'no network route to the server.' };
  if (code === 'ECONNRESET')   return { code, error: `Connection reset by ${host}`, hint: 'service started replying then dropped — likely a proxy or model crash.' };
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') return { code: 'TIMEOUT', error: `Probe timed out for ${host}`, hint: 'service slow to respond, or unreachable.' };
  return { code, error: e?.message || String(e), hint: cause?.message ? `cause: ${cause.message}` : undefined };
}

router.get('/status', async (_req: Request, res: Response) => {
  const probe = async (name: string, url: string, opts?: { headers?: Record<string, string>; timeoutMs?: number }) => {
    const t0 = Date.now();
    try {
      const r = await fetch(url, {
        headers: opts?.headers,
        signal: AbortSignal.timeout(opts?.timeoutMs ?? 4000),
      });
      return { name, ok: r.ok, status: r.status, latencyMs: Date.now() - t0, url };
    } catch (e: any) {
      const d = describeFetchError(e, url);
      return { name, ok: false, latencyMs: Date.now() - t0, url, ...d };
    }
  };

  const [ollama, coqui, iengine, sdxl, nllb] = await Promise.all([
    probe('ollama', `${OLLAMA_URL}/api/tags`),
    probe('coqui', `${COQUI_URL}/api/tts/health`).catch(() => probe('coqui', `${COQUI_URL}/`)),
    probe('iengine', `${IENGINE_URL}/health`).catch(() => probe('iengine', `${IENGINE_URL}/`)),
    // SDXL — slower to warm up on CPU, give it 20s before marking offline
    probe('sdxl', `${SDXL_URL}/health`, { timeoutMs: 20_000 }),
    // NLLB wrapper conventionally has /health
    probe('nllb', `${NLLB_URL}/health`).catch(() => probe('nllb', `${NLLB_URL}/`)),
  ]);

  // Ollama: enrich with installed model list when up
  let installedModels: string[] = [];
  if (ollama.ok) {
    try {
      const r = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
      const j = await r.json() as { models?: { name: string }[] };
      installedModels = (j.models || []).map(m => m.name);
    } catch { /* swallow */ }
  }

  res.json({
    services: {
      ollama: { ...ollama, defaultModel: DEFAULT_LLM_MODEL, installedModels, url: OLLAMA_URL },
      sdxl: { ...sdxl, url: SDXL_URL },
      nllb: { ...nllb, url: NLLB_URL },
      coqui: { ...coqui, url: COQUI_URL },
      iengine: { ...iengine, url: IENGINE_URL },
      fal: { name: 'fal', ok: !!FAL_API_KEY && FAL_API_KEY !== 'disabled', configured: !!FAL_API_KEY },
    },
    env: {
      DEFAULT_LLM_MODEL,
      OLLAMA_API_URL: OLLAMA_URL,
      SDXL_API_URL: SDXL_URL,
      NLLB_API_URL: NLLB_URL,
      COQUI_TTS_URL: COQUI_URL,
      IENGINE_URL: IENGINE_URL,
    },
  });
});

// ─── Ollama chat ─────────────────────────────────────────────────────────

router.post('/ollama/chat', async (req: Request, res: Response) => {
  const { prompt, model, temperature = 0.4 } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required' });
  }
  const useModel = (typeof model === 'string' && model) || DEFAULT_LLM_MODEL;

  const t0 = Date.now();
  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: useModel,
        prompt: prompt.slice(0, 4000),
        stream: false,
        options: { temperature, num_predict: 512 },
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: `Ollama HTTP ${r.status}`, detail: detail.slice(0, 500) });
    }
    const data = await r.json() as { response?: string; prompt_eval_count?: number; eval_count?: number; total_duration?: number };
    res.json({
      response: data.response || '',
      durationMs: Date.now() - t0,
      tokens: { prompt: data.prompt_eval_count, output: data.eval_count },
      model: useModel,
    });
  } catch (e: any) {
    const d = describeFetchError(e, `${OLLAMA_URL}/api/generate`);
    logger.warn(`[ai-playground] ollama failed: ${d.error}`);
    res.status(502).json({ error: d.error, hint: d.hint, code: d.code, durationMs: Date.now() - t0 });
  }
});

// ─── Iengine image gen ──────────────────────────────────────────────────

router.post('/iengine/generate', async (req: Request, res: Response) => {
  const { prompt, style = 'photorealistic', aspectRatio = '16:9' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required' });
  }

  const t0 = Date.now();
  try {
    const r = await fetch(`${IENGINE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.slice(0, 500), style, aspectRatio }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: `Iengine HTTP ${r.status}`, detail: detail.slice(0, 500) });
    }
    const data = await r.json() as { url?: string; imageUrl?: string };
    const url = data.url || data.imageUrl;
    if (!url) return res.status(502).json({ error: 'no url in Iengine response' });
    res.json({ url, durationMs: Date.now() - t0, style, aspectRatio });
  } catch (e: any) {
    const d = describeFetchError(e, `${IENGINE_URL}/api/generate`);
    logger.warn(`[ai-playground] iengine failed: ${d.error}`);
    res.status(502).json({ error: d.error, hint: d.hint, code: d.code, durationMs: Date.now() - t0 });
  }
});

// ─── SDXL image gen (custom FastAPI wrapper) ──────────────────────────
// Self-hosted Docker service on port 7860 — POST /generate with ImageRequest:
//   { prompt, negative_prompt?, width?, height?, steps?, guidance_scale? }
// Returns { image: "<base64-png>" }. Defaults suggest SDXL Turbo (steps=4, guidance=0).

router.post('/sdxl/generate', async (req: Request, res: Response) => {
  const {
    prompt,
    negativePrompt = 'blurry, low quality, distorted',
    width = 1024, height = 1024,
    steps = 25,
    guidanceScale = 7.0,
  } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required' });
  }

  const t0 = Date.now();
  try {
    const r = await fetch(`${SDXL_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.slice(0, 800),
        negative_prompt: negativePrompt,
        width: Math.min(1536, Math.max(256, width)),
        height: Math.min(1536, Math.max(256, height)),
        steps: Math.min(50, Math.max(1, steps)),
        guidance_scale: guidanceScale,
      }),
      signal: AbortSignal.timeout(300_000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({
        error: `SDXL service HTTP ${r.status}`,
        detail: detail.slice(0, 500),
      });
    }
    const data = await r.json() as { image?: string; image_b64?: string };
    const b64 = data.image || data.image_b64;
    if (!b64) return res.status(502).json({ error: 'no image in SDXL response' });
    const url = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
    res.json({
      url, durationMs: Date.now() - t0,
      width, height, steps, guidanceScale,
    });
  } catch (e: any) {
    const d = describeFetchError(e, `${SDXL_URL}/generate`);
    logger.warn(`[ai-playground] sdxl failed: ${d.error}`);
    res.status(502).json({ error: d.error, hint: d.hint, code: d.code, durationMs: Date.now() - t0 });
  }
});

// ─── NLLB-200 translation ─────────────────────────────────────────────

router.post('/nllb/translate', async (req: Request, res: Response) => {
  const {
    text,
    sourceLang = 'eng_Latn',
    targetLang = 'fra_Latn',
  } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text (string) is required' });
  }

  const t0 = Date.now();
  try {
    // Conventional NLLB Flask wrapper: POST /translate { text, source_lang, target_lang }
    const r = await fetch(`${NLLB_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 2000),
        source_lang: sourceLang,
        target_lang: targetLang,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: `NLLB HTTP ${r.status}`, detail: detail.slice(0, 500) });
    }
    const data = await r.json() as { translation?: string; translated_text?: string; result?: string };
    const translation = data.translation || data.translated_text || data.result;
    if (!translation) {
      return res.status(502).json({ error: 'no translation in NLLB response', raw: data });
    }
    res.json({
      translation,
      durationMs: Date.now() - t0,
      sourceLang,
      targetLang,
    });
  } catch (e: any) {
    const d = describeFetchError(e, `${NLLB_URL}/translate`);
    logger.warn(`[ai-playground] nllb failed: ${d.error}`);
    res.status(502).json({ error: d.error, hint: d.hint, code: d.code, durationMs: Date.now() - t0 });
  }
});

// ─── Coqui TTS ──────────────────────────────────────────────────────────

router.post('/coqui/tts', async (req: Request, res: Response) => {
  const { text, language = 'en' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text (string) is required' });
  }

  const t0 = Date.now();
  try {
    const r = await fetch(`${COQUI_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 1000), language }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: `Coqui HTTP ${r.status}`, detail: detail.slice(0, 500) });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Duration-Ms', String(Date.now() - t0));
    res.send(buf);
  } catch (e: any) {
    const d = describeFetchError(e, `${COQUI_URL}/api/tts`);
    logger.warn(`[ai-playground] coqui failed: ${d.error}`);
    res.status(502).json({ error: d.error, hint: d.hint, code: d.code, durationMs: Date.now() - t0 });
  }
});

export default router;
