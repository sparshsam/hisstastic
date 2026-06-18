# First-Run Identity and Leaderboard Report

Date: 2026-06-18
Branch: `first-run-identity-leaderboard`

## First-Run Flow

On first launch, Hiss-Tastic shows a welcome/profile setup modal:

- Thanks the player for playing Hiss-Tastic.
- Explains snake gameplay, high-score chasing, and global leaderboard visibility.
- Asks for a username.
- Provides a Randomize button.

If the username field is empty, the app generates and saves a random username automatically.

## Username Generator and Validation

Generated usernames use:

```text
adjective + whimsical word
```

Examples include names such as `Cogitating Cobra`, `Wiggly Oracle`, and `Velvet Noodle`.

Validation rules:

- 3-24 characters
- letters, numbers, spaces, hyphens, and underscores only
- repeated spaces are normalized
- a small built-in profanity list rejects obvious offensive names

Players can edit the username later in Settings.

## Data Stored Locally

Local storage contains:

- `player_id`: anonymous UUID generated on-device
- `username`
- profile timestamps
- profile-ready flag
- local score history for completed games
- personal best
- pending leaderboard sync state
- existing local settings and gameplay stats

No email, phone number, real name, location, contacts, advertising ID, analytics ID, or device account is collected.

## Data Stored in Supabase

Supabase stores only global leaderboard identity/best-score data:

- `players`
  - `id`
  - `username`
  - `created_at`
  - `updated_at`
- `leaderboard_scores`
  - `id`
  - `player_id`
  - `username`
  - `best_score`
  - `updated_at`

No Supabase `score_history` table is created. Full score history remains local-only.

Schema migration:

```text
supabase/migrations/20260618151500_player_identity_leaderboard.sql
```

Supabase's 2026 Data API exposure change was reviewed. The migration includes explicit grants plus RLS policies for anonymous REST access to the two public leaderboard tables.

## Leaderboard Update Rules

On every completed game:

1. Save the result to local score history.
2. Compare score with local personal best.
3. If it is not a new personal best, do not write to Supabase.
4. If it is a new personal best:
   - update local personal best
   - upsert the player profile
   - upsert the player's single global leaderboard row
   - update the username snapshot on the leaderboard row

The global leaderboard stores one best score per player, not every game.

## Offline Behavior

Gameplay is never blocked by leaderboard sync.

If offline during a new personal best:

- the score is saved locally
- the new best is marked as pending leaderboard sync
- the game-over screen says it will sync when online
- the latest pending personal best is retried when the browser/app returns online

## UI Changes

Added:

- first-run welcome/profile setup modal
- Settings username editor
- local score history view
- global leaderboard view
- personal best display
- player rank display when available
- game-over messages for personal-best sync state

## Play Store Disclosure Impact

Updated docs disclose:

- chosen username and high score may appear on the global leaderboard
- no real-name account is required
- anonymous player ID is used only for leaderboard identity
- score history remains local-only
- no email, phone, real name, location, contacts, advertising ID, telemetry, ads, or crash-reporting SDK is collected

Updated files include:

- `README.md`
- `STORE_LISTING.md`
- `RELEASE_PLAYSTORE.md`
- `PRIVACY_POLICY.md`
- `CHANGELOG.md`

## Validation

Passed:

- `npm ci`
- `node --check web/js/identity.js web/js/supabase.js web/js/app.js web/sw.js`
- `.venv/bin/python -m unittest discover -s tests -v`
- `bash scripts/check-local.sh`
- `.venv/bin/python validation.py`
- `npm run cap:sync`
- `JAVA_HOME=/home/linuxbrew/.linuxbrew/opt/openjdk@21 ./gradlew :app:assembleDebug :app:bundleRelease`
- Browser smoke test in fresh headless Chrome:
  - first-run modal appears
  - Randomize produces a valid username
  - profile save stores local identity and closes immediately
  - Settings username edit persists
  - scores overlay opens
  - game page and canvas render

Pending:

- Android emulator/device smoke test. `adb` and `emulator` were not available in this environment.

Smoke screenshots:

```text
/tmp/hiss-tastic-first-run.png
/tmp/hiss-tastic-profile-settings.png
/tmp/hiss-tastic-identity-scores.png
/tmp/hiss-tastic-identity-gameplay.png
```
