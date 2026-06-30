# Deployment

HissTastic can be deployed as an Android app (via Capacitor) or as a PWA (via any static hosting).

## Android Build (Capacitor)

### Prerequisites

- Android SDK 35+ (target/compile SDK 36)
- Java 21+
- Node.js 18+

### Build Steps

```bash
npm install
npx cap sync
npm run cap:bundle:release
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
The AAB will be at `android/app/build/outputs/bundle/release/app-release.aab`.

### Detailed Instructions

See [BUILD_ANDROID.md](../BUILD_ANDROID.md) for detailed debug, release, and signing instructions, including keystore setup and Play Store submission.

## PWA Deployment

The browser runtime is a static site — deployable to any static hosting provider.

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

The live game is hosted at: [https://hiss-tastic.vercel.app](https://hiss-tastic.vercel.app)

### Other Options

- **GitHub Pages:** Push the `web/` directory to `gh-pages` branch
- **Netlify:** Connect repo and set publish directory to `web/`
- **Any static server:** Copy the `web/` directory to any HTTP server

### PWA Notes

- On HTTPS, the service worker caches all assets for offline play.
- On plain HTTP localhost, the service worker is intentionally skipped (avoid stale-cache confusion during development).
- Test full PWA behavior on HTTPS before production release.

### Play Store Listing

See [STORE_LISTING.md](../STORE_LISTING.md) for the Play Store description, screenshots, and promotional assets.
