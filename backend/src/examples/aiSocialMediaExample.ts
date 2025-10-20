/**
 * AI Social Media Automation - Integration Example
 * Task 9.2 Implementation
 * 
 * This file demonstrates how to integrate the AI social media automation
 * system into your backend application.
 */

import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { merge } from 'lodash';

// Import AI Social Media Integration
import { aiSocialMediaIntegration } from '../integrations/aiSocialMediaIntegration';
import { startSocialMediaWorker, getWorkerStatus } from '../workers/aiSocialMediaWorker';
import { aiSocialMediaService } from '../services/aiSocialMediaService';

// ============================================================================
// MAIN INTEGRATION FUNCTION
// ============================================================================

async function setupAISocialMedia() {
  // ============================================================================
  // STEP 1: Mount REST API Routes
  // ============================================================================

  const app = express();

  // Mount at default path: /api/ai/social-media
  aiSocialMediaIntegration.mountRoutes(app);

  // Or mount at custom path:
  // aiSocialMediaIntegration.mountRoutes(app, '/api/social-automation');

  console.log('✅ AI Social Media REST API routes mounted');

  // ============================================================================
  // STEP 2: Integrate GraphQL Schema
  // ============================================================================

  const baseTypeDefs = `
    type Query {
      health: String
    }
    
    type Mutation {
      test: String
    }
  `;

  const baseResolvers = {
    Query: {
      health: () => 'OK',
    },
  };

  // Merge schemas
  const schema = makeExecutableSchema({
    typeDefs: [
      baseTypeDefs,
      aiSocialMediaIntegration.getGraphQLSchema(),
    ],
    resolvers: merge(
      baseResolvers,
      aiSocialMediaIntegration.getGraphQLResolvers(),
    ),
  });

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }) => ({
      user: (req as any).user, // From auth middleware
    }),
  });

  await apolloServer.start();
  (apolloServer as any).applyMiddleware({ app });

  console.log('✅ AI Social Media GraphQL schema integrated');

  // ============================================================================
  // STEP 3: Start Background Worker
  // ============================================================================

  // Start the background worker for automatic posting
  await startSocialMediaWorker();

  console.log('✅ AI Social Media background worker started');

  // ============================================================================
  // STEP 4: Health Check & Monitoring
  // ============================================================================

  // Perform initial health check
  const health = await aiSocialMediaIntegration.healthCheck();
  console.log('Health Check:', health);

  // Monitor worker status
  setInterval(() => {
    const status = getWorkerStatus();
    console.log('Worker Status:', {
      running: status.running,
      processed: status.processedCount,
    });
  }, 60000); // Every minute

  return app;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Manually post an article to all platforms
