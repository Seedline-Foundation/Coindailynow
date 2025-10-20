import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Technical SEO Service
 * Handles all technical SEO auditing, monitoring, and optimization
 * Task 79: Technical SEO Audit & Implementation
 */

interface AuditResult {
  success: boolean;
  auditId?: string;
  scores?: any;
  issues?: any;
  recommendations?: any;
  error?: string;
}

interface CoreWebVitalsData {
  url: string;
  pageType: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  tbt: number;
  deviceType?: string;
  connectionType?: string;
}

interface SecurityCheckResult {
  hasHTTPS: boolean;
  sslCertValid: boolean;
  securityHeaders: any;
  securityScore: number;
  issues: string[];
}

export const technicalSeoService = {
  /**
   * Run comprehensive technical SEO audit
   */
  async runFullAudit(): Promise<AuditResult> {
    try {
      const audit = await prisma.technicalSEOAudit.create({
        data: {
          auditType: 'FULL',
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Run all audit components
      const [speedResults, mobileResults, crawlResults, securityResults, indexResults] = await Promise.all([
        this.auditSiteSpeed(),
        this.auditMobileOptimization(),
        this.auditCrawlability(),
        this.auditSecurity(),
        this.auditIndexability(),
      ]);

      // Calculate overall scores
      const overallScore = (
        speedResults.score +
        mobileResults.score +
        crawlResults.score +
        securityResults.score +
        indexResults.score
      ) / 5;

      // Count issues
      const criticalIssues = 
        speedResults.criticalIssues +
        mobileResults.criticalIssues +
        crawlResults.criticalIssues +
        securityResults.criticalIssues +
        indexResults.criticalIssues;

      const warningIssues =
        speedResults.warningIssues +
        mobileResults.warningIssues +
        crawlResults.warningIssues +
        securityResults.warningIssues +
        indexResults.warningIssues;

      const infoIssues =
        speedResults.infoIssues +
        mobileResults.infoIssues +
        crawlResults.infoIssues +
        securityResults.infoIssues +
        indexResults.infoIssues;

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        speed: speedResults,
        mobile: mobileResults,
        crawl: crawlResults,
        security: securityResults,
        index: indexResults,
      });

      // Update audit with results
      const completedAudit = await prisma.technicalSEOAudit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          overallScore,
          speedScore: speedResults.score,
          mobileScore: mobileResults.score,
          crawlabilityScore: crawlResults.score,
          securityScore: securityResults.score,
          indexabilityScore: indexResults.score,
          criticalIssues,
          warningIssues,
          infoIssues,
          issuesDetails: JSON.stringify({
            speed: speedResults.issues,
            mobile: mobileResults.issues,
            crawl: crawlResults.issues,
            security: securityResults.issues,
            index: indexResults.issues,
          }),
          recommendations: JSON.stringify(recommendations),
          estimatedImpact: JSON.stringify(this.calculateImpact(recommendations)),
          completedAt: new Date(),
          auditDuration: Date.now() - audit.startedAt.getTime(),
          nextAuditScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update metrics
      await this.updatePerformanceMetrics();

      return {
        success: true,
        auditId: completedAudit.id,
        scores: {
          overall: overallScore,
          speed: speedResults.score,
          mobile: mobileResults.score,
          crawlability: crawlResults.score,
          security: securityResults.score,
          indexability: indexResults.score,
        },
        issues: {
          critical: criticalIssues,
          warning: warningIssues,
          info: infoIssues,
        },
        recommendations,
      };
    } catch (error: any) {
      console.error('Full audit error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Audit site speed and Core Web Vitals
   */
  async auditSiteSpeed(): Promise<any> {
    try {
      // Simulate speed audit (in production, integrate with Google PageSpeed Insights API)
      const pages = [
        { url: '/', type: 'HOME' },
        { url: '/articles/bitcoin-africa', type: 'ARTICLE' },
        { url: '/category/defi', type: 'CATEGORY' },
      ];

      const vitalsData: any[] = [];
      let totalScore = 0;
      let criticalIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;
      const issues: string[] = [];

      for (const page of pages) {
        // Simulated metrics (replace with actual measurements)
        const lcp = Math.random() * 4000; // 0-4s
        const fid = Math.random() * 300; // 0-300ms
        const cls = Math.random() * 0.25; // 0-0.25
        const fcp = Math.random() * 3000; // 0-3s
        const ttfb = Math.random() * 800; // 0-800ms
        const tbt = Math.random() * 600; // 0-600ms

        // Calculate ratings
        const lcpRating = lcp < 2500 ? 'GOOD' : lcp < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR';
        const fidRating = fid < 100 ? 'GOOD' : fid < 300 ? 'NEEDS_IMPROVEMENT' : 'POOR';
        const clsRating = cls < 0.1 ? 'GOOD' : cls < 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';

        // Calculate performance score (0-100)
        const performanceScore = Math.max(0, Math.min(100, 
          100 - (lcp / 40) - (fid / 3) - (cls * 400) - (fcp / 30) - (ttfb / 8) - (tbt / 6)
        ));

        // Store Core Web Vitals
        await prisma.coreWebVitals.create({
          data: {
            url: page.url,
            pageType: page.type,
            lcp,
            fid,
            cls,
            fcp,
            ttfb,
            tbt,
            performanceScore,
            lcpRating,
            fidRating,
            clsRating,
            deviceType: 'DESKTOP',
            connectionType: '4G',
            totalPageSize: 1500 + Math.random() * 1000,
            totalRequests: 50 + Math.floor(Math.random() * 50),
            javascriptSize: 500 + Math.random() * 300,
            cssSize: 200 + Math.random() * 100,
            imageSize: 600 + Math.random() * 400,
            fontSize: 100 + Math.random() * 50,
          },
        });

        vitalsData.push({ url: page.url, performanceScore });
        totalScore += performanceScore;

        // Identify issues
        if (lcpRating === 'POOR') {
          criticalIssues++;
          issues.push(`Critical: LCP is ${lcp.toFixed(0)}ms on ${page.url} (target: <2500ms)`);
        } else if (lcpRating === 'NEEDS_IMPROVEMENT') {
          warningIssues++;
          issues.push(`Warning: LCP needs improvement on ${page.url}`);
        }

        if (fidRating === 'POOR') {
          criticalIssues++;
          issues.push(`Critical: FID is ${fid.toFixed(0)}ms on ${page.url} (target: <100ms)`);
        }

        if (clsRating === 'POOR') {
          criticalIssues++;
          issues.push(`Critical: CLS is ${cls.toFixed(3)} on ${page.url} (target: <0.1)`);
        }

        if (performanceScore < 50) {
          criticalIssues++;
          issues.push(`Critical: Performance score is ${performanceScore.toFixed(0)} on ${page.url}`);
        } else if (performanceScore < 90) {
          warningIssues++;
          issues.push(`Warning: Performance score could be improved on ${page.url}`);
        } else {
          infoIssues++;
        }
      }

      const avgScore = totalScore / pages.length;

      return {
        success: true,
        score: avgScore,
        criticalIssues,
        warningIssues,
        infoIssues,
        issues,
        vitals: vitalsData,
      };
    } catch (error: any) {
      console.error('Speed audit error:', error);
      return {
        success: false,
        score: 0,
        criticalIssues: 1,
        warningIssues: 0,
        infoIssues: 0,
        issues: [`Error running speed audit: ${error.message}`],
      };
    }
  },

  /**
   * Audit mobile optimization
   */
  async auditMobileOptimization(): Promise<any> {
    try {
      const pages = ['/', '/articles/bitcoin-africa', '/category/defi'];
      let totalScore = 0;
      let criticalIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;
      const issues: string[] = [];

      for (const url of pages) {
        // Simulate mobile audit
        const hasViewportMeta = Math.random() > 0.1;
        const touchTargetsProper = Math.random() > 0.2;
        const contentFitsViewport = Math.random() > 0.1;
        const textSizeAppropriate = Math.random() > 0.15;

        const isMobileFriendly = hasViewportMeta && touchTargetsProper && contentFitsViewport;
        const mobileScore = (
          (hasViewportMeta ? 25 : 0) +
          (touchTargetsProper ? 25 : 0) +
          (contentFitsViewport ? 25 : 0) +
          (textSizeAppropriate ? 25 : 0)
        );

        await prisma.mobileSEO.create({
          data: {
            url,
            isMobileFriendly,
            mobileScore,
            hasViewportMeta,
            viewportContent: hasViewportMeta ? 'width=device-width, initial-scale=1' : null,
            touchTargetsProper,
            minTouchTargetSize: touchTargetsProper ? 48 : 32,
            touchElementsCount: 25 + Math.floor(Math.random() * 50),
            contentFitsViewport,
            textSizeAppropriate,
            mobileLCP: 2000 + Math.random() * 2000,
            mobileFID: 50 + Math.random() * 200,
            mobileCLS: Math.random() * 0.2,
            flashUsed: false,
            hasMediaQueries: true,
            mobileIndexable: true,
          },
        });

        totalScore += mobileScore;

        // Identify issues
        if (!hasViewportMeta) {
          criticalIssues++;
          issues.push(`Critical: Missing viewport meta tag on ${url}`);
        }

        if (!touchTargetsProper) {
          warningIssues++;
          issues.push(`Warning: Touch targets too small on ${url}`);
        }

        if (!contentFitsViewport) {
          criticalIssues++;
          issues.push(`Critical: Content doesn't fit viewport on ${url}`);
        }

        if (!textSizeAppropriate) {
          warningIssues++;
          issues.push(`Warning: Text size too small for mobile on ${url}`);
        }

        if (!isMobileFriendly) {
          criticalIssues++;
        } else {
          infoIssues++;
        }
      }

      const avgScore = totalScore / pages.length;

      return {
        success: true,
        score: avgScore,
        criticalIssues,
        warningIssues,
        infoIssues,
        issues,
      };
    } catch (error: any) {
      console.error('Mobile audit error:', error);
      return {
        success: false,
        score: 0,
        criticalIssues: 1,
        warningIssues: 0,
        infoIssues: 0,
        issues: [`Error running mobile audit: ${error.message}`],
      };
    }
  },

  /**
   * Audit crawlability
   */
  async auditCrawlability(): Promise<any> {
    try {
      // Simulate crawlability audit
      const hasRobotsTxt = true;
      const robotsTxtValid = true;
      const hasSitemap = true;
      const sitemapValid = true;
      const sitemapUrlCount = 150 + Math.floor(Math.random() * 100);

      const crawlablePages = sitemapUrlCount;
      const blockedPages = Math.floor(Math.random() * 5);
      const crawlErrors = Math.floor(Math.random() * 3);

      const totalInternalLinks = 500 + Math.floor(Math.random() * 500);
      const brokenInternalLinks = Math.floor(Math.random() * 10);
      const redirectChains = Math.floor(Math.random() * 5);

      const totalExternalLinks = 100 + Math.floor(Math.random() * 100);
      const brokenExternalLinks = Math.floor(Math.random() * 5);

      const pages200 = crawlablePages - blockedPages - crawlErrors;
      const pages301 = Math.floor(Math.random() * 20);
      const pages404 = crawlErrors;
      const pages500 = 0;

      const crawlEfficiency = Math.max(0, Math.min(100,
        100 - (blockedPages * 2) - (crawlErrors * 5) - (brokenInternalLinks * 3)
      ));

      await prisma.crawlabilityAudit.create({
        data: {
          hasRobotsTxt,
          robotsTxtValid,
          robotsTxtContent: 'User-agent: *\nAllow: /\nSitemap: https://coindaily.africa/sitemap.xml',
          hasSitemap,
          sitemapUrl: 'https://coindaily.africa/sitemap.xml',
          sitemapValid,
          sitemapUrlCount,
          crawlablePages,
          blockedPages,
          crawlErrors,
          totalInternalLinks,
          brokenInternalLinks,
          redirectChains,
          totalExternalLinks,
          brokenExternalLinks,
          crawlRate: 500,
          crawlEfficiency,
          pages200,
          pages301,
          pages302: 0,
          pages404,
          pages500,
          orphanedPages: JSON.stringify([]),
          deepPages: JSON.stringify([]),
          duplicateContent: JSON.stringify([]),
        },
      });

      const issues: string[] = [];
      let criticalIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;

      if (!hasRobotsTxt) {
        criticalIssues++;
        issues.push('Critical: Missing robots.txt file');
      }

      if (!hasSitemap) {
        criticalIssues++;
        issues.push('Critical: Missing XML sitemap');
      }

      if (brokenInternalLinks > 5) {
        warningIssues++;
        issues.push(`Warning: ${brokenInternalLinks} broken internal links found`);
      }

      if (redirectChains > 0) {
        warningIssues++;
        issues.push(`Warning: ${redirectChains} redirect chains detected`);
      }

      if (crawlErrors > 0) {
        criticalIssues++;
        issues.push(`Critical: ${crawlErrors} crawl errors found`);
      }

      if (crawlEfficiency < 90) {
        warningIssues++;
        issues.push(`Warning: Crawl efficiency is ${crawlEfficiency.toFixed(0)}% (target: >90%)`);
      } else {
        infoIssues++;
      }

      return {
        success: true,
        score: crawlEfficiency,
        criticalIssues,
        warningIssues,
        infoIssues,
        issues,
      };
    } catch (error: any) {
      console.error('Crawlability audit error:', error);
      return {
        success: false,
        score: 0,
        criticalIssues: 1,
        warningIssues: 0,
        infoIssues: 0,
        issues: [`Error running crawlability audit: ${error.message}`],
      };
    }
  },

  /**
   * Audit security
   */
  async auditSecurity(): Promise<any> {
    try {
      // Simulate security audit
      const hasHTTPS = true;
      const httpRedirectsHTTPS = true;
      const sslCertValid = true;
      const hasHSTS = Math.random() > 0.3;
      const hasCSP = Math.random() > 0.4;
      const hasXFrameOptions = Math.random() > 0.2;
      const hasXContentType = Math.random() > 0.2;
      const hasXXSSProtection = Math.random() > 0.3;
      const hasMixedContent = Math.random() < 0.1;

      const securityScore = (
        (hasHTTPS ? 20 : 0) +
        (sslCertValid ? 20 : 0) +
        (hasHSTS ? 15 : 0) +
        (hasCSP ? 15 : 0) +
        (hasXFrameOptions ? 10 : 0) +
        (hasXContentType ? 10 : 0) +
        (hasXXSSProtection ? 10 : 0) +
        (hasMixedContent ? 0 : 10)
      );

      await prisma.securityAudit.create({
        data: {
          hasHTTPS,
          httpRedirectsHTTPS,
          sslCertValid,
          sslProvider: 'Let\'s Encrypt',
          sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          hasHSTS,
          hstsMaxAge: hasHSTS ? 31536000 : null,
          hasCSP,
          cspDirectives: hasCSP ? JSON.stringify({
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
          }) : null,
          hasXFrameOptions,
          xFrameOptions: hasXFrameOptions ? 'SAMEORIGIN' : null,
          hasXContentType,
          hasXXSSProtection,
          securityScore,
          hasMixedContent,
          mixedContentUrls: hasMixedContent ? JSON.stringify(['http://example.com/image.jpg']) : null,
          malwareDetected: false,
          blacklisted: false,
        },
      });

      const issues: string[] = [];
      let criticalIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;

      if (!hasHTTPS) {
        criticalIssues++;
        issues.push('Critical: Site not using HTTPS');
      }

      if (!sslCertValid) {
        criticalIssues++;
        issues.push('Critical: Invalid SSL certificate');
      }

      if (!hasHSTS) {
        warningIssues++;
        issues.push('Warning: Missing HSTS header');
      }

      if (!hasCSP) {
        warningIssues++;
        issues.push('Warning: Missing Content Security Policy');
      }

      if (!hasXFrameOptions) {
        warningIssues++;
        issues.push('Warning: Missing X-Frame-Options header');
      }

      if (hasMixedContent) {
        criticalIssues++;
        issues.push('Critical: Mixed content detected (HTTP resources on HTTPS page)');
      }

      if (securityScore < 70) {
        criticalIssues++;
        issues.push(`Critical: Security score is ${securityScore} (target: >90)`);
      } else if (securityScore < 90) {
        warningIssues++;
        issues.push(`Warning: Security score could be improved (${securityScore}/100)`);
      } else {
        infoIssues++;
      }

      return {
        success: true,
        score: securityScore,
        criticalIssues,
        warningIssues,
        infoIssues,
        issues,
      };
    } catch (error: any) {
      console.error('Security audit error:', error);
      return {
        success: false,
        score: 0,
        criticalIssues: 1,
        warningIssues: 0,
        infoIssues: 0,
        issues: [`Error running security audit: ${error.message}`],
      };
    }
  },

  /**
   * Audit indexability
   */
  async auditIndexability(): Promise<any> {
    try {
      const pages = [
        { url: '/', type: 'HOME' },
        { url: '/articles/bitcoin-africa', type: 'ARTICLE' },
        { url: '/category/defi', type: 'CATEGORY' },
      ];

      let totalScore = 0;
      let criticalIssues = 0;
      let warningIssues = 0;
      let infoIssues = 0;
      const issues: string[] = [];

      for (const page of pages) {
        const isIndexable = Math.random() > 0.05;
        const isIndexed = isIndexable && Math.random() > 0.1;
        const hasNoIndex = !isIndexable;
        const hasCanonical = Math.random() > 0.1;
        const canonicalSelfRef = hasCanonical && Math.random() > 0.2;
        const hasStructuredData = Math.random() > 0.2;
        const hasH1 = Math.random() > 0.05;
        const h1Count = hasH1 ? 1 : 0;
        const hasMetaDescription = Math.random() > 0.1;
        const metaDescLength = hasMetaDescription ? 120 + Math.floor(Math.random() * 40) : 0;
        const hasTitleTag = Math.random() > 0.05;
        const titleLength = hasTitleTag ? 40 + Math.floor(Math.random() * 30) : 0;
        const contentLength = 500 + Math.floor(Math.random() * 1500);
        const contentQuality = 60 + Math.random() * 40;

        const pageScore = (
          (isIndexable ? 20 : 0) +
          (hasCanonical ? 15 : 0) +
          (hasStructuredData ? 15 : 0) +
          (hasH1 ? 15 : 0) +
          (hasMetaDescription ? 15 : 0) +
          (hasTitleTag ? 20 : 0)
        );

        await prisma.indexabilityCheck.create({
          data: {
            url: page.url,
            isIndexable,
            isIndexed,
            googleIndexStatus: isIndexed ? 'INDEXED' : isIndexable ? 'NOT_INDEXED' : 'BLOCKED',
            hasNoIndex,
            hasNoFollow: false,
            metaRobotsContent: hasNoIndex ? 'noindex, nofollow' : 'index, follow',
            hasCanonical,
            canonicalUrl: hasCanonical ? `https://coindaily.africa${page.url}` : null,
            canonicalSelfRef,
            hasStructuredData,
            structuredDataTypes: hasStructuredData ? 
              JSON.stringify(['Article', 'BreadcrumbList', 'Organization']) : null,
            contentLength,
            contentQuality,
            hasH1,
            h1Count,
            hasMetaDescription,
            metaDescLength,
            hasTitleTag,
            titleLength,
          },
        });

        totalScore += pageScore;

        // Identify issues
        if (!isIndexable) {
          criticalIssues++;
          issues.push(`Critical: Page ${page.url} is not indexable (noindex tag)`);
        }

        if (!hasTitleTag) {
          criticalIssues++;
          issues.push(`Critical: Missing title tag on ${page.url}`);
        }

        if (!hasMetaDescription) {
          warningIssues++;
          issues.push(`Warning: Missing meta description on ${page.url}`);
        }

        if (!hasH1) {
          warningIssues++;
          issues.push(`Warning: Missing H1 tag on ${page.url}`);
        }

        if (!hasCanonical) {
          warningIssues++;
          issues.push(`Warning: Missing canonical tag on ${page.url}`);
        }

        if (!hasStructuredData) {
          infoIssues++;
          issues.push(`Info: Consider adding structured data to ${page.url}`);
        }

        if (contentLength < 300) {
          warningIssues++;
          issues.push(`Warning: Thin content on ${page.url} (${contentLength} characters)`);
        }
      }

      const avgScore = totalScore / pages.length;

      return {
        success: true,
        score: avgScore,
        criticalIssues,
        warningIssues,
        infoIssues,
        issues,
      };
    } catch (error: any) {
      console.error('Indexability audit error:', error);
      return {
        success: false,
        score: 0,
        criticalIssues: 1,
        warningIssues: 0,
        infoIssues: 0,
        issues: [`Error running indexability audit: ${error.message}`],
      };
    }
  },

  /**
   * Generate recommendations from audit results
   */
  generateRecommendations(auditResults: any): any[] {
    const recommendations: any[] = [];

    // Speed recommendations
    if (auditResults.speed.score < 90) {
      recommendations.push({
        category: 'SPEED',
        priority: auditResults.speed.score < 50 ? 'CRITICAL' : 'HIGH',
        title: 'Improve Core Web Vitals',
        description: 'Optimize images, minify CSS/JS, enable caching, use CDN',
        impact: 'HIGH',
        effort: 'MEDIUM',
        estimatedScoreGain: Math.min(40, 90 - auditResults.speed.score),
      });
    }

    // Mobile recommendations
    if (auditResults.mobile.score < 90) {
      recommendations.push({
        category: 'MOBILE',
        priority: auditResults.mobile.score < 50 ? 'CRITICAL' : 'HIGH',
        title: 'Enhance Mobile Optimization',
        description: 'Add viewport meta, increase touch targets, optimize mobile layout',
        impact: 'HIGH',
        effort: 'LOW',
        estimatedScoreGain: Math.min(30, 90 - auditResults.mobile.score),
      });
    }

    // Crawlability recommendations
    if (auditResults.crawl.score < 95) {
      recommendations.push({
        category: 'CRAWLABILITY',
        priority: 'MEDIUM',
        title: 'Optimize Crawlability',
        description: 'Fix broken links, optimize robots.txt, update sitemap',
        impact: 'MEDIUM',
        effort: 'LOW',
        estimatedScoreGain: Math.min(20, 95 - auditResults.crawl.score),
      });
    }

    // Security recommendations
    if (auditResults.security.score < 90) {
      recommendations.push({
        category: 'SECURITY',
        priority: auditResults.security.score < 70 ? 'CRITICAL' : 'HIGH',
        title: 'Strengthen Security',
        description: 'Add security headers (HSTS, CSP, X-Frame-Options), fix mixed content',
        impact: 'HIGH',
        effort: 'LOW',
        estimatedScoreGain: Math.min(30, 95 - auditResults.security.score),
      });
    }

    // Indexability recommendations
    if (auditResults.index.score < 90) {
      recommendations.push({
        category: 'INDEXABILITY',
        priority: 'HIGH',
        title: 'Improve Indexability',
        description: 'Add missing meta tags, structured data, canonical tags',
        impact: 'HIGH',
        effort: 'MEDIUM',
        estimatedScoreGain: Math.min(35, 90 - auditResults.index.score),
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder: any = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  /**
   * Calculate impact of recommendations
   */
  calculateImpact(recommendations: any[]): any {
    const totalScoreGain = recommendations.reduce((sum: number, rec: any) => sum + rec.estimatedScoreGain, 0);
    
    return {
      totalRecommendations: recommendations.length,
      criticalRecommendations: recommendations.filter((r: any) => r.priority === 'CRITICAL').length,
      highPriorityRecommendations: recommendations.filter((r: any) => r.priority === 'HIGH').length,
      estimatedTotalScoreGain: totalScoreGain,
      estimatedTimeToComplete: recommendations.reduce((sum: number, rec: any) => {
        const effortHours: any = { LOW: 2, MEDIUM: 8, HIGH: 24 };
        return sum + effortHours[rec.effort];
      }, 0),
    };
  },

  /**
   * Update performance metrics
   */
  async updatePerformanceMetrics(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get latest audit
      const latestAudit = await prisma.technicalSEOAudit.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
      });

      if (!latestAudit) return;

      // Calculate averages from Core Web Vitals
      const vitals = await prisma.coreWebVitals.findMany({
        where: {
          measuredAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const avgLCP = vitals.length > 0 
        ? vitals.reduce((sum: number, v: any) => sum + v.lcp, 0) / vitals.length 
        : null;
      const avgFID = vitals.length > 0
        ? vitals.reduce((sum: number, v: any) => sum + v.fid, 0) / vitals.length
        : null;
      const avgCLS = vitals.length > 0
        ? vitals.reduce((sum: number, v: any) => sum + v.cls, 0) / vitals.length
        : null;
      const avgFCP = vitals.length > 0
        ? vitals.reduce((sum: number, v: any) => sum + v.fcp, 0) / vitals.length
        : null;
      const avgTTFB = vitals.length > 0
        ? vitals.reduce((sum: number, v: any) => sum + v.ttfb, 0) / vitals.length
        : null;

      // Calculate page stats
      const indexabilityChecks = await prisma.indexabilityCheck.findMany({
        where: {
          checkedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      const totalPages = indexabilityChecks.length;
      const indexedPages = indexabilityChecks.filter((c: any) => c.isIndexed).length;
      const indexablePages = indexabilityChecks.filter((c: any) => c.isIndexable).length;
      const blockedPages = indexabilityChecks.filter((c: any) => !c.isIndexable).length;

      // Get previous day's metrics for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const previousMetrics = await prisma.sEOPerformanceMetrics.findUnique({
        where: { metricDate: yesterday },
      });

      const scoreChange = previousMetrics 
        ? latestAudit.overallScore - previousMetrics.seoHealthScore 
        : null;

      // Create or update today's metrics
      await prisma.sEOPerformanceMetrics.upsert({
        where: { metricDate: today },
        create: {
          metricDate: today,
          seoHealthScore: latestAudit.overallScore,
          speedScore: latestAudit.speedScore,
          mobileScore: latestAudit.mobileScore,
          crawlabilityScore: latestAudit.crawlabilityScore,
          securityScore: latestAudit.securityScore,
          indexabilityScore: latestAudit.indexabilityScore,
          avgLCP,
          avgFID,
          avgCLS,
          avgFCP,
          avgTTFB,
          totalPages,
          indexedPages,
          indexablePages,
          blockedPages,
          totalCriticalIssues: latestAudit.criticalIssues,
          totalWarningIssues: latestAudit.warningIssues,
          totalInfoIssues: latestAudit.infoIssues,
          scoreChange,
          issuesResolved: 0,
          newIssuesFound: latestAudit.criticalIssues + latestAudit.warningIssues,
        },
        update: {
          seoHealthScore: latestAudit.overallScore,
          speedScore: latestAudit.speedScore,
          mobileScore: latestAudit.mobileScore,
          crawlabilityScore: latestAudit.crawlabilityScore,
          securityScore: latestAudit.securityScore,
          indexabilityScore: latestAudit.indexabilityScore,
          avgLCP,
          avgFID,
          avgCLS,
          avgFCP,
          avgTTFB,
          totalPages,
          indexedPages,
          indexablePages,
          blockedPages,
          totalCriticalIssues: latestAudit.criticalIssues,
          totalWarningIssues: latestAudit.warningIssues,
          totalInfoIssues: latestAudit.infoIssues,
          scoreChange,
        },
      });
    } catch (error: any) {
      console.error('Error updating performance metrics:', error);
    }
  },

  /**
   * Get audit history
   */
  async getAuditHistory(limit: number = 10): Promise<any> {
    try {
      const audits = await prisma.technicalSEOAudit.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: limit,
      });

      return {
        success: true,
        audits: audits.map((audit: any) => ({
          id: audit.id,
          type: audit.auditType,
          overallScore: audit.overallScore,
          scores: {
            speed: audit.speedScore,
            mobile: audit.mobileScore,
            crawlability: audit.crawlabilityScore,
            security: audit.securityScore,
            indexability: audit.indexabilityScore,
          },
          issues: {
            critical: audit.criticalIssues,
            warning: audit.warningIssues,
            info: audit.infoIssues,
          },
          completedAt: audit.completedAt,
          duration: audit.auditDuration,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<any> {
    try {
      const [latestMetrics, recentMetrics, latestAudit, vitals] = await Promise.all([
        prisma.sEOPerformanceMetrics.findFirst({
          orderBy: { metricDate: 'desc' },
        }),
        prisma.sEOPerformanceMetrics.findMany({
          orderBy: { metricDate: 'desc' },
          take: 30,
        }),
        prisma.technicalSEOAudit.findFirst({
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.coreWebVitals.findMany({
          orderBy: { measuredAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        success: true,
        current: latestMetrics,
        trend: recentMetrics,
        latestAudit,
        vitals,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get Core Web Vitals for specific page
   */
  async getPageVitals(url: string): Promise<any> {
    try {
      const vitals = await prisma.coreWebVitals.findMany({
        where: { url },
        orderBy: { measuredAt: 'desc' },
        take: 10,
      });

      return {
        success: true,
        vitals,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Record Core Web Vitals measurement
   */
  async recordCoreWebVitals(data: CoreWebVitalsData): Promise<any> {
    try {
      // Calculate ratings
      const lcpRating = data.lcp < 2500 ? 'GOOD' : data.lcp < 4000 ? 'NEEDS_IMPROVEMENT' : 'POOR';
      const fidRating = data.fid < 100 ? 'GOOD' : data.fid < 300 ? 'NEEDS_IMPROVEMENT' : 'POOR';
      const clsRating = data.cls < 0.1 ? 'GOOD' : data.cls < 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';

      // Calculate performance score
      const performanceScore = Math.max(0, Math.min(100,
        100 - (data.lcp / 40) - (data.fid / 3) - (data.cls * 400) - (data.fcp / 30) - (data.ttfb / 8) - (data.tbt / 6)
      ));

      const vitals = await prisma.coreWebVitals.create({
        data: {
          url: data.url,
          pageType: data.pageType,
          lcp: data.lcp,
          fid: data.fid,
          cls: data.cls,
          fcp: data.fcp,
          ttfb: data.ttfb,
          tbt: data.tbt,
          performanceScore,
          lcpRating,
          fidRating,
          clsRating,
          deviceType: data.deviceType || 'DESKTOP',
          connectionType: data.connectionType || '4G',
        },
      });

      return {
        success: true,
        vitals,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default technicalSeoService;
