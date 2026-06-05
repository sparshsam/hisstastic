# Snake Border Background

## Overview

A decorative animated snake border that frames the central game panel. Snakes live along the perimeter edges — top, bottom, left, right, and corners — creating a polished arcade habitat frame rather than a full-screen swarm.

## Design Philosophy

Replace full-screen random swarm with a curated border system:

- **Fewer, larger snakes** — 12–24 desktop, 8–16 tablet, 4–8 mobile
- **Perimeter-focused** — snakes stay near edges and corners
- **Clearly snake-like** — thick bodies, distinct heads with eyes, tapered tails, optional banded patterns and tongue flicks
- **Polished** — slow periodic motion, no chaotic traversal, no noise artifacts
- **Central UI pristine** — the game panel, buttons, and commentary area remain clean

## Implementation

**File:** `web/js/snakeField.js`

### Architecture

- Full-viewport fixed canvas behind the game panel (`z-index: 0`, `pointer-events: none`).
- Each snake is a `BorderSnake` instance assigned to one of 8 zones: `top`, `bottom`, `left`, `right`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`.
- Snakes are placed outside a calculated safe zone that covers the game panel, dpad, controls, and commentary box.
- Body rendered as 14-point polyline from tail to head, with sinusoidal lateral undulation.
- `requestAnimationFrame`-driven with tab-visibility pause.

### BorderSnake Properties

| Property | Range | Description |
|----------|-------|-------------|
| Body length | 60–160 px | Total snake size |
| Thickness | 4–9 px | Body diameter (tapered tail→head) |
| Color | 30 colors | Greens, olives, coppers, teals, creams |
| Opacity | 0.65–0.85 | Strong but decorative |
| Speed | 0.008–0.023 | Undulation rate |
| Amplitude | 6–18 px | Lateral sway |
| Head size | ~thickness × 0.9 | Rounded head circle |
| Banded | 40% chance | Dark/yellow/cream stripe patterns |
| Tongue flick | 60% chance | Periodic forked tongue |

### Safe Zone

A calculated exclusion rectangle surrounds the game panel area:
- Centered on viewport
- Covers game canvas, dpad, control buttons, and commentary box
- Snakes are placed outside this zone
- The game container's white background also masks anything behind the panel

### Snake Count Tiers

| Screen | Count | Notes |
|--------|-------|-------|
| Desktop (≥1024px) | 12–24 | Small random variation per session |
| Tablet (768–1023px) | 8–16 | Reduced |
| Mobile (<768px) | 4–8 | Minimal |

### Edge Zones

- **Top snakes:** hang from the top edge, facing downward
- **Bottom snakes:** rest along the bottom, facing upward
- **Left snakes:** positioned on the left side, facing right
- **Right snakes:** positioned on the right side, facing left
- **Corner snakes:** placed in the four viewport corners

### Visual Details

Each snake features:
- **Tapered body** — drawn from tail (thin) to head (thick) using 14 interpolation steps
- **Sinusoidal undulation** — lateral sine wave for natural slithering
- **Tail coil** — slight curl at the tail tip
- **Rounded head** — circle with highlight
- **Eyes** — two dark dots aligned with head direction
- **Banded pattern** — optional contrasting stripes (dark, yellow, or cream)
- **Tongue flick** — optional periodic red forked tongue

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Snake count halved (0.5× multiplier)
- Snakes render as static shapes (no movement, no tongue flick)

### Performance

- One canvas, no DOM-per-snake
- No external libraries or image assets
- Pauses when tab hidden
- Because there are dramatically fewer snakes than the previous swarm, this is significantly lighter

### Privacy

- No image assets loaded from the network
- No data transmitted
- Purely decorative and local-only
