-- CreateTable
CREATE TABLE "SEOKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0.0,
    "currentPosition" INTEGER,
    "targetPosition" INTEGER NOT NULL DEFAULT 1,
    "contentId" TEXT,
    "contentType" TEXT,
    "country" TEXT NOT NULL DEFAULT 'global',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEORanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0.0,
    "avgPosition" REAL NOT NULL DEFAULT 0.0,
    "previousPosition" INTEGER,
    "positionChange" INTEGER,
    "checkDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SEORanking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "SEOKeyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEOPageAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "contentId" TEXT,
    "contentType" TEXT,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "contentScore" INTEGER NOT NULL DEFAULT 0,
    "mobileScore" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "hasMetaDescription" BOOLEAN NOT NULL DEFAULT false,
    "hasCanonical" BOOLEAN NOT NULL DEFAULT false,
    "hasStructuredData" BOOLEAN NOT NULL DEFAULT false,
    "hasAMP" BOOLEAN NOT NULL DEFAULT false,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "readabilityScore" INTEGER NOT NULL DEFAULT 0,
    "keywordDensity" REAL NOT NULL DEFAULT 0.0,
    "internalLinks" INTEGER NOT NULL DEFAULT 0,
    "externalLinks" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "imagesMissingAlt" INTEGER NOT NULL DEFAULT 0,
    "loadTime" REAL NOT NULL DEFAULT 0.0,
    "timeToFirstByte" REAL NOT NULL DEFAULT 0.0,
    "firstContentfulPaint" REAL NOT NULL DEFAULT 0.0,
    "largestContentfulPaint" REAL NOT NULL DEFAULT 0.0,
    "cumulativeLayoutShift" REAL NOT NULL DEFAULT 0.0,
    "raoScore" INTEGER NOT NULL DEFAULT 0,
    "llmCitations" INTEGER NOT NULL DEFAULT 0,
    "aiOverviewAppearances" INTEGER NOT NULL DEFAULT 0,
    "semanticRelevance" REAL NOT NULL DEFAULT 0.0,
    "lastAnalyzed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SEOIssue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SEOPageAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEOAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "assignedTo" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOCompetitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "pageAuthority" INTEGER NOT NULL DEFAULT 0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "keywords" INTEGER NOT NULL DEFAULT 0,
    "traffic" INTEGER NOT NULL DEFAULT 0,
    "lastScraped" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOCompetitorAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorId" TEXT NOT NULL,
    "keywordsRanking" INTEGER NOT NULL DEFAULT 0,
    "topKeywords" TEXT NOT NULL,
    "averagePosition" REAL NOT NULL DEFAULT 0.0,
    "contentPublished" INTEGER NOT NULL DEFAULT 0,
    "backlinksGained" INTEGER NOT NULL DEFAULT 0,
    "analysisDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SEOCompetitorAnalysis_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "SEOCompetitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SEORankingPrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "currentPosition" INTEGER NOT NULL,
    "predictedPosition" INTEGER NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "trend" TEXT NOT NULL,
    "contentQuality" REAL NOT NULL DEFAULT 0.0,
    "technicalScore" REAL NOT NULL DEFAULT 0.0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "competitorStrength" REAL NOT NULL DEFAULT 0.0,
    "predictionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RAOPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "llmCitations" INTEGER NOT NULL DEFAULT 0,
    "citationSources" TEXT NOT NULL,
    "citationContexts" TEXT NOT NULL,
    "aiOverviews" INTEGER NOT NULL DEFAULT 0,
    "overviewSources" TEXT NOT NULL,
    "semanticRelevance" REAL NOT NULL DEFAULT 0.0,
    "entityRecognition" TEXT NOT NULL,
    "topicCoverage" REAL NOT NULL DEFAULT 0.0,
    "contentStructure" INTEGER NOT NULL DEFAULT 0,
    "factualAccuracy" INTEGER NOT NULL DEFAULT 0,
    "sourceAuthority" INTEGER NOT NULL DEFAULT 0,
    "trackingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SEOBacklink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "pageAuthority" INTEGER NOT NULL DEFAULT 0,
    "isDoFollow" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentSEOOptimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "titleScore" INTEGER NOT NULL DEFAULT 0,
    "descriptionScore" INTEGER NOT NULL DEFAULT 0,
    "keywordScore" INTEGER NOT NULL DEFAULT 0,
    "readabilityScore" INTEGER NOT NULL DEFAULT 0,
    "technicalScore" INTEGER NOT NULL DEFAULT 0,
    "optimizedTitle" TEXT,
    "optimizedDescription" TEXT,
    "optimizedKeywords" TEXT NOT NULL,
    "suggestedHeadlines" TEXT NOT NULL,
    "internalLinks" TEXT NOT NULL,
    "internalLinksCount" INTEGER NOT NULL DEFAULT 0,
    "externalLinksCount" INTEGER NOT NULL DEFAULT 0,
    "brokenLinksCount" INTEGER NOT NULL DEFAULT 0,
    "fleschKincaidGrade" REAL NOT NULL DEFAULT 0.0,
    "fleschReadingEase" REAL NOT NULL DEFAULT 0.0,
    "averageWordsPerSentence" REAL NOT NULL DEFAULT 0.0,
    "averageSyllablesPerWord" REAL NOT NULL DEFAULT 0.0,
    "complexWordsPercent" REAL NOT NULL DEFAULT 0.0,
    "semanticChunks" TEXT NOT NULL,
    "canonicalAnswers" TEXT NOT NULL,
    "entityMentions" TEXT NOT NULL,
    "factClaims" TEXT NOT NULL,
    "aiHeadlineSuggestions" TEXT NOT NULL,
    "aiContentSuggestions" TEXT NOT NULL,
    "aiKeywordSuggestions" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "lastOptimized" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optimizedBy" TEXT,
    "optimizationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HeadlineOptimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "originalHeadline" TEXT NOT NULL,
    "optimizedHeadline" TEXT NOT NULL,
    "predictedCTR" REAL NOT NULL DEFAULT 0.0,
    "actualCTR" REAL,
    "emotionalScore" INTEGER NOT NULL DEFAULT 0,
    "powerWords" TEXT NOT NULL,
    "lengthScore" INTEGER NOT NULL DEFAULT 0,
    "clarityScore" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testStartedAt" DATETIME,
    "testEndedAt" DATETIME
);

