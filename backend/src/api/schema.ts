// GraphQL Schema Definition
// Based on specs/002-coindaily-africa-s/graphql-schema.graphql

export const typeDefs = `
  # Authentication Types
  type TokenPair {
    accessToken: String!
    refreshToken: String!
  }

  type AuthPayload {
    success: Boolean!
    user: User
    tokens: TokenPair
    message: String
    error: Error
  }

  type AuthResponse {
    success: Boolean!
    message: String
    error: Error
  }

  type UserResponse {
    success: Boolean!
    user: User
    message: String
    error: Error
  }

  type AuthStatus {
    isAuthenticated: Boolean!
    user: User
  }

  type Error {
    code: String!
    message: String!
    details: String
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    firstName: String
    lastName: String
    deviceFingerprint: String
    ipAddress: String
    userAgent: String
  }

  input LoginInput {
    email: String!
    password: String!
    deviceFingerprint: String
    ipAddress: String
    userAgent: String
  }

  # Core Types
  type User {
    id: ID!
    email: String!
    username: String!
    firstName: String
    lastName: String
    avatarUrl: String
    bio: String
    location: String
    preferredLanguage: String!
    subscriptionTier: SubscriptionTier!
    emailVerified: Boolean!
    phoneVerified: Boolean!
    twoFactorEnabled: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLoginAt: DateTime
    status: UserStatus!
    profile: UserProfile
    articles: [Article!]!
    communityPosts: [CommunityPost!]!
    subscription: UserSubscription
  }

  enum SubscriptionTier {
    FREE
    PREMIUM
    ENTERPRISE
  }

  enum UserStatus {
    ACTIVE
    SUSPENDED
    BANNED
    PENDING_VERIFICATION
  }

  type UserProfile {
    userId: ID!
    tradingExperience: String
    investmentPortfolioSize: String
    preferredExchanges: [String!]!
    notificationPreferences: NotificationSettings!
    privacySettings: PrivacySettings!
    contentPreferences: ContentPreferences!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserSubscription {
    id: ID!
    user: User!
    plan: SubscriptionPlan!
    status: SubscriptionStatus!
    currentPeriodStart: DateTime!
    currentPeriodEnd: DateTime!
    trialEnd: DateTime
    cancelAtPeriodEnd: Boolean!
    cancelledAt: DateTime
    stripeSubscriptionId: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum SubscriptionStatus {
    ACTIVE
    CANCELLED
    PAST_DUE
    INCOMPLETE
    TRIALING
  }

  type SubscriptionPlan {
    id: ID!
    name: String!
    description: String!
    priceCents: Int!
    currency: String!
    billingInterval: BillingInterval!
    features: [String!]!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum BillingInterval {
    MONTHLY
    YEARLY
  }

  type NotificationSettings {
    emailNotifications: Boolean!
    pushNotifications: Boolean!
    smsNotifications: Boolean!
    breakingNewsAlerts: Boolean!
    priceAlerts: Boolean!
    communityMentions: Boolean!
  }

  type PrivacySettings {
    profileVisibility: ProfileVisibility!
    showInvestmentData: Boolean!
    showTradingActivity: Boolean!
    allowMessageRequests: Boolean!
  }

  enum ProfileVisibility {
    PUBLIC
    PRIVATE
    FRIENDS
  }

  type ContentPreferences {
    categories: [String!]!
    languages: [String!]!
    contentDifficulty: ContentDifficulty!
    autoTranslate: Boolean!
  }

  enum ContentDifficulty {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  # Content Types
  type Article {
    id: ID!
    title: String!
    slug: String!
    excerpt: String!
    content: String!
    featuredImageUrl: String
    author: User!
    category: Category!
    tags: [Tag!]!
    status: ArticleStatus!
    priority: ArticlePriority!
    isPremium: Boolean!
    viewCount: Int!
    likeCount: Int!
    commentCount: Int!
    shareCount: Int!
    readingTimeMinutes: Int!
    seoTitle: String
    seoDescription: String
    publishScheduledAt: DateTime
    publishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    translations: [ArticleTranslation!]!
    
    # CMS-specific fields
    engagementMetrics: EngagementMetrics!
    workflowStatus: WorkflowStatus!
    canEdit: Boolean!
    hasPendingTranslations: Boolean!
  }

  # CMS Types for Headless Content Management
  type EngagementMetrics {
    views: Int!
    likes: Int!
    shares: Int!
    comments: Int!
    engagementRate: Float!
  }

  type WorkflowStatus {
    currentStep: String!
    assignedReviewer: User
    lastAction: String
    actionDate: DateTime!
  }

  type ContentRevision {
    id: ID!
    articleId: ID!
    version: Int!
    title: String!
    excerpt: String!
    content: String!
    author: User!
    changeType: ChangeType!
    changeNotes: String
    createdAt: DateTime!
  }

  enum ChangeType {
    CREATED
    UPDATED
    PUBLISHED
    ARCHIVED
  }

  type AIContentAnalysis {
    readabilityScore: Int!
    seoScore: Int!
    engagementPrediction: Int!
    qualityScore: Int!
    suggestedTags: [String!]!
    suggestedTitle: String
    contentIssues: [String!]!
  }

  enum ArticleStatus {
    DRAFT
    PENDING_REVIEW
    APPROVED
    PUBLISHED
    ARCHIVED
    REJECTED
  }

  enum ArticlePriority {
    LOW
    NORMAL
    HIGH
    BREAKING
  }

  type ArticleTranslation {
    id: ID!
    articleId: ID!
    languageCode: String!
    title: String!
    excerpt: String!
    content: String!
    translationStatus: TranslationStatus!
    aiGenerated: Boolean!
    humanReviewed: Boolean!
    translatorId: ID
    qualityScore: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Enhanced fields for Task 7
    culturalAdaptations: [CulturalAdaptation!]!
    cryptoTermsPreserved: [String!]!
    fallbackUsed: Boolean!
    languageInfo: LanguageInfo!
    localizations: [Localization!]!
    qualityAssessment: TranslationQuality
  }

  type CulturalAdaptation {
    term: String!
    adaptation: String!
    context: String!
  }

  type LanguageInfo {
    code: String!
    name: String!
    region: String!
    countries: [String!]!
    direction: TextDirection!
  }

  type Localization {
    type: LocalizationType!
    original: String!
    localized: String!
    context: String!
  }

  type TranslationQuality {
    score: Int!
    requiresHumanReview: Boolean!
    factors: QualityFactors!
    recommendations: [String!]!
  }

  type QualityFactors {
    cryptoTermsPreserved: Int!
    culturalRelevance: Int!
    linguisticAccuracy: Int!
    contextualCoherence: Int!
  }

  type BatchTranslationResponse {
    taskId: String!
    totalTranslations: Int!
    estimatedCompletionTime: DateTime!
    results: [TranslationResult!]!
  }

  type TranslationResult {
    languageCode: String!
    status: TranslationResultStatus!
    translation: ArticleTranslation
    error: String
    processingTime: Int!
  }

  enum TextDirection {
    LTR
    RTL
  }

  enum LocalizationType {
    CURRENCY
    PAYMENT_METHOD
    EXCHANGE
    CULTURAL
  }

  enum TranslationResultStatus {
    COMPLETED
    FAILED
    PENDING
    HUMAN_REVIEW
  }

  type TranslationTaskStatus {
    taskId: String!
    status: TaskStatus!
    progress: Int!
    completedTranslations: Int!
    totalTranslations: Int!
    estimatedTimeRemaining: Int
    errors: [String!]!
  }

  type TranslationMetricsResponse {
    totalTranslations: Int!
    successRate: Float!
    averageQualityScore: Float!
    averageProcessingTime: Int!
    languagePerformance: [LanguagePerformance!]!
    humanReviewRate: Float!
    dailyStats: [DailyTranslationStats!]!
  }

  type LanguagePerformance {
    languageCode: String!
    languageName: String!
    totalTranslations: Int!
    averageQuality: Float!
    averageTime: Int!
    successRate: Float!
  }

  type DailyTranslationStats {
    date: String!
    translations: Int!
    averageQuality: Float!
    humanReviews: Int!
  }

  type CryptoGlossaryTerm {
    englishTerm: String!
    translatedTerm: String!
    context: String
    usage: String
  }

  type TranslationQueueResponse {
    queuedTasks: Int!
    processingTasks: Int!
    completedToday: Int!
    averageWaitTime: Int!
    priorityBreakdown: PriorityBreakdown!
  }

  type PriorityBreakdown {
    urgent: Int!
    high: Int!
    normal: Int!
    low: Int!
  }

  enum TaskStatus {
    QUEUED
    PROCESSING
    COMPLETED
    FAILED
    HUMAN_REVIEW
  }

  enum TranslationStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    REVIEWED
    REJECTED
  }

  type Token {
    id: ID!
    symbol: String!
    name: String!
    slug: String!
    description: String
    logoUrl: String
    websiteUrl: String
    whitepaperUrl: String
    blockchain: String!
    contractAddress: String
    tokenType: TokenType!
    marketCap: Float
    circulatingSupply: Float
    totalSupply: Float
    maxSupply: Float
    isMemecoin: Boolean!
    isListed: Boolean!
    listingStatus: ListingStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    marketData: [MarketData!]!
  }

  type MarketData {
    id: ID!
    token: Token!
    exchange: String!
    priceUsd: Float!
    priceChange24h: Float!
    volume24h: Float!
    marketCap: Float!
    timestamp: DateTime!
    high24h: Float!
    low24h: Float!
    tradingPairs: [String!]!
  }

  enum TokenType {
    CRYPTOCURRENCY
    MEMECOIN
    UTILITY_TOKEN
    SECURITY_TOKEN
    STABLECOIN
  }

  enum ListingStatus {
    APPROVED
    PENDING_REVIEW
    REJECTED
    DELISTED
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parentId: ID
    iconUrl: String
    colorHex: String
    sortOrder: Int!
    isActive: Boolean!
    articleCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    articles: [Article!]!
    subcategories: [Category!]!
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    description: String
    usageCount: Int!
    trendingScore: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
    articles: [Article!]!
  }

  # Legal & Compliance Types (Task 30)
  type ConsentRecord {
    id: ID!
    userId: String!
    consentType: ConsentType!
    purpose: String!
    granted: Boolean!
    grantedAt: DateTime!
    revokedAt: DateTime
    ipAddress: String!
    userAgent: String!
    version: String!
    metadata: String
  }

  enum ConsentType {
    COOKIES_ESSENTIAL
    COOKIES_ANALYTICS
    COOKIES_MARKETING
    DATA_PROCESSING
    NEWSLETTER
    THIRD_PARTY_SHARING
    MARKETING_COMMUNICATIONS
  }

  type DataRetentionPolicy {
    id: ID!
    dataType: String!
    retentionPeriod: String!
    jurisdiction: String!
    purpose: String!
    autoDelete: Boolean!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ComplianceReport {
    id: ID!
    framework: ComplianceFramework!
    status: ComplianceStatus!
    score: Float!
    violations: [ComplianceViolation!]!
    recommendations: [String!]!
    generatedAt: DateTime!
    periodStart: DateTime!
    periodEnd: DateTime!
  }

  enum ComplianceFramework {
    GDPR
    CCPA
    POPIA
    NDPR
    CUSTOM
  }

  enum ComplianceStatus {
    COMPLIANT
    NON_COMPLIANT
    IN_PROGRESS
    REQUIRES_REVIEW
  }

  type ComplianceViolation {
    id: ID!
    ruleId: String!
    severity: ViolationSeverity!
    description: String!
    details: String!
    status: ViolationStatus!
    detectedAt: DateTime!
    resolvedAt: DateTime
    userId: String
    resource: String
  }

  enum ViolationSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum ViolationStatus {
    OPEN
    INVESTIGATING
    RESOLVED
    FALSE_POSITIVE
  }

  type DataPortabilityExport {
    id: ID!
    userId: String!
    requestedAt: DateTime!
    completedAt: DateTime
    downloadUrl: String
    expiresAt: DateTime
    status: ExportStatus!
    dataTypes: [String!]!
    format: ExportFormat!
  }

  enum ExportStatus {
    REQUESTED
    PROCESSING
    COMPLETED
    FAILED
    EXPIRED
  }

  enum ExportFormat {
    JSON
    CSV
    XML
    PDF
  }

  type ConsentBanner {
    id: ID!
    version: String!
    content: String!
    cookieCategories: [CookieCategory!]!
    jurisdiction: String!
    active: Boolean!
    createdAt: DateTime!
  }

  type CookieCategory {
    id: ID!
    name: String!
    description: String!
    essential: Boolean!
    defaultEnabled: Boolean!
    cookies: [CookieInfo!]!
  }

  type CookieInfo {
    name: String!
    purpose: String!
    duration: String!
    domain: String!
    provider: String!
  }

  input ConsentInput {
    consentType: ConsentType!
    purpose: String!
    granted: Boolean!
    metadata: String
  }

  input ComplianceReportInput {
    framework: ComplianceFramework!
    periodStart: DateTime!
    periodEnd: DateTime!
  }

  input DataRetentionPolicyInput {
    dataType: String!
    retentionPeriod: String!
    jurisdiction: String!
    purpose: String!
    autoDelete: Boolean!
  }

  # Query Type
  type Query {
    # Authentication queries
    me: UserResponse!
    authStatus: AuthStatus!

    # User queries
    user(id: ID!): User
    users(limit: Int = 20, offset: Int = 0, filter: String): [User!]!

    # Article queries
    article(id: ID, slug: String): Article
    articles(
      limit: Int = 20
      offset: Int = 0
      categoryId: ID
      tags: [String!]
      status: ArticleStatus
      isPremium: Boolean
      authorId: ID
    ): [Article!]!

    # Translation queries for Task 7
    articleTranslations(articleId: ID!): [ArticleTranslation!]!
    articleTranslation(articleId: ID!, languageCode: String!): ArticleTranslation
    supportedLanguages: [LanguageInfo!]!
    translationTask(taskId: String!): TranslationTaskStatus!
    translationMetrics: TranslationMetricsResponse!
    cryptoGlossary(languageCode: String!): [CryptoGlossaryTerm!]!
    translationQueueStatus: TranslationQueueResponse!

    # CMS Management queries (Editor/Admin only)
    articlesForManagement(
      limit: Int = 50
      offset: Int = 0
      status: ArticleStatus
      authorId: ID
      categoryId: ID
      searchTerm: String
    ): [Article!]!
    
    articleRevisions(articleId: ID!): [ContentRevision!]!
    articleAIAnalysis(articleId: ID!): AIContentAnalysis!

    featuredArticles(limit: Int = 10): [Article!]!
    trendingArticles(limit: Int = 10): [Article!]!

    # Category queries
    categories(parentId: ID): [Category!]!
    category(id: ID, slug: String): Category

    # Tag queries
    tags(limit: Int = 50): [Tag!]!
    trendingTags(limit: Int = 20): [Tag!]!

    # Token queries
    token(id: ID, symbol: String, slug: String): Token
    tokens(limit: Int = 100, offset: Int = 0, isListed: Boolean = true): [Token!]!

    # Community queries
    communityPost(id: ID!): CommunityPost
    communityPosts(limit: Int = 20, offset: Int = 0, postType: String, authorId: String, parentId: String): [CommunityPost!]!
    articleComments(articleId: ID!, limit: Int = 20, offset: Int = 0): [CommunityPost!]!

    # Market data queries
    marketData: [MarketData!]!

    # AI System queries
    aiAgents: [AIAgent!]!
    aiAgent(id: ID!): AIAgent
    aiTasks(agentId: ID, status: TaskStatus, limit: Int = 20): [AITask!]!

    # Analytics queries
    contentPerformance(contentId: ID, contentType: ContentType, startDate: DateTime, endDate: DateTime): [ContentPerformance!]!

    # Search queries
    search(input: SearchInput!): [SearchResult!]!
    searchSuggestions(query: String!): [SearchSuggestion!]!

    # Task 8: Content Workflow Engine queries
    workflow(id: ID!): ContentWorkflow
    workflows(
      filter: WorkflowFilterInput
      pagination: WorkflowPaginationInput
    ): [ContentWorkflow!]!
    workflowAnalytics(
      dateFrom: String
      dateTo: String
    ): WorkflowAnalytics!
    workflowNotifications(
      status: String
      pagination: WorkflowPaginationInput
    ): [WorkflowNotification!]!

    # Subscription queries
    subscriptionPlans: [SubscriptionPlan!]!

    # Health check
    health: HealthCheck!

    # Task 10: Content Generation Agent queries
    contentGenerationStatus: ContentGenerationStatus!
    recentContentGenerationTasks(limit: Int = 10): [ContentGenerationTaskInfo!]!

    # Task 12: Quality Review Agent queries
    qualityReviewStatus: QualityReviewStatus!
    recentQualityReviews(limit: Int = 10): [QualityReviewTaskInfo!]!

    # Task 18: Advanced Analytics System queries
    getUserBehaviorAnalytics(userId: ID!): UserBehaviorAnalytics!
    getSessionAnalytics(userId: ID!, dateRange: DateRangeInput!): SessionAnalytics!
    getContentPerformanceAnalytics(contentId: ID!): ContentPerformanceAnalytics!
    getTopPerformingContent(limit: Int = 10): [TopContent!]!
    getAfricanMarketInsights(dateRange: DateRangeInput!): AfricanMarketInsights!
    getRealTimeAnalytics: RealTimeAnalytics!
    queryAnalytics(query: AnalyticsQueryInput!): AnalyticsResponse!
    getAnalyticsHealth: AnalyticsHealth!

    # Task 30: Legal & Compliance queries
    getUserConsents(userId: String!): [ConsentRecord!]!
    getConsentHistory(userId: String!, consentType: ConsentType): [ConsentRecord!]!
    getDataRetentionPolicies(jurisdiction: String): [DataRetentionPolicy!]!
    getComplianceReport(framework: ComplianceFramework!, periodStart: DateTime!, periodEnd: DateTime!): ComplianceReport!
    getComplianceStatus: [ComplianceReport!]!
    getDataPortabilityExports(userId: String!): [DataPortabilityExport!]!
    getConsentBanner(jurisdiction: String!): ConsentBanner!
    getCookieCategories: [CookieCategory!]!
    getPrivacyImpactAssessment(assessmentId: String!): String!
    getCrossBorderDataTransfers: [String!]!

    # Wallet Modal queries - Hybrid Wallet System
    """Get whitelisted wallet addresses for current user"""
    getWhitelistedWallets: [String!]!
    
    """Search users by username or email"""
    searchUsers(query: String!, limit: Int): [UserSearchResult!]!
    
    """Get real-time exchange rate from payment provider"""
    getExchangeRate(
      fromCurrency: String!
      toCurrency: String!
      amount: Float!
      provider: PaymentProvider!
    ): ExchangeRate!
    
    """Check if recent swap transaction has been completed"""
    checkSwapStatus(walletId: ID!): SwapStatus!

    # Withdrawal Management queries
    """Get current user's withdrawal requests"""
    getUserWithdrawalRequests(status: WithdrawalStatus, limit: Int): [WithdrawalRequest!]!
    
    """Get all pending withdrawal requests (Admin only)"""
    getPendingWithdrawalRequests(limit: Int, offset: Int): [WithdrawalRequest!]!
    
    """Get withdrawal statistics (Admin only)"""
    getWithdrawalStats: WithdrawalStats!

    # Performance monitoring
    performanceStats(timeRange: String): PerformanceStats!
  }

  # Mutation Type
  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout(refreshToken: String): AuthResponse!
    refreshToken(refreshToken: String!): AuthPayload!
    requestPasswordReset(email: String!): AuthResponse!
    resetPassword(token: String!, newPassword: String!): AuthResponse!
    changePassword(currentPassword: String!, newPassword: String!): AuthResponse!
    verifyToken(token: String!): UserResponse!

    # User management
    updateProfile(input: UpdateUserProfileInput!): User!

    # Article management
    createArticle(input: CreateArticleInput!): Article!
    updateArticle(input: UpdateArticleInput!): Article!
    deleteArticle(articleId: ID!): Boolean!
    publishArticle(articleId: ID!): Article!
    
    # CMS Workflow management
    submitArticleForReview(articleId: ID!): Article!
    approveArticle(articleId: ID!, notes: String): Article!
    rejectArticle(articleId: ID!, reason: String!): Article!
    archiveArticle(articleId: ID!): Article!
    rollbackArticleToRevision(articleId: ID!, revisionId: ID!): Article!
    
    # Translation management
    createArticleTranslation(
      articleId: ID!
      languageCode: String!
      translation: TranslationInput!
    ): ArticleTranslation!
    
    # Enhanced translation operations for Task 7
    batchTranslateArticle(
      articleId: ID!
      targetLanguages: [String!]!
      options: TranslationOptionsInput
    ): BatchTranslationResponse!
    
    queueArticleTranslation(
      articleId: ID!
      targetLanguages: [String!]!
      priority: TranslationPriority!
    ): String!
    
    updateTranslationStatus(
      translationId: ID!
      status: TranslationStatus!
      reviewNotes: String
    ): ArticleTranslation!
    
    retranslateArticle(
      articleId: ID!
      languageCode: String!
      options: RetranslationOptionsInput
    ): ArticleTranslation!
    
    updateCryptoGlossary(
      languageCode: String!
      terms: [CryptoTermInput!]!
    ): Boolean!
    
    # Bulk operations
    bulkUpdateArticleStatus(articleIds: [ID!]!, status: ArticleStatus!): Int!

    # Community management
    createPost(input: CreateCommunityPostInput!): CommunityPost!
    updatePost(id: ID!, content: String!): CommunityPost!
    deletePost(id: ID!): Boolean!
    votePost(postId: ID!, voteType: VoteType!): Vote!
    shareArticle(articleId: ID!, platform: String!): ShareResult!
    reactToArticle(articleId: ID!, reactionType: String!): ReactionResult!

    # Content interactions
    likeArticle(id: ID!): Article!
    bookmarkArticle(id: ID!): Boolean!
    shareContent(contentId: ID!, contentType: ContentType!, platform: String!): Boolean!

    # AI System
    triggerAITask(input: TriggerAITaskInput!): AITask!

    # Task 8: Content Workflow Engine mutations
    createWorkflow(input: CreateWorkflowInput!): ContentWorkflow!
    transitionWorkflow(input: TransitionWorkflowInput!): ContentWorkflow!
    approveWorkflowStep(
      workflowId: String!
      stepName: String!
      feedback: String
      approved: Boolean!
    ): ContentWorkflow!
    sendWorkflowNotification(input: WorkflowNotificationInput!): WorkflowNotification!
    markNotificationRead(notificationId: String!): WorkflowNotification!

    # Subscriptions
    subscribe(planId: ID!): UserSubscription!
    cancelSubscription: Boolean!
    updatePaymentMethod(input: PaymentMethodInput!): Boolean!

    # Task 10: Content Generation Agent mutations
    generateContent(input: ContentGenerationInput!): ContentGenerationResponse!
    regenerateContent(
      originalTaskId: String!
      modifications: ContentGenerationModificationInput!
    ): ContentGenerationResponse!
    validateContentQuality(input: ContentQualityValidationInput!): ContentQualityValidationResponse!

    # Task 12: Quality Review Agent mutations
    reviewContentQuality(input: QualityReviewInput!): QualityReviewResponse!
    batchReviewQuality(inputs: [QualityReviewInput!]!): BatchQualityReviewResponse!

    # Task 18: Advanced Analytics System mutations
    trackEvent(eventData: AnalyticsEventInput!): AnalyticsEvent!
    trackMobileMoneyEvent(userId: ID!, mobileMoneyData: MobileMoneyEventInput!): AnalyticsEvent!
    exportUserData(userId: ID!, options: ExportOptionsInput!): AnalyticsExport!
    cleanupOldData: CleanupResult!

    # Task 30: Legal & Compliance mutations
    recordConsent(input: ConsentInput!): ConsentRecord!
    revokeConsent(consentId: ID!): ConsentRecord!
    requestDataPortability(input: DataPortabilityInput!): DataPortabilityExport!
    deleteUserData(userId: String!, reason: String!): Boolean!
    createDataRetentionPolicy(input: DataRetentionPolicyInput!): DataRetentionPolicy!
    updateDataRetentionPolicy(id: ID!, input: DataRetentionPolicyInput!): DataRetentionPolicy!
    runDataRetentionCleanup(policyId: ID): String!
    generateComplianceReport(input: ComplianceReportInput!): ComplianceReport!
    acknowledgeDataBreach(breachId: String!, acknowledgment: String!): Boolean!
    updateConsentBanner(jurisdiction: String!, content: String!, version: String!): ConsentBanner!

    # Wallet Modal mutations - Hybrid Wallet System
    """Convert CE Points to JY Tokens"""
    convertCEToJY(walletId: ID!, ceAmount: Float!): ConversionResult!
    
    """Deposit JY from whitelisted external wallet"""
    depositFromWallet(
      walletId: ID!
      sourceAddress: String!
      amount: Float!
      txHash: String
    ): DepositResult!
    
    """Create internal platform transfer"""
    createTransfer(
      fromWalletId: ID!
      toIdentifier: String!
      amount: Float!
      transferType: TransferType!
      note: String
    ): TransferResult!

    # Withdrawal Management mutations
    """Create a withdrawal request (requires 48hr cooldown, Wed/Fri only, min 0.05 JY)"""
    createWithdrawalRequest(
      walletId: ID!
      amount: Float!
      destinationAddress: String!
      notes: String
    ): WithdrawalRequestResponse!
    
    """Approve a withdrawal request (Admin only)"""
    approveWithdrawalRequest(
      requestId: ID!
      adminNotes: String
      txHash: String
    ): WithdrawalRequest!
    
    """Reject a withdrawal request (Admin only)"""
    rejectWithdrawalRequest(
      requestId: ID!
      reason: String!
      adminNotes: String
    ): WithdrawalRequest!

    # Performance and cache management
    invalidateCache(strategy: String, pattern: String, tag: String): CacheInvalidationResult!
    warmupCache(strategy: String!): CacheWarmupResult!
  }

  type CacheInvalidationResult {
    success: Boolean!
    invalidatedCount: Int!
    message: String!
  }

  type CacheWarmupResult {
    success: Boolean!
    message: String!
  }

  # Input Types
  input CreateArticleInput {
    title: String!
    excerpt: String!
    content: String!
    categoryId: ID!
    tags: [String!]!
    isPremium: Boolean!
    featuredImageUrl: String
    publishScheduledAt: DateTime
  }

  input UpdateArticleInput {
    id: ID!
    title: String
    excerpt: String
    content: String
    categoryId: ID
    tags: [String!]
    isPremium: Boolean
    featuredImageUrl: String
    seoTitle: String
    seoDescription: String
    publishScheduledAt: DateTime
  }

  input TranslationInput {
    title: String!
    excerpt: String!
    content: String!
  }

  input TranslationOptionsInput {
    requiresHumanReview: Boolean = false
    enableCulturalAdaptation: Boolean = true
    enableCryptoGlossary: Boolean = true
    includeLocalCurrency: Boolean = false
    region: String
  }

  input RetranslationOptionsInput {
    preserveHumanEdits: Boolean = true
    updateGlossary: Boolean = false
    reason: String
  }

  input CryptoTermInput {
    englishTerm: String!
    translatedTerm: String!
    context: String
  }

  enum TranslationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  input CreateCommunityPostInput {
    title: String
    content: String!
    postType: PostType!
    parentId: ID
    mediaUrls: [String!]
  }

  input UpdateUserProfileInput {
    firstName: String
    lastName: String
    bio: String
    location: String
    preferredLanguage: String
    notificationPreferences: NotificationSettingsInput
    privacySettings: PrivacySettingsInput
    contentPreferences: ContentPreferencesInput
  }

  input NotificationSettingsInput {
    emailNotifications: Boolean
    pushNotifications: Boolean
    smsNotifications: Boolean
    breakingNewsAlerts: Boolean
    priceAlerts: Boolean
    communityMentions: Boolean
  }

  input PrivacySettingsInput {
    profileVisibility: ProfileVisibility
    showInvestmentData: Boolean
    showTradingActivity: Boolean
    allowMessageRequests: Boolean
  }

  input ContentPreferencesInput {
    categories: [String!]
    languages: [String!]
    contentDifficulty: ContentDifficulty
    autoTranslate: Boolean
  }

  input TriggerAITaskInput {
    agentId: ID!
    taskType: String!
    inputData: JSON!
    priority: TaskPriority
  }

  input PaymentMethodInput {
    paymentToken: String!
    isDefault: Boolean
  }

  # Additional Types
  type CommunityPost {
    id: ID!
    author: User!
    title: String
    content: String!
    postType: PostType!
    parentId: ID
    tokenMentions: [String!]!
    mediaUrls: [String!]!
    upvoteCount: Int!
    downvoteCount: Int!
    commentCount: Int!
    shareCount: Int!
    isPinned: Boolean!
    isLocked: Boolean!
    moderationStatus: ModerationStatus!
    violationReason: String
    penaltyApplied: PenaltyType
    createdAt: DateTime!
    updatedAt: DateTime!
    replies: [CommunityPost!]!
    userVote: Vote
  }

  enum PostType {
    TEXT
    LINK
    IMAGE
    VIDEO
    POLL
  }

  enum ModerationStatus {
    APPROVED
    PENDING
    FLAGGED
    SHADOW_BANNED
    REMOVED
  }

  enum PenaltyType {
    WARNING
    SHADOW_BAN
    TEMPORARY_BAN
    PERMANENT_BAN
  }

  type Vote {
    id: ID!
    user: User!
    post: CommunityPost!
    voteType: VoteType!
    createdAt: DateTime!
    removed: Boolean
    changed: Boolean
  }

  type ShareResult {
    success: Boolean!
    pointsEarned: Int!
  }

  type ReactionResult {
    success: Boolean!
    pointsEarned: Int!
  }

  enum VoteType {
    UPVOTE
    DOWNVOTE
  }

  type AuthTokenPayload {
    token: String!
    refreshToken: String!
    user: User!
    expiresAt: DateTime!
  }

  # AI System Types
  type AIAgent {
    id: ID!
    name: String!
    type: AgentType!
    modelProvider: String!
    modelName: String!
    configuration: JSON!
    isActive: Boolean!
    performanceMetrics: AgentMetrics!
    createdAt: DateTime!
    updatedAt: DateTime!
    tasks: [AITask!]!
  }

  enum AgentType {
    CONTENT_GENERATION
    MARKET_ANALYSIS
    SENTIMENT_ANALYSIS
    TRANSLATION
    IMAGE_GENERATION
    MODERATION
    QUALITY_REVIEW
  }

  type AgentMetrics {
    totalRequests: Int!
    successfulRequests: Int!
    averageResponseTimeMs: Float!
    qualityScore: Float!
    costPerRequest: Float!
    lastPerformanceCheck: DateTime!
  }

  type AITask {
    id: ID!
    agent: AIAgent!
    taskType: String!
    inputData: JSON!
    outputData: JSON
    status: TaskStatus!
    priority: TaskPriority!
    estimatedCost: Float!
    actualCost: Float
    processingTimeMs: Int
    qualityScore: Float
    errorMessage: String
    retryCount: Int!
    maxRetries: Int!
    scheduledAt: DateTime
    startedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
  }

  enum TaskStatus {
    QUEUED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum TaskPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  type ContentPerformance {
    id: ID!
    contentId: ID!
    contentType: ContentType!
    date: DateTime!
    views: Int!
    uniqueViews: Int!
    likes: Int!
    shares: Int!
    comments: Int!
    readingTimeAvg: Float!
    bounceRate: Float!
    conversionRate: Float!
    revenueGenerated: Float!
  }

  enum ContentType {
    ARTICLE
    POST
  }

  # Search Types
  type SearchResult {
    id: ID!
    title: String!
    excerpt: String!
    url: String!
    type: SearchResultType!
    relevanceScore: Float!
    isAiGenerated: Boolean!
    isPremium: Boolean!
    publishedAt: DateTime
  }

  enum SearchResultType {
    ARTICLE
    TOKEN
    USER
    COMMUNITY_POST
  }

  type SearchSuggestion {
    query: String!
    type: SuggestionType!
    count: Int!
  }

  enum SuggestionType {
    RECENT
    TRENDING
    POPULAR
    AUTOCOMPLETE
  }

  # Input Types
  input SearchInput {
    query: String!
    type: SearchType
    filters: SearchFiltersInput
    limit: Int
    offset: Int
  }

  enum SearchType {
    AI_POWERED
    ORGANIC
  }

  input SearchFiltersInput {
    categories: [String!]
    tags: [String!]
    isPremium: Boolean
    dateRange: DateRangeInput
    contentType: [SearchResultType!]
  }

  input DateRangeInput {
    start: DateTime
    end: DateTime
    startDate: DateTime
    endDate: DateTime
  }

  # Task 8: Content Workflow Engine Types
  type ContentWorkflow {
    id: ID!
    articleId: String!
    workflowType: String!
    currentState: String!
    previousState: String
    priority: String!
    assignedReviewerId: String
    completionPercentage: Float!
    estimatedCompletionAt: DateTime
    actualCompletionAt: DateTime
    errorMessage: String
    retryCount: Int!
    maxRetries: Int!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    article: Article!
    assignedReviewer: User
    steps: [WorkflowStep!]!
    transitions: [WorkflowTransition!]!
    notifications: [WorkflowNotification!]!

    # Computed fields
    completionPercentageCalculated: Float!
    isOverdue: Boolean!
    totalSteps: Int!
    completedSteps: Int!
  }

  type WorkflowStep {
    id: ID!
    workflowId: String!
    stepName: String!
    stepOrder: Int!
    status: String!
    assigneeId: String
    estimatedDurationMs: Int
    actualDurationMs: Int
    startedAt: DateTime
    completedAt: DateTime
    output: JSON
    errorMessage: String
    qualityScore: Float
    humanFeedback: String
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    workflow: ContentWorkflow!
    assignee: User

    # Computed fields
    isOverdue: Boolean!
    actualDurationFormatted: String
  }

  type WorkflowTransition {
    id: ID!
    workflowId: String!
    fromState: String!
    toState: String!
    transitionType: String!
    triggeredBy: String
    triggerConditions: JSON
    transitionReason: String
    metadata: JSON
    createdAt: DateTime!

    # Relations
    workflow: ContentWorkflow!
  }

  type WorkflowNotification {
    id: ID!
    workflowId: String!
    recipientId: String!
    notificationType: String!
    title: String!
    message: String!
    priority: String!
    channel: String
    sentAt: DateTime
    readAt: DateTime
    status: String!
    errorMessage: String
    metadata: JSON
    createdAt: DateTime!

    # Relations
    workflow: ContentWorkflow!
    recipient: User!

    # Computed fields
    isUnread: Boolean!
  }

  type WorkflowAnalytics {
    totalWorkflows: Int!
    completedWorkflows: Int!
    averageCompletionTimeMs: Float!
    successRate: Float!
    stateDistribution: JSON!
    bottleneckSteps: [WorkflowBottleneck!]!
    performanceMetrics: WorkflowPerformanceMetrics!
  }

  type WorkflowBottleneck {
    stepName: String!
    averageDurationMs: Float!
    failureRate: Float!
  }

  type WorkflowPerformanceMetrics {
    aiReviewAccuracy: Float!
    humanApprovalRate: Float!
    translationQuality: Float!
    contentQuality: Float!
  }

  # Workflow Input Types
  input CreateWorkflowInput {
    articleId: String!
    workflowType: String
    priority: String
    assignedReviewerId: String
    metadata: JSON
  }

  input TransitionWorkflowInput {
    workflowId: String!
    toState: String!
    triggerReason: String
    metadata: JSON
  }

  input WorkflowNotificationInput {
    workflowId: String!
    recipientId: String!
    notificationType: String!
    title: String!
    message: String!
    priority: String
    metadata: JSON
  }

  input WorkflowFilterInput {
    currentState: String
    priority: String
    assignedReviewerId: String
    workflowType: String
  }

  input WorkflowPaginationInput {
    skip: Int
    take: Int
  }

  # Custom Scalar Types
  scalar DateTime
  scalar JSON

  # Task 10: Content Generation Agent Types
  type ContentGenerationStatus {
    status: String!
    metrics: ContentGenerationMetrics!
    capabilities: [String!]!
    supportedLanguages: [String!]!
    supportedExchanges: [String!]!
  }

  type ContentGenerationMetrics {
    totalTasksProcessed: Int!
    successRate: Float!
    averageQualityScore: Float!
    averageProcessingTime: Float!
    africanContextScore: Float!
  }

  type ContentGenerationTaskInfo {
    id: String!
    title: String!
    excerpt: String!
    status: String!
    qualityScore: Float!
    wordCount: Int!
    createdAt: DateTime!
    author: String!
  }

  type ContentGenerationResponse {
    success: Boolean!
    taskId: String!
    content: GeneratedContent
    error: String
    processingTime: Float
    similarityCheck: SimilarityCheckResult
  }

  type GeneratedContent {
    title: String!
    content: String!
    excerpt: String!
    keywords: [String!]!
    qualityScore: Float!
    wordCount: Int!
    readingTime: Int!
    format: String!
    africanRelevance: AfricanRelevanceInfo
    marketDataIntegration: MarketDataIntegrationInfo
  }

  type AfricanRelevanceInfo {
    score: Float!
    mentionedCountries: [String!]!
    mentionedExchanges: [String!]!
    mobileMoneyIntegration: Boolean!
    localCurrencyMention: Boolean!
  }

  type MarketDataIntegrationInfo {
    realTimeData: Boolean!
    exchanges: [String!]!
    pricePoints: [Float!]!
    volumeData: Boolean!
  }

  type SimilarityCheckResult {
    maxSimilarity: Float!
    similarArticleCount: Int!
  }

  type ContentQualityValidationResponse {
    success: Boolean!
    qualityScore: Float!
    wordCount: Int!
    readingTime: Int!
    africanRelevance: AfricanRelevanceValidation
    recommendations: [String!]!
    error: String
  }

  type AfricanRelevanceValidation {
    score: Float!
    mentionedKeywords: [String!]!
  }

  input ContentGenerationInput {
    topic: String!
    targetLanguages: [String!]!
    africanContext: AfricanMarketContextInput!
    contentType: ContentTypeEnum!
    keywords: [String!]!
    sources: [String!]
    priority: TaskPriority = NORMAL
  }

  input AfricanMarketContextInput {
    region: AfricanRegion!
    countries: [String!]!
    languages: [String!]!
    exchanges: [String!]!
    mobileMoneyProviders: [String!]!
    timezone: String!
    culturalContext: JSON
  }

  input ContentGenerationModificationInput {
    topic: String
    targetLanguages: [String!]
    africanContext: AfricanMarketContextInput
    contentType: ContentTypeEnum
    keywords: [String!]
    sources: [String!]
    priority: TaskPriority
  }

  input ContentQualityValidationInput {
    title: String!
    content: String!
    africanContext: AfricanMarketContextInput!
  }

  enum ContentTypeEnum {
    ARTICLE
    SUMMARY
    SOCIAL_POST
    NEWSLETTER
  }

  enum AfricanRegion {
    WEST
    EAST
    NORTH
    SOUTH
    CENTRAL
  }

  # Task 12: Quality Review Agent Types
  type QualityReviewStatus {
    status: String!
    metrics: QualityReviewMetrics!
    capabilities: [String!]!
    reviewCriteria: [String!]!
    supportedContentTypes: [String!]!
    biasDetectionTypes: [String!]!
  }

  type QualityReviewMetrics {
    totalTasksProcessed: Int!
    successRate: Float!
    averageQualityScore: Float!
    averageProcessingTime: Float!
    biasDetectionRate: Float!
    culturalSensitivityScore: Float!
    factCheckAccuracy: Float!
  }

  type QualityReviewTaskInfo {
    id: String!
    contentId: String!
    contentType: String!
    status: String!
    overallQuality: Float
    biasScore: Float
    createdAt: String!
    completedAt: String
  }

  type QualityReviewResponse {
    success: Boolean!
    taskId: String!
    review: QualityReviewDetails
    error: String
    processingTime: Float!
  }

  type QualityReviewDetails {
    overallQuality: Float!
    dimensions: QualityDimensionsInfo!
    biasAnalysis: BiasAnalysisInfo!
    culturalAnalysis: CulturalAnalysisInfo
    factCheck: FactCheckInfo
    improvementSuggestions: [ImprovementSuggestionInfo!]
    recommendations: [String!]!
    requiresHumanReview: Boolean!
  }

  type QualityDimensionsInfo {
    accuracy: Float!
    clarity: Float!
    engagement: Float!
    structure: Float!
    grammar: Float!
    factualConsistency: Float!
    africanRelevance: Float!
    culturalSensitivity: Float!
  }

  type BiasAnalysisInfo {
    overallBias: Float!
    types: [String!]!
    concerns: [String!]!
    details: BiasDetailsInfo
  }

  type BiasDetailsInfo {
    culturalBias: Float!
    geographicBias: Float!
    economicBias: Float!
    genderBias: Float!
    ageBias: Float!
    religiousBias: Float
  }

  type CulturalAnalysisInfo {
    religiousContext: ReligiousContextInfo!
    languageUsage: LanguageUsageInfo!
    socialContext: SocialContextInfo!
  }

  type ReligiousContextInfo {
    score: Float!
    considerations: [String!]!
  }

  type LanguageUsageInfo {
    score: Float!
    localTerms: [String!]!
    appropriateness: String!
    issues: [String!]
  }

  type SocialContextInfo {
    score: Float!
    communityAspects: [String!]!
    economicRealities: String!
  }

  type FactCheckInfo {
    score: Float!
    verifiedClaims: [String!]!
    questionableClaims: [String!]!
    falseClaims: [String!]!
    sources: [String!]!
  }

  type ImprovementSuggestionInfo {
    category: String!
    priority: String!
    suggestion: String!
    specificChanges: [String!]!
  }

  type BatchQualityReviewResponse {
    success: Boolean!
    totalProcessed: Int!
    successfulReviews: Int!
    failedReviews: Int!
    averageQuality: Float!
    results: [BatchQualityReviewResult!]!
    error: String
  }

  type BatchQualityReviewResult {
    contentId: String!
    taskId: String!
    success: Boolean!
    overallQuality: Float!
    biasScore: Float!
    requiresHumanReview: Boolean!
    error: String
  }

  input QualityReviewInput {
    contentId: String!
    content: String!
    contentType: String!
    reviewCriteria: [String!]!
    africanContext: AfricanMarketContextInput!
    requiresFactCheck: Boolean
    priority: TaskPriority
  }

  # Task 18: Advanced Analytics System Types
  type AnalyticsEvent {
    id: ID!
    userId: ID
    sessionId: String!
    eventType: String!
    resourceId: ID
    resourceType: String
    properties: JSON
    metadata: AnalyticsMetadata!
    timestamp: DateTime!
  }

  type AnalyticsMetadata {
    userAgent: String!
    deviceType: DeviceType!
    country: String!
    region: String!
    language: String!
    referrer: String
    sessionDuration: Int
    ipAddress: String!
    africanMarketContext: AfricanMarketContext
  }

  type AfricanMarketContext {
    country: String!
    exchange: String
    mobileMoneyProvider: String
    localCurrency: String!
    timezone: String!
    networkConditions: NetworkCondition
  }

  enum DeviceType {
    MOBILE
    TABLET
    DESKTOP
    OTHER
  }

  enum NetworkCondition {
    FAST
    SLOW
    OFFLINE
  }

  type UserBehaviorAnalytics {
    userId: ID!
    sessionAnalytics: SessionAnalytics!
    engagementMetrics: UserEngagementMetrics!
    contentPreferences: UserContentPreferences!
    africanMarketBehavior: AfricanMarketBehavior!
    deviceUsagePatterns: DeviceUsagePatterns!
  }

  type SessionAnalytics {
    averageSessionDuration: Float!
    pagesPerSession: Float!
    bounceRate: Float!
    sessionsCount: Int!
    lastSessionAt: DateTime!
    sessionTimeDistribution: TimeDistribution!
  }

  type UserEngagementMetrics {
    totalEngagements: Int!
    engagementRate: Float!
    avgReadingTime: Float!
    socialShares: Int!
    commentsCount: Int!
    likesCount: Int!
    bookmarksCount: Int!
    subscriptionEngagement: SubscriptionEngagement!
  }

  type SubscriptionEngagement {
    planType: String!
    subscriptionDate: DateTime!
    paymentMethod: String!
    churnRisk: Float!
    lifetimeValue: Float!
  }

  type UserContentPreferences {
    preferredCategories: [CategoryPreference!]!
    readingTimePreference: ReadingTimePreference!
    contentTypePreference: ContentTypePreference!
    languagePreferences: [LanguagePreference!]!
  }

  type CategoryPreference {
    categoryId: ID!
    categoryName: String!
    engagementScore: Float!
    readingTime: Float!
    shareRate: Float!
  }

  enum ReadingTimePreference {
    SHORT
    MEDIUM
    LONG
  }

  type ContentTypePreference {
    articles: Float!
    marketAnalysis: Float!
    news: Float!
    tutorials: Float!
    interviews: Float!
  }

  type LanguagePreference {
    language: String!
    engagementRate: Float!
    readingTime: Float!
  }

  type AfricanMarketBehavior {
    preferredExchanges: [String!]!
    mobileMoneyUsage: MobileMoneyUsage!
    localCurrencyFocus: String!
    crossBorderInterest: Boolean!
    remittanceInterest: Boolean!
    tradingExperienceLevel: TradingExperienceLevel!
  }

  type MobileMoneyUsage {
    provider: String!
    frequency: MobileMoneyFrequency!
    transactionTypes: [String!]!
    averageAmount: Float!
  }

  enum TradingExperienceLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  enum MobileMoneyFrequency {
    LOW
    MEDIUM
    HIGH
  }

  type DeviceUsagePatterns {
    primaryDevice: DeviceType!
    deviceDistribution: DeviceDistribution!
    operatingSystem: String!
    browserPreference: String!
    networkSpeedPreference: NetworkSpeedPreference!
  }

  type DeviceDistribution {
    mobile: Float!
    tablet: Float!
    desktop: Float!
    other: Float!
  }

  enum NetworkSpeedPreference {
    FAST
    OPTIMIZED
  }

  type TimeDistribution {
    hourly: JSON!
    daily: JSON!
    monthly: JSON!
  }

  type ContentPerformanceAnalytics {
    contentId: ID!
    contentType: String!
    performanceMetrics: ContentPerformanceMetrics!
    audienceAnalytics: AudienceAnalytics!
    engagementAnalytics: ContentEngagementAnalytics!
    africanMarketPerformance: AfricanMarketPerformance!
    conversionMetrics: ConversionMetrics!
  }

  type ContentPerformanceMetrics {
    totalViews: Int!
    uniqueViews: Int!
    avgReadingTime: Float!
    completionRate: Float!
    bounceRate: Float!
    returnVisitorRate: Float!
    peakViewingTime: DateTime!
    geographicReach: Int!
  }

  type AudienceAnalytics {
    demographics: DemographicsData!
    geographicDistribution: [GeographicDistribution!]!
    deviceBreakdown: DeviceDistribution!
    trafficSources: [TrafficSource!]!
    newVsReturning: NewVsReturningUsers!
  }

  type DemographicsData {
    ageGroups: [AgeGroupData!]!
    languages: [LanguageDistribution!]!
    subscriptionTiers: [SubscriptionTierData!]!
  }

  type AgeGroupData {
    ageRange: String!
    percentage: Float!
    engagementRate: Float!
  }

  type LanguageDistribution {
    language: String!
    percentage: Float!
    avgReadingTime: Float!
  }

  type SubscriptionTierData {
    tier: String!
    percentage: Float!
    conversionRate: Float!
  }

  type GeographicDistribution {
    country: String!
    region: String!
    percentage: Float!
    engagementScore: Float!
    averageSessionDuration: Float!
  }

  type TrafficSource {
    source: String!
    medium: String!
    percentage: Float!
    conversionRate: Float!
    bounceRate: Float!
  }

  type NewVsReturningUsers {
    newUsers: Int!
    returningUsers: Int!
  }

  type ContentEngagementAnalytics {
    socialShares: [SocialShareData!]!
    comments: CommentAnalytics!
    reactions: ReactionAnalytics!
    bookmarks: Int!
    emailShares: Int!
    printActions: Int!
  }

  type SocialShareData {
    platform: String!
    shares: Int!
    clicks: Int!
    engagement: Int!
  }

  type CommentAnalytics {
    totalComments: Int!
    averageCommentLength: Float!
    sentimentScore: Float!
    topContributors: [String!]!
    moderationActions: Int!
  }

  type ReactionAnalytics {
    likes: Int!
    loves: Int!
    helpful: Int!
    insightful: Int!
    totalReactions: Int!
  }

  type AfricanMarketPerformance {
    countryPerformance: [CountryPerformance!]!
    exchangeMentions: [ExchangeMentionData!]!
    mobileMoneyInteractions: [MobileMoneyInteractionData!]!
    localCurrencyEngagement: [LocalCurrencyData!]!
  }

  type CountryPerformance {
    country: String!
    views: Int!
    engagementRate: Float!
    avgReadingTime: Float!
    conversionRate: Float!
    mobileUsagePercent: Float!
  }

  type ExchangeMentionData {
    exchange: String!
    mentions: Int!
    clickThroughRate: Float!
    userInteractions: Int!
  }

  type MobileMoneyInteractionData {
    provider: String!
    interactions: Int!
    conversionToSubscription: Int!
  }

  type LocalCurrencyData {
    currency: String!
    mentions: Int!
    priceQueries: Int!
    conversionRequests: Int!
  }

  type ConversionMetrics {
    subscriptionConversions: Int!
    emailSignups: Int!
    socialFollows: Int!
    newsletterSignups: Int!
    downloadActions: Int!
    affiliateClicks: Int!
    revenueGenerated: Float!
  }

  type AfricanMarketInsights {
    topCountries: [CountryInsight!]!
    exchangePopularity: [ExchangeInsight!]!
    mobileMoneyAdoption: [MobileMoneyInsight!]!
    languageUsage: [LanguageUsageInsight!]!
    crossBorderActivity: CrossBorderInsight!
  }

  type CountryInsight {
    country: String!
    userCount: Int!
    contentViews: Int!
    revenueContribution: Float!
    growthRate: Float!
  }

  type ExchangeInsight {
    exchange: String!
    mentions: Int!
    userInteractions: Int!
    contentAssociation: Int!
  }

  type MobileMoneyInsight {
    provider: String!
    userCount: Int!
    transactionVolume: Float!
    subscriptionConversions: Int!
  }

  type LanguageUsageInsight {
    language: String!
    userCount: Int!
    contentAvailable: Int!
    engagementRate: Float!
  }

  type CrossBorderInsight {
    totalCrossBorderUsers: Int!
    popularRoutes: [CrossBorderRoute!]!
    remittanceInterest: Float!
  }

  type CrossBorderRoute {
    fromCountry: String!
    toCountry: String!
    userCount: Int!
    transactionInterest: Float!
  }

  type RealTimeAnalytics {
    onlineUsers: Int!
    livePageViews: Int!
    activeContent: [ActiveContent!]!
    trendingTopics: [TrendingTopic!]!
    systemPerformance: SystemPerformanceMetrics!
  }

  type ActiveContent {
    contentId: ID!
    title: String!
    currentViewers: Int!
    engagementRate: Float!
  }

  type TrendingTopic {
    topic: String!
    mentions: Int!
    engagementScore: Float!
    growth: Float!
  }

  type SystemPerformanceMetrics {
    responseTime: Float!
    cacheHitRate: Float!
    errorRate: Float!
    serverLoad: Float!
  }

  type TopContent {
    contentId: ID!
    title: String!
    views: Int!
    engagementScore: Float!
    conversionRate: Float!
  }

  type PerformanceStats {
    timeRange: String!
    api: ApiPerformanceStats!
    cache: CachePerformanceStats!
  }

  type HealthCheck {
    status: String!
    timestamp: String!
    version: String!
    performance: HealthPerformance
    error: String
  }

  type HealthPerformance {
    responseTime: Float!
    averageResponseTime: Float!
    cacheHitRate: Float!
    slowQueries: Int!
  }

  type ApiPerformanceStats {
    totalRequests: Int!
    averageResponseTime: Float!
    p95ResponseTime: Float!
    p99ResponseTime: Float!
    slowQueries: Int!
    errorRate: Float!
    requestsPerMinute: Float!
  }

  type CachePerformanceStats {
    hitRate: Float!
    totalKeys: Int!
    memoryUsage: Float!
    strategiesHealth: JSON!
  }

  type AnalyticsResponse {
    data: JSON!
    metadata: AnalyticsResponseMetadata!
    error: AnalyticsError
  }

  type AnalyticsResponseMetadata {
    totalRecords: Int!
    processedRecords: Int!
    query: JSON!
    executionTime: Float!
    cacheHit: Boolean!
  }

  type AnalyticsError {
    code: String!
    message: String!
  }

  type AnalyticsHealth {
    status: AnalyticsHealthStatus!
    dataLatency: Float!
    processingQueue: Int!
    errorRate: Float!
    lastProcessedEvent: DateTime!
  }

  enum AnalyticsHealthStatus {
    HEALTHY
    DEGRADED
    UNHEALTHY
  }

  type AnalyticsExport {
    exportId: ID!
    query: JSON!
    format: ExportFormat!
    status: ExportStatus!
    downloadUrl: String
    expiresAt: DateTime!
    createdAt: DateTime!
  }

  enum ExportFormat {
    CSV
    JSON
    PDF
  }

  enum ExportStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
  }

  type CleanupResult {
    deletedRecords: Int!
  }

  input AnalyticsEventInput {
    userId: ID
    sessionId: String
    eventType: String!
    resourceId: ID
    resourceType: String
    properties: JSON
    metadata: AnalyticsMetadataInput!
  }

  input AnalyticsMetadataInput {
    userAgent: String!
    deviceType: String!
    country: String!
    region: String!
    language: String!
    referrer: String
    sessionDuration: Int
    ipAddress: String!
    africanMarketContext: AnalyticsAfricanContextInput
  }

  input AnalyticsAfricanContextInput {
    country: String!
    exchange: String
    mobileMoneyProvider: String
    localCurrency: String!
    timezone: String!
    networkConditions: String
  }

  input MobileMoneyEventInput {
    provider: String!
    amount: Float!
    currency: String!
    transactionType: String!
    status: String!
  }

  input AnalyticsQueryInput {
    dateRange: DateRangeInput!
    filters: AnalyticsFiltersInput
    groupBy: String
    metrics: [String!]!
    sortBy: SortOptionsInput
    limit: Int
  }

  input AnalyticsFiltersInput {
    userIds: [ID!]
    contentIds: [ID!]
    categories: [String!]
    countries: [String!]
    deviceTypes: [String!]
    eventTypes: [String!]
    subscriptionTiers: [String!]
    africanExchanges: [String!]
    mobileMoneyProviders: [String!]
  }

  input SortOptionsInput {
    field: String!
    direction: String!
  }

  input ExportOptionsInput {
    format: ExportFormat!
    includePersonalData: Boolean!
  }

  # Custom scalars
  scalar JSON
  scalar DateTime

  # Legal Compliance Types
  type LegalFramework {
    code: String!
    name: String!
    jurisdiction: String!
    effectiveDate: String!
    description: String!
  }

  type ConsentPreferences {
    essential: Boolean!
    functional: Boolean!
    analytics: Boolean!
    marketing: Boolean!
    advertising: Boolean!
  }

  type ConsentStatus {
    hasConsent: Boolean!
    preferences: ConsentPreferences
    lastUpdated: String
    needsRefresh: Boolean!
    applicableFrameworks: [String!]!
  }

  type ComplianceCookieCategory {
    id: String!
    name: String!
    description: String!
    required: Boolean!
    retention: Int!
    thirdPartySharing: Boolean!
    purposes: [String!]!
    cookies: [CookieDefinition!]!
  }

  type CookieDefinition {
    name: String!
    provider: String!
    purpose: String!
    duration: String!
    type: String!
    category: String!
  }

  type CookiePolicy {
    categories: [ComplianceCookieCategory!]!
    totalCookies: Int!
    thirdPartyCookies: Int!
    lastUpdated: String!
    policyVersion: String!
  }

  type CookieBannerConfig {
    showBanner: Boolean!
    position: String!
    theme: String!
    language: String!
    declineButton: Boolean!
    granularControls: Boolean!
    autoAcceptEssential: Boolean!
    recheckPeriod: Int!
  }

  type RetentionStatus {
    category: String!
    totalRecords: Int!
    recordsNearExpiry: Int!
    recordsExpired: Int!
    nextScheduledCleanup: String
    applicableRules: [String!]!
  }

  type RetentionExecution {
    executionId: String!
    status: String!
    recordsEvaluated: Int!
    recordsDeleted: Int!
    recordsAnonymized: Int!
    recordsRetained: Int!
    duration: Int!
    errors: [String!]!
  }

  type ComplianceMetrics {
    totalConsentRecords: Int!
    activeConsents: Int!
    expiredConsents: Int!
    withdrawnConsents: Int!
    dataExportRequests: Int!
    dataRetentionRules: Int!
    piaCompleted: Int!
    crossBorderTransfers: Int!
  }

  type ComplianceDashboard {
    complianceScore: Float!
    activeFrameworks: [String!]!
    recentViolations: Int!
    pendingRequests: Int!
    retentionActions: Int!
    lastAudit: String!
    nextScheduledCleanup: String!
    metrics: ComplianceMetrics!
  }

  type CrossBorderValidation {
    allowed: Boolean!
    mechanism: String
    requirements: [String!]!
    safeguards: [String!]!
  }

  type PIAFinding {
    id: String!
    type: String!
    description: String!
    severity: String!
    status: String!
    assignee: String
    dueDate: String
    resolution: String
  }

  type PrivacyImpactAssessment {
    piaId: String!
    riskLevel: String!
    status: String!
    findings: [PIAFinding!]!
  }

  type DataPortabilityRequestStatus {
    requestId: String!
    status: String!
    estimatedCompletion: String
  }

  type ComplianceReportSummary {
    reportId: String!
    framework: String!
    period: String!
    overallScore: Float!
    violationsCount: Int!
    recommendationsCount: Int!
    metrics: ComplianceMetrics!
    generatedAt: String!
  }

  type LegalResponse {
    success: Boolean!
    data: String
    error: String
  }

  type ConsentResponse {
    success: Boolean!
    data: ConsentStatus
    error: String
  }

  type CookiePolicyResponse {
    success: Boolean!
    data: CookiePolicy
    error: String
  }

  type CookieBannerResponse {
    success: Boolean!
    data: CookieBannerConfig
    error: String
  }

  type RetentionStatusResponse {
    success: Boolean!
    data: RetentionStatus
    error: String
  }

  type ComplianceDashboardResponse {
    success: Boolean!
    data: ComplianceDashboard
    error: String
  }

  type LegalFrameworksResponse {
    success: Boolean!
    data: [LegalFramework!]
    error: String
  }

  input ConsentPreferencesInput {
    essential: Boolean!
    functional: Boolean!
    analytics: Boolean!
    marketing: Boolean!
    advertising: Boolean!
  }

  input CookieConsentInput {
    preferences: ConsentPreferencesInput!
    sessionId: String!
    consentMethod: String!
  }

  input WithdrawConsentInput {
    categories: [String!]!
    method: String!
    sessionId: String
  }

  input DataPortabilityInput {
    requestType: String!
    format: String
  }

  input PIAInput {
    title: String!
    description: String!
    dataProcessingPurpose: String!
    dataTypes: [String!]!
  }

  input CrossBorderTransferInput {
    sourceCountry: String!
    destinationCountry: String!
    dataType: String!
    recipient: String!
  }

  input RetentionRuleInput {
    ruleId: String!
    dryRun: Boolean
  }

  input ComplianceReportRequestInput {
    framework: String!
    startDate: String!
    endDate: String!
  }

  # ============================================================================
  # Wallet Modal Types - Hybrid Wallet System
  # ============================================================================

  """Result of CE to JY conversion"""
  type ConversionResult {
    success: Boolean!
    jyAmount: Float
    transactionId: String
    error: String
  }

  """Result of wallet deposit operation"""
  type DepositResult {
    success: Boolean!
    txHash: String
    transactionId: String
    error: String
  }

  """Result of internal transfer operation"""
  type TransferResult {
    success: Boolean!
    txId: String
    error: String
  }

  """User search result for transfers"""
  type UserSearchResult {
    id: ID!
    username: String!
    displayName: String!
    avatar: String
    role: String!
  }

  """Exchange rate information from payment provider"""
  type ExchangeRate {
    fromCurrency: String!
    toCurrency: String!
    rate: Float!
    fee: Float!
    estimatedTime: String!
    provider: String!
  }

  """Swap transaction status"""
  type SwapStatus {
    success: Boolean!
    txHash: String
    error: String
  }

  """Type of internal transfer"""
  enum TransferType {
    USER
    SERVICE
    CONTENT
  }

  """Payment provider for currency exchange"""
  enum PaymentProvider {
    YellowCard
    ChangeNOW
  }

  # Withdrawal Management Types
  """Withdrawal request for JY tokens"""
  type WithdrawalRequest {
    id: ID!
    userId: String!
    walletId: String!
    amount: Float!
    destinationAddress: String!
    status: WithdrawalStatus!
    notes: String
    adminNotes: String
    requestedAt: DateTime!
    processedAt: DateTime
    approvedBy: String
    approvedAt: DateTime
    rejectedBy: String
    rejectedAt: DateTime
    rejectionReason: String
    txHash: String
    user: User
    wallet: UserWallet
  }

  """Status of withdrawal request"""
  enum WithdrawalStatus {
    PENDING
    APPROVED
    REJECTED
    COMPLETED
    FAILED
  }

  """Input for creating withdrawal request"""
  input WithdrawalRequestInput {
    walletId: ID!
    amount: Float!
    destinationAddress: String!
    notes: String
  }

  """Input for approving withdrawal"""
  input ApproveWithdrawalInput {
    requestId: ID!
    adminNotes: String
    txHash: String
  }

  """Input for rejecting withdrawal"""
  input RejectWithdrawalInput {
    requestId: ID!
    reason: String!
    adminNotes: String
  }

  """Withdrawal statistics for admin dashboard"""
  type WithdrawalStats {
    pendingCount: Int!
    approvedCount: Int!
    rejectedCount: Int!
    totalApprovedAmount: Float!
    averageProcessingTime: Float
  }

  """Response for withdrawal request creation"""
  type WithdrawalRequestResponse {
    success: Boolean!
    message: String!
    request: WithdrawalRequest
    nextAvailableDate: DateTime
    hoursUntilNextRequest: Float
  }

  """User wallet information for withdrawal"""
  type UserWallet {
    id: ID!
    type: String!
    balance: Float!
    joyTokens: Float!
    whitelistedAddresses: [String!]
  }
`;