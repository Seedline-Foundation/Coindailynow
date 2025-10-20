-- CreateTable
CREATE TABLE "SourceCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "canonicalAnswerId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceAuthor" TEXT,
    "sourceDate" DATETIME,
    "sourceDomain" TEXT,
    "citationText" TEXT NOT NULL,
    "citationStyle" TEXT NOT NULL DEFAULT 'APA',
    "reliability" INTEGER NOT NULL DEFAULT 0,
    "authorityScore" INTEGER NOT NULL DEFAULT 0,
    "freshness" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SourceCitation_canonicalAnswerId_fkey" FOREIGN KEY ("canonicalAnswerId") REFERENCES "CanonicalAnswer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AISchemaMarkup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "schemaJson" TEXT NOT NULL,
    "mainEntity" TEXT,
    "definitions" TEXT,
    "facts" TEXT,
    "quotes" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LLMMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "llmsTextContent" TEXT NOT NULL,
    "aiSourceTags" TEXT NOT NULL,
    "semanticTags" TEXT,
    "microdata" TEXT,
    "rdfa" TEXT,
    "openGraphAI" TEXT,
    "twitterCardsAI" TEXT,
    "canonicalUrl" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "readabilityScore" INTEGER NOT NULL DEFAULT 0,
    "entityDensity" REAL NOT NULL DEFAULT 0.0,
    "factDensity" REAL NOT NULL DEFAULT 0.0,
    "citationDensity" REAL NOT NULL DEFAULT 0.0,
    "structureComplexity" INTEGER NOT NULL DEFAULT 0,
    "llmOptimizationScore" INTEGER NOT NULL DEFAULT 0,
    "lastOptimized" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrustSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalSource" TEXT NOT NULL,
    "signalValue" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RAOCitationMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "totalSchemaMarkups" INTEGER NOT NULL DEFAULT 0,
    "totalDefinitions" INTEGER NOT NULL DEFAULT 0,
    "totalFacts" INTEGER NOT NULL DEFAULT 0,
    "totalQuotes" INTEGER NOT NULL DEFAULT 0,
    "totalCanonicalAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "totalTrustSignals" INTEGER NOT NULL DEFAULT 0,
    "avgSchemaQuality" REAL NOT NULL DEFAULT 0.0,
    "avgCitationReliability" REAL NOT NULL DEFAULT 0.0,
    "avgTrustScore" REAL NOT NULL DEFAULT 0.0,
    "llmOptimizationScore" INTEGER NOT NULL DEFAULT 0,
    "citationDensity" REAL NOT NULL DEFAULT 0.0,
    "authorityScore" INTEGER NOT NULL DEFAULT 0,
    "aiReadabilityScore" INTEGER NOT NULL DEFAULT 0,
    "llmCitationCount" INTEGER NOT NULL DEFAULT 0,
    "lastLLMCitedAt" DATETIME,
    "lastOptimizedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrategyKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0.0,
    "competition" TEXT NOT NULL DEFAULT 'MEDIUM',
    "trend" TEXT NOT NULL DEFAULT 'STABLE',
    "intent" TEXT NOT NULL DEFAULT 'INFORMATIONAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "parentKeyword" TEXT,
    "relatedKeywords" TEXT,
    "topRankingUrls" TEXT,
    "contentGap" TEXT,
    "targetPosition" INTEGER NOT NULL DEFAULT 10,
    "currentPosition" INTEGER,
    "topicClusterId" TEXT,
    "metrics" TEXT,
    "lastAnalyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StrategyKeyword_topicClusterId_fkey" FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopicCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pillarTopic" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "description" TEXT,
    "targetAudience" TEXT,
    "contentCount" INTEGER NOT NULL DEFAULT 0,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "draftCount" INTEGER NOT NULL DEFAULT 0,
    "avgSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "totalSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "clusterScore" INTEGER NOT NULL DEFAULT 0,
    "internalLinks" INTEGER NOT NULL DEFAULT 0,
    "externalLinks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "seoMetrics" TEXT,
    "contentStrategy" TEXT,
    "keywordIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompetitorAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorName" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "monthlyTraffic" INTEGER NOT NULL DEFAULT 0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "referringDomains" INTEGER NOT NULL DEFAULT 0,
    "organicKeywords" INTEGER NOT NULL DEFAULT 0,
    "paidKeywords" INTEGER NOT NULL DEFAULT 0,
    "contentVelocity" INTEGER NOT NULL DEFAULT 0,
    "socialFollowers" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "contentGaps" TEXT,
    "topKeywords" TEXT,
    "topPages" TEXT,
    "contentTypes" TEXT,
    "publishingSchedule" TEXT,
    "targetAudience" TEXT,
    "monetizationStrategy" TEXT,
    "swotAnalysis" TEXT,
    "competitiveAdvantage" TEXT,
    "threatLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastAnalyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentCalendarItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'ARTICLE',
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "primaryKeywordId" TEXT,
    "topicClusterId" TEXT,
    "targetAudience" TEXT,
    "contentBrief" TEXT,
    "outline" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "scheduledDate" DATETIME NOT NULL,
    "publishedDate" DATETIME,
    "estimatedReadTime" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "seoScore" INTEGER,
    "qualityScore" INTEGER,
    "engagementGoal" INTEGER,
    "keywords" TEXT,
    "internalLinks" TEXT,
    "externalSources" TEXT,
    "callToAction" TEXT,
    "contentGoals" TEXT,
    "performanceMetrics" TEXT,
    "notes" TEXT,
    "articleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentCalendarItem_primaryKeywordId_fkey" FOREIGN KEY ("primaryKeywordId") REFERENCES "StrategyKeyword" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentCalendarItem_topicClusterId_fkey" FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendMonitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trendType" TEXT NOT NULL,
    "trendName" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "velocity" TEXT NOT NULL DEFAULT 'STABLE',
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "socialMentions" INTEGER NOT NULL DEFAULT 0,
    "newsArticles" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" REAL NOT NULL DEFAULT 0.0,
    "peakDate" DATETIME,
    "predictedDuration" INTEGER,
    "contentOpportunity" TEXT,
    "relatedKeywords" TEXT,
    "influencers" TEXT,
    "demography" TEXT,
    "actionItems" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentStrategyMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateRange" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalKeywords" INTEGER NOT NULL DEFAULT 0,
    "activeKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgKeywordDifficulty" REAL NOT NULL DEFAULT 0.0,
    "avgSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "topicClusters" INTEGER NOT NULL DEFAULT 0,
    "contentItemsPlanned" INTEGER NOT NULL DEFAULT 0,
    "contentItemsPublished" INTEGER NOT NULL DEFAULT 0,
    "avgContentQuality" REAL NOT NULL DEFAULT 0.0,
    "avgSEOScore" REAL NOT NULL DEFAULT 0.0,
    "competitorsTracked" INTEGER NOT NULL DEFAULT 0,
    "trendsIdentified" INTEGER NOT NULL DEFAULT 0,
    "trendsActioned" INTEGER NOT NULL DEFAULT 0,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "keywordRankings" TEXT,
    "contentPerformance" TEXT,
    "competitorGaps" TEXT,
    "strategyRecommendations" TEXT,
    "regionPerformance" TEXT,
    "categoryPerformance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Backlink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceUrl" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT,
    "linkType" TEXT NOT NULL,
    "context" TEXT,
    "discoveryMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "pageAuthority" INTEGER NOT NULL DEFAULT 0,
    "trustFlow" INTEGER NOT NULL DEFAULT 0,
    "citationFlow" INTEGER NOT NULL DEFAULT 0,
    "spamScore" INTEGER NOT NULL DEFAULT 0,
    "trafficEstimate" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" DATETIME,
    "campaignId" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Backlink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkBuildingCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "targetBacklinks" INTEGER NOT NULL DEFAULT 50,
    "targetDomainAuth" INTEGER NOT NULL DEFAULT 40,
    "budget" REAL,
    "spent" REAL NOT NULL DEFAULT 0.0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "description" TEXT,
    "goals" TEXT,
    "strategy" TEXT,
    "resources" TEXT,
    "kpis" TEXT,
    "createdBy" TEXT,
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "backlinksAcquired" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "avgDomainAuthority" REAL NOT NULL DEFAULT 0.0,
    "successRate" REAL NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LinkProspect" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactRole" TEXT,
    "prospectType" TEXT NOT NULL,
    "region" TEXT,
    "category" TEXT,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "trafficEstimate" INTEGER NOT NULL DEFAULT 0,
    "socialFollowers" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "linkPotential" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "relationshipStrength" TEXT NOT NULL DEFAULT 'COLD',
    "notes" TEXT,
    "tags" TEXT,
    "lastContactedAt" DATETIME,
    "responseRate" REAL,
    "campaignId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkProspect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "activityType" TEXT NOT NULL,
    "channel" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "templateUsed" TEXT,
    "sentBy" TEXT,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedAt" DATETIME,
    "outcome" TEXT,
    "followUpDate" DATETIME,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OutreachActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "LinkProspect" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OutreachActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InfluencerPartnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "influencerName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "email" TEXT,
    "region" TEXT,
    "category" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0.0,
    "averageViews" INTEGER NOT NULL DEFAULT 0,
    "audienceDemography" TEXT,
    "contentFocus" TEXT,
    "partnershipType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "relationshipLevel" TEXT NOT NULL DEFAULT 'COLD',
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "deliverables" TEXT,
    "compensation" TEXT,
    "budget" REAL,
    "spent" REAL NOT NULL DEFAULT 0.0,
    "backlinksGenerated" INTEGER NOT NULL DEFAULT 0,
    "mentionsCount" INTEGER NOT NULL DEFAULT 0,
    "trafficGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "roi" REAL NOT NULL DEFAULT 0.0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "lastCollaboration" DATETIME,
    "nextCollaboration" DATETIME,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LinkVelocityMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "newBacklinks" INTEGER NOT NULL DEFAULT 0,
    "lostBacklinks" INTEGER NOT NULL DEFAULT 0,
    "netChange" INTEGER NOT NULL DEFAULT 0,
    "totalActiveBacklinks" INTEGER NOT NULL DEFAULT 0,
    "avgDomainAuthority" REAL NOT NULL DEFAULT 0.0,
    "avgQualityScore" REAL NOT NULL DEFAULT 0.0,
    "dofollowCount" INTEGER NOT NULL DEFAULT 0,
    "nofollowCount" INTEGER NOT NULL DEFAULT 0,
    "topDomains" TEXT,
    "lostDomains" TEXT,
    "regionDistribution" TEXT,
    "categoryDistribution" TEXT,
    "velocityScore" INTEGER NOT NULL DEFAULT 0,
    "velocityTrend" TEXT NOT NULL DEFAULT 'STABLE',
    "alerts" TEXT,
    "recommendations" TEXT,
    "competitorComparison" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuthorityMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "domainRating" INTEGER NOT NULL DEFAULT 0,
    "trustFlow" INTEGER NOT NULL DEFAULT 0,
    "citationFlow" INTEGER NOT NULL DEFAULT 0,
    "organicKeywords" INTEGER NOT NULL DEFAULT 0,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "referringDomains" INTEGER NOT NULL DEFAULT 0,
    "totalBacklinks" INTEGER NOT NULL DEFAULT 0,
    "brandMentions" INTEGER NOT NULL DEFAULT 0,
    "socialSignals" INTEGER NOT NULL DEFAULT 0,
    "contentIndexed" INTEGER NOT NULL DEFAULT 0,
    "topRankings" INTEGER NOT NULL DEFAULT 0,
    "authorityScore" INTEGER NOT NULL DEFAULT 0,
    "industryRank" INTEGER,
    "competitorGap" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "opportunities" TEXT,
    "threats" TEXT,
    "recommendations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CanonicalAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "sources" TEXT,
    "relatedQuestions" TEXT,
    "factClaims" TEXT,
    "keywords" TEXT,
    "entities" TEXT,
    "llmFormat" TEXT NOT NULL,
    "qualityScore" REAL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastCitedAt" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CanonicalAnswer" ("answer", "answerType", "articleId", "confidence", "createdAt", "factClaims", "id", "isVerified", "keywords", "llmFormat", "qualityScore", "question", "relatedQuestions", "sources", "updatedAt", "verifiedAt", "verifiedBy") SELECT "answer", "answerType", "articleId", "confidence", "createdAt", "factClaims", "id", "isVerified", "keywords", "llmFormat", "qualityScore", "question", "relatedQuestions", "sources", "updatedAt", "verifiedAt", "verifiedBy" FROM "CanonicalAnswer";
