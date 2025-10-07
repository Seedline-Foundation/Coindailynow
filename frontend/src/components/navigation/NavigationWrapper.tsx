import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import MainNavigation from './MainNavigation';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { initNavigationAnalytics } from '@/lib/navigation-analytics';
import { initAnalytics, trackPageView } from '@/lib/analytics';

interface NavigationWrapperProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
  className?: string;
}

export default function NavigationWrapper({ 
  children, 
  showBreadcrumbs = true, 
  breadcrumbItems,
  className 
}: NavigationWrapperProps) {
  const router = useRouter();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
    initNavigationAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      trackPageView(undefined, { 
        route: url,
        previous_route: router.asPath 
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page view
    trackPageView(undefined, { route: router.asPath });

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <div className={className}>
      {/* Main Navigation */}
      <MainNavigation />
      
      {/* Breadcrumb Navigation */}
      {showBreadcrumbs && (
        <BreadcrumbNavigation items={breadcrumbItems} />
      )}
      
      {/* Page Content */}
      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
}

// Export navigation components for individual use
export { MainNavigation, BreadcrumbNavigation };