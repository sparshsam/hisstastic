"""Replay CLI — command-line replay recording, playback, and verification.

Usage:
    python -m hisstastic.replay_cli play <replay_file>
    python -m hisstastic.replay_cli verify <replay_file>
    python -m hisstastic.replay_cli ghost-check <replay_file>
"""

import sys
import os

# Add project root to path for direct CLI usage
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def cmd_play(filepath):
    """Play back a recorded replay."""
    from hisstastic.replay import ReplayPlayer, verify_replay
    from hisstastic.game import Game
    import random as _random

    print(f"Loading replay: {filepath}")
    result = verify_replay(filepath)
    if not result.get('match'):
        print(f"Error: Invalid replay file — {result.get('error', 'unknown error')}")
        return 1

    player = ReplayPlayer(filepath)
    print(f"  Seed: {player.seed}")
    print(f"  Expected score: {player.expected_score}")
    print(f"  Inputs: {result['input_count']}")
    print(f"  Ghost frames: {result['frame_count']}")

    # We can't fully auto-playback in the current architecture (needs display),
    # but we can validate the replay structure and metadata
    print(f"\nReplay loaded successfully:")
    print(f"  Version: {result['version']}")
    print(f"  Score: {player.expected_score}")
    print(f"  Snake length: {player.expected_snake_length}")
    print(f"  Input count: {result['input_count']}")

    # Verify the seed matches
    print(f"\nReplay verification: [PASS] Structure valid")
    return 0


def cmd_verify(filepath):
    """Verify a replay file's structure and integrity."""
    from hisstastic.replay import verify_replay

    if not os.path.isfile(filepath):
        print(f"Error: File not found: {filepath}")
        return 1

    result = verify_replay(filepath)
    if result.get('match'):
        print(f"Replay verification: [PASS]")
        print(f"  Version: {result['version']}")
        print(f"  Seed: {result['seed']}")
        print(f"  Expected score: {result['expected_score']}")
        print(f"  Inputs recorded: {result['input_count']}")
        print(f"  Ghost frames recorded: {result['frame_count']}")
        return 0
    else:
        print(f"Replay verification: [FAIL] {result.get('error', 'unknown error')}")
        return 1


def cmd_record():
    """Record a new replay by playing the game."""
    from hisstastic.game import Game
    from hisstastic.replay import ReplayRecorder
    import random as _random

    seed = _random.randint(0, 2**31 - 1)
    recorder = ReplayRecorder(seed)

    game = Game()
    game.replay_recorder = recorder
    game.run()

    if recorder.inputs:
        filepath = recorder.save()
        print(f"\nReplay saved: {filepath}")
        print(f"  Score: {recorder.final_score}")
        print(f"  Inputs: {len(recorder.inputs)}")
    else:
        print("No replay recorded (game may have been exited immediately).")

    return 0


def cmd_ghost_check(filepath):
    """Run local-only ghost replay sanity validation."""
    from hisstastic.ghost import GhostReplay
    from hisstastic.replay import ReplayValidationError

    if not os.path.isfile(filepath):
        print(f"Error: File not found: {filepath}")
        return 1

    try:
        ghost = GhostReplay(filepath)
        result = ghost.sanity_check()
    except ReplayValidationError as exc:
        print(f"Ghost replay validation: [FAIL] {exc}")
        return 1

    print("Ghost replay validation: [PASS]")
    print(f"  Expected score: {result['expected_score']}")
    print(f"  Duration ticks: {result['duration_ticks']}")
    print(f"  Visual frames: {result['has_visual_frames']}")
    return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    command = sys.argv[1]

    if command in ('--help', '-h', 'help'):
        print(__doc__)
        return 0
    elif command == 'record':
        return cmd_record()
    elif command == 'play' and len(sys.argv) >= 3:
        return cmd_play(sys.argv[2])
    elif command == 'verify' and len(sys.argv) >= 3:
        return cmd_verify(sys.argv[2])
    elif command == 'ghost-check' and len(sys.argv) >= 3:
        return cmd_ghost_check(sys.argv[2])
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        return 1


if __name__ == '__main__':
    sys.exit(main())
