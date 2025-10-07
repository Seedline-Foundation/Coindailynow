// General Analytics Tracking System
// Centralized analytics for the entire application

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  page_url?: string;
  user_id?: string;
  session_id?: string;
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  public init(userId?: string): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    this.userId = userId;
    
    // Flush events periodically
    setInterval(() => {
      this.flush();
    }, 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  public track(event: string, properties: Record<string, any> = {}): void {
    if (typeof window === 'undefined') return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      page_url: window.location.href,
      session_id: this.sessionId,
      user_id: this.userId
    };

    this.events.push(analyticsEvent);

    // Auto-flush if we have too many events
    if (this.events.length >= 100) {
      this.flush();
    }
  }

  public identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    this.track('user_identified', { user_id: userId, ...traits });
  }

  public page(name?: string, properties: Record<string, any> = {}): void {
    this.track('page_view', {
      page_name: name,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...properties
    });
  }

  public flush(): void {
    if (this.events.length === 0 || typeof window === 'undefined') return;

    const eventsToSend = [...this.events];
    this.events = [];

    this.sendEvents(eventsToSend);
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const payload = JSON.stringify({ events });

      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/events', payload);
      } else {
        // Fallback to fetch
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        });
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Add events back to queue for retry
      this.events.unshift(...events);
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getDebugInfo(): {
    queuedEvents: number;
    sessionId: string;
    userId?: string;
    isInitialized: boolean;
  } {
    return {
      queuedEvents: this.events.length,
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Convenience functions
export function trackEvent(event: string, properties: Record<string, any> = {}): void {
  analytics.track(event, properties);
}

export function identifyUser(userId: string, traits: Record<string, any> = {}): void {
  analytics.identify(userId, traits);
}

export function trackPageView(name?: string, properties: Record<string, any> = {}): void {
  analytics.page(name, properties);
}

export function initAnalytics(userId?: string): void {
  analytics.init(userId);
}

export function flushAnalytics(): void {
  analytics.flush();
}

// Navigation-specific tracking (used by navigation components)
export const trackNavigationEvent = (action: string, properties: Record<string, any> = {}) => {
  trackEvent(`navigation_${action}`, {
    category: 'navigation',
    ...properties
  });
};

// Common event trackers
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', { button_name: buttonName, location });
};

export const trackLinkClick = (linkText: string, linkUrl: string, location: string) => {
  trackEvent('link_click', { link_text: linkText, link_url: linkUrl, location });
};

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent('form_submission', { form_name: formName, success });
};

export const trackSearchQuery = (query: string, resultsCount?: number, location?: string) => {
  trackEvent('search_query', { query, results_count: resultsCount, location });
};

export const trackError = (errorType: string, errorMessage: string, location: string) => {
  trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage, location });
};

// Performance tracking
export const trackPerformanceMetric = (metricName: string, value: number, unit: string = 'ms') => {
  trackEvent('performance_metric', { metric_name: metricName, value, unit });
};

// User engagement tracking
export const trackEngagement = (action: string, duration?: number, element?: string) => {
  trackEvent('user_engagement', { action, duration, element });
};

export default analytics;