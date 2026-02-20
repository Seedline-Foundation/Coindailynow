/**
 * Influencer Partner Verification Service
 *
 * Analyzes social media handles to produce a qualification score.
 * Thresholds:
 *   - Followers >= 20,000 per channel
 *   - Avg views >= 100,000 (video platforms)
 *   - Watch hours >= 5,000 (YouTube)
 *   - Engagement must appear organic
 *   - Overall weighted score must be >= 60 to qualify
 *
 * Scoring weights:
 *   followers  0.25
 *   views      0.20
 *   watchHours 0.15
 *   engagement 0.25
 *   organic    0.15
 */

export interface SocialHandleInput {
  platform: string;
  handle: string;
  profileUrl: string;
  followers: number;
  avgViews: number;
  watchHours: number;
  engagementRate: number;
}

export interface VerificationResult {
  category: string;
  score: number;   // 0-100
  weight: number;
  passed: boolean;
  details: Record<string, any>;
}

export interface VerificationReport {
  overallScore: number;
  qualified: boolean;
  results: VerificationResult[];
  summary: string;
}

const THRESHOLDS = {
  MIN_FOLLOWERS: 20_000,
  MIN_AVG_VIEWS: 100_000,
  MIN_WATCH_HOURS: 5_000,
  MIN_ENGAGEMENT_RATE: 1.0,    // 1% minimum
  MAX_ENGAGEMENT_RATE: 15.0,   // above this is suspicious
  QUALIFICATION_SCORE: 60,
};

const WEIGHTS = {
  followers: 0.25,
  views: 0.20,
  watchHours: 0.15,
  engagement: 0.25,
  organic: 0.15,
};

const VIDEO_PLATFORMS = ['youtube', 'tiktok'];

/**
 * Score follower count across all handles.
 * 100 if best channel >= 100k, proportional down to 0 at 0 followers.
 */
function scoreFollowers(handles: SocialHandleInput[]): VerificationResult {
  const maxFollowers = Math.max(...handles.map(h => h.followers), 0);
  let score: number;
  if (maxFollowers >= 100_000) {
    score = 100;
  } else if (maxFollowers >= THRESHOLDS.MIN_FOLLOWERS) {
    score = 40 + ((maxFollowers - THRESHOLDS.MIN_FOLLOWERS) / (100_000 - THRESHOLDS.MIN_FOLLOWERS)) * 60;
  } else {
    score = (maxFollowers / THRESHOLDS.MIN_FOLLOWERS) * 40;
  }
  score = Math.round(Math.min(score, 100) * 100) / 100;

  return {
    category: 'followers',
    score,
    weight: WEIGHTS.followers,
    passed: maxFollowers >= THRESHOLDS.MIN_FOLLOWERS,
    details: {
      maxFollowers,
      threshold: THRESHOLDS.MIN_FOLLOWERS,
      perChannel: handles.map(h => ({ platform: h.platform, followers: h.followers })),
    },
  };
}

/**
 * Score average views (only applies to video platforms).
 * If no video platform present, give a pass with 60 (neutral).
 */
function scoreViews(handles: SocialHandleInput[]): VerificationResult {
  const videoHandles = handles.filter(h => VIDEO_PLATFORMS.includes(h.platform.toLowerCase()));
  if (videoHandles.length === 0) {
    return {
      category: 'views',
      score: 60,
      weight: WEIGHTS.views,
      passed: true,
      details: { note: 'No video platform present; neutral score applied' },
    };
  }

  const maxViews = Math.max(...videoHandles.map(h => h.avgViews), 0);
  let score: number;
  if (maxViews >= 500_000) {
    score = 100;
  } else if (maxViews >= THRESHOLDS.MIN_AVG_VIEWS) {
    score = 50 + ((maxViews - THRESHOLDS.MIN_AVG_VIEWS) / (500_000 - THRESHOLDS.MIN_AVG_VIEWS)) * 50;
  } else {
    score = (maxViews / THRESHOLDS.MIN_AVG_VIEWS) * 50;
  }
  score = Math.round(Math.min(score, 100) * 100) / 100;

  return {
    category: 'views',
    score,
    weight: WEIGHTS.views,
    passed: maxViews >= THRESHOLDS.MIN_AVG_VIEWS,
    details: { maxViews, threshold: THRESHOLDS.MIN_AVG_VIEWS },
  };
}

