// SEO Dashboard & Analytics Service - Task 60
// Comprehensive SEO monitoring, keyword tracking, and RAO performance analytics

import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';

const prisma = new PrismaClient();

// ============= INTERFACES =============

export interface KeywordData {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  currentPosition: number | null;
  targetPosition: number;
  positionChange: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
  lastChecked: Date;
}

export interface PageAnalysisData {
  id: string;
  url: string;
  contentId: string | null;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  mobileScore: number;
  performanceScore: number;
  raoScore: number;
  issues: IssueData[];
  metrics: {
    wordCount: number;
    readabilityScore: number;
    loadTime: number;
    llmCitations: number;
    aiOverviews: number;
  };
  lastAnalyzed: Date;
}

export interface IssueData {
  id: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: string;
  type: string;
  message: string;
  recommendation: string;
  isResolved: boolean;
}

export interface DashboardStats {
  keywords: {
    total: number;
    tracking: number;
    rankingTop10: number;
    rankingTop3: number;
    averagePosition: number;
    positionImprovement: number;
  };
  pages: {
    total: number;
    analyzed: number;
    averageScore: number;
    needsAttention: number;
  };
  issues: {
    critical: number;
    errors: number;
    warnings: number;
    resolved: number;
    total: number;
  };
  rao: {
    llmCitations: number;
    aiOverviews: number;
    averageRelevance: number;
    contentStructure: number;
  };
  traffic: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    changePercent: number;
  };
  competitors: {
    tracked: number;
    averageAuthority: number;
    keywordGaps: number;
  };
}

export interface AlertData {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
}

export interface CompetitorData {
  id: string;
  domain: string;
  name: string;
  domainAuthority: number;
  keywords: number;
  traffic: number;
  backlinks: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PredictionData {
  keywordId: string;
  keyword: string;
  currentPosition: number;
  predictedPosition: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  targetDate: Date;
  factors: {
    contentQuality: number;
    technicalScore: number;
    backlinks: number;
    competitorStrength: number;
  };
}

// ============= DASHBOARD STATS =============

export class SEODashboardService {
  private cachePrefix = 'seo:dashboard:';
  private cacheTTL = 300; // 5 minutes

  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = `${this.cachePrefix}stats`;
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch all stats in parallel
    const [keywordsStats, pagesStats, issuesStats, raoStats, trafficStats, competitorsStats] = 
      await Promise.all([
        this.getKeywordsStats(),
        this.getPagesStats(),
        this.getIssuesStats(),
        this.getRAOStats(),
        this.getTrafficStats(),
        this.getCompetitorsStats(),
      ]);

    const stats: DashboardStats = {
      keywords: keywordsStats,
      pages: pagesStats,
      issues: issuesStats,
      rao: raoStats,
      traffic: trafficStats,
      competitors: competitorsStats,
    };

    // Cache for 5 minutes
    if (redisClient && redisClient.setex) {
      await redisClient.setex(cacheKey, this.cacheTTL, JSON.stringify(stats));
    }

    return stats;
  }

  // Get keyword tracking statistics
  private async getKeywordsStats() {
    const keywords = await prisma.sEOKeyword.findMany({
      include: {
        ranking: {
          orderBy: { checkDate: 'desc' },
          take: 1,
        },
      },
    });

    const total = keywords.length;
    const tracking = keywords.filter((k: any) => k.currentPosition !== null).length;
    const rankingTop10 = keywords.filter((k: any) => k.currentPosition && k.currentPosition <= 10).length;
    const rankingTop3 = keywords.filter((k: any) => k.currentPosition && k.currentPosition <= 3).length;

    const positions = keywords
      .filter((k: any) => k.currentPosition !== null)
      .map((k: any) => k.currentPosition as number);
    
    const averagePosition = positions.length > 0 
      ? Math.round(positions.reduce((sum: number, pos: number) => sum + pos, 0) / positions.length)
      : 0;

    // Calculate position improvement (last 7 days)
    const improvements = keywords
      .filter((k: any) => k.ranking.length > 0 && k.ranking[0].positionChange !== null)
      .map((k: any) => k.ranking[0].positionChange as number);

    const positionImprovement = improvements.length > 0
      ? Math.round(improvements.reduce((sum: number, change: number) => sum + change, 0) / improvements.length)
      : 0;

    return {
      total,
      tracking,
      rankingTop10,
      rankingTop3,
      averagePosition,
      positionImprovement,
    };
  }

