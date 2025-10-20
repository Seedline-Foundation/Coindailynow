-- CreateTable
CREATE TABLE "LocalizedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "regionCode" TEXT,
    "languageCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "keywords" TEXT,
    "currency" TEXT,
    "priceLocalization" TEXT,
    "paymentMethods" TEXT,
    "legalDisclaimer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "qualityScore" REAL NOT NULL DEFAULT 0,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegionConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT NOT NULL,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "numberFormat" TEXT NOT NULL DEFAULT '1,000.00',
    "exchangePriority" TEXT,
    "cryptoFocus" TEXT,
    "featuresEnabled" TEXT,
    "paymentMethods" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "targetKeywords" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "launchDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegionalSEOConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryCode" TEXT NOT NULL,
    "primaryKeywords" TEXT NOT NULL,
    "secondaryKeywords" TEXT,
    "longTailKeywords" TEXT,
    "targetSearchEngines" TEXT NOT NULL DEFAULT '["Google","Bing"]',
    "competitorKeywords" TEXT,
    "keywordGaps" TEXT,
    "averagePosition" REAL NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "averageCTR" REAL NOT NULL DEFAULT 0,
    "localDirectories" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCrawled" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RegionalSEOConfig_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration" ("countryCode") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AfricanInfluencer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "averageLikes" INTEGER NOT NULL DEFAULT 0,
    "averageShares" INTEGER NOT NULL DEFAULT 0,
    "partnershipStatus" TEXT NOT NULL DEFAULT 'PROSPECTIVE',
    "partnershipType" TEXT,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "paymentTerms" TEXT,
    "topics" TEXT,
    "audience" TEXT,
    "postsPublished" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT,
    "phone" TEXT,
    "managerContact" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "lastContactDate" DATETIME,
    "lastPostDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AfricanInfluencer_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration" ("countryCode") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InfluencerPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "influencerId" TEXT NOT NULL,
    "articleId" TEXT,
    "platform" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "postType" TEXT NOT NULL,
    "content" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "reachEstimate" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" REAL NOT NULL DEFAULT 0,
    "publishedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InfluencerPost_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "AfricanInfluencer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegionalMarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryCode" TEXT NOT NULL,
    "totalMarketCap" REAL NOT NULL DEFAULT 0,
    "tradingVolume24h" REAL NOT NULL DEFAULT 0,
    "activeTraders" INTEGER NOT NULL DEFAULT 0,
    "popularExchanges" TEXT,
    "topGainers" TEXT,
    "topLosers" TEXT,
    "trendingTokens" TEXT,
    "popularPairs" TEXT,
    "localProjects" TEXT,
    "adoption" REAL NOT NULL DEFAULT 0,
    "sentiment" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "fiatGateways" TEXT,
    "mobileMoneyIntegration" BOOLEAN NOT NULL DEFAULT false,
    "bankingPartners" TEXT,
    "dataSource" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegionalMarketData_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration" ("countryCode") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaSyndicationWidget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "widgetType" TEXT NOT NULL,
    "targetCountries" TEXT NOT NULL,
    "targetLanguages" TEXT NOT NULL,
    "contentFilter" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "customCSS" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "maxItems" INTEGER NOT NULL DEFAULT 10,
    "embedCode" TEXT NOT NULL,
    "iframeUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 1000,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "partnerName" TEXT,
    "partnerDomain" TEXT,
    "partnerContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastAccessAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WidgetRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "widgetId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "contentReturned" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "responseTime" INTEGER NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WidgetRequest_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "MediaSyndicationWidget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AfricanCryptoIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "region" TEXT,
    "constituents" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "rebalanceFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "lastRebalance" DATETIME,
    "nextRebalance" DATETIME,
    "currentValue" REAL NOT NULL DEFAULT 100,
    "previousValue" REAL NOT NULL DEFAULT 100,
    "change24h" REAL NOT NULL DEFAULT 0,
    "changePercent24h" REAL NOT NULL DEFAULT 0,
    "allTimeHigh" REAL NOT NULL DEFAULT 100,
    "allTimeLow" REAL NOT NULL DEFAULT 100,
    "totalMarketCap" REAL NOT NULL DEFAULT 0,
    "totalVolume24h" REAL NOT NULL DEFAULT 0,
    "averageMarketCap" REAL NOT NULL DEFAULT 0,
    "performance7d" REAL NOT NULL DEFAULT 0,
    "performance30d" REAL NOT NULL DEFAULT 0,
    "performance1y" REAL NOT NULL DEFAULT 0,
    "volatility" REAL NOT NULL DEFAULT 0,
    "sharpeRatio" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "website" TEXT,
    "whitepaper" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IndexHistoricalData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indexId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "marketCap" REAL NOT NULL DEFAULT 0,
    "volume24h" REAL NOT NULL DEFAULT 0,
    "change" REAL NOT NULL DEFAULT 0,
    "changePercent" REAL NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "IndexHistoricalData_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "AfricanCryptoIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocalizationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "autoLocalization" BOOLEAN NOT NULL DEFAULT true,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "fallbackLanguage" TEXT NOT NULL DEFAULT 'en',
    "priorityRegions" TEXT NOT NULL,
    "enableAutoTranslation" BOOLEAN NOT NULL DEFAULT true,
    "translationQualityThreshold" REAL NOT NULL DEFAULT 85,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "translationProvider" TEXT NOT NULL DEFAULT 'nllb-200',
    "enableRegionalContent" BOOLEAN NOT NULL DEFAULT true,
    "regionalContentPercent" REAL NOT NULL DEFAULT 50,
    "enableLocalSEO" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateKeywords" BOOLEAN NOT NULL DEFAULT true,
    "enableInfluencerNetwork" BOOLEAN NOT NULL DEFAULT true,
    "minEngagementRate" REAL NOT NULL DEFAULT 2.0,
    "maxPartnershipCostPerPost" REAL NOT NULL DEFAULT 1000,
    "enableAfricanIndex" BOOLEAN NOT NULL DEFAULT true,
    "indexUpdateInterval" INTEGER NOT NULL DEFAULT 300,
    "enableMediaSyndication" BOOLEAN NOT NULL DEFAULT true,
    "maxWidgetsPerPartner" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateIndex
