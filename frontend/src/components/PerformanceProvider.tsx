'use client';

import { useEffect } from 'react';
import { performanceMonitor, measurePageLoad } from '@/utils/performance';
import { initializeCRO } from '@/utils/cro';

export default function PerformanceProvider() {
  useEffect(() => {
    // Initialize performance monitoring
    measurePageLoad();
    
    // Initialize conversion rate optimization
    initializeCRO();
    
    // Preload critical resources
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: 'PRELOAD_CRITICAL',
          urls: [
            '/critical/critical-home.css',
            '/critical/critical-news.css',
            '/critical/critical-market.css'
          ]
        });
      });
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('SW registered: ', registration);
        }).catch(function(registrationError) {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    // Report initial performance metrics
    window.addEventListener('load', function() {
      if (window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          // Send metrics to analytics
          fetch('/api/analytics/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'navigation',
              metrics: {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstByte: navigation.responseStart - navigation.requestStart
              },
              url: window.location.href,
              timestamp: Date.now()
            })
          }).catch(console.error);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      performanceMonitor.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
