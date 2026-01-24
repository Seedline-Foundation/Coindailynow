interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
}

interface NavigationMetrics {
  dns: number;
  tcp: number;
  ssl: number;
  ttfb: number;
  download: number;
  domParse: number;
  totalLoadTime: number;
}

interface ResourceMetric {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

// Web Vitals thresholds
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private apiEndpoint = '/api/analytics/performance';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  init() {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals using Performance Observer API
    this.trackWebVitals();
    
    // Track custom performance metrics
    this.trackCustomMetrics();
    
    // Track navigation timing
    this.trackNavigationTiming();

    // Track resource timing
    this.trackResourceTiming();

    // Setup page unload handler
    this.setupUnloadHandler();
  }

  private trackWebVitals() {
    // Track Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries: PerformanceEntry[]) => {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.recordMetric('LCP', lastEntry.startTime, this.getRating('LCP', lastEntry.startTime));
      }
    });

    // Track First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries: PerformanceEntry[]) => {
      const firstEntry = entries[0] as any;
      if (firstEntry && firstEntry.processingStart) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        this.recordMetric('FID', fid, this.getRating('FID', fid));
      }
    });

    // Track Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entries: PerformanceEntry[]) => {
      let clsValue = 0;
      for (const entry of entries as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      if (clsValue > 0) {
        this.recordMetric('CLS', clsValue, this.getRating('CLS', clsValue));
      }
    });

    // Track First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries: PerformanceEntry[]) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordMetric('FCP', fcpEntry.startTime, this.getRating('FCP', fcpEntry.startTime));
      }
    });
  }

  private observePerformanceEntry(entryType: string, callback: (entries: PerformanceEntry[]) => void) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });
        observer.observe({ entryTypes: [entryType] });
      } catch (e) {
        // Silently fail if entry type is not supported
        console.warn(`Performance entry type '${entryType}' not supported`);
      }
    }
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    };

    this.metrics.push(metric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 Web Vital - ${name}:`, {
        value: Math.round(value),
        rating,
        threshold: VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
      });
    }

    // Send immediately if poor performance
    if (rating === 'poor') {
      this.sendToAnalytics([metric]);
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = VITALS_THRESHOLDS[metricName as keyof typeof VITALS_THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private trackCustomMetrics() {
    // Track Time to Interactive
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Calculate custom metrics
            const ttfb = navEntry.responseStart - navEntry.fetchStart;
            const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
            const windowLoad = navEntry.loadEventEnd - navEntry.fetchStart;

            this.sendCustomMetric('TTFB', ttfb);
            this.sendCustomMetric('DOM_CONTENT_LOADED', domContentLoaded);
            this.sendCustomMetric('WINDOW_LOAD', windowLoad);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  private trackNavigationTiming() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            const metrics = {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
              ttfb: navigation.responseStart - navigation.fetchStart,
              download: navigation.responseEnd - navigation.responseStart,
              domParse: navigation.domComplete - navigation.responseEnd,
              totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
            };

            this.sendNavigationMetrics(metrics);
          }
        }, 0);
      });
    }
  }

  private trackResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const resources = list.getEntries()
          .filter((entry): entry is PerformanceResourceTiming => 
            entry.entryType === 'resource'
          )
          .map((entry) => ({
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0
          }));

        // Track slow resources (>1s)
        const slowResources = resources.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
          this.sendSlowResourcesAlert(slowResources);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i)) return 'image';
    if (url.includes('fonts')) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private sendCustomMetric(name: string, value: number) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Custom Metric - ${name}:`, value);
    }

    this.sendToAnalytics([metric]);
  }

  private sendNavigationMetrics(metrics: Record<string, number>) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧭 Navigation Metrics:', metrics);
    }

    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'navigation',
        metrics,
        timestamp: Date.now(),
        url: window.location.href
      })
    }).catch(console.error);
  }

  private sendSlowResourcesAlert(resources: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🐌 Slow Resources Detected:', resources);
    }

    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'slow_resources',
        resources,
        timestamp: Date.now(),
        url: window.location.href
      })
    }).catch(console.error);
  }

  private sendToAnalytics(data: any[]) {
    // Batch send vitals data every 5 seconds or when page unloads
    if (typeof window !== 'undefined') {
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web_vitals',
          vitals: data,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    }
  }

  private setupUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Also flush on visibility change (mobile browsers)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  // Public methods
  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getPerformanceScore(): number {
    if (this.metrics.length === 0) return 0;

    const scores = this.metrics.map((metric: PerformanceMetric) => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 60;
        case 'poor': return 20;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }

  flush() {
    if (this.metrics.length > 0) {
      this.sendToAnalytics(this.metrics);
      this.metrics = [];
    }
  }

  // Method to manually track custom metrics
  trackCustomMetric(name: string, value: number) {
    this.recordMetric(name, value, 'good'); // Default to good for custom metrics
  }
}

export default PerformanceMonitor;