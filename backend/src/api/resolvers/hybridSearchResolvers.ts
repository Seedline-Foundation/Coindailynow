/**
 * Hybrid Search GraphQL Resolvers
 * Task 16: GraphQL integration for hybrid search engine
 */

import { 
  HybridSearchService, 
  SearchResultType, 
  HybridSearchResult, 
  UserPreferences 
} from '../../services/hybridSearchService';
import { ElasticsearchService } from '../../services/elasticsearchService';
import OpenAI from 'openai';
import { logger } from '../../utils/logger';

// GraphQL Types
export interface SearchInput {
  query: string;
  type?: SearchResultType;
  language?: string;
  limit?: number;
  offset?: number;
  includeSemanticRanking?: boolean;
  optimizeForAfrica?: boolean;
  userId?: string;
}

export interface PersonalizedSearchInput extends SearchInput {
  userPreferences: UserPreferences;
}

export interface SearchSuggestionInput {
  partialQuery: string;
  limit?: number;
  includeAfricanTerms?: boolean;
  languages?: string[];
}

export class HybridSearchResolvers {
  private hybridSearchService: HybridSearchService;

  constructor(
    private elasticsearchService: ElasticsearchService,
    private openai: OpenAI
  ) {
    this.hybridSearchService = new HybridSearchService(
      this.elasticsearchService,
      this.openai,
      logger
    );
  }

  /**
   * Hybrid search resolver
   */
  async search(input: SearchInput): Promise<HybridSearchResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.hybridSearchService.hybridSearch(input.query, {
        type: input.type || SearchResultType.ARTICLES,
        ...(input.language && { language: input.language }),
        includeSemanticRanking: input.includeSemanticRanking || false,
        optimizeForAfrica: input.optimizeForAfrica || true,
        trackAnalytics: true,
        ...(input.userId && { userId: input.userId }),
        maxResponseTime: 500 // Enforce sub-500ms requirement
      });

      // Apply pagination
      if (input.offset || input.limit) {
        const offset = input.offset || 0;
        const limit = input.limit || 20;
        result.hits = result.hits.slice(offset, offset + limit);
      }

      logger.info('Hybrid search completed', {
        query: input.query,
        userId: input.userId,
        resultCount: result.total,
        responseTime: Date.now() - startTime,
        searchMethod: result.searchMethod
      });

      return result;
    } catch (error) {
      logger.error('Hybrid search failed', {
        error,
        query: input.query,
        userId: input.userId
      });
      throw error;
    }
  }

  /**
   * Personalized search resolver
   */
  async personalizedSearch(input: PersonalizedSearchInput): Promise<HybridSearchResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.hybridSearchService.personalizedSearch(
        input.query,
        input.userPreferences,
        {
          type: input.type || SearchResultType.ARTICLES,
          includeSemanticRanking: input.includeSemanticRanking || true,
          optimizeForAfrica: input.optimizeForAfrica !== false,
          prioritizeLocalContent: true,
          trackAnalytics: true,
          maxResponseTime: 500
        }
      );

      // Apply pagination
      if (input.offset || input.limit) {
        const offset = input.offset || 0;
        const limit = input.limit || 20;
        result.hits = result.hits.slice(offset, offset + limit);
      }

      logger.info('Personalized search completed', {
        query: input.query,
        userId: input.userPreferences.userId,
        resultCount: result.total,
        responseTime: Date.now() - startTime,
        personalizedRanking: result.personalizedRanking
      });

      return result;
    } catch (error) {
      logger.error('Personalized search failed', {
        error,
        query: input.query,
        userId: input.userPreferences.userId
      });
      throw error;
    }
  }

  /**
   * Search suggestions resolver
   */
  async searchSuggestions(input: SearchSuggestionInput): Promise<string[]> {
    try {
      const suggestions = await this.hybridSearchService.getSearchSuggestions(
        input.partialQuery,
        {
          limit: input.limit || 10,
          includeAfricanTerms: input.includeAfricanTerms !== false,
          languages: input.languages || ['en', 'fr', 'sw', 'ar']
        }
      );

      logger.info('Search suggestions generated', {
        partialQuery: input.partialQuery,
        suggestionCount: suggestions.length
      });

      return suggestions;
    } catch (error) {
      logger.error('Search suggestions failed', {
        error,
        partialQuery: input.partialQuery
      });
      return [];
    }
  }

  /**
   * Search analytics resolver
   */
  async getSearchAnalytics(userId?: string, timeRange?: string): Promise<any> {
    // This would integrate with your analytics service
    // For now, return mock data
    return {
      totalSearches: 1250,
      averageResponseTime: 285,
      mostSearchedTerms: [
        'Bitcoin price',
        'Binance Africa',
        'M-Pesa cryptocurrency',
        'DeFi Nigeria',
        'Ethereum Kenya'
      ],
      languageDistribution: [
        { language: 'en', percentage: 65 },
        { language: 'fr', percentage: 15 },
        { language: 'sw', percentage: 12 },
        { language: 'ar', percentage: 5 },
        { language: 'af', percentage: 3 }
      ]
    };
  }
}

