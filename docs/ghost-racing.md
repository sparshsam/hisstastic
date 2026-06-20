# Ghost Racing

## Status

Ghost racing is in foundation stage. The repository now supports local ghost replay loading, sanity validation, tick synchronization, and renderer-safe visualization payloads.

## Principles

- Ghosts are local-only.
- Ghosts are deterministic replay artifacts.
- Ghosts never affect scoring.
- Ghosts never affect collisions, spawn placement, difficulty, or game-over logic.
- Ghost support does not add networking, telemetry, accounts, wallets, or multiplayer.

## Current Implementation

- `hisstastic.ghost.GhostReplay` loads and validates a replay file.
- `GhostReplay.sanity_check()` confirms local-only ghost constraints.
- `GhostRaceSession` synchronizes a replay by active game tick.
- `rendering.draw_ghost()` can draw translucent ghost frame payloads when frame snapshots exist.
- `ReplayRecorder.record_frame()` stores minimal local snapshots for new replays.

## Visualization Hook

Ghost visualization payloads contain:

- `tick`
- `body`
- `head`
- `score`
- `snake_length`
- `complete`

These payloads are read-only display data. Active game state remains authoritative.

## Limitations

- The current CLI validates ghost compatibility but does not yet provide a full interactive ghost-racing selection UI.
- Existing older replay files may lack `frames`, so they can be valid for input replay but unavailable for visual ghost overlays.
- Full deterministic score reproduction still depends on future simulation tooling beyond structural validation.

## Future Work

- Add an in-game local ghost selection screen.
- Add deterministic headless replay simulation.
- Compare active run progress against ghost score and distance without changing scoring.
- Document any future replay schema migration before release.
