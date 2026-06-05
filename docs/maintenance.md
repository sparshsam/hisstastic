# Maintenance

## Current Cadence

Hiss-Tastic is in preservation mode. Maintenance should prioritize repository hygiene, compatibility notes, dependency review, and documentation accuracy.

## Dependency Management

- Runtime dependency: `pygame`.
- Review dependency updates before changing `requirements.txt`.
- Prefer compatibility fixes that keep the legacy game runnable before larger rewrites.

## Verification

For documentation-only changes:

```bash
python -m py_compile hiss_tastic.py
```

For runtime checks:

```bash
python hiss_tastic.py
```

## Release Readiness

The project is not yet publication-ready. Before a maintained release, add tests or documented manual test coverage, review security posture, and confirm the changelog matches the release.
