import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CFIS_URL =
  process.env.CFIS_API_URL ||
  process.env.FINANCE_SYSTEM_URL ||
  process.env.NEXT_PUBLIC_CFIS_API_URL ||
  process.env.NEXT_PUBLIC_FINANCE_API_URL;

const HMAC_SECRET =
  process.env.PRESS_HMAC_SECRET ||
  process.env.CFIS_HMAC_SECRET;

/**
 * POST /api/cfis/press-order
 *
 * Server-side proxy that signs the request with HMAC-SHA256 before
 * forwarding it to the finance-system's /api/press-orders/create endpoint.
 * This keeps the HMAC secret out of the browser.
 */
export async function POST(request: NextRequest) {
  if (!CFIS_URL) {
    return NextResponse.json(
      { error: 'CFIS API URL not configured' },
      { status: 503 },
    );
  }

  if (!HMAC_SECRET) {
    return NextResponse.json(
      { error: 'HMAC secret not configured' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const timestamp = String(Date.now());
  const bodyStr = JSON.stringify(body);
  const sigPayload = timestamp + '.' + bodyStr;
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(sigPayload)
    .digest('hex');

  const url = `${CFIS_URL.replace(/\/$/, '')}/api/press-orders/create`;

  try {
    const cfisRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-press-signature': signature,
        'x-press-timestamp': timestamp,
      },
      body: bodyStr,
    });

    const data = await cfisRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: cfisRes.status });
  } catch (err: any) {
    console.error('[CFIS proxy] fetch failed:', err.message);
    return NextResponse.json(
      { error: { code: 'CFIS_UNREACHABLE', message: err.message } },
      { status: 502 },
    );
  }
}
