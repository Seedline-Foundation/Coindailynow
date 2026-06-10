/**
 * API Route Proxy — Daily Tasks Assignments
 */
import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/daily-tasks/assignments');

export async function GET(request: NextRequest) { return handler(request); }
