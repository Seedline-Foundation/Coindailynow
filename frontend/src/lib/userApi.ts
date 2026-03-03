/**
 * Client-side API helper for authenticated user dashboard requests.
 * Uses the backend REST API at /api/user/*
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getCandidateTokens(): string[] {
  if (typeof window === 'undefined') return [];

  const authToken = localStorage.getItem('auth_token');
  const accessToken = localStorage.getItem('accessToken');
  const storedTokensRaw = localStorage.getItem('coindaily_tokens');

  let contextToken: string | null = null;
  if (storedTokensRaw) {
    try {
      const parsed = JSON.parse(storedTokensRaw) as { accessToken?: string };
      contextToken = parsed?.accessToken || null;
    } catch {
      contextToken = null;
    }
  }

  return [authToken, accessToken, contextToken].filter((token): token is string => Boolean(token));
}

const FETCH_TIMEOUT_MS = 8000;

async function authFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = getCandidateTokens();
  if (!tokens.length) {
    throw new Error('NOT_AUTHENTICATED');
  }

  let lastErrorMessage = 'Request failed';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error('BACKEND_TIMEOUT');
      }
      throw new Error('BACKEND_UNREACHABLE');
    } finally {
      clearTimeout(timeoutId);
    }

    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }
      return json;
    }

    lastErrorMessage = json?.error?.message || `Request failed: ${res.status}`;

    const isAuthError = res.status === 401 || /invalid|expired|token|auth/i.test(lastErrorMessage);
    const hasFallback = i < tokens.length - 1;
    if (isAuthError && hasFallback) {
      continue;
    }

    throw new Error(lastErrorMessage);
  }

  throw new Error(lastErrorMessage);
}

// ── Profile ──────────────────────────────────────────────────
export async function fetchProfile() {
  return authFetch('/api/user/profile');
}

export async function updateProfile(data: Record<string, any>) {
  return authFetch('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Bookmarks ────────────────────────────────────────────────
export async function fetchBookmarks(page = 1, limit = 20) {
  return authFetch(`/api/user/bookmarks?page=${page}&limit=${limit}`);
}

export async function addBookmark(articleId: string) {
  return authFetch('/api/user/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ articleId }),
  });
}

export async function removeBookmark(articleId: string) {
  return authFetch(`/api/user/bookmarks/${articleId}`, { method: 'DELETE' });
}

export async function checkBookmark(articleId: string) {
  return authFetch(`/api/user/bookmarks/check/${articleId}`);
}

// ── Reading History ──────────────────────────────────────────
export async function fetchReadingHistory(page = 1, limit = 20) {
  return authFetch(`/api/user/reading-history?page=${page}&limit=${limit}`);
}

export async function trackReading(data: {
  articleId: string;
  readDurationSec?: number;
  scrollPercent?: number;
  completed?: boolean;
}) {
  return authFetch('/api/user/reading-history', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function clearReadingHistory() {
  return authFetch('/api/user/reading-history', { method: 'DELETE' });
}

// ── Notifications ────────────────────────────────────────────
export async function fetchNotifications(page = 1, limit = 20, unreadOnly = false) {
  return authFetch(`/api/user/notifications?page=${page}&limit=${limit}${unreadOnly ? '&unread=true' : ''}`);
}

export async function markNotificationRead(id: string) {
  return authFetch(`/api/user/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return authFetch('/api/user/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id: string) {
  return authFetch(`/api/user/notifications/${id}`, { method: 'DELETE' });
}

// ── Dashboard Stats ──────────────────────────────────────────
export async function fetchDashboardStats() {
  return authFetch('/api/user/stats');
}
