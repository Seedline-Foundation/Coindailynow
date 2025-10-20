-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "accountHandle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "reachMetrics" TEXT,
    "audienceData" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocialMediaPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "contentId" TEXT,
    "postType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "platformPostId" TEXT,
    "postUrl" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "reachCount" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" REAL NOT NULL DEFAULT 0,
    "sentimentScore" REAL,
    "viralityScore" REAL,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialMediaPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialMediaSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" TEXT NOT NULL,
    "scheduleData" TEXT NOT NULL,
    "contentTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" DATETIME,
    "lastRunAt" DATETIME,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialMediaSchedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialMediaAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialEngagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "engagementType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUserId" TEXT,
    "platformUsername" TEXT,
    "content" TEXT,
    "sentimentScore" REAL,
    "isInfluencer" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER,
    "engagedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocialEngagement_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialMediaPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "influenceScore" REAL NOT NULL DEFAULT 0,
    "communityHealth" TEXT,
    "moderatorStatus" TEXT NOT NULL DEFAULT 'NONE',
    "accessToken" TEXT,
    "lastActivityAt" DATETIME,
    "joinedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CommunityActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "content" TEXT,
    "sentiment" REAL,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "isInfluential" BOOLEAN NOT NULL DEFAULT false,
    "topicTags" TEXT,
    "mentionedCoins" TEXT,
    "activityAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunityInfluencer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "influenceScore" REAL NOT NULL DEFAULT 0,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "niche" TEXT,
    "region" TEXT,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "partnershipStatus" TEXT NOT NULL DEFAULT 'NONE',
    "contentCoCreated" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunityInfluencer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CommunityGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InfluencerCollaboration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "influencerId" TEXT NOT NULL,
    "contentId" TEXT,
    "collaborationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "proposalDetails" TEXT,
    "deliverables" TEXT,
    "reachGenerated" INTEGER NOT NULL DEFAULT 0,
    "engagementGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "roi" REAL,
    "performanceScore" REAL,
    "proposedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InfluencerCollaboration_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "CommunityInfluencer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialMediaCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT NOT NULL,
    "platforms" TEXT NOT NULL,
    "targetAudience" TEXT,
    "contentThemes" TEXT,
    "hashtags" TEXT,
    "budget" REAL,
    "spentAmount" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "followerGoal" INTEGER,
    "engagementGoal" REAL,
    "reachGoal" INTEGER,
    "conversionGoal" INTEGER,
    "followersGained" INTEGER NOT NULL DEFAULT 0,
    "totalEngagements" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "avgEngagementRate" REAL NOT NULL DEFAULT 0,
    "performanceScore" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EngagementAutomation" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "successRate" REAL NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocialMediaAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "metricDate" DATETIME NOT NULL,
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
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "avgEngagementPerPost" REAL NOT NULL DEFAULT 0,
    "topPerformingPosts" TEXT,
    "worstPerformingPosts" TEXT,
    "bestPostingTimes" TEXT,
    "audienceInsights" TEXT,
    "industryAvgEngagement" REAL,
    "competitorComparison" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TechnicalSEOAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "overallScore" REAL NOT NULL DEFAULT 0,
    "speedScore" REAL NOT NULL DEFAULT 0,
    "mobileScore" REAL NOT NULL DEFAULT 0,
    "crawlabilityScore" REAL NOT NULL DEFAULT 0,
    "securityScore" REAL NOT NULL DEFAULT 0,
    "indexabilityScore" REAL NOT NULL DEFAULT 0,
    "lcpScore" REAL,
    "fidScore" REAL,
    "clsScore" REAL,
    "fcpScore" REAL,
    "ttfbScore" REAL,
    "tbtScore" REAL,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "warningIssues" INTEGER NOT NULL DEFAULT 0,
    "infoIssues" INTEGER NOT NULL DEFAULT 0,
    "issuesDetails" TEXT,
    "recommendations" TEXT,
    "estimatedImpact" TEXT,
    "auditDuration" INTEGER,
    "pagesAudited" INTEGER NOT NULL DEFAULT 0,
    "errorsEncountered" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "nextAuditScheduled" DATETIME
);

