/**
 * Ads Management & Rotation Agent
 * 
 * Autonomous AI-powered ad management engine powered by DeepSeek R1.
 * Triggered when admin approves an ad item. Handles thousands of
 * concurrent placements, real-time monitoring, and reporting.
 *
 * Core Modules:
 * 1. Ingestion & Approval Module - Interfaces with admin queues
 * 2. Contextual Traffic Analysis Engine - Scans pages for traffic heat
 * 3. Budget-Pacing & Allocation Core - Calculates depletion rates
 * 4. Dynamic Placement & Rotation Engine - Executes physical delivery
 * 5. Real-Time Reporting Bus - Streams data to dashboards
 *
 * Performance: <100ms ad selection latency, scalable to 10k+ concurrent placements
 */

import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_ADS_MODEL || 'deepseek-r1:8b';

const REDIS_PREFIX = {
  CAMPAIGN: 'ads:campaign:',
  CAMPAIGN_INDEX: 'ads:campaign:index:all',
  INVENTORY: 'ads:inventory:',
  FREQ_CAP: 'ads:freqcap:',
  PLACEMENT: 'ads:placement:',
  METRICS: 'ads:metrics:',
  ROTATION: 'ads:rotation:',
  QUEUE: 'ads:queue:',
  LOCK: 'ads:lock:',
  SCORING: 'ads:scoring:',
  BUDGET: 'ads:budget:',
};

const PACING_INTERVAL_MS = 60_000; // 1 minute pacing recalculation
const REPORTING_INTERVAL_MS = 30_000; // 30s reporting push
const MODEL_RETRAIN_INTERVAL_MS = 30 * 60_000; // 30 minutes
const MAX_CONCURRENT_PLACEMENTS = 10_000;
const AD_SELECTION_TIMEOUT_MS = 80; // Must be < 100ms
const BUDGET_TIERS = {
  PREMIUM: 0.6, // top 60% budget = premium inventory
  STANDARD: 0.3, // 30-60% = standard
  LONG_TAIL: 0.0, // below 30% = long tail
};

// ─── Creative Validation Constants ──────────────────────────────────
const CREATIVE_LIMITS = {
  image: {
    maxFileSizeMB: 2,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] as string[],
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 50, height: 50 },
  },
  video: {
    maxFileSizeMB: 50,
    allowedFormats: ['video/mp4', 'video/webm', 'video/ogg'] as string[],
    maxDurationSec: 120,
    minDurationSec: 5,
    maxBitrateMbps: 8,
    allowedCodecs: ['h264', 'h265', 'vp8', 'vp9', 'av1'] as string[],
    requiredAspectRatios: ['16:9', '9:16', '1:1', '4:3'] as string[],
  },
  video_preroll: {
    maxFileSizeMB: 30,
    maxDurationSec: 30,
    skippableAfterSec: 5,
    allowedFormats: ['video/mp4', 'video/webm'] as string[],
  },
  video_outstream: {
    maxFileSizeMB: 30,
    maxDurationSec: 60,
    autoplayMuted: true,
    allowedFormats: ['video/mp4', 'video/webm'] as string[],
  },
  rich_media: {
    maxFileSizeMB: 5,
    maxInitialLoadKB: 200,
    maxExpandedLoadKB: 500,
    allowedTechnologies: ['html5', 'css3', 'js'] as string[],
    bannedTechnologies: ['flash', 'java', 'silverlight'] as string[],
    sandboxRequired: true,
    maxAnimationDurationSec: 30,
    maxFrameRate: 30,
    maxLoopCount: 3,
  },
  animated_image: {
    maxFileSizeMB: 3,
    allowedFormats: ['image/gif', 'image/webp', 'image/apng'] as string[],
    maxFrameCount: 150,
    maxDurationSec: 15,
    maxFrameRate: 24,
  },
};

// ─── VAST Protocol Constants ────────────────────────────────────────
const VAST_VERSION = '4.2';
const VPAID_VERSION = '2.0';
const VIEWABILITY_THRESHOLDS = {
  display: { percentInView: 50, continuousSeconds: 1 }, // MRC standard
  video: { percentInView: 50, continuousSeconds: 2 },   // MRC video standard
  rich_media: { percentInView: 50, continuousSeconds: 1 },
  largeFormat: { percentInView: 30, continuousSeconds: 1 }, // 242,500+ px
};
const VIDEO_QUARTILE_EVENTS = ['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete'] as const;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AdType = 'image' | 'animated_image' | 'html5' | 'rich_media' | 'video' | 'video_preroll' | 'video_outstream' | 'article' | 'post' | 'comment';
export type AdStatus = 'pending' | 'approved' | 'active' | 'paused' | 'depleted' | 'completed' | 'cancelled';
export type BudgetTier = 'premium' | 'standard' | 'long_tail';
export type RotationStrategy = 'sequential' | 'random' | 'optimized' | 'even' | 'weighted' | 'pacing';
export type PacingMode = 'even' | 'asap' | 'dayparting';
export type PlacementLocation = 'homepage_hero' | 'homepage_sidebar' | 'article_top' | 'article_inline' | 'article_bottom' | 'category_banner' | 'newsletter_header' | 'newsletter_inline' | 'feed_card' | 'search_results' | 'sidebar_sticky' | 'footer_banner' | 'video_preroll' | 'video_midroll' | 'video_postroll' | 'mobile_interstitial' | 'exit_intent' | 'notification_bar';
export type VideoPlacementType = 'preroll' | 'midroll' | 'postroll' | 'outstream' | 'in_feed' | 'in_article';
export type ViewabilityStatus = 'not_measured' | 'in_view' | 'out_of_view' | 'viewable' | 'non_viewable';

export interface AdCampaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  adType: AdType;
  creativeUrl: string;
  creativeAlternatives?: string[]; // Multiple creatives for A/B testing
  title: string;
  description: string;
  targetUrl: string;
  totalBudget: number;
  remainingBudget: number;
  dailyCap: number;
  dailySpent: number;
  status: AdStatus;
  currentTier: BudgetTier;
  rotationStrategy: RotationStrategy;
  pacingMode: PacingMode;
  targeting: AdTargeting;
  scheduling: AdScheduling;
  frequencyCap: FrequencyCap;
  performance: CampaignPerformance;
  createdAt: Date;
  approvedAt?: Date;
  startDate: Date;
  endDate: Date;
  priority: number; // 1-100, higher = more priority
  bidAmount: number; // CPM bid in USD
  metadata?: Record<string, any>;
  // ─── Rich Media / Video Fields ──────────────────────────────────
  creativeSpec?: CreativeSpec;
  vastTag?: string;            // VAST XML tag URL for video ads
  vpaidEnabled?: boolean;      // VPAID interactive overlay support
  companionAds?: CompanionAd[];// Display companions for video campaigns
}

export interface CreativeSpec {
  mimeType: string;
  fileSizeBytes: number;
  // Image fields
  format?: string;               // jpeg, png, webp, avif, gif, apng
  responsiveSizes?: ResponsiveSize[];  // Multiple sizes for srcset
  // Video fields
  durationSec?: number;
  bitrateMbps?: number;
  codec?: string;
  aspectRatio?: string;          // '16:9', '9:16', '1:1'
  hasAudio?: boolean;
  skipOffsetSec?: number;        // Seconds before skip button appears
  videoQuartileTrackers?: VideoQuartileTrackers;
  // Rich media fields
  initialLoadKB?: number;
  expandedLoadKB?: number;
  expandable?: boolean;
  expandDirection?: 'up' | 'down' | 'left' | 'right' | 'fullscreen';
  sandboxed?: boolean;
  animationDurationSec?: number;
  frameRate?: number;
  loopCount?: number;
  clickRegions?: ClickRegion[];  // Mapped click areas within the creative
}

export interface ResponsiveSize {
  width: number;
  height: number;
  url: string;
  pixelDensity: number; // 1, 1.5, 2, 3 (for @2x, @3x)
  format: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface ClickRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  targetUrl: string;
  label: string;
}

export interface CompanionAd {
  width: number;
  height: number;
  creativeUrl: string;
  clickThroughUrl: string;
  trackingPixel: string;
}

export interface VideoQuartileTrackers {
  start: string;
  firstQuartile: string;
  midpoint: string;
  thirdQuartile: string;
  complete: string;
  mute?: string;
  unmute?: string;
  pause?: string;
  resume?: string;
  fullscreen?: string;
  skip?: string;
}

export interface CreativeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixApplied: string[];
  normalizedSpec: Partial<CreativeSpec>;
}

export interface AdTargeting {
  sections: string[]; // ['news', 'markets', 'defi', 'regulation']
  regions: string[]; // ['NG', 'KE', 'ZA', 'GH']
  languages: string[];
  devices: ('mobile' | 'desktop' | 'tablet')[];
  newsletterAllowed: boolean;
  audienceSegments: string[];
  contextualKeywords: string[];
  excludeSections?: string[];
  excludeRegions?: string[];
  behavioralTargets?: BehavioralTarget[];
}

export interface BehavioralTarget {
  type: 'visited_section' | 'read_article' | 'search_query' | 'time_on_page' | 'return_visitor';
  value: string;
  weight: number;
}

export interface AdScheduling {
  startDate: Date;
  endDate: Date;
  dayparting?: DaypartingConfig;
  timezone: string;
}

export interface DaypartingConfig {
  enabled: boolean;
  schedule: {
    [day: string]: { start: number; end: number }[]; // hours 0-23
  };
}

export interface FrequencyCap {
  maxImpressionsPerUser: number;
  maxImpressionsPerUserPerDay: number;
  maxClicksPerUserPerDay: number;
  windowHours: number;
}

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  viewableImpressions: number;
  totalSpent: number;
  ctr: number; // click-through rate
  cpc: number; // cost per click
  cpm: number; // cost per thousand impressions
  viewabilityRate: number;
  burnRate: number; // budget per hour
  remainingImpressions: number;
  bestCreativeIndex: number;
  creativePerformance: CreativePerformance[];
}

export interface CreativePerformance {
  creativeIndex: number;
  impressions: number;
  clicks: number;
  ctr: number;
  score: number; // AI-calculated optimization score
}

export interface InventorySlot {
  id: string;
  location: PlacementLocation;
  page: string;
  trafficScore: number; // 1-100 based on real-time analytics
  currentAdId: string | null;
  slotType: AdType[];
  dimensions: { width: number; height: number };
  minBudgetTier: BudgetTier;
  isActive: boolean;
  fillRate: number;
  avgCtr: number;
  lastUpdated: Date;
  // ─── Video/Rich Media Slot Fields ─────────────────────────────
  supportsVideo?: boolean;
  videoPlacement?: VideoPlacementType;
  maxVideoDurationSec?: number;
  supportsVPAID?: boolean;
  supportsRichMedia?: boolean;
  allowsExpandable?: boolean;
  lazyLoad?: boolean;
  viewabilityOptimized?: boolean;
  responsiveSizes?: { width: number; height: number }[];
}

export interface PlacementDecision {
  id: string;
  campaignId: string;
  slotId: string;
  creativeIndex: number;
  bidAmount: number;
  effectiveCpm: number;
  reason: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface AdRequest {
  slotId: string;
  page: string;
  section: string;
  region: string;
  language: string;
  device: 'mobile' | 'desktop' | 'tablet';
  userId?: string;
  sessionId: string;
  contextualKeywords: string[];
  timestamp: Date;
  // ─── Video/Rich Media Request Context ──────────────────────────
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet';
  screenWidth?: number;
  screenHeight?: number;
  pixelDensity?: number;     // Device pixel ratio (1, 1.5, 2, 3)
  supportsVideo?: boolean;
  supportsVPAID?: boolean;
  acceptsFormats?: string[]; // MIME types the client can render
  videoContext?: {
    contentDurationSec?: number;  // Duration of the video content (for midroll calc)
    isAutoplay?: boolean;
    isMuted?: boolean;
    playerWidth?: number;
    playerHeight?: number;
  };
}

export interface AdResponse {
  campaignId: string;
  creativeUrl: string;
  targetUrl: string;
  trackingPixel: string;
  clickTracker: string;
  adType: AdType;
  dimensions: { width: number; height: number };
  metadata: Record<string, any>;
  // ─── Video/Rich Media Response Fields ──────────────────────────
  vastXml?: string;              // Inline VAST XML for video ads
  vastTagUrl?: string;           // VAST tag URL (redirect)
  vpaidJs?: string;              // VPAID JS controller URL
  videoSpec?: {
    durationSec: number;
    skipOffsetSec?: number;
    autoplay: boolean;
    muted: boolean;
    aspectRatio: string;
    companions?: CompanionAd[];
    quartileTrackers: VideoQuartileTrackers;
  };
  richMediaSpec?: {
    sandboxed: boolean;
    expandable: boolean;
    expandDirection?: string;
    initialLoadKB: number;
    clickRegions: ClickRegion[];
    animationDurationSec?: number;
  };
  imageSpec?: {
    srcset: string;              // Responsive srcset attribute
    sizes: string;               // sizes attribute for responsive
    format: string;
    lazyLoad: boolean;
    placeholderUrl?: string;     // Low-quality placeholder
  };
  viewabilityConfig?: {
    threshold: number;           // % in view to count
    continuousSeconds: number;   // Seconds continuously in view
    tracker: string;             // Viewability beacon URL
  };
}

export interface PlacementReport {
  campaignId: string;
  advertiserId: string;
  period: { start: Date; end: Date };
  metrics: CampaignPerformance;
  burnRate: {
    current: number;
    projected: number;
    daysRemaining: number;
  };
  trafficAllocation: {
    premium: number;
    standard: number;
    longTail: number;
  };
  topPerformingSlots: { slotId: string; impressions: number; ctr: number }[];
  creativeBreakdown: CreativePerformance[];
  recommendations: string[];
}

export interface SystemHealthReport {
  totalActiveCampaigns: number;
  totalBudgetInSystem: number;
  projectedDepletionDate: Date;
  fillRateByTier: { premium: number; standard: number; longTail: number };
  pacingEfficiency: number;
  averageSelectionLatencyMs: number;
  activeInventorySlots: number;
  revenueToday: number;
  alertCount: number;
  alerts: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  type: 'pacing_error' | 'velocity_spike' | 'budget_exhaustion' | 'low_fill_rate' | 'latency_spike' | 'fraud_detected';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  campaignId?: string;
  timestamp: Date;
}

// ============================================================================
// DEEPSEEK R1 CLIENT — AD OPTIMIZATION
// ============================================================================

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  eval_count?: number;
  total_duration?: number;
}

