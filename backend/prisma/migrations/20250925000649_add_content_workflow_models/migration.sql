-- CreateTable
CREATE TABLE "ContentWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL DEFAULT 'ARTICLE_PUBLISHING',
    "currentState" TEXT NOT NULL DEFAULT 'RESEARCH',
    "previousState" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedReviewerId" TEXT,
    "completionPercentage" REAL NOT NULL DEFAULT 0,
    "estimatedCompletionAt" DATETIME,
    "actualCompletionAt" DATETIME,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentWorkflow_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentWorkflow_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assigneeId" TEXT,
    "estimatedDurationMs" INTEGER,
    "actualDurationMs" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "output" TEXT,
    "errorMessage" TEXT,
    "qualityScore" REAL,
    "humanFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowStep_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "transitionType" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "triggerConditions" TEXT,
    "transitionReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "channel" TEXT,
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowNotification_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AITask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "inputData" TEXT,
    "outputData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedCost" REAL NOT NULL,
    "actualCost" REAL,
    "processingTimeMs" INTEGER,
    "qualityScore" REAL,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflowStepId" TEXT,
    CONSTRAINT "AITask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AITask_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AITask" ("actualCost", "agentId", "completedAt", "createdAt", "errorMessage", "estimatedCost", "id", "inputData", "maxRetries", "outputData", "priority", "processingTimeMs", "qualityScore", "retryCount", "scheduledAt", "startedAt", "status", "taskType") SELECT "actualCost", "agentId", "completedAt", "createdAt", "errorMessage", "estimatedCost", "id", "inputData", "maxRetries", "outputData", "priority", "processingTimeMs", "qualityScore", "retryCount", "scheduledAt", "startedAt", "status", "taskType" FROM "AITask";
DROP TABLE "AITask";
ALTER TABLE "new_AITask" RENAME TO "AITask";
CREATE INDEX "AITask_agentId_status_idx" ON "AITask"("agentId", "status");
CREATE INDEX "AITask_priority_createdAt_idx" ON "AITask"("priority", "createdAt");
CREATE INDEX "AITask_status_createdAt_idx" ON "AITask"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ContentWorkflow_articleId_key" ON "ContentWorkflow"("articleId");

-- CreateIndex
CREATE INDEX "ContentWorkflow_currentState_idx" ON "ContentWorkflow"("currentState");

-- CreateIndex
CREATE INDEX "ContentWorkflow_priority_createdAt_idx" ON "ContentWorkflow"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "ContentWorkflow_assignedReviewerId_idx" ON "ContentWorkflow"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "ContentWorkflow_workflowType_idx" ON "ContentWorkflow"("workflowType");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_stepOrder_idx" ON "WorkflowStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- CreateIndex
CREATE INDEX "WorkflowStep_assigneeId_idx" ON "WorkflowStep"("assigneeId");

-- CreateIndex
CREATE INDEX "WorkflowStep_stepName_idx" ON "WorkflowStep"("stepName");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_idx" ON "WorkflowTransition"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_fromState_toState_idx" ON "WorkflowTransition"("fromState", "toState");

-- CreateIndex
CREATE INDEX "WorkflowTransition_createdAt_idx" ON "WorkflowTransition"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowNotification_workflowId_idx" ON "WorkflowNotification"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowNotification_recipientId_idx" ON "WorkflowNotification"("recipientId");

-- CreateIndex
CREATE INDEX "WorkflowNotification_status_idx" ON "WorkflowNotification"("status");

-- CreateIndex
CREATE INDEX "WorkflowNotification_createdAt_idx" ON "WorkflowNotification"("createdAt");
