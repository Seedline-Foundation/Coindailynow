/**
 * RSS Feed Aggregator Service
 *
 * Fetches & parses RSS / Atom feeds from the global news sources registry.
 * Returns structured feed items ready for the AI content pipeline.
 *
 * Features:
 * - Concurrency-limited parallel fetching (10 at a time)
 * - Per-feed error isolation — one bad feed won't block others
 * - Redis-backed seen-URL set for deduplication against previously published articles
 * - Lightweight XML parsing (regex-based, no heavy dependency)
 * - 10-second timeout per feed
 */

import Redis from 'ioredis';
import prisma from '../lib/prisma';
import { ALL_NEWS_SOURCES, NewsSource, getAllRSSFeedUrls } from '../config/newsSources';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================================================
// TYPES
// ============================================================================

export interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;       // human-readable source name
  sourceUrl: string;     // the feed URL it came from
  region: string;        // ISO country code or 'GLOBAL'
  category: string;      // e.g. 'Crypto', 'Tech', 'Finance'
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of feeds fetched in parallel */
const CONCURRENCY = 10;

/** Per-feed HTTP timeout in ms */
const FETCH_TIMEOUT_MS = 10_000;

/** Redis key for the set of URLs that have already been processed */
const SEEN_URLS_KEY = 'pipeline:rss:seen_urls';

/** How long to keep a URL in the seen set (7 days) */
const SEEN_URL_TTL = 60 * 60 * 24 * 7;

/** Redis key for the set of article title hashes we already published */
const PUBLISHED_TITLES_KEY = 'pipeline:published:title_hashes';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Simple XML tag content extractor (works for RSS 2.0 / Atom).
 * Not a full XML parser — intentionally lightweight.
 */
function extractTag(xml: string, tag: string): string {
  // Try CDATA first
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1]!.trim();

  // Plain text content
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(re);
  if (match) return match[1]!.replace(/<[^>]+>/g, '').trim();

  return '';
}

/**
 * Parse date robustly — returns `new Date()` on failure so we never crash.
 */
function safeDate(raw: string): Date {
  if (!raw) return new Date();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Deterministic, fast hash for deduplication keys.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit int
  }
  return hash.toString(36);
}

/**
 * Strip HTML entities & excess whitespace.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// CORE
// ============================================================================

/**
 * Fetch and parse a single RSS/Atom feed.
 */
