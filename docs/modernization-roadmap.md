# Hiss-Tastic Modernization Roadmap

## Purpose

This document defines the staged modernization path for Hiss-Tastic after the legacy import and repository standards alignment. The goal is to preserve the original Python/Pygame prototype while gradually turning it into a polished, maintainable arcade project.

Modernization should proceed in small, auditable phases. Preservation commits, documentation commits, refactor commits, and gameplay feature commits should remain separate.

## North-Star Direction

Hiss-Tastic is no longer just a preserved Python/Pygame Snake prototype. The long-term direction is to evolve it into a modern, browser-first arcade system while keeping the original prototype historically traceable.

Long-term platform goals:

- Browser-based gameplay.
- Mobile-first interface and controls.
- PWA installability.
- Multiplayer gameplay.
- Deterministic replay system.
- Agent-playable mode for AI agents and automated game runners.
- Optional onchain score verification.
- WebGPU/WebAssembly acceleration research path.
- Telemetry-backed balancing with strict privacy review before any data collection.

These goals should not be implemented all at once. They should be sequenced after stabilization, modularization, and browser architecture decisions.

## Current-State Audit

### Architecture

- The runtime is currently concentrated in `hiss_tastic.py`.
- The file owns initialization, asset loading, input handling, game state, scoring, collision checks, rendering, retry behavior, and shutdown.
- This is acceptable for a preserved prototype, but it limits testability and makes future behavior changes harder to review.

### Technical Debt

- Runtime dependency installation logic exists inside the game file.
- Game state is stored in local variables inside one large loop.
- Constants, rendering, entity placement, scoring, and collision behavior are coupled.
- Retry behavior recursively calls `gameLoop()`, which should be replaced with an explicit reset/state transition during stabilization.
- Random spawn placement does not yet guarantee separation from the snake, obstacles, food, and power-up positions.

### Asset Handling

- Assets have been moved into `assets/` and the game loads them from that directory.
- Asset loading is still direct and global.
- There is no asset manifest, fallback handling, or validation step.

### Game Loop Quality

- The core loop works, but input, update, collision, render, and game-over handling are not formally separated.
- Timing is driven by `clock.tick(snake_speed)` and speed increases directly after food collection.
- Power-up timing uses wall-clock time through `time.time()` rather than a game-time abstraction.

### UX/UI Limitations

- The game has a simple static window size.
- Game-over messaging is functional but not yet polished.
- There is no title screen, settings screen, pause behavior, sound, level progression, accessibility option, difficulty selection, or mobile-first control layer.

### Packaging and Portability Limitations

- The current run path is manual: create a venv, install Pygame, and run `python hiss_tastic.py`.
- There is no packaged desktop build, release artifact, CI check, smoke-test workflow, PWA, or browser build.
- Browser delivery is not yet available.

### Testing Gaps

- There are no automated tests.
- Pure logic such as scoring, spawn rules, collision rules, state transitions, replay determinism, and multiplayer synchronization cannot be tested cleanly until the code is modularized.

### Documentation Gaps

- Repository standards and preservation posture are documented.
- A more detailed modernization plan is now being introduced here.
- Future code changes should update README, ARCHITECTURE, CHANGELOG, and relevant docs.

### Agent-Readiness Gaps

- `AGENTS.md` defines preservation boundaries.
- Future agent passes need clearer issue-scoped tasks, acceptance criteria, and strict “no feature drift” boundaries.
- Agent-playable mode will require a formal machine-readable game protocol, deterministic inputs, and replay validation.
- Agent work should prefer one small phase per PR/commit.

## Roadmap

### Phase 1 — Python/Pygame Stabilization

Goal: make the current prototype safer, cleaner, and easier to run without changing core gameplay.

Scope:

- Remove runtime package auto-installation from `hiss_tastic.py`.
- Add a small smoke-test or syntax/import validation path.
- Replace recursive retry with explicit reset flow.
- Add deterministic constants for grid size, window size, colors, speed, and timing.
- Improve asset-loading error messages.
- Preserve current gameplay behavior unless a bug fix is explicitly documented.

