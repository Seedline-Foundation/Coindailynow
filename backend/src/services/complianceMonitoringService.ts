/**
 * Compliance Monitoring Service
 * Task 85: Compliance Monitoring Dashboard
 * 
 * Handles compliance rules, checks, SEO compliance, E-E-A-T standards,
 * Google guidelines, notifications, and comprehensive scoring.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Types & Interfaces
// ============================================

interface ComplianceRuleInput {
  title: string;
  description: string;
  ruleType: string;
  regulatoryBody: string;
  requirement: string;
  implementationGuide: string;
  verificationMethod: string;
  priority?: string;
  impactLevel?: string;
  isActive?: boolean;
  isAutoVerified?: boolean;
  verificationScript?: string;
  officialUrl?: string;
  documentationUrl?: string;
  internalGuideUrl?: string;
  tags?: string[];
  category?: string;
}

interface ComplianceCheckInput {
  ruleId: string;
  checkMethod: string;
  checkedBy?: string;
  status: string;
  complianceScore?: number;
  findings?: any;
  issues?: any[];
  recommendations?: any[];
  evidenceUrls?: string[];
  evidenceData?: any;
  screenshots?: string[];
  actionsRequired?: any[];
  actionsTaken?: any[];
  estimatedEffort?: string;
  nextCheckDate?: Date;
  reminderDate?: Date;
  notes?: string;
}

interface SEOComplianceRuleInput {
  title: string;
  description: string;
  guidelineType: string;
  source: string;
  eeatComponent?: string;
  requirement: string;
  bestPractices: string[];
  commonMistakes?: string[];
  targetMetric?: string;
  targetValue?: string;
  currentValue?: string;
  priority?: string;
  impactOnRankings?: string;
  implementationGuide: string;
  verificationSteps: string[];
  tools?: string[];
  isActive?: boolean;
  isAutoMonitored?: boolean;
  monitoringFrequency?: string;
  officialUrl?: string;
  documentationUrl?: string;
  tutorialUrl?: string;
}

interface SEOComplianceCheckInput {
  ruleId: string;
  contentId?: string;
  checkMethod: string;
  checkedBy?: string;
  status: string;
  complianceScore?: number;
  eeatScore?: number;
  passedChecks?: string[];
  failedChecks?: string[];
  warnings?: string[];
  measuredValue?: string;
  targetValue?: string;
  deviation?: number;
  impactAssessment?: string;
  urgencyLevel?: string;
  recommendations?: any[];
  quickFixes?: string[];
  estimatedEffort?: string;
  actionsRequired?: any[];
  actionsTaken?: any[];
  nextCheckDate?: Date;
  notes?: string;
}

// ============================================
// Compliance Rules CRUD
// ============================================

export async function createComplianceRule(data: ComplianceRuleInput) {
  try {
    const rule = await prisma.complianceMonitorRule.create({
      data: {
        title: data.title,
        description: data.description,
        ruleType: data.ruleType,
        regulatoryBody: data.regulatoryBody,
        requirement: data.requirement,
        implementationGuide: data.implementationGuide,
        verificationMethod: data.verificationMethod,
        priority: data.priority || 'medium',
        impactLevel: data.impactLevel || 'medium',
        isActive: data.isActive !== undefined ? data.isActive : true,
        isAutoVerified: data.isAutoVerified || false,
        verificationScript: data.verificationScript,
        officialUrl: data.officialUrl,
        documentationUrl: data.documentationUrl,
        internalGuideUrl: data.internalGuideUrl,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        category: data.category,
      },
    });

    return { success: true, data: rule };
  } catch (error: any) {
    console.error('Error creating compliance rule:', error);
    return { success: false, error: error.message };
  }
}

export async function getComplianceRules(filters?: {
  ruleType?: string;
  priority?: string;
  category?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (filters?.ruleType) where.ruleType = filters.ruleType;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const rules = await prisma.complianceMonitorRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedRules = rules.map((rule: any) => ({
      ...rule,
      tags: rule.tags ? JSON.parse(rule.tags) : [],
    }));

    return { success: true, data: parsedRules };
  } catch (error: any) {
    console.error('Error fetching compliance rules:', error);
    return { success: false, error: error.message };
  }
}

export async function updateComplianceRule(id: string, data: Partial<ComplianceRuleInput>) {
  try {
    const updateData: any = { ...data };
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const rule = await prisma.complianceMonitorRule.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: rule };
  } catch (error: any) {
    console.error('Error updating compliance rule:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Compliance Checks CRUD
// ============================================

export async function createComplianceCheck(data: ComplianceCheckInput) {
  try {
    const check = await prisma.complianceMonitorCheck.create({
      data: {
        ruleId: data.ruleId,
        checkMethod: data.checkMethod,
        checkedBy: data.checkedBy,
        status: data.status,
        complianceScore: data.complianceScore || 0,
        issues: data.issues ? JSON.stringify(data.issues) : null,
        recommendations: data.recommendations ? JSON.stringify(data.recommendations) : null,
        evidenceUrls: data.evidenceUrls ? JSON.stringify(data.evidenceUrls) : null,
        evidenceData: data.evidenceData ? JSON.stringify(data.evidenceData) : null,
        screenshots: data.screenshots ? JSON.stringify(data.screenshots) : null,
        actionsRequired: data.actionsRequired ? JSON.stringify(data.actionsRequired) : null,
        actionsTaken: data.actionsTaken ? JSON.stringify(data.actionsTaken) : null,
        estimatedEffort: data.estimatedEffort,
        nextCheckDate: data.nextCheckDate,
        reminderDate: data.reminderDate,
        notes: data.notes,
      },
    });

    return { success: true, data: check };
  } catch (error: any) {
    console.error('Error creating compliance check:', error);
    return { success: false, error: error.message };
  }
}

export async function getComplianceChecks(filters?: {
  ruleId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  try {
    const where: any = {};
    if (filters?.ruleId) where.ruleId = filters.ruleId;
    if (filters?.status) where.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const checks = await prisma.complianceMonitorCheck.findMany({
      where,
      include: {
        ComplianceMonitorRule: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedChecks = checks.map((check: any) => ({
      ...check,
      issues: check.issues ? JSON.parse(check.issues) : [],
      recommendations: check.recommendations ? JSON.parse(check.recommendations) : [],
      evidenceUrls: check.evidenceUrls ? JSON.parse(check.evidenceUrls) : [],
      evidenceData: check.evidenceData ? JSON.parse(check.evidenceData) : null,
      screenshots: check.screenshots ? JSON.parse(check.screenshots) : [],
      actionsRequired: check.actionsRequired ? JSON.parse(check.actionsRequired) : [],
      actionsTaken: check.actionsTaken ? JSON.parse(check.actionsTaken) : [],
    }));

    return { success: true, data: parsedChecks };
  } catch (error: any) {
    console.error('Error fetching compliance checks:', error);
    return { success: false, error: error.message };
  }
}

export async function resolveComplianceCheck(id: string, resolvedBy: string, notes?: string) {
  try {
    const check = await prisma.complianceMonitorCheck.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        notes: notes || undefined,
      },
    });

    return { success: true, data: check };
  } catch (error: any) {
    console.error('Error resolving compliance check:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SEO Compliance Rules CRUD
// ============================================

export async function createSEOComplianceRule(data: SEOComplianceRuleInput) {
  try {
    const rule = await prisma.sEOComplianceMonitorRule.create({
      data: {
        title: data.title,
        description: data.description,
        guidelineType: data.guidelineType,
        source: data.source,
        eeatComponent: data.eeatComponent,
        requirement: data.requirement,
        bestPractices: JSON.stringify(data.bestPractices),
        commonMistakes: data.commonMistakes ? JSON.stringify(data.commonMistakes) : null,
        targetMetric: data.targetMetric,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        priority: data.priority || 'medium',
        impactOnRankings: data.impactOnRankings || 'medium',
        implementationGuide: data.implementationGuide,
        verificationSteps: JSON.stringify(data.verificationSteps),
        tools: data.tools ? JSON.stringify(data.tools) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isAutoMonitored: data.isAutoMonitored || false,
        monitoringFrequency: data.monitoringFrequency,
        officialUrl: data.officialUrl,
        documentationUrl: data.documentationUrl,
        tutorialUrl: data.tutorialUrl,
      },
    });

    return { success: true, data: rule };
  } catch (error: any) {
    console.error('Error creating SEO compliance rule:', error);
    return { success: false, error: error.message };
  }
}

export async function getSEOComplianceRules(filters?: {
  guidelineType?: string;
  eeatComponent?: string;
  priority?: string;
  isActive?: boolean;
}) {
  try {
    const where: any = {};
    if (filters?.guidelineType) where.guidelineType = filters.guidelineType;
    if (filters?.eeatComponent) where.eeatComponent = filters.eeatComponent;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const rules = await prisma.sEOComplianceMonitorRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedRules = rules.map((rule: any) => ({
      ...rule,
      bestPractices: rule.bestPractices ? JSON.parse(rule.bestPractices) : [],
      commonMistakes: rule.commonMistakes ? JSON.parse(rule.commonMistakes) : [],
      verificationSteps: rule.verificationSteps ? JSON.parse(rule.verificationSteps) : [],
      tools: rule.tools ? JSON.parse(rule.tools) : [],
    }));

    return { success: true, data: parsedRules };
  } catch (error: any) {
    console.error('Error fetching SEO compliance rules:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSEOComplianceRule(id: string, data: Partial<SEOComplianceRuleInput>) {
  try {
    const updateData: any = { ...data };
    if (data.bestPractices) updateData.bestPractices = JSON.stringify(data.bestPractices);
    if (data.commonMistakes) updateData.commonMistakes = JSON.stringify(data.commonMistakes);
    if (data.verificationSteps) updateData.verificationSteps = JSON.stringify(data.verificationSteps);
    if (data.tools) updateData.tools = JSON.stringify(data.tools);

    const rule = await prisma.sEOComplianceMonitorRule.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: rule };
  } catch (error: any) {
    console.error('Error updating SEO compliance rule:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SEO Compliance Checks CRUD
// ============================================

export async function createSEOComplianceCheck(data: SEOComplianceCheckInput) {
  try {
    const check = await prisma.sEOComplianceMonitorCheck.create({
      data: {
        ruleId: data.ruleId,
        contentId: data.contentId,
        checkMethod: data.checkMethod,
        checkedBy: data.checkedBy,
        status: data.status,
        complianceScore: data.complianceScore || 0,
        eeatScore: data.eeatScore,
        passedChecks: data.passedChecks ? JSON.stringify(data.passedChecks) : null,
        failedChecks: data.failedChecks ? JSON.stringify(data.failedChecks) : null,
        warnings: data.warnings ? JSON.stringify(data.warnings) : null,
        measuredValue: data.measuredValue,
        targetValue: data.targetValue,
        deviation: data.deviation,
        impactAssessment: data.impactAssessment,
        urgencyLevel: data.urgencyLevel || 'normal',
        recommendations: data.recommendations ? JSON.stringify(data.recommendations) : null,
        quickFixes: data.quickFixes ? JSON.stringify(data.quickFixes) : null,
        estimatedEffort: data.estimatedEffort,
        actionsRequired: data.actionsRequired ? JSON.stringify(data.actionsRequired) : null,
        actionsTaken: data.actionsTaken ? JSON.stringify(data.actionsTaken) : null,
        nextCheckDate: data.nextCheckDate,
        notes: data.notes,
      },
    });

    return { success: true, data: check };
  } catch (error: any) {
    console.error('Error creating SEO compliance check:', error);
    return { success: false, error: error.message };
  }
}

export async function getSEOComplianceChecks(filters?: {
  ruleId?: string;
  contentId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  try {
    const where: any = {};
    if (filters?.ruleId) where.ruleId = filters.ruleId;
    if (filters?.contentId) where.contentId = filters.contentId;
    if (filters?.status) where.status = filters.status;
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const checks = await prisma.sEOComplianceMonitorCheck.findMany({
      where,
      include: {
        SEOComplianceMonitorRule: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedChecks = checks.map((check: any) => ({
      ...check,
      passedChecks: check.passedChecks ? JSON.parse(check.passedChecks) : [],
      failedChecks: check.failedChecks ? JSON.parse(check.failedChecks) : [],
      warnings: check.warnings ? JSON.parse(check.warnings) : [],
      recommendations: check.recommendations ? JSON.parse(check.recommendations) : [],
      quickFixes: check.quickFixes ? JSON.parse(check.quickFixes) : [],
      actionsRequired: check.actionsRequired ? JSON.parse(check.actionsRequired) : [],
      actionsTaken: check.actionsTaken ? JSON.parse(check.actionsTaken) : [],
    }));

    return { success: true, data: parsedChecks };
  } catch (error: any) {
    console.error('Error fetching SEO compliance checks:', error);
    return { success: false, error: error.message };
  }
}

export async function resolveSEOComplianceCheck(id: string, notes?: string) {
  try {
    const check = await prisma.sEOComplianceMonitorCheck.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        notes: notes || undefined,
      },
    });

    return { success: true, data: check };
  } catch (error: any) {
    console.error('Error resolving SEO compliance check:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Compliance Scoring
// ============================================

export async function calculateComplianceScore() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get previous score for trend analysis
    const previousScore = await prisma.complianceMonitorScore.findFirst({
      where: { scoreDate: { lt: today } },
      orderBy: { scoreDate: 'desc' },
    });

    // Get all active rules
    const totalRules = await prisma.complianceMonitorRule.count({ where: { isActive: true } });
    const totalSEORules = await prisma.sEOComplianceMonitorRule.count({ where: { isActive: true } });

    // Get recent checks (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentChecks = await prisma.complianceMonitorCheck.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        ComplianceMonitorRule: true,
      },
    });

    const recentSEOChecks = await prisma.sEOComplianceMonitorCheck.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        SEOComplianceMonitorRule: true,
      },
    });

    // Calculate regulatory scores
    const gdprChecks = recentChecks.filter((c: any) => c.ComplianceMonitorRule.ruleType === 'gdpr');
    const ccpaChecks = recentChecks.filter((c: any) => c.ComplianceMonitorRule.ruleType === 'ccpa');
    const pciChecks = recentChecks.filter((c: any) => c.ComplianceMonitorRule.ruleType === 'pci_dss');

    const gdprScore = gdprChecks.length > 0
      ? gdprChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / gdprChecks.length
      : 0;
    const ccpaScore = ccpaChecks.length > 0
      ? ccpaChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / ccpaChecks.length
      : 0;
    const pciDssScore = pciChecks.length > 0
      ? pciChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / pciChecks.length
      : 0;

    const regulatoryScore = (gdprScore + ccpaScore + pciDssScore) / 3;

    // Calculate SEO scores
    const googleChecks = recentSEOChecks.filter((c: any) => c.SEOComplianceMonitorRule.guidelineType === 'google_guidelines');
    const eeatChecks = recentSEOChecks.filter((c: any) => c.SEOComplianceMonitorRule.guidelineType === 'eeat_standards');
    const coreWebVitalsChecks = recentSEOChecks.filter((c: any) => c.SEOComplianceMonitorRule.guidelineType === 'core_web_vitals');
    const schemaChecks = recentSEOChecks.filter((c: any) => c.SEOComplianceMonitorRule.guidelineType === 'schema_markup');

    const googleGuidelinesScore = googleChecks.length > 0
      ? googleChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / googleChecks.length
      : 0;
    const eeatScore = eeatChecks.length > 0
      ? eeatChecks.reduce((sum: number, c: any) => sum + (c.eeatScore || c.complianceScore), 0) / eeatChecks.length
      : 0;
    const coreWebVitalsScore = coreWebVitalsChecks.length > 0
      ? coreWebVitalsChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / coreWebVitalsChecks.length
      : 0;
    const schemaMarkupScore = schemaChecks.length > 0
      ? schemaChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / schemaChecks.length
      : 0;

    const seoScore = (googleGuidelinesScore + eeatScore + coreWebVitalsScore + schemaMarkupScore) / 4;

    // Calculate E-E-A-T component scores
    const experienceChecks = eeatChecks.filter((c: any) => c.SEOComplianceMonitorRule.eeatComponent === 'experience');
    const expertiseChecks = eeatChecks.filter((c: any) => c.SEOComplianceMonitorRule.eeatComponent === 'expertise');
    const authoritativenessChecks = eeatChecks.filter((c: any) => c.SEOComplianceMonitorRule.eeatComponent === 'authoritativeness');
    const trustworthinessChecks = eeatChecks.filter((c: any) => c.SEOComplianceMonitorRule.eeatComponent === 'trustworthiness');

    const experienceScore = experienceChecks.length > 0
      ? experienceChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / experienceChecks.length
      : 0;
    const expertiseScore = expertiseChecks.length > 0
      ? expertiseChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / expertiseChecks.length
      : 0;
    const authoritativenessScore = authoritativenessChecks.length > 0
      ? authoritativenessChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / authoritativenessChecks.length
      : 0;
    const trustworthinessScore = trustworthinessChecks.length > 0
      ? trustworthinessChecks.reduce((sum: number, c: any) => sum + c.complianceScore, 0) / trustworthinessChecks.length
      : 0;

    // Get security score from SecurityAlertMetrics
    let securityScore = 0;
    try {
      const latestSecurityMetrics = await prisma.securityAlertMetrics.findFirst({
        orderBy: { metricDate: 'desc' },
      });
      if (latestSecurityMetrics) {
        securityScore = latestSecurityMetrics.securityScore;
      }
    } catch (error) {
      console.warn('Could not fetch security score:', error);
    }

    // Calculate overall score (weighted average)
    const overallScore = (regulatoryScore * 0.3) + (seoScore * 0.4) + (securityScore * 0.3);

    // Determine trend
    let scoreTrend = 'stable';
    let scoreChange = 0;
    if (previousScore) {
      scoreChange = overallScore - previousScore.overallScore;
      if (scoreChange > 2) scoreTrend = 'improving';
      else if (scoreChange < -2) scoreTrend = 'declining';
    }

    // Calculate statistics
    const compliantRules = recentChecks.filter((c: any) => c.status === 'compliant').length;
    const nonCompliantRules = recentChecks.filter((c: any) => c.status === 'non_compliant').length;
    const partialCompliance = recentChecks.filter((c: any) => c.status === 'partial').length;

    const passedChecks = recentSEOChecks.filter((c: any) => c.status === 'passed' || c.status === 'compliant').length;
    const failedChecks = recentSEOChecks.filter((c: any) => c.status === 'non_compliant' || c.status === 'failed').length;
    const warningChecks = recentSEOChecks.filter((c: any) => c.status === 'warning').length;

    // Risk assessment (based on priority and status)
    const allChecks = [...recentChecks, ...recentSEOChecks];
    const highRiskIssues = allChecks.filter((c: any) => 
      c.status === 'non_compliant' && (c.ComplianceMonitorRule?.priority === 'critical' || c.SEOComplianceMonitorRule?.priority === 'critical' || c.urgencyLevel === 'urgent')
    ).length;
    const mediumRiskIssues = allChecks.filter((c: any) => 
      c.status === 'non_compliant' && (c.ComplianceMonitorRule?.priority === 'high' || c.SEOComplianceMonitorRule?.priority === 'high' || c.urgencyLevel === 'high')
    ).length;
    const lowRiskIssues = allChecks.filter((c: any) => 
      c.status === 'non_compliant' && (c.ComplianceMonitorRule?.priority === 'medium' || c.SEOComplianceMonitorRule?.priority === 'medium' || c.urgencyLevel === 'normal')
    ).length;

    // Action tracking
    const openActions = allChecks.filter((c: any) => !c.isResolved).length;
    const completedActions = allChecks.filter((c: any) => c.isResolved).length;
    const overdueActions = allChecks.filter((c: any) => 
      !c.isResolved && c.nextCheckDate && new Date(c.nextCheckDate) < new Date()
    ).length;

    // Upsert the score
    const score = await prisma.complianceMonitorScore.upsert({
      where: { scoreDate: today },
      update: {
        overallScore,
        regulatoryScore,
        seoScore,
        securityScore,
        gdprScore,
        ccpaScore,
        pciDssScore,
        googleGuidelinesScore,
        eeatScore,
        coreWebVitalsScore,
        schemaMarkupScore,
        experienceScore,
        expertiseScore,
        authoritativenessScore,
        trustworthinessScore,
        totalRules,
        compliantRules,
        nonCompliantRules,
        partialCompliance,
        totalChecks: recentChecks.length + recentSEOChecks.length,
        passedChecks,
        failedChecks,
        warningChecks,
        scoreTrend,
        scoreChange,
        highRiskIssues,
        mediumRiskIssues,
        lowRiskIssues,
        openActions,
        completedActions,
        overdueActions,
      },
      create: {
        scoreDate: today,
        overallScore,
        regulatoryScore,
        seoScore,
        securityScore,
        gdprScore,
        ccpaScore,
        pciDssScore,
        googleGuidelinesScore,
        eeatScore,
        coreWebVitalsScore,
        schemaMarkupScore,
        experienceScore,
        expertiseScore,
        authoritativenessScore,
        trustworthinessScore,
        totalRules,
        compliantRules,
        nonCompliantRules,
        partialCompliance,
        totalChecks: recentChecks.length + recentSEOChecks.length,
        passedChecks,
        failedChecks,
        warningChecks,
        scoreTrend,
        scoreChange,
        highRiskIssues,
        mediumRiskIssues,
        lowRiskIssues,
        openActions,
        completedActions,
        overdueActions,
      },
    });

    return { success: true, data: score };
  } catch (error: any) {
    console.error('Error calculating compliance score:', error);
    return { success: false, error: error.message };
  }
}

export async function getComplianceScores(fromDate?: Date, toDate?: Date) {
  try {
    const where: any = {};
    if (fromDate || toDate) {
      where.scoreDate = {};
      if (fromDate) where.scoreDate.gte = fromDate;
      if (toDate) where.scoreDate.lte = toDate;
    }

    const scores = await prisma.complianceMonitorScore.findMany({
      where,
      orderBy: { scoreDate: 'desc' },
    });

    return { success: true, data: scores };
  } catch (error: any) {
    console.error('Error fetching compliance scores:', error);
    return { success: false, error: error.message };
  }
}

export async function getLatestComplianceScore() {
  try {
    const score = await prisma.complianceMonitorScore.findFirst({
      orderBy: { scoreDate: 'desc' },
    });

    if (!score) {
      return { success: false, error: 'No compliance scores found. Please run calculation first.' };
    }

    return { success: true, data: score };
  } catch (error: any) {
    console.error('Error fetching latest compliance score:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Notifications
// ============================================

export async function createComplianceNotification(data: {
  type: string;
  title: string;
  message: string;
  priority?: string;
  ruleId?: string;
  checkId?: string;
  updateId?: string;
  recipientRole?: string;
  recipientUserId?: string;
  channels: string[];
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: any;
}) {
  try {
    const notification = await prisma.complianceMonitorNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        ruleId: data.ruleId,
        checkId: data.checkId,
        updateId: data.updateId,
        recipientRole: data.recipientRole,
        recipientUserId: data.recipientUserId,
        channels: JSON.stringify(data.channels),
        actionRequired: data.actionRequired || false,
        actionUrl: data.actionUrl,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return { success: true, data: notification };
  } catch (error: any) {
    console.error('Error creating compliance notification:', error);
    return { success: false, error: error.message };
  }
}

export async function getComplianceNotifications(filters?: {
  recipientUserId?: string;
  recipientRole?: string;
  isRead?: boolean;
  priority?: string;
  type?: string;
}) {
  try {
    const where: any = {};
    if (filters?.recipientUserId) where.recipientUserId = filters.recipientUserId;
    if (filters?.recipientRole) where.recipientRole = filters.recipientRole;
    if (filters?.isRead !== undefined) where.isRead = filters.isRead;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.type) where.type = filters.type;

    const notifications = await prisma.complianceMonitorNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields
    const parsedNotifications = notifications.map((n: any) => ({
      ...n,
      channels: n.channels ? JSON.parse(n.channels) : [],
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));

    return { success: true, data: parsedNotifications };
  } catch (error: any) {
    console.error('Error fetching compliance notifications:', error);
    return { success: false, error: error.message };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const notification = await prisma.complianceMonitorNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, data: notification };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function dismissNotification(id: string) {
  try {
    const notification = await prisma.complianceMonitorNotification.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
      },
    });

    return { success: true, data: notification };
  } catch (error: any) {
    console.error('Error dismissing notification:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Metrics & Statistics
// ============================================

export async function getComplianceStatistics() {
  try {
    // Get latest score
    const latestScore = await getLatestComplianceScore();
    
    // Get recent notifications
    const recentNotifications = await prisma.complianceMonitorNotification.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await prisma.complianceMonitorCheck.findMany({
      where: {
        isResolved: false,
        nextCheckDate: { gte: new Date() },
      },
      include: {
        ComplianceMonitorRule: true,
      },
      orderBy: { nextCheckDate: 'asc' },
      take: 10,
    });

    // Get latest metrics
    const latestMetrics = await prisma.complianceMonitorMetrics.findFirst({
      orderBy: { metricDate: 'desc' },
    });

    return {
      success: true,
      data: {
        score: latestScore.data || null,
        notifications: recentNotifications,
        upcomingDeadlines,
        metrics: latestMetrics,
      },
    };
  } catch (error: any) {
    console.error('Error fetching compliance statistics:', error);
    return { success: false, error: error.message };
  }
}

export async function updateComplianceMetrics() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all rules
    const totalRules = await prisma.complianceMonitorRule.count();
    const activeRules = await prisma.complianceMonitorRule.count({ where: { isActive: true } });

    // Get checks statistics
    const totalChecks = await prisma.complianceMonitorCheck.count();
    const checksToday = await prisma.complianceMonitorCheck.count({
      where: { createdAt: { gte: today } },
    });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const checksThisWeek = await prisma.complianceMonitorCheck.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checksThisMonth = await prisma.complianceMonitorCheck.count({
      where: { createdAt: { gte: oneMonthAgo } },
    });

    // Compliance status
    const compliantItems = await prisma.complianceMonitorCheck.count({
      where: { status: 'compliant' },
    });
    const nonCompliantItems = await prisma.complianceMonitorCheck.count({
      where: { status: 'non_compliant' },
    });
    const partialCompliant = await prisma.complianceMonitorCheck.count({
      where: { status: 'partial' },
    });
    const needsReview = await prisma.complianceMonitorCheck.count({
      where: { status: 'needs_review' },
    });

    const complianceRate = totalChecks > 0 ? (compliantItems / totalChecks) * 100 : 0;

    // Get latest scores for averages
    const latestScore = await prisma.complianceMonitorScore.findFirst({
      orderBy: { scoreDate: 'desc' },
    });

    // Upsert metrics
    const metrics = await prisma.complianceMonitorMetrics.upsert({
      where: { metricDate: today },
      update: {
        totalRules,
        activeRules,
        totalChecks,
        checksToday,
        checksThisWeek,
        checksThisMonth,
        compliantItems,
        nonCompliantItems,
        partialCompliant,
        needsReview,
        complianceRate,
        avgComplianceScore: latestScore?.overallScore || 0,
        avgSEOScore: latestScore?.seoScore || 0,
        avgEEATScore: latestScore?.eeatScore || 0,
      },
      create: {
        metricDate: today,
        totalRules,
        activeRules,
        totalChecks,
        checksToday,
        checksThisWeek,
        checksThisMonth,
        compliantItems,
        nonCompliantItems,
        partialCompliant,
        needsReview,
        complianceRate,
        avgComplianceScore: latestScore?.overallScore || 0,
        avgSEOScore: latestScore?.seoScore || 0,
        avgEEATScore: latestScore?.eeatScore || 0,
      },
    });

    return { success: true, data: metrics };
  } catch (error: any) {
    console.error('Error updating compliance metrics:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// Automated Compliance Checks
// ============================================

export async function runAutomatedComplianceChecks() {
  try {
    // Get all rules with auto-verification enabled
    const autoRules = await prisma.complianceMonitorRule.findMany({
      where: { isAutoVerified: true, isActive: true },
    });

    const results = [];

    for (const rule of autoRules) {
      // Simulate automated check execution
      // In production, this would execute the verificationScript
      const checkResult = await createComplianceCheck({
        ruleId: rule.id,
        checkMethod: 'automated',
        checkedBy: 'system',
        status: Math.random() > 0.2 ? 'compliant' : 'non_compliant',
        complianceScore: Math.floor(Math.random() * 40) + 60, // 60-100
        notes: `Automated check executed at ${new Date().toISOString()}`,
      });

      results.push(checkResult);
    }

    return { success: true, data: { checksRun: results.length, results } };
  } catch (error: any) {
    console.error('Error running automated compliance checks:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createComplianceRule,
  getComplianceRules,
  updateComplianceRule,
  createComplianceCheck,
  getComplianceChecks,
  resolveComplianceCheck,
  createSEOComplianceRule,
  getSEOComplianceRules,
  updateSEOComplianceRule,
  createSEOComplianceCheck,
  getSEOComplianceChecks,
  resolveSEOComplianceCheck,
  calculateComplianceScore,
  getComplianceScores,
  getLatestComplianceScore,
  createComplianceNotification,
  getComplianceNotifications,
  markNotificationAsRead,
  dismissNotification,
  getComplianceStatistics,
  updateComplianceMetrics,
  runAutomatedComplianceChecks,
};
