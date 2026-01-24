// Performance monitoring utilities for CoinDaily platform
import { NextWebVitalsMetric } from 'next/app';

export interface PerformanceMetrics {
  name: string;
  value: number;
  id: string;
  label: 'web-vital' | 'custom';
  startTime?: number;
  entries?: PerformanceEntry[];
}

export interface CoreWebVitals {
  CLS: number | null;
  FID: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
  INP: number | null;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private coreVitals: CoreWebVitals = {
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    INP: null
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          if (lastEntry) {
            const value = lastEntry.renderTime || lastEntry.loadTime || 0;
            this.coreVitals.LCP = value;
            this.reportMetric('LCP', value, 'web-vital');
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[0];
            this.coreVitals.FCP = entry.startTime;
            this.reportMetric('FCP', entry.startTime, 'web-vital');
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
            if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
              clsValue += layoutShiftEntry.value;
            }
          }
          this.coreVitals.CLS = clsValue;
          this.reportMetric('CLS', clsValue, 'web-vital');
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);

        // Navigation timing for TTFB
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const entry = entries[0] as PerformanceNavigationTiming;
            const ttfb = entry.responseStart - entry.requestStart;
            this.coreVitals.TTFB = ttfb;
            this.reportMetric('TTFB', ttfb, 'web-vital');
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);

      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  reportWebVital(metric: NextWebVitalsMetric): void {
    const { name, value, id, label } = metric;
    
    // Update core vitals
    if (name === 'CLS') this.coreVitals.CLS = value;
    if (name === 'FID') this.coreVitals.FID = value;
    if (name === 'FCP') this.coreVitals.FCP = value;
    if (name === 'LCP') this.coreVitals.LCP = value;
    if (name === 'TTFB') this.coreVitals.TTFB = value;
    if (name === 'INP') this.coreVitals.INP = value;

    this.reportMetric(name, value, label, id);
  }

  private reportMetric(name: string, value: number, label: 'web-vital' | 'custom', id?: string): void {
    const metric: PerformanceMetrics = {
      name,
      value,
      id: id || this.generateId(),
      label,
      startTime: Date.now()
    };

    this.metrics.set(name, metric);

    // Send to analytics
    this.sendToAnalytics(metric);

    // Check thresholds and alert if needed
    this.checkThresholds(metric);
  }

  private sendToAnalytics(metric: PerformanceMetrics): void {
    // Send to Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_parameter_1: metric.label,
        custom_parameter_2: metric.id
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch((error) => {
        console.warn('Failed to send performance metric:', error);
      });
    }
  }

  private checkThresholds(metric: PerformanceMetrics): void {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 }
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold) {
      let status = 'good';
      if (metric.value > threshold.poor) {
        status = 'poor';
      } else if (metric.value > threshold.good) {
        status = 'needs-improvement';
      }

      if (status !== 'good') {
        console.warn(`Performance Alert: ${metric.name} is ${status} (${metric.value})`);
        
        // Send alert to monitoring system
        this.sendAlert(metric, status);
      }
    }
  }

  private sendAlert(metric: PerformanceMetrics, status: string): void {
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance',
          metric: metric.name,
          value: metric.value,
          status,
          url: window.location.href,
          timestamp: Date.now()
        })
      }).catch((error) => {
        console.warn('Failed to send performance alert:', error);
      });
    }
  }

  measureCustomMetric(name: string, startTime?: number): void {
    if (typeof window !== 'undefined' && window.performance) {
      const value = startTime ? Date.now() - startTime : Date.now();
      this.reportMetric(name, value, 'custom');
    }
  }

  startTiming(name: string): string {
    const id = this.generateId();
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start-${id}`);
    }
    return id;
  }

  endTiming(name: string, id: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      const endMark = `${name}-end-${id}`;
      const startMark = `${name}-start-${id}`;
      
      performance.mark(endMark);
      performance.measure(`${name}-${id}`, startMark, endMark);
      
      const entries = performance.getEntriesByName(`${name}-${id}`, 'measure');
      if (entries.length > 0) {
        const duration = entries[0].duration;
        this.reportMetric(name, duration, 'custom', id);
        return duration;
      }
    }
    return 0;
  }

  getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreVitals };
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Resource loading performance
  measureResourceTiming(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const slowResources = resources.filter(resource => 
        resource.duration > 1000 && 
        !resource.name.includes('google-analytics') &&
        !resource.name.includes('gtag')
      );

      slowResources.forEach(resource => {
        this.reportMetric(
          `slow-resource-${resource.name.split('/').pop()}`,
          resource.duration,
          'custom'
        );
      });
    }
  }

  // Memory usage monitoring
  measureMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      
      this.reportMetric('memory-used', memory.usedJSHeapSize, 'custom');
      this.reportMetric('memory-total', memory.totalJSHeapSize, 'custom');
      this.reportMetric('memory-limit', memory.jsHeapSizeLimit, 'custom');
      
      const memoryUsagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercentage > 80) {
        console.warn(`High memory usage: ${memoryUsagePercentage.toFixed(2)}%`);
      }
    }
  }

  // Cleanup
  disconnect(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Helper functions
export const measurePageLoad = () => {
  if (typeof window !== 'undefined') {
    const monitor = PerformanceMonitor.getInstance();
    
    // Measure when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        monitor.measureCustomMetric('dom-ready', performance.timing?.navigationStart);
      });
    }

    // Measure when page is fully loaded
    window.addEventListener('load', () => {
      monitor.measureCustomMetric('page-load-complete', performance.timing?.navigationStart);
      monitor.measureResourceTiming();
      monitor.measureMemoryUsage();
    });
  }
};

export const measureComponentRender = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  const timingId = monitor.startTiming(`component-render-${componentName}`);
  
  return () => {
    monitor.endTiming(`component-render-${componentName}`, timingId);
  };
};

// Declare gtag for TypeScript
declare global {
  function gtag(...args: any[]): void;
}