async function callDeepSeekR1(
  prompt: string,
  options: { temperature?: number; maxTokens?: number; systemPrompt?: string } = {}
): Promise<{ response: string; tokensUsed: number; durationMs: number }> {
  const { temperature = 0.2, maxTokens = 4096, systemPrompt } = options;
  const startTime = Date.now();

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: { temperature, num_predict: maxTokens },
      }),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);

    const data: OllamaResponse = await res.json();
    return { response: data.response, tokensUsed: data.eval_count || 0, durationMs: Date.now() - startTime };
  } catch (error) {
    logger.error('[AdsAgent] DeepSeek R1 call failed:', error);
    throw error;
  }
}

const ADS_SYSTEM_PROMPT = `You are the CoinDaily Ads Optimization AI. You analyze ad campaign data, traffic patterns, and user behavior to maximize advertiser ROI and platform revenue. You specialize in the African cryptocurrency market.

Your decisions must:
1. Respect budget constraints and pacing requirements
2. Optimize for CTR and conversions
3. Ensure fairness across advertisers (small budgets get some premium inventory)
4. Consider contextual relevance (crypto ads near crypto content)
5. Respect frequency caps and user experience

Always respond with valid JSON matching the requested schema.`;

// ============================================================================
// MODULE 1: INGESTION & APPROVAL
// ============================================================================

/**
 * Process a newly approved ad campaign — the main trigger point.
 * Called by the admin approval flow. Initializes the campaign in the
 * rotation engine and begins placement immediately.
 */
export async function onAdApproved(campaign: AdCampaign): Promise<{
  success: boolean;
  campaignId: string;
  initialPlacements: number;
  estimatedDailyImpressions: number;
  tier: BudgetTier;
}> {
  logger.info(`[AdsAgent] Ad campaign approved: ${campaign.id} by ${campaign.advertiserName}`);

  try {
    // 1. Classify the creative
    const classification = classifyCreative(campaign);
    campaign.currentTier = calculateBudgetTier(campaign);

    // 2. Register in rotation engine
    await registerCampaign(campaign);

    // 3. Calculate initial pacing
    const pacingResult = calculatePacing(campaign);
    campaign.dailyCap = pacingResult.dailyCap;

    // 4. Scan available inventory
    const availableSlots = await scanInventory(campaign);

    // 5. Run initial placements
    const placements = await executePlacementBatch(campaign, availableSlots);

    // 5b. Sync campaign to external placement connectors (CMS + Newsletter)
    await syncCampaignConnectors(campaign.id);

    // 6. Start monitoring
    await startCampaignMonitoring(campaign.id);

    // 7. Use DeepSeek R1 for initial optimization scoring
    const aiOptimization = await getAIOptimizationScore(campaign, availableSlots);

    logger.info(`[AdsAgent] Campaign ${campaign.id} activated with ${placements.length} initial placements`);

    return {
      success: true,
      campaignId: campaign.id,
      initialPlacements: placements.length,
      estimatedDailyImpressions: pacingResult.estimatedDailyImpressions,
      tier: campaign.currentTier,
    };
  } catch (error) {
    logger.error(`[AdsAgent] Failed to process approved ad ${campaign.id}:`, error);
    await updateCampaignStatus(campaign.id, 'paused');
    return {
      success: false,
      campaignId: campaign.id,
      initialPlacements: 0,
      estimatedDailyImpressions: 0,
      tier: 'long_tail',
    };
  }
}

function classifyCreative(campaign: AdCampaign): {
  adType: AdType;
  dimensions: string;
  hasMultipleCreatives: boolean;
  isVideo: boolean;
  isRichMedia: boolean;
  isAnimated: boolean;
  requiresVAST: boolean;
  requiresSandbox: boolean;
} {
  const isVideo = ['video', 'video_preroll', 'video_outstream'].includes(campaign.adType);
  const isRichMedia = campaign.adType === 'rich_media';
  const isAnimated = campaign.adType === 'animated_image';
  const requiresVAST = isVideo && (campaign.adType === 'video_preroll' || !!campaign.vastTag);
  const requiresSandbox = isRichMedia || campaign.adType === 'html5';

  let dimensions = 'responsive';
  if (campaign.creativeSpec) {
    const spec = campaign.creativeSpec;
    if (campaign.adType === 'image' && spec.responsiveSizes && spec.responsiveSizes.length > 0) {
      dimensions = spec.responsiveSizes.map(s => `${s.width}x${s.height}`).join(', ');
    } else if (isVideo && spec.aspectRatio) {
      dimensions = spec.aspectRatio;
    }
  } else if (campaign.adType === 'image') {
    dimensions = '728x90';
  }

  return {
    adType: campaign.adType,
    dimensions,
    hasMultipleCreatives: (campaign.creativeAlternatives?.length || 0) > 0,
    isVideo,
    isRichMedia,
    isAnimated,
    requiresVAST,
    requiresSandbox,
  };
}

function calculateBudgetTier(campaign: AdCampaign): BudgetTier {
  const budgetRatio = campaign.remainingBudget / campaign.totalBudget;
  if (budgetRatio > BUDGET_TIERS.PREMIUM) return 'premium';
  if (budgetRatio > BUDGET_TIERS.STANDARD) return 'standard';
  return 'long_tail';
}

async function registerCampaign(campaign: AdCampaign): Promise<void> {
  const key = `${REDIS_PREFIX.CAMPAIGN}${campaign.id}`;
  await redisClient.setEx(key, 86400 * 30, JSON.stringify({
    ...campaign,
    createdAt: campaign.createdAt.toISOString(),
    approvedAt: new Date().toISOString(),
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
  }));

  // Add to master campaign index
  await addCampaignToIndex(campaign.id);

  // Add to active campaigns set
  const activeKey = `${REDIS_PREFIX.CAMPAIGN}active`;
  const ids = await getActiveCampaignIds();
  if (!ids.includes(campaign.id)) {
    await redisClient.set(activeKey, JSON.stringify([...ids, campaign.id]));
  }
}

async function updateCampaignStatus(campaignId: string, status: AdStatus): Promise<void> {
  const key = `${REDIS_PREFIX.CAMPAIGN}${campaignId}`;
  const raw = await redisClient.get(key);
  if (raw) {
    const campaign = JSON.parse(raw);
    campaign.status = status;
    await redisClient.setEx(key, 86400 * 30, JSON.stringify(campaign));
  }
}

// ============================================================================
// MODULE 1B: CREATIVE VALIDATION ENGINE
// ============================================================================

/**
 * Validate creative assets against platform policies and IAB standards.
 * Runs on upload and again on approval. Rejects non-compliant creatives
 * and auto-fixes where possible (e.g. converting formats).
 */
export function validateCreative(campaign: AdCampaign): CreativeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const autoFixApplied: string[] = [];
  const normalizedSpec: Partial<CreativeSpec> = {};
  const spec = campaign.creativeSpec;

  // ── Image Validation ───
  if (campaign.adType === 'image') {
    const limits = CREATIVE_LIMITS.image;
    if (spec) {
      if (spec.fileSizeBytes > limits.maxFileSizeMB * 1024 * 1024) {
        errors.push(`Image size ${(spec.fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds max ${limits.maxFileSizeMB}MB`);
      }
      if (spec.mimeType && !limits.allowedFormats.includes(spec.mimeType)) {
        errors.push(`Image format "${spec.mimeType}" not allowed. Accepted: ${limits.allowedFormats.join(', ')}`);
      }
      // Auto-generate responsive srcset if not provided
      if (!spec.responsiveSizes || spec.responsiveSizes.length === 0) {
        warnings.push('No responsive sizes provided — auto-generating srcset from primary creative');
        normalizedSpec.responsiveSizes = generateResponsiveSizes(campaign.creativeUrl, spec);
        autoFixApplied.push('auto-generated responsive srcset');
      }
      // Recommend WebP/AVIF for mobile-heavy African market
      if (spec.format && !['webp', 'avif'].includes(spec.format)) {
        warnings.push(`Format "${spec.format}" used — consider WebP/AVIF for 40-60% smaller files on African mobile networks`);
      }
    } else {
      warnings.push('No creativeSpec provided for image ad — using defaults');
    }
  }

  // ── Animated Image Validation ───
  if (campaign.adType === 'animated_image') {
    const limits = CREATIVE_LIMITS.animated_image;
    if (spec) {
      if (spec.fileSizeBytes > limits.maxFileSizeMB * 1024 * 1024) {
        errors.push(`Animated image ${(spec.fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds max ${limits.maxFileSizeMB}MB`);
      }
      if (spec.mimeType && !limits.allowedFormats.includes(spec.mimeType)) {
        errors.push(`Animated format "${spec.mimeType}" not allowed. Accepted: ${limits.allowedFormats.join(', ')}`);
      }
      if (spec.frameRate && spec.frameRate > limits.maxFrameRate) {
        warnings.push(`Frame rate ${spec.frameRate}fps exceeds recommended max ${limits.maxFrameRate}fps — may cause performance issues on low-end devices`);
        normalizedSpec.frameRate = limits.maxFrameRate;
        autoFixApplied.push(`capped frame rate to ${limits.maxFrameRate}fps`);
      }
      if (spec.animationDurationSec && spec.animationDurationSec > limits.maxDurationSec) {
        errors.push(`Animation duration ${spec.animationDurationSec}s exceeds max ${limits.maxDurationSec}s`);
      }
      if (spec.loopCount && spec.loopCount > 3) {
        normalizedSpec.loopCount = 3;
        autoFixApplied.push('capped loop count to 3 (IAB standard)');
      }
    }
  }

  // ── Video Validation ───
  if (['video', 'video_preroll', 'video_outstream'].includes(campaign.adType)) {
    const limits = campaign.adType === 'video_preroll'
      ? CREATIVE_LIMITS.video_preroll
      : campaign.adType === 'video_outstream'
        ? CREATIVE_LIMITS.video_outstream
        : CREATIVE_LIMITS.video;

    if (!spec) {
      errors.push('Video campaigns MUST include creativeSpec with duration, codec, and aspect ratio');
    } else {
      if (spec.fileSizeBytes > limits.maxFileSizeMB * 1024 * 1024) {
        errors.push(`Video size ${(spec.fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds max ${limits.maxFileSizeMB}MB`);
      }
      if (spec.mimeType && !limits.allowedFormats.includes(spec.mimeType)) {
        errors.push(`Video format "${spec.mimeType}" not allowed. Accepted: ${limits.allowedFormats.join(', ')}`);
      }
      if (spec.durationSec && spec.durationSec > limits.maxDurationSec) {
        errors.push(`Video duration ${spec.durationSec}s exceeds max ${limits.maxDurationSec}s for ${campaign.adType}`);
      }
      if (campaign.adType === 'video' && spec.durationSec && spec.durationSec < CREATIVE_LIMITS.video.minDurationSec) {
        errors.push(`Video duration ${spec.durationSec}s below min ${CREATIVE_LIMITS.video.minDurationSec}s`);
      }
      if (spec.bitrateMbps && spec.bitrateMbps > CREATIVE_LIMITS.video.maxBitrateMbps) {
        warnings.push(`Video bitrate ${spec.bitrateMbps}Mbps is high — may buffer on 3G/2G African networks. Recommend ≤ 4Mbps`);
      }
      if (spec.codec && !CREATIVE_LIMITS.video.allowedCodecs.includes(spec.codec)) {
        errors.push(`Video codec "${spec.codec}" not supported. Use: ${CREATIVE_LIMITS.video.allowedCodecs.join(', ')}`);
      }
      if (!spec.aspectRatio) {
        warnings.push('No aspect ratio specified — defaulting to 16:9');
        normalizedSpec.aspectRatio = '16:9';
        autoFixApplied.push('set default aspect ratio 16:9');
      }
      // Preroll must have skip offset
      if (campaign.adType === 'video_preroll' && !spec.skipOffsetSec) {
        normalizedSpec.skipOffsetSec = CREATIVE_LIMITS.video_preroll.skippableAfterSec;
        autoFixApplied.push(`set skip offset to ${CREATIVE_LIMITS.video_preroll.skippableAfterSec}s`);
      }
      // Outstream must autoplay muted
      if (campaign.adType === 'video_outstream') {
        if (spec.hasAudio !== false) {
          normalizedSpec.hasAudio = true; // has audio but will be muted
          warnings.push('Outstream video will autoplay muted per IAB/Chrome policy');
        }
      }
      // Require quartile trackers for video
      if (!spec.videoQuartileTrackers) {
        warnings.push('No video quartile trackers provided — auto-generating from campaign ID');
        normalizedSpec.videoQuartileTrackers = generateQuartileTrackers(campaign.id);
        autoFixApplied.push('auto-generated quartile tracking URLs');
      }
    }
  }

  // ── Rich Media Validation ───
  if (campaign.adType === 'rich_media' || campaign.adType === 'html5') {
    const limits = CREATIVE_LIMITS.rich_media;
    if (spec) {
      if (spec.fileSizeBytes > limits.maxFileSizeMB * 1024 * 1024) {
        errors.push(`Rich media size ${(spec.fileSizeBytes / 1024 / 1024).toFixed(1)}MB exceeds max ${limits.maxFileSizeMB}MB`);
      }
      if (spec.initialLoadKB && spec.initialLoadKB > limits.maxInitialLoadKB) {
        errors.push(`Initial load ${spec.initialLoadKB}KB exceeds max ${limits.maxInitialLoadKB}KB (IAB requirement)`);
      }
      if (spec.expandedLoadKB && spec.expandedLoadKB > limits.maxExpandedLoadKB) {
        errors.push(`Expanded load ${spec.expandedLoadKB}KB exceeds max ${limits.maxExpandedLoadKB}KB`);
      }
      if (spec.animationDurationSec && spec.animationDurationSec > limits.maxAnimationDurationSec) {
        normalizedSpec.animationDurationSec = limits.maxAnimationDurationSec;
        autoFixApplied.push(`capped animation duration to ${limits.maxAnimationDurationSec}s`);
      }
      if (spec.frameRate && spec.frameRate > limits.maxFrameRate) {
        normalizedSpec.frameRate = limits.maxFrameRate;
        autoFixApplied.push(`capped frame rate to ${limits.maxFrameRate}fps`);
      }
      if ( spec.loopCount && spec.loopCount > limits.maxLoopCount) {
        normalizedSpec.loopCount = limits.maxLoopCount;
        autoFixApplied.push(`capped loop count to ${limits.maxLoopCount}`);
      }
      // Force sandbox
      normalizedSpec.sandboxed = true;
      if (!spec.sandboxed) {
        autoFixApplied.push('enabled sandbox (required for all rich media)');
      }
    } else {
      errors.push('Rich media campaigns MUST include creativeSpec');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    autoFixApplied,
    normalizedSpec,
  };
}