-- CreateTable
CREATE TABLE "CoreWebVitals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "lcp" REAL NOT NULL,
    "fid" REAL NOT NULL,
    "cls" REAL NOT NULL,
    "fcp" REAL NOT NULL,
    "ttfb" REAL NOT NULL,
    "tbt" REAL NOT NULL,
    "performanceScore" REAL NOT NULL DEFAULT 0,
    "lcpRating" TEXT NOT NULL,
    "fidRating" TEXT NOT NULL,
    "clsRating" TEXT NOT NULL,
    "domContentLoaded" REAL,
    "windowLoad" REAL,
    "totalPageSize" REAL,
    "totalRequests" INTEGER,
    "javascriptSize" REAL,
    "cssSize" REAL,
    "imageSize" REAL,
    "fontSize" REAL,
    "deviceType" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "measuredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MobileSEO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "isMobileFriendly" BOOLEAN NOT NULL DEFAULT false,
    "mobileScore" REAL NOT NULL DEFAULT 0,
    "hasViewportMeta" BOOLEAN NOT NULL DEFAULT false,
    "viewportContent" TEXT,
    "touchTargetsProper" BOOLEAN NOT NULL DEFAULT false,
    "minTouchTargetSize" INTEGER,
    "touchElementsCount" INTEGER NOT NULL DEFAULT 0,
    "contentFitsViewport" BOOLEAN NOT NULL DEFAULT false,
    "textSizeAppropriate" BOOLEAN NOT NULL DEFAULT false,
    "mobileLCP" REAL,
    "mobileFID" REAL,
    "mobileCLS" REAL,
    "flashUsed" BOOLEAN NOT NULL DEFAULT false,
    "incompatiblePlugins" TEXT,
    "hasMediaQueries" BOOLEAN NOT NULL DEFAULT false,
    "breakpoints" TEXT,
    "mobileIndexable" BOOLEAN NOT NULL DEFAULT true,
    "mobileErrors" TEXT,
    "auditedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CrawlabilityAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "crawlRate" REAL,
    "crawlEfficiency" REAL NOT NULL DEFAULT 0,
    "pages200" INTEGER NOT NULL DEFAULT 0,
    "pages301" INTEGER NOT NULL DEFAULT 0,
    "pages302" INTEGER NOT NULL DEFAULT 0,
    "pages404" INTEGER NOT NULL DEFAULT 0,
    "pages500" INTEGER NOT NULL DEFAULT 0,
    "orphanedPages" TEXT,
    "deepPages" TEXT,
    "duplicateContent" TEXT,
    "auditedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IndexabilityCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "contentQuality" REAL NOT NULL DEFAULT 0,
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "h1Count" INTEGER NOT NULL DEFAULT 0,
    "hasMetaDescription" BOOLEAN NOT NULL DEFAULT false,
    "metaDescLength" INTEGER,
    "hasTitleTag" BOOLEAN NOT NULL DEFAULT false,
    "titleLength" INTEGER,
    "blockingFactors" TEXT,
    "xRobotsTag" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SecurityAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hasHTTPS" BOOLEAN NOT NULL DEFAULT false,
    "httpRedirectsHTTPS" BOOLEAN NOT NULL DEFAULT false,
    "sslCertValid" BOOLEAN NOT NULL DEFAULT false,
    "sslProvider" TEXT,
    "sslExpiresAt" DATETIME,
    "hasHSTS" BOOLEAN NOT NULL DEFAULT false,
    "hstsMaxAge" INTEGER,
    "hasCSP" BOOLEAN NOT NULL DEFAULT false,
    "cspDirectives" TEXT,
    "hasXFrameOptions" BOOLEAN NOT NULL DEFAULT false,
    "xFrameOptions" TEXT,
    "hasXContentType" BOOLEAN NOT NULL DEFAULT false,
    "hasXXSSProtection" BOOLEAN NOT NULL DEFAULT false,
    "securityScore" REAL NOT NULL DEFAULT 0,
    "hasMixedContent" BOOLEAN NOT NULL DEFAULT false,
    "mixedContentUrls" TEXT,
    "knownVulnerabilities" TEXT,
    "securityRisks" TEXT,
    "malwareDetected" BOOLEAN NOT NULL DEFAULT false,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistSources" TEXT,
    "auditedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SEOPerformanceMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL,
    "seoHealthScore" REAL NOT NULL DEFAULT 0,
    "speedScore" REAL NOT NULL DEFAULT 0,
    "mobileScore" REAL NOT NULL DEFAULT 0,
    "crawlabilityScore" REAL NOT NULL DEFAULT 0,
    "securityScore" REAL NOT NULL DEFAULT 0,
    "indexabilityScore" REAL NOT NULL DEFAULT 0,
    "avgLCP" REAL,
    "avgFID" REAL,
    "avgCLS" REAL,
    "avgFCP" REAL,
    "avgTTFB" REAL,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "indexedPages" INTEGER NOT NULL DEFAULT 0,
    "indexablePages" INTEGER NOT NULL DEFAULT 0,
    "blockedPages" INTEGER NOT NULL DEFAULT 0,
    "totalCriticalIssues" INTEGER NOT NULL DEFAULT 0,
    "totalWarningIssues" INTEGER NOT NULL DEFAULT 0,
    "totalInfoIssues" INTEGER NOT NULL DEFAULT 0,
    "scoreChange" REAL,
    "issuesResolved" INTEGER NOT NULL DEFAULT 0,
    "newIssuesFound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GoogleMyBusiness" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "businessDescription" TEXT,
    "businessCategory" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "completionScore" REAL NOT NULL DEFAULT 0,
    "profileStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "verifiedAt" DATETIME,
    "businessHours" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "localSearchRanking" INTEGER,
    "mapPackRanking" INTEGER,
    "avgRating" REAL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "searchViews" INTEGER NOT NULL DEFAULT 0,
    "directionsClicked" INTEGER NOT NULL DEFAULT 0,
    "phoneClicked" INTEGER NOT NULL DEFAULT 0,
    "websiteClicked" INTEGER NOT NULL DEFAULT 0,
    "lastOptimizedAt" DATETIME,
    "nextAuditAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LocalKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmbId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "keywordType" TEXT NOT NULL,
    "targetCity" TEXT NOT NULL,
    "targetRegion" TEXT,
    "targetCountry" TEXT NOT NULL,
    "searchVolume" INTEGER NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0,
    "competition" TEXT NOT NULL DEFAULT 'MEDIUM',
    "currentRanking" INTEGER,
    "previousRanking" INTEGER,
    "bestRanking" INTEGER,
    "rankingChange" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "isTargeted" BOOLEAN NOT NULL DEFAULT true,
    "optimizationScore" REAL NOT NULL DEFAULT 0,
    "lastTrackedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LocalKeyword_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocalCitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "domainAuthority" REAL NOT NULL DEFAULT 0,
    "trustFlow" REAL NOT NULL DEFAULT 0,
    "citationFlow" REAL NOT NULL DEFAULT 0,
    "citationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "referralTraffic" INTEGER NOT NULL DEFAULT 0,
    "localRelevance" REAL NOT NULL DEFAULT 0,
    "submittedAt" DATETIME,
    "verifiedAt" DATETIME,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LocalCitation_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocalReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmbId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerAvatar" TEXT,
    "rating" REAL NOT NULL,
    "reviewTitle" TEXT,
    "reviewText" TEXT NOT NULL,
    "reviewLanguage" TEXT NOT NULL DEFAULT 'en',
    "platform" TEXT NOT NULL,
    "platformReviewId" TEXT,
    "reviewUrl" TEXT,
    "sentiment" TEXT,
    "sentimentScore" REAL,
    "keyTopics" TEXT,
    "hasResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseText" TEXT,
    "respondedAt" DATETIME,
    "responseAuthor" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPurchaseVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewDate" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LocalReview_gmbId_fkey" FOREIGN KEY ("gmbId") REFERENCES "GoogleMyBusiness" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocalContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "localEngagement" REAL NOT NULL DEFAULT 0,
    "localSearchRanking" INTEGER,
    "optimizationScore" REAL NOT NULL DEFAULT 0,
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LocalSEOMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL,
    "avgCompletionScore" REAL NOT NULL DEFAULT 0,
    "verifiedBusinesses" INTEGER NOT NULL DEFAULT 0,
    "totalBusinesses" INTEGER NOT NULL DEFAULT 0,
    "avgLocalRanking" REAL,
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
    "napConsistencyRate" REAL NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "avgRating" REAL,
    "positiveReviews" INTEGER NOT NULL DEFAULT 0,
    "negativeReviews" INTEGER NOT NULL DEFAULT 0,
    "responseRate" REAL NOT NULL DEFAULT 0,
    "localContentCount" INTEGER NOT NULL DEFAULT 0,
    "avgContentScore" REAL NOT NULL DEFAULT 0,
    "localSearchViews" INTEGER NOT NULL DEFAULT 0,
    "directionsClicked" INTEGER NOT NULL DEFAULT 0,
    "phoneClicked" INTEGER NOT NULL DEFAULT 0,
    "websiteClicked" INTEGER NOT NULL DEFAULT 0,
    "localSEOScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OptimizedImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "focalPointX" REAL,
    "focalPointY" REAL,
    "altText" TEXT,
    "metadata" TEXT,
    "compressionRatio" REAL NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 80,
    "sizeSavings" INTEGER NOT NULL DEFAULT 0,
    "savingsPercent" REAL NOT NULL DEFAULT 0,
    "placeholderBase64" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bandwidthSaved" INTEGER NOT NULL DEFAULT 0,
    "batchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OptimizedImage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImageBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImageBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "processedImages" INTEGER NOT NULL DEFAULT 0,
    "failedImages" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" REAL NOT NULL DEFAULT 0,
    "currentImageIndex" INTEGER NOT NULL DEFAULT 0,
    "estimatedTimeLeft" INTEGER,
    "config" TEXT NOT NULL,
    "totalOriginalSize" INTEGER NOT NULL DEFAULT 0,
    "totalOptimizedSize" INTEGER NOT NULL DEFAULT 0,
    "totalSizeSavings" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTime" INTEGER,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageFormat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "supportsAlpha" BOOLEAN NOT NULL DEFAULT false,
    "supportsAnimation" BOOLEAN NOT NULL DEFAULT false,
    "isLossy" BOOLEAN NOT NULL DEFAULT true,
    "browserSupport" TEXT NOT NULL,
    "avgCompressionRatio" REAL NOT NULL DEFAULT 0,
    "avgQualityScore" REAL NOT NULL DEFAULT 80,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "totalBytesSaved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageWatermark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "defaultPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "defaultOpacity" REAL NOT NULL DEFAULT 0.3,
    "defaultScale" REAL NOT NULL DEFAULT 0.1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ImageOptimizationMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricDate" DATETIME NOT NULL,
    "totalImagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "failedProcessing" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL NOT NULL DEFAULT 0,
    "webpGenerated" INTEGER NOT NULL DEFAULT 0,
    "avifGenerated" INTEGER NOT NULL DEFAULT 0,
    "jpegGenerated" INTEGER NOT NULL DEFAULT 0,
    "pngGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalOriginalSize" INTEGER NOT NULL DEFAULT 0,
    "totalOptimizedSize" INTEGER NOT NULL DEFAULT 0,
    "totalBytesSaved" INTEGER NOT NULL DEFAULT 0,
    "avgCompressionRatio" REAL NOT NULL DEFAULT 0,
    "totalBandwidthSaved" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostSavings" REAL NOT NULL DEFAULT 0,
    "smallThumbnails" INTEGER NOT NULL DEFAULT 0,
    "mediumThumbnails" INTEGER NOT NULL DEFAULT 0,
    "largeThumbnails" INTEGER NOT NULL DEFAULT 0,
    "watermarksApplied" INTEGER NOT NULL DEFAULT 0,
    "avgQualityScore" REAL NOT NULL DEFAULT 0,
    "cacheHitRate" REAL NOT NULL DEFAULT 0,
    "cachedImages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
