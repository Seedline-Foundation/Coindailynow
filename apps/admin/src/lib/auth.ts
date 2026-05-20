/**
 * Unified admin session (S1-4) — single token key pair.
 */

const ACCESS_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';
const USER_KEY = 'admin_user';
const COOKIE_NAME = 'admin_access_token';

export interface AdminSessionUser {
  id: string;
  email: string;
  role: string;
  profile?: { firstName?: string; lastName?: string };
}

/** Promote legacy keys into the canonical session (S1-4). */
export function migrateLegacySession(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(ACCESS_KEY)) return;

  const legacyAccess =
    localStorage.getItem('super_admin_token') ||
    localStorage.getItem('ceo_access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken');

  if (!legacyAccess) return;

  localStorage.setItem(ACCESS_KEY, legacyAccess);
  const legacyRefresh =
    localStorage.getItem('ceo_refresh_token') || localStorage.getItem('refresh_token');
  if (legacyRefresh) localStorage.setItem(REFRESH_KEY, legacyRefresh);

  const legacyUser = localStorage.getItem('ceo_user');
  if (legacyUser && !localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, legacyUser);
  }

  document.cookie = `${COOKIE_NAME}=${legacyAccess}; path=/; max-age=${15 * 60}; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  migrateLegacySession();
  return localStorage.getItem(ACCESS_KEY);
}

export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY) || localStorage.getItem('ceo_refresh_token');
}

export function getSessionUser(): AdminSessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('ceo_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(tokens: { accessToken: string; refreshToken: string }, user: AdminSessionUser) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${COOKIE_NAME}=${tokens.accessToken}; path=/; max-age=${15 * 60}; SameSite=Strict${
    location.protocol === 'https:' ? '; Secure' : ''
  }`;
  localStorage.removeItem('super_admin_token');
  localStorage.removeItem('ceo_access_token');
  localStorage.removeItem('ceo_refresh_token');
  localStorage.removeItem('ceo_user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
}

export function clearSession() {
  const keys = [
    ACCESS_KEY,
    REFRESH_KEY,
    USER_KEY,
    'super_admin_token',
    'ceo_access_token',
    'ceo_refresh_token',
    'ceo_user',
    'auth_token',
    'accessToken',
    'token',
    'authToken',
    'adminToken',
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function getPostLoginPath(role: string): string {
  if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
  if (['ADMIN', 'CONTENT_ADMIN', 'TECH_ADMIN', 'MARKETING_ADMIN'].includes(role)) {
    return '/admin';
  }
  return '/admin';
}