async function manuallyPostArticle(articleId: string) {
  try {
    const results = await aiSocialMediaService.autoPostArticle(articleId);
    
    const successCount = results.filter((r: any) => r.success).length;
    console.log(`✅ Posted to ${successCount}/${results.length} platforms`);
    
    results.forEach((result: any) => {
      if (result.success) {
        console.log(`  ✓ ${result.platform}: ${result.postUrl}`);
        if (result.prediction) {
          console.log(`    Expected likes: ${result.prediction.expectedLikes}`);
          console.log(`    Virality score: ${result.prediction.viralityScore}`);
        }
      } else {
        console.error(`  ✗ ${result.platform}: ${result.error}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Failed to post article:', error);
    throw error;
  }
}

// Example 2: Get platform analytics
async function getPlatformAnalytics(platform: string = 'TWITTER', days: number = 30) {
  try {
    const analytics = await aiSocialMediaService.getPlatformAnalytics(platform, days);
    
    console.log(`📊 ${platform} Analytics (${days} days):`);
    console.log(`  Total posts: ${analytics.totalPosts}`);
    console.log(`  Avg engagement rate: ${(analytics.avgEngagementRate * 100).toFixed(2)}%`);
    console.log(`  Total impressions: ${analytics.totalImpressions.toLocaleString()}`);
    console.log(`  Best posting time: ${analytics.bestPostingTime}`);
    console.log(`  Top hashtags:`);
    analytics.topHashtags.slice(0, 5).forEach((tag: any) => {
      console.log(`    #${tag.hashtag} - ${tag.count} posts (${tag.avgEngagement.toFixed(1)} avg engagement)`);
    });
    
    return analytics;
  } catch (error) {
    console.error('Failed to get analytics:', error);
    throw error;
  }
}

// Example 3: Track engagement for a post
async function trackEngagement(postId: string, metrics: {
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
}) {
  try {
    await aiSocialMediaService.trackEngagement(postId, metrics);
    console.log(`✅ Engagement tracked for post ${postId}`);
  } catch (error) {
    console.error('Failed to track engagement:', error);
    throw error;
  }
}

// ============================================================================
// ARTICLE PUBLISH HOOK
// ============================================================================

/**
 * Hook into article publishing to automatically post to social media
 */
async function onArticlePublished(articleId: string, prismaClient: any) {
  console.log(`📰 Article published: ${articleId}`);
  
  try {
    // The background worker will pick this up automatically within 30 seconds
    // But you can also trigger immediately for breaking news:
    
    const article = await prismaClient.article.findUnique({
      where: { id: articleId },
      select: { title: true, categoryId: true },
    });
    
    if (article?.title.toLowerCase().includes('breaking')) {
      console.log('🚨 Breaking news detected - posting immediately');
      await manuallyPostArticle(articleId);
    } else {
      console.log('📋 Article queued for automatic posting');
    }
    
  } catch (error) {
    console.error('Failed to process article publication:', error);
  }
}

// ============================================================================
// API ROUTE EXAMPLES (Add these inside setupAISocialMedia function)
// ============================================================================

function setupCustomRoutes(app: express.Express) {
  // Custom route: Post article immediately
  app.post('/api/articles/:articleId/post-to-social', async (req, res) => {
    try {
      const { articleId } = req.params;
      const results = await manuallyPostArticle(articleId);
      
      res.json({
        success: true,
        results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Custom route: Get social media overview
  app.get('/api/social-media/overview', async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      
      const platforms = ['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN'];
      const analyticsPromises = platforms.map(platform =>
        aiSocialMediaService.getPlatformAnalytics(platform, days).catch(() => null)
      );
      
      const results = await Promise.all(analyticsPromises);
      
      const overview = {
        twitter: results[0],
        facebook: results[1],
        instagram: results[2],
        linkedin: results[3],
        period: `${days} days`,
      };
      
      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(apolloServer: any) {
  console.log('Shutting down gracefully...');
  
  // Stop worker
  const { stopSocialMediaWorker } = await import('../workers/aiSocialMediaWorker');
  await stopSocialMediaWorker();
  
  // Stop Apollo Server
  await apolloServer.stop();
  
  process.exit(0);
}

// ============================================================================
// START SERVER FUNCTION
// ============================================================================

async function startServer() {
  const app = await setupAISocialMedia();
  setupCustomRoutes(app);
  
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 REST API: http://localhost:${PORT}/api/ai/social-media`);
  });
}

// ============================================================================
// EXAMPLE USAGE IN PRODUCTION
// ============================================================================

/*

// When an article is published:
await onArticlePublished('article_123', prisma);

// Get analytics for decision making:
const twitterAnalytics = await getPlatformAnalytics('TWITTER', 30);

// Manual post for important announcements:
await manuallyPostArticle('breaking_news_article');

// Track engagement from platform webhooks:
await trackEngagement('post_123', {
  likes: 150,
  comments: 12,
  shares: 8,
  impressions: 5000,
});

*/

// ============================================================================
// EXPORTS
// ============================================================================

export {
  setupAISocialMedia,
  manuallyPostArticle,
  getPlatformAnalytics,
  trackEngagement,
  onArticlePublished,
  startServer,
  setupCustomRoutes,
  gracefulShutdown,
};