Exit criteria:

- Game still launches via `python hiss_tastic.py`.
- No bundled installers enter git history.
- Basic validation can run without manually playing the game.

### Phase 2 — Codebase Refactor Into Modules

Goal: separate game systems without changing gameplay design.

Candidate structure:

```text
hiss_tastic/
  __init__.py
  assets.py
  config.py
  entities.py
  game.py
  rendering.py
  scoring.py
  spawns.py
  states.py
  input.py
main.py
```

Scope:

- Move constants into a config module.
- Move scoring logic into a testable function/module.
- Move spawn generation into a testable module.
- Move rendering functions out of the main loop.
- Keep a compatibility entry point so running the game remains simple.

Exit criteria:

- Gameplay remains equivalent.
- Pure logic tests can be added for scoring, spawning, and collision helpers.
- Architecture documentation reflects the new module boundaries.

### Phase 3 — Deterministic Core and Replay System

Goal: make game sessions reproducible, inspectable, and suitable for future multiplayer, agent play, and score verification.

Scope:

- Introduce deterministic seed handling.
- Represent player inputs as timestamped or tick-indexed events.
- Record replay files locally.
- Validate that replay playback reproduces the same score and game outcome.
- Define a replay file format.

Exit criteria:

- A local replay can reproduce a finished run.
- Replay validation can detect mismatched outcomes.
- No network or account system is required.

### Phase 4 — Visual and Audio Polish

Goal: make Hiss-Tastic feel intentional rather than merely functional.

Scope:

- Add title screen and game-over screen polish.
- Add pause/resume.
- Add sound effects and optional background music.
- Add more consistent typography and visual hierarchy.
- Improve snake/food/obstacle feedback.
- Consider replacing insulting score messages with configurable tone presets or preserving them as “legacy mode.”

Exit criteria:

- Visual/audio changes are optional, documented, and non-invasive.
- Player can mute audio.
- Legacy identity is preserved without relying on rough prototype edges.

### Phase 5 — Packaging and Release Builds

Goal: make the game easy to install and run for non-developers.

Scope:

- Add CI for linting/basic validation.
- Add release build exploration using PyInstaller or another suitable packaging route.
- Document Windows/macOS/Linux run paths.
- Add release checklist.
- Keep generated binaries out of source control.

Exit criteria:

- Users can download/run a release artifact.
- Build outputs are generated by release workflow, not committed manually.
- Versioning and changelog entries are maintained.

### Phase 6 — Browser-Based Version

Goal: make Hiss-Tastic playable in the browser while preserving the Python prototype as historical source material.

Options:

- Pygame-to-web experiment using pygbag or related tooling.
- Full web rebuild using TypeScript/Canvas.
- WebAssembly-based shared simulation core.
- Keep Python version canonical and treat browser version as a sibling implementation.

Exit criteria:

- Browser strategy is chosen intentionally.
- The Python prototype is not destabilized by web experiments.
- Any web build remains privacy-first and local-first by default.

### Phase 7 — Mobile-First and PWA Installability

Goal: make the browser version comfortable on phones and installable as a lightweight arcade app.

Scope:

- Responsive canvas layout.
- Touch controls and gesture controls.
- Mobile pause/resume behavior.
- PWA manifest and service worker.
- Offline play support.
- Installable home-screen experience.

Exit criteria:

- Game is playable on mobile without keyboard assumptions.
- PWA install flow works.
- Offline play works for local modes.

### Phase 8 — Agent-Playable Mode

Goal: allow AI agents and automated systems to play Hiss-Tastic through a structured interface.

Scope:

- Define a machine-readable game state format.
- Define allowed action schema.
- Add deterministic tick stepping.
- Support headless simulation mode.
- Support replay export from agent sessions.

Exit criteria:

- An external agent can observe state, submit actions, and complete a run.
- Agent runs are replayable.
- Agent mode cannot bypass normal scoring rules.

### Phase 9 — Multiplayer

Goal: add multiplayer only after deterministic state, browser runtime, and replay foundations exist.

