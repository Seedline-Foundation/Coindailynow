/**
 * API Route Proxy
 * Proxies requests to backend API
 */

import { NextRequest } from 'next/server';
// @ts-ignore - API routes are excluded from TS checking in tsconfig, but this import works at runtime
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/stats');

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

export async function PUT(request: NextRequest) {
  return handler(request);
}

export async function DELETE(request: NextRequest) {
  return handler(request);
}

export async function PATCH(request: NextRequest) {
  return handler(request);
}
