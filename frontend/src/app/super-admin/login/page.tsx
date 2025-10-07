'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Attempting login with:', { email, password: '***' });
      
      const response = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('Login response:', { success: data.success, error: data.error });
      
      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('super_admin_token', data.token);
        console.log('✅ Token stored successfully!');
        console.log('Token preview:', data.token.substring(0, 30) + '...');
        console.log('Checking localStorage...', localStorage.getItem('super_admin_token') ? 'Token confirmed in storage' : 'ERROR: Token not in storage!');
        
        // Small delay to ensure token is saved
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🚀 Navigating to dashboard...');
        router.push('/super-admin/dashboard');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg max-w-md w-full shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Super Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="admin@coindaily.africa"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Enter password"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</p>
          <p className="text-sm text-blue-800">Email: <span className="font-mono">admin@coindaily.africa</span></p>
          <p className="text-sm text-blue-800">Password: <span className="font-mono">Admin@2024</span></p>
        </div>
      </div>
    </div>
  );
}