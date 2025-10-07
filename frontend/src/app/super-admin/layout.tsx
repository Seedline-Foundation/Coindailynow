/**
 * Super Admin Layout Component
 * Central management dashboard for the entire CoinDaily platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/super-admin/SuperAdminHeader';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current path is the login page
  const isLoginPage = pathname === '/super-admin/login';

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Skip authentication check for login page
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Check super admin authentication for protected pages
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('super_admin_token');
        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/super-admin/login');
          return;
        }

        console.log('Token found:', token.substring(0, 20) + '...');

        // Accept both mock tokens and JWT tokens for demo
        // JWT tokens start with "eyJ" (base64 encoded)
        const isValidToken = token.startsWith('mock_super_admin_token_') || token.startsWith('eyJ');
        
        if (isValidToken) {
          console.log('Token valid, user authenticated');
          setIsAuthenticated(true);
        } else {
          console.log('Invalid token format, clearing and redirecting');
          localStorage.removeItem('super_admin_token');
          router.push('/super-admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/super-admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, isLoginPage, mounted]);

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // For login page, render without authentication wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For protected pages, check authentication
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SuperAdminProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SuperAdminHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        <div className="flex">
          <SuperAdminSidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          } pt-16`}>
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SuperAdminProvider>
  );
}