DROP TABLE "CanonicalAnswer";
ALTER TABLE "new_CanonicalAnswer" RENAME TO "CanonicalAnswer";
CREATE INDEX "CanonicalAnswer_articleId_idx" ON "CanonicalAnswer"("articleId");
CREATE INDEX "CanonicalAnswer_answerType_idx" ON "CanonicalAnswer"("answerType");
CREATE INDEX "CanonicalAnswer_confidence_idx" ON "CanonicalAnswer"("confidence");
CREATE INDEX "CanonicalAnswer_isVerified_idx" ON "CanonicalAnswer"("isVerified");
CREATE INDEX "CanonicalAnswer_usageCount_idx" ON "CanonicalAnswer"("usageCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SourceCitation_contentId_idx" ON "SourceCitation"("contentId");

-- CreateIndex
CREATE INDEX "SourceCitation_sourceType_idx" ON "SourceCitation"("sourceType");

-- CreateIndex
CREATE INDEX "SourceCitation_reliability_idx" ON "SourceCitation"("reliability");

-- CreateIndex
CREATE INDEX "SourceCitation_authorityScore_idx" ON "SourceCitation"("authorityScore");

-- CreateIndex
CREATE INDEX "SourceCitation_canonicalAnswerId_idx" ON "SourceCitation"("canonicalAnswerId");

-- CreateIndex
CREATE INDEX "AISchemaMarkup_contentId_contentType_idx" ON "AISchemaMarkup"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "AISchemaMarkup_schemaType_idx" ON "AISchemaMarkup"("schemaType");

-- CreateIndex
CREATE INDEX "AISchemaMarkup_mainEntity_idx" ON "AISchemaMarkup"("mainEntity");

-- CreateIndex
CREATE INDEX "AISchemaMarkup_qualityScore_idx" ON "AISchemaMarkup"("qualityScore");

-- CreateIndex
CREATE INDEX "AISchemaMarkup_isValid_idx" ON "AISchemaMarkup"("isValid");

-- CreateIndex
CREATE INDEX "LLMMetadata_contentId_idx" ON "LLMMetadata"("contentId");

-- CreateIndex
CREATE INDEX "LLMMetadata_languageCode_idx" ON "LLMMetadata"("languageCode");

-- CreateIndex
CREATE INDEX "LLMMetadata_llmOptimizationScore_idx" ON "LLMMetadata"("llmOptimizationScore");

-- CreateIndex
CREATE INDEX "LLMMetadata_lastOptimized_idx" ON "LLMMetadata"("lastOptimized");

-- CreateIndex
CREATE UNIQUE INDEX "LLMMetadata_contentId_contentType_key" ON "LLMMetadata"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "TrustSignal_contentId_idx" ON "TrustSignal"("contentId");

-- CreateIndex
CREATE INDEX "TrustSignal_signalType_idx" ON "TrustSignal"("signalType");

-- CreateIndex
CREATE INDEX "TrustSignal_isActive_idx" ON "TrustSignal"("isActive");

-- CreateIndex
CREATE INDEX "TrustSignal_expiresAt_idx" ON "TrustSignal"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RAOCitationMetrics_contentId_key" ON "RAOCitationMetrics"("contentId");

-- CreateIndex
CREATE INDEX "RAOCitationMetrics_contentId_idx" ON "RAOCitationMetrics"("contentId");

-- CreateIndex
CREATE INDEX "RAOCitationMetrics_llmOptimizationScore_idx" ON "RAOCitationMetrics"("llmOptimizationScore");

-- CreateIndex
CREATE INDEX "RAOCitationMetrics_authorityScore_idx" ON "RAOCitationMetrics"("authorityScore");

-- CreateIndex
CREATE INDEX "RAOCitationMetrics_llmCitationCount_idx" ON "RAOCitationMetrics"("llmCitationCount");

-- CreateIndex
CREATE INDEX "RAOCitationMetrics_lastOptimizedAt_idx" ON "RAOCitationMetrics"("lastOptimizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyKeyword_keyword_key" ON "StrategyKeyword"("keyword");

-- CreateIndex
CREATE INDEX "StrategyKeyword_region_idx" ON "StrategyKeyword"("region");

-- CreateIndex
CREATE INDEX "StrategyKeyword_category_idx" ON "StrategyKeyword"("category");

-- CreateIndex
CREATE INDEX "StrategyKeyword_priority_idx" ON "StrategyKeyword"("priority");

-- CreateIndex
CREATE INDEX "StrategyKeyword_status_idx" ON "StrategyKeyword"("status");

-- CreateIndex
CREATE INDEX "StrategyKeyword_trend_idx" ON "StrategyKeyword"("trend");

-- CreateIndex
CREATE INDEX "StrategyKeyword_topicClusterId_idx" ON "StrategyKeyword"("topicClusterId");

-- CreateIndex
CREATE INDEX "StrategyKeyword_searchVolume_idx" ON "StrategyKeyword"("searchVolume");

-- CreateIndex
CREATE INDEX "StrategyKeyword_difficulty_idx" ON "StrategyKeyword"("difficulty");

-- CreateIndex
CREATE INDEX "TopicCluster_region_idx" ON "TopicCluster"("region");

-- CreateIndex
CREATE INDEX "TopicCluster_category_idx" ON "TopicCluster"("category");

-- CreateIndex
CREATE INDEX "TopicCluster_status_idx" ON "TopicCluster"("status");

-- CreateIndex
CREATE INDEX "TopicCluster_priority_idx" ON "TopicCluster"("priority");

-- CreateIndex
CREATE INDEX "TopicCluster_clusterScore_idx" ON "TopicCluster"("clusterScore");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorAnalysis_domain_key" ON "CompetitorAnalysis"("domain");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domain_idx" ON "CompetitorAnalysis"("domain");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_region_idx" ON "CompetitorAnalysis"("region");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_category_idx" ON "CompetitorAnalysis"("category");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_domainAuthority_idx" ON "CompetitorAnalysis"("domainAuthority");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_threatLevel_idx" ON "CompetitorAnalysis"("threatLevel");

-- CreateIndex
CREATE INDEX "CompetitorAnalysis_status_idx" ON "CompetitorAnalysis"("status");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_status_idx" ON "ContentCalendarItem"("status");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_scheduledDate_idx" ON "ContentCalendarItem"("scheduledDate");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_region_idx" ON "ContentCalendarItem"("region");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_category_idx" ON "ContentCalendarItem"("category");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_priority_idx" ON "ContentCalendarItem"("priority");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_primaryKeywordId_idx" ON "ContentCalendarItem"("primaryKeywordId");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_topicClusterId_idx" ON "ContentCalendarItem"("topicClusterId");

-- CreateIndex
CREATE INDEX "ContentCalendarItem_assignedTo_idx" ON "ContentCalendarItem"("assignedTo");

-- CreateIndex
CREATE INDEX "TrendMonitor_trendType_idx" ON "TrendMonitor"("trendType");

-- CreateIndex
CREATE INDEX "TrendMonitor_region_idx" ON "TrendMonitor"("region");

-- CreateIndex
CREATE INDEX "TrendMonitor_category_idx" ON "TrendMonitor"("category");

-- CreateIndex
CREATE INDEX "TrendMonitor_trendScore_idx" ON "TrendMonitor"("trendScore");

-- CreateIndex
CREATE INDEX "TrendMonitor_velocity_idx" ON "TrendMonitor"("velocity");

-- CreateIndex
CREATE INDEX "TrendMonitor_status_idx" ON "TrendMonitor"("status");

-- CreateIndex
CREATE INDEX "TrendMonitor_isActioned_idx" ON "TrendMonitor"("isActioned");

-- CreateIndex
CREATE INDEX "TrendMonitor_detectedAt_idx" ON "TrendMonitor"("detectedAt");

-- CreateIndex
CREATE INDEX "ContentStrategyMetrics_dateRange_idx" ON "ContentStrategyMetrics"("dateRange");

-- CreateIndex
CREATE INDEX "ContentStrategyMetrics_startDate_idx" ON "ContentStrategyMetrics"("startDate");

-- CreateIndex
CREATE INDEX "ContentStrategyMetrics_endDate_idx" ON "ContentStrategyMetrics"("endDate");

-- CreateIndex
CREATE INDEX "Backlink_sourceDomain_idx" ON "Backlink"("sourceDomain");

-- CreateIndex
CREATE INDEX "Backlink_targetUrl_idx" ON "Backlink"("targetUrl");

-- CreateIndex
CREATE INDEX "Backlink_status_idx" ON "Backlink"("status");

-- CreateIndex
CREATE INDEX "Backlink_qualityScore_idx" ON "Backlink"("qualityScore");

-- CreateIndex
CREATE INDEX "Backlink_region_idx" ON "Backlink"("region");

-- CreateIndex
CREATE INDEX "Backlink_campaignId_idx" ON "Backlink"("campaignId");

-- CreateIndex
CREATE INDEX "Backlink_firstSeenAt_idx" ON "Backlink"("firstSeenAt");

-- CreateIndex
CREATE INDEX "LinkBuildingCampaign_campaignType_idx" ON "LinkBuildingCampaign"("campaignType");

-- CreateIndex
CREATE INDEX "LinkBuildingCampaign_status_idx" ON "LinkBuildingCampaign"("status");

-- CreateIndex
CREATE INDEX "LinkBuildingCampaign_region_idx" ON "LinkBuildingCampaign"("region");

-- CreateIndex
CREATE INDEX "LinkBuildingCampaign_startDate_idx" ON "LinkBuildingCampaign"("startDate");

-- CreateIndex
CREATE INDEX "LinkBuildingCampaign_priority_idx" ON "LinkBuildingCampaign"("priority");

-- CreateIndex
CREATE INDEX "LinkProspect_domain_idx" ON "LinkProspect"("domain");

-- CreateIndex
CREATE INDEX "LinkProspect_prospectType_idx" ON "LinkProspect"("prospectType");

-- CreateIndex
CREATE INDEX "LinkProspect_status_idx" ON "LinkProspect"("status");

-- CreateIndex
CREATE INDEX "LinkProspect_region_idx" ON "LinkProspect"("region");

-- CreateIndex
CREATE INDEX "LinkProspect_priority_idx" ON "LinkProspect"("priority");

-- CreateIndex
CREATE INDEX "LinkProspect_qualityScore_idx" ON "LinkProspect"("qualityScore");

-- CreateIndex
CREATE INDEX "LinkProspect_campaignId_idx" ON "LinkProspect"("campaignId");

-- CreateIndex
CREATE INDEX "OutreachActivity_prospectId_idx" ON "OutreachActivity"("prospectId");

-- CreateIndex
CREATE INDEX "OutreachActivity_campaignId_idx" ON "OutreachActivity"("campaignId");

-- CreateIndex
CREATE INDEX "OutreachActivity_activityType_idx" ON "OutreachActivity"("activityType");

-- CreateIndex
CREATE INDEX "OutreachActivity_status_idx" ON "OutreachActivity"("status");

-- CreateIndex
CREATE INDEX "OutreachActivity_sentAt_idx" ON "OutreachActivity"("sentAt");

-- CreateIndex
CREATE INDEX "OutreachActivity_followUpDate_idx" ON "OutreachActivity"("followUpDate");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_platform_idx" ON "InfluencerPartnership"("platform");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_region_idx" ON "InfluencerPartnership"("region");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_status_idx" ON "InfluencerPartnership"("status");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_partnershipType_idx" ON "InfluencerPartnership"("partnershipType");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_performanceScore_idx" ON "InfluencerPartnership"("performanceScore");

-- CreateIndex
CREATE INDEX "InfluencerPartnership_followerCount_idx" ON "InfluencerPartnership"("followerCount");

-- CreateIndex
CREATE INDEX "LinkVelocityMetric_metricDate_idx" ON "LinkVelocityMetric"("metricDate");

-- CreateIndex
CREATE INDEX "LinkVelocityMetric_period_idx" ON "LinkVelocityMetric"("period");

-- CreateIndex
CREATE INDEX "LinkVelocityMetric_velocityTrend_idx" ON "LinkVelocityMetric"("velocityTrend");

-- CreateIndex
CREATE INDEX "AuthorityMetrics_metricDate_idx" ON "AuthorityMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "AuthorityMetrics_authorityScore_idx" ON "AuthorityMetrics"("authorityScore");

-- CreateIndex
CREATE INDEX "AuthorityMetrics_domainAuthority_idx" ON "AuthorityMetrics"("domainAuthority");
