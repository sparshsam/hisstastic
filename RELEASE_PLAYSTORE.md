# HissTastic Play Store Release Runbook

This runbook is for releasing HissTastic v1.0.0 to Google Play.

## 1. Pre-Release Checks

```bash
git status --short --branch
npm ci
npm run cap:sync
bash scripts/check-local.sh
python -m unittest discover -s tests -v
cd android && ./gradlew :app:assembleDebug :app:bundleRelease
```

Confirm:

- Java 21 is active for Gradle.
- `android/app/build.gradle` has `versionName "1.0.0"` and `versionCode 1`.
- `android/variables.gradle` targets API 35 or newer. Current target is 36.
- Android manifest declares only `INTERNET`.
- Privacy policy, store listing, and Data Safety notes disclose username, anonymous player ID, personal-best leaderboard sync, and local-only score history.
- Play Store assets checklist is complete.

## 2. Local Signing

Create the upload keystore if one does not already exist:

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

Build the signed release bundle:

```bash
npm run cap:sync
npm run cap:bundle:release
```

Upload:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Do not commit `android/keystore.properties`, `*.jks`, or `*.keystore`.

## 3. Internal Testing Track

1. Open Google Play Console.
2. Select HissTastic.
3. Go to **Testing → Internal testing**.
4. Create a new release.
5. Upload `app-release.aab`.
6. Add release notes:

   ```text
   HissTastic v1.0.0 production candidate: Play-ready Android bundle, touch controls, themes, power-ups, replay support, local score history, first-run username setup, and anonymous personal-best global leaderboard.
   ```

7. Review warnings. Resolve any permission, target API, signing, or Data Safety issue before rollout.
8. Add internal testers and publish to internal testing.
9. Install from the Play testing link and smoke test:
   - App launches.
   - Home screen shows v1.0.0.
   - New game starts.
   - Touch controls work.
   - Pause/resume works.
   - Game over appears.
   - First-run username setup works.
   - Local score history works after every completed game.
   - New personal best syncs to global leaderboard.
   - Non-best games do not write to the global leaderboard.
   - Offline personal-best sync is marked pending and later retries.

## 4. Closed Testing Track

1. Go to **Testing → Closed testing**.
2. Create or select a tester group.
3. Promote the internal testing release or create a new release with the same AAB.
4. Include the same release notes.
5. Run for the required Google Play testing window for the account/app type.
6. Monitor Android vitals, user feedback, crashes, ANRs, install issues, and policy warnings.

## 5. Production Rollout

1. Go to **Release → Production**.
2. Create a new release.
3. Upload or promote the tested AAB.
4. Confirm store listing, content rating, Data Safety, target audience, ads declaration, privacy policy URL, and screenshots are complete.
5. Start with a staged rollout, recommended 5%.
6. Monitor crashes, ANRs, reviews, and leaderboard/network reports for at least 24 hours.
7. Increase rollout to 25%, 50%, then 100% if no blockers appear.

## 6. Rollback / Halt

If a blocker appears:

1. Halt staged rollout in Play Console.
2. Create a fix branch and increment `versionCode`.
3. Build and upload a new AAB to internal testing.
4. Promote the fixed release only after smoke tests pass.
