import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/api-proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: { walletId: string; action: string } }
) {
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;

  let body;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }

  return proxyToBackend(
    `/api/super-admin/monetization/wallets/${params.walletId}/${params.action}`,
    {
      method: 'POST',
      headers,
      body,
    }
  );
}
