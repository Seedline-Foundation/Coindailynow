/**
 * Proxy: GET /api/super-admin/panel-settings/:page  — load saved settings
 *        PATCH /api/super-admin/panel-settings/:page — save settings
 */

import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - API routes are excluded from TS checking in tsconfig, but this import works at runtime
import { proxyToBackend } from '@/lib/api-proxy';

// In-memory settings store (persists for server lifetime, resets on restart)
const settingsStore: Record<string, Record<string, string>> = {};

const DEFAULT_SETTINGS: Record<string, Record<string, string>> = {
  general: {
    platformName: 'CoinDaily',
    platformDescription: "Africa's premier cryptocurrency and memecoin news platform",
    maintenanceMode: 'false',
    itemsPerPage: '20',
  },
  security: {
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    enforce2FA: 'false',
    passwordMinLength: '8',
  },
  api: {
    backendUrl: 'http://localhost:4000',
    rateLimitPerMinute: '100',
    allowedOrigins: 'https://coindaily.africa\nhttps://app.coindaily.africa',
    apiVersion: 'v1',
  },
  localization: {
    defaultLanguage: 'en',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    currency: 'NGN',
  },
};

interface RouteParams {
  params: { page: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const headers: Record<string, string> = {};
  const auth = request.headers.get('Authorization');
  if (auth) headers['Authorization'] = auth;

  try {
    const response = await proxyToBackend(`/api/super-admin/panel-settings/${params.page}`, {
      method: 'GET',
      headers,
    });
    const body = await response.json();
    if (response.status >= 200 && response.status < 300 && body?.success) {
      return NextResponse.json(body, { status: 200 });
    }
    throw new Error('No data');
  } catch {
    // Return local / default settings
    const saved = settingsStore[params.page] || DEFAULT_SETTINGS[params.page] || {};
    return NextResponse.json({ success: true, saved }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = request.headers.get('Authorization');
  if (auth) headers['Authorization'] = auth;

  const bodyText = await request.text();
  let parsed: Record<string, string> = {};
  try { parsed = JSON.parse(bodyText); } catch { /* ignore */ }

  try {
    const response = await proxyToBackend(`/api/super-admin/panel-settings/${params.page}`, {
      method: 'PATCH',
      headers,
      body: bodyText,
    });
    const body = await response.json();
    if (response.status >= 200 && response.status < 300 && body?.success) {
      return NextResponse.json(body, { status: 200 });
    }
    throw new Error('Backend unavailable');
  } catch {
    // Save locally
    settingsStore[params.page] = { ...(settingsStore[params.page] || DEFAULT_SETTINGS[params.page] || {}), ...parsed };
    return NextResponse.json({ success: true, message: 'Settings saved locally' }, { status: 200 });
  }
}
