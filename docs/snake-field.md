# Snake Field Background

## Overview

The snake field is a decorative animated background that fills the empty space around the central game panel with dozens to hundreds of small crawling snakes. Each snake has a head, a body trail that follows the head's path, and natural serpentine slithering motion.

## Implementation

**File:** `web/js/snakeField.js`

The snake field uses a separate fixed-position `<canvas>` element inserted behind the game container. Snakes are rendered entirely with Canvas 2D calls — no external images, sprites, or libraries.

### Architecture

- A full-viewport canvas is inserted as the first child of `<body>` with `z-index: 0` and `pointer-events: none`.
- The game container (`#game-container`) uses `z-index: 1` and has a white background, so it naturally covers the snake field in the play area.
- Each snake is a `FieldSnake` class instance with:
  - Head position (pixel coordinates), heading angle, speed
  - Sinusoidal lateral undulation for natural slithering
  - Trail array — history of head positions that forms the body
  - Body rendered from trail segments (tail to head) with tapering
  - Distinct rounded head with highlight and tiny eyes
- Animation loop uses `requestAnimationFrame` with tab-visibility pause.

### Locomotion

The key difference from earlier versions: snakes now use **head-forward body-following** movement:

1. Each snake has a heading angle and velocity.
2. Sinusoidal undulation modulates the heading angle, creating lateral waves.
3. A gentle turn bias gives each snake a unique natural curve.
4. An exclusion-zone steering force pushes snakes away from the central UI.
5. The head position is recorded every frame into a trail array.
6. The body is drawn by interpolating the trail segments from tail to head.
7. Snakes wrap around screen edges.

This produces visible crawling/slithering motion — the body clearly follows the head's path.

### Visual Properties

Snakes vary randomly across these dimensions (seeded by mulberry32 with seed 42):

| Property | Range | Description |
|----------|-------|-------------|
| Color | 47 colors | Greens, olives, browns, coppers, teals (snake-like palette) |
| Length | 8–28 segments | Controls snake body/trail length |
| Thickness | 2.0–5.5 px | Tapers from head to tail |
| Speed | 0.6–2.4 px/frame | Movement speed |
| Scale | 0.7–1.2 | Overall size variation |
| Undulation speed | 0.015–0.055 | How fast the sine wave oscillates |
| Turn strength | 0.6–1.8 | How sharp the lateral turns are |
| Turn bias | ±0.15 | Persistent drift for natural curvature |
| Opacity | 0.35–0.70 | Visible but decorative |

### Snake Count Tiers

| Screen | Target Range | Notes |
|--------|-------------|-------|
| Desktop (≥1024px) | 120–220 | Scales with viewport area |
| Tablet (768–1023px) | 70–120 | Reduced count |
| Mobile (<768px) | 35–70 | Minimal for performance |

Minimum: 20 snakes (8 with reduced motion). Maximum: 350 snakes.

### Exclusion Zone

Snakes are discouraged from the central UI area:

- An exclusion rectangle is calculated around the game panel, controls, and commentary box.
- Snakes are spawned outside this zone.
- A gentle steering force pushes snakes away if they enter the zone.
- The game container's white background also naturally masks snakes beneath the panel.

### Performance Safeguards

- Tab visibility detection: animation loop skips body updates when the tab is hidden.
- `requestAnimationFrame` automatically pauses in background tabs on most browsers.
- No DOM manipulation during animation (only canvas paint operations).
- Single canvas layer — no per-snake DOM elements.
- Delta-time capped at 50ms to prevent spiral-of-death after tab switch.
- Trail array capped per snake (max 28 segments).
- Snake count scales with viewport area.

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Snake count is reduced by 88% (multiplier of 0.12).
- Snakes render as static decorative shapes (no position updates).
- Minimum count drops to 8 snakes.

### Privacy

- No image assets are loaded from the network.
- No data is transmitted.
- No player information is collected.
- The snake field is purely decorative and local-only.
