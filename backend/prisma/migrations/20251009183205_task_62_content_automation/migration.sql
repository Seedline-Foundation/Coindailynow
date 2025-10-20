-- CreateTable
CREATE TABLE "ContentFeedSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "checkInterval" INTEGER NOT NULL DEFAULT 3600,
    "lastCheckedAt" DATETIME,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "configuration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutomatedArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedSourceId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "originalTitle" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "originalPublishedAt" DATETIME,
    "rewrittenTitle" TEXT,
    "rewrittenContent" TEXT,
    "rewrittenExcerpt" TEXT,
    "optimizedHeadline" TEXT,
    "headlineScore" REAL DEFAULT 0.0,
    "seoKeywords" TEXT,
    "suggestedCategory" TEXT,
    "suggestedTags" TEXT,
    "confidence" REAL DEFAULT 0.0,
    "translationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "translatedLanguages" TEXT,
    "qualityScore" REAL NOT NULL DEFAULT 0.0,
    "uniquenessScore" REAL NOT NULL DEFAULT 0.0,
    "readabilityScore" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'COLLECTED',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "publishedArticleId" TEXT,
    "scheduledPublishAt" DATETIME,
    "publishedAt" DATETIME,
    "processingStartedAt" DATETIME,
    "processingCompletedAt" DATETIME,
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutomatedArticle_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "ContentFeedSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutomatedArticle_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AutomatedArticle_publishedArticleId_fkey" FOREIGN KEY ("publishedArticleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentAutomationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "targetId" TEXT,
    "targetType" TEXT,
    "configuration" TEXT,
    "batchSize" INTEGER,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "processingTimeMs" INTEGER,
    "results" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentAutomationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "requireHumanApproval" BOOLEAN NOT NULL DEFAULT true,
    "minQualityScore" REAL NOT NULL DEFAULT 85.0,
    "minUniquenessScore" REAL NOT NULL DEFAULT 80.0,
    "minReadabilityScore" REAL NOT NULL DEFAULT 70.0,
    "maxArticlesPerDay" INTEGER NOT NULL DEFAULT 50,
    "maxArticlesPerFeed" INTEGER NOT NULL DEFAULT 10,
    "processingBatchSize" INTEGER NOT NULL DEFAULT 5,
    "enableAutoTranslation" BOOLEAN NOT NULL DEFAULT true,
    "translationLanguages" TEXT NOT NULL,
    "collectionSchedule" TEXT NOT NULL DEFAULT '0 */3 * * *',
    "publishingSchedule" TEXT NOT NULL DEFAULT '0 8,12,16,20 * * *',
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    "translationModel" TEXT NOT NULL DEFAULT 'nllb-200',
    "notifyOnApprovalNeeded" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPublish" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnErrors" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "ContentAutomationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT,
    "articleId" TEXT,
    "level" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ContentFeedSource_isActive_priority_idx" ON "ContentFeedSource"("isActive", "priority");

-- CreateIndex
CREATE INDEX "ContentFeedSource_type_category_idx" ON "ContentFeedSource"("type", "category");

-- CreateIndex
CREATE INDEX "ContentFeedSource_lastCheckedAt_idx" ON "ContentFeedSource"("lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomatedArticle_publishedArticleId_key" ON "AutomatedArticle"("publishedArticleId");

-- CreateIndex
CREATE INDEX "AutomatedArticle_feedSourceId_status_idx" ON "AutomatedArticle"("feedSourceId", "status");

-- CreateIndex
CREATE INDEX "AutomatedArticle_status_approvalStatus_idx" ON "AutomatedArticle"("status", "approvalStatus");

-- CreateIndex
CREATE INDEX "AutomatedArticle_qualityScore_idx" ON "AutomatedArticle"("qualityScore");

-- CreateIndex
CREATE INDEX "AutomatedArticle_scheduledPublishAt_idx" ON "AutomatedArticle"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "AutomatedArticle_createdAt_idx" ON "AutomatedArticle"("createdAt");

-- CreateIndex
CREATE INDEX "ContentAutomationJob_jobType_status_idx" ON "ContentAutomationJob"("jobType", "status");

-- CreateIndex
CREATE INDEX "ContentAutomationJob_status_createdAt_idx" ON "ContentAutomationJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAutomationJob_startedAt_idx" ON "ContentAutomationJob"("startedAt");

-- CreateIndex
CREATE INDEX "ContentAutomationSettings_isEnabled_idx" ON "ContentAutomationSettings"("isEnabled");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_jobId_idx" ON "ContentAutomationLog"("jobId");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_articleId_idx" ON "ContentAutomationLog"("articleId");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_level_createdAt_idx" ON "ContentAutomationLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_action_createdAt_idx" ON "ContentAutomationLog"("action", "createdAt");
