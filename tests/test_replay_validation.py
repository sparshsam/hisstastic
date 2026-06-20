import json
import os
import tempfile
import unittest

from hisstastic.ghost import GhostReplay, GhostRaceSession
from hisstastic.replay import (
    ReplayValidationError,
    validate_replay_data,
    verify_replay,
)


def sample_replay(**overrides):
    data = {
        "version": "1.0.0",
        "game": "hisstastic",
        "metadata": {
            "deterministic": True,
            "local_only": True,
            "networked": False,
            "mode": "solo",
            "duration_ticks": 2,
        },
        "seed": 99,
        "timestamp": "2026-06-04T00:00:00Z",
        "score": 1,
        "snake_length": 2,
        "inputs": [
            {"tick": 0, "direction": "RIGHT"},
            {"tick": 1, "direction": "DOWN"},
        ],
        "frames": [
            {
                "tick": 0,
                "head": [300, 200],
                "body": [[300, 200]],
                "score": 0,
                "snake_length": 1,
                "alive": True,
            },
            {
                "tick": 1,
                "head": [320, 200],
                "body": [[300, 200], [320, 200]],
                "score": 1,
                "snake_length": 2,
                "alive": True,
            },
        ],
    }
    data.update(overrides)
    return data


class ReplayValidationTests(unittest.TestCase):
    def write_replay(self, data):
        handle = tempfile.NamedTemporaryFile(
            "w", suffix=".json", delete=False, encoding="utf-8"
        )
        with handle:
            json.dump(data, handle)
        self.addCleanup(lambda: os.path.exists(handle.name) and os.remove(handle.name))
        return handle.name

    def test_valid_replay_verifies(self):
        path = self.write_replay(sample_replay())
        result = verify_replay(path)
        self.assertTrue(result["match"])
        self.assertEqual(result["frame_count"], 2)

    def test_rejects_networked_replay(self):
        data = sample_replay(metadata={"networked": True, "local_only": True})
        with self.assertRaises(ReplayValidationError):
            validate_replay_data(data)

    def test_rejects_invalid_direction(self):
        data = sample_replay(inputs=[{"tick": 0, "direction": "JUMP"}])
        with self.assertRaises(ReplayValidationError):
            validate_replay_data(data)

    def test_ghost_race_session_returns_visual_payload(self):
        path = self.write_replay(sample_replay())
        ghost = GhostReplay(path)
        self.assertTrue(ghost.sanity_check()["valid"])
        session = GhostRaceSession(ghost)
        payload = session.current_payload()
        self.assertEqual(payload["head"], [300, 200])
        next_payload = session.advance()
        self.assertEqual(next_payload["head"], [320, 200])


if __name__ == "__main__":
    unittest.main()
