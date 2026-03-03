/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b4554625'], (function (workbox) { 'use strict';

  importScripts();
  self.skipWaiting();
  workbox.clientsClaim();

  /* ── Precache critical assets ───────────────────────────────────── */
  workbox.precacheAndRoute([
    { url: '/', revision: '1' },
    { url: '/offline.html', revision: '1' },
    { url: '/manifest.json', revision: '1' },
  ]);

  /* ── Start URL — NetworkFirst ───────────────────────────────────── */
  workbox.registerRoute("/", new workbox.NetworkFirst({
    "cacheName": "start-url",
    plugins: [{
      cacheWillUpdate: async ({ response }) => {
        if (response && response.type === 'opaqueredirect') {
          return new Response(response.body, { status: 200, statusText: 'OK', headers: response.headers });
        }
        return response;
      }
    }]
  }), 'GET');

  /* ── Static assets — CacheFirst (JS, CSS, fonts, images) ────────── */
  workbox.registerRoute(
    /\/_next\/static\/.*/i,
    new workbox.CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new workbox.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 }),
      ],
    }),
    'GET'
  );

  workbox.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?)$/i,
    new workbox.CacheFirst({
      cacheName: 'images-fonts',
      plugins: [
        new workbox.ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 }),
      ],
    }),
    'GET'
  );

  /* ── API data — StaleWhileRevalidate (market data, articles) ────── */
  workbox.registerRoute(
    /\/api\/(market-data|v1\/prices|v1\/regulations|v1\/tax|v1\/reputation)/i,
    new workbox.StaleWhileRevalidate({
      cacheName: 'api-data',
      plugins: [
        new workbox.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
      ],
    }),
    'GET'
  );

  /* ── Article / news pages — NetworkFirst with offline fallback ───── */
  workbox.registerRoute(
    /\/(news|articles|tools)\/.*/i,
    new workbox.NetworkFirst({
      cacheName: 'pages',
      plugins: [
        new workbox.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 24 * 3600 }),
      ],
    }),
    'GET'
  );

  /* ── Catch-all — NetworkOnly with offline fallback ──────────────── */
  workbox.registerRoute(
    /.*/i,
    new workbox.NetworkOnly({ cacheName: 'fallback' }),
    'GET'
  );

  /* ── Offline fallback for navigations ───────────────────────────── */
  self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request).catch(() => caches.match('/offline.html'))
      );
    }
  });

  /* ── Push notification handling ─────────────────────────────────── */
  self.addEventListener('push', (event) => {
    let data = { title: 'CoinDaily', body: 'New update available', icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png' };
    try { if (event.data) data = { ...data, ...event.data.json() }; } catch { /* use defaults */ }

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag || 'coindaily-notification',
        data: data.url ? { url: data.url } : undefined,
        actions: [{ action: 'open', title: 'View' }],
      })
    );
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  });

}));
//# sourceMappingURL=sw.js.map
