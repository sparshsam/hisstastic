# Single Serpentine Ambient Snake

## Overview

A single large decorative snake with full-body serpentine wave motion. The snake uses path-following for base position plus a sine wave lateral offset along the entire body length, producing natural S-curve slithering.

## Implementation

**File:** `web/js/snakeField.js`

### Motion Model

Two-phase body construction:

1. **Path sampling:** Head position (with angle) is recorded each frame into a 140-entry path history. Body points are sampled from this path at increasing distances behind the head (5px spacing, 60 segments = 300px body).

2. **Serpentine wave:** Each body point receives a lateral sine-wave offset computed from:
   - The **normal** (perpendicular to body direction) at that point
   - A sine wave that travels along the body over time: `sin(time × waveSpeed - bodyIndex × frequency)`
   - An **amplitude envelope** that peaks at mid-body and falls to zero at head and tail: `sin(π × t)`
   
   This creates visible S-curves that travel from head to tail, even when the head moves in a straight line.

### Properties

| Property | Desktop | Mobile |
|----------|---------|--------|
| Head radius | 10–14px | 7.5–10.5px |
| Body thickness | 12–18px | 9–13.5px |
| Segment count | 60 | 40 |
| Body length | ~300px | ~200px |
| Path history | 140 entries | 140 entries |
| Tail min thickness | 15% of body (~2–3px) | 15% |
| Wave amplitude | 8–18px | 5.6–12.6px |
| Wave speed | 0.015–0.04 | 0.015–0.04 |
| Wave frequency | 0.04–0.1 | 0.04–0.1 |

### Rendering

Three-stroke layered rendering for depth:

1. **Shadow stroke** — 3px wider than body, rgba(0,0,0,0.10), drawn first
2. **Main body stroke** — full color (#2E7D32) at computed thickness
3. **Highlight stroke** — 30% of body width, offset perpendicularly, rgba(255,255,255,0.12)

Head features: filled circle with highlight, two eyes, optional tongue flick.

### Debug Mode

`window.HISS_DEBUG_SNAKE = true` — shows red head marker and every 5th body segment index.

### Reduced Motion

When `prefers-reduced-motion: reduce` is active — static rendering, no animation.

### Privacy

No image assets, no network, no data transmission. Purely decorative and local-only.
