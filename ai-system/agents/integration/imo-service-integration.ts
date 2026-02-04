/**
 * Imo Integration Examples
 * Shows how Imo integrates with existing CoinDaily AI services
 * 
 * ARCHITECTURE FLOW:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        CoinDaily AI System                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
 * │  │  User/API    │───▶│   Backend    │───▶│   AI Content Pipeline    │  │
 * │  │  Request     │    │   Services   │    │   Service                │  │
 * │  └──────────────┘    └──────────────┘    └───────────┬──────────────┘  │
 * │                                                       │                 │
 * │                                          ┌────────────▼────────────┐   │
 * │                                          │   IMO ORCHESTRATOR      │   │
 * │                                          │   (Prompt Engineering)  │   │
 * │                                          └────────────┬────────────┘   │
 * │                           ┌──────────────────────────┬┴───────────┐    │
 * │                           │                          │            │    │
 * │               ┌───────────▼──────────┐  ┌───────────▼─────┐  ┌───▼──┐ │
 * │               │  Content Generation  │  │  Image Service  │  │ RAG  │ │
 * │               │  (GPT-4/Llama)       │  │  (DALL-E/SD)    │  │      │ │
 * │               └──────────────────────┘  └─────────────────┘  └──────┘ │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { imoOrchestrator, routeThroughImo } from '../../orchestrator/imo-orchestrator';
import { imoContentAgent } from '../prompt/imo-content-agent';
import { imoImageAgent } from '../prompt/imo-image-agent';
import { imoTranslationAgent, SUPPORTED_LANGUAGES } from '../prompt/imo-translation-agent';
import { ragService } from '../prompt/rag-service';

const prisma = new PrismaClient();

// ============================================================================
// INTEGRATION WITH aiContentPipelineService.ts
// ============================================================================

/**
 * Enhanced content generation using Imo's Writer-Editor pattern
 * Replaces direct LLM calls with Imo-optimized prompts
 */
export async function generateArticleWithImo(params: {
  topic: string;
  keywords: string[];
  category: string;
  urgency: 'breaking' | 'high' | 'medium' | 'low';
  targetAudience?: 'beginner' | 'intermediate' | 'expert';
}) {
  // Initialize Imo Orchestrator
  await imoOrchestrator.initialize();

  console.log(`📝 Generating article with Imo: ${params.topic}`);

  // STEP 1: Route through Imo for prompt optimization
  const task = await routeThroughImo('imo.content.seo', {
    topic: params.topic,
    keywords: params.keywords,
    targetAudience: params.targetAudience || 'general',
    wordCount: params.urgency === 'breaking' ? 800 : 1500,
    africanFocus: true,
    useRAG: params.urgency !== 'breaking' // Skip RAG for breaking news (speed)
  });

  // STEP 2: Save to database
  const article = await prisma.article.create({
    data: {
      title: task.result.outline?.title || params.topic,
      content: task.result.content,
      slug: generateSlug(params.topic),
      status: 'DRAFT',
      categoryId: await getCategoryId(params.category),
      authorId: 'system-ai',
      metadata: {
        generatedBy: 'imo',
        taskId: task.id,
        processingTime: task.metrics?.totalTime,
        qualityScore: task.metrics?.qualityScore,
        seoScore: task.result.metadata.seoScore,
        ragSourcesUsed: task.result.ragSources?.length || 0
      }
    }
  });

  console.log(`✅ Article created: ${article.id}`);
  console.log(`   - SEO Score: ${task.result.metadata.seoScore}`);
  console.log(`   - Processing Time: ${task.metrics?.totalTime}ms`);

  return {
    article,
    imoTask: task
  };
}

// ============================================================================
// INTEGRATION WITH aiImageService.ts
// ============================================================================

/**
 * Enhanced image generation using Imo's negative prompting
 * Produces higher quality hero images with African context
 */
