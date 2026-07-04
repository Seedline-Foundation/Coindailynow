/**
 * Video Pipeline Orchestrator (P6).
 *
 * Mirrors aiReviewAgent.orchestrateArticleCreation for video. Given a
 * published Article, produces a SHORT (60s vertical) + LONG (3-5min landscape)
 * video and queues for human review.
 *
 * Steps:
 *   0. loadArticle      — pull Article + featured image
 *   1. script           — generate SHORT + LONG scripts (LLM, with fallback)
 *   2. validateScript   — sanity check (length, hook present, scenes parseable)
 *   3. voiceover        — render TTS per scene via Coqui XTTS
 *   4. shortVideo       — D-ID avatar reads the SHORT script
 *   5. longVideo        — InVideo AI builds the LONG from article URL
 *   6. broll            — fal.ai cinematic clips (optional intro/outro)
 *   7. compose          — stitch (when needed) — most providers return final mp4 directly
 *   8. validateVideo    — duration/size sanity
 *   9. queueForReview   — flip status to READY_FOR_REVIEW
 */

import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'winston';
import { generateVideoScripts, VideoScript } from '../agents/video/scriptAgent';
import { renderVoiceover } from '../agents/video/coquiAdapter';
import { generateShortAvatarVideo } from '../agents/video/didAdapter';
import { generateLongStockVideo } from '../agents/video/invideoAdapter';
import { generateBrollClip } from '../agents/video/falAdapter';
import { searchStockClip } from '../agents/video/stockFootageAdapter';
import { pickMusicBed } from '../agents/video/musicBedAdapter';
import { buildSrtFromScript } from '../agents/video/subtitleAgent';
import { composeVideo } from '../agents/video/ffmpegComposer';
import { decideVideoStrategy } from '../agents/video/videoStrategyAgent';
import { cutClipsFromVideo } from '../agents/video/clipsAiAdapter';

const STEP_ORDER: Record<string, number> = {
  loadArticle: 0,
  strategy: 1,        // decide short / long / both from article characteristics
  script: 2,
  validateScript: 3,
  voiceover: 4,
  shortVideo: 5,
  longVideo: 6,
  broll: 7,
  music: 8,
  compose: 9,
  cutClips: 10,       // slice long video into social-ready clips via ClipsAI
  validateVideo: 11,
  queueForReview: 12,
};

export interface VideoRunResult {
  runId: string;
  status: 'READY_FOR_REVIEW' | 'FAILED';
  shortAssetId?: string;
  longAssetId?: string;
}

