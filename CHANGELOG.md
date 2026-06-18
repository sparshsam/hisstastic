# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) for releases.

## [1.0.0] - 2026-06-18

### Added

- First-run player profile setup with local anonymous player ID, username validation, and whimsical random username generation.
- Local-only score history for every completed game.
- Personal-best tracking with global leaderboard sync only when the player beats their previous best.
- Offline pending leaderboard sync for the latest unsynced personal best.
- Supabase migration for `players` and `leaderboard_scores`; no Supabase `score_history` table is created.
- Play Store production release preparation with tracked Capacitor Android project.
- Release AAB build script (`npm run cap:bundle:release`) and Android release signing configuration using local, gitignored keystore files.
- `RELEASE_PLAYSTORE.md` with internal testing, closed testing, production rollout, rollback, signing, and AAB upload steps.
- `PLAY_STORE_ASSETS.md` checklist for icon, 1024x500 feature graphic, and 6-8 phone screenshots.
- CI Android job that syncs Capacitor and builds both debug APK and release AAB.

### Changed

- Global leaderboard now stores one best-score row per anonymous player instead of every score submission.
- Settings now includes username/profile editing.
- Scores UI now separates local score history from the global leaderboard and shows personal best/rank context.
- Privacy, store listing, and release docs now disclose username, anonymous player ID, personal-best leaderboard data, and local-only score history.
- Normalized app version metadata to v1.0.0 across package metadata, web UI, web manifest, README, changelog, store listing, and Android `versionName`.
- Documented Android API 35+ readiness; the project compiles and targets SDK 36.
- Updated privacy policy, README, store listing, and Data Safety notes to accurately disclose optional anonymous Supabase cloud leaderboard behavior.
- Updated Android repository policy so generated source files are committed while local Gradle output, signing files, and keystores remain ignored.

### Verified

- Android manifest declares only the `INTERNET` permission, required for global leaderboard requests and user-opened external links.

## [0.5.0] - 2026-06-05

### Added

- **Local Runtime & Deployment Independence.** Hiss-Tastic can now be fully developed,
  tested, and played locally without any reliance on Vercel or external services.
- **Graceful audio/asset degradation.** Background music detects load failures and
  disables itself gracefully. The game never crashes on missing audio files.
- **Local dev health check.** `scripts/check-local.sh` verifies all Python runtime,
  browser runtime, game assets, and documentation files in one command.
- **Dev server script.** `scripts/serve.sh` starts the built-in Python HTTP server
  on any port with a single command.

### Changed

- **Service worker rewritten (v2).** Now uses `Promise.allSettled` for per-asset
  caching — a single missing asset can't block the entire install. Assets list
  includes `assets/background-music.mp3`. Cache name bumped to `hiss-tastic-v2`.
- **Service worker guarded on localhost.** App.js skips SW registration on plain
  HTTP localhost to prevent stale-cache confusion during development. SW still
  activates on HTTPS (PWA/Vercel deployments).
- **BackgroundMusic class hardened.** Handles audio file load errors via
  `canplaythrough` / `error` events. Toggle is a no-op when the audio file is
  unavailable. Constructor wrapped in try/catch for environments without audio
  support.
- **README rewritten** with comprehensive Local Development section:
  Python runtime setup, browser runtime setup, three server options, testing guide,
  asset verification table, and troubleshooting for common local issues.
- **Web runtime removed from Vercel deployment dependency.** All testing and
  development paths documented for fully offline/local workflows.

### Added (completed from #15)

- **Looping background music** with 🎵 Music On/Off toggle, low default volume (0.15),
  localStorage persistence (`hissTasticBgMusic` key), and YouTube credit link.
- **Music credit link** in game footer: "Music credit" → YouTube source.
- **Service worker caches background music** for offline playback.

### Preserved

- Python runtime unchanged (canonical).
- All gameplay, scoring, collision, power-up, replay, ghost, commentary, snake field,
  and PWA mechanics unchanged.
- No telemetry, no accounts, no external backend, no wallet/onchain logic, no multiplayer.
- All v0.4.9 functionality confirmed operational.
- Background music work from #15 merged and included.

### Added

