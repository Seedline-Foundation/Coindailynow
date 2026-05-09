const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token')
  );
}

async function graphqlRequest<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = getToken();
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
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function fetchProfile() {
  const data = await graphqlRequest<{
    me: {
      success: boolean;
      user: any;
    };
  }>(
    `query Me {
      me {
        success
        user {
          id
          username
          email
          firstName
          lastName
          bio
          avatarUrl
          preferredLanguage
          location
          subscriptionTier
          createdAt
        }
      }
    }`
  );
  return { data: data.me?.user || null };
}

export async function updateProfile(input: Record<string, any>) {
  const data = await graphqlRequest<{ updateProfile: any }>(
    `mutation UpdateProfile($input: UpdateUserProfileInput!) {
      updateProfile(input: $input) {
        id
        username
        email
        firstName
        lastName
        bio
        avatarUrl
        preferredLanguage
        location
        subscriptionTier
        createdAt
      }
    }`,
    { input }
  );
  return { data: data.updateProfile };
}

export async function fetchBookmarks(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const data = await graphqlRequest<{ myBookmarks: any[] }>(
    `query MyBookmarks($limit: Int!, $offset: Int!) {
      myBookmarks(limit: $limit, offset: $offset) {
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
          User { id username firstName lastName avatarUrl }
        }
      }
    }`,
    { limit, offset }
  );
  const items = data.myBookmarks || [];
  return { data: items, pagination: buildPagination(page, limit, offset + items.length + (items.length === limit ? 1 : 0)) };
}

export async function addBookmark(articleId: string) {
  const data = await graphqlRequest<{ bookmarkArticle: boolean }>(
    `mutation BookmarkArticle($id: ID!) { bookmarkArticle(id: $id) }`,
    { id: articleId }
  );
  return { data: data.bookmarkArticle };
}

export async function removeBookmark(articleId: string) {
  const data = await graphqlRequest<{ removeMyBookmark: boolean }>(
    `mutation RemoveMyBookmark($articleId: ID!) { removeMyBookmark(articleId: $articleId) }`,
    { articleId }
  );
  return { data: data.removeMyBookmark };
}

export async function checkBookmark(articleId: string) {
  const data = await graphqlRequest<{ myBookmarks: Array<{ articleId: string }> }>(
    `query CheckBookmark($limit: Int!, $offset: Int!) {
      myBookmarks(limit: $limit, offset: $offset) { articleId }
    }`,
    { limit: 200, offset: 0 }
  );
  return { data: (data.myBookmarks || []).some((b) => b.articleId === articleId) };
}

export async function fetchReadingHistory(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const data = await graphqlRequest<{ myReadingHistory: any[] }>(
    `query MyReadingHistory($limit: Int!, $offset: Int!) {
      myReadingHistory(limit: $limit, offset: $offset) {
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
    }`,
    { limit, offset }
  );
  const items = data.myReadingHistory || [];
  return { data: items, pagination: buildPagination(page, limit, offset + items.length + (items.length === limit ? 1 : 0)) };
}

export async function trackReading(payload: {
  articleId: string;
  readDurationSec?: number;
  scrollPercent?: number;
  completed?: boolean;
}) {
  const data = await graphqlRequest<{ trackMyReading: any }>(
    `mutation TrackMyReading($articleId: ID!, $readDurationSec: Int, $scrollPercent: Float, $completed: Boolean) {
      trackMyReading(articleId: $articleId, readDurationSec: $readDurationSec, scrollPercent: $scrollPercent, completed: $completed) {
        id
      }
    }`,
    payload
  );
  return { data: data.trackMyReading };
}

export async function clearReadingHistory() {
  const data = await graphqlRequest<{ clearMyReadingHistory: number }>(
    `mutation ClearReadingHistory { clearMyReadingHistory }`
  );
  return { data: data.clearMyReadingHistory };
}

export async function fetchNotifications(page = 1, limit = 20, unreadOnly = false) {
  const offset = (page - 1) * limit;
  const data = await graphqlRequest<{ myNotifications: any[] }>(
    `query MyNotifications($unreadOnly: Boolean!, $limit: Int!, $offset: Int!) {
      myNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) {
        id
        type
        title
        message
        link
        read
        createdAt
      }
    }`,
    { unreadOnly, limit, offset }
  );
  const items = data.myNotifications || [];
  const unreadCount = items.filter((n) => !n.read).length;
  return { data: items, pagination: buildPagination(page, limit, offset + items.length + (items.length === limit ? 1 : 0)), unreadCount };
}

export async function markNotificationRead(id: string) {
  const data = await graphqlRequest<{ markMyNotificationRead: any }>(
    `mutation MarkMyNotificationRead($notificationId: ID!) {
      markMyNotificationRead(notificationId: $notificationId) { id read }
    }`,
    { notificationId: id }
  );
  return { data: data.markMyNotificationRead };
}

export async function markAllNotificationsRead() {
  const data = await graphqlRequest<{ markAllMyNotificationsRead: number }>(
    `mutation MarkAllMyNotificationsRead { markAllMyNotificationsRead }`
  );
  return { data: data.markAllMyNotificationsRead };
}

export async function deleteNotification(id: string) {
  const data = await graphqlRequest<{ deleteMyNotification: boolean }>(
    `mutation DeleteMyNotification($notificationId: ID!) {
      deleteMyNotification(notificationId: $notificationId)
    }`,
    { notificationId: id }
  );
  return { data: data.deleteMyNotification };
}

export async function fetchDashboardStats() {
  const [bookmarks, history, notifications] = await Promise.all([
    fetchBookmarks(1, 20),
    fetchReadingHistory(1, 20),
    fetchNotifications(1, 50, false),
  ]);
  const totalReadingTimeSec = (history.data || []).reduce((acc: number, item: any) => acc + (item.readDurationSec || 0), 0);
  return {
    data: {
      bookmarkCount: bookmarks.data.length,
      articlesRead: history.data.length,
      unreadNotifications: notifications.data.filter((n: any) => !n.read).length,
      totalReadingTimeSec,
      recentlyRead: (history.data || []).slice(0, 6).map((h: any) => ({ article: h.article, readAt: h.readAt })),
    },
  };
}
