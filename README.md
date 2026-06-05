# Hiss-Tastic

A retro Snake-inspired arcade game built with Python and Pygame.

[![License](https://img.shields.io/github/license/sparshsam/hiss-tastic?style=flat-square)](LICENSE)
[![Status: Maintained](https://img.shields.io/badge/status-maintained-2ea44f?style=flat-square)](#status)
[![CI](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml/badge.svg)](https://github.com/sparshsam/hiss-tastic/actions/workflows/ci.yml)

## Status

**Maintained prototype.** Core gameplay is functional. The codebase has been
stabilized, modularized, and now includes a deterministic replay system,
UI polish, audio, and a CI pipeline.

This repository preserves an original AI-assisted Python/Pygame prototype from
the early ChatGPT/GPT-4o era. The current goal is modernizing while preserving
the original personality and gameplay.

## Project Metadata

- Category: creative prototype
- Class: archive → maintained
- Maturity: M2 maintained / Stage 2 stabilized
- Data posture: local runtime only; no accounts, telemetry, network services, or persistent player data
- Research themes: AI-assisted software preservation, local-first software, human-centered computing, deterministic replay
- ORCID: https://orcid.org/0009-0007-1585-6927

## Features

- Snake movement with grid-based alignment
- Rodent (food) collection with quadratic scoring
- Obstacles with collision detection
- Immunity power-up with timed invulnerability
- **Title screen** with difficulty selection (Easy / Normal / Hard)
- **Pause/resume** (P or ESC)
- **Procedural audio** with mute toggle (M key)
- **Deterministic replay system** — record, play back, and verify game sessions
- Legacy scoring messages preserved

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full module structure and data flow.

The game is organized as a Python package:

```
hiss_tastic/          # Game package (12 modules)
  config.py           # Centralized constants
  entities.py         # Snake, Food, Obstacle, PowerUp data classes
  assets.py           # Asset loading with safe fallbacks
  scoring.py          # Scoring and legacy insult messages
  spawns.py           # Safe entity placement with seeded RNG
  rendering.py        # All Pygame drawing logic
  input.py            # Event processing
  game.py             # Main Game class and state machine
  replay.py           # Deterministic replay recording/playback
  ghost.py            # Local-only ghost replay helpers
  audio.py            # Procedural sound effects
  states.py           # Game state constants
main.py               # Entry point
```

## Setup

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

Run the game:

```bash
python main.py
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

## Validation

Run the smoke-test suite:

```bash
python validation.py
```

## Packaging

See [docs/packaging.md](docs/packaging.md) for standalone executable instructions.

## Limitations

- This is a solo local game — no multiplayer, no online leaderboards.
- There is no web build, level system, or browser runtime.
- The project does not transmit player data. Replay files are local JSON artifacts only when explicitly recorded.
- Audio uses procedural generation (no music files bundled).

## Ecosystem Role

Hiss-Tastic is part of Sparsh Sam's broader public software ecosystem as a
preserved AI-assisted game prototype.

## Future Roadmap

See [docs/modernization-roadmap.md](docs/modernization-roadmap.md) for the
full modernization plan. Phases 1–5 are complete.

## License

This project is licensed under the [MIT License](LICENSE).

## Citation

This repository is not currently DOI-backed or citation-ready. Citation metadata
may be added if the project later reaches publication-ready maturity.

---

This repository follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards).