CREATE INDEX "LocalizedContent_contentId_status_idx" ON "LocalizedContent"("contentId", "status");

-- CreateIndex
CREATE INDEX "LocalizedContent_countryCode_languageCode_idx" ON "LocalizedContent"("countryCode", "languageCode");

-- CreateIndex
CREATE INDEX "LocalizedContent_regionCode_status_idx" ON "LocalizedContent"("regionCode", "status");

-- CreateIndex
CREATE INDEX "LocalizedContent_publishedAt_idx" ON "LocalizedContent"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LocalizedContent_contentId_countryCode_languageCode_key" ON "LocalizedContent"("contentId", "countryCode", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegionConfiguration_countryCode_key" ON "RegionConfiguration"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegionConfiguration_subdomain_key" ON "RegionConfiguration"("subdomain");

-- CreateIndex
CREATE INDEX "RegionConfiguration_region_isActive_idx" ON "RegionConfiguration"("region", "isActive");

-- CreateIndex
CREATE INDEX "RegionConfiguration_subdomain_idx" ON "RegionConfiguration"("subdomain");

-- CreateIndex
CREATE INDEX "RegionConfiguration_countryCode_idx" ON "RegionConfiguration"("countryCode");

-- CreateIndex
CREATE INDEX "RegionalSEOConfig_countryCode_averagePosition_idx" ON "RegionalSEOConfig"("countryCode", "averagePosition");

-- CreateIndex
CREATE INDEX "RegionalSEOConfig_lastUpdated_idx" ON "RegionalSEOConfig"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalSEOConfig_countryCode_key" ON "RegionalSEOConfig"("countryCode");

