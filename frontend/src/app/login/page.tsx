'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple mock authentication
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      localStorage.setItem('super_admin_token', 'mock_super_admin_token_' + Date.now());
      router.push('/super-admin');
    } else {
      setError('Invalid credentials. Use admin/admin123');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1e3a8a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#1f2937'
        }}>
          🔐 Super Admin Login
        </h1>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
              placeholder="Enter admin"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
              placeholder="Enter admin123"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <strong>Demo Credentials:</strong><br />
          Username: admin<br />
          Password: admin123
        </div>
      </div>
    </div>
  );
}