# Testing

## Python Runtime Tests

### Validation Suite

Comprehensive validation of assets, schema, imports, and game logic:

```bash
python validation.py
```

### Unit Tests

```bash
python -m unittest discover -v
```

### Replay System

```bash
python -m hisstastic.replay_cli record
python -m hisstastic.replay_cli verify replays/replay_*.json
python -m hisstastic.replay_cli play replays/replay_*.json
```

## Browser Runtime Tests

### Local Health Check

Verifies all files, assets, and dependencies:

```bash
bash scripts/check-local.sh
```

### Manual Smoke Tests

After starting the dev server (`bash scripts/serve.sh`):

1. Game loads without JS console errors
2. Title screen displays with difficulty selection
3. Gameplay: snake moves, eats food, collides with obstacles
4. Sound effects play on eat/power-up/game-over
5. Background music toggle works
6. PWA manifest loads (check DevTools → Application → Manifest)
7. Service worker state (on HTTPS only)
8. Import/Export replay buttons work
9. Mobile D-pad controls respond on touch devices

## Android Build Tests

```bash
npm run cap:bundle:debug
# Install APK on device and run smoke tests
```
