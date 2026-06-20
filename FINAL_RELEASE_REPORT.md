# HissTastic v1.0.0 Release Report

Date: 2026-06-18
Branch: `playstore-production-release`

## Release Scope

- Normalized app version metadata to `1.0.0`.
- Generated and tracked the Capacitor `android/` project for release review.
- Configured Android release bundle builds.
- Confirmed Android compile/target SDK 36, satisfying the API 35+ Play requirement.
- Added local-keystore signing documentation and Gradle signing support.
- Kept optional Supabase cloud leaderboard behavior and updated privacy/store/Data Safety disclosures.
- Removed AndroidX's generated app-private dynamic receiver permission from the packaged manifest.
- Added Play Store asset checklist and Play Store release runbook.

## Android Metadata

`aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk`:

```text
package: name='com.sparshsam.hisstastic' versionCode='1' versionName='1.0.0'
compileSdkVersion='36'
sdkVersion:'24'
targetSdkVersion:'36'
uses-permission: name='android.permission.INTERNET'
```

## Build Artifacts

```text
android/app/build/outputs/apk/debug/app-debug.apk      6.3M
android/app/build/outputs/bundle/release/app-release.aab 5.2M
```

The release AAB compiles successfully. For Play upload, build with a local upload keystore and `android/keystore.properties` as documented in `BUILD_ANDROID.md` and `RELEASE_PLAYSTORE.md`.

## Verification

Passed:

- `npm ci`
- `npm run cap:sync`
- `.venv/bin/python -c "import py_compile; py_compile.compile('main.py', doraise=True); py_compile.compile('validation.py', doraise=True)"`
- `.venv/bin/python -c "import hiss_tastic; print('Package imports OK')"`
- `.venv/bin/python -m unittest discover -s tests -v` — 4 tests passed
- `bash scripts/check-local.sh` — 23 passed, 0 failed
- `.venv/bin/python validation.py` — 6/6 checks passed
- `JAVA_HOME=/home/linuxbrew/.linuxbrew/opt/openjdk@21 ./gradlew :app:assembleDebug :app:bundleRelease` — build successful
- Browser smoke test in headless Google Chrome via DevTools Protocol:
  - Home rendered
  - `v1.0.0` rendered on home
  - Settings modal rendered
  - `HissTastic v1.0.0` rendered in settings
  - Scores overlay rendered
  - Gameplay page rendered
  - Canvas size: 374 x 560 CSS pixels
  - No page/runtime errors captured

Browser smoke screenshots:

```text
/tmp/hisstastic-home.png
/tmp/hisstastic-settings.png
/tmp/hisstastic-scores.png
/tmp/hisstastic-gameplay.png
```

## Emulator Smoke

Blocked locally:

- `adb` exists at `/home/spars/Android/Sdk/platform-tools/adb`
- No connected devices were listed by `adb devices`
- No Android emulator binary was found under the local Android SDK paths
- No local AVDs were found under `/home/spars/.android`

Required follow-up on a machine with emulator/device access:

```bash
/home/spars/Android/Sdk/platform-tools/adb devices
/home/spars/Android/Sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Then verify:

- App launches.
- Home shows v1.0.0.
- New game starts.
- Touch controls work.
- Pause/resume works.
- Game over and local score save work.
- Optional cloud score save/read succeeds or fails gracefully.

## Remaining Play Console Prerequisites

- Create or reuse a Play upload keystore locally.
- Build the signed release AAB with `android/keystore.properties` present.
- Complete the Play Store assets checklist in `PLAY_STORE_ASSETS.md`.
- Upload screenshots and feature graphic to Play Console.
- Complete Data Safety using the notes in `STORE_LISTING.md` and `PRIVACY_POLICY.md`.
- Run internal testing before closed testing and production rollout.
