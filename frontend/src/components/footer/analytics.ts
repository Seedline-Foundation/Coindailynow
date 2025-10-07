/**
 * CoinDaily Platform - Footer Analytics Service
 * Task 55: FR-112 Analytics tracking for footer interactions
 * 
 * Features:
 * - Comprehensive event tracking
 * - User behavior analytics
 * - Engagement metrics
 * - Performance monitoring
 * - GDPR-compliant data collection
 */

import { FooterAnalyticsEvent, FooterAnalyticsEventType } from './types';

interface AnalyticsConfig {
  trackingId?: string;
  userId?: string;
  sessionId?: string;
  enableDebug?: boolean;
  endpoint?: string;
}

class FooterAnalyticsService {
  private config: AnalyticsConfig;
  private sessionId: string;
  private userId?: string;
  private eventQueue: FooterAnalyticsEvent[] = [];
  private isInitialized = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enableDebug: false,
      endpoint: '/api/analytics/footer',
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.userId = config.userId || this.getUserId();
    
    if (typeof window !== 'undefined') {
      this.initializeAnalytics();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // Try to get user ID from localStorage or cookies
    try {
      return localStorage.getItem('coindaily_user_id') || undefined;
    } catch {
      return undefined;
    }
  }

  private initializeAnalytics(): void {
    if (this.isInitialized) return;

    // Track page view for footer
    this.track('footer_page_view', {
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Set up visibility change tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('footer_session_end', {
          session_duration: Date.now() - this.getSessionStartTime()
        });
      } else {
        this.track('footer_session_resume');
      }
    });

    // Set up beforeunload tracking
    window.addEventListener('beforeunload', () => {
      this.flushEventQueue();
    });

    this.isInitialized = true;
  }

  private getSessionStartTime(): number {
    const stored = sessionStorage.getItem('coindaily_session_start');
    if (stored) return parseInt(stored, 10);
    
    const startTime = Date.now();
    sessionStorage.setItem('coindaily_session_start', startTime.toString());
    return startTime;
  }

  /**
   * Track footer analytics events
   */
  public track(
    event: FooterAnalyticsEventType, 
    properties: Record<string, any> = {}
  ): void {
    const analyticsEvent: FooterAnalyticsEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : '',
        page_title: typeof document !== 'undefined' ? document.title : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      },
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    if (this.config.enableDebug) {
      console.log('Footer Analytics Event:', analyticsEvent);
    }

    // Add to queue
    this.eventQueue.push(analyticsEvent);

    // Send immediately for critical events
    const criticalEvents = [
      'newsletter_signup_success',
      'footer_link_click',
      'social_media_click'
    ];

    if (criticalEvents.includes(event)) {
      this.sendEvent(analyticsEvent);
    } else {
      // Batch send for non-critical events
      this.scheduleEventFlush();
    }

    // Send to Google Analytics if available
    this.sendToGoogleAnalytics(event, properties);
  }

  /**
   * Track newsletter subscription events
   */
  public trackNewsletterEvent(
    action: 'attempt' | 'success' | 'error' | 'validation_error',
    data: {
      email?: string;
      language?: string;
      preferences?: string[];
      error?: string;
      source?: string;
    }
  ): void {
    const eventName = `newsletter_signup_${action}` as FooterAnalyticsEventType;
    
    this.track(eventName, {
      ...data,
      email_domain: data.email ? data.email.split('@')[1] : undefined,
      email: undefined // Don't store actual email for privacy
    });
  }

  /**
   * Track social media interactions
   */
  public trackSocialMediaClick(
    platform: string,
    properties: Record<string, any> = {}
  ): void {
    this.track('social_media_click', {
      platform,
      location: 'footer',
      ...properties
    });
  }

  /**
   * Track footer link clicks
   */
  public trackFooterLinkClick(
    linkData: {
      href: string;
      label: string;
      section?: string;
      external?: boolean;
    }
  ): void {
    this.track('footer_link_click', {
      ...linkData,
      link_type: linkData.external ? 'external' : 'internal'
    });
  }

  /**
   * Track theme changes
   */
  public trackThemeChange(from: string, to: string): void {
    this.track('theme_toggle', {
      from,
      to,
      location: 'footer'
    });
  }

  /**
   * Track language changes
   */
  public trackLanguageChange(from: string, to: string): void {
    this.track('language_change', {
      from,
      to,
      location: 'footer'
    });
  }

  /**
   * Track search interactions
   */
  public trackFooterSearch(query: string): void {
    this.track('footer_search', {
      query_length: query.length,
      has_special_chars: /[!@#$%^&*(),.?":{}|<>]/.test(query),
      location: 'footer'
    });
  }

  /**
   * Track quick actions
   */
  public trackQuickAction(action: 'back_to_top' | 'print' | 'share'): void {
    const eventName = `footer_${action}_click` as FooterAnalyticsEventType;
    this.track(eventName, {
      location: 'footer'
    });
  }

  /**
   * Send event to backend
   */
  private async sendEvent(event: FooterAnalyticsEvent): Promise<void> {
    if (!this.config.endpoint) return;

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch (error) {
      if (this.config.enableDebug) {
        console.error('Failed to send analytics event:', error);
      }
    }
  }

  /**
   * Send to Google Analytics
   */
  private sendToGoogleAnalytics(
    event: string, 
    properties: Record<string, any>
  ): void {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    try {
      (window as any).gtag('event', event, {
        event_category: 'footer',
        event_label: properties.label || properties.platform || '',
        value: properties.value || 1,
        custom_parameters: {
          session_id: this.sessionId,
          user_id: this.userId,
          ...properties
        }
      });
    } catch (error) {
      if (this.config.enableDebug) {
        console.error('Failed to send to Google Analytics:', error);
      }
    }
  }

  /**
   * Schedule event flush for batch sending
   */
  private scheduleEventFlush(): void {
    if (this.eventQueue.length >= 10) {
      this.flushEventQueue();
    } else {
      setTimeout(() => {
        if (this.eventQueue.length > 0) {
          this.flushEventQueue();
        }
      }, 5000); // Flush every 5 seconds
    }
  }

  /**
   * Flush event queue
   */
  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (!this.config.endpoint) return;

    try {
      await fetch(`${this.config.endpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events }),
        keepalive: true
      });
    } catch (error) {
      if (this.config.enableDebug) {
        console.error('Failed to flush event queue:', error);
      }
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get analytics summary
   */
  public async getAnalyticsSummary(): Promise<any> {
    if (!this.config.endpoint) return null;

    try {
      const response = await fetch(`${this.config.endpoint}/summary?session=${this.sessionId}`);
      return await response.json();
    } catch (error) {
      if (this.config.enableDebug) {
        console.error('Failed to get analytics summary:', error);
      }
      return null;
    }
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('coindaily_user_id', userId);
    }
  }

  /**
   * Clear user data (GDPR compliance)
   */
  public clearUserData(): void {
    this.userId = undefined;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coindaily_user_id');
      sessionStorage.removeItem('coindaily_session_start');
    }
    this.eventQueue = [];
  }
}

// Create singleton instance
let footerAnalyticsInstance: FooterAnalyticsService | null = null;

export const getFooterAnalytics = (config?: AnalyticsConfig): FooterAnalyticsService => {
  if (!footerAnalyticsInstance) {
    footerAnalyticsInstance = new FooterAnalyticsService(config);
  }
  return footerAnalyticsInstance;
};

export default FooterAnalyticsService;