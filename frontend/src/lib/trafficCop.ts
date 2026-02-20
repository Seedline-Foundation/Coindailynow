type TrafficFingerprint = {
  hash: string;
  userAgent: string;
  language: string;
  timezoneOffsetMin: number;
  screen: { w: number; h: number; dpr: number };
  platform: string;
  touchPoints: number;
  webdriver: boolean;
  canvas?: string;
  webgl?: { vendor?: string; renderer?: string };
};

type TrafficBehavior = {
  timeOnPageMs: number;
  scrollDepth: number;
  clickCount: number;
  pointerMoves: number;
  visibilityChanges: number;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function canvasFingerprint(): string | undefined {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('coindaily', 2, 2);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('coindaily', 4, 4);
    return canvas.toDataURL().slice(0, 200);
  } catch {
    return undefined;
  }
}

function webglInfo(): { vendor?: string; renderer?: string } | undefined {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return undefined;
    const debug = gl.getExtension('WEBGL_debug_renderer_info') as any;
    const vendor = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : undefined;
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : undefined;
    return { vendor: String(vendor || ''), renderer: String(renderer || '') };
  } catch {
    return undefined;
  }
}

export async function collectTrafficTelemetry(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('crypto' in window) || !('subtle' in crypto)) return;

  const start = Date.now();
  let clickCount = 0;
  let pointerMoves = 0;
  let visibilityChanges = 0;
  let maxScroll = 0;

  const onClick = () => { clickCount += 1; };
  const onMove = () => { pointerMoves += 1; };
  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = Math.max(1, (doc.scrollHeight - window.innerHeight));
    const depth = Math.min(1, scrollTop / height);
    if (depth > maxScroll) maxScroll = depth;
  };
  const onVis = () => { visibilityChanges += 1; };

  window.addEventListener('click', onClick, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVis, { passive: true });

  // Send after a short delay (keeps overhead low and avoids extra churn on navigation).
  const send = async () => {
    window.removeEventListener('click', onClick);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVis);

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const referrer = document.referrer || '';
    const path = location.pathname + location.search;

    const fpBase = {
      userAgent: navigator.userAgent || '',
      language: navigator.language || '',
      timezoneOffsetMin: new Date().getTimezoneOffset(),
      screen: { w: window.screen?.width || 0, h: window.screen?.height || 0, dpr: window.devicePixelRatio || 1 },
      platform: (navigator as any).platform || '',
      touchPoints: (navigator as any).maxTouchPoints || 0,
      webdriver: Boolean((navigator as any).webdriver),
      canvas: canvasFingerprint(),
      webgl: webglInfo(),
    };

    const hash = await sha256Base64Url(JSON.stringify(fpBase));
    const fingerprint: TrafficFingerprint = { hash, ...fpBase };

    const behavior: TrafficBehavior = {
      timeOnPageMs: Math.max(0, Date.now() - start),
      scrollDepth: maxScroll,
      clickCount,
      pointerMoves,
      visibilityChanges,
    };

    const body = {
      fingerprint,
      behavior,
      page: {
        path,
        referrer,
        navType: nav?.type || undefined,
      },
      ts: new Date().toISOString(),
    };

    const url = `${getApiBase()}/api/v1/traffic/collect`;

    try {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, blob);
        return;
      }
    } catch {
      // fall through
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {
      // ignore
    }
  };

  window.setTimeout(() => { void send(); }, 3500);
}