/**
 * Score watch hours (YouTube specific).
 */
function scoreWatchHours(handles: SocialHandleInput[]): VerificationResult {
  const ytHandle = handles.find(h => h.platform.toLowerCase() === 'youtube');
  if (!ytHandle) {
    return {
      category: 'watch_hours',
      score: 60,
      weight: WEIGHTS.watchHours,
      passed: true,
      details: { note: 'No YouTube channel; neutral score applied' },
    };
  }

  const hours = ytHandle.watchHours;
  let score: number;
  if (hours >= 20_000) {
    score = 100;
  } else if (hours >= THRESHOLDS.MIN_WATCH_HOURS) {
    score = 50 + ((hours - THRESHOLDS.MIN_WATCH_HOURS) / (20_000 - THRESHOLDS.MIN_WATCH_HOURS)) * 50;
  } else {
    score = (hours / THRESHOLDS.MIN_WATCH_HOURS) * 50;
  }
  score = Math.round(Math.min(score, 100) * 100) / 100;

  return {
    category: 'watch_hours',
    score,
    weight: WEIGHTS.watchHours,
    passed: hours >= THRESHOLDS.MIN_WATCH_HOURS,
    details: { watchHours: hours, threshold: THRESHOLDS.MIN_WATCH_HOURS },
  };
}

/**
 * Score engagement rate.
 * Best range is 3-8%. Below 1% = low. Above 15% = suspicious.
 */
function scoreEngagement(handles: SocialHandleInput[]): VerificationResult {
  const rates = handles.map(h => h.engagementRate).filter(r => r > 0);
  if (rates.length === 0) {
    return {
      category: 'engagement',
      score: 0,
      weight: WEIGHTS.engagement,
      passed: false,
      details: { note: 'No engagement data provided' },
    };
  }

  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  let score: number;
  if (avgRate >= 3 && avgRate <= 8) {
    score = 100;
  } else if (avgRate >= THRESHOLDS.MIN_ENGAGEMENT_RATE && avgRate < 3) {
    score = 40 + ((avgRate - THRESHOLDS.MIN_ENGAGEMENT_RATE) / (3 - THRESHOLDS.MIN_ENGAGEMENT_RATE)) * 60;
  } else if (avgRate > 8 && avgRate <= THRESHOLDS.MAX_ENGAGEMENT_RATE) {
    score = 70; // slightly above ideal but not suspicious
  } else if (avgRate > THRESHOLDS.MAX_ENGAGEMENT_RATE) {
    score = 20; // suspicious — likely bots
  } else {
    score = (avgRate / THRESHOLDS.MIN_ENGAGEMENT_RATE) * 40;
  }
  score = Math.round(Math.min(score, 100) * 100) / 100;

  return {
    category: 'engagement',
    score,
    weight: WEIGHTS.engagement,
    passed: avgRate >= THRESHOLDS.MIN_ENGAGEMENT_RATE && avgRate <= THRESHOLDS.MAX_ENGAGEMENT_RATE,
    details: { avgEngagementRate: avgRate, perChannel: handles.map(h => ({ platform: h.platform, rate: h.engagementRate })) },
  };
}

/**
 * Score organic authenticity.
 * Heuristic: if engagement > 15% with followers < 50k, flag as suspicious.
 */