export async function generateHeroImageWithImo(articleId: string) {
  // Get article details
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { category: true, tags: true }
  });

  if (!article) throw new Error('Article not found');

  console.log(`🖼️ Generating hero image with Imo for: ${article.title}`);

  // Route through Imo for optimized prompt with negative prompting
  const task = await routeThroughImo('imo.image.hero', {
    articleTitle: article.title,
    articleSummary: article.content?.substring(0, 500),
    category: article.category?.name || 'crypto',
    keywords: article.tags?.map(t => t.name) || [],
    africanFocus: true
  });

  // Update article with generated image
  await prisma.article.update({
    where: { id: articleId },
    data: {
      featuredImageUrl: task.result.imageUrl,
      metadata: {
        ...(article.metadata as object),
        heroImage: {
          generatedBy: 'imo',
          prompt: task.result.prompt,
          negativePrompt: task.result.negativePrompt,
          promptQuality: task.result.metadata.promptQuality
        }
      }
    }
  });

  console.log(`✅ Hero image generated`);
  console.log(`   - Prompt Quality: ${task.result.metadata.promptQuality}`);

  return task.result;
}

// ============================================================================
// INTEGRATION WITH translationService.ts
// ============================================================================

/**
 * Enhanced translation using Imo's 2-step chaining
 * Preserves crypto terminology and tone across languages
 */
export async function translateArticleWithImo(
  articleId: string,
  targetLanguages: string[]
) {
  const article = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!article) throw new Error('Article not found');

  console.log(`🌍 Translating article to ${targetLanguages.length} languages with Imo`);

  const translations = new Map<string, any>();

  // Use Imo's batch translation for efficiency
  const batchResult = await imoTranslationAgent.batchTranslate(
    article.content || '',
    'en',
    targetLanguages,
    true // Use LLM for quality
  );

  // Also translate title
  const titleTranslations = await imoTranslationAgent.batchTranslate(
    article.title,
    'en',
    targetLanguages,
    true
  );

  // Save translations to database
  for (const lang of targetLanguages) {
    const contentResult = batchResult.get(lang);
    const titleResult = titleTranslations.get(lang);

    if (contentResult && titleResult) {
      const translation = await prisma.articleTranslation.create({
        data: {
          articleId,
          languageCode: lang,
          title: titleResult.translatedText,
          content: contentResult.translatedText,
          status: 'COMPLETED',
          metadata: {
            generatedBy: 'imo',
            method: contentResult.metadata.method,
            qualityScore: contentResult.metadata.qualityScore,
            preservedTerms: contentResult.chainSteps?.terminology || [],
            toneAnalysis: contentResult.chainSteps?.tone
          }
        }
      });

      translations.set(lang, translation);
      console.log(`   ✅ ${SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES]?.name || lang}: Quality ${contentResult.metadata.qualityScore}`);
    }
  }

  return translations;
}

// ============================================================================
// INTEGRATION WITH aiSearchService.ts (RAG)
// ============================================================================

/**
 * Enhanced search using Imo's RAG integration
 * Provides accurate, source-cited responses
 */
export async function handleSearchWithImo(userQuery: string) {
  console.log(`🔍 Processing search with Imo RAG: "${userQuery}"`);

  // Fetch real-time context from web
  const ragContext = await ragService.fetchContext(userQuery, {
    maxResults: 10,
    includeContent: true,
    dateRange: 'week',
    sources: ['google', 'crypto', 'news']
  });

  // Generate RAG-enhanced prompt
  const task = await routeThroughImo('imo.search.rag', {
    query: userQuery,
    maxSources: 5
  });

  // The task.result contains the optimized prompt for your LLM
  // You would then send this to GPT-4, Llama, or your self-hosted model

  return {
    prompt: task.result.prompt,
    ragContext: task.result.ragContext,
    modelConfig: task.result.modelConfig,
    sources: ragContext.results.map(r => ({
      title: r.title,
      url: r.url,
      relevance: r.relevanceScore
    }))
  };
}

