/**
 * API Route Proxy — Daily Tasks History
 */
import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/daily-tasks/history');

export async function GET(request: NextRequest) { return handler(request); }
