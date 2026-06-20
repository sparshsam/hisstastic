"""Asset loading utilities."""

import os
import pygame
from hisstastic.config import CONFIG


def find_asset_dir():
    """Determine the assets directory relative to this file."""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets')


asset_dir = find_asset_dir()


def load_asset(filename, size=None):
    """Load an image asset with a clear error message if missing."""
    path = os.path.join(asset_dir, filename)
    try:
        img = pygame.image.load(path)
        if size:
            img = pygame.transform.scale(img, (size, size))
        return img
    except pygame.error:
        print(f"Warning: Missing asset 'assets/{filename}'. Place it in the assets/ directory.")
        surf = pygame.Surface((size or 20, size or 20))
        surf.fill((255, 0, 255))  # Magenta placeholder
        return surf


def load_icon():
    """Load the window icon. Silent failure — not critical."""
    import pygame
    try:
        icon_path = os.path.join(asset_dir, 'icon.png')
        return pygame.image.load(icon_path)
    except pygame.error:
        return None


def load_all_assets():
    """Load all game images and return them as a dict."""
    asset_size = CONFIG['assets']['size']
    return {
        'snake': load_asset('snake.png', asset_size),
        'food': load_asset('rodent.png', asset_size),
        'obstacle': load_asset('danger.png', asset_size),
        'power_up': load_asset('power_up.png', asset_size),
        'icon': load_icon(),
    }
