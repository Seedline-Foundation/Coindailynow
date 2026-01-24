/**
 * Security Alert Service
 * Task 84: Security Alert System
 * 
 * Handles security alerts, threat detection, recommendations, compliance updates,
 * and SEO security monitoring with full CRUD operations and analytics.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types & Interfaces
// ============================================

interface CreateAlertInput {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'threat' | 'recommendation' | 'compliance' | 'seo_security';
  threatType?: string;
  threatSource?: string;
  isBlocked?: boolean;
  blockDetails?: any;
  recommendationType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: string;
  actionUrl?: string | undefined;
  complianceType?: string;
  regulatoryBody?: string;
  deadline?: Date | undefined;
  seoThreatType?: string;
  affectedUrls?: string[];
  impactScore?: number;
  showOnHomepage?: boolean;
  metadata?: any;
}

interface ThreatLogInput {
  threatType: string;
  threatSource: string;
  threatVector: string;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: any;
  requestBody?: any;
  userAgent?: string;
  detectionMethod: string;
  detectionRule?: string;
  confidenceScore?: number;
  wasBlocked: boolean;
  blockMethod?: string;
  blockDuration?: number;
  potentialDamage?: string;
  actualDamage?: string;
  country?: string;
  region?: string;
  city?: string;
}

interface RecommendationInput {
  title: string;
  description: string;
  category: string;
  priority?: string;
  currentState?: string;
  recommendedState?: string;
  impactDescription?: string;
  benefitDescription?: string;
  actionRequired: string;
  actionUrl?: string;
  estimatedTime?: number;
  difficulty?: string;
  documentationUrl?: string;
  tutorialUrl?: string;
  canAutoImplement?: boolean;
  autoImplementScript?: string;
}

interface ComplianceUpdateInput {
  title: string;
  description: string;
  complianceType: string;
  regulatoryBody: string;
  changeType: string;
  effectiveDate: Date;
  deadline?: Date;
  impactLevel?: string;
  impactDescription?: string;
  affectedAreas?: string[];
  actionsRequired: string[];
  estimatedEffort?: string;
  officialUrl?: string;
  documentationUrl?: string;
  internalGuideUrl?: string;
}

interface SEOIncidentInput {
  incidentType: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: string;
  detectedBy?: string;
  confidenceScore?: number;
  affectedUrls?: string[];
  affectedKeywords?: string[];
  rankingImpact?: number;
  trafficImpact?: number;
  impactScore?: number;
  spamLinks?: string[];
  spamDomains?: string[];
  scrapedUrls?: string[];
  scraperDomains?: string[];
}

// ============================================
// Security Alert CRUD
// ============================================

export const createSecurityAlert = async (input: CreateAlertInput) => {
  const startTime = Date.now();
  
  try {
    const alert = await prisma.securityAlert.create({
      data: {
        title: input.title,
        message: input.message,
        severity: input.severity,
        category: input.category,
        threatType: input.threatType,
        threatSource: input.threatSource,
        isBlocked: input.isBlocked || false,
        blockDetails: input.blockDetails ? JSON.stringify(input.blockDetails) : null,
        recommendationType: input.recommendationType,
        priority: input.priority || 'medium',
        actionRequired: input.actionRequired,
        actionUrl: input.actionUrl,
        complianceType: input.complianceType,
        regulatoryBody: input.regulatoryBody,
        deadline: input.deadline,
        seoThreatType: input.seoThreatType,
        affectedUrls: input.affectedUrls ? JSON.stringify(input.affectedUrls) : null,
        impactScore: input.impactScore,
        showOnHomepage: input.showOnHomepage !== undefined ? input.showOnHomepage : true,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    // Update daily metrics
    await updateDailyMetrics();

    const processingTime = Date.now() - startTime;
    console.log(`[SecurityAlert] Created alert ${alert.id} in ${processingTime}ms`);

    return {
      ...alert,
      blockDetails: alert.blockDetails ? JSON.parse(alert.blockDetails) : null,
      affectedUrls: alert.affectedUrls ? JSON.parse(alert.affectedUrls) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      relatedAlerts: alert.relatedAlerts ? JSON.parse(alert.relatedAlerts) : null,
    };
  } catch (error) {
    console.error('[SecurityAlert] Error creating alert:', error);
    throw error;
  }
};

export const getSecurityAlerts = async (filters?: {
  category?: string;
  severity?: string;
  isDismissed?: boolean;
  showOnHomepage?: boolean;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.category) where.category = filters.category;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.isDismissed !== undefined) where.isDismissed = filters.isDismissed;
    if (filters?.showOnHomepage !== undefined) where.showOnHomepage = filters.showOnHomepage;

    const [alerts, total] = await Promise.all([
      prisma.securityAlert.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.securityAlert.count({ where }),
    ]);

    return {
      alerts: alerts.map((alert: any) => ({
        ...alert,
        blockDetails: alert.blockDetails ? JSON.parse(alert.blockDetails) : null,
        affectedUrls: alert.affectedUrls ? JSON.parse(alert.affectedUrls) : null,
        metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
        relatedAlerts: alert.relatedAlerts ? JSON.parse(alert.relatedAlerts) : null,
        actionDetails: alert.actionDetails ? JSON.parse(alert.actionDetails) : null,
      })),
      total,
      hasMore: total > (filters?.offset || 0) + (filters?.limit || 50),
    };
  } catch (error) {
    console.error('[SecurityAlert] Error getting alerts:', error);
    throw error;
  }
};

export const dismissAlert = async (alertId: string, userId: string) => {
  try {
    const alert = await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        isDismissed: true,
        dismissedBy: userId,
        dismissedAt: new Date(),
        isRead: true,
      },
    });

    await updateDailyMetrics();

    return alert;
  } catch (error) {
    console.error('[SecurityAlert] Error dismissing alert:', error);
    throw error;
  }
};

export const takeActionOnAlert = async (
  alertId: string,
  userId: string,
  actionDetails: any
) => {
  try {
    const alert = await prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        actionTaken: true,
        actionDetails: JSON.stringify(actionDetails),
        actionTakenAt: new Date(),
        actionTakenBy: userId,
        isRead: true,
      },
    });

    await updateDailyMetrics();

    return alert;
  } catch (error) {
    console.error('[SecurityAlert] Error taking action on alert:', error);
    throw error;
  }
};

export const markAlertAsRead = async (alertId: string) => {
  try {
    return await prisma.securityAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error('[SecurityAlert] Error marking alert as read:', error);
    throw error;
  }
};

// ============================================
// Threat Logging
// ============================================

export const logThreat = async (input: ThreatLogInput) => {
  try {
    const threat = await prisma.threatLog.create({
      data: {
        threatType: input.threatType,
        threatSource: input.threatSource,
        threatVector: input.threatVector,
        requestUrl: input.requestUrl,
        requestMethod: input.requestMethod,
        requestHeaders: input.requestHeaders ? JSON.stringify(input.requestHeaders) : null,
        requestBody: input.requestBody ? JSON.stringify(input.requestBody) : null,
        userAgent: input.userAgent,
        detectionMethod: input.detectionMethod,
        detectionRule: input.detectionRule,
        confidenceScore: input.confidenceScore || 0,
        wasBlocked: input.wasBlocked,
        blockMethod: input.blockMethod,
        blockDuration: input.blockDuration,
        potentialDamage: input.potentialDamage,
        actualDamage: input.actualDamage,
        country: input.country,
        region: input.region,
        city: input.city,
        blockedAt: input.wasBlocked ? new Date() : null,
      },
    });

    // Create alert for high-confidence threats
    if (input.confidenceScore && input.confidenceScore > 80) {
      await createSecurityAlert({
        title: `${input.threatType.toUpperCase()} Threat Detected`,
        message: `High-confidence threat detected from ${input.threatSource}`,
        severity: input.wasBlocked ? 'medium' : 'high',
        category: 'threat',
        threatType: input.threatType,
        threatSource: input.threatSource,
        isBlocked: input.wasBlocked,
        blockDetails: {
          method: input.blockMethod,
          duration: input.blockDuration,
        },
      });
    }

    await updateDailyMetrics();

    return threat;
  } catch (error) {
    console.error('[SecurityAlert] Error logging threat:', error);
    throw error;
  }
};

export const getThreatLogs = async (filters?: {
  threatType?: string;
  threatSource?: string;
  wasBlocked?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.threatType) where.threatType = filters.threatType;
    if (filters?.threatSource) where.threatSource = { contains: filters.threatSource };
    if (filters?.wasBlocked !== undefined) where.wasBlocked = filters.wasBlocked;
    if (filters?.startDate || filters?.endDate) {
      where.detectedAt = {};
      if (filters.startDate) where.detectedAt.gte = filters.startDate;
      if (filters.endDate) where.detectedAt.lte = filters.endDate;
    }

    const [threats, total] = await Promise.all([
      prisma.threatLog.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      prisma.threatLog.count({ where }),
    ]);

    return {
      threats: threats.map((threat: any) => ({
        ...threat,
        requestHeaders: threat.requestHeaders ? JSON.parse(threat.requestHeaders) : null,
        requestBody: threat.requestBody ? JSON.parse(threat.requestBody) : null,
      })),
      total,
      hasMore: total > (filters?.offset || 0) + (filters?.limit || 100),
    };
  } catch (error) {
    console.error('[SecurityAlert] Error getting threat logs:', error);
    throw error;
  }
};

// ============================================
// Security Recommendations
// ============================================

export const createRecommendation = async (input: RecommendationInput) => {
  try {
    const recommendation = await prisma.securityRecommendation.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority || 'medium',
        currentState: input.currentState,
        recommendedState: input.recommendedState,
        impactDescription: input.impactDescription,
        benefitDescription: input.benefitDescription,
        actionRequired: input.actionRequired,
        actionUrl: input.actionUrl,
        estimatedTime: input.estimatedTime,
        difficulty: input.difficulty || 'medium',
        documentationUrl: input.documentationUrl,
        tutorialUrl: input.tutorialUrl,
        canAutoImplement: input.canAutoImplement || false,
        autoImplementScript: input.autoImplementScript,
      },
    });

    // Create alert for high-priority recommendations
    if (input.priority === 'urgent' || input.priority === 'high') {
      await createSecurityAlert({
        title: input.title,
        message: input.description,
        severity: input.priority === 'urgent' ? 'high' : 'medium',
        category: 'recommendation',
        recommendationType: input.category,
        priority: input.priority,
        actionRequired: input.actionRequired,
        actionUrl: input.actionUrl || undefined,
      });
    }

    await updateDailyMetrics();

    return recommendation;
  } catch (error) {
    console.error('[SecurityAlert] Error creating recommendation:', error);
    throw error;
  }
};

export const getRecommendations = async (filters?: {
  category?: string;
  priority?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.status) where.status = filters.status;

    const [recommendations, total] = await Promise.all([
      prisma.securityRecommendation.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.securityRecommendation.count({ where }),
    ]);

    return { recommendations, total };
  } catch (error) {
    console.error('[SecurityAlert] Error getting recommendations:', error);
    throw error;
  }
};

export const updateRecommendationStatus = async (
  recommendationId: string,
  status: string,
  userId?: string,
  dismissReason?: string
) => {
  try {
    const data: any = { status };
    
    if (status === 'completed') {
      data.implementedBy = userId;
      data.implementedAt = new Date();
    } else if (status === 'dismissed') {
      data.dismissedBy = userId;
      data.dismissedAt = new Date();
      data.dismissReason = dismissReason;
    }

    const recommendation = await prisma.securityRecommendation.update({
      where: { id: recommendationId },
      data,
    });

    await updateDailyMetrics();

    return recommendation;
  } catch (error) {
    console.error('[SecurityAlert] Error updating recommendation status:', error);
    throw error;
  }
};

// ============================================
// Compliance Updates
// ============================================

export const createComplianceUpdate = async (input: ComplianceUpdateInput) => {
  try {
    const update = await prisma.complianceUpdate.create({
      data: {
        title: input.title,
        description: input.description,
        complianceType: input.complianceType,
        regulatoryBody: input.regulatoryBody,
        changeType: input.changeType,
        effectiveDate: input.effectiveDate,
        deadline: input.deadline,
        impactLevel: input.impactLevel || 'medium',
        impactDescription: input.impactDescription,
        affectedAreas: input.affectedAreas ? JSON.stringify(input.affectedAreas) : null,
        actionsRequired: JSON.stringify(input.actionsRequired),
        estimatedEffort: input.estimatedEffort,
        officialUrl: input.officialUrl,
        documentationUrl: input.documentationUrl,
        internalGuideUrl: input.internalGuideUrl,
      },
    });

    // Create alert for compliance updates
    await createSecurityAlert({
      title: input.title,
      message: input.description,
      severity: input.impactLevel === 'critical' ? 'critical' : 'medium',
      category: 'compliance',
      complianceType: input.complianceType,
      regulatoryBody: input.regulatoryBody,
      deadline: input.deadline || undefined,
      actionUrl: input.documentationUrl || undefined,
    });

    await updateDailyMetrics();

    return {
      ...update,
      affectedAreas: update.affectedAreas ? JSON.parse(update.affectedAreas) : null,
      actionsRequired: JSON.parse(update.actionsRequired),
    };
  } catch (error) {
    console.error('[SecurityAlert] Error creating compliance update:', error);
    throw error;
  }
};

export const getComplianceUpdates = async (filters?: {
  complianceType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.complianceType) where.complianceType = filters.complianceType;
    if (filters?.status) where.status = filters.status;

    const [updates, total] = await Promise.all([
      prisma.complianceUpdate.findMany({
        where,
        orderBy: { effectiveDate: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.complianceUpdate.count({ where }),
    ]);

    return {
      updates: updates.map((update: any) => ({
        ...update,
        affectedAreas: update.affectedAreas ? JSON.parse(update.affectedAreas) : null,
        actionsRequired: JSON.parse(update.actionsRequired),
      })),
      total,
    };
  } catch (error) {
    console.error('[SecurityAlert] Error getting compliance updates:', error);
    throw error;
  }
};

export const acknowledgeComplianceUpdate = async (updateId: string, userId: string) => {
  try {
    return await prisma.complianceUpdate.update({
      where: { id: updateId },
      data: {
        isAcknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        viewCount: { increment: 1 },
      },
    });
  } catch (error) {
    console.error('[SecurityAlert] Error acknowledging compliance update:', error);
    throw error;
  }
};

// ============================================
// SEO Security Incidents
// ============================================

export const createSEOIncident = async (input: SEOIncidentInput) => {
  try {
    const incident = await prisma.sEOSecurityIncident.create({
      data: {
        incidentType: input.incidentType,
        title: input.title,
        description: input.description,
        severity: input.severity || 'medium',
        detectionMethod: input.detectionMethod,
        detectedBy: input.detectedBy,
        confidenceScore: input.confidenceScore || 0,
        affectedUrls: input.affectedUrls ? JSON.stringify(input.affectedUrls) : null,
        affectedKeywords: input.affectedKeywords ? JSON.stringify(input.affectedKeywords) : null,
        rankingImpact: input.rankingImpact,
        trafficImpact: input.trafficImpact,
        impactScore: input.impactScore || 0,
        spamLinks: input.spamLinks ? JSON.stringify(input.spamLinks) : null,
        spamDomains: input.spamDomains ? JSON.stringify(input.spamDomains) : null,
        scrapedUrls: input.scrapedUrls ? JSON.stringify(input.scrapedUrls) : null,
        scraperDomains: input.scraperDomains ? JSON.stringify(input.scraperDomains) : null,
      },
    });

    // Create alert for SEO incidents
    await createSecurityAlert({
      title: input.title,
      message: input.description,
      severity: (input.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
      category: 'seo_security',
      seoThreatType: input.incidentType,
      affectedUrls: input.affectedUrls || [],
      impactScore: input.impactScore || 0,
    });

    await updateDailyMetrics();

    return {
      ...incident,
      affectedUrls: incident.affectedUrls ? JSON.parse(incident.affectedUrls) : null,
      affectedKeywords: incident.affectedKeywords ? JSON.parse(incident.affectedKeywords) : null,
      spamLinks: incident.spamLinks ? JSON.parse(incident.spamLinks) : null,
      spamDomains: incident.spamDomains ? JSON.parse(incident.spamDomains) : null,
      scrapedUrls: incident.scrapedUrls ? JSON.parse(incident.scrapedUrls) : null,
      scraperDomains: incident.scraperDomains ? JSON.parse(incident.scraperDomains) : null,
      resolutionSteps: incident.resolutionSteps ? JSON.parse(incident.resolutionSteps) : null,
      actionsTaken: incident.actionsTaken ? JSON.parse(incident.actionsTaken) : null,
      dmcaDetails: incident.dmcaDetails ? JSON.parse(incident.dmcaDetails) : null,
    };
  } catch (error) {
    console.error('[SecurityAlert] Error creating SEO incident:', error);
    throw error;
  }
};

export const getSEOIncidents = async (filters?: {
  incidentType?: string;
  severity?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.incidentType) where.incidentType = filters.incidentType;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;

    const [incidents, total] = await Promise.all([
      prisma.sEOSecurityIncident.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.sEOSecurityIncident.count({ where }),
    ]);

    return {
      incidents: incidents.map((incident: any) => ({
        ...incident,
        affectedUrls: incident.affectedUrls ? JSON.parse(incident.affectedUrls) : null,
        affectedKeywords: incident.affectedKeywords ? JSON.parse(incident.affectedKeywords) : null,
        spamLinks: incident.spamLinks ? JSON.parse(incident.spamLinks) : null,
        spamDomains: incident.spamDomains ? JSON.parse(incident.spamDomains) : null,
        scrapedUrls: incident.scrapedUrls ? JSON.parse(incident.scrapedUrls) : null,
        scraperDomains: incident.scraperDomains ? JSON.parse(incident.scraperDomains) : null,
        resolutionSteps: incident.resolutionSteps ? JSON.parse(incident.resolutionSteps) : null,
        actionsTaken: incident.actionsTaken ? JSON.parse(incident.actionsTaken) : null,
        dmcaDetails: incident.dmcaDetails ? JSON.parse(incident.dmcaDetails) : null,
      })),
      total,
    };
  } catch (error) {
    console.error('[SecurityAlert] Error getting SEO incidents:', error);
    throw error;
  }
};

export const updateSEOIncidentStatus = async (
  incidentId: string,
  status: string,
  resolutionSteps?: any[],
  recoveryProgress?: number
) => {
  try {
    const data: any = { status };
    
    if (resolutionSteps) data.resolutionSteps = JSON.stringify(resolutionSteps);
    if (recoveryProgress !== undefined) data.recoveryProgress = recoveryProgress;
    if (status === 'resolved') data.resolvedAt = new Date();

    const incident = await prisma.sEOSecurityIncident.update({
      where: { id: incidentId },
      data,
    });

    await updateDailyMetrics();

    return incident;
  } catch (error) {
    console.error('[SecurityAlert] Error updating SEO incident status:', error);
    throw error;
  }
};

// ============================================
// Statistics & Analytics
// ============================================

export const getSecurityStatistics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAlerts,
      unreadAlerts,
      criticalAlerts,
      recentThreats,
      blockedThreats,
      pendingRecommendations,
      pendingCompliance,
      activeSEOIncidents,
    ] = await Promise.all([
      prisma.securityAlert.count({ where: { isDismissed: false } }),
      prisma.securityAlert.count({ where: { isRead: false, isDismissed: false } }),
      prisma.securityAlert.count({ where: { severity: 'critical', isDismissed: false } }),
      prisma.threatLog.count({ where: { detectedAt: { gte: today } } }),
      prisma.threatLog.count({ where: { wasBlocked: true, detectedAt: { gte: today } } }),
      prisma.securityRecommendation.count({ where: { status: 'pending' } }),
      prisma.complianceUpdate.count({ where: { status: 'pending' } }),
      prisma.sEOSecurityIncident.count({ where: { status: { not: 'resolved' } } }),
    ]);

    // Calculate security score
    const securityScore = calculateSecurityScore({
      criticalAlerts,
      blockedThreats,
      recentThreats,
      pendingRecommendations,
      pendingCompliance,
      activeSEOIncidents,
    });

    return {
      alerts: {
        total: totalAlerts,
        unread: unreadAlerts,
        critical: criticalAlerts,
      },
      threats: {
        recent: recentThreats,
        blocked: blockedThreats,
        blockRate: recentThreats > 0 ? ((blockedThreats / recentThreats) * 100) : 100,
      },
      recommendations: {
        pending: pendingRecommendations,
      },
      compliance: {
        pending: pendingCompliance,
      },
      seoSecurity: {
        activeIncidents: activeSEOIncidents,
      },
      securityScore,
    };
  } catch (error) {
    console.error('[SecurityAlert] Error getting statistics:', error);
    throw error;
  }
};

export const getAlertsByCategory = async () => {
  try {
    const alerts = await prisma.securityAlert.groupBy({
      by: ['category'],
      where: { isDismissed: false },
      _count: true,
    });

    return alerts.map((item: any) => ({
      category: item.category,
      count: item._count,
    }));
  } catch (error) {
    console.error('[SecurityAlert] Error getting alerts by category:', error);
    throw error;
  }
};

export const getAlertsBySeverity = async () => {
  try {
    const alerts = await prisma.securityAlert.groupBy({
      by: ['severity'],
      where: { isDismissed: false },
      _count: true,
    });

    return alerts.map((item: any) => ({
      severity: item.severity,
      count: item._count,
    }));
  } catch (error) {
    console.error('[SecurityAlert] Error getting alerts by severity:', error);
    throw error;
  }
};

export const getThreatTrends = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const threats = await prisma.threatLog.findMany({
      where: { detectedAt: { gte: startDate } },
      orderBy: { detectedAt: 'asc' },
    });

    // Group by date
    const trendMap = new Map<string, { total: number; blocked: number }>();
    
    threats.forEach((threat: any) => {
      const dateKey = threat.detectedAt.toISOString().split('T')[0];
      const current = trendMap.get(dateKey) || { total: 0, blocked: 0 };
      current.total++;
      if (threat.wasBlocked) current.blocked++;
      trendMap.set(dateKey, current);
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      blocked: data.blocked,
      blockRate: (data.blocked / data.total) * 100,
    }));
  } catch (error) {
    console.error('[SecurityAlert] Error getting threat trends:', error);
    throw error;
  }
};

// ============================================
// Helper Functions
// ============================================

const calculateSecurityScore = (params: {
  criticalAlerts: number;
  blockedThreats: number;
  recentThreats: number;
  pendingRecommendations: number;
  pendingCompliance: number;
  activeSEOIncidents: number;
}): number => {
  let score = 100;

  // Deduct for critical alerts
  score -= params.criticalAlerts * 10;

  // Deduct for unblocked threats
  const unblockedThreats = params.recentThreats - params.blockedThreats;
  score -= unblockedThreats * 5;

  // Deduct for pending recommendations
  score -= params.pendingRecommendations * 2;

  // Deduct for pending compliance
  score -= params.pendingCompliance * 3;

  // Deduct for active SEO incidents
  score -= params.activeSEOIncidents * 5;

  return Math.max(0, Math.min(100, score));
};

const updateDailyMetrics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      alerts,
      threats,
      recommendations,
      complianceUpdates,
      seoIncidents,
    ] = await Promise.all([
      prisma.securityAlert.findMany({
        where: { createdAt: { gte: today } },
      }),
      prisma.threatLog.findMany({
        where: { createdAt: { gte: today } },
      }),
      prisma.securityRecommendation.findMany(),
      prisma.complianceUpdate.findMany(),
      prisma.sEOSecurityIncident.findMany(),
    ]);

    const metrics = {
      metricDate: today,
      totalAlerts: alerts.length,
      newAlerts: alerts.length,
      dismissedAlerts: alerts.filter((a: any) => a.isDismissed).length,
      actionTakenAlerts: alerts.filter((a: any) => a.actionTaken).length,
      lowSeverity: alerts.filter((a: any) => a.severity === 'low').length,
      mediumSeverity: alerts.filter((a: any) => a.severity === 'medium').length,
      highSeverity: alerts.filter((a: any) => a.severity === 'high').length,
      criticalSeverity: alerts.filter((a: any) => a.severity === 'critical').length,
      threatAlerts: alerts.filter((a: any) => a.category === 'threat').length,
      recommendationAlerts: alerts.filter((a: any) => a.category === 'recommendation').length,
      complianceAlerts: alerts.filter((a: any) => a.category === 'compliance').length,
      seoSecurityAlerts: alerts.filter((a: any) => a.category === 'seo_security').length,
      totalThreats: threats.length,
      blockedThreats: threats.filter((t: any) => t.wasBlocked).length,
      blockRate: threats.length > 0 ? (threats.filter((t: any) => t.wasBlocked).length / threats.length) * 100 : 0,
      avgThreatConfidence: threats.reduce((sum: number, t: any) => sum + t.confidenceScore, 0) / (threats.length || 1),
      totalRecommendations: recommendations.length,
      implementedRecommendations: recommendations.filter((r: any) => r.status === 'completed').length,
      implementationRate: recommendations.length > 0 
        ? (recommendations.filter((r: any) => r.status === 'completed').length / recommendations.length) * 100 
        : 0,
      totalComplianceUpdates: complianceUpdates.length,
      pendingCompliance: complianceUpdates.filter((c: any) => c.status === 'pending').length,
      completedCompliance: complianceUpdates.filter((c: any) => c.status === 'completed').length,
      complianceRate: complianceUpdates.length > 0 
        ? (complianceUpdates.filter((c: any) => c.status === 'completed').length / complianceUpdates.length) * 100 
        : 0,
      totalSEOIncidents: seoIncidents.length,
      resolvedSEOIncidents: seoIncidents.filter((i: any) => i.status === 'resolved').length,
      activeSEOIncidents: seoIncidents.filter((i: any) => i.status !== 'resolved').length,
      avgImpactScore: seoIncidents.reduce((sum: number, i: any) => sum + i.impactScore, 0) / (seoIncidents.length || 1),
      securityScore: calculateSecurityScore({
        criticalAlerts: alerts.filter((a: any) => a.severity === 'critical').length,
        blockedThreats: threats.filter((t: any) => t.wasBlocked).length,
        recentThreats: threats.length,
        pendingRecommendations: recommendations.filter((r: any) => r.status === 'pending').length,
        pendingCompliance: complianceUpdates.filter((c: any) => c.status === 'pending').length,
        activeSEOIncidents: seoIncidents.filter((i: any) => i.status !== 'resolved').length,
      }),
    };

    await prisma.securityAlertMetrics.upsert({
      where: { metricDate: today },
      update: metrics,
      create: metrics,
    });
  } catch (error) {
    console.error('[SecurityAlert] Error updating daily metrics:', error);
  }
};

export default {
  createSecurityAlert,
  getSecurityAlerts,
  dismissAlert,
  takeActionOnAlert,
  markAlertAsRead,
  logThreat,
  getThreatLogs,
  createRecommendation,
  getRecommendations,
  updateRecommendationStatus,
  createComplianceUpdate,
  getComplianceUpdates,
  acknowledgeComplianceUpdate,
  createSEOIncident,
  getSEOIncidents,
  updateSEOIncidentStatus,
  getSecurityStatistics,
  getAlertsByCategory,
  getAlertsBySeverity,
  getThreatTrends,
};
