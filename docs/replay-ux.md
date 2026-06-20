# Replay UX

## Purpose

The replay system exists to make HissTastic runs reproducible, inspectable, and useful for future agent-playable, ghost-racing, and score-verification work.

## Current Commands

Record a replay:

```bash
python -m hisstastic.replay_cli record
```

Verify a replay:

```bash
python -m hisstastic.replay_cli verify replays/replay_12345_20260604.json
```

Load replay metadata:

```bash
python -m hisstastic.replay_cli play replays/replay_12345_20260604.json
```

Check ghost compatibility:

```bash
python -m hisstastic.replay_cli ghost-check replays/replay_12345_20260604.json
```

## Replay Schema

Replay files are local JSON files with:

- `version`: replay schema version.
- `game`: must be `hisstastic`.
- `schema`: schema name, version, and compatible versions.
- `metadata`: local-only and deterministic replay posture.
- `seed`: deterministic RNG seed.
- `score`: final score.
- `snake_length`: final snake length.
- `inputs`: sorted tick-indexed direction changes.
- `frames`: optional tick-indexed local snapshots for ghost visualization.

## Compatibility

The current supported replay schema is `1.0.0`. Unsupported versions fail validation instead of being silently accepted.

Older basic replays that include the required fields can still validate if they match the local schema constraints. New recordings include metadata and frame snapshots for ghost replay foundations.

## Error Handling

Replay validation reports missing fields, unsupported versions, invalid directions, unsorted ticks, invalid frame coordinates, and non-local replay metadata.

## Privacy

Replays are local JSON artifacts. They are not uploaded, transmitted, or used for telemetry.
