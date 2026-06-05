# Release Checklist

Before every release:

- [ ] CHANGELOG.md updated with all changes
- [ ] Version bumped in `hiss_tastic/__init__.py`
- [ ] All changes committed and pushed
- [ ] CI passes (`.github/workflows/ci.yml`)
- [ ] Game runs locally (`python main.py`)
- [ ] Validation passes (`python validation.py`)
- [ ] Assets are present in `assets/`
- [ ] Replay files are NOT committed (`replays/` in .gitignore)
- [ ] Build artifacts in `.gitignore` (`dist/`, `build/`, `*.spec`)
- [ ] README.md reflects current state
- [ ] ARCHITECTURE.md is accurate
- [ ] No secrets committed
- [ ] Public/private boundary respected
