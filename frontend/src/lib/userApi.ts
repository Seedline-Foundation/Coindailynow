/**
 * Client-side API helper for authenticated user dashboard requests.
 * Uses the backend REST API at /api/user/*
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function authFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || `Request failed: ${res.status}`);
  }

  return json;
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
