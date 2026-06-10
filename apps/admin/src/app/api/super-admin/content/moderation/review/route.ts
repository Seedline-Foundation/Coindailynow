import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/content/moderation/review');

export async function POST(request: NextRequest) {
  return handler(request);
}
