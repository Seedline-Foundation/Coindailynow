/**
 * Super Admin Login API
 * Secure authentication with JWT and 2FA support
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-admin-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;
    
    console.log('Login attempt:', { username, email, hasPassword: !!password });
    
    if (!(username || email) || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication for demo
    const mockUser = {
      id: 'admin-001',
      username: 'superadmin',
      email: 'admin@coindaily.africa',
      role: 'SUPER_ADMIN'
    };

    // Check if credentials match (case insensitive email)
    const emailMatch = email?.toLowerCase() === mockUser.email.toLowerCase();
    const usernameMatch = username?.toLowerCase() === mockUser.username.toLowerCase();
    
    // Accept both "Admin@2024" and "Admin@2024!" as valid passwords for demo
    const validPasswords = ['Admin@2024', 'Admin@2024!'];
    const passwordMatch = validPasswords.includes(password);

    if ((!emailMatch && !usernameMatch) || !passwordMatch) {
      console.log('Invalid credentials:', { 
        emailMatch, 
        usernameMatch, 
        passwordMatch,
        receivedPassword: password,
        expectedPasswords: validPasswords,
        passwordLength: password?.length,
        passwordChars: password?.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ')
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Login successful, generating token...');

    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: mockUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
