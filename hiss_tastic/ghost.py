"""Local ghost replay loading, synchronization, and visualization payloads."""

from hiss_tastic.replay import ReplayPlayer, ReplayValidationError, load_replay_file


class GhostReplay:
    """Read-only helper for local ghost replay data."""

    def __init__(self, filepath):
        self.filepath = filepath
        self.data = load_replay_file(filepath)
        self.player = ReplayPlayer(filepath)
        self.frames_by_tick = {
            frame["tick"]: frame for frame in self.data.get("frames", [])
        }
        self.inputs_by_tick = {
            item["tick"]: item["direction"] for item in self.data.get("inputs", [])
        }
        self.duration_ticks = self.player.duration_ticks

    @property
    def has_visual_frames(self):
        """Return True when replay contains recorded ghost frame snapshots."""
        return bool(self.frames_by_tick)

    @property
    def expected_score(self):
        """Return the source replay's final score for display only."""
        return self.player.expected_score

    def get_frame(self, tick):
        """Return the ghost frame for a tick, if frame snapshots exist."""
        return self.frames_by_tick.get(tick)

    def get_direction(self, tick):
        """Return the recorded direction name at a tick, if present."""
        return self.inputs_by_tick.get(tick)

    def visualization_payload(self, tick):
        """Return a renderer-safe ghost payload for the requested tick."""
        frame = self.get_frame(tick)
        if not frame:
            return None
        return {
            "tick": frame["tick"],
            "body": frame["body"],
            "head": frame["head"],
            "score": frame.get("score", 0),
            "snake_length": frame.get("snake_length", len(frame["body"])),
            "complete": tick >= self.duration_ticks,
        }

    def sanity_check(self):
        """Validate ghost replay constraints used by local racing."""
        metadata = self.data.get("metadata", {})
        if metadata.get("networked") is True:
            raise ReplayValidationError("ghost replays must not be networked")
        if metadata.get("local_only") is False:
            raise ReplayValidationError("ghost replays must remain local-only")
        return {
            "valid": True,
            "has_visual_frames": self.has_visual_frames,
            "duration_ticks": self.duration_ticks,
            "expected_score": self.expected_score,
        }


class GhostRaceSession:
    """Synchronize active play ticks with one local ghost replay."""

    def __init__(self, ghost_replay):
        self.ghost = ghost_replay
        self.tick = 0

    def advance(self):
        """Advance local ghost synchronization by one game tick."""
        self.tick += 1
        return self.current_payload()

    def current_payload(self):
        """Return the visualization payload for the current synchronized tick."""
        return self.ghost.visualization_payload(self.tick)

    def reset(self):
        """Reset ghost synchronization to the start of the run."""
        self.tick = 0
