-- CreateTable
CREATE TABLE "AlgorithmUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "affectedCategories" TEXT NOT NULL,
    "estimatedImpact" REAL NOT NULL DEFAULT 0.0,
    "rankingChanges" INTEGER NOT NULL DEFAULT 0,
    "trafficChange" REAL NOT NULL DEFAULT 0.0,
    "affectedPages" INTEGER NOT NULL DEFAULT 0,
    "affectedKeywords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "adaptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlgorithmResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "algorithmUpdateId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "automatedAction" BOOLEAN NOT NULL DEFAULT false,
    "executedAutomatically" BOOLEAN NOT NULL DEFAULT false,
    "affectedUrls" TEXT,
    "successRate" REAL,
    "resultMetrics" TEXT,
    "scheduledAt" DATETIME,
    "executedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlgorithmResponse_algorithmUpdateId_fkey" FOREIGN KEY ("algorithmUpdateId") REFERENCES "AlgorithmUpdate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SERPVolatility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "previousPosition" INTEGER NOT NULL,
    "currentPosition" INTEGER NOT NULL,
    "positionChange" INTEGER NOT NULL,
    "percentageChange" REAL NOT NULL,
    "category" TEXT,
    "searchIntent" TEXT,
    "competitorMovement" TEXT NOT NULL,
    "volatilityScore" REAL NOT NULL DEFAULT 0.0,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "alertGenerated" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" TEXT,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SchemaRefresh" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "previousSchema" TEXT NOT NULL,
    "updatedSchema" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changesApplied" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validationErrors" TEXT,
    "googleValidation" BOOLEAN NOT NULL DEFAULT false,
    "richSnippetBefore" BOOLEAN NOT NULL DEFAULT false,
    "richSnippetAfter" BOOLEAN,
    "clickRateChange" REAL,
    "refreshedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentFreshnessAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "freshnessScore" INTEGER NOT NULL DEFAULT 0,
    "contentAge" INTEGER NOT NULL DEFAULT 0,
    "lastUpdateAge" INTEGER NOT NULL DEFAULT 0,
    "requiresUpdate" BOOLEAN NOT NULL DEFAULT false,
    "updateReason" TEXT,
    "updatePriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "updateType" TEXT,
    "updatesApplied" TEXT,
    "trafficBefore" INTEGER NOT NULL DEFAULT 0,
    "trafficAfter" INTEGER,
    "rankingsBefore" TEXT NOT NULL,
    "rankingsAfter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MONITORING',
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SEORecoveryWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "algorithmUpdateId" TEXT,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerSeverity" TEXT NOT NULL,
    "affectedUrls" TEXT NOT NULL,
    "affectedKeywords" TEXT NOT NULL,
    "estimatedImpact" REAL NOT NULL DEFAULT 0.0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "recoveryRate" REAL,
    "timeToRecover" INTEGER,
    "successMetrics" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SEORecoveryWorkflow_algorithmUpdateId_fkey" FOREIGN KEY ("algorithmUpdateId") REFERENCES "AlgorithmUpdate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEORecoveryStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "automationScript" TEXT,
    "requiredManualAction" TEXT,
    "dependsOnSteps" TEXT,
    "blockedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "executionLog" TEXT,
    "errorMessage" TEXT,
    "impactMetrics" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SEORecoveryStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "SEORecoveryWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEODefenseMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL DEFAULT 'DAILY',
    "algorithmsDetected" INTEGER NOT NULL DEFAULT 0,
    "criticalUpdates" INTEGER NOT NULL DEFAULT 0,
    "responseTime" REAL NOT NULL DEFAULT 0.0,
    "volatileKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgVolatilityScore" REAL NOT NULL DEFAULT 0.0,
    "anomaliesDetected" INTEGER NOT NULL DEFAULT 0,
    "schemasRefreshed" INTEGER NOT NULL DEFAULT 0,
    "validationRate" REAL NOT NULL DEFAULT 0.0,
    "richSnippetRate" REAL NOT NULL DEFAULT 0.0,
    "contentUpdated" INTEGER NOT NULL DEFAULT 0,
    "avgFreshnessScore" REAL NOT NULL DEFAULT 0.0,
    "urgentUpdates" INTEGER NOT NULL DEFAULT 0,
    "workflowsActive" INTEGER NOT NULL DEFAULT 0,
    "workflowsCompleted" INTEGER NOT NULL DEFAULT 0,
    "avgRecoveryTime" REAL NOT NULL DEFAULT 0.0,
    "avgRecoveryRate" REAL NOT NULL DEFAULT 0.0,
    "defenseScore" INTEGER NOT NULL DEFAULT 0,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "adaptationSpeed" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_source_detectedAt_idx" ON "AlgorithmUpdate"("source", "detectedAt");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_status_idx" ON "AlgorithmUpdate"("status");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_severity_idx" ON "AlgorithmUpdate"("severity");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_updateType_idx" ON "AlgorithmUpdate"("updateType");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_algorithmUpdateId_status_idx" ON "AlgorithmResponse"("algorithmUpdateId", "status");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_actionType_idx" ON "AlgorithmResponse"("actionType");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_priority_idx" ON "AlgorithmResponse"("priority");

-- CreateIndex
CREATE INDEX "SERPVolatility_keyword_checkDate_idx" ON "SERPVolatility"("keyword", "checkDate");

-- CreateIndex
CREATE INDEX "SERPVolatility_isAnomaly_requiresAction_idx" ON "SERPVolatility"("isAnomaly", "requiresAction");

-- CreateIndex
CREATE INDEX "SERPVolatility_volatilityScore_idx" ON "SERPVolatility"("volatilityScore");

-- CreateIndex
CREATE INDEX "SERPVolatility_checkDate_idx" ON "SERPVolatility"("checkDate");

-- CreateIndex
CREATE INDEX "SchemaRefresh_contentId_idx" ON "SchemaRefresh"("contentId");

-- CreateIndex
CREATE INDEX "SchemaRefresh_validationStatus_idx" ON "SchemaRefresh"("validationStatus");

-- CreateIndex
CREATE INDEX "SchemaRefresh_refreshedAt_idx" ON "SchemaRefresh"("refreshedAt");

-- CreateIndex
CREATE INDEX "SchemaRefresh_schemaType_idx" ON "SchemaRefresh"("schemaType");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_contentId_idx" ON "ContentFreshnessAgent"("contentId");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_requiresUpdate_updatePriority_idx" ON "ContentFreshnessAgent"("requiresUpdate", "updatePriority");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_status_idx" ON "ContentFreshnessAgent"("status");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_freshnessScore_idx" ON "ContentFreshnessAgent"("freshnessScore");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_lastChecked_idx" ON "ContentFreshnessAgent"("lastChecked");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_status_idx" ON "SEORecoveryWorkflow"("status");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_triggerType_triggerSeverity_idx" ON "SEORecoveryWorkflow"("triggerType", "triggerSeverity");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_algorithmUpdateId_idx" ON "SEORecoveryWorkflow"("algorithmUpdateId");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_workflowId_stepOrder_idx" ON "SEORecoveryStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_status_idx" ON "SEORecoveryStep"("status");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_stepType_idx" ON "SEORecoveryStep"("stepType");

-- CreateIndex
CREATE INDEX "SEODefenseMetrics_date_period_idx" ON "SEODefenseMetrics"("date", "period");

-- CreateIndex
CREATE INDEX "SEODefenseMetrics_defenseScore_idx" ON "SEODefenseMetrics"("defenseScore");
