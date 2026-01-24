/**
 * API Route: Auth Login
 * Proxies login requests to backend API
 */

import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/auth/login');

export async function POST(request: NextRequest) {
  return handler(request);
}
