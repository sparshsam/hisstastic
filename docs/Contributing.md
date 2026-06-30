# Contributing

Thank you for considering a contribution to HissTastic.

## Scope

This repository is currently a preserved legacy prototype. Contributions should focus on documentation, preservation quality, compatibility fixes, and clearly scoped modernization work.

Do not rewrite gameplay, change mechanics, or add new features unless the change is explicitly part of an approved modernization task.

## Process

1. Fork the repository.
2. Create a feature branch such as `docs/readme-alignment` or `fix/asset-loading`.
3. Make focused changes.
4. Run the relevant verification steps.
5. Submit a pull request with a short summary and manual test notes.

## Git Safety

- Never force-push `main`.
- Never rewrite protected or shared branches.
- Prefer normal `git push` after commits.
- Force-push only on isolated feature branches when absolutely necessary.
- If a force-push is used, explain the reason in the pull request or final report.

## Standards

- Preserve the original prototype unless a change is explicitly requested.
- Keep documentation restrained and accurate.
- Avoid telemetry, engagement-pressure mechanics, or unnecessary network services.
- Document any change that affects runtime behavior, dependencies, or data handling.
- Preserve deterministic replay behavior when changing input, spawn, timing, or scoring code.
- Keep ghost racing local-only and non-scoring.
- Follow the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards).

## Quick Links

- [Development Setup](Development.md)
- [Architecture](Architecture.md)
- [Deployment](Deployment.md)
- [Testing](Testing.md)

## Code of Conduct

This project follows the [Code of Conduct](../CODE_OF_CONDUCT.md).

By contributing, you agree that your contributions will be licensed under MIT.
