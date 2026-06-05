# Hiss-Tastic

A retro Snake-inspired arcade game built with Python and Pygame, with an experimental browser/PWA runtime.

[![License](https://img.shields.io/github/license/sparshsam/hiss-tastic?style=flat-square)](LICENSE)
[![Status: Maintained](https://img.shields.io/badge/status-maintained-2ea44f?style=flat-square)](#status)
[![CI](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml/badge.svg)](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml)

## Status

**Maintained prototype.** The Python runtime remains the canonical preserved runtime. The codebase has been stabilized, modularized, and extended with deterministic replay, local ghost replay foundations, UI polish, audio, packaging notes, and CI validation.

The browser runtime under `web/` is experimental but playable. It is a local-first JavaScript/Canvas implementation with PWA offline cache behavior only.

This repository preserves an original AI-assisted Python/Pygame prototype from the early ChatGPT/GPT-4o era while preparing it for careful modernization.

## Project Metadata

- Category: creative prototype
- Class: archive -> maintained
- Maturity: M2 maintained / Stage 2 stabilized
- Data posture: local runtime only; no accounts, telemetry, external backend, wallet logic, or persistent network services
- Research themes: AI-assisted software preservation, local-first software, human-centered computing, deterministic replay
- ORCID: https://orcid.org/0009-0007-1585-6927

## Features

- Snake movement with grid-based alignment
- Rodent collection with quadratic scoring
- Obstacles with collision detection
- Immunity power-up with timed invulnerability
- Title screen with difficulty selection
- Pause/resume
- Procedural audio with mute toggle
- Deterministic replay recording, playback, and verification
- Local-only ghost replay foundations
- Experimental browser runtime in `web/`
- Mobile-friendly touch controls
- PWA installability and offline cache behavior
- Animated decorative snake field background (canvas-based, reduced-motion aware)
- Live snake-fact roast commentary system (local-only, deterministic, no AI/API)
- Legacy scoring messages preserved with snake-fact game-over roasts

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full module structure and data flow.

Python package:

```text
hiss_tastic/
  config.py
  entities.py
  assets.py
  scoring.py
  spawns.py
  rendering.py
  input.py
  game.py
  replay.py
  ghost.py
  audio.py
  states.py
main.py
```

Browser runtime:

```text
web/
  index.html
  manifest.webmanifest
  sw.js
  css/style.css
  js/app.js
  js/game.js
  js/replay.js
  js/snakeFacts.js
  js/commentary.js
  js/snakeField.js
```

## Python Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install pygame
```

Run the canonical Python game:

```bash
python main.py
```

The legacy preserved entry point is retained:

```bash
python hiss_tastic.py
```

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

Check ghost replay compatibility:

```bash
python -m hiss_tastic.replay_cli ghost-check replays/replay_12345_20260604.json
```

See [docs/replay-ux.md](docs/replay-ux.md) and [docs/ghost-racing.md](docs/ghost-racing.md).

## Browser Runtime

A lightweight JavaScript/Canvas implementation is available in `web/`.

Run it locally:

```bash
python -m http.server 8080 --directory web/
```

Then open `http://localhost:8080` in a browser.

Browser runtime capabilities:

- Canvas rendering for local arcade play
- Touch/swipe and directional-pad controls
- PWA manifest and service worker for offline cache behavior
- Replay import/export with local JSON files
- No telemetry, accounts, external backend, wallet/onchain logic, or multiplayer

See [docs/browser-runtime.md](docs/browser-runtime.md), [docs/mobile-controls.md](docs/mobile-controls.md), and [docs/pwa.md](docs/pwa.md).

## Validation

Run the local validation suite:

```bash
python validation.py
python -m unittest
```

## Packaging

See [docs/packaging.md](docs/packaging.md) for standalone executable instructions.

## Limitations

- Python remains canonical; browser runtime is experimental.
- There is no online multiplayer, online leaderboard, telemetry, account system, backend, or wallet/onchain logic.
- Replay files are local JSON artifacts only when explicitly recorded, imported, or exported.
- Ghost racing is local-only and score-neutral.
- PWA support is limited to installability and offline asset caching.
- Audio uses procedural generation.

## Ecosystem Role

Hiss-Tastic is part of Sparsh Sam's broader public software ecosystem as a preserved AI-assisted game prototype and modernization candidate.

## Future Roadmap

See [docs/modernization-roadmap.md](docs/modernization-roadmap.md) for the full modernization plan.

## License

This project is licensed under the [MIT License](LICENSE).

## Citation

This repository is not currently DOI-backed or citation-ready. Citation metadata may be added if the project later reaches publication-ready maturity.

---

This repository follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards).