-- CreateIndex
CREATE INDEX "AfricanInfluencer_countryCode_partnershipStatus_idx" ON "AfricanInfluencer"("countryCode", "partnershipStatus");

-- CreateIndex
CREATE INDEX "AfricanInfluencer_platform_partnershipStatus_idx" ON "AfricanInfluencer"("platform", "partnershipStatus");

-- CreateIndex
CREATE INDEX "AfricanInfluencer_partnershipStatus_contractEnd_idx" ON "AfricanInfluencer"("partnershipStatus", "contractEnd");

-- CreateIndex
CREATE INDEX "AfricanInfluencer_engagementRate_idx" ON "AfricanInfluencer"("engagementRate");

-- CreateIndex
CREATE INDEX "InfluencerPost_influencerId_publishedAt_idx" ON "InfluencerPost"("influencerId", "publishedAt");

-- CreateIndex
CREATE INDEX "InfluencerPost_articleId_idx" ON "InfluencerPost"("articleId");

-- CreateIndex
CREATE INDEX "InfluencerPost_platform_publishedAt_idx" ON "InfluencerPost"("platform", "publishedAt");

-- CreateIndex
CREATE INDEX "RegionalMarketData_countryCode_lastUpdated_idx" ON "RegionalMarketData"("countryCode", "lastUpdated");

-- CreateIndex
CREATE INDEX "RegionalMarketData_lastUpdated_idx" ON "RegionalMarketData"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "MediaSyndicationWidget_embedCode_key" ON "MediaSyndicationWidget"("embedCode");

-- CreateIndex
CREATE UNIQUE INDEX "MediaSyndicationWidget_apiKey_key" ON "MediaSyndicationWidget"("apiKey");

-- CreateIndex
CREATE INDEX "MediaSyndicationWidget_status_targetCountries_idx" ON "MediaSyndicationWidget"("status", "targetCountries");

-- CreateIndex
CREATE INDEX "MediaSyndicationWidget_widgetType_status_idx" ON "MediaSyndicationWidget"("widgetType", "status");

-- CreateIndex
CREATE INDEX "MediaSyndicationWidget_apiKey_idx" ON "MediaSyndicationWidget"("apiKey");

-- CreateIndex
CREATE INDEX "MediaSyndicationWidget_embedCode_idx" ON "MediaSyndicationWidget"("embedCode");

-- CreateIndex
CREATE INDEX "WidgetRequest_widgetId_createdAt_idx" ON "WidgetRequest"("widgetId", "createdAt");

-- CreateIndex
CREATE INDEX "WidgetRequest_country_createdAt_idx" ON "WidgetRequest"("country", "createdAt");

-- CreateIndex
CREATE INDEX "WidgetRequest_createdAt_idx" ON "WidgetRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AfricanCryptoIndex_name_key" ON "AfricanCryptoIndex"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AfricanCryptoIndex_symbol_key" ON "AfricanCryptoIndex"("symbol");

-- CreateIndex
CREATE INDEX "AfricanCryptoIndex_symbol_isActive_idx" ON "AfricanCryptoIndex"("symbol", "isActive");

-- CreateIndex
CREATE INDEX "AfricanCryptoIndex_region_isActive_idx" ON "AfricanCryptoIndex"("region", "isActive");

-- CreateIndex
CREATE INDEX "AfricanCryptoIndex_lastUpdated_idx" ON "AfricanCryptoIndex"("lastUpdated");

-- CreateIndex
CREATE INDEX "IndexHistoricalData_indexId_timestamp_idx" ON "IndexHistoricalData"("indexId", "timestamp");

-- CreateIndex
CREATE INDEX "IndexHistoricalData_timestamp_idx" ON "IndexHistoricalData"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "IndexHistoricalData_indexId_timestamp_key" ON "IndexHistoricalData"("indexId", "timestamp");

-- CreateIndex
CREATE INDEX "LocalizationSettings_autoLocalization_idx" ON "LocalizationSettings"("autoLocalization");
