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

## Browser Runtime and PWA

The browser runtime runs locally in the user's browser. It does not use accounts, telemetry, analytics, an external backend, wallet connections, or multiplayer networking.

The PWA service worker caches static game files for offline play. It does not log, transmit, or synchronize gameplay data. Browser replay import/export uses local JSON files selected or saved by the user.

### Snake Field Background

The decorative snake field (`snakeField.js`) renders animated snakes locally using Canvas 2D. No image assets are loaded. No data is transmitted. Animation respects `prefers-reduced-motion` and pauses when the browser tab is hidden.

### Live Commentary System

The snake-fact roast system (`commentary.js` + `snakeFacts.js`) uses a local static dataset. No external APIs, AI/LLM calls, or network requests are made. Gameplay stats used for context-aware roasts exist only in memory during the session and are never transmitted or persisted. Commentary does not alter game state, scoring, or replay data.

## Future Changes

If future versions add leaderboards, web builds, telemetry, accounts, or onchain score proofs, the privacy model must be updated before release. Optional score proof work should use minimal disclosure and must not become the lead identity of the project.
