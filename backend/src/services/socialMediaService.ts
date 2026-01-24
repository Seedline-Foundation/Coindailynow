/**
 * Social Media & Community Engagement Service (Task 78)
 * 
 * Comprehensive social media management system with:
 * - Multi-platform account management (Twitter/X, LinkedIn, Telegram, YouTube, Instagram, TikTok)
 * - Content scheduling and automation
 * - Community group management (Telegram, Discord, WhatsApp, Reddit)
 * - Influencer collaboration tracking
 * - Engagement automation
 * - Analytics and performance tracking
 * - Campaign management
 * 
 * Target: 10K+ followers in 60 days, 5%+ daily engagement rate
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SocialMediaAccountInput {
  platform: string;
  accountHandle: string;
  displayName: string;
  profileUrl: string;
  accessToken?: string;
  refreshToken?: string;
}

interface SocialMediaPostInput {
  accountId: string;
  contentId?: string;
  postType: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledAt?: Date;
}

interface CommunityGroupInput {
  name: string;
  platform: string;
  groupId: string;
  groupUrl?: string;
  description?: string;
  region?: string;
  category?: string;
}

interface InfluencerInput {
  platform: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  followerCount: number;
  niche?: string;
  region?: string;
}

interface CampaignInput {
  name: string;
  description?: string;
  objective: string;
  platforms: string[];
  startDate: Date;
  endDate: Date;
  followerGoal?: number;
  engagementGoal?: number;
  reachGoal?: number;
}

interface AutomationInput {
  name: string;
  description?: string;
  automationType: string;
  platform: string;
  triggers: any;
  actions: any;
  filters?: any;
  responseTemplates?: any[];
}

// ============================================================================
// SOCIAL MEDIA ACCOUNT MANAGEMENT
// ============================================================================

export const createSocialMediaAccount = async (data: SocialMediaAccountInput) => {
  try {
    const account = await prisma.socialMediaAccount.create({
      data: {
        platform: data.platform,
        accountHandle: data.accountHandle,
        displayName: data.displayName ?? null,
        profileUrl: data.profileUrl ?? null,
        accessToken: data.accessToken ?? null,
        refreshToken: data.refreshToken ?? null,
        isActive: true,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        engagementRate: 0,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      account,
    };
  } catch (error: any) {
    console.error('Error creating social media account:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllSocialMediaAccounts = async (filters?: {
  platform?: string;
  isActive?: boolean;
}) => {
  try {
    const where: any = {};
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const accounts = await prisma.socialMediaAccount.findMany({
      where,
      include: {
        SocialMediaPosts: {
          take: 5,
          orderBy: { publishedAt: 'desc' },
        },
        _count: {
          select: {
            SocialMediaPosts: true,
            SocialSchedules: true,
          },
        },
      },
      orderBy: { followerCount: 'desc' },
    });

    return {
      success: true,
      accounts,
      total: accounts.length,
    };
  } catch (error: any) {
    console.error('Error fetching social media accounts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateAccountMetrics = async (
  accountId: string,
  metrics: {
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    engagementRate?: number;
    reachMetrics?: any;
    audienceData?: any;
  }
) => {
  try {
    const account = await prisma.socialMediaAccount.update({
      where: { id: accountId },
      data: {
        ...metrics,
        reachMetrics: metrics.reachMetrics ? JSON.stringify(metrics.reachMetrics) : null,
        audienceData: metrics.audienceData ? JSON.stringify(metrics.audienceData) : null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      account,
    };
  } catch (error: any) {
    console.error('Error updating account metrics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// SOCIAL MEDIA POST MANAGEMENT
// ============================================================================

export const createSocialMediaPost = async (data: SocialMediaPostInput) => {
  try {
    const post = await prisma.socialMediaPost.create({
      data: {
        accountId: data.accountId,
        contentId: data.contentId ?? null,
        postType: data.postType,
        platform: data.platform,
        content: data.content ?? null,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        hashtags: data.hashtags ? JSON.stringify(data.hashtags) : null,
        mentions: data.mentions ? JSON.stringify(data.mentions) : null,
        scheduledAt: data.scheduledAt ?? null,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        updatedAt: new Date(),
      },
      include: {
        Account: true,
      },
    });

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    console.error('Error creating social media post:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllSocialMediaPosts = async (filters?: {
  accountId?: string;
  platform?: string;
  status?: string;
  limit?: number;
}) => {
  try {
    const where: any = {};
    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.status) where.status = filters.status;

    const posts = await prisma.socialMediaPost.findMany({
      where,
      include: {
        Account: true,
        _count: {
          select: {
            Engagements: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });

    return {
      success: true,
      posts,
      total: posts.length,
    };
  } catch (error: any) {
    console.error('Error fetching social media posts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updatePostMetrics = async (
  postId: string,
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    clicks?: number;
    reachCount?: number;
  }
) => {
  try {
    // Calculate engagement rate
    const engagementRate = metrics.impressions
      ? ((metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0)) / metrics.impressions * 100
      : 0;

    // Calculate performance score (0-100)
    const performanceScore = Math.min(100, 
      (engagementRate * 30) + 
      ((metrics.clicks || 0) / Math.max(1, metrics.impressions || 1) * 100 * 30) +
      ((metrics.shares || 0) / Math.max(1, metrics.impressions || 1) * 100 * 40)
    );

    const post = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        ...metrics,
        engagementRate,
        performanceScore,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    console.error('Error updating post metrics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const publishScheduledPosts = async () => {
  try {
    const now = new Date();
    const scheduledPosts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        Account: true,
      },
    });

    const results = [];
    for (const post of scheduledPosts) {
      // Here you would integrate with actual social media APIs
      // For now, we'll mark them as published
      const updated = await prisma.socialMediaPost.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          updatedAt: now,
        },
      });
      results.push(updated);
    }

    return {
      success: true,
      published: results.length,
      posts: results,
    };
  } catch (error: any) {
    console.error('Error publishing scheduled posts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// COMMUNITY GROUP MANAGEMENT
// ============================================================================

export const createCommunityGroup = async (data: CommunityGroupInput) => {
  try {
    const group = await prisma.communityGroup.create({
      data: {
        name: data.name,
        platform: data.platform,
        groupId: data.groupId,
        groupUrl: data.groupUrl ?? null,
        description: data.description ?? null,
        region: data.region ?? null,
        category: data.category ?? null,
        memberCount: 0,
        isActive: true,
        engagementScore: 0,
        influenceScore: 0,
        moderatorStatus: 'NONE',
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      group,
    };
  } catch (error: any) {
    console.error('Error creating community group:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllCommunityGroups = async (filters?: {
  platform?: string;
  region?: string;
  isActive?: boolean;
}) => {
  try {
    const where: any = {};
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.region) where.region = filters.region;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const groups = await prisma.communityGroup.findMany({
      where,
      include: {
        _count: {
          select: {
            Activities: true,
            Influencers: true,
          },
        },
      },
      orderBy: { memberCount: 'desc' },
    });

    return {
      success: true,
      groups,
      total: groups.length,
    };
  } catch (error: any) {
    console.error('Error fetching community groups:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const trackCommunityActivity = async (
  groupId: string,
  activity: {
    activityType: string;
    userId?: string;
    username?: string;
    content?: string;
    sentiment?: number;
    engagement?: number;
    isInfluential?: boolean;
    topicTags?: string[];
    mentionedCoins?: string[];
  }
) => {
  try {
    const activityRecord = await prisma.communityActivity.create({
      data: {
        groupId,
        activityType: activity.activityType,
        userId: activity.userId ?? null,
        username: activity.username ?? null,
        content: activity.content ?? null,
        sentiment: activity.sentiment ?? null,
        engagement: activity.engagement || 0,
        isInfluential: activity.isInfluential || false,
        topicTags: activity.topicTags ? JSON.stringify(activity.topicTags) : null,
        mentionedCoins: activity.mentionedCoins ? JSON.stringify(activity.mentionedCoins) : null,
        activityAt: new Date(),
      },
    });

    // Update group's last activity
    await prisma.communityGroup.update({
      where: { id: groupId },
      data: {
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      activity: activityRecord,
    };
  } catch (error: any) {
    console.error('Error tracking community activity:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// INFLUENCER MANAGEMENT
// ============================================================================

export const createInfluencer = async (data: InfluencerInput) => {
  try {
    const influencer = await prisma.communityInfluencer.create({
      data: {
        platform: data.platform,
        username: data.username ?? null,
        displayName: data.displayName ?? null,
        profileUrl: data.profileUrl ?? null,
        followerCount: data.followerCount,
        influenceScore: calculateInfluenceScore(data.followerCount, 0),
        engagementRate: 0,
        niche: data.niche ?? null,
        region: data.region ?? null,
        isPartner: false,
        partnershipStatus: 'NONE',
        contentCoCreated: 0,
        totalReach: 0,
        totalEngagement: 0,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      influencer,
    };
  } catch (error: any) {
    console.error('Error creating influencer:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllInfluencers = async (filters?: {
  platform?: string;
  region?: string;
  isPartner?: boolean;
  minInfluenceScore?: number;
}) => {
  try {
    const where: any = {};
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.region) where.region = filters.region;
    if (filters?.isPartner !== undefined) where.isPartner = filters.isPartner;
    if (filters?.minInfluenceScore) {
      where.influenceScore = { gte: filters.minInfluenceScore };
    }

    const influencers = await prisma.communityInfluencer.findMany({
      where,
      include: {
        _count: {
          select: {
            Collaborations: true,
          },
        },
      },
      orderBy: { influenceScore: 'desc' },
    });

    return {
      success: true,
      influencers,
      total: influencers.length,
    };
  } catch (error: any) {
    console.error('Error fetching influencers:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const createInfluencerCollaboration = async (
  influencerId: string,
  data: {
    contentId?: string;
    collaborationType: string;
    proposalDetails?: any;
  }
) => {
  try {
    const collaboration = await prisma.influencerCollaboration.create({
      data: {
        influencerId,
        contentId: data.contentId ?? null,
        collaborationType: data.collaborationType,
        status: 'PROPOSED',
        proposalDetails: data.proposalDetails ? JSON.stringify(data.proposalDetails) : null,
        proposedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Influencer: true,
      },
    });

    return {
      success: true,
      collaboration,
    };
  } catch (error: any) {
    console.error('Error creating collaboration:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateCollaborationStatus = async (
  collaborationId: string,
  status: string,
  metrics?: {
    reachGenerated?: number;
    engagementGenerated?: number;
    conversions?: number;
    deliverables?: any;
  }
) => {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'ACCEPTED') {
      updateData.acceptedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (metrics) {
        updateData.reachGenerated = metrics.reachGenerated;
        updateData.engagementGenerated = metrics.engagementGenerated;
        updateData.conversions = metrics.conversions;
        updateData.deliverables = metrics.deliverables ? JSON.stringify(metrics.deliverables) : null;
        
        // Calculate ROI and performance score
        if (metrics.conversions && metrics.reachGenerated) {
          updateData.roi = (metrics.conversions / metrics.reachGenerated) * 100;
        }
        updateData.performanceScore = calculateCollaborationScore(metrics);
      }
    }

    const collaboration = await prisma.influencerCollaboration.update({
      where: { id: collaborationId },
      data: updateData,
      include: {
        Influencer: true,
      },
    });

    // Update influencer stats if collaboration completed
    if (status === 'COMPLETED' && metrics) {
      await prisma.communityInfluencer.update({
        where: { id: collaboration.influencerId },
        data: {
          contentCoCreated: { increment: 1 },
          totalReach: { increment: metrics.reachGenerated || 0 },
          totalEngagement: { increment: metrics.engagementGenerated || 0 },
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      collaboration,
    };
  } catch (error: any) {
    console.error('Error updating collaboration status:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

export const createSocialMediaCampaign = async (data: CampaignInput) => {
  try {
    const campaign = await prisma.socialMediaCampaign.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        objective: data.objective,
        platforms: JSON.stringify(data.platforms),
        startDate: data.startDate,
        endDate: data.endDate,
        followerGoal: data.followerGoal ?? null,
        engagementGoal: data.engagementGoal ?? null,
        reachGoal: data.reachGoal ?? null,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      campaign,
    };
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllCampaigns = async (filters?: {
  status?: string;
}) => {
  try {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    const campaigns = await prisma.socialMediaCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      campaigns,
      total: campaigns.length,
    };
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateCampaignMetrics = async (
  campaignId: string,
  metrics: {
    followersGained?: number;
    totalEngagements?: number;
    totalReach?: number;
    totalConversions?: number;
  }
) => {
  try {
    const campaign = await prisma.socialMediaCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Calculate average engagement rate
    const avgEngagementRate = metrics.totalReach
      ? ((metrics.totalEngagements || 0) / metrics.totalReach) * 100
      : campaign.avgEngagementRate;

    // Calculate performance score
    let performanceScore = 0;
    let goalsMet = 0;
    let totalGoals = 0;

    if (campaign.followerGoal) {
      totalGoals++;
      const followerProgress = ((metrics.followersGained || 0) / campaign.followerGoal) * 100;
      if (followerProgress >= 100) goalsMet++;
      performanceScore += Math.min(100, followerProgress);
    }

    if (campaign.engagementGoal) {
      totalGoals++;
      const engagementProgress = (avgEngagementRate / campaign.engagementGoal) * 100;
      if (engagementProgress >= 100) goalsMet++;
      performanceScore += Math.min(100, engagementProgress);
    }

    if (campaign.reachGoal) {
      totalGoals++;
      const reachProgress = ((metrics.totalReach || 0) / campaign.reachGoal) * 100;
      if (reachProgress >= 100) goalsMet++;
      performanceScore += Math.min(100, reachProgress);
    }

    performanceScore = totalGoals > 0 ? performanceScore / totalGoals : 0;

    const updated = await prisma.socialMediaCampaign.update({
      where: { id: campaignId },
      data: {
        followersGained: metrics.followersGained ?? 0,
        totalEngagements: metrics.totalEngagements ?? 0,
        totalReach: metrics.totalReach ?? 0,
        totalConversions: metrics.totalConversions ?? 0,
        avgEngagementRate,
        performanceScore,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      campaign: updated,
      goalsProgress: {
        totalGoals,
        goalsMet,
        progressPercentage: totalGoals > 0 ? (goalsMet / totalGoals) * 100 : 0,
      },
    };
  } catch (error: any) {
    console.error('Error updating campaign metrics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// ENGAGEMENT AUTOMATION
// ============================================================================

export const createEngagementAutomation = async (data: AutomationInput) => {
  try {
    const automation = await prisma.engagementAutomation.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        automationType: data.automationType,
        platform: data.platform,
        triggers: JSON.stringify(data.triggers),
        actions: JSON.stringify(data.actions),
        filters: data.filters ? JSON.stringify(data.filters) : null,
        responseTemplates: data.responseTemplates ? JSON.stringify(data.responseTemplates) : null,
        isActive: true,
        priority: 5,
        dailyLimit: 100,
        dailyUsed: 0,
        lastResetAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      automation,
    };
  } catch (error: any) {
    console.error('Error creating automation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAllAutomations = async (filters?: {
  platform?: string;
  isActive?: boolean;
}) => {
  try {
    const where: any = {};
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const automations = await prisma.engagementAutomation.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      automations,
      total: automations.length,
    };
  } catch (error: any) {
    console.error('Error fetching automations:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const executeAutomation = async (automationId: string) => {
  try {
    const automation = await prisma.engagementAutomation.findUnique({
      where: { id: automationId },
    });

    if (!automation || !automation.isActive) {
      return { success: false, error: 'Automation not found or inactive' };
    }

    // Check daily limit
    if (automation.dailyUsed >= automation.dailyLimit) {
      return { success: false, error: 'Daily limit reached' };
    }

    // Here you would execute the actual automation logic
    // For now, we'll just increment the counters

    const updated = await prisma.engagementAutomation.update({
      where: { id: automationId },
      data: {
        totalTriggers: { increment: 1 },
        totalActions: { increment: 1 },
        dailyUsed: { increment: 1 },
        successRate: automation.totalTriggers > 0 
          ? ((automation.totalActions + 1) / (automation.totalTriggers + 1)) * 100
          : 100,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      automation: updated,
      executed: true,
    };
  } catch (error: any) {
    console.error('Error executing automation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// ANALYTICS & STATISTICS
// ============================================================================

export const recordDailyAnalytics = async (platform: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get account stats
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform, isActive: true },
      include: {
        SocialMediaPosts: {
          where: {
            publishedAt: {
              gte: today,
            },
          },
        },
      },
    });

    if (!account) {
      return { success: false, error: 'No active account found for platform' };
    }

    // Calculate metrics
    const posts = account.SocialMediaPosts;
    const totalLikes = posts.reduce((sum: number, p: any) => sum + p.likes, 0);
    const totalComments = posts.reduce((sum: number, p: any) => sum + p.comments, 0);
    const totalShares = posts.reduce((sum: number, p: any) => sum + p.shares, 0);
    const totalImpressions = posts.reduce((sum: number, p: any) => sum + p.impressions, 0);
    const totalClicks = posts.reduce((sum: number, p: any) => sum + p.clicks, 0);
    const totalReach = posts.reduce((sum: number, p: any) => sum + p.reachCount, 0);

    const analytics = await prisma.socialMediaAnalytics.create({
      data: {
        platform,
        metricType: 'DAILY',
        metricDate: today,
        followerCount: account.followerCount,
        followerGrowth: 0, // Would calculate from previous day
        followingCount: account.followingCount,
        postsPublished: posts.length,
        totalLikes,
        totalComments,
        totalShares,
        totalImpressions,
        totalClicks,
        totalReach,
        engagementRate: account.engagementRate,
        avgEngagementPerPost: posts.length > 0 
          ? (totalLikes + totalComments + totalShares) / posts.length 
          : 0,
      },
    });

    return {
      success: true,
      analytics,
    };
  } catch (error: any) {
    console.error('Error recording analytics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getSocialMediaStatistics = async () => {
  try {
    // Get overall statistics
    const [
      totalAccounts,
      totalPosts,
      totalCommunityGroups,
      totalInfluencers,
      totalCampaigns,
      activeAutomations,
    ] = await Promise.all([
      prisma.socialMediaAccount.count({ where: { isActive: true } }),
      prisma.socialMediaPost.count(),
      prisma.communityGroup.count({ where: { isActive: true } }),
      prisma.communityInfluencer.count(),
      prisma.socialMediaCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.engagementAutomation.count({ where: { isActive: true } }),
    ]);

    // Get total followers across all platforms
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { isActive: true },
    });
    const totalFollowers = accounts.reduce((sum: number, acc: any) => sum + acc.followerCount, 0);
    const avgEngagementRate = accounts.length > 0
      ? accounts.reduce((sum: number, acc: any) => sum + acc.engagementRate, 0) / accounts.length
      : 0;

    // Get recent posts performance
    const recentPosts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const totalEngagements = recentPosts.reduce(
      (sum: number, p: any) => sum + p.likes + p.comments + p.shares,
      0
    );
    const totalReach = recentPosts.reduce((sum: number, p: any) => sum + p.reachCount, 0);

    // Get top performing posts
    const topPosts = await prisma.socialMediaPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { performanceScore: 'desc' },
      take: 10,
      include: {
        Account: {
          select: {
            platform: true,
            accountHandle: true,
          },
        },
      },
    });

    // Get influencer partnerships
    const partnerInfluencers = await prisma.communityInfluencer.count({
      where: { isPartner: true },
    });

    const activeCollaborations = await prisma.influencerCollaboration.count({
      where: { status: { in: ['ACCEPTED', 'IN_PROGRESS'] } },
    });

    // Get community stats
    const communityGroups = await prisma.communityGroup.findMany({
      where: { isActive: true },
    });
    const totalCommunityMembers = communityGroups.reduce(
      (sum: number, g: any) => sum + g.memberCount,
      0
    );

    return {
      success: true,
      statistics: {
        overview: {
          totalAccounts,
          totalPosts,
          totalFollowers,
          avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
          totalCommunityGroups,
          totalCommunityMembers,
          totalInfluencers,
          partnerInfluencers,
          activeCollaborations,
          totalCampaigns,
          activeAutomations,
        },
        recentPerformance: {
          period: '7 days',
          postsPublished: recentPosts.length,
          totalEngagements,
          totalReach,
          avgEngagementPerPost: recentPosts.length > 0 
            ? Math.round(totalEngagements / recentPosts.length)
            : 0,
        },
        topPosts: topPosts.map((post: any) => ({
          id: post.id,
          platform: post.platform,
          accountHandle: post.Account.accountHandle,
          content: post.content.substring(0, 100) + '...',
          performanceScore: post.performanceScore,
          engagementRate: post.engagementRate,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          impressions: post.impressions,
          publishedAt: post.publishedAt,
        })),
        platformBreakdown: accounts.map((acc: any) => ({
          platform: acc.platform,
          accountHandle: acc.accountHandle,
          followers: acc.followerCount,
          engagementRate: acc.engagementRate,
          postCount: acc.postCount,
        })),
      },
    };
  } catch (error: any) {
    console.error('Error fetching social media statistics:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateInfluenceScore(followerCount: number, engagementRate: number): number {
  // Influence score calculation (0-100)
  // 60% based on followers, 40% based on engagement
  const followerScore = Math.min(100, (followerCount / 100000) * 60); // Max at 100k followers
  const engagementScore = Math.min(40, engagementRate * 4); // Max at 10% engagement
  return Math.min(100, followerScore + engagementScore);
}

function calculateCollaborationScore(metrics: any): number {
  // Performance score based on reach, engagement, and conversions
  const reachScore = Math.min(40, (metrics.reachGenerated || 0) / 1000 * 40); // Max at 1M reach
  const engagementScore = Math.min(30, (metrics.engagementGenerated || 0) / 100 * 30); // Max at 10k engagements
  const conversionScore = Math.min(30, (metrics.conversions || 0) / 10 * 30); // Max at 1k conversions
  return Math.min(100, reachScore + engagementScore + conversionScore);
}

export default {
  // Accounts
  createSocialMediaAccount,
  getAllSocialMediaAccounts,
  updateAccountMetrics,
  
  // Posts
  createSocialMediaPost,
  getAllSocialMediaPosts,
  updatePostMetrics,
  publishScheduledPosts,
  
  // Community
  createCommunityGroup,
  getAllCommunityGroups,
  trackCommunityActivity,
  
  // Influencers
  createInfluencer,
  getAllInfluencers,
  createInfluencerCollaboration,
  updateCollaborationStatus,
  
  // Campaigns
  createSocialMediaCampaign,
  getAllCampaigns,
  updateCampaignMetrics,
  
  // Automation
  createEngagementAutomation,
  getAllAutomations,
  executeAutomation,
  
  // Analytics
  recordDailyAnalytics,
  getSocialMediaStatistics,
};
