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
    snakeFacts.js         Static snake-fact/roast dataset (local, no API)
    commentary.js         Live commentary engine (event-driven, deterministic)
    snakeField.js         Animated decorative background snake field (Canvas 2D)
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

## Snake Field Background

A decorative animated snake field (`snakeField.js`) renders dozens to hundreds of
small wiggling snakes on a fixed background canvas behind the game panel.

- Snakes vary by color, length, thickness, speed, wave amplitude, and direction.
- Seeded PRNG (seed 42) for stable deterministic appearance.
- `requestAnimationFrame`-driven with tab-visibility pause.
- Snake count adapts to screen size: desktop ~100–180, tablet ~60–100, mobile ~25–50.
- Respects `prefers-reduced-motion`: static decorative display when active.
- Game panel sits above the background layer via z-index, so snakes never obstruct gameplay.
- No external dependencies or image assets.

## Live Commentary System

A contextual snake-fact roast system (`commentary.js` + `snakeFacts.js`) provides
educational snake facts paired with playful roasts based on player behavior.

- 25+ fact/roast entries covering wall collision, self collision, missed food,
  rapid direction changes, early death, long survival, power-up events, and more.
- Deterministic seeded RNG for reproducible commentary sequences.
- Rate-limited (4s cooldown) with deduplication to avoid spam.
- Events are triggered by gameplay — no AI, no API calls, no telemetry.
- Game-over screen uses contextual snake-fact roasts.
- Legacy insult messages preserved as fallback in `LEGACY_INSULTS`.
- Commentary does not alter score, movement, collision, replay inputs, or game state.
- Compatible with replay playback (commentary is read-only observation).

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
