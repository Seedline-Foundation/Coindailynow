import { GraphQLContext } from './context';

function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new Error('Authentication required');
  }
}

function isAdmin(context: GraphQLContext): boolean {
  const role = context.user?.role?.toUpperCase() || '';
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function isSupport(context: GraphQLContext): boolean {
  const role = context.user?.role?.toUpperCase() || '';
  return role === 'SUPPORT';
}

function requireAdminOrSupport(context: GraphQLContext) {
  if (!isAdmin(context) && !isSupport(context)) {
    throw new Error('Admin or support access required');
  }
}

function parseMetadata(input?: string | null): string | null {
  if (!input) return null;
  return input;
}

export const userDashboardResolvers = {
  Query: {
    myBookmarks: async (_: any, { limit = 50, offset = 0 }: { limit?: number; offset?: number }, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.userBookmark.findMany({
        where: { userId: context.user!.id },
        include: { article: { include: { Category: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    myReadingHistory: async (_: any, { limit = 50, offset = 0 }: { limit?: number; offset?: number }, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.readingHistory.findMany({
        where: { userId: context.user!.id },
        include: { article: { include: { Category: true } } },
        orderBy: { readAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    myNotifications: async (_: any, { unreadOnly = false, limit = 50, offset = 0 }: { unreadOnly?: boolean; limit?: number; offset?: number }, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.userNotification.findMany({
        where: { userId: context.user!.id, ...(unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    mySubscriptionStatus: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.subscription.findUnique({
        where: { userId: context.user!.id },
        include: { SubscriptionPlan: true },
      });
    },

    myWalletSummary: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.wallet.findFirst({
        where: { userId: context.user!.id },
        orderBy: { createdAt: 'desc' },
      });
    },

    myActivityEvents: async (_: any, { limit = 100, offset = 0 }: { limit?: number; offset?: number }, context: GraphQLContext) => {
      requireAuth(context);
      return context.prisma.analyticsEvent.findMany({
        where: { userId: context.user!.id },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });
    },

    adminUserDashboard: async (_: any, { userId }: { userId: string }, context: GraphQLContext) => {
      requireAdminOrSupport(context);

      const user = await context.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          subscriptionTier: true,
        },
      });
      if (!user) {
        throw new Error('User not found');
      }

      const notifications = await context.prisma.userNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (isSupport(context)) {
        return {
          user,
          bookmarks: [],
          readingHistory: [],
          notifications,
          subscription: null,
          wallet: null,
          activityEvents: [],
        };
      }

      const [bookmarks, readingHistory, subscription, wallet, activityEvents] = await Promise.all([
        context.prisma.userBookmark.findMany({
          where: { userId },
          include: { article: { include: { Category: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        context.prisma.readingHistory.findMany({
          where: { userId },
          include: { article: { include: { Category: true } } },
          orderBy: { readAt: 'desc' },
          take: 20,
        }),
        context.prisma.subscription.findUnique({
          where: { userId },
          include: { SubscriptionPlan: true },
        }),
        context.prisma.wallet.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        context.prisma.analyticsEvent.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
      ]);

      return { user, bookmarks, readingHistory, notifications, subscription, wallet, activityEvents };
    },

    adminUserMessages: async (_: any, { userId, limit = 50, offset = 0 }: { userId: string; limit?: number; offset?: number }, context: GraphQLContext) => {
      requireAdminOrSupport(context);
      return context.prisma.userNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    },
  },

  Mutation: {
    markMyNotificationRead: async (_: any, { notificationId }: { notificationId: string }, context: GraphQLContext) => {
      requireAuth(context);
      const notification = await context.prisma.userNotification.findFirst({
        where: { id: notificationId, userId: context.user!.id },
      });
      if (!notification) {
        throw new Error('Notification not found');
      }
      return context.prisma.userNotification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    },

    markAllMyNotificationsRead: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      const result = await context.prisma.userNotification.updateMany({
        where: { userId: context.user!.id, read: false },
        data: { read: true },
      });
      return result.count;
    },

    removeMyBookmark: async (_: any, { articleId }: { articleId: string }, context: GraphQLContext) => {
      requireAuth(context);
      await context.prisma.userBookmark.deleteMany({
        where: { userId: context.user!.id, articleId },
      });
      return true;
    },

    clearMyReadingHistory: async (_: any, __: any, context: GraphQLContext) => {
      requireAuth(context);
      const result = await context.prisma.readingHistory.deleteMany({
        where: { userId: context.user!.id },
      });
      return result.count;
    },

    deleteMyNotification: async (_: any, { notificationId }: { notificationId: string }, context: GraphQLContext) => {
      requireAuth(context);
      const result = await context.prisma.userNotification.deleteMany({
        where: { id: notificationId, userId: context.user!.id },
      });
      return result.count > 0;
    },

    trackMyReading: async (
      _: any,
      { articleId, readDurationSec, scrollPercent, completed }: { articleId: string; readDurationSec?: number; scrollPercent?: number; completed?: boolean },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      return context.prisma.readingHistory.upsert({
        where: { userId_articleId: { userId: context.user!.id, articleId } },
        create: {
          userId: context.user!.id,
          articleId,
          readDurationSec: readDurationSec || null,
          scrollPercent: scrollPercent || null,
          completed: !!completed,
          readAt: new Date(),
        },
        update: {
          readDurationSec: readDurationSec || undefined,
          scrollPercent: scrollPercent || undefined,
          completed: completed ?? undefined,
          readAt: new Date(),
        },
        include: { article: { include: { Category: true } } },
      });
    },

    adminMarkNotificationRead: async (_: any, { userId, notificationId }: { userId: string; notificationId: string }, context: GraphQLContext) => {
      requireAdminOrSupport(context);
      const notification = await context.prisma.userNotification.findFirst({
        where: { id: notificationId, userId },
      });
      if (!notification) {
        throw new Error('Notification not found for user');
      }
      return context.prisma.userNotification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    },

    adminCreateUserNotification: async (
      _: any,
      { userId, type, title, message, link }: { userId: string; type: string; title: string; message: string; link?: string },
      context: GraphQLContext
    ) => {
      requireAdminOrSupport(context);
      return context.prisma.userNotification.create({
        data: { userId, type, title, message, link },
      });
    },

    adminCancelUserSubscription: async (
      _: any,
      { userId, reason }: { userId: string; reason?: string },
      context: GraphQLContext
    ) => {
      if (!isAdmin(context)) {
        throw new Error('Admin access required');
      }
      await context.prisma.subscription.update({
        where: { userId },
        data: {
          status: 'CANCELLED',
          cancelAtPeriodEnd: true,
          cancelledAt: new Date(),
        },
      });
      if (reason) {
        await context.prisma.userNotification.create({
          data: {
            userId,
            type: 'SUBSCRIPTION_CANCELLED',
            title: 'Subscription Updated',
            message: `Your subscription has been cancelled by support team. Reason: ${reason}`,
          },
        });
      }
      return true;
    },

    adminRefundSubscriptionPayment: async (
      _: any,
      { paymentId, reason }: { paymentId: string; reason?: string },
      context: GraphQLContext
    ) => {
      if (!isAdmin(context)) {
        throw new Error('Admin access required');
      }
      const payment = await context.prisma.subscriptionPayment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
      await context.prisma.userNotification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_REFUND',
          title: 'Subscription Refund Processed',
          message: reason ? `A refund was processed. Reason: ${reason}` : 'A refund was processed for your subscription payment.',
        },
      });
      return true;
    },

    adminResetNotificationPreferences: async (
      _: any,
      { userId, reason }: { userId: string; reason?: string },
      context: GraphQLContext
    ) => {
      requireAdminOrSupport(context);
      await context.prisma.userProfile.updateMany({
        where: { userId },
        data: { notificationPreferences: null },
      });
      await context.prisma.userNotification.create({
        data: {
          userId,
          type: 'NOTIFICATION_PREFS_RESET',
          title: 'Notification Preferences Reset',
          message: reason
            ? `Your notification preferences were reset by support. Reason: ${reason}`
            : 'Your notification preferences were reset by support.',
        },
      });
      return true;
    },

    adminToggleUserShadowBan: async (
      _: any,
      { userId, shadowBanned, reason }: { userId: string; shadowBanned: boolean; reason?: string },
      context: GraphQLContext
    ) => {
      requireAdminOrSupport(context);
      await context.prisma.user.update({
        where: { id: userId },
        data: { isShadowBanned: shadowBanned },
      });

      await context.prisma.analyticsEvent.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          sessionId: `admin-${context.user!.id}`,
          eventType: shadowBanned ? 'USER_SHADOW_BANNED' : 'USER_SHADOW_UNBANNED',
          resourceId: userId,
          resourceType: 'USER',
          properties: JSON.stringify({
            actedBy: context.user!.id,
            actedByRole: context.user!.role,
            reason: reason || null,
          }),
          metadata: JSON.stringify({ source: 'admin-mirror' }),
        },
      });
      return true;
    },
  },

  UserDashboard: {
    user: (parent: any) => parent.user,
    bookmarks: (parent: any) => parent.bookmarks || [],
    readingHistory: (parent: any) => parent.readingHistory || [],
    notifications: (parent: any) => parent.notifications || [],
    subscription: (parent: any) => parent.subscription || null,
    wallet: (parent: any) => parent.wallet || null,
    activityEvents: (parent: any) => parent.activityEvents || [],
  },

  UserBookmarkItem: {
    article: (parent: any) => parent.article,
  },

  ReadingHistoryItem: {
    article: (parent: any) => parent.article,
  },

  UserActivityEvent: {
    properties: (parent: any) => parseMetadata(parent.properties),
    metadata: (parent: any) => parseMetadata(parent.metadata),
  },

  UserSubscriptionStatus: {
    planName: (parent: any) => parent.SubscriptionPlan?.name || null,
    planDescription: (parent: any) => parent.SubscriptionPlan?.description || null,
  },
};

