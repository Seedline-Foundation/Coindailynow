-- CreateTable
CREATE TABLE "PerformanceAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditType" TEXT NOT NULL,
    "auditPeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "trafficMetrics" TEXT,
    "rankingMetrics" TEXT,
    "contentMetrics" TEXT,
    "technicalMetrics" TEXT,
    "backlinkMetrics" TEXT,
    "aiMetrics" TEXT,
    "overallScore" INTEGER,
    "findings" TEXT,
    "recommendations" TEXT,
    "aiAnalysis" TEXT,
    "executedBy" TEXT NOT NULL DEFAULT 'system',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OptimizationCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT,
    "cycleType" TEXT NOT NULL,
    "cyclePeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "targetAreas" TEXT NOT NULL,
    "keywordUpdates" TEXT,
    "backlinkUpdates" TEXT,
    "contentUpdates" TEXT,
    "technicalUpdates" TEXT,
    "expectedImpact" TEXT,
    "actualImpact" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OptimizationCycle_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "PerformanceAudit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optimizationCycleId" TEXT,
    "testName" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "variantA" TEXT NOT NULL,
    "variantB" TEXT NOT NULL,
    "variantATraffic" INTEGER NOT NULL DEFAULT 0,
    "variantBTraffic" INTEGER NOT NULL DEFAULT 0,
    "variantAConversions" INTEGER NOT NULL DEFAULT 0,
    "variantBConversions" INTEGER NOT NULL DEFAULT 0,
    "variantAEngagement" REAL,
    "variantBEngagement" REAL,
    "confidenceLevel" REAL,
    "statisticalSignificance" BOOLEAN NOT NULL DEFAULT false,
    "winner" TEXT,
    "targetArticleId" TEXT,
    "targetCategory" TEXT,
    "sampleSize" INTEGER NOT NULL DEFAULT 1000,
    "currentSample" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "results" TEXT,
    "learnings" TEXT,
    "appliedGlobally" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ABTest_optimizationCycleId_fkey" FOREIGN KEY ("optimizationCycleId") REFERENCES "OptimizationCycle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIModelTraining" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelName" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "datasetSize" INTEGER NOT NULL,
    "datasetPeriod" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "performanceMetrics" TEXT,
    "previousVersion" TEXT,
    "newVersion" TEXT NOT NULL,
    "improvementPercent" REAL,
    "trainingTimeMinutes" INTEGER,
    "deploymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "deployedAt" DATETIME,
    "errorMessage" TEXT,
    "dataQualityScore" REAL,
    "modelSize" INTEGER,
    "inferenceTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserBehaviorAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browserType" TEXT,
    "location" TEXT,
    "heatmapData" TEXT,
    "scrollDepthPercent" INTEGER,
    "timeOnPageSeconds" INTEGER,
    "interactions" TEXT,
    "engagementScore" REAL,
    "exitPoint" TEXT,
    "conversionEvent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "OptimizationInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" REAL NOT NULL,
    "dataSource" TEXT NOT NULL,
    "relatedMetrics" TEXT,
    "suggestedAction" TEXT,
    "expectedImpact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "actionTaken" TEXT,
    "actionResult" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearningLoop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loopName" TEXT NOT NULL,
    "loopType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "dataCollectionQuery" TEXT NOT NULL,
    "analysisAlgorithm" TEXT NOT NULL,
    "actionTriggers" TEXT NOT NULL,
    "automationLevel" TEXT NOT NULL DEFAULT 'assisted',
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgImprovementPercent" REAL,
    "learnings" TEXT,
    "config" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PerformanceAudit_auditType_auditPeriod_idx" ON "PerformanceAudit"("auditType", "auditPeriod");

-- CreateIndex
CREATE INDEX "PerformanceAudit_status_createdAt_idx" ON "PerformanceAudit"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAudit_startDate_endDate_idx" ON "PerformanceAudit"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "OptimizationCycle_cycleType_cyclePeriod_idx" ON "OptimizationCycle"("cycleType", "cyclePeriod");

-- CreateIndex
CREATE INDEX "OptimizationCycle_status_startDate_idx" ON "OptimizationCycle"("status", "startDate");

-- CreateIndex
CREATE INDEX "OptimizationCycle_auditId_idx" ON "OptimizationCycle"("auditId");

-- CreateIndex
CREATE INDEX "ABTest_status_startDate_idx" ON "ABTest"("status", "startDate");

-- CreateIndex
CREATE INDEX "ABTest_testType_idx" ON "ABTest"("testType");

-- CreateIndex
CREATE INDEX "ABTest_optimizationCycleId_idx" ON "ABTest"("optimizationCycleId");

-- CreateIndex
CREATE INDEX "ABTest_targetArticleId_idx" ON "ABTest"("targetArticleId");

-- CreateIndex
CREATE INDEX "ABTest_winner_idx" ON "ABTest"("winner");

-- CreateIndex
CREATE INDEX "AIModelTraining_modelName_status_idx" ON "AIModelTraining"("modelName", "status");

-- CreateIndex
CREATE INDEX "AIModelTraining_trainingType_idx" ON "AIModelTraining"("trainingType");

-- CreateIndex
CREATE INDEX "AIModelTraining_deploymentStatus_idx" ON "AIModelTraining"("deploymentStatus");

-- CreateIndex
CREATE INDEX "AIModelTraining_createdAt_idx" ON "AIModelTraining"("createdAt");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_userId_timestamp_idx" ON "UserBehaviorAnalytics"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_sessionId_idx" ON "UserBehaviorAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_analysisType_pageType_idx" ON "UserBehaviorAnalytics"("analysisType", "pageType");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_timestamp_idx" ON "UserBehaviorAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_pageUrl_idx" ON "UserBehaviorAnalytics"("pageUrl");

-- CreateIndex
CREATE INDEX "OptimizationInsight_insightType_category_idx" ON "OptimizationInsight"("insightType", "category");

-- CreateIndex
CREATE INDEX "OptimizationInsight_status_priority_idx" ON "OptimizationInsight"("status", "priority");

-- CreateIndex
CREATE INDEX "OptimizationInsight_createdAt_idx" ON "OptimizationInsight"("createdAt");

-- CreateIndex
CREATE INDEX "OptimizationInsight_confidence_idx" ON "OptimizationInsight"("confidence");

-- CreateIndex
CREATE INDEX "LearningLoop_loopType_status_idx" ON "LearningLoop"("loopType", "status");

-- CreateIndex
CREATE INDEX "LearningLoop_nextRunAt_idx" ON "LearningLoop"("nextRunAt");

-- CreateIndex
CREATE INDEX "LearningLoop_status_idx" ON "LearningLoop"("status");
