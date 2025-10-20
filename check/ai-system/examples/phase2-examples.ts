// Phase 2 AI System Examples - Content Generation, Translation, and Visual Creation
// Demonstrates the enhanced AI system with ChatGPT, NLLB, and DALL-E integration

import { aiOrchestrator } from '../orchestrator/central-ai-orchestrator';
import { 
  AITask, 
  ContentGenerationResult, 
  TranslationResult, 
  ImageGenerationResult 
} from '../types/ai-types';
import { ContentGenerationRequest } from '../agents/content/content-generation-agent';
import { TranslationRequest } from '../agents/content/translation-agent';
import { ImageGenerationRequest } from '../agents/visual/image-generation-agent';

// Example 1: Complete Article Generation Pipeline
export async function generateCompleteArticle(topic: {
  title: string;
  keyPoints: string[];
  targetKeywords: string[];
  cryptoSymbols: string[];
}): Promise<{
  article: string;
  translations: Record<string, string>;
  thumbnail: string;
  socialImages: string[];
  seoScore: number;
  processingTime: number;
}> {
  console.log('🚀 Starting complete article generation pipeline...');
  
  const startTime = Date.now();

  try {
    // Step 1: Generate the main article content
    const contentTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'content.generate',
      priority: 'high',
      payload: {
        type: 'article',
        prompt: `Write a comprehensive article about ${topic.title}. Key points to cover: ${topic.keyPoints.join(', ')}`,
        context: {
          targetKeywords: topic.targetKeywords,
          tone: 'professional',
          wordCount: 1200,
          africanFocus: true
        },
        constraints: {
          includeKeywords: topic.targetKeywords,
          requireSources: true
        }
      } as ContentGenerationRequest,
      metadata: {
        articleId: `article_${Date.now()}`,
        source: 'complete_pipeline'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    console.log('✍️ Generating article content...');
    const articleResult = await aiOrchestrator.executeTask(contentTask);
    
    if (!articleResult.success) {
      throw new Error(`Article generation failed: ${articleResult.error}`);
    }

    const articleData = articleResult.result as ContentGenerationResult;
    const articleContent = articleData.content;

    // Step 2: Generate thumbnail image
    console.log('🎨 Creating article thumbnail...');
    const thumbnailTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'image.thumbnail',
      priority: 'medium',
      payload: {
        type: 'thumbnail',
        prompt: `Professional thumbnail for cryptocurrency article: ${topic.title}`,
        context: {
          articleTitle: topic.title,
          cryptoSymbols: topic.cryptoSymbols,
          africanFocus: true,
          aspectRatio: '16:9'
        },
        style: {
          artStyle: 'professional',
          includeText: false,
          colorScheme: 'crypto'
        },
        specifications: {
          size: '1792x1024',
          quality: 'hd'
        }
      } as ImageGenerationRequest,
      metadata: {
        articleId: `article_${Date.now()}`,
        source: 'complete_pipeline'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    const thumbnailResult = await aiOrchestrator.executeTask(thumbnailTask);
    const thumbnailUrl = thumbnailResult.success ? (thumbnailResult.result as ImageGenerationResult).imageUrl : '';

    // Step 3: Translate to key African languages
    console.log('🌍 Translating to African languages...');
    const targetLanguages = ['sw', 'fr', 'ar', 'pt']; // Swahili, French, Arabic, Portuguese
    const translations: Record<string, string> = {};

    const translationTasks = targetLanguages.map(lang => ({
      type: 'translation.auto' as const,
      priority: 'medium' as const,
      payload: {
        text: articleContent,
        sourceLanguage: 'en',
        targetLanguage: lang,
        context: {
          contentType: 'article',
          preserveFormatting: true,
          tone: 'formal'
        }
      } as TranslationRequest,
      metadata: {
        articleId: `article_${Date.now()}`,
        language: lang,
        source: 'complete_pipeline'
      },
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    }));

    const translationResults = await aiOrchestrator.executeBatch(translationTasks);
    
    translationResults.forEach((result, index) => {
      if (result.success) {
        const translationData = result.result as TranslationResult;
        translations[targetLanguages[index]] = translationData.translatedText;
      }
    });

    // Step 4: Generate social media images
    console.log('📱 Creating social media images...');
    const socialImageTasks = [
      {
        type: 'image.generate' as const,
        priority: 'low' as const,
        payload: {
          type: 'social_image',
          prompt: `Social media post image for: ${topic.title}`,
          context: {
            articleTitle: topic.title,
            cryptoSymbols: topic.cryptoSymbols,
            aspectRatio: '1:1'
          },
          style: {
            artStyle: 'vibrant',
            includeText: true,
            colorScheme: 'brand'
          },
          specifications: {
            size: '1024x1024',
            quality: 'standard'
          }
        } as ImageGenerationRequest,
        metadata: {
          articleId: `article_${Date.now()}`,
          source: 'social_pipeline'
        },
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 2
      }
    ];

    const socialResults = await aiOrchestrator.executeBatch(socialImageTasks);
    const socialImages = socialResults
      .filter(r => r.success)
      .map(r => (r.result as ImageGenerationResult).imageUrl);

    const totalProcessingTime = Date.now() - startTime;

    console.log('✅ Complete article pipeline finished!', {
      contentLength: articleContent.length,
      translations: Object.keys(translations).length,
      thumbnail: !!thumbnailUrl,
      socialImages: socialImages.length,
      totalTime: totalProcessingTime
    });

    return {
      article: articleContent,
      translations,
      thumbnail: thumbnailUrl,
      socialImages,
      seoScore: articleData.metadata?.seoScore || 0,
      processingTime: totalProcessingTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Pipeline failed';
    console.error('❌ Complete article pipeline failed:', errorMessage);
    throw new Error(`Article pipeline failed: ${errorMessage}`);
  }
}

// Example 2: Multi-language Content Creation
export async function createMultiLanguageContent(baseContent: {
  headline: string;
  summary: string;
  targetLanguages: string[];
}): Promise<{
  originalContent: { headline: string; summary: string };
  translations: Record<string, { headline: string; summary: string }>;
  visualContent: Record<string, string>;
  processingStats: { totalTime: number; successRate: number };
}> {
  console.log('🌐 Creating multi-language content package...');
  
  const startTime = Date.now();
  const results: Record<string, { headline: string; summary: string }> = {};
  const visualContent: Record<string, string> = {};

  try {
    // Create translation tasks for both headline and summary
    const translationTasks: Array<Omit<AITask, 'id' | 'status' | 'assignedAgent'>> = [];

    for (const targetLang of baseContent.targetLanguages) {
      // Headline translation
      translationTasks.push({
        type: 'translation.auto',
        priority: 'high',
        payload: {
          text: baseContent.headline,
          sourceLanguage: 'en',
          targetLanguage: targetLang,
          context: {
            contentType: 'headline',
            tone: 'formal'
          }
        } as TranslationRequest,
        metadata: {
          language: targetLang,
          source: 'multilang_pipeline'
        } as Record<string, unknown>,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 2
      });

      // Summary translation
      translationTasks.push({
        type: 'translation.auto',
        priority: 'medium',
        payload: {
          text: baseContent.summary,
          sourceLanguage: 'en',
          targetLanguage: targetLang,
          context: {
            contentType: 'article',
            tone: 'formal'
          }
        } as TranslationRequest,
        metadata: {
          language: targetLang,
          source: 'multilang_pipeline'
        } as Record<string, unknown>,
        createdAt: Date.now(),
        retryCount: 0,
        maxRetries: 2
      });
    }

    console.log(`📝 Translating content to ${baseContent.targetLanguages.length} languages...`);
    const translationResults = await aiOrchestrator.executeBatch(translationTasks);

    // Process translation results
    let successCount = 0;
    baseContent.targetLanguages.forEach((lang, langIndex) => {
      const headlineIndex = langIndex * 2;
      const summaryIndex = langIndex * 2 + 1;
      
      const headlineResult = translationResults[headlineIndex];
      const summaryResult = translationResults[summaryIndex];

      if (headlineResult.success && summaryResult.success) {
        results[lang] = {
          headline: (headlineResult.result as TranslationResult).translatedText,
          summary: (summaryResult.result as TranslationResult).translatedText
        };
        successCount += 2;
      }
    });

    // Generate localized visual content
    console.log('🎨 Creating localized visual content...');
    for (const lang of baseContent.targetLanguages) {
      if (results[lang]) {
        try {
          const visualTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
            type: 'image.generate',
            priority: 'low',
            payload: {
              type: 'social_image',
              prompt: `Create a social media image with text: "${results[lang].headline}"`,
              context: {
                articleTitle: results[lang].headline,
                africanFocus: true
              },
              style: {
                artStyle: 'modern',
                includeText: true,
                colorScheme: 'brand'
              },
              specifications: {
                size: '1024x1024',
                quality: 'standard'
              }
            } as ImageGenerationRequest,
            metadata: {
              language: lang,
              source: 'visual_localization'
            },
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 1
          };

          const visualResult = await aiOrchestrator.executeTask(visualTask);
          if (visualResult.success) {
            visualContent[lang] = (visualResult.result as ImageGenerationResult).imageUrl;
          }
        } catch (error) {
          console.warn(`Visual content generation failed for ${lang}:`, error);
        }
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successRate = successCount / translationTasks.length;

    console.log('✅ Multi-language content creation completed!', {
      languages: Object.keys(results).length,
      visualAssets: Object.keys(visualContent).length,
      successRate: Math.round(successRate * 100) + '%',
      totalTime: totalProcessingTime
    });

    return {
      originalContent: {
        headline: baseContent.headline,
        summary: baseContent.summary
      },
      translations: results,
      visualContent,
      processingStats: {
        totalTime: totalProcessingTime,
        successRate
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Multi-language pipeline failed';
    console.error('❌ Multi-language content creation failed:', errorMessage);
    throw new Error(`Multi-language pipeline failed: ${errorMessage}`);
  }
}

// Example 3: Content Optimization and Enhancement
export async function optimizeContentForSEO(existingArticle: {
  title: string;
  content: string;
  targetKeywords: string[];
}): Promise<{
  optimizedContent: string;
  improvedTitle: string;
  metaDescription: string;
  thumbnail: string;
  seoImprovements: string[];
  processingTime: number;
}> {
  console.log('🔍 Starting SEO content optimization...');
  
  const startTime = Date.now();

  try {
    // Step 1: Optimize the main content
    const contentOptimizationTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'content.optimize',
      priority: 'high',
      payload: {
        type: 'article',
        prompt: `Optimize this cryptocurrency article for SEO while maintaining quality and readability: ${existingArticle.content}`,
        context: {
          targetKeywords: existingArticle.targetKeywords,
          tone: 'professional',
          africanFocus: true
        },
        constraints: {
          includeKeywords: existingArticle.targetKeywords,
          maxLength: existingArticle.content.length * 1.2 // Allow 20% expansion
        }
      } as ContentGenerationRequest,
      metadata: {
        source: 'seo_optimization'
      } as Record<string, unknown>,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    // Step 2: Generate improved title
    const titleTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'content.generate',
      priority: 'medium',
      payload: {
        type: 'headline',
        prompt: `Create an SEO-optimized headline for this cryptocurrency article. Original title: "${existingArticle.title}"`,
        context: {
          targetKeywords: existingArticle.targetKeywords,
          tone: 'professional'
        },
        constraints: {
          maxLength: 60,
          includeKeywords: existingArticle.targetKeywords.slice(0, 2)
        }
      } as ContentGenerationRequest,
      metadata: {
        source: 'seo_optimization'
      } as Record<string, unknown>,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    // Step 3: Generate meta description
    const metaTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'content.generate',
      priority: 'medium',
      payload: {
        type: 'meta_description',
        prompt: `Create an SEO-optimized meta description for this article: ${existingArticle.title}`,
        context: {
          targetKeywords: existingArticle.targetKeywords,
          tone: 'professional'
        },
        constraints: {
          maxLength: 160,
          includeKeywords: existingArticle.targetKeywords
        }
      } as ContentGenerationRequest,
      metadata: {
        source: 'seo_optimization'
      } as Record<string, unknown>,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    console.log('📈 Optimizing content, title, and meta description...');
    const optimizationResults = await aiOrchestrator.executeBatch([
      contentOptimizationTask,
      titleTask,
      metaTask
    ]);

    const optimizedContent = optimizationResults[0].success 
      ? (optimizationResults[0].result as ContentGenerationResult).content 
      : existingArticle.content;
    
    const improvedTitle = optimizationResults[1].success 
      ? (optimizationResults[1].result as ContentGenerationResult).content 
      : existingArticle.title;
    
    const metaDescription = optimizationResults[2].success 
      ? (optimizationResults[2].result as ContentGenerationResult).content 
      : '';

    // Step 4: Generate optimized thumbnail
    console.log('🖼️ Creating SEO-optimized thumbnail...');
    const thumbnailTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
      type: 'image.thumbnail',
      priority: 'low',
      payload: {
        type: 'thumbnail',
        prompt: `Professional, SEO-optimized thumbnail for: ${improvedTitle}`,
        context: {
          articleTitle: improvedTitle,
          africanFocus: true,
          aspectRatio: '16:9'
        },
        style: {
          artStyle: 'professional',
          colorScheme: 'crypto'
        },
        specifications: {
          size: '1792x1024',
          quality: 'hd'
        }
      } as ImageGenerationRequest,
      metadata: {
        source: 'seo_thumbnail'
      } as Record<string, unknown>,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 2
    };

    const thumbnailResult = await aiOrchestrator.executeTask(thumbnailTask);
    const thumbnailUrl = thumbnailResult.success ? (thumbnailResult.result as ImageGenerationResult).imageUrl : '';

    // Compile SEO improvements
    const seoImprovements = [
      'Content optimized for target keywords',
      'Title enhanced for search engines',
      'Meta description created',
      'Professional thumbnail generated',
      'Content structure improved for readability'
    ];

    const totalProcessingTime = Date.now() - startTime;

    console.log('✅ SEO optimization completed!', {
      contentImproved: optimizedContent !== existingArticle.content,
      titleImproved: improvedTitle !== existingArticle.title,
      metaGenerated: !!metaDescription,
      thumbnailGenerated: !!thumbnailUrl,
      processingTime: totalProcessingTime
    });

    return {
      optimizedContent,
      improvedTitle,
      metaDescription,
      thumbnail: thumbnailUrl,
      seoImprovements,
      processingTime: totalProcessingTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'SEO optimization failed';
    console.error('❌ SEO optimization failed:', errorMessage);
    throw new Error(`SEO optimization failed: ${errorMessage}`);
  }
}

// Example 4: Batch Content Processing for Multiple Articles
export async function batchProcessArticles(articles: Array<{
  id: string;
  title: string;
  content: string;
  cryptoSymbols: string[];
}>): Promise<{
  processedArticles: Array<{
    id: string;
    thumbnail: string;
    socialImage: string;
    translations: Record<string, string>;
  }>;
  statistics: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    totalTime: number;
  };
}> {
  console.log(`🔄 Starting batch processing for ${articles.length} articles...`);
  
  const startTime = Date.now();
  const processedArticles: Array<{
    id: string;
    thumbnail: string;
    socialImage: string;
    translations: Record<string, string>;
  }> = [];

  try {
    for (const article of articles) {
      console.log(`📝 Processing article: ${article.title.substring(0, 50)}...`);
      
      try {
        // Generate thumbnail and social image in parallel
        const visualTasks = [
          {
            type: 'image.thumbnail' as const,
            priority: 'medium' as const,
            payload: {
              type: 'thumbnail',
              prompt: `Professional thumbnail for: ${article.title}`,
              context: {
                articleTitle: article.title,
                cryptoSymbols: article.cryptoSymbols,
                africanFocus: true
              },
              specifications: {
                size: '1792x1024',
                quality: 'standard'
              }
            } as ImageGenerationRequest,
            metadata: {
              articleId: article.id,
              source: 'batch_processing'
            },
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 1
          },
          {
            type: 'image.generate' as const,
            priority: 'low' as const,
            payload: {
              type: 'social_image',
              prompt: `Social media image for: ${article.title}`,
              context: {
                articleTitle: article.title,
                cryptoSymbols: article.cryptoSymbols
              },
              specifications: {
                size: '1024x1024',
                quality: 'standard'
              }
            } as ImageGenerationRequest,
            metadata: {
              articleId: article.id,
              source: 'batch_social'
            },
            createdAt: Date.now(),
            retryCount: 0,
            maxRetries: 1
          }
        ];

        const visualResults = await aiOrchestrator.executeBatch(visualTasks);
        
        // Translate to key African languages
        const translationTask: Omit<AITask, 'id' | 'status' | 'assignedAgent'> = {
          type: 'translation.auto',
          priority: 'low',
          payload: {
            text: article.content.substring(0, 1000), // First 1000 chars for summary
            sourceLanguage: 'en',
            targetLanguage: 'sw', // Swahili as primary African language
            context: {
              contentType: 'article',
              tone: 'formal'
            }
          } as TranslationRequest,
          metadata: {
            articleId: article.id,
            source: 'batch_translation'
          },
          createdAt: Date.now(),
          retryCount: 0,
          maxRetries: 1
        };

        const translationResult = await aiOrchestrator.executeTask(translationTask);

        processedArticles.push({
          id: article.id,
          thumbnail: visualResults[0].success ? (visualResults[0].result as ImageGenerationResult).imageUrl : '',
          socialImage: visualResults[1].success ? (visualResults[1].result as ImageGenerationResult).imageUrl : '',
          translations: {
            sw: translationResult.success ? (translationResult.result as TranslationResult).translatedText : ''
          }
        });

      } catch (articleError) {
        console.warn(`Failed to process article ${article.id}:`, articleError);
        processedArticles.push({
          id: article.id,
          thumbnail: '',
          socialImage: '',
          translations: {}
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successfulArticles = processedArticles.filter(a => 
      a.thumbnail || a.socialImage || Object.keys(a.translations).length > 0
    ).length;

    const statistics = {
      totalProcessed: processedArticles.length,
      successRate: successfulArticles / articles.length,
      averageProcessingTime: totalProcessingTime / articles.length,
      totalTime: totalProcessingTime
    };

    console.log('✅ Batch processing completed!', statistics);

    return {
      processedArticles,
      statistics
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Batch processing failed';
    console.error('❌ Batch processing failed:', errorMessage);
    throw new Error(`Batch processing failed: ${errorMessage}`);
  }
}

// Usage demonstration
export const phase2Examples = {
  generateCompleteArticle,
  createMultiLanguageContent,
  optimizeContentForSEO,
  batchProcessArticles
};
