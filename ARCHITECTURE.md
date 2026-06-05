# Architecture

## Status

Hiss-Tastic is a maintained modular Python/Pygame arcade game. The original
single-file prototype has been split into a clean package structure while
preserving all gameplay behavior.

## Module Structure

```mermaid
graph TD
    main["main.py"] --> game["game.py (Game class, state machine)"]
    game --> config["config.py (CONFIG dict, difficulty presets)"]
    game --> entities["entities.py (Snake, Food, Obstacle, PowerUp)"]
    game --> input["input.py (event to action mapping)"]
    game --> rendering["rendering.py (draw functions)"]
    game --> spawns["spawns.py (safe entity placement)"]
    game --> scoring["scoring.py (quadratic scoring, messages)"]
    game --> replay["replay.py (Recorder, Player, verify)"]
    game --> ghost["ghost.py (local ghost replay sync)"]
    game --> audio["audio.py (procedural sound effects)"]
    game --> states["states.py (TITLE, PLAYING, PAUSED, GAME_OVER, EXIT)"]
    rendering --> config
    rendering --> ghost
    spawns --> config
    spawns --> entities
    audio --> config
    assets["assets.py (load_asset, load_all_assets)"] --> config
```

## Components

| Module | Responsibility |
|--------|---------------|
| `config.py` | Centralized CONFIG dict with all game constants and difficulty presets |
| `entities.py` | Data classes for Snake, Food, Obstacle, PowerUp |
| `assets.py` | Image loading with safe fallbacks (magenta placeholders) |
| `scoring.py` | Quadratic score calculation and legacy insult messages |
| `spawns.py` | Safe grid-aligned entity placement with seeded RNG support |
| `rendering.py` | All Pygame drawing functions (snake, obstacles, UI, overlays) |
| `input.py` | Pygame event processing into InputAction objects |
| `replay.py` | Deterministic replay recording, schema validation, playback, and verification |
| `ghost.py` | Local-only ghost replay loading, sanity validation, tick synchronization, and visualization payloads |
| `audio.py` | Procedural sine-wave sound effects with graceful failure |
| `states.py` | Game state constants |
| `game.py` | Main Game class — state machine orchestrating title, play, pause, game-over |
| `main.py` | Entry point: `python main.py` |

## Runtime Flow

```mermaid
flowchart TD
    A["main.py"] --> B["Game.run()"]
    B --> C{"State?"}
    C -->|TITLE| D["_run_title()"]
    C -->|PLAYING| E["_run_game()"]
    C -->|PAUSED| F["_run_pause()"]
    C -->|GAME_OVER| G["_run_game_over()"]
    C -->|EXIT| H["pygame.quit()"]
    D -->|SPACE| C
    E -->|game over| C
    F -->|P/ESC| C
    G -->|R| C
    G -->|Q| H
```

## Game Loop (per session)

```mermaid
flowchart TD
    A["Seed RNG"] --> B["Generate obstacles"]
    B --> C["Place food and power-up safely"]
    C --> D["Process input"]
    D --> E["Move snake"]
    E --> F{"Collision?"}
    F -->|Yes| G["Game over, record replay"]
    F -->|No| H{"Food collected?"}
    H -->|Yes| I["Respawn food, grow snake, add score, play sound"]
    H -->|No| J{"Power-up collected?"}
    J -->|Yes| K["Activate immunity, play sound"]
    J -->|No| L["Render frame"]
    I --> L
    K --> L
    L --> M["Tick clock"]
    M --> D
```

## Data Flow

- Game state is stored in-memory within the `Game` class instance.
- Configuration is read from the `CONFIG` dict in `config.py`.
- Assets are loaded once by `assets.py` at game startup.
- Replay files are written to `replays/` as JSON, local storage only.
- Ghost replay data is read from local replay JSON and exposed as renderer-safe, non-scoring payloads.
- No data is sent over the network.

## Replay System

```mermaid
flowchart LR
    A["Game session"] --> B["ReplayRecorder"]
    B -->|tick, direction, metadata, optional frames| C["replay.json"]
    C --> D["ReplayPlayer"]
    C --> G["GhostReplay"]
    D --> E["Schema validation and metadata"]
    G --> H["GhostRaceSession"]
    H --> I["draw_ghost visualization hook"]
```

The replay system uses a seeded `random.Random` instance. All random
operations (obstacle generation, food placement, power-up respawn) use
the same seeded RNG. Player inputs are recorded tick-by-tick with their
direction changes. New replay files also include metadata and local frame
snapshots for ghost visualization.

Replay validation checks required fields, replay version compatibility,
seed and score types, sorted tick-indexed input events, valid directions,
frame shape, and local-only metadata.

## Ghost Racing Foundation

Ghost racing is local-only and visualization-only. `GhostReplay` loads a
validated replay file, `GhostRaceSession` synchronizes the ghost by active
game tick, and `draw_ghost()` renders translucent frame snapshots when a
replay contains them.

Ghosts never affect scoring, collisions, spawn placement, difficulty, replay
verification, or game-over behavior. They are display data only.

## Security Boundaries

- The game has no network access, no user accounts, and no file uploads.
- Replay files are local JSON only and validated before playback or ghost use.
- Ghost replay racing adds no networking, telemetry, wallet logic, or multiplayer.
- The only external dependency is `pygame`, installed via pip.

## Modernization History

See [docs/modernization-roadmap.md](docs/modernization-roadmap.md) for the
full modernization plan. Phases 1-5 (Stabilize, Modularize, Replay,
Polish, Packaging) are complete.
