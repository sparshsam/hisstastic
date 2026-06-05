# Packaging

## Standalone Executable (PyInstaller)

Create a standalone executable that non-developers can run:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed main.py --name "Hiss-Tastic"
```

The executable will be in the `dist/` directory.

**Important:** Do not commit built executables or the `dist/` directory. They are
included in `.gitignore`.

### Platform Notes

- **Windows:** The `.exe` can be run directly. You may need to include the
  `assets/` directory alongside the executable.
- **macOS:** Use `--onefile --windowed` for a `.app` bundle.
- **Linux:** Use `--onefile` for a standalone binary.

## Requirements

The only runtime dependency is `pygame`. Install with:

```bash
pip install pygame
```

## Version Bumping

This project follows [Semantic Versioning 2.0](https://semver.org/).

1. Update the version in `hiss_tastic/__init__.py`.
2. Add a changelog entry in `CHANGELOG.md`.
3. Create a GitHub Release with release notes.
4. Tag the release (e.g., `v1.0.0`).

## CI

See `.github/workflows/ci.yml` for the CI pipeline. It runs:

- Python syntax checks
- Package import validation
- Asset and requirements validation