async function fetchSingleFeed(source: NewsSource): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'CoinDaily-Bot/1.0 (https://coindaily.online)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const items: FeedItem[] = [];

    // ── RSS 2.0 items ──────────────────────────────────────────────────────
    const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
    for (const raw of rssItems) {
      const title = cleanText(extractTag(raw, 'title'));
      const link = cleanText(extractTag(raw, 'link')) || cleanText(extractTag(raw, 'guid'));
      const description = cleanText(extractTag(raw, 'description'));
      const pubDate = safeDate(extractTag(raw, 'pubDate'));

      if (title && link) {
        items.push({ title, link, description, pubDate, source: source.name, sourceUrl: source.url, region: source.region, category: source.category });
      }
    }

    // ── Atom entries ───────────────────────────────────────────────────────
    if (items.length === 0) {
      const atomEntries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
      for (const raw of atomEntries) {
        const title = cleanText(extractTag(raw, 'title'));
        // Atom uses <link href="…"/> for the URL
        const linkMatch = raw.match(/<link[^>]+href=["']([^"']+)["']/i);
        const link = linkMatch ? linkMatch[1]! : '';
        const description = cleanText(extractTag(raw, 'summary') || extractTag(raw, 'content'));
        const pubDate = safeDate(extractTag(raw, 'updated') || extractTag(raw, 'published'));

        if (title && link) {
          items.push({ title, link, description, pubDate, source: source.name, sourceUrl: source.url, region: source.region, category: source.category });
        }
      }
    }

    return items;
  } catch (err: any) {
    // Silence per-feed errors — we don't want one bad feed to crash the whole run
    if (err?.name !== 'AbortError') {
      console.warn(`[RSS] Failed to fetch ${source.name} (${source.url}): ${err?.message || err}`);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run promises with a concurrency limit.
 */
async function parallelLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]!();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetch ALL registered RSS feeds in parallel and return *only new* items
 * that haven't been seen before and haven't been published as articles.
 *
 * This is the main entry point the AI content pipeline calls.
 */
export async function fetchAllFeeds(): Promise<FeedItem[]> {
  const rssSources = ALL_NEWS_SOURCES.filter(s => s.type === 'rss');

  console.log(`[RSS] Fetching ${rssSources.length} feeds…`);

  const tasks = rssSources.map(src => () => fetchSingleFeed(src));
  const nestedResults = await parallelLimit(tasks, CONCURRENCY);
  const allItems = nestedResults.flat();

  console.log(`[RSS] Parsed ${allItems.length} total items from ${rssSources.length} feeds`);

  // ── Dedup against seen URLs ──────────────────────────────────────────────
  const freshItems: FeedItem[] = [];

  for (const item of allItems) {
    const urlKey = simpleHash(item.link);
    const titleKey = simpleHash(item.title.toLowerCase());

    // Check if we've already seen this URL
    const [seenUrl, seenTitle] = await Promise.all([
      redis.sismember(SEEN_URLS_KEY, urlKey),
      redis.sismember(PUBLISHED_TITLES_KEY, titleKey),
    ]);

    if (seenUrl || seenTitle) continue;

    // Mark as seen
    await redis.sadd(SEEN_URLS_KEY, urlKey);

    freshItems.push(item);
  }

  // Keep the seen-URL set from growing forever (re-apply TTL)
  await redis.expire(SEEN_URLS_KEY, SEEN_URL_TTL);

  console.log(`[RSS] ${freshItems.length} fresh items after dedup (${allItems.length - freshItems.length} duplicates removed)`);

  // Sort by date descending — newest first
  freshItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return freshItems;
}

/**
 * Fetch feeds for a specific region only.
 */
export async function fetchFeedsByRegion(region: string): Promise<FeedItem[]> {
  const sources = ALL_NEWS_SOURCES.filter(
    s => s.type === 'rss' && (s.region === region || s.region === 'GLOBAL')
  );

  const tasks = sources.map(src => () => fetchSingleFeed(src));
  const nestedResults = await parallelLimit(tasks, CONCURRENCY);
  return nestedResults.flat().sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

/**
 * Register a published article's title so future fetches won't re-surface it.
 * Call this from the publication stage for every article published.
 */
export async function markArticleAsPublished(title: string, sourceUrl?: string): Promise<void> {
  const titleKey = simpleHash(title.toLowerCase());
  await redis.sadd(PUBLISHED_TITLES_KEY, titleKey);

  if (sourceUrl) {
    const urlKey = simpleHash(sourceUrl);
    await redis.sadd(SEEN_URLS_KEY, urlKey);
  }

  // Keep set from growing forever
  await redis.expire(PUBLISHED_TITLES_KEY, SEEN_URL_TTL);
}

/**
 * Also check the database for previously published articles with similar titles.
 * Returns true if the title looks like it's already been covered.
 */
export async function isAlreadyPublished(title: string): Promise<boolean> {
  // 1. Check Redis fast-path
  const titleKey = simpleHash(title.toLowerCase());
  const inRedis = await redis.sismember(PUBLISHED_TITLES_KEY, titleKey);
  if (inRedis) return true;

  // 2. Check database — fuzzy title match
  try {
    const similarArticle = await prisma.article.findFirst({
      where: {
        title: {
          contains: title.substring(0, 60), // first 60 chars
          mode: 'insensitive',
        },
        status: 'published',
      },
      select: { id: true },
    });
    if (similarArticle) {
      // Cache in Redis for next time
      await redis.sadd(PUBLISHED_TITLES_KEY, titleKey);
      return true;
    }
  } catch {
    // DB check is best-effort
  }

  return false;
}