-- CreateTable
CREATE TABLE "InternalLinkSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceContentId" TEXT NOT NULL,
    "targetContentId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "contextSentence" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL DEFAULT 0.0,
    "topicSimilarity" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "implementedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadabilityAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "fleschKincaidGrade" REAL NOT NULL DEFAULT 0.0,
    "fleschReadingEase" REAL NOT NULL DEFAULT 0.0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "sentenceCount" INTEGER NOT NULL DEFAULT 0,
    "paragraphCount" INTEGER NOT NULL DEFAULT 0,
    "averageWordsPerSentence" REAL NOT NULL DEFAULT 0.0,
    "averageSyllablesPerWord" REAL NOT NULL DEFAULT 0.0,
    "complexWordsCount" INTEGER NOT NULL DEFAULT 0,
    "complexWordsPercent" REAL NOT NULL DEFAULT 0.0,
    "longSentencesCount" INTEGER NOT NULL DEFAULT 0,
    "gradeLevel" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SEOKeyword_keyword_key" ON "SEOKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SEOKeyword_keyword_idx" ON "SEOKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SEOKeyword_currentPosition_idx" ON "SEOKeyword"("currentPosition");

-- CreateIndex
CREATE INDEX "SEOKeyword_country_language_idx" ON "SEOKeyword"("country", "language");

-- CreateIndex
CREATE INDEX "SEOKeyword_contentId_idx" ON "SEOKeyword"("contentId");

-- CreateIndex
CREATE INDEX "SEORanking_keywordId_checkDate_idx" ON "SEORanking"("keywordId", "checkDate");

-- CreateIndex
CREATE INDEX "SEORanking_position_idx" ON "SEORanking"("position");

-- CreateIndex
CREATE INDEX "SEORanking_checkDate_idx" ON "SEORanking"("checkDate");

-- CreateIndex
CREATE UNIQUE INDEX "SEOPageAnalysis_url_key" ON "SEOPageAnalysis"("url");

-- CreateIndex
CREATE INDEX "SEOPageAnalysis_url_idx" ON "SEOPageAnalysis"("url");

-- CreateIndex
CREATE INDEX "SEOPageAnalysis_contentId_idx" ON "SEOPageAnalysis"("contentId");

-- CreateIndex
CREATE INDEX "SEOPageAnalysis_overallScore_idx" ON "SEOPageAnalysis"("overallScore");

-- CreateIndex
CREATE INDEX "SEOPageAnalysis_lastAnalyzed_idx" ON "SEOPageAnalysis"("lastAnalyzed");

-- CreateIndex
CREATE INDEX "SEOIssue_pageId_isResolved_idx" ON "SEOIssue"("pageId", "isResolved");

-- CreateIndex
CREATE INDEX "SEOIssue_severity_isResolved_idx" ON "SEOIssue"("severity", "isResolved");

-- CreateIndex
CREATE INDEX "SEOIssue_category_idx" ON "SEOIssue"("category");

