# Animated Ambient Snake Background

## Overview

Decorative smooth Snake.io-style ambient snakes that glide around the perimeter of the game panel. Each snake uses a proper segmented-following movement model — the head moves continuously with smooth steering, and each body segment follows the one in front, creating living snake-like locomotion.

## Design

Rather than static border marks or full-screen particle swarms, the background features 10–18 (desktop) smooth segmented snakes that roam the edge zones of the viewport with autonomous steering behavior.

## Implementation

**File:** `web/js/snakeField.js`

### Architecture

- Full-viewport fixed canvas behind the game panel (`z-index: 0`, `pointer-events: none`).
- Each snake is an `AmbientSnake` instance with:
  - Head position (x, y) and angle
  - Smooth steering via sinusoidal oscillation + bias + exclusion avoidance
  - Body segments array (12–30 segments per snake)
  - Distance-constraint following: each segment moves to maintain `spacing` distance from the segment ahead of it
- Rendered as overlapping filled circles for smooth capsule-like bodies
- `requestAnimationFrame`-driven with tab-visibility pause

### Movement Model

```
Head moves forward at speed in current angle direction:
  head.x += cos(angle) * speed * dt
  head.y += sin(angle) * speed * dt

Angle changes smoothly:
  angle += (sin(phase) * amplitude + bias + steering) * dt

Each body segment follows the previous:
  dx = prev.x - curr.x
  dy = prev.y - curr.y
  dist = hypot(dx, dy)
  curr.x += (dx / dist) * (dist - spacing)  // pull to spacing distance
  curr.y += (dy / dist) * (dist - spacing)
```

This produces Snake.io / Slither.io-style smooth segmented locomotion.

### Visual Properties

| Property | Range | Description |
|----------|-------|-------------|
| Segments | 12–30 | Body length in circles |
| Segment spacing | 4–8 px | Gap between segment centers |
| Head radius | 5–9 px | Larger front circle |
| Body radius | 3–6 px | Tapers toward tail |
| Color | 26 colors | Greens, olives, coppers, teals |
| Opacity | 0.7–0.9 | Strong but decorative |
| Speed | 0.4–1.0 px/tick | Gliding pace |
| Accent stripes | 55% chance | Every 3rd or 4th segment |
| Eyes | Always | Two dark dots on head |
| Tongue flick | 50% chance | Red forked tongue |

### Boundary Behavior

- Snakes spawn in border zones (top, bottom, left, right, corners)
- Exclusion zone around game panel, controls, and commentary
- Snakes smoothly steer away from the exclusion zone (no hard snapping)
- Soft edge repulsion pushes snakes away from viewport boundaries
- Hard teleport wrap only if a snake fully exits the viewport (prevents loss)

### Snake Count Tiers

| Screen | Count | Notes |
|--------|-------|-------|
| Desktop (≥1024px) | 10–18 | Smooth roaming |
| Tablet (768–1023px) | 6–12 | Reduced count |
| Mobile (<768px) | 4–8 | Minimal |

### Performance

- One canvas, no DOM-per-snake
- No external libraries or image assets
- No per-frame allocations after initialization
- Pauses when tab hidden
- Delta-time capped at 33ms for stability

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Snake count reduced (0.4× multiplier)
- Snakes render as static shapes (no movement, no tongue flick)

### Privacy

- No image assets loaded from the network
- No data transmitted
- Purely decorative and local-only
