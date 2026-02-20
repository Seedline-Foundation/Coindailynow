'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isRouteEnabled, getAppMode } from '@/config/appMode';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * RouteGuard - Protects routes based on app mode
 * Redirects users away from disabled routes
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mode = getAppMode();
  const safePathname = pathname || '/';

  useEffect(() => {
    if (!isRouteEnabled(safePathname)) {
      console.warn(`Route ${safePathname} is disabled in ${mode} mode`);
      
      // Redirect based on mode
      switch (mode) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'pr':
          router.replace('/dashboard');
          break;
        default:
          router.replace('/');
      }
    }
  }, [safePathname, mode, router]);

  // If route is disabled, show nothing while redirecting
  if (!isRouteEnabled(safePathname)) {
    return null;
  }

  return <>{children}</>;
}

export default RouteGuard;
