# Hiss-Tastic

A retro Snake-inspired arcade game built with Python and Pygame.

[![License](https://img.shields.io/github/license/sparshsam/hiss-tastic?style=flat-square)](LICENSE)
[![Status: Prototype](https://img.shields.io/badge/status-prototype-44546a?style=flat-square)](#status)

## Status

Working prototype. Core gameplay is functional, but breaking changes are expected during modernization.

This repository preserves an original AI-assisted Python/Pygame prototype from the early ChatGPT/GPT-4o era. The current goal is archival clarity, repository hygiene, and preparation for a future rebuild.

## Project Metadata

- Category: creative prototype
- Class: archive
- Maturity: M1 working / Stage 1 prototype
- Data posture: local runtime only; no accounts, telemetry, network services, or persistent player data
- Research themes: AI-assisted software preservation, local-first software, human-centered computing
- Citation: not currently citeable
- ORCID: https://orcid.org/0009-0007-1585-6927

## Features

- Snake movement
- Rodent collection
- Obstacles
- Immunity power-up
- Score system
- Restart loop

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the current system structure and modernization boundaries.

## Setup

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Or activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install pygame
```

Run the game:

```bash
python hiss_tastic.py
```

## Limitations

- This is a preserved legacy prototype, not a polished release.
- The game currently has a single-file runtime and bundled raster assets.
- There is no web build, level system, leaderboard, sound, or release pipeline yet.
- The project does not collect, store, transmit, or verify player data.

## Ecosystem Role

Hiss-Tastic is part of Sparsh Sam's broader public software ecosystem as a small preserved AI-assisted game prototype. It is a preservation and modernization candidate, not core infrastructure.

## Future Roadmap

- Modernize architecture
- Add web build
- Improve UI/UX
- Add sound/music
- Add levels
- Add leaderboard
- Possibly add onchain score proofs later

## License

This project is licensed under the [MIT License](LICENSE).

## Citation

This repository is not currently DOI-backed or citation-ready. Citation metadata may be added if the project later reaches publication-ready maturity.

---

This repository follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards).
