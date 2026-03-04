/**
 * API Route Proxy — Daily Tasks Assign
 */
import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/daily-tasks/assign');

export async function PUT(request: NextRequest) { return handler(request); }
