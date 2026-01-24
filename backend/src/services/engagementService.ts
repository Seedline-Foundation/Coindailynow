// backend/src/services/engagementService.ts
// Task 66: Engagement, UX & Personalization Layer - Backend Service

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import webpush from 'web-push';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@coindaily.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PersonalizationConfig {
  newContentWeight: number;
  trendingWeight: number;
  personalWeight: number;
}

interface RecommendationOptions {
  limit?: number;
  context?: string;
  excludeRead?: boolean;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  actionUrl?: string;
  userId?: string;
  segment?: string;
}

export class EngagementService {
  /**
   * Initialize user preferences and behavior tracking
   */
  async initializeUser(userId: string) {
    // Check if already initialized
    const existing = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    // Create default preferences
    const preference = await prisma.userPreference.create({
      data: {
        userId,
        favoriteCategories: JSON.stringify([]),
        followedAuthors: JSON.stringify([]),
        blockedCategories: JSON.stringify([]),
        contentLanguages: JSON.stringify(['en']),
        preferredTopics: JSON.stringify([]),
      },
    });

    // Initialize behavior tracking
    await prisma.userBehavior.create({
      data: {
        userId,
        avgReadingTime: 0,
        avgScrollDepth: 0,
        preferredReadingTime: JSON.stringify({}),
        topCategories: JSON.stringify([]),
        topAuthors: JSON.stringify([]),
        topTags: JSON.stringify([]),
        sentimentProfile: JSON.stringify({ positive: 0.5, neutral: 0.5, negative: 0 }),
      },
    });

    // Initialize personalization model
    await prisma.personalizationModel.create({
      data: {
        userId,
        categoryWeights: JSON.stringify({}),
        authorWeights: JSON.stringify({}),
        tagWeights: JSON.stringify({}),
        timePreferences: JSON.stringify({}),
        lengthPreference: 0.5,
        complexityPreference: 0.5,
      },
    });

    return preference;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: any) {
    return await prisma.userPreference.upsert({
      where: { userId },
      update: {
        ...preferences,
        updatedAt: new Date(),
      },
      create: {
        userId,
        favoriteCategories: JSON.stringify(preferences.favoriteCategories || []),
        followedAuthors: JSON.stringify(preferences.followedAuthors || []),
        blockedCategories: JSON.stringify(preferences.blockedCategories || []),
        contentLanguages: JSON.stringify(preferences.contentLanguages || ['en']),
        preferredTopics: JSON.stringify(preferences.preferredTopics || []),
        ...preferences,
      },
    });
  }

