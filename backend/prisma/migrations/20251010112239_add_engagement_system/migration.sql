-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "favoriteCategories" TEXT NOT NULL,
    "followedAuthors" TEXT NOT NULL,
    "blockedCategories" TEXT NOT NULL,
    "contentLanguages" TEXT NOT NULL,
    "readingLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "contentLength" TEXT NOT NULL DEFAULT 'MEDIUM',
    "preferredTopics" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "breakingNews" BOOLEAN NOT NULL DEFAULT true,
    "aiRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "voiceNewsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPlayVideos" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "avgReadingTime" INTEGER NOT NULL,
    "avgScrollDepth" REAL NOT NULL,
    "preferredReadingTime" TEXT NOT NULL,
    "devicePreference" TEXT NOT NULL DEFAULT 'MOBILE',
    "articlesRead" INTEGER NOT NULL DEFAULT 0,
    "articlesShared" INTEGER NOT NULL DEFAULT 0,
    "commentsPosted" INTEGER NOT NULL DEFAULT 0,
    "reactionsGiven" INTEGER NOT NULL DEFAULT 0,
    "topCategories" TEXT NOT NULL,
    "topAuthors" TEXT NOT NULL,
    "topTags" TEXT NOT NULL,
    "sentimentProfile" TEXT NOT NULL,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "lastEngagement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readDuration" INTEGER,
    "position" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "shownAt" DATETIME,
    "clickedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReadingReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "multiplier" REAL NOT NULL DEFAULT 1.0,
    "readDuration" INTEGER NOT NULL,
    "scrollPercentage" REAL NOT NULL,
    "completedArticle" BOOLEAN NOT NULL DEFAULT false,
    "badgeEarned" TEXT,
    "levelUp" BOOLEAN NOT NULL DEFAULT false,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "badge" TEXT,
    "actionUrl" TEXT,
    "actionData" TEXT,
    "segment" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VoiceArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'mp3',
    "voiceModel" TEXT NOT NULL DEFAULT 'tts-1',
    "voiceType" TEXT NOT NULL DEFAULT 'alloy',
    "generationStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "avgListenPercentage" REAL NOT NULL DEFAULT 0,
    "qualityScore" REAL,
    "transcriptAccuracy" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PWAInstall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "installId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "screenResolution" TEXT NOT NULL,
    "viewport" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" DATETIME
);

-- CreateTable
CREATE TABLE "EngagementMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" DATETIME,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "rewardBadge" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PersonalizationModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryWeights" TEXT NOT NULL,
    "authorWeights" TEXT NOT NULL,
    "tagWeights" TEXT NOT NULL,
    "timePreferences" TEXT NOT NULL,
    "lengthPreference" REAL NOT NULL,
    "complexityPreference" REAL NOT NULL,
    "newContentWeight" REAL NOT NULL DEFAULT 0.3,
    "trendingWeight" REAL NOT NULL DEFAULT 0.3,
    "personalWeight" REAL NOT NULL DEFAULT 0.4,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0',
    "lastTrained" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingDataPoints" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "UserBehavior_engagementScore_idx" ON "UserBehavior"("engagementScore");

-- CreateIndex
CREATE INDEX "UserBehavior_lastEngagement_idx" ON "UserBehavior"("lastEngagement");

-- CreateIndex
CREATE UNIQUE INDEX "UserBehavior_userId_key" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "ContentRecommendation_userId_shown_idx" ON "ContentRecommendation"("userId", "shown");

-- CreateIndex
CREATE INDEX "ContentRecommendation_userId_clicked_idx" ON "ContentRecommendation"("userId", "clicked");

-- CreateIndex
CREATE INDEX "ContentRecommendation_articleId_idx" ON "ContentRecommendation"("articleId");

-- CreateIndex
CREATE INDEX "ContentRecommendation_expiresAt_idx" ON "ContentRecommendation"("expiresAt");

-- CreateIndex
CREATE INDEX "ContentRecommendation_recommendationType_idx" ON "ContentRecommendation"("recommendationType");

-- CreateIndex
CREATE INDEX "ReadingReward_userId_awardedAt_idx" ON "ReadingReward"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "ReadingReward_articleId_idx" ON "ReadingReward"("articleId");

-- CreateIndex
CREATE INDEX "ReadingReward_rewardType_idx" ON "ReadingReward"("rewardType");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_isActive_idx" ON "PushSubscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushNotification_userId_status_idx" ON "PushNotification"("userId", "status");

-- CreateIndex
CREATE INDEX "PushNotification_status_scheduledFor_idx" ON "PushNotification"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "PushNotification_createdAt_idx" ON "PushNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceArticle_articleId_key" ON "VoiceArticle"("articleId");

-- CreateIndex
CREATE INDEX "VoiceArticle_articleId_idx" ON "VoiceArticle"("articleId");

-- CreateIndex
CREATE INDEX "VoiceArticle_generationStatus_idx" ON "VoiceArticle"("generationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PWAInstall_installId_key" ON "PWAInstall"("installId");

-- CreateIndex
CREATE INDEX "PWAInstall_userId_idx" ON "PWAInstall"("userId");

-- CreateIndex
CREATE INDEX "PWAInstall_installId_idx" ON "PWAInstall"("installId");

-- CreateIndex
CREATE INDEX "PWAInstall_isActive_idx" ON "PWAInstall"("isActive");

-- CreateIndex
CREATE INDEX "PWAInstall_platform_idx" ON "PWAInstall"("platform");

-- CreateIndex
CREATE INDEX "EngagementMilestone_userId_type_idx" ON "EngagementMilestone"("userId", "type");

-- CreateIndex
CREATE INDEX "EngagementMilestone_achieved_idx" ON "EngagementMilestone"("achieved");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizationModel_userId_key" ON "PersonalizationModel"("userId");

-- CreateIndex
CREATE INDEX "PersonalizationModel_userId_idx" ON "PersonalizationModel"("userId");

-- CreateIndex
CREATE INDEX "PersonalizationModel_lastTrained_idx" ON "PersonalizationModel"("lastTrained");
