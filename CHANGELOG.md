# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) for releases.

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
