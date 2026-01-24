-- CreateTable
CREATE TABLE "AutomationWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trigger" TEXT NOT NULL,
    "triggerConfig" TEXT,
    "actions" TEXT NOT NULL,
    "schedule" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "retryStrategy" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 300000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgExecutionTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutomationExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "triggerType" TEXT NOT NULL,
    "triggerData" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "executionTimeMs" INTEGER,
    "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
    "stepsTotal" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "output" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "isRetry" BOOLEAN NOT NULL DEFAULT false,
    "parentExecutionId" TEXT,
    "metadata" TEXT,
    CONSTRAINT "AutomationExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationExecutionStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "executionTimeMs" INTEGER,
    "input" TEXT,
    "output" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    CONSTRAINT "AutomationExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT,
    "alertType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "config" TEXT,
    "events" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutomationAlert_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "changeDescription" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "gitCommitHash" TEXT,
    "diffData" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "APIOrchestration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orchestrationType" TEXT NOT NULL,
    "apiCalls" TEXT NOT NULL,
    "dependencies" TEXT,
    "retryStrategy" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastExecutedAt" DATETIME,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL,
    "tags" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" DATETIME,
    "lastUsedAt" DATETIME,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AutomationWorkflow_status_isActive_idx" ON "AutomationWorkflow"("status", "isActive");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_workflowType_idx" ON "AutomationWorkflow"("workflowType");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_trigger_idx" ON "AutomationWorkflow"("trigger");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_createdBy_idx" ON "AutomationWorkflow"("createdBy");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_lastRunAt_idx" ON "AutomationWorkflow"("lastRunAt");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_nextRunAt_idx" ON "AutomationWorkflow"("nextRunAt");

-- CreateIndex
CREATE INDEX "AutomationExecution_workflowId_status_idx" ON "AutomationExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "AutomationExecution_status_startedAt_idx" ON "AutomationExecution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AutomationExecution_triggerType_idx" ON "AutomationExecution"("triggerType");

-- CreateIndex
CREATE INDEX "AutomationExecutionStep_executionId_stepOrder_idx" ON "AutomationExecutionStep"("executionId", "stepOrder");

-- CreateIndex
CREATE INDEX "AutomationExecutionStep_status_idx" ON "AutomationExecutionStep"("status");

-- CreateIndex
CREATE INDEX "AutomationAlert_workflowId_idx" ON "AutomationAlert"("workflowId");

-- CreateIndex
CREATE INDEX "AutomationAlert_alertType_idx" ON "AutomationAlert"("alertType");

-- CreateIndex
CREATE INDEX "AutomationAlert_isActive_idx" ON "AutomationAlert"("isActive");

-- CreateIndex
CREATE INDEX "ContentVersion_articleId_createdAt_idx" ON "ContentVersion"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentVersion_changedBy_idx" ON "ContentVersion"("changedBy");

-- CreateIndex
CREATE INDEX "ContentVersion_gitCommitHash_idx" ON "ContentVersion"("gitCommitHash");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_articleId_versionNumber_key" ON "ContentVersion"("articleId", "versionNumber");

-- CreateIndex
CREATE INDEX "APIOrchestration_orchestrationType_idx" ON "APIOrchestration"("orchestrationType");

-- CreateIndex
CREATE INDEX "APIOrchestration_isActive_idx" ON "APIOrchestration"("isActive");

-- CreateIndex
CREATE INDEX "APIOrchestration_createdBy_idx" ON "APIOrchestration"("createdBy");

-- CreateIndex
CREATE INDEX "IntegrationConnection_platform_idx" ON "IntegrationConnection"("platform");

-- CreateIndex
CREATE INDEX "IntegrationConnection_isActive_isVerified_idx" ON "IntegrationConnection"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "IntegrationConnection_createdBy_idx" ON "IntegrationConnection"("createdBy");
