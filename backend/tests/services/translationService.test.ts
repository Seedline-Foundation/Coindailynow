/**
 * Translation Service Tests - Task 7: Multi-Language Content System
 * TDD Requirements: Translation tests, language detection tests, fallback tests
 */

import { TranslationService, SupportedLanguage, TranslationQuality } from '../../src/services/translationService';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

// Mock the external dependencies
jest.mock('@prisma/client');
jest.mock('winston');

describe('TranslationService - Task 7: Multi-Language Content System', () => {
  let translationService: TranslationService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    translationService = new TranslationService(mockPrisma, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Language Detection', () => {
    test('should detect English language correctly', async () => {
      const text = 'Bitcoin reaches new all-time high above $60,000';
      const detectedLanguage = await translationService.detectLanguage(text);
      
      expect(detectedLanguage).toBe('en');
    });

    test('should detect Swahili language correctly', async () => {
      const text = 'Bitcoin inafika kiwango kipya cha juu kabisa';
      const detectedLanguage = await translationService.detectLanguage(text);
      
      expect(detectedLanguage).toBe('sw');
    });

    test('should detect French language correctly', async () => {
      const text = 'Bitcoin atteint un nouveau sommet historique';
      const detectedLanguage = await translationService.detectLanguage(text);
      
      expect(detectedLanguage).toBe('fr');
    });

    test('should fallback to English for unknown content', async () => {
      const text = '12345 !@#$%';
      const detectedLanguage = await translationService.detectLanguage(text);
      
      expect(detectedLanguage).toBe('en');
    });

    test('should handle empty text gracefully', async () => {
      const detectedLanguage = await translationService.detectLanguage('');
      
      expect(detectedLanguage).toBe('en');
    });
  });

  describe('African Language Support', () => {
    test('should support all 15+ required African languages', () => {
      const supportedLanguages = translationService.getSupportedLanguages();
      
      const expectedLanguages: SupportedLanguage[] = [
        'en', 'sw', 'fr', 'ar', 'pt', 'es', 'am', 'ha', 'ig', 'yo', 
        'zu', 'af', 'so', 'om', 'ti', 'xh', 'sn'
      ];
      
      expectedLanguages.forEach(lang => {
        expect(supportedLanguages).toContain(lang);
      });
      
      expect(supportedLanguages.length).toBeGreaterThanOrEqual(15);
    });

    test('should validate supported language codes', () => {
      expect(translationService.isLanguageSupported('sw')).toBe(true);
      expect(translationService.isLanguageSupported('fr')).toBe(true);
      expect(translationService.isLanguageSupported('ar')).toBe(true);
      expect(translationService.isLanguageSupported('xyz')).toBe(false);
    });

    test('should get language display names with regional context', () => {
      const swahiliInfo = translationService.getLanguageInfo('sw');
      expect(swahiliInfo).toEqual({
        code: 'sw',
        name: 'Kiswahili',
        region: 'East Africa',
        countries: ['Kenya', 'Tanzania', 'Uganda'],
        direction: 'ltr'
      });

      const arabicInfo = translationService.getLanguageInfo('ar');
      expect(arabicInfo).toEqual({
        code: 'ar',
        name: 'العربية',
        region: 'North Africa',
        countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco'],
        direction: 'rtl'
      });
    });
  });

  describe('Content Translation with Meta NLLB-200', () => {
    test('should translate article content from English to Swahili', async () => {
      const content = {
        title: 'Bitcoin Reaches New Heights in Kenya',
        excerpt: 'Cryptocurrency adoption grows in East Africa',
        content: 'Bitcoin has reached unprecedented levels in Kenya as more traders embrace cryptocurrency trading through local exchanges like Binance Africa.'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'sw'
      );

      expect(translation).toEqual({
        title: expect.any(String),
        excerpt: expect.any(String),
        content: expect.any(String),
        qualityScore: expect.any(Number),
        culturalAdaptations: expect.any(Array),
        cryptoTermsPreserved: expect.any(Array)
      });

      expect(translation.qualityScore).toBeGreaterThan(70);
      expect(translation.cryptoTermsPreserved).toContain('Bitcoin');
    });

    test('should preserve crypto terminology during translation', async () => {
      const content = {
        title: 'DeFi and NFTs Transform African Markets',
        excerpt: 'Blockchain technology revolutionizes finance',
        content: 'DeFi protocols and NFT marketplaces are gaining traction across African countries, with smart contracts enabling new financial products.'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'fr'
      );

      expect(translation.cryptoTermsPreserved).toEqual([
        'DeFi', 'NFT', 'blockchain', 'smart contracts'
      ]);
      
      // Should preserve English crypto terms in French translation
      expect(translation.content).toContain('DeFi');
      expect(translation.content).toContain('NFT');
      expect(translation.content).toContain('blockchain');
    });

    test('should apply cultural context for African markets', async () => {
      const content = {
        title: 'Mobile Money and Crypto Integration',
        excerpt: 'Traditional payments meet digital currency',
        content: 'Mobile money services like M-Pesa are integrating with cryptocurrency platforms to serve unbanked populations.'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'sw'
      );

      expect(translation.culturalAdaptations).toEqual(
        expect.arrayContaining([
          {
            term: 'Mobile Money',
            adaptation: 'Fedha za Simu',
            context: 'East African mobile payment context'
          },
          {
            term: 'unbanked populations',
            adaptation: 'watu wasio na akaunti za benki',
            context: 'African financial inclusion context'
          }
        ])
      );
    });

    test('should handle translation errors gracefully', async () => {
      // Mock NLLB-200 API failure
      jest.spyOn(translationService as any, 'callNLLBAPI').mockRejectedValue(
        new Error('API unavailable')
      );

      const content = {
        title: 'Test Title',
        excerpt: 'Test Excerpt',
        content: 'Test Content'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'sw'
      );

      // Should return fallback translation
      expect(translation).toEqual({
        title: content.title,
        excerpt: content.excerpt,
        content: content.content,
        qualityScore: 0,
        culturalAdaptations: [],
        cryptoTermsPreserved: [],
        fallbackUsed: true,
        error: 'Translation service unavailable, using original content'
      });
    });
  });

  describe('Crypto Glossary Translation', () => {
    test('should maintain crypto glossary consistency', async () => {
      const glossary = await translationService.getCryptoGlossary('sw');
      
      expect(glossary).toEqual(
        expect.objectContaining({
          'Bitcoin': 'Bitcoin',
          'Ethereum': 'Ethereum',
          'blockchain': 'mnyororo wa vitalu',
          'wallet': 'mkoba wa kidijitali',
          'mining': 'uchimbaji',
          'DeFi': 'DeFi',
          'NFT': 'NFT',
          'smart contract': 'mkataba mzuri',
          'cryptocurrency': 'sarafu za kidijitali',
          'exchange': 'uwanja wa ubadilishaji'
        })
      );
    });

    test('should apply glossary terms during translation', async () => {
      const content = {
        title: 'Understanding Blockchain Technology',
        excerpt: 'Learn about cryptocurrency wallets',
        content: 'Blockchain technology powers cryptocurrency wallets and enables secure mining operations.'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'sw'
      );

      expect(translation.content).toContain('mnyororo wa vitalu'); // blockchain
      expect(translation.content).toContain('mkoba wa kidijitali'); // wallet
      expect(translation.content).toContain('uchimbaji'); // mining
    });

    test('should update glossary for new crypto terms', async () => {
      const newTerms = {
        'memecoin': 'sarafu za mchezo',
        'staking': 'kuweka akiba',
        'yield farming': 'kilimo cha mapato'
      };

      await translationService.updateCryptoGlossary('sw', newTerms);
      
      const updatedGlossary = await translationService.getCryptoGlossary('sw');
      
      Object.entries(newTerms).forEach(([english, swahili]) => {
        expect(updatedGlossary[english]).toBe(swahili);
      });
    });
  });

  describe('Translation Quality Assessment', () => {
    test('should calculate quality score based on multiple factors', async () => {
      const translation = {
        title: 'Translated title',
        excerpt: 'Translated excerpt',
        content: 'Translated content with preserved Bitcoin and DeFi terms.',
        cryptoTermsPreserved: ['Bitcoin', 'DeFi'],
        culturalAdaptations: [{ term: 'mobile money', adaptation: 'fedha za simu', context: 'East African context' }]
      };

      const quality = await translationService.assessTranslationQuality(
        translation, 
        'en', 
        'sw'
      );

      expect(quality.score).toBeGreaterThan(0);
      expect(quality.score).toBeLessThanOrEqual(100);
      expect(quality.factors).toEqual({
        cryptoTermsPreserved: expect.any(Number),
        culturalRelevance: expect.any(Number),
        linguisticAccuracy: expect.any(Number),
        contextualCoherence: expect.any(Number)
      });
    });

    test('should recommend human review for low-quality translations', async () => {
      const lowQualityTranslation = {
        title: 'Bad translation',
        excerpt: 'Poor quality',
        content: 'This is a very poor translation without context.',
        cryptoTermsPreserved: [],
        culturalAdaptations: []
      };

      const quality = await translationService.assessTranslationQuality(
        lowQualityTranslation, 
        'en', 
        'sw'
      );

      expect(quality.score).toBeLessThan(50);
      expect(quality.requiresHumanReview).toBe(true);
      expect(quality.recommendations).toEqual(
        expect.arrayContaining([
          'Add cultural context for African audience',
          'Preserve crypto terminology',
          'Improve linguistic accuracy'
        ])
      );
    });
  });

  describe('Fallback Mechanisms', () => {
    test('should fallback to English when target language is not supported', async () => {
      const content = {
        title: 'Test Title',
        excerpt: 'Test Excerpt',
        content: 'Test Content'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'xyz' as any // Unsupported language
      );

      expect(translation).toEqual({
        title: content.title,
        excerpt: content.excerpt,
        content: content.content,
        qualityScore: 100,
        culturalAdaptations: [],
        cryptoTermsPreserved: [],
        fallbackUsed: true,
        fallbackReason: 'Target language not supported'
      });
    });

    test('should fallback to cached translation when API fails', async () => {
      const cachedTranslation = {
        title: 'Cached Title',
        excerpt: 'Cached Excerpt',
        content: 'Cached Content',
        qualityScore: 85
      };

      // Mock cache to return cached translation
      jest.spyOn(translationService as any, 'getCachedTranslation')
        .mockResolvedValue(cachedTranslation);

      // Mock API to fail
      jest.spyOn(translationService as any, 'callNLLBAPI')
        .mockRejectedValue(new Error('API Error'));

      const content = {
        title: 'Original Title',
        excerpt: 'Original Excerpt', 
        content: 'Original Content'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'sw'
      );

      expect(translation).toEqual(expect.objectContaining({
        ...cachedTranslation,
        fallbackUsed: true,
        fallbackReason: 'Using cached translation due to API failure'
      }));
    });

    test('should provide multiple fallback options in priority order', async () => {
      const fallbackOptions = await translationService.getFallbackOptions('xyz');
      
      expect(fallbackOptions).toEqual([
        { code: 'en', reason: 'Primary fallback language' },
        { code: 'sw', reason: 'Regional East African language' },
        { code: 'fr', reason: 'Regional West/Central African language' },
        { code: 'ar', reason: 'Regional North African language' }
      ]);
    });
  });

  describe('Content Localization for African Markets', () => {
    test('should localize currency formats for different African regions', async () => {
      const content = {
        title: 'Bitcoin Price: $50,000',
        excerpt: 'Price analysis in USD',
        content: 'Bitcoin is trading at $50,000, equivalent to approximately ₦20,500,000 in Nigeria.'
      };

      const localization = await translationService.localizeContent(
        content, 
        'en', 
        'yo', // Yoruba for Nigeria
        { includeLocalCurrency: true }
      );

      expect(localization.content).toContain('₦'); // Naira symbol
      expect(localization.localizations).toEqual(
        expect.arrayContaining([
          {
            type: 'currency',
            original: '$50,000',
            localized: '₦20,500,000',
            context: 'Nigerian Naira equivalent'
          }
        ])
      );
    });

    test('should adapt content for mobile money integration context', async () => {
      const content = {
        title: 'Buy Bitcoin with Mobile Money',
        excerpt: 'Easy cryptocurrency purchase',
        content: 'You can now buy Bitcoin using mobile money services directly from our platform.'
      };

      const localization = await translationService.localizeContent(
        content, 
        'en', 
        'sw',
        { region: 'East Africa' }
      );

      expect(localization.content).toContain('M-Pesa');
      expect(localization.localizations).toEqual(
        expect.arrayContaining([
          {
            type: 'payment_method',
            original: 'mobile money services',
            localized: 'M-Pesa, Airtel Money',
            context: 'East African mobile money services'
          }
        ])
      );
    });

    test('should preserve exchange names for regional context', async () => {
      const content = {
        title: 'African Crypto Exchanges Lead Innovation',
        excerpt: 'Local platforms gaining traction',
        content: 'Exchanges like Luno and Quidax are making cryptocurrency accessible to African users.'
      };

      const translation = await translationService.translateContent(
        content, 
        'en', 
        'fr'
      );

      expect(translation.cryptoTermsPreserved).toContain('Luno');
      expect(translation.cryptoTermsPreserved).toContain('Quidax');
      expect(translation.content).toContain('Luno');
      expect(translation.content).toContain('Quidax');
    });
  });

  describe('Batch Translation Processing', () => {
    test('should process multiple articles in batch', async () => {
      const articles = [
        { id: '1', title: 'Title 1', excerpt: 'Excerpt 1', content: 'Content 1' },
        { id: '2', title: 'Title 2', excerpt: 'Excerpt 2', content: 'Content 2' },
        { id: '3', title: 'Title 3', excerpt: 'Excerpt 3', content: 'Content 3' }
      ];

      const results = await translationService.batchTranslate(
        articles,
        'en',
        ['sw', 'fr', 'ar'],
        { priority: 'high' }
      );

      expect(results).toHaveLength(9); // 3 articles × 3 languages
      
      results.forEach(result => {
        expect(result).toEqual({
          articleId: expect.any(String),
          languageCode: expect.any(String),
          status: expect.stringMatching(/^(completed|failed|pending)$/),
          translation: expect.any(Object),
          processingTime: expect.any(Number)
        });
      });
    });

    test('should handle batch translation failures gracefully', async () => {
      const articles = [
        { id: '1', title: 'Title 1', excerpt: 'Excerpt 1', content: 'Content 1' }
      ];

      // Mock some failures
      jest.spyOn(translationService as any, 'translateContent')
        .mockImplementation(async (content: any, from: any, to: any) => {
          if (to === 'ar') {
            throw new Error('Arabic translation failed');
          }
          return { 
            title: content.title,
            excerpt: content.excerpt,
            content: content.content,
            qualityScore: 80, 
            culturalAdaptations: [], 
            cryptoTermsPreserved: [] 
          };
        });

      const results = await translationService.batchTranslate(
        articles,
        'en',
        ['sw', 'fr', 'ar']
      );

      const failedResult = results.find(r => r.languageCode === 'ar');
      expect(failedResult?.status).toBe('failed');
      expect(failedResult?.error).toBe('Arabic translation failed');

      const successResults = results.filter(r => r.status === 'completed');
      expect(successResults).toHaveLength(2);
    });
  });

  describe('Integration with CMS Service', () => {
    test('should integrate with existing article translation workflow', async () => {
      const articleId = 'test-article-id';
      const languageCode = 'sw';
      const translation = {
        title: 'Translated Title',
        excerpt: 'Translated Excerpt',
        content: 'Translated Content'
      };

      // Mock successful translation creation
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'translation-id',
        articleId,
        languageCode,
        ...translation,
        translationStatus: 'COMPLETED',
        qualityScore: 85
      });

      (mockPrisma as any).articleTranslation = {
        create: mockCreate
      };

      const result = await translationService.createArticleTranslation(
        articleId,
        languageCode,
        translation
      );

      expect(result).toEqual({
        id: 'translation-id',
        articleId,
        languageCode,
        ...translation,
        translationStatus: 'COMPLETED',
        qualityScore: 85
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          articleId,
          languageCode,
          ...translation,
          translationStatus: 'COMPLETED',
          aiGenerated: true,
          humanReviewed: false,
          qualityScore: 85
        }
      });
    });
  });
});