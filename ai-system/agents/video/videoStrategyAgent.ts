/**
 * Video Strategy Agent — decides whether to produce SHORT, LONG, or BOTH
 * given an article's characteristics.
 *
 * Rules (rough, keep pragmatic):
 *   - Breaking news / hot-take / high urgency        → SHORT only
 *   - Deep analysis / explainer / long-form          → LONG only + auto-cut clips
 *   - Everything else (news + context)               → BOTH
 *
 * The idea: short is for TikTok/Reels/Shorts (60s vertical). Long is for
 * YouTube (3-5min landscape). Producing both isn't always the right call
 * — a breaking-news alert doesn't need a 4-minute YouTube video.
 */

import type { Logger } from 'winston';

export interface StrategyInput {
  articleId: string;
  title: string;
  excerpt?: string;
  content: string;
  category?: string;          // slug: 'breaking-news' | 'analysis' | 'explainer' | 'regulation' | ...
  tags?: string[];
  isBreaking?: boolean;       // explicit flag set by editorial
  urgency?: 'high' | 'medium' | 'low';
  publishedAt?: Date;
}

export interface StrategyDecision {
  produceShort: boolean;
  produceLong: boolean;
  cutClipsFromLong: boolean;  // slice long video into short clips for cross-posting
  reason: string;
  wordCount: number;
  scoreBreakingNews: number;  // 0..1 confidence
  scoreDeepAnalysis: number;  // 0..1 confidence
}

const BREAKING_CATEGORIES = new Set([
  'breaking-news', 'breaking', 'alerts', 'flash', 'hot-take', 'markets-flash',
]);
const DEEP_CATEGORIES = new Set([
  'analysis', 'explainer', 'deep-dive', 'feature', 'long-read', 'investigation',
  'op-ed', 'research', 'policy-brief',
]);

const BREAKING_TAGS = new Set([
  'breaking', 'alert', 'flash', 'urgent', 'live', 'developing',
]);
const DEEP_TAGS = new Set([
  'analysis', 'explainer', 'deep-dive', 'feature', 'long-read',
]);

// Lexical signals in title/excerpt
const BREAKING_KEYWORDS = /\b(breaking|alert|urgent|flash|just in|developing|live|hot take)\b/i;
const DEEP_KEYWORDS     = /\b(analysis|explained|explainer|why|how|deep dive|inside|primer|guide|breakdown)\b/i;

export function decideVideoStrategy(
  input: StrategyInput,
  logger?: Logger,
): StrategyDecision {
  const wordCount = countWords(input.content);
  const category = (input.category || '').toLowerCase();
  const tags = (input.tags || []).map(t => t.toLowerCase());
  const titleLower = (input.title || '').toLowerCase();
  const excerptLower = (input.excerpt || '').toLowerCase();

  // ─── Score BREAKING NEWS confidence ───
  let scoreBreaking = 0;
  if (input.isBreaking === true) scoreBreaking += 0.5;
  if (input.urgency === 'high') scoreBreaking += 0.25;
  if (BREAKING_CATEGORIES.has(category)) scoreBreaking += 0.4;
  if (tags.some(t => BREAKING_TAGS.has(t))) scoreBreaking += 0.2;
  if (BREAKING_KEYWORDS.test(titleLower) || BREAKING_KEYWORDS.test(excerptLower)) scoreBreaking += 0.2;
  if (wordCount < 400) scoreBreaking += 0.15;    // short articles read as flash items
  // Freshness bump — if published in the last hour, more likely breaking
  if (input.publishedAt && (Date.now() - input.publishedAt.getTime()) < 60 * 60 * 1000) {
    scoreBreaking += 0.1;
  }
  scoreBreaking = Math.min(1, scoreBreaking);

  // ─── Score DEEP ANALYSIS confidence ───
  let scoreDeep = 0;
  if (DEEP_CATEGORIES.has(category)) scoreDeep += 0.4;
  if (tags.some(t => DEEP_TAGS.has(t))) scoreDeep += 0.2;
  if (DEEP_KEYWORDS.test(titleLower) || DEEP_KEYWORDS.test(excerptLower)) scoreDeep += 0.15;
  if (wordCount > 1800) scoreDeep += 0.3;
  if (wordCount > 3000) scoreDeep += 0.15;
  if (input.urgency === 'low') scoreDeep += 0.1;
  scoreDeep = Math.min(1, scoreDeep);

  // ─── Decision ───
  let produceShort = true;
  let produceLong = true;
  let cutClipsFromLong = false;
  let reason: string;

  const breakingWins = scoreBreaking >= 0.6 && scoreBreaking >= scoreDeep + 0.15;
  const deepWins     = scoreDeep     >= 0.6 && scoreDeep     >= scoreBreaking + 0.15;

  if (breakingWins) {
    produceShort = true;
    produceLong = false;
    cutClipsFromLong = false;
    reason = `Breaking-news signal (${scoreBreaking.toFixed(2)}) — short-form only`;
  } else if (deepWins) {
    produceShort = false;
    produceLong = true;
    cutClipsFromLong = true;
    reason = `Deep-analysis signal (${scoreDeep.toFixed(2)}) — long-form + auto-cut clips for cross-posting`;
  } else {
    produceShort = true;
    produceLong = true;
    cutClipsFromLong = wordCount > 1200; // if long enough, also chop into clips
    reason = `Mixed signals (breaking=${scoreBreaking.toFixed(2)}, deep=${scoreDeep.toFixed(2)}) — produce both`;
  }

  logger?.info(`[video-strategy] ${input.articleId}: ${reason} (${wordCount} words)`);

  return {
    produceShort,
    produceLong,
    cutClipsFromLong,
    reason,
    wordCount,
    scoreBreakingNews: scoreBreaking,
    scoreDeepAnalysis: scoreDeep,
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
