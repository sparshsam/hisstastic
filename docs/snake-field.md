# Procedural Snake Silhouette

## Overview

A single large procedural snake rendered as a filled polygon silhouette. The body is built from a spine curve with natural width profile, producing a clean continuous snake shape with proper head, tapered tail, and traveling slither wave.

## Implementation

**File:** `web/js/snakeField.js`

### Spine Model

- 240 spine samples at 8px spacing = **1920px body length** (≈2× viewport width)
- Sampled from a 4000-entry path history with angle interpolation
- Full-body sine wave applied laterally with mid-body amplitude peak
- Wave fades to zero in the final 15% to prevent tail twist
- Last 3 spine points smoothed for clean tail

### Body Polygon Construction

1. Compute spine curve (path sampling + sine wave)
2. At each spine point, compute normal from stored angle
3. Compute radius from `bodyRadius(t)` profile function
4. Build left-edge and right-edge point arrays
5. Draw filled closed polygon + subtle outline

### Body Width Profile

The `bodyRadius(t)` function defines distinct anatomical regions:

| Region | t range | Description |
|--------|---------|-------------|
| Head | 0.00–0.05 | Wedge tip, transitions to neck |
| Neck | ~0.05–0.10 | Slightly narrower than head |
| Mid-body | 0.10–0.60 | Full width (widest part) |
| Rear body | 0.60–0.80 | Gentle taper |
| Tail | 0.80–1.00 | Sharp taper to tip |

Base radius: 14–18px reference. Head radius: 10–12px.

### Head Design

- Triangular/wedge tip extending forward from spine
- Wider than neck, not a giant circle
- Eyes placed on head with correct heading
- Optional forked tongue flick

### Rendering

- Filled body polygon (main color #2E7D32)
- Subtle dark outline (#1B5E20, 1.5px)
- Top highlight ridge along left edge
- No stroked lines, no disconnected segments — real silhouette

### Debug Mode

`window.HISS_DEBUG_SNAKE = true` — spine points, left/right edge polygon overlay.

### Reduced Motion

Static rendering when `prefers-reduced-motion: reduce` is active.

### Privacy

No network, no assets, no data transmission. Local-only decorative.