  /**
   * Track user reading behavior
   */
  async trackReadingBehavior(
    userId: string,
    articleId: string,
    metrics: {
      duration: number;
      scrollPercentage: number;
      completed: boolean;
      deviceType: string;
    }
  ) {
    // Update user behavior stats
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    });

    if (behavior) {
      const newAvgReadingTime = Math.round(
        (behavior.avgReadingTime * behavior.articlesRead + metrics.duration) /
          (behavior.articlesRead + 1)
      );

      const newAvgScrollDepth =
        (behavior.avgScrollDepth * behavior.articlesRead + metrics.scrollPercentage) /
          (behavior.articlesRead + 1);

      await prisma.userBehavior.update({
        where: { userId },
        data: {
          avgReadingTime: newAvgReadingTime,
          avgScrollDepth: newAvgScrollDepth,
          articlesRead: behavior.articlesRead + 1,
          lastEngagement: new Date(),
          devicePreference: metrics.deviceType,
        },
      });
    }

    // Check for reading rewards
    await this.awardReadingPoints(userId, articleId, metrics);

    // Update streak
    await this.updateStreak(userId);

    // Retrain personalization model
    await this.updatePersonalizationModel(userId);
  }

  /**
   * Award reading points based on engagement
   */
  async awardReadingPoints(
    userId: string,
    articleId: string,
    metrics: {
      duration: number;
      scrollPercentage: number;
      completed: boolean;
    }
  ) {
    let points = 0;
    let rewardType = 'READ';
    let multiplier = 1.0;

    // Base points for reading
    if (metrics.scrollPercentage >= 25) points += 5;
    if (metrics.scrollPercentage >= 50) points += 10;
    if (metrics.scrollPercentage >= 75) points += 15;
    if (metrics.completed) points += 20;

    // Duration bonus (min 30s, max 5 min for bonus)
    const durationBonus = Math.min(Math.floor(metrics.duration / 30), 10);
    points += durationBonus;

    // Check for streak multiplier
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    });

    if (behavior && behavior.currentStreak > 0) {
      multiplier = 1 + Math.min(behavior.currentStreak * 0.1, 1.0); // Max 2x multiplier
    }

    const finalPoints = Math.round(points * multiplier);

    // Create reward record
    const reward = await prisma.readingReward.create({
      data: {
        userId,
        articleId,
        rewardType,
        pointsEarned: finalPoints,
        multiplier,
        readDuration: metrics.duration,
        scrollPercentage: metrics.scrollPercentage,
        completedArticle: metrics.completed,
      },
    });

    // Check for milestones
    await this.checkMilestones(userId);

    return reward;
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string) {
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    });

    if (!behavior) return;

    const now = new Date();
    const lastVisit = new Date(behavior.lastVisitDate);
    const hoursDiff = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);

    let newStreak = behavior.currentStreak;

    if (hoursDiff < 24) {
      // Same day, maintain streak
      return;
    } else if (hoursDiff < 48) {
      // Next day, increment streak
      newStreak = behavior.currentStreak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, behavior.longestStreak);

    await prisma.userBehavior.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastVisitDate: now,
      },
    });

    // Award streak bonus
    if (newStreak % 7 === 0) {
      await prisma.readingReward.create({
        data: {
          userId,
          articleId: 'STREAK_BONUS',
          rewardType: 'STREAK',
          pointsEarned: newStreak * 10,
          multiplier: 1.0,
          readDuration: 0,
          scrollPercentage: 0,
          completedArticle: false,
        },
      });
    }
  }

  /**
   * Check and award milestones
   */
  async checkMilestones(userId: string) {
    const behavior = await prisma.userBehavior.findUnique({
      where: { userId },
    });

    if (!behavior) return;

    const milestones = [
      { type: 'ARTICLES_READ', thresholds: [10, 50, 100, 500, 1000], points: [100, 500, 1000, 5000, 10000] },
      { type: 'DAYS_ACTIVE', thresholds: [7, 30, 90, 180, 365], points: [200, 1000, 3000, 7000, 15000] },
      { type: 'SHARES', thresholds: [5, 25, 100, 500], points: [50, 250, 1000, 5000] },
      { type: 'COMMENTS', thresholds: [10, 50, 200, 1000], points: [100, 500, 2000, 10000] },
    ];

    for (const milestone of milestones) {
      for (let i = 0; i < milestone.thresholds.length; i++) {
        const threshold = milestone.thresholds[i]!; // Non-null assertion
        let currentValue = 0;

        switch (milestone.type) {
          case 'ARTICLES_READ':
            currentValue = behavior.articlesRead;
            break;
          case 'DAYS_ACTIVE':
            currentValue = behavior.currentStreak;
            break;
          case 'SHARES':
            currentValue = behavior.articlesShared;
            break;
          case 'COMMENTS':
            currentValue = behavior.commentsPosted;
            break;
        }

        if (currentValue >= threshold) {
          const existing = await prisma.engagementMilestone.findFirst({
            where: {
              userId,
              type: milestone.type,
              threshold,
            },
          });

          if (!existing) {
            await prisma.engagementMilestone.create({
              data: {
                userId,
                type: milestone.type,
                threshold,
                currentValue,
                achieved: true,
                achievedAt: new Date(),
                rewardPoints: milestone.points[i],
                rewardBadge: JSON.stringify({
                  id: `${milestone.type}_${threshold}`,
                  name: `${milestone.type.replace('_', ' ')} Master`,
                  icon: '🏆',
                }),
              },
            });
          }
        }
      }
    }
  }

  /**
   * Generate personalized content recommendations using AI
   */
  async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ) {
    const { limit = 20, context = 'HOME', excludeRead = true } = options;

    // Get user behavior and preferences
    const [behavior, preferences, model] = await Promise.all([
      prisma.userBehavior.findUnique({ where: { userId } }),
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.personalizationModel.findUnique({ where: { userId } }),
    ]);

    if (!behavior || !preferences || !model) {
      // Return trending content for new users
      return this.getTrendingContent(limit);
    }

    // Parse weights
    const categoryWeights = JSON.parse(model.categoryWeights);
    const authorWeights = JSON.parse(model.authorWeights);
    const tagWeights = JSON.parse(model.tagWeights);

    // Get recent articles
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
        },
      },
      include: {
        Category: true,
        User: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 200,
    });

    // Score each article
    const scoredArticles = articles.map((article) => {
      let score = 0;

      // Category score
      const categoryWeight = categoryWeights[article.categoryId] || 0;
      score += categoryWeight * model.personalWeight;

      // Author score
      const authorWeight = authorWeights[article.authorId] || 0;
      score += authorWeight * model.personalWeight;

      // Trending score (based on views and engagement)
      const trendingScore =
        (article.viewCount * 0.4 +
          article.likeCount * 2 +
          article.shareCount * 3 +
          article.commentCount * 2.5) /
        100;
      score += trendingScore * model.trendingWeight;

      // Recency score
      const hoursOld =
        (Date.now() - new Date(article.publishedAt!).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - hoursOld / 168); // Decay over 1 week
      score += recencyScore * model.newContentWeight;

      // Reading time match
      const preferredLength =
        preferences.contentLength === 'SHORT'
          ? 5
          : preferences.contentLength === 'LONG'
          ? 15
          : 10;
      const lengthDiff = Math.abs(article.readingTimeMinutes - preferredLength);
      const lengthScore = Math.max(0, 1 - lengthDiff / 20);
      score += lengthScore * 0.1;

      return {
        ...article,
        recommendationScore: score,
      };
    });

    // Sort by score and take top N
    const recommendations = scoredArticles
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    // Create recommendation records
    const recommendationRecords = await Promise.all(
      recommendations.map((article, index) =>
        prisma.contentRecommendation.create({
          data: {
            userId,
            articleId: article.id,
            recommendationType: 'PERSONALIZED',
            score: article.recommendationScore,
            reason: JSON.stringify({
              factors: ['category_match', 'author_preference', 'trending', 'recency'],
            }),
            position: index,
            context,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        })
      )
    );

    return recommendations.map((article, index) => ({
      ...article,
      recommendationId: recommendationRecords[index]?.id || '',
    }));
  }

  /**
   * Get trending content for new/anonymous users
   */
  async getTrendingContent(limit: number = 20) {
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        Category: true,
        User: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { shareCount: 'desc' },
      ],
      take: limit,
    });

    return articles;
  }

  /**
   * Update personalization model based on user behavior
   */
  async updatePersonalizationModel(userId: string) {
    // Get user engagement history
    const engagements = await prisma.userEngagement.findMany({
      where: {
        userId,
        articleId: { not: null },
      },
      include: {
        Article: {
          include: {
            Category: true,
            User: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    if (engagements.length === 0) return;

    // Calculate category weights
    const categoryScores: Record<string, number> = {};
    const authorScores: Record<string, number> = {};
    const tagScores: Record<string, number> = {};

    engagements.forEach((engagement) => {
      if (!engagement.Article) return;

      const article = engagement.Article;
      const weight =
        engagement.actionType === 'READ'
          ? 1
          : engagement.actionType === 'LIKE'
          ? 2
          : engagement.actionType === 'SHARE'
          ? 3
          : engagement.actionType === 'COMMENT'
          ? 2.5
          : 0;

      // Category weights
      categoryScores[article.categoryId] =
        (categoryScores[article.categoryId] || 0) + weight;

      // Author weights
      authorScores[article.authorId] = (authorScores[article.authorId] || 0) + weight;

      // Tag weights
      if (article.tags) {
        const tags = JSON.parse(article.tags);
        tags.forEach((tag: string) => {
          tagScores[tag] = (tagScores[tag] || 0) + weight;
        });
      }
    });

    // Normalize scores
    const normalizeScores = (scores: Record<string, number>) => {
      const max = Math.max(...Object.values(scores));
      const normalized: Record<string, number> = {};
      for (const [key, value] of Object.entries(scores)) {
        normalized[key] = value / max;
      }
      return normalized;
    };

    const normalizedCategoryScores = normalizeScores(categoryScores);
    const normalizedAuthorScores = normalizeScores(authorScores);
    const normalizedTagScores = normalizeScores(tagScores);

    // Update model
    await prisma.personalizationModel.update({
      where: { userId },
      data: {
        categoryWeights: JSON.stringify(normalizedCategoryScores),
        authorWeights: JSON.stringify(normalizedAuthorScores),
        tagWeights: JSON.stringify(normalizedTagScores),
        lastTrained: new Date(),
        trainingDataPoints: engagements.length,
      },
    });
  }

  /**
   * Generate voice version of article using OpenAI TTS
   */
  async generateVoiceArticle(articleId: string) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Check if voice version already exists
    const existing = await prisma.voiceArticle.findUnique({
      where: { articleId },
    });

    if (existing) {
      return existing;
    }

    // Prepare text for TTS (strip HTML, limit length)
    const text = `${article.title}. ${article.excerpt}. ${article.content}`
      .replace(/<[^>]*>/g, '')
      .substring(0, 4000); // OpenAI TTS limit

    try {
      // Generate speech using OpenAI TTS
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
      });

      // Convert to buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());

      // In production, upload to Backblaze or CDN
      // For now, we'll store the path
      const audioUrl = `/audio/${articleId}.mp3`;

      // Create voice article record
      const voiceArticle = await prisma.voiceArticle.create({
        data: {
          articleId,
          audioUrl,
          duration: Math.ceil(text.length / 15), // Approximate duration
          fileSize: buffer.length,
          format: 'mp3',
          voiceModel: 'tts-1',
          voiceType: 'alloy',
          generationStatus: 'COMPLETED',
        },
      });

      return voiceArticle;
    } catch (error) {
      console.error('Error generating voice article:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeToPush(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    deviceInfo: {
      deviceType: string;
      browser: string;
      os: string;
    }
  ) {
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true,
        lastUsed: new Date(),
        ...deviceInfo,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        ...deviceInfo,
      },
    });

    return pushSubscription;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(payload: PushNotificationPayload) {
    // Create notification record
    const notification = await prisma.pushNotification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        image: payload.image,
        actionUrl: payload.actionUrl,
        segment: payload.segment,
        status: 'PENDING',
      },
    });

    try {
      // Get subscriptions
      const subscriptions = payload.userId
        ? await prisma.pushSubscription.findMany({
            where: {
              userId: payload.userId,
              isActive: true,
            },
          })
        : await prisma.pushSubscription.findMany({
            where: {
              isActive: true,
            },
            take: 1000, // Batch send
          });

      let sentCount = 0;
      let deliveredCount = 0;

      // Send to each subscription
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon,
              image: payload.image,
              data: {
                url: payload.actionUrl,
              },
            })
          );

          sentCount++;
          deliveredCount++;
        } catch (error: any) {
          console.error('Error sending push notification:', error);
          
          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }
        }
      }

      // Update notification status
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentCount,
          deliveredCount,
          sentAt: new Date(),
        },
      });

      return {
        notificationId: notification.id,
        sentCount,
        deliveredCount,
      };
    } catch (error) {
      await prisma.pushNotification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
        },
      });
      throw error;
    }
  }

  /**
   * Track PWA installation
   */
  async trackPWAInstall(
    installId: string,
    userId: string | null,
    installData: {
      platform: string;
      browser: string;
      deviceType: string;
      screenResolution: string;
      viewport: string;
    }
  ) {
    const install = await prisma.pWAInstall.upsert({
      where: { installId },
      update: {
        isActive: true,
        lastUsed: new Date(),
        sessionCount: { increment: 1 },
      },
      create: {
        installId,
        userId,
        ...installData,
      },
    });

    return install;
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(userId: string) {
    const [behavior, preferences, rewards, milestones] = await Promise.all([
      prisma.userBehavior.findUnique({ where: { userId } }),
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.readingReward.findMany({
        where: { userId },
        orderBy: { awardedAt: 'desc' },
        take: 10,
      }),
      prisma.engagementMilestone.findMany({
        where: { userId, achieved: true },
        orderBy: { achievedAt: 'desc' },
      }),
    ]);

    const totalPoints = await prisma.readingReward.aggregate({
      where: { userId },
      _sum: { pointsEarned: true },
    });

    return {
      behavior,
      preferences,
      recentRewards: rewards,
      milestones,
      totalPoints: totalPoints._sum.pointsEarned || 0,
    };
  }

  /**
   * Get platform-wide engagement analytics (for super admin)
   */
  async getEngagementAnalytics(dateRange?: { from: Date; to: Date }) {
    const where = dateRange
      ? {
          awardedAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : {};

    const [
      totalUsers,
      activeUsers,
      avgEngagementScore,
      totalRewards,
      pwaInstalls,
      pushSubscriptions,
      voiceArticles,
    ] = await Promise.all([
      prisma.userBehavior.count(),
      prisma.userBehavior.count({
        where: {
          lastEngagement: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.userBehavior.aggregate({
        _avg: { engagementScore: true },
      }),
      prisma.readingReward.aggregate({
        where,
        _sum: { pointsEarned: true },
        _count: true,
      }),
      prisma.pWAInstall.count({ where: { isActive: true } }),
      prisma.pushSubscription.count({ where: { isActive: true } }),
      prisma.voiceArticle.count(),
    ]);

    // Top engaged users
    const topUserBehaviors = await prisma.userBehavior.findMany({
      orderBy: { engagementScore: 'desc' },
      take: 10,
    });

    const topUsers = await Promise.all(
      topUserBehaviors.map(async (behavior) => {
        const user = await prisma.user.findUnique({
          where: { id: behavior.userId },
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        });
        return { ...behavior, User: user };
      })
    );

    // Recent milestones
    const recentMilestoneData = await prisma.engagementMilestone.findMany({
      where: { achieved: true },
      orderBy: { achievedAt: 'desc' },
      take: 20,
    });

    const recentMilestones = await Promise.all(
      recentMilestoneData.map(async (milestone) => {
        const user = await prisma.user.findUnique({
          where: { id: milestone.userId },
          select: {
            username: true,
            avatarUrl: true,
          },
        });
        return { ...milestone, User: user };
      })
    );

    return {
      overview: {
        totalUsers,
        activeUsers,
        avgEngagementScore: avgEngagementScore._avg.engagementScore || 0,
        pwaInstalls,
        pushSubscriptions,
        voiceArticles,
      },
      rewards: {
        total: totalRewards._sum?.pointsEarned || 0,
        count: totalRewards._count,
      },
      topUsers,
      recentMilestones,
    };
  }
}

export default new EngagementService();
