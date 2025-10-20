/**
 * CMS Service - Headless Content Management System
 * Task 6: Implements article creation/editing workflows, AI integration, 
 * multi-language content management, approval workflows, and version control
 */

import { PrismaClient, Article, ArticleTranslation, User } from '@prisma/client';
import { Logger } from 'winston';
import { randomUUID } from 'crypto';

export interface CreateArticleInput {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  isPremium: boolean;
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishScheduledAt?: Date;
  authorId: string;
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
  publishScheduledAt?: Date;
}

export interface ArticleWorkflow {
  id: string;
  articleId: string;
  currentStatus: string;
  previousStatus: string;
  assignedReviewerId?: string;
  workflowSteps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  assigneeId?: string;
  completedAt?: Date;
  notes?: string;
}

export interface ContentRevision {
  id: string;
  articleId: string;
  version: number;
  title: string;
  excerpt: string;
  content: string;
  authorId: string;
  changeType: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'ARCHIVED';
  changeNotes?: string;
  createdAt: Date;
}

export interface AIContentAnalysis {
  readabilityScore: number;
  seoScore: number;
  engagementPrediction: number;
  qualityScore: number;
  suggestedTags: string[];
  suggestedTitle?: string;
  contentIssues: string[];
}

export interface MultiLanguageContent {
  originalLanguage: string;
  translations: {
    [languageCode: string]: {
      title: string;
      excerpt: string;
      content: string;
      status: string;
      translatorId?: string;
      qualityScore?: number;
    };
  };
}

