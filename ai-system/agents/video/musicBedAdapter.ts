/**
 * Music Bed Adapter — picks a background music track to sit under voiceover.
 *
 * Resolution order:
 *   1. If BRAND_MUSIC_URL_<CATEGORY> set (e.g. BRAND_MUSIC_URL_CRYPTO) → use it.
 *   2. If BRAND_MUSIC_URL set → use it for everything.
 *   3. If PIXABAY_KEY set → query Pixabay Music API.
 *   4. Otherwise return ok:false; composer will skip music mix.
 *
 * Env:
 *   BRAND_MUSIC_URL              default mp3/m4a CDN URL
 *   BRAND_MUSIC_URL_<CATEGORY>   override per category (e.g. CRYPTO, REGULATORY)
 *   PIXABAY_KEY                  optional Pixabay API key for dynamic search
 */

import type { Logger } from 'winston';

const PIXABAY_KEY = process.env.PIXABAY_KEY || '';
const TIMEOUT_MS = 15_000;

export interface MusicBedInput {
  /** Article category slug — used to pick a category-specific brand track if env set. */
  category?: string;
  /** Mood query for Pixabay search if env URL not set. */
  mood?: string;
  /** Minimum length in seconds. */
  minDurationSec?: number;
}

export interface MusicBedResult {
  ok: boolean;
  url?: string;
  durationSec?: number;
  provider: 'env' | 'pixabay' | 'none';
  credit?: string;
  error?: string;
}

interface PixabayMusicHit {
  id: number;
  duration: number;
  audio?: string;
  audio_url?: string;
  url?: string;
  user?: string;
}

export async function pickMusicBed(
  input: MusicBedInput,
  logger: Logger,
): Promise<MusicBedResult> {
  // 1 + 2: env override (category-specific first, then global default)
  const catKey = input.category ? `BRAND_MUSIC_URL_${input.category.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}` : '';
  const envUrl = (catKey && process.env[catKey]) || process.env.BRAND_MUSIC_URL || '';
  if (envUrl) {
    return { ok: true, url: envUrl, provider: 'env' };
  }

  // 3: Pixabay
  if (PIXABAY_KEY && PIXABAY_KEY !== 'disabled') {
    try {
      const params = new URLSearchParams({
        key: PIXABAY_KEY,
        q: input.mood || input.category || 'corporate',
        per_page: '10',
      });
      const res = await fetch(`https://pixabay.com/api/music/?${params}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        logger.warn(`[music] Pixabay HTTP ${res.status}`);
      } else {
        const data = (await res.json()) as { hits?: PixabayMusicHit[] };
        const minDur = input.minDurationSec ?? 30;
        const hit = (data.hits || []).find(h => h.duration >= minDur);
        const url = hit?.audio || hit?.audio_url || hit?.url;
        if (url) {
          return { ok: true, url, durationSec: hit?.duration, provider: 'pixabay', credit: hit?.user };
        }
      }
    } catch (err: any) {
      logger.warn(`[music] Pixabay request failed: ${err.message}`);
    }
  }

  return { ok: false, provider: 'none', error: 'no music source configured' };
}
