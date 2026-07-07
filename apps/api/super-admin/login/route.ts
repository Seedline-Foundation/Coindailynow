/**
 * API Route: Super Admin Login
 * Proxies login requests to backend API, enforcing SUPER_ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Proxy to backend GraphQL
    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: {
          input: { email, password }
        }
      }),
    });

    const gqlData = await response.json();
    const loginResult = gqlData?.data?.login;

    if (gqlData?.errors?.length) {
      return NextResponse.json(
        { success: false, error: gqlData.errors[0]?.message || 'Login failed' },
        { status: 401 }
      );
    }

    if (loginResult?.success && loginResult?.tokens?.accessToken) {
      const { user, tokens } = loginResult;

      // Enforce SUPER_ADMIN role for this specific endpoint
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Access denied. Super Admin privileges required.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    }

    // Invalid credentials or other error from backend
    return NextResponse.json(
      {
        success: false,
        error: loginResult?.error?.message || loginResult?.message || 'Invalid email or password'
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('Super admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
