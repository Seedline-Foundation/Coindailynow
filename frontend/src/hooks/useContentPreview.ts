/**
 * Content Preview Hook - Task 7.2
 * Custom React hook for managing article previews with caching
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ==================== TYPES ====================

export interface ArticleSummary {
  articleId: string;
  tldr: string;
  keyTakeaways: string[];
  readingTimeMinutes: number;
  generatedAt: Date;
  cacheExpiry: Date;
}

export interface TranslationPreview {
  articleId: string;
  languageCode: string;
  title: string;
  excerpt: string;
  content: string;
  qualityScore: number;
  qualityIndicator: 'high' | 'medium' | 'low';
  aiGenerated: boolean;
  humanReviewed: boolean;
  translationStatus: string;
  cachedAt?: Date;
}

export interface ContentQualityIndicators {
  articleId: string;
  aiConfidenceScore: number;
  factCheckStatus: 'verified' | 'pending' | 'unverified' | 'failed';
  humanReviewStatus: 'approved' | 'pending' | 'rejected' | 'not_required';
  contentQualityScore: number;
  qualityFactors: {
    accuracy: number;
    relevance: number;
    readability: number;
    sources: number;
  };
  indicators: Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    category: 'ai' | 'factcheck' | 'review' | 'quality';
  }>;
  lastUpdated: Date;
}

export interface ArticlePreviewData {
  article: any;
  summary: ArticleSummary;
  qualityIndicators: ContentQualityIndicators;
  availableLanguages: string[];
  currentTranslation?: TranslationPreview;
}

// ==================== API CLIENT ====================

class ContentPreviewAPI {
  private baseUrl: string;
  private cache: Map<string, { data: any; expiry: number }>;

  constructor(baseUrl: string = '/api/content-preview') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = 3600): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async getSummary(articleId: string): Promise<ArticleSummary> {
    const cacheKey = this.getCacheKey('summary', { articleId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/summary/${articleId}`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    
    const result = await response.json();
    this.setCache(cacheKey, result.data, 7200); // 2 hours
    return result.data;
  }

  async getTranslation(articleId: string, languageCode: string): Promise<TranslationPreview | null> {
    const cacheKey = this.getCacheKey('translation', { articleId, languageCode });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/translation/${articleId}/${languageCode}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch translation');
    
    const result = await response.json();
    this.setCache(cacheKey, result.data, 3600); // 1 hour
    return result.data;
  }

  async getAvailableLanguages(articleId: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('languages', { articleId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/languages/${articleId}`);
    if (!response.ok) throw new Error('Failed to fetch languages');
    
    const result = await response.json();
    this.setCache(cacheKey, result.data.languages, 3600);
    return result.data.languages;
  }

  async getQualityIndicators(articleId: string): Promise<ContentQualityIndicators> {
    const cacheKey = this.getCacheKey('quality', { articleId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.baseUrl}/quality/${articleId}`);
    if (!response.ok) throw new Error('Failed to fetch quality indicators');
    
    const result = await response.json();
    this.setCache(cacheKey, result.data, 300); // 5 minutes
    return result.data;
  }

  async getArticlePreview(articleId: string, languageCode?: string): Promise<ArticlePreviewData> {
    const cacheKey = this.getCacheKey('preview', { articleId, languageCode });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const url = languageCode
      ? `${this.baseUrl}/article/${articleId}?languageCode=${languageCode}`
      : `${this.baseUrl}/article/${articleId}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch article preview');
    
    const result = await response.json();
    this.setCache(cacheKey, result.data, 3600);
    return result.data;
  }

  async switchLanguage(
    articleId: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<TranslationPreview | null> {
    const response = await fetch(`${this.baseUrl}/switch-language`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, fromLanguage, toLanguage }),
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to switch language');
    
    const result = await response.json();
    return result.data;
  }

  async reportTranslationIssue(data: {
    articleId: string;
    languageCode: string;
    issueType: string;
    description: string;
    severity: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to report issue');
    return await response.json();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

const api = new ContentPreviewAPI();

// ==================== HOOKS ====================

/**
 * Hook for managing article preview data
 */
export function useArticlePreview(articleId: string, initialLanguage?: string) {
  const [preview, setPreview] = useState<ArticlePreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getArticlePreview(articleId, initialLanguage);
        setPreview(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [articleId, initialLanguage]);

  return { preview, isLoading, error };
}

/**
 * Hook for managing translation switching with instant cache responses
 */
export function useTranslationSwitcher(articleId: string, initialLanguage: string = 'en') {
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [translation, setTranslation] = useState<TranslationPreview | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load available languages
  useEffect(() => {
    if (!articleId) return;

    const fetchLanguages = async () => {
      try {
        const languages = await api.getAvailableLanguages(articleId);
        setAvailableLanguages(languages);
      } catch (err) {
        console.error('Failed to fetch languages:', err);
      }
    };

    fetchLanguages();
  }, [articleId]);

  // Load translation when language changes
  useEffect(() => {
    if (!articleId || !currentLanguage) return;

    const fetchTranslation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getTranslation(articleId, currentLanguage);
        setTranslation(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslation();
  }, [articleId, currentLanguage]);

  const switchLanguage = useCallback(
    async (newLanguage: string) => {
      if (newLanguage === currentLanguage) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get from cache first (instant response)
        const cachedTranslation = await api.getTranslation(articleId, newLanguage);
        
        if (cachedTranslation) {
          setCurrentLanguage(newLanguage);
          setTranslation(cachedTranslation);
          setIsLoading(false);
          
          // Track language switch in background
          api.switchLanguage(articleId, currentLanguage, newLanguage).catch(console.error);
        } else {
          // Not in cache, perform full switch
          const newTranslation = await api.switchLanguage(articleId, currentLanguage, newLanguage);
          setCurrentLanguage(newLanguage);
          setTranslation(newTranslation);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [articleId, currentLanguage]
  );

  const reportIssue = useCallback(
    async (issueData: {
      issueType: string;
      description: string;
      severity: string;
    }) => {
      try {
        await api.reportTranslationIssue({
          articleId,
          languageCode: currentLanguage,
          ...issueData,
        });
      } catch (err) {
        throw err;
      }
    },
    [articleId, currentLanguage]
  );

  return {
    currentLanguage,
    translation,
    availableLanguages,
    isLoading,
    error,
    switchLanguage,
    reportIssue,
  };
}

/**
 * Hook for managing content summary
 */
export function useArticleSummary(articleId: string) {
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getSummary(articleId);
        setSummary(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [articleId]);

  return { summary, isLoading, error };
}

/**
 * Hook for managing quality indicators
 */
export function useQualityIndicators(articleId: string) {
  const [indicators, setIndicators] = useState<ContentQualityIndicators | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchIndicators = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getQualityIndicators(articleId);
        setIndicators(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIndicators();
  }, [articleId]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getQualityIndicators(articleId);
      setIndicators(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  return { indicators, isLoading, error, refresh };
}

// Export API for direct use if needed
export { api as contentPreviewAPI };
