# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) for releases.

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
