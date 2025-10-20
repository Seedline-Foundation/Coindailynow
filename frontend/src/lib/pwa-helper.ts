// frontend/src/lib/pwa-helper.ts
// Task 66: PWA Installation and Push Notification Helper

interface PWAInstallData {
  platform: string;
  browser: string;
  deviceType: string;
  screenResolution: string;
  viewport: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PWAHelper {
  private static instance: PWAHelper;
  private installPrompt: any = null;
  private isInstalled = false;
  private installId: string;

  private constructor() {
    this.installId = this.getOrCreateInstallId();
    this.setupPWAListeners();
  }

  public static getInstance(): PWAHelper {
    if (!PWAHelper.instance) {
      PWAHelper.instance = new PWAHelper();
    }
    return PWAHelper.instance;
  }

  /**
   * Setup PWA event listeners
   */
  private setupPWAListeners() {
    if (typeof window === 'undefined') return;

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
      console.log('[PWA] Install prompt available');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.isInstalled = true;
      this.trackInstallation();
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('[PWA] Already installed');
    }
  }

  /**
   * Get or create unique install ID
   */
  private getOrCreateInstallId(): string {
    let installId = localStorage.getItem('pwa_install_id');
    if (!installId) {
      installId = `pwa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('pwa_install_id', installId);
    }
    return installId;
  }

  /**
   * Check if PWA can be installed
   */
  public canInstall(): boolean {
    return !!this.installPrompt && !this.isInstalled;
  }

  /**
   * Check if PWA is already installed
   */
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Show install prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.canInstall()) {
      console.log('[PWA] Cannot show install prompt');
      return false;
    }

    try {
      this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('[PWA] User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Track PWA installation
   */
  private async trackInstallation() {
    try {
      const installData: PWAInstallData = {
        platform: this.detectPlatform(),
        browser: this.detectBrowser(),
        deviceType: this.detectDeviceType(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };

      await fetch('/api/engagement/pwa/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installId: this.installId,
          userId: localStorage.getItem('userId'),
          installData,
        }),
      });

      console.log('[PWA] Installation tracked');
    } catch (error) {
      console.error('[PWA] Error tracking installation:', error);
    }
  }

  /**
   * Detect platform
   */
  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'ANDROID';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'IOS';
    if (userAgent.includes('win')) return 'WINDOWS';
    if (userAgent.includes('mac')) return 'MAC';
    if (userAgent.includes('linux')) return 'LINUX';
    
    return 'UNKNOWN';
  }

  /**
   * Detect browser
   */
  private detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) return 'CHROME';
    if (userAgent.includes('safari')) return 'SAFARI';
    if (userAgent.includes('firefox')) return 'FIREFOX';
    if (userAgent.includes('edge')) return 'EDGE';
    if (userAgent.includes('opera')) return 'OPERA';
    
    return 'UNKNOWN';
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): string {
    const width = window.innerWidth;
    
    if (width < 768) return 'MOBILE';
    if (width < 1024) return 'TABLET';
    return 'DESKTOP';
  }

  /**
   * Register service worker
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered');
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Request push notification permission
   */
  public async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA] Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribeToPush(
    userId: string
  ): Promise<PushSubscription | null> {
    try {
      // Register service worker first
      const registration = await this.registerServiceWorker();
      if (!registration) {
        throw new Error('Service Worker registration failed');
      }

      // Request permission
      const hasPermission = await this.requestPushPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as any, // Type workaround for BufferSource
      });

      // Send subscription to server
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      await fetch('/api/engagement/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          deviceInfo: {
            deviceType: this.detectDeviceType(),
            browser: this.detectBrowser(),
            os: this.detectPlatform(),
          },
        }),
      });

      console.log('[PWA] Push subscription created');
      return subscription;
    } catch (error) {
      console.error('[PWA] Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Show local notification (for testing)
   */
  public async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/manifest-icon-192.maskable.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    }
  }
}

// Export singleton instance
export const pwaHelper = PWAHelper.getInstance();
