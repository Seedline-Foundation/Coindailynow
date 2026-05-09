import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/permissions');

export async function GET(request: NextRequest) {
  return handler(request);
}