- **6 companion snakes join the main serpent.** Total of 7 snakes now roam the background. Main snake stays large (1920px body, full detail). Companions are 50–65% scale, 300–960px body, in varied colors (teal, olive, copper, brown, dark green). Companions spawn at random positions across the viewport.

### Changed

- **Smoother tail taper.** Replaced sharp linear tail drop (`return 0.5 - (t-0.8)*2.0`) with a quadratic eased taper. The tail now narrows gradually from 75% body width at t=0.75 to ~9% at the tip, creating a more natural serpentine finish.
- **Refactored SnakeField** to support multiple snakes — `this.snakes` array replaces `this.snake`.

### Preserved

- Same procedural polygon rendering, head, eyes, tongue, wave model.
- Main snake unchanged (size, speed, wave params, wander behavior).
- All gameplay, commentary, PWA unchanged. No telemetry/API/backend/AI/wallet/multiplayer.

## [0.4.8] - 2026-06-05

### Changed

- **Snake body length increased 4×:** 240 spine samples × 8px spacing = 1920px body (was 300px). The serpent now spans the full viewport with long flowing S-curves.
- **Slower, more elegant motion:** speed reduced to 0.4–0.6 (was 0.25–0.4), gentler turn speed, longer wander intervals for sweeping cinematic gliding.
- **Longer, smoother waves:** wave frequency lowered to 0.01–0.03 (was 0.03–0.07) for longer undulation cycles. Wave amplitude increased to 20–35px (was 10–18px) for more dramatic curves.
- **Path history dramatically increased:** 4000 entries (was 160) to support the full 1920px body sampling.
- **Mobile scaling:** 140 spine samples (still ~1120px dramatic serpent).

### Preserved

- Same procedural polygon rendering (filled silhouette + outline + highlight).
- Same head, eye, and tongue design.
- Same smooth slither wave model.
- All gameplay, commentary, PWA unchanged. No telemetry/API/backend/AI/wallet/multiplayer.

## [0.4.7] - 2026-06-05

### Changed

- **Replaced stroked-line snake with procedural filled-polygon silhouette.** Complete rewrite of `ProceduralSnake` class. The snake body is now built as a closed polygon from left/right edge points along a 100-point spine, creating a clean continuous filled shape.
- **Natural body width profile:** head 10–12px (wedge-shaped), neck 9–12px, mid-body 14–18px (widest), rear body gentle taper, tail sharp taper to 1.5–3px. Uses a `bodyRadius(t)` profile function with distinct anatomical regions.
- **Proper head design:** triangular/wedge tip extending forward from the spine, not a circular pickle blob. Eyes placed on the head with correct orientation. Seamlessly attached to the body polygon.
- **Tail twist eliminated:** wave amplitude fades to zero in the final 15% of the body. Last 3 spine points smoothed by averaging with neighbors. Tail follows the spine tangent cleanly.
- **Longer body:** 100 spine samples × 5px = 500px body length (was 300px). Path history increased to 160 entries.
- **Clean rendering:** filled polygon fill + subtle dark outline stroke + top highlight ridge. No more three-stroke line rendering — real snake silhouette.
- **Mobile scaling:** 0.7× size, 70 spine samples, 0.65× wave amplitude.

### Fixed

