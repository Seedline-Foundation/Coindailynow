const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('admin_access_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken')
  );
}

function getMirrorUserId(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('userId');
  if (fromQuery) return fromQuery;
  return localStorage.getItem('admin_mirror_user_id') || '';
}

async function graphqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getAdminToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0]?.message || 'GraphQL request failed');
  return json.data as T;
}

function buildPagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function fetchAdminDashboard(userId?: string) {
  const target = userId || getMirrorUserId();
  if (!target) throw new Error('Missing userId. Add ?userId=<id> to this page URL.');
  const data = await graphqlRequest<{ adminUserDashboard: any }>(
    `query AdminUserDashboard($userId: ID!) {
      adminUserDashboard(userId: $userId) {
        user {
          id
          username
          email
          firstName
          lastName
          subscriptionTier
          status
        }
        bookmarks {
          id
          articleId
          createdAt
          article {
            id
            title
            slug
            excerpt
            featuredImageUrl
            publishedAt
            readingTimeMinutes
            viewCount
            Category { id name slug }
          }
        }
        readingHistory {
          id
          articleId
          readAt
          readDurationSec
          scrollPercent
          completed
          article {
            id
            title
            slug
            excerpt
            featuredImageUrl
            publishedAt
            readingTimeMinutes
            Category { id name slug }
          }
        }
        notifications {
          id
          type
          title
          message
          link
          read
          createdAt
        }
        subscription {
          id
          status
          currentPeriodStart
          currentPeriodEnd
          cancelAtPeriodEnd
          planName
          planDescription
        }
        wallet {
          id
          walletAddress
          walletType
          availableBalance
          lockedBalance
          totalBalance
          cePoints
          joyTokens
          currency
          status
          updatedAt
        }
        activityEvents {
          id
          eventType
          resourceType
          resourceId
          properties
          metadata
          timestamp
        }
      }
    }`,
    { userId: target }
  );
  return data.adminUserDashboard;
}

export async function fetchProfile() {
  const dashboard = await fetchAdminDashboard();
  const user = dashboard.user;
  return {
    data: {
      ...user,
      avatarUrl: null,
      bio: null,
      preferredLanguage: 'en',
      location: null,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function updateProfile(_data: Record<string, any>) {
  throw new Error('Profile updates are disabled in admin mirror. Use user-facing app.');
}

export async function fetchDashboardStats() {
  const dashboard = await fetchAdminDashboard();
  const history = dashboard.readingHistory || [];
  const notifications = dashboard.notifications || [];
  return {
    data: {
      bookmarkCount: (dashboard.bookmarks || []).length,
      articlesRead: history.length,
      unreadNotifications: notifications.filter((n: any) => !n.read).length,
      totalReadingTimeSec: history.reduce((acc: number, item: any) => acc + (item.readDurationSec || 0), 0),
      recentlyRead: history.slice(0, 6).map((item: any) => ({ article: item.article, readAt: item.readAt })),
    },
  };
}

export async function fetchBookmarks(page = 1, limit = 20) {
  const dashboard = await fetchAdminDashboard();
  const all = dashboard.bookmarks || [];
  const start = (page - 1) * limit;
  return {
    data: all.slice(start, start + limit),
    pagination: buildPagination(page, limit, all.length),
  };
}

export async function addBookmark(_articleId: string) {
  throw new Error('Bookmark mutation not available in admin mirror.');
}

export async function removeBookmark(_articleId: string) {
  throw new Error('Bookmark mutation not available in admin mirror.');
}

export async function checkBookmark(articleId: string) {
  const dashboard = await fetchAdminDashboard();
  return { data: (dashboard.bookmarks || []).some((b: any) => b.articleId === articleId) };
}

export async function fetchReadingHistory(page = 1, limit = 20) {
  const dashboard = await fetchAdminDashboard();
  const all = dashboard.readingHistory || [];
  const start = (page - 1) * limit;
  return {
    data: all.slice(start, start + limit),
    pagination: buildPagination(page, limit, all.length),
  };
}

export async function trackReading(_data: { articleId: string; readDurationSec?: number; scrollPercent?: number; completed?: boolean }) {
  throw new Error('Reading tracking is disabled in admin mirror.');
}

export async function clearReadingHistory() {
  throw new Error('Reading history clear is disabled in admin mirror.');
}

export async function fetchNotifications(page = 1, limit = 20, unreadOnly = false) {
  const dashboard = await fetchAdminDashboard();
  const all = (dashboard.notifications || []).filter((n: any) => (unreadOnly ? !n.read : true));
  const start = (page - 1) * limit;
  return {
    data: all.slice(start, start + limit),
    unreadCount: (dashboard.notifications || []).filter((n: any) => !n.read).length,
    pagination: buildPagination(page, limit, all.length),
  };
}

export async function markNotificationRead(id: string) {
  const userId = getMirrorUserId();
  if (!userId) throw new Error('Missing userId');
  const data = await graphqlRequest<{ adminMarkNotificationRead: any }>(
    `mutation AdminMarkNotificationRead($userId: ID!, $notificationId: ID!) {
      adminMarkNotificationRead(userId: $userId, notificationId: $notificationId) {
        id
        read
      }
    }`,
    { userId, notificationId: id }
  );
  return { data: data.adminMarkNotificationRead };
}

export async function markAllNotificationsRead() {
  const userId = getMirrorUserId();
  if (!userId) throw new Error('Missing userId');
  const list = await fetchNotifications(1, 100, true);
  await Promise.all((list.data || []).map((n: any) => markNotificationRead(n.id)));
  return { data: true };
}

export async function deleteNotification(id: string) {
  const userId = getMirrorUserId();
  if (!userId) throw new Error('Missing userId');
  const data = await graphqlRequest<{ adminMarkNotificationRead: any }>(
    `mutation AdminMarkNotificationRead($userId: ID!, $notificationId: ID!) {
      adminMarkNotificationRead(userId: $userId, notificationId: $notificationId) { id }
    }`,
    { userId, notificationId: id }
  );
  return { data: !!data.adminMarkNotificationRead };
}
