-- CreateTable
CREATE TABLE "DistributionCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetPlatforms" TEXT,
    "contentFilter" TEXT,
    "schedule" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "articlesShared" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentDistribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT,
    "articleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "externalId" TEXT,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "engagement" REAL NOT NULL DEFAULT 0,
    "rewardsGenerated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentDistribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DistributionCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReferralProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "referrerReward" INTEGER NOT NULL DEFAULT 100,
    "refereeReward" INTEGER NOT NULL DEFAULT 50,
    "minimumShares" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT,
    "referralCode" TEXT NOT NULL,
    "refereeEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contentShared" TEXT,
    "sharePlatform" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "signupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "referrerReward" INTEGER NOT NULL DEFAULT 0,
    "refereeReward" INTEGER NOT NULL DEFAULT 0,
    "rewardsPaid" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Referral_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ReferralProgram" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EngagementLeaderboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "referralsCount" INTEGER NOT NULL DEFAULT 0,
    "engagementCount" INTEGER NOT NULL DEFAULT 0,
    "contentViews" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PartnerSyndication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerName" TEXT NOT NULL,
    "partnerDomain" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tier" TEXT NOT NULL DEFAULT 'BASIC',
    "accessLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "articlesShared" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" DATETIME,
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 100,
    "widgetCode" TEXT,
    "webhookUrl" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyndicationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "articleId" TEXT,
    "requestType" TEXT NOT NULL,
    "requestPath" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "bytesServed" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyndicationRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerSyndication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipientFilter" TEXT,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribeCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsletterSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" DATETIME,
    "openedAt" DATETIME,
    "clickedAt" DATETIME,
    "bouncedAt" DATETIME,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NewsletterSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DistributionCampaign_status_startDate_idx" ON "DistributionCampaign"("status", "startDate");

-- CreateIndex
CREATE INDEX "DistributionCampaign_type_status_idx" ON "DistributionCampaign"("type", "status");

-- CreateIndex
CREATE INDEX "DistributionCampaign_createdAt_idx" ON "DistributionCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "ContentDistribution_campaignId_status_idx" ON "ContentDistribution"("campaignId", "status");

-- CreateIndex
CREATE INDEX "ContentDistribution_articleId_platform_idx" ON "ContentDistribution"("articleId", "platform");

-- CreateIndex
CREATE INDEX "ContentDistribution_status_scheduledAt_idx" ON "ContentDistribution"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentDistribution_publishedAt_idx" ON "ContentDistribution"("publishedAt");

-- CreateIndex
CREATE INDEX "ContentDistribution_createdAt_idx" ON "ContentDistribution"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralProgram_status_validFrom_idx" ON "ReferralProgram"("status", "validFrom");

-- CreateIndex
CREATE INDEX "ReferralProgram_createdAt_idx" ON "ReferralProgram"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "Referral_refereeId_idx" ON "Referral"("refereeId");

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Referral_programId_status_idx" ON "Referral"("programId", "status");

-- CreateIndex
CREATE INDEX "UserReward_userId_createdAt_idx" ON "UserReward"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserReward_rewardType_createdAt_idx" ON "UserReward"("rewardType", "createdAt");

-- CreateIndex
CREATE INDEX "UserReward_isProcessed_idx" ON "UserReward"("isProcessed");

-- CreateIndex
CREATE INDEX "UserReward_sourceType_source_idx" ON "UserReward"("sourceType", "source");

-- CreateIndex
CREATE INDEX "UserReward_createdAt_idx" ON "UserReward"("createdAt");

-- CreateIndex
CREATE INDEX "EngagementLeaderboard_period_periodStart_rank_idx" ON "EngagementLeaderboard"("period", "periodStart", "rank");

-- CreateIndex
CREATE INDEX "EngagementLeaderboard_userId_period_idx" ON "EngagementLeaderboard"("userId", "period");

-- CreateIndex
CREATE INDEX "EngagementLeaderboard_totalPoints_idx" ON "EngagementLeaderboard"("totalPoints");

-- CreateIndex
CREATE INDEX "EngagementLeaderboard_rank_idx" ON "EngagementLeaderboard"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementLeaderboard_userId_period_periodStart_key" ON "EngagementLeaderboard"("userId", "period", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSyndication_apiKey_key" ON "PartnerSyndication"("apiKey");

-- CreateIndex
CREATE INDEX "PartnerSyndication_status_tier_idx" ON "PartnerSyndication"("status", "tier");

-- CreateIndex
CREATE INDEX "PartnerSyndication_apiKey_idx" ON "PartnerSyndication"("apiKey");

-- CreateIndex
CREATE INDEX "PartnerSyndication_createdAt_idx" ON "PartnerSyndication"("createdAt");

-- CreateIndex
CREATE INDEX "SyndicationRequest_partnerId_createdAt_idx" ON "SyndicationRequest"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "SyndicationRequest_requestType_createdAt_idx" ON "SyndicationRequest"("requestType", "createdAt");

-- CreateIndex
CREATE INDEX "SyndicationRequest_createdAt_idx" ON "SyndicationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_scheduledAt_idx" ON "NewsletterCampaign"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "NewsletterSend_campaignId_status_idx" ON "NewsletterSend"("campaignId", "status");

-- CreateIndex
CREATE INDEX "NewsletterSend_recipientEmail_idx" ON "NewsletterSend"("recipientEmail");

-- CreateIndex
CREATE INDEX "NewsletterSend_recipientId_idx" ON "NewsletterSend"("recipientId");

-- CreateIndex
CREATE INDEX "NewsletterSend_status_createdAt_idx" ON "NewsletterSend"("status", "createdAt");
