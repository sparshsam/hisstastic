# Mobile Controls

## Overview

Hiss-Tastic is playable on mobile devices through touch controls and a
directional pad overlay. No keyboard is required.

## Touch Controls

### Swipe (on canvas)

Swipe on the game canvas to change the snake's direction:

| Gesture | Action |
|---------|--------|
| Swipe left | Move left |
| Swipe right | Move right |
| Swipe up | Move up |
| Swipe down | Move down |
| Tap (title/game-over) | Start/restart game |

### Directional Pad

A 4-button directional pad (dpad) appears below the canvas on mobile/small
screens. Tap the arrow buttons to steer the snake.

The dpad is hidden on desktop (768px+ width and 600px+ height).

## Keyboard Controls

When a keyboard is available:

| Key | Action |
|-----|--------|
| Arrow keys | Steer snake |
| Space | Start / restart |
| P / ESC | Pause / resume |
| R | Restart (game over) |
| Q | Quit to title |
| M | Mute toggle |
| 1 / 2 / 3 | Select difficulty (title screen) |

## Accessibility

- Dpad buttons have `aria-label` attributes for screen readers.
- Controls use semantic HTML and are navigable via tab order.
- All interactive elements have visible active states.
- Mute state is visually indicated on screen.

## Responsive Layout

- Canvas scales to fit viewport width (max 600px logical).
- Dpad and controls reflow for landscape/portrait.
- Small screens (under 500px height) get compact dpad and controls.