  // Get page analysis statistics
  private async getPagesStats() {
    const pages = await prisma.sEOPageAnalysis.findMany();

    const total = pages.length;
    const analyzed = pages.filter((p: any) => p.lastAnalyzed).length;
    const scores = pages.map((p: any) => p.overallScore);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
      : 0;
    const needsAttention = pages.filter((p: any) => p.overallScore < 70).length;

    return {
      total,
      analyzed,
      averageScore,
      needsAttention,
    };
  }

  // Get issues statistics
  private async getIssuesStats() {
    const issues = await prisma.sEOIssue.findMany();

    const critical = issues.filter((i: any) => i.severity === 'critical' && !i.isResolved).length;
    const errors = issues.filter((i: any) => i.severity === 'error' && !i.isResolved).length;
    const warnings = issues.filter((i: any) => i.severity === 'warning' && !i.isResolved).length;
    const resolved = issues.filter((i: any) => i.isResolved).length;
    const total = issues.length;

    return {
      critical,
      errors,
      warnings,
      resolved,
      total,
    };
  }

  // Get RAO performance statistics
  private async getRAOStats() {
    const raoRecords = await prisma.rAOPerformance.findMany({
      orderBy: { trackingDate: 'desc' },
      take: 100,
    });

    const llmCitations = raoRecords.reduce((sum: number, r: any) => sum + r.llmCitations, 0);
    const aiOverviews = raoRecords.reduce((sum: number, r: any) => sum + r.aiOverviews, 0);
    
    const relevanceScores = raoRecords.map((r: any) => r.semanticRelevance);
    const averageRelevance = relevanceScores.length > 0
      ? Math.round((relevanceScores.reduce((sum: number, score: number) => sum + score, 0) / relevanceScores.length) * 100)
      : 0;

    const structureScores = raoRecords.map((r: any) => r.contentStructure);
    const contentStructure = structureScores.length > 0
      ? Math.round(structureScores.reduce((sum: number, score: number) => sum + score, 0) / structureScores.length)
      : 0;

    return {
      llmCitations,
      aiOverviews,
      averageRelevance,
      contentStructure,
    };
  }

