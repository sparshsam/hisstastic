"""Replay system for local deterministic recording and validation."""

import json
import os
import time

from hisstastic import __version__

REPLAY_VERSION = "1.0.0"
REPLAY_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "replays",
)
GAME_ID = "hisstastic"
SUPPORTED_REPLAY_VERSIONS = {REPLAY_VERSION}
VALID_DIRECTIONS = {"LEFT", "RIGHT", "UP", "DOWN"}


class ReplayValidationError(ValueError):
    """Raised when replay data does not match the local schema."""


class ReplayRecorder:
    """Records player inputs and optional ghost frames for deterministic replay."""

    def __init__(self, seed):
        self.seed = seed
        self.inputs = []
        self.frames = []
        self.final_score = 0
        self.snake_length = 1
        self._tick = 0
        self._last_direction = None

    def record_input(self, direction):
        """Record a direction change at the current tick."""
        if direction != self._last_direction:
            direction_name = self._direction_to_name(direction)
            if direction_name:
                self.inputs.append({"tick": self._tick, "direction": direction_name})
                self._last_direction = direction

    def record_frame(self, snake, score, alive=True):
        """Record a minimal local-only frame snapshot for ghost playback."""
        self.frames.append({
            "tick": self._tick,
            "head": [int(snake.head[0]), int(snake.head[1])],
            "body": [[int(segment[0]), int(segment[1])] for segment in snake.body],
            "score": int(score),
            "snake_length": int(snake.length),
            "alive": bool(alive),
        })

    def tick(self):
        """Advance one tick."""
        self._tick += 1

    def set_final_score(self, score, snake_length):
        """Set the final score and length after game over."""
        self.final_score = score
        self.snake_length = snake_length

    def save(self, filename=None):
        """Save replay to a JSON file."""
        data = self._build_replay_data()
        if not filename:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"replay_{self.seed}_{timestamp}.json"
        os.makedirs(REPLAY_DIR, exist_ok=True)
        filepath = os.path.join(REPLAY_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return filepath

    def _build_replay_data(self):
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return {
            "version": REPLAY_VERSION,
            "game": GAME_ID,
            "schema": {
                "name": "hisstastic-replay",
                "version": REPLAY_VERSION,
                "compatible_versions": sorted(SUPPORTED_REPLAY_VERSIONS),
            },
            "metadata": {
                "game_version": __version__,
                "created_at": timestamp,
                "deterministic": True,
                "local_only": True,
                "networked": False,
                "mode": "solo",
                "duration_ticks": self._tick,
            },
            "seed": self.seed,
            "timestamp": timestamp,
            "score": self.final_score,
            "snake_length": self.snake_length,
            "inputs": self.inputs,
            "frames": self.frames,
        }

    @staticmethod
    def _direction_to_name(direction):
        if direction == (-1, 0):
            return "LEFT"
        if direction == (1, 0):
            return "RIGHT"
        if direction == (0, -1):
            return "UP"
        if direction == (0, 1):
            return "DOWN"
        return None


class ReplayPlayer:
    """Plays back a recorded replay input stream."""

    def __init__(self, filepath):
        self.data = load_replay_file(filepath)
        self.inputs = self.data.get("inputs", [])
        self.frames = self.data.get("frames", [])
        self.seed = self.data["seed"]
        self._input_index = 0

    def get_input_at_tick(self, tick):
        """Get the direction input for the given tick, if any."""
        while (
            self._input_index < len(self.inputs)
            and self.inputs[self._input_index]["tick"] == tick
        ):
            direction_name = self.inputs[self._input_index]["direction"]
            self._input_index += 1
            return self._direction_from_name(direction_name)
        return None

    @property
    def expected_score(self):
        return self.data.get("score", 0)

    @property
    def expected_snake_length(self):
        return self.data.get("snake_length", 1)

    @property
    def metadata(self):
        return self.data.get("metadata", {})

    @property
    def duration_ticks(self):
        metadata = self.metadata
        if "duration_ticks" in metadata:
            return metadata["duration_ticks"]
        if self.frames:
            return max(frame["tick"] for frame in self.frames)
        if self.inputs:
            return max(item["tick"] for item in self.inputs)
        return 0

    @staticmethod
    def _direction_from_name(name):
        mapping = {
            "LEFT": (-1, 0),
            "RIGHT": (1, 0),
            "UP": (0, -1),
            "DOWN": (0, 1),
        }
        return mapping.get(name)


def load_replay_file(filepath):
    """Load and validate a replay file, returning normalized replay data."""
    try:
        with open(filepath, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
    except FileNotFoundError as exc:
        raise ReplayValidationError(f"Replay file not found: {filepath}") from exc
    except json.JSONDecodeError as exc:
        raise ReplayValidationError(f"Replay JSON is invalid: {exc}") from exc

    validate_replay_data(data)
    return data


def validate_replay_data(data):
    """Validate replay structure, compatibility, inputs, and ghost frames."""
    if not isinstance(data, dict):
        raise ReplayValidationError("Replay root must be an object")

    required = ["version", "game", "seed", "score", "inputs"]
    for field in required:
        if field not in data:
            raise ReplayValidationError(f"Missing field: {field}")

    if data["game"] != GAME_ID:
        raise ReplayValidationError(f"Unsupported game: {data['game']}")

    version = data["version"]
    if version not in SUPPORTED_REPLAY_VERSIONS:
        raise ReplayValidationError(f"Unsupported replay version: {version}")

    if not isinstance(data["seed"], int) or data["seed"] < 0:
        raise ReplayValidationError("seed must be a non-negative integer")

    if not isinstance(data["score"], int) or data["score"] < 0:
        raise ReplayValidationError("score must be a non-negative integer")

    snake_length = data.get("snake_length", 1)
    if not isinstance(snake_length, int) or snake_length < 1:
        raise ReplayValidationError("snake_length must be a positive integer")

    _validate_metadata(data.get("metadata", {}))
    _validate_inputs(data["inputs"])
    _validate_frames(data.get("frames", []))
    return True


def _validate_metadata(metadata):
    if not isinstance(metadata, dict):
        raise ReplayValidationError("metadata must be an object")
    if metadata.get("networked") is True:
        raise ReplayValidationError("networked replays are not supported")
    if metadata.get("local_only") is False:
        raise ReplayValidationError("replays must remain local-only")


def _validate_inputs(inputs):
    if not isinstance(inputs, list):
        raise ReplayValidationError("inputs must be a list")

    previous_tick = -1
    for index, item in enumerate(inputs):
        if not isinstance(item, dict):
            raise ReplayValidationError(f"inputs[{index}] must be an object")
        tick = item.get("tick")
        direction = item.get("direction")
        if not isinstance(tick, int) or tick < 0:
            raise ReplayValidationError(
                f"inputs[{index}].tick must be a non-negative integer"
            )
        if tick < previous_tick:
            raise ReplayValidationError("inputs must be sorted by tick")
        if direction not in VALID_DIRECTIONS:
            raise ReplayValidationError(
                f"inputs[{index}].direction is invalid: {direction}"
            )
        previous_tick = tick


def _validate_frames(frames):
    if not isinstance(frames, list):
        raise ReplayValidationError("frames must be a list")

    previous_tick = -1
    for index, frame in enumerate(frames):
        if not isinstance(frame, dict):
            raise ReplayValidationError(f"frames[{index}] must be an object")
        tick = frame.get("tick")
        if not isinstance(tick, int) or tick < 0:
            raise ReplayValidationError(
                f"frames[{index}].tick must be a non-negative integer"
            )
        if tick < previous_tick:
            raise ReplayValidationError("frames must be sorted by tick")
        _validate_point(frame.get("head"), f"frames[{index}].head")
        body = frame.get("body", [])
        if not isinstance(body, list) or not body:
            raise ReplayValidationError(
                f"frames[{index}].body must be a non-empty list"
            )
        for segment_index, segment in enumerate(body):
            _validate_point(segment, f"frames[{index}].body[{segment_index}]")
        previous_tick = tick


def _validate_point(point, label):
    if (
        not isinstance(point, list)
        or len(point) != 2
        or not all(isinstance(value, int) for value in point)
    ):
        raise ReplayValidationError(f"{label} must be [x, y] integer coordinates")


def verify_replay(filepath):
    """Verify a replay file can be loaded and has valid structure."""
    try:
        data = load_replay_file(filepath)
    except ReplayValidationError as exc:
        return {"match": False, "error": str(exc)}

    return {
        "match": True,
        "expected_score": data["score"],
        "version": data["version"],
        "seed": data["seed"],
        "input_count": len(data["inputs"]),
        "frame_count": len(data.get("frames", [])),
        "metadata": data.get("metadata", {}),
    }
