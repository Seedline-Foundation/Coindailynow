/**
 * Tokenomics Config API Route Proxy
 * Proxies requests to backend /api/tokenomics/config
 */

import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/tokenomics/config');

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function PUT(request: NextRequest) {
  return handler(request);
}
