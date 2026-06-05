# Live Snake-Fact Roast Commentary System

## Overview

The live commentary system provides contextual educational snake facts paired with playful roasts based on player gameplay behavior. It is entirely local — no AI, no API calls, no telemetry.

## Files

| File | Purpose |
|------|---------|
| `web/js/snakeFacts.js` | Static fact/roast dataset (25+ entries) + legacy insult fallbacks |
| `web/js/commentary.js` | Event-driven commentary engine with rate limiting and stat tracking |

## Architecture

```
Game Events ──→ Commentary Engine ──→ Commentary UI (fade-in box)
                      │
                      ├── Detects: wall collision, self collision, missed food,
                      │            rapid direction changes, survival milestones,
                      │            power-up events
                      │
                      └── Consumes: snakeFacts.js (local static JSON-like data)
```

## Data Schema

Each fact entry in `snakeFacts.js`:

```json
{
  "id": "pit_viper_heat",
  "fact": "Pit vipers can detect infrared heat from warm-blooded prey.",
  "tags": ["missed_food", "awareness"],
  "roasts": [
    "You still missed food two squares away.",
    "Your awareness settings appear to be ornamental."
  ],
  "severity": "medium"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `fact` | string | Educational snake fact |
| `tags` | string[] | Gameplay trigger categories |
| `roasts` | string[] | Playful roast variations (selected randomly per trigger) |
| `severity` | string | `low`, `medium`, or `high` |

## Gameplay Triggers

| Trigger | Tags | Description |
|---------|------|-------------|
| Early death | `early_death` | Snake died with score < 10 |
| Wall collision | `wall_collision` | Player hit a wall |
| Self collision | `self_collision` | Player ran into own tail |
| Obstacle collision | `obstacle_collision` | Player hit an obstacle |
| Missed food | `missed_food` | Snake passed within 2 blocks of food without eating |
| Rapid direction changes | `rapid_direction` | >10 direction changes detected |
| Long survival | `long_survival` | Score reached 75+ |
| Power-up collected | `power_up` | Immunity power-up acquired |
| Power-up missed | `power_up_missed` | Power-up was available but not collected |
| Idle/start delay | `idle` | Player hesitates at title screen |
| Replay imported | `replay` | Watching a past replay |

## UI

- A commentary box (`#commentary-box`) sits below the game container.
- Uses `aria-live="polite"` for screen reader support.
- Messages fade in (`0.6s transition`) and auto-fade after 5 seconds.
- The box is compact, non-blocking, and `pointer-events: none`.
- On the game-over screen, the roast is displayed as the primary message (replacing the static legacy insult).

## Determinism

- Commentary uses a seeded mulberry32 PRNG for fact/roast selection.
- The seed is generated at initialization but the sequence is deterministic per session.
- Gameplay stat tracking uses exact tick counts and position comparisons.

## Constraints

- **No AI/LLM calls:** All facts and roasts are static local data.
- **No API calls:** Commentary engine makes no network requests.
- **No telemetry:** Stats exist only in memory during the session.
- **No game state modification:** Commentary is read-only observation.
- **No score impact:** Commentary cannot affect scoring, collision, or replay data.
- **Rate-limited:** Minimum 4-second cooldown between comments. Deduplication prevents repeated facts.

## Legacy Fallback

The original game-over insult messages are preserved in `LEGACY_INSULTS` and used:
- If commentary is disabled.
- If no matching fact is found for the current game state.
- As a documented legacy mode.

## Game-Over Roast Selection

At game over, the system:
1. Collects tags from the player's game session (collision type, score, stat counters).
2. Filters the fact dataset by matching tags.
3. Selects a random fact/roast pair (seeded RNG).
4. Falls back to legacy insults if no match is found.
5. Displays the roast in the commentary box AND as the primary game-over message.

## Replay Compatibility

Commentary events are not recorded in replay data. Commentary during replay playback is read-only observation — it does not alter replay inputs, score, or verification. This is by design to keep replay files minimal and deterministic. Future work could optionally include triggered commentary IDs in replay metadata.

## Privacy

- No data is collected, transmitted, or persisted.
- All gameplay stat tracking is session-only (in-memory).
- Commentary engine makes zero network requests.
- No analytics or tracking of any kind.