// GraphQL Schema definitions (TypeScript interfaces for documentation)
export const HybridSearchTypeDefs = `
  enum SearchResultType {
    ARTICLES
    MARKET_DATA
    MIXED
  }

  type SearchHit {
    id: String!
    title: String!
    content: String
    summary: String
    language: String!
    category: String
    tags: [String]
    publishedAt: String
    author: String
    score: Float!
    hybridScore: Float
    semanticScore: Float
    personalizationScore: Float
    highlight: SearchHighlight
  }

  type SearchHighlight {
    title: [String]
    content: [String]
  }

  type SearchPerformance {
    total: Int!
    elasticsearch: Int
    semantic: Int
    personalization: Int
  }

  type LanguageProcessing {
    detectedLanguage: String!
    africanContext: Boolean!
    translationSuggestions: [String]
  }

  type SearchAnalytics {
    queryId: String!
    responseTime: Int!
    resultCount: Int!
    userId: String
  }

  type HybridSearchResult {
    total: Int!
    hits: [SearchHit!]!
    searchMethod: String!
    performance: SearchPerformance!
    cached: Boolean
    compressed: Boolean
    mobileOptimized: Boolean
    personalizedRanking: Boolean
    languageProcessing: LanguageProcessing
    africanContextWeight: Float
    warnings: [String]
    error: String
    analytics: SearchAnalytics
  }

  input SearchInput {
    query: String!
    type: SearchResultType
    language: String
    limit: Int
    offset: Int
    includeSemanticRanking: Boolean
    optimizeForAfrica: Boolean
    userId: String
  }

  input UserPreferences {
    userId: String!
    preferredLanguages: [String!]!
    interestedTopics: [String!]!
    location: String!
    readingHistory: [String!]!
  }

  input PersonalizedSearchInput {
    query: String!
    type: SearchResultType
    language: String
    limit: Int
    offset: Int
    includeSemanticRanking: Boolean
    optimizeForAfrica: Boolean
    userPreferences: UserPreferences!
  }

  input SearchSuggestionInput {
    partialQuery: String!
    limit: Int
    includeAfricanTerms: Boolean
    languages: [String]
  }

  type SearchAnalyticsResult {
    totalSearches: Int!
    averageResponseTime: Int!
    mostSearchedTerms: [String!]!
    languageDistribution: [LanguageStats!]!
  }

  type LanguageStats {
    language: String!
    percentage: Float!
  }

  type Query {
    search(input: SearchInput!): HybridSearchResult!
    personalizedSearch(input: PersonalizedSearchInput!): HybridSearchResult!
    searchSuggestions(input: SearchSuggestionInput!): [String!]!
    searchAnalytics(userId: String, timeRange: String): SearchAnalyticsResult!
  }
`;

export const hybridSearchResolvers = {
  Query: {
    search: async (_: any, { input }: { input: SearchInput }, context: any) => {
      const resolvers = new HybridSearchResolvers(
        context.elasticsearchService,
        context.openai
      );
      return resolvers.search(input);
    },

    personalizedSearch: async (_: any, { input }: { input: PersonalizedSearchInput }, context: any) => {
      const resolvers = new HybridSearchResolvers(
        context.elasticsearchService,
        context.openai
      );
      return resolvers.personalizedSearch(input);
    },

    searchSuggestions: async (_: any, { input }: { input: SearchSuggestionInput }, context: any) => {
      const resolvers = new HybridSearchResolvers(
        context.elasticsearchService,
        context.openai
      );
      return resolvers.searchSuggestions(input);
    },

    searchAnalytics: async (_: any, { userId, timeRange }: { userId?: string; timeRange?: string }, context: any) => {
      const resolvers = new HybridSearchResolvers(
        context.elasticsearchService,
        context.openai
      );
      return resolvers.getSearchAnalytics(userId, timeRange);
    }
  }
};