- No longer looks like a pickle head with a thin twisted tail.
- Body is a continuous elegant silhouette with proper proportions.
- Head is proportionate (not a giant circle).
- Tail tapers cleanly without kinks or twists.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary and game-over roasts unchanged.
- Reduced-motion support preserved (static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.

## [0.4.6] - 2026-06-05

### Changed

- **Full-body serpentine wave added to single snake.** Replaced straight path-sampling with sine-wave lateral offset that travels the entire body length. Amplitude peaks at mid-body (sinusoidal envelope), zero at head and tail for natural S-curve slithering.
- **Snake size increased:** head radius 10–14px (was 9–12), body thickness 12–18px (was 6–9). Tail minimum thickness raised from 8% to 15% — visible ~2–3px at tip (was <1px invisible needle).
- **Three-stroke rendering:** shadow stroke (wider, faint), main body stroke, and highlight stroke (thin, offset) for depth and visual weight.
- **Path history increased** to 140 entries (was 75) with angle tracking. Each path point stores `{x, y, angle}` for accurate normal computation during wave offset.
- **Body wave parameters randomized:** wave speed 0.015–0.04, frequency 0.04–0.1, amplitude 8–18px.

### Fixed

- No longer looks like a straight needle with a head. Full body now has visible S-curves that travel from head to tail.
- Body is thick for most of its length — no 1px invisible tail.
- Wave travels continuously through the body even when the head moves in a straight line.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary and game-over roasts unchanged.
- Reduced-motion support preserved (static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.

## [0.4.5] - 2026-06-05

### Changed

- **Reset to single-snake prototype.** Stripped out all multi-snake density logic and replaced with ONE large `PrototypeSnake` using path-following body model. The snake has a 330px body sampled from a path history array, producing smooth continuous curves with natural tapering.
- **Path-following body model (not segment-chasing).** Head position is recorded in a path history array each frame. Body segments sample positions at increasing distances along this path. This produces cleaner, more natural slithering than the previous segment-chasing approach.
- **Large single snake:** head radius 9–12px, body thickness 6–9px, 55 segments = 330px body length. Speed 0.35–0.65, smooth wander steering with exclusion-zone avoidance.
- **Debug mode:** set `window.HISS_DEBUG_SNAKE = true` before page load for head marker, segment index markers, and path visualization.
- **Mobile scaling:** single snake scales down on mobile (0.7× size, 35 segments).

### Removed

- All multi-snake density logic (three-tier system, AmbientSnake class, segment-chasing following).
- Swarm/confetti/worm artifacts completely eliminated — one snake only.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary and game-over roasts unchanged.
- Reduced-motion support preserved (static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.4.4] - 2026-06-05

### Fixed

- **Snakes now move head-first.** Fixed critical directionality bug: head position `(this.x, this.y)` was not being drawn — head features (eyes, tongue) were placed on the tail segment instead. Now the head is drawn as a separate circle at the actual head position, with eyes and tongue facing `this.angle` (the movement direction). Body taper goes from thick (near head) to thin (tail).
- **Snakes now free-roam instead of looping in place.** Replaced repetitive sine-wave oscillation with a smooth random wander steering model. Snakes periodically pick new wander targets, steer smoothly toward them, and naturally roam the viewport. Fixed stuck detection with automatic respawn.
- **Massively increased snake density.** Three-tier system: large (15–30 segs, full detail), medium (12–20 segs, eyes), tiny (8–14 segs, minimal). Desktop: 60–120 snakes (was 10–18). Large desktop: 100–180. Tablet: 35–70. Mobile: 18–35.
- **Tiny snake sizes increased.** Head radius 3.5–5px (was 3–4px), body radius 2.5–3.5px (was 2–2.8px) for better visibility.
- **Movement personalities added:** cruisers (slow turns), wanderers (medium), darters (fast), gliders (smooth long arcs).
- **Exclusion-zone avoidance improved:** smoother steering, stronger influence when very close to the game panel.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary and game-over roasts unchanged.
- Reduced-motion support preserved (15% count multiplier, static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.4.3] - 2026-06-05

### Changed

- **Replaced static border snakes with smooth Snake.io-style segmented locomotion.** Complete rewrite of `web/js/snakeField.js` with `AmbientSnake` class using head-forward segmented-following movement. Each snake now has a head that moves with smooth steering, and 12–30 body segments that follow via distance-constraint physics, creating living gliding motion.
- **Larger, more visible snakes:** head radius 5–9px, body radius 3–6px, drawn as overlapping filled circles for smooth capsule bodies. Previously snakes were tiny decorative marks.
- **Rich visual details:** eyes on every head, optional accent stripe patterns (every 3rd or 4th segment), optional red forked tongue flicks, subtle shadow beneath each segment for depth.
- **Autonomous edge roaming:** snakes spawn in border zones, roam with sinusoidal steering + random bias, and smoothly steer away from the central game panel exclusion zone.
- **Soft edge handling:** snakes are gently pushed away from viewport boundaries with hard wrap only as off-screen teleport fallback.

### Fixed

- Snakes no longer look like static decorative marks.
- Snakes now exhibit living, gliding motion with visible segmented bodies.
- Movement resembles Snake.io/Slither.io-style smooth segmented locomotion.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary and game-over roasts unchanged.
- Reduced-motion support preserved (40% count reduction, static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.4.2] - 2026-06-05

### Changed

- **Replaced full-screen snake swarm with curated snake border system.** Removed the FieldSnake swarm and replaced it with a BorderSnake frame that renders 12–24 (desktop) decorative snakes along the perimeter edges and corners of the viewport.

### Fixed

- No longer looks like broken display artifacts, worm trails, or confetti across the entire screen. The old full-screen swarm was removed entirely.
- Snakes now have clear snake-like visual identity: thick bodies (4–9px), tapered tails, distinct rounded heads with eyes, optional banded patterns, and periodic tongue flicks.
- Motion is now slow, periodic, and localized — snakes undulate along short local paths rather than traversing the entire screen.
- Central UI area remains pristine with calculated safe zone that excludes game panel, controls, dpad, and commentary box.

### Removed

- Full-screen FieldSnake swarm (hundreds of tiny snakes across entire viewport). Replaced with curated border system.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Reduced-motion support preserved (50% count reduction, static rendering).
- Tab-visibility pause preserved.
- Commentary and game-over roasts unchanged.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.4.1] - 2026-06-05

### Changed

- **Rewrote snake field locomotion:** Replaced drifting-line behavior with proper head-forward body-following snake movement. Each snake now has a heading angle, sinusoidal lateral undulation for natural slithering, and a trail-based body that follows the head's path.
- **Enhanced snake visual identity:** Snakes now have distinct rounded heads with highlights and tiny eyes, tapered bodies drawn from tail to head, stronger opacity (0.35–0.70, up from 0.15–0.55), and a richer 47-color snake-like palette (greens, olives, browns, coppers, teals).
- **Exclusion zone steering:** Snakes are spawned outside the central UI area and gently steered away from the game panel, controls, and commentary box.
- **Increased density:** Desktop 120–220 (was 100–180), tablet 70–120 (was 60–100), mobile 35–70 (was 25–50).
- **Natural path curvature:** Each snake has a persistent turn bias so it curves naturally rather than drifting in straight lines.

### Fixed

- Snakes no longer look like floating ribbons or faint drifting lines.
- Body now visibly follows the head's path — viewers immediately recognize them as tiny snakes.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Reduced-motion support preserved (88% count reduction, static rendering).
- Tab-visibility pause preserved.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.4.0] - 2026-06-05

