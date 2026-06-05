# Progressive Web App

## Overview

Hiss-Tastic is installable as a PWA for mobile and desktop devices. The PWA
provides offline play and a native-app-like experience.

## Features

- **Installable** — meets PWA criteria (manifest, service worker, HTTPS or localhost)
- **Offline play** — all game assets cached by the service worker
- **Standalone mode** — opens without browser chrome when installed
- **No telemetry** — no analytics, no tracking, no network requests beyond cache
- **No accounts** — fully local, no sign-in required

## Files

| File | Purpose |
|------|---------|
| `manifest.webmanifest` | PWA manifest with icons, theme, display mode |
| `sw.js` | Service worker with cache-first strategy |
| `icons/icon-192.png` | 192x192 app icon |
| `icons/icon-512.png` | 512x512 app icon |

## Service Worker Strategy

The service worker uses a **cache-first** strategy:

1. On install — all assets are pre-cached.
2. On fetch — cached assets are served instantly.
3. On cache miss — network fetch with offline fallback.
4. On activate — old caches are cleaned up.

## Testing

To test PWA installability:

1. Serve the `web/` directory over HTTPS (or localhost).
2. Open Chrome DevTools → Application → Manifest.
3. Verify manifest loads and shows install criteria.
4. Click the Install button in the address bar.

## Privacy

- No analytics, no telemetry, no network requests beyond cache.
- Service worker does not log or transmit any data.
- All gameplay data stays local.