// ============================================================================
// FULL PIPELINE INTEGRATION
// ============================================================================

/**
 * Complete content pipeline using Imo at every stage
 * This is how a typical article flows through the system
 */
export async function runFullContentPipelineWithImo(params: {
  topic: string;
  keywords: string[];
  category: string;
  targetLanguages: string[];
}) {
  console.log('═'.repeat(60));
  console.log('🚀 STARTING FULL IMO-ENHANCED CONTENT PIPELINE');
  console.log('═'.repeat(60));

  const startTime = Date.now();

  try {
    // Initialize Imo
    await imoOrchestrator.initialize();

    // STAGE 1: Generate Article (Writer-Editor Pattern)
    console.log('\n📝 STAGE 1: Content Generation');
    const { article, imoTask: contentTask } = await generateArticleWithImo({
      topic: params.topic,
      keywords: params.keywords,
      category: params.category,
      urgency: 'medium',
      targetAudience: 'general'
    });

    // STAGE 2: Generate Hero Image (Negative Prompting)
    console.log('\n🖼️ STAGE 2: Hero Image Generation');
    const heroImage = await generateHeroImageWithImo(article.id);

    // STAGE 3: Translate (2-Step Chaining)
    console.log('\n🌍 STAGE 3: Multi-Language Translation');
    const translations = await translateArticleWithImo(
      article.id,
      params.targetLanguages
    );

    // STAGE 4: Generate Social Images
    console.log('\n📱 STAGE 4: Social Media Images');
    const socialImages = await Promise.all([
      imoImageAgent.generateSocialImage('twitter', params.topic),
      imoImageAgent.generateSocialImage('facebook', params.topic),
      imoImageAgent.generateSocialImage('linkedin', params.topic)
    ]);

    // STAGE 5: Generate Social Posts
    console.log('\n✍️ STAGE 5: Social Media Posts');
    const socialPosts = await Promise.all([
      imoContentAgent.generateSocialPost(params.topic, 'twitter', `https://coindaily.africa/articles/${article.slug}`),
      imoContentAgent.generateSocialPost(params.topic, 'linkedin', `https://coindaily.africa/articles/${article.slug}`)
    ]);

    const totalTime = Date.now() - startTime;

    console.log('\n' + '═'.repeat(60));
    console.log('✅ PIPELINE COMPLETED');
    console.log('═'.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Article ID: ${article.id}`);
    console.log(`   - SEO Score: ${contentTask.result.metadata.seoScore}`);
    console.log(`   - Languages: ${params.targetLanguages.length}`);
    console.log(`   - Social Images: ${socialImages.length}`);
    console.log(`   - Total Time: ${totalTime}ms`);

    return {
      article,
      heroImage,
      translations: Object.fromEntries(translations),
      socialImages,
      socialPosts,
      metrics: {
        totalTime,
        stages: 5
      }
    };

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function getCategoryId(categoryName: string): Promise<string> {
  const category = await prisma.category.findFirst({
    where: { name: { contains: categoryName, mode: 'insensitive' } }
  });
  return category?.id || 'default-category-id';
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function example() {
  // Single article generation
  await generateArticleWithImo({
    topic: 'How to Buy Bitcoin in Nigeria Using Mobile Money',
    keywords: ['buy bitcoin nigeria', 'mobile money crypto', 'MTN bitcoin'],
    category: 'guides',
    urgency: 'medium',
    targetAudience: 'beginner'
  });

  // Full pipeline
  await runFullContentPipelineWithImo({
    topic: 'Ethereum Staking Rewards Hit All-Time High in Africa',
    keywords: ['ethereum staking', 'ETH rewards', 'Africa crypto'],
    category: 'market-news',
    targetLanguages: ['sw', 'ha', 'yo', 'fr'] // Swahili, Hausa, Yoruba, French
  });
}

export {
  example
};
