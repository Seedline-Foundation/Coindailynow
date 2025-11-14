/**
 * Client-Only Auth Wrapper
 * Prevents SSR issues with AuthProvider
 */

'use client';

import { useEffect, useState } from 'react';
import { AuthProvider } from '../components/auth';

interface ClientOnlyProps {
  children: React.ReactNode;
}

export default function ClientOnlyAuthWrapper({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
