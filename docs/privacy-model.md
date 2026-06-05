# Privacy Model

## Data Handling

Hiss-Tastic does not collect, transmit, or persist player data by default.

## Local Runtime

The game runs locally through Python and Pygame. Runtime state such as score, snake position, obstacle placement, and power-up timing exists only in memory while the process is running.

## Replay Files

When a player explicitly records a replay, Hiss-Tastic writes a local JSON file under `replays/`. Replay files can include deterministic seed metadata, tick-indexed inputs, final score, snake length, and local frame snapshots for ghost visualization.

Replay files are not uploaded, synchronized, or used for telemetry.

## Ghost Racing

Ghost racing reads local replay files only. Ghosts are visualization and comparison data; they do not affect scoring, collisions, spawn placement, difficulty, or game-over logic.

## Future Changes

If future versions add leaderboards, web builds, telemetry, accounts, or onchain score proofs, the privacy model must be updated before release. Optional score proof work should use minimal disclosure and must not become the lead identity of the project.
