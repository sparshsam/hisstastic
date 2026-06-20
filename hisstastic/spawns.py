"""Safe spawn generation for game entities.

All random functions accept an optional seeded RNG for deterministic replay.
"""

import random as _random
from hisstastic.config import CONFIG


def _get_rng(rng):
    """Return the provided RNG or the global random module."""
    return rng if rng is not None else _random


def random_grid_position(width, height, block_size, rng=None):
    """Return a random position aligned to the grid."""
    rng = _get_rng(rng)
    return (
        round(rng.randrange(0, width - block_size) / block_size) * block_size,
        round(rng.randrange(0, height - block_size) / block_size) * block_size,
    )


def is_on_snake(x, y, snake_body):
    """Check if (x, y) overlaps with any segment of the snake body."""
    return any(seg[0] == x and seg[1] == y for seg in snake_body)


def is_on_obstacles_list(x, y, obstacles):
    """Check if (x, y) overlaps with any obstacle."""
    for obs in obstacles:
        if obs[0] == x and obs[1] == y:
            return True
    return False


def safe_food_position(width, height, block_size, snake_body, obstacles, max_attempts=100, rng=None):
    """Find a grid position that is not on the snake or obstacles."""
    rng = _get_rng(rng)
    for _ in range(max_attempts):
        fx, fy = random_grid_position(width, height, block_size, rng=rng)
        if not is_on_snake(fx, fy, snake_body) and not is_on_obstacles_list(fx, fy, obstacles):
            return (fx, fy)
    return random_grid_position(width, height, block_size, rng=rng)


def safe_power_up_position(width, height, block_size, obstacles, max_attempts=100, rng=None):
    """Find a grid position not on any obstacle."""
    rng = _get_rng(rng)
    for _ in range(max_attempts):
        px, py = random_grid_position(width, height, block_size, rng=rng)
        if not is_on_obstacles_list(px, py, obstacles):
            return (px, py)
    return random_grid_position(width, height, block_size, rng=rng)


def generate_obstacles(count, width, height, block_size, snake_head, max_attempts=100, rng=None):
    """Generate non-overlapping obstacles, avoiding snake head."""
    rng = _get_rng(rng)
    obstacles = []
    for _ in range(count):
        for _ in range(max_attempts):
            ox, oy = random_grid_position(width, height, block_size, rng=rng)
            if (ox, oy) not in obstacles and (ox, oy) != (snake_head[0], snake_head[1]):
                obstacles.append((ox, oy))
                break
    return obstacles
