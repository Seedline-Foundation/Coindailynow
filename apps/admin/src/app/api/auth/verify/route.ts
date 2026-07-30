/**
 * API Route: Auth Verify
 * Verifies JWT token and returns user info
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not configured.');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string;
      role: string;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
  }
}