export async function runVideoPipeline(
  prisma: PrismaClient,
  _redis: Redis,
  logger: Logger,
  articleId: string,
): Promise<VideoRunResult> {
  // Create run row up-front so all subsequent step writes have something to FK to.
  const run = await prisma.videoRun.create({
    data: { articleId, status: 'RUNNING' },
    select: { id: true },
  });
  logger.info(`[video] starting run ${run.id} for article ${articleId}`);

  try {
    // Step 0 — load article
    const article = await stepWrap(prisma, run.id, 'loadArticle', 0, { articleId }, async () => {
      const a = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true, title: true, excerpt: true, content: true, slug: true,
          featuredImageUrl: true, language: true, status: true,
          Category: { select: { name: true, slug: true } },
        },
      });
      if (!a) throw new Error(`article ${articleId} not found`);
      if (a.status !== 'PUBLISHED') throw new Error(`article ${articleId} is not PUBLISHED`);
      return a;
    });

    // Step 1 — decide video strategy (short / long / both / cut clips)
    const strategy = await stepWrap(prisma, run.id, 'strategy', 1, {
      title: article.title,
      category: article.Category?.slug,
    }, async () => {
      return decideVideoStrategy(
        {
          articleId: article.id,
          title: article.title,
          excerpt: article.excerpt || undefined,
          content: article.content,
          category: article.Category?.slug || undefined,
          publishedAt: undefined,
        },
        logger,
      );
    });

    // Step 2 — script (in the article's language)
    const articleLang = (article.language || 'en').toLowerCase();
    const scripts = await stepWrap(prisma, run.id, 'script', 2, { articleId, title: article.title, language: articleLang, strategy: strategy.reason }, async () => {
      return generateVideoScripts(
        {
          articleId: article.id,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.Category?.slug,
          language: articleLang,
        },
        logger,
      );
    });

    // Step 3 — validate script
    await stepWrap(prisma, run.id, 'validateScript', 3, { hasShort: !!scripts.short, hasLong: !!scripts.long }, async () => {
      const issues: string[] = [];
      if (!scripts.short?.scenes?.length) issues.push('short script has no scenes');
      if (!scripts.long?.scenes?.length) issues.push('long script has no scenes');
      if (scripts.short.totalDurationSec < 40 || scripts.short.totalDurationSec > 90) issues.push(`short duration ${scripts.short.totalDurationSec}s out of 40-90 range`);
      if (scripts.long.totalDurationSec < 120 || scripts.long.totalDurationSec > 300) issues.push(`long duration ${scripts.long.totalDurationSec}s out of 120-300 range`);
      if (issues.length) logger.warn(`[video] script validation warnings: ${issues.join('; ')}`);
      return { passed: issues.length === 0, issues };
    });

    // Step 4 — voiceover (Coqui XTTS). Only render the audio for formats we'll produce.
    const voiceover = await stepWrap(prisma, run.id, 'voiceover', 4, { produceShort: strategy.produceShort, produceLong: strategy.produceLong }, async () => {
      const jobs: Array<Promise<any>> = [];
      if (strategy.produceShort) jobs.push(renderVoiceover(joinScript(scripts.short), { language: article.language || 'en' }, logger).catch(e => ({ ok: false, error: e.message })));
      else jobs.push(Promise.resolve({ ok: false, skipped: 'strategy=long-only' }));
      if (strategy.produceLong) jobs.push(renderVoiceover(joinScript(scripts.long), { language: article.language || 'en' }, logger).catch(e => ({ ok: false, error: e.message })));
      else jobs.push(Promise.resolve({ ok: false, skipped: 'strategy=short-only' }));
      const [shortAudio, longAudio] = await Promise.all(jobs);
      return { shortAudio, longAudio };
    });

    // Step 5 — SHORT (D-ID avatar). Skipped if strategy says long-only.
    const shortVideo = strategy.produceShort
      ? await stepWrap(prisma, run.id, 'shortVideo', 5, { format: 'SHORT', durationSec: scripts.short.totalDurationSec, language: articleLang }, async () => {
          return generateShortAvatarVideo(
            { script: scripts.short, articleId: article.id, articleTitle: article.title, language: articleLang },
            logger,
          );
        }).catch(err => {
          logger.warn(`[video] short video step failed (non-fatal): ${err.message}`);
          return { url: '', error: err.message } as any;
        })
      : (logger.info('[video] shortVideo skipped by strategy'), { url: '', skipped: true } as any);

    // Step 6 — LONG (InVideo AI from article URL). Skipped if strategy says short-only.
    const longVideo = strategy.produceLong
      ? await stepWrap(prisma, run.id, 'longVideo', 6, { format: 'LONG', durationSec: scripts.long.totalDurationSec }, async () => {
          return generateLongStockVideo(
            { script: scripts.long, articleId: article.id, articleSlug: article.slug, articleTitle: article.title },
            logger,
          );
        }).catch(err => {
          logger.warn(`[video] long video step failed (non-fatal): ${err.message}`);
          return { url: '', error: err.message } as any;
        })
      : (logger.info('[video] longVideo skipped by strategy'), { url: '', skipped: true } as any);

    // Step 7 — B-roll. Try fal.ai cinematic first; fall back to Pexels stock
    // footage if fal isn't configured / errored. Either source produces a clip
    // suitable for the compose step's intro splice.
    const broll = await stepWrap(prisma, run.id, 'broll', 7, { hint: scripts.short.scenes[0]?.visualHint }, async () => {
      const hint = scripts.short.scenes[0]?.visualHint || article.title;
      const fal = await generateBrollClip({ prompt: hint, durationSec: 5 }, logger);
      if (fal?.ok && fal.url) return { ...fal, source: 'fal' as const };
      // Pexels fallback — free, no GPU, no per-clip cost
      logger.info(`[video] fal broll unavailable (${fal?.error || 'no clip'}); trying Pexels stock`);
      const stock = await searchStockClip(
        { query: hint, orientation: 'portrait', size: 'medium', minDurationSec: 4 },
        logger,
      );
      if (stock?.ok && stock.url) return { ...stock, source: 'pexels' as const };
      return { ok: false, url: '', error: stock?.error || fal?.error || 'no broll source', source: 'none' as const };
    }).catch(err => {
      logger.warn(`[video] broll step failed (non-fatal): ${err.message}`);
      return { url: '', error: err.message } as any;
    });

    // Step 8 — music bed. Pick a track to sit under the voiceover. Optional;
    // composer skips music mix entirely if no URL resolved.
    const music = await stepWrap(prisma, run.id, 'music', 8, { category: article.Category?.slug }, async () => {
      return pickMusicBed(
        {
          category: article.Category?.slug,
          mood: article.Category?.slug || 'corporate',
          minDurationSec: Math.max(scripts.short.totalDurationSec, scripts.long.totalDurationSec),
        },
        logger,
      );
    }).catch(err => {
      logger.warn(`[video] music step failed (non-fatal): ${err.message}`);
      return { ok: false, url: '', error: err.message } as any;
    });

    // Build SRT once per format (cheap; reused by short + long compose calls)
    const shortSrt = buildSrtFromScript(scripts.short);
    const longSrt = buildSrtFromScript(scripts.long);

    // Step 9 — compose. ffmpeg stitching (intro + B-roll + base + outro) plus
    // optional finalize pass that burns subtitles and mixes music bed.
    const composed = await stepWrap(prisma, run.id, 'compose', 9, {
      hasShort: !!shortVideo?.url, hasBroll: !!broll?.url, hasMusic: !!music?.url, hasSubtitles: true,
    }, async () => {
      const out: any = { short: null, long: null };
      if (shortVideo?.url) {
        out.short = await composeVideo({
          baseVideoUrl: shortVideo.url,
          brollUrl: broll?.url,
          articleId: article.id,
          format: 'SHORT',
          subtitlesSrt: shortSrt,
          musicUrl: music?.url,
        }, logger);
      }
      if (longVideo?.url) {
        out.long = await composeVideo({
          baseVideoUrl: longVideo.url,
          articleId: article.id,
          format: 'LONG',
          subtitlesSrt: longSrt,
          musicUrl: music?.url,
          musicGain: 0.12, // longer-form gets even quieter music
        }, logger);
      }
      return out;
    }).catch(err => {
      logger.warn(`[video] compose step failed (non-fatal): ${err.message}`);
      return { short: null, long: null };
    });

    // Prefer the composed URL when ffmpeg succeeded; fall back to provider URL.
    if (composed?.short?.ok && composed.short.url) shortVideo.url = composed.short.url;
    if (composed?.long?.ok && composed.long.url) longVideo.url = composed.long.url;

    // Persist VideoAssets
    const assets: { format: string; url: string; provider: string }[] = [];
    if (shortVideo?.url) {
      await prisma.videoAsset.create({
        data: {
          runId: run.id, format: 'SHORT', url: shortVideo.url,
          durationSec: scripts.short.totalDurationSec,
          provider: shortVideo.provider || 'd-id',
          thumbnailUrl: (shortVideo as any).thumbnailUrl,
        },
      });
      assets.push({ format: 'SHORT', url: shortVideo.url, provider: shortVideo.provider || 'd-id' });
    }
    if (longVideo?.url) {
      await prisma.videoAsset.create({
        data: {
          runId: run.id, format: 'LONG', url: longVideo.url,
          durationSec: scripts.long.totalDurationSec,
          provider: longVideo.provider || 'invideo',
        },
      });
      assets.push({ format: 'LONG', url: longVideo.url, provider: longVideo.provider || 'invideo' });
    }
    if (broll?.url) {
      const brollProvider = (broll as any).provider || ((broll as any).source === 'pexels' ? 'pexels' : 'fal');
      await prisma.videoAsset.create({
        data: {
          runId: run.id, format: 'BROLL', url: broll.url,
          durationSec: (broll as any).durationSec || 5, provider: brollProvider,
        },
      });
      assets.push({ format: 'BROLL', url: broll.url, provider: brollProvider });
    }
    if (music?.url) {
      await prisma.videoAsset.create({
        data: {
          runId: run.id, format: 'MUSIC', url: music.url,
          durationSec: (music as any).durationSec || 0, provider: music.provider || 'env',
        },
      }).catch(err => logger.warn(`[video] persist MUSIC asset failed (non-fatal): ${err.message}`));
      assets.push({ format: 'MUSIC', url: music.url, provider: music.provider || 'env' });
    }

    // Step 10 — cut clips from the long video (ClipsAI). Only runs when strategy
    // says so and a long video URL exists. Persists each clip as a CLIP asset.
    if (strategy.cutClipsFromLong && longVideo?.url) {
      const cut = await stepWrap(prisma, run.id, 'cutClips', 10, { source: longVideo.url }, async () => {
        return cutClipsFromVideo(
          { videoUrl: longVideo.url, minDurationSec: 30, maxDurationSec: 90, maxClips: 5 },
          logger,
        );
      }).catch(err => {
        logger.warn(`[video] cutClips step failed (non-fatal): ${err.message}`);
        return { ok: false, clips: [] as any[], provider: 'clipsai' as const };
      });

      if (cut?.ok && cut.clips.length) {
        for (const clip of cut.clips) {
          await prisma.videoAsset.create({
            data: {
              runId: run.id, format: 'CLIP', url: clip.url,
              durationSec: Math.round(clip.endSec - clip.startSec) || 0,
              provider: 'clipsai',
            },
          }).catch(err => logger.warn(`[video] persist CLIP asset failed (non-fatal): ${err.message}`));
          assets.push({ format: 'CLIP', url: clip.url, provider: 'clipsai' });
        }
        logger.info(`[video] persisted ${cut.clips.length} clips from long video`);
      }
    }

    // Step 11 — validate video
    await stepWrap(prisma, run.id, 'validateVideo', 11, { assetCount: assets.length, strategy: strategy.reason }, async () => {
      const issues: string[] = [];
      // Blocker is now strategy-aware: if strategy asked for a short and we don't have one, that's a fail
      if (strategy.produceShort && !shortVideo?.url) issues.push('SHORT expected but not produced');
      if (strategy.produceLong && !longVideo?.url) issues.push('LONG expected but not produced');
      const passed = (strategy.produceShort ? !!shortVideo?.url : true)
                  && (strategy.produceLong ? !!longVideo?.url : true);
      return { passed, issues, assets, strategy: { reason: strategy.reason, produceShort: strategy.produceShort, produceLong: strategy.produceLong, cutClipsFromLong: strategy.cutClipsFromLong } };
    });

    // Step 12 — queue for review
    await stepWrap(prisma, run.id, 'queueForReview', 12, { runId: run.id }, async () => ({ ok: true }));

    await prisma.videoRun.update({ where: { id: run.id }, data: { status: 'READY_FOR_REVIEW' } });
    logger.info(`[video] run ${run.id} READY_FOR_REVIEW; ${assets.length} assets`);

    return { runId: run.id, status: 'READY_FOR_REVIEW' };
  } catch (err: any) {
    logger.error(`[video] run ${run.id} failed: ${err.message}`);
    await prisma.videoRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', errorMessage: err.message },
    });
    return { runId: run.id, status: 'FAILED' };
  }
}

