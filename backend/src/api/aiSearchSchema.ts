/**
 * AI Search GraphQL Schema
 * 
 * Defines GraphQL types, queries, mutations, and subscriptions for AI search
 * 
 * @module api/aiSearchSchema
 */

import { gql } from 'apollo-server-express';

export const aiSearchTypeDefs = gql`
  # ============================================================================
  # Types
  # ============================================================================

  """
  Search result for an article
  """
  type SearchResult {
    id: ID!
    title: String!
    excerpt: String!
    content: String
    categoryId: ID!
    categoryName: String
    author: SearchResultAuthor!
    publishedAt: DateTime!
    qualityScore: Float!
    relevanceScore: Float!
    semanticScore: Float
    isPremium: Boolean!
    tags: [String!]!
    imageUrl: String
    language: String!
    translationAvailable: [String!]!
  }

  """
  Author information in search result
  """
  type SearchResultAuthor {
    id: ID!
    name: String!
    avatar: String
  }

  """
  Search response with results and metadata
  """
  type SearchResponse {
    results: [SearchResult!]!
    totalCount: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
    queryExpansions: [String!]
    suggestions: [String!]
    processingTime: Int!
    cached: Boolean!
  }

  """
  Query suggestion from AI
  """
  type QuerySuggestion {
    suggestion: String!
    type: SuggestionType!
    score: Float!
  }

  """
  Type of query suggestion
  """
  enum SuggestionType {
    CORRECTION
    EXPANSION
    RELATED
  }

  """
  User search preferences
  """
  type UserSearchPreferences {
    userId: ID!
    favoriteCategories: [String!]!
    favoriteTopics: [String!]!
    readingHistory: [String!]!
    searchHistory: [String!]!
    languagePreference: String!
    contentDifficulty: ContentDifficulty
  }

  """
  Content difficulty level
  """
  enum ContentDifficulty {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  """
  Search analytics data
  """
  type SearchAnalytics {
    resultCount: Int!
    clickThroughRate: Float!
    averagePosition: Float!
    zeroResultsRate: Float!
    popularQueries: [PopularQuery!]!
  }

  """
  Popular search query
  """
  type PopularQuery {
    query: String!
    count: Int!
    averageResults: Float!
  }

  """
  Health check response
  """
  type HealthCheckResponse {
    status: HealthStatus!
    checks: HealthChecks!
    timestamp: DateTime!
  }

  """
  Health status enum
  """
  enum HealthStatus {
    HEALTHY
    DEGRADED
    UNHEALTHY
  }

  """
  Individual health checks
  """
  type HealthChecks {
    database: Boolean!
    redis: Boolean!
    openai: Boolean!
  }

  """
  Cache statistics
  """
  type CacheStats {
    totalKeys: Int!
    memoryUsed: String!
    keysByType: JSON!
  }

  """
  Cache invalidation result
  """
  type CacheInvalidationResult {
    keysDeleted: Int!
    pattern: String!
  }

  # ============================================================================
  # Inputs
  # ============================================================================

  """
  Search query input
  """
  input SearchQueryInput {
    query: String!
    userId: ID
    language: String
    filters: SearchFiltersInput
    page: Int
    limit: Int
  }

  """
  Search filters input
  """
  input SearchFiltersInput {
    categoryId: ID
    contentType: [String!]
    minQualityScore: Float
    dateRange: DateRangeInput
    tags: [String!]
    isPremium: Boolean
  }

  """
  Date range input
  """
  input DateRangeInput {
    start: DateTime!
    end: DateTime!
  }

  """
  Semantic search input
  """
  input SemanticSearchInput {
    query: String!
    userId: ID
    language: String
    limit: Int
    minSimilarity: Float
  }

  """
  Multi-language search input
  """
  input MultiLanguageSearchInput {
    query: String!
    languages: [String!]!
    limit: Int
  }

  """
  Cache invalidation input
  """
  input CacheInvalidationInput {
    pattern: String
  }

  # ============================================================================
  # Queries
  # ============================================================================

  type Query {
    """
    AI-enhanced search with query understanding and personalization
    """
    aiEnhancedSearch(input: SearchQueryInput!): SearchResponse!

    """
    Semantic search using embeddings
    """
    semanticSearch(input: SemanticSearchInput!): [SearchResult!]!

    """
    Multi-language search across translations
    """
    multiLanguageSearch(input: MultiLanguageSearchInput!): [SearchResult!]!

    """
    Get query suggestions for a search term
    """
    querySuggestions(query: String!, limit: Int): [QuerySuggestion!]!

    """
    Get user search preferences
    """
    userSearchPreferences(userId: ID!): UserSearchPreferences!

    """
    Get search analytics
    """
    searchAnalytics(days: Int): SearchAnalytics!

    """
    Get cache statistics
    """
    searchCacheStats: CacheStats!

    """
    Health check for AI search service
    """
    aiSearchHealth: HealthCheckResponse!
  }

  # ============================================================================
  # Mutations
  # ============================================================================

  type Mutation {
    """
    Invalidate search cache (Admin only)
    """
    invalidateSearchCache(input: CacheInvalidationInput): CacheInvalidationResult!
  }

  # ============================================================================
  # Subscriptions
  # ============================================================================

  type Subscription {
    """
    Subscribe to search analytics updates
    """
    searchAnalyticsUpdated: SearchAnalytics!

    """
    Subscribe to popular queries updates
    """
    popularQueriesUpdated: [PopularQuery!]!
  }

  # ============================================================================
  # Custom Scalars
  # ============================================================================

  scalar DateTime
  scalar JSON
`;

export default aiSearchTypeDefs;
