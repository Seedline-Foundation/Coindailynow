/**
 * Super Admin Authentication Library
 * Handles JWT token verification for super admin routes
 */

import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-admin-secret-key-2024'
);

export interface SuperAdminTokenPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN';
  exp: number;
  iat: number;
}

export interface AuthResult {
  success: boolean;
  user?: SuperAdminTokenPayload;
  error?: string;
}

/**
 * Verify super admin JWT token from request headers
 */
export async function verifySuperAdminToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        success: false,
        error: 'No token provided'
      };
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });

    const user = payload as unknown as SuperAdminTokenPayload;

    // Verify the user has super admin role
    if (user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Token verification error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    };
  }
}

/**
 * Verify super admin token from cookie (for pages)
 */
export async function verifySuperAdminTokenFromCookie(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('super-admin-token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });

    const user = payload as unknown as SuperAdminTokenPayload;

    // Verify the user has super admin role
    if (user.role !== 'SUPER_ADMIN') {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Cookie token verification error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    };
  }
}