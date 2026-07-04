/**
 * ClipsAI adapter — slices a long-form video into social-ready short clips.
 *
 * Wraps a self-hosted FastAPI service on Contabo (deploy separately) that
 * runs the ClipsAI library (https://github.com/ClipsAI/clipsai). The library
 * uses whisper + transformer segmentation to detect natural topic boundaries
 * in the video's transcript, then cuts around those boundaries.
 *
 * Suggested wrapper spec (Python side to build separately):
 *   POST /cut
 *   Body: {
 *     video_url: string,
 *     min_duration_sec?: number,   // default 30
 *     max_duration_sec?: number,   // default 90
 *     max_clips?: number,          // default 5
 *   }
 *   Response: {
 *     clips: [
 *       { url: string, start_sec: number, end_sec: number, transcript: string, title?: string }
 *     ],
 *     total_duration_sec: number,
 *   }
 *
 * Env:
 *   CLIPSAI_URL   default 'http://localhost:8100' (tunneled or Contabo loopback)
 *   set to 'disabled' to skip
 */

import type { Logger } from 'winston';

const CLIPSAI_URL = process.env.CLIPSAI_URL || 'http://localhost:8100';
const TIMEOUT_MS = 10 * 60 * 1000; // ClipsAI can take minutes on CPU

export interface CutClipsInput {
  videoUrl: string;
  minDurationSec?: number;
  maxDurationSec?: number;
  maxClips?: number;
}

export interface CutClip {
  url: string;
  startSec: number;
  endSec: number;
  transcript: string;
  title?: string;
}

export interface CutClipsResult {
  ok: boolean;
  clips: CutClip[];
  provider: 'clipsai';
  totalDurationSec?: number;
  durationMs: number;
  error?: string;
}

export async function cutClipsFromVideo(
  input: CutClipsInput,
  logger: Logger,
): Promise<CutClipsResult> {
  const t0 = Date.now();

  if (!CLIPSAI_URL || CLIPSAI_URL === 'disabled') {
    logger.info('[clipsai] CLIPSAI_URL not configured — skipping auto-cut');
    return { ok: false, clips: [], provider: 'clipsai', durationMs: 0, error: 'CLIPSAI_URL not configured' };
  }
  if (!input.videoUrl) {
    return { ok: false, clips: [], provider: 'clipsai', durationMs: 0, error: 'videoUrl required' };
  }

  try {
    const r = await fetch(`${CLIPSAI_URL}/cut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: input.videoUrl,
        min_duration_sec: input.minDurationSec ?? 30,
        max_duration_sec: input.maxDurationSec ?? 90,
        max_clips: input.maxClips ?? 5,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      logger.warn(`[clipsai] HTTP ${r.status}: ${detail.slice(0, 200)}`);
      return { ok: false, clips: [], provider: 'clipsai', durationMs: Date.now() - t0, error: `HTTP ${r.status}` };
    }

    const data = await r.json() as { clips?: any[]; total_duration_sec?: number };
    const clips: CutClip[] = (data.clips || []).map(c => ({
      url: c.url,
      startSec: c.start_sec ?? 0,
      endSec: c.end_sec ?? 0,
      transcript: c.transcript ?? '',
      title: c.title,
    }));

    if (!clips.length) {
      return { ok: false, clips: [], provider: 'clipsai', durationMs: Date.now() - t0, error: 'no clips returned' };
    }

    logger.info(`[clipsai] produced ${clips.length} clips from ${input.videoUrl} (${data.total_duration_sec ?? '?'}s source)`);
    return {
      ok: true,
      clips,
      provider: 'clipsai',
      totalDurationSec: data.total_duration_sec,
      durationMs: Date.now() - t0,
    };
  } catch (e: any) {
    logger.warn(`[clipsai] cut failed: ${e.message}`);
    return { ok: false, clips: [], provider: 'clipsai', durationMs: Date.now() - t0, error: e.message };
  }
}
