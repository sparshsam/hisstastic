# Browser Runtime

## Overview

The browser runtime is a lightweight JavaScript/Canvas reimplementation of
Hiss-Tastic that lives in `web/`. It is a **sibling implementation** to the
Python/Pygame version — both are maintained independently.

## Architecture

```
web/
  index.html              Entry point
  css/style.css           Mobile-first responsive styles
  js/
    game.js               Game engine (snake logic, collision, scoring, PRNG)
    renderer.js           Canvas rendering (grid, entities, UI)
    input.js              Input handler (keyboard, touch/swipe, dpad)
    audio.js              Web Audio API procedural sounds
    replay.js             Replay import/export/validation/display
    app.js                App initialization and main loop
  manifest.webmanifest    PWA manifest
  sw.js                   Service worker with offline caching
  icons/                  PWA app icons
```

## Game Engine

The JS game engine (`game.js`) replicates the Python runtime behavior:

- 30x20 grid (600x400 logical pixels)
- Same collision rules (wall, self, obstacle)
- Same scoring (quadratic: n²)
- Same legacy insult messages
- Same power-up mechanics (3.8s immunity, random respawn)
- Seeded PRNG (mulberry32) for deterministic replay
- Tick-based game loop with variable tick rate

## State Machine

```
TITLE → PLAYING ⇄ PAUSED
PLAYING → GAME_OVER → TITLE
```

## Differences from Python Version

| Aspect | Python | Browser |
|--------|--------|---------|
| Rendering | Pygame surfaces | HTML5 Canvas 2D |
| Audio | pygame.mixer | Web Audio API oscillators |
| Input | Keyboard only | Keyboard + touch + swipe + dpad |
| Window | Fixed 600x400 | Responsive canvas |
| RNG | random.Random | mulberry32 PRNG |

## Running

Serve the `web/` directory with any HTTP server:

```bash
python -m http.server 8080 --directory web/
# Or
npx serve web/
```

Then open http://localhost:8080 in a browser.