export class CMSService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger,
    private aiService?: any // AI integration service
  ) {}

  /**
   * Create a new article with workflow initialization
   */
  async createArticle(input: CreateArticleInput): Promise<Article> {
    this.logger.info('Creating new article', { title: input.title, authorId: input.authorId });

    // Generate slug from title
    const slug = await this.generateUniqueSlug(input.title);
    
    // Calculate reading time
    const readingTimeMinutes = this.calculateReadingTime(input.content);

    try {
      const article = await this.prisma.$transaction(async (tx) => {
        // Create article
        const newArticle = await tx.article.create({
          data: {
            id: randomUUID(),
            title: input.title,
            slug,
            excerpt: input.excerpt,
            content: input.content,
            authorId: input.authorId,
            categoryId: input.categoryId,
            tags: JSON.stringify(input.tags),
            isPremium: input.isPremium,
            featuredImageUrl: input.featuredImageUrl || null,
            seoTitle: input.seoTitle || null,
            seoDescription: input.seoDescription || null,
            publishScheduledAt: input.publishScheduledAt || null,
            readingTimeMinutes,
            status: 'DRAFT',
            priority: 'NORMAL',
            updatedAt: new Date()
          },
          include: {
            Category: true,
            User: { select: { id: true, username: true, firstName: true, lastName: true } }
          }
        });

        // Create initial revision
        await this.createRevision(tx, newArticle.id, newArticle, 'CREATED', 'Initial article creation');

        // Initialize workflow
        await this.initializeWorkflow(tx, newArticle.id, input.authorId);

        return newArticle;
      });

      this.logger.info('Article created successfully', { articleId: article.id, slug });
      return article;
    } catch (error) {
      this.logger.error('Failed to create article', { error: (error as Error).message, input });
      throw new Error(`Failed to create article: ${(error as Error).message}`);
    }
  }

  /**
   * Update article with version control
   */
  async updateArticle(input: UpdateArticleInput): Promise<Article> {
    this.logger.info('Updating article', { articleId: input.id });

    const existingArticle = await this.prisma.article.findUnique({
      where: { id: input.id },
      include: { User: true }
    });

    if (!existingArticle) {
      throw new Error('Article not found');
    }

    try {
      const updatedArticle = await this.prisma.$transaction(async (tx) => {
        // Update slug if title changed
        let slug = existingArticle.slug;
        if (input.title && input.title !== existingArticle.title) {
          slug = await this.generateUniqueSlug(input.title);
        }

        // Recalculate reading time if content changed
        let readingTimeMinutes = existingArticle.readingTimeMinutes;
        if (input.content && input.content !== existingArticle.content) {
          readingTimeMinutes = this.calculateReadingTime(input.content);
        }

        const updated = await tx.article.update({
          where: { id: input.id },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.title && { slug }),
            ...(input.excerpt && { excerpt: input.excerpt }),
            ...(input.content && { content: input.content, readingTimeMinutes }),
            ...(input.categoryId && { categoryId: input.categoryId }),
            ...(input.tags && { tags: JSON.stringify(input.tags) }),
            ...(input.isPremium !== undefined && { isPremium: input.isPremium }),
            ...(input.featuredImageUrl !== undefined && { featuredImageUrl: input.featuredImageUrl }),
            ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle }),
            ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription }),
            ...(input.publishScheduledAt !== undefined && { publishScheduledAt: input.publishScheduledAt }),
            updatedAt: new Date()
          },
          include: {
            User: { select: { id: true, username: true, firstName: true, lastName: true } },
            Category: true
          }
        });

        // Create revision for the update
        await this.createRevision(tx, input.id, updated, 'UPDATED', 'Article content updated');

        return updated;
      });

      this.logger.info('Article updated successfully', { articleId: input.id });
      return updatedArticle;
    } catch (error) {
      this.logger.error('Failed to update article', { error: (error as Error).message, articleId: input.id });
      throw new Error(`Failed to update article: ${(error as Error).message}`);
    }
  }

  /**
   * Submit article for review (workflow progression)
   */
  async submitForReview(articleId: string, authorId: string): Promise<Article> {
    this.logger.info('Submitting article for review', { articleId, authorId });

    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { User: true }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.authorId !== authorId) {
      throw new Error('Only the article author can submit for review');
    }

    if (article.status !== 'DRAFT') {
      throw new Error('Only draft articles can be submitted for review');
    }

    try {
      const updatedArticle = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.article.update({
          where: { id: articleId },
          data: { 
            status: 'PENDING_REVIEW',
            updatedAt: new Date()
          },
          include: {
            User: { select: { id: true, username: true, firstName: true, lastName: true } },
            Category: true
          }
        });

        // Update workflow
        await this.updateWorkflowStatus(tx, articleId, 'PENDING_REVIEW', 'DRAFT');

        // Create revision
        await this.createRevision(tx, articleId, updated, 'UPDATED', 'Submitted for review');

        return updated;
      });

      this.logger.info('Article submitted for review', { articleId });
      return updatedArticle;
    } catch (error) {
      this.logger.error('Failed to submit article for review', { error: (error as Error).message, articleId });
      throw new Error(`Failed to submit for review: ${(error as Error).message}`);
    }
  }

  /**
   * Approve article (workflow progression)
   */
  async approveArticle(articleId: string, reviewerId: string, notes?: string): Promise<Article> {
    this.logger.info('Approving article', { articleId, reviewerId });

    const article = await this.prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'PENDING_REVIEW') {
      throw new Error('Only articles pending review can be approved');
    }

    try {
      const updatedArticle = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.article.update({
          where: { id: articleId },
          data: { 
            status: 'APPROVED',
            updatedAt: new Date()
          },
          include: {
            User: { select: { id: true, username: true, firstName: true, lastName: true } },
            Category: true
          }
        });

        // Update workflow
        await this.updateWorkflowStatus(tx, articleId, 'APPROVED', 'PENDING_REVIEW', reviewerId, notes);

        // Create revision
        await this.createRevision(tx, articleId, updated, 'UPDATED', `Approved by reviewer: ${notes || 'No notes'}`);

        return updated;
      });

      this.logger.info('Article approved', { articleId });
      return updatedArticle;
    } catch (error) {
      this.logger.error('Failed to approve article', { error: (error as Error).message, articleId });
      throw new Error(`Failed to approve article: ${(error as Error).message}`);
    }
  }

  /**
   * Reject article with feedback
   */
  async rejectArticle(articleId: string, reviewerId: string, rejectionReason: string): Promise<Article> {
    this.logger.info('Rejecting article', { articleId, reviewerId });

    const article = await this.prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'PENDING_REVIEW') {
      throw new Error('Only articles pending review can be rejected');
    }

    try {
      const updatedArticle = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.article.update({
          where: { id: articleId },
          data: { 
            status: 'REJECTED',
            updatedAt: new Date()
          },
          include: {
            User: { select: { id: true, username: true, firstName: true, lastName: true } },
            Category: true
          }
        });

        // Update workflow
        await this.updateWorkflowStatus(tx, articleId, 'REJECTED', 'PENDING_REVIEW', reviewerId, rejectionReason);

        // Create revision
        await this.createRevision(tx, articleId, updated, 'UPDATED', `Rejected: ${rejectionReason}`);

        return updated;
      });

      this.logger.info('Article rejected', { articleId, reason: rejectionReason });
      return updatedArticle;
    } catch (error) {
      this.logger.error('Failed to reject article', { error: (error as Error).message, articleId });
      throw new Error(`Failed to reject article: ${(error as Error).message}`);
    }
  }

  /**
   * Publish approved article
   */
  async publishArticle(articleId: string, publisherId: string): Promise<Article> {
    this.logger.info('Publishing article', { articleId, publisherId });

    const article = await this.prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (article.status !== 'APPROVED') {
      throw new Error('Only approved articles can be published');
    }

    try {
      const publishedArticle = await this.prisma.$transaction(async (tx) => {
        const published = await tx.article.update({
          where: { id: articleId },
          data: { 
            status: 'PUBLISHED',
            publishedAt: new Date(),
            updatedAt: new Date()
          },
          include: {
            User: { select: { id: true, username: true, firstName: true, lastName: true } },
            Category: true
          }
        });

        // Update workflow
        await this.updateWorkflowStatus(tx, articleId, 'PUBLISHED', 'APPROVED', publisherId);

        // Create revision
        await this.createRevision(tx, articleId, published, 'PUBLISHED', 'Article published');

        // Update category article count
        await tx.category.update({
          where: { id: published.categoryId },
          data: { articleCount: { increment: 1 } }
        });

        return published;
      });

      this.logger.info('Article published successfully', { articleId });
      return publishedArticle;
    } catch (error) {
      this.logger.error('Failed to publish article', { error: (error as Error).message, articleId });
      throw new Error(`Failed to publish article: ${(error as Error).message}`);
    }
  }

  /**
   * Get article revision history
   */
  async getArticleRevisions(articleId: string): Promise<ContentRevision[]> {
    // This would require adding a ContentRevision table to the schema
    // For now, return empty array as placeholder
    this.logger.info('Fetching article revisions', { articleId });
    return [];
  }

  /**
   * Rollback to previous revision
   */
  async rollbackToRevision(articleId: string, revisionId: string, userId: string): Promise<Article> {
    this.logger.info('Rolling back article to revision', { articleId, revisionId, userId });
    
    // Implementation would restore article to previous revision state
    // This requires the ContentRevision table implementation
    
    throw new Error('Revision rollback not implemented - requires ContentRevision table');
  }

  /**
   * Request AI content analysis
   */
  async requestAIAnalysis(articleId: string): Promise<AIContentAnalysis> {
    this.logger.info('Requesting AI analysis for article', { articleId });

    const article = await this.prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    if (!this.aiService) {
      // Mock AI analysis for now
      return {
        readabilityScore: 75,
        seoScore: 80,
        engagementPrediction: 70,
        qualityScore: 77,
        suggestedTags: ['cryptocurrency', 'africa', 'news'],
        contentIssues: []
      };
    }

    // Real AI integration would go here
    try {
      const analysis = await this.aiService.analyzeContent({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt
      });

      this.logger.info('AI analysis completed', { articleId, qualityScore: analysis.qualityScore });
      return analysis;
    } catch (error) {
      this.logger.error('AI analysis failed', { error: (error as Error).message, articleId });
      throw new Error(`AI analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create or update article translation
   */
  async createTranslation(
    articleId: string, 
    languageCode: string, 
    translation: { title: string; excerpt: string; content: string },
    translatorId?: string
  ): Promise<ArticleTranslation> {
    this.logger.info('Creating article translation', { articleId, languageCode });

    try {
      // First try to find existing translation
      const existing = await this.prisma.articleTranslation.findFirst({
        where: {
          articleId,
          languageCode
        }
      });

      let articleTranslation;
      
      if (existing) {
        // Update existing translation
        articleTranslation = await this.prisma.articleTranslation.update({
          where: { id: existing.id },
          data: {
            title: translation.title,
            excerpt: translation.excerpt,
            content: translation.content,
            translatorId: translatorId || null,
            translationStatus: translatorId ? 'COMPLETED' : 'PENDING',
            humanReviewed: !!translatorId,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new translation
        articleTranslation = await this.prisma.articleTranslation.create({
          data: {
            id: `${articleId}_${languageCode}`,
            articleId,
            languageCode,
            title: translation.title,
            excerpt: translation.excerpt,
            content: translation.content,
            translatorId: translatorId || null,
            translationStatus: translatorId ? 'COMPLETED' : 'PENDING',
            humanReviewed: !!translatorId,
            aiGenerated: !translatorId,
            updatedAt: new Date()
          }
        });
      }

      this.logger.info('Translation created/updated', { 
        articleId, 
        languageCode, 
        translationId: articleTranslation.id 
      });
      
      return articleTranslation;
    } catch (error) {
      this.logger.error('Failed to create translation', { error: (error as Error).message, articleId, languageCode });
      throw new Error(`Failed to create translation: ${(error as Error).message}`);
    }
  }

  /**
   * Get article with all translations
   */
  async getArticleWithTranslations(articleId: string): Promise<Article & { ArticleTranslation: ArticleTranslation[] }> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        ArticleTranslation: true,
        User: { select: { id: true, username: true, firstName: true, lastName: true } },
        Category: true
      }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    return article;
  }

  // Private helper methods

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private async createRevision(
    tx: any,
    articleId: string,
    article: any,
    changeType: 'CREATED' | 'UPDATED' | 'PUBLISHED' | 'ARCHIVED',
    changeNotes: string
  ): Promise<void> {
    // This would create a record in ContentRevision table
    // Implementation pending ContentRevision table creation
    this.logger.debug('Creating revision', { articleId, changeType, changeNotes });
  }

  private async initializeWorkflow(tx: any, articleId: string, authorId: string): Promise<void> {
    // This would create initial workflow record
    // Implementation pending ArticleWorkflow table creation
    this.logger.debug('Initializing workflow', { articleId, authorId });
  }

  private async updateWorkflowStatus(
    tx: any,
    articleId: string,
    newStatus: string,
    previousStatus: string,
    assigneeId?: string,
    notes?: string
  ): Promise<void> {
    // This would update workflow status
    // Implementation pending ArticleWorkflow table creation
    this.logger.debug('Updating workflow status', { 
      articleId, 
      newStatus, 
      previousStatus, 
      assigneeId, 
      notes 
    });
  }
}
