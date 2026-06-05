# Agent Notes

## Repository Role

Hiss-Tastic is a preserved legacy AI-assisted Python/Pygame game prototype. Treat the current gameplay as archival source material unless a human explicitly requests modernization or feature work.

## Operating Rules

- Do not add gameplay features during governance, documentation, or metadata passes.
- Do not rewrite `hiss_tastic.py` unless the task explicitly requires code changes.
- Keep Python installer binaries out of the repository.
- Preserve local-only privacy posture unless a future task explicitly introduces networked features.
- Update README, architecture, changelog, and privacy notes when behavior changes.
- Follow the ecosystem standards at https://github.com/sparshsam/ecosystem-standards.

## Replay and Ghost Rules

- Preserve deterministic replay behavior when changing game state, input, spawn, timing, or scoring logic.
- Keep replay files local JSON artifacts; do not add networking, telemetry, wallet logic, or multiplayer synchronization without explicit approval.
- Ghost replay code is visualization-only. Ghosts must never affect scoring, collisions, spawn placement, difficulty, or replay verification.
- Update `docs/replay-ux.md`, `docs/ghost-racing.md`, and `ARCHITECTURE.md` when replay behavior changes.

## Git Safety

- Never force-push `main`.
- Never rewrite protected or shared branches, including `modernization/phase-1-5`.
- Prefer normal `git push` after commits.
- Force-push only on isolated feature branches when absolutely necessary.
- If a force-push is used, explain why in the final report.
