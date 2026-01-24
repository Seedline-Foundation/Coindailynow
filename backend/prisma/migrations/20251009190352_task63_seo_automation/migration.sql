/*
  Warnings:

  - Added the required column `sourceUrl` to the `InternalLinkSuggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `InternalLinkSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SEOMetadata" ADD COLUMN "structuredData" TEXT;

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "duration" INTEGER,
    "metadata" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InternalLinkSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceContentId" TEXT,
    "targetContentId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "contextSentence" TEXT,
    "relevanceScore" REAL NOT NULL DEFAULT 0.0,
    "topicSimilarity" REAL NOT NULL DEFAULT 0.0,
    "priority" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "implementedAt" DATETIME,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InternalLinkSuggestion" ("anchorText", "contextSentence", "createdAt", "id", "implementedAt", "relevanceScore", "sourceContentId", "status", "targetContentId", "targetUrl", "topicSimilarity") SELECT "anchorText", "contextSentence", "createdAt", "id", "implementedAt", "relevanceScore", "sourceContentId", "status", "targetContentId", "targetUrl", "topicSimilarity" FROM "InternalLinkSuggestion";
DROP TABLE "InternalLinkSuggestion";
ALTER TABLE "new_InternalLinkSuggestion" RENAME TO "InternalLinkSuggestion";
CREATE INDEX "InternalLinkSuggestion_sourceContentId_status_idx" ON "InternalLinkSuggestion"("sourceContentId", "status");
CREATE INDEX "InternalLinkSuggestion_relevanceScore_idx" ON "InternalLinkSuggestion"("relevanceScore");
CREATE INDEX "InternalLinkSuggestion_status_idx" ON "InternalLinkSuggestion"("status");
CREATE INDEX "InternalLinkSuggestion_sourceUrl_idx" ON "InternalLinkSuggestion"("sourceUrl");
CREATE INDEX "InternalLinkSuggestion_targetUrl_idx" ON "InternalLinkSuggestion"("targetUrl");
CREATE INDEX "InternalLinkSuggestion_priority_idx" ON "InternalLinkSuggestion"("priority");
CREATE INDEX "InternalLinkSuggestion_implementedAt_idx" ON "InternalLinkSuggestion"("implementedAt");
CREATE TABLE "new_SEOAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "assignedTo" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SEOAlert" ("assignedTo", "createdAt", "id", "isRead", "isResolved", "message", "metadata", "resolvedAt", "resolvedBy", "severity", "title", "type", "updatedAt") SELECT "assignedTo", "createdAt", "id", "isRead", "isResolved", "message", "metadata", "resolvedAt", "resolvedBy", "severity", "title", "type", "updatedAt" FROM "SEOAlert";
DROP TABLE "SEOAlert";
ALTER TABLE "new_SEOAlert" RENAME TO "SEOAlert";
CREATE INDEX "SEOAlert_isRead_isResolved_idx" ON "SEOAlert"("isRead", "isResolved");
CREATE INDEX "SEOAlert_severity_idx" ON "SEOAlert"("severity");
CREATE INDEX "SEOAlert_type_idx" ON "SEOAlert"("type");
CREATE INDEX "SEOAlert_assignedTo_idx" ON "SEOAlert"("assignedTo");
CREATE INDEX "SEOAlert_createdAt_idx" ON "SEOAlert"("createdAt");
CREATE INDEX "SEOAlert_resourceType_resourceId_idx" ON "SEOAlert"("resourceType", "resourceId");
CREATE TABLE "new_SEOIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "affectedUrl" TEXT,
    "metadata" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SEOIssue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SEOPageAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SEOIssue" ("category", "detectedAt", "id", "isResolved", "message", "pageId", "recommendation", "resolvedAt", "resolvedBy", "severity", "type") SELECT "category", "detectedAt", "id", "isResolved", "message", "pageId", "recommendation", "resolvedAt", "resolvedBy", "severity", "type" FROM "SEOIssue";
DROP TABLE "SEOIssue";
ALTER TABLE "new_SEOIssue" RENAME TO "SEOIssue";
CREATE INDEX "SEOIssue_pageId_isResolved_idx" ON "SEOIssue"("pageId", "isResolved");
CREATE INDEX "SEOIssue_severity_isResolved_idx" ON "SEOIssue"("severity", "isResolved");
CREATE INDEX "SEOIssue_category_idx" ON "SEOIssue"("category");
CREATE INDEX "SEOIssue_detectedAt_idx" ON "SEOIssue"("detectedAt");
CREATE INDEX "SEOIssue_type_idx" ON "SEOIssue"("type");
CREATE TABLE "new_SEOKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0.0,
    "currentPosition" INTEGER,
    "previousPosition" INTEGER,
    "positionChange" INTEGER,
    "targetPosition" INTEGER NOT NULL DEFAULT 1,
    "targetUrl" TEXT,
    "contentId" TEXT,
    "contentType" TEXT,
    "country" TEXT NOT NULL DEFAULT 'global',
    "language" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SEOKeyword" ("contentId", "contentType", "country", "cpc", "createdAt", "currentPosition", "difficulty", "id", "keyword", "language", "searchVolume", "targetPosition", "updatedAt") SELECT "contentId", "contentType", "country", "cpc", "createdAt", "currentPosition", "difficulty", "id", "keyword", "language", "searchVolume", "targetPosition", "updatedAt" FROM "SEOKeyword";
DROP TABLE "SEOKeyword";
ALTER TABLE "new_SEOKeyword" RENAME TO "SEOKeyword";
CREATE UNIQUE INDEX "SEOKeyword_keyword_key" ON "SEOKeyword"("keyword");
CREATE INDEX "SEOKeyword_keyword_idx" ON "SEOKeyword"("keyword");
CREATE INDEX "SEOKeyword_currentPosition_idx" ON "SEOKeyword"("currentPosition");
CREATE INDEX "SEOKeyword_country_language_idx" ON "SEOKeyword"("country", "language");
CREATE INDEX "SEOKeyword_contentId_idx" ON "SEOKeyword"("contentId");
CREATE INDEX "SEOKeyword_isActive_idx" ON "SEOKeyword"("isActive");
CREATE TABLE "new_SEORanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0.0,
    "avgPosition" REAL NOT NULL DEFAULT 0.0,
    "previousPosition" INTEGER,
    "positionChange" INTEGER,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SEORanking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "SEOKeyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SEORanking" ("avgPosition", "checkDate", "clicks", "ctr", "id", "impressions", "keywordId", "position", "positionChange", "previousPosition", "snippet", "title", "url") SELECT "avgPosition", "checkDate", "clicks", "ctr", "id", "impressions", "keywordId", "position", "positionChange", "previousPosition", "snippet", "title", "url" FROM "SEORanking";
DROP TABLE "SEORanking";
ALTER TABLE "new_SEORanking" RENAME TO "SEORanking";
CREATE INDEX "SEORanking_keywordId_checkDate_idx" ON "SEORanking"("keywordId", "checkDate");
CREATE INDEX "SEORanking_position_idx" ON "SEORanking"("position");
CREATE INDEX "SEORanking_checkDate_idx" ON "SEORanking"("checkDate");
CREATE INDEX "SEORanking_date_idx" ON "SEORanking"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_fromPath_key" ON "Redirect"("fromPath");

-- CreateIndex
CREATE INDEX "Redirect_fromPath_idx" ON "Redirect"("fromPath");

-- CreateIndex
CREATE INDEX "Redirect_isActive_idx" ON "Redirect"("isActive");

-- CreateIndex
CREATE INDEX "AutomationLog_type_status_idx" ON "AutomationLog"("type", "status");

-- CreateIndex
CREATE INDEX "AutomationLog_startedAt_idx" ON "AutomationLog"("startedAt");

-- CreateIndex
CREATE INDEX "AutomationLog_createdAt_idx" ON "AutomationLog"("createdAt");
