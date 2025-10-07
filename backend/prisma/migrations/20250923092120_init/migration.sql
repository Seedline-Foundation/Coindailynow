-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "tradingExperience" TEXT,
    "investmentPortfolioSize" TEXT,
    "preferredExchanges" TEXT,
    "notificationPreferences" TEXT,
    "privacySettings" TEXT,
    "contentPreferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImageUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "readingTimeMinutes" INTEGER NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publishScheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "translationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "translatorId" TEXT,
    "qualityScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleTranslation_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "iconUrl" TEXT,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "whitepaperUrl" TEXT,
    "blockchain" TEXT NOT NULL,
    "contractAddress" TEXT,
    "tokenType" TEXT NOT NULL,
    "marketCap" REAL,
    "circulatingSupply" REAL,
    "totalSupply" REAL,
    "maxSupply" REAL,
    "isMemecoin" BOOLEAN NOT NULL DEFAULT false,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "listingStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "priceUsd" REAL NOT NULL,
    "priceChange24h" REAL NOT NULL,
    "volume24h" REAL NOT NULL,
    "marketCap" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "high24h" REAL NOT NULL,
    "low24h" REAL NOT NULL,
    "tradingPairs" TEXT,
    CONSTRAINT "MarketData_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "websocketEndpoint" TEXT,
    "region" TEXT NOT NULL,
    "supportedCountries" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'TEXT',
    "parentId" TEXT,
    "tokenMentions" TEXT,
    "mediaUrls" TEXT,
    "upvoteCount" INTEGER NOT NULL DEFAULT 0,
    "downvoteCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "violationReason" TEXT,
    "penaltyApplied" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommunityPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "configuration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "performanceMetrics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AITask" (
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
    CONSTRAINT "AITask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "articleId" TEXT,
    "postId" TEXT,
    "actionType" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "scrollPercentage" REAL,
    "deviceType" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "referrerUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserEngagement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserEngagement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "trialEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "stripeSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingInterval" TEXT NOT NULL,
    "trialPeriodDays" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "readingTimeAvg" REAL NOT NULL DEFAULT 0.0,
    "bounceRate" REAL NOT NULL DEFAULT 0.0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "revenueGenerated" REAL NOT NULL DEFAULT 0.0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_publishedAt_idx" ON "Article"("categoryId", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_authorId_status_idx" ON "Article"("authorId", "status");

-- CreateIndex
CREATE INDEX "Article_isPremium_idx" ON "Article"("isPremium");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "ArticleTranslation_articleId_languageCode_idx" ON "ArticleTranslation"("articleId", "languageCode");

-- CreateIndex
CREATE INDEX "ArticleTranslation_translationStatus_idx" ON "ArticleTranslation"("translationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Token_slug_key" ON "Token"("slug");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "Token"("symbol");

-- CreateIndex
CREATE INDEX "Token_slug_idx" ON "Token"("slug");

-- CreateIndex
CREATE INDEX "Token_isListed_idx" ON "Token"("isListed");

-- CreateIndex
CREATE INDEX "Token_tokenType_idx" ON "Token"("tokenType");

-- CreateIndex
CREATE INDEX "MarketData_tokenId_timestamp_idx" ON "MarketData"("tokenId", "timestamp");

-- CreateIndex
CREATE INDEX "MarketData_exchange_timestamp_idx" ON "MarketData"("exchange", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeIntegration_slug_key" ON "ExchangeIntegration"("slug");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_slug_idx" ON "ExchangeIntegration"("slug");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_isActive_idx" ON "ExchangeIntegration"("isActive");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_region_idx" ON "ExchangeIntegration"("region");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_moderationStatus_createdAt_idx" ON "CommunityPost"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_parentId_idx" ON "CommunityPost"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_postId_key" ON "Vote"("userId", "postId");

-- CreateIndex
CREATE INDEX "AIAgent_type_idx" ON "AIAgent"("type");

-- CreateIndex
CREATE INDEX "AIAgent_isActive_idx" ON "AIAgent"("isActive");

-- CreateIndex
CREATE INDEX "AITask_agentId_status_idx" ON "AITask"("agentId", "status");

-- CreateIndex
CREATE INDEX "AITask_priority_createdAt_idx" ON "AITask"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "AITask_status_createdAt_idx" ON "AITask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_createdAt_idx" ON "UserEngagement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserEngagement_articleId_actionType_idx" ON "UserEngagement"("articleId", "actionType");

-- CreateIndex
CREATE INDEX "UserEngagement_postId_actionType_idx" ON "UserEngagement"("postId", "actionType");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_usageCount_idx" ON "Tag"("usageCount");

-- CreateIndex
CREATE INDEX "Tag_trendingScore_idx" ON "Tag"("trendingScore");

-- CreateIndex
CREATE INDEX "ContentPerformance_contentType_date_idx" ON "ContentPerformance"("contentType", "date");

-- CreateIndex
CREATE INDEX "ContentPerformance_date_idx" ON "ContentPerformance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPerformance_contentId_contentType_date_key" ON "ContentPerformance"("contentId", "contentType", "date");
