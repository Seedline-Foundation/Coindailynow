-- CreateTable
CREATE TABLE "EEATScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "experienceScore" INTEGER NOT NULL DEFAULT 0,
    "expertiseScore" INTEGER NOT NULL DEFAULT 0,
    "authoritativenessScore" INTEGER NOT NULL DEFAULT 0,
    "trustworthinessScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "firsthandExperience" BOOLEAN NOT NULL DEFAULT false,
    "personalInsights" BOOLEAN NOT NULL DEFAULT false,
    "uniquePerspective" BOOLEAN NOT NULL DEFAULT false,
    "realWorldExamples" BOOLEAN NOT NULL DEFAULT false,
    "authorCredentials" TEXT NOT NULL,
    "topicDepth" REAL NOT NULL DEFAULT 0.0,
    "technicalAccuracy" REAL NOT NULL DEFAULT 0.0,
    "industryRecognition" BOOLEAN NOT NULL DEFAULT false,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "brandMentions" INTEGER NOT NULL DEFAULT 0,
    "factCheckScore" REAL NOT NULL DEFAULT 0.0,
    "sourcesQuality" REAL NOT NULL DEFAULT 0.0,
    "transparencyScore" REAL NOT NULL DEFAULT 0.0,
    "accuracyHistory" REAL NOT NULL DEFAULT 0.0,
    "contentRelevance" REAL NOT NULL DEFAULT 0.0,
    "userSatisfaction" REAL NOT NULL DEFAULT 0.0,
    "engagementQuality" REAL NOT NULL DEFAULT 0.0,
    "improvements" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompetitorIntelligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contentStrategy" TEXT NOT NULL,
    "keywordStrategy" TEXT NOT NULL,
    "backlinkStrategy" TEXT NOT NULL,
    "technicalStrategy" TEXT NOT NULL,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "keywordRankings" INTEGER NOT NULL DEFAULT 0,
    "topKeywords" TEXT NOT NULL,
    "contentFrequency" REAL NOT NULL DEFAULT 0.0,
    "avgContentLength" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "opportunities" TEXT NOT NULL,
    "threats" TEXT NOT NULL,
    "keywordGaps" TEXT NOT NULL,
    "contentGaps" TEXT NOT NULL,
    "backlinkGaps" TEXT NOT NULL,
    "actionableInsights" TEXT NOT NULL,
    "priorityActions" TEXT NOT NULL,
    "estimatedImpact" REAL NOT NULL DEFAULT 0.0,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchForecast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "forecast30Days" TEXT NOT NULL,
    "forecast60Days" TEXT NOT NULL,
    "forecast90Days" TEXT NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "trendStrength" REAL NOT NULL DEFAULT 0.0,
    "seasonality" TEXT NOT NULL,
    "volatility" REAL NOT NULL DEFAULT 0.0,
    "currentVolume" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume30" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume60" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume90" INTEGER NOT NULL DEFAULT 0,
    "volumeChangePercent" REAL NOT NULL DEFAULT 0.0,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition30" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition60" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition90" INTEGER NOT NULL DEFAULT 0,
    "positionChangePercent" REAL NOT NULL DEFAULT 0.0,
    "currentClicks" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks30" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks60" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks90" INTEGER NOT NULL DEFAULT 0,
    "clicksChangePercent" REAL NOT NULL DEFAULT 0.0,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "accuracy" REAL NOT NULL DEFAULT 0.0,
    "dataQuality" REAL NOT NULL DEFAULT 0.0,
    "factors" TEXT NOT NULL,
    "opportunities" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RankingPrediction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "currentRanking" INTEGER NOT NULL DEFAULT 0,
    "currentScore" REAL NOT NULL DEFAULT 0.0,
    "currentTraffic" INTEGER NOT NULL DEFAULT 0,
    "predicted7Days" TEXT NOT NULL,
    "predicted14Days" TEXT NOT NULL,
    "predicted30Days" TEXT NOT NULL,
    "predicted60Days" TEXT NOT NULL,
    "predicted90Days" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "modelAccuracy" REAL NOT NULL DEFAULT 0.0,
    "trainingDataSize" INTEGER NOT NULL DEFAULT 0,
    "featureImportance" TEXT NOT NULL,
    "contentQuality" REAL NOT NULL DEFAULT 0.0,
    "technicalSEO" REAL NOT NULL DEFAULT 0.0,
    "backlinkProfile" REAL NOT NULL DEFAULT 0.0,
    "userEngagement" REAL NOT NULL DEFAULT 0.0,
    "competitivePosition" REAL NOT NULL DEFAULT 0.0,
    "estimatedTrafficGain" INTEGER NOT NULL DEFAULT 0,
    "estimatedRevenue" REAL NOT NULL DEFAULT 0.0,
    "probabilityTop10" REAL NOT NULL DEFAULT 0.0,
    "probabilityTop3" REAL NOT NULL DEFAULT 0.0,
    "quickWins" TEXT NOT NULL,
    "longTermActions" TEXT NOT NULL,
    "requiredResources" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SEOIntelligenceMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "avgEEATScore" REAL NOT NULL DEFAULT 0.0,
    "contentAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "eeatImprovements" INTEGER NOT NULL DEFAULT 0,
    "competitorsTracked" INTEGER NOT NULL DEFAULT 0,
    "keywordGapsFound" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesIdentified" INTEGER NOT NULL DEFAULT 0,
    "actionsRecommended" INTEGER NOT NULL DEFAULT 0,
    "keywordsForecast" INTEGER NOT NULL DEFAULT 0,
    "avgForecastAccuracy" REAL NOT NULL DEFAULT 0.0,
    "trafficPredicted" INTEGER NOT NULL DEFAULT 0,
    "trafficActual" INTEGER NOT NULL DEFAULT 0,
    "predictionsGenerated" INTEGER NOT NULL DEFAULT 0,
    "avgPredictionAccuracy" REAL NOT NULL DEFAULT 0.0,
    "top10Predictions" INTEGER NOT NULL DEFAULT 0,
    "top3Predictions" INTEGER NOT NULL DEFAULT 0,
    "insightsGenerated" INTEGER NOT NULL DEFAULT 0,
    "actionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "impactRealized" REAL NOT NULL DEFAULT 0.0,
    "roiGenerated" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "EEATScore_contentId_key" ON "EEATScore"("contentId");

