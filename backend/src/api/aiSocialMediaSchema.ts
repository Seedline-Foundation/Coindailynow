/**
 * AI Social Media Automation - GraphQL Schema
 * Task 9.2 Implementation
 */

import { gql } from 'graphql-tag';

export const aiSocialMediaSchema = gql`
  # ============================================================================
  # TYPES
  # ============================================================================

  type PlatformContent {
    platform: SocialPlatform!
    content: String!
    hashtags: [String!]!
    mediaUrls: [String!]
    postType: PostType!
    scheduledAt: DateTime
    aiGenerated: Boolean!
    optimizationScore: Float!
  }

  type EngagementPrediction {
    expectedLikes: Int!
    expectedComments: Int!
    expectedShares: Int!
    expectedImpressions: Int!
    engagementRate: Float!
    viralityScore: Float!
    confidenceScore: Float!
    bestPostingTime: DateTime!
    reasoning: [String!]!
  }

  type PostingResult {
    success: Boolean!
    postId: ID
    platform: String!
    platformPostId: String
    postUrl: String
    scheduledAt: DateTime
    publishedAt: DateTime
    prediction: EngagementPrediction
    error: String
    processingTime: Int!
  }

  type SocialMediaPost {
    id: ID!
    accountId: ID!
    contentId: ID
    postType: PostType!
    platform: SocialPlatform!
    content: String!
    mediaUrls: [String!]
    hashtags: [String!]
    mentions: [String!]
    scheduledAt: DateTime
    publishedAt: DateTime
    status: PostStatus!
    platformPostId: String
    postUrl: String
    
    # Engagement Metrics
    likes: Int!
    comments: Int!
    shares: Int!
    impressions: Int!
    clicks: Int!
    engagementRate: Float!
    reachCount: Int!
    
    # Performance
    performanceScore: Float!
    sentimentScore: Float
    viralityScore: Float
    
    errorMessage: String
    retryCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    account: SocialMediaAccount
    engagements: [SocialEngagement!]
  }

  type SocialMediaAccount {
    id: ID!
    platform: SocialPlatform!
    username: String!
    isActive: Boolean!
    status: String!
  }

  type SocialEngagement {
    id: ID!
    postId: ID!
    userId: ID
    engagementType: EngagementType!
    platform: SocialPlatform!
    platformUserId: String
    platformUsername: String
    content: String
    sentimentScore: Float
    isInfluencer: Boolean!
    followerCount: Int
    engagedAt: DateTime!
    createdAt: DateTime!
  }

  type SocialMediaAnalytics {
    platform: String!
    totalPosts: Int!
    avgEngagementRate: Float!
    avgPerformanceScore: Float!
    totalLikes: Int!
    totalComments: Int!
    totalShares: Int!
    totalImpressions: Int!
    bestPostingTime: String!
    topHashtags: [HashtagStats!]!
  }

  type HashtagStats {
    hashtag: String!
    count: Int!
    avgEngagement: Float!
  }

  type AutoPostSummary {
    total: Int!
    successful: Int!
    failed: Int!
    processingTime: Int!
    withinTarget: Boolean!
  }

  type SocialMediaOverview {
    twitter: SocialMediaAnalytics
    facebook: SocialMediaAnalytics
    instagram: SocialMediaAnalytics
    linkedin: SocialMediaAnalytics
    period: String!
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum SocialPlatform {
    TWITTER
    FACEBOOK
    INSTAGRAM
    LINKEDIN
    TELEGRAM
  }

  enum PostType {
    TEXT
    IMAGE
    VIDEO
    LINK
    POLL
    THREAD
  }

  enum PostStatus {
    DRAFT
    SCHEDULED
    PUBLISHED
    FAILED
  }

  enum EngagementType {
    LIKE
    COMMENT
    SHARE
    CLICK
    REPLY
    RETWEET
    MENTION
  }

  # ============================================================================
  # INPUTS
  # ============================================================================

  input AutoPostInput {
    articleId: ID!
    platforms: [SocialPlatform!]
    scheduleTime: DateTime
  }

  input TrackEngagementInput {
    postId: ID!
    likes: Int
    comments: Int
    shares: Int
    impressions: Int
  }

  input PostFilterInput {
    platform: SocialPlatform
    status: PostStatus
    dateFrom: DateTime
    dateTo: DateTime
  }

  # ============================================================================
  # QUERIES
  # ============================================================================

  type Query {
    """
    Get analytics for a specific platform
    """
    socialMediaAnalytics(
      platform: SocialPlatform!
      days: Int = 30
    ): SocialMediaAnalytics!

    """
    Get overview of all platforms
    """
    socialMediaOverview(days: Int = 7): SocialMediaOverview!

    """
    Get all social media posts with filtering
    """
    socialMediaPosts(
      page: Int = 1
      limit: Int = 20
      filter: PostFilterInput
    ): SocialMediaPostsConnection!

    """
    Get a specific post by ID
    """
    socialMediaPost(id: ID!): SocialMediaPost

    """
    Get engagement prediction for an article
    """
    predictEngagement(
      articleId: ID!
      platform: SocialPlatform!
      scheduledTime: DateTime
    ): EngagementPrediction!

    """
    Get optimal posting time for a platform
    """
    optimalPostingTime(
      platform: SocialPlatform!
      articleId: ID!
    ): DateTime!
  }

  # ============================================================================
  # MUTATIONS
  # ============================================================================

  type Mutation {
    """
    Automatically post article to all configured platforms
    """
    autoPostArticle(input: AutoPostInput!): AutoPostResponse!

    """
    Track engagement metrics for a post
    """
    trackEngagement(input: TrackEngagementInput!): TrackEngagementResponse!

    """
    Delete a scheduled post
    """
    deleteScheduledPost(postId: ID!): DeletePostResponse!

    """
    Retry a failed post
    """
    retryFailedPost(postId: ID!): PostingResult!
  }

  # ============================================================================
  # SUBSCRIPTIONS
  # ============================================================================

  type Subscription {
    """
    Subscribe to social media post updates
    """
    socialMediaPostUpdated(platform: SocialPlatform): SocialMediaPost!

    """
    Subscribe to engagement updates
    """
    engagementUpdated(postId: ID!): SocialEngagement!

    """
    Subscribe to analytics updates
    """
    analyticsUpdated(platform: SocialPlatform!): SocialMediaAnalytics!
  }

  # ============================================================================
  # RESPONSE TYPES
  # ============================================================================

  type AutoPostResponse {
    success: Boolean!
    results: [PostingResult!]!
    summary: AutoPostSummary!
  }

  type TrackEngagementResponse {
    success: Boolean!
    postId: ID!
    updated: Boolean!
  }

  type DeletePostResponse {
    success: Boolean!
    postId: ID!
    deleted: Boolean!
  }

  type SocialMediaPostsConnection {
    posts: [SocialMediaPost!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  # ============================================================================
  # SCALARS
  # ============================================================================

  scalar DateTime
`;

export default aiSocialMediaSchema;
