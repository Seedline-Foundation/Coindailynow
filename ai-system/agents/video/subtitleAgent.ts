/**
 * Subtitle Agent — builds an SRT file from a VideoScript so ffmpeg can
 * burn captions onto the final video (critical for TikTok/Reels where most
 * viewers watch with sound muted).
 *
 * Timing model: cumulative scene durations. We don't have word-level
 * alignment without a forced-aligner; we split each scene's text into
 * ~6-word chunks distributed evenly across the scene's duration. Good
 * enough for shorts where each scene is 6-12s.
 */

import type { VideoScript } from './scriptAgent';

/** Maximum chars per caption line — keeps text readable on 9:16. */
const MAX_LINE_CHARS = 40;
/** Words per caption cue — empirically the comfortable range for shorts. */
const WORDS_PER_CUE = 6;

export interface SrtCue {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

export function buildSrtFromScript(script: VideoScript): string {
  const cues = buildCues(script);
  return cues.map(cueToSrt).join('\n') + '\n';
}

export function buildCues(script: VideoScript): SrtCue[] {
  const cues: SrtCue[] = [];
  let cursor = 0;
  let idx = 1;

  const segments: { text: string; durationSec: number }[] = [];
  if (script.hook) {
    // Hook gets ~6s leading in.
    segments.push({ text: script.hook, durationSec: Math.min(8, Math.max(4, script.hook.split(/\s+/).length / 2.5)) });
  }
  for (const sc of script.scenes) segments.push({ text: sc.text, durationSec: sc.durationSec });
  if (script.cta) segments.push({ text: script.cta, durationSec: 4 });

  for (const seg of segments) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    if (!words.length) { cursor += seg.durationSec; continue; }
    // Number of cues sized so each is ≤WORDS_PER_CUE words.
    const numCues = Math.max(1, Math.ceil(words.length / WORDS_PER_CUE));
    const cueDuration = seg.durationSec / numCues;
    for (let i = 0; i < numCues; i++) {
      const sliceWords = words.slice(i * WORDS_PER_CUE, (i + 1) * WORDS_PER_CUE);
      if (!sliceWords.length) break;
      const text = wrapLine(sliceWords.join(' '));
      cues.push({
        index: idx++,
        startSec: cursor + i * cueDuration,
        endSec: cursor + (i + 1) * cueDuration,
        text,
      });
    }
    cursor += seg.durationSec;
  }

  return cues;
}

function cueToSrt(c: SrtCue): string {
  return `${c.index}\n${tc(c.startSec)} --> ${tc(c.endSec)}\n${c.text}\n`;
}

function tc(sec: number): string {
  const total = Math.max(0, sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function pad(n: number, w: number): string { return String(n).padStart(w, '0'); }

function wrapLine(s: string): string {
  if (s.length <= MAX_LINE_CHARS) return s;
  // Wrap on word boundary near the midpoint.
  const mid = Math.floor(s.length / 2);
  const left = s.lastIndexOf(' ', mid);
  const right = s.indexOf(' ', mid);
  const breakAt = (mid - left) <= (right - mid) ? left : right;
  if (breakAt <= 0) return s;
  return s.slice(0, breakAt) + '\n' + s.slice(breakAt + 1);
}
