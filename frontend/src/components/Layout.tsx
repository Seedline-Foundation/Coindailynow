import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PerformanceMonitor from '@/lib/performance-monitor';
import { NavigationWrapper } from '@/components/navigation';

interface LayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export default function Layout({ 
  children, 
  showBreadcrumbs = true, 
  breadcrumbItems 
}: LayoutProps) {
  const router = useRouter();

  useEffect(() => {
    // Initialize performance monitoring
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.init();

    // Track route changes
    const handleRouteChange = (url: string) => {
      performanceMonitor.trackCustomMetric('route_change', Date.now());
      
      // Track Core Web Vitals after route change
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'performance' in window) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const routeLoadTime = navigation.loadEventEnd - navigation.fetchStart;
            performanceMonitor.trackCustomMetric('route_load_time', routeLoadTime);
          }
        }
      }, 100);
    };

    const handleRouteComplete = () => {
      // Critical CSS cache clearing removed - handled server-side
      // Development-only feature for performance optimization
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      performanceMonitor.flush();
    };
  }, [router]);

  // Handle page visibility changes (PWA behavior)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const performanceMonitor = PerformanceMonitor.getInstance();
      
      if (document.visibilityState === 'hidden') {
        // Flush performance data when page becomes hidden
        performanceMonitor.flush();
      } else if (document.visibilityState === 'visible') {
        // Track when page becomes visible again
        performanceMonitor.trackCustomMetric('page_visibility_change', Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <NavigationWrapper 
      showBreadcrumbs={showBreadcrumbs}
      breadcrumbItems={breadcrumbItems}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Skip to main content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-orange-500 text-white px-4 py-2 text-sm font-medium rounded-br-md"
      >
        Skip to main content
      </a>

      {/* Main content area */}
      <main id="main-content" className="w-full">
        {children}
      </main>

      {/* Performance debugging in development */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDebugger />
      )}
    </NavigationWrapper>
  );
}

// Performance debugging component for development
function PerformanceDebugger() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
      setScore(performanceMonitor.getPerformanceScore());
    };

    // Update metrics every 2 seconds
    const interval = setInterval(updateMetrics, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Performance
        </h3>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
          {score}/100
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        {metrics.slice(-3).map((metric: any, index: number) => (
          <div key={index} className="flex justify-between">
            <span>{metric.name}:</span>
            <span className={`font-mono ${
              metric.rating === 'good' ? 'text-green-600' :
              metric.rating === 'needs-improvement' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {Math.round(metric.value)}ms
            </span>
          </div>
        ))}
      </div>
      
      {metrics.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Loading metrics...
        </div>
      )}
    </div>
  );
}