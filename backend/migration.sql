-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('USER_WALLET', 'ADMIN_WALLET', 'SUPER_ADMIN_WALLET', 'WE_WALLET', 'ESCROW_WALLET', 'BONUS_WALLET', 'AIRDROP_WALLET', 'STAKING_VAULT', 'REFUND_POOL');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'REWARD', 'FEE', 'COMMISSION', 'STAKE', 'UNSTAKE', 'CONVERSION', 'AIRDROP', 'ESCROW', 'GIFT', 'DONATION');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'REQUIRES_APPROVAL', 'REJECTED');

-- CreateEnum
CREATE TYPE "StakingStatus" AS ENUM ('ACTIVE', 'UNLOCKING', 'UNLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'LOCKED', 'RELEASED', 'DISPUTED', 'RESOLVED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CRYPTO', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'WALLET');

-- CreateEnum
CREATE TYPE "AirdropStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "configuration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "performanceMetrics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "inputData" TEXT,
    "outputData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "actualCost" DOUBLE PRECISION,
    "processingTimeMs" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workflowStepId" TEXT,

    CONSTRAINT "AITask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "properties" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
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
    "seoKeywords" TEXT,
    "metadata" TEXT,
    "aiGenerated" BOOLEAN,
    "publishScheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "changesSummary" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "generationPrompt" TEXT,
    "revisedPrompt" TEXT,
    "dalleModel" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "size" INTEGER,
    "quality" TEXT,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "optimizedUrl" TEXT,
    "webpUrl" TEXT,
    "avifUrl" TEXT,
    "placeholderBase64" TEXT,
    "seoKeywords" TEXT,
    "loadingPriority" TEXT NOT NULL DEFAULT 'lazy',
    "aspectRatio" TEXT,
    "focalPointX" DOUBLE PRECISION,
    "focalPointY" DOUBLE PRECISION,
    "chartType" TEXT,
    "chartData" TEXT,
    "chartSymbol" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "processingStatus" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "iconUrl" TEXT,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "userId" TEXT,
    "requirementId" TEXT NOT NULL,
    "amountLimitsCheck" BOOLEAN NOT NULL DEFAULT false,
    "kycStatusCheck" BOOLEAN NOT NULL DEFAULT false,
    "sanctionsScreenCheck" BOOLEAN NOT NULL DEFAULT false,
    "taxComplianceCheck" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "violations" TEXT,
    "checkDetails" TEXT,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "kycRequired" BOOLEAN NOT NULL DEFAULT true,
    "maxTransactionAmount" INTEGER NOT NULL,
    "maxDailyAmount" INTEGER NOT NULL,
    "maxMonthlyAmount" INTEGER NOT NULL,
    "identityVerification" BOOLEAN NOT NULL DEFAULT false,
    "taxReporting" BOOLEAN NOT NULL DEFAULT false,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "restrictions" TEXT,
    "regulatoryBody" TEXT,
    "licenseRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPerformance" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "readingTimeAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "ContentPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentWorkflow" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL DEFAULT 'ARTICLE_PUBLISHING',
    "currentState" TEXT NOT NULL DEFAULT 'RESEARCH',
    "previousState" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedReviewerId" TEXT,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedCompletionAt" TIMESTAMP(3),
    "actualCompletionAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPipeline" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "status" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "stages" TEXT,
    "errors" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeIntegration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "websocketEndpoint" TEXT,
    "region" TEXT NOT NULL,
    "supportedCountries" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAnalysis" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "userId" TEXT,
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "flags" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rulesTriggered" TEXT,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "phoneNumber" TEXT,
    "amount" INTEGER,
    "velocity" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "finalDecision" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "priceChange24h" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "high24h" DOUBLE PRECISION NOT NULL,
    "low24h" DOUBLE PRECISION NOT NULL,
    "tradingPairs" TEXT,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileMoneyProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportedCurrencies" TEXT NOT NULL,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "fixedFee" INTEGER NOT NULL DEFAULT 0,
    "percentageFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeout" INTEGER NOT NULL DEFAULT 300,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "secretKey" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileMoneyProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileMoneyTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "providerFee" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "totalFee" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "failureReason" TEXT,
    "fraudAnalysisId" TEXT,
    "complianceCheckId" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileMoneyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhook" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "transactionId" TEXT,
    "providerTransactionId" TEXT,
    "status" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "phoneNumber" TEXT,
    "signature" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hashedToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "hashedSessionToken" TEXT NOT NULL,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
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
    "marketCap" DOUBLE PRECISION,
    "circulatingSupply" DOUBLE PRECISION,
    "totalSupply" DOUBLE PRECISION,
    "maxSupply" DOUBLE PRECISION,
    "isMemecoin" BOOLEAN NOT NULL DEFAULT false,
    "isListed" BOOLEAN NOT NULL DEFAULT true,
    "listingStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
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
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isShadowBanned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "articleId" TEXT,
    "postId" TEXT,
    "actionType" TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "scrollPercentage" DOUBLE PRECISION,
    "deviceType" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "referrerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "socialMedia" TEXT,
    "tradingExperience" TEXT,
    "investmentPortfolioSize" TEXT,
    "preferredExchanges" TEXT,
    "notificationPreferences" TEXT,
    "privacySettings" TEXT,
    "contentPreferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowNotification" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "channel" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assigneeId" TEXT,
    "estimatedDurationMs" INTEGER,
    "actualDurationMs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "output" TEXT,
    "errorMessage" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "humanFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "toState" TEXT NOT NULL,
    "transitionType" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "triggerConditions" TEXT,
    "transitionReason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "resource" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "category" TEXT NOT NULL DEFAULT 'general',
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTrust" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "riskFactors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marquee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'token',
    "position" TEXT NOT NULL DEFAULT 'header',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Marquee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarqueeStyle" (
    "id" TEXT NOT NULL,
    "marqueeId" TEXT NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "direction" TEXT NOT NULL DEFAULT 'left',
    "pauseOnHover" BOOLEAN NOT NULL DEFAULT true,
    "backgroundColor" TEXT NOT NULL DEFAULT '#1f2937',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fontSize" TEXT NOT NULL DEFAULT '14px',
    "fontWeight" TEXT NOT NULL DEFAULT 'normal',
    "height" TEXT NOT NULL DEFAULT '48px',
    "borderRadius" TEXT NOT NULL DEFAULT '0px',
    "borderWidth" TEXT NOT NULL DEFAULT '0px',
    "borderColor" TEXT NOT NULL DEFAULT '#transparent',
    "shadowColor" TEXT NOT NULL DEFAULT 'transparent',
    "shadowBlur" TEXT NOT NULL DEFAULT '0px',
    "showIcons" BOOLEAN NOT NULL DEFAULT true,
    "iconColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "iconSize" TEXT NOT NULL DEFAULT '20px',
    "itemSpacing" TEXT NOT NULL DEFAULT '32px',
    "paddingVertical" TEXT NOT NULL DEFAULT '12px',
    "paddingHorizontal" TEXT NOT NULL DEFAULT '16px',
    "gradient" TEXT,
    "customCSS" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarqueeStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarqueeItem" (
    "id" TEXT NOT NULL,
    "marqueeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "linkUrl" TEXT,
    "linkTarget" TEXT NOT NULL DEFAULT '_self',
    "symbol" TEXT,
    "price" DOUBLE PRECISION,
    "change24h" DOUBLE PRECISION,
    "changePercent24h" DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "textColor" TEXT,
    "bgColor" TEXT,
    "icon" TEXT,
    "iconColor" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarqueeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarqueeTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "styleConfig" TEXT NOT NULL,
    "itemsConfig" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarqueeTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "constraints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedIP" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOMetadata" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "raometa" TEXT NOT NULL,
    "structuredData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEORanking" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "snippet" TEXT,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgPosition" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "previousPosition" INTEGER,
    "positionChange" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEORanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOPageAnalysis" (
    "id" TEXT NOT NULL,
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
    "keywordDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "internalLinks" INTEGER NOT NULL DEFAULT 0,
    "externalLinks" INTEGER NOT NULL DEFAULT 0,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "imagesMissingAlt" INTEGER NOT NULL DEFAULT 0,
    "loadTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeToFirstByte" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "firstContentfulPaint" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "largestContentfulPaint" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cumulativeLayoutShift" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "raoScore" INTEGER NOT NULL DEFAULT 0,
    "llmCitations" INTEGER NOT NULL DEFAULT 0,
    "aiOverviewAppearances" INTEGER NOT NULL DEFAULT 0,
    "semanticRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOPageAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOIssue" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "affectedUrl" TEXT,
    "metadata" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOAlert" (
    "id" TEXT NOT NULL,
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
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOCompetitor" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "pageAuthority" INTEGER NOT NULL DEFAULT 0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "keywords" INTEGER NOT NULL DEFAULT 0,
    "traffic" INTEGER NOT NULL DEFAULT 0,
    "lastScraped" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOCompetitorAnalysis" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "keywordsRanking" INTEGER NOT NULL DEFAULT 0,
    "topKeywords" TEXT NOT NULL,
    "averagePosition" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contentPublished" INTEGER NOT NULL DEFAULT 0,
    "backlinksGained" INTEGER NOT NULL DEFAULT 0,
    "analysisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOCompetitorAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEORankingPrediction" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "currentPosition" INTEGER NOT NULL,
    "predictedPosition" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trend" TEXT NOT NULL,
    "contentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "technicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "competitorStrength" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "predictionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEORankingPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAOPerformance" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "llmCitations" INTEGER NOT NULL DEFAULT 0,
    "citationSources" TEXT NOT NULL,
    "citationContexts" TEXT NOT NULL,
    "aiOverviews" INTEGER NOT NULL DEFAULT 0,
    "overviewSources" TEXT NOT NULL,
    "semanticRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "entityRecognition" TEXT NOT NULL,
    "topicCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contentStructure" INTEGER NOT NULL DEFAULT 0,
    "factualAccuracy" INTEGER NOT NULL DEFAULT 0,
    "sourceAuthority" INTEGER NOT NULL DEFAULT 0,
    "trackingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RAOPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOBacklink" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT,
    "domainAuthority" INTEGER NOT NULL DEFAULT 0,
    "pageAuthority" INTEGER NOT NULL DEFAULT 0,
    "isDoFollow" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOBacklink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSEOOptimization" (
    "id" TEXT NOT NULL,
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
    "fleschKincaidGrade" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fleschReadingEase" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageWordsPerSentence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageSyllablesPerWord" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "complexWordsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "semanticChunks" TEXT NOT NULL,
    "canonicalAnswers" TEXT NOT NULL,
    "entityMentions" TEXT NOT NULL,
    "factClaims" TEXT NOT NULL,
    "aiHeadlineSuggestions" TEXT NOT NULL,
    "aiContentSuggestions" TEXT NOT NULL,
    "aiKeywordSuggestions" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "lastOptimized" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optimizedBy" TEXT,
    "optimizationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSEOOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeadlineOptimization" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "originalHeadline" TEXT NOT NULL,
    "optimizedHeadline" TEXT NOT NULL,
    "predictedCTR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "actualCTR" DOUBLE PRECISION,
    "emotionalScore" INTEGER NOT NULL DEFAULT 0,
    "powerWords" TEXT NOT NULL,
    "lengthScore" INTEGER NOT NULL DEFAULT 0,
    "clarityScore" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testStartedAt" TIMESTAMP(3),
    "testEndedAt" TIMESTAMP(3),

    CONSTRAINT "HeadlineOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalLinkSuggestion" (
    "id" TEXT NOT NULL,
    "sourceContentId" TEXT,
    "targetContentId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "contextSentence" TEXT,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "topicSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "priority" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "implementedAt" TIMESTAMP(3),
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalLinkSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadabilityAnalysis" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "fleschKincaidGrade" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fleschReadingEase" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "sentenceCount" INTEGER NOT NULL DEFAULT 0,
    "paragraphCount" INTEGER NOT NULL DEFAULT 0,
    "averageWordsPerSentence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageSyllablesPerWord" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "complexWordsCount" INTEGER NOT NULL DEFAULT 0,
    "complexWordsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "longSentencesCount" INTEGER NOT NULL DEFAULT 0,
    "gradeLevel" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadabilityAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFeedSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "checkInterval" INTEGER NOT NULL DEFAULT 3600,
    "lastCheckedAt" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "configuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentFeedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomatedArticle" (
    "id" TEXT NOT NULL,
    "feedSourceId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "originalTitle" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "originalPublishedAt" TIMESTAMP(3),
    "rewrittenTitle" TEXT,
    "rewrittenContent" TEXT,
    "rewrittenExcerpt" TEXT,
    "optimizedHeadline" TEXT,
    "headlineScore" DOUBLE PRECISION DEFAULT 0.0,
    "seoKeywords" TEXT,
    "suggestedCategory" TEXT,
    "suggestedTags" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 0.0,
    "translationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "translatedLanguages" TEXT,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "uniquenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "readabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'COLLECTED',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "publishedArticleId" TEXT,
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomatedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAutomationJob" (
    "id" TEXT NOT NULL,
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
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "results" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentAutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAutomationSettings" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "requireHumanApproval" BOOLEAN NOT NULL DEFAULT true,
    "minQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
    "minUniquenessScore" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "minReadabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ContentAutomationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redirect" (
    "id" TEXT NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "metadata" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAutomationLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "articleId" TEXT,
    "level" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetPlatforms" TEXT,
    "contentFilter" TEXT,
    "schedule" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "articlesShared" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDistribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "articleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "engagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rewardsGenerated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "referrerReward" INTEGER NOT NULL DEFAULT 100,
    "refereeReward" INTEGER NOT NULL DEFAULT 50,
    "minimumShares" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
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
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementLeaderboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "referralsCount" INTEGER NOT NULL DEFAULT 0,
    "engagementCount" INTEGER NOT NULL DEFAULT 0,
    "contentViews" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSyndication" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerDomain" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tier" TEXT NOT NULL DEFAULT 'BASIC',
    "accessLevel" TEXT NOT NULL DEFAULT 'PUBLIC',
    "articlesShared" INTEGER NOT NULL DEFAULT 0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 100,
    "widgetCode" TEXT,
    "webhookUrl" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSyndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyndicationRequest" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyndicationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" TEXT NOT NULL,
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
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalizedContent" (
    "id" TEXT NOT NULL,
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
    "publishedAt" TIMESTAMP(3),
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalizedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionConfiguration" (
    "id" TEXT NOT NULL,
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
    "launchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalSEOConfig" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "primaryKeywords" TEXT NOT NULL,
    "secondaryKeywords" TEXT,
    "longTailKeywords" TEXT,
    "targetSearchEngines" TEXT NOT NULL DEFAULT '["Google","Bing"]',
    "competitorKeywords" TEXT,
    "keywordGaps" TEXT,
    "averagePosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "averageCTR" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localDirectories" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCrawled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalSEOConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfricanInfluencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageLikes" INTEGER NOT NULL DEFAULT 0,
    "averageShares" INTEGER NOT NULL DEFAULT 0,
    "partnershipStatus" TEXT NOT NULL DEFAULT 'PROSPECTIVE',
    "partnershipType" TEXT,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
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
    "lastContactDate" TIMESTAMP(3),
    "lastPostDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfricanInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerPost" (
    "id" TEXT NOT NULL,
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
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reachEstimate" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenueGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalMarketData" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "totalMarketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradingVolume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeTraders" INTEGER NOT NULL DEFAULT 0,
    "popularExchanges" TEXT,
    "topGainers" TEXT,
    "topLosers" TEXT,
    "trendingTokens" TEXT,
    "popularPairs" TEXT,
    "localProjects" TEXT,
    "adoption" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentiment" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "fiatGateways" TEXT,
    "mobileMoneyIntegration" BOOLEAN NOT NULL DEFAULT false,
    "bankingPartners" TEXT,
    "dataSource" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegionalMarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaSyndicationWidget" (
    "id" TEXT NOT NULL,
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
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaSyndicationWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetRequest" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "contentReturned" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "responseTime" INTEGER NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AfricanCryptoIndex" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "region" TEXT,
    "constituents" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "rebalanceFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "lastRebalance" TIMESTAMP(3),
    "nextRebalance" TIMESTAMP(3),
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "previousValue" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "change24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changePercent24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allTimeHigh" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "allTimeLow" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "totalMarketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVolume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageMarketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performance7d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performance30d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performance1y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sharpeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "website" TEXT,
    "whitepaper" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AfricanCryptoIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexHistoricalData" (
    "id" TEXT NOT NULL,
    "indexId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "changePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexHistoricalData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalizationSettings" (
    "id" TEXT NOT NULL,
    "autoLocalization" BOOLEAN NOT NULL DEFAULT true,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "fallbackLanguage" TEXT NOT NULL DEFAULT 'en',
    "priorityRegions" TEXT NOT NULL,
    "enableAutoTranslation" BOOLEAN NOT NULL DEFAULT true,
    "translationQualityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "translationProvider" TEXT NOT NULL DEFAULT 'nllb-200',
    "enableRegionalContent" BOOLEAN NOT NULL DEFAULT true,
    "regionalContentPercent" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "enableLocalSEO" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerateKeywords" BOOLEAN NOT NULL DEFAULT true,
    "enableInfluencerNetwork" BOOLEAN NOT NULL DEFAULT true,
    "minEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "maxPartnershipCostPerPost" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "enableAfricanIndex" BOOLEAN NOT NULL DEFAULT true,
    "indexUpdateInterval" INTEGER NOT NULL DEFAULT 300,
    "enableMediaSyndication" BOOLEAN NOT NULL DEFAULT true,
    "maxWidgetsPerPartner" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "LocalizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
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
    "portfolioSymbols" TEXT NOT NULL DEFAULT '[]',
    "excludedTopics" TEXT NOT NULL DEFAULT '[]',
    "preferences" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgReadingTime" INTEGER NOT NULL,
    "avgScrollDepth" DOUBLE PRECISION NOT NULL,
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
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEngagement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readDuration" INTEGER,
    "position" INTEGER NOT NULL,
    "context" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "readDuration" INTEGER NOT NULL,
    "scrollPercentage" DOUBLE PRECISION NOT NULL,
    "completedArticle" BOOLEAN NOT NULL DEFAULT false,
    "badgeEarned" TEXT,
    "levelUp" BOOLEAN NOT NULL DEFAULT false,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" TEXT NOT NULL,
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
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceArticle" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'mp3',
    "voiceModel" TEXT NOT NULL DEFAULT 'tts-1',
    "voiceType" TEXT NOT NULL DEFAULT 'alloy',
    "generationStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "avgListenPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION,
    "transcriptAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PWAInstall" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "installId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "screenResolution" TEXT NOT NULL,
    "viewport" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),

    CONSTRAINT "PWAInstall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "rewardBadge" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizationModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryWeights" TEXT NOT NULL,
    "authorWeights" TEXT NOT NULL,
    "tagWeights" TEXT NOT NULL,
    "timePreferences" TEXT NOT NULL,
    "lengthPreference" DOUBLE PRECISION NOT NULL,
    "complexityPreference" DOUBLE PRECISION NOT NULL,
    "newContentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "trendingWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "personalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0',
    "lastTrained" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingDataPoints" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizationModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmUpdate" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "affectedCategories" TEXT NOT NULL,
    "estimatedImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rankingChanges" INTEGER NOT NULL DEFAULT 0,
    "trafficChange" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "affectedPages" INTEGER NOT NULL DEFAULT 0,
    "affectedKeywords" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "adaptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmResponse" (
    "id" TEXT NOT NULL,
    "algorithmUpdateId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "automatedAction" BOOLEAN NOT NULL DEFAULT false,
    "executedAutomatically" BOOLEAN NOT NULL DEFAULT false,
    "affectedUrls" TEXT,
    "successRate" DOUBLE PRECISION,
    "resultMetrics" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SERPVolatility" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "previousPosition" INTEGER NOT NULL,
    "currentPosition" INTEGER NOT NULL,
    "positionChange" INTEGER NOT NULL,
    "percentageChange" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "searchIntent" TEXT,
    "competitorMovement" TEXT NOT NULL,
    "volatilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "alertGenerated" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" TEXT,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERPVolatility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaRefresh" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "previousSchema" TEXT NOT NULL,
    "updatedSchema" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changesApplied" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validationErrors" TEXT,
    "googleValidation" BOOLEAN NOT NULL DEFAULT false,
    "richSnippetBefore" BOOLEAN NOT NULL DEFAULT false,
    "richSnippetAfter" BOOLEAN,
    "clickRateChange" DOUBLE PRECISION,
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemaRefresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFreshnessAgent" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "freshnessScore" INTEGER NOT NULL DEFAULT 0,
    "contentAge" INTEGER NOT NULL DEFAULT 0,
    "lastUpdateAge" INTEGER NOT NULL DEFAULT 0,
    "requiresUpdate" BOOLEAN NOT NULL DEFAULT false,
    "updateReason" TEXT,
    "updatePriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "updateType" TEXT,
    "updatesApplied" TEXT,
    "trafficBefore" INTEGER NOT NULL DEFAULT 0,
    "trafficAfter" INTEGER,
    "rankingsBefore" TEXT NOT NULL,
    "rankingsAfter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MONITORING',
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentFreshnessAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEORecoveryWorkflow" (
    "id" TEXT NOT NULL,
    "algorithmUpdateId" TEXT,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerSeverity" TEXT NOT NULL,
    "affectedUrls" TEXT NOT NULL,
    "affectedKeywords" TEXT NOT NULL,
    "estimatedImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "recoveryRate" DOUBLE PRECISION,
    "timeToRecover" INTEGER,
    "successMetrics" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEORecoveryWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEORecoveryStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "automationScript" TEXT,
    "requiredManualAction" TEXT,
    "dependsOnSteps" TEXT,
    "blockedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "executionLog" TEXT,
    "errorMessage" TEXT,
    "impactMetrics" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEORecoveryStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEODefenseMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL DEFAULT 'DAILY',
    "algorithmsDetected" INTEGER NOT NULL DEFAULT 0,
    "criticalUpdates" INTEGER NOT NULL DEFAULT 0,
    "responseTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "volatileKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgVolatilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "anomaliesDetected" INTEGER NOT NULL DEFAULT 0,
    "schemasRefreshed" INTEGER NOT NULL DEFAULT 0,
    "validationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "richSnippetRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contentUpdated" INTEGER NOT NULL DEFAULT 0,
    "avgFreshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "urgentUpdates" INTEGER NOT NULL DEFAULT 0,
    "workflowsActive" INTEGER NOT NULL DEFAULT 0,
    "workflowsCompleted" INTEGER NOT NULL DEFAULT 0,
    "avgRecoveryTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgRecoveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "defenseScore" INTEGER NOT NULL DEFAULT 0,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "adaptationSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEODefenseMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EEATScore" (
    "id" TEXT NOT NULL,
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
    "topicDepth" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "technicalAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "industryRecognition" BOOLEAN NOT NULL DEFAULT false,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "backlinks" INTEGER NOT NULL DEFAULT 0,
    "socialShares" INTEGER NOT NULL DEFAULT 0,
    "brandMentions" INTEGER NOT NULL DEFAULT 0,
    "factCheckScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "sourcesQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "transparencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "accuracyHistory" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contentRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "engagementQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "improvements" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EEATScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorIntelligence" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contentStrategy" TEXT NOT NULL,
    "keywordStrategy" TEXT NOT NULL,
    "backlinkStrategy" TEXT NOT NULL,
    "technicalStrategy" TEXT NOT NULL,
    "organicTraffic" INTEGER NOT NULL DEFAULT 0,
    "keywordRankings" INTEGER NOT NULL DEFAULT 0,
    "topKeywords" TEXT NOT NULL,
    "contentFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "estimatedImpact" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchForecast" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "forecast30Days" TEXT NOT NULL,
    "forecast60Days" TEXT NOT NULL,
    "forecast90Days" TEXT NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "trendStrength" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "seasonality" TEXT NOT NULL,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentVolume" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume30" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume60" INTEGER NOT NULL DEFAULT 0,
    "predictedVolume90" INTEGER NOT NULL DEFAULT 0,
    "volumeChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition30" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition60" INTEGER NOT NULL DEFAULT 0,
    "predictedPosition90" INTEGER NOT NULL DEFAULT 0,
    "positionChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentClicks" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks30" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks60" INTEGER NOT NULL DEFAULT 0,
    "predictedClicks90" INTEGER NOT NULL DEFAULT 0,
    "clicksChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dataQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "factors" TEXT NOT NULL,
    "opportunities" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingPrediction" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "currentRanking" INTEGER NOT NULL DEFAULT 0,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentTraffic" INTEGER NOT NULL DEFAULT 0,
    "predicted7Days" TEXT NOT NULL,
    "predicted14Days" TEXT NOT NULL,
    "predicted30Days" TEXT NOT NULL,
    "predicted60Days" TEXT NOT NULL,
    "predicted90Days" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "modelAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trainingDataSize" INTEGER NOT NULL DEFAULT 0,
    "featureImportance" TEXT NOT NULL,
    "contentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "technicalSEO" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "backlinkProfile" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "competitivePosition" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estimatedTrafficGain" INTEGER NOT NULL DEFAULT 0,
    "estimatedRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "probabilityTop10" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "probabilityTop3" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "quickWins" TEXT NOT NULL,
    "longTermActions" TEXT NOT NULL,
    "requiredResources" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOIntelligenceMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "avgEEATScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "contentAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "eeatImprovements" INTEGER NOT NULL DEFAULT 0,
    "competitorsTracked" INTEGER NOT NULL DEFAULT 0,
    "keywordGapsFound" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesIdentified" INTEGER NOT NULL DEFAULT 0,
    "actionsRecommended" INTEGER NOT NULL DEFAULT 0,
    "keywordsForecast" INTEGER NOT NULL DEFAULT 0,
    "avgForecastAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trafficPredicted" INTEGER NOT NULL DEFAULT 0,
    "trafficActual" INTEGER NOT NULL DEFAULT 0,
    "predictionsGenerated" INTEGER NOT NULL DEFAULT 0,
    "avgPredictionAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "top10Predictions" INTEGER NOT NULL DEFAULT 0,
    "top3Predictions" INTEGER NOT NULL DEFAULT 0,
    "insightsGenerated" INTEGER NOT NULL DEFAULT 0,
    "actionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "impactRealized" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "roiGenerated" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOIntelligenceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "trigger" TEXT NOT NULL,
    "triggerConfig" TEXT,
    "actions" TEXT NOT NULL,
    "schedule" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "retryStrategy" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 300000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgExecutionTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "triggerType" TEXT NOT NULL,
    "triggerData" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "executionTimeMs" INTEGER,
    "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
    "stepsTotal" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "output" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "isRetry" BOOLEAN NOT NULL DEFAULT false,
    "parentExecutionId" TEXT,
    "metadata" TEXT,

    CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecutionStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "executionTimeMs" INTEGER,
    "input" TEXT,
    "output" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,

    CONSTRAINT "AutomationExecutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationAlert" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "alertType" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "config" TEXT,
    "events" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentSnapshot" TEXT NOT NULL,
    "changeDescription" TEXT,
    "changedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "gitCommitHash" TEXT,
    "diffData" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIOrchestration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "orchestrationType" TEXT NOT NULL,
    "apiCalls" TEXT NOT NULL,
    "dependencies" TEXT,
    "retryStrategy" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL,
    "tags" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APIOrchestration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceAudit" (
    "id" TEXT NOT NULL,
    "auditType" TEXT NOT NULL,
    "auditPeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "trafficMetrics" TEXT,
    "rankingMetrics" TEXT,
    "contentMetrics" TEXT,
    "technicalMetrics" TEXT,
    "backlinkMetrics" TEXT,
    "aiMetrics" TEXT,
    "overallScore" INTEGER,
    "findings" TEXT,
    "recommendations" TEXT,
    "aiAnalysis" TEXT,
    "executedBy" TEXT NOT NULL DEFAULT 'system',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationCycle" (
    "id" TEXT NOT NULL,
    "auditId" TEXT,
    "cycleType" TEXT NOT NULL,
    "cyclePeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "targetAreas" TEXT NOT NULL,
    "keywordUpdates" TEXT,
    "backlinkUpdates" TEXT,
    "contentUpdates" TEXT,
    "technicalUpdates" TEXT,
    "expectedImpact" TEXT,
    "actualImpact" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "optimizationCycleId" TEXT,
    "testName" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "variantA" TEXT NOT NULL,
    "variantB" TEXT NOT NULL,
    "variantATraffic" INTEGER NOT NULL DEFAULT 0,
    "variantBTraffic" INTEGER NOT NULL DEFAULT 0,
    "variantAConversions" INTEGER NOT NULL DEFAULT 0,
    "variantBConversions" INTEGER NOT NULL DEFAULT 0,
    "variantAEngagement" DOUBLE PRECISION,
    "variantBEngagement" DOUBLE PRECISION,
    "confidenceLevel" DOUBLE PRECISION,
    "statisticalSignificance" BOOLEAN NOT NULL DEFAULT false,
    "winner" TEXT,
    "targetArticleId" TEXT,
    "targetCategory" TEXT,
    "sampleSize" INTEGER NOT NULL DEFAULT 1000,
    "currentSample" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "results" TEXT,
    "learnings" TEXT,
    "appliedGlobally" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModelTraining" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "datasetSize" INTEGER NOT NULL,
    "datasetPeriod" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "performanceMetrics" TEXT,
    "previousVersion" TEXT,
    "newVersion" TEXT NOT NULL,
    "improvementPercent" DOUBLE PRECISION,
    "trainingTimeMinutes" INTEGER,
    "deploymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "deployedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "dataQualityScore" DOUBLE PRECISION,
    "modelSize" INTEGER,
    "inferenceTimeMs" INTEGER,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIModelTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehaviorAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browserType" TEXT,
    "location" TEXT,
    "heatmapData" TEXT,
    "scrollDepthPercent" INTEGER,
    "timeOnPageSeconds" INTEGER,
    "interactions" TEXT,
    "engagementScore" DOUBLE PRECISION,
    "exitPoint" TEXT,
    "conversionEvent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregatedAt" TIMESTAMP(3),

    CONSTRAINT "UserBehaviorAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationInsight" (
    "id" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "confidence" DOUBLE PRECISION NOT NULL,
    "dataSource" TEXT NOT NULL,
    "relatedMetrics" TEXT,
    "suggestedAction" TEXT,
    "expectedImpact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "actionTaken" TEXT,
    "actionResult" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizationInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLoop" (
    "id" TEXT NOT NULL,
    "loopName" TEXT NOT NULL,
    "loopType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "dataCollectionQuery" TEXT NOT NULL,
    "analysisAlgorithm" TEXT NOT NULL,
    "actionTriggers" TEXT NOT NULL,
    "automationLevel" TEXT NOT NULL DEFAULT 'assisted',
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgImprovementPercent" DOUBLE PRECISION,
    "learnings" TEXT,
    "config" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningLoop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "embedding" TEXT,
    "semanticScore" DOUBLE PRECISION,
    "entities" TEXT,
    "keywords" TEXT,
    "context" TEXT,
    "sourceReferences" TEXT,
    "llmOptimized" BOOLEAN NOT NULL DEFAULT true,
    "qualityScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanonicalAnswer" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sources" TEXT,
    "relatedQuestions" TEXT,
    "factClaims" TEXT,
    "keywords" TEXT,
    "entities" TEXT,
    "llmFormat" TEXT NOT NULL,
    "qualityScore" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastCitedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceCitation" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "canonicalAnswerId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceAuthor" TEXT,
    "sourceDate" TIMESTAMP(3),
    "sourceDomain" TEXT,
    "citationText" TEXT NOT NULL,
    "citationStyle" TEXT NOT NULL DEFAULT 'APA',
    "reliability" INTEGER NOT NULL DEFAULT 0,
    "authorityScore" INTEGER NOT NULL DEFAULT 0,
    "freshness" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFAQ" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" DOUBLE PRECISION,
    "position" INTEGER NOT NULL,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT true,
    "isHumanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGlossary" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "complexity" TEXT NOT NULL DEFAULT 'beginner',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "relatedTerms" TEXT,
    "externalLinks" TEXT,
    "position" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGlossary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructuredContent" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "faqCount" INTEGER NOT NULL DEFAULT 0,
    "glossaryCount" INTEGER NOT NULL DEFAULT 0,
    "canonicalAnswerCount" INTEGER NOT NULL DEFAULT 0,
    "overallQualityScore" DOUBLE PRECISION,
    "llmReadabilityScore" DOUBLE PRECISION,
    "semanticCoherence" DOUBLE PRECISION,
    "entityDensity" DOUBLE PRECISION,
    "factDensity" DOUBLE PRECISION,
    "lastProcessedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructuredContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAOPerformanceMetric" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    "comparisonToPrevious" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RAOPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorEmbedding" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "embeddingVector" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL DEFAULT 1536,
    "tokens" INTEGER NOT NULL,
    "metadata" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VectorEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecognizedEntity" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliases" TEXT,
    "description" TEXT,
    "category" TEXT,
    "metadata" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "lastMentionedAt" TIMESTAMP(3),
    "embeddingId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecognizedEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "context" TEXT,
    "sentiment" TEXT,
    "relevanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorSearchIndex" (
    "id" TEXT NOT NULL,
    "indexName" TEXT NOT NULL,
    "indexType" TEXT NOT NULL DEFAULT 'hnsw',
    "dimension" INTEGER NOT NULL DEFAULT 1536,
    "metric" TEXT NOT NULL DEFAULT 'cosine',
    "contentTypes" TEXT NOT NULL,
    "configuration" TEXT,
    "totalVectors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastBuildAt" TIMESTAMP(3),
    "buildDurationMs" INTEGER,
    "avgQueryTimeMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VectorSearchIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HybridSearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryEmbedding" TEXT,
    "searchType" TEXT NOT NULL,
    "keywordResults" TEXT,
    "vectorResults" TEXT,
    "hybridResults" TEXT NOT NULL,
    "fusionAlgorithm" TEXT NOT NULL DEFAULT 'rrf',
    "keywordWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "vectorWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "totalResults" INTEGER NOT NULL,
    "queryTimeMs" INTEGER NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "clickedResultId" TEXT,
    "clickPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HybridSearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingUpdateQueue" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "processingStarted" TIMESTAMP(3),
    "processingEnded" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbeddingUpdateQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorSearchMetrics" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "testQuery" TEXT,
    "expectedResults" TEXT,
    "actualResults" TEXT,
    "searchType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,

    CONSTRAINT "VectorSearchMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "keyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "allowedEndpoints" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIUsage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "requestSize" INTEGER NOT NULL DEFAULT 0,
    "responseSize" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "structuredData" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT NOT NULL,
    "entities" TEXT NOT NULL,
    "facts" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "lastProcessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "llmReadability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAGFeed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feedType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "category" TEXT,
    "region" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "updateFrequency" TEXT NOT NULL DEFAULT 'hourly',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastGenerated" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "averageQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RAGFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIManifest" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "name" TEXT NOT NULL DEFAULT 'CoinDaily Knowledge API',
    "description" TEXT NOT NULL,
    "apiEndpoints" TEXT NOT NULL,
    "capabilities" TEXT NOT NULL,
    "dataTypes" TEXT NOT NULL,
    "rateLimit" TEXT NOT NULL,
    "authMethods" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AIManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationLog" (
    "id" TEXT NOT NULL,
    "knowledgeBaseId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "citedContent" TEXT NOT NULL,
    "citationContext" TEXT,
    "userQuery" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperEndpoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "responseFormat" TEXT NOT NULL,
    "exampleRequest" TEXT,
    "exampleResponse" TEXT,
    "documentation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISchemaMarkup" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "schemaJson" TEXT NOT NULL,
    "mainEntity" TEXT,
    "definitions" TEXT,
    "facts" TEXT,
    "quotes" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISchemaMarkup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMMetadata" (
    "id" TEXT NOT NULL,
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
    "entityDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "factDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "citationDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "structureComplexity" INTEGER NOT NULL DEFAULT 0,
    "llmOptimizationScore" INTEGER NOT NULL DEFAULT 0,
    "lastOptimized" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustSignal" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "signalSource" TEXT NOT NULL,
    "signalValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RAOCitationMetrics" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "totalSchemaMarkups" INTEGER NOT NULL DEFAULT 0,
    "totalDefinitions" INTEGER NOT NULL DEFAULT 0,
    "totalFacts" INTEGER NOT NULL DEFAULT 0,
    "totalQuotes" INTEGER NOT NULL DEFAULT 0,
    "totalCanonicalAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "totalTrustSignals" INTEGER NOT NULL DEFAULT 0,
    "avgSchemaQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgCitationReliability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "llmOptimizationScore" INTEGER NOT NULL DEFAULT 0,
    "citationDensity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "authorityScore" INTEGER NOT NULL DEFAULT 0,
    "aiReadabilityScore" INTEGER NOT NULL DEFAULT 0,
    "llmCitationCount" INTEGER NOT NULL DEFAULT 0,
    "lastLLMCitedAt" TIMESTAMP(3),
    "lastOptimizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RAOCitationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "category" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "lastAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicCluster" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorAnalysis" (
    "id" TEXT NOT NULL,
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
    "lastAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCalendarItem" (
    "id" TEXT NOT NULL,
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
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "publishedDate" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCalendarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendMonitor" (
    "id" TEXT NOT NULL,
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
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "peakDate" TIMESTAMP(3),
    "predictedDuration" INTEGER,
    "contentOpportunity" TEXT,
    "relatedKeywords" TEXT,
    "influencers" TEXT,
    "demography" TEXT,
    "actionItems" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentStrategyMetrics" (
    "id" TEXT NOT NULL,
    "dateRange" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalKeywords" INTEGER NOT NULL DEFAULT 0,
    "activeKeywords" INTEGER NOT NULL DEFAULT 0,
    "avgKeywordDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgSearchVolume" INTEGER NOT NULL DEFAULT 0,
    "topicClusters" INTEGER NOT NULL DEFAULT 0,
    "contentItemsPlanned" INTEGER NOT NULL DEFAULT 0,
    "contentItemsPublished" INTEGER NOT NULL DEFAULT 0,
    "avgContentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgSEOScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentStrategyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlink" (
    "id" TEXT NOT NULL,
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
    "verifiedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "campaignId" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkBuildingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "targetBacklinks" INTEGER NOT NULL DEFAULT 50,
    "targetDomainAuth" INTEGER NOT NULL DEFAULT 40,
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
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
    "avgDomainAuthority" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkBuildingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkProspect" (
    "id" TEXT NOT NULL,
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
    "lastContactedAt" TIMESTAMP(3),
    "responseRate" DOUBLE PRECISION,
    "campaignId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkProspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachActivity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "activityType" TEXT NOT NULL,
    "channel" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "templateUsed" TEXT,
    "sentBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "followUpDate" TIMESTAMP(3),
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerPartnership" (
    "id" TEXT NOT NULL,
    "influencerName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "email" TEXT,
    "region" TEXT,
    "category" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageViews" INTEGER NOT NULL DEFAULT 0,
    "audienceDemography" TEXT,
    "contentFocus" TEXT,
    "partnershipType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "relationshipLevel" TEXT NOT NULL DEFAULT 'COLD',
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "deliverables" TEXT,
    "compensation" TEXT,
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "backlinksGenerated" INTEGER NOT NULL DEFAULT 0,
    "mentionsCount" INTEGER NOT NULL DEFAULT 0,
    "trafficGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "lastCollaboration" TIMESTAMP(3),
    "nextCollaboration" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkVelocityMetric" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "newBacklinks" INTEGER NOT NULL DEFAULT 0,
    "lostBacklinks" INTEGER NOT NULL DEFAULT 0,
    "netChange" INTEGER NOT NULL DEFAULT 0,
    "totalActiveBacklinks" INTEGER NOT NULL DEFAULT 0,
    "avgDomainAuthority" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkVelocityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorityMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountHandle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reachMetrics" TEXT,
    "audienceData" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contentId" TEXT,
    "postType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "platformPostId" TEXT,
    "postUrl" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reachCount" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION,
    "viralityScore" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaSchedule" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "scheduleData" TEXT NOT NULL,
    "contentTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialEngagement" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "engagementType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUserId" TEXT,
    "platformUsername" TEXT,
    "content" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "isInfluencer" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER,
    "engagedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupUrl" TEXT,
    "description" TEXT,
    "region" TEXT,
    "category" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communityHealth" TEXT,
    "moderatorStatus" TEXT NOT NULL DEFAULT 'NONE',
    "accessToken" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityActivity" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "content" TEXT,
    "sentiment" DOUBLE PRECISION,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "isInfluential" BOOLEAN NOT NULL DEFAULT false,
    "topicTags" TEXT,
    "mentionedCoins" TEXT,
    "activityAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityInfluencer" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "influenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "niche" TEXT,
    "region" TEXT,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "partnershipStatus" TEXT NOT NULL DEFAULT 'NONE',
    "contentCoCreated" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerCollaboration" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "contentId" TEXT,
    "collaborationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "proposalDetails" TEXT,
    "deliverables" TEXT,
    "reachGenerated" INTEGER NOT NULL DEFAULT 0,
    "engagementGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION,
    "performanceScore" DOUBLE PRECISION,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerCollaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "targetAudience" TEXT,
    "contentThemes" TEXT,
    "hashtags" TEXT,
    "budget" DOUBLE PRECISION,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "followerGoal" INTEGER,
    "engagementGoal" DOUBLE PRECISION,
    "reachGoal" INTEGER,
    "conversionGoal" INTEGER,
    "followersGained" INTEGER NOT NULL DEFAULT 0,
    "totalEngagements" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementAutomation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "automationType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "triggers" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "filters" TEXT,
    "responseTemplates" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "totalTriggers" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngagementAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaAnalytics" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followerGrowth" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postsPublished" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEngagementPerPost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topPerformingPosts" TEXT,
    "worstPerformingPosts" TEXT,
    "bestPostingTimes" TEXT,
    "audienceInsights" TEXT,
    "industryAvgEngagement" DOUBLE PRECISION,
    "competitorComparison" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMediaAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalSEOAudit" (
    "id" TEXT NOT NULL,
    "auditType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crawlabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "indexabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lcpScore" DOUBLE PRECISION,
    "fidScore" DOUBLE PRECISION,
    "clsScore" DOUBLE PRECISION,
    "fcpScore" DOUBLE PRECISION,
    "ttfbScore" DOUBLE PRECISION,
    "tbtScore" DOUBLE PRECISION,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "warningIssues" INTEGER NOT NULL DEFAULT 0,
    "infoIssues" INTEGER NOT NULL DEFAULT 0,
    "issuesDetails" TEXT,
    "recommendations" TEXT,
    "estimatedImpact" TEXT,
    "auditDuration" INTEGER,
    "pagesAudited" INTEGER NOT NULL DEFAULT 0,
    "errorsEncountered" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "nextAuditScheduled" TIMESTAMP(3),

    CONSTRAINT "TechnicalSEOAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreWebVitals" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "lcp" DOUBLE PRECISION NOT NULL,
    "fid" DOUBLE PRECISION NOT NULL,
    "cls" DOUBLE PRECISION NOT NULL,
    "fcp" DOUBLE PRECISION NOT NULL,
    "ttfb" DOUBLE PRECISION NOT NULL,
    "tbt" DOUBLE PRECISION NOT NULL,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lcpRating" TEXT NOT NULL,
    "fidRating" TEXT NOT NULL,
    "clsRating" TEXT NOT NULL,
    "domContentLoaded" DOUBLE PRECISION,
    "windowLoad" DOUBLE PRECISION,
    "totalPageSize" DOUBLE PRECISION,
    "totalRequests" INTEGER,
    "javascriptSize" DOUBLE PRECISION,
    "cssSize" DOUBLE PRECISION,
    "imageSize" DOUBLE PRECISION,
    "fontSize" DOUBLE PRECISION,
    "deviceType" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreWebVitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileSEO" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMobileFriendly" BOOLEAN NOT NULL DEFAULT false,
    "mobileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasViewportMeta" BOOLEAN NOT NULL DEFAULT false,
    "viewportContent" TEXT,
    "touchTargetsProper" BOOLEAN NOT NULL DEFAULT false,
    "minTouchTargetSize" INTEGER,
    "touchElementsCount" INTEGER NOT NULL DEFAULT 0,
    "contentFitsViewport" BOOLEAN NOT NULL DEFAULT false,
    "textSizeAppropriate" BOOLEAN NOT NULL DEFAULT false,
    "mobileLCP" DOUBLE PRECISION,
    "mobileFID" DOUBLE PRECISION,
    "mobileCLS" DOUBLE PRECISION,
    "flashUsed" BOOLEAN NOT NULL DEFAULT false,
    "incompatiblePlugins" TEXT,
    "hasMediaQueries" BOOLEAN NOT NULL DEFAULT false,
    "breakpoints" TEXT,
    "mobileIndexable" BOOLEAN NOT NULL DEFAULT true,
    "mobileErrors" TEXT,
    "auditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileSEO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlabilityAudit" (
    "id" TEXT NOT NULL,
    "hasRobotsTxt" BOOLEAN NOT NULL DEFAULT false,
    "robotsTxtValid" BOOLEAN NOT NULL DEFAULT false,
    "robotsTxtContent" TEXT,
    "robotsTxtErrors" TEXT,
    "hasSitemap" BOOLEAN NOT NULL DEFAULT false,
    "sitemapUrl" TEXT,
    "sitemapValid" BOOLEAN NOT NULL DEFAULT false,
    "sitemapUrlCount" INTEGER NOT NULL DEFAULT 0,
    "sitemapErrors" TEXT,
    "crawlablePages" INTEGER NOT NULL DEFAULT 0,
    "blockedPages" INTEGER NOT NULL DEFAULT 0,
    "crawlErrors" INTEGER NOT NULL DEFAULT 0,
    "totalInternalLinks" INTEGER NOT NULL DEFAULT 0,
    "brokenInternalLinks" INTEGER NOT NULL DEFAULT 0,
    "redirectChains" INTEGER NOT NULL DEFAULT 0,
    "totalExternalLinks" INTEGER NOT NULL DEFAULT 0,
    "brokenExternalLinks" INTEGER NOT NULL DEFAULT 0,
    "crawlRate" DOUBLE PRECISION,
    "crawlEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pages200" INTEGER NOT NULL DEFAULT 0,
    "pages301" INTEGER NOT NULL DEFAULT 0,
    "pages302" INTEGER NOT NULL DEFAULT 0,
    "pages404" INTEGER NOT NULL DEFAULT 0,
    "pages500" INTEGER NOT NULL DEFAULT 0,
    "orphanedPages" TEXT,
    "deepPages" TEXT,
    "duplicateContent" TEXT,
    "auditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrawlabilityAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexabilityCheck" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isIndexable" BOOLEAN NOT NULL DEFAULT true,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "googleIndexStatus" TEXT,
    "hasNoIndex" BOOLEAN NOT NULL DEFAULT false,
    "hasNoFollow" BOOLEAN NOT NULL DEFAULT false,
    "metaRobotsContent" TEXT,
    "hasCanonical" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "canonicalSelfRef" BOOLEAN NOT NULL DEFAULT false,
    "hasStructuredData" BOOLEAN NOT NULL DEFAULT false,
    "structuredDataTypes" TEXT,
    "structuredDataErrors" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "contentQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "h1Count" INTEGER NOT NULL DEFAULT 0,
    "hasMetaDescription" BOOLEAN NOT NULL DEFAULT false,
    "metaDescLength" INTEGER,
    "hasTitleTag" BOOLEAN NOT NULL DEFAULT false,
    "titleLength" INTEGER,
    "blockingFactors" TEXT,
    "xRobotsTag" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexabilityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAudit" (
    "id" TEXT NOT NULL,
    "hasHTTPS" BOOLEAN NOT NULL DEFAULT false,
    "httpRedirectsHTTPS" BOOLEAN NOT NULL DEFAULT false,
    "sslCertValid" BOOLEAN NOT NULL DEFAULT false,
    "sslProvider" TEXT,
    "sslExpiresAt" TIMESTAMP(3),
    "hasHSTS" BOOLEAN NOT NULL DEFAULT false,
    "hstsMaxAge" INTEGER,
    "hasCSP" BOOLEAN NOT NULL DEFAULT false,
    "cspDirectives" TEXT,
    "hasXFrameOptions" BOOLEAN NOT NULL DEFAULT false,
    "xFrameOptions" TEXT,
    "hasXContentType" BOOLEAN NOT NULL DEFAULT false,
    "hasXXSSProtection" BOOLEAN NOT NULL DEFAULT false,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasMixedContent" BOOLEAN NOT NULL DEFAULT false,
    "mixedContentUrls" TEXT,
    "knownVulnerabilities" TEXT,
    "securityRisks" TEXT,
    "malwareDetected" BOOLEAN NOT NULL DEFAULT false,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistSources" TEXT,
    "auditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOPerformanceMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "seoHealthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobileScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "crawlabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "indexabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLCP" DOUBLE PRECISION,
    "avgFID" DOUBLE PRECISION,
    "avgCLS" DOUBLE PRECISION,
    "avgFCP" DOUBLE PRECISION,
    "avgTTFB" DOUBLE PRECISION,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "indexedPages" INTEGER NOT NULL DEFAULT 0,
    "indexablePages" INTEGER NOT NULL DEFAULT 0,
    "blockedPages" INTEGER NOT NULL DEFAULT 0,
    "totalCriticalIssues" INTEGER NOT NULL DEFAULT 0,
    "totalWarningIssues" INTEGER NOT NULL DEFAULT 0,
    "totalInfoIssues" INTEGER NOT NULL DEFAULT 0,
    "scoreChange" DOUBLE PRECISION,
    "issuesResolved" INTEGER NOT NULL DEFAULT 0,
    "newIssuesFound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOPerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleMyBusiness" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT,
    "businessCategory" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "completionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profileStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "businessHours" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "localSearchRanking" INTEGER,
    "mapPackRanking" INTEGER,
    "avgRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "searchViews" INTEGER NOT NULL DEFAULT 0,
    "directionsClicked" INTEGER NOT NULL DEFAULT 0,
    "phoneClicked" INTEGER NOT NULL DEFAULT 0,
    "websiteClicked" INTEGER NOT NULL DEFAULT 0,
    "lastOptimizedAt" TIMESTAMP(3),
    "nextAuditAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleMyBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalKeyword" (
    "id" TEXT NOT NULL,
    "gmbId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "keywordType" TEXT NOT NULL,
    "targetCity" TEXT NOT NULL,
    "targetRegion" TEXT,
    "targetCountry" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competition" TEXT NOT NULL DEFAULT 'MEDIUM',
    "currentRanking" INTEGER,
    "previousRanking" INTEGER,
    "bestRanking" INTEGER,
    "rankingChange" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTargeted" BOOLEAN NOT NULL DEFAULT true,
    "optimizationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTrackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalCitation" (
    "id" TEXT NOT NULL,
    "gmbId" TEXT NOT NULL,
    "directoryName" TEXT NOT NULL,
    "directoryUrl" TEXT NOT NULL,
    "directoryType" TEXT NOT NULL,
    "listingUrl" TEXT,
    "businessName" TEXT NOT NULL,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessWebsite" TEXT,
    "napConsistent" BOOLEAN NOT NULL DEFAULT true,
    "napIssues" TEXT,
    "domainAuthority" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationFlow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "citationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "referralTraffic" INTEGER NOT NULL DEFAULT 0,
    "localRelevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalReview" (
    "id" TEXT NOT NULL,
    "gmbId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerAvatar" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewTitle" TEXT,
    "reviewText" TEXT NOT NULL,
    "reviewLanguage" TEXT NOT NULL DEFAULT 'en',
    "platform" TEXT NOT NULL,
    "platformReviewId" TEXT,
    "reviewUrl" TEXT,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "keyTopics" TEXT,
    "hasResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseText" TEXT,
    "respondedAt" TIMESTAMP(3),
    "responseAuthor" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPurchaseVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalContent" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "targetCity" TEXT NOT NULL,
    "targetRegion" TEXT,
    "targetCountry" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "localKeywords" TEXT NOT NULL,
    "geoTags" TEXT,
    "localViews" INTEGER NOT NULL DEFAULT 0,
    "localShares" INTEGER NOT NULL DEFAULT 0,
    "localEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localSearchRanking" INTEGER,
    "optimizationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalSEOMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "avgCompletionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedBusinesses" INTEGER NOT NULL DEFAULT 0,
    "totalBusinesses" INTEGER NOT NULL DEFAULT 0,
    "avgLocalRanking" DOUBLE PRECISION,
    "mapPackAppearances" INTEGER NOT NULL DEFAULT 0,
    "localTop3Count" INTEGER NOT NULL DEFAULT 0,
    "localTop10Count" INTEGER NOT NULL DEFAULT 0,
    "totalLocalKeywords" INTEGER NOT NULL DEFAULT 0,
    "rankedKeywords" INTEGER NOT NULL DEFAULT 0,
    "top3Keywords" INTEGER NOT NULL DEFAULT 0,
    "top10Keywords" INTEGER NOT NULL DEFAULT 0,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "verifiedCitations" INTEGER NOT NULL DEFAULT 0,
    "claimedCitations" INTEGER NOT NULL DEFAULT 0,
    "napConsistencyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "positiveReviews" INTEGER NOT NULL DEFAULT 0,
    "negativeReviews" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localContentCount" INTEGER NOT NULL DEFAULT 0,
    "avgContentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localSearchViews" INTEGER NOT NULL DEFAULT 0,
    "directionsClicked" INTEGER NOT NULL DEFAULT 0,
    "phoneClicked" INTEGER NOT NULL DEFAULT 0,
    "websiteClicked" INTEGER NOT NULL DEFAULT 0,
    "localSEOScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalSEOMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizedImage" (
    "id" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "originalSize" INTEGER NOT NULL,
    "originalFormat" TEXT NOT NULL,
    "originalWidth" INTEGER NOT NULL,
    "originalHeight" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "webpPath" TEXT,
    "webpSize" INTEGER,
    "avifPath" TEXT,
    "avifSize" INTEGER,
    "smallPath" TEXT,
    "smallSize" INTEGER,
    "mediumPath" TEXT,
    "mediumSize" INTEGER,
    "largePath" TEXT,
    "largeSize" INTEGER,
    "hasWatermark" BOOLEAN NOT NULL DEFAULT false,
    "watermarkPosition" TEXT,
    "focalPointX" DOUBLE PRECISION,
    "focalPointY" DOUBLE PRECISION,
    "altText" TEXT,
    "metadata" TEXT,
    "compressionRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 80,
    "sizeSavings" INTEGER NOT NULL DEFAULT 0,
    "savingsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "placeholderBase64" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bandwidthSaved" INTEGER NOT NULL DEFAULT 0,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptimizedImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "processedImages" INTEGER NOT NULL DEFAULT 0,
    "failedImages" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentImageIndex" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeLeft" INTEGER,
    "config" TEXT NOT NULL,
    "totalOriginalSize" INTEGER NOT NULL DEFAULT 0,
    "totalOptimizedSize" INTEGER NOT NULL DEFAULT 0,
    "totalSizeSavings" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTime" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageFormat" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "supportsAlpha" BOOLEAN NOT NULL DEFAULT false,
    "supportsAnimation" BOOLEAN NOT NULL DEFAULT false,
    "isLossy" BOOLEAN NOT NULL DEFAULT true,
    "browserSupport" TEXT NOT NULL,
    "avgCompressionRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "totalBytesSaved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageWatermark" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "defaultPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "defaultOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "defaultScale" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageWatermark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageOptimizationMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "totalImagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "failedProcessing" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "webpGenerated" INTEGER NOT NULL DEFAULT 0,
    "avifGenerated" INTEGER NOT NULL DEFAULT 0,
    "jpegGenerated" INTEGER NOT NULL DEFAULT 0,
    "pngGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalOriginalSize" INTEGER NOT NULL DEFAULT 0,
    "totalOptimizedSize" INTEGER NOT NULL DEFAULT 0,
    "totalBytesSaved" INTEGER NOT NULL DEFAULT 0,
    "avgCompressionRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBandwidthSaved" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smallThumbnails" INTEGER NOT NULL DEFAULT 0,
    "mediumThumbnails" INTEGER NOT NULL DEFAULT 0,
    "largeThumbnails" INTEGER NOT NULL DEFAULT 0,
    "watermarksApplied" INTEGER NOT NULL DEFAULT 0,
    "avgQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cacheHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cachedImages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageOptimizationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "threatType" TEXT,
    "threatSource" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockDetails" TEXT,
    "recommendationType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "actionRequired" TEXT,
    "actionUrl" TEXT,
    "complianceType" TEXT,
    "regulatoryBody" TEXT,
    "deadline" TIMESTAMP(3),
    "seoThreatType" TEXT,
    "affectedUrls" TEXT,
    "impactScore" DOUBLE PRECISION,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedBy" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionDetails" TEXT,
    "actionTakenAt" TIMESTAMP(3),
    "actionTakenBy" TEXT,
    "metadata" TEXT,
    "relatedAlerts" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatLog" (
    "id" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "threatSource" TEXT NOT NULL,
    "threatVector" TEXT NOT NULL,
    "requestUrl" TEXT,
    "requestMethod" TEXT,
    "requestHeaders" TEXT,
    "requestBody" TEXT,
    "userAgent" TEXT,
    "detectionMethod" TEXT NOT NULL,
    "detectionRule" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wasBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockMethod" TEXT,
    "blockDuration" INTEGER,
    "potentialDamage" TEXT,
    "actualDamage" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRecommendation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "currentState" TEXT,
    "recommendedState" TEXT,
    "impactDescription" TEXT,
    "benefitDescription" TEXT,
    "actionRequired" TEXT NOT NULL,
    "actionUrl" TEXT,
    "estimatedTime" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "documentationUrl" TEXT,
    "tutorialUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "implementedBy" TEXT,
    "implementedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissReason" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "canAutoImplement" BOOLEAN NOT NULL DEFAULT false,
    "autoImplementScript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complianceType" TEXT NOT NULL,
    "regulatoryBody" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3),
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "impactDescription" TEXT,
    "affectedAreas" TEXT,
    "actionsRequired" TEXT NOT NULL,
    "estimatedEffort" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "internalGuideUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "implementedBy" TEXT,
    "implementedAt" TIMESTAMP(3),
    "notes" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "announcedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOSecurityIncident" (
    "id" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "detectionMethod" TEXT NOT NULL,
    "detectedBy" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affectedUrls" TEXT,
    "affectedKeywords" TEXT,
    "rankingImpact" DOUBLE PRECISION,
    "trafficImpact" DOUBLE PRECISION,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spamLinks" TEXT,
    "spamDomains" TEXT,
    "disavowRequired" BOOLEAN NOT NULL DEFAULT false,
    "disavowFileUrl" TEXT,
    "scrapedUrls" TEXT,
    "scraperDomains" TEXT,
    "dmcaFiled" BOOLEAN NOT NULL DEFAULT false,
    "dmcaDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'investigating',
    "resolutionSteps" TEXT,
    "recoveryProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedRecovery" TIMESTAMP(3),
    "actionsTaken" TEXT,
    "googleReportFiled" BOOLEAN NOT NULL DEFAULT false,
    "googleReportUrl" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOSecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlertMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "totalAlerts" INTEGER NOT NULL DEFAULT 0,
    "newAlerts" INTEGER NOT NULL DEFAULT 0,
    "dismissedAlerts" INTEGER NOT NULL DEFAULT 0,
    "actionTakenAlerts" INTEGER NOT NULL DEFAULT 0,
    "lowSeverity" INTEGER NOT NULL DEFAULT 0,
    "mediumSeverity" INTEGER NOT NULL DEFAULT 0,
    "highSeverity" INTEGER NOT NULL DEFAULT 0,
    "criticalSeverity" INTEGER NOT NULL DEFAULT 0,
    "threatAlerts" INTEGER NOT NULL DEFAULT 0,
    "recommendationAlerts" INTEGER NOT NULL DEFAULT 0,
    "complianceAlerts" INTEGER NOT NULL DEFAULT 0,
    "seoSecurityAlerts" INTEGER NOT NULL DEFAULT 0,
    "totalThreats" INTEGER NOT NULL DEFAULT 0,
    "blockedThreats" INTEGER NOT NULL DEFAULT 0,
    "blockRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgThreatConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topThreatType" TEXT,
    "topThreatSource" TEXT,
    "totalRecommendations" INTEGER NOT NULL DEFAULT 0,
    "implementedRecommendations" INTEGER NOT NULL DEFAULT 0,
    "implementationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalComplianceUpdates" INTEGER NOT NULL DEFAULT 0,
    "pendingCompliance" INTEGER NOT NULL DEFAULT 0,
    "completedCompliance" INTEGER NOT NULL DEFAULT 0,
    "complianceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "resolvedSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "activeSEOIncidents" INTEGER NOT NULL DEFAULT 0,
    "avgImpactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTime" INTEGER NOT NULL DEFAULT 0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlertMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMonitorRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "regulatoryBody" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "implementationGuide" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "impactLevel" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAutoVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationScript" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "internalGuideUrl" TEXT,
    "tags" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceMonitorRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMonitorCheck" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkMethod" TEXT NOT NULL,
    "checkedBy" TEXT,
    "status" TEXT NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "findings" TEXT,
    "issues" TEXT,
    "recommendations" TEXT,
    "evidenceUrls" TEXT,
    "evidenceData" TEXT,
    "screenshots" TEXT,
    "actionsRequired" TEXT,
    "actionsTaken" TEXT,
    "estimatedEffort" TEXT,
    "nextCheckDate" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceMonitorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOComplianceMonitorRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guidelineType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eeatComponent" TEXT,
    "requirement" TEXT NOT NULL,
    "bestPractices" TEXT NOT NULL,
    "commonMistakes" TEXT,
    "targetMetric" TEXT,
    "targetValue" TEXT,
    "currentValue" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "impactOnRankings" TEXT NOT NULL DEFAULT 'medium',
    "implementationGuide" TEXT NOT NULL,
    "verificationSteps" TEXT NOT NULL,
    "tools" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAutoMonitored" BOOLEAN NOT NULL DEFAULT false,
    "monitoringFrequency" TEXT,
    "officialUrl" TEXT,
    "documentationUrl" TEXT,
    "tutorialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOComplianceMonitorRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOComplianceMonitorCheck" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "contentId" TEXT,
    "checkDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkMethod" TEXT NOT NULL,
    "checkedBy" TEXT,
    "status" TEXT NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eeatScore" DOUBLE PRECISION,
    "passedChecks" TEXT,
    "failedChecks" TEXT,
    "warnings" TEXT,
    "measuredValue" TEXT,
    "targetValue" TEXT,
    "deviation" DOUBLE PRECISION,
    "impactAssessment" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'normal',
    "recommendations" TEXT,
    "quickFixes" TEXT,
    "estimatedEffort" TEXT,
    "actionsRequired" TEXT,
    "actionsTaken" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "nextCheckDate" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOComplianceMonitorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMonitorScore" (
    "id" TEXT NOT NULL,
    "scoreDate" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "regulatoryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seoScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "securityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gdprScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ccpaScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pciDssScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "googleGuidelinesScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eeatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coreWebVitalsScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "schemaMarkupScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expertiseScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authoritativenessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustworthinessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRules" INTEGER NOT NULL DEFAULT 0,
    "compliantRules" INTEGER NOT NULL DEFAULT 0,
    "nonCompliantRules" INTEGER NOT NULL DEFAULT 0,
    "partialCompliance" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "failedChecks" INTEGER NOT NULL DEFAULT 0,
    "warningChecks" INTEGER NOT NULL DEFAULT 0,
    "scoreTrend" TEXT NOT NULL DEFAULT 'stable',
    "scoreChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "mediumRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "lowRiskIssues" INTEGER NOT NULL DEFAULT 0,
    "openActions" INTEGER NOT NULL DEFAULT 0,
    "completedActions" INTEGER NOT NULL DEFAULT 0,
    "overdueActions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceMonitorScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMonitorNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "ruleId" TEXT,
    "checkId" TEXT,
    "updateId" TEXT,
    "recipientRole" TEXT,
    "recipientUserId" TEXT,
    "channels" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionTakenAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceMonitorNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceMonitorMetrics" (
    "id" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "totalRules" INTEGER NOT NULL DEFAULT 0,
    "activeRules" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "checksToday" INTEGER NOT NULL DEFAULT 0,
    "checksThisWeek" INTEGER NOT NULL DEFAULT 0,
    "checksThisMonth" INTEGER NOT NULL DEFAULT 0,
    "compliantItems" INTEGER NOT NULL DEFAULT 0,
    "nonCompliantItems" INTEGER NOT NULL DEFAULT 0,
    "partialCompliant" INTEGER NOT NULL DEFAULT 0,
    "needsReview" INTEGER NOT NULL DEFAULT 0,
    "complianceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gdprCompliance" INTEGER NOT NULL DEFAULT 0,
    "ccpaCompliance" INTEGER NOT NULL DEFAULT 0,
    "pciCompliance" INTEGER NOT NULL DEFAULT 0,
    "googleCompliance" INTEGER NOT NULL DEFAULT 0,
    "eeatCompliance" INTEGER NOT NULL DEFAULT 0,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "highIssues" INTEGER NOT NULL DEFAULT 0,
    "mediumIssues" INTEGER NOT NULL DEFAULT 0,
    "lowIssues" INTEGER NOT NULL DEFAULT 0,
    "resolvedIssues" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "completedActions" INTEGER NOT NULL DEFAULT 0,
    "pendingActions" INTEGER NOT NULL DEFAULT 0,
    "overdueActions" INTEGER NOT NULL DEFAULT 0,
    "avgResolutionTime" INTEGER NOT NULL DEFAULT 0,
    "totalNotifications" INTEGER NOT NULL DEFAULT 0,
    "sentNotifications" INTEGER NOT NULL DEFAULT 0,
    "readNotifications" INTEGER NOT NULL DEFAULT 0,
    "avgComplianceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSEOScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgEEATScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceMonitorMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "feedbackCategory" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "language" TEXT,
    "issueType" TEXT,
    "severity" TEXT,
    "suggestedCorrection" TEXT,
    "ticketId" TEXT,
    "metadata" TEXT,
    "impactScore" DOUBLE PRECISION DEFAULT 0,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViolationReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "aiModel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "detectedPatterns" TEXT,
    "keywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "penaltyApplied" TEXT,
    "penaltyDuration" INTEGER,
    "penaltyReason" TEXT,
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViolationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPenalty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "violationReportId" TEXT NOT NULL,
    "penaltyType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "escalationLevel" INTEGER NOT NULL DEFAULT 1,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "contentHidden" BOOLEAN NOT NULL DEFAULT true,
    "accountFrozen" BOOLEAN NOT NULL DEFAULT false,
    "ipBanned" BOOLEAN NOT NULL DEFAULT false,
    "emailBanned" BOOLEAN NOT NULL DEFAULT false,
    "appealStatus" TEXT,
    "appealReason" TEXT,
    "appealSubmittedAt" TIMESTAMP(3),
    "appealResolvedAt" TIMESTAMP(3),
    "appealResolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionReason" TEXT,
    "appliedBy" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReputation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "contentQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "violationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalViolations" INTEGER NOT NULL DEFAULT 0,
    "religiousViolations" INTEGER NOT NULL DEFAULT 0,
    "hateSpeechViolations" INTEGER NOT NULL DEFAULT 0,
    "harassmentViolations" INTEGER NOT NULL DEFAULT 0,
    "sexualViolations" INTEGER NOT NULL DEFAULT 0,
    "spamViolations" INTEGER NOT NULL DEFAULT 0,
    "shadowBanCount" INTEGER NOT NULL DEFAULT 0,
    "outrightBanCount" INTEGER NOT NULL DEFAULT 0,
    "officialBanCount" INTEGER NOT NULL DEFAULT 0,
    "totalPenaltyDays" INTEGER NOT NULL DEFAULT 0,
    "trustLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "accountAge" INTEGER NOT NULL DEFAULT 0,
    "priorityTier" TEXT NOT NULL DEFAULT 'FREE',
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "falsePositiveCount" INTEGER NOT NULL DEFAULT 0,
    "accurateReportsCount" INTEGER NOT NULL DEFAULT 0,
    "lastViolationAt" TIMESTAMP(3),
    "lastPenaltyAt" TIMESTAMP(3),
    "consecutiveCleanDays" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FalsePositive" (
    "id" TEXT NOT NULL,
    "violationReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalViolationType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "originalConfidence" DOUBLE PRECISION NOT NULL,
    "originalModel" TEXT NOT NULL,
    "correctedBy" TEXT NOT NULL,
    "correctionReason" TEXT NOT NULL,
    "actualViolationType" TEXT,
    "trainingData" TEXT,
    "patterns" TEXT,
    "userImpact" TEXT,
    "systemImpact" TEXT,
    "processedForTraining" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FalsePositive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationSettings" (
    "id" TEXT NOT NULL,
    "toxicityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "religiousContentThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "hateSpeechThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "harassmentThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "sexualContentThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "spamThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "autoShadowBanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoOutrightBanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoOfficialBanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "level1Threshold" INTEGER NOT NULL DEFAULT 3,
    "level2Threshold" INTEGER NOT NULL DEFAULT 6,
    "level3Threshold" INTEGER NOT NULL DEFAULT 10,
    "shadowBanDuration" INTEGER NOT NULL DEFAULT 168,
    "outrightBanDuration" INTEGER NOT NULL DEFAULT 720,
    "officialBanDuration" INTEGER NOT NULL DEFAULT -1,
    "backgroundMonitoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "realTimeAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "monitoringInterval" INTEGER NOT NULL DEFAULT 30,
    "superAdminBypass" BOOLEAN NOT NULL DEFAULT true,
    "adminLightChecks" BOOLEAN NOT NULL DEFAULT true,
    "premiumFastTrack" BOOLEAN NOT NULL DEFAULT true,
    "freeUserThoroughCheck" BOOLEAN NOT NULL DEFAULT true,
    "falsePositiveThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "retrainingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyModelUpdates" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "violationReportId" TEXT,
    "contentType" TEXT,
    "contentId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionRequired" TEXT,
    "affectedUsers" INTEGER,
    "violationCount" INTEGER,
    "timeWindow" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "deliveredViaWebSocket" BOOLEAN NOT NULL DEFAULT false,
    "deliveredViaEmail" BOOLEAN NOT NULL DEFAULT false,
    "deliveredViaPush" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationQueue" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "flagReason" TEXT,
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "autoFlagged" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminRole" TEXT NOT NULL,
    "adminComment" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_audit_log" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationCategory" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "agentId" TEXT,
    "userId" TEXT,
    "requestId" TEXT NOT NULL,
    "endpoint" TEXT,
    "httpMethod" TEXT,
    "inputData" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputData" TEXT,
    "outputHash" TEXT,
    "outputTokens" INTEGER,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "reasoning" TEXT,
    "confidence" DOUBLE PRECISION,
    "alternatives" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "thresholds" TEXT,
    "passed" BOOLEAN,
    "dataSources" TEXT,
    "citations" TEXT,
    "externalAPIs" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "humanDecision" TEXT,
    "overrideReason" TEXT,
    "feedbackToAI" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "processingTimeMs" INTEGER,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "gdprCompliant" BOOLEAN NOT NULL DEFAULT true,
    "retentionCategory" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletionScheduled" TIMESTAMP(3),
    "metadata" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_decision_log" (
    "id" TEXT NOT NULL,
    "auditLogId" TEXT NOT NULL,
    "decisionPoint" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "decisionOutcome" TEXT NOT NULL,
    "primaryReason" TEXT NOT NULL,
    "contributingFactors" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "alternativeOptions" TEXT,
    "dataPoints" TEXT,
    "weights" TEXT,
    "thresholds" TEXT,
    "rulesApplied" TEXT,
    "policiesFollowed" TEXT,
    "exceptions" TEXT,
    "expectedImpact" TEXT,
    "riskLevel" TEXT,
    "biasCheck" TEXT,
    "humanExplanation" TEXT,
    "technicalDetails" TEXT,
    "visualData" TEXT,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentObtained" BOOLEAN,
    "userNotified" BOOLEAN NOT NULL DEFAULT false,
    "rightToExplanation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_decision_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "agentTypes" TEXT,
    "operationTypes" TEXT,
    "totalOperations" INTEGER NOT NULL,
    "successfulOps" INTEGER NOT NULL,
    "failedOps" INTEGER NOT NULL,
    "humanOverrides" INTEGER NOT NULL,
    "averageQuality" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "gdprCompliant" INTEGER NOT NULL,
    "dataRetention" TEXT NOT NULL,
    "consentStatus" TEXT,
    "reportData" TEXT NOT NULL,
    "summary" TEXT,
    "recommendations" TEXT,
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "requestedBy" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "consentMethod" TEXT,
    "consentVersion" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "rightToWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "rightToExplanation" BOOLEAN NOT NULL DEFAULT true,
    "rightToPortability" BOOLEAN NOT NULL DEFAULT true,
    "rightToErasure" BOOLEAN NOT NULL DEFAULT true,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "dataDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICostTracking" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "agentId" TEXT,
    "agentType" TEXT,
    "taskId" TEXT,
    "workflowId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "inputCostPer1k" DOUBLE PRECISION NOT NULL,
    "outputCostPer1k" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "responseTimeMs" INTEGER,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "ipAddress" TEXT,
    "requestMetadata" TEXT,
    "responseMetadata" TEXT,
    "tags" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingPeriod" TEXT NOT NULL,

    CONSTRAINT "AICostTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLimit" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "dailyLimit" DOUBLE PRECISION,
    "weeklyLimit" DOUBLE PRECISION,
    "monthlyLimit" DOUBLE PRECISION,
    "dailySpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklySpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlySpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastWeeklyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMonthlyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "throttleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "throttleAt" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isThrottled" BOOLEAN NOT NULL DEFAULT false,
    "throttledAt" TIMESTAMP(3),
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertThresholds" TEXT NOT NULL,
    "lastAlertSent" TIMESTAMP(3),
    "lastAlertLevel" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAlert" (
    "id" TEXT NOT NULL,
    "budgetLimitId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "thresholdPercent" DOUBLE PRECISION NOT NULL,
    "currentSpent" DOUBLE PRECISION NOT NULL,
    "budgetLimit" DOUBLE PRECISION NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "message" TEXT NOT NULL,
    "recommendation" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "recipients" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "billingPeriod" TEXT,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "totalOperations" INTEGER NOT NULL,
    "averageCostPerOp" DOUBLE PRECISION NOT NULL,
    "contentGenCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "translationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moderationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketAnalysisCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageGenCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openaiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anthropicCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "googleCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metaCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xaiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "retryRate" DOUBLE PRECISION,
    "previousPeriodCost" DOUBLE PRECISION,
    "costChange" DOUBLE PRECISION,
    "costChangeAmount" DOUBLE PRECISION,
    "trendDirection" TEXT,
    "forecastNextPeriod" DOUBLE PRECISION,
    "forecastConfidence" DOUBLE PRECISION,
    "recommendations" TEXT,
    "highCostOperations" TEXT,
    "budgetLimit" DOUBLE PRECISION,
    "budgetUtilization" DOUBLE PRECISION,
    "budgetRemaining" DOUBLE PRECISION,
    "detailedData" TEXT NOT NULL,
    "chartData" TEXT,
    "generatedBy" TEXT,
    "generationType" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegatedPermission" (
    "id" TEXT NOT NULL,
    "delegatedToUserId" TEXT NOT NULL,
    "delegatedByUserId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "scopeData" TEXT,
    "constraints" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegatedPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "walletType" "WalletType" NOT NULL,
    "userId" TEXT,
    "walletAddress" TEXT NOT NULL,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lockedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stakedBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "cePoints" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "joyTokens" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dailyWithdrawalLimit" DOUBLE PRECISION,
    "transactionLimit" DOUBLE PRECISION,
    "whitelistedAddresses" TEXT,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
    "otpRequired" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastTransactionAt" TIMESTAMP(3),

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "operationType" TEXT NOT NULL,
    "fromWalletId" TEXT,
    "toWalletId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "exchangeRate" DOUBLE PRECISION,
    "originalCurrency" TEXT,
    "originalAmount" DOUBLE PRECISION,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "referenceId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "blockchainTxHash" TEXT,
    "blockchainConfirmations" INTEGER,
    "paymentMethod" "PaymentMethod",
    "paymentGateway" TEXT,
    "paymentGatewayTxId" TEXT,
    "externalReference" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "riskScore" DOUBLE PRECISION,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceOperationLog" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationCategory" TEXT NOT NULL,
    "transactionId" TEXT,
    "userId" TEXT,
    "performedBy" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "outputData" TEXT,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakingRecord" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stakedAmount" DOUBLE PRECISION NOT NULL,
    "lockPeriodDays" INTEGER NOT NULL,
    "rewardRate" DOUBLE PRECISION NOT NULL,
    "accumulatedRewards" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastRewardClaimAt" TIMESTAMP(3),
    "totalRewardsClaimed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "StakingStatus" NOT NULL DEFAULT 'ACTIVE',
    "stakedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockAt" TIMESTAMP(3) NOT NULL,
    "unlockedAt" TIMESTAMP(3),
    "earlyUnlockPenalty" DOUBLE PRECISION,

    CONSTRAINT "StakingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" DOUBLE PRECISION NOT NULL,
    "toAmount" DOUBLE PRECISION NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "conversionFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "convertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropCampaign" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "totalSupply" DOUBLE PRECISION NOT NULL,
    "distributedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "eligibilityCriteria" JSONB NOT NULL,
    "amountPerUser" DOUBLE PRECISION,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "distributedAt" TIMESTAMP(3),
    "vestingSchedule" TEXT,
    "claimStartDate" TIMESTAMP(3) NOT NULL,
    "claimEndDate" TIMESTAMP(3) NOT NULL,
    "isClaimable" BOOLEAN NOT NULL DEFAULT true,
    "status" "AirdropStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirdropCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirdropClaim" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "claimAmount" DOUBLE PRECISION NOT NULL,
    "vestedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "eligibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "AirdropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "escrowWalletId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "escrowAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLATFORM_TOKEN',
    "escrowFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "description" TEXT NOT NULL,
    "releaseConditions" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "disputeRaised" BOOLEAN NOT NULL DEFAULT false,
    "disputeRaisedBy" TEXT,
    "disputeRaisedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "disputeEvidence" TEXT,
    "mediatorId" TEXT,
    "disputeResolution" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPaymentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "paymentGateway" TEXT,
    "transactionId" TEXT,
    "gatewayTxId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "proratedAmount" DOUBLE PRECISION,
    "proratedDays" INTEGER,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextBillingDate" TIMESTAMP(3),

    CONSTRAINT "SubscriptionPaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "originalTransactionId" TEXT NOT NULL,
    "originalTxId" TEXT NOT NULL,
    "refundTransactionId" TEXT,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "refundReason" TEXT NOT NULL,
    "refundType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCategory" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "refundMethod" TEXT NOT NULL,
    "refundReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "metadata" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "joyTokenUsdRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "joyTokenSymbol" TEXT NOT NULL DEFAULT 'JY',
    "joyTokenName" TEXT NOT NULL DEFAULT 'JOY Token',
    "lastRateUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateUpdatedBy" TEXT,
    "rateUpdateReason" TEXT,
    "previousRate" DOUBLE PRECISION,
    "cePointsToJyRate" INTEGER NOT NULL DEFAULT 100,
    "cePointsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'JY',
    "supportedCurrencies" TEXT NOT NULL DEFAULT 'JY,USD,EUR,KES,NGN,GHS,ZAR',
    "platformName" TEXT NOT NULL DEFAULT 'CoinDaily',
    "platformUrl" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRateHistory" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "usdRate" DOUBLE PRECISION NOT NULL,
    "previousRate" DOUBLE PRECISION,
    "changePercentage" DOUBLE PRECISION,
    "updatedBy" TEXT NOT NULL,
    "updateReason" TEXT,
    "notes" TEXT,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeWalletAuthSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "targetWalletId" TEXT,
    "reason" TEXT,
    "metadata" TEXT,
    "otpIds" TEXT NOT NULL,
    "verifiedEmails" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WeWalletAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletWhitelist" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addressType" TEXT NOT NULL,
    "label" TEXT,
    "verificationMethod" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatesAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "fraudScore" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "autoFrozen" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JY',
    "destinationAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "transactionHash" TEXT,
    "lastWithdrawalAt" TIMESTAMP(3),
    "cooldownHours" DOUBLE PRECISION,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitelist_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "reason" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "changeYear" INTEGER NOT NULL,
    "changeCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whitelist_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAgent_isActive_idx" ON "AIAgent"("isActive");

-- CreateIndex
CREATE INDEX "AIAgent_type_idx" ON "AIAgent"("type");

-- CreateIndex
CREATE INDEX "AITask_status_createdAt_idx" ON "AITask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AITask_priority_createdAt_idx" ON "AITask"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "AITask_agentId_status_idx" ON "AITask"("agentId", "status");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_timestamp_idx" ON "AnalyticsEvent"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_timestamp_idx" ON "AnalyticsEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_resourceType_idx" ON "AnalyticsEvent"("resourceType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_resourceId_idx" ON "AnalyticsEvent"("resourceId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_isPremium_idx" ON "Article"("isPremium");

-- CreateIndex
CREATE INDEX "Article_authorId_status_idx" ON "Article"("authorId", "status");

-- CreateIndex
CREATE INDEX "Article_categoryId_publishedAt_idx" ON "Article"("categoryId", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentRevision_articleId_createdAt_idx" ON "ContentRevision"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_changedBy_idx" ON "ContentRevision"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_articleId_revisionNumber_key" ON "ContentRevision"("articleId", "revisionNumber");

-- CreateIndex
CREATE INDEX "ArticleTranslation_translationStatus_idx" ON "ArticleTranslation"("translationStatus");

-- CreateIndex
CREATE INDEX "ArticleTranslation_articleId_languageCode_idx" ON "ArticleTranslation"("articleId", "languageCode");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTranslation_articleId_languageCode_key" ON "ArticleTranslation"("articleId", "languageCode");

-- CreateIndex
CREATE INDEX "ArticleImage_articleId_imageType_idx" ON "ArticleImage"("articleId", "imageType");

-- CreateIndex
CREATE INDEX "ArticleImage_status_processingStatus_idx" ON "ArticleImage"("status", "processingStatus");

-- CreateIndex
CREATE INDEX "ArticleImage_chartSymbol_idx" ON "ArticleImage"("chartSymbol");

-- CreateIndex
CREATE INDEX "ArticleImage_createdAt_idx" ON "ArticleImage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "CommunityPost_parentId_idx" ON "CommunityPost"("parentId");

-- CreateIndex
CREATE INDEX "CommunityPost_moderationStatus_createdAt_idx" ON "CommunityPost"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceCheck_requirementId_idx" ON "ComplianceCheck"("requirementId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_checkedAt_idx" ON "ComplianceCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "ComplianceCheck_userId_idx" ON "ComplianceCheck"("userId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_passed_idx" ON "ComplianceCheck"("passed");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_isActive_idx" ON "ComplianceRequirement"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_providerId_idx" ON "ComplianceRequirement"("providerId");

-- CreateIndex
CREATE INDEX "ComplianceRequirement_country_idx" ON "ComplianceRequirement"("country");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRequirement_country_providerId_key" ON "ComplianceRequirement"("country", "providerId");

-- CreateIndex
CREATE INDEX "ContentPerformance_date_idx" ON "ContentPerformance"("date");

-- CreateIndex
CREATE INDEX "ContentPerformance_contentType_date_idx" ON "ContentPerformance"("contentType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPerformance_contentId_contentType_date_key" ON "ContentPerformance"("contentId", "contentType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentWorkflow_articleId_key" ON "ContentWorkflow"("articleId");

-- CreateIndex
CREATE INDEX "ContentWorkflow_workflowType_idx" ON "ContentWorkflow"("workflowType");

-- CreateIndex
CREATE INDEX "ContentWorkflow_assignedReviewerId_idx" ON "ContentWorkflow"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "ContentWorkflow_priority_createdAt_idx" ON "ContentWorkflow"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "ContentWorkflow_currentState_idx" ON "ContentWorkflow"("currentState");

-- CreateIndex
CREATE INDEX "ContentPipeline_status_idx" ON "ContentPipeline"("status");

-- CreateIndex
CREATE INDEX "ContentPipeline_articleId_idx" ON "ContentPipeline"("articleId");

-- CreateIndex
CREATE INDEX "ContentPipeline_startedAt_idx" ON "ContentPipeline"("startedAt");

-- CreateIndex
CREATE INDEX "ContentPipeline_completedAt_idx" ON "ContentPipeline"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfiguration_key_key" ON "SystemConfiguration"("key");

-- CreateIndex
CREATE INDEX "SystemConfiguration_key_idx" ON "SystemConfiguration"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeIntegration_slug_key" ON "ExchangeIntegration"("slug");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_region_idx" ON "ExchangeIntegration"("region");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_isActive_idx" ON "ExchangeIntegration"("isActive");

-- CreateIndex
CREATE INDEX "ExchangeIntegration_slug_idx" ON "ExchangeIntegration"("slug");

-- CreateIndex
CREATE INDEX "FraudAnalysis_phoneNumber_idx" ON "FraudAnalysis"("phoneNumber");

-- CreateIndex
CREATE INDEX "FraudAnalysis_analyzedAt_idx" ON "FraudAnalysis"("analyzedAt");

-- CreateIndex
CREATE INDEX "FraudAnalysis_userId_idx" ON "FraudAnalysis"("userId");

-- CreateIndex
CREATE INDEX "FraudAnalysis_recommendation_idx" ON "FraudAnalysis"("recommendation");

-- CreateIndex
CREATE INDEX "FraudAnalysis_riskLevel_idx" ON "FraudAnalysis"("riskLevel");

-- CreateIndex
CREATE INDEX "MarketData_exchange_timestamp_idx" ON "MarketData"("exchange", "timestamp");

-- CreateIndex
CREATE INDEX "MarketData_tokenId_timestamp_idx" ON "MarketData"("tokenId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MobileMoneyProvider_name_key" ON "MobileMoneyProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MobileMoneyProvider_code_key" ON "MobileMoneyProvider"("code");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_isActive_idx" ON "MobileMoneyProvider"("isActive");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_country_idx" ON "MobileMoneyProvider"("country");

-- CreateIndex
CREATE INDEX "MobileMoneyProvider_code_idx" ON "MobileMoneyProvider"("code");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_providerTransactionId_idx" ON "MobileMoneyTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_createdAt_idx" ON "MobileMoneyTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_phoneNumber_idx" ON "MobileMoneyTransaction"("phoneNumber");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_transactionType_idx" ON "MobileMoneyTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_status_idx" ON "MobileMoneyTransaction"("status");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_providerId_idx" ON "MobileMoneyTransaction"("providerId");

-- CreateIndex
CREATE INDEX "MobileMoneyTransaction_userId_idx" ON "MobileMoneyTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_isUsed_idx" ON "PasswordReset"("isUsed");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_createdAt_idx" ON "PaymentWebhook"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentWebhook_transactionId_idx" ON "PaymentWebhook"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentWebhook_processed_idx" ON "PaymentWebhook"("processed");

-- CreateIndex
CREATE INDEX "PaymentWebhook_eventType_idx" ON "PaymentWebhook"("eventType");

-- CreateIndex
CREATE INDEX "PaymentWebhook_provider_idx" ON "PaymentWebhook"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_isRevoked_idx" ON "RefreshToken"("isRevoked");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");

-- CreateIndex
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_idx" ON "SecurityEvent"("eventType");

-- CreateIndex
CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_lastActivityAt_idx" ON "Session"("lastActivityAt");

-- CreateIndex
CREATE INDEX "Session_isActive_idx" ON "Session"("isActive");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_billingPeriodEnd_idx" ON "SubscriptionPayment"("billingPeriodEnd");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_nextAttemptAt_idx" ON "SubscriptionPayment"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_userId_idx" ON "SubscriptionPayment"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_trendingScore_idx" ON "Tag"("trendingScore");

-- CreateIndex
CREATE INDEX "Tag_usageCount_idx" ON "Tag"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "Token_symbol_key" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Token_slug_key" ON "Token"("slug");

-- CreateIndex
CREATE INDEX "Token_tokenType_idx" ON "Token"("tokenType");

-- CreateIndex
CREATE INDEX "Token_isListed_idx" ON "Token"("isListed");

-- CreateIndex
CREATE INDEX "Token_slug_idx" ON "Token"("slug");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "Token"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserEngagement_postId_actionType_idx" ON "UserEngagement"("postId", "actionType");

-- CreateIndex
CREATE INDEX "UserEngagement_articleId_actionType_idx" ON "UserEngagement"("articleId", "actionType");

-- CreateIndex
CREATE INDEX "UserEngagement_userId_createdAt_idx" ON "UserEngagement"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_postId_key" ON "Vote"("userId", "postId");

-- CreateIndex
CREATE INDEX "WorkflowNotification_createdAt_idx" ON "WorkflowNotification"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowNotification_status_idx" ON "WorkflowNotification"("status");

-- CreateIndex
CREATE INDEX "WorkflowNotification_recipientId_idx" ON "WorkflowNotification"("recipientId");

-- CreateIndex
CREATE INDEX "WorkflowNotification_workflowId_idx" ON "WorkflowNotification"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowStep_stepName_idx" ON "WorkflowStep"("stepName");

-- CreateIndex
CREATE INDEX "WorkflowStep_assigneeId_idx" ON "WorkflowStep"("assigneeId");

-- CreateIndex
CREATE INDEX "WorkflowStep_status_idx" ON "WorkflowStep"("status");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_stepOrder_idx" ON "WorkflowStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowTransition_createdAt_idx" ON "WorkflowTransition"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowTransition_fromState_toState_idx" ON "WorkflowTransition"("fromState", "toState");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_idx" ON "WorkflowTransition"("workflowId");

-- CreateIndex
CREATE INDEX "AuditEvent_type_timestamp_idx" ON "AuditEvent"("type", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_timestamp_idx" ON "AuditEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_severity_timestamp_idx" ON "AuditEvent"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_category_timestamp_idx" ON "AuditEvent"("category", "timestamp");

-- CreateIndex
CREATE INDEX "AuditEvent_success_timestamp_idx" ON "AuditEvent"("success", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTrust_deviceId_key" ON "DeviceTrust"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTrust_userId_isActive_idx" ON "DeviceTrust"("userId", "isActive");

-- CreateIndex
CREATE INDEX "DeviceTrust_deviceId_idx" ON "DeviceTrust"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTrust_trustScore_idx" ON "DeviceTrust"("trustScore");

-- CreateIndex
CREATE INDEX "Marquee_isActive_isPublished_idx" ON "Marquee"("isActive", "isPublished");

-- CreateIndex
CREATE INDEX "Marquee_type_position_idx" ON "Marquee"("type", "position");

-- CreateIndex
CREATE INDEX "Marquee_priority_idx" ON "Marquee"("priority");

-- CreateIndex
CREATE INDEX "Marquee_startDate_endDate_idx" ON "Marquee"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarqueeStyle_marqueeId_key" ON "MarqueeStyle"("marqueeId");

-- CreateIndex
CREATE INDEX "MarqueeItem_marqueeId_order_idx" ON "MarqueeItem"("marqueeId", "order");

-- CreateIndex
CREATE INDEX "MarqueeItem_type_isVisible_idx" ON "MarqueeItem"("type", "isVisible");

-- CreateIndex
CREATE INDEX "MarqueeTemplate_category_isDefault_idx" ON "MarqueeTemplate"("category", "isDefault");

-- CreateIndex
CREATE INDEX "AdminPermission_adminId_idx" ON "AdminPermission"("adminId");

-- CreateIndex
CREATE INDEX "AdminPermission_resource_idx" ON "AdminPermission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_resource_key" ON "AdminPermission"("adminId", "resource");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_timestamp_idx" ON "AuditLog"("adminId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRole_name_key" ON "AdminRole"("name");

-- CreateIndex
CREATE INDEX "AdminRole_name_idx" ON "AdminRole"("name");

-- CreateIndex
CREATE INDEX "AdminRole_isActive_idx" ON "AdminRole"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedIP_ipAddress_key" ON "BlacklistedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlacklistedIP_ipAddress_idx" ON "BlacklistedIP"("ipAddress");

-- CreateIndex
CREATE INDEX "BlacklistedIP_userId_idx" ON "BlacklistedIP"("userId");

-- CreateIndex
CREATE INDEX "BlacklistedIP_isActive_idx" ON "BlacklistedIP"("isActive");

-- CreateIndex
CREATE INDEX "BlacklistedIP_expiresAt_idx" ON "BlacklistedIP"("expiresAt");

-- CreateIndex
CREATE INDEX "SEOMetadata_contentId_idx" ON "SEOMetadata"("contentId");

-- CreateIndex
CREATE INDEX "SEOMetadata_contentType_idx" ON "SEOMetadata"("contentType");

-- CreateIndex
CREATE INDEX "SEOMetadata_isActive_idx" ON "SEOMetadata"("isActive");

-- CreateIndex
CREATE INDEX "SEOMetadata_updatedAt_idx" ON "SEOMetadata"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SEOMetadata_contentId_contentType_key" ON "SEOMetadata"("contentId", "contentType");

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
CREATE INDEX "SEOKeyword_isActive_idx" ON "SEOKeyword"("isActive");

-- CreateIndex
CREATE INDEX "SEORanking_keywordId_checkDate_idx" ON "SEORanking"("keywordId", "checkDate");

-- CreateIndex
CREATE INDEX "SEORanking_position_idx" ON "SEORanking"("position");

-- CreateIndex
CREATE INDEX "SEORanking_checkDate_idx" ON "SEORanking"("checkDate");

-- CreateIndex
CREATE INDEX "SEORanking_date_idx" ON "SEORanking"("date");

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
CREATE INDEX "SEOIssue_type_idx" ON "SEOIssue"("type");

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
CREATE INDEX "SEOAlert_resourceType_resourceId_idx" ON "SEOAlert"("resourceType", "resourceId");

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
CREATE INDEX "InternalLinkSuggestion_sourceUrl_idx" ON "InternalLinkSuggestion"("sourceUrl");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_targetUrl_idx" ON "InternalLinkSuggestion"("targetUrl");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_priority_idx" ON "InternalLinkSuggestion"("priority");

-- CreateIndex
CREATE INDEX "InternalLinkSuggestion_implementedAt_idx" ON "InternalLinkSuggestion"("implementedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadabilityAnalysis_contentId_key" ON "ReadabilityAnalysis"("contentId");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_contentId_idx" ON "ReadabilityAnalysis"("contentId");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_fleschKincaidGrade_idx" ON "ReadabilityAnalysis"("fleschKincaidGrade");

-- CreateIndex
CREATE INDEX "ReadabilityAnalysis_gradeLevel_idx" ON "ReadabilityAnalysis"("gradeLevel");

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

-- CreateIndex
CREATE INDEX "ContentAutomationLog_jobId_idx" ON "ContentAutomationLog"("jobId");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_articleId_idx" ON "ContentAutomationLog"("articleId");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_level_createdAt_idx" ON "ContentAutomationLog"("level", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAutomationLog_action_createdAt_idx" ON "ContentAutomationLog"("action", "createdAt");

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

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_source_detectedAt_idx" ON "AlgorithmUpdate"("source", "detectedAt");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_status_idx" ON "AlgorithmUpdate"("status");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_severity_idx" ON "AlgorithmUpdate"("severity");

-- CreateIndex
CREATE INDEX "AlgorithmUpdate_updateType_idx" ON "AlgorithmUpdate"("updateType");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_algorithmUpdateId_status_idx" ON "AlgorithmResponse"("algorithmUpdateId", "status");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_actionType_idx" ON "AlgorithmResponse"("actionType");

-- CreateIndex
CREATE INDEX "AlgorithmResponse_priority_idx" ON "AlgorithmResponse"("priority");

-- CreateIndex
CREATE INDEX "SERPVolatility_keyword_checkDate_idx" ON "SERPVolatility"("keyword", "checkDate");

-- CreateIndex
CREATE INDEX "SERPVolatility_isAnomaly_requiresAction_idx" ON "SERPVolatility"("isAnomaly", "requiresAction");

-- CreateIndex
CREATE INDEX "SERPVolatility_volatilityScore_idx" ON "SERPVolatility"("volatilityScore");

-- CreateIndex
CREATE INDEX "SERPVolatility_checkDate_idx" ON "SERPVolatility"("checkDate");

-- CreateIndex
CREATE INDEX "SchemaRefresh_contentId_idx" ON "SchemaRefresh"("contentId");

-- CreateIndex
CREATE INDEX "SchemaRefresh_validationStatus_idx" ON "SchemaRefresh"("validationStatus");

-- CreateIndex
CREATE INDEX "SchemaRefresh_refreshedAt_idx" ON "SchemaRefresh"("refreshedAt");

-- CreateIndex
CREATE INDEX "SchemaRefresh_schemaType_idx" ON "SchemaRefresh"("schemaType");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_contentId_idx" ON "ContentFreshnessAgent"("contentId");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_requiresUpdate_updatePriority_idx" ON "ContentFreshnessAgent"("requiresUpdate", "updatePriority");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_status_idx" ON "ContentFreshnessAgent"("status");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_freshnessScore_idx" ON "ContentFreshnessAgent"("freshnessScore");

-- CreateIndex
CREATE INDEX "ContentFreshnessAgent_lastChecked_idx" ON "ContentFreshnessAgent"("lastChecked");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_status_idx" ON "SEORecoveryWorkflow"("status");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_triggerType_triggerSeverity_idx" ON "SEORecoveryWorkflow"("triggerType", "triggerSeverity");

-- CreateIndex
CREATE INDEX "SEORecoveryWorkflow_algorithmUpdateId_idx" ON "SEORecoveryWorkflow"("algorithmUpdateId");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_workflowId_stepOrder_idx" ON "SEORecoveryStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_status_idx" ON "SEORecoveryStep"("status");

-- CreateIndex
CREATE INDEX "SEORecoveryStep_stepType_idx" ON "SEORecoveryStep"("stepType");

-- CreateIndex
CREATE INDEX "SEODefenseMetrics_date_period_idx" ON "SEODefenseMetrics"("date", "period");

-- CreateIndex
CREATE INDEX "SEODefenseMetrics_defenseScore_idx" ON "SEODefenseMetrics"("defenseScore");

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

-- CreateIndex
CREATE INDEX "AutomationWorkflow_status_isActive_idx" ON "AutomationWorkflow"("status", "isActive");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_workflowType_idx" ON "AutomationWorkflow"("workflowType");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_trigger_idx" ON "AutomationWorkflow"("trigger");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_createdBy_idx" ON "AutomationWorkflow"("createdBy");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_lastRunAt_idx" ON "AutomationWorkflow"("lastRunAt");

-- CreateIndex
CREATE INDEX "AutomationWorkflow_nextRunAt_idx" ON "AutomationWorkflow"("nextRunAt");

-- CreateIndex
CREATE INDEX "AutomationExecution_workflowId_status_idx" ON "AutomationExecution"("workflowId", "status");

-- CreateIndex
CREATE INDEX "AutomationExecution_status_startedAt_idx" ON "AutomationExecution"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AutomationExecution_triggerType_idx" ON "AutomationExecution"("triggerType");

-- CreateIndex
CREATE INDEX "AutomationExecutionStep_executionId_stepOrder_idx" ON "AutomationExecutionStep"("executionId", "stepOrder");

-- CreateIndex
CREATE INDEX "AutomationExecutionStep_status_idx" ON "AutomationExecutionStep"("status");

-- CreateIndex
CREATE INDEX "AutomationAlert_workflowId_idx" ON "AutomationAlert"("workflowId");

-- CreateIndex
CREATE INDEX "AutomationAlert_alertType_idx" ON "AutomationAlert"("alertType");

-- CreateIndex
CREATE INDEX "AutomationAlert_isActive_idx" ON "AutomationAlert"("isActive");

-- CreateIndex
CREATE INDEX "ContentVersion_articleId_createdAt_idx" ON "ContentVersion"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentVersion_changedBy_idx" ON "ContentVersion"("changedBy");

-- CreateIndex
CREATE INDEX "ContentVersion_gitCommitHash_idx" ON "ContentVersion"("gitCommitHash");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_articleId_versionNumber_key" ON "ContentVersion"("articleId", "versionNumber");

-- CreateIndex
CREATE INDEX "APIOrchestration_orchestrationType_idx" ON "APIOrchestration"("orchestrationType");

-- CreateIndex
CREATE INDEX "APIOrchestration_isActive_idx" ON "APIOrchestration"("isActive");

-- CreateIndex
CREATE INDEX "APIOrchestration_createdBy_idx" ON "APIOrchestration"("createdBy");

-- CreateIndex
CREATE INDEX "IntegrationConnection_platform_idx" ON "IntegrationConnection"("platform");

-- CreateIndex
CREATE INDEX "IntegrationConnection_isActive_isVerified_idx" ON "IntegrationConnection"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "IntegrationConnection_createdBy_idx" ON "IntegrationConnection"("createdBy");

-- CreateIndex
CREATE INDEX "PerformanceAudit_auditType_auditPeriod_idx" ON "PerformanceAudit"("auditType", "auditPeriod");

-- CreateIndex
CREATE INDEX "PerformanceAudit_status_createdAt_idx" ON "PerformanceAudit"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAudit_startDate_endDate_idx" ON "PerformanceAudit"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "OptimizationCycle_cycleType_cyclePeriod_idx" ON "OptimizationCycle"("cycleType", "cyclePeriod");

-- CreateIndex
CREATE INDEX "OptimizationCycle_status_startDate_idx" ON "OptimizationCycle"("status", "startDate");

-- CreateIndex
CREATE INDEX "OptimizationCycle_auditId_idx" ON "OptimizationCycle"("auditId");

-- CreateIndex
CREATE INDEX "ABTest_status_startDate_idx" ON "ABTest"("status", "startDate");

-- CreateIndex
CREATE INDEX "ABTest_testType_idx" ON "ABTest"("testType");

-- CreateIndex
CREATE INDEX "ABTest_optimizationCycleId_idx" ON "ABTest"("optimizationCycleId");

-- CreateIndex
CREATE INDEX "ABTest_targetArticleId_idx" ON "ABTest"("targetArticleId");

-- CreateIndex
CREATE INDEX "ABTest_winner_idx" ON "ABTest"("winner");

-- CreateIndex
CREATE INDEX "AIModelTraining_modelName_status_idx" ON "AIModelTraining"("modelName", "status");

-- CreateIndex
CREATE INDEX "AIModelTraining_trainingType_idx" ON "AIModelTraining"("trainingType");

-- CreateIndex
CREATE INDEX "AIModelTraining_deploymentStatus_idx" ON "AIModelTraining"("deploymentStatus");

-- CreateIndex
CREATE INDEX "AIModelTraining_createdAt_idx" ON "AIModelTraining"("createdAt");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_userId_timestamp_idx" ON "UserBehaviorAnalytics"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_sessionId_idx" ON "UserBehaviorAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_analysisType_pageType_idx" ON "UserBehaviorAnalytics"("analysisType", "pageType");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_timestamp_idx" ON "UserBehaviorAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "UserBehaviorAnalytics_pageUrl_idx" ON "UserBehaviorAnalytics"("pageUrl");

-- CreateIndex
CREATE INDEX "OptimizationInsight_insightType_category_idx" ON "OptimizationInsight"("insightType", "category");

-- CreateIndex
CREATE INDEX "OptimizationInsight_status_priority_idx" ON "OptimizationInsight"("status", "priority");

-- CreateIndex
CREATE INDEX "OptimizationInsight_createdAt_idx" ON "OptimizationInsight"("createdAt");

-- CreateIndex
CREATE INDEX "OptimizationInsight_confidence_idx" ON "OptimizationInsight"("confidence");

-- CreateIndex
CREATE INDEX "LearningLoop_loopType_status_idx" ON "LearningLoop"("loopType", "status");

-- CreateIndex
CREATE INDEX "LearningLoop_nextRunAt_idx" ON "LearningLoop"("nextRunAt");

-- CreateIndex
CREATE INDEX "LearningLoop_status_idx" ON "LearningLoop"("status");

-- CreateIndex
CREATE INDEX "ContentChunk_articleId_chunkType_idx" ON "ContentChunk"("articleId", "chunkType");

-- CreateIndex
CREATE INDEX "ContentChunk_chunkType_idx" ON "ContentChunk"("chunkType");

-- CreateIndex
CREATE INDEX "ContentChunk_semanticScore_idx" ON "ContentChunk"("semanticScore");

-- CreateIndex
CREATE INDEX "ContentChunk_llmOptimized_idx" ON "ContentChunk"("llmOptimized");

-- CreateIndex
CREATE UNIQUE INDEX "ContentChunk_articleId_chunkIndex_key" ON "ContentChunk"("articleId", "chunkIndex");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_articleId_idx" ON "CanonicalAnswer"("articleId");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_answerType_idx" ON "CanonicalAnswer"("answerType");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_confidence_idx" ON "CanonicalAnswer"("confidence");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_isVerified_idx" ON "CanonicalAnswer"("isVerified");

-- CreateIndex
CREATE INDEX "CanonicalAnswer_usageCount_idx" ON "CanonicalAnswer"("usageCount");

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
CREATE INDEX "ContentFAQ_articleId_position_idx" ON "ContentFAQ"("articleId", "position");

-- CreateIndex
CREATE INDEX "ContentFAQ_questionType_idx" ON "ContentFAQ"("questionType");

-- CreateIndex
CREATE INDEX "ContentFAQ_relevanceScore_idx" ON "ContentFAQ"("relevanceScore");

-- CreateIndex
CREATE INDEX "ContentGlossary_articleId_position_idx" ON "ContentGlossary"("articleId", "position");

-- CreateIndex
CREATE INDEX "ContentGlossary_category_idx" ON "ContentGlossary"("category");

-- CreateIndex
CREATE INDEX "ContentGlossary_complexity_idx" ON "ContentGlossary"("complexity");

-- CreateIndex
CREATE INDEX "ContentGlossary_term_idx" ON "ContentGlossary"("term");

-- CreateIndex
CREATE UNIQUE INDEX "ContentGlossary_articleId_term_key" ON "ContentGlossary"("articleId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "StructuredContent_articleId_key" ON "StructuredContent"("articleId");

-- CreateIndex
CREATE INDEX "StructuredContent_status_idx" ON "StructuredContent"("status");

-- CreateIndex
CREATE INDEX "StructuredContent_overallQualityScore_idx" ON "StructuredContent"("overallQualityScore");

-- CreateIndex
CREATE INDEX "StructuredContent_lastProcessedAt_idx" ON "StructuredContent"("lastProcessedAt");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_articleId_metricType_idx" ON "RAOPerformanceMetric"("articleId", "metricType");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_metricType_timestamp_idx" ON "RAOPerformanceMetric"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_source_idx" ON "RAOPerformanceMetric"("source");

-- CreateIndex
CREATE INDEX "RAOPerformanceMetric_timestamp_idx" ON "RAOPerformanceMetric"("timestamp");

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentType_isActive_idx" ON "VectorEmbedding"("contentType", "isActive");

-- CreateIndex
CREATE INDEX "VectorEmbedding_contentId_idx" ON "VectorEmbedding"("contentId");

-- CreateIndex
CREATE INDEX "VectorEmbedding_embeddingModel_idx" ON "VectorEmbedding"("embeddingModel");

-- CreateIndex
CREATE INDEX "VectorEmbedding_isActive_createdAt_idx" ON "VectorEmbedding"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VectorEmbedding_contentId_contentType_embeddingModel_key" ON "VectorEmbedding"("contentId", "contentType", "embeddingModel");

-- CreateIndex
CREATE INDEX "RecognizedEntity_entityType_isActive_idx" ON "RecognizedEntity"("entityType", "isActive");

-- CreateIndex
CREATE INDEX "RecognizedEntity_normalizedName_idx" ON "RecognizedEntity"("normalizedName");

-- CreateIndex
CREATE INDEX "RecognizedEntity_mentionCount_idx" ON "RecognizedEntity"("mentionCount");

-- CreateIndex
CREATE INDEX "RecognizedEntity_isVerified_idx" ON "RecognizedEntity"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "RecognizedEntity_normalizedName_entityType_key" ON "RecognizedEntity"("normalizedName", "entityType");

-- CreateIndex
CREATE INDEX "EntityMention_entityId_contentType_idx" ON "EntityMention"("entityId", "contentType");

-- CreateIndex
CREATE INDEX "EntityMention_contentId_entityId_idx" ON "EntityMention"("contentId", "entityId");

-- CreateIndex
CREATE INDEX "EntityMention_createdAt_idx" ON "EntityMention"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VectorSearchIndex_indexName_key" ON "VectorSearchIndex"("indexName");

-- CreateIndex
CREATE INDEX "VectorSearchIndex_status_idx" ON "VectorSearchIndex"("status");

-- CreateIndex
CREATE INDEX "VectorSearchIndex_indexName_idx" ON "VectorSearchIndex"("indexName");

-- CreateIndex
CREATE INDEX "HybridSearchLog_searchType_createdAt_idx" ON "HybridSearchLog"("searchType", "createdAt");

-- CreateIndex
CREATE INDEX "HybridSearchLog_userId_createdAt_idx" ON "HybridSearchLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "HybridSearchLog_query_idx" ON "HybridSearchLog"("query");

-- CreateIndex
CREATE INDEX "HybridSearchLog_createdAt_idx" ON "HybridSearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_status_priority_createdAt_idx" ON "EmbeddingUpdateQueue"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_contentId_contentType_idx" ON "EmbeddingUpdateQueue"("contentId", "contentType");

-- CreateIndex
CREATE INDEX "EmbeddingUpdateQueue_status_idx" ON "EmbeddingUpdateQueue"("status");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_metricType_timestamp_idx" ON "VectorSearchMetrics"("metricType", "timestamp");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_searchType_idx" ON "VectorSearchMetrics"("searchType");

-- CreateIndex
CREATE INDEX "VectorSearchMetrics_timestamp_idx" ON "VectorSearchMetrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "APIKey_keyHash_key" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_keyHash_idx" ON "APIKey"("keyHash");

-- CreateIndex
CREATE INDEX "APIKey_userId_idx" ON "APIKey"("userId");

-- CreateIndex
CREATE INDEX "APIKey_isActive_tier_idx" ON "APIKey"("isActive", "tier");

-- CreateIndex
CREATE INDEX "APIUsage_apiKeyId_timestamp_idx" ON "APIUsage"("apiKeyId", "timestamp");

-- CreateIndex
CREATE INDEX "APIUsage_endpoint_timestamp_idx" ON "APIUsage"("endpoint", "timestamp");

-- CreateIndex
CREATE INDEX "APIUsage_timestamp_idx" ON "APIUsage"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBase_articleId_key" ON "KnowledgeBase"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_articleId_idx" ON "KnowledgeBase"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_qualityScore_idx" ON "KnowledgeBase"("qualityScore");

-- CreateIndex
CREATE INDEX "KnowledgeBase_citationCount_idx" ON "KnowledgeBase"("citationCount");

-- CreateIndex
CREATE UNIQUE INDEX "RAGFeed_endpoint_key" ON "RAGFeed"("endpoint");

-- CreateIndex
CREATE INDEX "RAGFeed_feedType_idx" ON "RAGFeed"("feedType");

-- CreateIndex
CREATE INDEX "RAGFeed_isActive_idx" ON "RAGFeed"("isActive");

-- CreateIndex
CREATE INDEX "RAGFeed_category_idx" ON "RAGFeed"("category");

-- CreateIndex
CREATE INDEX "AIManifest_isActive_idx" ON "AIManifest"("isActive");

-- CreateIndex
CREATE INDEX "CitationLog_knowledgeBaseId_timestamp_idx" ON "CitationLog"("knowledgeBaseId", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_sourceType_timestamp_idx" ON "CitationLog"("sourceType", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_sourceName_timestamp_idx" ON "CitationLog"("sourceName", "timestamp");

-- CreateIndex
CREATE INDEX "CitationLog_timestamp_idx" ON "CitationLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperEndpoint_path_key" ON "DeveloperEndpoint"("path");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_isActive_idx" ON "DeveloperEndpoint"("isActive");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_category_idx" ON "DeveloperEndpoint"("category");

-- CreateIndex
CREATE INDEX "DeveloperEndpoint_isPublic_idx" ON "DeveloperEndpoint"("isPublic");

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

-- CreateIndex
CREATE INDEX "SocialMediaAccount_platform_idx" ON "SocialMediaAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_isActive_idx" ON "SocialMediaAccount"("isActive");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_followerCount_idx" ON "SocialMediaAccount"("followerCount");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAccount_platform_accountHandle_key" ON "SocialMediaAccount"("platform", "accountHandle");

-- CreateIndex
CREATE INDEX "SocialMediaPost_accountId_idx" ON "SocialMediaPost"("accountId");

-- CreateIndex
CREATE INDEX "SocialMediaPost_status_idx" ON "SocialMediaPost"("status");

-- CreateIndex
CREATE INDEX "SocialMediaPost_publishedAt_idx" ON "SocialMediaPost"("publishedAt");

-- CreateIndex
CREATE INDEX "SocialMediaPost_performanceScore_idx" ON "SocialMediaPost"("performanceScore");

-- CreateIndex
CREATE INDEX "SocialMediaPost_platform_idx" ON "SocialMediaPost"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaSchedule_accountId_idx" ON "SocialMediaSchedule"("accountId");

-- CreateIndex
CREATE INDEX "SocialMediaSchedule_isActive_idx" ON "SocialMediaSchedule"("isActive");

-- CreateIndex
CREATE INDEX "SocialMediaSchedule_nextRunAt_idx" ON "SocialMediaSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "SocialEngagement_postId_idx" ON "SocialEngagement"("postId");

-- CreateIndex
CREATE INDEX "SocialEngagement_engagementType_idx" ON "SocialEngagement"("engagementType");

-- CreateIndex
CREATE INDEX "SocialEngagement_engagedAt_idx" ON "SocialEngagement"("engagedAt");

-- CreateIndex
CREATE INDEX "SocialEngagement_isInfluencer_idx" ON "SocialEngagement"("isInfluencer");

-- CreateIndex
CREATE INDEX "CommunityGroup_platform_idx" ON "CommunityGroup"("platform");

-- CreateIndex
CREATE INDEX "CommunityGroup_region_idx" ON "CommunityGroup"("region");

-- CreateIndex
CREATE INDEX "CommunityGroup_isActive_idx" ON "CommunityGroup"("isActive");

-- CreateIndex
CREATE INDEX "CommunityGroup_memberCount_idx" ON "CommunityGroup"("memberCount");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityGroup_platform_groupId_key" ON "CommunityGroup"("platform", "groupId");

-- CreateIndex
CREATE INDEX "CommunityActivity_groupId_idx" ON "CommunityActivity"("groupId");

-- CreateIndex
CREATE INDEX "CommunityActivity_activityType_idx" ON "CommunityActivity"("activityType");

-- CreateIndex
CREATE INDEX "CommunityActivity_activityAt_idx" ON "CommunityActivity"("activityAt");

-- CreateIndex
CREATE INDEX "CommunityActivity_isInfluential_idx" ON "CommunityActivity"("isInfluential");

-- CreateIndex
CREATE INDEX "CommunityInfluencer_platform_idx" ON "CommunityInfluencer"("platform");

-- CreateIndex
CREATE INDEX "CommunityInfluencer_influenceScore_idx" ON "CommunityInfluencer"("influenceScore");

-- CreateIndex
CREATE INDEX "CommunityInfluencer_isPartner_idx" ON "CommunityInfluencer"("isPartner");

-- CreateIndex
CREATE INDEX "CommunityInfluencer_region_idx" ON "CommunityInfluencer"("region");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityInfluencer_platform_username_key" ON "CommunityInfluencer"("platform", "username");

-- CreateIndex
CREATE INDEX "InfluencerCollaboration_influencerId_idx" ON "InfluencerCollaboration"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerCollaboration_status_idx" ON "InfluencerCollaboration"("status");

-- CreateIndex
CREATE INDEX "InfluencerCollaboration_collaborationType_idx" ON "InfluencerCollaboration"("collaborationType");

-- CreateIndex
CREATE INDEX "SocialMediaCampaign_status_idx" ON "SocialMediaCampaign"("status");

-- CreateIndex
CREATE INDEX "SocialMediaCampaign_startDate_idx" ON "SocialMediaCampaign"("startDate");

-- CreateIndex
CREATE INDEX "SocialMediaCampaign_performanceScore_idx" ON "SocialMediaCampaign"("performanceScore");

-- CreateIndex
CREATE INDEX "EngagementAutomation_platform_idx" ON "EngagementAutomation"("platform");

-- CreateIndex
CREATE INDEX "EngagementAutomation_isActive_idx" ON "EngagementAutomation"("isActive");

-- CreateIndex
CREATE INDEX "EngagementAutomation_automationType_idx" ON "EngagementAutomation"("automationType");

-- CreateIndex
CREATE INDEX "SocialMediaAnalytics_platform_idx" ON "SocialMediaAnalytics"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaAnalytics_metricDate_idx" ON "SocialMediaAnalytics"("metricDate");

-- CreateIndex
CREATE INDEX "SocialMediaAnalytics_engagementRate_idx" ON "SocialMediaAnalytics"("engagementRate");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAnalytics_platform_metricType_metricDate_key" ON "SocialMediaAnalytics"("platform", "metricType", "metricDate");

-- CreateIndex
CREATE INDEX "TechnicalSEOAudit_auditType_idx" ON "TechnicalSEOAudit"("auditType");

-- CreateIndex
CREATE INDEX "TechnicalSEOAudit_status_idx" ON "TechnicalSEOAudit"("status");

-- CreateIndex
CREATE INDEX "TechnicalSEOAudit_overallScore_idx" ON "TechnicalSEOAudit"("overallScore");

-- CreateIndex
CREATE INDEX "TechnicalSEOAudit_startedAt_idx" ON "TechnicalSEOAudit"("startedAt");

-- CreateIndex
CREATE INDEX "CoreWebVitals_url_idx" ON "CoreWebVitals"("url");

-- CreateIndex
CREATE INDEX "CoreWebVitals_pageType_idx" ON "CoreWebVitals"("pageType");

-- CreateIndex
CREATE INDEX "CoreWebVitals_performanceScore_idx" ON "CoreWebVitals"("performanceScore");

-- CreateIndex
CREATE INDEX "CoreWebVitals_measuredAt_idx" ON "CoreWebVitals"("measuredAt");

-- CreateIndex
CREATE INDEX "MobileSEO_url_idx" ON "MobileSEO"("url");

-- CreateIndex
CREATE INDEX "MobileSEO_isMobileFriendly_idx" ON "MobileSEO"("isMobileFriendly");

-- CreateIndex
CREATE INDEX "MobileSEO_mobileScore_idx" ON "MobileSEO"("mobileScore");

-- CreateIndex
CREATE INDEX "MobileSEO_auditedAt_idx" ON "MobileSEO"("auditedAt");

-- CreateIndex
CREATE INDEX "CrawlabilityAudit_crawlEfficiency_idx" ON "CrawlabilityAudit"("crawlEfficiency");

-- CreateIndex
CREATE INDEX "CrawlabilityAudit_auditedAt_idx" ON "CrawlabilityAudit"("auditedAt");

-- CreateIndex
CREATE INDEX "IndexabilityCheck_url_idx" ON "IndexabilityCheck"("url");

-- CreateIndex
CREATE INDEX "IndexabilityCheck_isIndexable_idx" ON "IndexabilityCheck"("isIndexable");

-- CreateIndex
CREATE INDEX "IndexabilityCheck_isIndexed_idx" ON "IndexabilityCheck"("isIndexed");

-- CreateIndex
CREATE INDEX "IndexabilityCheck_checkedAt_idx" ON "IndexabilityCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "SecurityAudit_securityScore_idx" ON "SecurityAudit"("securityScore");

-- CreateIndex
CREATE INDEX "SecurityAudit_hasHTTPS_idx" ON "SecurityAudit"("hasHTTPS");

-- CreateIndex
CREATE INDEX "SecurityAudit_auditedAt_idx" ON "SecurityAudit"("auditedAt");

-- CreateIndex
CREATE INDEX "SEOPerformanceMetrics_seoHealthScore_idx" ON "SEOPerformanceMetrics"("seoHealthScore");

-- CreateIndex
CREATE INDEX "SEOPerformanceMetrics_metricDate_idx" ON "SEOPerformanceMetrics"("metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "SEOPerformanceMetrics_metricDate_key" ON "SEOPerformanceMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "GoogleMyBusiness_country_city_idx" ON "GoogleMyBusiness"("country", "city");

-- CreateIndex
CREATE INDEX "GoogleMyBusiness_completionScore_idx" ON "GoogleMyBusiness"("completionScore");

-- CreateIndex
CREATE INDEX "GoogleMyBusiness_localSearchRanking_idx" ON "GoogleMyBusiness"("localSearchRanking");

-- CreateIndex
CREATE INDEX "GoogleMyBusiness_isVerified_idx" ON "GoogleMyBusiness"("isVerified");

-- CreateIndex
CREATE INDEX "LocalKeyword_gmbId_idx" ON "LocalKeyword"("gmbId");

-- CreateIndex
CREATE INDEX "LocalKeyword_targetCity_targetCountry_idx" ON "LocalKeyword"("targetCity", "targetCountry");

-- CreateIndex
CREATE INDEX "LocalKeyword_currentRanking_idx" ON "LocalKeyword"("currentRanking");

-- CreateIndex
CREATE INDEX "LocalKeyword_keywordType_idx" ON "LocalKeyword"("keywordType");

-- CreateIndex
CREATE INDEX "LocalCitation_gmbId_idx" ON "LocalCitation"("gmbId");

-- CreateIndex
CREATE INDEX "LocalCitation_citationStatus_idx" ON "LocalCitation"("citationStatus");

-- CreateIndex
CREATE INDEX "LocalCitation_directoryType_idx" ON "LocalCitation"("directoryType");

-- CreateIndex
CREATE INDEX "LocalCitation_domainAuthority_idx" ON "LocalCitation"("domainAuthority");

-- CreateIndex
CREATE INDEX "LocalReview_gmbId_idx" ON "LocalReview"("gmbId");

-- CreateIndex
CREATE INDEX "LocalReview_rating_idx" ON "LocalReview"("rating");

-- CreateIndex
CREATE INDEX "LocalReview_platform_idx" ON "LocalReview"("platform");

-- CreateIndex
CREATE INDEX "LocalReview_sentiment_idx" ON "LocalReview"("sentiment");

-- CreateIndex
CREATE INDEX "LocalReview_reviewDate_idx" ON "LocalReview"("reviewDate");

-- CreateIndex
CREATE UNIQUE INDEX "LocalContent_slug_key" ON "LocalContent"("slug");

-- CreateIndex
CREATE INDEX "LocalContent_targetCity_targetCountry_idx" ON "LocalContent"("targetCity", "targetCountry");

-- CreateIndex
CREATE INDEX "LocalContent_contentType_idx" ON "LocalContent"("contentType");

-- CreateIndex
CREATE INDEX "LocalContent_localSearchRanking_idx" ON "LocalContent"("localSearchRanking");

-- CreateIndex
CREATE INDEX "LocalContent_publishedAt_idx" ON "LocalContent"("publishedAt");

-- CreateIndex
CREATE INDEX "LocalSEOMetrics_metricDate_idx" ON "LocalSEOMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "LocalSEOMetrics_localSEOScore_idx" ON "LocalSEOMetrics"("localSEOScore");

-- CreateIndex
CREATE UNIQUE INDEX "LocalSEOMetrics_metricDate_key" ON "LocalSEOMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "OptimizedImage_status_idx" ON "OptimizedImage"("status");

-- CreateIndex
CREATE INDEX "OptimizedImage_batchId_idx" ON "OptimizedImage"("batchId");

-- CreateIndex
CREATE INDEX "OptimizedImage_originalPath_idx" ON "OptimizedImage"("originalPath");

-- CreateIndex
CREATE INDEX "OptimizedImage_createdAt_idx" ON "OptimizedImage"("createdAt");

-- CreateIndex
CREATE INDEX "ImageBatch_status_idx" ON "ImageBatch"("status");

-- CreateIndex
CREATE INDEX "ImageBatch_createdAt_idx" ON "ImageBatch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImageFormat_format_key" ON "ImageFormat"("format");

-- CreateIndex
CREATE INDEX "ImageFormat_format_idx" ON "ImageFormat"("format");

-- CreateIndex
CREATE INDEX "ImageWatermark_isActive_idx" ON "ImageWatermark"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ImageOptimizationMetrics_metricDate_key" ON "ImageOptimizationMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "ImageOptimizationMetrics_metricDate_idx" ON "ImageOptimizationMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "SecurityAlert_severity_createdAt_idx" ON "SecurityAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_category_createdAt_idx" ON "SecurityAlert"("category", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_isDismissed_isRead_idx" ON "SecurityAlert"("isDismissed", "isRead");

-- CreateIndex
CREATE INDEX "SecurityAlert_showOnHomepage_idx" ON "SecurityAlert"("showOnHomepage");

-- CreateIndex
CREATE INDEX "SecurityAlert_detectedAt_idx" ON "SecurityAlert"("detectedAt");

-- CreateIndex
CREATE INDEX "ThreatLog_threatType_detectedAt_idx" ON "ThreatLog"("threatType", "detectedAt");

-- CreateIndex
CREATE INDEX "ThreatLog_threatSource_idx" ON "ThreatLog"("threatSource");

-- CreateIndex
CREATE INDEX "ThreatLog_wasBlocked_idx" ON "ThreatLog"("wasBlocked");

-- CreateIndex
CREATE INDEX "ThreatLog_detectedAt_idx" ON "ThreatLog"("detectedAt");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_category_priority_idx" ON "SecurityRecommendation"("category", "priority");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_status_createdAt_idx" ON "SecurityRecommendation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SecurityRecommendation_priority_status_idx" ON "SecurityRecommendation"("priority", "status");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_complianceType_effectiveDate_idx" ON "ComplianceUpdate"("complianceType", "effectiveDate");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_status_deadline_idx" ON "ComplianceUpdate"("status", "deadline");

-- CreateIndex
CREATE INDEX "ComplianceUpdate_effectiveDate_idx" ON "ComplianceUpdate"("effectiveDate");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_incidentType_detectedAt_idx" ON "SEOSecurityIncident"("incidentType", "detectedAt");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_severity_status_idx" ON "SEOSecurityIncident"("severity", "status");

-- CreateIndex
CREATE INDEX "SEOSecurityIncident_status_detectedAt_idx" ON "SEOSecurityIncident"("status", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityAlertMetrics_metricDate_key" ON "SecurityAlertMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "SecurityAlertMetrics_metricDate_idx" ON "SecurityAlertMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_ruleType_isActive_idx" ON "ComplianceMonitorRule"("ruleType", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_priority_isActive_idx" ON "ComplianceMonitorRule"("priority", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorRule_category_isActive_idx" ON "ComplianceMonitorRule"("category", "isActive");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_ruleId_checkDate_idx" ON "ComplianceMonitorCheck"("ruleId", "checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_status_checkDate_idx" ON "ComplianceMonitorCheck"("status", "checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_checkDate_idx" ON "ComplianceMonitorCheck"("checkDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorCheck_nextCheckDate_idx" ON "ComplianceMonitorCheck"("nextCheckDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_guidelineType_isActive_idx" ON "SEOComplianceMonitorRule"("guidelineType", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_eeatComponent_isActive_idx" ON "SEOComplianceMonitorRule"("eeatComponent", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorRule_priority_isActive_idx" ON "SEOComplianceMonitorRule"("priority", "isActive");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_ruleId_checkDate_idx" ON "SEOComplianceMonitorCheck"("ruleId", "checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_status_checkDate_idx" ON "SEOComplianceMonitorCheck"("status", "checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_contentId_status_idx" ON "SEOComplianceMonitorCheck"("contentId", "status");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_checkDate_idx" ON "SEOComplianceMonitorCheck"("checkDate");

-- CreateIndex
CREATE INDEX "SEOComplianceMonitorCheck_nextCheckDate_idx" ON "SEOComplianceMonitorCheck"("nextCheckDate");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMonitorScore_scoreDate_key" ON "ComplianceMonitorScore"("scoreDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorScore_scoreDate_idx" ON "ComplianceMonitorScore"("scoreDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_type_createdAt_idx" ON "ComplianceMonitorNotification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_recipientUserId_isRead_idx" ON "ComplianceMonitorNotification"("recipientUserId", "isRead");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_priority_deliveryStatus_idx" ON "ComplianceMonitorNotification"("priority", "deliveryStatus");

-- CreateIndex
CREATE INDEX "ComplianceMonitorNotification_createdAt_idx" ON "ComplianceMonitorNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceMonitorMetrics_metricDate_key" ON "ComplianceMonitorMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "ComplianceMonitorMetrics_metricDate_idx" ON "ComplianceMonitorMetrics"("metricDate");

-- CreateIndex
CREATE INDEX "UserFeedback_userId_createdAt_idx" ON "UserFeedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserFeedback_articleId_idx" ON "UserFeedback"("articleId");

-- CreateIndex
CREATE INDEX "UserFeedback_feedbackType_createdAt_idx" ON "UserFeedback"("feedbackType", "createdAt");

-- CreateIndex
CREATE INDEX "UserFeedback_rating_idx" ON "UserFeedback"("rating");

-- CreateIndex
CREATE INDEX "UserFeedback_isResolved_idx" ON "UserFeedback"("isResolved");

-- CreateIndex
CREATE INDEX "UserFeedback_language_idx" ON "UserFeedback"("language");

-- CreateIndex
CREATE INDEX "ViolationReport_userId_createdAt_idx" ON "ViolationReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ViolationReport_violationType_severity_idx" ON "ViolationReport"("violationType", "severity");

-- CreateIndex
CREATE INDEX "ViolationReport_status_createdAt_idx" ON "ViolationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ViolationReport_contentType_contentId_idx" ON "ViolationReport"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ViolationReport_confidence_idx" ON "ViolationReport"("confidence");

-- CreateIndex
CREATE INDEX "ViolationReport_severity_createdAt_idx" ON "ViolationReport"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "UserPenalty_userId_isActive_idx" ON "UserPenalty"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserPenalty_penaltyType_isActive_idx" ON "UserPenalty"("penaltyType", "isActive");

-- CreateIndex
CREATE INDEX "UserPenalty_escalationLevel_idx" ON "UserPenalty"("escalationLevel");

-- CreateIndex
CREATE INDEX "UserPenalty_startDate_endDate_idx" ON "UserPenalty"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "UserPenalty_appealStatus_idx" ON "UserPenalty"("appealStatus");

-- CreateIndex
CREATE UNIQUE INDEX "UserReputation_userId_key" ON "UserReputation"("userId");

-- CreateIndex
CREATE INDEX "UserReputation_overallScore_idx" ON "UserReputation"("overallScore");

-- CreateIndex
CREATE INDEX "UserReputation_trustLevel_idx" ON "UserReputation"("trustLevel");

-- CreateIndex
CREATE INDEX "UserReputation_priorityTier_idx" ON "UserReputation"("priorityTier");

-- CreateIndex
CREATE INDEX "UserReputation_violationScore_idx" ON "UserReputation"("violationScore");

-- CreateIndex
CREATE INDEX "UserReputation_totalViolations_idx" ON "UserReputation"("totalViolations");

-- CreateIndex
CREATE INDEX "FalsePositive_originalViolationType_idx" ON "FalsePositive"("originalViolationType");

-- CreateIndex
CREATE INDEX "FalsePositive_originalModel_idx" ON "FalsePositive"("originalModel");

-- CreateIndex
CREATE INDEX "FalsePositive_processedForTraining_idx" ON "FalsePositive"("processedForTraining");

-- CreateIndex
CREATE INDEX "FalsePositive_createdAt_idx" ON "FalsePositive"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationSettings_updatedAt_idx" ON "ModerationSettings"("updatedAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_alertType_status_idx" ON "ModerationAlert"("alertType", "status");

-- CreateIndex
CREATE INDEX "ModerationAlert_severity_status_idx" ON "ModerationAlert"("severity", "status");

-- CreateIndex
CREATE INDEX "ModerationAlert_priority_createdAt_idx" ON "ModerationAlert"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_status_createdAt_idx" ON "ModerationAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAlert_userId_idx" ON "ModerationAlert"("userId");

-- CreateIndex
CREATE INDEX "ModerationAlert_violationReportId_idx" ON "ModerationAlert"("violationReportId");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_priority_createdAt_idx" ON "ModerationQueue"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationQueue_authorId_idx" ON "ModerationQueue"("authorId");

-- CreateIndex
CREATE INDEX "ModerationQueue_assignedTo_idx" ON "ModerationQueue"("assignedTo");

-- CreateIndex
CREATE INDEX "ModerationQueue_contentType_contentId_idx" ON "ModerationQueue"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "AdminAction_adminId_createdAt_idx" ON "AdminAction"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_actionType_createdAt_idx" ON "AdminAction"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_targetType_targetId_idx" ON "AdminAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ai_audit_log_operationType_createdAt_idx" ON "ai_audit_log"("operationType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_operationCategory_createdAt_idx" ON "ai_audit_log"("operationCategory", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_agentType_createdAt_idx" ON "ai_audit_log"("agentType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_userId_createdAt_idx" ON "ai_audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_status_createdAt_idx" ON "ai_audit_log"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_humanReviewed_createdAt_idx" ON "ai_audit_log"("humanReviewed", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_log_deletionScheduled_idx" ON "ai_audit_log"("deletionScheduled");

-- CreateIndex
CREATE INDEX "ai_audit_log_requestId_idx" ON "ai_audit_log"("requestId");

-- CreateIndex
CREATE INDEX "ai_audit_log_inputHash_idx" ON "ai_audit_log"("inputHash");

-- CreateIndex
CREATE INDEX "ai_audit_log_createdAt_idx" ON "ai_audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "ai_decision_log_auditLogId_idx" ON "ai_decision_log"("auditLogId");

-- CreateIndex
CREATE INDEX "ai_decision_log_decisionType_createdAt_idx" ON "ai_decision_log"("decisionType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_decision_log_requiresConsent_idx" ON "ai_decision_log"("requiresConsent");

-- CreateIndex
CREATE INDEX "ComplianceReport_reportType_createdAt_idx" ON "ComplianceReport"("reportType", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceReport_userId_createdAt_idx" ON "ComplianceReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceReport_requestedBy_createdAt_idx" ON "ComplianceReport"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceReport_status_createdAt_idx" ON "ComplianceReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ComplianceReport_expiresAt_idx" ON "ComplianceReport"("expiresAt");

-- CreateIndex
CREATE INDEX "UserConsent_userId_consentType_idx" ON "UserConsent"("userId", "consentType");

-- CreateIndex
CREATE INDEX "UserConsent_userId_consented_idx" ON "UserConsent"("userId", "consented");

-- CreateIndex
CREATE INDEX "UserConsent_consentType_consented_idx" ON "UserConsent"("consentType", "consented");

-- CreateIndex
CREATE INDEX "UserConsent_expiresAt_idx" ON "UserConsent"("expiresAt");

-- CreateIndex
CREATE INDEX "AICostTracking_agentId_timestamp_idx" ON "AICostTracking"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_agentType_timestamp_idx" ON "AICostTracking"("agentType", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_provider_timestamp_idx" ON "AICostTracking"("provider", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_userId_timestamp_idx" ON "AICostTracking"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_billingPeriod_agentType_idx" ON "AICostTracking"("billingPeriod", "agentType");

-- CreateIndex
CREATE INDEX "AICostTracking_billingPeriod_provider_idx" ON "AICostTracking"("billingPeriod", "provider");

-- CreateIndex
CREATE INDEX "AICostTracking_operationType_timestamp_idx" ON "AICostTracking"("operationType", "timestamp");

-- CreateIndex
CREATE INDEX "AICostTracking_timestamp_idx" ON "AICostTracking"("timestamp");

-- CreateIndex
CREATE INDEX "BudgetLimit_scope_scopeId_idx" ON "BudgetLimit"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "BudgetLimit_isActive_scope_idx" ON "BudgetLimit"("isActive", "scope");

-- CreateIndex
CREATE INDEX "BudgetLimit_isThrottled_idx" ON "BudgetLimit"("isThrottled");

-- CreateIndex
CREATE INDEX "BudgetAlert_budgetLimitId_createdAt_idx" ON "BudgetAlert"("budgetLimitId", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetAlert_alertType_createdAt_idx" ON "BudgetAlert"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "BudgetAlert_severity_acknowledged_idx" ON "BudgetAlert"("severity", "acknowledged");

-- CreateIndex
CREATE INDEX "BudgetAlert_notificationSent_idx" ON "BudgetAlert"("notificationSent");

-- CreateIndex
CREATE INDEX "BudgetAlert_createdAt_idx" ON "BudgetAlert"("createdAt");

-- CreateIndex
CREATE INDEX "CostReport_reportType_startDate_idx" ON "CostReport"("reportType", "startDate");

-- CreateIndex
CREATE INDEX "CostReport_billingPeriod_scope_idx" ON "CostReport"("billingPeriod", "scope");

-- CreateIndex
CREATE INDEX "CostReport_scope_scopeId_idx" ON "CostReport"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "CostReport_createdAt_idx" ON "CostReport"("createdAt");

-- CreateIndex
CREATE INDEX "CostReport_status_idx" ON "CostReport"("status");

-- CreateIndex
CREATE INDEX "DelegatedPermission_delegatedToUserId_isActive_idx" ON "DelegatedPermission"("delegatedToUserId", "isActive");

-- CreateIndex
CREATE INDEX "DelegatedPermission_permissionKey_idx" ON "DelegatedPermission"("permissionKey");

-- CreateIndex
CREATE INDEX "DelegatedPermission_delegatedByUserId_idx" ON "DelegatedPermission"("delegatedByUserId");

-- CreateIndex
CREATE INDEX "DelegatedPermission_isActive_expiresAt_idx" ON "DelegatedPermission"("isActive", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DelegatedPermission_delegatedToUserId_permissionKey_key" ON "DelegatedPermission"("delegatedToUserId", "permissionKey");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_userId_timestamp_idx" ON "PermissionUsageLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_permissionKey_timestamp_idx" ON "PermissionUsageLog"("permissionKey", "timestamp");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_resourceType_resourceId_idx" ON "PermissionUsageLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "PermissionUsageLog_success_idx" ON "PermissionUsageLog"("success");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_walletAddress_key" ON "Wallet"("walletAddress");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_walletType_idx" ON "Wallet"("walletType");

-- CreateIndex
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");

-- CreateIndex
CREATE INDEX "Wallet_walletAddress_idx" ON "Wallet"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_transactionHash_key" ON "WalletTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionHash_idx" ON "WalletTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "WalletTransaction_fromWalletId_status_idx" ON "WalletTransaction"("fromWalletId", "status");

-- CreateIndex
CREATE INDEX "WalletTransaction_toWalletId_status_idx" ON "WalletTransaction"("toWalletId", "status");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_createdAt_idx" ON "WalletTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_transactionType_createdAt_idx" ON "WalletTransaction"("transactionType", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_operationType_idx" ON "WalletTransaction"("operationType");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_paymentGatewayTxId_idx" ON "WalletTransaction"("paymentGatewayTxId");

-- CreateIndex
CREATE INDEX "WalletTransaction_blockchainTxHash_idx" ON "WalletTransaction"("blockchainTxHash");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_operationType_timestamp_idx" ON "FinanceOperationLog"("operationType", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_userId_timestamp_idx" ON "FinanceOperationLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_performedBy_timestamp_idx" ON "FinanceOperationLog"("performedBy", "timestamp");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_status_idx" ON "FinanceOperationLog"("status");

-- CreateIndex
CREATE INDEX "FinanceOperationLog_transactionId_idx" ON "FinanceOperationLog"("transactionId");

-- CreateIndex
CREATE INDEX "StakingRecord_walletId_status_idx" ON "StakingRecord"("walletId", "status");

-- CreateIndex
CREATE INDEX "StakingRecord_userId_status_idx" ON "StakingRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "StakingRecord_unlockAt_idx" ON "StakingRecord"("unlockAt");

-- CreateIndex
CREATE INDEX "StakingRecord_status_idx" ON "StakingRecord"("status");

-- CreateIndex
CREATE INDEX "ConversionRecord_userId_convertedAt_idx" ON "ConversionRecord"("userId", "convertedAt");

-- CreateIndex
CREATE INDEX "ConversionRecord_walletId_idx" ON "ConversionRecord"("walletId");

-- CreateIndex
CREATE INDEX "ConversionRecord_fromCurrency_toCurrency_idx" ON "ConversionRecord"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "AirdropCampaign_status_idx" ON "AirdropCampaign"("status");

-- CreateIndex
CREATE INDEX "AirdropCampaign_claimStartDate_claimEndDate_idx" ON "AirdropCampaign"("claimStartDate", "claimEndDate");

-- CreateIndex
CREATE INDEX "AirdropCampaign_distributionDate_idx" ON "AirdropCampaign"("distributionDate");

-- CreateIndex
CREATE INDEX "AirdropClaim_userId_status_idx" ON "AirdropClaim"("userId", "status");

-- CreateIndex
CREATE INDEX "AirdropClaim_campaignId_status_idx" ON "AirdropClaim"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AirdropClaim_campaignId_userId_key" ON "AirdropClaim"("campaignId", "userId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_buyerId_idx" ON "EscrowTransaction"("buyerId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_sellerId_idx" ON "EscrowTransaction"("sellerId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_status_idx" ON "EscrowTransaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPaymentRecord_invoiceNumber_key" ON "SubscriptionPaymentRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_userId_paidAt_idx" ON "SubscriptionPaymentRecord"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_subscriptionId_idx" ON "SubscriptionPaymentRecord"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_status_idx" ON "SubscriptionPaymentRecord"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPaymentRecord_invoiceNumber_idx" ON "SubscriptionPaymentRecord"("invoiceNumber");

-- CreateIndex
CREATE INDEX "RefundRecord_userId_status_idx" ON "RefundRecord"("userId", "status");

-- CreateIndex
CREATE INDEX "RefundRecord_originalTxId_idx" ON "RefundRecord"("originalTxId");

-- CreateIndex
CREATE INDEX "RefundRecord_status_idx" ON "RefundRecord"("status");

-- CreateIndex
CREATE INDEX "PlatformSettings_lastRateUpdate_idx" ON "PlatformSettings"("lastRateUpdate");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_id_key" ON "PlatformSettings"("id");

-- CreateIndex
CREATE INDEX "CurrencyRateHistory_currency_effectiveFrom_idx" ON "CurrencyRateHistory"("currency", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CurrencyRateHistory_createdAt_idx" ON "CurrencyRateHistory"("createdAt");

-- CreateIndex
CREATE INDEX "OTP_userId_purpose_verified_idx" ON "OTP"("userId", "purpose", "verified");

-- CreateIndex
CREATE INDEX "OTP_expiresAt_idx" ON "OTP"("expiresAt");

-- CreateIndex
CREATE INDEX "OTP_createdAt_idx" ON "OTP"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeWalletAuthSession_sessionId_key" ON "WeWalletAuthSession"("sessionId");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_sessionId_idx" ON "WeWalletAuthSession"("sessionId");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_initiatedBy_status_idx" ON "WeWalletAuthSession"("initiatedBy", "status");

-- CreateIndex
CREATE INDEX "WeWalletAuthSession_status_expiresAt_idx" ON "WeWalletAuthSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "WalletWhitelist_walletId_isActive_idx" ON "WalletWhitelist"("walletId", "isActive");

-- CreateIndex
CREATE INDEX "WalletWhitelist_address_addressType_idx" ON "WalletWhitelist"("address", "addressType");

-- CreateIndex
CREATE INDEX "WalletWhitelist_isVerified_idx" ON "WalletWhitelist"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "WalletWhitelist_walletId_address_addressType_key" ON "WalletWhitelist"("walletId", "address", "addressType");

-- CreateIndex
CREATE INDEX "SecurityLog_userId_timestamp_idx" ON "SecurityLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_action_timestamp_idx" ON "SecurityLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityLog_timestamp_idx" ON "SecurityLog"("timestamp");

-- CreateIndex
CREATE INDEX "fraud_alerts_walletId_createdAt_idx" ON "fraud_alerts"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_userId_createdAt_idx" ON "fraud_alerts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_severity_resolved_idx" ON "fraud_alerts"("severity", "resolved");

-- CreateIndex
CREATE INDEX "fraud_alerts_alertType_createdAt_idx" ON "fraud_alerts"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_fraudScore_idx" ON "fraud_alerts"("fraudScore");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_transactionId_key" ON "withdrawal_requests"("transactionId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_walletId_status_idx" ON "withdrawal_requests"("walletId", "status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_userId_status_idx" ON "withdrawal_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_requestedAt_idx" ON "withdrawal_requests"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "withdrawal_requests_reviewedBy_reviewedAt_idx" ON "withdrawal_requests"("reviewedBy", "reviewedAt");

-- CreateIndex
CREATE INDEX "whitelist_changes_userId_changeYear_idx" ON "whitelist_changes"("userId", "changeYear");

-- CreateIndex
CREATE INDEX "whitelist_changes_walletId_operation_idx" ON "whitelist_changes"("walletId", "operation");

-- CreateIndex
CREATE INDEX "whitelist_changes_operation_createdAt_idx" ON "whitelist_changes"("operation", "createdAt");

-- AddForeignKey
ALTER TABLE "AITask" ADD CONSTRAINT "AITask_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITask" ADD CONSTRAINT "AITask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_translatorId_fkey" FOREIGN KEY ("translatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleImage" ADD CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentWorkflow" ADD CONSTRAINT "ContentWorkflow_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentWorkflow" ADD CONSTRAINT "ContentWorkflow_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPipeline" ADD CONSTRAINT "ContentPipeline_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAnalysis" ADD CONSTRAINT "FraudAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketData" ADD CONSTRAINT "MarketData_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileMoneyTransaction" ADD CONSTRAINT "MobileMoneyTransaction_complianceCheckId_fkey" FOREIGN KEY ("complianceCheckId") REFERENCES "ComplianceCheck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileMoneyTransaction" ADD CONSTRAINT "MobileMoneyTransaction_fraudAnalysisId_fkey" FOREIGN KEY ("fraudAnalysisId") REFERENCES "FraudAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileMoneyTransaction" ADD CONSTRAINT "MobileMoneyTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileMoneyTransaction" ADD CONSTRAINT "MobileMoneyTransaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileMoneyTransaction" ADD CONSTRAINT "MobileMoneyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MobileMoneyProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEngagement" ADD CONSTRAINT "UserEngagement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotification" ADD CONSTRAINT "WorkflowNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowNotification" ADD CONSTRAINT "WorkflowNotification_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ContentWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarqueeStyle" ADD CONSTRAINT "MarqueeStyle_marqueeId_fkey" FOREIGN KEY ("marqueeId") REFERENCES "Marquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarqueeItem" ADD CONSTRAINT "MarqueeItem_marqueeId_fkey" FOREIGN KEY ("marqueeId") REFERENCES "Marquee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEORanking" ADD CONSTRAINT "SEORanking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "SEOKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOIssue" ADD CONSTRAINT "SEOIssue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SEOPageAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOCompetitorAnalysis" ADD CONSTRAINT "SEOCompetitorAnalysis_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "SEOCompetitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedArticle" ADD CONSTRAINT "AutomatedArticle_feedSourceId_fkey" FOREIGN KEY ("feedSourceId") REFERENCES "ContentFeedSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedArticle" ADD CONSTRAINT "AutomatedArticle_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomatedArticle" ADD CONSTRAINT "AutomatedArticle_publishedArticleId_fkey" FOREIGN KEY ("publishedArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDistribution" ADD CONSTRAINT "ContentDistribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DistributionCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ReferralProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyndicationRequest" ADD CONSTRAINT "SyndicationRequest_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerSyndication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSend" ADD CONSTRAINT "NewsletterSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "NewsletterCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalSEOConfig" ADD CONSTRAINT "RegionalSEOConfig_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration"("countryCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AfricanInfluencer" ADD CONSTRAINT "AfricanInfluencer_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration"("countryCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerPost" ADD CONSTRAINT "InfluencerPost_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "AfricanInfluencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalMarketData" ADD CONSTRAINT "RegionalMarketData_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "RegionConfiguration"("countryCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetRequest" ADD CONSTRAINT "WidgetRequest_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "MediaSyndicationWidget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexHistoricalData" ADD CONSTRAINT "IndexHistoricalData_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "AfricanCryptoIndex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlgorithmResponse" ADD CONSTRAINT "AlgorithmResponse_algorithmUpdateId_fkey" FOREIGN KEY ("algorithmUpdateId") REFERENCES "AlgorithmUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEORecoveryWorkflow" ADD CONSTRAINT "SEORecoveryWorkflow_algorithmUpdateId_fkey" FOREIGN KEY ("algorithmUpdateId") REFERENCES "AlgorithmUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEORecoveryStep" ADD CONSTRAINT "SEORecoveryStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "SEORecoveryWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionStep" ADD CONSTRAINT "AutomationExecutionStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationAlert" ADD CONSTRAINT "AutomationAlert_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationCycle" ADD CONSTRAINT "OptimizationCycle_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "PerformanceAudit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_optimizationCycleId_fkey" FOREIGN KEY ("optimizationCycleId") REFERENCES "OptimizationCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCitation" ADD CONSTRAINT "SourceCitation_canonicalAnswerId_fkey" FOREIGN KEY ("canonicalAnswerId") REFERENCES "CanonicalAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "RecognizedEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIKey" ADD CONSTRAINT "APIKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIUsage" ADD CONSTRAINT "APIUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationLog" ADD CONSTRAINT "CitationLog_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationLog" ADD CONSTRAINT "CitationLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "APIKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyKeyword" ADD CONSTRAINT "StrategyKeyword_topicClusterId_fkey" FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCalendarItem" ADD CONSTRAINT "ContentCalendarItem_primaryKeywordId_fkey" FOREIGN KEY ("primaryKeywordId") REFERENCES "StrategyKeyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCalendarItem" ADD CONSTRAINT "ContentCalendarItem_topicClusterId_fkey" FOREIGN KEY ("topicClusterId") REFERENCES "TopicCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlink" ADD CONSTRAINT "Backlink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkProspect" ADD CONSTRAINT "LinkProspect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachActivity" ADD CONSTRAINT "OutreachActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "LinkProspect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachActivity" ADD CONSTRAINT "OutreachActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "LinkBuildingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaPost" ADD CONSTRAINT "SocialMediaPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaSchedule" ADD CONSTRAINT "SocialMediaSchedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialEngagement" ADD CONSTRAINT "SocialEngagement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialMediaPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityActivity" ADD CONSTRAINT "CommunityActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityInfluencer" ADD CONSTRAINT "CommunityInfluencer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCollaboration" ADD CONSTRAINT "InfluencerCollaboration_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "CommunityInfluencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalKeyword" ADD CONSTRAINT "LocalKeyword_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalCitation" ADD CONSTRAINT "LocalCitation_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalReview" ADD CONSTRAINT "LocalReview_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedImage" ADD CONSTRAINT "OptimizedImage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImageBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceMonitorCheck" ADD CONSTRAINT "ComplianceMonitorCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceMonitorRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOComplianceMonitorCheck" ADD CONSTRAINT "SEOComplianceMonitorCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SEOComplianceMonitorRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeedback" ADD CONSTRAINT "UserFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeedback" ADD CONSTRAINT "UserFeedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationReport" ADD CONSTRAINT "ViolationReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPenalty" ADD CONSTRAINT "UserPenalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPenalty" ADD CONSTRAINT "UserPenalty_violationReportId_fkey" FOREIGN KEY ("violationReportId") REFERENCES "ViolationReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPenalty" ADD CONSTRAINT "UserPenalty_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReputation" ADD CONSTRAINT "UserReputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FalsePositive" ADD CONSTRAINT "FalsePositive_violationReportId_fkey" FOREIGN KEY ("violationReportId") REFERENCES "ViolationReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FalsePositive" ADD CONSTRAINT "FalsePositive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_decision_log" ADD CONSTRAINT "ai_decision_log_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "ai_audit_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceReport" ADD CONSTRAINT "ComplianceReport_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_budgetLimitId_fkey" FOREIGN KEY ("budgetLimitId") REFERENCES "BudgetLimit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegatedPermission" ADD CONSTRAINT "DelegatedPermission_delegatedToUserId_fkey" FOREIGN KEY ("delegatedToUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegatedPermission" ADD CONSTRAINT "DelegatedPermission_delegatedByUserId_fkey" FOREIGN KEY ("delegatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirdropClaim" ADD CONSTRAINT "AirdropClaim_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AirdropCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletWhitelist" ADD CONSTRAINT "WalletWhitelist_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whitelist_changes" ADD CONSTRAINT "whitelist_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whitelist_changes" ADD CONSTRAINT "whitelist_changes_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

