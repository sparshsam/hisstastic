# Hiss-Tastic

A retro Snake-inspired arcade game built with a browser/JavaScript runtime (with a preserved Python/Pygame reference implementation).
Fully local-first — no accounts, telemetry, or backend required.

[![License](https://img.shields.io/github/license/sparshsam/hiss-tastic?style=flat-square)](LICENSE)
[![Status: Maintained](https://img.shields.io/badge/status-maintained-2ea44f?style=flat-square)](#status)
[![CI](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml/badge.svg)](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml)

## Status

**Production-ready arcade game (v0.9.0).** Playable in any modern browser, installable as a PWA, and packaged as a native Android app via Capacitor.

The browser runtime under `web/` is the primary runtime. The Python/Pygame version is preserved as a canonical reference implementation.

## Features

- Snake movement with grid-based alignment (portrait and landscape)
- Rodent collection with quadratic scoring
- Obstacles with collision detection
- **4 power-up types:** Immunity, Speed Boost, Shield, Score Multiplier
  - Each with unique color, audio cue, and game effect
- **4 visual themes:** Classic (green), Midnight (dark), Desert (warm), Ocean (teal)
- Title screen with difficulty selection (Easy / Normal / Hard)
- Pause/resume with on-screen pause button
- Procedural audio with sound effects
- Looping background music with toggle and credit link
- Haptic feedback on mobile (vibration)
- Deterministic replay recording, playback, and verification
- **Cloud high scores** via Supabase (shared Elora database)
- Top 10 leaderboard with local/cloud toggle
- Gameplay stats tracking (games played, food, averages)
- Portrait and landscape game modes (360×560 portrait grid)
- Responsive canvas with DPR support (crisp on high-DPI screens)
- PWA installability and offline cache behavior
- Capacitor Android APK (6.6MB, signed)
- Graceful degradation: game never crashes on missing audio or assets
- Animated decorative snake field background (canvas-based)
- Fully local-first: no accounts, telemetry, external APIs, or multiplayer

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full module structure and data flow.

```
hiss_tastic/       # Python/Pygame package (canonical)
  main.py           — Entry point
  game.py           — Game class, state machine
  config.py         — CONFIG dict, difficulty presets
  entities.py       — Snake, Food, Obstacle, PowerUp
  audio.py          — Procedural sound effects with graceful fallback
  assets.py         — Asset loading with placeholder fallbacks
  input.py          — Event-to-action mapping
  rendering.py      — All Pygame draw functions
  scoring.py        — Quadratic scoring and legacy messages
  spawns.py         — Safe grid-aligned entity placement
  states.py         — Game state constants
  replay.py         — Deterministic replay recording and validation
  replay_cli.py     — Command-line replay tools
  ghost.py          — Local ghost replay sync and visualization

web/               # Browser/PWA runtime (primary)
  index.html
  js/               — Game engine, audio, renderer, input, replay, supabase, snake field, snake facts
  css/style.css
  assets/           — Background music, images
  sw.js             — Service worker (offline caching)
  manifest.webmanifest
  supabase.js       — Cloud high scores REST client
```

---

## Local Development

Hiss-Tastic has two runtimes. **Neither requires Vercel, a backend, or any external service.**

### Prerequisites

- **Python 3.9+** ([python.org](https://python.org))
- **Git** ([git-scm.com](https://git-scm.com))
- **A modern browser** (Chrome, Firefox, Edge, Safari)
- **pygame** (for the Python runtime only)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/sparshsam/hiss-tastic.git
cd hiss-tastic

# Or use the dev server script
bash scripts/serve.sh
# Opens at http://localhost:8080 — the browser game, no build step required
```

---

### Python Runtime Setup

The Python/Pygame version is the canonical runtime.

```bash
# Create and activate a virtual environment
python -m venv .venv

# macOS / Linux:
source .venv/bin/activate

# Windows (PowerShell):
.venv\Scripts\activate

# Install pygame
pip install pygame

# Run the game
python main.py
```

**Legacy entry point** (preserved, unchanged):

```bash
python hiss_tastic.py
```

**Troubleshooting:**

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'pygame'` | Run `pip install pygame` |
| `pygame.error: video system not initialized` | Ensure you have a display (no `DISPLAY` in SSH) |
| `pygame.error: No available video device` | Install X server or use headless mode (see below) |

**Headless/WSL (no display):**

On WSL or headless servers, the Python runtime won't produce a window. This is expected.
Use the browser runtime instead — it's the primary local dev workflow.

---

### Browser Runtime Setup

The browser runtime is a zero-config static site. No build step, no framework, no Node.js required.

#### Option A: Quick Dev Server (Recommended)

```bash
bash scripts/serve.sh
# Opens at http://localhost:8080
```

Or with a custom port:

```bash
bash scripts/serve.sh 3000
# Opens at http://localhost:3000
```

#### Option B: Python HTTP Server (Manual)

```bash
python -m http.server 8080 --directory web/
# Opens at http://localhost:8080
```

#### Option C: Any Static Server

```bash
# Node (if installed)
npx serve web/ -p 8080

# PHP
php -S localhost:8080 -t web/
```

---

### Local Static / Production-Style Preview

To preview the game as it would appear in production, serve from the `web/` directory:

```bash
# Start server
python -m http.server 8080 --directory web/

# Open in a browser
open http://localhost:8080
```

**Important:** On plain HTTP `localhost`, the service worker is intentionally skipped to
avoid stale-cache confusion during local development. You can play and test everything on
localhost without issues — this is the recommended local workflow.

To test full PWA offline caching and service worker behavior, deploy to a secure context
(HTTPS) such as:

- Vercel preview deployment (`vercel --preview`)
- GitHub Pages
- Any HTTPS-enabled hosting
- A local HTTPS server (e.g. `mkcert` for a trusted local cert)

When deployed to HTTPS, the service worker caches all assets and the game remains
playable offline.

---

### Testing the Python Runtime

```bash
# Validation suite (checks assets, schema, imports, etc.)
python validation.py

# Unit tests
python -m unittest discover -v

# Replay system
python -m hiss_tastic.replay_cli record
python -m hiss_tastic.replay_cli verify replays/replay_*.json
python -m hiss_tastic.replay_cli play replays/replay_*.json
```

### Testing the Browser Runtime

```bash
# Local health check — verifies all files, assets, and dependencies
bash scripts/check-local.sh

# Start the server and open http://localhost:8080
bash scripts/serve.sh

# Manual smoke tests:
# 1. Game loads without JS console errors
# 2. Title screen displays with difficulty selection
# 3. Gameplay: snake moves, eats food, collides with obstacles
# 4. Sound effects play on eat/power-up/game-over
# 5. Background music toggle works (🎵 Music button)
# 6. Music credit link opens YouTube source
# 7. PWA manifest loads (check DevTools → Application → Manifest)
# 8. Service worker state (check DevTools → Application → Service Workers;
#    on localhost it won't register — expected. Verify on HTTPS/preview.)
# 9. Import/Export replay buttons work
# 10. Mobile D-pad controls respond on touch devices
```

---

### Verifying All Assets Load Locally

| Asset | Path | How to Verify |
|-------|------|---------------|
| **Browser HTML** | `web/index.html` | Load `http://localhost:8080` |
| **CSS** | `web/css/style.css` | DevTools → Network → style.css |
| **JS files** | `web/js/*.js` | DevTools → Sources → js/ |
| **Background music** | `web/assets/background-music.mp3` | Click 🎵 Music button; should play at low volume |
| **PWA manifest** | `web/manifest.webmanifest` | DevTools → Application → Manifest |
| **Service worker** | `web/sw.js` | DevTools → Application → Service Workers |
| **PWA icons** | `web/icons/icon-{192,512}.png` | DevTools → Application → Manifest |
| **Python assets** | `assets/snake.png, rodent.png, danger.png, power_up.png, icon.png` | `ls assets/` or `python validation.py` |

**Graceful degradation:** If the background music file is missing or fails to load, the
Music button becomes disabled and the game continues without crashing.

---

### Common Local Issues

#### "The service worker keeps serving old files!"

During development, the service worker caches aggressively. If you see stale content:

1. Open DevTools → Application → Service Workers
2. Click **"Unregister"**
3. Hard-reload (`Ctrl+Shift+R` or `Cmd+Shift+R`)

Or, run an incognito/private window where no service worker is registered.

#### "Background music doesn't play!"

- **Browser autoplay policy:** The music only starts after your first click/tap on the page.
  Click anywhere on the game first.
- **File not found:** Check that `web/assets/background-music.mp3` exists.
  If missing, the Music button will be disabled.
- **Volume too low:** Default volume is 0.15. Ensure your system volume is turned up.

#### "The Python game doesn't start / black screen on WSL"

WSL doesn't have a native display. The Python/Pygame runtime requires a window server.
Use the browser runtime instead (`bash scripts/serve.sh` then open in Windows browser).

#### "Page looks wrong / assets not loading"

Make sure you're accessing the game through an HTTP server, not by opening the HTML file directly
(`file:///` path). Browsers block many features (service workers, audio, fetch) on `file://` URLs.

```bash
# Correct:
python -m http.server 8080 --directory web/
# Then open http://localhost:8080

# Incorrect: double-clicking web/index.html (file:///path/to/index.html)
```

---

## Replay System

Record a game session:

```bash
python -m hiss_tastic.replay_cli record
```

Verify a replay file:

```bash
python -m hiss_tastic.replay_cli verify replays/replay_12345_20260604.json
```

Play back a replay:

```bash
python -m hiss_tastic.replay_cli play replays/replay_12345_20260604.json
```

See [docs/replay-ux.md](docs/replay-ux.md) and [docs/ghost-racing.md](docs/ghost-racing.md).

## Browser Runtime

A lightweight JavaScript/Canvas implementation is available in `web/`.

Browser runtime capabilities:

- Canvas rendering for local arcade play
- Touch/swipe and directional-pad controls
- PWA manifest and service worker for offline cache behavior
- Replay import/export with local JSON files
- Looping background music with toggle and credit link
- No telemetry, accounts, external backend, wallet logic, or multiplayer

See [docs/browser-runtime.md](docs/browser-runtime.md), [docs/mobile-controls.md](docs/mobile-controls.md), and [docs/pwa.md](docs/pwa.md).

## Android App

Hiss-Tastic is packaged as a native Android app via [Capacitor](https://capacitorjs.com/).

### Quick Install

1. Download the latest APK from the releases page
2. Enable "Install from unknown sources" on your Android device
3. Open the APK to install

### Building from Source

```bash
# Prerequisites: Android SDK 34+, Java 17+, Node.js 18+
npm install
npx cap sync
npx cap add android   # one-time setup
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

See [BUILD_ANDROID.md](BUILD_ANDROID.md) for detailed instructions.

## Cloud High Scores

Scores can be submitted to a shared Supabase database (hosted on the Elora project).
- **Local scores:** stored in browser localStorage
- **Cloud scores:** submitted to Supabase on save (toggle Local/Cloud on the Scores page)
- No account or authentication required — anonymous submissions
- RLS policies allow anyone to read the public leaderboard

## Validation

```bash
# Python validation suite
python validation.py
python -m unittest discover -v

# Local health check (browser assets + Python)
bash scripts/check-local.sh
```

## Packaging

See [docs/packaging.md](docs/packaging.md) for standalone executable instructions.

## Limitations

- Python remains canonical; browser runtime is experimental.
- There is no online multiplayer, leaderboard, telemetry, account system, backend, or wallet/onchain logic.
- Replay files are local JSON artifacts only when explicitly recorded, imported, or exported.
- Ghost racing is local-only and score-neutral.
- PWA support is limited to installability and offline asset caching.

## Ecosystem Role

Hiss-Tastic is part of Sparsh Sam's broader public software ecosystem as a preserved AI-assisted
game prototype and modernization candidate.

## License

This project is licensed under the [MIT License](LICENSE).

---

This repository follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards).

---

*Last updated: June 2026*

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | Python |
| Framework | Pygame |
| Web dashboard | Flask (HTML/CSS/JS) |
| Testing | pytest |

## Screenshots

> Screenshots to be added.

```
assets/screenshots/
└── (to be captured)
```