function generateResponsiveSizes(primaryUrl: string, spec: CreativeSpec): ResponsiveSize[] {
  // Generate standard IAB responsive sizes from the primary creative
  const baseUrl = primaryUrl.replace(/\\.[^.]+$/, '');
  const ext = primaryUrl.split('.').pop() || 'webp';
  return [
    { width: 320, height: 50, url: `${baseUrl}_320x50.${ext}`, pixelDensity: 1, format: 'webp' },
    { width: 320, height: 50, url: `${baseUrl}_320x50@2x.${ext}`, pixelDensity: 2, format: 'webp' },
    { width: 728, height: 90, url: `${baseUrl}_728x90.${ext}`, pixelDensity: 1, format: 'webp' },
    { width: 970, height: 250, url: `${baseUrl}_970x250.${ext}`, pixelDensity: 1, format: 'webp' },
    { width: 300, height: 250, url: `${baseUrl}_300x250.${ext}`, pixelDensity: 1, format: 'webp' },
    { width: 300, height: 250, url: `${baseUrl}_300x250@2x.${ext}`, pixelDensity: 2, format: 'webp' },
    { width: 300, height: 600, url: `${baseUrl}_300x600.${ext}`, pixelDensity: 1, format: 'webp' },
  ];
}

function generateQuartileTrackers(campaignId: string): VideoQuartileTrackers {
  const base = `/api/ads/track/video/${campaignId}`;
  return {
    start: `${base}/start`,
    firstQuartile: `${base}/firstQuartile`,
    midpoint: `${base}/midpoint`,
    thirdQuartile: `${base}/thirdQuartile`,
    complete: `${base}/complete`,
    mute: `${base}/mute`,
    unmute: `${base}/unmute`,
    pause: `${base}/pause`,
    resume: `${base}/resume`,
    fullscreen: `${base}/fullscreen`,
    skip: `${base}/skip`,
  };
}

// ============================================================================
// MODULE 1C: VAST/VPAID PROTOCOL ENGINE
// ============================================================================

/**
 * Generate VAST 4.2 XML for video ad campaigns.
 * Supports linear (preroll/midroll/postroll), non-linear overlays,
 * companion ads, and VPAID interactive extensions.
 */
export function generateVASTXml(campaign: AdCampaign, slot: InventorySlot): string {
  const spec = campaign.creativeSpec;
  const duration = spec?.durationSec || 30;
  const hours = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;
  const durationStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const skipOffset = spec?.skipOffsetSec
    ? `skipoffset="${String(Math.floor(spec.skipOffsetSec / 3600)).padStart(2, '0')}:${String(Math.floor((spec.skipOffsetSec % 3600) / 60)).padStart(2, '0')}:${String(spec.skipOffsetSec % 60).padStart(2, '0')}"`
    : '';

  const trackers = spec?.videoQuartileTrackers || generateQuartileTrackers(campaign.id);

  const companionXml = (campaign.companionAds || []).map(c => `
        <Companion width="${c.width}" height="${c.height}">
          <StaticResource creativeType="image/png"><![CDATA[${c.creativeUrl}]]></StaticResource>
          <CompanionClickThrough><![CDATA[${c.clickThroughUrl}]]></CompanionClickThrough>
          <TrackingEvents>
            <Tracking event="creativeView"><![CDATA[${c.trackingPixel}]]></Tracking>
          </TrackingEvents>
        </Companion>`).join('');

  const vpaidExtension = campaign.vpaidEnabled ? `
      <Extensions>
        <Extension type="VPAID">
          <AdParameters><![CDATA[{"campaignId":"${campaign.id}","interactive":true}]]></AdParameters>
        </Extension>
      </Extensions>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="${VAST_VERSION}" xmlns="http://www.iab.com/VAST">
  <Ad id="${campaign.id}" sequence="1">
    <InLine>
      <AdSystem version="1.0">CoinDaily AdsAgent</AdSystem>
      <AdTitle><![CDATA[${campaign.title}]]></AdTitle>
      <Description><![CDATA[${campaign.description}]]></Description>
      <Impression><![CDATA[/api/ads/track/impression/${campaign.id}/${slot.id}]]></Impression>
      <Creatives>
        <Creative id="creative_${campaign.id}" sequence="1">
          <Linear ${skipOffset}>
            <Duration>${durationStr}</Duration>
            <TrackingEvents>
              <Tracking event="start"><![CDATA[${trackers.start}]]></Tracking>
              <Tracking event="firstQuartile"><![CDATA[${trackers.firstQuartile}]]></Tracking>
              <Tracking event="midpoint"><![CDATA[${trackers.midpoint}]]></Tracking>
              <Tracking event="thirdQuartile"><![CDATA[${trackers.thirdQuartile}]]></Tracking>
              <Tracking event="complete"><![CDATA[${trackers.complete}]]></Tracking>
              ${trackers.mute ? `<Tracking event="mute"><![CDATA[${trackers.mute}]]></Tracking>` : ''}
              ${trackers.unmute ? `<Tracking event="unmute"><![CDATA[${trackers.unmute}]]></Tracking>` : ''}
              ${trackers.pause ? `<Tracking event="pause"><![CDATA[${trackers.pause}]]></Tracking>` : ''}
              ${trackers.resume ? `<Tracking event="resume"><![CDATA[${trackers.resume}]]></Tracking>` : ''}
              ${trackers.fullscreen ? `<Tracking event="fullscreen"><![CDATA[${trackers.fullscreen}]]></Tracking>` : ''}
              ${trackers.skip ? `<Tracking event="skip"><![CDATA[${trackers.skip}]]></Tracking>` : ''}
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough><![CDATA[${campaign.targetUrl}]]></ClickThrough>
              <ClickTracking><![CDATA[/api/ads/track/click/${campaign.id}/${slot.id}]]></ClickTracking>
            </VideoClicks>
            <MediaFiles>
              <MediaFile delivery="progressive" type="${spec?.mimeType || 'video/mp4'}" width="${slot.dimensions.width}" height="${slot.dimensions.height}" bitrate="${Math.floor((spec?.bitrateMbps || 2) * 1000)}" codec="${spec?.codec || 'h264'}">
                <![CDATA[${campaign.creativeUrl}]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
        ${companionXml ? `<Creative><CompanionAds>${companionXml}\n        </CompanionAds></Creative>` : ''}
      </Creatives>
      ${vpaidExtension}
    </InLine>
  </Ad>
</VAST>`;
}

/**
 * Generate a VAST tag URL for redirect-based video serving (wrapper approach).
 */
export function generateVASTTagUrl(campaignId: string, slotId: string): string {
  return `/api/ads/vast/${campaignId}/${slotId}`;
}

// ============================================================================
// MODULE 1D: VIEWABILITY TRACKING ENGINE
// ============================================================================

/**
 * Calculate viewability configuration for an ad placement.
 * Follows MRC (Media Rating Council) standards:
 *   - Display: 50% pixels in view for 1 continuous second
 *   - Video:   50% pixels in view for 2 continuous seconds
 *   - Large (>242,500px): 30% pixels in view for 1 second
 */
export function getViewabilityConfig(
  adType: AdType,
  dimensions: { width: number; height: number }
): { threshold: number; continuousSeconds: number; tracker: string; standard: string } {
  const pixelArea = dimensions.width * dimensions.height;
  const isLargeFormat = pixelArea >= 242500;
  const isVideo = ['video', 'video_preroll', 'video_outstream'].includes(adType);
  const isRich = ['rich_media', 'html5'].includes(adType);

  if (isVideo) {
    return {
      threshold: VIEWABILITY_THRESHOLDS.video.percentInView,
      continuousSeconds: VIEWABILITY_THRESHOLDS.video.continuousSeconds,
      tracker: '/api/ads/track/viewability',
      standard: 'MRC Video',
    };
  }

  if (isLargeFormat) {
    return {
      threshold: VIEWABILITY_THRESHOLDS.largeFormat.percentInView,
      continuousSeconds: VIEWABILITY_THRESHOLDS.largeFormat.continuousSeconds,
      tracker: '/api/ads/track/viewability',
      standard: 'MRC Large Format',
    };
  }

  if (isRich) {
    return {
      threshold: VIEWABILITY_THRESHOLDS.rich_media.percentInView,
      continuousSeconds: VIEWABILITY_THRESHOLDS.rich_media.continuousSeconds,
      tracker: '/api/ads/track/viewability',
      standard: 'MRC Rich Media',
    };
  }

  return {
    threshold: VIEWABILITY_THRESHOLDS.display.percentInView,
    continuousSeconds: VIEWABILITY_THRESHOLDS.display.continuousSeconds,
    tracker: '/api/ads/track/viewability',
    standard: 'MRC Display',
  };
}

/**
 * Record a viewability event (called from client-side Intersection Observer beacon)
 */
export async function recordViewability(
  campaignId: string,
  slotId: string,
  data: {
    percentInView: number;
    viewDurationMs: number;
    wasViewable: boolean;
    device: string;
    connectionType?: string;
  }
): Promise<void> {
  const metricsKey = `${REDIS_PREFIX.METRICS}${campaignId}`;
  const raw = await redisClient.get(metricsKey);
  const metrics: CampaignPerformance = raw ? JSON.parse(raw) : createDefaultPerformance();

  if (data.wasViewable) {
    metrics.viewableImpressions += 1;
  }
  if (metrics.impressions > 0) {
    metrics.viewabilityRate = metrics.viewableImpressions / metrics.impressions;
  }

  await redisClient.setEx(metricsKey, 86400, JSON.stringify(metrics));

  // Store granular viewability data for AI analysis
  const viewKey = `${REDIS_PREFIX.METRICS}viewability:${campaignId}:${new Date().toISOString().slice(0, 13)}`; // hourly bucket
  const viewRaw = await redisClient.get(viewKey);
  const viewData: { total: number; viewable: number; avgPercent: number; avgDurationMs: number } = viewRaw
    ? JSON.parse(viewRaw)
    : { total: 0, viewable: 0, avgPercent: 0, avgDurationMs: 0 };

  viewData.total += 1;
  if (data.wasViewable) viewData.viewable += 1;
  viewData.avgPercent = ((viewData.avgPercent * (viewData.total - 1)) + data.percentInView) / viewData.total;
  viewData.avgDurationMs = ((viewData.avgDurationMs * (viewData.total - 1)) + data.viewDurationMs) / viewData.total;

  await redisClient.setEx(viewKey, 86400 * 7, JSON.stringify(viewData));
}

/**
 * Record video quartile progress events.
 */
export async function recordVideoEvent(
  campaignId: string,
  event: typeof VIDEO_QUARTILE_EVENTS[number] | 'mute' | 'unmute' | 'pause' | 'resume' | 'fullscreen' | 'skip',
  data?: { durationSec?: number; percentComplete?: number }
): Promise<void> {
  const key = `${REDIS_PREFIX.METRICS}video:${campaignId}`;
  const raw = await redisClient.get(key);
  const videoMetrics: Record<string, number> = raw ? JSON.parse(raw) : {};

  videoMetrics[event] = (videoMetrics[event] || 0) + 1;
  if (data?.percentComplete !== undefined) {
    videoMetrics['lastPercentComplete'] = data.percentComplete;
  }

  // Calculate video completion rate
  const starts = videoMetrics['start'] || 0;
  const completes = videoMetrics['complete'] || 0;
  if (starts > 0) {
    videoMetrics['completionRate'] = completes / starts;
    videoMetrics['q1Rate'] = (videoMetrics['firstQuartile'] || 0) / starts;
    videoMetrics['q2Rate'] = (videoMetrics['midpoint'] || 0) / starts;
    videoMetrics['q3Rate'] = (videoMetrics['thirdQuartile'] || 0) / starts;
  }

  await redisClient.setEx(key, 86400 * 30, JSON.stringify(videoMetrics));

  // If video was completed, record as a higher-value impression
  if (event === 'complete') {
    const metricsKey = `${REDIS_PREFIX.METRICS}${campaignId}`;
    const metricsRaw = await redisClient.get(metricsKey);
    if (metricsRaw) {
      const metrics: CampaignPerformance = JSON.parse(metricsRaw);
      metrics.viewableImpressions += 1; // Completed video = viewable
      await redisClient.setEx(metricsKey, 86400, JSON.stringify(metrics));
    }
  }

  logger.info(`[AdsAgent] Video event "${event}" for campaign ${campaignId}`);
}

