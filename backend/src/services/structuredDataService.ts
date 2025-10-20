/**
 * Structured Data & Rich Snippets Service
 * Implements Task 57: Production-ready structured data generation system
 * 
 * Features:
 * - Schema.org JSON-LD for NewsArticle, Author, Organization
 * - Cryptocurrency-specific schemas (CryptoCurrency, ExchangeRate)
 * - RAO (Retrieval-Augmented Optimization) schema for AI/LLM discovery
 * - Automated validation and database integration
 * - Rich snippets optimization
 */

import { PrismaClient } from '@prisma/client';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const prisma = new PrismaClient();
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NewsArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  headline: string;
  alternativeHeadline?: string;
  image: string | string[];
  datePublished: string;
  dateModified: string;
  author: PersonSchema | OrganizationSchema;
  publisher: OrganizationSchema;
  description: string;
  articleBody: string;
  articleSection?: string;
  keywords?: string[];
  wordCount?: number;
  inLanguage?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export interface PersonSchema {
  '@context'?: 'https://schema.org';
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
}

export interface OrganizationSchema {
  '@context'?: 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email?: string;
    telephone?: string;
  };
}

export interface CryptoCurrencySchema {
  '@context': 'https://schema.org';
  '@type': 'CryptoCurrency' | 'FinancialProduct';
  name: string;
  alternateName?: string;
  description: string;
  image?: string;
  url?: string;
  provider?: OrganizationSchema;
  currency?: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    priceValidUntil?: string;
  };
}

export interface ExchangeRateSchema {
  '@context': 'https://schema.org';
  '@type': 'ExchangeRateSpecification';
  currency: string;
  currentExchangeRate: {
    '@type': 'UnitPriceSpecification';
    price: number;
    priceCurrency: string;
  };
  exchangeRateSpread?: {
    '@type': 'MonetaryAmount';
    value: number;
    currency: string;
  };
}

export interface RAOSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage' | 'Article';
  mainEntity?: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
  about?: {
    '@type': 'Thing';
    name: string;
    description: string;
  }[];
  citation?: {
    '@type': 'CreativeWork';
    name: string;
    url: string;
  }[];
  mentions?: {
    '@type': 'Thing';
    name: string;
  }[];
}

export interface StructuredDataPayload {
  contentId: string;
  contentType: 'article' | 'author' | 'category' | 'cryptocurrency' | 'exchange-rate';
  schemas: {
    newsArticle?: NewsArticleSchema;
    person?: PersonSchema;
    organization?: OrganizationSchema;
    cryptocurrency?: CryptoCurrencySchema;
    exchangeRate?: ExchangeRateSchema;
    rao?: RAOSchema;
  };
  validation: {
    isValid: boolean;
    errors?: string[];
  };
}

// ============================================================================
// SCHEMA VALIDATORS
// ============================================================================

const newsArticleSchemaValidator = ajv.compile({
  type: 'object',
  required: ['@context', '@type', 'headline', 'datePublished', 'author', 'publisher'],
  properties: {
    '@context': { const: 'https://schema.org' },
    '@type': { const: 'NewsArticle' },
    headline: { type: 'string', maxLength: 110 },
    image: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    datePublished: { type: 'string', format: 'date-time' },
    dateModified: { type: 'string', format: 'date-time' },
    author: { type: 'object' },
    publisher: { type: 'object' },
    description: { type: 'string', maxLength: 160 },
  },
});

// ============================================================================
// STRUCTURED DATA SERVICE
// ============================================================================

