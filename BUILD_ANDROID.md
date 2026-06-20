# Building HissTastic for Android

## Prerequisites
- Android Studio (with Android SDK 35+; this project currently compiles and targets SDK 36)
- Java 21+
- Node.js 18+

## Project State

The Capacitor `android/` project is generated and committed so Play Store release settings can be reviewed. Local Gradle output, `local.properties`, keystores, and signing property files are excluded from git.

## Debug Build

1. Install Android dependencies:
   ```bash
   cd hisstastic
   npm ci
   npm run cap:sync
   ```

2. Build a debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

The debug APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Release AAB Build

Google Play production uploads should use an Android App Bundle:

```bash
npm ci
npm run cap:sync
npm run cap:bundle:release
```

The release AAB is written to:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Signing Setup

Create a local upload keystore outside git-tracked files:

```bash
mkdir -p android/app/keystores
keytool -genkeypair \
  -v \
  -keystore android/app/keystores/hisstastic-upload.jks \
  -alias hisstastic-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Create `android/keystore.properties` locally:

```properties
storeFile=app/keystores/hisstastic-upload.jks
storePassword=replace-with-local-secret
keyAlias=hisstastic-upload
keyPassword=replace-with-local-secret
```

`android/keystore.properties`, `*.jks`, and `*.keystore` are ignored by git. Never commit keystores or passwords. When `android/keystore.properties` is present, Gradle signs `release` builds with that keystore. Without it, CI can still compile the release bundle, but the output is not upload-ready for Play Console.

## Android Studio

```bash
npm run cap:sync
npx cap open android
```

In Android Studio, use **Build → Generate Signed App Bundle / APK → Android App Bundle** and select the local upload keystore.

## Permissions

The app declares only:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

This permission is required for optional Supabase cloud leaderboard requests and user-opened external links. No location, contacts, camera, microphone, storage, advertising ID, or notification permissions are declared.

## Updating After Web Changes

```bash
npm run cap:sync
npm run cap:bundle:release
```
