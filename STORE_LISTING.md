# HissTastic — Play Store Listing

## App Title
HissTastic

## Short Description (80 char max)
A retro Snake-inspired arcade game. Collect, dodge, and survive in style.

## Full Description
HissTastic is a modern take on the classic Snake arcade game — rebuilt for mobile with touch controls, power-ups, themes, and zero ads or tracking.

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
- First-run username setup with whimsical random name option
- Global leaderboard for each player's personal best
- Local-only score history
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
HissTastic is local-first. Score history, settings, and gameplay stats stay on your device. The global leaderboard stores your chosen username, an anonymous player ID, and your best score only. No real-name account is required. No email, phone number, real name, location, contacts, advertising ID, analytics, tracking, or ads are collected.

## What's New (v1.0.0)
- 3 new power-ups: Speed Boost, Shield, Score Multiplier
- 4 visual themes with in-game selector
- Gameplay stats tracking
- Performance optimizations for low-end devices
- Portrait mode support
- Haptic feedback on mobile
- Play Store ready Android App Bundle build targeting Android API 36
- First-run username setup and personal-best global leaderboard
- Local-only score history with offline pending leaderboard sync

## Data Safety Notes

- **Data collected:** App activity/gameplay leaderboard data: chosen username, anonymous player ID, and personal best score.
- **Data shared:** Global leaderboard entries are sent to Supabase for public leaderboard display.
- **Local-only data:** Full score history, settings, and gameplay stats stay on device.
- **Personal data:** No email, phone, real name, account, location, contacts, photos, files, advertising ID, or device identifier is collected by the app.
- **Security practices:** Data is transmitted over HTTPS to Supabase. No real-name account is required because leaderboard identity is anonymous.
- **Ads/analytics:** No ads, analytics SDK, telemetry, or crash reporting SDK.
- **Permissions:** Android declares `INTERNET` only, required for global leaderboard requests and user-opened external links.

## Category
Games > Arcade

## Tags
snake, arcade, retro, classic, offline, no-ads

## Content Rating
Everyone

## Screenshots Needed

### Phone screenshots (6-8 required):
1. **Home screen** — Logo + PLAY button + difficulty selector
   - Taken: /tmp/hisstastic-home.png
2. **Gameplay** — Snake mid-game with food and obstacles visible
3. **Power-up active** — Snake with power-up indicator (e.g., "x2 SCORE")
4. **Game over** — Score + roast message + buttons
   - Taken: /tmp/hisstastic-gameover.png
5. **Settings** — Theme selector with a non-Classic theme active
   - Taken: /tmp/hisstastic-settings.png
6. **Midnight theme gameplay** — Same as #2 but with Midnight theme

### Feature graphic (1024x500):
A banner with the HissTastic logo and snake artwork on a green background.
