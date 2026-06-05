"""Centralized game configuration constants."""

CONFIG = {
    'colors': {
        'bright_white': (255, 255, 255),
        'neon_pink': (255, 20, 147),
        'black': (0, 0, 0),
        'faded_black': (0, 0, 0, 50),
    },
    'window': {
        'width': 600,
        'height': 400,
        'title': 'Hiss-Tastic',
        'scale': 1.0,
        'fullscreen': False,
    },
    'grid': {
        'block_size': 20,
    },
    'gameplay': {
        'initial_speed': 5,
        'speed_increment': 1,
        'immunity_duration': 3.8,
        'obstacle_count': 5,
        'power_up_respawn_chance': 50,
    },
    'fonts': {
        'style_name': None,
        'score_name': None,
        'bg_name': 'comicsansms',
        'size_normal': 35,
        'size_bg': 30,
    },
    'assets': {
        'size': 20,
    },
    'audio': {
        'enabled': True,
        'muted': False,
        'volume': 0.5,
        'eat_frequency': 440,
        'powerup_frequency': 660,
        'gameover_frequency': 220,
        'eat_duration': 0.1,
        'powerup_duration': 0.2,
        'gameover_duration': 0.5,
    },
    'difficulty': {
        'mode': 'normal',
        'presets': {
            'easy': {'initial_speed': 4, 'speed_increment': 1, 'obstacle_count': 3, 'immunity_duration': 5.0},
            'normal': {'initial_speed': 5, 'speed_increment': 1, 'obstacle_count': 5, 'immunity_duration': 3.8},
            'hard': {'initial_speed': 7, 'speed_increment': 2, 'obstacle_count': 8, 'immunity_duration': 2.5},
        },
    },
}


def get_difficulty_preset(mode=None):
    """Return the difficulty preset values for the given mode."""
    mode = mode or CONFIG['difficulty']['mode']
    return CONFIG['difficulty']['presets'].get(mode, CONFIG['difficulty']['presets']['normal'])
