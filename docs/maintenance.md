# Maintenance

## Current Cadence

HissTastic is in preservation mode. Maintenance should prioritize repository hygiene, compatibility notes, dependency review, and documentation accuracy.

## Dependency Management

- Runtime dependency: `pygame`.
- Review dependency updates before changing `requirements.txt`.
- Prefer compatibility fixes that keep the legacy game runnable before larger rewrites.

## Git Safety

- Never force-push `main`.
- Never rewrite protected or shared branches.
- Prefer normal pushes after clear commits.
- Force-push only on isolated feature branches when absolutely necessary.
- Document any force-push in the final report or pull request notes.

## Verification

For documentation-only changes:

```bash
python -m py_compile hisstastic.py
```

For runtime checks:

```bash
python main.py
```

For replay and ghost checks:

```bash
python -m unittest tests.test_replay_validation
python -m hisstastic.replay_cli verify path/to/replay.json
python -m hisstastic.replay_cli ghost-check path/to/replay.json
```

## Release Readiness

The project is not yet publication-ready. Before a maintained release, add tests or documented manual test coverage, review security posture, and confirm the changelog matches the release.
