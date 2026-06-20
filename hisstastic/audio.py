"""Optional audio system using procedural sound generation.

All audio is optional — if pygame.mixer fails to initialize
(no audio device available), audio is silently disabled.
"""

import pygame
import struct
import math
from hisstastic.config import CONFIG

_initialized = False
_mixer_available = False
_sounds = {}
_music_playing = False


def init():
    """Initialize the audio system. Silently disables if unavailable."""
    global _initialized, _mixer_available

    if _initialized:
        return

    _initialized = True

    if not CONFIG['audio']['enabled']:
        return

    try:
        pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=512)
        _mixer_available = True
        _generate_sounds()
    except pygame.error:
        _mixer_available = False


def _generate_tone(frequency, duration, volume=0.5):
    """Generate a sine wave tone as a pygame Sound object."""
    sample_rate = 22050
    n_samples = int(sample_rate * duration)
    if n_samples == 0:
        return None

    max_amp = 32767 * volume
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        value = int(max_amp * math.sin(2 * math.pi * frequency * t))
        samples.append(value)

    # Convert to 16-bit mono bytearray
    buf = bytearray()
    for v in samples:
        buf.extend(struct.pack('<h', v))

    try:
        return pygame.mixer.Sound(buffer=bytes(buf))
    except (pygame.error, ValueError):
        return None


def _generate_sounds():
    """Generate all game sounds procedurally."""
    cfg = CONFIG['audio']
    vol = cfg['volume']

    _sounds['eat'] = _generate_tone(cfg['eat_frequency'], cfg['eat_duration'], vol)
    _sounds['powerup'] = _generate_tone(cfg['powerup_frequency'], cfg['powerup_duration'], vol)
    _sounds['gameover'] = _generate_tone(cfg['gameover_frequency'], cfg['gameover_duration'], vol)


def play_eat():
    """Play the food collection sound."""
    if not _mixer_available or CONFIG['audio']['muted']:
        return
    sound = _sounds.get('eat')
    if sound:
        sound.play()


def play_powerup():
    """Play the power-up collection sound."""
    if not _mixer_available or CONFIG['audio']['muted']:
        return
    sound = _sounds.get('powerup')
    if sound:
        sound.play()


def play_gameover():
    """Play the game-over sound."""
    if not _mixer_available or CONFIG['audio']['muted']:
        return
    sound = _sounds.get('gameover')
    if sound:
        sound.play()