function joinScript(s: VideoScript): string {
  const parts: string[] = [];
  if (s.hook) parts.push(s.hook);
  for (const sc of s.scenes) parts.push(sc.text);
  if (s.cta) parts.push(s.cta);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Lightweight step recorder for VideoStep (mirrors stepRecorder but adapted
 * to the VideoStep model — different FK + smaller surface).
 */
async function stepWrap<T>(
  prisma: PrismaClient,
  runId: string,
  stepName: string,
  stepOrder: number,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = new Date();
  await prisma.videoStep.upsert({
    where: { runId_stepName: { runId, stepName } },
    create: { runId, stepName, stepOrder, status: 'RUNNING', input: safeJson(input), startedAt },
    update: { stepOrder, status: 'RUNNING', input: safeJson(input), output: null, errorMessage: null, startedAt, completedAt: null, durationMs: null },
  });
  try {
    const out = await fn();
    const completedAt = new Date();
    await prisma.videoStep.update({
      where: { runId_stepName: { runId, stepName } },
      data: {
        status: 'SUCCESS',
        output: safeJson(out),
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    });
    return out;
  } catch (err: any) {
    const completedAt = new Date();
    await prisma.videoStep.update({
      where: { runId_stepName: { runId, stepName } },
      data: {
        status: 'FAILED',
        errorMessage: err.message,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    });
    throw err;
  }
}

function safeJson(v: unknown): any {
  if (v === undefined) return null;
  return JSON.parse(JSON.stringify(v, (_k, x) => x instanceof Map ? Object.fromEntries(x) : x));
}
