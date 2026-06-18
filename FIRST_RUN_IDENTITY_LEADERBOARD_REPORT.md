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

## Supabase RLS and Leaderboard Security Review

Final review status: acceptable for the anonymous/no-account leaderboard model, with one explicit limitation.

Confirmed:

- RLS is enabled and forced on `public.players` and `public.leaderboard_scores`.
- Public leaderboard reads are restricted with column grants to display-safe fields only: `username`, `best_score`, and `updated_at`.
- `public.players` grants public clients only `id` and `username`, and RLS limits reads to the `x-player-id` header matching `players.id`.
- Anonymous inserts/updates require the browser-sent `x-player-id` header to match `players.id` or `leaderboard_scores.player_id`.
- `leaderboard_scores.username` must match the corresponding `players.username` row.
- Username validation exists client-side and database-side: 3-24 characters, letters, numbers, spaces, hyphens, and underscores.
- `leaderboard_scores.best_score` rejects negative values and values above `150000000`, a conservative cap above the theoretical board-clearing score range for the current game.
- A unique constraint on `leaderboard_scores.player_id` stores one best-score row per player.
- A trigger preserves the highest leaderboard score if an older/lower pending update is replayed.
- No Supabase `score_history` table exists; full score history remains local-only.
- The web client uses the publishable Supabase key only, never a service-role or secret key.
- Privacy/Data Safety docs match the implementation: username, anonymous player ID, and personal best can be sent to Supabase; email, phone, location, contacts, advertising ID, real name, analytics, telemetry, and crash-reporting data are not collected.

Security limitation:

- Because Hiss-Tastic intentionally has no account login or server-side session, the anonymous `x-player-id` header is not cryptographic authentication. It constrains normal app writes and prevents accidental cross-player updates, but a determined client with the public API key could still forge requests. Stronger protection would require authenticated users, server-verified score proofs, or a backend signing/verifier flow.

Review changes made:

- Replaced broad `true` insert/update RLS policies with request-header player ID checks.
- Replaced broad table reads with column-level grants.
- Removed `player_id` from public leaderboard fetches.
- Disabled exact own-rank display under the public-read model because exposing player IDs would weaken anonymous identity safety.
- Added database score cap and client-side sync cap for impossible leaderboard values.

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
