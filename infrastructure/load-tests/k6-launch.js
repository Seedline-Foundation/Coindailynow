/**
 * CoinDaily launch load test — run on Contabo or CI against production/staging.
 *
 * Install: https://k6.io/docs/get-started/installation/
 * Run:
 *   k6 run infrastructure/load-tests/k6-launch.js
 *   BASE_URL=https://coindaily.online API_URL=https://app.coindaily.online k6 run ...
 *
 * Target: P95 < 800ms at 500 VUs (mixed traffic).
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const p95 = new Trend('custom_p95', true);

const BASE = __ENV.BASE_URL || 'https://coindaily.online';
const API = __ENV.API_URL || 'https://app.coindaily.online';

export const options = {
  scenarios: {
    launch_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const roll = Math.random();

  let res;
  if (roll < 0.5) {
    res = http.get(`${BASE}/`, { tags: { name: 'homepage' } });
  } else if (roll < 0.75) {
    res = http.get(`${API}/health`, { tags: { name: 'api_health' } });
  } else if (roll < 0.9) {
    res = http.get(`${API}/api/v1/prices/batch`, { tags: { name: 'market_batch' } });
  } else {
    res = http.get(`${API}/api/sitemap/articles`, { tags: { name: 'sitemap_articles' } });
  }

  check(res, {
    'status 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
  });

  p95.add(res.timings.duration);
  sleep(0.5 + Math.random() * 1.5);
}

export function handleSummary(data) {
  const p95ms = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const pass = p95ms < 800;
  return {
    stdout: `\n=== Launch load test ===\nP95: ${p95ms.toFixed(0)}ms — ${pass ? 'PASS' : 'FAIL'} (target < 800ms)\n`,
  };
}
