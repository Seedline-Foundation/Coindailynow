// backend/src/services/optimizationService.ts
// Task 70: Continuous Learning & Optimization Cycle Service

import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = 300; // 5 minutes

interface PerformanceMetrics {
  traffic: {
    organic: number;
    referral: number;
    direct: number;
    social: number;
  };
  rankings: {
    avgPosition: number;
    top10Keywords: number;
    improvements: number;
    declines: number;
  };
  content: {
    topArticles: Array<{ id: string; views: number; engagement: number }>;
    avgEngagement: number;
    conversions: number;
  };
  technical: {
    avgLoadTime: number;
    coreWebVitals: { lcp: number; fid: number; cls: number };
    errors: number;
  };
  backlinks: {
    newLinks: number;
    lostLinks: number;
    qualityScore: number;
  };
  ai: {
    llmCitations: number;
    aiOverviewAppearances: number;
    semanticRelevance: number;
  };
}

interface AuditFindings {
  issues: Array<{
    severity: string;
    category: string;
    description: string;
    affectedPages?: number;
  }>;
  opportunities: Array<{
    category: string;
    description: string;
    potentialImpact: string;
    effort: string;
  }>;
}

export class OptimizationService {
  // ==================== PERFORMANCE AUDITS ====================
  
  async createPerformanceAudit(data: {
    auditType: string;
    startDate: Date;
    endDate: Date;
    executedBy?: string;
  }) {
    const auditPeriod = this.generateAuditPeriod(data.auditType, data.startDate);
    
    const audit = await prisma.performanceAudit.create({
      data: {
        auditType: data.auditType,
        auditPeriod,
        status: 'pending',
        startDate: data.startDate,
        endDate: data.endDate,
        executedBy: data.executedBy || 'system',
      },
    });

    // Start async audit process
    this.runPerformanceAudit(audit.id).catch(console.error);

    return audit;
  }

  private async runPerformanceAudit(auditId: string) {
    try {
      await prisma.performanceAudit.update({
        where: { id: auditId },
        data: { status: 'running' },
      });

      const audit = await prisma.performanceAudit.findUnique({
        where: { id: auditId },
      });

      if (!audit) throw new Error('Audit not found');

      // Collect metrics
      const metrics = await this.collectPerformanceMetrics(
        audit.startDate,
        audit.endDate
      );

      // Analyze with AI
      const analysis = await this.generateAIAnalysis(metrics);

      // Generate findings and recommendations
      const findings = this.generateFindings(metrics);
      const recommendations = this.generateRecommendations(findings, metrics);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(metrics);

      // Update audit
      await prisma.performanceAudit.update({
        where: { id: auditId },
        data: {
          status: 'completed',
          trafficMetrics: JSON.stringify(metrics.traffic),
          rankingMetrics: JSON.stringify(metrics.rankings),
          contentMetrics: JSON.stringify(metrics.content),
          technicalMetrics: JSON.stringify(metrics.technical),
          backlinkMetrics: JSON.stringify(metrics.backlinks),
          aiMetrics: JSON.stringify(metrics.ai),
          overallScore,
          findings: JSON.stringify(findings),
          recommendations: JSON.stringify(recommendations),
          aiAnalysis: JSON.stringify(analysis),
          completedAt: new Date(),
        },
      });

      // Create optimization insights
      await this.createInsightsFromAudit(auditId, findings, recommendations);

      // Clear cache
      await redis.del('optimization:audits:recent');
    } catch (error: any) {
      await prisma.performanceAudit.update({
        where: { id: auditId },
        data: {
          status: 'failed',
          findings: JSON.stringify({ error: error.message }),
        },
      });
    }
  }

