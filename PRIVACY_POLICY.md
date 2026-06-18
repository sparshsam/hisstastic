# Privacy Policy

**Last updated:** June 18, 2026

Hiss-Tastic does not collect, store, or transmit personal data. Normal gameplay is local-first. Optional cloud leaderboard features transmit anonymous gameplay score data when you save or view cloud scores.

## Data Collection

Hiss-Tastic is a local-first application. It operates on your device for normal play, settings, stats, local scores, replay files, and PWA offline caching.

### What we DON'T collect:
- No personal information
- No account credentials
- No location data
- No device identifiers
- No usage analytics or telemetry
- No crash reports
- No advertising identifiers
- No cookies

### What is stored locally (on your device only):
- **Local high scores:** Saved to your browser's localStorage or device app storage. Never transmitted unless you choose the cloud score save flow.
- **Gameplay stats:** Games played, food eaten, average score. Stored locally. Never transmitted.
- **Theme preference:** Your selected color theme. Stored locally. Never transmitted.
- **Music preference:** Whether background music is enabled. Stored locally. Never transmitted.

## Optional Cloud Leaderboard

If you save a cloud score or view cloud scores, Hiss-Tastic uses Supabase REST APIs for the leaderboard.

Cloud score submissions include:
- Anonymous player label (`anonymous` unless the app later adds an explicit name field)
- Score
- Difficulty
- Snake length
- Power-ups collected

Cloud score reads fetch public leaderboard rows from Supabase. No account, authentication, email address, device identifier, advertising ID, or location data is sent by the app.

## Network Access

Hiss-Tastic makes network requests only for:
1. Loading the game files from its host (Vercel or local server)
2. Optional Supabase leaderboard save/read requests
3. User-initiated external links, such as the background music credit or GitHub feedback link

## Third-Party Services

Hiss-Tastic uses Supabase only for optional anonymous cloud leaderboard storage and retrieval. It uses no third-party analytics, advertising, crash reporting, or tracking services.

## Google Play Data Safety Summary

- Data collected: optional app activity/gameplay score data for cloud leaderboard entries.
- Data shared: optional public leaderboard entries are transmitted to Supabase.
- Data purpose: app functionality only.
- Personal info, location, financial info, contacts, photos/videos, files, health, messages, identifiers: not collected.
- Ads, analytics, telemetry, crash reporting SDKs: not used.
- Android permissions: `INTERNET` only.

## Changes

If this policy changes, the updated date at the top will be revised. The policy will never be retroactively changed to permit data collection without your explicit consent.

## Contact

For questions about this privacy policy, open an issue at:
https://github.com/sparshsam/hiss-tastic/issues
