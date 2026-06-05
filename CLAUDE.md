# Claude Notes

Hiss-Tastic is a preserved Python/Pygame arcade prototype.

Before changing this repository, review:

- `AGENTS.md`
- `docs/modernization-roadmap.md`
- `README.md`
- `ARCHITECTURE.md`

Repository work should remain aligned with:

- https://github.com/sparshsam/sparshsam
- https://github.com/sparshsam/ecosystem-standards

## Rules

- Keep preservation, documentation, refactor, and feature work separate.
- Do not commit installers, generated binaries, local environment files, or secrets.
- Preserve existing gameplay unless the requested task explicitly changes it.
- Update documentation when setup, behavior, architecture, or privacy posture changes.
- Follow the roadmap order before starting advanced modernization work.
- Preserve deterministic replay behavior when changing input, spawn, state, or scoring code.
- Treat ghost racing as local-only visualization and comparison data; it must not affect active scoring.
- Never force-push `main` or protected/shared branches.
- Prefer normal pushes after commits. If force-push is required on an isolated feature branch, explain it in the final report.

## Required Report

At the end of every task, provide:

- Repository name
- Branch name
- Commit hash
- Files changed
- Summary of work
- Verification performed
- Push confirmation
- Standards checked
- Deferred work or risks
