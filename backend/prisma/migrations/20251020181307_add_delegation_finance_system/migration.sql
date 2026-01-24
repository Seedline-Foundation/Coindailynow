/*
  Warnings:

  - You are about to drop the column `framework` on the `ComplianceReport` table. All the data in the column will be lost.
  - You are about to drop the column `generatedBy` on the `ComplianceReport` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `ComplianceReport` table. All the data in the column will be lost.
  - You are about to drop the column `violations` on the `ComplianceReport` table. All the data in the column will be lost.
  - Added the required column `accessLevel` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataRetention` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `failedOps` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gdprCompliant` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `humanOverrides` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportType` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedBy` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `successfulOps` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalOperations` to the `ComplianceReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `reportData` on table `ComplianceReport` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN "aiGenerated" BOOLEAN;
ALTER TABLE "Article" ADD COLUMN "metadata" TEXT;
ALTER TABLE "Article" ADD COLUMN "seoKeywords" TEXT;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "preferences" TEXT;

-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "generationPrompt" TEXT,
    "revisedPrompt" TEXT,
    "dalleModel" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "size" INTEGER,
    "quality" TEXT,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "optimizedUrl" TEXT,
    "webpUrl" TEXT,
    "avifUrl" TEXT,
    "placeholderBase64" TEXT,
    "seoKeywords" TEXT,
    "loadingPriority" TEXT NOT NULL DEFAULT 'lazy',
    "aspectRatio" TEXT,
    "focalPointX" REAL,
    "focalPointY" REAL,
    "chartType" TEXT,
    "chartData" TEXT,
    "chartSymbol" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "processingStatus" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "threatType" TEXT,
    "threatSource" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockDetails" TEXT,
    "recommendationType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "actionRequired" TEXT,
    "actionUrl" TEXT,
    "complianceType" TEXT,
    "regulatoryBody" TEXT,
    "deadline" DATETIME,
    "seoThreatType" TEXT,
    "affectedUrls" TEXT,
    "impactScore" REAL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedBy" TEXT,
    "dismissedAt" DATETIME,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionDetails" TEXT,
    "actionTakenAt" DATETIME,
    "actionTakenBy" TEXT,
    "metadata" TEXT,
    "relatedAlerts" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ThreatLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threatType" TEXT NOT NULL,
    "threatSource" TEXT NOT NULL,
    "threatVector" TEXT NOT NULL,
    "requestUrl" TEXT,
    "requestMethod" TEXT,
    "requestHeaders" TEXT,
    "requestBody" TEXT,
    "userAgent" TEXT,
    "detectionMethod" TEXT NOT NULL,
    "detectionRule" TEXT,
    "confidenceScore" REAL NOT NULL DEFAULT 0,
    "wasBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockMethod" TEXT,
    "blockDuration" INTEGER,
    "potentialDamage" TEXT,
    "actualDamage" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SecurityRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "currentState" TEXT,
    "recommendedState" TEXT,
    "impactDescription" TEXT,
    "benefitDescription" TEXT,
    "actionRequired" TEXT NOT NULL,
    "actionUrl" TEXT,
    "estimatedTime" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "documentationUrl" TEXT,
    "tutorialUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "implementedBy" TEXT,
    "implementedAt" DATETIME,
    "dismissedBy" TEXT,
    "dismissedAt" DATETIME,
    "dismissReason" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "canAutoImplement" BOOLEAN NOT NULL DEFAULT false,
    "autoImplementScript" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complianceType" TEXT NOT NULL,
    "regulatoryBody" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "deadline" DATETIME,
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "impactDescription" TEXT,
    "affectedAreas" TEXT,
    "actionsRequired" TEXT NOT NULL,
    "estimatedEffort" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "internalGuideUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "implementedBy" TEXT,
    "implementedAt" DATETIME,
    "notes" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "announcedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOSecurityIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "detectionMethod" TEXT NOT NULL,
    "detectedBy" TEXT,
    "confidenceScore" REAL NOT NULL DEFAULT 0,
    "affectedUrls" TEXT,
    "affectedKeywords" TEXT,
    "rankingImpact" REAL,
    "trafficImpact" REAL,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "spamLinks" TEXT,
    "spamDomains" TEXT,
    "disavowRequired" BOOLEAN NOT NULL DEFAULT false,
    "disavowFileUrl" TEXT,
    "scrapedUrls" TEXT,
    "scraperDomains" TEXT,
    "dmcaFiled" BOOLEAN NOT NULL DEFAULT false,
    "dmcaDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'investigating',
    "resolutionSteps" TEXT,
    "recoveryProgress" REAL NOT NULL DEFAULT 0,
    "estimatedRecovery" DATETIME,
    "actionsTaken" TEXT,
    "googleReportFiled" BOOLEAN NOT NULL DEFAULT false,
    "googleReportUrl" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SecurityAlertMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL,
    "totalAlerts" INTEGER NOT NULL DEFAULT 0,
    "newAlerts" INTEGER NOT NULL DEFAULT 0,
    "dismissedAlerts" INTEGER NOT NULL DEFAULT 0,
    "actionTakenAlerts" INTEGER NOT NULL DEFAULT 0,
    "lowSeverity" INTEGER NOT NULL DEFAULT 0,
    "mediumSeverity" INTEGER NOT NULL DEFAULT 0,
    "highSeverity" INTEGER NOT NULL DEFAULT 0,
    "criticalSeverity" INTEGER NOT NULL DEFAULT 0,
    "threatAlerts" INTEGER NOT NULL DEFAULT 0,
    "recommendationAlerts" INTEGER NOT NULL DEFAULT 0,
    "complianceAlerts" INTEGER NOT NULL DEFAULT 0,
    "seoSecurityAlerts" INTEGER NOT NULL DEFAULT 0,
    "totalThreats" INTEGER NOT NULL DEFAULT 0,
    "blockedThreats" INTEGER NOT NULL DEFAULT 0,
    "blockRate" REAL NOT NULL DEFAULT 0,
    "avgThreatConfidence" REAL NOT NULL DEFAULT 0,
    "topThreatType" TEXT,
    "topThreatSource" TEXT,
    "totalRecommendations" INTEGER NOT NULL DEFAULT 0,
    "implementedRecommendations" INTEGER NOT NULL DEFAULT 0,
    "implementationRate" REAL NOT NULL DEFAULT 0,
    "totalComplianceUpdates" INTEGER NOT NULL DEFAULT 0,
    "pendingCompliance" INTEGER NOT NULL DEFAULT 0,
    "completedCompliance" INTEGER NOT NULL DEFAULT 0,
    "complianceRate" REAL NOT NULL DEFAULT 0,
    "totalSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "resolvedSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "activeSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "avgImpactScore" REAL NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTime" INTEGER NOT NULL DEFAULT 0,
    "securityScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ComplianceMonitorRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "regulatoryBody" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "implementationGuide" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAutoVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationScript" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "internalGuideUrl" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceMonitorCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkMethod" TEXT NOT NULL,
    "checkedBy" TEXT,
    "status" TEXT NOT NULL,
    "complianceScore" REAL NOT NULL DEFAULT 0,
    "findings" TEXT,
    "issues" TEXT,
    "recommendations" TEXT,
    "evidenceUrls" TEXT,
    "evidenceData" TEXT,
    "screenshots" TEXT,
    "actionsRequired" TEXT,
    "actionsTaken" TEXT,
    "estimatedEffort" TEXT,
    "nextCheckDate" DATETIME,
    "reminderDate" DATETIME,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceMonitorCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceMonitorRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEOComplianceMonitorRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guidelineType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eeatComponent" TEXT,
    "requirement" TEXT NOT NULL,
    "bestPractices" TEXT NOT NULL,
    "commonMistakes" TEXT,
    "targetMetric" TEXT,
    "targetValue" TEXT,
    "currentValue" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "impactOnRankings" TEXT NOT NULL DEFAULT 'medium',
    "implementationGuide" TEXT NOT NULL,
    "verificationSteps" TEXT NOT NULL,
    "tools" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAutoMonitored" BOOLEAN NOT NULL DEFAULT false,
    "monitoringFrequency" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "tutorialUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOComplianceMonitorCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "contentId" TEXT,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkMethod" TEXT NOT NULL,
    "checkedBy" TEXT,
    "status" TEXT NOT NULL,
    "complianceScore" REAL NOT NULL DEFAULT 0,
    "eeatScore" REAL,
    "passedChecks" TEXT,
    "failedChecks" TEXT,
    "warnings" TEXT,
    "measuredValue" TEXT,
    "targetValue" TEXT,
    "deviation" REAL,
    "impactAssessment" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'normal',
    "recommendations" TEXT,
    "quickFixes" TEXT,
    "estimatedEffort" TEXT,
    "actionsRequired" TEXT,
    "actionsTaken" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "nextCheckDate" DATETIME,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SEOComplianceMonitorCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SEOComplianceMonitorRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceMonitorScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoreDate" DATETIME NOT NULL,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "regulatoryScore" REAL NOT NULL DEFAULT 0,
    "seoScore" REAL NOT NULL DEFAULT 0,
    "securityScore" REAL NOT NULL DEFAULT 0,
    "gdprScore" REAL NOT NULL DEFAULT 0,
    "ccpaScore" REAL NOT NULL DEFAULT 0,
    "pciDssScore" REAL NOT NULL DEFAULT 0,
    "googleGuidelinesScore" REAL NOT NULL DEFAULT 0,
    "eeatScore" REAL NOT NULL DEFAULT 0,
    "coreWebVitalsScore" REAL NOT NULL DEFAULT 0,
    "schemaMarkupScore" REAL NOT NULL DEFAULT 0,
    "experienceScore" REAL NOT NULL DEFAULT 0,
    "expertiseScore" REAL NOT NULL DEFAULT 0,
    "authoritativenessScore" REAL NOT NULL DEFAULT 0,
    "trustworthinessScore" REAL NOT NULL DEFAULT 0,
    "totalRules" INTEGER NOT NULL DEFAULT 0,
    "compliantRules" INTEGER NOT NULL DEFAULT 0,
    "nonCompliantRules" INTEGER NOT NULL DEFAULT 0,
    "partialCompliance" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "failedChecks" INTEGER NOT NULL DEFAULT 0,
    "warningChecks" INTEGER NOT NULL DEFAULT 0,
    "scoreTrend" TEXT NOT NULL DEFAULT 'stable',
    "scoreChange" REAL NOT NULL DEFAULT 0,
    "highRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "mediumRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "lowRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "openActions" INTEGER NOT NULL DEFAULT 0,
    "completedActions" INTEGER NOT NULL DEFAULT 0,
    "overdueActions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ComplianceMonitorNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "ruleId" TEXT,
    "checkId" TEXT,
    "updateId" TEXT,
    "recipientRole" TEXT,
    "recipientUserId" TEXT,
    "channels" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionTakenAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ComplianceMonitorMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL,
    "totalRules" INTEGER NOT NULL DEFAULT 0,
    "activeRules" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "checksToday" INTEGER NOT NULL DEFAULT 0,
    "checksThisWeek" INTEGER NOT NULL DEFAULT 0,
    "checksThisMonth" INTEGER NOT NULL DEFAULT 0,
    "compliantItems" INTEGER NOT NULL DEFAULT 0,
    "nonCompliantItems" INTEGER NOT NULL DEFAULT 0,
    "partialCompliant" INTEGER NOT NULL DEFAULT 0,
    "needsReview" INTEGER NOT NULL DEFAULT 0,
    "complianceRate" REAL NOT NULL DEFAULT 0,
    "gdprCompliance" INTEGER NOT NULL DEFAULT 0,
    "ccpaCompliance" INTEGER NOT NULL DEFAULT 0,
    "pciCompliance" INTEGER NOT NULL DEFAULT 0,
    "googleCompliance" INTEGER NOT NULL DEFAULT 0,
    "eeatCompliance" INTEGER NOT NULL DEFAULT 0,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "highIssues" INTEGER NOT NULL DEFAULT 0,
    "mediumIssues" INTEGER NOT NULL DEFAULT 0,
    "lowIssues" INTEGER NOT NULL DEFAULT 0,
    "resolvedIssues" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "completedActions" INTEGER NOT NULL DEFAULT 0,
    "pendingActions" INTEGER NOT NULL DEFAULT 0,
    "overdueActions" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTime" INTEGER NOT NULL DEFAULT 0,
    "totalNotifications" INTEGER NOT NULL DEFAULT 0,
    "sentNotifications" INTEGER NOT NULL DEFAULT 0,
    "readNotifications" INTEGER NOT NULL DEFAULT 0,
    "avgComplianceScore" REAL NOT NULL DEFAULT 0,
    "avgSEOScore" REAL NOT NULL DEFAULT 0,
    "avgEEATScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "feedbackCategory" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "language" TEXT,
    "issueType" TEXT,
    "severity" TEXT,
    "suggestedCorrection" TEXT,
    "ticketId" TEXT,
    "metadata" TEXT,
    "impactScore" REAL DEFAULT 0,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViolationReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "aiModel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "detectedPatterns" TEXT,
    "keywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "penaltyApplied" TEXT,
    "penaltyDuration" INTEGER,
    "penaltyReason" TEXT,
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ViolationReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPenalty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "violationReportId" TEXT NOT NULL,
    "penaltyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "contentHidden" BOOLEAN NOT NULL DEFAULT true,
    "accountFrozen" BOOLEAN NOT NULL DEFAULT false,
    "ipBanned" BOOLEAN NOT NULL DEFAULT false,
    "emailBanned" BOOLEAN NOT NULL DEFAULT false,
    "appealStatus" TEXT,
    "appealReason" TEXT,
    "appealSubmittedAt" DATETIME,
    "appealResolvedAt" DATETIME,
    "appealResolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolutionReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPenalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPenalty_violationReportId_fkey" FOREIGN KEY ("violationReportId") REFERENCES "ViolationReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserReputation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "overallScore" REAL NOT NULL DEFAULT 100.0,
    "contentQualityScore" REAL NOT NULL DEFAULT 100.0,
    "communityScore" REAL NOT NULL DEFAULT 100.0,
    "violationScore" REAL NOT NULL DEFAULT 0.0,
    "totalViolations" INTEGER NOT NULL DEFAULT 0,
    "religiousViolations" INTEGER NOT NULL DEFAULT 0,
    "hateSpeechViolations" INTEGER NOT NULL DEFAULT 0,
    "harassmentViolations" INTEGER NOT NULL DEFAULT 0,
    "sexualViolations" INTEGER NOT NULL DEFAULT 0,
    "spamViolations" INTEGER NOT NULL DEFAULT 0,
    "shadowBanCount" INTEGER NOT NULL DEFAULT 0,
    "outrightBanCount" INTEGER NOT NULL DEFAULT 0,
    "officialBanCount" INTEGER NOT NULL DEFAULT 0,
    "totalPenaltyDays" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "accountAge" INTEGER NOT NULL DEFAULT 0,
    "priorityTier" TEXT NOT NULL DEFAULT 'FREE',
    "priorityScore" REAL NOT NULL DEFAULT 1.0,
    "falsePositiveCount" INTEGER NOT NULL DEFAULT 0,
    "accurateReportsCount" INTEGER NOT NULL DEFAULT 0,
    "lastViolationAt" DATETIME,
    "lastPenaltyAt" DATETIME,
    "consecutiveCleanDays" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserReputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FalsePositive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "violationReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalViolationType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "originalConfidence" REAL NOT NULL,
    "originalModel" TEXT NOT NULL,
    "correctedBy" TEXT NOT NULL,
    "correctionReason" TEXT NOT NULL,
    "actualViolationType" TEXT,
    "trainingData" TEXT,
    "patterns" TEXT,
    "userImpact" TEXT,
    "systemImpact" TEXT,
    "processedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FalsePositive_violationReportId_fkey" FOREIGN KEY ("violationReportId") REFERENCES "ViolationReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FalsePositive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModerationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toxicityThreshold" REAL NOT NULL DEFAULT 0.7,
    "religiousContentThreshold" REAL NOT NULL DEFAULT 0.5,
    "hateSpeechThreshold" REAL NOT NULL DEFAULT 0.8,
    "harassmentThreshold" REAL NOT NULL DEFAULT 0.75,
    "sexualContentThreshold" REAL NOT NULL DEFAULT 0.8,
    "spamThreshold" REAL NOT NULL DEFAULT 0.6,
    "autoShadowBanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoOutrightBanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoOfficialBanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "level1Threshold" INTEGER NOT NULL DEFAULT 3,
    "level2Threshold" INTEGER NOT NULL DEFAULT 6,
    "level3Threshold" INTEGER NOT NULL DEFAULT 10,
    "shadowBanDuration" INTEGER NOT NULL DEFAULT 168,
    "outrightBanDuration" INTEGER NOT NULL DEFAULT 720,
    "officialBanDuration" INTEGER NOT NULL DEFAULT -1,
    "backgroundMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "realTimeAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "monitoringInterval" INTEGER NOT NULL DEFAULT 30,
    "superAdminBypass" BOOLEAN NOT NULL DEFAULT true,
    "adminLightChecks" BOOLEAN NOT NULL DEFAULT true,
    "premiumFastTrack" BOOLEAN NOT NULL DEFAULT true,
    "freeUserThoroughCheck" BOOLEAN NOT NULL DEFAULT true,
    "falsePositiveThreshold" REAL NOT NULL DEFAULT 0.05,
    "retrainingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyModelUpdates" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ModerationAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "violationReportId" TEXT,
    "contentType" TEXT,
    "contentId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionRequired" TEXT,
    "affectedUsers" INTEGER,
    "violationCount" INTEGER,
    "timeWindow" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "deliveredViaWebSocket" BOOLEAN NOT NULL DEFAULT false,
    "deliveredViaEmail" BOOLEAN NOT NULL DEFAULT false,
    "deliveredViaPush" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationType" TEXT NOT NULL,
    "operationCategory" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "agentId" TEXT,
    "userId" TEXT,
    "requestId" TEXT NOT NULL,
    "endpoint" TEXT,
    "httpMethod" TEXT,
    "inputData" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputData" TEXT,
    "outputHash" TEXT,
    "outputTokens" INTEGER,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "reasoning" TEXT,
    "confidence" REAL,
    "alternatives" TEXT,
    "qualityScore" REAL,
    "thresholds" TEXT,
    "passed" BOOLEAN,
    "dataSources" TEXT,
    "citations" TEXT,
    "externalAPIs" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "humanDecision" TEXT,
    "overrideReason" TEXT,
    "feedbackToAI" TEXT,
    "estimatedCost" REAL,
    "actualCost" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "processingTimeMs" INTEGER,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "gdprCompliant" BOOLEAN NOT NULL DEFAULT true,
    "retentionCategory" TEXT NOT NULL,
    "archivedAt" DATETIME,
    "deletionScheduled" DATETIME,
    "metadata" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_decision_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditLogId" TEXT NOT NULL,
    "decisionPoint" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "decisionOutcome" TEXT NOT NULL,
    "primaryReason" TEXT NOT NULL,
    "contributingFactors" TEXT,
    "confidenceScore" REAL NOT NULL,
    "alternativeOptions" TEXT,
    "dataPoints" TEXT,
    "weights" TEXT,
    "thresholds" TEXT,
    "rulesApplied" TEXT,
    "policiesFollowed" TEXT,
    "exceptions" TEXT,
    "expectedImpact" TEXT,
    "riskLevel" TEXT,
    "biasCheck" TEXT,
    "humanExplanation" TEXT,
    "technicalDetails" TEXT,
    "visualData" TEXT,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentObtained" BOOLEAN,
    "userNotified" BOOLEAN NOT NULL DEFAULT false,
    "rightToExplanation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_decision_log_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "ai_audit_log" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "consentMethod" TEXT,
    "consentVersion" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "rightToWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "rightToExplanation" BOOLEAN NOT NULL DEFAULT true,
    "rightToPortability" BOOLEAN NOT NULL DEFAULT true,
    "rightToErasure" BOOLEAN NOT NULL DEFAULT true,
    "withdrawnAt" DATETIME,
    "withdrawalReason" TEXT,
    "dataDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "givenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AICostTracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationType" TEXT NOT NULL,
    "agentId" TEXT,
    "agentType" TEXT,
    "taskId" TEXT,
    "workflowId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "inputCostPer1k" REAL NOT NULL,
    "outputCostPer1k" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "responseTimeMs" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "ipAddress" TEXT,
    "requestMetadata" TEXT,
    "responseMetadata" TEXT,
    "tags" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingPeriod" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "dailyLimit" REAL,
    "weeklyLimit" REAL,
    "monthlyLimit" REAL,
    "dailySpent" REAL NOT NULL DEFAULT 0,
    "weeklySpent" REAL NOT NULL DEFAULT 0,
    "monthlySpent" REAL NOT NULL DEFAULT 0,
    "lastDailyReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWeeklyReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMonthlyReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "throttleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "throttleAt" REAL NOT NULL DEFAULT 100,
    "isThrottled" BOOLEAN NOT NULL DEFAULT false,
    "throttledAt" DATETIME,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertThresholds" TEXT NOT NULL,
    "lastAlertSent" DATETIME,
    "lastAlertLevel" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetLimitId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "thresholdPercent" REAL NOT NULL,
    "currentSpent" REAL NOT NULL,
    "budgetLimit" REAL NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "message" TEXT NOT NULL,
    "recommendation" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "recipients" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetAlert_budgetLimitId_fkey" FOREIGN KEY ("budgetLimitId") REFERENCES "BudgetLimit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "billingPeriod" TEXT,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "totalCost" REAL NOT NULL,
    "totalOperations" INTEGER NOT NULL,
    "averageCostPerOp" REAL NOT NULL,
    "contentGenCost" REAL NOT NULL DEFAULT 0,
    "translationCost" REAL NOT NULL DEFAULT 0,
    "moderationCost" REAL NOT NULL DEFAULT 0,
    "marketAnalysisCost" REAL NOT NULL DEFAULT 0,
    "imageGenCost" REAL NOT NULL DEFAULT 0,
    "otherCost" REAL NOT NULL DEFAULT 0,
    "openaiCost" REAL NOT NULL DEFAULT 0,
    "anthropicCost" REAL NOT NULL DEFAULT 0,
    "googleCost" REAL NOT NULL DEFAULT 0,
    "metaCost" REAL NOT NULL DEFAULT 0,
    "xaiCost" REAL NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" REAL,
    "successRate" REAL,
    "retryRate" REAL,
    "previousPeriodCost" REAL,
    "costChange" REAL,
    "costChangeAmount" REAL,
    "trendDirection" TEXT,
    "forecastNextPeriod" REAL,
    "forecastConfidence" REAL,
    "recommendations" TEXT,
    "highCostOperations" TEXT,
    "budgetLimit" REAL,
    "budgetUtilization" REAL,
    "budgetRemaining" REAL,
    "detailedData" TEXT NOT NULL,
    "chartData" TEXT,
    "generatedBy" TEXT,
    "generationType" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DelegatedPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "delegatedToUserId" TEXT NOT NULL,
    "delegatedByUserId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "scopeData" TEXT,
    "constraints" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DelegatedPermission_delegatedToUserId_fkey" FOREIGN KEY ("delegatedToUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DelegatedPermission_delegatedByUserId_fkey" FOREIGN KEY ("delegatedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermissionUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletType" TEXT NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "availableBalance" REAL NOT NULL DEFAULT 0.0,
    "lockedBalance" REAL NOT NULL DEFAULT 0.0,
    "stakedBalance" REAL NOT NULL DEFAULT 0.0,
    "totalBalance" REAL NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "cePoints" REAL NOT NULL DEFAULT 0.0,
    "joyTokens" REAL NOT NULL DEFAULT 0.0,
    "dailyWithdrawalLimit" REAL,
    "transactionLimit" REAL,
    "whitelistedAddresses" TEXT,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "otpRequired" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "lockedAt" DATETIME,
    "lockedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastTransactionAt" DATETIME,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionHash" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "fromWalletId" TEXT,
    "toWalletId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "fee" REAL NOT NULL DEFAULT 0.0,
    "netAmount" REAL NOT NULL,
    "exchangeRate" REAL,
    "originalCurrency" TEXT,
    "originalAmount" REAL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiresAt" DATETIME,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "blockchainTxHash" TEXT,
    "blockchainConfirmations" INTEGER,
    "paymentMethod" TEXT,
    "paymentGateway" TEXT,
    "paymentGatewayTxId" TEXT,
    "externalReference" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "riskScore" REAL,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "initiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "failedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletTransaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WalletTransaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinanceOperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationType" TEXT NOT NULL,
    "operationCategory" TEXT NOT NULL,
    "transactionId" TEXT,
    "userId" TEXT,
    "performedBy" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "outputData" TEXT,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StakingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakedAmount" REAL NOT NULL,
    "lockPeriodDays" INTEGER NOT NULL,
    "rewardRate" REAL NOT NULL,
    "accumulatedRewards" REAL NOT NULL DEFAULT 0.0,
    "lastRewardClaimAt" DATETIME,
    "totalRewardsClaimed" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stakedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockAt" DATETIME NOT NULL,
    "unlockedAt" DATETIME,
    "earlyUnlockPenalty" REAL
);

-- CreateTable
CREATE TABLE "ConversionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" REAL NOT NULL,
    "toAmount" REAL NOT NULL,
    "conversionRate" REAL NOT NULL,
    "conversionFee" REAL NOT NULL DEFAULT 0.0,
    "netAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "convertedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AirdropCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" REAL NOT NULL,
    "totalSupply" REAL NOT NULL,
    "distributedAmount" REAL NOT NULL DEFAULT 0.0,
    "remainingAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "eligibilityCriteria" JSONB NOT NULL,
    "amountPerUser" REAL,
    "distributionDate" DATETIME NOT NULL,
    "distributedAt" DATETIME,
    "vestingSchedule" TEXT,
    "claimStartDate" DATETIME NOT NULL,
    "claimEndDate" DATETIME NOT NULL,
    "isClaimable" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdByUserId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AirdropClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "claimAmount" REAL NOT NULL,
    "vestedAmount" REAL NOT NULL DEFAULT 0.0,
    "releasedAmount" REAL NOT NULL DEFAULT 0.0,
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "eligibleAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    CONSTRAINT "AirdropClaim_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AirdropCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "escrowWalletId" TEXT,
    "amount" REAL NOT NULL,
    "escrowAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "escrowFee" REAL NOT NULL DEFAULT 0.0,
    "description" TEXT NOT NULL,
    "releaseConditions" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "disputeRaised" BOOLEAN NOT NULL DEFAULT false,
    "disputeRaisedBy" TEXT,
    "disputeRaisedAt" DATETIME,
    "disputeReason" TEXT,
    "disputeEvidence" TEXT,
    "mediatorId" TEXT,
    "disputeResolution" TEXT,
    "disputeResolvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SubscriptionPaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "paymentGateway" TEXT,
    "transactionId" TEXT,
    "gatewayTxId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "proratedAmount" REAL,
    "proratedDays" INTEGER,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBillingDate" DATETIME
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalTransactionId" TEXT NOT NULL,
    "originalTxId" TEXT NOT NULL,
    "refundTransactionId" TEXT,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "refundAmount" REAL NOT NULL,
    "refundReason" TEXT NOT NULL,
    "refundType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCategory" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "refundMethod" TEXT NOT NULL,
    "refundReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "processingTimeMs" INTEGER,
    "metadata" JSONB,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "completedAt" DATETIME,
    "rejectedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ComplianceReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "userId" TEXT,
    "agentTypes" TEXT,
    "operationTypes" TEXT,
    "totalOperations" INTEGER NOT NULL,
    "successfulOps" INTEGER NOT NULL,
    "failedOps" INTEGER NOT NULL,
    "humanOverrides" INTEGER NOT NULL,
    "averageQuality" REAL,
    "totalCost" REAL,
    "gdprCompliant" INTEGER NOT NULL,
    "dataRetention" TEXT NOT NULL,
    "consentStatus" TEXT,
    "reportData" TEXT NOT NULL,
    "summary" TEXT,
    "recommendations" TEXT,
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "requestedBy" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL,
    "generatedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComplianceReport_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ComplianceReport" ("createdAt", "id", "recommendations", "reportData", "status", "updatedAt") SELECT "createdAt", "id", "recommendations", "reportData", "status", "updatedAt" FROM "ComplianceReport";
DROP TABLE "ComplianceReport";
ALTER TABLE "new_ComplianceReport" RENAME TO "ComplianceReport";
CREATE INDEX "ComplianceReport_reportType_createdAt_idx" ON "ComplianceReport"("reportType", "createdAt");
CREATE INDEX "ComplianceReport_userId_createdAt_idx" ON "ComplianceReport"("userId", "createdAt");
CREATE INDEX "ComplianceReport_requestedBy_createdAt_idx" ON "ComplianceReport"("requestedBy", "createdAt");
CREATE INDEX "ComplianceReport_status_createdAt_idx" ON "ComplianceReport"("status", "createdAt");
CREATE INDEX "ComplianceReport_expiresAt_idx" ON "ComplianceReport"("expiresAt");
CREATE TABLE "new_ContentPipeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT,
    "status" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" REAL,
    "stages" TEXT,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentPipeline_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContentPipeline" ("articleId", "completedAt", "createdAt", "currentStage", "errors", "id", "progress", "qualityScore", "stages", "startedAt", "status", "updatedAt") SELECT "articleId", "completedAt", "createdAt", "currentStage", "errors", "id", "progress", "qualityScore", "stages", "startedAt", "status", "updatedAt" FROM "ContentPipeline";
DROP TABLE "ContentPipeline";
ALTER TABLE "new_ContentPipeline" RENAME TO "ContentPipeline";
CREATE INDEX "ContentPipeline_status_idx" ON "ContentPipeline"("status");
CREATE INDEX "ContentPipeline_articleId_idx" ON "ContentPipeline"("articleId");
CREATE INDEX "ContentPipeline_startedAt_idx" ON "ContentPipeline"("startedAt");
CREATE INDEX "ContentPipeline_completedAt_idx" ON "ContentPipeline"("completedAt");
CREATE TABLE "new_SystemConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemConfiguration" ("createdAt", "description", "id", "key", "updatedAt", "value") SELECT "createdAt", "description", "id", "key", "updatedAt", "value" FROM "SystemConfiguration";
DROP TABLE "SystemConfiguration";
ALTER TABLE "new_SystemConfiguration" RENAME TO "SystemConfiguration";
CREATE UNIQUE INDEX "SystemConfiguration_key_key" ON "SystemConfiguration"("key");
CREATE INDEX "SystemConfiguration_key_idx" ON "SystemConfiguration"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ArticleImage_articleId_imageType_idx" ON "ArticleImage"("articleId", "imageType");

-- CreateIndex
CREATE INDEX "ArticleImage_status_processingStatus_idx" ON "ArticleImage"("status", "processingStatus");

-- CreateIndex
CREATE INDEX "ArticleImage_chartSymbol_idx" ON "ArticleImage"("chartSymbol");

-- CreateIndex
CREATE INDEX "ArticleImage_createdAt_idx" ON "ArticleImage"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_severity_createdAt_idx" ON "SecurityAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_category_createdAt_idx" ON "SecurityAlert"("category", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_isDismissed_isRead_idx" ON "SecurityAlert"("isDismissed", "isRead");

-- CreateIndex
CREATE INDEX "SecurityAlert_showOnHomepage_idx" ON "SecurityAlert"("showOnHomepage");

-- CreateIndex
CREATE INDEX "SecurityAlert_detectedAt_idx" ON "SecurityAlert"("detectedAt");

-- CreateIndex
CREATE INDEX "ThreatLog_threatType_detectedAt_idx" ON "ThreatLog"("threatType", "detectedAt");

-- CreateIndex
CREATE INDEX "ThreatLog_threatSource_idx" ON "ThreatLog"("threatSource");

-- CreateIndex
CREATE INDEX "ThreatLog_wasBlocked_idx" ON "ThreatLog"("wasBlocked");

-- CreateIndex
CREATE INDEX "ThreatLog_detectedAt_idx" ON "ThreatLog"("detectedAt");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_category_priority_idx" ON "SecurityRecommendation"("category", "priority");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_status_createdAt_idx" ON "SecurityRecommendation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_priority_status_idx" ON "SecurityRecommendation"("priority", "status");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_complianceType_effectiveDate_idx" ON "ComplianceUpdate"("complianceType", "effectiveDate");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_status_deadline_idx" ON "ComplianceUpdate"("status", "deadline");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_effectiveDate_idx" ON "ComplianceUpdate"("effectiveDate");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_incidentType_detectedAt_idx" ON "SEOSecurityIncident"("incidentType", "detectedAt");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_severity_status_idx" ON "SEOSecurityIncident"("severity", "status");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_status_detectedAt_idx" ON "SEOSecurityIncident"("status", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlertMetrics_metricDate_key" ON "SecurityAlertMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "SecurityAlertMetrics_metricDate_idx" ON "SecurityAlertMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_ruleType_isActive_idx" ON "ComplianceMonitorRule"("ruleType", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_priority_isActive_idx" ON "ComplianceMonitorRule"("priority", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_category_isActive_idx" ON "ComplianceMonitorRule"("category", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_ruleId_checkDate_idx" ON "ComplianceMonitorCheck"("ruleId", "checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_status_checkDate_idx" ON "ComplianceMonitorCheck"("status", "checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_checkDate_idx" ON "ComplianceMonitorCheck"("checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_nextCheckDate_idx" ON "ComplianceMonitorCheck"("nextCheckDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_guidelineType_isActive_idx" ON "SEOComplianceMonitorRule"("guidelineType", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_eeatComponent_isActive_idx" ON "SEOComplianceMonitorRule"("eeatComponent", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_priority_isActive_idx" ON "SEOComplianceMonitorRule"("priority", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_ruleId_checkDate_idx" ON "SEOComplianceMonitorCheck"("ruleId", "checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_status_checkDate_idx" ON "SEOComplianceMonitorCheck"("status", "checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_contentId_status_idx" ON "SEOComplianceMonitorCheck"("contentId", "status");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_checkDate_idx" ON "SEOComplianceMonitorCheck"("checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_nextCheckDate_idx" ON "SEOComplianceMonitorCheck"("nextCheckDate");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMonitorScore_scoreDate_key" ON "ComplianceMonitorScore"("scoreDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorScore_scoreDate_idx" ON "ComplianceMonitorScore"("scoreDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_type_createdAt_idx" ON "ComplianceMonitorNotification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_recipientUserId_isRead_idx" ON "ComplianceMonitorNotification"("recipientUserId", "isRead");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_priority_deliveryStatus_idx" ON "ComplianceMonitorNotification"("priority", "deliveryStatus");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_createdAt_idx" ON "ComplianceMonitorNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMonitorMetrics_metricDate_key" ON "ComplianceMonitorMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorMetrics_metricDate_idx" ON "ComplianceMonitorMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "UserFeedback_userId_createdAt_idx" ON "UserFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserFeedback_articleId_idx" ON "UserFeedback"("articleId");

-- CreateIndex
CREATE INDEX "UserFeedback_feedbackType_createdAt_idx" ON "UserFeedback"("feedbackType", "createdAt");

-- CreateIndex
CREATE INDEX "UserFeedback_rating_idx" ON "UserFeedback"("rating");

-- CreateIndex
CREATE INDEX "UserFeedback_isResolved_idx" ON "UserFeedback"("isResolved");

-- CreateIndex
CREATE INDEX "UserFeedback_language_idx" ON "UserFeedback"("language");

-- CreateIndex
CREATE INDEX "ViolationReport_userId_createdAt_idx" ON "ViolationReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ViolationReport_violationType_severity_idx" ON "ViolationReport"("violationType", "severity");

-- CreateIndex
CREATE INDEX "ViolationReport_status_createdAt_idx" ON "ViolationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ViolationReport_contentType_contentId_idx" ON "ViolationReport"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ViolationReport_confidence_idx" ON "ViolationReport"("confidence");

-- CreateIndex
CREATE INDEX "ViolationReport_severity_createdAt_idx" ON "ViolationReport"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "UserPenalty_userId_isActive_idx" ON "UserPenalty"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserPenalty_penaltyType_isActive_idx" ON "UserPenalty"("penaltyType", "isActive");

-- CreateIndex
CREATE INDEX "UserPenalty_escalationLevel_idx" ON "UserPenalty"("escalationLevel");

-- CreateIndex
CREATE INDEX "UserPenalty_startDate_endDate_idx" ON "UserPenalty"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "UserPenalty_appealStatus_idx" ON "UserPenalty"("appealStatus");

-- CreateIndex
CREATE UNIQUE INDEX "UserReputation_userId_key" ON "UserReputation"("userId");

-- CreateIndex
CREATE INDEX "UserReputation_overallScore_idx" ON "UserReputation"("overallScore");

-- CreateIndex
CREATE INDEX "UserReputation_trustLevel_idx" ON "UserReputation"("trustLevel");

-- CreateIndex
CREATE INDEX "UserReputation_priorityTier_idx" ON "UserReputation"("priorityTier");

-- CreateIndex
CREATE INDEX "UserReputation_violationScore_idx" ON "UserReputation"("violationScore");

-- CreateIndex
CREATE INDEX "UserReputation_totalViolations_idx" ON "UserReputation"("totalViolations");

-- CreateIndex
CREATE INDEX "FalsePositive_originalViolationType_idx" ON "FalsePositive"("originalViolationType");

-- CreateIndex
CREATE INDEX "FalsePositive_originalModel_idx" ON "FalsePositive"("originalModel");

-- CreateIndex
CREATE INDEX "FalsePositive_processedForTraining_idx" ON "FalsePositive"("processedForTraining");

-- CreateIndex
CREATE INDEX "FalsePositive_createdAt_idx" ON "FalsePositive"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationSettings_updatedAt_idx" ON "ModerationSettings"("updatedAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_alertType_status_idx" ON "ModerationAlert"("alertType", "status");

-- CreateIndex
CREATE INDEX "ModerationAlert_severity_status_idx" ON "ModerationAlert"("severity", "status");

-- CreateIndex
CREATE INDEX "ModerationAlert_priority_createdAt_idx" ON "ModerationAlert"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_status_createdAt_idx" ON "ModerationAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_userId_idx" ON "ModerationAlert"("userId");

-- CreateIndex
CREATE INDEX "ModerationAlert_violationReportId_idx" ON "ModerationAlert"("violationReportId");

-- CreateIndex
CREATE INDEX "ai_audit_log_operationType_createdAt_idx" ON "ai_audit_log"("operationType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_operationCategory_createdAt_idx" ON "ai_audit_log"("operationCategory", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_agentType_createdAt_idx" ON "ai_audit_log"("agentType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_userId_createdAt_idx" ON "ai_audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_status_createdAt_idx" ON "ai_audit_log"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_humanReviewed_createdAt_idx" ON "ai_audit_log"("humanReviewed", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_deletionScheduled_idx" ON "ai_audit_log"("deletionScheduled");

-- CreateIndex
CREATE INDEX "ai_audit_log_requestId_idx" ON "ai_audit_log"("requestId");

-- CreateIndex
CREATE INDEX "ai_audit_log_inputHash_idx" ON "ai_audit_log"("inputHash");

-- CreateIndex
CREATE INDEX "ai_audit_log_createdAt_idx" ON "ai_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "ai_decision_log_auditLogId_idx" ON "ai_decision_log"("auditLogId");

-- CreateIndex
CREATE INDEX "ai_decision_log_decisionType_createdAt_idx" ON "ai_decision_log"("decisionType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_decision_log_requiresConsent_idx" ON "ai_decision_log"("requiresConsent");

-- CreateIndex
CREATE INDEX "UserConsent_userId_consentType_idx" ON "UserConsent"("userId", "consentType");

-- CreateIndex
CREATE INDEX "UserConsent_userId_consented_idx" ON "UserConsent"("userId", "consented");

-- CreateIndex
CREATE INDEX "UserConsent_consentType_consented_idx" ON "UserConsent"("consentType", "consented");

-- CreateIndex
CREATE INDEX "UserConsent_expiresAt_idx" ON "UserConsent"("expiresAt");

-- CreateIndex
CREATE INDEX "AICostTracking_agentId_timestamp_idx" ON "AICostTracking"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_agentType_timestamp_idx" ON "AICostTracking"("agentType", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_provider_timestamp_idx" ON "AICostTracking"("provider", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_userId_timestamp_idx" ON "AICostTracking"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_billingPeriod_agentType_idx" ON "AICostTracking"("billingPeriod", "agentType");

-- CreateIndex
CREATE INDEX "AICostTracking_billingPeriod_provider_idx" ON "AICostTracking"("billingPeriod", "provider");

-- CreateIndex
CREATE INDEX "AICostTracking_operationType_timestamp_idx" ON "AICostTracking"("operationType", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_timestamp_idx" ON "AICostTracking"("timestamp");

-- CreateIndex
CREATE INDEX "BudgetLimit_scope_scopeId_idx" ON "BudgetLimit"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "BudgetLimit_isActive_scope_idx" ON "BudgetLimit"("isActive", "scope");

-- CreateIndex
CREATE INDEX "BudgetLimit_isThrottled_idx" ON "BudgetLimit"("isThrottled");

-- CreateIndex
CREATE INDEX "BudgetAlert_budgetLimitId_createdAt_idx" ON "BudgetAlert"("budgetLimitId", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetAlert_alertType_createdAt_idx" ON "BudgetAlert"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetAlert_severity_acknowledged_idx" ON "BudgetAlert"("severity", "acknowledged");

-- CreateIndex
CREATE INDEX "BudgetAlert_notificationSent_idx" ON "BudgetAlert"("notificationSent");

-- CreateIndex
CREATE INDEX "BudgetAlert_createdAt_idx" ON "BudgetAlert"("createdAt");

-- CreateIndex
CREATE INDEX "CostReport_reportType_startDate_idx" ON "CostReport"("reportType", "startDate");

-- CreateIndex
CREATE INDEX "CostReport_billingPeriod_scope_idx" ON "CostReport"("billingPeriod", "scope");

-- CreateIndex
CREATE INDEX "CostReport_scope_scopeId_idx" ON "CostReport"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "CostReport_createdAt_idx" ON "CostReport"("createdAt");

-- CreateIndex
CREATE INDEX "CostReport_status_idx" ON "CostReport"("status");

-- CreateIndex
CREATE INDEX "DelegatedPermission_delegatedToUserId_isActive_idx" ON "DelegatedPermission"("delegatedToUserId", "isActive");

-- CreateIndex
CREATE INDEX "DelegatedPermission_permissionKey_idx" ON "DelegatedPermission"("permissionKey");

-- CreateIndex
CREATE INDEX "DelegatedPermission_delegatedByUserId_idx" ON "DelegatedPermission"("delegatedByUserId");

-- CreateIndex
CREATE INDEX "DelegatedPermission_isActive_expiresAt_idx" ON "DelegatedPermission"("isActive", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DelegatedPermission_delegatedToUserId_permissionKey_key" ON "DelegatedPermission"("delegatedToUserId", "permissionKey");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_userId_timestamp_idx" ON "PermissionUsageLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_permissionKey_timestamp_idx" ON "PermissionUsageLog"("permissionKey", "timestamp");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_resourceType_resourceId_idx" ON "PermissionUsageLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_success_idx" ON "PermissionUsageLog"("success");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_walletAddress_key" ON "Wallet"("walletAddress");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_walletType_idx" ON "Wallet"("walletType");

-- CreateIndex
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");

-- CreateIndex
CREATE INDEX "Wallet_walletAddress_idx" ON "Wallet"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_transactionHash_key" ON "WalletTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionHash_idx" ON "WalletTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_fromWalletId_status_idx" ON "WalletTransaction"("fromWalletId", "status");

-- CreateIndex
CREATE INDEX "WalletTransaction_toWalletId_status_idx" ON "WalletTransaction"("toWalletId", "status");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_createdAt_idx" ON "WalletTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionType_createdAt_idx" ON "WalletTransaction"("transactionType", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_operationType_idx" ON "WalletTransaction"("operationType");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_paymentGatewayTxId_idx" ON "WalletTransaction"("paymentGatewayTxId");

-- CreateIndex
CREATE INDEX "WalletTransaction_blockchainTxHash_idx" ON "WalletTransaction"("blockchainTxHash");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_operationType_timestamp_idx" ON "FinanceOperationLog"("operationType", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_userId_timestamp_idx" ON "FinanceOperationLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_performedBy_timestamp_idx" ON "FinanceOperationLog"("performedBy", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_status_idx" ON "FinanceOperationLog"("status");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_transactionId_idx" ON "FinanceOperationLog"("transactionId");

-- CreateIndex
CREATE INDEX "StakingRecord_walletId_status_idx" ON "StakingRecord"("walletId", "status");

-- CreateIndex
CREATE INDEX "StakingRecord_userId_status_idx" ON "StakingRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "StakingRecord_unlockAt_idx" ON "StakingRecord"("unlockAt");

-- CreateIndex
CREATE INDEX "StakingRecord_status_idx" ON "StakingRecord"("status");

-- CreateIndex
CREATE INDEX "ConversionRecord_userId_convertedAt_idx" ON "ConversionRecord"("userId", "convertedAt");

-- CreateIndex
CREATE INDEX "ConversionRecord_walletId_idx" ON "ConversionRecord"("walletId");

-- CreateIndex
CREATE INDEX "ConversionRecord_fromCurrency_toCurrency_idx" ON "ConversionRecord"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "AirdropCampaign_status_idx" ON "AirdropCampaign"("status");

-- CreateIndex
CREATE INDEX "AirdropCampaign_claimStartDate_claimEndDate_idx" ON "AirdropCampaign"("claimStartDate", "claimEndDate");

-- CreateIndex
CREATE INDEX "AirdropCampaign_distributionDate_idx" ON "AirdropCampaign"("distributionDate");

-- CreateIndex
CREATE INDEX "AirdropClaim_userId_status_idx" ON "AirdropClaim"("userId", "status");

-- CreateIndex
CREATE INDEX "AirdropClaim_campaignId_status_idx" ON "AirdropClaim"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_campaignId_userId_key" ON "AirdropClaim"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_buyerId_idx" ON "EscrowTransaction"("buyerId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_sellerId_idx" ON "EscrowTransaction"("sellerId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPaymentRecord_invoiceNumber_key" ON "SubscriptionPaymentRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_userId_paidAt_idx" ON "SubscriptionPaymentRecord"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_subscriptionId_idx" ON "SubscriptionPaymentRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_status_idx" ON "SubscriptionPaymentRecord"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_invoiceNumber_idx" ON "SubscriptionPaymentRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "RefundRecord_userId_status_idx" ON "RefundRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "RefundRecord_originalTxId_idx" ON "RefundRecord"("originalTxId");

-- CreateIndex
CREATE INDEX "RefundRecord_status_idx" ON "RefundRecord"("status");
