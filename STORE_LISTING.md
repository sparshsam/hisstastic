# Hiss-Tastic — Play Store Listing

## App Title
Hiss-Tastic

## Short Description (80 char max)
A retro Snake-inspired arcade game. Collect, dodge, and survive in style.

## Full Description
Hiss-Tastic is a modern take on the classic Snake arcade game — rebuilt for mobile with touch controls, power-ups, themes, and zero ads or tracking.

**Features:**
- Classic Snake gameplay with grid-based movement and quadratic scoring
- 4 power-up types: Immunity, Speed Boost, Shield, and Score Multiplier
- 4 visual themes: Classic, Midnight, Desert, and Ocean
- Deterministic replay system — record, export, and replay your games
- Live snake-fact roast commentary that roasts your gameplay
- Decorative animated snake field background
- Proportional D-pad with swipe support
- Portrait and landscape support
- Offline play via PWA service worker
- Anonymous optional cloud leaderboard plus local-only scores
- No ads, no tracking, no accounts

**Power-ups:**
- 🛡️ Shield — blocks one collision
- ⚡ Speed Boost — faster movement for 4 seconds
- ✨ Immunity — invulnerability for 4 seconds
- 🏆 Score Multiplier — 2× points for 5 seconds

**Themes:**
- Classic: Green on white
- Midnight: Cyan on dark blue
- Desert: Bronze on warm sand
- Ocean: Teal on light blue

**Privacy:**
Hiss-Tastic is local-first. Local scores, settings, and gameplay stats stay on your device. If you choose to save or view cloud scores, the app uses Supabase to submit or read anonymous leaderboard entries containing score, difficulty, snake length, and power-up count. No accounts, ads, tracking, analytics, location, contacts, device identifiers, or advertising IDs are collected.

## What's New (v1.0.0)
- 3 new power-ups: Speed Boost, Shield, Score Multiplier
- 4 visual themes with in-game selector
- Gameplay stats tracking
- Performance optimizations for low-end devices
- Portrait mode support
- Haptic feedback on mobile
- Play Store ready Android App Bundle build targeting Android API 36
- Optional anonymous cloud leaderboard disclosure and release documentation

## Data Safety Notes

- **Data collected:** Optional leaderboard game data only when a player saves a cloud score: anonymous player label, score, difficulty, snake length, and power-ups collected.
- **Data shared:** Cloud leaderboard entries are sent to Supabase for public leaderboard display.
- **Personal data:** No name, email, account, location, contacts, photos, files, advertising ID, or device identifier is collected by the app.
- **Security practices:** Data is transmitted over HTTPS to Supabase. No user account or deletion request flow is available because leaderboard entries are anonymous.
- **Ads/analytics:** No ads, analytics SDK, telemetry, or crash reporting SDK.
- **Permissions:** Android declares `INTERNET` only, required for optional cloud scores and user-opened external links.

## Category
Games > Arcade

## Tags
snake, arcade, retro, classic, offline, no-ads

## Content Rating
Everyone

## Screenshots Needed

### Phone screenshots (6-8 required):
1. **Home screen** — Logo + PLAY button + difficulty selector
   - Taken: /tmp/hiss-tastic-home.png
2. **Gameplay** — Snake mid-game with food and obstacles visible
3. **Power-up active** — Snake with power-up indicator (e.g., "x2 SCORE")
4. **Game over** — Score + roast message + buttons
   - Taken: /tmp/hiss-tastic-gameover.png
5. **Settings** — Theme selector with a non-Classic theme active
   - Taken: /tmp/hiss-tastic-settings.png
6. **Midnight theme gameplay** — Same as #2 but with Midnight theme

### Feature graphic (1024x500):
A banner with the Hiss-Tastic logo and snake artwork on a green background.
