/**
 * Local SEO & Google My Business Service
 * Task 80: Complete local SEO optimization system
 * 
 * Features:
 * - Google My Business profile management
 * - Local keyword tracking and optimization
 * - Citation building and NAP consistency
 * - Review management and reputation
 * - Local content optimization
 * - Geo-targeting and local search ranking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to filter out undefined values from objects
const filterUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
};

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GMBProfile {
  businessName: string;
  businessDescription?: string;
  businessCategory: 'PRIMARY' | 'SECONDARY' | 'TERTIARY';
  categories: string[];
  country: string;
  city: string;
  region: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  businessHours?: Record<string, any>;
  logoUrl?: string;
  coverImageUrl?: string;
}

interface LocalKeywordData {
  gmbId: string;
  keyword: string;
  keywordType: 'CITY' | 'REGION' | 'SERVICE' | 'PRODUCT' | 'BRANDED';
  targetCity: string;
  targetRegion?: string;
  targetCountry: string;
  searchVolume?: number;
  difficulty?: number;
  competition?: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface CitationData {
  gmbId: string;
  directoryName: string;
  directoryUrl: string;
  directoryType: 'LOCAL' | 'NATIONAL' | 'INDUSTRY' | 'SOCIAL';
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  domainAuthority?: number;
}

interface ReviewData {
  gmbId: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  platform: string;
  reviewDate: Date;
}

// ============================================================================
// Google My Business Management
// ============================================================================

export const createGMBProfile = async (data: GMBProfile) => {
  // Calculate initial completion score
  const completionScore = calculateCompletionScore({
    businessName: data.businessName,
    businessDescription: data.businessDescription,
    address: data.address,
    phone: data.phone,
    email: data.email,
    website: data.website,
    businessHours: data.businessHours,
    logoUrl: data.logoUrl,
    coverImageUrl: data.coverImageUrl,
  });

  const createData: any = {
    businessName: data.businessName,
    businessCategory: data.businessCategory,
    categories: JSON.stringify(data.categories),
    country: data.country,
    city: data.city,
    region: data.region,
    completionScore,
    profileStatus: completionScore >= 90 ? 'COMPLETE' : 'INCOMPLETE',
  };

  if (data.businessDescription) createData.businessDescription = data.businessDescription;
  if (data.address) createData.address = data.address;
  if (data.postalCode) createData.postalCode = data.postalCode;
  if (data.latitude) createData.latitude = data.latitude;
  if (data.longitude) createData.longitude = data.longitude;
  if (data.phone) createData.phone = data.phone;
  if (data.email) createData.email = data.email;
  if (data.website) createData.website = data.website;
  if (data.businessHours) createData.businessHours = JSON.stringify(data.businessHours);
  if (data.logoUrl) createData.logoUrl = data.logoUrl;
  if (data.coverImageUrl) createData.coverImageUrl = data.coverImageUrl;

  const gmb = await prisma.googleMyBusiness.create({
    data: createData,
  });

  return gmb;
};

export const updateGMBProfile = async (id: string, data: Partial<GMBProfile>) => {
  const existing = await prisma.googleMyBusiness.findUnique({ where: { id } });
  if (!existing) throw new Error('GMB profile not found');

  // Recalculate completion score
  const mergedData = { ...existing, ...data };
  const completionScore = calculateCompletionScore(mergedData);

  const updateData = filterUndefined({
    ...data,
    categories: data.categories ? JSON.stringify(data.categories) : undefined,
    businessHours: data.businessHours ? JSON.stringify(data.businessHours) : undefined,
    completionScore,
    profileStatus: completionScore >= 90 ? 'COMPLETE' : 'INCOMPLETE',
    updatedAt: new Date(),
  });

  const gmb = await prisma.googleMyBusiness.update({
    where: { id },
    data: updateData,
  });

  return gmb;
};

export const verifyGMBProfile = async (
  id: string,
  method: 'PHONE' | 'EMAIL' | 'POSTCARD' | 'VIDEO'
) => {
  const gmb = await prisma.googleMyBusiness.update({
    where: { id },
    data: {
      isVerified: true,
      verificationMethod: method,
      verifiedAt: new Date(),
      profileStatus: 'VERIFIED',
      updatedAt: new Date(),
    },
  });

  return gmb;
};

export const optimizeGMBProfile = async (id: string) => {
  const gmb = await prisma.googleMyBusiness.findUnique({
    where: { id },
    include: {
      keywords: true,
      citations: true,
      reviews: true,
    },
  });

  if (!gmb) throw new Error('GMB profile not found');

  // Calculate optimization metrics
  const keywordScore = gmb.keywords.length >= 10 ? 100 : (gmb.keywords.length / 10) * 100;
  const citationScore = gmb.citations.length >= 20 ? 100 : (gmb.citations.length / 20) * 100;
  const reviewScore = gmb.reviews.length >= 10 ? 100 : (gmb.reviews.length / 10) * 100;
  const completionScore = gmb.completionScore;

  const overallScore = (keywordScore + citationScore + reviewScore + completionScore) / 4;

  const updated = await prisma.googleMyBusiness.update({
    where: { id },
    data: {
      profileStatus: overallScore >= 85 ? 'OPTIMIZED' : gmb.profileStatus,
      lastOptimizedAt: new Date(),
      nextAuditAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      updatedAt: new Date(),
    },
  });

  return {
    gmb: updated,
    scores: {
      completion: completionScore,
      keywords: keywordScore,
      citations: citationScore,
      reviews: reviewScore,
      overall: overallScore,
    },
  };
};

export const getGMBProfiles = async (filters?: {
  country?: string;
  city?: string;
  isVerified?: boolean;
  profileStatus?: string;
}) => {
  const whereClause = filterUndefined({
    country: filters?.country,
    city: filters?.city,
    isVerified: filters?.isVerified,
    profileStatus: filters?.profileStatus,
  });

  const gmbs = await prisma.googleMyBusiness.findMany({
    where: whereClause,
    include: {
      keywords: true,
      citations: true,
      reviews: {
        orderBy: { reviewDate: 'desc' },
        take: 5,
      },
    },
    orderBy: { completionScore: 'desc' },
  });

  return gmbs;
};

export const getGMBProfile = async (id: string) => {
  const gmb = await prisma.googleMyBusiness.findUnique({
    where: { id },
    include: {
      keywords: {
        orderBy: { currentRanking: 'asc' },
      },
      citations: {
        orderBy: { domainAuthority: 'desc' },
      },
      reviews: {
        orderBy: { reviewDate: 'desc' },
      },
    },
  });

  return gmb;
};

// ============================================================================
// Local Keyword Management
// ============================================================================

export const addLocalKeyword = async (data: LocalKeywordData) => {
  const createData = filterUndefined({
    gmbId: data.gmbId,
    keyword: data.keyword,
    keywordType: data.keywordType,
    targetCity: data.targetCity,
    targetRegion: data.targetRegion,
    targetCountry: data.targetCountry,
    searchVolume: data.searchVolume || 0,
    difficulty: data.difficulty || 0,
    competition: data.competition || 'MEDIUM',
    optimizationScore: calculateKeywordOptimizationScore(data),
  }) as any;

  const keyword = await prisma.localKeyword.create({
    data: createData,
  });

  return keyword;
};

export const trackKeywordRanking = async (
  keywordId: string,
  currentRanking: number,
  clicks: number,
  impressions: number
) => {
  const existing = await prisma.localKeyword.findUnique({ where: { id: keywordId } });
  if (!existing) throw new Error('Keyword not found');

  const rankingChange = existing.currentRanking
    ? existing.currentRanking - currentRanking
    : 0;

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const keyword = await prisma.localKeyword.update({
    where: { id: keywordId },
    data: {
      previousRanking: existing.currentRanking,
      currentRanking,
      bestRanking:
        !existing.bestRanking || currentRanking < existing.bestRanking
          ? currentRanking
          : existing.bestRanking,
      rankingChange,
      clicks: existing.clicks + clicks,
      impressions: existing.impressions + impressions,
      ctr,
      lastTrackedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return keyword;
};

export const getLocalKeywords = async (gmbId: string) => {
  const keywords = await prisma.localKeyword.findMany({
    where: { gmbId },
    orderBy: [
      { currentRanking: 'asc' },
      { searchVolume: 'desc' },
    ],
  });

  return keywords;
};

export const getTopRankingKeywords = async (gmbId: string, topN: number = 10) => {
  const keywords = await prisma.localKeyword.findMany({
    where: {
      gmbId,
      currentRanking: { lte: topN },
    },
    orderBy: { currentRanking: 'asc' },
  });

  return keywords;
};

// ============================================================================
// Citation Management
// ============================================================================

export const addCitation = async (data: CitationData) => {
  // Check NAP consistency
  const gmb = await prisma.googleMyBusiness.findUnique({
    where: { id: data.gmbId },
  });

  if (!gmb) throw new Error('GMB profile not found');

  const napIssues: string[] = [];
  if (data.businessName !== gmb.businessName) {
    napIssues.push('Name mismatch');
  }
  if (data.businessAddress && data.businessAddress !== gmb.address) {
    napIssues.push('Address mismatch');
  }
  if (data.businessPhone && data.businessPhone !== gmb.phone) {
    napIssues.push('Phone mismatch');
  }

  const napConsistent = napIssues.length === 0;

  const createData = filterUndefined({
    gmbId: data.gmbId,
    directoryName: data.directoryName,
    directoryUrl: data.directoryUrl,
    directoryType: data.directoryType,
    businessName: data.businessName,
    businessAddress: data.businessAddress,
    businessPhone: data.businessPhone,
    businessWebsite: data.businessWebsite,
    domainAuthority: data.domainAuthority || 0,
    napConsistent,
    napIssues: napIssues.length > 0 ? JSON.stringify(napIssues) : null,
    citationStatus: napConsistent ? 'VERIFIED' : 'INCONSISTENT',
  }) as any;

  const citation = await prisma.localCitation.create({
    data: createData,
  });

  return citation;
};

export const verifyCitation = async (citationId: string, listingUrl: string) => {
  const citation = await prisma.localCitation.update({
    where: { id: citationId },
    data: {
      listingUrl,
      isVerified: true,
      verifiedAt: new Date(),
      citationStatus: 'VERIFIED',
      updatedAt: new Date(),
    },
  });

  return citation;
};

export const claimCitation = async (citationId: string) => {
  const citation = await prisma.localCitation.update({
    where: { id: citationId },
    data: {
      isClaimed: true,
      citationStatus: 'CLAIMED',
      updatedAt: new Date(),
    },
  });

  return citation;
};

export const getCitations = async (gmbId: string, filters?: {
  directoryType?: string;
  citationStatus?: string;
  napConsistent?: boolean;
}) => {
  const whereClause = filterUndefined({
    gmbId,
    directoryType: filters?.directoryType,
    citationStatus: filters?.citationStatus,
    napConsistent: filters?.napConsistent,
  });

  const citations = await prisma.localCitation.findMany({
    where: whereClause,
    orderBy: { domainAuthority: 'desc' },
  });

  return citations;
};

// ============================================================================
// Review Management
// ============================================================================

export const addReview = async (data: ReviewData) => {
  // Analyze sentiment
  const sentiment = analyzeSentiment(data.reviewText, data.rating);

  const review = await prisma.localReview.create({
    data: {
      gmbId: data.gmbId,
      reviewerName: data.reviewerName,
      rating: data.rating,
      reviewText: data.reviewText,
      platform: data.platform,
      reviewDate: data.reviewDate,
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      keyTopics: sentiment.topics ? JSON.stringify(sentiment.topics) : null,
    },
  });

  // Update GMB metrics
  await updateGMBReviewMetrics(data.gmbId);

  return review;
};

export const respondToReview = async (
  reviewId: string,
  responseText: string,
  responseAuthor: string
) => {
  const review = await prisma.localReview.update({
    where: { id: reviewId },
    data: {
      hasResponse: true,
      responseText,
      responseAuthor,
      respondedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return review;
};

export const getReviews = async (gmbId: string, filters?: {
  platform?: string;
  sentiment?: string;
  minRating?: number;
  maxRating?: number;
}) => {
  const whereClause: any = { gmbId };
  
  if (filters?.platform) whereClause.platform = filters.platform;
  if (filters?.sentiment) whereClause.sentiment = filters.sentiment;
  if (filters?.minRating !== undefined || filters?.maxRating !== undefined) {
    whereClause.rating = filterUndefined({
      gte: filters?.minRating,
      lte: filters?.maxRating,
    });
  }

  const reviews = await prisma.localReview.findMany({
    where: whereClause,
    orderBy: { reviewDate: 'desc' },
  });

  return reviews;
};

export const getReviewStats = async (gmbId: string) => {
  const reviews = await prisma.localReview.findMany({
    where: { gmbId },
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const sentimentDistribution = {
    POSITIVE: reviews.filter(r => r.sentiment === 'POSITIVE').length,
    NEUTRAL: reviews.filter(r => r.sentiment === 'NEUTRAL').length,
    NEGATIVE: reviews.filter(r => r.sentiment === 'NEGATIVE').length,
  };

  const responseRate = totalReviews > 0
    ? (reviews.filter(r => r.hasResponse).length / totalReviews) * 100
    : 0;

  return {
    totalReviews,
    avgRating,
    ratingDistribution,
    sentimentDistribution,
    responseRate,
    latestReviews: reviews.slice(0, 5),
  };
};

// ============================================================================
// Local Content Management
// ============================================================================

export const createLocalContent = async (data: {
  articleId?: string;
  title: string;
  slug: string;
  targetCity: string;
  targetRegion?: string;
  targetCountry: string;
  contentType: 'ARTICLE' | 'GUIDE' | 'NEWS' | 'EVENT' | 'DIRECTORY';
  localKeywords: string[];
  geoTags?: string[];
}) => {
  const optimizationScore = calculateContentOptimizationScore(data);

  const createData = filterUndefined({
    articleId: data.articleId,
    title: data.title,
    slug: data.slug,
    targetCity: data.targetCity,
    targetRegion: data.targetRegion,
    targetCountry: data.targetCountry,
    contentType: data.contentType,
    localKeywords: JSON.stringify(data.localKeywords),
    geoTags: data.geoTags ? JSON.stringify(data.geoTags) : null,
    optimizationScore,
    isOptimized: optimizationScore >= 80,
    publishedAt: new Date(),
  }) as any;

  const content = await prisma.localContent.create({
    data: createData,
  });

  return content;
};

export const trackLocalContentPerformance = async (
  contentId: string,
  views: number,
  shares: number,
  ranking?: number
) => {
  const existing = await prisma.localContent.findUnique({ where: { id: contentId } });
  if (!existing) throw new Error('Local content not found');

  const engagement = ((views * 1) + (shares * 5)) / 6;

  const content = await prisma.localContent.update({
    where: { id: contentId },
    data: {
      localViews: existing.localViews + views,
      localShares: existing.localShares + shares,
      localEngagement: engagement,
      localSearchRanking: ranking || existing.localSearchRanking,
      updatedAt: new Date(),
    },
  });

  return content;
};

export const getLocalContent = async (filters?: {
  targetCity?: string;
  targetCountry?: string;
  contentType?: string;
}) => {
  const content = await prisma.localContent.findMany({
    where: {
      targetCity: filters?.targetCity,
      targetCountry: filters?.targetCountry,
      contentType: filters?.contentType,
    },
    orderBy: [
      { localSearchRanking: 'asc' },
      { localEngagement: 'desc' },
    ],
  });

  return content;
};

// ============================================================================
// Metrics & Analytics
// ============================================================================

export const calculateLocalSEOMetrics = async () => {
  const gmbs = await prisma.googleMyBusiness.findMany({
    include: {
      keywords: true,
      citations: true,
      reviews: true,
    },
  });

  const localContent = await prisma.localContent.findMany();

  // GMB Metrics
  const totalBusinesses = gmbs.length;
  const verifiedBusinesses = gmbs.filter(g => g.isVerified).length;
  const avgCompletionScore = totalBusinesses > 0
    ? gmbs.reduce((sum, g) => sum + g.completionScore, 0) / totalBusinesses
    : 0;

  // Keyword Metrics
  const allKeywords = gmbs.flatMap(g => g.keywords);
  const totalLocalKeywords = allKeywords.length;
  const rankedKeywords = allKeywords.filter(k => k.currentRanking).length;
  const top3Keywords = allKeywords.filter(k => k.currentRanking && k.currentRanking <= 3).length;
  const top10Keywords = allKeywords.filter(k => k.currentRanking && k.currentRanking <= 10).length;

  const avgLocalRanking = rankedKeywords > 0
    ? allKeywords
        .filter(k => k.currentRanking)
        .reduce((sum, k) => sum + k.currentRanking!, 0) / rankedKeywords
    : null;

  // Citation Metrics
  const allCitations = gmbs.flatMap(g => g.citations);
  const totalCitations = allCitations.length;
  const verifiedCitations = allCitations.filter(c => c.isVerified).length;
  const claimedCitations = allCitations.filter(c => c.isClaimed).length;
  const napConsistentCount = allCitations.filter(c => c.napConsistent).length;
  const napConsistencyRate = totalCitations > 0
    ? (napConsistentCount / totalCitations) * 100
    : 0;

  // Review Metrics
  const allReviews = gmbs.flatMap(g => g.reviews);
  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : null;
  const positiveReviews = allReviews.filter(r => r.sentiment === 'POSITIVE').length;
  const negativeReviews = allReviews.filter(r => r.sentiment === 'NEGATIVE').length;
  const responseRate = totalReviews > 0
    ? (allReviews.filter(r => r.hasResponse).length / totalReviews) * 100
    : 0;

  // Content Metrics
  const localContentCount = localContent.length;
  const avgContentScore = localContentCount > 0
    ? localContent.reduce((sum, c) => sum + c.optimizationScore, 0) / localContentCount
    : 0;

  // Traffic Metrics
  const localSearchViews = gmbs.reduce((sum, g) => sum + g.searchViews, 0);
  const directionsClicked = gmbs.reduce((sum, g) => sum + g.directionsClicked, 0);
  const phoneClicked = gmbs.reduce((sum, g) => sum + g.phoneClicked, 0);
  const websiteClicked = gmbs.reduce((sum, g) => sum + g.websiteClicked, 0);

  // Map Pack Appearances
  const mapPackAppearances = allKeywords.filter(
    k => k.currentRanking && k.currentRanking <= 3
  ).length;
  const localTop3Count = allKeywords.filter(
    k => k.currentRanking && k.currentRanking <= 3
  ).length;
  const localTop10Count = allKeywords.filter(
    k => k.currentRanking && k.currentRanking <= 10
  ).length;

  // Overall Local SEO Score
  const localSEOScore = calculateOverallLocalSEOScore({
    avgCompletionScore,
    verifiedBusinesses,
    totalBusinesses,
    top3Keywords,
    totalLocalKeywords,
    napConsistencyRate,
    avgRating,
    responseRate,
    avgContentScore,
  });

  const metrics = await prisma.localSEOMetrics.create({
    data: {
      metricDate: new Date(),
      avgCompletionScore,
      verifiedBusinesses,
      totalBusinesses,
      avgLocalRanking,
      mapPackAppearances,
      localTop3Count,
      localTop10Count,
      totalLocalKeywords,
      rankedKeywords,
      top3Keywords,
      top10Keywords,
      totalCitations,
      verifiedCitations,
      claimedCitations,
      napConsistencyRate,
      totalReviews,
      avgRating,
      positiveReviews,
      negativeReviews,
      responseRate,
      localContentCount,
      avgContentScore,
      localSearchViews,
      directionsClicked,
      phoneClicked,
      websiteClicked,
      localSEOScore,
    },
  });

  return metrics;
};

export const getLocalSEOStatistics = async () => {
  const latest = await prisma.localSEOMetrics.findFirst({
    orderBy: { metricDate: 'desc' },
  });

  const gmbs = await prisma.googleMyBusiness.findMany({
    include: {
      keywords: true,
      citations: true,
      reviews: true,
    },
  });

  const localContent = await prisma.localContent.findMany();

  return {
    metrics: latest,
    gmbs: {
      total: gmbs.length,
      verified: gmbs.filter(g => g.isVerified).length,
      optimized: gmbs.filter(g => g.profileStatus === 'OPTIMIZED').length,
      avgCompletionScore: gmbs.length > 0
        ? gmbs.reduce((sum, g) => sum + g.completionScore, 0) / gmbs.length
        : 0,
    },
    keywords: {
      total: gmbs.reduce((sum, g) => sum + g.keywords.length, 0),
      top3: gmbs.reduce(
        (sum, g) => sum + g.keywords.filter(k => k.currentRanking && k.currentRanking <= 3).length,
        0
      ),
      top10: gmbs.reduce(
        (sum, g) => sum + g.keywords.filter(k => k.currentRanking && k.currentRanking <= 10).length,
        0
      ),
    },
    citations: {
      total: gmbs.reduce((sum, g) => sum + g.citations.length, 0),
      verified: gmbs.reduce((sum, g) => sum + g.citations.filter(c => c.isVerified).length, 0),
      claimed: gmbs.reduce((sum, g) => sum + g.citations.filter(c => c.isClaimed).length, 0),
    },
    reviews: {
      total: gmbs.reduce((sum, g) => sum + g.reviews.length, 0),
      avgRating: calculateAverageRating(gmbs),
      positiveCount: gmbs.reduce(
        (sum, g) => sum + g.reviews.filter(r => r.sentiment === 'POSITIVE').length,
        0
      ),
    },
    content: {
      total: localContent.length,
      optimized: localContent.filter(c => c.isOptimized).length,
      avgScore: localContent.length > 0
        ? localContent.reduce((sum, c) => sum + c.optimizationScore, 0) / localContent.length
        : 0,
    },
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateCompletionScore(data: any): number {
  let score = 0;
  const fields = [
    'businessName',
    'businessDescription',
    'address',
    'phone',
    'email',
    'website',
    'businessHours',
    'logoUrl',
    'coverImageUrl',
  ];

  fields.forEach(field => {
    if (data[field]) score += 100 / fields.length;
  });

  return Math.round(score);
}

function calculateKeywordOptimizationScore(data: LocalKeywordData): number {
  let score = 0;

  // Search volume score (0-40)
  if (data.searchVolume) {
    if (data.searchVolume >= 1000) score += 40;
    else if (data.searchVolume >= 500) score += 30;
    else if (data.searchVolume >= 100) score += 20;
    else score += 10;
  }

  // Difficulty score (0-30, inverse)
  if (data.difficulty !== undefined) {
    score += (100 - data.difficulty) * 0.3;
  }

  // Competition score (0-30)
  if (data.competition === 'LOW') score += 30;
  else if (data.competition === 'MEDIUM') score += 20;
  else score += 10;

  return Math.round(score);
}

function calculateContentOptimizationScore(data: any): number {
  let score = 50; // Base score

  // Local keywords (0-30)
  if (data.localKeywords && data.localKeywords.length > 0) {
    score += Math.min(data.localKeywords.length * 5, 30);
  }

  // Geo tags (0-20)
  if (data.geoTags && data.geoTags.length > 0) {
    score += Math.min(data.geoTags.length * 5, 20);
  }

  return Math.min(Math.round(score), 100);
}

function analyzeSentiment(text: string, rating: number): {
  label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
  topics?: string[];
} {
  // Simple sentiment analysis based on rating
  let label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  let score: number;

  if (rating >= 4) {
    label = 'POSITIVE';
    score = 0.5 + (rating - 3) * 0.25; // 0.75 to 1.0
  } else if (rating >= 3) {
    label = 'NEUTRAL';
    score = 0;
  } else {
    label = 'NEGATIVE';
    score = -0.5 - (3 - rating) * 0.25; // -0.75 to -1.0
  }

  // Extract basic topics (simplified)
  const topics: string[] = [];
  const lowerText = text.toLowerCase();
  if (lowerText.includes('service')) topics.push('service');
  if (lowerText.includes('price') || lowerText.includes('cost')) topics.push('pricing');
  if (lowerText.includes('quality')) topics.push('quality');
  if (lowerText.includes('fast') || lowerText.includes('quick')) topics.push('speed');

  return { label, score, topics: topics.length > 0 ? topics : undefined };
}

async function updateGMBReviewMetrics(gmbId: string) {
  const reviews = await prisma.localReview.findMany({
    where: { gmbId },
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : undefined;

  await prisma.googleMyBusiness.update({
    where: { id: gmbId },
    data: {
      avgRating,
      reviewCount: reviews.length,
      updatedAt: new Date(),
    },
  });
}

function calculateAverageRating(gmbs: any[]): number | null {
  const allReviews = gmbs.flatMap(g => g.reviews);
  if (allReviews.length === 0) return null;

  return allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
}

function calculateOverallLocalSEOScore(data: {
  avgCompletionScore: number;
  verifiedBusinesses: number;
  totalBusinesses: number;
  top3Keywords: number;
  totalLocalKeywords: number;
  napConsistencyRate: number;
  avgRating: number | null;
  responseRate: number;
  avgContentScore: number;
}): number {
  let score = 0;

  // GMB Profile Score (0-25)
  score += data.avgCompletionScore * 0.25;

  // Verification Score (0-10)
  if (data.totalBusinesses > 0) {
    score += (data.verifiedBusinesses / data.totalBusinesses) * 10;
  }

  // Keyword Ranking Score (0-25)
  if (data.totalLocalKeywords > 0) {
    score += (data.top3Keywords / data.totalLocalKeywords) * 25;
  } else {
    score += 0;
  }

  // NAP Consistency Score (0-15)
  score += data.napConsistencyRate * 0.15;

  // Review Score (0-15)
  if (data.avgRating) {
    score += (data.avgRating / 5) * 10;
  }
  score += data.responseRate * 0.05;

  // Content Score (0-10)
  score += data.avgContentScore * 0.1;

  return Math.min(Math.round(score), 100);
}

export default {
  // GMB Management
  createGMBProfile,
  updateGMBProfile,
  verifyGMBProfile,
  optimizeGMBProfile,
  getGMBProfiles,
  getGMBProfile,

  // Keyword Management
  addLocalKeyword,
  trackKeywordRanking,
  getLocalKeywords,
  getTopRankingKeywords,

  // Citation Management
  addCitation,
  verifyCitation,
  claimCitation,
  getCitations,

  // Review Management
  addReview,
  respondToReview,
  getReviews,
  getReviewStats,

  // Content Management
  createLocalContent,
  trackLocalContentPerformance,
  getLocalContent,

  // Metrics & Analytics
  calculateLocalSEOMetrics,
  getLocalSEOStatistics,
};
