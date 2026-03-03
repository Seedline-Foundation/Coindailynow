/**
 * API Route: Auth Login
 * Proxies login requests to backend API, with demo fallback credentials
 */

// Force Node.js runtime — jsonwebtoken requires native crypto not available in Edge.
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const LOGIN_MUTATION = `mutation Login($input: LoginInput!) {
  login(input: $input) {
    success
    message
    user {
      id
      email
      username
      firstName
      lastName
      role
    }
    tokens {
      accessToken
      refreshToken
    }
    error {
      code
      message
    }
  }
}`;

// Demo users — work even when the database/backend is unreachable
const DEMO_USERS: Record<string, { id: string; name: string; role: string; password: string }> = {
  'user@coindaily.africa': { id: 'demo_user_001', name: 'Demo User', role: 'USER', password: 'User@2024' },
  'editor@coindaily.africa': { id: 'demo_editor_001', name: 'Demo Editor', role: 'EDITOR', password: 'Editor@2024' },
  'staff@coindaily.africa': { id: 'demo_staff_001', name: 'Staff Member', role: 'STAFF', password: 'Staff@2024' },
  'admin@coindaily.africa': { id: 'demo_admin_001', name: 'Admin User', role: 'ADMIN', password: 'Admin@2024' },
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email = '', password = '' } = body as { email: string; password: string };

  // Try demo credentials first (instant, no DB required)
  const demo = DEMO_USERS[email.toLowerCase()];
  if (demo && password === demo.password) {
    const token = jwt.sign(
      { sub: demo.id, email, name: demo.name, role: demo.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: demo.id, email, name: demo.name, role: demo.role },
    });

    response.cookies.set('authToken', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  const baseUrls = Array.from(new Set([BACKEND_URL, 'http://localhost:4000']));
  let hadNetworkError = false;

  for (const baseUrl of baseUrls) {
    try {
      const gqlRes = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: LOGIN_MUTATION,
          variables: {
            input: { email, password }
          }
        }),
        signal: AbortSignal.timeout(10000),
      });

      const gqlData = await gqlRes.json().catch(() => ({}));
      const loginResult = gqlData?.data?.login;

      if (gqlData?.errors?.length) {
        return NextResponse.json(
          { success: false, error: gqlData.errors[0]?.message || 'Login failed.' },
          { status: 400 }
        );
      }

      if (loginResult?.success && loginResult?.tokens?.accessToken) {
        const user = loginResult.user || {};
        const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'User';

        const token = loginResult.tokens.accessToken;
        const response = NextResponse.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            name: displayName,
            role: user.role || 'USER'
          }
        });

        response.cookies.set('authToken', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      if (loginResult && loginResult.success === false) {
        return NextResponse.json(
          { success: false, error: loginResult?.error?.message || loginResult?.message || 'Invalid email or password.' },
          { status: 401 }
        );
      }
    } catch {
      hadNetworkError = true;
      continue;
    }
  }

  if (hadNetworkError) {
    return NextResponse.json(
      { success: false, error: 'Backend unavailable. Use demo credentials to log in.' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Login failed. Please try again.' },
    { status: 500 }
  );
}
