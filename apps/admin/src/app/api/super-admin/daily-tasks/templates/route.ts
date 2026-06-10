/**
 * API Route Proxy — Daily Tasks Templates
 */
import { NextRequest } from 'next/server';
import { createProxyHandler } from '@/lib/api-proxy';

const handler = createProxyHandler('/api/super-admin/daily-tasks/templates');

export async function GET(request: NextRequest) { return handler(request); }
export async function PUT(request: NextRequest) { return handler(request); }
