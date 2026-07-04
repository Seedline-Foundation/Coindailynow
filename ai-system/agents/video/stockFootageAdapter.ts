/**
 * Stock Footage Adapter — free B-roll from Pexels Videos API.
 *
 * Free tier: 200 requests/hour, 20,000/month. Pexels videos are royalty-free
 * with no attribution required (attribution is appreciated). Useful as a
 * graceful fallback when fal.ai is unconfigured or fails.
 *
 * Env:
 *   PEXELS_API_KEY   required (https://www.pexels.com/api/)
 *   set to 'disabled' to stub
 */

import type { Logger } from 'winston';

const PEXELS_BASE = 'https://api.pexels.com/videos';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const TIMEOUT_MS = 15_000;

export interface StockClipInput {
  query: string;
  /** SHORT (9:16) → 'portrait'; LONG (16:9) → 'landscape'. */
  orientation?: 'portrait' | 'landscape' | 'square';
  /** Pexels video size: 'small' ≤540p, 'medium' ≤720p, 'large' ≥1080p */
  size?: 'small' | 'medium' | 'large';
  /** Minimum duration in seconds — filters out clips too short to use. */
  minDurationSec?: number;
}

export interface StockClipResult {
  ok: boolean;
  url?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  provider: 'pexels';
  externalId?: string;
  /** Photographer name — for credit footer if you want to surface it. */
  credit?: string;
  error?: string;
}

interface PexelsVideoFile {
  link: string;
  quality: string;
  width: number;
  height: number;
  file_type: string;
}

interface PexelsVideo {
  id: number;
  duration: number;
  user?: { name?: string };
  video_files: PexelsVideoFile[];
}

export async function searchStockClip(
  input: StockClipInput,
  logger: Logger,
): Promise<StockClipResult> {
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'disabled') {
    logger.info('[pexels] PEXELS_API_KEY not set — stock footage skipped');
    return { ok: false, provider: 'pexels', error: 'PEXELS_API_KEY not configured' };
  }
  if (!input.query?.trim()) {
    return { ok: false, provider: 'pexels', error: 'empty query' };
  }

  const params = new URLSearchParams({
    query: input.query.slice(0, 120),
    per_page: '15',
    orientation: input.orientation || 'landscape',
    size: input.size || 'medium',
  });

  try {
    const res = await fetch(`${PEXELS_BASE}/search?${params}`, {
      headers: { Authorization: PEXELS_API_KEY },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      logger.warn(`[pexels] HTTP ${res.status}: ${detail.slice(0, 200)}`);
      return { ok: false, provider: 'pexels', error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { videos?: PexelsVideo[] };
    const minDur = input.minDurationSec ?? 4;
    const candidates = (data.videos || []).filter(v => v.duration >= minDur);
    if (!candidates.length) {
      return { ok: false, provider: 'pexels', error: 'no clips matched query' };
    }

    // Prefer the first candidate's mp4 closest to our target resolution.
    const target = pickResolution(input.orientation || 'landscape', input.size || 'medium');
    const chosen = candidates[0];
    const file = chooseBestFile(chosen.video_files, target);
    if (!file) {
      return { ok: false, provider: 'pexels', error: 'no mp4 in chosen video', externalId: String(chosen.id) };
    }

    return {
      ok: true,
      url: file.link,
      durationSec: chosen.duration,
      width: file.width,
      height: file.height,
      provider: 'pexels',
      externalId: String(chosen.id),
      credit: chosen.user?.name,
    };
  } catch (err: any) {
    logger.warn(`[pexels] search failed: ${err.message}`);
    return { ok: false, provider: 'pexels', error: err.message };
  }
}

function pickResolution(orientation: 'portrait' | 'landscape' | 'square', size: 'small' | 'medium' | 'large'): { w: number; h: number } {
  const longSide = size === 'small' ? 540 : size === 'large' ? 1920 : 1080;
  const shortSide = size === 'small' ? 304 : size === 'large' ? 1080 : 720;
  if (orientation === 'portrait') return { w: shortSide, h: longSide };
  if (orientation === 'square') return { w: longSide, h: longSide };
  return { w: longSide, h: shortSide };
}

function chooseBestFile(files: PexelsVideoFile[], target: { w: number; h: number }): PexelsVideoFile | null {
  const mp4s = files.filter(f => (f.file_type || '').includes('mp4'));
  if (!mp4s.length) return null;
  // Pick the file closest to target by total pixel count.
  const targetPx = target.w * target.h;
  return mp4s.slice().sort((a, b) => Math.abs(a.width * a.height - targetPx) - Math.abs(b.width * b.height - targetPx))[0];
}
