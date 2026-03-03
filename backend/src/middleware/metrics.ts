/**
 * Prometheus Metrics Middleware
 * Exposes /metrics endpoint and tracks HTTP request duration, cache hits, and IVT rate.
 */

import { Request, Response, NextFunction, Router } from 'express';

/* ── Simple counter/histogram implementation (no prom-client dep) ── */

const counters: Record<string, number> = {};
const histogramBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];
const histogramData: Record<string, { sum: number; count: number; buckets: number[] }> = {};

function incCounter(name: string, labels: Record<string, string> = {}, value = 1) {
  const key = `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  counters[key] = (counters[key] || 0) + value;
}

function observeHistogram(name: string, labels: Record<string, string>, value: number) {
  const key = `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  if (!histogramData[key]) {
    histogramData[key] = { sum: 0, count: 0, buckets: new Array(histogramBuckets.length).fill(0) };
  }
  const h = histogramData[key];
  h.sum += value;
  h.count += 1;
  for (let i = 0; i < histogramBuckets.length; i++) {
    if (value <= histogramBuckets[i]) h.buckets[i]++;
  }
}

export function getCounter(name: string, labels: Record<string, string> = {}): number {
  const key = `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  return counters[key] || 0;
}

/* ── Middleware ────────────────────────────────────────────────────── */

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const method = req.method;
  const route = req.route?.path || req.path || 'unknown';

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;
    const status = String(res.statusCode);
    const statusGroup = `${status[0]}xx`;

    incCounter('http_requests_total', { method, status: statusGroup });
    observeHistogram('http_request_duration_seconds', { method, route: route.slice(0, 40) }, durationSec);
  });

  next();
}

/* ── Cache metrics helpers ────────────────────────────────────────── */

export function recordCacheHit()  { incCounter('cache_hits_total'); }
export function recordCacheMiss() { incCounter('cache_misses_total'); }

/* ── IVT rate gauge (set from Traffic Cop) ────────────────────────── */

let ivtRate = 0;
export function setIvtRate(rate: number) { ivtRate = rate; }

/* ── /metrics endpoint ────────────────────────────────────────────── */

export function metricsRouter(): Router {
  const router = Router();

  router.get('/metrics', (_req: Request, res: Response) => {
    const lines: string[] = [];

    // Counters
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    for (const [key, val] of Object.entries(counters)) {
      if (key.startsWith('http_requests_total')) lines.push(`${key.replace('{', '{').replace('}', '}')} ${val}`);
    }

    lines.push('# HELP cache_hits_total Total cache hits');
    lines.push('# TYPE cache_hits_total counter');
    lines.push(`cache_hits_total ${counters['cache_hits_total{}'] || 0}`);
    lines.push('# HELP cache_misses_total Total cache misses');
    lines.push('# TYPE cache_misses_total counter');
    lines.push(`cache_misses_total ${counters['cache_misses_total{}'] || 0}`);

    // Histograms
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');
    for (const [key, data] of Object.entries(histogramData)) {
      const baseName = key.split('{')[0];
      const labelsStr = key.slice(key.indexOf('{'));
      for (let i = 0; i < histogramBuckets.length; i++) {
        const cumulative = data.buckets.slice(0, i + 1).reduce((a, b) => a + b, 0);
        lines.push(`${baseName}_bucket${labelsStr.replace('}', `,le="${histogramBuckets[i]}"}`)} ${cumulative}`);
      }
      lines.push(`${baseName}_bucket${labelsStr.replace('}', ',le="+Inf"}')} ${data.count}`);
      lines.push(`${baseName}_sum${labelsStr} ${data.sum.toFixed(6)}`);
      lines.push(`${baseName}_count${labelsStr} ${data.count}`);
    }

    // Gauges
    lines.push('# HELP coindaily_ivt_rate Current IVT percentage');
    lines.push('# TYPE coindaily_ivt_rate gauge');
    lines.push(`coindaily_ivt_rate ${ivtRate.toFixed(2)}`);

    lines.push('# HELP nodejs_process_uptime_seconds Process uptime');
    lines.push('# TYPE nodejs_process_uptime_seconds gauge');
    lines.push(`nodejs_process_uptime_seconds ${process.uptime().toFixed(0)}`);

    lines.push('# HELP nodejs_heap_used_bytes Heap used bytes');
    lines.push('# TYPE nodejs_heap_used_bytes gauge');
    lines.push(`nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}`);

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(lines.join('\n') + '\n');
  });

  return router;
}