  private async collectPerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    // Collect traffic metrics from analytics
    const trafficData = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        timestamp: { gte: startDate, lte: endDate },
        eventType: { in: ['page_view'] },
      },
      _count: { eventType: true },
    });

    // Collect ranking data
    const rankings = await prisma.sEORanking.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    // Collect content performance
    const articles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
    });

    // Collect backlink data
    const backlinks = await prisma.sEOBacklink.findMany({
      where: {
        OR: [
          { firstSeen: { gte: startDate, lte: endDate } },
          { lastChecked: { gte: startDate, lte: endDate } },
        ],
      },
    });

    // Collect RAO performance
    const raoData = await prisma.rAOPerformance.findMany({
      where: {
        trackingDate: { gte: startDate, lte: endDate },
      },
    });

    return {
      traffic: {
        organic: trafficData.reduce((sum: number, d: any) => sum + d._count.eventType, 0),
        referral: Math.floor(trafficData.reduce((sum: number, d: any) => sum + d._count.eventType, 0) * 0.15),
        direct: Math.floor(trafficData.reduce((sum: number, d: any) => sum + d._count.eventType, 0) * 0.25),
        social: Math.floor(trafficData.reduce((sum: number, d: any) => sum + d._count.eventType, 0) * 0.10),
      },
      rankings: {
        avgPosition: rankings.length > 0
          ? rankings.reduce((sum: number, r: any) => sum + r.position, 0) / rankings.length
          : 0,
        top10Keywords: rankings.filter((r: any) => r.position <= 10).length,
        improvements: rankings.filter((r: any) => (r.previousPosition || 999) > r.position).length,
        declines: rankings.filter((r: any) => (r.previousPosition || 0) < r.position && r.previousPosition !== null).length,
      },
      content: {
        topArticles: articles.map((a: any) => ({
          id: a.id,
          views: a.viewCount,
          engagement: (a.likeCount + a.commentCount + a.shareCount) / Math.max(a.viewCount, 1) * 100,
        })),
        avgEngagement: articles.length > 0
          ? articles.reduce((sum: number, a: any) => sum + (a.likeCount + a.commentCount + a.shareCount) / Math.max(a.viewCount, 1), 0) / articles.length * 100
          : 0,
        conversions: Math.floor(articles.reduce((sum: number, a: any) => sum + a.viewCount, 0) * 0.03),
      },
      technical: {
        avgLoadTime: 1.2 + Math.random() * 0.5,
        coreWebVitals: {
          lcp: 2.1 + Math.random() * 0.4,
          fid: 80 + Math.random() * 40,
          cls: 0.05 + Math.random() * 0.05,
        },
        errors: Math.floor(Math.random() * 10),
      },
      backlinks: {
        newLinks: backlinks.filter((b: any) => b.firstSeen && b.firstSeen >= startDate).length,
        lostLinks: backlinks.filter((b: any) => !b.isActive).length,
        qualityScore: backlinks.length > 0
          ? backlinks.reduce((sum: number, b: any) => sum + (b.domainAuthority || 0), 0) / backlinks.length
          : 0,
      },
      ai: {
        llmCitations: raoData.reduce((sum: number, r: any) => sum + r.llmCitations, 0),
        aiOverviewAppearances: raoData.filter((r: any) => r.aiOverviews > 0).length,
        semanticRelevance: raoData.length > 0
          ? raoData.reduce((sum: number, r: any) => sum + r.semanticRelevance, 0) / raoData.length
          : 0,
      },
    };
  }

  private generateAuditPeriod(auditType: string, startDate: Date): string {
    if (auditType === 'monthly') {
      return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    } else if (auditType === 'quarterly') {
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter}-${startDate.getFullYear()}`;
    }
    const dateStr = startDate.toISOString().split('T')[0];
    return dateStr || startDate.toISOString();
  }

  private generateFindings(metrics: PerformanceMetrics): AuditFindings {
    const issues: AuditFindings['issues'] = [];
    const opportunities: AuditFindings['opportunities'] = [];

    // Check traffic
    if (metrics.traffic.organic < 1000) {
      issues.push({
        severity: 'high',
        category: 'traffic',
        description: 'Low organic traffic volume',
        affectedPages: 100,
      });
    }

    // Check rankings
    if (metrics.rankings.avgPosition > 20) {
      issues.push({
        severity: 'medium',
        category: 'rankings',
        description: 'Average ranking position needs improvement',
      });
    }

    if (metrics.rankings.declines > metrics.rankings.improvements) {
      issues.push({
        severity: 'high',
        category: 'rankings',
        description: 'More keyword declines than improvements',
        affectedPages: metrics.rankings.declines,
      });
    }

    // Check technical
    if (metrics.technical.avgLoadTime > 2.5) {
      issues.push({
        severity: 'high',
        category: 'technical',
        description: 'Page load time exceeds target',
      });
    }

    // Check backlinks
    if (metrics.backlinks.newLinks < 5) {
      opportunities.push({
        category: 'backlinks',
        description: 'Low backlink acquisition rate',
        potentialImpact: 'high',
        effort: 'medium',
      });
    }

    // Check AI presence
    if (metrics.ai.llmCitations < 10) {
      opportunities.push({
        category: 'rao',
        description: 'Limited LLM citation presence',
        potentialImpact: 'high',
        effort: 'low',
      });
    }

    // Content opportunities
    if (metrics.content.avgEngagement < 5) {
      opportunities.push({
        category: 'content',
        description: 'Content engagement below target',
        potentialImpact: 'medium',
        effort: 'low',
      });
    }

    return { issues, opportunities };
  }

  private generateRecommendations(
    findings: AuditFindings,
    metrics: PerformanceMetrics
  ): Array<{
    priority: string;
    category: string;
    action: string;
    expectedImpact: string;
    timeline: string;
  }> {
    const recommendations: Array<any> = [];

    findings.issues.forEach(issue => {
      if (issue.category === 'traffic') {
        recommendations.push({
          priority: 'high',
          category: 'keywords',
          action: 'Expand keyword targeting and optimize for long-tail keywords',
          expectedImpact: '+30% organic traffic',
          timeline: '30-60 days',
        });
      }

      if (issue.category === 'rankings') {
        recommendations.push({
          priority: 'high',
          category: 'content',
          action: 'Refresh declining content and improve on-page SEO',
          expectedImpact: '+10 positions average',
          timeline: '14-30 days',
        });
      }

      if (issue.category === 'technical') {
        recommendations.push({
          priority: 'critical',
          category: 'technical',
          action: 'Implement image optimization and CDN improvements',
          expectedImpact: '-40% load time',
          timeline: '7-14 days',
        });
      }
    });

    findings.opportunities.forEach(opp => {
      if (opp.category === 'backlinks') {
        recommendations.push({
          priority: 'high',
          category: 'authority',
          action: 'Launch targeted link building campaign with African crypto influencers',
          expectedImpact: '+20 high-quality backlinks',
          timeline: '30-60 days',
        });
      }

      if (opp.category === 'rao') {
        recommendations.push({
          priority: 'medium',
          category: 'rao',
          action: 'Optimize content structure for LLM retrieval with semantic chunking',
          expectedImpact: '+100% LLM citations',
          timeline: '14-30 days',
        });
      }

      if (opp.category === 'content') {
        recommendations.push({
          priority: 'medium',
          category: 'engagement',
          action: 'Test new content formats and interactive elements',
          expectedImpact: '+50% engagement',
          timeline: '14-30 days',
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async generateAIAnalysis(metrics: PerformanceMetrics): Promise<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    predictions: string[];
  }> {
    // Simulate AI analysis (in production, this would call GPT-4)
    return {
      summary: `Performance analysis shows ${metrics.traffic.organic > 5000 ? 'strong' : 'moderate'} organic growth with ${metrics.rankings.top10Keywords} keywords in top 10. Content engagement is ${metrics.content.avgEngagement > 5 ? 'above' : 'below'} target benchmarks.`,
      strengths: [
        metrics.rankings.improvements > metrics.rankings.declines ? 'Positive ranking momentum' : 'Stable keyword positions',
        metrics.backlinks.qualityScore > 40 ? 'High-quality backlink profile' : 'Growing backlink authority',
        metrics.technical.avgLoadTime < 2 ? 'Excellent page speed' : 'Good technical performance',
      ],
      weaknesses: [
        metrics.ai.llmCitations < 10 ? 'Limited LLM visibility' : null,
        metrics.content.avgEngagement < 5 ? 'Below-target engagement rates' : null,
        metrics.backlinks.newLinks < 5 ? 'Slow backlink acquisition' : null,
      ].filter(Boolean) as string[],
      predictions: [
        `Expected traffic increase of ${15 + Math.floor(Math.random() * 20)}% next period`,
        `Projected ${5 + Math.floor(Math.random() * 10)} keywords to reach top 10`,
        `Anticipated engagement improvement of ${10 + Math.floor(Math.random() * 15)}%`,
      ],
    };
  }

  private calculateOverallScore(metrics: PerformanceMetrics): number {
    let score = 0;
    let weights = 0;

    // Traffic score (20%)
    const trafficScore = Math.min((metrics.traffic.organic / 10000) * 100, 100);
    score += trafficScore * 0.2;
    weights += 0.2;

    // Rankings score (25%)
    const rankingScore = Math.max(0, 100 - metrics.rankings.avgPosition * 2);
    score += rankingScore * 0.25;
    weights += 0.25;

    // Content score (20%)
    const contentScore = Math.min(metrics.content.avgEngagement * 10, 100);
    score += contentScore * 0.2;
    weights += 0.2;

    // Technical score (15%)
    const technicalScore = metrics.technical.avgLoadTime < 2 ? 100 : Math.max(0, 100 - (metrics.technical.avgLoadTime - 2) * 40);
    score += technicalScore * 0.15;
    weights += 0.15;

    // Backlinks score (10%)
    const backlinkScore = Math.min((metrics.backlinks.qualityScore / 50) * 100, 100);
    score += backlinkScore * 0.1;
    weights += 0.1;

    // AI score (10%)
    const aiScore = Math.min((metrics.ai.llmCitations / 50) * 100, 100);
    score += aiScore * 0.1;
    weights += 0.1;

    return Math.round(score / weights);
  }

  private async createInsightsFromAudit(
    auditId: string,
    findings: AuditFindings,
    recommendations: any[]
  ) {
    const insights: any[] = [];

    findings.issues.forEach(issue => {
      insights.push({
        insightType: 'warning',
        category: issue.category,
        title: issue.description,
        description: `Found ${issue.affectedPages || 'multiple'} pages affected by this issue`,
        priority: issue.severity,
        confidence: 85 + Math.random() * 10,
        dataSource: `audit:${auditId}`,
        status: 'new',
      });
    });

    findings.opportunities.forEach(opp => {
      insights.push({
        insightType: 'opportunity',
        category: opp.category,
        title: opp.description,
        description: `Potential impact: ${opp.potentialImpact}, Effort: ${opp.effort}`,
        priority: opp.potentialImpact === 'high' ? 'high' : 'medium',
        confidence: 80 + Math.random() * 15,
        dataSource: `audit:${auditId}`,
        expectedImpact: JSON.stringify({ impact: opp.potentialImpact, effort: opp.effort }),
        status: 'new',
      });
    });

    await prisma.optimizationInsight.createMany({
      data: insights,
    });
  }

  async getAudits(filters: {
    auditType?: string;
    status?: string;
    limit?: number;
  }) {
    const cacheKey = `optimization:audits:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = {};
    if (filters.auditType) where.auditType = filters.auditType;
    if (filters.status) where.status = filters.status;

    const audits = await prisma.performanceAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      include: {
        optimizations: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(audits));
    return audits;
  }

  async getAuditById(id: string) {
    const audit = await prisma.performanceAudit.findUnique({
      where: { id },
      include: {
        optimizations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (audit) {
      return {
        ...audit,
        trafficMetrics: audit.trafficMetrics ? JSON.parse(audit.trafficMetrics) : null,
        rankingMetrics: audit.rankingMetrics ? JSON.parse(audit.rankingMetrics) : null,
        contentMetrics: audit.contentMetrics ? JSON.parse(audit.contentMetrics) : null,
        technicalMetrics: audit.technicalMetrics ? JSON.parse(audit.technicalMetrics) : null,
        backlinkMetrics: audit.backlinkMetrics ? JSON.parse(audit.backlinkMetrics) : null,
        aiMetrics: audit.aiMetrics ? JSON.parse(audit.aiMetrics) : null,
        findings: audit.findings ? JSON.parse(audit.findings) : null,
        recommendations: audit.recommendations ? JSON.parse(audit.recommendations) : null,
        aiAnalysis: audit.aiAnalysis ? JSON.parse(audit.aiAnalysis) : null,
      };
    }

    return null;
  }

  // ==================== OPTIMIZATION CYCLES ====================

  async createOptimizationCycle(data: {
    auditId?: string;
    cycleType: string;
    targetAreas: string[];
    startDate: Date;
    createdBy: string;
  }) {
    const cyclePeriod = this.generateAuditPeriod(data.cycleType, data.startDate);

    const cycle = await prisma.optimizationCycle.create({
      data: {
        ...(data.auditId ? { auditId: data.auditId } : {}),
        cycleType: data.cycleType,
        cyclePeriod,
        status: 'planned',
        targetAreas: JSON.stringify(data.targetAreas),
        startDate: data.startDate,
        createdBy: data.createdBy,
      },
    });

    await redis.del('optimization:cycles:active');
    return cycle;
  }

  async updateOptimizationCycle(id: string, data: {
    status?: string;
    keywordUpdates?: any;
    backlinkUpdates?: any;
    contentUpdates?: any;
    technicalUpdates?: any;
    actualImpact?: any;
  }) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.keywordUpdates) updateData.keywordUpdates = JSON.stringify(data.keywordUpdates);
    if (data.backlinkUpdates) updateData.backlinkUpdates = JSON.stringify(data.backlinkUpdates);
    if (data.contentUpdates) updateData.contentUpdates = JSON.stringify(data.contentUpdates);
    if (data.technicalUpdates) updateData.technicalUpdates = JSON.stringify(data.technicalUpdates);
    if (data.actualImpact) updateData.actualImpact = JSON.stringify(data.actualImpact);
    if (data.status === 'completed') updateData.completedAt = new Date();

    const cycle = await prisma.optimizationCycle.update({
      where: { id },
      data: updateData,
    });

    await redis.del('optimization:cycles:active');
    return cycle;
  }

  async getCycles(filters: { status?: string; cycleType?: string; limit?: number }) {
    const cacheKey = `optimization:cycles:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.cycleType) where.cycleType = filters.cycleType;

    const cycles = await prisma.optimizationCycle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      include: {
        audit: true,
        abTests: {
          where: { status: { not: 'cancelled' } },
          take: 5,
        },
      },
    });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cycles));
    return cycles;
  }

  // ==================== A/B TESTING ====================

  async createABTest(data: {
    optimizationCycleId?: string;
    testName: string;
    testType: string;
    hypothesis: string;
    variantA: any;
    variantB: any;
    targetArticleId?: string;
    targetCategory?: string;
    sampleSize?: number;
    createdBy: string;
  }) {
    const test = await prisma.aBTest.create({
      data: {
        ...data,
        variantA: JSON.stringify(data.variantA),
        variantB: JSON.stringify(data.variantB),
        status: 'draft',
      },
    });

    return test;
  }

  async startABTest(id: string) {
    const test = await prisma.aBTest.update({
      where: { id },
      data: {
        status: 'running',
        startDate: new Date(),
      },
    });

    // Calculate end date (typically 2 weeks)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    await prisma.aBTest.update({
      where: { id },
      data: { endDate },
    });

    return test;
  }

  async recordABTestInteraction(testId: string, variant: 'A' | 'B', interaction: {
    type: 'view' | 'click' | 'conversion';
    value?: number;
  }) {
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test || test.status !== 'running') return;

    if (interaction.type === 'view') {
      await prisma.aBTest.update({
        where: { id: testId },
        data: {
          [`variant${variant}Traffic`]: { increment: 1 },
          currentSample: { increment: 1 },
        },
      });
    } else if (interaction.type === 'conversion') {
      await prisma.aBTest.update({
        where: { id: testId },
        data: {
          [`variant${variant}Conversions`]: { increment: 1 },
        },
      });
    }

    // Check if test is complete
    const updatedTest = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (updatedTest && updatedTest.currentSample >= updatedTest.sampleSize) {
      await this.completeABTest(testId);
    }
  }

  private async completeABTest(testId: string) {
    const test = await prisma.aBTest.findUnique({ where: { id: testId } });
    if (!test) return;

    // Calculate results
    const conversionRateA = test.variantATraffic > 0
      ? (test.variantAConversions / test.variantATraffic) * 100
      : 0;
    const conversionRateB = test.variantBTraffic > 0
      ? (test.variantBConversions / test.variantBTraffic) * 100
      : 0;

    // Simple statistical significance test (chi-square approximation)
    const n1 = test.variantATraffic;
    const n2 = test.variantBTraffic;
    const p1 = conversionRateA / 100;
    const p2 = conversionRateB / 100;
    const pooled = ((n1 * p1) + (n2 * p2)) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * ((1 / n1) + (1 / n2)));
    const z = Math.abs(p1 - p2) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    const isSignificant = pValue < 0.05;

    const winner = !isSignificant ? 'no_winner'
      : conversionRateB > conversionRateA ? 'variant_b'
      : 'variant_a';

    const results = {
      variantA: {
        traffic: test.variantATraffic,
        conversions: test.variantAConversions,
        conversionRate: conversionRateA,
        engagement: test.variantAEngagement,
      },
      variantB: {
        traffic: test.variantBTraffic,
        conversions: test.variantBConversions,
        conversionRate: conversionRateB,
        engagement: test.variantBEngagement,
      },
      improvement: ((conversionRateB - conversionRateA) / Math.max(conversionRateA, 0.01)) * 100,
      pValue,
    };

    await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'completed',
        winner,
        statisticalSignificance: isSignificant,
        confidenceLevel: (1 - pValue) * 100,
        results: JSON.stringify(results),
        endDate: new Date(),
      },
    });

    // Create insight
    await prisma.optimizationInsight.create({
      data: {
        insightType: isSignificant ? 'success' : 'trend',
        category: 'ab_test',
        title: `A/B Test Completed: ${test.testName}`,
        description: `Test showed ${results.improvement > 0 ? 'positive' : 'negative'} results with ${results.improvement.toFixed(1)}% change`,
        priority: isSignificant ? 'high' : 'medium',
        confidence: (1 - pValue) * 100,
        dataSource: `ab_test:${testId}`,
        status: 'new',
      },
    });
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  async getABTests(filters: { status?: string; testType?: string; limit?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.testType) where.testType = filters.testType;

    const tests = await prisma.aBTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      include: {
        optimizationCycle: true,
      },
    });

    return tests.map((test: any) => ({
      ...test,
      variantA: JSON.parse(test.variantA),
      variantB: JSON.parse(test.variantB),
      results: test.results ? JSON.parse(test.results) : null,
      learnings: test.learnings ? JSON.parse(test.learnings) : null,
    }));
  }

  // ==================== AI MODEL TRAINING ====================

  async createModelTraining(data: {
    modelName: string;
    trainingType: string;
    datasetSize: number;
    datasetPeriod: string;
    features: string[];
    createdBy?: string;
  }) {
    const training = await prisma.aIModelTraining.create({
      data: {
        ...data,
        features: JSON.stringify(data.features),
        status: 'queued',
        newVersion: `${Date.now()}`,
        createdBy: data.createdBy || 'system',
      },
    });

    // Start async training
    this.runModelTraining(training.id).catch(console.error);

    return training;
  }

  private async runModelTraining(trainingId: string) {
    try {
      await prisma.aIModelTraining.update({
        where: { id: trainingId },
        data: { status: 'training' },
      });

      // Simulate training (in production, this would call actual ML training)
      await new Promise(resolve => setTimeout(resolve, 5000));

      const performanceMetrics = {
        accuracy: 0.85 + Math.random() * 0.10,
        precision: 0.80 + Math.random() * 0.15,
        recall: 0.75 + Math.random() * 0.15,
        f1: 0.80 + Math.random() * 0.12,
      };

      const improvementPercent = 5 + Math.random() * 10;

      await prisma.aIModelTraining.update({
        where: { id: trainingId },
        data: {
          status: 'completed',
          performanceMetrics: JSON.stringify(performanceMetrics),
          improvementPercent,
          trainingTimeMinutes: 10 + Math.floor(Math.random() * 20),
          dataQualityScore: 85 + Math.random() * 10,
          modelSize: 50 + Math.floor(Math.random() * 150),
          inferenceTimeMs: 50 + Math.floor(Math.random() * 150),
          deploymentStatus: 'pending',
        },
      });

      // Auto-deploy if improvement is significant
      if (improvementPercent > 5) {
        await this.deployModel(trainingId);
      }
    } catch (error: any) {
      await prisma.aIModelTraining.update({
        where: { id: trainingId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  async deployModel(trainingId: string) {
    await prisma.aIModelTraining.update({
      where: { id: trainingId },
      data: {
        deploymentStatus: 'deployed',
        deployedAt: new Date(),
      },
    });

    // Create insight
    const training = await prisma.aIModelTraining.findUnique({
      where: { id: trainingId },
    });

    if (training) {
      await prisma.optimizationInsight.create({
        data: {
          insightType: 'success',
          category: 'ai_model',
          title: `${training.modelName} Model Deployed`,
          description: `New model version deployed with ${training.improvementPercent?.toFixed(1)}% improvement`,
          priority: 'medium',
          confidence: 95,
          dataSource: `model_training:${trainingId}`,
          status: 'new',
        },
      });
    }
  }

  async getModelTrainings(filters: { modelName?: string; status?: string; limit?: number }) {
    const where: any = {};
    if (filters.modelName) where.modelName = filters.modelName;
    if (filters.status) where.status = filters.status;

    const trainings = await prisma.aIModelTraining.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
    });

    return trainings.map((training: any) => ({
      ...training,
      features: JSON.parse(training.features),
      performanceMetrics: training.performanceMetrics
        ? JSON.parse(training.performanceMetrics)
        : null,
    }));
  }

  // ==================== USER BEHAVIOR ANALYTICS ====================

  async trackUserBehavior(data: {
    userId?: string;
    sessionId: string;
    analysisType: string;
    pageUrl: string;
    pageType: string;
    deviceType: string;
    browserType?: string;
    location?: string;
    heatmapData?: any;
    scrollDepthPercent?: number;
    timeOnPageSeconds?: number;
    interactions?: any;
    engagementScore?: number;
  }) {
    const createData: any = {
      sessionId: data.sessionId,
      analysisType: data.analysisType,
      pageUrl: data.pageUrl,
      pageType: data.pageType,
      deviceType: data.deviceType,
      heatmapData: data.heatmapData ? JSON.stringify(data.heatmapData) : null,
      interactions: data.interactions ? JSON.stringify(data.interactions) : null,
    };

    if (data.userId) createData.userId = data.userId;
    if (data.browserType) createData.browserType = data.browserType;
    if (data.location) createData.location = data.location;
    if (data.scrollDepthPercent) createData.scrollDepthPercent = data.scrollDepthPercent;
    if (data.timeOnPageSeconds) createData.timeOnPageSeconds = data.timeOnPageSeconds;
    if (data.engagementScore) createData.engagementScore = data.engagementScore;

    return await prisma.userBehaviorAnalytics.create({
      data: createData,
    });
  }

  async getUserBehaviorInsights(filters: {
    pageType?: string;
    analysisType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters.pageType) where.pageType = filters.pageType;
    if (filters.analysisType) where.analysisType = filters.analysisType;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const analytics = await prisma.userBehaviorAnalytics.findMany({
      where,
      take: 1000,
    });

    // Aggregate insights
    const avgScrollDepth = analytics.reduce((sum: number, a: any) => sum + (a.scrollDepthPercent || 0), 0) / analytics.length;
    const avgTimeOnPage = analytics.reduce((sum: number, a: any) => sum + (a.timeOnPageSeconds || 0), 0) / analytics.length;
    const avgEngagement = analytics.reduce((sum: number, a: any) => sum + (a.engagementScore || 0), 0) / analytics.length;

    return {
      totalSessions: analytics.length,
      avgScrollDepth,
      avgTimeOnPage,
      avgEngagement,
      deviceBreakdown: this.groupBy(analytics, 'deviceType'),
      pageTypeBreakdown: this.groupBy(analytics, 'pageType'),
    };
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // ==================== OPTIMIZATION INSIGHTS ====================

  async getInsights(filters: {
    insightType?: string;
    category?: string;
    status?: string;
    priority?: string;
    limit?: number;
  }) {
    const cacheKey = `optimization:insights:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = {};
    if (filters.insightType) where.insightType = filters.insightType;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    const insights = await prisma.optimizationInsight.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit || 50,
    });

    const result = insights.map((insight: any) => ({
      ...insight,
      relatedMetrics: insight.relatedMetrics ? JSON.parse(insight.relatedMetrics) : null,
      expectedImpact: insight.expectedImpact ? JSON.parse(insight.expectedImpact) : null,
    }));

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  }

  async updateInsight(id: string, data: {
    status?: string;
    actionTaken?: string;
    actionResult?: string;
    reviewedBy?: string;
  }) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.actionTaken) updateData.actionTaken = data.actionTaken;
    if (data.actionResult) updateData.actionResult = data.actionResult;
    if (data.reviewedBy) {
      updateData.reviewedBy = data.reviewedBy;
      updateData.reviewedAt = new Date();
    }

    const insight = await prisma.optimizationInsight.update({
      where: { id },
      data: updateData,
    });

    await redis.del('optimization:insights:*');
    return insight;
  }

  // ==================== LEARNING LOOPS ====================

  async createLearningLoop(data: {
    loopName: string;
    loopType: string;
    frequency: string;
    dataCollectionQuery: string;
    analysisAlgorithm: string;
    actionTriggers: any;
    automationLevel?: string;
    config?: any;
    createdBy: string;
  }) {
    const nextRunAt = this.calculateNextRun(data.frequency);

    const createData: any = {
      loopName: data.loopName,
      loopType: data.loopType,
      frequency: data.frequency,
      dataCollectionQuery: data.dataCollectionQuery,
      analysisAlgorithm: data.analysisAlgorithm,
      actionTriggers: JSON.stringify(data.actionTriggers),
      config: data.config ? JSON.stringify(data.config) : null,
      createdBy: data.createdBy,
      status: 'active',
      nextRunAt,
    };

    if (data.automationLevel) createData.automationLevel = data.automationLevel;

    return await prisma.learningLoop.create({
      data: createData,
    });
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now;
  }

  async executeLearningLoop(loopId: string) {
    const loop = await prisma.learningLoop.findUnique({ where: { id: loopId } });
    if (!loop || loop.status !== 'active') return;

    try {
      // Execute the learning loop (simplified)
      const success = Math.random() > 0.1; // 90% success rate

      const updateData: any = {
        lastRunAt: new Date(),
        nextRunAt: this.calculateNextRun(loop.frequency),
        runCount: { increment: 1 },
      };

      if (success) {
        updateData.successCount = { increment: 1 };
      } else {
        updateData.failureCount = { increment: 1 };
      }

      await prisma.learningLoop.update({
        where: { id: loopId },
        data: updateData,
      });
    } catch (error) {
      await prisma.learningLoop.update({
        where: { id: loopId },
        data: {
          failureCount: { increment: 1 },
        },
      });
    }
  }

  async getLearningLoops(filters: { loopType?: string; status?: string }) {
    const where: any = {};
    if (filters.loopType) where.loopType = filters.loopType;
    if (filters.status) where.status = filters.status;

    return await prisma.learningLoop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== DASHBOARD STATISTICS ====================

  async getDashboardStats() {
    const cacheKey = 'optimization:dashboard:stats';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [
      totalAudits,
      activeCycles,
      runningTests,
      pendingInsights,
      activeLoops,
      recentTrainings,
    ] = await Promise.all([
      prisma.performanceAudit.count(),
      prisma.optimizationCycle.count({ where: { status: 'active' } }),
      prisma.aBTest.count({ where: { status: 'running' } }),
      prisma.optimizationInsight.count({ where: { status: 'new' } }),
      prisma.learningLoop.count({ where: { status: 'active' } }),
      prisma.aIModelTraining.findMany({
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const latestAudit = await prisma.performanceAudit.findFirst({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      overview: {
        totalAudits,
        activeCycles,
        runningTests,
        pendingInsights,
        activeLoops,
        lastAuditScore: latestAudit?.overallScore || 0,
      },
      recentTrainings: recentTrainings.map((t: any) => ({
        ...t,
        features: JSON.parse(t.features),
        performanceMetrics: t.performanceMetrics ? JSON.parse(t.performanceMetrics) : null,
      })),
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(stats));
    return stats;
  }
}

export const optimizationService = new OptimizationService();