Possible modes:

- Local same-device multiplayer.
- Private-room online multiplayer.
- Async ghost/replay racing.
- Live competitive survival mode.

Scope:

- Multiplayer protocol design.
- Match state synchronization.
- Latency and fairness rules.
- Room/session lifecycle.
- Abuse and moderation considerations if public rooms are introduced.

Exit criteria:

- Multiplayer mode is documented separately from solo play.
- Fairness constraints are explicit.
- Network behavior is reflected in privacy documentation.

### Phase 10 — Onchain Score Verification

Goal: explore optional score provenance without turning Hiss-Tastic into a crypto-first product.

Scope:

- Verify replay hash and score outcome.
- Keep gameplay offchain.
- Publish optional score proofs only after explicit user action.
- Consider Base testnet before any mainnet design.
- Avoid wallet requirements for normal gameplay.

Exit criteria:

- Onchain proof is opt-in.
- Local play remains fully available without wallet connection.
- Privacy and threat model are updated.

### Phase 11 — WebGPU/WebAssembly Acceleration

Goal: evaluate advanced runtime performance and technical research paths.

Scope:

- Benchmark normal Canvas/Web runtime first.
- Evaluate whether WebGPU is actually justified.
- Consider WebAssembly for deterministic simulation core if browser/Python parity matters.
- Avoid premature complexity.

Exit criteria:

- Acceleration decision is based on measured need.
- Any WebGPU/WASM layer has a clear role.
- Simpler browser builds remain supported.

### Phase 12 — Telemetry-Backed Balancing

Goal: use player-session data to tune difficulty and game feel only after a privacy-first telemetry design exists.

Scope:

- Define what balance questions telemetry should answer.
- Prefer local analytics first.
- If remote telemetry is introduced, make it opt-in.
- Track non-sensitive gameplay events only.
- Document retention, deletion, and data minimization rules.

Exit criteria:

- Telemetry has a clear balancing purpose.
- No personal data is collected by default.
- Privacy model and README are updated before implementation.

## Issue Plan

The following issue set should guide the modernization cycle:

1. Stabilize legacy Pygame runtime.
2. Replace recursive retry flow with explicit game reset.
3. Add spawn-safety rules and deterministic placement helpers.
4. Refactor scoring and collision logic into testable units.
5. Split single-file runtime into modules.
6. Add lightweight validation and CI.
7. Implement deterministic replay foundation.
8. Design visual/audio polish pass.
9. Evaluate packaging and release strategy.
10. Choose browser build strategy.
11. Build browser-based playable prototype.
12. Add mobile-first controls and responsive layout.
13. Add PWA installability and offline support.
14. Define agent-playable protocol.
15. Add headless agent simulation mode.
16. Design multiplayer architecture.
17. Implement multiplayer prototype after deterministic core exists.
18. Define optional onchain score verification model.
19. Prototype replay-hash score verification on testnet.
20. Evaluate WebGPU/WebAssembly acceleration.
21. Design telemetry-backed balancing with privacy review.

## Non-Goals For Immediate Work

- No gameplay expansion before stabilization.
- No web rebuild before Python architecture is understood.
- No multiplayer before deterministic replay exists.
- No agent-playable mode before a formal state/action protocol exists.
- No leaderboard, telemetry, wallet, or network feature before privacy and architecture review.
- No onchain verification before replay determinism exists.
- No WebGPU/WebAssembly work before baseline browser performance is measured.
- No DOI/citation metadata until the project reaches a more mature publication state.

## Architecture Decision Records Needed

Future phases should create ADRs before implementation for:

- Python-only vs browser-first canonical runtime.
- TypeScript/Canvas vs Pygame-to-web vs WASM architecture.
- Replay file format.
- Agent protocol.
- Multiplayer synchronization model.
- Onchain verification threat model.
- Telemetry and privacy model.
- PWA/offline strategy.

## Preservation Rule

The original prototype should remain understandable from the commit history. Major rewrites should be justified in issues and reflected in the changelog.
