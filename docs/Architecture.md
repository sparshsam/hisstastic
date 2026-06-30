# Architecture

This document is a brief summary. See the full [ARCHITECTURE.md](../ARCHITECTURE.md) at the repository root for the complete module structure, data flow diagrams, replay system design, ghost racing foundation, and security boundaries.

## Overview

HissTastic is a modular Python/Pygame arcade game with an experimental browser/PWA runtime. The original single-file prototype has been preserved, the Python runtime remains canonical, and the browser runtime is a playable sibling implementation under `web/`.

## Key Components

| Module | Responsibility |
|--------|---------------|
| `config.py` | Centralized CONFIG dict with all game constants and difficulty presets |
| `entities.py` | Data classes for Snake, Food, Obstacle, PowerUp |
| `game.py` | Main Game class — state machine orchestrating title, play, pause, game-over |
| `replay.py` | Deterministic replay recording, schema validation, playback, and verification |
| `ghost.py` | Local-only ghost replay loading and visualization |
| `audio.py` | Procedural sine-wave sound effects with graceful failure |

## Runtime Flow

Main states: `TITLE → PLAYING → PAUSED → GAME_OVER → EXIT`

The browser runtime under `web/` mirrors this structure using JavaScript and Canvas, with touch/swipe controls, PWA support, and replay import/export.

## Data Flow

- Game state is in-memory within the `Game` class instance.
- Configuration from `config.py`.
- Assets loaded once by `assets.py` at startup.
- Replay files written to `replays/` as local JSON.
- No data is sent over the network (the browser runtime's Supabase leaderboard is the single exception — anonymous player ID and personal best only).
