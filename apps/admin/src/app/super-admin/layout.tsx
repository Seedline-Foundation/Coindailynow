/**
 * Super Admin Layout Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/super-admin/SuperAdminHeader';
import { SuperAdminProvider } from '@/contexts/SuperAdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken, clearSession } from '@/lib/auth';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading, logout } = useAuth();

  const isLoginPage = pathname === '/super-admin/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push('/auth/sadmin');
        setChecking(false);
        return;
      }

      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ query: '{ me { success user { id email role } } }' }),
        });

        if (response.ok) {
          const data = await response.json();
          const me = data.data?.me?.user;
          if (me?.role === 'SUPER_ADMIN') {
            setVerified(true);
          } else {
            clearSession();
            logout();
            router.push('/auth/sadmin');
          }
        } else {
          clearSession();
          logout();
          router.push('/auth/sadmin');
        }
      } catch {
        clearSession();
        logout();
        router.push('/auth/sadmin');
      } finally {
        setChecking(false);
      }
    };

    verify();
  }, [mounted, authLoading, isLoginPage, router, logout, user?.id]);

  if (!mounted || (checking && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 skeleton-shimmer" />
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!verified) {
    return null;
  }

  return (
    <SuperAdminProvider>
      <div className="min-h-screen bg-gray-900 flex">
        <SuperAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <SuperAdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className={`flex-1 overflow-auto p-6 pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>{children}</main>
        </div>
      </div>
    </SuperAdminProvider>
  );
}
