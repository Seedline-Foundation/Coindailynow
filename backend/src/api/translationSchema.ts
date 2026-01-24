/**
 * Article Translation GraphQL Schema - Task 8.1
 * 
 * Provides GraphQL types, queries, and subscriptions for article translations.
 */

import { gql } from 'apollo-server-express';

export const translationTypeDefs = gql`
  """
  Supported language codes for article translations
  13 languages: 7 African + 6 European
  """
  enum LanguageCode {
    # Global & African Languages
    en  # English
    sw  # Swahili
    ha  # Hausa
    yo  # Yoruba
    ig  # Igbo
    am  # Amharic
    zu  # Zulu
    
    # European Languages
    es  # Spanish
    pt  # Portuguese
    it  # Italian
    de  # German
    fr  # French
    ru  # Russian
  }

  """
  Translation quality level indicator
  """
  enum QualityLevel {
    excellent
    good
    fair
    needs_review
  }

  """
  Language information
  """
  type LanguageInfo {
    code: LanguageCode!
    name: String!
    nativeName: String!
    flag: String!
  }

  """
  Translation quality indicator
  """
  type QualityIndicator {
    score: Float!
    level: QualityLevel!
    confidence: Float!
    issues: [String!]
  }

  """
  Article translation
  """
  type ArticleTranslation {
    id: ID!
    articleId: ID!
    language: LanguageCode!
    languageInfo: LanguageInfo!
    title: String!
    content: String!
    excerpt: String!
    qualityIndicator: QualityIndicator!
    isFallback: Boolean!
    fallbackReason: String
    metadata: JSON
    article: Article
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  All translations for an article
  """
  type ArticleTranslations {
    articleId: ID!
    translations: [ArticleTranslation!]!
    availableLanguages: [LanguageCode!]!
    totalLanguages: Int!
    supportedLanguages: Int!
  }

  """
  Translation statistics
  """
  type TranslationStats {
    totalTranslations: Int!
    averageQuality: Float!
    languageBreakdown: JSON!
    completionRate: Float!
  }

  """
  User language preference
  """
  type LanguagePreference {
    userId: ID!
    preferredLanguage: LanguageCode!
    detectedLocation: String
    autoDetect: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Input for updating language preference
  """
  input UpdateLanguagePreferenceInput {
    preferredLanguage: LanguageCode!
    autoDetect: Boolean
  }

  """
  Queries
  """
  type Query {
    """
    Get all translations for an article
    """
    articleTranslations(articleId: ID!): ArticleTranslations!

    """
    Get specific language translation for an article
    """
    articleTranslation(
      articleId: ID!
      language: LanguageCode!
      enableFallback: Boolean = true
    ): ArticleTranslation

    """
    Get available languages for an article
    """
    availableLanguages(articleId: ID!): [LanguageInfo!]!

    """
    Get all supported languages
    """
    supportedLanguages: [LanguageInfo!]!

    """
    Get translation statistics
    """
    translationStats(articleId: ID): TranslationStats!

    """
    Get user's language preference
    """
    myLanguagePreference: LanguagePreference

    """
    Detect language from user's location and browser settings
    """
    detectLanguage(
      countryCode: String
      acceptLanguage: String
    ): LanguageCode!
  }

  """
  Mutations
  """
  type Mutation {
    """
    Update user's language preference
    """
    updateLanguagePreference(
      input: UpdateLanguagePreferenceInput!
    ): LanguagePreference!

    """
    Clear translation cache for an article
    """
    invalidateTranslationCache(articleId: ID!): Boolean!
  }

  """
  Subscriptions
  """
  type Subscription {
    """
    Subscribe to translation updates for an article
    """
    translationUpdated(articleId: ID!): ArticleTranslation!

    """
    Subscribe to translation statistics updates
    """
    translationStatsUpdated: TranslationStats!
  }

  """
  Custom scalar types
  """
  scalar DateTime
  scalar JSON
`;

export default translationTypeDefs;
