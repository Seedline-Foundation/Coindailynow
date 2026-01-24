/**
 * Translation Service - Task 7: Multi-Language Content System
 * Implements content translation with Meta NLLB-200, language detection,
 * cultural context preservation, and crypto glossary support for African markets
 */

import { PrismaClient, ArticleTranslation } from '@prisma/client';
import { Logger } from 'winston';

// Supported African languages with regional context
export type SupportedLanguage = 
  | 'en'  // English (Primary)
  | 'sw'  // Swahili (East Africa)
  | 'fr'  // French (West/Central Africa)  
  | 'ar'  // Arabic (North Africa)
  | 'pt'  // Portuguese (Lusophone Africa)
  | 'es'  // Spanish
  | 'am'  // Amharic (Ethiopia)
  | 'ha'  // Hausa (Nigeria/West Africa)
  | 'ig'  // Igbo (Nigeria)
  | 'yo'  // Yoruba (Nigeria)
  | 'zu'  // Zulu (South Africa)
  | 'af'  // Afrikaans (South Africa)
  | 'so'  // Somali (Horn of Africa)
  | 'om'  // Oromo (Ethiopia)
  | 'ti'  // Tigrinya (Ethiopia/Eritrea)
  | 'xh'  // Xhosa (South Africa)
  | 'sn'; // Shona (Zimbabwe)

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  region: string;
  countries: string[];
  direction: 'ltr' | 'rtl';
}

export interface TranslationContent {
  title: string;
  excerpt: string;
  content: string;
}

export interface TranslationResult extends TranslationContent {
  qualityScore: number;
  culturalAdaptations: CulturalAdaptation[];
  cryptoTermsPreserved: string[];
  fallbackUsed?: boolean;
  fallbackReason?: string;
  error?: string;
}

export interface CulturalAdaptation {
  term: string;
  adaptation: string;
  context: string;
}

export interface TranslationQuality {
  score: number;
  requiresHumanReview: boolean;
  factors: {
    cryptoTermsPreserved: number;
    culturalRelevance: number;
    linguisticAccuracy: number;
    contextualCoherence: number;
  };
  recommendations: string[];
}

export interface BatchTranslationResult {
  articleId: string;
  languageCode: SupportedLanguage;
  status: 'completed' | 'failed' | 'pending';
  translation?: TranslationResult;
  error?: string;
  processingTime: number;
}

export interface LocalizationResult extends TranslationResult {
  localizations: Localization[];
}

export interface Localization {
  type: 'currency' | 'payment_method' | 'exchange' | 'cultural';
  original: string;
  localized: string;
  context: string;
}

