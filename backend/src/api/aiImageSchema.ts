/**
 * AI Image GraphQL Schema
 * TASK 8.2: AI-Generated Visuals
 */

import { gql } from 'apollo-server-express';

export const aiImageSchema = gql`
  # ============================================================
  # AI IMAGE TYPES
  # ============================================================

  """
  AI-generated image for articles
  """
  type ArticleImage {
    id: ID!
    articleId: ID!
    imageType: ImageType!
    imageUrl: String!
    thumbnailUrl: String
    altText: String!
    caption: String
    
    # AI Generation Metadata
    aiGenerated: Boolean!
    generationPrompt: String
    revisedPrompt: String
    dalleModel: String
    
    # Image Properties
    width: Int
    height: Int
    format: String
    size: Int
    quality: String
    
    # Optimization
    isOptimized: Boolean!
    optimizedUrl: String
    webpUrl: String
    avifUrl: String
    placeholderBase64: String
    
    # SEO & Performance
    seoKeywords: [String!]
    loadingPriority: LoadingPriority!
    aspectRatio: String
    focalPointX: Float
    focalPointY: Float
    
    # Chart-specific
    chartType: ChartType
    chartData: JSON
    chartSymbol: String
    
    # Usage Tracking
    viewCount: Int!
    downloadCount: Int!
    
    # Status
    status: ImageStatus!
    processingStatus: ProcessingStatus!
    errorMessage: String
    
    # Metadata
    metadata: JSON
    expiresAt: DateTime
    
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relations
    article: Article
  }

  """
  Market chart visualization
  """
  type MarketChart {
    id: ID!
    symbol: String!
    chartType: ChartType!
    timeframe: String!
    imageUrl: String!
    thumbnailUrl: String
    altText: String!
    width: Int
    height: Int
    theme: String
    metadata: JSON
    createdAt: DateTime!
  }

  """
  Image generation result
  """
  type ImageGenerationResult {
    id: ID!
    imageUrl: String!
    thumbnailUrl: String
    altText: String!
    width: Int
    height: Int
    format: String
    size: Int
    metadata: JSON
  }

  """
  Image type information
  """
  type ImageTypeInfo {
    type: ImageType!
    description: String!
    recommendedSize: String!
    aspectRatio: String!
    loadingPriority: LoadingPriority!
  }

  # ============================================================
  # ENUMS
  # ============================================================

  enum ImageType {
    FEATURED
    THUMBNAIL
    CHART
    SOCIAL
    GALLERY
    INFOGRAPHIC
  }

  enum ImageStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum ProcessingStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
  }

  enum LoadingPriority {
    EAGER
    LAZY
    AUTO
  }

  enum ChartType {
    LINE
    BAR
    PIE
    CANDLESTICK
  }

  enum ImageQuality {
    STANDARD
    HD
  }

  enum ImageStyle {
    PROFESSIONAL
    MODERN
    MINIMALIST
    VIBRANT
  }

  # ============================================================
  # INPUTS
  # ============================================================

  """
  Input for generating a new image
  """
  input GenerateImageInput {
    articleId: ID!
    type: ImageType!
    prompt: String
    keywords: [String!]
    size: String
    quality: ImageQuality
    style: ImageStyle
  }

  """
  Input for generating market chart
  """
  input GenerateChartInput {
    symbol: String!
    type: ChartType!
    timeframe: String
    width: Int
    height: Int
    theme: String
  }

  """
  Filter for querying images
  """
  input ArticleImageFilter {
    articleId: ID
    imageType: ImageType
    status: ImageStatus
    processingStatus: ProcessingStatus
    aiGenerated: Boolean
  }

  # ============================================================
  # QUERIES
  # ============================================================

  extend type Query {
    """
    Get all images for an article
    """
    articleImages(
      articleId: ID!
      imageType: ImageType
    ): [ArticleImage!]!

    """
    Get a specific image by ID
    """
    articleImage(id: ID!): ArticleImage

    """
    Get market chart visualization
    """
    marketChart(
      symbol: String!
      type: ChartType!
      timeframe: String
    ): MarketChart

    """
    Get available image types
    """
    availableImageTypes: [ImageTypeInfo!]!

    """
    Search images across articles
    """
    searchImages(
      filter: ArticleImageFilter!
      limit: Int
      offset: Int
    ): [ArticleImage!]!
  }

  # ============================================================
  # MUTATIONS
  # ============================================================

  extend type Mutation {
    """
    Generate a new AI image for an article
    """
    generateArticleImage(
      input: GenerateImageInput!
    ): ImageGenerationResult!

    """
    Generate market chart
    """
    generateMarketChart(
      input: GenerateChartInput!
    ): MarketChart!

    """
    Delete (archive) an image
    """
    deleteArticleImage(id: ID!): ArticleImage!

    """
    Update image alt text and SEO keywords
    """
    updateImageSEO(
      id: ID!
      altText: String
      keywords: [String!]
    ): ArticleImage!
  }

  # ============================================================
  # SUBSCRIPTIONS
  # ============================================================

  extend type Subscription {
    """
    Subscribe to image generation progress
    """
    imageGenerationProgress(articleId: ID!): ImageGenerationProgress!
  }

  """
  Image generation progress update
  """
  type ImageGenerationProgress {
    articleId: ID!
    status: ProcessingStatus!
    progress: Int!
    message: String
    imageUrl: String
  }

  # ============================================================
  # CUSTOM SCALARS
  # ============================================================

  scalar DateTime
  scalar JSON
`;

export default aiImageSchema;
