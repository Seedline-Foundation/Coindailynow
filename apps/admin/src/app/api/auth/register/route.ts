/**
 * API Route: Auth Register
 * Proxies registration requests to backend API
 */

import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/auth/register');

export async function POST(request: NextRequest) {
  return handler(request);
}
