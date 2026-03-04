/**
 * API Route Proxy — Daily Tasks Today Log
 */
import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/daily-tasks/today');

export async function GET(request: NextRequest) { return handler(request); }
export async function PUT(request: NextRequest) { return handler(request); }
