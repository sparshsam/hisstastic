# Hiss-Tastic Modernization Roadmap

## Purpose

This document defines the staged modernization path for Hiss-Tastic after the legacy import and repository standards alignment. The goal is to preserve the original Python/Pygame prototype while gradually turning it into a polished, maintainable arcade project.

Modernization should proceed in small, auditable phases. Preservation commits, documentation commits, refactor commits, and gameplay feature commits should remain separate.

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
- There is no title screen, settings screen, pause behavior, sound, level progression, accessibility option, or difficulty selection.

### Packaging and Portability Limitations

- The current run path is manual: create a venv, install Pygame, and run `python hiss_tastic.py`.
- There is no packaged desktop build, release artifact, CI check, or smoke-test workflow.
- Browser delivery is not yet available.

### Testing Gaps

- There are no automated tests.
- Pure logic such as scoring, spawn rules, collision rules, and state transitions cannot be tested cleanly until the code is modularized.

### Documentation Gaps

- Repository standards and preservation posture are documented.
- A more detailed modernization plan is now being introduced here.
- Future code changes should update README, ARCHITECTURE, CHANGELOG, and relevant docs.

### Agent-Readiness Gaps

- `AGENTS.md` defines preservation boundaries.
- Future agent passes need clearer issue-scoped tasks, acceptance criteria, and strict “no feature drift” boundaries.
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

### Phase 3 — Visual and Audio Polish

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

### Phase 4 — Packaging and Release Builds

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

### Phase 5 — Browser/Web Version Exploration

Goal: evaluate whether Hiss-Tastic should have a browser-playable version.

Options:

- Pygame-to-web experiment using pygbag or related tooling.
- Full web rebuild using TypeScript/Canvas.
- Keep Python version canonical and treat browser version as a sibling implementation.

Exit criteria:

- Browser strategy is chosen intentionally.
- The Python prototype is not destabilized by web experiments.
- Any web build remains privacy-first and local-first by default.

### Phase 6 — Advanced Experiments

Goal: explore modern identity features only after the game is stable.

Possible experiments:

- Deterministic replay files.
- Local high-score table.
- Optional leaderboard.
- Agent-playable mode with structured input/output.
- Onchain score proofs for experimental preservation/provenance.
- Web-native replay verification.

Constraints:

- No networked feature should be added silently.
- Any leaderboard or onchain proof system must be opt-in.
- Privacy posture must be updated before any data leaves the local runtime.

## Issue Plan

The following issue set should guide the first modernization cycle:

1. Stabilize legacy Pygame runtime.
2. Replace recursive retry flow with explicit game reset.
3. Add spawn-safety rules and deterministic placement helpers.
4. Refactor scoring and collision logic into testable units.
5. Split single-file runtime into modules.
6. Add lightweight validation and CI.
7. Design visual/audio polish pass.
8. Evaluate packaging and release strategy.
9. Explore browser build strategy.
10. Define advanced experiment boundaries.

## Non-Goals For Immediate Work

- No gameplay expansion before stabilization.
- No web rebuild before Python architecture is understood.
- No leaderboard, telemetry, wallet, or network feature before privacy and architecture review.
- No DOI/citation metadata until the project reaches a more mature publication state.

## Preservation Rule

The original prototype should remain understandable from the commit history. Major rewrites should be justified in issues and reflected in the changelog.
