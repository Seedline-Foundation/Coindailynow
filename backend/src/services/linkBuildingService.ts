/**
 * Link Building & Authority Development Service (Task 77)
 * Handles backlink tracking, influencer partnerships, campaign management,
 * and authority development for SEO success
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BacklinkInput {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText?: string;
  linkType: string;
  context?: string;
  discoveryMethod: string;
  domainAuthority?: number;
  pageAuthority?: number;
  trustFlow?: number;
  citationFlow?: number;
  spamScore?: number;
  region?: string;
  category?: string;
  campaignId?: string;
}

interface CampaignInput {
  name: string;
  campaignType: string;
  region?: string;
  targetBacklinks?: number;
  targetDomainAuth?: number;
  budget?: number;
  startDate: Date;
  endDate?: Date;
  description?: string;
  goals?: any;
  strategy?: any;
  priority?: string;
  createdBy?: string;
  assignedTo?: string;
}

interface ProspectInput {
  url: string;
  domain: string;
  contactName?: string;
  contactEmail?: string;
  prospectType: string;
  region?: string;
  category?: string;
  domainAuthority?: number;
  trafficEstimate?: number;
  priority?: string;
  campaignId?: string;
}

interface OutreachInput {
  prospectId: string;
  campaignId?: string;
  activityType: string;
  channel?: string;
  subject?: string;
  message?: string;
  sentBy?: string;
  followUpDate?: Date;
}

interface InfluencerInput {
  influencerName: string;
  platform: string;
  handle: string;
  profileUrl: string;
  email?: string;
  region?: string;
  category?: string;
  followerCount?: number;
  engagementRate?: number;
  partnershipType: string;
  budget?: number;
}

class LinkBuildingService {
  
  // ============================================
  // BACKLINK TRACKING
  // ============================================

  /**
   * Add a new backlink
   */
  async addBacklink(data: BacklinkInput) {
    const qualityScore = this.calculateBacklinkQuality({
      domainAuthority: data.domainAuthority || 0,
      pageAuthority: data.pageAuthority || 0,
      trustFlow: data.trustFlow || 0,
      citationFlow: data.citationFlow || 0,
      spamScore: data.spamScore || 0,
      linkType: data.linkType,
    });

    const backlink = await prisma.backlink.create({
      data: {
        ...data,
        domainAuthority: data.domainAuthority || 0,
        pageAuthority: data.pageAuthority || 0,
        trustFlow: data.trustFlow || 0,
        citationFlow: data.citationFlow || 0,
        spamScore: data.spamScore || 0,
        qualityScore,
        isVerified: false,
        firstSeenAt: new Date(),
        lastCheckedAt: new Date(),
      },
    });

    // Update campaign statistics if linked
    if (data.campaignId) {
      await this.updateCampaignStats(data.campaignId);
    }

    return backlink;
  }

  /**
   * Calculate backlink quality score (0-100)
   */
  private calculateBacklinkQuality(metrics: {
    domainAuthority: number;
    pageAuthority: number;
    trustFlow: number;
    citationFlow: number;
    spamScore: number;
    linkType: string;
  }): number {
    let score = 0;

    // Domain authority (30%)
    score += (metrics.domainAuthority / 100) * 30;

    // Page authority (20%)
    score += (metrics.pageAuthority / 100) * 20;

    // Trust flow (20%)
    score += (metrics.trustFlow / 100) * 20;

    // Citation flow (15%)
    score += (metrics.citationFlow / 100) * 15;

    // Spam score penalty (15%)
    score += Math.max(0, 15 - (metrics.spamScore / 100) * 15);

    // Link type bonus
    if (metrics.linkType === 'DOFOLLOW') {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Get all backlinks with filtering
   */
  async getBacklinks(filters?: {
    status?: string;
    region?: string;
    campaignId?: string;
    minQuality?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.region) where.region = filters.region;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.minQuality) {
      where.qualityScore = { gte: filters.minQuality };
    }

    return await prisma.backlink.findMany({
      where,
      orderBy: { firstSeenAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        Campaign: true,
      },
    });
  }

  /**
   * Update backlink status
   */
  async updateBacklinkStatus(backlinkId: string, status: string) {
    const backlink = await prisma.backlink.update({
      where: { id: backlinkId },
      data: {
        status,
        lastCheckedAt: new Date(),
        removedAt: status === 'REMOVED' ? new Date() : undefined,
      },
    });

    // Update campaign stats if linked
    if (backlink.campaignId) {
      await this.updateCampaignStats(backlink.campaignId);
    }

    return backlink;
  }

  /**
   * Verify a backlink
   */
  async verifyBacklink(backlinkId: string) {
    return await prisma.backlink.update({
      where: { id: backlinkId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
      },
    });
  }

  // ============================================
  // CAMPAIGN MANAGEMENT
  // ============================================

  /**
   * Create a new link building campaign
   */
  async createCampaign(data: CampaignInput) {
    return await prisma.linkBuildingCampaign.create({
      data: {
        ...data,
        goals: data.goals ? JSON.stringify(data.goals) : undefined,
        strategy: data.strategy ? JSON.stringify(data.strategy) : undefined,
        targetBacklinks: data.targetBacklinks || 50,
        targetDomainAuth: data.targetDomainAuth || 40,
        region: data.region || 'GLOBAL',
        priority: data.priority || 'MEDIUM',
        status: 'PLANNING',
        backlinksAcquired: 0,
        totalReach: 0,
        avgDomainAuthority: 0,
        successRate: 0,
        spent: 0,
      },
    });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(filters?: {
    status?: string;
    campaignType?: string;
    region?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.campaignType) where.campaignType = filters.campaignType;
    if (filters?.region) where.region = filters.region;

    return await prisma.linkBuildingCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Backlinks: true,
        Prospects: true,
        Outreach: true,
      },
    });
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string) {
    return await prisma.linkBuildingCampaign.findUnique({
      where: { id: campaignId },
      include: {
        Backlinks: {
          orderBy: { firstSeenAt: 'desc' },
        },
        Prospects: {
          orderBy: { createdAt: 'desc' },
        },
        Outreach: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: string) {
    return await prisma.linkBuildingCampaign.update({
      where: { id: campaignId },
      data: { status },
    });
  }

  /**
   * Update campaign statistics
   */
  async updateCampaignStats(campaignId: string) {
    const backlinks = await prisma.backlink.findMany({
      where: {
        campaignId,
        status: 'ACTIVE',
      },
    });

    const backlinksAcquired = backlinks.length;
    const avgDomainAuthority =
      backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / (backlinksAcquired || 1);

    const campaign = await prisma.linkBuildingCampaign.findUnique({
      where: { id: campaignId },
    });

    const successRate = campaign?.targetBacklinks
      ? backlinksAcquired / campaign.targetBacklinks
      : 0;

    return await prisma.linkBuildingCampaign.update({
      where: { id: campaignId },
      data: {
        backlinksAcquired,
        avgDomainAuthority,
        successRate,
      },
    });
  }

  // ============================================
  // PROSPECT MANAGEMENT
  // ============================================

  /**
   * Add a new link prospect
   */
  async addProspect(data: ProspectInput) {
    const linkPotential = this.calculateLinkPotential({
      domainAuthority: data.domainAuthority || 0,
      trafficEstimate: data.trafficEstimate || 0,
      prospectType: data.prospectType,
    });

    const qualityScore = this.calculateProspectQuality({
      domainAuthority: data.domainAuthority || 0,
      trafficEstimate: data.trafficEstimate || 0,
    });

    return await prisma.linkProspect.create({
      data: {
        ...data,
        domainAuthority: data.domainAuthority || 0,
        trafficEstimate: data.trafficEstimate || 0,
        linkPotential,
        qualityScore,
        status: 'NEW',
        relationshipStrength: 'COLD',
        priority: data.priority || 'MEDIUM',
      },
    });
  }

  /**
   * Calculate link potential score (0-100)
   */
  private calculateLinkPotential(metrics: {
    domainAuthority: number;
    trafficEstimate: number;
    prospectType: string;
  }): number {
    let score = 0;

    // Domain authority (40%)
    score += (metrics.domainAuthority / 100) * 40;

    // Traffic potential (30%)
    const trafficScore = Math.min(metrics.trafficEstimate / 100000, 1);
    score += trafficScore * 30;

    // Prospect type bonus (30%)
    const typeBonus: Record<string, number> = {
      INFLUENCER: 30,
      PUBLICATION: 25,
      RESOURCE_PAGE: 20,
      DIRECTORY: 15,
      PARTNER: 28,
    };
    score += typeBonus[metrics.prospectType] || 15;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate prospect quality score (0-100)
   */
  private calculateProspectQuality(metrics: {
    domainAuthority: number;
    trafficEstimate: number;
  }): number {
    let score = 0;

    // Domain authority (60%)
    score += (metrics.domainAuthority / 100) * 60;

    // Traffic estimate (40%)
    const trafficScore = Math.min(metrics.trafficEstimate / 100000, 1);
    score += trafficScore * 40;

    return Math.min(100, Math.round(score));
  }

  /**
   * Get all prospects
   */
  async getProspects(filters?: {
    status?: string;
    prospectType?: string;
    region?: string;
    campaignId?: string;
  }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.prospectType) where.prospectType = filters.prospectType;
    if (filters?.region) where.region = filters.region;
    if (filters?.campaignId) where.campaignId = filters.campaignId;

    return await prisma.linkProspect.findMany({
      where,
      orderBy: { linkPotential: 'desc' },
      include: {
        Campaign: true,
        Outreach: {
          orderBy: { sentAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Update prospect status
   */
  async updateProspectStatus(
    prospectId: string,
    status: string,
    relationshipStrength?: string
  ) {
    return await prisma.linkProspect.update({
      where: { id: prospectId },
      data: {
        status,
        relationshipStrength: relationshipStrength || undefined,
      },
    });
  }

  // ============================================
  // OUTREACH MANAGEMENT
  // ============================================

  /**
   * Create outreach activity
   */
  async createOutreach(data: OutreachInput) {
    const outreach = await prisma.outreachActivity.create({
      data: {
        ...data,
        status: 'PENDING',
        followUpCount: 0,
      },
    });

    // Update prospect last contacted
    await prisma.linkProspect.update({
      where: { id: data.prospectId },
      data: { lastContactedAt: new Date() },
    });

    return outreach;
  }

  /**
   * Update outreach status
   */
  async updateOutreachStatus(
    outreachId: string,
    status: string,
    response?: string,
    outcome?: string
  ) {
    const data: any = { status };

    if (response) {
      data.response = response;
      data.respondedAt = new Date();
    }

    if (outcome) {
      data.outcome = outcome;
    }

    return await prisma.outreachActivity.update({
      where: { id: outreachId },
      data,
    });
  }

  /**
   * Send outreach message
   */
  async sendOutreach(outreachId: string) {
    return await prisma.outreachActivity.update({
      where: { id: outreachId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Get outreach activities
   */
  async getOutreachActivities(filters?: {
    prospectId?: string;
    campaignId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters?.prospectId) where.prospectId = filters.prospectId;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.status) where.status = filters.status;

    return await prisma.outreachActivity.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      include: {
        Prospect: true,
        Campaign: true,
      },
    });
  }

  // ============================================
  // INFLUENCER PARTNERSHIPS
  // ============================================

  /**
   * Add influencer partnership
   */
  async addInfluencer(data: InfluencerInput) {
    return await prisma.influencerPartnership.create({
      data: {
        ...data,
        followerCount: data.followerCount || 0,
        engagementRate: data.engagementRate || 0,
        status: 'PROSPECT',
        relationshipLevel: 'COLD',
        backlinksGenerated: 0,
        mentionsCount: 0,
        trafficGenerated: 0,
        conversions: 0,
        roi: 0,
        performanceScore: 0,
        spent: 0,
      },
    });
  }

  /**
   * Get all influencers
   */
  async getInfluencers(filters?: {
    platform?: string;
    region?: string;
    status?: string;
    minFollowers?: number;
  }) {
    const where: any = {};

    if (filters?.platform) where.platform = filters.platform;
    if (filters?.region) where.region = filters.region;
    if (filters?.status) where.status = filters.status;
    if (filters?.minFollowers) {
      where.followerCount = { gte: filters.minFollowers };
    }

    return await prisma.influencerPartnership.findMany({
      where,
      orderBy: { performanceScore: 'desc' },
    });
  }

  /**
   * Update influencer partnership status
   */
  async updateInfluencerStatus(influencerId: string, status: string) {
    return await prisma.influencerPartnership.update({
      where: { id: influencerId },
      data: { status },
    });
  }

  /**
   * Update influencer performance
   */
  async updateInfluencerPerformance(
    influencerId: string,
    metrics: {
      backlinksGenerated?: number;
      mentionsCount?: number;
      trafficGenerated?: number;
      conversions?: number;
      spent?: number;
    }
  ) {
    const influencer = await prisma.influencerPartnership.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) throw new Error('Influencer not found');

    const roi =
      metrics.spent && metrics.spent > 0
        ? ((metrics.trafficGenerated || 0) * 0.01) / metrics.spent
        : 0;

    const performanceScore = this.calculateInfluencerPerformance({
      backlinksGenerated: metrics.backlinksGenerated || influencer.backlinksGenerated,
      mentionsCount: metrics.mentionsCount || influencer.mentionsCount,
      trafficGenerated: metrics.trafficGenerated || influencer.trafficGenerated,
      conversions: metrics.conversions || influencer.conversions,
      roi,
    });

    return await prisma.influencerPartnership.update({
      where: { id: influencerId },
      data: {
        ...metrics,
        roi,
        performanceScore,
        lastCollaboration: new Date(),
      },
    });
  }

  /**
   * Calculate influencer performance score (0-100)
   */
  private calculateInfluencerPerformance(metrics: {
    backlinksGenerated: number;
    mentionsCount: number;
    trafficGenerated: number;
    conversions: number;
    roi: number;
  }): number {
    let score = 0;

    // Backlinks (20%)
    score += Math.min((metrics.backlinksGenerated / 10) * 20, 20);

    // Mentions (15%)
    score += Math.min((metrics.mentionsCount / 20) * 15, 15);

    // Traffic (25%)
    score += Math.min((metrics.trafficGenerated / 10000) * 25, 25);

    // Conversions (20%)
    score += Math.min((metrics.conversions / 100) * 20, 20);

    // ROI (20%)
    score += Math.min(metrics.roi * 20, 20);

    return Math.min(100, Math.round(score));
  }

  // ============================================
  // LINK VELOCITY MONITORING
  // ============================================

  /**
   * Track link velocity metrics
   */
  async trackLinkVelocity(period: string = 'DAILY') {
    const now = new Date();
    const startDate = this.getPeriodStartDate(period);

    // Get new backlinks in period
    const newBacklinks = await prisma.backlink.count({
      where: {
        firstSeenAt: { gte: startDate },
        status: 'ACTIVE',
      },
    });

    // Get lost backlinks in period
    const lostBacklinks = await prisma.backlink.count({
      where: {
        removedAt: { gte: startDate },
        status: 'REMOVED',
      },
    });

    // Get all active backlinks
    const activeBacklinks = await prisma.backlink.findMany({
      where: { status: 'ACTIVE' },
    });

    const totalActiveBacklinks = activeBacklinks.length;
    const avgDomainAuthority =
      activeBacklinks.reduce((sum, b) => sum + b.domainAuthority, 0) /
      (totalActiveBacklinks || 1);
    const avgQualityScore =
      activeBacklinks.reduce((sum, b) => sum + b.qualityScore, 0) /
      (totalActiveBacklinks || 1);

    const dofollowCount = activeBacklinks.filter((b) => b.linkType === 'DOFOLLOW').length;
    const nofollowCount = activeBacklinks.filter((b) => b.linkType === 'NOFOLLOW').length;

    const netChange = newBacklinks - lostBacklinks;

    // Calculate velocity score
    const velocityScore = this.calculateVelocityScore({
      newBacklinks,
      lostBacklinks,
      netChange,
      avgQualityScore,
      dofollowCount,
      totalActiveBacklinks,
    });

    // Determine trend
    const velocityTrend = this.determineVelocityTrend({
      netChange,
      newBacklinks,
      lostBacklinks,
      velocityScore,
    });

    return await prisma.linkVelocityMetric.create({
      data: {
        metricDate: now,
        period,
        newBacklinks,
        lostBacklinks,
        netChange,
        totalActiveBacklinks,
        avgDomainAuthority,
        avgQualityScore,
        dofollowCount,
        nofollowCount,
        velocityScore,
        velocityTrend,
      },
    });
  }

  /**
   * Calculate velocity health score (0-100)
   */
  private calculateVelocityScore(metrics: {
    newBacklinks: number;
    lostBacklinks: number;
    netChange: number;
    avgQualityScore: number;
    dofollowCount: number;
    totalActiveBacklinks: number;
  }): number {
    let score = 0;

    // Positive net change (30%)
    if (metrics.netChange > 0) {
      score += Math.min((metrics.netChange / 10) * 30, 30);
    }

    // New backlinks acquisition (20%)
    score += Math.min((metrics.newBacklinks / 20) * 20, 20);

    // Low backlink loss (20%)
    score += Math.max(0, 20 - (metrics.lostBacklinks / 10) * 20);

    // Quality score (15%)
    score += (metrics.avgQualityScore / 100) * 15;

    // Dofollow ratio (15%)
    const dofollowRatio =
      metrics.totalActiveBacklinks > 0
        ? metrics.dofollowCount / metrics.totalActiveBacklinks
        : 0;
    score += dofollowRatio * 15;

    return Math.min(100, Math.round(score));
  }

  /**
   * Determine velocity trend
   */
  private determineVelocityTrend(metrics: {
    netChange: number;
    newBacklinks: number;
    lostBacklinks: number;
    velocityScore: number;
  }): string {
    if (metrics.velocityScore < 40) return 'CONCERNING';
    if (metrics.netChange < -5) return 'DECLINING';
    if (metrics.netChange > 10) return 'GROWING';
    return 'STABLE';
  }

  /**
   * Get link velocity metrics
   */
  async getLinkVelocityMetrics(period: string, limit: number = 30) {
    return await prisma.linkVelocityMetric.findMany({
      where: { period },
      orderBy: { metricDate: 'desc' },
      take: limit,
    });
  }

  // ============================================
  // AUTHORITY METRICS
  // ============================================

  /**
   * Track authority development metrics
   */
  async trackAuthorityMetrics(metrics: {
    domainAuthority?: number;
    domainRating?: number;
    trustFlow?: number;
    citationFlow?: number;
    organicKeywords?: number;
    organicTraffic?: number;
    referringDomains?: number;
    totalBacklinks?: number;
  }) {
    const totalBacklinks =
      metrics.totalBacklinks ||
      (await prisma.backlink.count({
        where: { status: 'ACTIVE' },
      }));

    const authorityScore = this.calculateAuthorityScore({
      domainAuthority: metrics.domainAuthority || 0,
      domainRating: metrics.domainRating || 0,
      trustFlow: metrics.trustFlow || 0,
      citationFlow: metrics.citationFlow || 0,
      organicKeywords: metrics.organicKeywords || 0,
      organicTraffic: metrics.organicTraffic || 0,
      referringDomains: metrics.referringDomains || 0,
      totalBacklinks,
    });

    return await prisma.authorityMetrics.create({
      data: {
        metricDate: new Date(),
        domainAuthority: metrics.domainAuthority || 0,
        domainRating: metrics.domainRating || 0,
        trustFlow: metrics.trustFlow || 0,
        citationFlow: metrics.citationFlow || 0,
        organicKeywords: metrics.organicKeywords || 0,
        organicTraffic: metrics.organicTraffic || 0,
        referringDomains: metrics.referringDomains || 0,
        totalBacklinks,
        authorityScore,
      },
    });
  }

  /**
   * Calculate overall authority score (0-100)
   */
  private calculateAuthorityScore(metrics: {
    domainAuthority: number;
    domainRating: number;
    trustFlow: number;
    citationFlow: number;
    organicKeywords: number;
    organicTraffic: number;
    referringDomains: number;
    totalBacklinks: number;
  }): number {
    let score = 0;

    // Domain authority (20%)
    score += (metrics.domainAuthority / 100) * 20;

    // Domain rating (20%)
    score += (metrics.domainRating / 100) * 20;

    // Trust flow (15%)
    score += (metrics.trustFlow / 100) * 15;

    // Citation flow (10%)
    score += (metrics.citationFlow / 100) * 10;

    // Organic keywords (10%)
    score += Math.min((metrics.organicKeywords / 10000) * 10, 10);

    // Organic traffic (15%)
    score += Math.min((metrics.organicTraffic / 100000) * 15, 15);

    // Referring domains (10%)
    score += Math.min((metrics.referringDomains / 1000) * 10, 10);

    return Math.min(100, Math.round(score));
  }

  /**
   * Get authority metrics history
   */
  async getAuthorityMetrics(limit: number = 30) {
    return await prisma.authorityMetrics.findMany({
      orderBy: { metricDate: 'desc' },
      take: limit,
    });
  }

  // ============================================
  // DASHBOARD STATISTICS
  // ============================================

  /**
   * Get comprehensive link building statistics
   */
  async getStatistics() {
    const [
      totalBacklinks,
      activeBacklinks,
      campaigns,
      prospects,
      influencers,
      recentBacklinks,
      recentVelocity,
      latestAuthority,
    ] = await Promise.all([
      prisma.backlink.count(),
      prisma.backlink.count({ where: { status: 'ACTIVE' } }),
      prisma.linkBuildingCampaign.count(),
      prisma.linkProspect.count(),
      prisma.influencerPartnership.count(),
      prisma.backlink.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { firstSeenAt: 'desc' },
        take: 10,
        include: { Campaign: true },
      }),
      prisma.linkVelocityMetric.findFirst({
        where: { period: 'DAILY' },
        orderBy: { metricDate: 'desc' },
      }),
      prisma.authorityMetrics.findFirst({
        orderBy: { metricDate: 'desc' },
      }),
    ]);

    // Calculate average metrics
    const allActiveBacklinks = await prisma.backlink.findMany({
      where: { status: 'ACTIVE' },
    });

    const avgDomainAuthority =
      allActiveBacklinks.reduce((sum, b) => sum + b.domainAuthority, 0) /
      (allActiveBacklinks.length || 1);

    const avgQualityScore =
      allActiveBacklinks.reduce((sum, b) => sum + b.qualityScore, 0) /
      (allActiveBacklinks.length || 1);

    // Region distribution
    const regionCounts = await prisma.backlink.groupBy({
      by: ['region'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    // Campaign statistics
    const activeCampaigns = await prisma.linkBuildingCampaign.count({
      where: { status: 'ACTIVE' },
    });

    return {
      overview: {
        totalBacklinks,
        activeBacklinks,
        campaigns,
        activeCampaigns,
        prospects,
        influencers,
        avgDomainAuthority: Math.round(avgDomainAuthority),
        avgQualityScore: Math.round(avgQualityScore),
      },
      velocity: recentVelocity || null,
      authority: latestAuthority || null,
      recentBacklinks,
      regionDistribution: regionCounts,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get start date for period
   */
  private getPeriodStartDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case 'DAILY':
        return new Date(now.setDate(now.getDate() - 1));
      case 'WEEKLY':
        return new Date(now.setDate(now.getDate() - 7));
      case 'MONTHLY':
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return new Date(now.setDate(now.getDate() - 1));
    }
  }
}

export default new LinkBuildingService();