function scoreOrganic(handles: SocialHandleInput[]): VerificationResult {
  let suspiciousCount = 0;
  const flags: string[] = [];

  for (const h of handles) {
    // Very high engagement with few followers = bought engagement
    if (h.engagementRate > THRESHOLDS.MAX_ENGAGEMENT_RATE && h.followers < 50_000) {
      suspiciousCount++;
      flags.push(`${h.platform}: high engagement (${h.engagementRate}%) with only ${h.followers} followers`);
    }
    // Very low engagement with high followers = bought followers
    if (h.followers > 50_000 && h.engagementRate < 0.5) {
      suspiciousCount++;
      flags.push(`${h.platform}: very low engagement (${h.engagementRate}%) with ${h.followers} followers`);
    }
  }

  const ratio = handles.length > 0 ? suspiciousCount / handles.length : 0;
  let score: number;
  if (ratio === 0) {
    score = 100;
  } else if (ratio <= 0.25) {
    score = 70;
  } else if (ratio <= 0.5) {
    score = 40;
  } else {
    score = 10;
  }

  return {
    category: 'organic',
    score,
    weight: WEIGHTS.organic,
    passed: ratio <= 0.25,
    details: { suspiciousCount, totalChannels: handles.length, flags },
  };
}

/**
 * Main entry point: run full verification of an influencer's social handles.
 */
export function verifyInfluencer(handles: SocialHandleInput[]): VerificationReport {
  if (handles.length === 0) {
    return {
      overallScore: 0,
      qualified: false,
      results: [],
      summary: 'No social media handles provided.',
    };
  }

  const results: VerificationResult[] = [
    scoreFollowers(handles),
    scoreViews(handles),
    scoreWatchHours(handles),
    scoreEngagement(handles),
    scoreOrganic(handles),
  ];

  const overallScore = Math.round(
    results.reduce((sum, r) => sum + r.score * r.weight, 0) * 100
  ) / 100;

  const qualified = overallScore >= THRESHOLDS.QUALIFICATION_SCORE;
  const failedCategories = results.filter(r => !r.passed).map(r => r.category);

  let summary: string;
  if (qualified) {
    summary = `Qualified with a score of ${overallScore}/100. All key criteria met.`;
  } else {
    summary = `Not qualified. Score: ${overallScore}/100 (minimum ${THRESHOLDS.QUALIFICATION_SCORE}). Failed: ${failedCategories.join(', ') || 'overall threshold'}.`;
  }

  return { overallScore, qualified, results, summary };
}

/**
 * Run verification and persist results to database via Prisma.
 */
export async function verifyAndPersist(
  prisma: any,
  profileId: string,
  handles: SocialHandleInput[]
): Promise<VerificationReport> {
  const report = verifyInfluencer(handles);

  // Upsert social handles
  for (const h of handles) {
    await prisma.influencerSocialHandle.upsert({
      where: {
        profileId_platform: { profileId, platform: h.platform },
      },
      create: {
        profileId,
        platform: h.platform,
        handle: h.handle,
        profileUrl: h.profileUrl,
        followers: h.followers,
        avgViews: h.avgViews,
        watchHours: h.watchHours,
        engagementRate: h.engagementRate,
        isOrganic: report.results.find(r => r.category === 'organic')?.passed ?? true,
        verified: true,
        lastChecked: new Date(),
      },
      update: {
        handle: h.handle,
        profileUrl: h.profileUrl,
        followers: h.followers,
        avgViews: h.avgViews,
        watchHours: h.watchHours,
        engagementRate: h.engagementRate,
        isOrganic: report.results.find(r => r.category === 'organic')?.passed ?? true,
        verified: true,
        lastChecked: new Date(),
      },
    });
  }

  // Delete old verification entries for this profile
  await prisma.influencerVerification.deleteMany({ where: { profileId } });

  // Store each verification category
  for (const r of report.results) {
    await prisma.influencerVerification.create({
      data: {
        profileId,
        category: r.category,
        score: r.score,
        weight: r.weight,
        details: JSON.stringify(r.details),
        passed: r.passed,
      },
    });
  }

  // Update the profile's overall score and status
  await prisma.influencerPartnerProfile.update({
    where: { id: profileId },
    data: {
      overallScore: report.overallScore,
      status: report.qualified ? 'approved' : 'rejected',
      qualifiedAt: report.qualified ? new Date() : null,
      rejectedAt: report.qualified ? null : new Date(),
      rejectionReason: report.qualified ? null : report.summary,
    },
  });

  return report;
}