-- CreateIndex
CREATE INDEX "SEOIssue_detectedAt_idx" ON "SEOIssue"("detectedAt");

-- CreateIndex
CREATE INDEX "SEOAlert_isRead_isResolved_idx" ON "SEOAlert"("isRead", "isResolved");

-- CreateIndex
CREATE INDEX "SEOAlert_severity_idx" ON "SEOAlert"("severity");

-- CreateIndex
CREATE INDEX "SEOAlert_type_idx" ON "SEOAlert"("type");

-- CreateIndex
CREATE INDEX "SEOAlert_assignedTo_idx" ON "SEOAlert"("assignedTo");

-- CreateIndex
CREATE INDEX "SEOAlert_createdAt_idx" ON "SEOAlert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SEOCompetitor_domain_key" ON "SEOCompetitor"("domain");

-- CreateIndex
CREATE INDEX "SEOCompetitor_domain_idx" ON "SEOCompetitor"("domain");

-- CreateIndex
CREATE INDEX "SEOCompetitor_isActive_idx" ON "SEOCompetitor"("isActive");

-- CreateIndex
CREATE INDEX "SEOCompetitorAnalysis_competitorId_analysisDate_idx" ON "SEOCompetitorAnalysis"("competitorId", "analysisDate");

-- CreateIndex
CREATE INDEX "SEOCompetitorAnalysis_analysisDate_idx" ON "SEOCompetitorAnalysis"("analysisDate");

-- CreateIndex
CREATE INDEX "SEORankingPrediction_keywordId_idx" ON "SEORankingPrediction"("keywordId");

-- CreateIndex
CREATE INDEX "SEORankingPrediction_predictionDate_idx" ON "SEORankingPrediction"("predictionDate");

-- CreateIndex
CREATE INDEX "SEORankingPrediction_trend_idx" ON "SEORankingPrediction"("trend");

-- CreateIndex
CREATE INDEX "RAOPerformance_contentId_idx" ON "RAOPerformance"("contentId");

-- CreateIndex
CREATE INDEX "RAOPerformance_llmCitations_idx" ON "RAOPerformance"("llmCitations");

-- CreateIndex
CREATE INDEX "RAOPerformance_aiOverviews_idx" ON "RAOPerformance"("aiOverviews");

-- CreateIndex
CREATE INDEX "RAOPerformance_trackingDate_idx" ON "RAOPerformance"("trackingDate");

-- CreateIndex
CREATE INDEX "SEOBacklink_targetUrl_isActive_idx" ON "SEOBacklink"("targetUrl", "isActive");

-- CreateIndex
CREATE INDEX "SEOBacklink_sourceUrl_idx" ON "SEOBacklink"("sourceUrl");

-- CreateIndex
CREATE INDEX "SEOBacklink_domainAuthority_idx" ON "SEOBacklink"("domainAuthority");

-- CreateIndex
CREATE INDEX "SEOBacklink_lastChecked_idx" ON "SEOBacklink"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSEOOptimization_contentId_key" ON "ContentSEOOptimization"("contentId");

-- CreateIndex
CREATE INDEX "ContentSEOOptimization_contentId_idx" ON "ContentSEOOptimization"("contentId");

-- CreateIndex
CREATE INDEX "ContentSEOOptimization_overallScore_idx" ON "ContentSEOOptimization"("overallScore");

-- CreateIndex
CREATE INDEX "ContentSEOOptimization_lastOptimized_idx" ON "ContentSEOOptimization"("lastOptimized");

-- CreateIndex
CREATE INDEX "ContentSEOOptimization_contentType_idx" ON "ContentSEOOptimization"("contentType");

-- CreateIndex
CREATE INDEX "HeadlineOptimization_contentId_isActive_idx" ON "HeadlineOptimization"("contentId", "isActive");

-- CreateIndex
CREATE INDEX "HeadlineOptimization_predictedCTR_idx" ON "HeadlineOptimization"("predictedCTR");

-- CreateIndex
CREATE INDEX "HeadlineOptimization_createdAt_idx" ON "HeadlineOptimization"("createdAt");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_sourceContentId_status_idx" ON "InternalLinkSuggestion"("sourceContentId", "status");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_relevanceScore_idx" ON "InternalLinkSuggestion"("relevanceScore");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_status_idx" ON "InternalLinkSuggestion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadabilityAnalysis_contentId_key" ON "ReadabilityAnalysis"("contentId");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_contentId_idx" ON "ReadabilityAnalysis"("contentId");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_fleschKincaidGrade_idx" ON "ReadabilityAnalysis"("fleschKincaidGrade");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_gradeLevel_idx" ON "ReadabilityAnalysis"("gradeLevel");
