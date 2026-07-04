/**
 * Article Display Types
 * Sygn Platform - Task 21 Implementation
 */

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string;
  author: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    colorHex?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  status: ArticleStatus;
  priority: ArticlePriority;
  isPremium: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  translations: ArticleTranslation[];
}

export interface ArticleTranslation {
  id: string;
  articleId: string;
  languageCode: string;
  title: string;
  excerpt: string;
  content: string;
  translationStatus: TranslationStatus;
  aiGenerated: boolean;
  humanReviewed: boolean;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED'
}

export enum ArticlePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  BREAKING = 'BREAKING'
}

export enum TranslationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED'
}

// Language support for African markets
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', isRTL: false },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', isRTL: false },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', isRTL: false },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', isRTL: false },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', isRTL: false },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', isRTL: false },
  { code: 'zu', name: 'Zulu', nativeName: 'IsiZulu', flag: '🇿🇦', isRTL: false },
  { code: 'xh', name: 'Xhosa', nativeName: 'IsiXhosa', flag: '🇿🇦', isRTL: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇦🇴', isRTL: false },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', isRTL: false },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷', isRTL: false },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼', isRTL: false },
];

// Social sharing platforms focused on African markets
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  baseUrl: string;
  popular: boolean;
  regions: string[];
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    baseUrl: 'https://wa.me/?text=',
    popular: true,
    regions: ['africa', 'global']
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    baseUrl: 'https://t.me/share/url?url=',
    popular: true,
    regions: ['africa', 'global']
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    baseUrl: 'https://twitter.com/intent/tweet?text=',
    popular: true,
    regions: ['global']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    baseUrl: 'https://www.facebook.com/sharer/sharer.php?u=',
    popular: true,
    regions: ['africa', 'global']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    baseUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=',
    popular: false,
    regions: ['global']
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🔴',
    baseUrl: 'https://reddit.com/submit?url=',
    popular: false,
    regions: ['global']
  }
];

// Article display settings
export interface ArticleDisplaySettings {
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
  showTranslationQuality: boolean;
  enableAutoTranslate: boolean;
  preferredRegion: string;
}

// Reading progress tracking
export interface ReadingProgress {
  articleId: string;
  progressPercentage: number;
  timeSpent: number;
  lastPosition: number;
  completed: boolean;
  updatedAt: string;
}