-- CreateIndex
CREATE INDEX "EEATScore_overallScore_idx" ON "EEATScore"("overallScore");

-- CreateIndex
CREATE INDEX "EEATScore_contentType_overallScore_idx" ON "EEATScore"("contentType", "overallScore");

-- CreateIndex
CREATE INDEX "EEATScore_analyzedAt_idx" ON "EEATScore"("analyzedAt");

-- CreateIndex
CREATE INDEX "CompetitorIntelligence_competitorId_idx" ON "CompetitorIntelligence"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorIntelligence_domain_idx" ON "CompetitorIntelligence"("domain");

-- CreateIndex
CREATE INDEX "CompetitorIntelligence_analyzedAt_idx" ON "CompetitorIntelligence"("analyzedAt");

-- CreateIndex
CREATE INDEX "SearchForecast_keywordId_idx" ON "SearchForecast"("keywordId");

-- CreateIndex
CREATE INDEX "SearchForecast_keyword_idx" ON "SearchForecast"("keyword");

-- CreateIndex
CREATE INDEX "SearchForecast_trendDirection_idx" ON "SearchForecast"("trendDirection");

-- CreateIndex
CREATE INDEX "SearchForecast_generatedAt_idx" ON "SearchForecast"("generatedAt");

-- CreateIndex
CREATE INDEX "RankingPrediction_contentId_idx" ON "RankingPrediction"("contentId");

-- CreateIndex
CREATE INDEX "RankingPrediction_keyword_idx" ON "RankingPrediction"("keyword");

-- CreateIndex
CREATE INDEX "RankingPrediction_currentRanking_idx" ON "RankingPrediction"("currentRanking");

-- CreateIndex
CREATE INDEX "RankingPrediction_generatedAt_idx" ON "RankingPrediction"("generatedAt");

-- CreateIndex
CREATE INDEX "SEOIntelligenceMetrics_date_period_idx" ON "SEOIntelligenceMetrics"("date", "period");

-- CreateIndex
CREATE INDEX "SEOIntelligenceMetrics_avgEEATScore_idx" ON "SEOIntelligenceMetrics"("avgEEATScore");