### Added

- **Decorative snake field background:** Animated snakes crawl around the game panel using a separate fixed canvas layer. Snakes vary by color, length, thickness, speed, wave amplitude, and direction. Performance-aware with mobile/tablet/desktop count tiers.
- **Live snake-fact roast commentary:** Contextual educational snake facts paired with playful roasts triggered by gameplay events (wall collision, missed food, rapid direction changes, long survival, etc.). Local-only static dataset — no AI, API, or telemetry.
- **Game-over snake-fact roasts:** Game-over screen now displays contextual snake-fact roasts derived from player behavior. Legacy insult messages preserved as fallback.
- **Commentary UI:** Subtle fade-in/fade-out commentary box below the game panel. `aria-live="polite"` for accessibility.
- **Reduced-motion support:** Snake field respects `prefers-reduced-motion` media query. At reduced setting, snakes appear as static decorative elements or very slow movement.
- **Tab-visibility optimization:** Snake field animation pauses when the browser tab is hidden.
- **Snake facts data module:** `web/js/snakeFacts.js` — 25+ fact/roast entries with tags, severity levels, and legacy insult fallbacks.
- **Commentary engine:** `web/js/commentary.js` — event-driven engine with rate limiting, cooldown, deduplication, seeded RNG, and gameplay stat tracking.
- **Snake field renderer:** `web/js/snakeField.js` — 300-line Canvas 2D renderer with tapering, waving, and looping snake animations. Performance-tuned with requestAnimationFrame.
- **Documentation:** `docs/snake-field.md`, `docs/live-commentary.md`.

### Preserved

