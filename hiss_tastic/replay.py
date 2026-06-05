"""Replay system — Phase 3.

Records tick-by-tick player inputs and supports playback and verification.
"""

import json
import os
import time

REPLAY_VERSION = "1.0.0"
REPLAY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'replays')


class ReplayRecorder:
    """Records player inputs for deterministic replay."""

    def __init__(self, seed):
        self.seed = seed
        self.inputs = []  # list of {"tick": N, "direction": "..."}
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
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return filepath

    def _build_replay_data(self):
        return {
            "version": REPLAY_VERSION,
            "game": "hiss-tastic",
            "seed": self.seed,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "score": self.final_score,
            "snake_length": self.snake_length,
            "inputs": self.inputs,
        }

    @staticmethod
    def _direction_to_name(direction):
        if direction == (-1, 0):
            return "LEFT"
        elif direction == (1, 0):
            return "RIGHT"
        elif direction == (0, -1):
            return "UP"
        elif direction == (0, 1):
            return "DOWN"
        return None


class ReplayPlayer:
    """Plays back a recorded replay."""

    def __init__(self, filepath):
        with open(filepath, 'r') as f:
            self.data = json.load(f)
        self.inputs = self.data.get("inputs", [])
        self.seed = self.data["seed"]
        self._input_index = 0
        self._tick = 0

    def get_input_at_tick(self, tick):
        """Get the direction input for the given tick, if any."""
        while self._input_index < len(self.inputs) and self.inputs[self._input_index]["tick"] == tick:
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

    @staticmethod
    def _direction_from_name(name):
        mapping = {
            "LEFT": (-1, 0),
            "RIGHT": (1, 0),
            "UP": (0, -1),
            "DOWN": (0, 1),
        }
        return mapping.get(name)


def verify_replay(filepath):
    """Verify a replay file can be loaded and has valid structure."""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return {"match": False, "error": str(e)}

    required = ["version", "game", "seed", "score", "inputs"]
    for field in required:
        if field not in data:
            return {"match": False, "error": f"Missing field: {field}"}

    return {
        "match": True,
        "expected_score": data["score"],
        "version": data["version"],
        "seed": data["seed"],
        "input_count": len(data["inputs"]),
    }