export class StructuredDataService {
  /**
   * Generate NewsArticle schema for an article
   */
  async generateNewsArticleSchema(articleId: string): Promise<NewsArticleSchema | null> {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          User: true,
          Category: true,
        },
      });

      if (!article || article.status !== 'PUBLISHED') {
        return null;
      }

      const author = await this.generatePersonSchema(article.User.id);
      const publisher = this.generateOrganizationSchema();

      const schema: NewsArticleSchema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        ...(article.seoTitle && { alternativeHeadline: article.seoTitle }),
        image: article.featuredImageUrl ? [article.featuredImageUrl] : [],
        datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        dateModified: article.updatedAt.toISOString(),
        author,
        publisher,
        description: article.seoDescription || article.excerpt,
        articleBody: this.stripHtml(article.content),
        ...(article.Category?.name && { articleSection: article.Category.name }),
        ...(article.tags && { keywords: JSON.parse(article.tags) }),
        wordCount: this.countWords(article.content),
        inLanguage: 'en',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${process.env.FRONTEND_URL}/news/${article.slug}`,
        },
      };

      return schema;
    } catch (error) {
      console.error('Error generating NewsArticle schema:', error);
      return null;
    }
  }

  /**
   * Generate Person schema for an author
   */
  async generatePersonSchema(userId: string): Promise<PersonSchema> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          UserProfile: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const profile = user.UserProfile;
      const socialMedia = profile?.socialMedia ? JSON.parse(profile.socialMedia) : {};

      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        url: `${process.env.FRONTEND_URL}/author/${user.username}`,
        ...(user.avatarUrl && { image: user.avatarUrl }),
        jobTitle: 'Cryptocurrency Journalist',
        ...(user.bio && { description: user.bio }),
        ...(!user.bio && profile?.bio && { description: profile.bio }),
        sameAs: Object.values(socialMedia).filter(Boolean) as string[],
      };
    } catch (error) {
      console.error('Error generating Person schema:', error);
      return {
        '@type': 'Person',
        name: 'CoinDaily Team',
      };
    }
  }

  /**
   * Generate Organization schema for CoinDaily
   */
  generateOrganizationSchema(): OrganizationSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'CoinDaily',
      url: process.env.FRONTEND_URL || 'https://coindaily.com',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.FRONTEND_URL}/logo.png`,
        width: 600,
        height: 60,
      },
      sameAs: [
        'https://twitter.com/coindaily',
        'https://t.me/coindaily',
        'https://linkedin.com/company/coindaily',
        'https://youtube.com/@coindaily',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'contact@coindaily.com',
      },
    };
  }

  /**
   * Generate CryptoCurrency schema
   */
  async generateCryptoCurrencySchema(
    tokenSymbol: string,
    tokenName: string,
    description: string,
    price?: number,
    imageUrl?: string
  ): Promise<CryptoCurrencySchema> {
    return {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: tokenName,
      alternateName: tokenSymbol,
      description,
      ...(imageUrl && { image: imageUrl }),
      url: `${process.env.FRONTEND_URL}/token/${tokenSymbol.toLowerCase()}`,
      provider: this.generateOrganizationSchema(),
      currency: 'USD',
      ...(price && {
        offers: {
          '@type': 'Offer',
          price: price.toString(),
          priceCurrency: 'USD',
          priceValidUntil: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    };
  }

  /**
   * Generate ExchangeRate schema
   */
  generateExchangeRateSchema(
    baseCurrency: string,
    quoteCurrency: string,
    rate: number,
    spread?: number
  ): ExchangeRateSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'ExchangeRateSpecification',
      currency: baseCurrency,
      currentExchangeRate: {
        '@type': 'UnitPriceSpecification',
        price: rate,
        priceCurrency: quoteCurrency,
      },
      ...(spread && {
        exchangeRateSpread: {
          '@type': 'MonetaryAmount',
          value: spread,
          currency: quoteCurrency,
        },
      }),
    };
  }

  /**
   * Generate RAO (Retrieval-Augmented Optimization) schema for AI/LLM discovery
   */
  async generateRAOSchema(articleId: string): Promise<RAOSchema | null> {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          Category: true,
        },
      });

      if (!article) {
        return null;
      }

      // Extract key facts and questions from content
      const facts = this.extractFacts(article.content);
      const questions = this.extractQuestions(article.content);
      const entities = this.extractEntities(article.content);

      const schema: RAOSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question' as const,
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer' as const,
            text: q.answer,
          },
        })),
        about: entities.map((entity) => ({
          '@type': 'Thing' as const,
          name: entity.name,
          description: entity.description,
        })),
        citation: facts.map((fact) => ({
          '@type': 'CreativeWork' as const,
          name: fact.claim,
          url: fact.source || article.slug,
        })),
        mentions: this.extractTokenMentions(article.content).map((token) => ({
          '@type': 'Thing' as const,
          name: token,
        })),
      };

      return schema;
    } catch (error) {
      console.error('Error generating RAO schema:', error);
      return null;
    }
  }

  /**
   * Validate structured data against schema
   */
  validateSchema(schema: any, type: 'newsArticle' | 'person' | 'organization'): {
    isValid: boolean;
    errors?: string[];
  } {
    try {
      let validator;
      switch (type) {
        case 'newsArticle':
          validator = newsArticleSchemaValidator;
          break;
        default:
          return { isValid: true };
      }

      const isValid = validator(schema);
      if (!isValid && validator.errors) {
        return {
          isValid: false,
          errors: validator.errors.map((err) => `${err.instancePath} ${err.message}`),
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generate and save all structured data for an article
   */
  async generateAndSaveArticleStructuredData(articleId: string): Promise<StructuredDataPayload> {
    try {
      const newsArticle = await this.generateNewsArticleSchema(articleId);
      const rao = await this.generateRAOSchema(articleId);

      if (!newsArticle) {
        throw new Error('Failed to generate NewsArticle schema');
      }

      const validation = this.validateSchema(newsArticle, 'newsArticle');

      const payload: StructuredDataPayload = {
        contentId: articleId,
        contentType: 'article',
        schemas: {
          newsArticle,
          ...(rao && { rao }),
        },
        validation,
      };

      // Save to database
      await prisma.sEOMetadata.upsert({
        where: {
          contentId_contentType: {
            contentId: articleId,
            contentType: 'article',
          },
        },
        create: {
          contentId: articleId,
          contentType: 'article',
          metadata: JSON.stringify(payload.schemas),
          raometa: JSON.stringify(rao),
        },
        update: {
          metadata: JSON.stringify(payload.schemas),
          raometa: JSON.stringify(rao),
          updatedAt: new Date(),
        },
      });

      return payload;
    } catch (error) {
      console.error('Error generating and saving structured data:', error);
      throw error;
    }
  }

  /**
   * Get structured data from database
   */
  async getStructuredData(contentId: string, contentType: string): Promise<any> {
    try {
      const metadata = await prisma.sEOMetadata.findUnique({
        where: {
          contentId_contentType: {
            contentId,
            contentType,
          },
        },
      });

      if (!metadata) {
        return null;
      }

      return {
        schemas: JSON.parse(metadata.metadata),
        raometa: JSON.parse(metadata.raometa),
        updatedAt: metadata.updatedAt,
      };
    } catch (error) {
      console.error('Error retrieving structured data:', error);
      return null;
    }
  }

  /**
   * Bulk generate structured data for all published articles
   */
  async bulkGenerateStructuredData(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    try {
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
        },
        select: {
          id: true,
        },
      });

      let succeeded = 0;
      let failed = 0;

      for (const article of articles) {
        try {
          await this.generateAndSaveArticleStructuredData(article.id);
          succeeded++;
        } catch (error) {
          console.error(`Failed to generate structured data for article ${article.id}:`, error);
          failed++;
        }
      }

      return {
        processed: articles.length,
        succeeded,
        failed,
      };
    } catch (error) {
      console.error('Error in bulk generate:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  private countWords(text: string): number {
    const cleanText = this.stripHtml(text);
    return cleanText.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private extractFacts(content: string): Array<{ claim: string; source?: string }> {
    // Simple fact extraction - in production, use NLP
    const cleanContent = this.stripHtml(content);
    const sentences = cleanContent.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    
    // Look for sentences with numbers or definitive statements
    return sentences
      .filter((s) => /\d+|increased|decreased|announced|reached|surpassed/i.test(s))
      .slice(0, 5)
      .map((claim) => ({ claim: claim.trim() }));
  }

  private extractQuestions(content: string): Array<{ question: string; answer: string }> {
    // Simple Q&A extraction - in production, use NLP
    const cleanContent = this.stripHtml(content);
    const paragraphs = cleanContent.split('\n\n');
    const questions: Array<{ question: string; answer: string }> = [];

    for (let i = 0; i < paragraphs.length - 1; i++) {
      const para = paragraphs[i]?.trim();
      if (para && para.endsWith('?')) {
        const nextPara = paragraphs[i + 1];
        if (nextPara) {
          questions.push({
            question: para,
            answer: nextPara.trim().substring(0, 200),
          });
        }
      }
    }

    return questions.slice(0, 3);
  }

  private extractEntities(content: string): Array<{ name: string; description: string }> {
    // Simple entity extraction - look for capitalized terms
    const cleanContent = this.stripHtml(content);
    const words = cleanContent.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    return uniqueWords.slice(0, 5).map((word) => ({
      name: word,
      description: `Information about ${word} in cryptocurrency context`,
    }));
  }

  private extractTokenMentions(content: string): string[] {
    // Extract cryptocurrency token mentions (uppercase 3-5 letter words)
    const cleanContent = this.stripHtml(content);
    const tokens = cleanContent.match(/\b[A-Z]{3,5}\b/g) || [];
    return [...new Set(tokens)].filter((token) => 
      !['THE', 'AND', 'FOR', 'BUT', 'NOT', 'WITH'].includes(token)
    );
  }
}

export const structuredDataService = new StructuredDataService();