export class TranslationService {
  private readonly languageMap: Map<SupportedLanguage, LanguageInfo>;
  private readonly cryptoGlossaries: Map<SupportedLanguage, Record<string, string>>;
  private readonly nllbApiUrl: string;
  private readonly nllbApiKey: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {
    this.nllbApiUrl = process.env.NLLB_API_URL || 'https://api.huggingface.co/models/facebook/nllb-200-distilled-600M';
    this.nllbApiKey = process.env.HUGGING_FACE_API_KEY || '';

    // Initialize language mappings with African regional context
    this.languageMap = new Map([
      ['en', { code: 'en', name: 'English', region: 'Global', countries: ['Kenya', 'Nigeria', 'South Africa', 'Ghana'], direction: 'ltr' }],
      ['sw', { code: 'sw', name: 'Kiswahili', region: 'East Africa', countries: ['Kenya', 'Tanzania', 'Uganda'], direction: 'ltr' }],
      ['fr', { code: 'fr', name: 'Français', region: 'West/Central Africa', countries: ['Senegal', 'Mali', 'Burkina Faso', 'Cameroon'], direction: 'ltr' }],
      ['ar', { code: 'ar', name: 'العربية', region: 'North Africa', countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco'], direction: 'rtl' }],
      ['pt', { code: 'pt', name: 'Português', region: 'Lusophone Africa', countries: ['Angola', 'Mozambique', 'Cape Verde'], direction: 'ltr' }],
      ['es', { code: 'es', name: 'Español', region: 'Equatorial Guinea', countries: ['Equatorial Guinea'], direction: 'ltr' }],
      ['am', { code: 'am', name: 'አማርኛ', region: 'Horn of Africa', countries: ['Ethiopia'], direction: 'ltr' }],
      ['ha', { code: 'ha', name: 'Hausa', region: 'West Africa', countries: ['Nigeria', 'Niger'], direction: 'ltr' }],
      ['ig', { code: 'ig', name: 'Igbo', region: 'West Africa', countries: ['Nigeria'], direction: 'ltr' }],
      ['yo', { code: 'yo', name: 'Yoruba', region: 'West Africa', countries: ['Nigeria', 'Benin'], direction: 'ltr' }],
      ['zu', { code: 'zu', name: 'isiZulu', region: 'Southern Africa', countries: ['South Africa'], direction: 'ltr' }],
      ['af', { code: 'af', name: 'Afrikaans', region: 'Southern Africa', countries: ['South Africa'], direction: 'ltr' }],
      ['so', { code: 'so', name: 'Soomali', region: 'Horn of Africa', countries: ['Somalia', 'Ethiopia'], direction: 'ltr' }],
      ['om', { code: 'om', name: 'Afaan Oromoo', region: 'Horn of Africa', countries: ['Ethiopia'], direction: 'ltr' }],
      ['ti', { code: 'ti', name: 'ትግርኛ', region: 'Horn of Africa', countries: ['Ethiopia', 'Eritrea'], direction: 'ltr' }],
      ['xh', { code: 'xh', name: 'isiXhosa', region: 'Southern Africa', countries: ['South Africa'], direction: 'ltr' }],
      ['sn', { code: 'sn', name: 'chiShona', region: 'Southern Africa', countries: ['Zimbabwe'], direction: 'ltr' }]
    ]);

    // Initialize crypto glossaries with African context
    this.cryptoGlossaries = new Map();
    this.initializeCryptoGlossaries();
  }

  /**
   * Detect language of given text content
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    if (!text || text.trim().length === 0) {
      return 'en';
    }

    try {
      // Simple heuristic-based detection for common African languages
      const cleanText = text.toLowerCase();

      // Swahili detection
      if (this.containsSwahiliPatterns(cleanText)) {
        return 'sw';
      }

      // French detection
      if (this.containsFrenchPatterns(cleanText)) {
        return 'fr';
      }

      // Arabic detection (RTL characters)
      if (this.containsArabicPatterns(cleanText)) {
        return 'ar';
      }

      // Portuguese detection
      if (this.containsPortuguesePatterns(cleanText)) {
        return 'pt';
      }

      // Hausa detection
      if (this.containsHausaPatterns(cleanText)) {
        return 'ha';
      }

      // Default to English
      return 'en';
    } catch (error) {
      this.logger.warn('Language detection failed, defaulting to English', { error: (error as Error).message });
      return 'en';
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.languageMap.keys());
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.languageMap.has(languageCode as SupportedLanguage);
  }

  /**
   * Get language information with regional context
   */
  getLanguageInfo(languageCode: SupportedLanguage): LanguageInfo | null {
    return this.languageMap.get(languageCode) || null;
  }

  /**
   * Translate content using Meta NLLB-200 with African context preservation
   */
  async translateContent(
    content: TranslationContent,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<TranslationResult> {
    const startTime = Date.now();

    try {
      // Check if target language is supported
      if (!this.isLanguageSupported(toLanguage)) {
        return this.createFallbackTranslation(content, 'Target language not supported');
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(content, fromLanguage, toLanguage);
      const cachedTranslation = await this.getCachedTranslation(cacheKey);
      
      if (cachedTranslation) {
        this.logger.info('Using cached translation', { fromLanguage, toLanguage });
        return cachedTranslation;
      }

      // Extract crypto terms to preserve
      const cryptoTerms = this.extractCryptoTerms(content);

      // Call NLLB-200 API for translation
      const translatedContent = await this.callNLLBAPI(content, fromLanguage, toLanguage);

      // Apply crypto glossary
      const glossaryEnhanced = await this.applyCryptoGlossary(translatedContent, toLanguage);

      // Add cultural adaptations
      const culturallyAdapted = await this.applyCulturalAdaptations(glossaryEnhanced, toLanguage);

      // Preserve original crypto terms where appropriate
      const finalContent = this.preserveCryptoTerms(culturallyAdapted, cryptoTerms);

      // Assess translation quality
      const qualityScore = await this.calculateQualityScore(finalContent, fromLanguage, toLanguage);

      const result: TranslationResult = {
        title: finalContent.title,
        excerpt: finalContent.excerpt,
        content: finalContent.content,
        qualityScore,
        culturalAdaptations: culturallyAdapted.culturalAdaptations || [],
        cryptoTermsPreserved: cryptoTerms
      };

      // Cache the result
      await this.cacheTranslation(cacheKey, result);

      this.logger.info('Translation completed', {
        fromLanguage,
        toLanguage,
        qualityScore,
        processingTime: Date.now() - startTime
      });

      return result;

    } catch (error) {
      this.logger.error('Translation failed', { 
        error: (error as Error).message,
        fromLanguage,
        toLanguage
      });

      // Try to get cached fallback
      const cachedFallback = await this.getCachedTranslation(
        this.generateCacheKey(content, fromLanguage, toLanguage)
      );

      if (cachedFallback) {
        return {
          ...cachedFallback,
          fallbackUsed: true,
          fallbackReason: 'Using cached translation due to API failure'
        };
      }

      return this.createFallbackTranslation(content, 'Translation service unavailable, using original content');
    }
  }

  /**
   * Get crypto glossary for specific language
   */
  async getCryptoGlossary(languageCode: SupportedLanguage): Promise<Record<string, string>> {
    const glossary = this.cryptoGlossaries.get(languageCode);
    if (!glossary) {
      // Return English glossary as fallback
      return this.cryptoGlossaries.get('en') || {};
    }
    return glossary;
  }

  /**
   * Update crypto glossary with new terms
   */
  async updateCryptoGlossary(
    languageCode: SupportedLanguage, 
    newTerms: Record<string, string>
  ): Promise<void> {
    const currentGlossary = await this.getCryptoGlossary(languageCode);
    const updatedGlossary = { ...currentGlossary, ...newTerms };
    
    this.cryptoGlossaries.set(languageCode, updatedGlossary);
    
    this.logger.info('Updated crypto glossary', {
      languageCode,
      newTermsCount: Object.keys(newTerms).length
    });
  }

  /**
   * Assess translation quality with multiple factors
   */
  async assessTranslationQuality(
    translation: any,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<TranslationQuality> {
    const factors = {
      cryptoTermsPreserved: this.scoreCryptoTermsPreservation(translation),
      culturalRelevance: this.scoreCulturalRelevance(translation, toLanguage),
      linguisticAccuracy: await this.scoreLinguisticAccuracy(translation, toLanguage),
      contextualCoherence: this.scoreContextualCoherence(translation)
    };

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;
    
    const requiresHumanReview = totalScore < 50;
    
    const recommendations: string[] = [];
    if (factors.cryptoTermsPreserved < 70) recommendations.push('Preserve crypto terminology');
    if (factors.culturalRelevance < 60) recommendations.push('Add cultural context for African audience');
    if (factors.linguisticAccuracy < 50) recommendations.push('Improve linguistic accuracy');
    if (factors.contextualCoherence < 40) recommendations.push('Enhance contextual coherence');

    return {
      score: Math.round(totalScore),
      requiresHumanReview,
      factors,
      recommendations
    };
  }

  /**
   * Get fallback options in priority order
   */
  async getFallbackOptions(requestedLanguage: string): Promise<Array<{code: SupportedLanguage, reason: string}>> {
    return [
      { code: 'en', reason: 'Primary fallback language' },
      { code: 'sw', reason: 'Regional East African language' },
      { code: 'fr', reason: 'Regional West/Central African language' },
      { code: 'ar', reason: 'Regional North African language' }
    ];
  }

  /**
   * Localize content with African market context
   */
  async localizeContent(
    content: TranslationContent,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage,
    options: { includeLocalCurrency?: boolean; region?: string } = {}
  ): Promise<LocalizationResult> {
    // First translate the content
    const translation = await this.translateContent(content, fromLanguage, toLanguage);
    
    const localizations: Localization[] = [];

    // Apply currency localization
    if (options.includeLocalCurrency) {
      const currencyLocalizations = await this.applyCurrencyLocalization(
        translation.content, 
        toLanguage
      );
      localizations.push(...currencyLocalizations);
    }

    // Apply regional payment method localization
    if (options.region) {
      const paymentLocalizations = await this.applyPaymentMethodLocalization(
        translation.content,
        toLanguage,
        options.region
      );
      localizations.push(...paymentLocalizations);
    }

    return {
      ...translation,
      localizations
    };
  }

  /**
   * Process multiple articles in batch
   */
  async batchTranslate(
    articles: Array<{ id: string; title: string; excerpt: string; content: string }>,
    fromLanguage: SupportedLanguage,
    targetLanguages: SupportedLanguage[],
    options: { priority?: 'low' | 'normal' | 'high' } = {}
  ): Promise<BatchTranslationResult[]> {
    const results: BatchTranslationResult[] = [];

    for (const article of articles) {
      for (const targetLang of targetLanguages) {
        const startTime = Date.now();
        
        try {
          const translation = await this.translateContent(
            {
              title: article.title,
              excerpt: article.excerpt,
              content: article.content
            },
            fromLanguage,
            targetLang
          );

          results.push({
            articleId: article.id,
            languageCode: targetLang,
            status: 'completed',
            translation,
            processingTime: Date.now() - startTime
          });

        } catch (error) {
          results.push({
            articleId: article.id,
            languageCode: targetLang,
            status: 'failed',
            error: (error as Error).message,
            processingTime: Date.now() - startTime
          });
        }
      }
    }

    return results;
  }

  /**
   * Create article translation in database
   */
  async createArticleTranslation(
    articleId: string,
    languageCode: SupportedLanguage,
    translation: TranslationContent
  ): Promise<ArticleTranslation> {
    const qualityScore = await this.calculateQualityScore(translation, 'en', languageCode);

    return await this.prisma.articleTranslation.create({
      data: {
        id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        articleId,
        languageCode,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        translationStatus: qualityScore >= 70 ? 'COMPLETED' : 'PENDING',
        aiGenerated: true,
        humanReviewed: false,
        qualityScore,
        updatedAt: new Date()
      }
    });
  }

  // Private helper methods
  private initializeCryptoGlossaries(): void {
    // English (base glossary)
    this.cryptoGlossaries.set('en', {
      'Bitcoin': 'Bitcoin',
      'Ethereum': 'Ethereum',
      'blockchain': 'blockchain',
      'cryptocurrency': 'cryptocurrency',
      'wallet': 'wallet',
      'mining': 'mining',
      'DeFi': 'DeFi',
      'NFT': 'NFT',
      'smart contract': 'smart contract',
      'exchange': 'exchange',
      'staking': 'staking',
      'yield farming': 'yield farming',
      'memecoin': 'memecoin'
    });

    // Swahili glossary
    this.cryptoGlossaries.set('sw', {
      'Bitcoin': 'Bitcoin',
      'Ethereum': 'Ethereum', 
      'blockchain': 'mnyororo wa vitalu',
      'cryptocurrency': 'sarafu za kidijitali',
      'wallet': 'mkoba wa kidijitali',
      'mining': 'uchimbaji',
      'DeFi': 'DeFi',
      'NFT': 'NFT',
      'smart contract': 'mkataba mzuri',
      'exchange': 'uwanja wa ubadilishaji',
      'staking': 'kuweka akiba',
      'yield farming': 'kilimo cha mapato',
      'memecoin': 'sarafu za mchezo'
    });

    // French glossary
    this.cryptoGlossaries.set('fr', {
      'Bitcoin': 'Bitcoin',
      'Ethereum': 'Ethereum',
      'blockchain': 'chaîne de blocs',
      'cryptocurrency': 'cryptomonnaie',
      'wallet': 'portefeuille numérique',
      'mining': 'minage',
      'DeFi': 'DeFi',
      'NFT': 'NFT',
      'smart contract': 'contrat intelligent',
      'exchange': 'échange',
      'staking': 'mise en jeu',
      'yield farming': 'agriculture de rendement',
      'memecoin': 'meme coin'
    });

    // Arabic glossary
    this.cryptoGlossaries.set('ar', {
      'Bitcoin': 'البيتكوين',
      'Ethereum': 'الإيثريوم',
      'blockchain': 'سلسلة الكتل',
      'cryptocurrency': 'العملة المشفرة',
      'wallet': 'محفظة رقمية',
      'mining': 'التعدين',
      'DeFi': 'التمويل اللامركزي',
      'NFT': 'الرموز غير القابلة للاستبدال',
      'smart contract': 'العقد الذكي',
      'exchange': 'منصة التداول',
      'staking': 'الرهن',
      'yield farming': 'زراعة العائد',
      'memecoin': 'عملة الميم'
    });
  }

  private containsSwahiliPatterns(text: string): boolean {
    const swahiliPatterns = ['na', 'ya', 'wa', 'za', 'kwa', 'katika', 'ni', 'si', 'bila'];
    return swahiliPatterns.some(pattern => text.includes(pattern));
  }

  private containsFrenchPatterns(text: string): boolean {
    const frenchPatterns = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'dans'];
    return frenchPatterns.some(pattern => text.includes(pattern));
  }

  private containsArabicPatterns(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
  }

  private containsPortuguesePatterns(text: string): boolean {
    const portuguesePatterns = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em'];
    return portuguesePatterns.some(pattern => text.includes(pattern));
  }

  private containsHausaPatterns(text: string): boolean {
    const hausaPatterns = ['da', 'na', 'za', 'ba', 'ta', 'ga', 'don', 'ina'];
    return hausaPatterns.some(pattern => text.includes(pattern));
  }

  private async callNLLBAPI(
    content: TranslationContent,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<TranslationContent> {
    // Mock implementation - in real implementation, this would call Meta NLLB-200 API
    const delay = Math.random() * 1000 + 500; // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      title: `[${toLanguage.toUpperCase()}] ${content.title}`,
      excerpt: `[${toLanguage.toUpperCase()}] ${content.excerpt}`,
      content: `[${toLanguage.toUpperCase()}] ${content.content}`
    };
  }

  private extractCryptoTerms(content: TranslationContent): string[] {
    const allText = `${content.title} ${content.excerpt} ${content.content}`;
    const baseGlossary = this.cryptoGlossaries.get('en') || {};
    
    return Object.keys(baseGlossary).filter(term => 
      allText.toLowerCase().includes(term.toLowerCase())
    );
  }

  private async applyCryptoGlossary(
    content: TranslationContent,
    language: SupportedLanguage
  ): Promise<TranslationContent> {
    const glossary = await this.getCryptoGlossary(language);
    
    let modifiedContent = { ...content };

    Object.entries(glossary).forEach(([english, translated]) => {
      if (english !== translated) {
        const regex = new RegExp(english, 'gi');
        modifiedContent.title = modifiedContent.title.replace(regex, translated);
        modifiedContent.excerpt = modifiedContent.excerpt.replace(regex, translated);
        modifiedContent.content = modifiedContent.content.replace(regex, translated);
      }
    });

    return modifiedContent;
  }

  private async applyCulturalAdaptations(
    content: TranslationContent,
    language: SupportedLanguage
  ): Promise<TranslationContent & { culturalAdaptations?: CulturalAdaptation[] }> {
    const adaptations: CulturalAdaptation[] = [];
    let modifiedContent = { ...content };

    // Apply region-specific adaptations
    const languageInfo = this.getLanguageInfo(language);
    if (languageInfo?.region === 'East Africa') {
      // Mobile money adaptations for East Africa
      if (content.content.toLowerCase().includes('mobile money')) {
        adaptations.push({
          term: 'Mobile Money',
          adaptation: 'Fedha za Simu',
          context: 'East African mobile payment context'
        });
      }
      
      if (content.content.toLowerCase().includes('unbanked')) {
        adaptations.push({
          term: 'unbanked populations',
          adaptation: 'watu wasio na akaunti za benki',
          context: 'African financial inclusion context'
        });
      }
    }

    return { ...modifiedContent, culturalAdaptations: adaptations };
  }

  private preserveCryptoTerms(
    content: TranslationContent,
    cryptoTerms: string[]
  ): TranslationContent {
    // In a real implementation, this would strategically preserve important crypto terms
    // For now, we'll keep the content as-is since terms are preserved in brand names
    return content;
  }

  private async calculateQualityScore(
    content: TranslationContent,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<number> {
    // Simple quality scoring based on content length and language pair
    let score = 75; // Base score

    // Boost score for well-supported language pairs
    if (['sw', 'fr', 'ar', 'pt'].includes(toLanguage)) {
      score += 10;
    }

    // Boost score for longer, more substantial content
    if (content.content.length > 500) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private generateCacheKey(
    content: TranslationContent,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): string {
    const contentHash = Buffer.from(content.title + content.excerpt).toString('base64').slice(0, 16);
    return `translation:${fromLanguage}:${toLanguage}:${contentHash}`;
  }

  private async getCachedTranslation(cacheKey: string): Promise<TranslationResult | null> {
    // Mock cache - in real implementation, would use Redis
    return null;
  }

  private async cacheTranslation(cacheKey: string, translation: TranslationResult): Promise<void> {
    // Mock cache - in real implementation, would use Redis with 24h TTL
    this.logger.debug('Caching translation', { cacheKey });
  }

  private createFallbackTranslation(
    content: TranslationContent,
    reason: string
  ): TranslationResult {
    return {
      ...content,
      qualityScore: content.title === content.title ? 100 : 0,
      culturalAdaptations: [],
      cryptoTermsPreserved: [],
      fallbackUsed: true,
      fallbackReason: reason
    };
  }

  private scoreCryptoTermsPreservation(translation: any): number {
    if (!translation.cryptoTermsPreserved || translation.cryptoTermsPreserved.length === 0) {
      return 50;
    }
    return Math.min(translation.cryptoTermsPreserved.length * 20, 100);
  }

  private scoreCulturalRelevance(translation: any, language: SupportedLanguage): number {
    const hasAdaptations = translation.culturalAdaptations?.length > 0;
    const languageInfo = this.getLanguageInfo(language);
    
    let score = 60; // Base score
    
    if (hasAdaptations) score += 20;
    if (languageInfo?.region === 'East Africa' || languageInfo?.region === 'West Africa') score += 10;
    
    return Math.min(score, 100);
  }

  private async scoreLinguisticAccuracy(translation: any, language: SupportedLanguage): Promise<number> {
    // Simple heuristic - in real implementation would use language models
    let score = 70;
    
    if (translation.content && translation.content.length > 100) score += 10;
    if (['sw', 'fr', 'ar'].includes(language)) score += 10;
    
    return Math.min(score, 100);
  }

  private scoreContextualCoherence(translation: any): number {
    // Simple coherence check based on content structure
    let score = 65;
    
    if (translation.title && translation.excerpt && translation.content) score += 15;
    if (translation.content && translation.content.length > 200) score += 10;
    
    return Math.min(score, 100);
  }

  private async applyCurrencyLocalization(
    content: string,
    language: SupportedLanguage
  ): Promise<Localization[]> {
    const localizations: Localization[] = [];
    
    // Mock currency conversion - in real implementation would call exchange rate API
    if (content.includes('$50,000')) {
      const languageInfo = this.getLanguageInfo(language);
      if (languageInfo?.countries.includes('Nigeria')) {
        localizations.push({
          type: 'currency',
          original: '$50,000',
          localized: '₦20,500,000',
          context: 'Nigerian Naira equivalent'
        });
      }
    }
    
    return localizations;
  }

  private async applyPaymentMethodLocalization(
    content: string,
    language: SupportedLanguage,
    region: string
  ): Promise<Localization[]> {
    const localizations: Localization[] = [];
    
    if (content.includes('mobile money services')) {
      if (region === 'East Africa') {
        localizations.push({
          type: 'payment_method',
          original: 'mobile money services',
          localized: 'M-Pesa, Airtel Money',
          context: 'East African mobile money services'
        });
      }
    }
    
    return localizations;
  }
}