- All existing gameplay, scoring, collision, power-up, and replay mechanics unchanged.
- Commentary does not alter score, movement, collision, replay inputs, or game state.
- Legacy insult messages preserved as `LEGACY_INSULTS` in `snakeFacts.js`.
- No telemetry, no external APIs, no AI/LLM calls, no backend, no wallet/onchain logic, no multiplayer added.
- Python runtime remains canonical and unaffected.

## [0.3.0] - 2026-06-04

### Added

- **Browser runtime:** JavaScript/Canvas implementation under `web/`.
- **Mobile controls:** touch/swipe gestures and directional-pad overlay.
- **PWA installability:** `manifest.webmanifest`, service worker, offline cache behavior, and app icons.
- **Browser replay import/export:** local JSON file picker, drag-and-drop, validation, and metadata display.
- **Browser procedural audio:** Web Audio API sound effects.
- Browser documentation: `docs/browser-runtime.md`, `docs/pwa.md`, `docs/mobile-controls.md`.

### Preserved

- Python runtime remains canonical and functional.
- Existing Python replay and ghost replay foundations remain local-first.
- No networking, telemetry, accounts, external backend, wallet/onchain logic, or multiplayer added.

## [0.2.1] - 2026-06-04

### Added

- Added stricter replay schema validation, compatibility checks, and clearer replay validation errors.
- Added replay metadata for local-only deterministic recordings.
- Added optional replay frame snapshots for future ghost visualization.
- Added local-only ghost replay loading, sanity validation, tick synchronization, and renderer hooks.
- Added replay and ghost validation coverage through `validation.py` and `tests/test_replay_validation.py`.
- Added replay UX, ghost racing, and git safety documentation.

### Changed

- Updated architecture, privacy, maintenance, contribution, release, and agent documentation for replay/ghost foundations.
- Updated replay CLI output with ghost frame counts and `ghost-check`.

### Security

- Documented git safety policy and force-push restrictions.
- Confirmed ghost racing adds no networking, telemetry, wallet/onchain logic, or multiplayer.

## [0.2.0] - 2026-06-04

### Added

- **Phase 1 - Stabilize:** Runtime pip auto-install removed; game fails gracefully with clear message if pygame is missing.
- **Phase 1 - Stabilize:** Recursive `gameLoop()` replaced with explicit state-machine.
- **Phase 1 - Stabilize:** Centralized `CONFIG` dict for game constants.
- **Phase 1 - Stabilize:** Safer asset loading with fallback placeholder surfaces.
- **Phase 1 - Stabilize:** Spawn safety helpers prevent entity overlap.
- **Phase 1 - Stabilize:** `validation.py` smoke-test script.
- **Phase 2 - Modularize:** Full package structure under `hiss_tastic/`.
- **Phase 2 - Modularize:** `main.py` entry point.
- **Phase 3 - Replay:** Deterministic replay infrastructure with seeded RNG.
- **Phase 3 - Replay:** Replay CLI with `record`, `play`, and `verify` commands.
- **Phase 4 - Polish:** Title screen, pause/resume, procedural audio, mute toggle, and difficulty presets.
- **Phase 5 - Packaging:** CI workflow, packaging docs, release checklist, and expanded ignore rules.

### Changed

- Entry point moved from `hiss_tastic.py` to `main.py`.
- Architecture modularized into the `hiss_tastic/` package.

### Preserved

- Original gameplay mechanics, movement, collisions, power-ups, obstacles, scoring messages, and watermark.
- Original `hiss_tastic.py` retained as legacy reference.
- Local-first privacy posture.

## [0.1.1] - 2026-06-04

### Added

- Added `AGENTS.md` to document AI-agent boundaries for preservation and modernization work.
- Added repository standards documentation, including security, contribution, conduct, architecture, and versioning notes.
- Added ecosystem metadata and maturity classification for the preserved legacy prototype.
- Added environment-file guardrails for future modernization work.

### Changed

- Polished README structure to match ecosystem documentation standards.

## [0.1.0] - 2026-06-04

### Added

- Imported original Hiss-Tastic Python/Pygame prototype.
- Preserved core game loop, assets, scoring, obstacles, and power-up mechanics.
- Removed bundled Python installers from version control plan.
