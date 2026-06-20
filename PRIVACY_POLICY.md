# Privacy Policy

**Last updated:** June 18, 2026

HissTastic does not collect, store, or transmit personal contact or account data. Normal gameplay is local-first. The global leaderboard transmits a chosen username, locally generated anonymous player ID, and personal-best score.

## Data Collection

HissTastic is a local-first application. It operates on your device for normal play, settings, stats, score history, replay files, and PWA offline caching.

### What we DON'T collect:
- No email address, phone number, or real name
- No account credentials
- No location data
- No device identifiers
- No usage analytics or telemetry
- No crash reports
- No advertising identifiers
- No cookies

### What is stored locally (on your device only):
- **Anonymous player ID:** A locally generated UUID used only to identify your leaderboard row.
- **Username:** Chosen by you or generated locally. It may appear publicly on the global leaderboard.
- **Local score history:** Saved to browser localStorage or device app storage. Never transmitted.
- **Personal best:** Stored locally and synced to the global leaderboard only when it improves.
- **Gameplay stats:** Games played, food eaten, average score. Stored locally. Never transmitted.
- **Theme preference:** Your selected color theme. Stored locally. Never transmitted.
- **Music preference:** Whether background music is enabled. Stored locally. Never transmitted.

## Optional Cloud Leaderboard

HissTastic uses Supabase REST APIs for the global leaderboard.

Global leaderboard submissions include:
- Anonymous player ID
- Username
- Personal best score

Global leaderboard reads fetch public leaderboard rows from Supabase. No account, authentication, email address, device identifier, advertising ID, phone number, real name, contact list, or location data is sent by the app. Score history remains local-only.

## Network Access

HissTastic makes network requests only for:
1. Loading the game files from its host (Vercel or local server)
2. Supabase leaderboard profile/best-score save and read requests
3. User-initiated external links, such as the background music credit or GitHub feedback link

## Third-Party Services

HissTastic uses Supabase only for anonymous leaderboard profile and personal-best storage/retrieval. It uses no third-party analytics, advertising, crash reporting, or tracking services.

## Google Play Data Safety Summary

- Data collected: app activity/gameplay leaderboard data: username, anonymous player ID, and personal best score.
- Data shared: public leaderboard entries are transmitted to Supabase.
- Data purpose: app functionality only.
- Local-only: full score history, settings, and gameplay stats.
- Personal contact/account info, location, financial info, contacts, photos/videos, files, health, messages, device identifiers, advertising ID: not collected.
- Ads, analytics, telemetry, crash reporting SDKs: not used.
- Android permissions: `INTERNET` only.

## Changes

If this policy changes, the updated date at the top will be revised. The policy will never be retroactively changed to permit data collection without your explicit consent.

## Contact

For questions about this privacy policy, open an issue at:
https://github.com/sparshsam/hisstastic/issues
