# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project follows [Semantic Versioning](https://semver.org/) for releases.

## [0.3.0] — 2026-06-04

### Added

- **Browser runtime** (`web/`) — JavaScript/Canvas reimplementation of Hiss-Tastic.
- **Mobile controls** — touch/swipe gestures and 4-button directional pad overlay.
- **PWA installability** — manifest.webmanifest, service worker with offline caching, app icons.
- **Replay import/export** in browser — file picker, drag-and-drop, JSON validation, metadata display.
- **Procedural audio** using Web Audio API (eat, power-up, game-over sounds).
- Responsive canvas scaling for mobile and desktop viewports.
- Documentation: `docs/browser-runtime.md`, `docs/pwa.md`, `docs/mobile-controls.md`.

### Changed

- README updated with browser runtime setup, PWA, and mobile controls documentation.

### Preserved

- Python runtime untouched and fully functional (`python main.py` still works).
- All existing features, replay format, and gameplay intact.
- No networking, telemetry, accounts, or multiplayer added.

## [0.2.0] — 2026-06-04

### Added

- **Phase 1 — Stabilize:** Runtime pip auto-install removed; game fails gracefully with clear message if pygame is missing.
- **Phase 1 — Stabilize:** Recursive `gameLoop()` replaced with explicit state-machine (outer reset loop, no stack growth).
- **Phase 1 — Stabilize:** Centralized `CONFIG` dict for all game constants (colors, window, grid, gameplay timing, fonts).
- **Phase 1 — Stabilize:** Safer asset loading via `load_asset()` helper with fallback magenta placeholder surfaces.
- **Phase 1 — Stabilize:** Spawn safety helpers (`safe_food_position`, `safe_power_up_position`, `generate_obstacles`) prevent entity overlap.
- **Phase 1 — Stabilize:** `validation.py` smoke-test script for syntax, imports, assets, and requirements checks.
- **Phase 2 — Modularize:** Full package structure (`hiss_tastic/`) with 12 modules: config, entities, assets, scoring, spawns, rendering, input, replay, audio, game, states, __init__.
- **Phase 2 — Modularize:** `main.py` entry point (`python main.py` to launch).
- **Phase 3 — Replay:** Deterministic replay infrastructure with seeded RNG.
- **Phase 3 — Replay:** `ReplayRecorder` for tick-by-tick input recording.
- **Phase 3 — Replay:** `ReplayPlayer` for replay loading and playback.
- **Phase 3 — Replay:** `replay_cli.py` with `record`, `play`, `verify` commands.
- **Phase 3 — Replay:** JSON replay format with versioning (`replay/v1`).
- **Phase 4 — Polish:** Title screen with difficulty selection (1=Easy, 2=Normal, 3=Hard).
- **Phase 4 — Polish:** Pause/resume (P or ESC key).
- **Phase 4 — Polish:** Polished game-over screen with all legacy insult messages preserved.
- **Phase 4 — Polish:** Procedural audio system (eat, power-up, game-over sounds) with mute toggle (M key).
- **Phase 4 — Polish:** Configurable difficulty presets (easy/normal/hard).
- **Phase 5 — Packaging:** GitHub Actions CI workflow (syntax checks, import validation).
- **Phase 5 — Packaging:** `docs/packaging.md` with PyInstaller instructions.
- **Phase 5 — Packaging:** `RELEASE_CHECKLIST.md` for release process.
- **Phase 5 — Packaging:** `.gitattributes` and updated `.gitignore` (replays, build artifacts).

### Changed

- Entry point moved from `hiss_tastic.py` to `main.py`.
- Architecture fully modularized into `hiss_tastic/` package.
- `.gitignore` expanded for replays, build artifacts, IDE files.
- Documentation updated: README, ARCHITECTURE, CHANGELOG, docs/modernization-roadmap.

### Preserved

- All original gameplay mechanics, movement, collisions, power-ups, obstacles.
- All legacy GPT-era scoring insult messages (`get_mean_message`).
- "by SPARSH" watermark.
- Original `hiss_tastic.py` kept as legacy reference (no longer primary entry point).
- Local-first privacy posture — no networking, no telemetry, no accounts.

## [0.1.1] — 2026-06-04

### Added

- Added `AGENTS.md` to document AI-agent boundaries for preservation and modernization work.
- Added repository standards documentation, including security, contribution, conduct, architecture, and versioning notes.
- Added ecosystem metadata and maturity classification for the preserved legacy prototype.
- Added environment-file guardrails for future modernization work.

### Changed

- Polished README structure to match ecosystem documentation standards.

## [0.1.0] — 2026-06-04

### Added

- Imported original Hiss-Tastic Python/Pygame prototype.
- Preserved core game loop, assets, scoring, obstacles, and power-up mechanics.
- Removed bundled Python installers from version control plan.
