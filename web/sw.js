/**
 * Hiss-Tastic Service Worker
 * Provides offline caching for the browser game.
 * No telemetry, no analytics, no networking beyond cache.
 */

const CACHE_NAME = 'hiss-tastic-v1';
const ASSETS_TO_CACHE = [
  '/web/',
  '/web/index.html',
  '/web/css/style.css',
  '/web/js/game.js',
  '/web/js/renderer.js',
  '/web/js/input.js',
  '/web/js/audio.js',
  '/web/js/replay.js',
  '/web/js/app.js',
  '/web/manifest.webmanifest',
  '/web/icons/icon-192.png',
  '/web/icons/icon-512.png',
];

// Install: cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Offline fallback: return a basic response for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/web/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
