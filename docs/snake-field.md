# Single Ambient Snake Prototype

## Overview

A single large decorative snake that roams the background with natural slithering motion. This is a foundation prototype — one high-quality snake before any multi-snake work.

## Implementation

**File:** `web/js/snakeField.js`

### Motion Model

Path-following (not segment-chasing):

1. The **head** moves forward with smooth organic steering (wander angle + edge avoidance + exclusion zone repulsion).
2. Each frame, the head position is recorded at the front of a **path history array** (max 75 entries).
3. The **body** is built by walking along the path at increasing distances:
   - Segment 0 = head (at path[0])
   - Segment N = position along path approximately `N × 6px` behind the head
   - Path positions are linearly interpolated for smooth sampling
4. The body is drawn as a **continuous thick curve** with tapered tail.

This produces natural slithering where the body follows the exact path the head traveled, with smooth curves and no bunching.

### Properties

| Property | Value |
|----------|-------|
| Head radius | 9–12px |
| Body thickness | 6–9px (tapered to tail) |
| Segment count | 55 (35 on mobile) |
| Body length | ~330px |
| Speed | 0.35–0.65 px/tick |
| Color | Green (#2E7D32) |
| Opacity | 0.85 |

### Movement Behavior

- Smooth random wander steering (wander target changes every 150–350 frames)
- Exclusion zone avoidance (steers away from game panel, controls, commentary)
- Edge avoidance (gentle push at 40px from viewport boundaries)
- Screen wrap teleport if fully offscreen

### Rendering

- Body: thick smooth `CanvasRenderingContext2D` stroke with `lineCap: round`, `lineJoin: round`
- Tapered from full body thickness at head to 8% at tail
- Head: filled circle with highlight, two eyes facing movement direction, optional tongue flick

### Debug Mode

Set `window.HISS_DEBUG_SNAKE = true` before page load to enable:
- Red head marker labeled "HEAD"
- Red dot markers every 5th body segment with index labels

### Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Snake renders as a static shape (no position updates)

### Privacy

- No image assets loaded from the network
- No data transmitted
- Purely decorative and local-only
