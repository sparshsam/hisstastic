# Snake Field Background

## Overview

The snake field is a decorative animated background that fills the empty space around the central game panel with dozens to hundreds of small crawling snakes.

## Implementation

**File:** `web/js/snakeField.js`

The snake field uses a separate fixed-position `<canvas>` element inserted behind the game container. Snakes are rendered entirely with Canvas 2D calls — no external images, sprites, or libraries.

### Architecture

- A full-viewport canvas is inserted as the first child of `<body>` with `z-index: 0` and `pointer-events: none`.
- The game container (`#game-container`) uses `z-index: 1` and has a white background, so it naturally covers the snake field in the play area.
- Each snake is a data object with position, velocity, color, length, thickness, wave parameters, and phase.
- Snakes are rendered as tapered, wavy lines with a slightly larger head dot.
- Animation loop uses `requestAnimationFrame` with tab-visibility pause.

### Visual Properties

Snakes vary randomly across these dimensions (seeded by mulberry32 with seed 42):

| Property | Range | Description |
|----------|-------|-------------|
| Color | 28 colors | Greens, oranges, yellow-greens, teals |
| Length | 4–22 segments | Controls snake size |
| Thickness | 1.5–5.5 px | Tapers from head to tail |
| Speed | 0.15–0.75 px/frame | Movement speed |
| Wave amplitude | 8–38 px | Side-to-side wiggle |
| Wave frequency | 0.01–0.05 | Oscillation rate |
| Opacity | 0.15–0.55 | Subtle blending |
| Direction | ±1 | Left/right bias |
| Loop chance | 0–3% | Occasional curl behavior |

### Snake Count Tiers

| Screen | Target Range | Notes |
|--------|-------------|-------|
| Desktop (≥1024px) | 100–180 | Scales with viewport area |
| Tablet (768–1023px) | 60–100 | Reduced count |
| Mobile (<768px) | 25–50 | Minimal for performance |

Minimum: 15 snakes. Maximum: 300 snakes.

### Performance Safeguards

- Tab visibility detection: animation loop skips rendering when the tab is hidden.
- `requestAnimationFrame` automatically pauses in background tabs on most browsers.
- No DOM manipulation during animation (only canvas paint operations).
- Single canvas layer — no per-snake DOM elements.
- Snake count scales with viewport area, not fixed.

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Snake count is reduced by 85% (multiplier of 0.15).
- Snakes render as static decorative elements (no position updates).
- Minimum count drops to 5 snakes.

### Privacy

- No image assets are loaded from the network.
- No data is transmitted.
- No player information is collected.
- The snake field is purely decorative and local-only.
