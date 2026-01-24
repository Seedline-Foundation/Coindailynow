/**
 * CMS Service - Frontend GraphQL operations for Content Management
 * Task 24: Content Management Interface
 */

import { gql } from '@apollo/client';

// Article Management Queries
export const GET_ARTICLE = gql`
  query GetArticle($id: ID, $slug: String) {
    article(id: $id, slug: $slug) {
      id
      slug
      title
      excerpt
      content
      status
      isPremium
      featuredImageUrl
      seoTitle
      seoDescription
      publishScheduledAt
      publishedAt
      readingTimeMinutes
      tags
      category {
        id
        name
        slug
      }
      author {
        id
        name
        email
      }
      workflowStatus {
        currentStep
        assignedReviewer {
          id
          name
        }
        lastAction
        actionDate
      }
      translations {
        id
        languageCode
        status
        title
        excerpt
        content
        createdAt
        updatedAt
      }
      engagementMetrics {
        views
        likes
        shares
        comments
        engagementRate
      }
      createdAt
      updatedAt
      canEdit
      hasPendingTranslations
    }
  }
`;

export const GET_ARTICLES = gql`
  query GetArticles($filter: ArticleFilterInput, $pagination: PaginationInput) {
    articles(filter: $filter, pagination: $pagination) {
      id
      slug
      title
      excerpt
      status
      isPremium
      featuredImageUrl
      publishedAt
      readingTimeMinutes
      tags
      category {
        id
        name
      }
      author {
        id
        name
      }
      workflowStatus {
        currentStep
        lastAction
        actionDate
      }
      engagementMetrics {
        views
        likes
        engagementRate
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
      articlesCount
    }
  }
`;

export const GET_WORKFLOWS = gql`
  query GetWorkflows($filter: WorkflowFilterInput, $pagination: WorkflowPaginationInput) {
    workflows(filter: $filter, pagination: $pagination) {
      id
      articleId
      workflowType
      currentState
      previousState
      priority
      assignedReviewerId
      completionPercentage
      estimatedCompletionAt
      actualCompletionAt
      errorMessage
      retryCount
      maxRetries
      createdAt
      updatedAt
      article {
        id
        title
        status
        author {
          id
          name
        }
      }
      assignedReviewer {
        id
        name
      }
      steps {
        id
        stepName
        stepOrder
        status
        assigneeId
        startedAt
        completedAt
        estimatedDurationMs
        actualDurationMs
        errorMessage
        metadata
      }
    }
  }
`;

export const GET_USER_MEDIA = gql`
  query GetUserMedia($userId: ID!, $pagination: PaginationInput) {
    userMedia(userId: $userId, pagination: $pagination) {
      id
      filename
      originalName
      mimeType
      size
      url
      thumbnailUrl
      dimensions {
        width
        height
      }
      uploadedAt
    }
  }
`;

