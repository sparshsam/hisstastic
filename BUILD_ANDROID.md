# Building Hiss-Tastic for Android

## Prerequisites
- Android Studio (with SDK 34+)
- Java 17+
- Node.js 18+

## Steps

1. Install Android dependencies:
   ```bash
   cd hiss-tastic
   npm install
   npx cap sync
   ```

2. Add Android platform:
   ```bash
   npx cap add android
   ```

3. Open in Android Studio:
   ```bash
   npx cap open android
   ```

4. Build APK:
   - In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or command line: `cd android && ./gradlew assembleDebug`
   - APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

5. To update after web changes:
   ```bash
   npx cap sync
   npx cap open android   # if you want to rebuild in Android Studio
   ```
