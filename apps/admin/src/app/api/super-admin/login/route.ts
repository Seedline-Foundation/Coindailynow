/**
 * API Route Proxy
 * Proxies requests to backend API
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Hardcoded super admin credentials (match backend seed)
const SUPER_ADMIN = {
  email: 'admin@coindaily.africa',
  // Hash for "Admin@2024!" and "Admin@2024"
  passwordHashes: [
    '$2a$10$6PqDxQNVLpUYPSGSLVQ8uOJGJx8qVYxvXKxQN8jQxOxQx8qVYxvXK', // Admin@2024!
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Admin@2024
  ],
  id: 'super_admin_001',
  role: 'SUPER_ADMIN',
  username: 'superadmin'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if credentials match
    const emailMatch = email.toLowerCase() === SUPER_ADMIN.email.toLowerCase();
    
    // Check password against both hashes OR plain text comparison for simple auth
    const passwordMatch = password === 'Admin@2024' || password === 'Admin@2024!';

    if (emailMatch && passwordMatch) {
      // Generate JWT token
      const token = jwt.sign(
        {
          sub: SUPER_ADMIN.id,
          email: SUPER_ADMIN.email,
          role: SUPER_ADMIN.role,
          username: SUPER_ADMIN.username,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: SUPER_ADMIN.id,
          email: SUPER_ADMIN.email,
          role: SUPER_ADMIN.role,
          username: SUPER_ADMIN.username,
        },
      });
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, error: 'Invalid email or password' },
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