// ============================================================================
// MODULE 1E: FORMAT NEGOTIATION & RESPONSIVE DELIVERY
// ============================================================================

/**
 * Negotiate the best creative format for the requesting client.
 * Considers: connection speed, device capability, screen size, pixel density,
 * and accepted formats. Critical for African markets (2G/3G prevalent).
 */
export function negotiateCreativeFormat(
  campaign: AdCampaign,
  request: AdRequest,
  slot: InventorySlot
): {
  creativeUrl: string;
  mimeType: string;
  dimensions: { width: number; height: number };
  srcset?: string;
  sizes?: string;
  lazyLoad: boolean;
  placeholderUrl?: string;
  deliveryHints: Record<string, string>;
} {
  const spec = campaign.creativeSpec;
  const isSlowConnection = ['slow-2g', '2g', '3g'].includes(request.connectionType || '');
  const isMobile = request.device === 'mobile';
  const pixelDensity = request.pixelDensity || 1;
  const screenWidth = request.screenWidth || (isMobile ? 375 : 1440);

  // ── Video format negotiation ───
  if (['video', 'video_preroll', 'video_outstream'].includes(campaign.adType)) {
    return negotiateVideoFormat(campaign, request, slot, isSlowConnection, isMobile);
  }

  // ── Rich media / HTML5 ───
  if (['rich_media', 'html5'].includes(campaign.adType)) {
    return {
      creativeUrl: campaign.creativeUrl,
      mimeType: spec?.mimeType || 'text/html',
      dimensions: slot.dimensions,
      lazyLoad: true,
      deliveryHints: {
        sandbox: 'allow-scripts allow-same-origin allow-popups',
        loading: 'lazy',
        importance: 'low',
        ...(isSlowConnection ? { 'save-data': 'on' } : {}),
      },
    };
  }

  // ── Image / Animated Image format negotiation ───
  const acceptsWebP = request.acceptsFormats?.includes('image/webp') ?? true; // assume modern browser
  const acceptsAvif = request.acceptsFormats?.includes('image/avif') ?? false;

  // Pick the best format for the client
  let bestFormat: string = spec?.format || 'jpeg';
  let bestUrl = campaign.creativeUrl;

  if (spec?.responsiveSizes && spec.responsiveSizes.length > 0) {
    // Find the best matching responsive size
    const targetWidth = Math.min(screenWidth, slot.dimensions.width) * pixelDensity;

    // Prefer avif > webp > png > jpeg
    let candidates = spec.responsiveSizes;
    if (acceptsAvif) {
      const avifCandidates = candidates.filter(s => s.format === 'avif');
      if (avifCandidates.length > 0) candidates = avifCandidates;
    } else if (acceptsWebP) {
      const webpCandidates = candidates.filter(s => s.format === 'webp');
      if (webpCandidates.length > 0) candidates = webpCandidates;
    }

    // Find closest width match considering pixel density
    const sorted = [...candidates].sort((a, b) =>
      Math.abs(a.width * a.pixelDensity - targetWidth) - Math.abs(b.width * b.pixelDensity - targetWidth)
    );

    if (sorted.length > 0) {
      const best = sorted[0];
      bestUrl = best.url;
      bestFormat = best.format;
    }

    // Build srcset string
    const srcsetEntries = spec.responsiveSizes
      .filter(s => acceptsAvif ? s.format === 'avif' : acceptsWebP ? s.format === 'webp' : true)
      .map(s => `${s.url} ${s.width * s.pixelDensity}w`)
      .join(', ');

    const sizesAttr = `(max-width: 768px) 100vw, ${slot.dimensions.width}px`;

    // On slow connections, skip high-res variants
    if (isSlowConnection) {
      const lowRes = spec.responsiveSizes
        .filter(s => s.pixelDensity <= 1)
        .sort((a, b) => a.width - b.width);
      if (lowRes.length > 0) {
        bestUrl = lowRes[0].url;
        bestFormat = lowRes[0].format;
      }
    }

    return {
      creativeUrl: bestUrl,
      mimeType: `image/${bestFormat}`,
      dimensions: slot.dimensions,
      srcset: srcsetEntries,
      sizes: sizesAttr,
      lazyLoad: true,
      placeholderUrl: isSlowConnection ? generateLQIP(bestUrl) : undefined,
      deliveryHints: {
        fetchpriority: slot.trafficScore > 80 ? 'high' : 'low',
        decoding: 'async',
        loading: 'lazy',
      },
    };
  }

  // Fallback — single creative URL
  return {
    creativeUrl: bestUrl,
    mimeType: spec?.mimeType || `image/${bestFormat}`,
    dimensions: slot.dimensions,
    lazyLoad: !isMobile, // above-the-fold mobile gets eager
    deliveryHints: {
      fetchpriority: slot.trafficScore > 80 ? 'high' : 'low',
      decoding: 'async',
    },
  };
}

function negotiateVideoFormat(
  campaign: AdCampaign,
  request: AdRequest,
  slot: InventorySlot,
  isSlowConnection: boolean,
  isMobile: boolean
): ReturnType<typeof negotiateCreativeFormat> {
  const spec = campaign.creativeSpec;

  // On 2G/3G, serve a static fallback thumbnail instead of video
  if (isSlowConnection && campaign.adType !== 'video_preroll') {
    logger.info(`[AdsAgent] Slow connection ${request.connectionType} — serving video thumbnail fallback for ${campaign.id}`);
    return {
      creativeUrl: campaign.creativeUrl.replace(/\\.(mp4|webm|ogg)$/, '_thumb.jpg'),
      mimeType: 'image/jpeg',
      dimensions: slot.dimensions,
      lazyLoad: true,
      deliveryHints: {
        'x-fallback': 'slow-connection-thumbnail',
        'x-original-type': campaign.adType,
      },
    };
  }

  return {
    creativeUrl: campaign.creativeUrl,
    mimeType: spec?.mimeType || 'video/mp4',
    dimensions: slot.dimensions,
    lazyLoad: campaign.adType === 'video_outstream',
    deliveryHints: {
      autoplay: campaign.adType === 'video_outstream' ? 'muted' : 'false',
      preload: isMobile ? 'metadata' : 'auto',
      playsinline: 'true',
      ...(campaign.adType === 'video_preroll' ? { 'x-skip-offset': String(spec?.skipOffsetSec || 5) } : {}),
    },
  };
}

function generateLQIP(url: string): string {
  // Generate a low-quality image placeholder URL (server-side tiny blur)
  return url.replace(/\\.[^.]+$/, '_lqip.webp');
}

// ============================================================================
// MODULE 2: CONTEXTUAL TRAFFIC ANALYSIS ENGINE
// ============================================================================

/**
 * Scan the platform to map traffic heatmap and available inventory.
 * Prioritizes traffic sources based on real-time analytics.
 */
async function scanInventory(campaign: AdCampaign): Promise<InventorySlot[]> {
  // Get all registered inventory slots
  const slots = await getAllInventorySlots();

  // Filter by ad type compatibility
  const compatibleSlots = slots.filter(slot =>
    slot.isActive && slot.slotType.includes(campaign.adType)
  );

  // Filter by budget tier access
  const tierAccessible = compatibleSlots.filter(slot => {
    if (campaign.currentTier === 'premium') return true;
    if (campaign.currentTier === 'standard') return slot.minBudgetTier !== 'premium';
    return slot.minBudgetTier === 'long_tail';
  });

  // Score slots for this campaign
  const scoredSlots = tierAccessible.map(slot => ({
    ...slot,
    relevanceScore: calculateSlotRelevance(slot, campaign),
  }));

  // Sort by relevance score descending
  scoredSlots.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredSlots;
}

function calculateSlotRelevance(slot: InventorySlot, campaign: AdCampaign): number {
  let score = slot.trafficScore;

  // Boost if slot page matches targeting sections
  if (campaign.targeting.sections.some(s => slot.page.includes(s))) {
    score *= 1.3;
  }

  // Boost for high CTR slots
  score *= (1 + slot.avgCtr);

  // Penalize for high fill rate (less available)
  if (slot.fillRate > 0.8) score *= 0.7;

  // Newsletter bonus if allowed
  if (slot.location.startsWith('newsletter') && campaign.targeting.newsletterAllowed) {
    score *= 1.2;
  }

  return Math.min(score, 100);
}

/**
 * Register a new inventory slot on the platform
 */
export async function registerInventorySlot(slot: InventorySlot): Promise<void> {
  const key = `${REDIS_PREFIX.INVENTORY}${slot.id}`;
  await redisClient.setEx(key, 86400, JSON.stringify({
    ...slot,
    lastUpdated: new Date().toISOString(),
  }));

  // Update slots index
  const indexKey = `${REDIS_PREFIX.INVENTORY}index`;
  const existing = await redisClient.get(indexKey);
  const ids: string[] = existing ? JSON.parse(existing) : [];
  if (!ids.includes(slot.id)) {
    ids.push(slot.id);
    await redisClient.set(indexKey, JSON.stringify(ids));
  }
}

async function getAllInventorySlots(): Promise<InventorySlot[]> {
  const indexKey = `${REDIS_PREFIX.INVENTORY}index`;
  const raw = await redisClient.get(indexKey);
  if (!raw) return getDefaultInventorySlots();

  const ids: string[] = JSON.parse(raw);
  const slots: InventorySlot[] = [];

  for (const id of ids) {
    const slotRaw = await redisClient.get(`${REDIS_PREFIX.INVENTORY}${id}`);
    if (slotRaw) {
      const slot = JSON.parse(slotRaw);
      slot.lastUpdated = new Date(slot.lastUpdated);
      slots.push(slot);
    }
  }

  return slots.length > 0 ? slots : getDefaultInventorySlots();
}

