import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;

  let body;
  try { body = await request.json(); } catch {}

  return proxyToBackend(`/api/super-admin/roles/${params.id}`, {
    method: 'PUT',
    headers,
    body,
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;

  return proxyToBackend(`/api/super-admin/roles/${params.id}`, {
    method: 'DELETE',
    headers,
  });
}