  // Get traffic statistics
  private async getTrafficStats() {
    const rankings = await prisma.sEORanking.findMany({
      where: {
        checkDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const totalClicks = rankings.reduce((sum: number, r: any) => sum + r.clicks, 0);
    const totalImpressions = rankings.reduce((sum: number, r: any) => sum + r.impressions, 0);
    const averageCtr = totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 100
      : 0;

    // Calculate change from previous period
    const previousPeriodRankings = await prisma.sEORanking.findMany({
      where: {
        checkDate: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const previousClicks = previousPeriodRankings.reduce((sum: number, r: any) => sum + r.clicks, 0);
    const changePercent = previousClicks > 0
      ? Math.round(((totalClicks - previousClicks) / previousClicks) * 100)
      : 0;

    return {
      totalClicks,
      totalImpressions,
      averageCtr,
      changePercent,
    };
  }

  // Get competitors statistics
  private async getCompetitorsStats() {
    const competitors = await prisma.sEOCompetitor.findMany({
      where: { isActive: true },
    });

    const tracked = competitors.length;
    const authorities = competitors.map((c: any) => c.domainAuthority);
    const averageAuthority = authorities.length > 0
      ? Math.round(authorities.reduce((sum: number, auth: number) => sum + auth, 0) / authorities.length)
      : 0;

    // Calculate keyword gaps (keywords they rank for that we don't)
    const keywordGaps = 0; // This would require more complex analysis

    return {
      tracked,
      averageAuthority,
      keywordGaps,
    };
  }

  // ============= KEYWORD TRACKING =============

  // Get all tracked keywords with ranking data
  async getTrackedKeywords(filters?: {
    position?: 'top3' | 'top10' | 'top20' | 'all';
    trend?: 'up' | 'down' | 'stable';
    country?: string;
  }): Promise<KeywordData[]> {
    const cacheKey = `${this.cachePrefix}keywords:${JSON.stringify(filters)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let whereClause: any = {};

    if (filters?.position && filters.position !== 'all') {
      const maxPosition = filters.position === 'top3' ? 3 : filters.position === 'top10' ? 10 : 20;
      whereClause.currentPosition = { lte: maxPosition };
    }

    if (filters?.country) {
      whereClause.country = filters.country;
    }

    const keywords = await prisma.sEOKeyword.findMany({
      where: whereClause,
      include: {
        ranking: {
          orderBy: { checkDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { currentPosition: 'asc' },
    });

    const keywordData: KeywordData[] = keywords.map((keyword: any) => {
      const latestRanking = keyword.ranking[0];
      const positionChange = latestRanking?.positionChange || null;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (positionChange !== null) {
        trend = positionChange < 0 ? 'up' : positionChange > 0 ? 'down' : 'stable';
      }

      return {
        id: keyword.id,
        keyword: keyword.keyword,
        searchVolume: keyword.searchVolume,
        difficulty: keyword.difficulty,
        currentPosition: keyword.currentPosition,
        targetPosition: keyword.targetPosition,
        positionChange,
        clicks: latestRanking?.clicks || 0,
        impressions: latestRanking?.impressions || 0,
        ctr: latestRanking?.ctr || 0,
        trend,
        lastChecked: latestRanking?.checkDate || keyword.updatedAt,
      };
    });

    // Apply trend filter if specified
    const filteredData = filters?.trend 
      ? keywordData.filter(k => k.trend === filters.trend)
      : keywordData;

    if (redisClient && redisClient.setex) {
      await redisClient.setex(cacheKey, this.cacheTTL, JSON.stringify(filteredData));
    }

    return filteredData;
  }

  // Track new keyword
  async trackKeyword(data: {
    keyword: string;
    searchVolume: number;
    difficulty: number;
    contentId?: string;
    contentType?: string;
    country?: string;
    language?: string;
  }): Promise<KeywordData> {
    const keyword = await prisma.sEOKeyword.create({
      data: {
        keyword: data.keyword,
        searchVolume: data.searchVolume,
        difficulty: data.difficulty,
        contentId: data.contentId,
        contentType: data.contentType,
        country: data.country || 'global',
        language: data.language || 'en',
      },
    });

    // Invalidate cache
    await this.invalidateKeywordCache();

    return {
      id: keyword.id,
      keyword: keyword.keyword,
      searchVolume: keyword.searchVolume,
      difficulty: keyword.difficulty,
      currentPosition: keyword.currentPosition,
      targetPosition: keyword.targetPosition,
      positionChange: null,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      trend: 'stable',
      lastChecked: keyword.createdAt,
    };
  }

  // Update keyword ranking
  async updateKeywordRanking(keywordId: string, data: {
    position: number;
    url: string;
    title?: string;
    snippet?: string;
    clicks?: number;
    impressions?: number;
  }): Promise<void> {
    const keyword = await prisma.sEOKeyword.findUnique({
      where: { id: keywordId },
      include: {
        ranking: {
          orderBy: { checkDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!keyword) {
      throw new Error('Keyword not found');
    }

    const previousPosition = keyword.currentPosition;
    const positionChange = previousPosition !== null ? data.position - previousPosition : null;

    // Create new ranking record
    const impressions = data.impressions || 0;
    const clicks = data.clicks || 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;

    await prisma.sEORanking.create({
      data: {
        keywordId,
        position: data.position,
        url: data.url,
        title: data.title,
        snippet: data.snippet,
        clicks,
        impressions,
        ctr,
        avgPosition: data.position,
        previousPosition,
        positionChange,
      },
    });

    // Update keyword current position
    await prisma.sEOKeyword.update({
      where: { id: keywordId },
      data: { 
        currentPosition: data.position,
        updatedAt: new Date(),
      },
    });

    // Check if we should create an alert
    if (positionChange !== null && Math.abs(positionChange) >= 5) {
      await this.createAlert({
        type: positionChange > 0 ? 'ranking-drop' : 'ranking-improvement',
        severity: Math.abs(positionChange) >= 10 ? 'critical' : 'warning',
        title: `Keyword "${keyword.keyword}" ${positionChange > 0 ? 'dropped' : 'improved'}`,
        message: `Position changed from ${previousPosition} to ${data.position} (${positionChange > 0 ? '+' : ''}${positionChange})`,
        metadata: { keywordId, keyword: keyword.keyword, positionChange },
      });
    }

    await this.invalidateKeywordCache();
  }

  // ============= PAGE ANALYSIS =============

  // Get page analysis results
  async getPageAnalysis(filters?: {
    minScore?: number;
    maxScore?: number;
    hasIssues?: boolean;
  }): Promise<PageAnalysisData[]> {
    const cacheKey = `${this.cachePrefix}pages:${JSON.stringify(filters)}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let whereClause: any = {};

    if (filters?.minScore !== undefined) {
      whereClause.overallScore = { ...whereClause.overallScore, gte: filters.minScore };
    }

    if (filters?.maxScore !== undefined) {
      whereClause.overallScore = { ...whereClause.overallScore, lte: filters.maxScore };
    }

    const pages = await prisma.sEOPageAnalysis.findMany({
      where: whereClause,
      include: {
        issues: {
          where: { isResolved: false },
          orderBy: [
            { severity: 'desc' },
            { detectedAt: 'desc' },
          ],
        },
      },
      orderBy: { overallScore: 'asc' },
    });

    const pageData: PageAnalysisData[] = pages.map((page: any) => ({
      id: page.id,
      url: page.url,
      contentId: page.contentId,
      overallScore: page.overallScore,
      technicalScore: page.technicalScore,
      contentScore: page.contentScore,
      mobileScore: page.mobileScore,
      performanceScore: page.performanceScore,
      raoScore: page.raoScore,
      issues: page.issues.map((issue: any) => ({
        id: issue.id,
        severity: issue.severity as any,
        category: issue.category,
        type: issue.type,
        message: issue.message,
        recommendation: issue.recommendation,
        isResolved: issue.isResolved,
      })),
      metrics: {
        wordCount: page.wordCount,
        readabilityScore: page.readabilityScore,
        loadTime: page.loadTime,
        llmCitations: page.llmCitations,
        aiOverviews: page.aiOverviewAppearances,
      },
      lastAnalyzed: page.lastAnalyzed,
    }));

    const filteredData = filters?.hasIssues
      ? pageData.filter(p => p.issues.length > 0)
      : pageData;

    if (redisClient && redisClient.setex) {
      await redisClient.setex(cacheKey, this.cacheTTL, JSON.stringify(filteredData));
    }

    return filteredData;
  }

  // Analyze a page
  async analyzePage(url: string, contentId?: string): Promise<PageAnalysisData> {
    // Check if page already exists
    let page = await prisma.sEOPageAnalysis.findUnique({
      where: { url },
      include: { issues: true },
    });

    // For now, create/update with default scores
    // In production, this would perform actual analysis
    const analysisData = {
      url,
      contentId,
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
      technicalScore: Math.floor(Math.random() * 30) + 70,
      contentScore: Math.floor(Math.random() * 30) + 70,
      mobileScore: Math.floor(Math.random() * 30) + 70,
      performanceScore: Math.floor(Math.random() * 30) + 70,
      raoScore: Math.floor(Math.random() * 30) + 70,
      hasH1: true,
      hasMetaDescription: true,
      hasCanonical: true,
      hasStructuredData: Math.random() > 0.5,
      hasAMP: Math.random() > 0.7,
      wordCount: Math.floor(Math.random() * 1000) + 500,
      readabilityScore: Math.floor(Math.random() * 30) + 60,
      keywordDensity: Math.random() * 0.03,
      internalLinks: Math.floor(Math.random() * 10) + 5,
      externalLinks: Math.floor(Math.random() * 5) + 2,
      imageCount: Math.floor(Math.random() * 10) + 3,
      imagesMissingAlt: Math.floor(Math.random() * 3),
      loadTime: Math.random() * 2 + 1,
      timeToFirstByte: Math.random() * 0.5,
      firstContentfulPaint: Math.random() * 1.5,
      largestContentfulPaint: Math.random() * 2.5,
      cumulativeLayoutShift: Math.random() * 0.1,
      llmCitations: Math.floor(Math.random() * 10),
      aiOverviewAppearances: Math.floor(Math.random() * 5),
      semanticRelevance: Math.random() * 0.3 + 0.7,
      lastAnalyzed: new Date(),
      updatedAt: new Date(),
    };

    if (page) {
      page = await prisma.sEOPageAnalysis.update({
        where: { url },
        data: analysisData,
        include: { issues: true },
      });
    } else {
      page = await prisma.sEOPageAnalysis.create({
        data: analysisData,
        include: { issues: true },
      });
    }

    await this.invalidatePageCache();

    return {
      id: page.id,
      url: page.url,
      contentId: page.contentId,
      overallScore: page.overallScore,
      technicalScore: page.technicalScore,
      contentScore: page.contentScore,
      mobileScore: page.mobileScore,
      performanceScore: page.performanceScore,
      raoScore: page.raoScore,
      issues: page.issues.map((issue: any) => ({
        id: issue.id,
        severity: issue.severity as any,
        category: issue.category,
        type: issue.type,
        message: issue.message,
        recommendation: issue.recommendation,
        isResolved: issue.isResolved,
      })),
      metrics: {
        wordCount: page.wordCount,
        readabilityScore: page.readabilityScore,
        loadTime: page.loadTime,
        llmCitations: page.llmCitations,
        aiOverviews: page.aiOverviewAppearances,
      },
      lastAnalyzed: page.lastAnalyzed,
    };
  }

  // ============= ALERTS =============

  // Get alerts
  async getAlerts(filters?: {
    isRead?: boolean;
    isResolved?: boolean;
    severity?: string;
  }): Promise<AlertData[]> {
    const alerts = await prisma.sEOAlert.findMany({
      where: filters,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return alerts.map((alert: any) => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      metadata: JSON.parse(alert.metadata),
      isRead: alert.isRead,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
    }));
  }

  // Create alert
  async createAlert(data: {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    metadata: any;
  }): Promise<AlertData> {
    const alert = await prisma.sEOAlert.create({
      data: {
        type: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        metadata: JSON.stringify(data.metadata),
      },
    });

    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity as any,
      title: alert.title,
      message: alert.message,
      metadata: JSON.parse(alert.metadata),
      isRead: alert.isRead,
      isResolved: alert.isResolved,
      createdAt: alert.createdAt,
    };
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<void> {
    await prisma.sEOAlert.update({
      where: { id: alertId },
      data: { isRead: true, updatedAt: new Date() },
    });
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await prisma.sEOAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        updatedAt: new Date(),
      },
    });
  }

  // ============= COMPETITORS =============

  // Get competitors
  async getCompetitors(): Promise<CompetitorData[]> {
    const competitors = await prisma.sEOCompetitor.findMany({
      where: { isActive: true },
      include: {
        analysis: {
          orderBy: { analysisDate: 'desc' },
          take: 2,
        },
      },
    });

    return competitors.map((competitor: any) => {
      const latestAnalysis = competitor.analysis[0];
      const previousAnalysis = competitor.analysis[1];

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (latestAnalysis && previousAnalysis) {
        const keywordChange = latestAnalysis.keywordsRanking - previousAnalysis.keywordsRanking;
        trend = keywordChange > 0 ? 'up' : keywordChange < 0 ? 'down' : 'stable';
      }

      return {
        id: competitor.id,
        domain: competitor.domain,
        name: competitor.name,
        domainAuthority: competitor.domainAuthority,
        keywords: competitor.keywords,
        traffic: competitor.traffic,
        backlinks: competitor.backlinks,
        trend,
      };
    });
  }

  // ============= PREDICTIONS =============

  // Get ranking predictions
  async getRankingPredictions(keywordId?: string): Promise<PredictionData[]> {
    const predictions = await prisma.sEORankingPrediction.findMany({
      where: keywordId ? { keywordId } : undefined,
      orderBy: { confidence: 'desc' },
      take: 50,
    });

    // Get keyword data
    const keywordIds = [...new Set(predictions.map((p: any) => p.keywordId))];
    const keywords = await prisma.sEOKeyword.findMany({
      where: { id: { in: keywordIds } },
    });

    const keywordMap = new Map(keywords.map((k: any) => [k.id, k.keyword]));

    return predictions.map((pred: any) => ({
      keywordId: pred.keywordId,
      keyword: keywordMap.get(pred.keywordId) || 'Unknown',
      currentPosition: pred.currentPosition,
      predictedPosition: pred.predictedPosition,
      confidence: pred.confidence,
      trend: pred.trend as any,
      targetDate: pred.targetDate,
      factors: {
        contentQuality: pred.contentQuality,
        technicalScore: pred.technicalScore,
        backlinks: pred.backlinks,
        competitorStrength: pred.competitorStrength,
      },
    }));
  }

  // Generate predictions for all keywords
  async generatePredictions(): Promise<void> {
    const keywords = await prisma.sEOKeyword.findMany({
      where: { currentPosition: { not: null } },
    });

    for (const keyword of keywords) {
      // Simple prediction algorithm
      // In production, this would use ML models
      const currentPosition = keyword.currentPosition!;
      const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const contentQuality = Math.random() * 0.3 + 0.7;
      const technicalScore = Math.random() * 0.3 + 0.7;
      const backlinks = Math.floor(Math.random() * 100);
      const competitorStrength = Math.random() * 0.5 + 0.5;

      // Predict position change based on factors
      const qualityFactor = (contentQuality + technicalScore) / 2;
      const backlinkFactor = Math.min(backlinks / 100, 1);
      const competitorFactor = 1 - competitorStrength;

      const improvementPotential = (qualityFactor + backlinkFactor + competitorFactor) / 3;
      const positionChange = Math.floor(improvementPotential * 10);

      const predictedPosition = Math.max(1, currentPosition - positionChange);
      const confidence = improvementPotential;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (predictedPosition < currentPosition) trend = 'up';
      else if (predictedPosition > currentPosition) trend = 'down';

      await prisma.sEORankingPrediction.create({
        data: {
          keywordId: keyword.id,
          url: `/article/${keyword.contentId}`,
          currentPosition,
          predictedPosition,
          confidence,
          trend,
          contentQuality,
          technicalScore,
          backlinks,
          competitorStrength,
          targetDate,
        },
      });
    }
  }

  // ============= RAO PERFORMANCE =============

  // Track RAO performance
  async trackRAOPerformance(data: {
    contentId: string;
    contentType: string;
    url: string;
    llmCitations: number;
    citationSources: string[];
    aiOverviews: number;
    semanticRelevance: number;
  }): Promise<void> {
    await prisma.rAOPerformance.create({
      data: {
        contentId: data.contentId,
        contentType: data.contentType,
        url: data.url,
        llmCitations: data.llmCitations,
        citationSources: JSON.stringify(data.citationSources),
        citationContexts: JSON.stringify([]),
        aiOverviews: data.aiOverviews,
        overviewSources: JSON.stringify([]),
        semanticRelevance: data.semanticRelevance,
        entityRecognition: JSON.stringify({}),
        topicCoverage: Math.random() * 0.3 + 0.7,
        contentStructure: Math.floor(Math.random() * 30) + 70,
        factualAccuracy: Math.floor(Math.random() * 30) + 70,
        sourceAuthority: Math.floor(Math.random() * 30) + 70,
      },
    });

    await this.invalidateRAOCache();
  }

  // ============= CACHE INVALIDATION =============

  private async invalidateKeywordCache(): Promise<void> {
    const keys = await redisClient.keys(`${this.cachePrefix}keywords:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key: string) => redisClient.del(key)));
    }
    await redisClient.del(`${this.cachePrefix}stats`);
  }

  private async invalidatePageCache(): Promise<void> {
    const keys = await redisClient.keys(`${this.cachePrefix}pages:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key: string) => redisClient.del(key)));
    }
    await redisClient.del(`${this.cachePrefix}stats`);
  }

  private async invalidateRAOCache(): Promise<void> {
    await redisClient.del(`${this.cachePrefix}stats`);
  }
}

export const seoDashboardService = new SEODashboardService();