// Article Management Mutations
export const CREATE_ARTICLE_MUTATION = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      slug
      title
      excerpt
      content
      status
      isPremium
      featuredImageUrl
      readingTimeMinutes
      tags
      category {
        id
        name
      }
      author {
        id
        name
      }
      workflowStatus {
        currentStep
        assignedReviewer {
          id
          name
        }
        lastAction
        actionDate
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ARTICLE_MUTATION = gql`
  mutation UpdateArticle($input: UpdateArticleInput!) {
    updateArticle(input: $input) {
      id
      slug
      title
      excerpt
      content
      status
      isPremium
      featuredImageUrl
      seoTitle
      seoDescription
      publishScheduledAt
      readingTimeMinutes
      tags
      category {
        id
        name
      }
      workflowStatus {
        currentStep
        assignedReviewer {
          id
          name
        }
        lastAction
        actionDate
      }
      translations {
        id
        languageCode
        status
        title
        excerpt
        content
      }
      updatedAt
    }
  }
`;

export const DELETE_ARTICLE_MUTATION = gql`
  mutation DeleteArticle($articleId: ID!) {
    deleteArticle(articleId: $articleId)
  }
`;

// Workflow Management Mutations
export const SUBMIT_ARTICLE_FOR_REVIEW_MUTATION = gql`
  mutation SubmitArticleForReview($articleId: ID!) {
    submitArticleForReview(articleId: $articleId) {
      id
      status
      workflowStatus {
        currentStep
        assignedReviewer {
          id
          name
        }
        lastAction
        actionDate
      }
    }
  }
`;

export const APPROVE_ARTICLE_MUTATION = gql`
  mutation ApproveArticle($articleId: ID!, $notes: String) {
    approveArticle(articleId: $articleId, notes: $notes) {
      id
      status
      workflowStatus {
        currentStep
        lastAction
        actionDate
      }
      publishedAt
    }
  }
`;

export const REJECT_ARTICLE_MUTATION = gql`
  mutation RejectArticle($articleId: ID!, $reason: String!) {
    rejectArticle(articleId: $articleId, reason: $reason) {
      id
      status
      workflowStatus {
        currentStep
        lastAction
        actionDate
      }
    }
  }
`;

export const PUBLISH_ARTICLE_MUTATION = gql`
  mutation PublishArticle($articleId: ID!) {
    publishArticle(articleId: $articleId) {
      id
      status
      publishedAt
      workflowStatus {
        currentStep
        lastAction
        actionDate
      }
    }
  }
`;

// Translation Management
export const CREATE_ARTICLE_TRANSLATION_MUTATION = gql`
  mutation CreateArticleTranslation(
    $articleId: ID!
    $languageCode: String!
    $translation: TranslationInput!
  ) {
    createArticleTranslation(
      articleId: $articleId
      languageCode: $languageCode
      translation: $translation
    ) {
      id
      languageCode
      status
      title
      excerpt
      content
      createdAt
    }
  }
`;

export const BATCH_TRANSLATE_ARTICLE_MUTATION = gql`
  mutation BatchTranslateArticle(
    $articleId: ID!
    $targetLanguages: [String!]!
    $options: TranslationOptionsInput
  ) {
    batchTranslateArticle(
      articleId: $articleId
      targetLanguages: $targetLanguages
      options: $options
    ) {
      jobId
      targetLanguages
      estimatedCompletionTime
      translations {
        languageCode
        status
        message
      }
    }
  }
`;

export const UPDATE_TRANSLATION_STATUS_MUTATION = gql`
  mutation UpdateTranslationStatus(
    $translationId: ID!
    $status: TranslationStatus!
    $reviewNotes: String
  ) {
    updateTranslationStatus(
      translationId: $translationId
      status: $status
      reviewNotes: $reviewNotes
    ) {
      id
      status
      reviewNotes
      updatedAt
    }
  }
`;

// Media Management
export const UPLOAD_MEDIA_MUTATION = gql`
  mutation UploadMedia($file: Upload!, $metadata: MediaMetadataInput) {
    uploadMedia(file: $file, metadata: $metadata) {
      id
      filename
      originalName
      mimeType
      size
      url
      thumbnailUrl
      dimensions {
        width
        height
      }
    }
  }
`;

// Workflow Engine Mutations
export const CREATE_WORKFLOW_MUTATION = gql`
  mutation CreateWorkflow($input: CreateWorkflowInput!) {
    createWorkflow(input: $input) {
      id
      articleId
      workflowType
      currentState
      priority
      completionPercentage
      estimatedCompletionAt
      createdAt
      steps {
        id
        stepName
        stepOrder
        status
        estimatedDurationMs
      }
    }
  }
`;

export const TRANSITION_WORKFLOW_MUTATION = gql`
  mutation TransitionWorkflow($input: TransitionWorkflowInput!) {
    transitionWorkflow(input: $input) {
      id
      currentState
      previousState
      completionPercentage
      updatedAt
      steps {
        id
        stepName
        status
        completedAt
      }
    }
  }
`;

// TypeScript interfaces for the CMS service
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: string;
  isPremium: boolean;
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishScheduledAt?: string;
  publishedAt?: string;
  readingTimeMinutes: number;
  tags: string[];
  category: Category;
  author: User;
  workflowStatus: WorkflowStatus;
  translations: ArticleTranslation[];
  engagementMetrics: EngagementMetrics;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  hasPendingTranslations: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articlesCount?: number;
}

export interface WorkflowStatus {
  currentStep: string;
  assignedReviewer?: User;
  lastAction: string;
  actionDate: string;
}

export interface ArticleTranslation {
  id: string;
  languageCode: string;
  status: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
}

export interface EngagementMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
}

export interface ContentWorkflow {
  id: string;
  articleId: string;
  workflowType: string;
  currentState: string;
  previousState?: string;
  priority: string;
  assignedReviewerId?: string;
  completionPercentage: number;
  estimatedCompletionAt?: string;
  actualCompletionAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  article: Article;
  assignedReviewer?: User;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  stepName: string;
  stepOrder: number;
  status: string;
  assigneeId?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDurationMs: number;
  actualDurationMs?: number;
  errorMessage?: string;
  metadata?: any;
}

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
}

export interface CreateArticleInput {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  isPremium: boolean;
  featuredImageUrl?: string;
  publishScheduledAt?: string;
}

export interface UpdateArticleInput {
  id: string;
  title?: string;
  excerpt?: string;
  content?: string;
  categoryId?: string;
  tags?: string[];
  isPremium?: boolean;
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishScheduledAt?: string;
}

export interface TranslationInput {
  title: string;
  excerpt: string;
  content: string;
}

export interface TranslationOptionsInput {
  requiresHumanReview?: boolean;
  enableCulturalAdaptation?: boolean;
  enableCryptoGlossary?: boolean;
  includeLocalCurrency?: boolean;
  region?: string;
}

export interface BatchTranslationResponse {
  jobId: string;
  targetLanguages: string[];
  estimatedCompletionTime: string;
  translations: {
    languageCode: string;
    status: string;
    message?: string;
  }[];
}

export interface ArticleFilterInput {
  status?: string[];
  authorId?: string;
  categoryId?: string;
  isPremium?: boolean;
  tags?: string[];
  search?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface WorkflowFilterInput {
  status?: string[];
  authorId?: string;
  reviewerId?: string;
  priority?: string[];
  workflowType?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// African language support
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇦🇴' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];