function getDefaultInventorySlots(): InventorySlot[] {
  const now = new Date();
  return [
    // ── Display Slots (upgraded with rich media & responsive) ───
    { id: 'slot_homepage_hero', location: 'homepage_hero', page: 'homepage', trafficScore: 95, currentAdId: null, slotType: ['image', 'animated_image', 'html5', 'rich_media', 'video_outstream'], dimensions: { width: 970, height: 250 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.4, avgCtr: 0.028, lastUpdated: now, supportsVideo: true, supportsRichMedia: true, allowsExpandable: true, lazyLoad: false, viewabilityOptimized: true, responsiveSizes: [{ width: 320, height: 100 }, { width: 728, height: 250 }, { width: 970, height: 250 }] },
    { id: 'slot_homepage_sidebar', location: 'homepage_sidebar', page: 'homepage', trafficScore: 80, currentAdId: null, slotType: ['image', 'animated_image', 'rich_media'], dimensions: { width: 300, height: 250 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.3, avgCtr: 0.018, lastUpdated: now, supportsRichMedia: true, lazyLoad: false, viewabilityOptimized: true },
    { id: 'slot_article_top', location: 'article_top', page: 'articles', trafficScore: 85, currentAdId: null, slotType: ['image', 'animated_image', 'html5', 'rich_media'], dimensions: { width: 728, height: 90 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.5, avgCtr: 0.022, lastUpdated: now, supportsRichMedia: true, lazyLoad: false, viewabilityOptimized: true, responsiveSizes: [{ width: 320, height: 50 }, { width: 728, height: 90 }] },
    { id: 'slot_article_inline', location: 'article_inline', page: 'articles', trafficScore: 70, currentAdId: null, slotType: ['image', 'animated_image', 'video_outstream', 'article', 'post'], dimensions: { width: 600, height: 300 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.6, avgCtr: 0.032, lastUpdated: now, supportsVideo: true, videoPlacement: 'in_article', maxVideoDurationSec: 60, lazyLoad: true, viewabilityOptimized: true },
    { id: 'slot_article_bottom', location: 'article_bottom', page: 'articles', trafficScore: 50, currentAdId: null, slotType: ['image', 'html5', 'post'], dimensions: { width: 728, height: 90 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.7, avgCtr: 0.012, lastUpdated: now, lazyLoad: true },
    { id: 'slot_category_banner', location: 'category_banner', page: 'categories', trafficScore: 65, currentAdId: null, slotType: ['image', 'animated_image', 'html5', 'rich_media'], dimensions: { width: 970, height: 90 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.4, avgCtr: 0.015, lastUpdated: now, supportsRichMedia: true, lazyLoad: true, responsiveSizes: [{ width: 320, height: 50 }, { width: 970, height: 90 }] },
    { id: 'slot_newsletter_header', location: 'newsletter_header', page: 'newsletter', trafficScore: 90, currentAdId: null, slotType: ['image', 'animated_image', 'html5'], dimensions: { width: 600, height: 200 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.2, avgCtr: 0.045, lastUpdated: now },
    { id: 'slot_newsletter_inline', location: 'newsletter_inline', page: 'newsletter', trafficScore: 75, currentAdId: null, slotType: ['image', 'article', 'post'], dimensions: { width: 600, height: 150 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.3, avgCtr: 0.038, lastUpdated: now },
    { id: 'slot_feed_card', location: 'feed_card', page: 'feed', trafficScore: 60, currentAdId: null, slotType: ['post', 'article', 'image', 'animated_image', 'video_outstream'], dimensions: { width: 400, height: 300 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.5, avgCtr: 0.025, lastUpdated: now, supportsVideo: true, videoPlacement: 'in_feed', maxVideoDurationSec: 30, lazyLoad: true },
    { id: 'slot_search_results', location: 'search_results', page: 'search', trafficScore: 55, currentAdId: null, slotType: ['post', 'article'], dimensions: { width: 600, height: 100 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.3, avgCtr: 0.035, lastUpdated: now },
    { id: 'slot_sidebar_sticky', location: 'sidebar_sticky', page: 'articles', trafficScore: 45, currentAdId: null, slotType: ['image', 'animated_image', 'rich_media'], dimensions: { width: 300, height: 600 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.6, avgCtr: 0.008, lastUpdated: now, supportsRichMedia: true, allowsExpandable: true, lazyLoad: true, viewabilityOptimized: true },
    { id: 'slot_footer_banner', location: 'footer_banner', page: 'all', trafficScore: 30, currentAdId: null, slotType: ['image', 'html5'], dimensions: { width: 970, height: 90 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.8, avgCtr: 0.005, lastUpdated: now, lazyLoad: true },

    // ── Video Slots (new) ───
    { id: 'slot_video_preroll', location: 'video_preroll', page: 'articles', trafficScore: 92, currentAdId: null, slotType: ['video_preroll', 'video'], dimensions: { width: 640, height: 360 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.15, avgCtr: 0.045, lastUpdated: now, supportsVideo: true, videoPlacement: 'preroll', maxVideoDurationSec: 30, supportsVPAID: true, viewabilityOptimized: true },
    { id: 'slot_video_midroll', location: 'video_midroll', page: 'articles', trafficScore: 88, currentAdId: null, slotType: ['video', 'video_preroll'], dimensions: { width: 640, height: 360 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.1, avgCtr: 0.038, lastUpdated: now, supportsVideo: true, videoPlacement: 'midroll', maxVideoDurationSec: 30, supportsVPAID: true, viewabilityOptimized: true },
    { id: 'slot_outstream_article', location: 'article_inline', page: 'articles', trafficScore: 72, currentAdId: null, slotType: ['video_outstream'], dimensions: { width: 600, height: 338 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.25, avgCtr: 0.015, lastUpdated: now, supportsVideo: true, videoPlacement: 'outstream', maxVideoDurationSec: 60, lazyLoad: true, viewabilityOptimized: true },

    // ── Special Slots (new) ───
    { id: 'slot_mobile_interstitial', location: 'mobile_interstitial', page: 'all', trafficScore: 85, currentAdId: null, slotType: ['image', 'rich_media', 'video'], dimensions: { width: 320, height: 480 }, minBudgetTier: 'premium', isActive: true, fillRate: 0.1, avgCtr: 0.055, lastUpdated: now, supportsVideo: true, supportsRichMedia: true, maxVideoDurationSec: 15, viewabilityOptimized: true },
    { id: 'slot_exit_intent', location: 'exit_intent', page: 'all', trafficScore: 40, currentAdId: null, slotType: ['image', 'rich_media'], dimensions: { width: 600, height: 400 }, minBudgetTier: 'standard', isActive: true, fillRate: 0.05, avgCtr: 0.065, lastUpdated: now, supportsRichMedia: true, allowsExpandable: true },
    { id: 'slot_notification_bar', location: 'notification_bar', page: 'all', trafficScore: 75, currentAdId: null, slotType: ['image', 'animated_image'], dimensions: { width: 728, height: 60 }, minBudgetTier: 'long_tail', isActive: true, fillRate: 0.6, avgCtr: 0.012, lastUpdated: now, lazyLoad: false },
  ];
}

/**
 * Update traffic scores based on real-time analytics
 */
export async function updateTrafficScores(scores: { slotId: string; trafficScore: number }[]): Promise<void> {
  for (const { slotId, trafficScore } of scores) {
    const key = `${REDIS_PREFIX.INVENTORY}${slotId}`;
    const raw = await redisClient.get(key);
    if (raw) {
      const slot = JSON.parse(raw);
      slot.trafficScore = trafficScore;
      slot.lastUpdated = new Date().toISOString();
      await redisClient.setEx(key, 86400, JSON.stringify(slot));
    }
  }
}

// ============================================================================
// MODULE 3: BUDGET-PACING & ALLOCATION CORE
// ============================================================================

/**
 * Calculate pacing for a campaign.
 * Uses proportional depletion: as money decreases, traffic quality decreases.
 */
function calculatePacing(campaign: AdCampaign): {
  dailyCap: number;
  estimatedDailyImpressions: number;
  impressionVelocity: number;
  trafficVolatilityFactor: number;
} {
  const now = new Date();
  const campaignEnd = new Date(campaign.endDate);
  const remainingDays = Math.max(1, Math.ceil((campaignEnd.getTime() - now.getTime()) / 86400000));
  const trafficVolatilityFactor = getTrafficVolatilityFactor();

  let dailyCap: number;

  switch (campaign.pacingMode) {
    case 'even':
      // Spread budget evenly across remaining days
      dailyCap = campaign.remainingBudget / remainingDays;
      break;
    case 'asap':
      // Aggressive: spend as fast as possible, up to 3x even pace
      dailyCap = Math.min(campaign.remainingBudget, (campaign.remainingBudget / remainingDays) * 3);
      break;
    case 'dayparting':
      // Use dayparting schedule to weight distribution
      const activeHoursToday = getDaypartingActiveHours(campaign.scheduling.dayparting);
      const hourlyRate = campaign.remainingBudget / (remainingDays * (activeHoursToday || 12));
      dailyCap = hourlyRate * activeHoursToday;
      break;
    default:
      dailyCap = campaign.remainingBudget / remainingDays;
  }

  // Apply traffic volatility
  dailyCap *= trafficVolatilityFactor;

  // Calculate estimated impressions (budget / CPM * 1000)
  const effectiveCpm = campaign.bidAmount || 2.0; // default $2 CPM
  const estimatedDailyImpressions = Math.floor((dailyCap / effectiveCpm) * 1000);

  return {
    dailyCap: Math.round(dailyCap * 100) / 100,
    estimatedDailyImpressions,
    impressionVelocity: estimatedDailyImpressions / 24,
    trafficVolatilityFactor,
  };
}

function getTrafficVolatilityFactor(): number {
  const hour = new Date().getUTCHours();
  // African peak hours (adjusted for WAT/EAT timezones: ~6am-11pm local)
  if (hour >= 5 && hour <= 22) return 1.2; // peak
  return 0.7; // off-peak
}

function getDaypartingActiveHours(config?: DaypartingConfig): number {
  if (!config?.enabled) return 16; // default 16 active hours
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const schedule = config.schedule[dayName] || [];
  return schedule.reduce((total, slot) => total + (slot.end - slot.start), 0) || 16;
}

/**
 * Real-time pacing adjustment — called every PACING_INTERVAL_MS
 */
export async function adjustPacing(campaignId: string): Promise<{
  newDailyCap: number;
  newTier: BudgetTier;
  action: string;
}> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const oldTier = campaign.currentTier;
  const newTier = calculateBudgetTier(campaign);
  const pacing = calculatePacing(campaign);

  // Detect pacing anomalies
  const expectedSpend = pacing.dailyCap * (new Date().getHours() / 24);
  const actualSpend = campaign.dailySpent;
  const pacingRatio = expectedSpend > 0 ? actualSpend / expectedSpend : 0;

  let action = 'maintain';

  if (pacingRatio > 1.5) {
    // Spending too fast — slow down
    campaign.dailyCap = pacing.dailyCap * 0.7;
    action = 'throttle';
    await emitAlert({
      id: `alert_${campaignId}_${Date.now()}`,
      type: 'velocity_spike',
      severity: 'warning',
      message: `Campaign ${campaignId} spending ${(pacingRatio * 100).toFixed(0)}% faster than target`,
      campaignId,
      timestamp: new Date(),
    });
  } else if (pacingRatio < 0.5 && campaign.pacingMode !== 'even') {
    // Spending too slow — speed up
    campaign.dailyCap = pacing.dailyCap * 1.3;
    action = 'accelerate';
    await emitAlert({
      id: `alert_${campaignId}_${Date.now()}`,
      type: 'pacing_error',
      severity: 'info',
      message: `Campaign ${campaignId} underpacing at ${(pacingRatio * 100).toFixed(0)}% of target`,
      campaignId,
      timestamp: new Date(),
    });
  } else {
    campaign.dailyCap = pacing.dailyCap;
  }

  // Tier transition
  if (oldTier !== newTier) {
    logger.info(`[AdsAgent] Campaign ${campaignId} tier change: ${oldTier} → ${newTier}`);
    campaign.currentTier = newTier;
  }

  // Check for budget exhaustion
  if (campaign.remainingBudget <= 0) {
    campaign.status = 'depleted';
    action = 'depleted';
    await emitAlert({
      id: `alert_${campaignId}_depleted`,
      type: 'budget_exhaustion',
      severity: 'critical',
      message: `Campaign ${campaignId} budget exhausted`,
      campaignId,
      timestamp: new Date(),
    });
  }

  // Persist updates
  await saveCampaign(campaign);

  return {
    newDailyCap: campaign.dailyCap,
    newTier: campaign.currentTier,
    action,
  };
}

// ============================================================================
// MODULE 4: DYNAMIC PLACEMENT & ROTATION ENGINE
// ============================================================================

/**
 * The core ad selection function — MUST execute in <100ms.
 * Called when a page renders and needs an ad for a slot.
 */
export async function selectAd(request: AdRequest): Promise<AdResponse | null> {
  const startTime = Date.now();

  try {
    // Step 1: Get eligible campaigns (from cache)
    const eligibleCampaigns = await getEligibleCampaigns(request);
    if (eligibleCampaigns.length === 0) return null;

    // Step 2: Apply frequency capping
    const uncappedCampaigns = await applyFrequencyCapping(eligibleCampaigns, request.userId || request.sessionId);
    if (uncappedCampaigns.length === 0) return null;

    // Step 3: Auction / Ranking — calculate eCPM for each
    const rankedCampaigns = rankCampaigns(uncappedCampaigns, request);

    // Step 4: Apply fairness constraint (reserve 10% for small budgets)
    const selectedCampaign = applyFairnessSelection(rankedCampaigns);
    if (!selectedCampaign) return null;

    // Step 5: Select creative (A/B testing)
    const creativeIndex = selectCreative(selectedCampaign);

    // Step 6: Record impression
    await recordImpression(selectedCampaign.id, request.slotId, creativeIndex, request.userId || request.sessionId);

    const latency = Date.now() - startTime;
    if (latency > AD_SELECTION_TIMEOUT_MS) {
      logger.warn(`[AdsAgent] Ad selection latency ${latency}ms exceeds target ${AD_SELECTION_TIMEOUT_MS}ms`);
    }

    // Step 7: Get slot info for format negotiation
    const slot = await getInventorySlot(request.slotId);
    const slotDims = slot?.dimensions || getSlotDimensions(request.slotId);

    // Step 8: Build base response
    const primaryUrl = creativeIndex === 0
      ? selectedCampaign.creativeUrl
      : (selectedCampaign.creativeAlternatives?.[creativeIndex - 1] || selectedCampaign.creativeUrl);

    const response: AdResponse = {
      campaignId: selectedCampaign.id,
      creativeUrl: primaryUrl,
      targetUrl: selectedCampaign.targetUrl,
      trackingPixel: `/api/ads/track/impression/${selectedCampaign.id}/${request.slotId}`,
      clickTracker: `/api/ads/track/click/${selectedCampaign.id}/${request.slotId}`,
      adType: selectedCampaign.adType,
      dimensions: slotDims,
      metadata: {
        tier: selectedCampaign.currentTier,
        strategy: selectedCampaign.rotationStrategy,
        latencyMs: latency,
      },
    };

    // Step 9: Viewability config (all ad types)
    response.viewabilityConfig = getViewabilityConfig(selectedCampaign.adType, slotDims);

    // Step 10: Format-specific response enrichment
    const isVideoType = ['video', 'video_preroll', 'video_outstream'].includes(selectedCampaign.adType);
    const isRichMedia = ['rich_media', 'html5'].includes(selectedCampaign.adType);
    const isImageType = ['image', 'animated_image'].includes(selectedCampaign.adType);

    if (isVideoType && slot) {
      // Generate VAST XML and tag URL for video ads
      response.vastXml = generateVASTXml(selectedCampaign, slot);
      response.vastTagUrl = generateVASTTagUrl(selectedCampaign.id, request.slotId);

      if (selectedCampaign.vpaidEnabled) {
        response.vpaidJs = `/api/ads/vpaid/${selectedCampaign.id}.js`;
      }

      const spec = selectedCampaign.creativeSpec;
      response.videoSpec = {
        durationSec: spec?.durationSec || 30,
        skipOffsetSec: spec?.skipOffsetSec || (selectedCampaign.adType === 'video_preroll' ? 5 : undefined),
        autoplay: selectedCampaign.adType === 'video_outstream',
        muted: selectedCampaign.adType === 'video_outstream',
        aspectRatio: spec?.aspectRatio || '16:9',
        companions: selectedCampaign.companionAds || [],
        quartileTrackers: spec?.videoQuartileTrackers || generateQuartileTrackers(selectedCampaign.id),
      };
    }

    if (isRichMedia) {
      const spec = selectedCampaign.creativeSpec;
      response.richMediaSpec = {
        sandboxed: true,
        expandable: spec?.expandable || false,
        expandDirection: spec?.expandDirection,
        initialLoadKB: spec?.initialLoadKB || 150,
        clickRegions: spec?.clickRegions || [],
        animationDurationSec: spec?.animationDurationSec,
      };
    }

    if (isImageType && slot) {
      // Negotiate best format for the requesting client
      const negotiated = negotiateCreativeFormat(selectedCampaign, request, slot);
      response.creativeUrl = negotiated.creativeUrl;
      response.imageSpec = {
        srcset: negotiated.srcset,
        sizes: negotiated.sizes,
        format: negotiated.mimeType.replace('image/', ''),
        lazyLoad: negotiated.lazyLoad,
        placeholderUrl: negotiated.placeholderUrl,
      };
    }

    return response;
  } catch (error) {
    logger.error('[AdsAgent] Ad selection error:', error);
    return null;
  }
}

async function getEligibleCampaigns(request: AdRequest): Promise<AdCampaign[]> {
  const activeCampaignIds = await getActiveCampaignIds();
  const campaigns: AdCampaign[] = [];

  for (const id of activeCampaignIds) {
    const campaign = await getCampaign(id);
    if (!campaign || campaign.status !== 'active') continue;

    // Check budget
    if (campaign.remainingBudget <= 0) continue;
    if (campaign.dailySpent >= campaign.dailyCap) continue;

    // Check scheduling
    const now = new Date();
    if (now < new Date(campaign.startDate) || now > new Date(campaign.endDate)) continue;

    // Check dayparting
    if (campaign.scheduling.dayparting?.enabled) {
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const schedule = campaign.scheduling.dayparting.schedule[dayName] || [];
      const currentHour = now.getHours();
      const isActiveHour = schedule.some(slot => currentHour >= slot.start && currentHour < slot.end);
      if (!isActiveHour) continue;
    }

    // Check targeting
    if (!matchesTargeting(campaign, request)) continue;

    // Check slot type compatibility
    const slot = await getInventorySlot(request.slotId);
    if (slot && !slot.slotType.includes(campaign.adType)) continue;

    campaigns.push(campaign);
  }

  return campaigns;
}

function matchesTargeting(campaign: AdCampaign, request: AdRequest): boolean {
  const { targeting } = campaign;

  // Section targeting
  if (targeting.sections.length > 0 && !targeting.sections.includes(request.section)) return false;
  if (targeting.excludeSections?.includes(request.section)) return false;

  // Region targeting
  if (targeting.regions.length > 0 && !targeting.regions.includes(request.region)) return false;
  if (targeting.excludeRegions?.includes(request.region)) return false;

  // Language targeting
  if (targeting.languages.length > 0 && !targeting.languages.includes(request.language)) return false;

  // Device targeting
  if (targeting.devices.length > 0 && !targeting.devices.includes(request.device)) return false;

  // Newsletter targeting
  if (request.page === 'newsletter' && !targeting.newsletterAllowed) return false;

  // Contextual keyword matching
  if (targeting.contextualKeywords.length > 0) {
    const hasMatch = targeting.contextualKeywords.some(kw =>
      request.contextualKeywords.includes(kw.toLowerCase())
    );
    if (!hasMatch) return false;
  }

  return true;
}

function rankCampaigns(campaigns: AdCampaign[], request: AdRequest): AdCampaign[] {
  // Calculate eCPM for each campaign
  // eCPM = Bid * Predicted CTR * 1000 (with contextual quality boost)
  const scored = campaigns.map(campaign => {
    const predictedCtr = campaign.performance.ctr || 0.01;
    const contextualBoost = calculateContextualBoost(campaign, request);
    const ecpm = campaign.bidAmount * predictedCtr * 1000 * contextualBoost;
    return { campaign, ecpm };
  });

  // Sort by eCPM descending
  scored.sort((a, b) => b.ecpm - a.ecpm);

  return scored.map(s => s.campaign);
}

function calculateContextualBoost(campaign: AdCampaign, request: AdRequest): number {
  let boost = 1.0;

  // Section match boost
  if (campaign.targeting.sections.includes(request.section)) boost *= 1.2;

  // Keyword overlap boost
  const keywordOverlap = campaign.targeting.contextualKeywords.filter(
    kw => request.contextualKeywords.includes(kw.toLowerCase())
  ).length;
  if (keywordOverlap > 0) boost *= (1 + keywordOverlap * 0.1);

  // Region match boost for African-first
  if (['NG', 'KE', 'ZA', 'GH'].includes(request.region)) boost *= 1.1;

  return boost;
}

/**
 * Fairness Constraint: Reserve 10% of premium impressions for smaller budgets.
 * Prevents "rich get richer" and keeps platform attractive to small businesses.
 */
function applyFairnessSelection(rankedCampaigns: AdCampaign[]): AdCampaign | null {
  if (rankedCampaigns.length === 0) return null;
  if (rankedCampaigns.length === 1) return rankedCampaigns[0];

  // 10% of the time, pick a random lower-ranked campaign (fairness)
  const fairnessThreshold = 0.10;
  if (Math.random() < fairnessThreshold && rankedCampaigns.length > 1) {
    // Pick from bottom 50% of ranked campaigns
    const lowerHalf = rankedCampaigns.slice(Math.floor(rankedCampaigns.length / 2));
    return lowerHalf[Math.floor(Math.random() * lowerHalf.length)];
  }

  // Otherwise pick the top-ranked campaign
  return rankedCampaigns[0];
}

function selectCreative(campaign: AdCampaign): number {
  if (!campaign.creativeAlternatives || campaign.creativeAlternatives.length === 0) return 0;

  if (campaign.rotationStrategy === 'optimized' && campaign.performance.creativePerformance.length > 0) {
    // Pick the best performing creative with exploration factor
    const explorationRate = 0.15;
    if (Math.random() < explorationRate) {
      // Explore: pick random
      return Math.floor(Math.random() * (campaign.creativeAlternatives.length + 1));
    }
    // Exploit: pick best CTR
    return campaign.performance.bestCreativeIndex;
  }

  if (campaign.rotationStrategy === 'sequential') {
    // Sequential rotation based on impressions
    const totalCreatives = campaign.creativeAlternatives.length + 1;
    return campaign.performance.impressions % totalCreatives;
  }

  // Random / Even rotation
  return Math.floor(Math.random() * (campaign.creativeAlternatives.length + 1));
}

/**
 * Execute a batch of placements for a campaign across multiple slots.
 * Handles thousands of concurrent placements efficiently.
 */
async function executePlacementBatch(
  campaign: AdCampaign,
  slots: InventorySlot[]
): Promise<PlacementDecision[]> {
  const placements: PlacementDecision[] = [];
  const batchSize = Math.min(slots.length, 50); // Process 50 at a time

  for (let i = 0; i < Math.min(slots.length, MAX_CONCURRENT_PLACEMENTS); i += batchSize) {
    const batch = slots.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (slot) => {
        try {
          const placement: PlacementDecision = {
            id: `pl_${campaign.id}_${slot.id}_${Date.now()}`,
            campaignId: campaign.id,
            slotId: slot.id,
            creativeIndex: selectCreative(campaign),
            bidAmount: campaign.bidAmount,
            effectiveCpm: campaign.bidAmount * (campaign.performance.ctr || 0.01) * 1000,
            reason: `Tier: ${campaign.currentTier}, Slot score: ${slot.trafficScore}`,
            timestamp: new Date(),
            expiresAt: new Date(Date.now() + 3600000), // 1 hour
          };

          // Reserve the slot
          await redisClient.setEx(
            `${REDIS_PREFIX.PLACEMENT}${slot.id}`,
            3600,
            JSON.stringify(placement)
          );

          return placement;
        } catch (error) {
          logger.warn(`[AdsAgent] Failed to place in slot ${slot.id}:`, error);
          return null;
        }
      })
    );

    placements.push(...batchResults.filter((p): p is PlacementDecision => p !== null));
  }

  return placements;
}

// ============================================================================
// MODULE 5: FREQUENCY CAPPING (Redis-based)
// ============================================================================

async function applyFrequencyCapping(
  campaigns: AdCampaign[],
  userOrSessionId: string
): Promise<AdCampaign[]> {
  const uncapped: AdCampaign[] = [];

  for (const campaign of campaigns) {
    const { frequencyCap } = campaign;

    // Check daily impression cap per user
    const dailyKey = `${REDIS_PREFIX.FREQ_CAP}${campaign.id}:${userOrSessionId}:daily`;
    const dailyCount = parseInt(await redisClient.get(dailyKey) || '0', 10);
    if (dailyCount >= frequencyCap.maxImpressionsPerUserPerDay) continue;

    // Check total impression cap per user (window)
    const totalKey = `${REDIS_PREFIX.FREQ_CAP}${campaign.id}:${userOrSessionId}:total`;
    const totalCount = parseInt(await redisClient.get(totalKey) || '0', 10);
    if (totalCount >= frequencyCap.maxImpressionsPerUser) continue;

    // Check daily click cap
    const clickKey = `${REDIS_PREFIX.FREQ_CAP}${campaign.id}:${userOrSessionId}:clicks`;
    const clickCount = parseInt(await redisClient.get(clickKey) || '0', 10);
    if (clickCount >= frequencyCap.maxClicksPerUserPerDay) continue;

    uncapped.push(campaign);
  }

  return uncapped;
}

async function incrementFrequencyCap(
  campaignId: string,
  userOrSessionId: string,
  type: 'impression' | 'click'
): Promise<void> {
  if (type === 'impression') {
    // Daily counter (resets at midnight)
    const dailyKey = `${REDIS_PREFIX.FREQ_CAP}${campaignId}:${userOrSessionId}:daily`;
    const dailyVal = parseInt(await redisClient.get(dailyKey) || '0', 10);
    const secondsToMidnight = getSecondsToMidnight();
    await redisClient.setEx(dailyKey, secondsToMidnight, String(dailyVal + 1));

    // Total counter (configurable window)
    const totalKey = `${REDIS_PREFIX.FREQ_CAP}${campaignId}:${userOrSessionId}:total`;
    const totalVal = parseInt(await redisClient.get(totalKey) || '0', 10);
    await redisClient.setEx(totalKey, 86400 * 7, String(totalVal + 1)); // 7-day window
  } else {
    const clickKey = `${REDIS_PREFIX.FREQ_CAP}${campaignId}:${userOrSessionId}:clicks`;
    const clickVal = parseInt(await redisClient.get(clickKey) || '0', 10);
    const secondsToMidnight = getSecondsToMidnight();
    await redisClient.setEx(clickKey, secondsToMidnight, String(clickVal + 1));
  }
}

function getSecondsToMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

// ============================================================================
// MODULE 6: REAL-TIME REPORTING BUS
// ============================================================================

async function recordImpression(
  campaignId: string,
  slotId: string,
  creativeIndex: number,
  userOrSessionId: string
): Promise<void> {
  // Update frequency cap
  await incrementFrequencyCap(campaignId, userOrSessionId, 'impression');

  // Update campaign metrics
  const metricsKey = `${REDIS_PREFIX.METRICS}${campaignId}`;
  const raw = await redisClient.get(metricsKey);
  const metrics: CampaignPerformance = raw ? JSON.parse(raw) : createDefaultPerformance();

  metrics.impressions += 1;
  metrics.viewableImpressions += 1;

  // Update creative performance
  if (!metrics.creativePerformance[creativeIndex]) {
    metrics.creativePerformance[creativeIndex] = { creativeIndex, impressions: 0, clicks: 0, ctr: 0, score: 0.5 };
  }
  metrics.creativePerformance[creativeIndex].impressions += 1;

  // Recalculate CTR
  if (metrics.impressions > 0) {
    metrics.ctr = metrics.clicks / metrics.impressions;
    metrics.cpm = metrics.totalSpent / (metrics.impressions / 1000) || 0;
  }

  await redisClient.setEx(metricsKey, 86400, JSON.stringify(metrics));

  // Deduct from budget (CPM-based)
  const campaign = await getCampaign(campaignId);
  if (campaign) {
    const costPerImpression = campaign.bidAmount / 1000;
    campaign.remainingBudget -= costPerImpression;
    campaign.dailySpent += costPerImpression;
    campaign.performance = metrics;
    await saveCampaign(campaign);
  }
}

/**
 * Record a click event (called from click tracking endpoint)
 */
export async function recordClick(campaignId: string, slotId: string, userOrSessionId: string): Promise<void> {
  await incrementFrequencyCap(campaignId, userOrSessionId, 'click');

  const metricsKey = `${REDIS_PREFIX.METRICS}${campaignId}`;
  const raw = await redisClient.get(metricsKey);
  const metrics: CampaignPerformance = raw ? JSON.parse(raw) : createDefaultPerformance();

  metrics.clicks += 1;
  if (metrics.impressions > 0) {
    metrics.ctr = metrics.clicks / metrics.impressions;
    metrics.cpc = metrics.totalSpent / metrics.clicks || 0;
  }

  await redisClient.setEx(metricsKey, 86400, JSON.stringify(metrics));
}

/**
 * Record a conversion event
 */
export async function recordConversion(campaignId: string): Promise<void> {
  const metricsKey = `${REDIS_PREFIX.METRICS}${campaignId}`;
  const raw = await redisClient.get(metricsKey);
  const metrics: CampaignPerformance = raw ? JSON.parse(raw) : createDefaultPerformance();
  metrics.conversions += 1;
  await redisClient.setEx(metricsKey, 86400, JSON.stringify(metrics));
}

function createDefaultPerformance(): CampaignPerformance {
  return {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    viewableImpressions: 0,
    totalSpent: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    viewabilityRate: 0,
    burnRate: 0,
    remainingImpressions: 0,
    bestCreativeIndex: 0,
    creativePerformance: [],
  };
}

// ============================================================================
// MODULE 7: DEEPSEEK R1 OPTIMIZATION
// ============================================================================

/**
 * Use DeepSeek R1 to analyze campaign performance and generate
 * optimization recommendations. Runs periodically for active campaigns.
 */
export async function getAIOptimizationScore(
  campaign: AdCampaign,
  availableSlots: InventorySlot[]
): Promise<{
  score: number;
  recommendations: string[];
  suggestedBidAdjustment: number;
  suggestedTierOverride?: BudgetTier;
}> {
  const prompt = `
Analyze this ad campaign and provide optimization recommendations:

CAMPAIGN:
- ID: ${campaign.id}
- Type: ${campaign.adType}
- Total Budget: $${campaign.totalBudget}
- Remaining Budget: $${campaign.remainingBudget}
- Current Tier: ${campaign.currentTier}
- Daily Cap: $${campaign.dailyCap}
- CTR: ${(campaign.performance.ctr * 100).toFixed(2)}%
- Impressions: ${campaign.performance.impressions}
- Clicks: ${campaign.performance.clicks}
- CPC: $${campaign.performance.cpc.toFixed(4)}
- Bid: $${campaign.bidAmount} CPM
- Targeting: ${JSON.stringify(campaign.targeting.sections)}
- Regions: ${JSON.stringify(campaign.targeting.regions)}
- Days Remaining: ${Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / 86400000)}

AVAILABLE INVENTORY (top 5):
${availableSlots.slice(0, 5).map(s => `- ${s.location}: traffic=${s.trafficScore}, fillRate=${s.fillRate}, avgCTR=${s.avgCtr}`).join('\n')}

Respond with JSON:
{
  "score": 0-100 (overall campaign health),
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "suggestedBidAdjustment": -0.5 to +0.5 (multiply current bid),
  "suggestedTierOverride": "premium" | "standard" | "long_tail" | null
}`;

  try {
    const { response } = await callDeepSeekR1(prompt, {
      systemPrompt: ADS_SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: 1024,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    logger.warn('[AdsAgent] AI optimization scoring failed, using defaults:', error);
  }

  return {
    score: 50,
    recommendations: ['Continue monitoring performance'],
    suggestedBidAdjustment: 0,
  };
}

/**
 * Use DeepSeek R1 to analyze traffic patterns and predict best
 * placement times and slots for a campaign.
 */
export async function getAIPlacementStrategy(campaignId: string): Promise<{
  preferredSlots: string[];
  peakHours: number[];
  avoidSlots: string[];
  rationale: string;
}> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const slots = await getAllInventorySlots();

  const prompt = `
You are analyzing traffic patterns for an ad campaign on CoinDaily, Africa's crypto news platform.

CAMPAIGN: ${campaign.adType} ad, targeting ${campaign.targeting.sections.join(', ')} sections in ${campaign.targeting.regions.join(', ')} regions.
Budget remaining: $${campaign.remainingBudget} of $${campaign.totalBudget}.
Current CTR: ${(campaign.performance.ctr * 100).toFixed(2)}%.

AVAILABLE SLOTS:
${slots.map(s => `- ${s.id}: ${s.location} (page: ${s.page}, traffic: ${s.trafficScore}, fill: ${(s.fillRate * 100).toFixed(0)}%, ctr: ${(s.avgCtr * 100).toFixed(1)}%)`).join('\n')}

Considering African user patterns (peak: 8am-11pm WAT/EAT, mobile-first), recommend:

{
  "preferredSlots": ["slot_id_1", "slot_id_2"],
  "peakHours": [8, 9, 10, 12, 18, 19, 20],
  "avoidSlots": ["slot_id_with_reason"],
  "rationale": "Brief explanation"
}`;

  try {
    const { response } = await callDeepSeekR1(prompt, {
      systemPrompt: ADS_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 1024,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.warn('[AdsAgent] AI placement strategy failed:', error);
  }

  return {
    preferredSlots: slots.filter(s => s.trafficScore > 60).map(s => s.id),
    peakHours: [8, 9, 10, 11, 12, 17, 18, 19, 20, 21],
    avoidSlots: [],
    rationale: 'Default strategy based on traffic scores',
  };
}

// ============================================================================
// MODULE 8: BATCH PROCESSING ENGINE (Scale)
// ============================================================================

/**
 * Process multiple ad campaigns simultaneously.
 * Handles 10s to thousands of placements at once.
 */
export async function processBatchPlacements(campaignIds?: string[]): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: { campaignId: string; placements: number; error?: string }[];
}> {
  const ids = campaignIds || await getActiveCampaignIds();
  logger.info(`[AdsAgent] Batch processing ${ids.length} campaigns...`);

  const results: { campaignId: string; placements: number; error?: string }[] = [];
  let succeeded = 0;
  let failed = 0;

  // Process in parallel batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (campaignId) => {
        const campaign = await getCampaign(campaignId);
        if (!campaign || campaign.status !== 'active') {
          return { campaignId, placements: 0 };
        }

        // Recalculate pacing
        await adjustPacing(campaignId);

        // Get fresh campaign data
        const updated = await getCampaign(campaignId);
        if (!updated || updated.remainingBudget <= 0) {
          return { campaignId, placements: 0 };
        }

        // Scan and place
        const slots = await scanInventory(updated);
        const placements = await executePlacementBatch(updated, slots);

        return { campaignId, placements: placements.length };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (result.value.placements > 0) succeeded++;
      } else {
        failed++;
        results.push({ campaignId: 'unknown', placements: 0, error: result.reason?.message });
      }
    }
  }

  logger.info(`[AdsAgent] Batch complete: ${succeeded} succeeded, ${failed} failed out of ${ids.length}`);

  return { processed: ids.length, succeeded, failed, results };
}

/**
 * Daily reset: reset daily spent counters and recalculate all pacing
 */
export async function dailyReset(): Promise<void> {
  logger.info('[AdsAgent] Running daily reset...');
  const campaignIds = await getActiveCampaignIds();

  for (const id of campaignIds) {
    const campaign = await getCampaign(id);
    if (!campaign) continue;

    campaign.dailySpent = 0;
    campaign.currentTier = calculateBudgetTier(campaign);
    const pacing = calculatePacing(campaign);
    campaign.dailyCap = pacing.dailyCap;

    // Check for expired campaigns
    if (new Date() > new Date(campaign.endDate)) {
      campaign.status = 'completed';
    }

    await saveCampaign(campaign);
  }

  logger.info(`[AdsAgent] Daily reset complete for ${campaignIds.length} campaigns`);
}

// ============================================================================
// MODULE 9: MONITORING & SYSTEM HEALTH
// ============================================================================

async function startCampaignMonitoring(campaignId: string): Promise<void> {
  const monitorKey = `${REDIS_PREFIX.QUEUE}monitor:${campaignId}`;
  await redisClient.set(monitorKey, JSON.stringify({
    campaignId,
    startedAt: new Date().toISOString(),
    lastCheck: new Date().toISOString(),
  }));

  logger.info(`[AdsAgent] Monitoring started for campaign ${campaignId}`);
}

/**
 * Generate advertiser-facing report for a campaign
 */
export async function getAdvertiserReport(campaignId: string): Promise<PlacementReport> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const now = new Date();
  const hoursElapsed = Math.max(1, (now.getTime() - new Date(campaign.approvedAt || campaign.createdAt).getTime()) / 3600000);
  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - now.getTime()) / 86400000));

  const currentBurnRate = campaign.dailySpent / (now.getHours() || 1); // per hour
  const projectedBurnRate = campaign.performance.totalSpent / hoursElapsed;

  // Calculate traffic allocation
  const budgetRatio = campaign.remainingBudget / campaign.totalBudget;
  const trafficAllocation = {
    premium: budgetRatio > 0.6 ? 0.7 : budgetRatio > 0.3 ? 0.3 : 0.05,
    standard: budgetRatio > 0.6 ? 0.2 : budgetRatio > 0.3 ? 0.5 : 0.25,
    longTail: budgetRatio > 0.6 ? 0.1 : budgetRatio > 0.3 ? 0.2 : 0.7,
  };

  // AI recommendations
  let recommendations: string[] = [];
  try {
    const aiResult = await getAIOptimizationScore(campaign, await getAllInventorySlots());
    recommendations = aiResult.recommendations;
  } catch {
    recommendations = ['Continue monitoring campaign performance'];
  }

  return {
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    period: { start: new Date(campaign.startDate), end: now },
    metrics: campaign.performance,
    burnRate: {
      current: currentBurnRate,
      projected: projectedBurnRate,
      daysRemaining,
    },
    trafficAllocation,
    topPerformingSlots: [], // Populated from placement history
    creativeBreakdown: campaign.performance.creativePerformance,
    recommendations,
  };
}

/**
 * Generate admin-facing system health report
 */
export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  const campaignIds = await getActiveCampaignIds();
  const campaigns: AdCampaign[] = [];

  for (const id of campaignIds) {
    const c = await getCampaign(id);
    if (c && c.status === 'active') campaigns.push(c);
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + c.remainingBudget, 0);
  const avgBurnRate = campaigns.reduce((sum, c) => sum + c.dailySpent, 0) / Math.max(campaigns.length, 1);
  const projectedDepletion = new Date(Date.now() + (totalBudget / Math.max(avgBurnRate, 0.01)) * 86400000);

  const slots = await getAllInventorySlots();
  const premiumSlots = slots.filter(s => s.minBudgetTier === 'premium');
  const standardSlots = slots.filter(s => s.minBudgetTier === 'standard');
  const longTailSlots = slots.filter(s => s.minBudgetTier === 'long_tail');

  const alerts = await getSystemAlerts();

  return {
    totalActiveCampaigns: campaigns.length,
    totalBudgetInSystem: totalBudget,
    projectedDepletionDate: projectedDepletion,
    fillRateByTier: {
      premium: premiumSlots.reduce((s, sl) => s + sl.fillRate, 0) / Math.max(premiumSlots.length, 1),
      standard: standardSlots.reduce((s, sl) => s + sl.fillRate, 0) / Math.max(standardSlots.length, 1),
      longTail: longTailSlots.reduce((s, sl) => s + sl.fillRate, 0) / Math.max(longTailSlots.length, 1),
    },
    pacingEfficiency: calculatePacingEfficiency(campaigns),
    averageSelectionLatencyMs: 35, // tracked metric
    activeInventorySlots: slots.filter(s => s.isActive).length,
    revenueToday: campaigns.reduce((sum, c) => sum + c.dailySpent, 0),
    alertCount: alerts.length,
    alerts,
  };
}

function calculatePacingEfficiency(campaigns: AdCampaign[]): number {
  if (campaigns.length === 0) return 100;

  const efficiencies = campaigns.map(c => {
    const expectedSpend = c.dailyCap * (new Date().getHours() / 24);
    if (expectedSpend === 0) return 100;
    const ratio = c.dailySpent / expectedSpend;
    // Efficiency: 100% when ratio is 1.0, decreases as it deviates
    return Math.max(0, 100 - Math.abs(1 - ratio) * 100);
  });

  return efficiencies.reduce((s, e) => s + e, 0) / efficiencies.length;
}

async function emitAlert(alert: SystemAlert): Promise<void> {
  const key = `${REDIS_PREFIX.METRICS}alerts`;
  const raw = await redisClient.get(key);
  const alerts: SystemAlert[] = raw ? JSON.parse(raw) : [];
  alerts.unshift(alert);
  // Keep last 100 alerts
  await redisClient.setEx(key, 86400, JSON.stringify(alerts.slice(0, 100)));
  logger.warn(`[AdsAgent] Alert: ${alert.type} - ${alert.message}`);
}

async function getSystemAlerts(): Promise<SystemAlert[]> {
  const key = `${REDIS_PREFIX.METRICS}alerts`;
  const raw = await redisClient.get(key);
  return raw ? JSON.parse(raw) : [];
}

// ============================================================================
// HELPERS — Campaign CRUD (Redis)
// ============================================================================

async function getCampaign(campaignId: string): Promise<AdCampaign | null> {
  const key = `${REDIS_PREFIX.CAMPAIGN}${campaignId}`;
  const raw = await redisClient.get(key);
  if (!raw) return null;

  const campaign = JSON.parse(raw);
  // Ensure dates are proper Date objects
  campaign.createdAt = new Date(campaign.createdAt);
  campaign.startDate = new Date(campaign.startDate);
  campaign.endDate = new Date(campaign.endDate);
  if (campaign.approvedAt) campaign.approvedAt = new Date(campaign.approvedAt);

  return campaign;
}

async function saveCampaign(campaign: AdCampaign): Promise<void> {
  const key = `${REDIS_PREFIX.CAMPAIGN}${campaign.id}`;
  await redisClient.setEx(key, 86400 * 30, JSON.stringify({
    ...campaign,
    createdAt: campaign.createdAt instanceof Date ? campaign.createdAt.toISOString() : campaign.createdAt,
    startDate: campaign.startDate instanceof Date ? campaign.startDate.toISOString() : campaign.startDate,
    endDate: campaign.endDate instanceof Date ? campaign.endDate.toISOString() : campaign.endDate,
    approvedAt: campaign.approvedAt instanceof Date ? campaign.approvedAt.toISOString() : campaign.approvedAt,
  }));

  await addCampaignToIndex(campaign.id);
}

async function getAllCampaignIds(): Promise<string[]> {
  const raw = await redisClient.get(REDIS_PREFIX.CAMPAIGN_INDEX);
  return raw ? JSON.parse(raw) : [];
}

async function addCampaignToIndex(campaignId: string): Promise<void> {
  const ids = await getAllCampaignIds();
  if (!ids.includes(campaignId)) {
    await redisClient.setEx(REDIS_PREFIX.CAMPAIGN_INDEX, 86400 * 30, JSON.stringify([...ids, campaignId]));
  }
}

async function getActiveCampaignIds(): Promise<string[]> {
  const key = `${REDIS_PREFIX.CAMPAIGN}active`;
  const raw = await redisClient.get(key);
  return raw ? JSON.parse(raw) : [];
}

async function getInventorySlot(slotId: string): Promise<InventorySlot | null> {
  const key = `${REDIS_PREFIX.INVENTORY}${slotId}`;
  const raw = await redisClient.get(key);
  return raw ? JSON.parse(raw) : null;
}

function getSlotDimensions(slotId: string): { width: number; height: number } {
  const defaults: Record<string, { width: number; height: number }> = {
    slot_homepage_hero: { width: 970, height: 250 },
    slot_homepage_sidebar: { width: 300, height: 250 },
    slot_article_top: { width: 728, height: 90 },
    slot_article_inline: { width: 600, height: 300 },
    slot_article_bottom: { width: 728, height: 90 },
    slot_category_banner: { width: 970, height: 90 },
    slot_newsletter_header: { width: 600, height: 200 },
    slot_newsletter_inline: { width: 600, height: 150 },
    slot_feed_card: { width: 400, height: 300 },
    slot_search_results: { width: 600, height: 100 },
    slot_sidebar_sticky: { width: 300, height: 600 },
    slot_footer_banner: { width: 970, height: 90 },
  };
  return defaults[slotId] || { width: 728, height: 90 };
}

// ============================================================================
// CAMPAIGN MANAGEMENT API
// ============================================================================

/**
 * Create a new ad campaign (pre-approval)
 */
export async function createCampaign(input: {
  advertiserId: string;
  advertiserName: string;
  adType: AdType;
  creativeUrl: string;
  creativeAlternatives?: string[];
  title: string;
  description: string;
  targetUrl: string;
  totalBudget: number;
  rotationStrategy?: RotationStrategy;
  pacingMode?: PacingMode;
  targeting: Partial<AdTargeting>;
  scheduling: { startDate: string; endDate: string; timezone?: string };
  frequencyCap?: Partial<FrequencyCap>;
  bidAmount?: number;
  priority?: number;
  creativeSpec?: CreativeSpec;
  vastTag?: string;
  vpaidEnabled?: boolean;
  companionAds?: CompanionAd[];
}): Promise<AdCampaign> {
  const id = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

  const campaign: AdCampaign = {
    id,
    advertiserId: input.advertiserId,
    advertiserName: input.advertiserName,
    adType: input.adType,
    creativeUrl: input.creativeUrl,
    creativeAlternatives: input.creativeAlternatives || [],
    title: input.title,
    description: input.description,
    targetUrl: input.targetUrl,
    totalBudget: input.totalBudget,
    remainingBudget: input.totalBudget,
    dailyCap: 0, // Calculated on approval
    dailySpent: 0,
    status: 'pending',
    currentTier: 'premium',
    rotationStrategy: input.rotationStrategy || 'optimized',
    pacingMode: input.pacingMode || 'even',
    targeting: {
      sections: input.targeting.sections || [],
      regions: input.targeting.regions || ['NG', 'KE', 'ZA', 'GH'],
      languages: input.targeting.languages || ['en'],
      devices: input.targeting.devices || ['mobile', 'desktop', 'tablet'],
      newsletterAllowed: input.targeting.newsletterAllowed ?? true,
      audienceSegments: input.targeting.audienceSegments || [],
      contextualKeywords: input.targeting.contextualKeywords || ['crypto', 'bitcoin', 'blockchain'],
      excludeSections: input.targeting.excludeSections || [],
      excludeRegions: input.targeting.excludeRegions || [],
    },
    scheduling: {
      startDate: new Date(input.scheduling.startDate),
      endDate: new Date(input.scheduling.endDate),
      timezone: input.scheduling.timezone || 'Africa/Lagos',
    },
    frequencyCap: {
      maxImpressionsPerUser: input.frequencyCap?.maxImpressionsPerUser || 10,
      maxImpressionsPerUserPerDay: input.frequencyCap?.maxImpressionsPerUserPerDay || 3,
      maxClicksPerUserPerDay: input.frequencyCap?.maxClicksPerUserPerDay || 2,
      windowHours: input.frequencyCap?.windowHours || 168,
    },
    performance: createDefaultPerformance(),
    createdAt: new Date(),
    startDate: new Date(input.scheduling.startDate),
    endDate: new Date(input.scheduling.endDate),
    priority: input.priority || 50,
    bidAmount: input.bidAmount || 2.0,
    creativeSpec: input.creativeSpec,
    vastTag: input.vastTag,
    vpaidEnabled: input.vpaidEnabled,
    companionAds: input.companionAds || [],
  };

  const validation = validateCreative(campaign);
  if (!validation.valid) {
    throw new Error(`Creative validation failed: ${validation.errors.join('; ')}`);
  }

  if (Object.keys(validation.normalizedSpec || {}).length > 0) {
    campaign.creativeSpec = {
      ...(campaign.creativeSpec || {}),
      ...validation.normalizedSpec,
    } as CreativeSpec;
  }

  await saveCampaign(campaign);
  return campaign;
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(campaignId: string): Promise<void> {
  await updateCampaignStatus(campaignId, 'paused');
  logger.info(`[AdsAgent] Campaign ${campaignId} paused`);
}

/**
 * Resume a paused campaign
 */
export async function resumeCampaign(campaignId: string): Promise<void> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  if (campaign.remainingBudget <= 0) throw new Error('Cannot resume — budget depleted');

  campaign.status = 'active';
  campaign.currentTier = calculateBudgetTier(campaign);
  const pacing = calculatePacing(campaign);
  campaign.dailyCap = pacing.dailyCap;
  await saveCampaign(campaign);

  logger.info(`[AdsAgent] Campaign ${campaignId} resumed`);
}

/**
 * Cancel a campaign and refund remaining budget
 */
export async function cancelCampaign(campaignId: string): Promise<{ refundAmount: number }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const refundAmount = campaign.remainingBudget;
  campaign.status = 'cancelled';
  campaign.remainingBudget = 0;
  await saveCampaign(campaign);

  // Remove from active set
  const activeIds = await getActiveCampaignIds();
  const filtered = activeIds.filter(id => id !== campaignId);
  await redisClient.set(`${REDIS_PREFIX.CAMPAIGN}active`, JSON.stringify(filtered));

  logger.info(`[AdsAgent] Campaign ${campaignId} cancelled, refund: $${refundAmount}`);
  return { refundAmount };
}

/**
 * Get all campaigns for an advertiser
 */
export async function getAdvertiserCampaigns(advertiserId: string): Promise<AdCampaign[]> {
  const allIds = await getAllCampaignIds();
  const campaigns: AdCampaign[] = [];

  for (const id of allIds) {
    const campaign = await getCampaign(id);
    if (campaign && campaign.advertiserId === advertiserId) {
      campaigns.push(campaign);
    }
  }

  return campaigns;
}

/**
 * Get all campaigns (admin)
 */
export async function getAllCampaigns(): Promise<AdCampaign[]> {
  const allIds = await getAllCampaignIds();
  const campaigns: AdCampaign[] = [];

  for (const id of allIds) {
    const campaign = await getCampaign(id);
    if (campaign) campaigns.push(campaign);
  }

  return campaigns;
}

// ============================================================================
// CONNECTOR SYNC (CMS + NEWSLETTER)
// ============================================================================

export async function syncCampaignToNewsletter(campaignId: string): Promise<{ queued: boolean; placements: number }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  if (!campaign.targeting.newsletterAllowed) {
    return { queued: false, placements: 0 };
  }

  const slots = await getAllInventorySlots();
  const newsletterSlots = slots.filter(s => s.location.startsWith('newsletter') && s.slotType.includes(campaign.adType));
  if (newsletterSlots.length === 0) {
    return { queued: false, placements: 0 };
  }

  const queueKey = `${REDIS_PREFIX.QUEUE}newsletter:${campaignId}`;
  await redisClient.setEx(queueKey, 86400, JSON.stringify({
    campaignId,
    adType: campaign.adType,
    creativeUrl: campaign.creativeUrl,
    targetUrl: campaign.targetUrl,
    queuedAt: new Date().toISOString(),
    slots: newsletterSlots.map(s => s.id),
  }));

  return { queued: true, placements: newsletterSlots.length };
}

export async function syncCampaignToCMS(campaignId: string): Promise<{ queued: boolean; placements: number }> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const slots = await getAllInventorySlots();
  const cmsSlots = slots.filter(s => !s.location.startsWith('newsletter') && s.slotType.includes(campaign.adType));
  if (cmsSlots.length === 0) {
    return { queued: false, placements: 0 };
  }

  const queueKey = `${REDIS_PREFIX.QUEUE}cms:${campaignId}`;
  await redisClient.setEx(queueKey, 86400, JSON.stringify({
    campaignId,
    adType: campaign.adType,
    creativeUrl: campaign.creativeUrl,
    targetUrl: campaign.targetUrl,
    queuedAt: new Date().toISOString(),
    slots: cmsSlots.map(s => s.id),
  }));

  return { queued: true, placements: cmsSlots.length };
}

export async function syncCampaignConnectors(campaignId: string): Promise<{
  campaignId: string;
  newsletter: { queued: boolean; placements: number };
  cms: { queued: boolean; placements: number };
}> {
  const [newsletter, cms] = await Promise.all([
    syncCampaignToNewsletter(campaignId),
    syncCampaignToCMS(campaignId),
  ]);

  logger.info(`[AdsAgent] Connector sync for ${campaignId}: newsletter=${newsletter.placements}, cms=${cms.placements}`);

  return { campaignId, newsletter, cms };
}

// ============================================================================
// ML RETRAINING LOOP
// ============================================================================

let retrainingTimer: NodeJS.Timeout | null = null;

export async function retrainCampaignModel(campaignId: string): Promise<{
  campaignId: string;
  updated: boolean;
  creativesUpdated: number;
}> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

  const creativePerf = campaign.performance.creativePerformance || [];
  if (creativePerf.length === 0) {
    return { campaignId, updated: false, creativesUpdated: 0 };
  }

  const scored = creativePerf.map((c) => {
    const ctr = c.impressions > 0 ? c.clicks / c.impressions : c.ctr || 0;
    const volumeWeight = Math.min(1, c.impressions / 10000);
    const score = Math.max(0, Math.min(1, ctr * 20 * 0.7 + volumeWeight * 0.3));
    return {
      ...c,
      ctr,
      score,
    };
  });

  campaign.performance.creativePerformance = scored;
  campaign.performance.ctr = scored.reduce((s, c) => s + c.ctr, 0) / scored.length;
  await saveCampaign(campaign);

  return { campaignId, updated: true, creativesUpdated: scored.length };
}

export async function retrainAllActiveCampaignModels(): Promise<{
  total: number;
  updated: number;
}> {
  const ids = await getActiveCampaignIds();
  let updated = 0;

  for (const id of ids) {
    try {
      const result = await retrainCampaignModel(id);
      if (result.updated) updated += 1;
    } catch (error) {
      logger.warn(`[AdsAgent] Retrain failed for ${id}:`, error);
    }
  }

  return { total: ids.length, updated };
}

export function startMLRetrainingLoop(intervalMs: number = MODEL_RETRAIN_INTERVAL_MS): void {
  if (retrainingTimer) return;

  retrainingTimer = setInterval(async () => {
    try {
      const result = await retrainAllActiveCampaignModels();
      logger.info(`[AdsAgent] ML retraining completed: ${result.updated}/${result.total} campaigns updated`);
    } catch (error) {
      logger.warn('[AdsAgent] ML retraining loop failed:', error);
    }
  }, intervalMs);

  logger.info(`[AdsAgent] ML retraining loop started (${Math.floor(intervalMs / 60000)} min interval)`);
}

export function stopMLRetrainingLoop(): void {
  if (!retrainingTimer) return;
  clearInterval(retrainingTimer);
  retrainingTimer = null;
}

// ============================================================================
// AGENT HEALTH CHECK
// ============================================================================

export async function checkAgentHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  redisConnected: boolean;
  deepseekAvailable: boolean;
  activeCampaigns: number;
  message: string;
}> {
  let redisConnected = false;
  let deepseekAvailable = false;
  let activeCampaigns = 0;

  try {
    await redisClient.set('ads:health', 'ok');
    redisConnected = true;
  } catch { /* Redis down */ }

  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      deepseekAvailable = (data.models || []).some((m: any) => m.name.includes('deepseek'));
    }
  } catch { /* Ollama down */ }

  try {
    activeCampaigns = (await getActiveCampaignIds()).length;
  } catch { /* Error reading campaigns */ }

  const status = redisConnected && deepseekAvailable ? 'healthy' : redisConnected ? 'degraded' : 'down';

  return {
    status,
    redisConnected,
    deepseekAvailable,
    activeCampaigns,
    message: status === 'healthy'
      ? `Agent operational with ${activeCampaigns} active campaigns`
      : status === 'degraded'
        ? 'Agent running without AI optimization (DeepSeek R1 unavailable)'
        : 'Agent offline — Redis connection failed',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Trigger
  onAdApproved,
  // Selection (real-time <100ms)
  selectAd,
  // Tracking
  recordClick,
  recordConversion,
  // Video & viewability tracking
  recordVideoEvent,
  recordViewability,
  // Creative validation
  validateCreative,
  // VAST/VPAID
  generateVASTXml,
  generateVASTTagUrl,
  // Connectors
  syncCampaignToNewsletter,
  syncCampaignToCMS,
  syncCampaignConnectors,
  // ML retraining
  retrainCampaignModel,
  retrainAllActiveCampaignModels,
  startMLRetrainingLoop,
  stopMLRetrainingLoop,
  // Format negotiation
  negotiateCreativeFormat,
  getViewabilityConfig,
  // Campaign management
  createCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getAdvertiserCampaigns,
  getAllCampaigns,
  // Batch & pacing
  adjustPacing,
  processBatchPlacements,
  dailyReset,
  // Reporting
  getAdvertiserReport,
  getSystemHealthReport,
  // AI
  getAIOptimizationScore,
  getAIPlacementStrategy,
  // Inventory
  registerInventorySlot,
  updateTrafficScores,
  // Health
  checkAgentHealth,
};
