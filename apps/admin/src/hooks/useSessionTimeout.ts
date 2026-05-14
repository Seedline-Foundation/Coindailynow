'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Decodes a JWT payload without verification (client-side only).
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** How many seconds before expiry to show the warning */
const WARNING_LEAD_SECONDS = 60;

/** Minimum interval (ms) between refresh attempts to avoid hammering */
const MIN_REFRESH_INTERVAL_MS = 5_000;

interface UseSessionTimeoutOptions {
  /** Called when the session has expired and the user is being logged out. */
  onLogout: () => void;
  /** Token keys in localStorage (defaults to admin_access_token / admin_refresh_token). */
  accessTokenKey?: string;
  refreshTokenKey?: string;
  /** If false, the hook does nothing (useful when auth isn't required, e.g. login page). */
  enabled?: boolean;
}

interface UseSessionTimeoutReturn {
  /** True when the session is about to expire (within WARNING_LEAD_SECONDS). */
  showWarning: boolean;
  /** Seconds remaining until expiry (0 when expired). */
  secondsRemaining: number;
  /** Call this to attempt a token refresh and dismiss the warning. */
  extendSession: () => Promise<boolean>;
  /** True while a refresh request is in flight. */
  isRefreshing: boolean;
}

/**
 * useSessionTimeout — monitors JWT expiry and provides:
 *   1. A countdown warning before the token expires (SPEC-ADM-2)
 *   2. An `extendSession()` function that calls the backend `refreshToken`
 *      mutation to silently renew the access token (SPEC-ADM-1)
 *   3. Automatic logout when the token has fully expired
 */
export function useSessionTimeout({
  onLogout,
  accessTokenKey = 'admin_access_token',
  refreshTokenKey = 'admin_refresh_token',
  enabled = true,
}: UseSessionTimeoutOptions): UseSessionTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Infinity);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshAttempt = useRef(0);

  // ---- Token refresh (SPEC-ADM-1) ----
  const extendSession = useCallback(async (): Promise<boolean> => {
    // Debounce rapid calls
    if (Date.now() - lastRefreshAttempt.current < MIN_REFRESH_INTERVAL_MS) {
      return false;
    }
    lastRefreshAttempt.current = Date.now();

    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) {
      onLogout();
      return false;
    }

    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation RefreshToken($refreshToken: String!) {
              refreshToken(refreshToken: $refreshToken) {
                success
                tokens { accessToken refreshToken }
                error { code message }
              }
            }
          `,
          variables: { refreshToken },
        }),
      });

      if (!res.ok) {
        onLogout();
        return false;
      }

      const json = await res.json();
      const result = json.data?.refreshToken;

      if (result?.success && result.tokens) {
        localStorage.setItem(accessTokenKey, result.tokens.accessToken);
        localStorage.setItem(refreshTokenKey, result.tokens.refreshToken);
        setShowWarning(false);
        return true;
      } else {
        // Refresh token invalid/expired — force logout
        onLogout();
        return false;
      }
    } catch {
      // Network error — don't force logout yet, user can retry
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [onLogout, accessTokenKey, refreshTokenKey]);

  // ---- Auto-refresh on 401 (SPEC-ADM-1 complement) ----
  // Intercept fetch for the admin app to auto-refresh on 401
  useEffect(() => {
    if (!enabled) return;

    const originalFetch = window.fetch;
    window.fetch = async function patchedFetch(input, init) {
      const response = await originalFetch.call(this, input, init);

      // Only intercept 401s to our API (not to other origins)
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (response.status === 401 && url.startsWith(API_URL)) {
        const refreshed = await extendSession();
        if (refreshed) {
          // Retry the original request with the new token
          const newToken = localStorage.getItem(accessTokenKey);
          const newInit = { ...init };
          if (newInit.headers && newToken) {
            const headers = new Headers(newInit.headers);
            headers.set('Authorization', `Bearer ${newToken}`);
            newInit.headers = headers;
          }
          return originalFetch.call(window, input, newInit);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled, extendSession, accessTokenKey]);

  // ---- Countdown timer (SPEC-ADM-2) ----
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const token = localStorage.getItem(accessTokenKey);
      if (!token) {
        setSecondsRemaining(0);
        setShowWarning(false);
        return;
      }

      const payload = decodeJwtPayload(token);
      if (!payload?.exp) {
        // Can't determine expiry — don't show warning
        setSecondsRemaining(Infinity);
        setShowWarning(false);
        return;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, payload.exp - nowSec);
      setSecondsRemaining(remaining);

      if (remaining === 0) {
        // Token expired — try one last refresh, then logout
        extendSession().then((ok) => {
          if (!ok) onLogout();
        });
      } else if (remaining <= WARNING_LEAD_SECONDS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // Run immediately, then every second
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [enabled, accessTokenKey, onLogout, extendSession]);

  return {
    showWarning,
    secondsRemaining: secondsRemaining === Infinity ? 0 : secondsRemaining,
    extendSession,
    isRefreshing,
  };
}
