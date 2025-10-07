import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ConversionEvent {
  name: string;
  value?: number;
  category: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  page: string;
  metadata?: Record<string, any>;
}

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  isControl: boolean;
}

interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  isActive: boolean;
  trafficAllocation: number; // 0-100 percentage
}

class ConversionOptimizer {
  private static instance: ConversionOptimizer;
  private sessionId: string;
  private userId?: string;
  private activeTests: Map<string, string> = new Map(); // testId -> variantId
  private events: ConversionEvent[] = [];
  private apiEndpoint = '/api/analytics/conversions';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserFromStorage();
  }

  static getInstance(): ConversionOptimizer {
    if (!ConversionOptimizer.instance) {
      ConversionOptimizer.instance = new ConversionOptimizer();
    }
    return ConversionOptimizer.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadUserFromStorage() {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        this.userId = storedUserId;
      }
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_id', userId);
    }
  }

  // Track conversion events
  trackEvent(name: string, options: Partial<ConversionEvent> = {}) {
    const event: ConversionEvent = {
      name,
      category: options.category || 'general',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      ...(options.value !== undefined && { value: options.value }),
      ...(this.userId && { userId: this.userId }),
      ...(options.metadata && { metadata: options.metadata })
    };

    this.events.push(event);

    // Send to analytics
    this.sendEvent(event);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Conversion Event:', event);
    }
  }

  // A/B Test Management
  async getVariant(testId: string): Promise<string | null> {
    try {
      // Check if user already has a variant assigned
      const storedVariant = this.getStoredVariant(testId);
      if (storedVariant) {
        return storedVariant;
      }

      // Fetch test configuration
      const test = await this.fetchTest(testId);
      if (!test || !test.isActive) {
        return null;
      }

      // Check if user should be included in test
      const shouldInclude = Math.random() < (test.trafficAllocation / 100);
      if (!shouldInclude) {
        return null;
      }

      // Assign variant based on weights
      const variant = this.assignVariant(test.variants);
      
      // Store assignment
      this.storeVariant(testId, variant.id);
      this.activeTests.set(testId, variant.id);

      // Track assignment event
      this.trackEvent('ab_test_assignment', {
        category: 'experimentation',
        metadata: {
          testId,
          variantId: variant.id,
          variantName: variant.name,
          isControl: variant.isControl
        }
      });

      return variant.id;
    } catch (error) {
      console.error(`Error getting variant for test ${testId}:`, error);
      return null;
    }
  }

  private getStoredVariant(testId: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`ab_test_${testId}`);
    }
    return null;
  }

  private storeVariant(testId: string, variantId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ab_test_${testId}`, variantId);
    }
  }

  private async fetchTest(testId: string): Promise<ABTest | null> {
    try {
      const response = await fetch(`/api/ab-tests/${testId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  private assignVariant(variants: ABTestVariant[]): ABTestVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return variants[0] || variants[0];
  }

  // Conversion funnel tracking
  trackFunnelStep(funnelName: string, step: string, stepIndex: number) {
    this.trackEvent('funnel_step', {
      category: 'funnel',
      metadata: {
        funnelName,
        step,
        stepIndex,
        timestamp: Date.now()
      }
    });
  }

  trackConversion(goalName: string, value?: number, metadata?: Record<string, any>) {
    const eventOptions: Partial<ConversionEvent> = {
      category: 'goal',
      metadata: {
        goalName,
        ...metadata,
        activeTests: Object.fromEntries(this.activeTests)
      }
    };

    if (value !== undefined) {
      eventOptions.value = value;
    }

    this.trackEvent('conversion', eventOptions);
  }

  // Common conversion events
  trackSignup(method: 'email' | 'social' | 'wallet' = 'email') {
    this.trackConversion('signup', 1, { method });
  }

  trackSubscription(tier: string, value: number) {
    this.trackConversion('subscription', value, { tier });
  }

  trackArticleRead(articleId: string, readPercentage: number) {
    if (readPercentage >= 75) {
      this.trackEvent('article_read_complete', {
        category: 'engagement',
        metadata: { articleId, readPercentage }
      });
    }
  }

  trackNewsletterSignup() {
    this.trackConversion('newsletter_signup', 1);
  }

  trackSocialShare(platform: string, contentType: string, contentId: string) {
    this.trackEvent('social_share', {
      category: 'engagement',
      metadata: { platform, contentType, contentId }
    });
  }

  trackPageView(page: string, referrer?: string) {
    this.trackEvent('page_view', {
      category: 'navigation',
      metadata: { page, referrer }
    });
  }

  // Send event to analytics
  private async sendEvent(event: ConversionEvent) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: [event],
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send conversion event:', error);
    }
  }

  // Flush all pending events
  flush() {
    if (this.events.length > 0) {
      const eventsToSend = [...this.events];
      this.events = [];
      
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: eventsToSend,
          timestamp: Date.now()
        })
      }).catch(console.error);
    }
  }

  // Get conversion insights
  getSessionEvents(): ConversionEvent[] {
    return this.events;
  }

  getActiveTests(): Map<string, string> {
    return this.activeTests;
  }
}

// React hook for conversion optimization
export function useConversionOptimizer() {
  const router = useRouter();
  const [optimizer] = useState(() => ConversionOptimizer.getInstance());

  useEffect(() => {
    // Track page views
    const handleRouteChange = (url: string) => {
      optimizer.trackPageView(url, document.referrer);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page view
    optimizer.trackPageView(router.asPath, document.referrer);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      optimizer.flush();
    };
  }, [router, optimizer]);

  return {
    trackEvent: optimizer.trackEvent.bind(optimizer),
    trackConversion: optimizer.trackConversion.bind(optimizer),
    trackSignup: optimizer.trackSignup.bind(optimizer),
    trackSubscription: optimizer.trackSubscription.bind(optimizer),
    trackArticleRead: optimizer.trackArticleRead.bind(optimizer),
    trackNewsletterSignup: optimizer.trackNewsletterSignup.bind(optimizer),
    trackSocialShare: optimizer.trackSocialShare.bind(optimizer),
    trackFunnelStep: optimizer.trackFunnelStep.bind(optimizer),
    getVariant: optimizer.getVariant.bind(optimizer),
    setUserId: optimizer.setUserId.bind(optimizer)
  };
}

// A/B Testing hook
export function useABTest(testId: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const optimizer = ConversionOptimizer.getInstance();
    
    optimizer.getVariant(testId).then((variantId) => {
      setVariant(variantId);
      setLoading(false);
    });
  }, [testId]);

  return { variant, loading };
}

// Conversion tracking component
export function ConversionTracker({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const optimizer = ConversionOptimizer.getInstance();

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 90].includes(scrollDepth)) {
          optimizer.trackEvent('scroll_depth', {
            category: 'engagement',
            value: scrollDepth,
            metadata: { page: router.asPath }
          });
        }
      }
    };

    // Track time on page
    const startTime = Date.now();
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime;
      optimizer.trackEvent('time_on_page', {
        category: 'engagement',
        value: timeOnPage,
        metadata: { page: router.asPath }
      });
    };

    // Event listeners
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);

    return () => {
      window.removeEventListener('scroll', trackScrollDepth);
      window.removeEventListener('beforeunload', trackTimeOnPage);
      optimizer.flush();
    };
  }, [router]);

  return children as React.ReactElement;
}

export default ConversionOptimizer;