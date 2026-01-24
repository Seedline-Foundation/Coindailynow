-- Task 26: API Response Optimization - Performance Indexes
-- This migration adds database indexes for sub-500ms query performance

-- Performance indexes for Article queries
CREATE INDEX IF NOT EXISTS "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Article_categoryId_status_idx" ON "Article"("categoryId", "status");
CREATE INDEX IF NOT EXISTS "Article_isPremium_status_idx" ON "Article"("isPremium", "status");
CREATE INDEX IF NOT EXISTS "Article_authorId_publishedAt_idx" ON "Article"("authorId", "publishedAt");
CREATE INDEX IF NOT EXISTS "Article_slug_status_idx" ON "Article"("slug", "status");

-- Performance indexes for Category queries  
CREATE INDEX IF NOT EXISTS "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "Category_parentId_isActive_idx" ON "Category"("parentId", "isActive");

-- Performance indexes for Token queries
CREATE INDEX IF NOT EXISTS "Token_isListed_marketCap_idx" ON "Token"("isListed", "marketCap");
CREATE INDEX IF NOT EXISTS "Token_symbol_isListed_idx" ON "Token"("symbol", "isListed");

-- Performance indexes for MarketData queries
CREATE INDEX IF NOT EXISTS "MarketData_tokenId_timestamp_idx" ON "MarketData"("tokenId", "timestamp");
CREATE INDEX IF NOT EXISTS "MarketData_exchange_timestamp_idx" ON "MarketData"("exchange", "timestamp");

-- Performance indexes for User queries
CREATE INDEX IF NOT EXISTS "User_email_status_idx" ON "User"("email", "status");
CREATE INDEX IF NOT EXISTS "User_username_status_idx" ON "User"("username", "status");

-- Performance indexes for ArticleTranslation queries
CREATE INDEX IF NOT EXISTS "ArticleTranslation_articleId_languageCode_status_idx" ON "ArticleTranslation"("articleId", "languageCode", "translationStatus");
CREATE INDEX IF NOT EXISTS "ArticleTranslation_languageCode_status_idx" ON "ArticleTranslation"("languageCode", "translationStatus");

-- Performance indexes for UserEngagement queries
CREATE INDEX IF NOT EXISTS "UserEngagement_userId_resourceType_idx" ON "UserEngagement"("userId", "resourceType");
CREATE INDEX IF NOT EXISTS "UserEngagement_resourceId_engagementType_idx" ON "UserEngagement"("resourceId", "engagementType");

-- Performance indexes for AnalyticsEvent queries
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_timestamp_idx" ON "AnalyticsEvent"("eventType", "timestamp");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_eventType_idx" ON "AnalyticsEvent"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_resourceType_timestamp_idx" ON "AnalyticsEvent"("resourceType", "timestamp");

-- Performance indexes for AITask queries
CREATE INDEX IF NOT EXISTS "AITask_status_priority_idx" ON "AITask"("status", "priority");
CREATE INDEX IF NOT EXISTS "AITask_agentId_status_idx" ON "AITask"("agentId", "status");
CREATE INDEX IF NOT EXISTS "AITask_createdAt_status_idx" ON "AITask"("createdAt", "status");

-- Performance indexes for CommunityPost queries  
CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_moderationStatus_idx" ON "CommunityPost"("authorId", "moderationStatus");
CREATE INDEX IF NOT EXISTS "CommunityPost_parentId_createdAt_idx" ON "CommunityPost"("parentId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityPost_moderationStatus_createdAt_idx" ON "CommunityPost"("moderationStatus", "createdAt");

-- Partial indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS "Article_published_recent_idx" ON "Article"("publishedAt" DESC) WHERE "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "Article_premium_published_idx" ON "Article"("publishedAt" DESC) WHERE "isPremium" = true AND "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "Token_listed_by_marketcap_idx" ON "Token"("marketCap" DESC) WHERE "isListed" = true;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS "Article_category_status_published_idx" ON "Article"("categoryId", "status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "Article_author_status_published_idx" ON "Article"("authorId", "status", "publishedAt" DESC);

-- Performance optimization for search queries
CREATE INDEX IF NOT EXISTS "Article_title_gin_idx" ON "Article" USING gin(to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "Article_content_gin_idx" ON "Article" USING gin(to_tsvector('english', "content"));

-- Add indexes for mobile money performance
CREATE INDEX IF NOT EXISTS "MobileMoneyTransaction_userId_status_idx" ON "MobileMoneyTransaction"("userId", "status");
CREATE INDEX IF NOT EXISTS "MobileMoneyTransaction_providerId_status_idx" ON "MobileMoneyTransaction"("providerId", "status");
CREATE INDEX IF NOT EXISTS "MobileMoneyTransaction_createdAt_status_idx" ON "MobileMoneyTransaction"("createdAt", "status");

-- Analytics performance indexes
CREATE INDEX IF NOT EXISTS "UserPreference_userId_preferenceType_idx" ON "UserPreference"("userId", "preferenceType");
CREATE INDEX IF NOT EXISTS "UserNotification_userId_isRead_idx" ON "UserNotification"("userId", "isRead");

-- Add performance comment
COMMENT ON DATABASE "news-platform" IS 'Task 26: API Response Optimization - Performance indexes added for sub-500ms query targets';