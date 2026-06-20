# Release Checklist

Before every release:

- [ ] CHANGELOG.md updated with all changes
- [ ] Version bumped in `hisstastic/__init__.py`
- [ ] All changes committed and pushed
- [ ] CI passes (`.github/workflows/ci.yml`)
- [ ] Game runs locally (`python main.py`)
- [ ] Validation passes (`python validation.py`)
- [ ] Replay validation tests pass (`python -m unittest tests.test_replay_validation`)
- [ ] Browser/PWA static validation passes (`python validation.py`)
- [ ] Browser files exist: `web/index.html`, `web/manifest.webmanifest`, `web/sw.js`, `web/js/app.js`, `web/js/game.js`, `web/js/replay.js`
- [ ] Manifest JSON is valid and service worker cache paths are coherent
- [ ] Assets are present in `assets/`
- [ ] Replay files are NOT committed (`replays/` in .gitignore)
- [ ] Build artifacts in `.gitignore` (`dist/`, `build/`, `*.spec`)
- [ ] README.md reflects current state
- [ ] ARCHITECTURE.md is accurate
- [ ] No secrets committed
- [ ] Public/private boundary respected
- [ ] No networking, telemetry, wallet/onchain logic, or multiplayer added without explicit review
- [ ] No force-push used on `main` or protected/shared branches
- [ ] Any isolated feature-branch force-push is explained in release or handoff notes
