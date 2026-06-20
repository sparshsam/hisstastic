/**
 * HissTastic Service Worker
 * Provides offline caching for the browser game.
 * Gracefully handles missing assets so local dev is never blocked.
 * No telemetry or analytics. Optional leaderboard calls are made by the app.
 */

const CACHE_NAME = 'hisstastic-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/game.js',
  './js/renderer.js',
  './js/input.js',
  './js/audio.js',
  './js/replay.js',
  './js/identity.js',
  './js/supabase.js',
  './js/app.js',
  './js/snakeFacts.js',
  './js/commentary.js',
  './js/snakeField.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/background-music.mp3',
];

// Install: cache all assets, skip failures gracefully
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll for atomic caching, but wrap in a per-item catch
      // so a single missing asset (e.g. background-music.mp3) doesn't
      // prevent the entire service worker from installing.
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch(() => {
            // Silently skip assets that fail to cache
          })
        )
      );
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
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
